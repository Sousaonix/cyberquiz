// =====================================================================
//  CyberQuiz API — servidor HTTP com rotas montadas à mão.
//
//  Sem Express de propósito (é o que o roteiro da disciplina pede): aqui
//  dá para ver o que um framework esconde — ler a URL, escolher a rota,
//  montar cabeçalhos, devolver JSON.
//
//  Este arquivo só monta o servidor. Quem o coloca no ar é o server.js,
//  e quem busca os dados é o supabase.js. Assim o roteamento pode ser
//  testado sem banco (ver test/api.test.js).
// =====================================================================

import http from "node:http";

const CACHE_CONTROL = "public, max-age=60";

// Comparação de categoria sem depender de acento nem de maiúsculas.
function chave(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function cabecalhosCors(corsOrigin, origem) {
  const permitidas = String(corsOrigin || "*")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  let permitir = "*";
  if (!permitidas.includes("*")) {
    permitir = origem && permitidas.includes(origem) ? origem : permitidas[0] ?? "*";
  }

  return {
    "Access-Control-Allow-Origin": permitir,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Expose-Headers": "X-Total-Count",
    Vary: "Origin",
  };
}

function enviarJson(res, status, corpo, extras = {}) {
  const texto = JSON.stringify(corpo);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(texto),
    ...extras,
  });
  res.end(texto);
}

function statusDoErro(erro) {
  return Number.isInteger(erro?.status) ? erro.status : 500;
}

export function createServer({
  loadPerguntas,
  loadRanking,
  corsOrigin = process.env.CORS_ORIGIN || "*",
} = {}) {
  if (typeof loadPerguntas !== "function") {
    throw new Error("createServer precisa de loadPerguntas.");
  }

  const ranking = typeof loadRanking === "function" ? loadRanking : async () => [];

  const rotas = [
    {
      metodo: "GET",
      padrao: /^\/$/,
      tratar: () => ({
        nome: "CyberQuiz API",
        descricao: "Perguntas do CyberQuiz servidas em JSON a partir do Supabase.",
        endpoints: [
          "GET /perguntas",
          "GET /perguntas?categoria=Inteligência Artificial",
          "GET /perguntas?limite=10",
          "GET /perguntas/:id",
          "GET /categorias",
          "GET /ranking",
          "GET /health",
        ],
      }),
    },
    {
      metodo: "GET",
      padrao: /^\/health$/,
      tratar: async () => {
        const perguntas = await loadPerguntas();
        return {
          status: "ok",
          perguntas: perguntas.length,
          hora: new Date().toISOString(),
        };
      },
    },
    {
      metodo: "GET",
      padrao: /^\/perguntas$/,
      tratar: async ({ url }) => {
        const categoria = url.searchParams.get("categoria");
        const limite = Number(url.searchParams.get("limite"));

        let lista = await loadPerguntas();
        if (categoria) {
          const alvo = chave(categoria);
          lista = lista.filter((item) => chave(item?.categoria) === alvo);
        }

        const total = lista.length;
        if (Number.isInteger(limite) && limite > 0) {
          lista = lista.slice(0, limite);
        }

        return { corpo: lista, extras: { "X-Total-Count": String(total), "Cache-Control": CACHE_CONTROL } };
      },
    },
    {
      metodo: "GET",
      padrao: /^\/perguntas\/([^/]+)$/,
      tratar: async ({ params }) => {
        const lista = await loadPerguntas();
        const alvo = String(params[0]);
        const pergunta = lista.find((item) => String(item?.id) === alvo);
        if (!pergunta) {
          const erro = new Error(`Pergunta ${alvo} não encontrada.`);
          erro.status = 404;
          throw erro;
        }
        return { corpo: pergunta, extras: { "Cache-Control": CACHE_CONTROL } };
      },
    },
    {
      metodo: "GET",
      padrao: /^\/categorias$/,
      tratar: async () => {
        const lista = await loadPerguntas();
        const contagem = new Map();
        for (const item of lista) {
          const nome = item?.categoria ?? "Sem categoria";
          contagem.set(nome, (contagem.get(nome) ?? 0) + 1);
        }
        const corpo = [...contagem.entries()]
          .map(([nome, total]) => ({ nome, total }))
          .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
        return { corpo, extras: { "Cache-Control": CACHE_CONTROL } };
      },
    },
    {
      metodo: "GET",
      padrao: /^\/ranking$/,
      tratar: async ({ url }) => {
        const limite = Number(url.searchParams.get("limite"));
        const quantos = Number.isInteger(limite) && limite > 0 ? Math.min(limite, 100) : 10;
        return { corpo: await ranking(quantos) };
      },
    },
  ];

  return http.createServer(async (req, res) => {
    const origem = req.headers.origin;
    const cors = cabecalhosCors(corsOrigin, origem);
    for (const [nome, valor] of Object.entries(cors)) res.setHeader(nome, valor);

    // Preflight do navegador: o frontend em github.io chamando a API em
    // onrender.com é "cross-origin", então o OPTIONS precisa responder.
    if (req.method === "OPTIONS") {
      res.writeHead(204, { "Content-Length": 0 });
      res.end();
      return;
    }

    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const caminho = url.pathname.replace(/\/+$/, "") || "/";

    let casouCaminho = false;
    for (const rota of rotas) {
      const resultado = rota.padrao.exec(caminho);
      if (!resultado) continue;
      casouCaminho = true;

      if (rota.metodo !== req.method) continue;

      try {
        const saida = await rota.tratar({
          req,
          res,
          url,
          params: resultado.slice(1).map(decodeURIComponent),
        });
        const { corpo, extras = {} } = saida?.corpo !== undefined ? saida : { corpo: saida };
        enviarJson(res, 200, corpo, extras);
      } catch (erro) {
        const status = statusDoErro(erro);
        console.error(`[${status}] ${req.method} ${caminho}: ${erro?.message ?? erro}`);
        enviarJson(res, status, { erro: erro?.message ?? "Erro interno." });
      }
      return;
    }

    if (casouCaminho) {
      res.writeHead(405, { Allow: "GET, OPTIONS", "Content-Length": 0 });
      res.end();
      return;
    }

    enviarJson(res, 404, { erro: `Rota ${caminho} não existe. Veja GET /.` });
  });
}
