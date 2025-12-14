<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Google AdSense (verification + web ads) -->
  <script async
    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9059824893360194"
    crossorigin="anonymous"></script>

  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <title>City Flip</title>

  <style>
    * { box-sizing: border-box; }

    body {
      margin: 0;
      height: 100vh;
      background: radial-gradient(circle at top, #1a245f, #05070f);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #fff;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
    }

    #app {
      width: min(420px, 100%);
      padding: 14px;
      text-align: center;
    }

    h1 { margin: 6px 0; }
    .sub { opacity: .7; font-size: 13px; margin-bottom: 10px; }

    .seg {
      display: flex;
      justify-content: center;
      gap: 6px;
      margin-bottom: 10px;
    }

    .seg button {
      padding: 8px 14px;
      border-radius: 999px;
      border: none;
      background: #111a33;
      color: #9fb0d6;
      font-weight: 700;
      cursor: pointer;
    }

    .seg button.active {
      background: #6ee7ff;
      color: #000;
    }

    .btn {
      padding: 12px 18px;
      border-radius: 14px;
      border: none;
      background: linear-gradient(#6ee7ff, #4fd3e8);
      color: #000;
      font-weight: 900;
      margin: 6px;
      cursor: pointer;
    }

    .hud {
      display: flex;
      justify-content: center;
      gap: 12px;
      font-size: 12px;
      opacity: .85;
      margin-top: 8px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(4, 70px);
      gap: 12px;
      justify-content: center;
      margin-top: 14px;
    }

    .card {
      width: 70px;
      height: 70px;
      border-radius: 16px;
      background: #111a33;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform .12s;
      user-select: none;
    }

    .card:active { transform: scale(.95); }
    .card.revealed { background: #182149; }
    .card.matched { opacity: .85; }

    .card span {
      font-size: 52px;
      line-height: 1;
    }
  </style>
</head>

<body>
<div id="app">
  <h1>City Flip</h1>
  <div class="sub">Flip fast. Match cities.</div>

  <div class="seg">
    <button id="classic" class="active">Classic</button>
    <button id="time">Time</button>
    <button id="daily">Daily</button>
  </div>

  <button class="btn" id="start">Start</button>

  <div class="hud">
    <div>⏱ <span id="timeVal">—</span></div>
    <div>⭐ <span id="scoreVal">0</span></div>
  </div>

  <div class="grid" id="grid"></div>
</div>

<script>
/* =========================
   GAME DATA
========================= */
const icons = ["🏙️","🌆","🌃","🌇","🏢","🏬","🏦","🏨"];
let deck = [];
let first = null;
let lock = false;
let score = 0;
let timeLeft = 60;
let timer = null;
let mode = "classic";

/* =========================
   MONETIZATION (STUB)
   Replace with AdMob in app
========================= */
function rewardedAd(callback){
  alert("Ad watched ✔");
  callback();
}

/* =========================
   GAME LOGIC
========================= */
const grid = document.getElementById("grid");
const scoreVal = document.getElementById("scoreVal");
const timeVal = document.getElementById("timeVal");

function shuffle(){
  deck = [...icons, ...icons].sort(()=>Math.random()-0.5);
}

function build(){
  grid.innerHTML = "";
  shuffle();
  deck.forEach(icon=>{
    const c = document.createElement("div");
    c.className = "card";
    c.dataset.icon = icon;
    c.onclick = ()=>flip(c);
    grid.appendChild(c);
  });
}

function flip(card){
  if(lock || card.classList.contains("matched") || card === first) return;

  card.innerHTML = `<span>${card.dataset.icon}</span>`;
  card.classList.add("revealed");

  if(!first){
    first = card;
    return;
  }

  if(first.dataset.icon === card.dataset.icon){
    first.classList.add("matched");
    card.classList.add("matched");
    score += 100;
    scoreVal.textContent = score;
    first = null;

    if(document.querySelectorAll(".matched").length === 16){
      endGame(true);
    }
  } else {
    lock = true;
    setTimeout(()=>{
      first.innerHTML = "";
      card.innerHTML = "";
      first.classList.remove("revealed");
      card.classList.remove("revealed");
      first = null;
      lock = false;
    }, 600);
  }
}

function startTimer(){
  timeVal.textContent = timeLeft;
  timer = setInterval(()=>{
    timeLeft--;
    timeVal.textContent = timeLeft;
    if(timeLeft <= 0){
      endGame(false);
    }
  },1000);
}

function endGame(win){
  clearInterval(timer);
  setTimeout(()=>{
    if(!win && mode !== "classic"){
      rewardedAd(reset);
    } else {
      alert(win ? "You win!" : "Try again!");
      reset();
    }
  },300);
}

function reset(){
  clearInterval(timer);
  score = 0;
  timeLeft = 60;
  scoreVal.textContent = "0";
  timeVal.textContent = mode==="time" ? timeLeft : "—";
  first = null;
  lock = false;
  build();
}

document.getElementById("start").onclick = ()=>{
  reset();
  if(mode==="time") startTimer();
};

document.getElementById("classic").onclick = ()=>{
  mode="classic"; reset();
};
document.getElementById("time").onclick = ()=>{
  mode="time"; reset();
};
document.getElementById("daily").onclick = ()=>{
  mode="daily"; reset();
};

build();
</script>
</body>
</html>
