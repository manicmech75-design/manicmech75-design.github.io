/* City Flip - game.js (Tutorial + Goals + SFX/Haptics + Prestige) */

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

  // new UI
  soundBtn: $("soundBtn"),
  hapticsBtn: $("hapticsBtn"),
  tutorialBtn: $("tutorialBtn"),

  goalsBox: $("goalsBox"),
  goal1: $("goal1"),
  goal2: $("goal2"),
  goal3: $("goal3"),
  goal4: $("goal4"),
  goal5: $("goal5"),

  prestigePill: $("prestigePill"),
  prestigePrice: $("prestigePrice"),
  prestigeBtn: $("prestigeBtn"),

  tutorialModal: $("tutorialModal"),
  tutorialTitle: $("tutorialTitle"),
  tutorialBody: $("tutorialBody"),
  tutorialNext: $("tutorialNext"),
  tutorialSkip: $("tutorialSkip"),
};

const SAVE_KEY = "cityflip_save_v2";
const TUTORIAL_KEY = "cityflip_tutorial_seen_v1";

const TILE_EMOJIS = ["🏙️","🏢","🏠","🏬","🏟️","🏗️","🌉","🚇","🌆"];

// -------------------- STATE --------------------
const state = {
  cash: 0,
  perTapBase: 1,
  passivePerSec: 0,

  tapBoostLevel: 0,
  passiveLevel: 0,
  cityDevLevel: 0,

  prestigeLevel: 0,      // permanent
  prestigeMult: 1.0,     // derived
  prestigeCostBase: 25000,

  tiles: [],             // { level }
  lastSeen: Date.now(),

  // settings
  soundOn: true,
  hapticsOn: true,

  // stats for goals
  taps: 0,
  goals: {
    g1: false,
    g2: false,
    g3: false,
    g4: false,
    g5: false,
  },
};

// -------------------- HELPERS --------------------
function fmtMoney(n) {
  const v = Math.floor(Number(n) || 0);
  return "$" + v.toLocaleString();
}
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
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

// -------------------- SOUND + HAPTICS --------------------
let audioCtx = null;
function sfx(type) {
  if (!state.soundOn) return;

  // create context only after interaction
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioCtx = new AC();
  }

  const now = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();

  // simple “gamey” bleeps
  let freq = 440, dur = 0.06;
  if (type === "tap") { freq = 520; dur = 0.03; }
  if (type === "buy") { freq = 700; dur = 0.06; }
  if (type === "level") { freq = 900; dur = 0.07; }
  if (type === "goal") { freq = 880; dur = 0.10; }
  if (type === "prestige") { freq = 260; dur = 0.14; }

  o.type = "sine";
  o.frequency.setValueAtTime(freq, now);

  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  o.connect(g);
  g.connect(audioCtx.destination);

  o.start(now);
  o.stop(now + dur + 0.02);
}

function buzz(ms = 10) {
  if (!state.hapticsOn) return;
  if (navigator.vibrate) navigator.vibrate(ms);
}

// -------------------- CORE MATH --------------------
function computePrestigeMult() {
  // +25% per prestige
  state.prestigeMult = 1 + state.prestigeLevel * 0.25;
}

function tileTapValue(tileLevel) {
  const devMult = 1 + state.cityDevLevel * 0.10;
  const tileBonus = Math.max(0, tileLevel) * 0.25;
  const base = (state.perTapBase + tileBonus) * devMult;
  return base * state.prestigeMult;
}

function totalPerTapPreview() {
  const len = state.tiles.length || 1;
  const avgLvl = state.tiles.reduce((a, t) => a + (t?.level || 0), 0) / len;
  return tileTapValue(avgLvl);
}

function getTapBoostCost() { return Math.floor(25 * Math.pow(1.35, state.tapBoostLevel)); }
function getPassiveCost() { return Math.floor(50 * Math.pow(1.45, state.passiveLevel)); }
function getCityDevCost() { return Math.floor(75 * Math.pow(1.5, state.cityDevLevel)); }

function getPrestigeCost() {
  // grows gently each prestige
  return Math.floor(state.prestigeCostBase * Math.pow(1.6, state.prestigeLevel));
}

function canAfford(cost) { return state.cash >= cost; }
function spend(cost) { state.cash = Math.max(0, state.cash - cost); }

function applyUpgrades() {
  state.perTapBase = 1 + state.tapBoostLevel * 1;
  state.passivePerSec = (state.passiveLevel * 1) * state.prestigeMult;
}

