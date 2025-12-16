(() => {
  // Save keys (v2 is new; v1 is your previous version)
  const SAVE_KEY_V2 = "flipcity_save_v2";
  const SAVE_KEY_V1 = "flipcity_save_v1";

  // --- BUILDING TYPES ---
  // baseIncome = income per second at level 1
  // upgradeBase = starting upgrade cost component
  // upgradeScale = cost growth
  const BUILDINGS = [
    { key: "house",   name: "House",   baseIncome: 1,  buildCost: 25,  upgradeBase: 20, upgradeScale: 15 },
    { key: "shop",    name: "Shop",    baseIncome: 2,  buildCost: 60,  upgradeBase: 35, upgradeScale: 22 },
    { key: "factory", name: "Factory", baseIncome: 5,  buildCost: 140, upgradeBase: 70, upgradeScale: 40 },
    { key: "office",  name: "Office",  baseIncome: 10, buildCost: 300, upgradeBase: 140, upgradeScale: 85 },
  ];

  // 16 tiles, unlocked by either:
  // - totalEarned threshold OR
  // - builtCount threshold
  const TILE_COUNT = 16;

  function tileUnlockRule(index) {
    // Make early tiles easy, later tiles require progress
    // index 0-3 unlocked immediately
    if (index <= 3) return { totalEarned: 0, builtCount: 0 };

    // 4-7 unlock by totalEarned
    if (index <= 7) return { totalEarned: 150 * (index - 3), builtCount: 0 };

    // 8-11 unlock by builtCount
    if (index <= 11) return { totalEarned: 0, builtCount: index - 5 };

    // 12-15 unlock by both
    return { totalEarned: 2500 * (index - 11), builtCount: index - 7 };
  }

  // ----- DEFAULT STATE -----
  const defaultState = () => ({
    cash: 0,
    perTap: 1,
    upgradeCost: 10,

    // Progress trackers for unlocks
    totalEarned: 0, // lifetime earned (helps unlock)
    lastTick: Date.now(),

    tiles: Array.from({ length: TILE_COUNT }, (_, i) => ({
      id: i,
      built: false,
      locked: i > 3,        // first 4 are open
      buildingKey: null,    // house/shop/factory/office
      level: 0              // 0 = empty
    }))
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

  // ----- SAVE / LOAD -----
  function saveGame() {
    try {
      localStorage.setItem(SAVE_KEY_V2, JSON.stringify(state));
    } catch (e) {
      console.warn("Save failed:", e);
    }
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

      // Normalize tiles
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

  // Migration from your previous v1 save (8 tiles, simple names)
  function migrateFromV1IfExists() {
    try {
      const raw = localStorage.getItem(SAVE_KEY_V1);
      if (!raw) return false;

      const old = JSON.parse(raw);
      const d = defaultState();

      // Basic migration
      state.cash = Number.isFinite(old.cash) ? old.cash : d.cash;
      state.perTap = Number.isFinite(old.perTap) ? old.perTap : d.perTap;
      state.upgradeCost = Number.isFinite(old.upgradeCost) ? old.upgradeCost : d.upgradeCost;
      state.totalEarned = 0; // we don’t know lifetime from v1, start tracking now
      state.lastTick = Date.now();

      // Convert old tiles into new format (first 8 tiles)
      const oldTiles = Array.isArray(old.tiles) ? old.tiles : [];
      for (let i = 0; i < Math.min(8, TILE_COUNT); i++) {
        const ot = oldTiles[i] || {};
       
