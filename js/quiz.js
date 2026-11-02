import { createRound, formatElapsed, summarize } from "./session.js";
import { API_URL, API_TIMEOUT_MS } from "./config.js";

const THEME_CLASS = {
  cyan: "theme-cyan",
  green: "theme-green",
  purple: "theme-purple",
  orange: "theme-orange",
};

const screens = {
  welcome: document.querySelector("#welcome"),
  quiz: document.querySelector("#quiz"),
  result: document.querySelector("#result"),
};

const PLAYER_NAME_KEY = "cyberquiz.playerName";

const loadError = document.querySelector("#load-error");
const playerForm = document.querySelector("#player-form");
const playerNameInput = document.querySelector("#player-name");
const playerNameError = document.querySelector("#player-name-error");
const questionProgress = document.querySelector("#question-progress");
const questionTitle = document.querySelector("#question-title");
const answerGrid = document.querySelector("#answer-grid");
const feedback = document.querySelector("#feedback");
const feedbackVerdict = document.querySelector("#feedback-verdict");
const feedbackExplanation = document.querySelector("#feedback-explanation");
const feedbackSource = document.querySelector("#feedback-source");
const feedbackLink = document.querySelector("#feedback-link");
const nextButton = document.querySelector("#next-question");
const resultTitle = document.querySelector("#result-title");
const resultDetail = document.querySelector("#result-detail");
const resultRank = document.querySelector("#result-rank");
const scoreRing = document.querySelector("#score-ring");
const scoreValue = document.querySelector("#score-value");
const scoreTotal = document.querySelector("#score-total");
const scoreSentence = document.querySelector("#score-sentence");
const statCorrect = document.querySelector("#stat-correct");
const statWrong = document.querySelector("#stat-wrong");
const statTime = document.querySelector("#stat-time");

let bankPromise;
let round = [];
let index = 0;
let chosenLetters = [];
let roundStartedAt = 0;
let isBusy = false;

function pinViewToTop() {
  const pin = () => window.scrollTo(0, 0);
  pin();
  requestAnimationFrame(() => {
    pin();
    requestAnimationFrame(pin);
  });
}

function focusAtTop(element) {
  element?.focus({ preventScroll: true });
  pinViewToTop();
}

function showScreen(name) {
  for (const [key, screen] of Object.entries(screens)) {
    screen.hidden = key !== name;
  }

  if (name === "quiz") {
    document.title = `Pergunta ${index + 1} de ${round.length} — CyberQuiz`;
  } else if (name === "result") {
    document.title = "Resultado — CyberQuiz";
  } else {
    document.title = "CyberQuiz";
  }

  focusAtTop(screens[name].querySelector("h1"));
}

function showLoadError(message) {
  loadError.textContent = message;
  loadError.hidden = false;
  showScreen("welcome");
  focusAtTop(loadError);
}

function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return url.href;
  } catch {
    return "";
  }
  return "";
}

// Fonte 1: a API (Node + Supabase). É o caminho oficial do projeto.
async function loadFromApi() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const endereco = `${API_URL.replace(/\/+$/, "")}/perguntas`;
    const response = await fetch(endereco, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`A API respondeu ${response.status}.`);
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("A API devolveu uma lista vazia.");
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

// Fonte 2: o questoes.json publicado junto do site (modo offline).
async function loadFromFile() {
  let response;
  try {
    response = await fetch(new URL("../questoes.json", import.meta.url));
  } catch {
    throw new Error(
      "Não foi possível carregar as questões. Use um servidor local ou o GitHub Pages.",
    );
  }

  if (!response.ok) {
    throw new Error("Não foi possível carregar as questões.");
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("O arquivo de questões não é uma lista.");
  }
  return data;
}

async function loadBank() {
  if (API_URL) {
    try {
      const perguntas = await loadFromApi();
      console.info(`CyberQuiz: ${perguntas.length} perguntas carregadas da API (${API_URL}).`);
      return perguntas;
    } catch (erro) {
      console.warn("CyberQuiz: API indisponível, usando o banco local.", erro);
    }
  }

  return loadFromFile();
}

function ensureBank() {
  if (!bankPromise) {
    bankPromise = loadBank().catch((error) => {
      bankPromise = undefined;
      throw error;
    });
  }
  return bankPromise;
}

