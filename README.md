<!DOCTYPE html>
</head>
<script async
src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9059824893360194"
  crossorigin="anonymous"></script>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<title>City Flip</title>

<style>
  * { box-sizing: border-box; }
  :root{
    --bg:#05070f;
    --tile:#111a33;
    --tile2:#182149;
    --text:#eaf1ff;
    --muted:#9fb0d6;
    --cyan:#6ee7ff;
    --mint:#62f6b2;
    --gold:#ffd36e;
    --red:#ff6e8c;
    --violet:#b08cff;
  }

  body{
    margin:0;
    height:100vh;
    background:
      radial-gradient(1000px 700px at 30% 10%, rgba(110,231,255,.10), transparent 60%),
      radial-gradient(900px 700px at 70% 15%, rgba(98,246,178,.08), transparent 60%),
      var(--bg);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    color:var(--text);
    display:flex;
    align-items:center;
    justify-content:center;
    overflow:hidden;
    -webkit-tap-highlight-color: transparent;
  }

  #app{ text-align:center; padding:14px; width:min(520px, 100%); }

  h1{ margin:0 0 6px; letter-spacing:.6px; }
  .sub{ margin:0 0 12px; color:var(--muted); font-size:13px; }

  .toprow{
    display:flex; gap:10px; align-items:center; justify-content:center;
    flex-wrap:wrap;
    margin-bottom:10px;
  }

  .seg{
    display:flex; gap:6px;
    background:rgba(0,0,0,.22);
    border:1px solid rgba(255,255,255,.10);
    border-radius:999px;
    padding:6px;
  }
  .seg button{
    padding:10px 12px;
    border-radius:999px;
    border:none;
    background:transparent;
    color:var(--muted);
    font-weight:900;
    font-size:12px;
    cursor:pointer;
  }
  .seg button.active{
    background:rgba(110,231,255,.18);
    color:var(--text);
    box-shadow: inset 0 0 0 1px rgba(110,231,255,.25);
  }

  .btn{
    background: linear-gradient(180deg, rgba(110,231,255,.95), rgba(110,231,255,.72));
    color:#000;
    border:none;
    padding:12px 16px;
    font-size:14px;
    border-radius:14px;
    cursor:pointer;
    font-weight:950;
    box-shadow:0 12px 30px rgba(0,0,0,.35);
  }
  .btn:active{ transform: scale(.98); }

  .ghost{
    background:rgba(0,0,0,.22);
    border:1px solid rgba(255,255,255,.10);
    color:var(--text);
    box-shadow:none;
  }

  .toggles{
    display:flex; gap:10px; align-items:center; justify-content:center;
    flex-wrap:wrap;
    margin-top:6px;
  }
  .toggle{
    display:flex; gap:8px; align-items:center;
    padding:8px 10px;
    border-radius:999px;
    background:rgba(0,0,0,.22);
    border:1px solid rgba(255,255,255,.10);
    color:var(--muted);
    font-size:12px;
    user-select:none;
  }
  .toggle input{ transform: scale(1.05); }

  .hud{
    display:flex;
    justify-content:center;
    gap:10px;
    margin-top:10px;
    flex-wrap:wrap;
  }
  .pill{
    padding:8px 12px;
    border-radius:999px;
    background:rgba(0,0,0,.22);
    border:1px solid rgba(255,255,255,.10);
    font-size:12px;
    color:var(--muted);
  }
  .pill b{ color:var(--text); }

  .big{
    color:var(--text);
    font-weight:950;
  }

  .grid{
    display:grid;
    grid-template-columns: repeat(4, 74px);
    gap:12px;
    margin-top:14px;
    justify-content:center;
  }

  /* Tile */
  .card{
    width:74px;
    height:74px;
    background: linear-gradient(180deg, var(--tile2), var(--tile));
    border-radius:16px;
    display:flex;
    align-items:center;
    justify-content:center;
    cursor:pointer;
    user-select:none;
    border:1px solid rgba(255,255,255,.10);
    box-shadow:0 14px 26px rgba(0,0,0,.35);
    transform: translateZ(0);
    transition: transform 120ms ease, filter 120ms ease, box-shadow 120ms ease;
    position:relative;
    overflow:hidden;
  }
  .card:active{
    transform: scale(.96);
    filter: brightness(1.08);
  }
  .card.revealed{
    background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02));
  }
  .card.matched{
    cursor: default;
    opacity: .98;
  }

  /* FULL SIZE ICON */
  .card span{
    display:grid;
    place-items:center;
    width:100%;
    height:100%;
    font-size:54px;        /* fills the tab */
    line-height:1;
    transform: scale(.72);
    opacity:0;
    animation: popIn 160ms ease-out forwards;
    filter: drop-shadow(0 10px 18px rgba(0,0,0,.35));
  }
  @keyframes popIn{
    0%{ transform: scale(.62); opacity:0; }
    100%{ transform: scale(1); opacity:1; }
  }

  /* Flip shimmer overlay */
  .card::after{
    content:"";
    position:absolute;
    inset:-40%;
    background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,.12), transparent 70%);
    transform: translateX(-40%) rotate(10deg);
    opacity:0;
  }
  .card.revealed::after{
    opacity:1;
    animation: shimmer 420ms ease-out 1;
  }
  @keyframes shimmer{
    0%{ transform: translateX(-45%) rotate(10deg); opacity:0; }
    35%{ opacity:1; }
    100%{ transform: translateX(45%) rotate(10deg); opacity:0; }
  }

  /* Color-coded glows */
  .t-nyc{ box-shadow: 0 14px 26px rgba(0,0,0,.35), 0 0 0 1px rgba(110,231,255,.10); }
  .t-par{ box-shadow: 0 14px 26px rgba(0,0,0,.35), 0 0 0 1px rgba(176,140,255,.12); }
  .t-tok{ box-shadow: 0 14px 26px rgba(0,0,0,.35), 0 0 0 1px rgba(98,246,178,.12); }
  .t-dub{ box-shadow: 0 14px 26px rgba(0,0,0,.35), 0 0 0 1px rgba(255,211,110,.14); }

  /* Perfect match pulse */
  .perfect{
    animation: perfectPulse 650ms ease-out 1;
    border-color: rgba(255,211,110,.55) !important;
  }
  @keyframes perfectPulse{
    0%{ filter:brightness(1); transform: scale(1); }
    35%{ filter:brightness(1.25); transform: scale(1.03); }
    100%{ filter:brightness(1); transform: scale(1); }
  }

  /* Combo toast */
  #toast{
    position:fixed;
    left:50%;
    top:14%;
    transform:translate(-50%,-50%) scale(.98);
    padding:10px 14px;
    border-radius:999px;
    background:rgba(0,0,0,.65);
    border:1px solid rgba(255,255,255,.14);
    color:var(--gold);
    font-weight:950;
    letter-spacing:.3px;
    opacity:0;
    pointer-events:none;
  }
  #toast.show{
    animation: toast 900ms ease-out 1;
  }
  @keyframes toast{
    0%{ opacity:0; transform:translate(-50%,-50%) scale(.94); }
    20%{ opacity:1; transform:translate(-50%,-50%) scale(1.02); }
    100%{ opacity:0; transform:translate(-50%,-70%) scale(1); }
  }

  /* Responsive */
  @media (max-width: 380px){
    .grid{ grid-template-columns: repeat(4, 68px); gap:10px; }
    .card{ width:68px; height:68px; border-radius:14px; }
    .card span{ font-size:50px; }
  }
