/* Flip City - Step 1: Tile purchase + building placement (House)
   - Tap Empty Lot (25) to buy -> becomes a House
   - Deducts cash, increases Buildings count
   - Saves to localStorage
*/

(() => {
  const SAVE_KEY = "flipcity_save_v1";

  // --- Tunables (Step 1 only) ---
  const TILE_COUNT = 8;            // matches your 2-row layout in the screenshot
  const EMPTY_TILE_COST = 25;
  const HOUSE_NAME = "House";

  // --- DOM ---
  const $cash = document.getElementById("cash");
  const $perTap = document.getElementById("perTap");
  const $upgradeCost = document.getElementById("upgradeCost");
  const $tapBtn = document.getElementById("tapBtn");
  const $upgradeBtn = document.getElementById("upgradeBtn");
  const $passiveRate = document.getElementById("passiveRate");
  const $offlineEarned = document.getElementById("offlineEarned");
  const $buildingsCount = document.getElementById("buildingsCount");
  const $tiles = document.getElementById("tiles");
  const $status = document.getElementById("status");
  const $resetBtn = document.getElementById("resetBtn");

  // --- State ---
  const defaultState = () => ({
    cash: 0,
    perTap: 1,
    upgradeCost: 10,
    offlineEarned: 0,
    buildings: 0,
    // tiles: each is { type: "empty" | "house" }
    tiles: Array.from({ length: TILE_COUNT }, () => ({ type: "empty" })),
    // for future offline calc
    lastSeen: Date.now()
  });

  let state = load() || defaultState();

  // --- Save / Load ---
  function save() {
    state.lastSeen = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);

      // minimal validation / upgrade safety
      if (!parsed || typeof parsed !== "object") return null;
      if (!Array.isArray(parsed.tiles)) return null;

      // if tile count changed, normalize
      if (parsed.tiles.length !== TILE_COUNT) {
        const tiles = Array.from({ length: TILE_COUNT }, (_, i) => parsed.tiles[i] || { type: "empty" });
        parsed.tiles = tiles;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  // --- Helpers ---
  function fmt(n) {
    // keep it simple for now
    return Math.floor(n).toString();
  }

  function canAfford(cost) {
    return state.cash >= cost;
  }

  // --- Game actions ---
  function tapToEarn() {
    state.cash += state.perTap;
    save();
    render();
  }

  function buyUpgrade() {
    if (!canAfford(state.upgradeCost)) return;
    state.cash -= state.upgradeCost;
    state.perTap += 1;
    // simple scaling
    state.upgradeCost = Math.floor(state.upgradeCost * 1.6 + 5);
    save();
    render();
  }

  function buyTile(index) {
    const tile = state.tiles[index];
    if (!tile || tile.type !== "empty") return;

    if (!canAfford(EMPTY_TILE_COST)) return;

    state.cash -= EMPTY_TILE_COST;
    tile.type = "house";
    state.buildings += 1;

    save();
    render();
  }

  function resetSave() {
    localStorage.removeItem(SAVE_KEY);
    state = defaultState();
    save();
    render();
  }

  // --- Render ---
  function renderHeader() {
    $cash.textContent = fmt(state.cash);
    $perTap.textContent = fmt(state.perTap);
    $upgradeCost.textContent = fmt(state.upgradeCost);

    // Step 1: passive/offline not implemented yet, keep display stable
    $passiveRate.textContent = "0";
    $offlineEarned.textContent = fmt(state.offlineEarned || 0);
    $buildingsCount.textContent = fmt(state.buildings || 0);

    $upgradeBtn.disabled = !canAfford(state.upgradeCost);
  }

  function renderTiles() {
    $tiles.innerHTML = "";

    state.tiles.forEach((t, i) => {
      const btn = document.createElement("div");
      btn.className = "tile";

      if (t.type === "empty") {
        btn.classList.add("empty");

        // lock style if not enough cash
        if (!canAfford(EMPTY_TILE_COST)) btn.classList.add("locked");

        btn.innerHTML = `Empty<br>Lot<br><small>(${EMPTY_TILE_COST})</small>`;
        btn.addEventListener("click", () => buyTile(i));
      } else if (t.type === "house") {
        btn.classList.add("house");
        btn.innerHTML = `${HOUSE_NAME}<br><small>Owned</small>`;
        // later you can add upgrade/sell/merge actions here
      } else {
        // unknown type fallback
        btn.innerHTML = `Unknown`;
      }

      $tiles.appendChild(btn);
    });
  }

  function render() {
    renderHeader();
    renderTiles();
    $status.textContent = "Game loaded ✅";
  }

  // --- Wire up ---
  $tapBtn.addEventListener("click", tapToEarn);
  $upgradeBtn.addEventListener("click", buyUpgrade);
  $resetBtn.addEventListener("click", resetSave);

  // Save on page hide (mobile-friendly)
  window.addEventListener("pagehide", save);
  window.addEventListener("beforeunload", save);

  // Initial render
  save();
  render();
})();
