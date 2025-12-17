/* City Flip (v200) — Merge + Upgrades + Daily + Prestige + Offline + Save + SW clear tools */

const $ = (s) => document.querySelector(s);

const fmt = (n) => {
  n = Number(n) || 0;
  if (n >= 1e9) return (n/1e9).toFixed(2).replace(/\.?0+$/,'') + "B";
  if (n >= 1e6) return (n/1e6).toFixed(2).replace(/\.?0+$/,'') + "M";
  if (n >= 1e3) return (n/1e3).toFixed(2).replace(/\.?0+$/,'') + "K";
  return Math.floor(n).toString();
};

const SAVE_KEY = "cityflip_save_v200";
const SETTINGS_KEY = "cityflip_settings_v200";

const BUILDINGS = [
  { name: "House", icon:"🏠", base: 1 },
  { name: "Shop", icon:"🏪", base: 3 },
  { name: "Office", icon:"🏢", base: 8 },
  { name: "Tower", icon:"🏙️", base: 20 },
  { name: "Mega", icon:"🌆", base: 60 },
  { name: "Arcology", icon:"🌇", base: 150 },
  { name: "Skyline HQ", icon:"🛰️", base: 400 },
  { name: "Neo Core", icon:"✨", base: 1200 },
  { name: "Eclipse Hub", icon:"🌙", base: 3500 },
  { name: "Zenith", icon:"🌟", base: 9000 }
];

const state = {
  coins: 50,
  cols: 5,
  tiles: [],
  selected: null,

  upgrades: {
    incomeMult: 1.0,
    costDiscount: 0.0,
    spawnDiscount: 0.0,
    offlineMult: 1.0,
    collectBonus: 0.0,
    prestigeMult: 1.0
  },

  prestige: { points: 0 },

  settings: {
    sound: true,
    reducedMotion: false,
    offlineEarnings: true
  },

  meta: {
    lastSeen: Date.now(),
    lastDaily: 0,
    mergesTotal: 0,
    highestTier: 0,
    achievements: {}
  }
};

/* ---------- init helpers ---------- */
function gridSize(){ return state.cols * state.cols; }
function makeTiles(cols){ return Array.from({length: cols*cols}, ()=>({tier:0})); }
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

function tierInfo(tier){
  if(tier <= 0) return { name:"Empty", icon:"➕", base:0 };
  return BUILDINGS[Math.min(tier-1, BUILDINGS.length-1)];
}
function incomeTier(tier){
  if(tier <= 0) return 0;
  const b = BUILDINGS[Math.min(tier-1, BUILDINGS.length-1)];
  const growth = 1 + (tier-1)*0.55;
  const prestigeBoost = state.upgrades.prestigeMult * (1 + state.prestige.points*0.02);
  return b.base * growth * state.upgrades.incomeMult * prestigeBoost;
}
function totalIPS(){
  return state.tiles.reduce((sum,t)=> sum + incomeTier(t.tier||0), 0);
}
function placeCost(){
  const base = 20;
  const scaled = base * (1 + state.meta.highestTier*0.12);
  const discounted = scaled * (1 - state.upgrades.spawnDiscount) * (1 - state.upgrades.costDiscount*0.6);
  return Math.max(5, Math.floor(discounted));
}

/* ---------- audio ---------- */
let audioCtx = null;
function ensureAudio(){
  if(!state.settings.sound) return null;
  if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function blip(kind="tap"){
  if(!state.settings.sound) return;
  const ctx = ensureAudio();
  if(!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  const now = ctx.currentTime;

  const f = { tap:520, place:640, merge:740, buy:620, fail:220, daily:880, prestige:460 }[kind] || 520;

  o.type = (kind === "fail") ? "triangle" : "sine";
  o.frequency.setValueAtTime(f, now);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.06, now+0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now+0.10);
  o.connect(g); g.connect(ctx.destination);
  o.start(now); o.stop(now+0.11);
}

/* ---------- UI helpers ---------- */
function showToast(msg){
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=> el.classList.remove("show"), 1400);
}
function showFeedback(title,text){
  $("#feedbackTitle").textContent = title;
  $("#feedbackText").textContent = text;
  $("#feedback").classList.add("show");
  $("#feedback").setAttribute("aria-hidden","false");
}
function hideFeedback(){
  $("#feedback").classList.remove("show");
  $("#feedback").setAttribute("aria-hidden","true");
}
function openModal(id){ const el=$(id); el.classList.add("show"); el.setAttribute("aria-hidden","false"); }
function closeModal(id){ const el=$(id); el.classList.remove("show"); el.setAttribute("aria-hidden","true"); }

