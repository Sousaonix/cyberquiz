import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "../app.js";

const PERGUNTAS = [
  {
    id: 1,
    categoria: "Segurança Cibernética",
    pergunta: "O que é uma VPN?",
    opcoes: { A: "a", B: "b", C: "c", D: "d" },
    resposta_correta: "B",
    explicacao: "Criptografa a comunicação.",
    fonte: "https://example.com/vpn",
  },
  {
    id: 2,
    categoria: "Inteligência Artificial",
    pergunta: "O que é um prompt?",
    opcoes: { A: "a", B: "b", C: "c", D: "d" },
    resposta_correta: "A",
    explicacao: "É a entrada de texto.",
    fonte: "https://example.com/prompt",
  },
];

async function iniciar(opcoes = {}) {
  const servidor = createServer({
    loadPerguntas: async () => PERGUNTAS,
    corsOrigin: "https://sousaonix.github.io",
    ...opcoes,
  });

  await new Promise((resolve) => servidor.listen(0, "127.0.0.1", resolve));
  const { port } = servidor.address();

  return {
    base: `http://127.0.0.1:${port}`,
    parar: () => new Promise((resolve) => servidor.close(resolve)),
  };
}

test("GET /perguntas devolve a lista completa", async (t) => {
  const api = await iniciar();
  t.after(() => api.parar());

  const resposta = await fetch(`${api.base}/perguntas`);
  assert.equal(resposta.status, 200);
  assert.match(resposta.headers.get("content-type"), /application\/json/);

  const corpo = await resposta.json();
  assert.ok(Array.isArray(corpo));
  assert.equal(corpo.length, 2);
  assert.equal(corpo[0].id, 1);
  assert.equal(corpo[0].opcoes.B, "b");
  assert.equal(resposta.headers.get("x-total-count"), "2");
});

test("filtra por categoria ignorando acento e maiúsculas", async (t) => {
  const api = await iniciar();
  t.after(() => api.parar());

  const resposta = await fetch(`${api.base}/perguntas?categoria=inteligencia artificial`);
  const corpo = await resposta.json();

  assert.equal(corpo.length, 1);
  assert.equal(corpo[0].id, 2);
});

test("respeita o limite de perguntas", async (t) => {
  const api = await iniciar();
  t.after(() => api.parar());

  const resposta = await fetch(`${api.base}/perguntas?limite=1`);
  const corpo = await resposta.json();

  assert.equal(corpo.length, 1);
  assert.equal(resposta.headers.get("x-total-count"), "2");
});

test("GET /perguntas/:id devolve uma pergunta e 404 quando não existe", async (t) => {
  const api = await iniciar();
  t.after(() => api.parar());

  const encontrada = await fetch(`${api.base}/perguntas/2`);
  assert.equal(encontrada.status, 200);
  assert.equal((await encontrada.json()).id, 2);

  const ausente = await fetch(`${api.base}/perguntas/999`);
  assert.equal(ausente.status, 404);
  assert.match((await ausente.json()).erro, /não encontrada/);
});

test("GET /categorias agrupa e conta as perguntas", async (t) => {
  const api = await iniciar();
  t.after(() => api.parar());

  const corpo = await (await fetch(`${api.base}/categorias`)).json();

  assert.deepEqual(
    corpo.map((item) => [item.nome, item.total]),
    [
      ["Inteligência Artificial", 1],
      ["Segurança Cibernética", 1],
    ],
  );
});

test("GET /health informa o total de perguntas", async (t) => {
  const api = await iniciar();
  t.after(() => api.parar());

  const resposta = await fetch(`${api.base}/health`);
  const corpo = await resposta.json();

  assert.equal(resposta.status, 200);
  assert.equal(corpo.status, "ok");
  assert.equal(corpo.perguntas, 2);
});

test("GET /ranking usa o provedor injetado", async (t) => {
  const api = await iniciar({
    loadRanking: async (limite) => [{ nome: "Nayra", total_pontos: 100, respostas: 10, limite }],
  });
  t.after(() => api.parar());

  const corpo = await (await fetch(`${api.base}/ranking?limite=5`)).json();

  assert.equal(corpo[0].nome, "Nayra");
  assert.equal(corpo[0].limite, 5);
});

