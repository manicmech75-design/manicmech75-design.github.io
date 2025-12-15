console.log("✅ game.js loaded");

// Flip City - Full game script (Upgrades + Buildings + Tiles + Prestige + Achieves + Save + Tests)
document.addEventListener("DOMContentLoaded", () => {
  const SAVE_KEY = "flipcity_save_v5_tiles_upgrades";
  const DEV_MODE = true; // 🔧 set false when you want to hide dev panel

  // ---------- Upgrade definitions ----------
  const UPG = {
    // Core
    clickPower:  { name: "Click Power",   desc: "+1 coin per click", base: 10,  mult: 1.55, max: 200 },
    autoEarn:    { name: "Auto Earn",     desc: "+0.25 coins/sec",   base: 25,  mult: 1.60, max: 200 },
    critChance:  { name: "Crit Chance",   desc: "+2% crit chance (cap 60%)", base: 50,  mult: 1.70, max: 50  },
    critPower:   { name: "Crit Power",    desc: "+0.5 crit mult (cap 10x)",  base: 75,  mult: 1.75, max: 50  },
    coinMult:    { name: "Coin Mult",     desc: "+10% all earnings", base: 100, mult: 1.80, max: 100 },
    streakBonus: { name: "Lucky Streak",  desc: "Stronger streak bonus", base: 150, mult: 1.85, max: 100 },
    offlineBoost:{ name: "Offline Boost", desc: "+20% offline earnings", base: 200, mult: 1.90, max: 100 },

    // NEW (More Upgrades)
    megaClick:   { name: "Mega Click",    desc: "Chance to get a 10x click (cap 25%)", base: 500, mult: 1.90, max: 50 },
    goldenChance:{ name: "Golden Chance", desc: "Chance each second to get a bonus burst", base: 750, mult: 1.85, max: 50 },
    comboPower:  { name: "Click Combo",   desc: "Rapid clicks stack extra power", base: 400, mult: 1.80, max: 100 },
    efficiency:  { name: "Efficiency",    desc: "Buildings cost less (cap 40%)", base: 1000, mult: 1.90, max: 50 },
    overclock:   { name: "Overclock",     desc: "Auto earnings boosted (+10% each level)", base: 1200, mult: 1.95, max: 50 },
    timeWarp:    { name: "Time Warp",     desc: "Offline earnings boosted by playtime", base: 2000, mult: 2.00, max: 25 },
  };

  // ---------- Building definitions ----------
  const BLD = {
    kiosk:   { name: "Snack Kiosk",  desc: "Small steady income",    baseCost: 100,    costMult: 1.18, baseCps: 1 },
    shop:    { name: "Corner Shop",  desc: "Neighborhood revenue",   baseCost: 600,    costMult: 1.20, baseCps: 6 },
    factory: { name: "Factory",      desc: "Industrial output",      baseCost: 3500,   costMult: 1.22, baseCps: 35 },
    tower:   { name: "Office Tower", desc: "Big city business",      baseCost: 20000,  costMult: 1.24, baseCps: 200 },
    district:{ name: "Mega District",desc: "Massive passive income", baseCost: 120000, costMult: 1.26, baseCps: 1200 },
  };

  // Tile icons for buildings
  const BUILDING_ICONS = {
    kiosk: "🏪",
    shop: "🏬",
    factory: "🏭",
    tower: "🏢",
    district: "🏙️",
  };

  // ---------- Achievements ----------
  const ACH = [
    { id:"first_click", name:"First Tap", desc:"Earn your first coin", check:s=>s.totalEarned>=1, reward:{ coins:50 } },
    { id:"hundred", name:"Pocket Change", desc:"Earn 100 total coins", check:s=>s.totalEarned>=100, reward:{ coins:200 } },
    { id:"thousand", name:"Getting Serious", desc:"Earn 1,000 total coins", check:s=>s.totalEarned>=1000, reward:{ coins:1000 } },
    { id:"builder1", name:"Builder", desc:"Buy 1 building", check:s=>totalBuildings(s)>=1, reward:{ coins:500 } },
    { id:"builder10", name:"City Planner", desc:"Buy 10 buildings", check:s=>totalBuildings(s)>=10, reward:{ coins:2500 } },
    { id:"upgrade5", name:"Tech Up", desc:"Buy 5 total upgrade levels", check:s=>totalUpgradeLevels(s)>=5, reward:{ coins:500 } },
    { id:"upgrade25", name:"Optimized", desc:"Buy 25 total upgrade levels", check:s=>totalUpgradeLevels(s)>=25, reward:{ coins:5000 } },
    { id:"prestige1", name:"Fresh Start", desc:"Prestige once", check:s=>s.prestigeCount>=1, reward:{ permMult:0.02 } },
    { id:"million", name:"Millionaire", desc:"Earn 1,000,000 total coins", check:s=>s.totalEarned>=1e6, reward:{ permMult:0.05 } },
  ];

  // ---------- State ----------
  let state = {
    coins: 0,
    totalEarned: 0,
    lastSave: Date.now(),

    streak: 0,
    lastClickAt: 0,

    playTimeSeconds: 0,

    upgrades: Object.fromEntries(Object.keys(UPG).map(k => [k, 0])),
    buildings: Object.fromEntries(Object.keys(BLD).map(k => [k, 0])),

    prestigeCount: 0,
    prestigePoints: 0,
    prestigeSpent: 0,
    permMultBonus: 0,

    achieved: {}
  };

  // ---------- Utils ----------
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const fmt = (n) => {
    n = Number(n) || 0;
    if (n < 1000) return Math.floor(n).toString();
    const u = ["K","M","B","T","Qa","Qi"];
    let i = -1;
    while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; }
    return (n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : n.toFixed(0)) + u[i];
  };

  function totalBuildings(s){ return Object.values(s.buildings).reduce((a,b)=>a+(b||0),0); }
  function totalUpgradeLevels(s){ return Object.values(s.upgrades).reduce((a,b)=>a+(b||0),0); }

  // ---------- Costs ----------
  function upgCost(key) {
    const lvl = state.upgrades[key] || 0;
    const def = UPG[key];
    return Math.ceil(def.base * Math.pow(def.mult, lvl));
  }

  function efficiencyDiscount() {
    // -1% per level, cap 40%
    return 1 - clamp(0.01 * (state.upgrades.efficiency || 0), 0, 0.40);
  }

  function bldCost(key) {
    const owned = state.buildings[key] || 0;
    const def = BLD[key];
    return Math.ceil(def.baseCost * Math.pow(def.costMult, owned) * efficiencyDiscount());
  }

  // ---------- Multipliers / Earnings ----------
  function prestigeMult() {
    const spent = state.prestigeSpent || 0;
    const base = 1 + spent * 0.02; // +2% per spent point
    return base + (state.permMultBonus || 0);
  }

  function globalMult() {
    const coinMult = 1 + 0.10 * (state.upgrades.coinMult || 0);
    return coinMult * prestigeMult();
  }

  function clickPower() {
    return 1 + (state.upgrades.clickPower || 0) * 1;
  }

  function critChance() {
    return clamp((state.upgrades.critChance || 0) * 0.02, 0, 0.60);
  }

  function critMult() {
    return clamp(2 + (state.upgrades.critPower || 0) * 0.5, 2, 10);
  }

  function streakMult() {
    const per = 0.01 + (state.upgrades.streakBonus || 0) * 0.005;
    const m = 1 + clamp(state.streak, 0, 200) * per;
    return clamp(m, 1, 4.0);
  }

  function comboMult() {
    // ComboPower: rapid clicking stacks more.
    // Use streak as the "combo counter"
    const lvl = state.upgrades.comboPower || 0;
    if (lvl <= 0) return 1;
    const stack = clamp(state.streak, 0, 20); // limit stack
    return 1 + stack * 0.02 * lvl;
  }

  function autoCpsFromUpgrade() {
    return (state.upgrades.autoEarn || 0) * 0.25;
  }

  function bldCpsRaw() {
    let cps = 0;
    for (const k of Object.keys(BLD)) cps += (state.buildings[k] || 0) * BLD[k].baseCps;
    return cps;
  }

  function overclockMult() {
    // +10% auto earnings per level
    return 1 + 0.10 * (state.upgrades.overclock || 0);
  }

  function totalCps() {
    // Overclock boosts ALL passive income in this build (simple + strong)
    return (autoCpsFromUpgrade() + bldCpsRaw()) * globalMult() * overclockMult();
  }

  // ---------- Save/Load ----------
  function save() {
    state.lastSave = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }

  function load() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (!data || typeof data !== "object") return;

      // basics
      state.coins = Number(data.coins || 0);
      state.totalEarned = Number(data.totalEarned || 0);
      state.lastSave = Number(data.lastSave || Date.now());
      state.streak = Number(data.streak || 0);
      state.lastClickAt = Number(data.lastClickAt || 0);
      state.playTimeSeconds = Number(data.playTimeSeconds || 0);

      // prestige
      state.prestigeCount = Number(data.prestigeCount || 0);
      state.prestigePoints = Number(data.prestigePoints || 0);
      state.prestigeSpent = Number(data.prestigeSpent || 0);
      state.permMultBonus = Number(data.permMultBonus || 0);

      // achievements
      state.achieved = (data.achieved && typeof data.achieved === "object") ? data.achieved : {};

      // merge upgrades/buildings safely (supports new upgrades later)
      if (data.upgrades && typeof data.upgrades === "object") {
        for (const k of Object.keys(UPG)) state.upgrades[k] = Number(data.upgrades[k] || 0);
      }
      if (data.buildings && typeof data.buildings === "object") {
        for (const k of Object.keys(BLD)) state.buildings[k] = Number(data.buildings[k] || 0);
      }
    } catch {
      // ignore invalid save
    }
  }

  function applyOffline() {
    const now = Date.now();
    const secondsAway = Math.max(0, Math.floor((now - (state.lastSave || now)) / 1000));
    if (secondsAway <= 2) return { secondsAway: 0, gained: 0 };

    const cps = totalCps();
    const base = cps * secondsAway;

    const offMult = 1 + 0.20 * (state.upgrades.offlineBoost || 0);

    // Time Warp: based on playtime (cap 24h)
    const playHours = clamp((state.playTimeSeconds || 0) / 3600, 0, 24);
    const warpBonus = 1 + playHours * 0.02 * (state.upgrades.timeWarp || 0);

    const gained = base * offMult * warpBonus;

    if (gained > 0) {
      state.coins += gained;
      state.totalEarned += gained;
    }
    return { secondsAway, gained };
  }

  // ---------- Achievements ----------
  function grantReward(reward) {
    if (!reward) return;
    if (reward.coins) {
      state.coins += reward.coins;
      state.totalEarned += reward.coins;
    }
    if (reward.permMult) {
      state.permMultBonus = (state.permMultBonus || 0) + reward.permMult;
    }
  }

  function checkAchievements() {
    for (const a of ACH) {
      if (state.achieved[a.id]) continue;
      if (a.check(state)) {
        state.achieved[a.id] = true;
        grantReward(a.reward);
        toast(`🏆 Achievement: ${a.name}!`);
      }
    }
  }

  // ---------- Prestige ----------
  function prestigeAvailablePoints() {
    // based on lifetime earned (millions)
    const earnedMillions = state.totalEarned / 1_000_000;
    const totalPoints = Math.floor(Math.sqrt(Math.max(0, earnedMillions)) * 10);
    const already = (state.prestigePoints || 0) + (state.prestigeSpent || 0);
    return Math.max(0, totalPoints - already);
  }

  function doPrestige() {
    const gain = prestigeAvailablePoints();
    if (gain <= 0) return toast("No prestige points available yet.");
    if (!confirm(`Prestige resets coins/upgrades/buildings.\nGain ${gain} Prestige Points?\nProceed?`)) return;

    state.prestigeCount += 1;
    state.prestigePoints += gain;

    state.coins = 0;
    state.streak = 0;
    state.lastClickAt = 0;

    for (const k of Object.keys(state.upgrades)) state.upgrades[k] = 0;
    for (const k of Object.keys(state.buildings)) state.buildings[k] = 0;

    save();
    renderAll();
    checkAchievements();
    toast(`⭐ Prestiged! +${gain} points`);
  }

  function spendPrestige(points) {
    points = Math.max(0, Math.floor(points));
    if (points <= 0) return;
    if (state.prestigePoints < points) return toast("Not enough Prestige Points.");
    state.prestigePoints -= points;
    state.prestigeSpent += points;
    save();
    renderAll();
    toast(`Spent ${points} points. Permanent bonus increased.`);
  }

  // ---------- UI ----------
  const gameEl = document.getElementById("game");
  if (!gameEl) return;

  gameEl.innerHTML = `
    <div style="width:min(760px, 100%); margin:0 auto; text-align:center;">
      <div style="font-size:28px; font-weight:900;">🏙️ Flip City</div>
      <div style="margin-top:8px; opacity:.85;">Tap, upgrade, build, prestige — now with a city tile grid.</div>

      <div style="margin-top:18px;">
        <button id="earnBtn" style="min-width:min(520px,100%);">Earn 💰</button>
      </div>

      <div style="margin-top:10px; font-size:16px;">
        <div><b>Coins:</b> <span id="coinsText">0</span></div>
        <div style="margin-top:4px; opacity:.8;">
          <span id="cpsText">0</span>/sec ·
          <span id="clickText">1</span>/click ·
          Crit <span id="critText">0%</span> (<span id="critMultText">2x</span>) ·
          Mult <span id="multText">1.00x</span> ·
          Prestige <span id="prestigeMultText">1.00x</span>
        </div>
      </div>

      <hr style="width:100%; max-width:720px; border:none; border-top:1px solid rgba(255,255,255,.12); margin:18px auto;">

      <div style="display:grid; gap:14px; text-align:left;">
        <div>
          <div style="font-size:18px; font-weight:900; margin-bottom:8px; text-align:center;">Upgrades</div>
          <div id="upgradeList" style="display:grid; gap:10px;"></div>
        </div>

        <div>
          <div style="font-size:18px; font-weight:900; margin-bottom:8px; text-align:center;">Buildings</div>
          <div id="buildingList" style="display:grid; gap:10px;"></div>
        </div>

        <div>
          <div style="font-size:18px; font-weight:900; margin-bottom:8px; text-align:center;">City</div>
          <div id="cityGrid"
            style="
              display:grid;
              grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
              gap:8px;
              max-width:760px;
              margin:0 auto;
            "></div>
        </div>

        <div>
          <div style="font-size:18px; font-weight:900; margin-bottom:8px; text-align:center;">Achievements</div>
          <div id="achList" style="display:grid; gap:8px;"></div>
        </div>

        <div>
          <div style="font-size:18px; font-weight:900; margin-bottom:8px; text-align:center;">Prestige</div>
          <div id="prestigePanel" style="padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,.10); background:rgba(0,0,0,.10);"></div>
        </div>
      </div>

      <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:16px;">
        <button id="saveBtn" style="background: rgba(255,255,255,.12); color:#fff; box-shadow:none;">Save</button>
        <button id="resetBtn" style="background: rgba(255,255,255,.12); color:#fff; box-shadow:none;">Reset</button>
        <button id="exportBtn" style="background: rgba(255,255,255,.12); color:#fff; box-shadow:none;">Export</button>
        <button id="importBtn" style="background: rgba(255,255,255,.12); color:#fff; box-shadow:none;">Import</button>
      </div>

      ${DEV_MODE ? `
      <hr style="margin:18px auto; border-top:1px dashed rgba(255,255,255,.20); width:100%; max-width:720px;">
      <div style="text-align:center;">
        <div style="font-weight:900; margin-bottom:6px;">🧪 DEV PANEL</div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center;">
          <button id="dev1k">+1K</button>
          <button id="dev1m">+1M</button>
          <button id="devUpg">Max Upgrades</button>
          <button id="devBld">+10 Buildings</button>
          <button id="devPrest">+10 Prestige</button>
          <button id="devResetRun">Reset Run</button>
          <button id="devTest">Run Tests</button>
        </div>
      </div>
      ` : ""}

      <div id="toast" style="margin-top:12px; min-height:18px; opacity:.9; font-size:13px;"></div>
      <div style="margin-top:8px; opacity:.65; font-size:12px;">
        Total earned (lifetime): <span id="totalText">0</span>
      </div>
    </div>
  `;

  const $ = (id) => document.getElementById(id);

  function toast(msg) {
    const el = $("toast");
    el.textContent = msg;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (el.textContent = ""), 3500);
  }

  function rowBoxHTML(title, subtitle, rightHTML, buttonHTML) {
    return `
      <div style="display:grid; gap:6px; padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,.10); background: rgba(0,0,0,.10);">
        <div style="display:flex; justify-content:space-between; gap:10px; align-items:baseline;">
          <div style="font-weight:900;">${title}</div>
          <div style="opacity:.95;"><b>${rightHTML}</b></div>
        </div>
        <div style="opacity:.75; font-size:13px;">${subtitle}</div>
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
          ${buttonHTML}
          <div style="opacity:.75; font-size:12px;">Coins: <b>${fmt(state.coins)}</b></div>
        </div>
      </div>
    `;
  }

  function renderUpgrades() {
    const list = $("upgradeList");
    list.innerHTML = "";
    for (const key of Object.keys(UPG)) {
      const def = UPG[key];
      const lvl = state.upgrades[key] || 0;
      const locked = lvl >= def.max;
      const c = upgCost(key);

      const wrapper = document.createElement("div");
      wrapper.innerHTML = rowBoxHTML(
        `${def.name} <span style="opacity:.7; font-weight:700;">(Lv ${lvl}/${def.max})</span>`,
        def.desc,
        locked ? "MAX" : `${fmt(c)} coins`,
        `<button data-upg="${key}" ${locked ? "disabled" : ""} style="${locked ? "opacity:.5; cursor:not-allowed;" : ""}">Buy</button>`
      );
      list.appendChild(wrapper.firstElementChild);
    }

    list.querySelectorAll("button[data-upg]").forEach(btn => {
      btn.onclick = () => buyUpgrade(btn.getAttribute("data-upg"));
    });
  }

  function renderBuildings() {
    const list = $("buildingList");
    list.innerHTML = "";

    for (const key of Object.keys(BLD)) {
      const def = BLD[key];
      const owned = state.buildings[key] || 0;
      const c = bldCost(key);

      const each = def.baseCps * globalMult() * overclockMult();
      const total = owned * each;

      const wrapper = document.createElement("div");
      wrapper.innerHTML = rowBoxHTML(
        `${def.name} <span style="opacity:.7; font-weight:700;">(Owned ${owned})</span>`,
        `${def.desc} · +${fmt(each)}/sec each`,
        `${fmt(c)} coins`,
        `<button data-bld="${key}">Buy</button>`
      );
      list.appendChild(wrapper.firstElementChild);

      const extra = document.createElement("div");
      extra.style.cssText = "opacity:.7; font-size:12px; margin-top:-2px;";
      extra.textContent = `Current from this building: ${fmt(total)}/sec`;
      list.lastElementChild.appendChild(extra);
    }

    list.querySelectorAll("button[data-bld]").forEach(btn => {
      btn.onclick = () => buyBuilding(btn.getAttribute("data-bld"));
    });
  }

  function renderCity() {
    const grid = $("cityGrid");
    if (!grid) return;
    grid.innerHTML = "";

    for (const key of Object.keys(BLD)) {
      const count = state.buildings[key] || 0;
      const icon = BUILDING_ICONS[key] || "⬜";

      for (let i = 0; i < count; i++) {
        const tile = document.createElement("div");
        tile.textContent = icon;

        tile.title = `${BLD[key].name}\nOwned: ${count}\n+${fmt(BLD[key].baseCps * globalMult() * overclockMult())}/sec each`;

        tile.style.cssText = `
          height:48px;
          border-radius:10px;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:24px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          cursor: default;
        `;
        grid.appendChild(tile);
      }
    }

    if (!grid.children.length) {
      const empty = document.createElement("div");
      empty.textContent = "No buildings yet — buy one to place tiles!";
      empty.style.opacity = 0.6;
      empty.style.gridColumn = "1 / -1";
      empty.style.textAlign = "center";
      grid.appendChild(empty);
    }
  }

  function renderAchievements() {
    const list = $("achList");
    list.innerHTML = "";

    for (const a of ACH) {
      const done = !!state.achieved[a.id];
      const rewardText =
        a.reward?.coins ? `Reward: +${fmt(a.reward.coins)} coins` :
        a.reward?.permMult ? `Reward: +${Math.round(a.reward.permMult*100)}% permanent mult` :
        "Reward: —";

      const el = document.createElement("div");
      el.style.cssText = `
        padding:10px 12px;
        border-radius:12px;
        border:1px solid rgba(255,255,255,.10);
        background:${done ? "rgba(46,168,255,.12)" : "rgba(0,0,0,.10)"};
      `;
      el.innerHTML = `
        <div style="display:flex; justify-content:space-between; gap:10px;">
          <div style="font-weight:900;">${done ? "✅" : "⬜"} ${a.name}</div>
          <div style="opacity:.85; font-weight:800;">${done ? "DONE" : ""}</div>
        </div>
        <div style="opacity:.75; font-size:13px; margin-top:2px;">${a.desc}</div>
        <div style="opacity:.65; font-size:12px; margin-top:4px;">${rewardText}</div>
      `;
      list.appendChild(el);
    }
  }

  function renderPrestige() {
    const panel = $("prestigePanel");
    const avail = prestigeAvailablePoints();
    panel.innerHTML = `
      <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;">
        <div style="opacity:.85;">
          <div>Prestige count: <b>${state.prestigeCount}</b></div>
          <div>Prestige points: <b>${state.prestigePoints}</b> (available to gain: <b>${avail}</b>)</div>
          <div>Permanent multiplier: <b>${prestigeMult().toFixed(2)}x</b></div>
        </div>
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
          <button id="prestigeBtn">Prestige</button>
          <button id="spend1Btn" style="background: rgba(255,255,255,.12); color:#fff; box-shadow:none;">Spend 1</button>
          <button id="spend10Btn" style="background: rgba(255,255,255,.12); color:#fff; box-shadow:none;">Spend 10</button>
        </div>
      </div>
      <div style="margin-top:8px; opacity:.7; font-size:12px;">
        Spend points to permanently boost everything. Prestige resets coins, upgrades, and buildings.
      </div>
    `;

    $("prestigeBtn").onclick = doPrestige;
    $("spend1Btn").onclick = () => spendPrestige(1);
    $("spend10Btn").onclick = () => spendPrestige(10);
  }

  function updateHUD() {
    $("coinsText").textContent = fmt(state.coins);
    $("totalText").textContent = fmt(state.totalEarned);

    $("cpsText").textContent = fmt(totalCps());
    $("clickText").textContent = fmt(clickPower() * globalMult() * streakMult() * comboMult());
    $("critText").textContent = Math.round(critChance() * 100) + "%";
    $("critMultText").textContent = critMult().toFixed(1) + "x";
    $("multText").textContent = globalMult().toFixed(2) + "x";
    $("prestigeMultText").textContent = prestigeMult().toFixed(2) + "x";
  }

  function renderAll() {
    renderUpgrades();
    renderBuildings();
    renderCity();
    renderAchievements();
    renderPrestige();
    updateHUD();
  }

  // ---------- Buying ----------
  function buyUpgrade(key) {
    const def = UPG[key];
    const lvl = state.upgrades[key] || 0;
    if (lvl >= def.max) return;
    const c = upgCost(key);
    if (state.coins < c) return toast("Not enough coins.");

    state.coins -= c;
    state.upgrades[key] = lvl + 1;

    save();
    renderAll();
    toast(`Bought ${def.name} (Lv ${state.upgrades[key]}).`);
    checkAchievements();
  }

  function buyBuilding(key) {
    const def = BLD[key];
    const c = bldCost(key);
    if (state.coins < c) return toast("Not enough coins.");

    state.coins -= c;
    state.buildings[key] = (state.buildings[key] || 0) + 1;

    save();
    renderAll();
    toast(`🏗️ ${def.name} added to the city!`);
    checkAchievements();
  }

  // ---------- Clicking / Earning ----------
  function earnClick() {
    const now = Date.now();

    // streak (2s window)
    if (now - (state.lastClickAt || 0) <= 2000) state.streak += 1;
    else state.streak = 0;
    state.lastClickAt = now;

    let gained = clickPower() * globalMult() * streakMult() * comboMult();

    // Crit
    if (Math.random() < critChance()) {
      gained *= critMult();
      toast(`CRIT! +${fmt(gained)} coins`);
    }

    // Mega Click (1% per level, cap 25%)
    const megaChance = clamp(0.01 * (state.upgrades.megaClick || 0), 0, 0.25);
    if (Math.random() < megaChance) {
      gained *= 10;
      toast(`💥 MEGA CLICK! +${fmt(gained)} coins`);
    }

    state.coins += gained;
    state.totalEarned += gained;

    updateHUD();
    save();
    checkAchievements();
  }

  // ---------- Golden chance (burst) ----------
  function goldenBurstTick() {
    // 0.5% per level each second
    const lvl = state.upgrades.goldenChance || 0;
    if (lvl <= 0) return;
    const chance = clamp(0.005 * lvl, 0, 0.25);

    if (Math.random() < chance) {
      const bonus = totalCps() * 5; // 5 seconds worth of income
      state.coins += bonus;
      state.totalEarned += bonus;
      toast(`✨ Golden bonus +${fmt(bonus)}`);
      updateHUD();
      save();
      checkAchievements();
    }
  }

  // ---------- Export / Import / Reset ----------
  function exportSave() {
    save();
    return localStorage.getItem(SAVE_KEY) || "";
  }

  function importSave(raw) {
    const obj = JSON.parse(raw);
    localStorage.setItem(SAVE_KEY, JSON.stringify(obj));
    load();
    const off = applyOffline();
    save();
    renderAll();
    toast(off.gained > 0 ? `Imported. Offline +${fmt(off.gained)}.` : "Imported.");
    checkAchievements();
  }

  function hardResetAll() {
    if (!confirm("Reset ALL progress? This cannot be undone.")) return;
    localStorage.removeItem(SAVE_KEY);
    state = {
      coins: 0,
      totalEarned: 0,
      lastSave: Date.now(),
      streak: 0,
      lastClickAt: 0,
      playTimeSeconds: 0,
      upgrades: Object.fromEntries(Object.keys(UPG).map(k => [k, 0])),
      buildings: Object.fromEntries(Object.keys(BLD).map(k => [k, 0])),
      prestigeCount: 0,
      prestigePoints: 0,
      prestigeSpent: 0,
      permMultBonus: 0,
      achieved: {}
    };
    save();
    renderAll();
    toast("Reset complete.");
  }

  // ---------- DEV / TEST HELPERS ----------
  function devGiveCoins(amount = 1000) {
    state.coins += amount;
    state.totalEarned += amount;
    updateHUD();
    save();
  }

  function devMaxUpgrades() {
    for (const k of Object.keys(UPG)) state.upgrades[k] = UPG[k].max;
    renderAll();
    save();
  }

  function devAddBuildings(count = 10) {
    for (const k of Object.keys(BLD)) state.buildings[k] = (state.buildings[k] || 0) + count;
    renderAll();
    save();
  }

  function devGivePrestige(points = 10) {
    state.prestigePoints += points;
    renderAll();
    save();
  }

  function devResetRunOnly() {
    state.coins = 0;
    state.streak = 0;
    state.lastClickAt = 0;
    for (const k of Object.keys(state.upgrades)) state.upgrades[k] = 0;
    for (const k of Object.keys(state.buildings)) state.buildings[k] = 0;
    renderAll();
    save();
  }

  function devSelfTest() {
    console.group("Flip City Dev Test");
    try {
      devGiveCoins(1_000_000);
      console.log("✔ Coins add");

      devMaxUpgrades();
      console.log("✔ Upgrades max");

      devAddBuildings(10);
      console.log("✔ Buildings add");

      devGivePrestige(25);
      console.log("✔ Prestige add");

      renderAll();
      console.log("✔ Render All");

      checkAchievements();
      console.log("✔ Achievements check");

      console.log("🎉 ALL TESTS PASSED");
      toast("DEV TEST: ALL PASSED ✅");
    } catch (e) {
      console.error("❌ TEST FAILED", e);
      toast("DEV TEST: FAILED ❌ (check console)");
    }
    console.groupEnd();
  }

  // ---------- Wire buttons ----------
  $("earnBtn").onclick = earnClick;

  $("saveBtn").onclick = () => { save(); toast("Saved."); };
  $("resetBtn").onclick = hardResetAll;

  $("exportBtn").onclick = async () => {
    const raw = exportSave();
    try {
      await navigator.clipboard.writeText(raw);
      toast("Export copied to clipboard.");
    } catch {
      alert("Copy this save:\n\n" + raw);
    }
  };

  $("importBtn").onclick = () => {
    const raw = prompt("Paste your exported save JSON here:");
    if (!raw) return;
    try { importSave(raw); }
    catch { toast("Import failed (invalid JSON)."); }
  };

  // Dev panel hooks
  if (DEV_MODE) {
    $("dev1k").onclick = () => devGiveCoins(1_000);
    $("dev1m").onclick = () => devGiveCoins(1_000_000);
    $("devUpg").onclick = devMaxUpgrades;
    $("devBld").onclick = () => devAddBuildings(10);
    $("devPrest").onclick = () => devGivePrestige(10);
    $("devResetRun").onclick = devResetRunOnly;
    $("devTest").onclick = devSelfTest;
  }

  // ---------- Boot ----------
  load();
  const off = applyOffline();
  renderAll();
  save();
  checkAchievements();
  if (off.gained > 0) toast(`While away (${off.secondsAway}s): +${fmt(off.gained)} coins`);

  // Passive income + playtime tick (1 second)
  setInterval(() => {
    state.playTimeSeconds += 1;

    const cps = totalCps();
    if (cps > 0) {
      state.coins += cps;
      state.totalEarned += cps;
    }

    goldenBurstTick();
    updateHUD();
    save();
    checkAchievements();
  }, 1000);

  // backup save
  setInterval(save, 5000);
});