function setSelected(idx){
  state.selected = idx;
  if(idx == null){
    $("#selectedChip").textContent = "Selected: None";
    return;
  }
  const t = state.tiles[idx];
  const info = tierInfo(t.tier||0);
  $("#selectedChip").textContent = `Selected: ${info.icon} ${info.name} (Tier ${t.tier||0})`;
}

function pulseTile(idx){
  const el = document.querySelector(`[data-idx="${idx}"]`);
  if(!el) return;
  el.classList.remove("pulse");
  void el.offsetWidth;
  el.classList.add("pulse");
}

/* ---------- save/load ---------- */
function saveSettings(){ localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings)); }
function loadSettings(){
  try{
    const raw = localStorage.getItem(SETTINGS_KEY);
    if(!raw) return;
    const s = JSON.parse(raw);
    if(typeof s.sound === "boolean") state.settings.sound = s.sound;
    if(typeof s.reducedMotion === "boolean") state.settings.reducedMotion = s.reducedMotion;
    if(typeof s.offlineEarnings === "boolean") state.settings.offlineEarnings = s.offlineEarnings;
  }catch(e){}
}
function applySettings(){
  $("#toggleSound").checked = !!state.settings.sound;
  $("#toggleMotion").checked = !!state.settings.reducedMotion;
  $("#toggleOffline").checked = !!state.settings.offlineEarnings;
  document.body.classList.toggle("reduced-motion", !!state.settings.reducedMotion);
}
function saveGame(show=true){
  state.meta.lastSeen = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  if(show){
    showFeedback("Saved", "Your city is stored on this device.");
    blip("tap");
  }
}
function loadGame(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw){
      state.tiles = makeTiles(state.cols);
      return;
    }
    const d = JSON.parse(raw);
    state.coins = Number(d.coins ?? state.coins);
    state.cols = [5,6].includes(d.cols) ? d.cols : state.cols;
    state.tiles = Array.isArray(d.tiles) ? d.tiles : makeTiles(state.cols);
    if(state.tiles.length !== gridSize()) state.tiles = makeTiles(state.cols);
    state.upgrades = { ...state.upgrades, ...(d.upgrades||{}) };
    state.prestige = { ...state.prestige, ...(d.prestige||{}) };
    state.settings = { ...state.settings, ...(d.settings||{}) };
    state.meta = { ...state.meta, ...(d.meta||{}) };
    state.selected = null;
  }catch(e){
    state.tiles = makeTiles(state.cols);
  }
}
function resetGame(){
  localStorage.removeItem(SAVE_KEY);
  state.coins = 50;
  state.cols = 5;
  state.tiles = makeTiles(state.cols);
  state.selected = null;
  state.upgrades = { incomeMult:1.0, costDiscount:0.0, spawnDiscount:0.0, offlineMult:1.0, collectBonus:0.0, prestigeMult:1.0 };
  state.prestige = { points: 0 };
  state.meta = { lastSeen:Date.now(), lastDaily:0, mergesTotal:0, highestTier:0, achievements:{} };
  renderAll();
  showFeedback("Reset", "Fresh start. Build something legendary.");
  blip("tap");
}

/* ---------- offline earnings ---------- */
function applyOfflineEarnings(){
  if(!state.settings.offlineEarnings) return;
  const now = Date.now();
  const last = Number(state.meta.lastSeen || now);
  const dt = clamp((now-last)/1000, 0, 60*60*12); // cap 12h
  const earned = Math.floor(totalIPS() * dt * state.upgrades.offlineMult);
  state.meta.lastSeen = now;
  if(earned > 0){
    state.coins += earned;
    showFeedback("Welcome back!", `Offline: +${fmt(earned)} coins`);
    blip("daily");
  }
}

