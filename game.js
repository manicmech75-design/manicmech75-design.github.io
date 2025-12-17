/* City Flip - game.js (full clean, skyline UI compatible) */

const $ = (id) => document.getElementById(id);

const els = {
  tiles: $("tiles"),
  cash: $("cash"),
  perTap: $("perTap"),
  perSec: $("perSec"),
  log: $("log"),

  tapBoostPrice: $("tapBoostPrice"),
  passivePrice: $("passivePrice"),
  tileUpPrice: $("tileUpPrice"),

  buyTapBoost: $("buyTapBoost"),
  buyPassive: $("buyPassive"),
  buyTileUp: $("buyTileUp"),

  exportBtn: $("exportBtn"),
  importBtn: $("importBtn"),
  resetBtn: $("resetBtn"),

  installBtn: $("installBtn"),

  offlineModal: $("offlineModal"),
  offlineText: $("offlineText"),
  offlineOk: $("offlineOk"),

  toast: $("toast"),
};

const SAVE_KEY = "cityflip_save_v1";

const state = {
  cash: 0,
  perTapBase: 1,
  passivePerSec: 0,

  tapBoostLevel: 0,   // boosts per tap base
  passiveLevel: 0,    // boosts per second
  cityDevLevel: 0,    // boosts tile bonus multiplier

  tiles: [],          // each: { level }
  lastSeen: Date.now(),
};

const TILE_EMOJIS = ["🏙️","🏢","🏠","🏬","🏟️","🏗️","🌉","🚇","🌆"];

function fmtMoney(n) {
  const v = Math.floor(Number(n) || 0);
  return "$" + v.toLocaleString();
}

function log(msg) {
  if (!els.log) return;
  const line = document.createElement("div");
  line.textContent = msg;
  els.log.prepend(line);
}

function showToast(text = "Saved") {
  if (!els.toast) return;
  els.toast.textContent = text;
  els.toast.style.display = "block";
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => (els.toast.style.display = "none"), 900);
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function tileTapValue(tileLevel) {
  const devMult = 1 + state.cityDevLevel * 0.10;
  const tileBonus = Math.max(0, tileLevel) * 0.25; // +$0.25 per tile level
  return (state.perTapBase + tileBonus) * devMult;
}

function totalPerTapPreview() {
  const len = state.tiles.length || 1;
  const avgLvl = state.tiles.reduce((a, t) => a + (t?.level || 0), 0) / len;
  return tileTapValue(avgLvl);
}

function getTapBoostCost() {
  return Math.floor(25 * Math.pow(1.35, state.tapBoostLevel));
}
function getPassiveCost() {
  return Math.floor(50 * Math.pow(1.45, state.passiveLevel));
}
function getCityDevCost() {
  return Math.floor(75 * Math.pow(1.5, state.cityDevLevel));
}

function canAfford(cost) {
  return state.cash >= cost;
}
function spend(cost) {
  state.cash = Math.max(0, state.cash - cost);
}

function applyUpgrades() {
  // +$1 per tap boost level
  state.perTapBase = 1 + state.tapBoostLevel * 1;

  // +$1/s per passive level
  state.passivePerSec = state.passiveLevel * 1;
}

function createTilesIfMissing() {
  if (!Array.isArray(state.tiles) || state.tiles.length !== 9) {
    state.tiles = Array.from({ length: 9 }, () => ({ level: 0 }));
  }
  // sanitize tile objects
  state.tiles = state.tiles.map((t) => ({
    level: clamp(Number(t?.level) || 0, 0, 999999),
  }));
}

function render() {
  if (!els.cash || !els.perTap || !els.perSec) return;

  els.cash.textContent = fmtMoney(state.cash);
  els.perTap.textContent = fmtMoney(totalPerTapPreview());
  els.perSec.textContent = fmtMoney(state.passivePerSec) + "/s";

  if (els.tapBoostPrice) els.tapBoostPrice.textContent = fmtMoney(getTapBoostCost());
  if (els.passivePrice) els.passivePrice.textContent = fmtMoney(getPassiveCost());
  if (els.tileUpPrice) els.tileUpPrice.textContent = fmtMoney(getCityDevCost());
}

function renderTiles() {
  if (!els.tiles) return;

  els.tiles.innerHTML = "";

  state.tiles.forEach((t, idx) => {
    const btn = document.createElement("button");
    btn.className = "tileBtn";

    const val = tileTapValue(t.level);
    const em = TILE_EMOJIS[idx % TILE_EMOJIS.length];

    // This markup matches the “picture” style (tileArt + title + meta)
    btn.innerHTML = `
      <div class="tileArt">
        <span class="emoji">${em}</span>
        <span>Lvl ${t.level}</span>
      </div>
      <div class="tileTitle">Tile ${idx + 1}</div>
      <div class="tileMeta">Tap earns ~${fmtMoney(val)}</div>
    `;

    btn.addEventListener("click", () => {
      const earned = tileTapValue(t.level);
      state.cash += earned;

      // 10% chance to level up on each tap
      if (Math.random() < 0.10) t.level += 1;

      render();
      renderTiles();
    });

    els.tiles.appendChild(btn);
  });
}