// -------------------- SETUP / RENDER --------------------
function createTilesIfMissing() {
  if (!Array.isArray(state.tiles) || state.tiles.length !== 9) {
    state.tiles = Array.from({ length: 9 }, () => ({ level: 0 }));
  }
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

  if (els.prestigePill) els.prestigePill.textContent = `Prestige x${state.prestigeMult.toFixed(2)}`;
  if (els.prestigePrice) els.prestigePrice.textContent = fmtMoney(getPrestigeCost());
  if (els.prestigeBtn) {
    els.prestigeBtn.disabled = state.cash < getPrestigeCost();
    els.prestigeBtn.style.opacity = els.prestigeBtn.disabled ? 0.55 : 1;
  }

  if (els.soundBtn) els.soundBtn.textContent = `Sound: ${state.soundOn ? "On" : "Off"}`;
  if (els.hapticsBtn) els.hapticsBtn.textContent = `Haptics: ${state.hapticsOn ? "On" : "Off"}`;

  renderGoals();
}

function renderTiles() {
  if (!els.tiles) return;
  els.tiles.innerHTML = "";

  state.tiles.forEach((t, idx) => {
    const btn = document.createElement("button");
    btn.className = "tileBtn";
    btn.dataset.tutorial = "tile";

    const val = tileTapValue(t.level);
    const em = TILE_EMOJIS[idx % TILE_EMOJIS.length];

    btn.innerHTML = `
      <div class="tileArt">
        <span class="emoji">${em}</span>
        <span>Lvl ${t.level}</span>
      </div>
      <div class="tileTitle">Tile ${idx + 1}</div>
      <div class="tileMeta">Tap earns ~${fmtMoney(val)}</div>
    `;

    btn.addEventListener("click", () => {
      if (tutorialLock && tutorialStep < 2) return; // lock during early steps

      const earned = tileTapValue(t.level);
      state.cash += earned;
      state.taps += 1;

      sfx("tap");
      buzz(10);

      // tile leveling
      if (Math.random() < 0.10) {
        t.level += 1;
        sfx("level");
        buzz(18);
      }

      checkGoals();
      render();
      renderTiles();

      // tutorial progression
      if (tutorialLock && tutorialStep === 1) {
        tutorialProgressCount++;
        if (tutorialProgressCount >= 3) tutorialNextStep();
      }
    });

    els.tiles.appendChild(btn);
  });
}

// -------------------- SAVE / LOAD --------------------
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
    computePrestigeMult();
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
  localStorage.removeItem(TUTORIAL_KEY);
  location.reload();
}

// -------------------- OFFLINE EARNINGS --------------------
function handleOfflineEarnings() {
  if (!els.offlineModal || !els.offlineText || !els.offlineOk) return;

  const now = Date.now();
  const awayMs = Math.max(0, now - (state.lastSeen || now));
  const awaySec = Math.floor(awayMs / 1000);

  if (awaySec < 10) return;
  if (state.passivePerSec <= 0) return;

  const cappedSec = Math.min(awaySec, 6 * 60 * 60);
  const earned = cappedSec * state.passivePerSec;

  els.offlineText.textContent =
    `You earned ${fmtMoney(earned)} while away (${Math.floor(cappedSec / 60)} min).`;

  els.offlineModal.style.display = "flex";

  els.offlineOk.onclick = () => {
    els.offlineModal.style.display = "none";
    state.cash += earned;
    sfx("goal");
    render();
    save();
  };
}

// -------------------- EXPORT / IMPORT --------------------
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
    computePrestigeMult();
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

// -------------------- GOALS / QUESTS --------------------
function markGoal(el, done) {
  if (!el) return;
  el.style.opacity = done ? 1 : 0.55;
  el.style.borderColor = done ? "rgba(49,194,107,.8)" : "rgba(255,255,255,.14)";
  el.style.background = done ? "rgba(49,194,107,.15)" : "rgba(0,0,0,.22)";
}

function renderGoals() {
  markGoal(els.goal1, state.goals.g1);
  markGoal(els.goal2, state.goals.g2);
  markGoal(els.goal3, state.goals.g3);
  markGoal(els.goal4, state.goals.g4);
  markGoal(els.goal5, state.goals.g5);
}

function rewardGoal(amount, label) {
  state.cash += amount;
  sfx("goal");
  buzz(25);
  showToast(`Goal complete! +${fmtMoney(amount)}`);
  log(`Goal complete: ${label} ✅ (+${fmtMoney(amount)})`);
}