</style>
</head>

<body>
<div id="toast"></div>

<div id="app">
  <h1>City Flip</h1>
  <div class="sub">Flip tiles. Match cities. Go fast.</div>

  <div class="toprow">
    <div class="seg" aria-label="mode selector">
      <button id="mClassic" class="active">Classic</button>
      <button id="mTime">Time</button>
      <button id="mDaily">Daily</button>
    </div>

    <button class="btn" id="startBtn">Start</button>
    <button class="btn ghost" id="shareBtn" title="Copy a challenge link">Share</button>
  </div>

  <div class="toggles">
    <label class="toggle"><input id="soundToggle" type="checkbox" checked> Sound</label>
    <label class="toggle"><input id="musicToggle" type="checkbox" checked> Music</label>
  </div>

  <div class="hud">
    <div class="pill">Time: <b id="time" class="big">—</b></div>
    <div class="pill">Score: <b id="score" class="big">0</b></div>
    <div class="pill">Matches: <b id="matches">0</b>/8</div>
    <div class="pill">Streak: <b id="streak">0</b></div>
    <div class="pill">Perfect: <b id="perfect">0</b></div>
  </div>

  <div class="grid" id="grid"></div>

  <div class="sub" id="dailyNote" style="margin-top:10px; display:none;">
    Daily board is the same for everyone today. One best score counts.
  </div>