/* ---------- gameplay ---------- */
function firstEmpty(){
  return state.tiles.findIndex(t => (t.tier||0) === 0);
}

function placeBuilding(){
  const idx = firstEmpty();
  if(idx === -1){ showToast("No empty tiles"); blip("fail"); return; }
  const cost = placeCost();
  if(state.coins < cost){ showToast("Not enough coins"); blip("fail"); return; }
  state.coins -= cost;
  state.tiles[idx].tier = 1;
  state.meta.highestTier = Math.max(state.meta.highestTier, 1);
  setSelected(idx);
  pulseTile(idx);
  showToast(`Placed 🏠 (Cost ${fmt(cost)})`);
  blip("place");
  checkAchievements();
  renderAll();
}

function onTileClick(idx){
  ensureAudio();
  const t = state.tiles[idx];
  const tier = t.tier||0;

  if(state.selected == null){
    if(tier === 0){
      const cost = placeCost();
      if(state.coins < cost){ showToast("Not enough coins"); blip("fail"); return; }
      state.coins -= cost;
      t.tier = 1;
      state.meta.highestTier = Math.max(state.meta.highestTier, 1);
      setSelected(idx);
      pulseTile(idx);
      showToast(`Placed 🏠 (Cost ${fmt(cost)})`);
      blip("place");
      checkAchievements();
      renderAll();
      return;
    }
    setSelected(idx);
    blip("tap");
    renderAll();
    return;
  }

  const fromIdx = state.selected;
  if(fromIdx === idx){
    setSelected(null);
    blip("tap");
    renderAll();
    return;
  }

  const from = state.tiles[fromIdx];
  const to = state.tiles[idx];

  if((to.tier||0) === 0){
    to.tier = from.tier;
    from.tier = 0;
    setSelected(idx);
    pulseTile(idx);
    showToast("Moved");
    blip("tap");
    renderAll();
    return;
  }

  if((to.tier||0) === (from.tier||0) && (to.tier||0) > 0){
    to.tier += 1;
    from.tier = 0;
    state.meta.mergesTotal += 1;
    state.meta.highestTier = Math.max(state.meta.highestTier, to.tier);
    setSelected(idx);
    pulseTile(idx);
    showToast(`Merged → Tier ${to.tier}!`);
    blip("merge");
    checkAchievements();
    renderAll();
    return;
  }

  setSelected(idx);
  blip("tap");
  renderAll();
}

/* ---------- bonus buttons ---------- */
function collectBonus(){
  const ips = totalIPS();
  const base = Math.max(10, Math.floor(ips * 2.75));
  const extra = Math.floor(base * state.upgrades.collectBonus);
  const total = base + extra;
  state.coins += total;
  showToast(`Collected +${fmt(total)}`);
  blip("buy");
  checkAchievements();
  renderAll();
}

function autoMergeHint(){
  const seen = new Map();
  for(let i=0;i<state.tiles.length;i++){
    const tier = state.tiles[i].tier||0;
    if(tier<=0) continue;
    if(seen.has(tier)){
      const a = seen.get(tier);
      showFeedback("Merge found!", `Merge Tier ${tier} tiles ${a+1} + ${i+1}`);
      blip("tap");
      return;
    }
    seen.set(tier, i);
  }
  showFeedback("No merges available", "Place more buildings or rearrange.");
  blip("fail");
}

/* ---------- daily reward ---------- */
function canClaimDaily(){
  const last = Number(state.meta.lastDaily || 0);
  return (Date.now() - last) >= 1000*60*60*20;
}
function claimDaily(){
  if(!canClaimDaily()){ showToast("Daily not ready"); blip("fail"); return; }
  const reward = Math.max(150, Math.floor(250 + totalIPS()*30));
  state.coins += reward;
  state.meta.lastDaily = Date.now();
  showFeedback("Daily Reward!", `+${fmt(reward)} coins`);
  blip("daily");
  checkAchievements();
  renderAll();
}