function checkGoals() {
  // G1: tap 10
  if (!state.goals.g1 && state.taps >= 10) {
    state.goals.g1 = true;
    rewardGoal(50, "Tap 10 times");
  }
  // G2: reach $100
  if (!state.goals.g2 && state.cash >= 100) {
    state.goals.g2 = true;
    rewardGoal(100, "Reach $100");
  }
  // G3: buy passive income at least once
  if (!state.goals.g3 && state.passiveLevel >= 1) {
    state.goals.g3 = true;
    rewardGoal(200, "Buy Passive Income");
  }
  // G4: reach $1,000
  if (!state.goals.g4 && state.cash >= 1000) {
    state.goals.g4 = true;
    rewardGoal(500, "Reach $1,000");
  }
  // G5: unlock prestige threshold
  if (!state.goals.g5 && state.cash >= getPrestigeCost()) {
    state.goals.g5 = true;
    rewardGoal(1000, "Unlock Prestige");
  }
}

// -------------------- PRESTIGE --------------------
function doPrestige() {
  const cost = getPrestigeCost();
  if (!canAfford(cost)) {
    log(`Need ${fmtMoney(cost)} to Prestige`);
    return;
  }
  if (!confirm(`Prestige resets progress but increases multiplier.\n\nSpend ${fmtMoney(cost)} to Prestige?`)) return;

  // preserve long-term progress
  state.prestigeLevel += 1;
  computePrestigeMult();

  // reset run progress
  state.cash = 0;
  state.tapBoostLevel = 0;
  state.passiveLevel = 0;
  state.cityDevLevel = 0;
  state.taps = 0;
  state.goals = { g1:false, g2:false, g3:false, g4:false, g5:false };
  state.tiles = Array.from({ length: 9 }, () => ({ level: 0 }));

  applyUpgrades();
  sfx("prestige");
  buzz(40);
  showToast(`Prestige! Multiplier x${state.prestigeMult.toFixed(2)}`);
  log(`Prestiged ✅ Multiplier is now x${state.prestigeMult.toFixed(2)}`);

  render();
  renderTiles();
  save();
}

// -------------------- TUTORIAL (GUIDED) --------------------
let tutorialStep = 0;
let tutorialLock = false;
let tutorialProgressCount = 0;

const tutorialSteps = [
  {
    title: "Welcome to City Flip",
    body: "This is a quick guided tour. You’ll tap tiles, buy an upgrade, then you’re free to build your skyline.",
    focus: null,
    lock: true
  },
  {
    title: "Step 1: Tap tiles",
    body: "Tap any City Tile 3 times to earn cash.",
    focus: "tiles",
    lock: true
  },
  {
    title: "Step 2: Buy Tap Boost",
    body: "Now buy your first Tap Boost (orange button). If you can’t afford it, tap a few more tiles.",
    focus: "buyTapBoost",
    lock: false
  },
  {
    title: "Step 3: Passive Income",
    body: "Passive Income earns money every second. Buy it once when you can.",
    focus: "buyPassive",
    lock: false
  },
  {
    title: "Step 4: Goals + Prestige",
    body: "Complete goals for bonus cash. Later, Prestige resets progress for a permanent multiplier.",
    focus: "goalsBox",
    lock: false
  },
  {
    title: "You’re ready!",
    body: "Tutorial complete. Tap fast, upgrade smart, and build your skyline.",
    focus: null,
    lock: false
  },
];

function clearFocus() {
  document.querySelectorAll(".focusTarget").forEach((el) => el.classList.remove("focusTarget"));
}

function setFocus(id) {
  clearFocus();
  if (!id) return;
  const el = $(id);
  if (el) el.classList.add("focusTarget");
}

function tutorialOpen(fromButton = false) {
  tutorialStep = 0;
  tutorialProgressCount = 0;
  tutorialLock = true;
  if (els.tutorialModal) els.tutorialModal.style.display = "flex";
  tutorialRender();
  if (!fromButton) localStorage.setItem(TUTORIAL_KEY, "1");
}

function tutorialClose() {
  if (els.tutorialModal) els.tutorialModal.style.display = "none";
  tutorialLock = false;
  clearFocus();
}

