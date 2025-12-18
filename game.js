// Flip City — Builder Edition (Tiles Update)
// - Tile map placement (8x6)
// - NO offline income (pauses when hidden, no catch-up)
// - Activity Meter: Collect only when full
// - Manual Save/Load
// Support: cityflipsupport@gmail.com

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("game");
  if (!root) return console.error("❌ Missing <div id='game'></div> in index.html");

  const SUPPORT_EMAIL = "cityflipsupport@gmail.com";
  const SAVE_KEY = "flipcity_save_tiles_v1";

  const clamp01 = (n) => Math.max(0, Math.min(1, n));
  const fmtInt = (n) => Math.floor(n).toLocaleString();

  // -------------------- State --------------------
  const MAP_W = 8;
  const MAP_H = 6;

  const state = {
    money: 0,
    rps: 1,

    buildings: { homes: 0, shops: 0, offices: 0 },

    // tilemap stores: "" | "home" | "shop" | "office"
    map: Array.from({ length: MAP_W * MAP_H }, () => ""),

    // selected build mode
    selected: "home",

    meter: {
      progress: 0,
      fillSeconds: 12,
      reward: 15,
    },

    running: true,
    lastTick: performance.now(),
  };

  function idx(x, y) { return y * MAP_W + x; }

  function recalcRps() {
    state.rps =
      1 +
      state.buildings.homes * 2 +
      state.buildings.shops * 5 +
      state.buildings.offices * 10;
  }

  // -------------------- Pricing --------------------
  function costHomes()   { return 50  + state.buildings.homes   * 25; }
  function costShops()   { return 150 + state.buildings.shops   * 60; }
  function costOffices() { return 400 + state.buildings.offices * 140; }

  function costFor(type) {
    if (type === "home") return costHomes();
    if (type === "shop") return costShops();
    if (type === "office") return costOffices();
    return 0; // Should not happen with valid types
  }

  function canAfford(type) {
    return state.money >= costFor(type);
  }

  // -------------------- Save/Load --------------------
  function saveGame() {
    const data = {
      money: state.money,
      buildings: state.buildings,
      map: state.map,
      selected: state.selected,
      meterReward: state.meter.reward,
      meterFillSeconds: state.meter.fillSeconds,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    updateUI();
    console.log("Game Saved!");
  }

  function loadGame() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      console.log("No saved game found.");
      return false;
    }
    try {
      const data = JSON.parse(raw);
      state.money = Number(data.money || 0);
      state.buildings = {
        homes: Number(data.buildings?.homes || 0),
        shops: Number(data.buildings?.shops || 0),
        offices: Number(data.buildings?.offices || 0),
      };
      state.map = Array.isArray(data.map) && data.map.length === MAP_W * MAP_H
        ? data.map.map(v => (v === "home" || v === "shop" || v === "office") ? v : "")
        : Array.from({ length: MAP_W * MAP_H }, () => "");

      state.selected = (data.selected === "home" || data.selected === "shop" || data.selected === "office")
        ? data.selected
        : "home";

      state.meter.reward = Number(data.meterReward || 15);
      state.meter.fillSeconds = Number(data.meterFillSeconds || 12);

      // fairness: do NOT persist meter progress
      state.meter.progress = 0;

      recalcRps();
      updateUI();
      renderMap(); // Render the loaded map
      console.log("Game Loaded!");
      return true;
    } catch (e) {
      console.error("Failed to load game:", e);
      return false;
    }
  }

  function resetGame() {
    if (!confirm("Are you sure you want to reset your city? This cannot be undone!")) {
      return;
    }
    localStorage.removeItem(SAVE_KEY);
    Object.assign(state, { // Reset state to initial values
      money: 0,
      rps: 1,
      buildings: { homes: 0, shops: 0, offices: 0 },
      map: Array.from({ length: MAP_W * MAP_H }, () => ""),
      selected: "home",
      meter: { progress: 0, fillSeconds: 12, reward: 15 },
      running: true,
      lastTick: performance.now(),
    });
    recalcRps();
    updateUI();
    renderMap();
    console.log("Game Reset!");
  }

  // -------------------- Styles --------------------
  const style = document.createElement("style");
  style.textContent = `
    :root { color-scheme: dark; }

    body{
      min-height:100vh;
      background:
        radial-gradient(900px 450px at 50% 0%, rgba(255,160,110,.55), transparent 60%),
        linear-gradient(to top, #0b1220 0%, #1a2b4c 40%, #ff915e 100%);
      color:#eaf0ff;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      margin:0;
    }

    .wrap{ max-width:1100px; margin:0 auto; padding:20px; }
    .top{ display:flex; gap:12px; align-items:flex-end; justify-content:space-between; flex-wrap:wrap; }
    h1{ font-size:24px; margin:0; letter-spacing:.3px; }
    .sub{ opacity:.85; font-size:13px; margin-top:4px; }

    .grid{ display:grid; grid-template-columns: 1.05fr .95fr; gap:14px; margin-top:14px; }
    @media (max-width: 980px){ .grid{ grid-template-columns:1fr; } }

    .card{
      background: rgba(0,0,0,.35);
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 14px;
      padding: 14px;
      box-shadow: 0 12px 30px rgba(0,0,0,.35);
    }

    .row{ display:flex; gap:10px; align-items:center; justify-content:space-between; flex-wrap:wrap; }
    .stat{ font-size:16px; }
    .stat b{ font-variant-numeric: tabular-nums; }

    .pill{
      display:inline-flex;
      align-items:center;
      gap:8px;
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(255,255,255,.10);
      border: 1px solid rgba(255,255,255,.08);
      font-size: 13px;
      opacity:.95;
      user-select:none;
    }

    button{
      background: linear-gradient(180deg,#6aa8ff,#3b6cff);
      color:#fff;
      border:0;
      border-radius: 12px;
      padding: 10px 14px;
      font-size:14px;
      cursor:pointer;
      box-shadow: 0 10px 24px rgba(0,0,0,.35);
      user-select:none;
      transition: all 0.1s ease-in-out;
    }
    button:hover:not(:disabled) {
      filter: brightness(1.1);
      transform: translateY(-1px);
    }
    button:active:not(:disabled) {
      filter: brightness(0.9);
      transform: translateY(0);
      box-shadow: 0 5px 12px rgba(0,0,0,.35);
    }
    button:disabled{ opacity:.45; cursor:not-allowed; }

    .btnRow{ display:flex; gap:10px; flex-wrap:wrap; }

    /* Meter */
    .meterWrap{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
    .bar{
      width: 260px;
      max-width: 100%;
      height: 12px;
      background: rgba(255,255,255,.12);
      border-radius: 999px;
      overflow:hidden;
      border: 1px solid rgba(255,255,255,.08);
    }
    .bar > i{
      display:block;
      height:100%;
      width:0%;
      background: linear-gradient(90deg, rgba(255,220,170,.9), rgba(120,200,255,.9));
      transition: width 0.1s ease-out; /* Smooth meter fill */
    }
    .tiny{ opacity:.75; font-size:12px; }

    /* Tile map */
    .mapTop{ display:flex; gap:10px; align-items:center; justify-content:space-between; flex-wrap:wrap; }
    .seg{
      display:flex;
      gap:8px;
      flex-wrap:wrap;
      align-items:center;
    }
    .chip{
      border: 1px solid rgba(255,255,255,.12);
      background: rgba(255,255,255,.08);
      color:#eaf0ff;
      padding: 8px 10px;
      border-radius: 999px;
      font-size: 13px;
      cursor:pointer;
      user-select:none;
      transition: all 0.1s ease-in-out;
    }
    .chip:hover{
      background: rgba(255,255,255,.15);
      border-color: rgba(255,255,255,.18);
    }
    .chip.on{
      background: rgba(120,200,255,.18);
      border-color: rgba(120,200,255,.35);
      transform: scale(1.03);
    }

    .map{
      margin-top: 10px;
      display:grid;
      grid-template-columns: repeat(${MAP_W}, 1fr);
      gap: 8px;
    }
    .tile{
      aspect-ratio: 1 / 1;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,.10);
      background: rgba(0,0,0,.25);
      box-shadow: inset 0 0 0 1px rgba(0,0,0,.2);
      cursor:pointer;
      position:relative;
      overflow:hidden;
      transition: all 0.08s ease-in-out;
    }
    .tile:hover{
      border-color: rgba(255,255,255,.18);
      background: rgba(255,255,255,.06);
    }
    .tile .label{
      position:absolute;
      left:8px; right:8px; bottom:8px;
      font-size: 12px;
      opacity:.9;
      text-shadow: 0 2px 10px rgba(0,0,0,.55);
      display:flex;
      justify-content:space-between;
      gap:6px;
      align-items:center;
    }
    .tile .icon{ font-size: 18px; }

    .tile.home  { background: linear-gradient(180deg, rgba(130,200,255,.14), rgba(0,0,0,.25)); }
    .tile.shop  { background: linear-gradient(180deg, rgba(255,210,140,.14), rgba(0,0,0,.25)); }
    .tile.office{ background: linear-gradient(180deg, rgba(200,160,255,.14), rgba(0,0,0,.25)); }
    .tile.home:hover  { background: linear-gradient(180deg, rgba(130,200,255,.20), rgba(0,0,0,.25)); }
    .tile.shop:hover  { background: linear-gradient(180deg, rgba(255,210,140,.20), rgba(0,0,0,.25)); }
    .tile.office:hover{ background: linear-gradient(180deg, rgba(200,160,255,.20), rgba(0,0,0,.25)); }


    footer{
      opacity:.72;
      font-size:12px;
      text-align:center;
      margin: 18px 0 4px;
      line-height: 1.4;
    }
    a { color: #a9c7ff; }
  `;
  document.head.appendChild(style);

  // -------------------- UI --------------------
  root.innerHTML = `
    <div class="wrap">
      <div class="top">
        <div>
          <h1>🌆 Flip City</h1>
          <div class="sub">Tiles Edition · Money only earns while this tab is open & visible</div>
        </div>
        <div class="pill" id="statusPill">🟢 Earning</div>
      </div>

      <div class="grid">
        <div class="card">
          <div class="row">
            <div class="stat">💰 Money: <b>$<span id="money">0</span></b></div>
            <div class="stat">📈 Revenue: <b>$<span id="rps">1</span></b>/sec</div>
          </div>

          <div style="height:10px"></div>

          <div class="meterWrap">
            <div class="pill">⚡ Activity Meter</div>
            <div class="bar"><i id="meterFill"></i></div>
            <button id="collectRevenueBtn" disabled>Collect Revenue +$<span id="meterReward">15</span></button>
            <div class="tiny" id="meterHint">Filling…</div>
          </div>

          <div style="height:12px"></div>

          <div class="btnRow">
            <button id="saveBtn">Save City</button>
            <button id="loadBtn">Load City</button>
            <button id="resetBtn">Reset</button>
          </div>

          <div style="height:12px"></div>

          <div class="mapTop">
            <div class="pill">🧱 Build Mode</div>
            <div class="seg" id="buildSeg">
              <div class="chip" data-type="home">🏠 Homes (+2/sec) · $<span id="costHome">50</span></div>
              <div class="chip" data-type="shop">🏪 Shops (+5/sec) · $<span id="costShop">150</span></div>
              <div class="chip" data-type="office">🏢 Offices (+10/sec) · $<span id="costOffice">400</span></div>
            </div>
          </div>

          <div class="tiny" style="margin-top:8px;">
            Click an empty tile to place the selected building.
          </div>

          <div class="map" id="map"></div>
        </div>

        <div class="card">
          <div class="row">
            <div style="font-weight:700;">Your City</div>
            <div class="pill" id="counts">🏠 0 · 🏪 0 · 🏢 0</div>
          </div>

          <div style="height:10px"></div>

          <div class="tiny">
            No offline income. Switching tabs pauses earnings (no catch-up).
          </div>
          <div class="tiny" style="margin-top:8px;">
            Support: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
          </div>
        </div>
      </div>

      <footer>
        Made with ❤️ by <a href="https://github.com/manicmech75-design" target="_blank">manicmech75-design</a> for fun.
      </footer>
    </div>
  `;

  // -------------------- UI Element References --------------------
  // Get references to all the elements we'll be updating or listening to
  const ui = {
    money: document.getElementById("money"),
    rps: document.getElementById("rps"),
    meterFill: document.getElementById("meterFill"),
    meterReward: document.getElementById("meterReward"),
    collectRevenueBtn: document.getElementById("collectRevenueBtn"),
    meterHint: document.getElementById("meterHint"),
    statusPill: document.getElementById("statusPill"),
    saveBtn: document.getElementById("saveBtn"),
    loadBtn: document.getElementById("loadBtn"),
    resetBtn: document.getElementById("resetBtn"),
    buildSeg: document.getElementById("buildSeg"),
    costHome: document.getElementById("costHome"),
    costShop: document.getElementById("costShop"),
    costOffice: document.getElementById("costOffice"),
    map: document.getElementById("map"),
    counts: document.getElementById("counts"),
  };

  // -------------------- Update UI Functions --------------------
  function updateUI() {
    ui.money.textContent = fmtInt(state.money);
    ui.rps.textContent = fmtInt(state.rps);

    ui.costHome.textContent = fmtInt(costHomes());
    ui.costShop.textContent = fmtInt(costShops());
    ui.costOffice.textContent = fmtInt(costOffices());

    // Update build mode chip active state
    Array.from(ui.buildSeg.children).forEach(chip => {
      if (chip.dataset.type === state.selected) {
        chip.classList.add("on");
      } else {
        chip.classList.remove("on");
      }
      // Disable chips if not enough money
      const type = chip.dataset.type;
      const costSpan = chip.querySelector('span'); // Assuming cost is in a span
      if (costSpan) {
          if (!canAfford(type)) {
              costSpan.style.color = '#ff6b6b'; // Red color for unaffordable
          } else {
              costSpan.style.color = 'inherit'; // Default color
          }
      }
    });

    // Meter UI
    const meterProgressPercent = clamp01(state.meter.progress / state.meter.fillSeconds) * 100;
    ui.meterFill.style.width = `${meterProgressPercent}%`;
    ui.meterReward.textContent = fmtInt(state.meter.reward);

    const isMeterFull = meterProgressPercent >= 99.9; // Use 99.9 for floating point precision
    ui.collectRevenueBtn.disabled = !isMeterFull;
    ui.meterHint.textContent = isMeterFull ? "Ready to collect!" : `Filling... (${Math.floor(meterProgressPercent)}%)`;
    if (isMeterFull) {
        ui.meterHint.style.color = '#a0ff90'; // Green hint
    } else {
        ui.meterHint.style.color = 'inherit';
    }

    // Building counts
    ui.counts.textContent = `🏠 ${fmtInt(state.buildings.homes)} · 🏪 ${fmtInt(state.buildings.shops)} · 🏢 ${fmtInt(state.buildings.offices)}`;
  }

  function renderMap() {
    ui.map.innerHTML = ""; // Clear existing map
    for (let i = 0; i < MAP_W * MAP_H; i++) {
      const tile = document.createElement("div");
      tile.classList.add("tile");
      const buildingType = state.map[i];
      if (buildingType) {
        tile.classList.add(buildingType);
        let icon = "";
        let label = "";
        switch (buildingType) {
          case "home": icon = "🏠"; label = "Home"; break;
          case "shop": icon = "🏪"; label = "Shop"; break;
          case "office": icon = "🏢"; label = "Office"; break;
        }
        tile.innerHTML = `<div class="label"><span class="icon">${icon}</span><span>${label}</span></div>`;
      }
      tile.dataset.index = i;
      ui.map.appendChild(tile);
    }
  }

  // -------------------- Game Loop --------------------
  function gameLoop(currentTime) {
    const deltaTime = (currentTime - state.lastTick) / 1000; // Convert to seconds
    state.lastTick = currentTime;

    if (state.running && document.visibilityState === "visible") {
      // Update meter progress
      state.meter.progress += deltaTime;
      if (state.meter.progress >= state.meter.fillSeconds) {
        state.meter.progress = state.meter.fillSeconds; // Cap at max
      }

      // Check if meter is full and enable collect button
      ui.collectRevenueBtn.disabled = state.meter.progress < state.meter.fillSeconds;
      ui.statusPill.textContent = "🟢 Earning";
      ui.statusPill.style.backgroundColor = 'rgba(100,200,100,.1)';
      ui.statusPill.style.borderColor = 'rgba(100,200,100,.3)';

    } else {
      ui.statusPill.textContent = "⏸ Paused";
      ui.statusPill.style.backgroundColor = 'rgba(255,160,0,.1)';
      ui.statusPill.style.borderColor = 'rgba(255,160,0,.3)';
    }

    updateUI(); // Update all UI elements

    requestAnimationFrame(gameLoop);
  }

  // -------------------- Event Listeners --------------------
  ui.saveBtn.addEventListener("click", saveGame);
  ui.loadBtn.addEventListener("click", loadGame);
  ui.resetBtn.addEventListener("click", resetGame);

  // Build mode selection
  ui.buildSeg.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (chip && chip.dataset.type) {
      state.selected = chip.dataset.type;
      updateUI();
    }
  });

  // Tile placement
  ui.map.addEventListener("click", (e) => {
    const tile = e.target.closest(".tile");
    if (tile) {
      const index = parseInt(tile.dataset.index);
      const currentBuilding = state.map[index];

      // If tile is empty and player can afford, place building
      if (!currentBuilding && canAfford(state.selected)) {
        state.money -= costFor(state.selected);
        state.buildings[state.selected + "s"]++; // Increment count for plural building type
        state.map[index] = state.selected;
        recalcRps();
        updateUI();
        renderMap(); // Re-render map to show new building
      } else if (currentBuilding === state.selected && confirm(`Do you want to sell this ${currentBuilding}?`)) {
        // Optional: Sell existing building of the same type
        const sellPrice = Math.floor(costFor(currentBuilding) / 2); // Example: half price back
        state.money += sellPrice;
        state.buildings[currentBuilding + "s"]--;
        state.map[index] = ""; // Remove building
        recalcRps();
        updateUI();
        renderMap();
      }
    }
  });

  // Collect revenue button
  ui.collectRevenueBtn.addEventListener("click", () => {
    if (state.meter.progress >= state.meter.fillSeconds) {
      state.money += state.meter.reward;
      state.meter.progress = 0; // Reset meter
      state.meter.reward += 5; // Increase reward for next time
      state.meter.fillSeconds = Math.max(5, state.meter.fillSeconds - 1); // Decrease fill time, but not below 5
      updateUI();
    }
  });

  // Handle visibility change for pausing/unpausing
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      state.running = false;
    } else {
      state.running = true;
      state.lastTick = performance.now(); // Reset lastTick to prevent large delta on resume
    }
    updateUI(); // Update status pill immediately
  });

  // -------------------- Initial Setup --------------------
  // Attempt to load game on start, otherwise initialize
  if (!loadGame()) {
    recalcRps(); // Calculate initial RPS
    updateUI();  // Initial UI render
    renderMap(); // Initial map render
  }

  // Start the game loop
  requestAnimationFrame(gameLoop);
});