test("libera CORS apenas para a origem configurada", async (t) => {
  const api = await iniciar();
  t.after(() => api.parar());

  const permitida = await fetch(`${api.base}/perguntas`, {
    headers: { Origin: "https://sousaonix.github.io" },
  });
  assert.equal(permitida.headers.get("access-control-allow-origin"), "https://sousaonix.github.io");

  const estranha = await fetch(`${api.base}/perguntas`, {
    headers: { Origin: "https://exemplo.com" },
  });
  assert.equal(estranha.headers.get("access-control-allow-origin"), "https://sousaonix.github.io");
});

test("OPTIONS responde 204 para o preflight do navegador", async (t) => {
  const api = await iniciar();
  t.after(() => api.parar());

  const resposta = await fetch(`${api.base}/perguntas`, { method: "OPTIONS" });

  assert.equal(resposta.status, 204);
  assert.match(resposta.headers.get("access-control-allow-methods"), /GET/);
});

test("método errado devolve 405 e rota inexistente devolve 404", async (t) => {
  const api = await iniciar();
  t.after(() => api.parar());

  const post = await fetch(`${api.base}/perguntas`, { method: "POST" });
  assert.equal(post.status, 405);
  assert.match(post.headers.get("allow"), /GET/);

  const inexistente = await fetch(`${api.base}/nao-existe`);
  assert.equal(inexistente.status, 404);
});

test("POST /respostas grava a rodada e devolve o ranking", async (t) => {
  let recebido = null;
  const api = await iniciar({
    salvarRespostas: async ({ nome, respostas }) => {
      recebido = { nome, respostas };
      return {
        jogador: { id: 1, nome },
        total_pontos: 30,
        acertos: 3,
        erros: 7,
        respostas: 10,
        ranking: [{ posicao: 1, nome, total_pontos: 30 }],
      };
    },
  });
  t.after(() => api.parar());

  const resposta = await fetch(`${api.base}/respostas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: "  Nayra ",
      respostas: [
        { id_pergunta: 1, escolha: "b" },
        { id_pergunta: 2, escolha: "A" },
      ],
    }),
  });

  assert.equal(resposta.status, 200);
  const corpo = await resposta.json();
  assert.equal(corpo.total_pontos, 30);
  assert.equal(corpo.ranking[0].nome, "Nayra");

  // Normalizações feitas pelo servidor antes de tocar no banco.
  assert.equal(recebido.nome, "Nayra");
  assert.deepEqual(recebido.respostas, [
    { id_pergunta: 1, escolha: "B" },
    { id_pergunta: 2, escolha: "A" },
  ]);
});

test("POST /respostas recusa corpo inválido", async (t) => {
  const api = await iniciar({ salvarRespostas: async () => ({}) });
  t.after(() => api.parar());

  const semNome = await fetch(`${api.base}/respostas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome: "  ", respostas: [{ id_pergunta: 1, escolha: "A" }] }),
  });
  assert.equal(semNome.status, 400);

  const semRespostas = await fetch(`${api.base}/respostas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome: "Nayra", respostas: [] }),
  });
  assert.equal(semRespostas.status, 400);

  const jsonQuebrado = await fetch(`${api.base}/respostas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{nao-json",
  });
  assert.equal(jsonQuebrado.status, 400);
});

test("POST /respostas responde 503 quando o servidor não grava", async (t) => {
  const api = await iniciar();
  t.after(() => api.parar());

  const resposta = await fetch(`${api.base}/respostas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome: "Nayra", respostas: [{ id_pergunta: 1, escolha: "A" }] }),
  });

  assert.equal(resposta.status, 503);
});

test("erro do banco chega ao cliente com o status certo", async (t) => {
  const falha = new Error("Banco não configurado: defina SUPABASE_URL e SUPABASE_KEY no .env.");
  falha.status = 503;

  const api = await iniciar({
    loadPerguntas: async () => {
      throw falha;
    },
  });
  t.after(() => api.parar());

  const resposta = await fetch(`${api.base}/perguntas`);

  assert.equal(resposta.status, 503);
  assert.match((await resposta.json()).erro, /SUPABASE_URL/);
});
