(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  // UI
  const cashEl = $("cash");
  const perTapEl = $("perTap");
  const perSecEl = $("perSec");
  const tilesEl = $("tiles");
  const logEl = $("log");

  const installBtn = $("installBtn");
  const exportBtn = $("exportBtn");
  const importBtn = $("importBtn");
  const resetBtn = $("resetBtn");

  const tapBoostPriceEl = $("tapBoostPrice");
  const passivePriceEl = $("passivePrice");
  const tileUpPriceEl = $("tileUpPrice");

  const buyTapBoostBtn = $("buyTapBoost");
  const buyPassiveBtn = $("buyPassive");
  const buyTileUpBtn = $("buyTileUp");

  // State
  const SAVE_KEY = "cityflip_save_v1";

  const defaultState = () => ({
    cash: 0,
    perTap: 1,
    perSec: 0,
    tapBoostLevel: 0,
    passiveLevel: 0,
    tileLevel: 0,
    lastTick: Date.now(),
  });

  let state = load() ?? defaultState();

  // Tiles setup
  const TILE_NAMES = [
    "Downtown", "Suburbs", "Industrial",
    "Beach", "Airport", "Old Town",
    "Tech Park", "Harbor", "Hills"
  ];

  function tileGain() {
    // base tile gain scales with tileLevel (starts at 1)
    return 1 + state.tileLevel;
  }

  function formatMoney(n) {
    // simple formatting
    const sign = n < 0 ? "-" : "";
    n = Math.abs(n);

    if (n < 1000) return `${sign}$${Math.floor(n)}`;
    if (n < 1e6) return `${sign}$${(n / 1e3).toFixed(1)}K`;
    if (n < 1e9) return `${sign}$${(n / 1e6).toFixed(1)}M`;
    return `${sign}$${(n / 1e9).toFixed(1)}B`;
  }

  function log(msg) {
    const time = new Date().toLocaleTimeString();
    const line = `[${time}] ${msg}`;
    const div = document.createElement("div");
    div.textContent = line;
    logEl.prepend(div);
    // cap
    while (logEl.children.length > 30) logEl.removeChild(logEl.lastChild);
  }

  function renderTiles() {
    tilesEl.innerHTML = "";
    const gain = tileGain();

    for (let i = 0; i < 9; i++) {
      const tile = document.createElement("div");
      tile.className = "tile";

      const name = document.createElement("div");
      name.className = "name";
      name.textContent = TILE_NAMES[i];

      const small = document.createElement("div");
      small.className = "small";
      small.textContent = `Level bonus: +${state.tileLevel}`;

      const gainEl = document.createElement("div");
      gainEl.className = "gain";
      gainEl.textContent = `Tap: +${formatMoney(state.perTap + gain)}`;

      tile.appendChild(name);
      tile.appendChild(small);
      tile.appendChild(gainEl);

      tile.addEventListener("click", () => {
        const earned = state.perTap + gain;
        state.cash += earned;
        updateUI();
        maybeSaveSoon();
      });

      tilesEl.appendChild(tile);
    }
  }

  function updateUI() {
    cashEl.textContent = formatMoney(state.cash);
    perTapEl.textContent = formatMoney(state.perTap);
    perSecEl.textContent = `${formatMoney(state.perSec)}/s`;

    tapBoostPriceEl.textContent = formatMoney(priceTapBoost());
    passivePriceEl.textContent = formatMoney(pricePassive());
    tileUpPriceEl.textContent = formatMoney(priceTileUp());

    // enable/disable buttons based on affordability
    buyTapBoostBtn.disabled = state.cash < priceTapBoost();
    buyPassiveBtn.disabled = state.cash < pricePassive();
    buyTileUpBtn.disabled = state.cash < priceTileUp();
  }

  // Prices
  function priceTapBoost() {
    // 25, 45, 80, ...
    return Math.floor(25 * Math.pow(1.8, state.tapBoostLevel));
  }
  function pricePassive() {
    return Math.floor(50 * Math.pow(2.0, state.passiveLevel));
  }
  function priceTileUp() {
    return Math.floor(75 * Math.pow(1.9, state.tileLevel));
  }

  // Upgrade handlers
  buyTapBoostBtn.addEventListener("click", () => {
    const cost = priceTapBoost();
    if (state.cash < cost) return;

    state.cash -= cost;
    state.tapBoostLevel += 1;
    state.perTap += 1 + Math.floor(state.tapBoostLevel / 2);

    log(`Bought Tap Boost (Lv ${state.tapBoostLevel}). Per Tap now ${formatMoney(state.perTap)}.`);
    renderTiles();
    updateUI();
    save();
  });

  buyPassiveBtn.addEventListener("click", () => {
    const cost = pricePassive();
    if (state.cash < cost) return;

    state.cash -= cost;
    state.passiveLevel += 1;
    state.perSec += 1 + Math.floor(state.passiveLevel / 3);

    log(`Bought Passive Income (Lv ${state.passiveLevel}). Per Second now ${formatMoney(state.perSec)}/s.`);
    updateUI();
    save();
  });

  buyTileUpBtn.addEventListener("click", () => {
    const cost = priceTileUp();
    if (state.cash < cost) return;

    state.cash -= cost;
    state.tileLevel += 1;

    log(`Upgraded Tiles (Lv ${state.tileLevel}). Tile bonus increased.`);
    renderTiles();
    updateUI();
    save();
  });

  // Passive loop + catch-up
  function tick() {
    const now = Date.now();
    const dt = (now - state.lastTick) / 1000;
    state.lastTick = now;

    if (dt > 0 && state.perSec > 0) {
      state.cash += state.perSec * dt;
      updateUI();
      maybeSaveSoon();
    }
  }

  // Save/load
  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || typeof obj !== "object") return null;
      return obj;
    } catch (e) {
      return null;
    }
  }

  // Autosave (passive save)
  let saveTimer = null;
  function maybeSaveSoon() {
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
      saveTimer = null;
      save();
    }, 1200);
  }

  // Export/Import
  exportBtn.addEventListener("click", async () => {
    const data = JSON.stringify(state);
    try {
      await navigator.clipboard.writeText(data);
      log("Export copied to clipboard.");
    } catch (e) {
      prompt("Copy your save data:", data);
    }
  });

  importBtn.addEventListener("click", () => {
    const data = prompt("Paste save data to import:");
    if (!data) return;
    try {
      const obj = JSON.parse(data);
      if (!obj || typeof obj !== "object") throw new Error("bad");
      state = { ...defaultState(), ...obj, lastTick: Date.now() };
      save();
      renderTiles();
      updateUI();
      log("Imported save successfully.");
    } catch (e) {
      log("Import failed (invalid data).");
      alert("Import failed. Data was not valid.");
    }
  });

  resetBtn.addEventListener("click", () => {
    if (!confirm("Reset all progress?")) return;
    state = defaultState();
    save();
    renderTiles();
    updateUI();
    log("Progress reset.");
  });

  // Save on background/close
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") save();
  });
  window.addEventListener("beforeunload", () => save());

  // Install prompt (PWA)
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = "inline-block";
  });
  installBtn?.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } catch (e) {}
    deferredPrompt = null;
    installBtn.style.display = "none";
  });

  // Init
  (function init() {
    // catch-up for offline time (limit to 8 hours so it doesn't explode)
    const now = Date.now();
    const last = state.lastTick || now;
    const offlineSec = Math.min(8 * 3600, Math.max(0, (now - last) / 1000));
    if (offlineSec > 0 && state.perSec > 0) {
      const earned = state.perSec * offlineSec;
      state.cash += earned;
      log(`Welcome back! You earned ${formatMoney(earned)} while away.`);
    }
    state.lastTick = now;

    renderTiles();
    updateUI();
    log("Game loaded. Tap tiles to earn.");

    setInterval(tick, 250);
    setInterval(save, 6000);
  })();
})();