</div>

<script>
/* =========================
   Seeded RNG (Daily boards)
   ========================= */
function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i=0;i<str.length;i++){
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= (h >>> 16)) >>> 0;
  }
}
function mulberry32(a){
  return function(){
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}
function seededShuffle(arr, seedStr){
  const seed = xmur3(seedStr)();
  const rnd = mulberry32(seed);
  for(let i=arr.length-1;i>0;i--){
    const j = Math.floor(rnd()*(i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function todayKey(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

/* =========================
   Audio (iPhone-safe)
   ========================= */
let audioCtx = null;
let soundOn = true;
let musicOn = true;
let musicTimer = null;
let musicGain = null;

function ensureAudio(){
  try{
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if(audioCtx.state === "suspended") audioCtx.resume();
  }catch(e){
    soundOn = false; musicOn = false;
  }
}

function tone(freq=440, dur=0.08, type="sine", gain=0.04){
  if(!soundOn) return;
  ensureAudio(); if(!audioCtx) return;
  const t0 = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0+0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(t0); o.stop(t0+dur+0.02);
}

function sfxFlip(){ tone(520,0.045,"sine",0.025); }
function sfxMatch(){ tone(660,0.06,"triangle",0.05); setTimeout(()=>tone(880,0.08,"triangle",0.04),35); }
function sfxPerfect(){ tone(740,0.08,"sine",0.05); setTimeout(()=>tone(1110,0.10,"sine",0.04),55); }
function sfxMiss(){ tone(180,0.12,"sawtooth",0.035); setTimeout(()=>tone(120,0.12,"square",0.02),45); }
function sfxCombo(){ tone(420,0.07,"square",0.03); setTimeout(()=>tone(630,0.08,"square",0.03),50); }
function sfxWin(){ tone(523,0.10,"triangle",0.05); setTimeout(()=>tone(659,0.10,"triangle",0.045),35); setTimeout(()=>tone(784,0.14,"triangle",0.04),70); }
function sfxLose(){ tone(160,0.18,"sawtooth",0.04); setTimeout(()=>tone(110,0.20,"sawtooth",0.03),80); }

function startMusic(){
  if(!musicOn) return;
  ensureAudio(); if(!audioCtx) return;
  stopMusic();
  musicGain = audioCtx.createGain();
  musicGain.gain.value = 0.06;
  musicGain.connect(audioCtx.destination);

  const bpm = 112;
  const stepMs = (60000/bpm)/2;
  const scale = [0,3,5,7,10]; // minor pentatonic
  const base = 220;
  let step = 0;

  musicTimer = setInterval(()=>{
    if(!musicOn || !audioCtx || audioCtx.state!=="running") return;
    const degree = scale[step % scale.length] + (step % 10 >= 5 ? 12 : 0);
    const freq = base * Math.pow(2, degree/12);

    const t0 = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.02, t0+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0+0.18);
    o.connect(g); g.connect(musicGain);
    o.start(t0); o.stop(t0+0.2);

    // soft kick
    if(step % 8 === 0){
      const o2 = audioCtx.createOscillator();
      const g2 = audioCtx.createGain();
      o2.type="sine";
      o2.frequency.setValueAtTime(65, t0);
      g2.gain.setValueAtTime(0.0001, t0);
      g2.gain.exponentialRampToValueAtTime(0.015, t0+0.01);
      g2.gain.exponentialRampToValueAtTime(0.0001, t0+0.12);
      o2.connect(g2); g2.connect(musicGain);
      o2.start(t0); o2.stop(t0+0.14);
    }

    step++;
  }, stepMs);
}

function stopMusic(){
  if(musicTimer){ clearInterval(musicTimer); musicTimer=null; }
  if(musicGain){ try{ musicGain.disconnect(); }catch(e){} musicGain=null; }
}

/* =========================
   Game setup
   ========================= */
const symbols = [
  { icon:"🏙️", type:"nyc" },
  { icon:"🌆", type:"par" },
  { icon:"🌃", type:"tok" },
  { icon:"🌇", type:"dub" },
  { icon:"🏢", type:"nyc" },
  { icon:"🏬", type:"par" },
  { icon:"🏦", type:"tok" },
  { icon:"🏨", type:"dub" }
];

let mode = "classic"; // classic | time | daily
let deck = [];
let first = null;
let firstTime = 0;
let lock = false;

let matchedPairs = 0;
let streak = 0;
let perfectCount = 0;
let score = 0;

let timeLeft = 60;
let timer = null;
let started = false;
let ended = false;
let dailySeedStr = "";

const grid = document.getElementById("grid");
const matchesEl = document.getElementById("matches");
const streakEl = document.getElementById("streak");
const perfectEl = document.getElementById("perfect");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const startBtn = document.getElementById("startBtn");
const shareBtn = document.getElementById("shareBtn");
const toast = document.getElementById("toast");
const dailyNote = document.getElementById("dailyNote");

const mClassic = document.getElementById("mClassic");
const mTime = document.getElementById("mTime");
const mDaily = document.getElementById("mDaily");

const soundToggle = document.getElementById("soundToggle");
const musicToggle = document.getElementById("musicToggle");

soundToggle.addEventListener("change", ()=> soundOn = soundToggle.checked);
musicToggle.addEventListener("change", ()=>{
  musicOn = musicToggle.checked;
  if(!musicOn) stopMusic();
});

function setMode(next){
  mode = next;
  mClassic.classList.toggle("active", mode==="classic");
  mTime.classList.toggle("active", mode==="time");
  mDaily.classList.toggle("active", mode==="daily");
  dailyNote.style.display = (mode==="daily") ? "block" : "none";
  resetRun();
}

mClassic.onclick = ()=> setMode("classic");
mTime.onclick = ()=> setMode("time");
mDaily.onclick = ()=> setMode("daily");

function toastShow(msg){
  toast.textContent = msg;
  toast.classList.remove("show");
  // force reflow
  void toast.offsetWidth;
  toast.classList.add("show");
}

function updateHUD(){
  matchesEl.textContent = matchedPairs;
  streakEl.textContent = streak;
  perfectEl.textContent = perfectCount;
  scoreEl.textContent = score;
  timeEl.textContent = (mode==="time") ? `${Math.max(0, Math.ceil(timeLeft))}s` : "—";
}

function buildDeck(){
  const base = [...symbols, ...symbols].map(x=>({ ...x }));
  if(mode === "daily"){
    dailySeedStr = "CITYFLIP|" + todayKey();
    deck = seededShuffle(base, dailySeedStr);
  }else{
    deck = base.sort(()=>Math.random()-0.5);
  }
}

function resetRun(){
  stopTimer();
  started = false;
  ended = false;
  lock = false;
  first = null;
  firstTime = 0;

  matchedPairs = 0;
  streak = 0;
  perfectCount = 0;
  score = 0;

  timeLeft = 60;

  grid.innerHTML = "";
  buildDeck();

  deck.forEach(item=>{
    const card = document.createElement("div");
    card.className = `card t-${item.type}`;
    card.dataset.icon = item.icon;
    card.dataset.type = item.type;
    card.dataset.matched = "0";
    card.onclick = ()=> flip(card);
    grid.appendChild(card);
  });

  updateHUD();
}

function startRun(){
  // iOS audio must start on user interaction
  ensureAudio();
  if(musicOn && !musicTimer) startMusic();

  started = true;
  ended = false;
  if(mode === "time"){
    startTimer();
  }
}

function startTimer(){
  stopTimer();
  const tick = ()=>{
    timeLeft -= 0.1;
    if(timeLeft <= 0){
      timeLeft = 0;
      updateHUD();
      endRun(false);
      return;
    }
    updateHUD();
  };
  timer = setInterval(tick, 100);
}
function stopTimer(){
  if(timer){ clearInterval(timer); timer=null; }
}

function reveal(card){
  card.innerHTML = `<span>${card.dataset.icon}</span>`;
  card.classList.add("revealed");
}
function hide(card){
  card.innerHTML = "";
  card.classList.remove("revealed");
}
function markMatched(card){
  card.dataset.matched = "1";
  card.classList.add("matched");
}

function scoreMatch(isPerfect){
  // Base points + streak multiplier
  const mult = Math.min(6, Math.max(1, streak)); // cap to keep sane
  let pts = 100 * mult;
  if(isPerfect) pts += 120;
  score += pts;

  // In Time mode: perfect match adds time
  if(mode==="time" && isPerfect){
    timeLeft = Math.min(60, timeLeft + 2.0);
  }
}

function endRun(won){
  if(ended) return;
  ended = true;
  stopTimer();
  stopMusic();

  if(won) sfxWin(); else sfxLose();

  // Daily best (local)
  if(mode==="daily"){
    const key = "CITYFLIP_DAILY_BEST_" + todayKey();
    const best = Number(localStorage.getItem(key) || "0");
    if(score > best){
      localStorage.setItem(key, String(score));
      toastShow("NEW DAILY BEST 🏆 " + score);
    }else{
      toastShow("Daily best: " + best);
    }
  }

  setTimeout(()=>{
    alert(won ? "Board Cleared! 🏁" : (mode==="time" ? "Time's Up! ⏳" : "Try again!"));
  }, 120);
}

function flip(card){
  if(lock) return;
  if(ended) return;
  if(card.dataset.matched === "1") return;
  if(card.classList.contains("revealed")) return;

  if(!started) startRun();

  sfxFlip();
  reveal(card);

  if(!first){
    first = card;
    firstTime = Date.now();
    return;
  }

  const second = card;

  // Match?
  if(first.dataset.icon === second.dataset.icon){
    const dt = Date.now() - firstTime;
    const isPerfect = dt <= 900;

    markMatched(first);
    markMatched(second);

    matchedPairs++;
    streak++;

    if(isPerfect){
      perfectCount++;
      first.classList.add("perfect");
      second.classList.add("perfect");
      setTimeout(()=>{ first.classList.remove("perfect"); second.classList.remove("perfect"); }, 700);
      sfxPerfect();
    }else{
      sfxMatch();
    }

    // score + combo toast
    scoreMatch(isPerfect);
    if(streak >= 3){
      sfxCombo();
      toastShow("COMBO x" + streak + "!");
    }

    updateHUD();
    first = null;

    // win
    if(matchedPairs >= 8){
      endRun(true);
    }
    return;
  }

  // Miss
  lock = true;
  streak = 0;
  sfxMiss();
  updateHUD();

  const a = first;
  const b = second;
  setTimeout(()=>{
    hide(a);
    hide(b);
    first = null;
    lock = false;
  }, 650);
}

/* =========================
   Share (works great for TikTok)
   ========================= */
function currentShareUrl(){
  const u = new URL(window.location.href);
  // Keep it simple: share Daily mode link when in Daily
  if(mode === "daily"){
    u.searchParams.set("mode", "daily");
  }else if(mode === "time"){
    u.searchParams.set("mode", "time");
  }else{
    u.searchParams.delete("mode");
  }
  return u.toString();
}

async function share(){
  const url = currentShareUrl();
  const msg = (mode==="daily")
    ? `City Flip Daily (${todayKey()}): I scored ${score} 🏙️ Can you beat me? ${url}`
    : (mode==="time")
      ? `City Flip Time Attack: I scored ${score} in 60s ⏱️ Beat me: ${url}`
      : `City Flip: I scored ${score} 🏙️ Try it: ${url}`;

  try{
    await navigator.clipboard.writeText(msg);
    toastShow("Copied! Paste in TikTok 👇");
  }catch(e){
    // fallback
    const ta = document.createElement("textarea");
    ta.value = msg;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    toastShow("Copied! Paste in TikTok 👇");
  }
}

shareBtn.addEventListener("click", ()=>{
  ensureAudio();
  if(musicOn && !musicTimer) startMusic();
  share();
});

startBtn.addEventListener("click", ()=>{
  ensureAudio();
  if(musicOn && !musicTimer) startMusic();
  resetRun();
});

/* =========================
   URL Mode Auto-select
   ========================= */
(function init(){
  const u = new URL(window.location.href);
  const m = u.searchParams.get("mode");
  if(m === "daily") setMode("daily");
  else if(m === "time") setMode("time");
  else setMode("classic");
  resetRun();
})();
</script>
</body>
</html>
