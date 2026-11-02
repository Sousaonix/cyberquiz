// =====================================================================
//  Acesso ao Supabase (PostgreSQL do projeto).
//
//  Duas consultas, nas views criadas em 08-views-api.sql:
//    vw_quiz_json -> uma linha por pergunta, já no formato do frontend
//    vw_ranking   -> soma de pontos por jogador
//
//  A chave usada aqui é a service_role (só no servidor!) — ela ignora RLS
//  e nunca pode aparecer no código do navegador.
// =====================================================================

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

export const supabaseConfigurado = Boolean(SUPABASE_URL && SUPABASE_KEY);

const cliente = supabaseConfigurado
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

// Cache curto: o quiz pede as perguntas a cada partida, e elas quase não
// mudam. 60 s evitam bater no Supabase a cada jogador que entra.
const CACHE_MS = 60_000;
let cache = { momento: 0, perguntas: null };

function falha(mensagem, status) {
  const erro = new Error(mensagem);
  erro.status = status;
  return erro;
}

export async function carregarPerguntas() {
  if (!cliente) {
    throw falha("Banco não configurado: defina SUPABASE_URL e SUPABASE_KEY no .env.", 503);
  }

  if (cache.perguntas && Date.now() - cache.momento < CACHE_MS) {
    return cache.perguntas;
  }

  const { data, error } = await cliente
    .from("vw_quiz_json")
    .select("id, questao")
    .order("id", { ascending: true });

  if (error) {
    throw falha(`Falha ao consultar o Supabase: ${error.message}`, 502);
  }

  const perguntas = (data ?? []).map((linha) => linha.questao);
  cache = { momento: Date.now(), perguntas };
  return perguntas;
}

export async function carregarRanking(limite = 10) {
  if (!cliente) {
    throw falha("Banco não configurado: defina SUPABASE_URL e SUPABASE_KEY no .env.", 503);
  }

  const { data, error } = await cliente
    .from("vw_ranking")
    .select("nome, total_pontos, acertos, erros, respostas, ultima_resposta")
    .limit(limite);

  if (error) {
    throw falha(`Falha ao consultar o ranking: ${error.message}`, 502);
  }

  return data ?? [];
}
