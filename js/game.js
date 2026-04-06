/**
 * game.js
 * Main entry point. Orchestrates game state, DOM rendering, and user input.
 * Imports pure-function modules so each concern can be swapped independently
 * (e.g. replacing audio.js or migrating card rendering to a Phaser scene).
 */

import { allCharacters, levelsInfo } from "./data.js";
import {
  playFlipSound,
  playMatchSound,
  playMissSound,
  playLevelUpSound,
} from "./audio.js";
import { spawnConfetti } from "./confetti.js";

// ─── Constants ───────────────────────────────────────────────────────────────

const IMAGE_BASE_PATH = "./images/";
const HS_KEY = "umoja_highscore";
const SAVE_KEY = "umoja_progress";

function saveProgress() {
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify({ currentLevelIndex, score, totalFlips }),
  );
}

function loadProgress() {
  const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
  if (!saved) return;
  currentLevelIndex = Math.min(
    saved.currentLevelIndex ?? 0,
    levelsInfo.length - 1,
  );
  score = saved.score ?? 0;
  totalFlips = saved.totalFlips ?? 0;
}

// ─── DOM refs (cached once at startup) ───────────────────────────────────────

const container = document.getElementById("umoja-game-container");
const gameBoard = document.getElementById("game-board");
const levelDisplay = document.getElementById("level-display");
const matchDisplay = document.getElementById("match-display");
const totalMatchesDisp = document.getElementById("total-matches");
const scoreDisplay = document.getElementById("score-display");
const streakBanner = document.getElementById("streak-banner");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayStars = document.getElementById("overlay-stars");
const overlayMessage = document.getElementById("overlay-message");
const scoreSummary = document.getElementById("score-summary");
const nextLevelBtn = document.getElementById("next-level-btn");

// ─── Game state ───────────────────────────────────────────────────────────────

let currentLevelIndex = 0;
let matchedPairs = 0;
let lockBoard = false;
let firstCard = null;
let secondCard = null;
let score = 0;
let streak = 0;
let levelFlips = 0;
let totalFlips = 0;
let levelStartScore = 0;
let streakTimeout = null;
let resizeTimer = null;
let levelCharacters = []; // characters used in the current level

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Fisher-Yates shuffle — returns a new array, never mutates the original. */
function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Returns the appropriate column count for the current viewport width. */
function getColumns(levelData) {
  const w = window.innerWidth;
  if (w <= 400) return Math.min(3, levelData.columns);
  if (w <= 600) return Math.min(4, levelData.columns);
  if (w <= 900) return Math.min(5, levelData.columns);
  return levelData.columns;
}

function setGridColumns(levelData) {
  gameBoard.style.gridTemplateColumns = `repeat(${getColumns(levelData)}, minmax(0, 140px))`;
}

// ─── Streak banner ────────────────────────────────────────────────────────────

const STREAK_MESSAGES = [
  "",
  "",
  "🔥 2x Streak!",
  "🔥🔥 3x Streak!",
  "💥 4x Streak!",
  "🌟 5x Streak!",
  "⚡ UNSTOPPABLE!",
];

function showStreak(n) {
  clearTimeout(streakTimeout);
  if (n < 2) {
    streakBanner.textContent = "";
    return;
  }
  streakBanner.textContent =
    STREAK_MESSAGES[Math.min(n, STREAK_MESSAGES.length - 1)] ||
    `⚡ ${n}x Streak!`;
  streakTimeout = setTimeout(() => {
    streakBanner.textContent = "";
  }, 1500);
}

// ─── Card building ────────────────────────────────────────────────────────────

function buildCard(cardData) {
  const card = document.createElement("div");
  card.classList.add("card");
  card.dataset.id = cardData.id;
  card.innerHTML = `
    <div class="card-inner">
      <div class="card-face card-back">
        <div class="card-back-icon">🍎</div>
      </div>
      <div class="card-face card-front">
        <div class="card-img-area">
          <img
            src="${IMAGE_BASE_PATH}${cardData.src}"
            alt="${cardData.label}"
            class="card-image"
            loading="lazy"
          >
        </div>
        <div class="card-banner ${cardData.bannerClass}">${cardData.label}</div>
      </div>
    </div>`;
  card.addEventListener("click", () => flipCard(card));
  return card;
}

// ─── Level initialisation ─────────────────────────────────────────────────────