/* ---------- prestige ---------- */
function prestigeGainEstimate(){
  const worth = state.coins + totalIPS()*120;
  return Math.floor(Math.sqrt(worth / 1500));
}
function doPrestige(){
  const gain = prestigeGainEstimate();
  if(gain < 1){ showFeedback("Not ready", "Earn more before prestiging."); blip("fail"); return; }

  state.prestige.points += gain;

  state.coins = 50;
  state.cols = 5;
  state.tiles = makeTiles(state.cols);
  state.selected = null;
  state.upgrades = { incomeMult:1.0, costDiscount:0.0, spawnDiscount:0.0, offlineMult:1.0, collectBonus:0.0, prestigeMult:1.0 };
  state.meta.mergesTotal = 0;
  state.meta.highestTier = 0;

  showFeedback("Prestiged!", `+${gain} Prestige`);
  blip("prestige");
  renderAll();
}

/* ---------- upgrades ---------- */
const upgradeDefs = [
  {
    id:"incomeMult", icon:"📣",
    name:"City Marketing",
    desc:"Boost all income.",
    levelText:()=>`x${state.upgrades.incomeMult.toFixed(2)}`,
    cost:()=>{
      const lvl = Math.round((Math.log(state.upgrades.incomeMult)/Math.log(1.20)) || 0);
      return Math.floor(250 * (1 + lvl*0.75));
    },
    buy:()=>{ state.upgrades.incomeMult *= 1.20; }
  },
  {
    id:"costDiscount", icon:"🧱",
    name:"Construction Deals",
    desc:"Reduce costs (cap 35%).",
    levelText:()=>`${Math.round(state.upgrades.costDiscount*100)}%`,
    cost:()=>{
      const lvl = Math.round(state.upgrades.costDiscount / 0.05);
      return Math.floor(320 * (1 + lvl*0.95));
    },
    buy:()=>{ state.upgrades.costDiscount = Math.min(0.35, state.upgrades.costDiscount + 0.05); }
  },
  {
    id:"spawnDiscount", icon:"🏗️",
    name:"Bulk Materials",
    desc:"Reduce Place cost (cap 40%).",
    levelText:()=>`${Math.round(state.upgrades.spawnDiscount*100)}%`,
    cost:()=>{
      const lvl = Math.round(state.upgrades.spawnDiscount / 0.05);
      return Math.floor(280 * (1 + lvl*0.85));
    },
    buy:()=>{ state.upgrades.spawnDiscount = Math.min(0.40, state.upgrades.spawnDiscount + 0.05); }
  },
  {
    id:"offlineMult", icon:"🌙",
    name:"Night Shift",
    desc:"Earn more while away.",
    levelText:()=>`x${state.upgrades.offlineMult.toFixed(2)}`,
    cost:()=>{
      const lvl = Math.round((Math.log(state.upgrades.offlineMult)/Math.log(1.25)) || 0);
      return Math.floor(380 * (1 + lvl*0.90));
    },
    buy:()=>{ state.upgrades.offlineMult *= 1.25; }
  },
  {
    id:"collectBonus", icon:"🎟️",
    name:"Tourism Boom",
    desc:"Bigger Collect payouts (cap +100%).",
    levelText:()=>`+${Math.round(state.upgrades.collectBonus*100)}%`,
    cost:()=>{
      const lvl = Math.round(state.upgrades.collectBonus / 0.12);
      return Math.floor(240 * (1 + lvl*0.60));
    },
    buy:()=>{ state.upgrades.collectBonus = Math.min(1.0, state.upgrades.collectBonus + 0.12); }
  },
  {
    id:"expand", icon:"🗺️",
    name:"City Expansion",
    desc:"Expand grid from 5×5 to 6×6 (one-time).",
    levelText:()=> (state.cols === 5 ? "5×5" : "6×6"),
    cost:()=> (state.cols === 5 ? 1800 : Infinity),
    buy:()=>{
      if(state.cols !== 5) return;
      const old = state.tiles.slice();
      state.cols = 6;
      state.tiles = makeTiles(6);
      for(let i=0;i<old.length;i++) state.tiles[i] = old[i];
    }
  },
  {
    id:"prestigeMult", icon:"⭐",
    name:"Legacy Planning",
    desc:"Boost prestige effectiveness.",
    levelText:()=>`x${state.upgrades.prestigeMult.toFixed(2)}`,
    cost:()=>{
      const lvl = Math.round((Math.log(state.upgrades.prestigeMult)/Math.log(1.15)) || 0);
      return Math.floor(900 * (1 + lvl*1.1));
    },
    buy:()=>{ state.upgrades.prestigeMult *= 1.15; }
  }
];

