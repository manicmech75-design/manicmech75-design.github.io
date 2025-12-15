// game.js
document.addEventListener("DOMContentLoaded", () => {
  console.log("Game loaded");

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