function tutorialRender() {
  const step = tutorialSteps[tutorialStep];
  if (!step) return;

  tutorialLock = !!step.lock;
  if (els.tutorialTitle) els.tutorialTitle.textContent = step.title;
  if (els.tutorialBody) els.tutorialBody.textContent = step.body;

  setFocus(step.focus);

  if (els.tutorialNext) {
    els.tutorialNext.textContent = (tutorialStep >= tutorialSteps.length - 1) ? "Done" : "Next";
  }
}

function tutorialNextStep() {
  tutorialProgressCount = 0;
  tutorialStep += 1;
  if (tutorialStep >= tutorialSteps.length) {
    tutorialClose();
    return;
  }
  tutorialRender();
}

function tutorialSkip() {
  tutorialClose();
  log("Tutorial skipped ⏭️");
}

// -------------------- UI WIRING --------------------
function wireUI() {
  // toggles
  if (els.soundBtn) {
    els.soundBtn.addEventListener("click", () => {
      state.soundOn = !state.soundOn;
      sfx("buy");
      render();
      save();
    });
  }
  if (els.hapticsBtn) {
    els.hapticsBtn.addEventListener("click", () => {
      state.hapticsOn = !state.hapticsOn;
      buzz(20);
      render();
      save();
    });
  }

  // tutorial button
  if (els.tutorialBtn) {
    els.tutorialBtn.addEventListener("click", () => tutorialOpen(true));
  }
  if (els.tutorialNext) els.tutorialNext.addEventListener("click", () => {
    if (tutorialStep === 2) {
      // allow them to buy tap boost before moving on
      if (state.tapBoostLevel < 1) {
        showToast("Buy Tap Boost first");
        return;
      }
    }
    if (tutorialStep === 3) {
      if (state.passiveLevel < 1) {
        showToast("Buy Passive Income once");
        return;
      }
    }
    tutorialNextStep();
  });
  if (els.tutorialSkip) els.tutorialSkip.addEventListener("click", tutorialSkip);

  // upgrades
  if (els.buyTapBoost) {
    els.buyTapBoost.addEventListener("click", () => {
      const cost = getTapBoostCost();
      if (!canAfford(cost)) { log(`Need ${fmtMoney(cost)} for Tap Boost`); return; }
      spend(cost);
      state.tapBoostLevel += 1;
      applyUpgrades();
      sfx("buy"); buzz(15);
      render(); save();
      log("Tap Boost purchased ✅");
      checkGoals();

      if (tutorialLock && tutorialStep === 2) tutorialNextStep();
    });
  }

  if (els.buyPassive) {
    els.buyPassive.addEventListener("click", () => {
      const cost = getPassiveCost();
      if (!canAfford(cost)) { log(`Need ${fmtMoney(cost)} for Passive Income`); return; }
      spend(cost);
      state.passiveLevel += 1;
      applyUpgrades();
      sfx("buy"); buzz(15);
      render(); save();
      log("Passive Income purchased ✅");
      checkGoals();

      if (tutorialLock && tutorialStep === 3) tutorialNextStep();
    });
  }

  if (els.buyTileUp) {
    els.buyTileUp.addEventListener("click", () => {
      const cost = getCityDevCost();
      if (!canAfford(cost)) { log(`Need ${fmtMoney(cost)} for City Development`); return; }
      spend(cost);
      state.cityDevLevel += 1;
      sfx("buy"); buzz(15);
      render(); renderTiles(); save();
      log("City Development purchased ✅");
    });
  }

  // prestige
  if (els.prestigeBtn) els.prestigeBtn.addEventListener("click", doPrestige);

  // export/import/reset
  if (els.exportBtn) els.exportBtn.addEventListener("click", exportSave);
  if (els.importBtn) els.importBtn.addEventListener("click", importSave);
  if (els.resetBtn) els.resetBtn.addEventListener("click", hardReset);

  // install
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

// -------------------- LOOP --------------------
setInterval(() => {
  if (state.passivePerSec > 0) {
    state.cash += state.passivePerSec;
    checkGoals();
    render();
  }
}, 1000);

setInterval(save, 5000);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") save();
});
window.addEventListener("beforeunload", save);

// -------------------- START --------------------
computePrestigeMult();
createTilesIfMissing();
load();
computePrestigeMult();
createTilesIfMissing();
applyUpgrades();
wireUI();
render();
renderTiles();
log("Game loaded ✅");
handleOfflineEarnings();

// auto-tutorial first time
if (!localStorage.getItem(TUTORIAL_KEY)) {
  tutorialOpen(false);
}
