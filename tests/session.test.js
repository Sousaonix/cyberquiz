import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { assignThemes, createRound, formatElapsed, summarize, THEMES } from "../js/session.js";

function question(id, correct = "B", categoria = "Segurança Cibernética") {
  return {
    id,
    categoria,
    pergunta: `Pergunta ${id}?`,
    opcoes: { A: "Opção A", B: "Opção B", C: "Opção C", D: "Opção D" },
    resposta_correta: correct,
    explicacao: "Explicação.",
    fonte: "https://example.com",
  };
}

function bank(size = 12) {
  return Array.from({ length: size }, (_, index) =>
    question(
      index + 1,
      "B",
      index % 2 === 0 ? "Segurança Cibernética" : "Inteligência Artificial",
    ),
  );
}

test("cria uma rodada de 10 questões sem alterar o banco", () => {
  const source = bank();
  const snapshot = JSON.stringify(source);
  const round = createRound(source, () => 0);

  assert.equal(round.length, 10);
  assert.equal(new Set(round.map((item) => item.id)).size, 10);
  assert.equal(JSON.stringify(source), snapshot);
  for (const item of round) {
    assert.ok(THEMES.includes(item.theme));
    assert.equal(item.opcoes.B, "Opção B");
  }
});

test("não repete a cor neon em questões seguidas", () => {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const themes = assignThemes(10);
    for (let index = 1; index < themes.length; index += 1) {
      assert.notEqual(themes[index], themes[index - 1]);
      assert.ok(THEMES.includes(themes[index]));
    }
  }

  const clamped = assignThemes(6, () => 1);
  assert.equal(clamped.length, 6);
  assert.ok(clamped.every((theme) => THEMES.includes(theme)));
});

test("recusa banco pequeno ou questão inválida", () => {
  assert.throws(() => createRound(bank(9)), /pelo menos 10/);
  const broken = bank();
  broken[0] = { ...broken[0], resposta_correta: "E" };
  assert.throws(() => createRound(broken), /resposta inválida/);
});

test("resume o placar e o texto conforme o aproveitamento", () => {
  const round = Array.from({ length: 10 }, (_, index) =>
    question(index + 1, "A", index < 7 ? "Segurança Cibernética" : "Inteligência Artificial"),
  );

  const high = summarize(round, Array.from({ length: 10 }, () => "A"));
  assert.equal(high.correctCount, 10);
  assert.equal(high.percent, 100);
  assert.equal(high.wrongCount, 0);
  assert.equal(high.headline, "Parabéns!");
  assert.equal(high.rank, "Expert em Tecnologia");
  assert.match(high.detail, /Segurança Cibernética e Inteligência Artificial/);

  const mid = summarize(round, ["A", "A", "A", "A", "A", "B", "B", "B", "B", "B"]);
  assert.equal(mid.correctCount, 5);
  assert.equal(mid.wrongCount, 5);
  assert.equal(mid.percent, 50);
  assert.equal(mid.headline, "Parabéns!");
  assert.equal(mid.rank, "Em evolução");

  const low = summarize(
    round.map((item) => ({ ...item, categoria: "Inteligência Artificial" })),
    ["A", "A", "A", "A", "B", "B", "B", "B", "B", "B"],
  );
  assert.equal(low.correctCount, 4);
  assert.equal(low.percent, 40);
  assert.equal(low.headline, "Continue praticando!");
  assert.equal(low.rank, "Hora de revisar");
  assert.equal(low.wrongCount, 6);
  assert.match(low.detail, /revisar Inteligência Artificial em outra rodada/);
  assert.doesNotMatch(low.detail, /Segurança/);

  assert.throws(() => summarize(round, ["A"]), /não foi concluída/);
});

test("formata o tempo da rodada em minutos e segundos", () => {
  assert.equal(formatElapsed(0), "00:00");
  assert.equal(formatElapsed(4000), "00:04");
  assert.equal(formatElapsed(125000), "02:05");
  assert.equal(formatElapsed(272000), "04:32");
  assert.equal(formatElapsed(-50), "00:00");
  assert.equal(formatElapsed(Number.NaN), "00:00");
});

test("o banco real forma uma rodada válida", async () => {
  const questions = JSON.parse(
    await readFile(new URL("../questoes.json", import.meta.url), "utf8"),
  );
  const round = createRound(questions, () => 0.42);

  assert.equal(round.length, 10);
  assert.equal(new Set(round.map((item) => item.id)).size, 10);
  for (let index = 1; index < round.length; index += 1) {
    assert.notEqual(round[index].theme, round[index - 1].theme);
  }
});
