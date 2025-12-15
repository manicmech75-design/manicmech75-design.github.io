// game.js
document.addEventListener("DOMContentLoaded", () => {
  console.log("Game loaded");
let coins = 0;

const upgrades = {
  clickPower: { level: 0, baseCost: 10, costMult: 1.6, addPerLevel: 1 }, // +1 per level
  autoEarn:   { level: 0, baseCost: 25, costMult: 1.7, cpsPerLevel: 0.2 }, // +0.2 coins/sec
  critChance: { level: 0, baseCost: 50, costMult: 1.8, addPerLevel: 0.02 } // +2% per level
};

function upgradeCost(key) {
  const u = upgrades[key];
  return Math.ceil(u.baseCost * Math.pow(u.costMult, u.level));
}

function buyUpgrade(key) {
  const cost = upgradeCost(key);
  if (coins < cost) return false;
  coins -= cost;
  upgrades[key].level += 1;
  updateUI();
  return true;
}

  const game = document.getElementById("game");

  if (!game) {
    console.error("Game container not found");
    return;
  }

  game.innerHTML = `
    <h2>🏙️ Flip City</h2>
    <p>Tap to earn coins</p>
    <button id="earn">Earn 💰</button>
    <p id="coins">Coins: 0</p>
  `;

  let coins = 0;

  document.getElementById("earn").onclick = () => {
    coins++;
    document.getElementById("coins").textContent = "Coins: " + coins;
  };
});