function renderUpgrades(){
  const list = $("#upgradeList");
  list.innerHTML = "";

  upgradeDefs.forEach(def=>{
    const wrap = document.createElement("div");
    wrap.className = "upgrade";

    const icon = document.createElement("div");
    icon.className = "uIcon";
    icon.textContent = def.icon;

    const main = document.createElement("div");
    main.className = "uMain";

    const name = document.createElement("div");
    name.className = "uName";
    name.textContent = def.name;

    const desc = document.createElement("div");
    desc.className = "uDesc";
    desc.textContent = def.desc;

    const meta = document.createElement("div");
    meta.className = "uMeta";

    const badge = document.createElement("div");
    badge.className = "badge";
    badge.textContent = `Level: ${def.levelText()}`;

    const btn = document.createElement("button");
    btn.className = "btn btnPrimary";

    const rawCost = def.cost();
    const cost = Number.isFinite(rawCost)
      ? Math.floor(rawCost * (1 - state.upgrades.costDiscount))
      : Infinity;

    if(!Number.isFinite(cost)){
      btn.textContent = "Maxed";
      btn.disabled = true;
    } else {
      btn.textContent = `Buy (${fmt(cost)})`;
      btn.addEventListener("click", ()=>{
        ensureAudio();
        if(state.coins < cost){
          showToast("Not enough coins");
          blip("fail");
          return;
        }
        state.coins -= cost;
        def.buy();
        showToast("Purchased!");
        blip("buy");
        checkAchievements();
        renderAll();
      });
    }

    meta.appendChild(badge);
    meta.appendChild(btn);

    main.appendChild(name);
    main.appendChild(desc);
    main.appendChild(meta);

    wrap.appendChild(icon);
    wrap.appendChild(main);
    list.appendChild(wrap);
  });
}

/* ---------- achievements ---------- */
const achievements = [
  { id:"first_build", icon:"🏠", name:"First Build", desc:"Place your first building.", check:()=> state.tiles.some(t=> (t.tier||0) > 0) },
  { id:"first_merge", icon:"🔀", name:"First Merge", desc:"Merge once.", check:()=> state.meta.mergesTotal >= 1 },
  { id:"tier5", icon:"🌆", name:"Skyline Rising", desc:"Reach Tier 5.", check:()=> state.meta.highestTier >= 5 },
  { id:"tier10", icon:"🌟", name:"Zenith", desc:"Reach Tier 10.", check:()=> state.meta.highestTier >= 10 },
  { id:"ips1k", icon:"💸", name:"Money Machine", desc:"Reach 1,000 income/sec.", check:()=> totalIPS() >= 1000 },
  { id:"prestige1", icon:"⭐", name:"Fresh Start", desc:"Prestige at least once.", check:()=> state.prestige.points >= 1 }
];

