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

  const soundToggleEl = $("soundToggle");
  const hapticToggleEl = $("hapticToggle");
  const themeSelectEl = $("themeSelect");

  const offlineModalEl = $("offlineModal");
  const offlineTextEl = $("offlineText");
  const offlineOkEl = $("offlineOk");

  // Reward / boost UI
  const rewardBtn = $("rewardBtn");         // may not exist in this file; safe-check below
  const rewardStatus = $("rewardStatus");   // safe-check below
  const boostBar = $("boostBar");
  const boostPill = $("boostPill");

  // Daily + Achievements
  const claimDailyBtn = $("claimDailyBtn");
  const streakTitle = $("streakTitle");
  const streakDesc = $("streakDesc");
  const streakStatus = $("streakStatus");
  const achListEl = $("achList");

  const bodyEl = document.body;

  // State
  const SAVE_KEY = "cityflip_save_v5";

  const TILE_NAMES = [
    "Downtown", "Suburbs", "Industrial",
    "Beach", "Airport", "Old Town",
    "Tech Park", "Harbor", "Hills"
  ];
  const TILE_ICONS = ["🏙️","🏘️","🏭","🏖️","✈️","🏛️","💻","⚓","⛰️"];
  const TILE_GRADS = [
    ["rgba(0,255,255,.95)", "rgba(120,0,255,.22)"],
    ["rgba(0,200,255,.90)", "rgba(0,120,255,.18)"],
    ["rgba(255,150,0,.92)", "rgba(60,60,60,.22)"],
    ["rgba(255,120,0,.92)", "rgba(255,0,140,.22)"],
    ["rgba(120,160,255,.95)", "rgba(30,40,80,.22)"],
    ["rgba(255,220,120,.92)", "rgba(120,60,0,.18)"],
    ["rgba(0,255,160,.92)", "rgba(0,90,255,.18)"],
    ["rgba(0,190,255,.92)", "rgba(0,60,120,.20)"],
    ["rgba(160,255,200,.92)", "rgba(0,120,80,.18)"]
  ];

  const defaultState = () => ({
    cash: 0,
    perTap: 1,
    perSec: 0,

    tapBoostLevel: 0,
    passiveLevel: 0,
    cityDevLevel: 0,

    tiles: Array.from({ length: 9 }, () => ({ level: 0 })),

    // Reward boost state (kept for compatibility; reward button optional)
    boost: {
      mult: 1,
      endsAt: 0,
      cooldownEndsAt: 0
    },

    // Daily streak
    daily: {
      streak: 0,
      lastClaimDay: "", // YYYY-MM-DD in local time
    },

    // Stats for achievements
    stats: {
      taps: 0,
      totalEarned: 0
    },

    // Achievement flags
    achievements: {
      firstTap: false,
      firstUpgrade: false,
      firstPassive: false,
      earn10k: false,
      tap1000: false,
      streak3: false,
      streak7: false
    },

    settings: {
      sound: true,
      haptics: true,
      theme: "neon"
    },

    lastTick: Date.now()
  });

  let state = load() ?? defaultState();

  // ---------- Helpers ----------
  function formatMoney(n) {
    const sign = n < 0 ? "-" : "";
    n = Math.abs(n);
    if (n < 1000) return `${sign}$${Math.floor(n)}`;
    if (n < 1e6) return `${sign}$${(n / 1e3).toFixed(1)}K`;
    if (n < 1e9) return `${sign}$${(n / 1e6).toFixed(1)}M`;
    return `${sign}$${(n / 1e9).toFixed(1)}B`;
  }

  function fmtTime(sec) {
    sec = Math.max(0, Math.floor(sec));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  }

  function todayKey() {
    // local date key
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function daysBetween(olderKey, newerKey) {
    // parse YYYY-MM-DD in local time
    if (!olderKey) return 9999;
    const [oy, om, od] = olderKey.split("-").map(Number);
    const [ny, nm, nd] = newerKey.split("-").map(Number);
    const a = new Date(oy, om - 1, od).getTime();
    const b = new Date(ny, nm - 1, nd).getTime();
    return Math.floor((b - a) / 86400000);
  }

  function log(msg) {
    const time = new Date().toLocaleTimeString();
    const line = `[${time}] ${msg}`;
    const div = document.createElement("div");
    div.textContent = line;
    logEl.prepend(div);
    while (logEl.children.length > 30) logEl.removeChild(logEl.lastChild);
  }

  // Sound
  let audioCtx = null;
  function clickSound() {
    if (!state.settings.sound) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "square";
      o.frequency.value = 520;
      g.gain.value = 0.04;
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + 0.03);
    } catch (e) {}
  }
  function hapticTap() {
    if (!state.settings.haptics) return;
    if (navigator.vibrate) {
      try { navigator.vibrate(10); } catch (e) {}
    }
  }

  function applyTheme(theme) {
    const allowed = new Set(["neon","sunset","emerald","midnight"]);
    const t = allowed.has(theme) ? theme : "neon";
    state.settings.theme = t;
    bodyEl.setAttribute("data-theme", t);
    if (themeSelectEl) themeSelectEl.value = t;
  }

  // ---------- Reward boost ----------
  function boostMult() {
    const now = Date.now();
    return (state.boost.endsAt && now < state.boost.endsAt) ? (state.boost.mult || 2) : 1;
  }

  function updateBoostUI() {
    const now = Date.now();
    const active = state.boost.endsAt && now < state.boost.endsAt;

    if (active) {
      boostBar.style.display = "flex";
      const remaining = (state.boost.endsAt - now) / 1000;
      boostPill.textContent = `${state.boost.mult || 2}x • ${fmtTime(remaining)}`;
    } else {
      boostBar.style.display = "none";
    }
  }

  // ---------- Achievements ----------
  const ACH_LIST = [
    { key: "firstTap",      title: "First Tap",        desc: "Tap any tile once." },
    { key: "firstUpgrade",  title: "First Upgrade",    desc: "Upgrade any tile once." },
    { key: "firstPassive",  title: "Passive Income",   desc: "Buy your first passive upgrade." },
    { key: "earn10k",       title: "Big Money",        desc: "Earn $10K total (lifetime)." },
    { key: "tap1000",       title: "Tap Machine",      desc: "Tap 1,000 times." },
    { key: "streak3",       title: "3-Day Streak",     desc: "Claim daily reward 3 days in a row." },
    { key: "streak7",       title: "7-Day Streak",     desc: "Claim daily reward 7 days in a row." }
  ];

  function unlockAch(key) {
    if (state.achievements[key]) return;
    state.achievements[key] = true;
    log(`🏆 Achievement unlocked: ${ACH_LIST.find(a=>a.key===key)?.title ?? key}`);
    clickSound();
    hapticTap();
    save();
    renderAchievements();
  }

  function checkAchievements() {
    if (state.stats.taps >= 1) unlockAch("firstTap");
    if (state.stats.totalEarned >= 10000) unlockAch("earn10k");
    if (state.stats.taps >= 1000) unlockAch("tap1000");
    if (state.daily.streak >= 3) unlockAch("streak3");
    if (state.daily.streak >= 7) unlockAch("streak7");
  }

  function renderAchievements() {
    if (!achListEl) return;
    achListEl.innerHTML = "";
    for (const a of ACH_LIST) {
      const row = document.createElement("div");
      row.className = "achItem";

      const left = document.createElement("div");
      left.className = "left";

      const t = document.createElement("div");
      t.textContent = a.title;

      const d = document.createElement("small");
      d.textContent = a.desc;

      left.appendChild(t);
      left.appendChild(d);

      const badge = document.createElement("div");
      const done = !!state.achievements[a.key];
      badge.className = "badge" + (done ? " done" : "");
      badge.textContent = done ? "Unlocked" : "Locked";

      row.appendChild(left);
      row.appendChild(badge);
      achListEl.appendChild(row);
    }
  }

  // ---------- Daily streak ----------
  function dailyRewardAmount(dayNumber) {
    // Day 1..7 then repeat at 7
    const d = Math.max(1, Math.min(7, dayNumber));
    const base = 200 * d; // scales with streak day
    // also scales a bit with your current game to stay relevant
    const scale = 1 + (state.cityDevLevel * 0.15) + (state.passiveLevel * 0.10);
    return Math.floor(base * scale);
  }

  function updateDailyUI() {
    const t = todayKey();
    const gap = daysBetween(state.daily.lastClaimDay, t);
    const already = (gap === 0);
    const canClaim = !already;

    // If they missed a day, show “streak will reset”
    const willReset = (state.daily.lastClaimDay && gap >= 2);

    const nextDay = willReset ? 1 : (state.daily.streak + 1);
    const amt = dailyRewardAmount(nextDay);

    if (streakTitle) streakTitle.textContent = `Day ${nextDay} Reward`;
    if (streakDesc) streakDesc.textContent = `Claim ${formatMoney(amt)}. Current streak: ${state.daily.streak} day(s).`;
    if (streakStatus) streakStatus.textContent = already ? "Claimed today" : (willReset ? "Missed a day (resets)" : "Ready");
    if (claimDailyBtn) claimDailyBtn.disabled = !canClaim;
  }

  function claimDaily() {
    const t = todayKey();
    const gap = daysBetween(state.daily.lastClaimDay, t);
    if (gap === 0) return; // already claimed

    // If missed 2+ days, reset streak
    if (state.daily.lastClaimDay && gap >= 2) {
      state.daily.streak = 0;
    }

    state.daily.streak += 1;
    state.daily.lastClaimDay = t;

    const amt = dailyRewardAmount(state.daily.streak);
    state.cash += amt;
    state.stats.totalEarned += amt;

    log(`🎁 Daily claimed! +${formatMoney(amt)} (Streak: ${state.daily.streak})`);
    clickSound();
    hapticTap();
    save();

    updateUI();
    renderTiles(); // update button states
    checkAchievements();
  }

  claimDailyBtn?.addEventListener("click", claimDaily);

  // ---------- Tile math ----------
  function tileTapBonus(tileIndex) {
    const perTileLevel = state.tiles[tileIndex]?.level ?? 0;
    return 1 + state.cityDevLevel + perTileLevel;
  }

  function tileUpgradeCost(tileIndex) {
    const lvl = state.tiles[tileIndex]?.level ?? 0;
    const base = 30 + tileIndex * 6;
    return Math.floor(base * Math.pow(1.65, lvl));
  }

  function tileTapEarn(tileIndex) {
    return (state.perTap + tileTapBonus(tileIndex)) * boostMult();
  }

  // ---------- Render ----------
  function renderTiles() {
    tilesEl.innerHTML = "";

    for (let i = 0; i < 9; i++) {
      const tile = document.createElement("div");
      tile.className = "tile";

      const [c1, c2] = TILE_GRADS[i];
      tile.style.background = `linear-gradient(180deg, ${c1}, ${c2})`;

      const top = document.createElement("div");
      top.className = "tileTop";

      const left = document.createElement("div");
      left.className = "tileLeft";

      const icon = document.createElement("div");
      icon.className = "tileIcon";
      icon.textContent = TILE_ICONS[i];

      const name = document.createElement("div");
      name.className = "name";
      name.textContent = TILE_NAMES[i];

      left.appendChild(icon);
      left.appendChild(name);

      const lvl = document.createElement("div");
      lvl.className = "lvl";
      lvl.textContent = `Lv ${state.tiles[i]?.level ?? 0}`;

      top.appendChild(left);
      top.appendChild(lvl);

      const small = document.createElement("div");
      small.className = "small";
      small.textContent = `Bonus: +${tileTapBonus(i)}  (City Dev +${state.cityDevLevel})`;

      const gain = document.createElement("div");
      gain.className = "gain";
      gain.textContent = `Tap: +${formatMoney(tileTapEarn(i))}`;

      const upBtn = document.createElement("button");
      upBtn.className = "tileBtn";
      upBtn.textContent = `Upgrade (${formatMoney(tileUpgradeCost(i))})`;

      tile.addEventListener("click", () => {
        const earned = tileTapEarn(i);
        state.cash += earned;

        state.stats.taps += 1;
        state.stats.totalEarned += earned;

        clickSound();
        hapticTap();

        updateUI();
        maybeSaveSoon();
        checkAchievements();
      });

      upBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const cost = tileUpgradeCost(i);
        if (state.cash < cost) return;

        state.cash -= cost;
        state.tiles[i].level += 1;

        unlockAch("firstUpgrade");

        clickSound();
        hapticTap();
        log(`${TILE_NAMES[i]} upgraded to Lv ${state.tiles[i].level}.`);

        renderTiles();
        updateUI();
        save();
      });

      tile.appendChild(top);
      tile.appendChild(small);
      tile.appendChild(gain);
      tile.appendChild(upBtn);

      tilesEl.appendChild(tile);
    }
  }

  function updateUI() {
    cashEl.textContent = formatMoney(state.cash);
    perTapEl.textContent = formatMoney(state.perTap * boostMult());
    perSecEl.textContent = `${formatMoney(state.perSec * boostMult())}/s`;

    tapBoostPriceEl.textContent = formatMoney(priceTapBoost());
    passivePriceEl.textContent = formatMoney(pricePassive());
    tileUpPriceEl.textContent = formatMoney(priceCityDev());

    buyTapBoostBtn.disabled = state.cash < priceTapBoost();
    buyPassiveBtn.disabled = state.cash < pricePassive();
    buyTileUpBtn.disabled = state.cash < priceCityDev();

    soundToggleEl.checked = !!state.settings.sound;
    hapticToggleEl.checked = !!state.settings.haptics;
    if (themeSelectEl) themeSelectEl.value = state.settings.theme;

    const buttons = tilesEl.querySelectorAll(".tileBtn");
    buttons.forEach((btn, idx) => {
      const cost = tileUpgradeCost(idx);
      btn.disabled = state.cash < cost;
      btn.textContent = `Upgrade (${formatMoney(cost)})`;
    });

    updateBoostUI();
    updateDailyUI();
  }

  // ---------- Prices ----------
  function priceTapBoost() { return Math.floor(25 * Math.pow(1.8, state.tapBoostLevel)); }
  function pricePassive() { return Math.floor(50 * Math.pow(2.0, state.passiveLevel)); }
  function priceCityDev() { return Math.floor(75 * Math.pow(1.9, state.cityDevLevel)); }

  // ---------- Upgrades ----------
  buyTapBoostBtn.addEventListener("click", () => {
    const cost = priceTapBoost();
    if (state.cash < cost) return;
    state.cash -= cost;
    state.tapBoostLevel += 1;
    state.perTap += 1 + Math.floor(state.tapBoostLevel / 2);
    clickSound(); hapticTap();
    log(`Bought Tap Boost (Lv ${state.tapBoostLevel}).`);
    renderTiles(); updateUI(); save();
  });

  buyPassiveBtn.addEventListener("click", () => {
    const cost = pricePassive();
    if (state.cash < cost) return;
    state.cash -= cost;
    state.passiveLevel += 1;
    state.perSec += 1 + Math.floor(state.passiveLevel / 3);
    unlockAch("firstPassive");
    clickSound(); hapticTap();
    log(`Bought Passive Income (Lv ${state.passiveLevel}).`);
    updateUI(); save();
  });

  buyTileUpBtn.addEventListener("click", () => {
    const cost = priceCityDev();
    if (state.cash < cost) return;
    state.cash -= cost;
    state.cityDevLevel += 1;
    clickSound(); hapticTap();
    log(`City Development upgraded to Lv ${state.cityDevLevel}.`);
    renderTiles(); updateUI(); save();
  });

  // ---------- Settings ----------
  soundToggleEl.addEventListener("change", () => { state.settings.sound = !!soundToggleEl.checked; save(); if (state.settings.sound) clickSound(); });
  hapticToggleEl.addEventListener("change", () => { state.settings.haptics = !!hapticToggleEl.checked; save(); if (state.settings.haptics) hapticTap(); });
  themeSelectEl?.addEventListener("change", () => { applyTheme(themeSelectEl.value); clickSound(); hapticTap(); log(`Theme set to ${state.settings.theme}.`); save(); });

  // ---------- Passive loop + offline ----------
  function tick() {
    const now = Date.now();
    const dt = (now - state.lastTick) / 1000;
    state.lastTick = now;

    if (dt > 0 && state.perSec > 0) {
      const earned = (state.perSec * boostMult()) * dt;
      state.cash += earned;
      state.stats.totalEarned += earned;
      updateUI();
      maybeSaveSoon();
      checkAchievements();
    } else {
      updateBoostUI();
      updateDailyUI();
    }
  }

  function showOfflineModal(amount) {
    offlineTextEl.textContent = `You earned ${formatMoney(amount)} while away.`;
    offlineModalEl.style.display = "flex";
  }
  offlineOkEl.addEventListener("click", () => { offlineModalEl.style.display = "none"; save(); });

  // ---------- Save / Load ----------
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {} }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || typeof obj !== "object") return null;
      return obj;
    } catch (e) { return null; }
  }

  let saveTimer = null;
  function maybeSaveSoon() {
    if (saveTimer) return;
    saveTimer = setTimeout(() => { saveTimer = null; save(); }, 1200);
  }

  // Export / Import
  exportBtn.addEventListener("click", async () => {
    const data = JSON.stringify(state);
    try { await navigator.clipboard.writeText(data); log("Export copied to clipboard."); }
    catch (e) { prompt("Copy your save data:", data); }
  });

  importBtn.addEventListener("click", () => {
    const data = prompt("Paste save data to import:");
    if (!data) return;
    try {
      const obj = JSON.parse(data);
      if (!obj || typeof obj !== "object") throw new Error("bad");

      const d = defaultState();
      state = { ...d, ...obj };

      state.tiles = Array.isArray(obj.tiles) && obj.tiles.length === 9
        ? obj.tiles.map(t => ({ level: Math.max(0, (t?.level ?? 0) | 0) }))
        : d.tiles;

      state.settings = { ...d.settings, ...(obj.settings || {}) };
      state.boost = { ...d.boost, ...(obj.boost || {}) };
      state.daily = { ...d.daily, ...(obj.daily || {}) };
      state.stats = { ...d.stats, ...(obj.stats || {}) };
      state.achievements = { ...d.achievements, ...(obj.achievements || {}) };

      state.lastTick = Date.now();

      applyTheme(state.settings.theme);

      save(); renderTiles(); updateUI(); renderAchievements();
      log("Imported save successfully.");
      checkAchievements();
    } catch (e) {
      log("Import failed (invalid data).");
      alert("Import failed. Data was not valid.");
    }
  });

  resetBtn.addEventListener("click", () => {
    if (!confirm("Reset all progress?")) return;
    state = defaultState();
    applyTheme(state.settings.theme);
    save(); renderTiles(); updateUI(); renderAchievements();
    log("Progress reset.");
  });

  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") save(); });
  window.addEventListener("beforeunload", () => save());

  // Install prompt
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

  // ---------- Init ----------
  (function init() {
    // normalize shapes
    const d = defaultState();
    if (!Array.isArray(state.tiles) || state.tiles.length !== 9) state.tiles = d.tiles;
    else state.tiles = state.tiles.map(t => ({ level: Math.max(0, (t?.level ?? 0) | 0) }));

    state.settings = { ...d.settings, ...(state.settings || {}) };
    state.boost = { ...d.boost, ...(state.boost || {}) };
    state.daily = { ...d.daily, ...(state.daily || {}) };
    state.stats = { ...d.stats, ...(state.stats || {}) };
    state.achievements = { ...d.achievements, ...(state.achievements || {}) };

    applyTheme(state.settings.theme);

    // Offline earnings (cap 8 hours)
    const now = Date.now();
    const last = state.lastTick || now;
    const offlineSec = Math.min(8 * 3600, Math.max(0, (now - last) / 1000));
    if (offlineSec > 1 && state.perSec > 0) {
      const earned = (state.perSec * boostMult()) * offlineSec;
      state.cash += earned;
      state.stats.totalEarned += earned;
      showOfflineModal(earned);
      log(`Welcome back! Offline earnings: ${formatMoney(earned)}.`);
    }
    state.lastTick = now;

    renderTiles();
    renderAchievements();
    updateUI();
    checkAchievements();
    log("Daily streak + achievements added!");

    setInterval(tick, 250);
    setInterval(save, 6000);
    save();
  })();
})();
