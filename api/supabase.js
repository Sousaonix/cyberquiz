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
    .select("posicao, nome, total_pontos, acertos, erros, respostas, ultima_resposta")
    .limit(limite);

  if (error) {
    throw falha(`Falha ao consultar o ranking: ${error.message}`, 502);
  }

  return data ?? [];
}

// Grava uma rodada inteira de uma vez:
//   1. garante o jogador pelo nome (o quiz não tem login);
//   2. descobre o id de cada alternativa escolhida;
//   3. insere as respostas — o gatilho do banco calcula valor_pontos;
//   4. devolve o placar e o ranking atualizado para a tela final.
export async function salvarRespostas({ nome, respostas }) {
  if (!cliente) {
    throw falha("Banco não configurado: defina SUPABASE_URL e SUPABASE_KEY no .env.", 503);
  }

  const { data: jogador, error: erroJogador } = await cliente
    .from("jogador")
    .upsert({ nome }, { onConflict: "nome" })
    .select("id_jogador, nome")
    .single();

  if (erroJogador) {
    throw falha(`Falha ao registrar o jogador: ${erroJogador.message}`, 502);
  }

  const idsPerguntas = [...new Set(respostas.map((item) => item.id_pergunta))];

  const { data: alternativas, error: erroAlternativas } = await cliente
    .from("alternativa")
    .select("id_alternativa, id_pergunta, identificador")
    .in("id_pergunta", idsPerguntas);

  if (erroAlternativas) {
    throw falha(`Falha ao consultar as alternativas: ${erroAlternativas.message}`, 502);
  }

  const porChave = new Map(
    (alternativas ?? []).map((linha) => [`${linha.id_pergunta}|${linha.identificador}`, linha.id_alternativa]),
  );

  const linhas = respostas.map((item) => {
    const idAlternativa = porChave.get(`${item.id_pergunta}|${item.escolha}`);
    if (!idAlternativa) {
      const erro = new Error(
        `A pergunta ${item.id_pergunta} não tem a alternativa ${item.escolha}.`,
      );
      erro.status = 400;
      throw erro;
    }
    return {
      id_jogador: jogador.id_jogador,
      id_pergunta: item.id_pergunta,
      id_alternativa: idAlternativa,
    };
  });

  const { data: gravadas, error: erroInsert } = await cliente
    .from("pontuacao")
    .insert(linhas)
    .select("valor_pontos");

  if (erroInsert) {
    throw falha(`Falha ao gravar as respostas: ${erroInsert.message}`, 502);
  }

  const totalPontos = gravadas.reduce((soma, linha) => soma + linha.valor_pontos, 0);
  const acertos = gravadas.filter((linha) => linha.valor_pontos > 0).length;

  return {
    jogador: { id: jogador.id_jogador, nome: jogador.nome },
    total_pontos: totalPontos,
    acertos,
    erros: gravadas.length - acertos,
    respostas: gravadas.length,
    ranking: await carregarRanking(5),
  };
}