function unlockAch(a){
  state.meta.achievements[a.id] = true;
  showToast(`Achievement: ${a.name}`);
  blip("daily");
}
function checkAchievements(){
  for(const a of achievements){
    if(state.meta.achievements[a.id]) continue;
    if(a.check()) unlockAch(a);
  }
}
function renderAchievements(){
  const el = $("#achList");
  el.innerHTML = "";
  achievements.forEach(a=>{
    const row = document.createElement("div");
    row.className = "ach";

    const icon = document.createElement("div");
    icon.className = "uIcon";
    icon.textContent = a.icon;

    const main = document.createElement("div");
    main.className = "uMain";

    const name = document.createElement("div");
    name.className = "uName";
    name.textContent = a.name;

    const desc = document.createElement("div");
    desc.className = "uDesc";
    desc.textContent = a.desc;

    const meta = document.createElement("div");
    meta.className = "uMeta";

    const badge = document.createElement("div");
    const unlocked = !!state.meta.achievements[a.id];
    badge.className = "badge " + (unlocked ? "good" : "bad");
    badge.textContent = unlocked ? "Unlocked" : "Locked";

    meta.appendChild(badge);
    main.appendChild(name);
    main.appendChild(desc);
    main.appendChild(meta);

    row.appendChild(icon);
    row.appendChild(main);
    el.appendChild(row);
  });
}

/* ---------- rendering ---------- */
function renderStats(){
  $("#coins").textContent = fmt(state.coins);
  $("#ips").textContent = fmt(totalIPS());
  $("#prestige").textContent = fmt(state.prestige.points);

  const daily = $("#btnDaily");
  daily.textContent = canClaimDaily() ? "Daily" : "Daily (locked)";
  daily.disabled = !canClaimDaily();

  const p = $("#btnPrestige");
  const gain = prestigeGainEstimate();
  p.textContent = gain >= 1 ? `Prestige (+${gain})` : "Prestige";

  // visible JS status
  const js = $("#jsStatus");
  if(js) js.textContent = "JS: Loaded ✅";
}

function tileAccent(tier){
  const palettes = [
    ["rgba(255,180,87,.22)","rgba(255,180,87,.06)"],
    ["rgba(139,233,255,.22)","rgba(139,233,255,.06)"],
    ["rgba(180,120,255,.22)","rgba(180,120,255,.06)"],
    ["rgba(255,120,180,.22)","rgba(255,120,180,.06)"]
  ];
  return palettes[tier % palettes.length];
}

function renderGrid(){
  const grid = $("#grid");
  grid.style.setProperty("--cols", String(state.cols));
  grid.innerHTML = "";

  let mergeTier = null;
  if(state.selected != null){
    const st = state.tiles[state.selected]?.tier || 0;
    if(st > 0) mergeTier = st;
  }

  state.tiles.forEach((t, idx)=>{
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tile " + ((t.tier||0) === 0 ? "empty" : "building");
    btn.dataset.idx = String(idx);

    if(state.selected === idx) btn.classList.add("selected");
    if(mergeTier && idx !== state.selected && (t.tier||0) === mergeTier) btn.classList.add("mergeable");

    const tier = t.tier || 0;
    if(tier > 0){
      const [c1, c2] = tileAccent(tier);
      btn.style.background = `
        radial-gradient(70% 70% at 30% 25%, rgba(255,255,255,.14), transparent 55%),
        radial-gradient(90% 90% at 70% 80%, ${c1}, transparent 60%),
        linear-gradient(180deg, ${c2}, rgba(255,255,255,.03))
      `;
      btn.style.borderColor = "rgba(255,180,87,.20)";
    }

    const info = tierInfo(tier);
    const ips = incomeTier(tier);

    const content = document.createElement("div");
    content.className = "content";
    content.innerHTML = `
      <div>
        <div class="name">${tier > 0 ? `${info.icon} ${info.name}` : "Empty"}</div>
        <div class="tier">${tier > 0 ? `Tier ${tier}` : `Place cost: ${fmt(placeCost())}`}</div>
      </div>
      <div>
        <div class="meta">${tier > 0 ? `+${fmt(ips)}/sec` : "Tap to place"}</div>
      </div>
    `;
    btn.appendChild(content);

    btn.addEventListener("click", ()=> onTileClick(idx));
    grid.appendChild(btn);
  });
}

function renderAll(){
  renderStats();
  renderGrid();
  renderUpgrades();
  renderAchievements();
}

/* ---------- ticks ---------- */
function tick(){
  state.coins += totalIPS() / 10;
  renderStats();
}

