/* City Flip - game.js (stable, tiles guaranteed) */

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

  tapBoostLevel: 0,     // increases per tap
  passiveLevel: 0,      // increases per second
  cityDevLevel: 0,      // boosts tile bonus multiplier

  tiles: [],            // each tile: { level }
  lastSeen: Date.now(),
};

function fmtMoney(n) {
  const v = Math.floor(n);
  return "$" + v.toLocaleString();
}

function log(msg) {
  const line = document.createElement("div");
  line.textContent = msg;
  els.log.prepend(line);
}

function showToast(text = "Saved") {
  els.toast.textContent = text;
  els.toast.style.display = "block";
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => (els.toast.style.display = "none"), 900);
}

function tileTapValue(tileLevel) {
  // tile gives a bonus based on its level, multiplied by city development
  const devMult = 1 + state.cityDevLevel * 0.10;
  const tileBonus = Math.max(0, tileLevel) * 0.25; // +$0.25 per tile level
  return (state.perTapBase + tileBonus) * devMult;
}

function totalPerTapPreview() {
  // preview uses average tile level
  const avgLvl = state.tiles.reduce((a, t) => a + t.level, 0) / state.tiles.length;
  return tileTapValue(avgLvl);
}

function render() {
  els.cash.textContent = fmtMoney(state.cash);
  els.perTap.textContent = fmtMoney(totalPerTapPreview());
  els.perSec.textContent = fmtMoney(state.passivePerSec) + "/s";

  els.tapBoostPrice.textContent = fmtMoney(getTapBoostCost());
  els.passivePrice.textContent = fmtMoney(getPassiveCost());
  els.tileUpPrice.textContent = fmtMoney(getCityDevCost());
}

function createTilesIfMissing() {
  if (!Array.isArray(state.tiles) || state.tiles.length !== 9) {
    state.tiles = Array.from({ length: 9 }, () => ({ level: 0 }));
  }
}

function renderTiles() {
  els.tiles.innerHTML = "";
  state.tiles.forEach((t, idx) => {
    const btn = document.createElement("button");
    btn.className = "tileBtn";

    const val = tileTapValue(t.level);

    btn.innerHTML = `
      <div>🏙️ Tile ${idx + 1} <small>(Lvl ${t.level})</small></div>
      <small>Tap earns ~${fmtMoney(val)}</small>
    `;

    btn.addEventListener("click", () => {
      const earned = tileTapValue(t.level);
      state.cash += earned;

      // small progression: tile levels up slowly with use
      if (Math.random() < 0.10) t.level += 1;

      render();
      // re-render this tile only (simple: rerender all)
      renderTiles();
    });

    els.tiles.appendChild(btn);
  });
}

function getTapBoostCost() {
  // 25, 40, 60, 85...
  return Math.floor(25 * Math.pow(1.35, state.tapBoostLevel));
}
function getPassiveCost() {
  // 50, 80, 120...
  return Math.floor(50 * Math.pow(1.45, state.passiveLevel));
}
function getCityDevCost() {
  // 75, 120, 180...
  return Math.floor(75 * Math.pow(1.5, state.cityDevLevel));
}

function canAfford(cost) {
  return state.cash >= cost;
}
function spend(cost) {
  state.cash = Math.max(0, state.cash - cost);
}

function applyUpgrades() {
  // tap boost: +$1 each level
  state.perTapBase = 1 + state.tapBoostLevel * 1;

  // passive: +$1/s each level
  state.passivePerSec = state.passiveLevel * 1;
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

    // shallow assign known fields
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
  const now = Date.now();
  const awayMs = Math.max(0, now - (state.lastSeen || now));
  const awaySec = Math.floor(awayMs / 1000);

  if (awaySec < 10) return; // ignore tiny gaps
  if (state.passivePerSec <= 0) return;

  // cap offline time at 6 hours to avoid crazy jumps
  const cappedSec = Math.min(awaySec, 6 * 60 * 60);
  const earned = cappedSec * state.passivePerSec;

  els.offlineText.textContent =
    `You earned ${fmtMoney(earned)} while away (${Math.floor(cappedSec / 60)} min).`;

  els.offlineModal.style.display = "flex";

  const close = () => {
    els.offlineModal.style.display = "none";
    state.cash += earned;
    render();
    save();
  };

  els.offlineOk.onclick = close;
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

/* Buttons */
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

els.exportBtn.addEventListener("click", exportSave);
els.importBtn.addEventListener("click", importSave);
els.resetBtn.addEventListener("click", hardReset);

/* Install button (PWA) */
let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  els.installBtn.style.display = "inline-block";
});
els.installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice.catch(()=>{});
  deferredPrompt = null;
  els.installBtn.style.display = "none";
});

/* Start */
createTilesIfMissing();
load();
applyUpgrades();
render();
renderTiles();
log("Game loaded ✅");
handleOfflineEarnings();
