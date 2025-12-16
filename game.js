// game.js — Flip City (working starter)
// Works on GitHub Pages. No external assets required.

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("game");
  if (!root) {
    console.error("❌ #game not found. Add <div id='game'></div> to index.html");
    return;
  }

  // Inject minimal styles (so you don't depend on a separate CSS file)
  const style = document.createElement("style");
  style.textContent = `
    :root { color-scheme: dark; }
    body { margin: 0; font-family: system-ui, Arial, sans-serif; background:#0b1220; color:#e8eefc; }
    .wrap { max-width: 980px; margin: 0 auto; padding: 20px; }
    .top { display:flex; gap:12px; align-items:center; justify-content:space-between; flex-wrap:wrap; }
    h1 { font-size: 22px; margin: 0; }
    .pill { padding: 8px 12px; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12); border-radius: 999px; }
    button {
      cursor:pointer; border: 1px solid rgba(255,255,255,.18);
      background: rgba(255,255,255,.10); color:#e8eefc;
      padding:10px 14px; border-radius:12px; font-weight:600;
    }
    button:hover { background: rgba(255,255,255,.14); }
    .grid {
      margin-top: 16px;
      display:grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }
    @media (max-width: 520px) {
      .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
    .card {
      aspect-ratio: 1 / 1;
      border-radius: 16px;
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.12);
      display:flex; align-items:center; justify-content:center;
      font-size: 28px; user-select:none;
      transition: transform .12s ease;
    }
    .card:active { transform: scale(0.98); }
    .card.hidden { color: transparent; }
    .card.matched { background: rgba(46, 204, 113, .18); border-color: rgba(46, 204, 113, .35); }
    .hint { opacity:.85; margin-top:10px; }
  `;
  document.head.appendChild(style);

  // Simple emoji deck (8 pairs = 16 cards)
  const symbols = ["🍕","🚗","🧠","🎮","🏙️","⚡","🧩","🪙"];
  const deck = shuffle([...symbols, ...symbols]).map((sym, i) => ({
    id: i,
    sym,
    flipped: false,
    matched: false,
  }));

  let first = null;
  let lock = false;
  let moves = 0;
  let matches = 0;

  root.innerHTML = `
    <div class="wrap">
      <div class="top">
        <h1>Flip City</h1>
        <div class="pill" id="stats">Moves: 0 • Matched: 0/8</div>
        <button id="resetBtn">Reset</button>
      </div>
      <div class="grid" id="grid"></div>
      <div class="hint">Tip: If you updated files and nothing changes, your Service Worker is probably caching the old version.</div>
    </div>
  `;

  const gridEl = document.getElementById("grid");
  const statsEl = document.getElementById("stats");
  const resetBtn = document.getElementById("resetBtn");

  resetBtn.addEventListener("click", () => location.reload());

  render();

  function render() {
    statsEl.textContent = `Moves: ${moves} • Matched: ${matches}/8`;
    gridEl.innerHTML = "";

    for (const c of deck) {
      const btn = document.createElement("button");
      btn.className = "card";
      btn.type = "button";
      btn.setAttribute("aria-label", "card");
      btn.textContent = c.sym;

      if (!c.flipped && !c.matched) btn.classList.add("hidden");
      if (c.matched) btn.classList.add("matched");

      btn.addEventListener("click", () => onPick(c.id));
      gridEl.appendChild(btn);
    }
  }

  function onPick(id) {
    if (lock) return;
    const card = deck.find(c => c.id === id);
    if (!card || card.matched || card.flipped) return;

    card.flipped = true;

    if (!first) {
      first = card;
      render();
      return;
    }

    moves += 1;
    const second = card;

    if (first.sym === second.sym) {
      first.matched = true;
      second.matched = true;
      matches += 1;
      first = null;
      render();

      if (matches === symbols.length) {
        setTimeout(() => alert(`✅ You win! Moves: ${moves}`), 100);
      }
      return;
    }
      
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").then((reg) => {
      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        sw && sw.addEventListener("statechange", () => {
          if (sw.state === "installed" && navigator.serviceWorker.controller) {
            // New SW installed, refresh to get newest files
            location.reload();
          }
        });
      });
    });
  }      
</script>

    // Not a match: show briefly, then flip back
    lock = true;
    render();
    setTimeout(() => {
      first.flipped = false;
      second.flipped = false;
      first = null;
      lock = false;
      render();
    }, 650);
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  console.log("✅ Flip City loaded");
});