export function initLevel() {
  matchedPairs = 0;
  lockBoard = false;
  firstCard = null;
  secondCard = null;
  streak = 0;
  levelFlips = 0;
  levelStartScore = score;

  gameBoard.innerHTML = "";
  streakBanner.textContent = "";
  overlay.classList.remove("active");

  const levelData = levelsInfo[currentLevelIndex];
  levelDisplay.innerText = currentLevelIndex + 1;
  matchDisplay.innerText = 0;
  totalMatchesDisp.innerText = levelData.pairs;
  scoreDisplay.innerText = score;

  setGridColumns(levelData);

  const selected = shuffle(allCharacters).slice(0, levelData.pairs);
  levelCharacters = selected;
  const cardsArray = shuffle(
    selected.flatMap((char) => [
      { id: char.id, label: char.name, bannerClass: "name", src: char.image },
      { id: char.id, label: char.fact, bannerClass: "fact", src: char.image },
    ]),
  );

  // Batch DOM writes with a fragment to avoid repeated reflows
  const fragment = document.createDocumentFragment();
  cardsArray.forEach((cardData) => fragment.appendChild(buildCard(cardData)));
  gameBoard.appendChild(fragment);
}

// ─── Flip & match logic ───────────────────────────────────────────────────────

function flipCard(card) {
  if (lockBoard) return;
  if (card === firstCard) return;
  if (card.classList.contains("flipped")) return;
  if (card.classList.contains("matched")) return;

  playFlipSound();
  card.classList.add("flipped");
  levelFlips++;

  if (!firstCard) {
    firstCard = card;
    return;
  }

  secondCard = card;
  lockBoard = true;

  if (firstCard.dataset.id === secondCard.dataset.id) {
    onMatch();
  } else {
    onMiss();
  }
}

function onMatch() {
  const card1 = firstCard;
  const card2 = secondCard;

  streak++;
  score += 100 + Math.max(0, streak - 1) * 25;
  scoreDisplay.innerText = score;
  showStreak(streak);
  matchedPairs++;
  matchDisplay.innerText = matchedPairs;
  playMatchSound();
  saveProgress();

  // Wait for the flip transition to finish before applying matched state
  setTimeout(() => {
    card1.classList.remove("flipped");
    card2.classList.remove("flipped");
    card1.classList.add("matched");
    card2.classList.add("matched");

    const cr = container.getBoundingClientRect();
    [card1, card2].forEach((c) => {
      const r = c.getBoundingClientRect();
      spawnConfetti(
        container,
        r.left - cr.left + r.width / 2,
        r.top - cr.top + r.height / 2,
        14,
      );
    });

    resetBoard();

    if (matchedPairs === levelsInfo[currentLevelIndex].pairs) {
      setTimeout(levelComplete, 700);
    }
  }, 600);
}

function onMiss() {
  const card1 = firstCard;
  const card2 = secondCard;

  streak = 0;
  showStreak(0);
  playMissSound();

  // Wait for the flip transition to finish, then shake and flip back together
  setTimeout(() => {
    card1.classList.add("shake");
    card2.classList.add("shake");

    setTimeout(() => {
      card1.classList.remove("flipped", "shake");
      card2.classList.remove("flipped", "shake");
      resetBoard();
    }, 600);
  }, 600);
}

function resetBoard() {
  lockBoard = false;
  firstCard = null;
  secondCard = null;
}

// ─── Level complete / win screen ──────────────────────────────────────────────

function levelComplete() {
  playLevelUpSound();
  totalFlips += levelFlips;

  for (let i = 0; i < 6; i++) {
    setTimeout(() => {
      spawnConfetti(
        container,
        Math.random() * container.offsetWidth,
        50 + Math.random() * 100,
        25,
      );
    }, i * 200);
  }

  // Show quiz first, then the level summary when it's done
  showQuiz(() => {
    const pairs = levelsInfo[currentLevelIndex].pairs;
    const ratio = (pairs * 2) / levelFlips;
    const stars = ratio >= 0.85 ? "⭐⭐⭐" : ratio >= 0.6 ? "⭐⭐" : "⭐";

    if (currentLevelIndex < levelsInfo.length - 1) {
      overlayTitle.innerText = "Great Job! 🎉";
      overlayStars.innerText = stars;
      overlayMessage.innerText = "You found all the matches! Ready for more?";
      scoreSummary.innerHTML =
        `<strong>Flips this level:</strong> ${levelFlips}<br>` +
        `<strong>Level score:</strong> ${score - levelStartScore} pts`;
      nextLevelBtn.innerText = "Next Level →";
      nextLevelBtn.onclick = () => {
        currentLevelIndex++;
        saveProgress();
        initLevel();
      };
      overlay.classList.add("active");
    } else {
      showWinScreen();
    }
  });
}

// ─── Pop quiz ─────────────────────────────────────────────────────────────────