function save() {
  state.lastSeen = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  showToast("Saved");
}

function load() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;

  try {
    const data = JSON.parse(raw);
    for (const k of Object.keys(state)) {
      if (k in data) state[k] = data[k];
    }
    createTilesIfMissing();
    applyUpgrades();
    return true;
  } catch {
    return false;
  }
}

function hardReset() {
  if (!confirm("Reset everything? This cannot be undone.")) return;
  localStorage.removeItem(SAVE_KEY);
  location.reload();
}

function handleOfflineEarnings() {
  if (!els.offlineModal || !els.offlineText || !els.offlineOk) return;

  const now = Date.now();
  const awayMs = Math.max(0, now - (state.lastSeen || now));
  const awaySec = Math.floor(awayMs / 1000);

  if (awaySec < 10) return;
  if (state.passivePerSec <= 0) return;

  // cap offline time at 6 hours
  const cappedSec = Math.min(awaySec, 6 * 60 * 60);
  const earned = cappedSec * state.passivePerSec;

  els.offlineText.textContent =
    `You earned ${fmtMoney(earned)} while away (${Math.floor(cappedSec / 60)} min).`;

  els.offlineModal.style.display = "flex";

  els.offlineOk.onclick = () => {
    els.offlineModal.style.display = "none";
    state.cash += earned;
    render();
    save();
  };
}

function exportSave() {
  const payload = JSON.stringify(state);
  navigator.clipboard?.writeText(payload).then(() => {
    showToast("Export copied");
    log("Export copied to clipboard ✅");
  }).catch(() => {
    prompt("Copy this save data:", payload);
  });
}

function importSave() {
  const txt = prompt("Paste your save data:");
  if (!txt) return;

  try {
    const data = JSON.parse(txt);
    for (const k of Object.keys(state)) {
      if (k in data) state[k] = data[k];
    }
    createTilesIfMissing();
    applyUpgrades();
    render();
    renderTiles();
    save();
    log("Import success ✅");
  } catch {
    alert("That save data was not valid JSON.");
  }
}

/* Passive income tick */
setInterval(() => {
  if (state.passivePerSec > 0) {
    state.cash += state.passivePerSec;
    render();
  }
}, 1000);

/* Autosave */
setInterval(save, 5000);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") save();
});
window.addEventListener("beforeunload", save);

/* Wire buttons safely */
function wireUI() {
  if (els.buyTapBoost) {
    els.buyTapBoost.addEventListener("click", () => {
      const cost = getTapBoostCost();
      if (!canAfford(cost)) return log(`Need ${fmtMoney(cost)} for Tap Boost`);
      spend(cost);
      state.tapBoostLevel += 1;
      applyUpgrades();
      render();
      save();
      log("Tap Boost purchased ✅");
    });
  }

  if (els.buyPassive) {
    els.buyPassive.addEventListener("click", () => {
      const cost = getPassiveCost();
      if (!canAfford(cost)) return log(`Need ${fmtMoney(cost)} for Passive Income`);
      spend(cost);
      state.passiveLevel += 1;
      applyUpgrades();
      render();
      save();
      log("Passive Income purchased ✅");
    });
  }

  if (els.buyTileUp) {
    els.buyTileUp.addEventListener("click", () => {
      const cost = getCityDevCost();
      if (!canAfford(cost)) return log(`Need ${fmtMoney(cost)} for City Development`);
      spend(cost);
      state.cityDevLevel += 1;
      render();
      renderTiles();
      save();
      log("City Development purchased ✅");
    });
  }

  if (els.exportBtn) els.exportBtn.addEventListener("click", exportSave);
  if (els.importBtn) els.importBtn.addEventListener("click", importSave);
  if (els.resetBtn) els.resetBtn.addEventListener("click", hardReset);

  /* Install button (PWA) */
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (els.installBtn) els.installBtn.style.display = "inline-block";
  });

  if (els.installBtn) {
    els.installBtn.addEventListener("click", async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice.catch(() => {});
      deferredPrompt = null;
      els.installBtn.style.display = "none";
    });
  }
}

/* Start */
createTilesIfMissing();
load();
applyUpgrades();
wireUI();
render();
renderTiles();
log("Game loaded ✅");
handleOfflineEarnings();
