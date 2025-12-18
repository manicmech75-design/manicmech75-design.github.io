// Flip City — Builder Edition (NO OFFLINE / NO TAB-HIDDEN INCOME)
// Support: cityflipsupport@gmail.com

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("game");
  if (!root) return console.error("❌ Missing <div id='game'></div> in index.html");

  const SUPPORT_EMAIL = "cityflipsupport@gmail.com";

  // -------- Game State --------
  const state = {
    money: 0,
    rps: 1,
    lastTick: performance.now(),
    running: true, // only runs while tab is visible
  };

  // -------- Styles --------
  const style = document.createElement("style");
  style.textContent = `
    :root { color-scheme: dark; }

    body{
      min-height:100vh;
      background:
        radial-gradient(900px 450px at 50% 0%, rgba(255,160,110,.55), transparent 60%),
        linear-gradient(to top, #0b1220 0%, #1a2b4c 40%, #ff915e 100%);
      color:#eaf0ff;
    }

    .wrap{ max-width:980px; margin:0 auto; padding:20px; }
    .top{ display:flex; gap:12px; align-items:flex-end; justify-content:space-between; flex-wrap:wrap; }
    h1{ font-size:24px; margin:0; letter-spacing:.3px; }
    .sub{ opacity:.85; font-size:13px; margin-top:4px; }

    .grid{ display:grid; grid-template-columns: 1.1fr .9fr; gap:14px; margin-top:14px; }
    @media (max-width: 860px){ .grid{ grid-template-columns:1fr; } }

    .card{
      background: rgba(0,0,0,.35);
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 14px;
      padding: 14px;
      box-shadow: 0 12px 30px rgba(0,0,0,.35);
    }

    .row{ display:flex; gap:10px; align-items:center; justify-content:space-between; flex-wrap:wrap; }
    .stat{ font-size:16px; }
    .stat b{ font-variant-numeric: tabular-nums; }

    button{
      background: linear-gradient(180deg,#6aa8ff,#3b6cff);
      color:#fff;
      border:0;
      border-radius: 12px;
      padding: 10px 14px;
      font-size:14px;
      cursor:pointer;
      box-shadow: 0 10px 24px rgba(0,0,0,.35);
    }
    button:disabled{ opacity:.45; cursor:not-allowed; }

    .pill{
      display:inline-flex;
      align-items:center;
      gap:8px;
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(255,255,255,.10);
      border: 1px solid rgba(255,255,255,.08);
      font-size: 13px;
      opacity:.95;
    }

    /* Skyline preview */
    .sky{
      position:relative;
      height:140px;
      border-radius: 12px;
      overflow:hidden;
      background:
        linear-gradient(to top, rgba(11,18,32,1) 0%, rgba(26,43,76,1) 55%, rgba(255,145,94,1) 100%);
      border: 1px solid rgba(255,255,255,.10);
    }
    .sun{
      position:absolute; left:12%; top:18%;
      width:64px; height:64px; border-radius:50%;
      background: radial-gradient(circle at 35% 35%, rgba(255,255,255,.9), rgba(255,220,170,.6) 35%, rgba(255,160,110,.15) 70%, transparent 72%);
      filter: blur(.1px);
      opacity:.95;
    }
    .buildings{
      position:absolute; left:0; right:0; bottom:0; height:62%;
      background:
        linear-gradient(to top, rgba(0,0,0,.55), rgba(0,0,0,.15) 60%, transparent),
        repeating-linear-gradient(
          to right,
          rgba(0,0,0,.65) 0px,
          rgba(0,0,0,.65) 18px,
          rgba(20,20,20,.80) 18px,
          rgba(20,20,20,.80) 40px
        );
    }
    .windows{
      position:absolute; left:0; right:0; bottom:0; height:62%;
      background:
        repeating-linear-gradient(
          to right,
          transparent 0px,
          transparent 10px,
          rgba(255,210,140,.35) 10px,
          rgba(255,210,140,.35) 12px,
          transparent 12px,
          transparent 22px
        );
      mix-blend-mode: screen;
      opacity:.55;
      transform: translateY(10px);
    }

    footer{
      opacity:.70;
      font-size:12px;
      text-align:center;
      margin: 18px 0 4px;
      line-height: 1.4;
    }

    a { color: #a9c7ff; }
  `;
  document.head.appendChild(style);

  // -------- UI --------
  root.innerHTML = `
    <div class="wrap">
      <div class="top">
        <div>
          <h1>🌆 Flip City</h1>
          <div class="sub">Builder Edition · Money only earns while this tab is open & visible</div>
        </div>
        <div class="pill" id="statusPill">🟢 Earning</div>
      </div>

      <div class="grid">
        <div class="card">
          <div class="row">
            <div class="stat">💰 Money: <b>$<span id="money">0</span></b></div>
            <div class="stat">📈 Revenue: <b>$<span id="rps">1</span></b>/sec</div>
          </div>

          <div style="height:10px"></div>

          <div class="row">
            <button id="upgradeBtn">Upgrade Building ($25)</button>
            <button id="collectBtn" title="Manual collect (optional).">Collect +$5</button>
          </div>

          <div style="height:10px"></div>
          <div class="sub">
            Tip: Switching tabs pauses earnings (no catch-up).
          </div>
        </div>

        <div class="card">
          <div class="row" style="align-items:flex-end">
            <div>
              <div style="font-weight:700; margin-bottom:6px;">City Preview</div>
              <div class="sub">Sunset skyline (no external images)</div>
            </div>
          </div>
          <div style="height:10px"></div>
          <div class="sky">
            <div class="sun"></div>
            <div class="buildings"></div>
            <div class="windows"></div>
          </div>
        </div>
      </div>

      <footer>
        Support: <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>
      </footer>
    </div>
  `;

  const moneyEl = document.getElementById("money");
  const rpsEl = document.getElementById("rps");
  const upgradeBtn = document.getElementById("upgradeBtn");
  const collectBtn = document.getElementById("collectBtn");
  const statusPill = document.getElementById("statusPill");

  function render() {
    moneyEl.textContent = Math.floor(state.money);
    rpsEl.textContent = state.rps;
    upgradeBtn.disabled = state.money < 25;
  }

  // -------- NO OFFLINE / NO HIDDEN TAB EARNINGS --------
  function setRunning(isRunning) {
    state.running = isRunning;
    // Reset tick clock so there is NO "catch up" when you return
    state.lastTick = performance.now();

    statusPill.textContent = isRunning ? "🟢 Earning" : "⏸️ Paused";
    statusPill.style.opacity = isRunning ? "0.95" : "0.75";
  }

  document.addEventListener("visibilitychange", () => {
    setRunning(!document.hidden);
  });

  window.addEventListener("blur", () => setRunning(false));
  window.addEventListener("focus", () => setRunning(!document.hidden));

  function tick(now) {
    if (state.running) {
      const delta = (now - state.lastTick) / 1000;
      state.lastTick = now;

      // Earn only while visible/running
      state.money += state.rps * delta;
      render();
    } else {
      // keep lastTick fresh without accumulating
      state.lastTick = now;
    }

    requestAnimationFrame(tick);
  }

  // -------- Actions --------
  upgradeBtn.addEventListener("click", () => {
    if (state.money >= 25) {
      state.money -= 25;
      state.rps += 1;
      render();
    }
  });

  collectBtn.addEventListener("click", () => {
    // manual action (always allowed when game is open)
    state.money += 5;
    render();
  });

  // Start
  render();
  setRunning(!document.hidden);
  requestAnimationFrame(tick);
});