function showQuiz(onComplete) {
  const quizOverlay = document.getElementById("quiz-overlay");
  const quizImage = document.getElementById("quiz-image");
  const quizName = document.getElementById("quiz-name");
  const quizChoices = document.getElementById("quiz-choices");
  const quizFeedback = document.getElementById("quiz-feedback");
  const quizNextBtn = document.getElementById("quiz-next-btn");

  // Pick a random character from this level
  const subject =
    levelCharacters[Math.floor(Math.random() * levelCharacters.length)];
  // 3 wrong distractors — exclude the subject and any conflicting facts
  const conflicts = subject.conflictIds || [];
  const others = allCharacters.filter((c) => c.id !== subject.id && !conflicts.includes(c.id));
  const distractors = shuffle(others).slice(0, 3);
  const choices = shuffle([subject, ...distractors]);

  quizImage.src = IMAGE_BASE_PATH + subject.image;
  quizImage.alt = subject.name;
  quizName.textContent = subject.name.toUpperCase();
  quizFeedback.textContent = "";
  quizFeedback.className = "quiz-feedback";
  quizNextBtn.style.display = "none";
  quizChoices.innerHTML = "";

  choices.forEach((ch) => {
    const btn = document.createElement("button");
    btn.className = "quiz-choice-btn";
    btn.textContent = ch.fact;
    btn.onclick = () => {
      // Lock all buttons after first pick
      quizChoices
        .querySelectorAll(".quiz-choice-btn")
        .forEach((b) => (b.disabled = true));

      if (ch.id === subject.id) {
        btn.classList.add("correct");
        const correctMessages = [
          "🌟 SMART PICK! You're a Food Expert!",
          "🔥 BOOM! You really know your food!",
          "💥 AMAZING! Nothing gets past you!",
          "⭐ YES! You're on fire!",
          "🏆 NAILED IT! Food genius confirmed!",
        ];
        quizFeedback.textContent = correctMessages[Math.floor(Math.random() * correctMessages.length)] + " +50 bonus points!";
        quizFeedback.className = "quiz-feedback correct";
        score += 50;
        scoreDisplay.innerText = score;
        saveProgress();
      } else {
        btn.classList.add("wrong");
        // Highlight the correct answer
        [...quizChoices.children].forEach((b, i) => {
          if (choices[i].id === subject.id) b.classList.add("correct");
        });
        const wrongMessages = [
          "So close! Give it another look!",
          "Almost! Check the right answer above!",
          "Good try! You'll get it next time!",
          "Not this one — but now you know!",
        ];
        quizFeedback.textContent = "❌ " + wrongMessages[Math.floor(Math.random() * wrongMessages.length)];
        quizFeedback.className = "quiz-feedback wrong";
      }

      quizNextBtn.style.display = "block";
    };
    quizChoices.appendChild(btn);
  });

  quizNextBtn.textContent = "Continue →";
  quizNextBtn.onclick = () => {
    quizOverlay.classList.remove("active");
    onComplete();
  };

  quizOverlay.classList.add("active");
}

function showWinScreen() {
  const hs = JSON.parse(localStorage.getItem(HS_KEY) || "null");
  const isNewRecord = !hs || score > hs.score;

  if (isNewRecord) {
    localStorage.setItem(HS_KEY, JSON.stringify({ score, flips: totalFlips }));
  }

  overlayTitle.innerText = "You Won! 🏆";
  overlayStars.innerText = isNewRecord ? "🌟 NEW RECORD! 🌟" : "⭐⭐⭐";
  overlayMessage.innerText = isNewRecord
    ? "Amazing — you set a new high score!"
    : "You are a Food Fact Master!";

  const recordLine = isNewRecord
    ? `<span style="color:var(--vq-green);font-weight:600">🏅 New personal best!</span>`
    : `<strong>Your Best:</strong> ${hs.score} pts in ${hs.flips} flips<br>` +
      `<span style="color:var(--vq-gold)">Can you beat it next time?</span>`;

  scoreSummary.innerHTML =
    `<strong>Final Score:</strong> ${score} pts<br>` +
    `<strong>Total Flips:</strong> ${totalFlips}<br>` +
    recordLine;

  nextLevelBtn.innerText = "Play Again";
  nextLevelBtn.onclick = () => {
    currentLevelIndex = 0;
    score = 0;
    totalFlips = 0;
    scoreDisplay.innerText = 0;
    localStorage.removeItem(SAVE_KEY);
    initLevel();
  };
  overlay.classList.add("active");
}

// ─── Responsive grid ─────────────────────────────────────────────────────────

window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(
    () => setGridColumns(levelsInfo[currentLevelIndex]),
    150,
  );
});

// ─── Boot ─────────────────────────────────────────────────────────────────────

loadProgress();
initLevel();