/* ---------- service worker tools ---------- */
async function clearServiceWorkerAndCaches(){
  if(!("serviceWorker" in navigator)) return false;

  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map(r => r.unregister()));

  if("caches" in window){
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
  }
  return true;
}

/* ---------- bind UI ---------- */
function bindUI(){
  $("#btnSpawn").addEventListener("click", ()=>{ ensureAudio(); placeBuilding(); });

  $("#btnCollect").addEventListener("click", ()=>{ ensureAudio(); collectBonus(); });
  $("#btnAutoMerge").addEventListener("click", ()=>{ ensureAudio(); autoMergeHint(); });

  $("#btnDaily").addEventListener("click", ()=>{ ensureAudio(); claimDaily(); });
  $("#btnPrestige").addEventListener("click", ()=>{ ensureAudio(); doPrestige(); });

  $("#btnSave").addEventListener("click", ()=> saveGame(true));
  $("#btnReset").addEventListener("click", resetGame);

  $("#btnHelp").addEventListener("click", ()=>{ blip("tap"); openModal("#helpOverlay"); });
  $("#helpClose").addEventListener("click", ()=>{ blip("tap"); closeModal("#helpOverlay"); });
  $("#helpOk").addEventListener("click", ()=>{ blip("tap"); closeModal("#helpOverlay"); });

  $("#btnSettings").addEventListener("click", ()=>{ blip("tap"); openModal("#settingsOverlay"); });
  $("#settingsClose").addEventListener("click", ()=>{ blip("tap"); closeModal("#settingsOverlay"); });
  $("#settingsOk").addEventListener("click", ()=>{ blip("tap"); closeModal("#settingsOverlay"); });

  $("#toggleSound").addEventListener("change", (e)=>{
    state.settings.sound = e.target.checked;
    saveSettings();
    showToast(state.settings.sound ? "Sound on" : "Sound off");
    if(state.settings.sound) ensureAudio();
  });
  $("#toggleMotion").addEventListener("change", (e)=>{
    state.settings.reducedMotion = e.target.checked;
    applySettings();
    saveSettings();
    showToast(state.settings.reducedMotion ? "Reduced motion on" : "Reduced motion off");
  });
  $("#toggleOffline").addEventListener("change", (e)=>{
    state.settings.offlineEarnings = e.target.checked;
    saveSettings();
    showToast(state.settings.offlineEarnings ? "Offline earnings on" : "Offline earnings off");
  });

  $("#feedbackOk").addEventListener("click", ()=>{ blip("tap"); hideFeedback(); });

  // overlays close when clicking background
  ["#helpOverlay", "#settingsOverlay"].forEach(id=>{
    const ov = $(id);
    ov.addEventListener("click", (e)=>{
      if(e.target === ov){ blip("tap"); closeModal(id); }
    });
  });
  $("#feedback").addEventListener("click", (e)=>{ if(e.target.id === "feedback") hideFeedback(); });

  // SW tools
  const btnClear = $("#btnClearSW");
  if(btnClear){
    btnClear.addEventListener("click", async ()=>{
      const ok = await clearServiceWorkerAndCaches();
      showFeedback("Cache cleared", ok ? "Service worker + caches removed. Reloading…" : "No service worker found.");
      setTimeout(()=> location.reload(true), 800);
    });
  }
  const btnHR = $("#btnHardReload");
  if(btnHR){
    btnHR.addEventListener("click", ()=> location.reload(true));
  }

  // autosave
  window.addEventListener("beforeunload", ()=> saveGame(false));

  // iOS audio unlock
  document.addEventListener("pointerdown", function once(){
    if(state.settings.sound) ensureAudio();
    document.removeEventListener("pointerdown", once);
  }, { once:true });
}

/* ---------- start ---------- */
function start(){
  loadSettings();
  loadGame();

  if(!Array.isArray(state.tiles) || state.tiles.length !== gridSize()){
    state.tiles = makeTiles(state.cols);
  }

  applySettings();
  setSelected(null);

  applyOfflineEarnings();
  checkAchievements();
  renderAll();
  bindUI();

  setInterval(tick, 100);
  setInterval(()=> saveGame(false), 5000);
}

start();
