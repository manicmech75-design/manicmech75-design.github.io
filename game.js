document.addEventListener("DOMContentLoaded", () => {

  /* ================= STATE ================= */

  let money = 0;
  let cityLevel = 0;
  let clickValue = 1;

  const tiles = Array.from({ length: 9 }, () => ({
    level: 0
  }));

  const upgrades = [
    { name: "Street Lights", cost: 50, desc: "+1 per click", bonus: 1 },
    { name: "Apartments", cost: 150, desc: "+2 per click", bonus: 2 },
    { name: "Offices", cost: 400, desc: "+3 per click", bonus: 3 },
    { name: "Parks", cost: 800, desc: "Skyline growth", bonus: 0 },
    { name: "Skyscrapers", cost: 1500, desc: "Major skyline boost", bonus: 0 }
  ];

  /* ================= UI ================= */

  const game = document.getElementById("game");

  game.innerHTML = `
    <div class="wrap">
      <h1>🏙️ Flip City</h1>
      <p class="intro">
        Click tiles to earn money. Upgrade your city and watch the skyline grow.
      </p>

      <div class="top">
        <div class="money">💰 $<span id="money">0</span></div>
        <div class="hint" id="hint">Click any tile to begin</div>
      </div>

      <div class="skyline" id="skyline"></div>

      <h2>City Grid</h2>
      <div class="grid" id="grid"></div>

      <h2>Upgrades</h2>
      <div class="upgrades" id="upgrades"></div>
    </div>

    <style>
      .wrap { max-width: 960px; margin: auto; padding: 20px; }
      h1 { margin-bottom: 4px; }
      .intro { opacity: .8; margin-bottom: 12px; }

      .top {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .money { font-size: 18px; }
      .hint { opacity: .7; }

      .grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-bottom: 20px;
      }

      .tile {
        height: 90px;
        border-radius: 10px;
        background: #1c2747;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        cursor: pointer;
        transition: transform .1s, background .2s;
      }

      .tile:hover { transform: scale(1.03); }

      .lvl0 { background: #1c2747; }
      .lvl1 { background: #2e8bff; }
      .lvl2 { background: #33cc99; }
      .lvl3 { background: #ffb703; }
      .lvl4 { background: #ff6b6b; }

      .upgrades {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 10px;
      }

      .upgrade {
        background: #121a33;
        padding: 12px;
        border-radius: 10px;
        cursor: pointer;
        opacity: .85;
      }

      .upgrade:hover { opacity: 1; }

      .skyline {
        height: 90px;
        display: flex;
        align-items: flex-end;
        gap: 6px;
        margin-bottom: 20px;
      }

      .building {
        width: 30px;
        background: linear-gradient(#9ad0ff, #1c2747);
        border-radius: 4px 4px 0 0;
      }
    </style>
  `;

  const moneyEl = document.getElementById("money");
  const gridEl = document.getElementById("grid");
  const skylineEl = document.getElementById("skyline");
  const upgradesEl = document.getElementById("upgrades");
  const hintEl = document.getElementById("hint");

  /* ================= FUNCTIONS ================= */

  function updateMoney() {
    moneyEl.textContent = money;
  }

  function renderGrid() {
    gridEl.innerHTML = "";
    tiles.forEach(tile => {
      const div = document.createElement("div");
      div.className = `tile lvl${tile.level}`;
      div.textContent = `Lv ${tile.level}`;

      div.onclick = () => {
        money += clickValue + tile.level;
        updateMoney();
        hintEl.textContent = "Nice! Upgrade tiles or buy upgrades.";
      };

      gridEl.appendChild(div);
    });
  }

  function renderUpgrades() {
    upgradesEl.innerHTML = "";
    upgrades.forEach(upg => {
      const div = document.createElement("div");
      div.className = "upgrade";
      div.innerHTML = `
        <strong>${upg.name}</strong><br>
        ${upg.desc}<br>
        Cost: $${upg.cost}
      `;

      div.onclick = () => {
        if (money < upg.cost) return;

        money -= upg.cost;
        updateMoney();

        if (upg.bonus) clickValue += upg.bonus;

        cityLevel++;
        updateSkyline();

        hintEl.textContent = `${upg.name} unlocked!`;
      };

      upgradesEl.appendChild(div);
    });
  }

  function updateSkyline() {
    skylineEl.innerHTML = "";
    for (let i = 0; i < cityLevel; i++) {
      const b = document.createElement("div");
      b.className = "building";
      b.style.height = 20 + i * 10 + "px";
      skylineEl.appendChild(b);
    }
  }

  /* ================= INIT ================= */

  renderGrid();
  renderUpgrades();
  updateSkyline();
  updateMoney();
});
