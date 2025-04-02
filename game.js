const markDisplayMap = {
  yado: "🐚",
  ika: "🦑",
  mana: "🍀",
  tatsu: "🐉"
};

/*　ローカル環境では使用できないらしい
let allCards = [];
*/

let playerHand = [];
let cpuHand = [];
let playerScore = 0;
let cpuScore = 0;
let currentRound = 1;

const handArea = document.getElementById("hand-area");
const result = document.getElementById("result");
const cpuArea = document.getElementById("cpu-card-area");

/*　ローカル環境では使用できないらしい

// カードデータをもらってくる
fetch("data/cards.json")
  .then(response => response.json())
  .then(data => {
    allCards = data;
    startGame(); // ← 初期処理をここで開始
  });

  */

// ゲーム開始処理。手札生成とカード描画を含む
function startGame() {
  const hands = generateDistinctHands(allCards);
  playerHand = hands.playerHand;
  cpuHand = hands.cpuHand;
  playerScore = 0;
  cpuScore = 0;
  currentRound = 1;
  renderHand(); // ← カード描画スタート
}

startGame(); // Web版にするとき外す

// 手札生成
function generateDistinctHands(allCards) {
  const pickUnique = (cards, count) => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  // 特定IDの範囲から任意の枚数ドローする（属性のバランスをとる）
  const pickFromRange = (rangeStart, rangeEnd, count, excludeIds = []) => {
    return pickUnique(
      allCards.filter(c => c.id >= rangeStart && c.id <= rangeEnd && !excludeIds.includes(c.id)),
      count
    );
  };

  // 1. プレイヤー手札（先に抽選）
  const p1 = pickFromRange(1, 9, 2);
  const p2 = pickFromRange(10, 18, 2);
  const p3 = pickFromRange(19, 27, 2);
  const p4 = pickFromRange(28, 31, 1);
  const usedIds = [...p1, ...p2, ...p3, ...p4].map(c => c.id);

  // 2. CPU手札（プレイヤーのカードを除外して抽選）
  const c1 = pickFromRange(1, 9, 2, usedIds);
  const c2 = pickFromRange(10, 18, 2, usedIds);
  const c3 = pickFromRange(19, 27, 2, usedIds);
  const c4 = pickFromRange(28, 31, 1, usedIds);

  return { 
    playerHand: [...p1, ...p2, ...p3, ...p4],
    cpuHand: [...c1, ...c2, ...c3, ...c4]
  };
}

// ラウンドごとの情報整理
function updateRoundInfo() {
  const roundInfo = document.getElementById("round-info");
  let roundText = "";

  // CPUの手札の属性内訳
  const markCounts = { yado: 0, ika: 0, mana: 0, tatsu: 0 };
  cpuHand.forEach(card => {
    if (markCounts[card.mark] !== undefined) {
      markCounts[card.mark]++;
    }
  });

  // ラウンド数とCPUの残り属性を表示する  
  const cpuMarkSummary = Object.entries(markDisplayMap)
  .map(([mark, icon]) => `${icon}${markCounts[mark] || 0}`)
  .filter(text => !text.endsWith("0"))
  .join(" ");

  if (currentRound === 7) {
    roundText = `最終ラウンド終了<br><span style="font-size: 0.9em;">相手の手札： ${cpuMarkSummary}</span>`;
  } else {
    const roundLabel = currentRound === 6 ? "最終ラウンド" : `第${currentRound}ラウンド`;
    roundText = `${roundLabel}：カードを選んでください<br><span style="font-size: 0.9em;">相手の手札： ${cpuMarkSummary}</span>`;
  }

  roundInfo.innerHTML = roundText;
}

// カード情報の表示に関する詳細
function renderCardHTML(card) {
  const markImgPath = `images/marks/${card.mark}.png`;
  const wrapperClass = `card-image-wrapper mark-${card.mark}`;

  return `
    <div class="card-button">
      <div class="card-header mark-${card.mark}">${card.name}</div>
      <div class="${wrapperClass}">
        <img src="images/${card.id}.png" alt="${card.name}" class="card-image">
        <img src="${markImgPath}" class="card-mark-icon" alt="${card.mark}">
        <div class="card-point">${card.power}</div>
      </div>
      <div class="card-footer">
        ${card.ability?.description || ""}
      </div>
    </div>
  `;
}

// ログのほうへのカード情報の表示に関する詳細
function renderLabeledCardHTML(card, label) {
  return `
    <div class="log-card-wrapper">
      <div class="log-label">${label}</div>
      ${renderCardHTML(card)}
    </div>
  `;
}