function renderQuestion() {
  const question = round[index];
  screens.quiz.className = `quiz-template ${THEME_CLASS[question.theme]}`;
  questionProgress.textContent = `Pergunta ${index + 1} de ${round.length} · ${question.categoria}`;
  questionTitle.textContent = question.pergunta;
  feedback.hidden = true;
  feedbackVerdict.textContent = "";
  feedbackExplanation.textContent = "";
  answerGrid.replaceChildren();

  for (const letter of ["A", "B", "C", "D"]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-option";
    button.dataset.letter = letter;

    const letterBadge = document.createElement("span");
    letterBadge.className = "answer-letter";
    letterBadge.textContent = letter;

    const copy = document.createElement("span");
    copy.className = "answer-copy";
    copy.textContent = question.opcoes[letter];

    const status = document.createElement("span");
    status.className = "answer-status";

    button.append(letterBadge, copy, status);
    button.addEventListener("click", () => chooseAnswer(letter));
    answerGrid.append(button);
  }

  showScreen("quiz");
}

function chooseAnswer(letter) {
  if (isBusy) return;
  const question = round[index];
  if (!question || chosenLetters.length !== index) return;

  isBusy = true;
  chosenLetters.push(letter);
  const isCorrect = letter === question.resposta_correta;

  for (const button of answerGrid.querySelectorAll(".answer-option")) {
    button.disabled = true;
    const choice = button.dataset.letter;
    const status = button.querySelector(".answer-status");
    if (choice === question.resposta_correta) {
      button.classList.add("is-correct");
      status.textContent = "Correta";
    } else if (choice === letter) {
      button.classList.add("is-incorrect");
      status.textContent = "Incorreta";
    } else {
      button.classList.add("is-idle");
    }
  }

  feedbackVerdict.textContent = isCorrect
    ? "Resposta correta."
    : `Resposta incorreta. A alternativa correta é ${question.resposta_correta}.`;
  feedbackExplanation.textContent = question.explicacao;

  const sourceUrl = safeHttpUrl(question.fonte);
  if (sourceUrl) {
    feedbackLink.href = sourceUrl;
    feedbackSource.hidden = false;
  } else {
    feedbackLink.removeAttribute("href");
    feedbackSource.hidden = true;
  }

  nextButton.textContent = index === round.length - 1 ? "Ver resultado" : "Próxima pergunta";
  feedback.hidden = false;
  focusAtTop(questionTitle);
  isBusy = false;
}

function renderResult() {
  const summary = summarize(round, chosenLetters);
  const elapsed = roundStartedAt ? Date.now() - roundStartedAt : 0;
  screens.result.classList.add("theme-green");
  resultTitle.textContent = summary.headline;
  resultDetail.textContent = summary.detail;
  resultRank.textContent = summary.rank;
  scoreRing.style.setProperty("--score", String(summary.percent));
  scoreValue.textContent = String(summary.correctCount);
  scoreTotal.textContent = `/${summary.total}`;
  scoreSentence.textContent = `Você acertou ${summary.correctCount} de ${summary.total} perguntas!`;
  statCorrect.textContent = String(summary.correctCount);
  statWrong.textContent = String(summary.wrongCount);
  statTime.textContent = formatElapsed(elapsed);
  showScreen("result");
}

async function startRound() {
  if (isBusy) return;
  isBusy = true;
  loadError.hidden = true;

  try {
    const questions = await ensureBank();
    round = createRound(questions);
    index = 0;
    chosenLetters = [];
    roundStartedAt = Date.now();
    renderQuestion();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível iniciar o quiz.";
    showLoadError(message);
  } finally {
    isBusy = false;
  }
}

function advance() {
  if (chosenLetters.length !== index + 1) return;
  if (index === round.length - 1) {
    renderResult();
    return;
  }
  index += 1;
  renderQuestion();
}

function restorePlayerName() {
  try {
    const saved = localStorage.getItem(PLAYER_NAME_KEY);
    if (saved) playerNameInput.value = saved;
  } catch {
    playerNameInput.value = "";
  }
}

function rememberPlayerName(name) {
  localStorage.setItem(PLAYER_NAME_KEY, name);
}

playerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = playerNameInput.value.trim();
  if (!name) {
    playerNameError.textContent = "Digite seu nome para jogar.";
    playerNameError.hidden = false;
    playerNameInput.setAttribute("aria-invalid", "true");
    playerNameInput.focus();
    return;
  }

  playerNameError.hidden = true;
  playerNameInput.removeAttribute("aria-invalid");
  playerNameInput.value = name;

  try {
    rememberPlayerName(name);
  } catch {
    playerNameError.textContent = "Não foi possível guardar o nome neste navegador.";
    playerNameError.hidden = false;
    playerNameInput.focus();
    return;
  }

  startRound();
});

restorePlayerName();

nextButton.addEventListener("click", advance);
document.querySelector("#play-again").addEventListener("click", startRound);
document.querySelector("#back-home").addEventListener("click", () => showScreen("welcome"));
