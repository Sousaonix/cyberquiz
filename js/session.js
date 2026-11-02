export const THEMES = ["cyan", "green", "purple", "orange"];
export const ROUND_SIZE = 10;
const LETTERS = ["A", "B", "C", "D"];

function rollIndex(length, random) {
  const roll = random();
  const normalized = Number.isFinite(roll)
    ? Math.min(Math.max(roll, 0), 0.999999)
    : 0;
  return Math.floor(normalized * length);
}

export function shuffle(items, random = Math.random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = rollIndex(index + 1, random);
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

// A mesma cor não se repete na questão seguinte, para a troca de neon ficar visível.
export function assignThemes(count, random = Math.random) {
  const themes = [];
  for (let index = 0; index < count; index += 1) {
    const available = THEMES.filter((theme) => theme !== themes[index - 1]);
    themes.push(available[rollIndex(available.length, random)]);
  }
  return themes;
}

function assertQuestion(question) {
  const label = question?.id ?? "sem id";
  if (!question || typeof question.pergunta !== "string" || !question.pergunta.trim()) {
    throw new Error(`A questão ${label} está sem enunciado.`);
  }
  if (typeof question.categoria !== "string" || !question.categoria.trim()) {
    throw new Error(`A questão ${label} está sem categoria.`);
  }
  const options = question.opcoes;
  const hasOptions = LETTERS.every(
    (letter) => typeof options?.[letter] === "string" && options[letter].trim(),
  );
  if (!hasOptions) {
    throw new Error(`A questão ${label} está com opções incompletas.`);
  }
  if (!LETTERS.includes(question.resposta_correta)) {
    throw new Error(`A questão ${label} está com resposta inválida.`);
  }
}

function uniqueById(questions) {
  const seen = new Set();
  return questions.filter((question) => {
    if (seen.has(question.id)) return false;
    seen.add(question.id);
    return true;
  });
}

export function createRound(questions, random = Math.random) {
  if (!Array.isArray(questions)) {
    throw new Error("O banco de questões precisa ser uma lista.");
  }

  const bank = uniqueById(questions);
  if (bank.length < ROUND_SIZE) {
    throw new Error(`O banco precisa de pelo menos ${ROUND_SIZE} questões.`);
  }

  for (const question of bank) {
    assertQuestion(question);
  }

  const themes = assignThemes(ROUND_SIZE, random);
  return shuffle(bank, random)
    .slice(0, ROUND_SIZE)
    .map((question, index) => ({
      id: question.id,
      categoria: question.categoria,
      pergunta: question.pergunta,
      opcoes: { ...question.opcoes },
      resposta_correta: question.resposta_correta,
      explicacao: typeof question.explicacao === "string" ? question.explicacao : "",
      fonte: typeof question.fonte === "string" ? question.fonte : "",
      theme: themes[index],
    }));
}

function categoryPhrase(round) {
  const categories = [...new Set(round.map((question) => question.categoria))];
  if (categories.length === 0) return "tecnologia";
  if (categories.length === 1) return categories[0];
  return `${categories.slice(0, -1).join(", ")} e ${categories.at(-1)}`;
}

export function summarize(round, chosenLetters) {
  if (!Array.isArray(round) || !Array.isArray(chosenLetters) || chosenLetters.length !== round.length) {
    throw new Error("A rodada ainda não foi concluída.");
  }

  const total = round.length;
  const correctCount = round.reduce(
    (count, question, index) =>
      count + (question.resposta_correta === chosenLetters[index] ? 1 : 0),
    0,
  );
  const percent = total === 0 ? 0 : Math.round((correctCount / total) * 100);
  const phrase = categoryPhrase(round);
  const score = {
    correctCount,
    wrongCount: total - correctCount,
    total,
    percent,
  };

  if (percent >= 80) {
    return {
      ...score,
      headline: "Parabéns!",
      rank: "Expert em Tecnologia",
      detail: `Seu conhecimento em ${phrase} é realmente impressionante!`,
    };
  }

  if (percent >= 50) {
    return {
      ...score,
      headline: "Parabéns!",
      rank: "Em evolução",
      detail: `Você já reconhece boa parte de ${phrase}.`,
    };
  }

  return {
    ...score,
    headline: "Continue praticando!",
    rank: "Hora de revisar",
    detail: `Vale revisar ${phrase} em outra rodada.`,
  };
}

export function formatElapsed(milliseconds) {
  const safe = Number.isFinite(milliseconds) ? Math.max(0, milliseconds) : 0;
  const totalSeconds = Math.floor(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