// カードを生成、ボタンを押して手札を出す操作
function renderHand() {
  updateRoundInfo();

  handArea.innerHTML = "";
  playerHand.forEach((card, index) => {
    const btn = document.createElement("button");
    btn.className = "card-button";
    btn.innerHTML = renderCardHTML(card);

    // 第6ラウンド以降はクリック無効
    if (currentRound > 6) {
      btn.disabled = true;
    } else {
      btn.addEventListener("click", () => {
        playRound(card, index);
      });
    }

    handArea.appendChild(btn);
  });
}

// 各ラウンドの対戦に関する機能
function playRound(playerCard, playerIndex) {
  // グローバル定義
  let resultText = "";

  if (currentRound > 6) return; // すでにゲーム終了なら処理しない

  // CPUのカードをランダムに選ぶ
  const cpuIndex = Math.floor(Math.random() * cpuHand.length);
  const cpuCard = cpuHand[cpuIndex];

  // カード削除（使い切り）
  playerHand.splice(playerIndex, 1);
  cpuHand.splice(cpuIndex, 1);

  // 勝敗判定
  const winner = getWinner(playerCard.mark, cpuCard.mark);

  // ポイント獲得準備
  let playerGain = 0;
  let cpuGain = 0;
  let playerPts = playerCard.power;
  let cpuPts = cpuCard.power;

  // 能力反映（簡易：vs_mark系だけ対応）
  if (playerCard.ability.type === "vs_mark" && cpuCard.mark === playerCard.ability.target) {
    playerPts += playerCard.ability.value;
  }
  if (cpuCard.ability.type === "vs_mark" && playerCard.mark === cpuCard.ability.target) {
    cpuPts += cpuCard.ability.value;
  }
  
  // ポイント獲得
  if (winner === "player") {
    playerGain = playerCard.power;
    playerScore += playerGain;  
  } else if (winner === "cpu") {
    cpuGain = cpuCard.power;
    cpuScore += cpuGain;  
  }

  // 対戦カード画像と名前表示
  const playerCardHTML = renderLabeledCardHTML(playerCard, "＜プレイヤー＞");
  const cpuCardHTML = renderLabeledCardHTML(cpuCard, "＜CPU＞");
  
  const battleLog = `
    <div class="log-battle">
      ${playerCardHTML}
      <div class="log-vs-text">vs</div>
      ${cpuCardHTML}
    </div>
  `;  

  let log = `<div class="log-round">ラウンド ${currentRound}</div>`;

  if (winner === "player") {
    resultText = `🎉 あなたの勝ち！ +${playerGain}点`;
  } else if (winner === "cpu") {
    resultText = `💥 CPUの勝ち！ +${cpuGain}点`;
  } else {
    resultText = `⚖️ 引き分け！ 得点なし`;
  }

  result.innerHTML = `
    ${log}
    ${battleLog}
    <p>${resultText}</p>
  ` + result.innerHTML;

  currentRound++;

  renderHand(); // ← 最終ラウンドでも呼ぶ！

  if (currentRound > 6) {
    setTimeout(() => {
      showFinalResult()
    }, 600);
  }
}

function showFinalResult() {
  updateRoundInfo(); // ← ここで呼び出し

  let final = `<hr><h2>ゲーム終了！</h2>`;
  final += `あなた：${playerScore} 点<br>CPU：${cpuScore} 点<br><br>`;
  if (playerScore > cpuScore) {
    final += `🎉 <strong>あなたの勝利！</strong>`;
  } else if (cpuScore > playerScore) {
    final += `💥 <strong>CPUの勝利！</strong>`;
  } else {
    final += `⚖️ <strong>引き分け！</strong>`;
  }
  result.innerHTML = final;
  handArea.innerHTML = "";
  cpuArea.innerHTML = "";
}

function getWinner(mark1, mark2) {
  const beats = {
    yado: ["mana"],
    mana: ["ika"],
    ika: ["yado"],
    tatsu: ["yado", "ika", "mana"]
  };

  if (mark1 === mark2) return "draw";
  if (beats[mark1]?.includes(mark2)) return "player";
  if (beats[mark2]?.includes(mark1)) return "cpu";
  return "draw"; // 万が一、未定義の組み合わせなら引き分け
}

// 最後に追加：
document.getElementById("help-button").addEventListener("click", () => {
  document.getElementById("help-popup").classList.remove("hidden");
});

document.getElementById("help-close").addEventListener("click", () => {
  document.getElementById("help-popup").classList.add("hidden");
});

document.getElementById("dictionary-button").addEventListener("click", () => {
  // window.open("dictionary.html", "_blank"); // ← 新しいタブで開く場合
  location.href = "dictionary.html"; // ← 同じタブで遷移する場合
});