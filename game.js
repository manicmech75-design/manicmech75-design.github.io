document.addEventListener("DOMContentLoaded", () => {
  const game = document.getElementById("game");
  console.log("✅ TEST: game.js is executing");

  if (!game) {
    console.error("❌ #game not found");
    return;
  }

  game.innerHTML = `
    <h1>✅ GAME JS LOADED</h1>
    <button onclick="alert('Click works')">Test Button</button>
  `;
});
