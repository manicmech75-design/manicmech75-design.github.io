(() => {
  const SAVE_KEY_V2 = "flipcity_save_v2";
  const SAVE_KEY_V1 = "flipcity_save_v1"; // older version migration

  const BUILDINGS = [
    { key: "house",   name: "House",   baseIncome: 1,  buildCost: 25,  upgradeBase: 20,  upgradeScale: 15 },
    { key: "shop",    name: "Shop",    baseIncome: 2,  buildCost: 60,  upgradeBase: 35,  upgradeScale: 22 },
    { key: "factory", name: "Factory", baseIncome: 5,  buildCost: 140, upgradeBase: 70,  upgradeScale: 40 },
    { key: "office",  name: "Office",  baseIncome: 10, buildCost: 300, upgradeBase: 140, upgradeScale: 85 },
  ];

  const TILE_COUNT = 16;

  function tileUnlockRule(i) {
    if (i <= 3) return { totalEarned: 0, builtCount: 0 };
    if (i <= 7) return { totalEarned: 150 * (i - 3), builtCount: 0 };
    if (i <= 11) return { totalEarned: 0, builtCount: i - 5 };
    return { totalEarned: 2500 * (i - 11), builtCount: i - 7 };
  }

  const defaultState = () => ({
    cash: 0,
    perTap: 1,
    upgradeCost: 10,
    totalEarned: 0,
    lastTick: Date.now(),
    tiles: Array.from({ length: TILE_COUNT }, (_, i) => ({
      id: i,
      built: false,
      locked: i > 3,
      buildingKey: null,
      level: 0
    })),
  });

  let state = defaultState();

  // ----- DOM -----
  const cashEl = document.getElementById("cash");
  const perTapEl = document.getElementById("perTap");
  const upgradeCostEl = document.getElementById("upgradeCost");
  const statusEl = document.getElementById("status");
  const tapBtn = document.getElementById("tapBtn");
  const upgradeBtn = document.getElementById("upgradeBtn");
  const cityGrid = document.getElementById("cityGrid");

  // If any are missing, show a clear error instead of "nothing happens"
  const required = { cashEl, perTapEl, upgradeCostEl, statusEl, tapBtn, upgradeBtn, cityGrid };
  for (const [k, v] of Object.entries(required)) {
    if (!v) {
      alert(`Missing element in index.html: ${k}. Make sure you pasted the full index.html and game.js.`);
      return;
    }
  }

  // ----- SAVE / LOAD -----
  function saveGame() {
    try { localStorage.setItem(SAVE_KEY_V2, JSON.stringify(state)); }
    catch (e) { console.warn("Save failed:", e); }
  }

  function requestSave() {
    if (requestSave._pending) return;
    requestSave._pending = true;
    setTimeout(() => {
      requestSave._pending = false;
      saveGame();
    }, 300);
  }

  function loadGameV2() {
    try {
      const raw = localStorage.getItem(SAVE_KEY_V2);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      const d = defaultState();

      state = {
        ...d,
        ...parsed,
        tiles: Array.isArray(parsed.tiles) ? parsed.tiles : d.tiles
      };

      state.tiles = Array.from({ length: TILE_COUNT }, (_, i) => {
        const t = state.tiles[i] || {};
        return {
          id: i,
          built: !!t.built,
          locked: typeof t.locked === "boolean" ? t.locked : (i > 3),
          buildingKey: typeof t.buildingKey === "string" ? t.buildingKey : null,
          level: Number.isFinite(t.level) ? Math.max(0, Math.floor(t.level)) : 0
        };
      });

      if (!Number.isFinite(state.cash)) state.cash = 0;
      if (!Number.isFinite(state.perTap)) state.perTap = 1;
      if (!Number.isFinite(state.upgradeCost)) state.upgradeCost = 10;
      if (!Number.isFinite(state.totalEarned)) state.totalEarned = 0;
      if (!Number.isFinite(state.lastTick)) state.lastTick = Date.now();

      return true;
    } catch (e) {
      console.warn("Load v2 failed:", e);
      return false;
    }
  }

  function migrateFromV1IfExists() {
    try {
      const raw = localStorage.getItem(SAVE_KEY_V1);
      if (!raw) return false;

      const old = JSON.parse(raw);
      const d = defaultState();

      state.cash = Number.isFinite(old.cash) ? old.cash : d.cash;
      state.perTap = Number.isFinite(old.perTap) ? old.perTap : d.perTap;
      state.upgradeCost = Number.isFinite(old.upgradeCost) ? old.upgradeCost : d.upgradeCost;
      state.totalEarned = 0;
      state.lastTick = Date.now();

      const oldTiles = Array.isArray(old.tiles) ? old.tiles : [];
      for (let i = 0; i < Math.min(8, TILE_COUNT); i++) {
        const ot = oldTiles[i] || {};
        if (ot.built) {
          state.tiles[i].built = true;
          state.tiles[i].locked = false;
          state.tiles[i].level = Math.max(1, Number.isFinite(ot.level) ? Math.floor(ot.level) : 1);
          state.tiles[i].buildingKey = "shop";
        }
      }

      localStorage.removeItem(SAVE_KEY_V1);
      saveGame();
      return true;
    } catch (e) {
      console.warn("Migration failed:", e);
      return false;
    }
  }

  // ----- HELPERS -----
  const getBuildingByKey = (key) => BUILDINGS.find(b => b.key === key) || null;
  const getBuiltCount = () => state.tiles.reduce((n, t) => n + (t.built ? 1 : 0), 0);

  function incomePerSecondForTile(t) {
    if (!t.built || !t.buildingKey || t.level <= 0) return 0;
    const b = getBuildingByKey(t.buildingKey);
    if (!b) return 0;
    return b.baseIncome * t.level;
  }

  const getPassivePerSecond = () => state.tiles.reduce((sum, t) => sum + incomePerSecondForTile(t), 0);

  function updateUnlocks() {
    const builtCount = getBuiltCount();
    for (let i = 0; i < state.tiles.length; i++) {
      const rule = tileUnlockRule(i);
      const okEarned = state.totalEarned >= (rule.totalEarned || 0);
      const okBuilt = builtCount >= (rule.builtCount || 0);
      if (okEarned && okBuilt) state.tiles[i].locked = false;
    }
  }

  function earn(amount) {
    state.cash += amount;
    state.totalEarned += amount;
    updateUnlocks();
    updateUI();
    requestSave();
  }

  function spend(amount) {
    if (state.cash < amount) return false;
    state.cash -= amount;
    updateUI();
    requestSave();
    return true;
  }

  function formatUnlock(rule) {
    const parts = [];
    if (rule.totalEarned && rule.totalEarned > 0) parts.push(`Earn ${rule.totalEarned} total`);
    if (rule.builtCount && rule.builtCount > 0) parts.push(`Build ${rule.builtCount} tiles`);
    return parts.length ? parts.join(" • ") : "Unlocked";
  }

  function updateUI() {
    cashEl.textContent = Math.floor(state.cash);
    perTapEl.textContent = state.perTap;
    upgradeCostEl.textContent = state.upgradeCost;

    const canUpgrade = state.cash >= state.upgradeCost;
    upgradeBtn.disabled = !canUpgrade;
    upgradeBtn.style.opacity = canUpgrade ? 1 : 0.6;
  }

  function chooseBuildForTile(i) {
    if (i < 6) return BUILDINGS[0];     // House
    if (i < 10) return BUILDINGS[1];    // Shop
    if (i < 13) return BUILDINGS[2];    // Factory
    return BUILDINGS[3];               // Office
  }

  function renderTiles() {
    cityGrid.innerHTML = "";

    state.tiles.forEach(t => {
      const el = document.createElement("div");
      el.className = "tile";

      if (t.locked) {
        el.style.opacity = "0.55";
        const rule = tileUnlockRule(t.id);
        el.innerHTML = `
          <div class="tTitle">Locked</div>
          <div class="tSub">${formatUnlock(rule)}</div>
        `;
        el.onclick = () => statusEl.textContent = `Tile locked: ${formatUnlock(rule)}.`;
        cityGrid.appendChild(el);
        return;
      }

      if (!t.built) {
        const b = chooseBuildForTile(t.id);
        el.innerHTML = `
          <div class="tTitle">Empty Lot</div>
          <div class="tSub">Tap to build a ${b.name}</div>
          <div class="tSub">Cost ${b.buildCost} • +${b.baseIncome}/sec</div>
        `;
      } else {
        const b = getBuildingByKey(t.buildingKey) || BUILDINGS[1];
        const upgradeCost = b.upgradeBase + (t.level * b.upgradeScale);
        el.innerHTML = `
          <div class="tTitle">${b.name}</div>
          <div class="tSub">Level ${t.level} • +${incomePerSecondForTile(t)}/sec</div>
          <div class="tSub">Tap to upgrade (cost ${upgradeCost})</div>
        `;
      }

      el.onclick = () => onTileClick(t.id);
      cityGrid.appendChild(el);
    });
  }

  function onTileClick(id) {
    const t = state.tiles.find(x => x.id === id);
    if (!t) return;

    if (t.locked) {
      const rule = tileUnlockRule(id);
      statusEl.textContent = `Tile locked: ${formatUnlock(rule)}.`;
      return;
    }

    if (!t.built) {
      const b = chooseBuildForTile(id);
      if (!spend(b.buildCost)) {
        statusEl.textContent = `Need ${b.buildCost} cash to build a ${b.name}.`;
        return;
      }
      t.built = true;
      t.level = 1;
      t.buildingKey = b.key;
      updateUnlocks();
      renderTiles();
      requestSave();
      statusEl.textContent = `Built a ${b.name} ✅ (+${b.baseIncome}/sec).`;
      return;
    }

    const b = getBuildingByKey(t.buildingKey);
    if (!b) return;

    const cost = b.upgradeBase + (t.level * b.upgradeScale);
    if (!spend(cost)) {
      statusEl.textContent = `Need ${cost} cash to upgrade this ${b.name}.`;
      return;
    }

    t.level += 1;
    renderTiles();
    requestSave();
    statusEl.textContent = `Upgraded ${b.name} to Level ${t.level} ✅ (+${incomePerSecondForTile(t)}/sec).`;
  }

  // ----- BUTTONS -----
  tapBtn.onclick = () => {
    earn(state.perTap);
    statusEl.textContent = `Tapped +${state.perTap}. Total earned: ${Math.floor(state.totalEarned)}.`;
    renderTiles(); // unlocks may change
  };

  upgradeBtn.onclick = () => {
    if (!spend(state.upgradeCost)) return;
    state.perTap += 1;
    state.upgradeCost = Math.floor(state.upgradeCost * 1.35) + 5;
    updateUI();
    requestSave();
    statusEl.textContent = `Tap upgrade ✅ Per Tap is now ${state.perTap}.`;
  };

  // ----- PASSIVE + OFFLINE -----
  function applyOfflineProgress() {
    const now = Date.now();
    const prev = Number.isFinite(state.lastTick) ? state.lastTick : now;
    const elapsedSec = Math.max(0, Math.floor((now - prev) / 1000));
    const capped = Math.min(elapsedSec, 60 * 60 * 6); // 6 hours cap
    const pps = getPassivePerSecond();

    if (capped > 1 && pps > 0) {
      const gained = capped * pps;
      state.cash += gained;
      state.totalEarned += gained;
      updateUnlocks();
      statusEl.textContent = `Welcome back ✅ Earned +${Math.floor(gained)} while away.`;
    }
    state.lastTick = now;
    requestSave();
  }

  function startPassiveLoop() {
    setInterval(() => {
      const pps = getPassivePerSecond();
      if (pps > 0) {
        state.cash += pps;
        state.totalEarned += pps;
        updateUnlocks();
        updateUI();
        renderTiles();
        requestSave();
      }
      state.lastTick = Date.now();
    }, 1000);
  }

  // ----- INIT -----
  function init() {
    const loaded = loadGameV2();
    if (!loaded) {
      const migrated = migrateFromV1IfExists();
      if (!migrated) {
        state = defaultState();
        saveGame();
      }
    }

    updateUnlocks();
    updateUI();
    renderTiles();
    applyOfflineProgress();
    startPassiveLoop();

    window.addEventListener("beforeunload", saveGame);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") saveGame();
    });

    statusEl.innerHTML = `Game loaded <span class="ok">✅</span> Passive: ${getPassivePerSecond()}/sec • Tiles: ${getBuiltCount()}/${TILE_COUNT}.`;
  }

  init();
})();
