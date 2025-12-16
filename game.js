const SAVE_KEY = "flip_city_save";

let state = {
  cash: 0,
  perTap: 1,
  upgradeCost: 10,
  tiles: Array(8).fill(0),
  lastSeen: Date.now()
};

const TILE_DATA = [
  { name: "Empty Lot", cost: 25, income: 0 },
  { name: "🏠 House", cost: 60, income: 1 },
  { name: "🏪 Store", cost: 160, income: 3 },
  { name: "🏢 Tower", cost: 0, income: 7 }
];

const cashEl = document.getElementById("cash");
const perTapEl = document.getElementById("perTap");
const upgradeCostEl = document.getElementById("upgradeCost");
const passiveEl = document.getElementById("passive");
const tileGrid = document.getElementById("tileGrid");
const upgradeBtn = document.getElementById("upgradeBtn");

function save() {
  state.lastSeen = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function load() {
  const data = localStorage.getItem(SAVE_KEY);
  if (data) state = JSON.parse(data);
}

function passiveIncome() {
  return state.tiles.reduce((sum, t) => sum + TILE_DATA[t].income, 0);
}

function updateUI() {
  cashEl.textContent = state.cash;
  perTapEl.textContent = state.perTap;
  upgradeCostEl.textContent = state.upgradeCost;
  passiveEl.textContent = `Passive: ${passiveIncome()}/sec`;
  upgradeBtn.disabled = state.cash < state.upgradeCost;
}

function renderTiles() {
  tileGrid.innerHTML = "";
  state.tiles.forEach((t, i) => {
    const d = document.createElement("div");
    d.className = "tile";

    if (t === 0) {
      d.innerHTML = "Empty Lot<br>(25)";
    } else {
      d.innerHTML = `${TILE_DATA[t].name}<br>+${TILE_DATA[t].income}/sec`;
    }

    d.onclick = () => handleTile(i);
    tileGrid.appendChild(d);
  });
}

function handleTile(i) {
  const t = state.tiles[i];
  const cost = TILE_DATA[t].cost;

  if (state.cash < cost) return;

  state.cash -= cost;
  if (t < 3) state.tiles[i]++;
  renderTiles();
  updateUI();
  save();
}

document.getElementById("tapBtn").onclick = () => {
  state.cash += state.perTap;
  updateUI();
  save();
};

upgradeBtn.onclick = () => {
  if (state.cash < state.upgradeCost) return;
  state.cash -= state.upgradeCost;
  state.perTap++;
  state.upgradeCost = Math.floor(state.upgradeCost * 1.4);
  updateUI();
  save();
};

document.getElementById("resetBtn").onclick = () => {
  localStorage.removeItem(SAVE_KEY);
  location.reload();
};

setInterval(() => {
  state.cash += passiveIncome();
  updateUI();
  save();
}, 1000);

load();
renderTiles();
updateUI();
