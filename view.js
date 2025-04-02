const cardDisplay = document.getElementById("card-display");
const shuffleButton = document.getElementById("shuffle-button");

function displayRandomCard() {
  const randomIndex = Math.floor(Math.random() * allCards.length);
  const card = allCards[randomIndex];
  const markImgPath = `images/marks/${card.mark}.png`;
  const wrapperClass = `card-image-wrapper mark-${card.mark}`;

  cardDisplay.innerHTML = `
      <div class="card-header mark-${card.mark}">${card.name}</div>
      <div class="${wrapperClass}">
        <img src="images/${card.id}.png" alt="${card.name}" class="card-image">
        <img src="${markImgPath}" class="card-mark-icon" alt="${card.mark}">
        <div class="card-point">${card.power}</div>
      </div>
      <div class="card-footer">
        ${card.ability?.description || ""}
      </div>
  `;
}

shuffleButton.addEventListener("click", displayRandomCard);

// 初期表示
displayRandomCard();

document.getElementById("back-button").addEventListener("click", () => {
  // window.open("index.html", "_blank"); // ← 新しいタブで開く場合
  location.href = "index.html"; // ← 同じタブで遷移する場合
});