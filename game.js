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

  const rewardBtn = $("rewardBtn");
  const rewardStatus = $("rewardStatus");
  const boostBar = $("boostBar");
  const boostPill = $("boostPill");

  const claimDailyBtn = $("claimDailyBtn");
  const streakTitle = $("streakTitle");
  const streakDesc = $("streakDesc");
  const streakStatus = $("streakStatus");

  const prestigeInfo = $("prestigeInfo");
  const prestigeBtn = $("prestigeBtn");
  const prestigeModal = $("prestigeModal");
  const prestigeModalText = $("prestigeModalText");
  const prestigeCancel = $("prestigeCancel");
  const prestigeConfirm = $("prestigeConfirm");

  const achListEl = $("achList");
  const toastEl = $("toast");

  const bodyEl = document.body;

  // State
  const SAVE_KEY = "cityflip_save_final_v1";

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

  const ACH_LIST = [
    { key: "firstTap",      title: "First Tap",        desc: "Tap any tile once." },
    { key: "firstUpgrade",  title: "First Upgrade",    desc: "Upgrade any tile once." },
    { key: "firstPassive",  title: "Passive Income",   desc: "Buy your first passive upgrade." },
    { key: "earn10k",       title: "Big Money",        desc: "Earn $10K total (lifetime)." },
    { key: "tap1000",       title: "Tap Machine",      desc: "Tap 1,000 times." },
    { key: "streak3",       title: "3-Day Streak",     desc: "Claim daily reward 3 days in a row." },
    { key: "streak7",       title: "7-Day Streak",     desc: "Claim daily reward 7 days in a row." },
    { key: "prestige1",     title: "Rebuilder",        desc: "Prestige once." },
    { key: "prestige5",     title: "City Tycoon",      desc: "Prestige 5 times." }
  ];

  const defaultState = () => ({
    cash: 0,
    perTap: 1,
    perSec: 0,

    tapBoostLevel: 0,
    passiveLevel: 0,
    cityDevLevel: 0,

    tiles: Array.from({ length: 9 }, () => ({ level: 0 })),

    boost: { mult: 1, endsAt: 0, cooldownEndsAt: 0 },

    daily: { streak: 0, lastClaimDay: "" },

    stats: { taps: 0, totalEarned: 0 },

    achievements: {
      firstTap:false, firstUpgrade:false, firstPassive:false,
      earn10k:false, tap1000:false,
      streak3:false, streak7:false,
      prestige1:false, prestige5:false
    },

    prestige: {
      count: 0,
      mult: 1
    },

    settings: { sound: true, haptics: true, theme: "neon" },

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
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function daysBetween(olderKey, newerKey) {
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

  let toastTimer = null;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.style.display = "block";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastEl.style.display = "none"), 1200);
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

  // ---------- Multipliers ----------
  function boostMult() {
    const now = Date.now();
    return (state.boost.endsAt && now < state.boost.endsAt) ? (state.boost.mult || 2) : 1;
  }
  function totalMult() {
    return (state.prestige.mult || 1) * boostMult();
  }

  // ---------- Reward boost (simulated) ----------
  function activateBoost(mult, seconds) {
    const now = Date.now();
    state.boost.mult = mult;
    state.boost.endsAt = now + seconds * 1000;
    state.boost.cooldownEndsAt = now + 5 * 60 * 1000; // 5 min cooldown
    log(`⚡ Boost activated: ${mult}x for ${seconds}s`);
    toast("Boost activated!");
    save();
    updateUI();
  }

  rewardBtn?.addEventListener("click", () => {
    const now = Date.now();
    if (now < (state.boost.cooldownEndsAt || 0)) return;
    clickSound(); hapticTap();
    // Simulated: immediately grant boost
    activateBoost(2, 60);
  });

  function updateBoostUI() {
    const now = Date.now();
    const active = state.boost.endsAt && now < state.boost.endsAt;
    const cd = state.boost.cooldownEndsAt && now < state.boost.cooldownEndsAt;

    if (active) {
      boostBar.style.display = "flex";
      const remaining = (state.boost.endsAt - now) / 1000;
      boostPill.textContent = `${state.boost.mult || 2}x • ${fmtTime(remaining)}`;
      rewardBtn && (rewardBtn.disabled = true);
      rewardStatus && (rewardStatus.textContent = "Boost active");
    } else {
      boostBar.style.display = "none";
      if (cd) {
        const left = (state.boost.cooldownEndsAt - now) / 1000;
        rewardBtn && (rewardBtn.disabled = true);
        rewardStatus && (rewardStatus.textContent = `Cooldown: ${fmtTime(left)}`);
      } else {
        rewardBtn && (rewardBtn.disabled = false);
        rewardStatus && (rewardStatus.textContent = "Ready");
      }
    }
  }

  // ---------- Achievements ----------
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

  function unlockAch(key) {
    if (state.achievements[key]) return;
    state.achievements[key] = true;
    const title = ACH_LIST.find(a => a.key === key)?.title ?? key;
    log(`🏆 Achievement unlocked: ${title}`);
    toast(`🏆 ${title}`);
    clickSound(); hapticTap();
    save();
    renderAchievements();
  }

  function checkAchievements() {
    if (state.stats.taps >= 1) unlockAch("firstTap");
    if (state.stats.totalEarned >= 10000) unlockAch("earn10k");
    if (state.stats.taps >= 1000) unlockAch("tap1000");
    if (state.daily.streak >= 3) unlockAch("streak3");
    if (state.daily.streak >= 7) unlockAch("streak7");
    if (state.prestige.count >= 1) unlockAch("prestige1");
    if (state.prestige.count >= 5) unlockAch("prestige5");
  }

  // ---------- Daily streak ----------
  function dailyRewardAmount(dayNumber) {
    const d = Math.max(1, Math.min(7, dayNumber));
    const base = 200 * d;
    const scale = 1 + (state.cityDevLevel * 0.15) + (state.passiveLevel * 0.10) + (state.prestige.count * 0.10);
    return Math.floor(base * scale);
  }

  function updateDailyUI() {
    const t = todayKey();
    const gap = daysBetween(state.daily.lastClaimDay, t);
    const already = (gap === 0);
    const willReset = (state.daily.lastClaimDay && gap >= 2);

    const nextDay = willReset ? 1 : (state.daily.streak + 1);
    const amt = dailyRewardAmount(nextDay);

    streakTitle.textContent = `Day ${nextDay} Reward`;
    streakDesc.textContent = `Claim ${formatMoney(amt)}. Current streak: ${state.daily.streak} day(s).`;
    streakStatus.textContent = already ? "Claimed today" : (willReset ? "Missed a day (resets)" : "Ready");
    claimDailyBtn.disabled = already;
  }

  function claimDaily() {
    const t = todayKey();
    const gap = daysBetween(state.daily.lastClaimDay, t);
    if (gap === 0) return;

    if (state.daily.lastClaimDay && gap >= 2) state.daily.streak = 0;

    state.daily.streak += 1;
    state.daily.lastClaimDay = t;

    const amt = dailyRewardAmount(state.daily.streak);
    state.cash += amt;
    state.stats.totalEarned += amt;

    log(`🎁 Daily claimed! +${formatMoney(amt)} (Streak: ${state.daily.streak})`);
    toast("Daily claimed!");
    clickSound(); hapticTap();

    save();
    updateUI();
    renderTiles();
    checkAchievements();
  }

  claimDailyBtn?.addEventListener("click", claimDaily);

  // ---------- Tile math ----------
  function tileTapBonus(i) {
    const perTileLevel = state.tiles[i]?.level ?? 0;
    return 1 + state.cityDevLevel + perTileLevel;
  }
  function tileUpgradeCost(i) {
    const lvl = state.tiles[i]?.level ?? 0;
    const base = 30 + i * 6;
    return Math.floor(base * Math.pow(1.65, lvl));
  }
  function tileTapEarn(i) {
    return (state.perTap + tileTapBonus(i)) * totalMult();
  }

  // ---------- Render tiles ----------
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

        clickSound(); hapticTap();
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

        clickSound(); hapticTap();
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

  // ---------- Prestige ----------
  function prestigeRequirement() {
    // simple gate: require $1,000,000 on-hand to prestige, then scales
    return Math.floor(1_000_000 * Math.pow(1.6, state.prestige.count));
  }

  function prestigeNextMult() {
    // +10% each prestige
    return 1 + 0.10 * (state.prestige.count + 1);
  }

  function updatePrestigeUI() {
    const req = prestigeRequirement();
    const can = state.cash >= req;

    prestigeInfo.textContent =
      `Multiplier: ${state.prestige.mult.toFixed(2)}x • Next at ${formatMoney(req)}`;

    prestigeBtn.disabled = !can;
  }

  function openPrestigeModal() {
    const req = prestigeRequirement();
    const next = prestigeNextMult();
    prestigeModalText.textContent =
      `This will reset your cash, upgrades, and tile levels.\n\nYou will gain a permanent multiplier: ${next.toFixed(2)}x.\n\nRequirement: ${formatMoney(req)} cash.`;
    prestigeModal.style.display = "flex";
  }
  function closePrestigeModal() {
    prestigeModal.style.display = "none";
  }

  prestigeBtn.addEventListener("click", () => {
    if (state.cash < prestigeRequirement()) return;
    openPrestigeModal();
  });
  prestigeCancel.addEventListener("click", closePrestigeModal);

  prestigeConfirm.addEventListener("click", () => {
    if (state.cash < prestigeRequirement()) { closePrestigeModal(); return; }

    state.prestige.count += 1;
    state.prestige.mult = 1 + 0.10 * state.prestige.count;

    // reset “progress” but keep: settings, achievements, daily, lifetime stats, prestige
    state.cash = 0;
    state.perTap = 1;
    state.perSec = 0;
    state.tapBoostLevel = 0;
    state.passiveLevel = 0;
    state.cityDevLevel = 0;
    state.tiles = Array.from({ length: 9 }, () => ({ level: 0 }));

    // reset boost timers
    state.boost = { mult: 1, endsAt: 0, cooldownEndsAt: 0 };

    closePrestigeModal();
    log(`✨ Prestige! Permanent multiplier is now ${state.prestige.mult.toFixed(2)}x`);
    toast("Prestige complete!");
    clickSound(); hapticTap();

    save();
    renderTiles();
    updateUI();
    renderAchievements();
    checkAchievements();
  });

  // ---------- Settings ----------
  soundToggleEl.addEventListener("change", () => {
    state.settings.sound = !!soundToggleEl.checked;
    save();
    if (state.settings.sound) clickSound();
  });
  hapticToggleEl.addEventListener("change", () => {
    state.settings.haptics = !!hapticToggleEl.checked;
    save();
    if (state.settings.haptics) hapticTap();
  });
  themeSelectEl?.addEventListener("change", () => {
    applyTheme(themeSelectEl.value);
    clickSound(); hapticTap();
    log(`Theme set to ${state.settings.theme}.`);
    save();
  });

  // ---------- Offline + loops ----------
  function showOfflineModal(amount) {
    offlineTextEl.textContent = `You earned ${formatMoney(amount)} while away.`;
    offlineModalEl.style.display = "flex";
  }
  offlineOkEl.addEventListener("click", () => {
    offlineModalEl.style.display = "none";
    save();
  });

  function tick() {
    const now = Date.now();
    const dt = (now - state.lastTick) / 1000;
    state.lastTick = now;

    if (dt > 0 && state.perSec > 0) {
      const earned = (state.perSec * totalMult()) * dt;
      state.cash += earned;
      state.stats.totalEarned += earned;
      maybeSaveSoon();
      checkAchievements();
    }

    updateBoostUI();
    updateDailyUI();
    updatePrestigeUI();
    updateUINumbersOnly();
  }

  function updateUINumbersOnly() {
    cashEl.textContent = formatMoney(state.cash);
    perTapEl.textContent = formatMoney(state.perTap * totalMult());
    perSecEl.textContent = `${formatMoney(state.perSec * totalMult())}/s`;
  }

  function updateUI() {
    updateUINumbersOnly();

    tapBoostPriceEl.textContent = formatMoney(priceTapBoost());
    passivePriceEl.textContent = formatMoney(pricePassive());
    tileUpPriceEl.textContent = formatMoney(priceCityDev());

    buyTapBoostBtn.disabled = state.cash < priceTapBoost();
    buyPassiveBtn.disabled = state.cash < pricePassive();
    buyTileUpBtn.disabled = state.cash < priceCityDev();

    soundToggleEl.checked = !!state.settings.sound;
    hapticToggleEl.checked = !!state.settings.haptics;
    themeSelectEl.value = state.settings.theme;

    // Update tile upgrade buttons quickly
    const buttons = tilesEl.querySelectorAll(".tileBtn");
    buttons.forEach((btn, idx) => {
      const cost = tileUpgradeCost(idx);
      btn.disabled = state.cash < cost;
      btn.textContent = `Upgrade (${formatMoney(cost)})`;
    });

    updateBoostUI();
    updateDailyUI();
    updatePrestigeUI();
  }

  // ---------- Save / Load ----------
  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      toast("Saved");
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

  let saveTimer = null;
  function maybeSaveSoon() {
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
      saveTimer = null;
      save();
    }, 1200);
  }

  // Export / Import
  exportBtn.addEventListener("click", async () => {
    const data = JSON.stringify(state);
    try {
      await navigator.clipboard.writeText(data);
      log("Export copied to clipboard.");
      toast("Export copied");
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

      const d = defaultState();
      state = { ...d, ...obj };

      // normalize shapes
      state.tiles = Array.isArray(obj.tiles) && obj.tiles.length === 9
        ? obj.tiles.map(t => ({ level: Math.max(0, (t?.level ?? 0) | 0) }))
        : d.tiles;

      state.boost = { ...d.boost, ...(obj.boost || {}) };
      state.daily = { ...d.daily, ...(obj.daily || {}) };
      state.stats = { ...d.stats, ...(obj.stats || {}) };
      state.achievements = { ...d.achievements, ...(obj.achievements || {}) };
      state.prestige = { ...d.prestige, ...(obj.prestige || {}) };
      state.settings = { ...d.settings, ...(obj.settings || {}) };

      state.lastTick = Date.now();

      applyTheme(state.settings.theme);

      save();
      renderTiles();
      renderAchievements();
      updateUI();
      checkAchievements();
      log("Imported save successfully.");
      toast("Imported");
    } catch (e) {
      log("Import failed (invalid data).");
      alert("Import failed. Data was not valid.");
    }
  });

  resetBtn.addEventListener("click", () => {
    if (!confirm("Reset all progress?")) return;
    const keepSettings = state.settings;
    state = defaultState();
    state.settings = keepSettings; // keep preferences
    applyTheme(state.settings.theme);
    save();
    renderTiles();
    renderAchievements();
    updateUI();
    log("Progress reset.");
    toast("Reset");
  });

  // Save on background/close
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") save();
  });
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
    // normalize for older saves
    const d = defaultState();

    if (!Array.isArray(state.tiles) || state.tiles.length !== 9) state.tiles = d.tiles;
    else state.tiles = state.tiles.map(t => ({ level: Math.max(0, (t?.level ?? 0) | 0) }));

    state.boost = { ...d.boost, ...(state.boost || {}) };
    state.daily = { ...d.daily, ...(state.daily || {}) };
    state.stats = { ...d.stats, ...(state.stats || {}) };
    state.achievements = { ...d.achievements, ...(state.achievements || {}) };
    state.prestige = { ...d.prestige, ...(state.prestige || {}) };
    state.settings = { ...d.settings, ...(state.settings || {}) };

    applyTheme(state.settings.theme);

    // offline earnings (cap 8 hours)
    const now = Date.now();
    const last = state.lastTick || now;
    const offlineSec = Math.min(8 * 3600, Math.max(0, (now - last) / 1000));
    if (offlineSec > 1 && state.perSec > 0) {
      const earned = (state.perSec * totalMult()) * offlineSec;
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
    log("✅ Final build loaded: Daily + Achievements + Boost + Prestige + Skins + Ads placeholders.");

    setInterval(tick, 250);
    setInterval(save, 6000);
    save();
  })();
})();
