-- =====================================================================
--  CyberQuiz — limpa o ranking (mantém as perguntas)
--
--  Use antes da feira, para os testes não aparecerem no ranking.
--  Apaga jogadores e pontuações; categorias, fontes, perguntas e
--  alternativas continuam intactas.
--
--  Como usar
--    Supabase -> SQL Editor -> New query -> cole -> Run (Ctrl+Enter)
-- =====================================================================

BEGIN;

-- As duas tabelas juntas: pontuacao aponta para jogador, então o
-- PostgreSQL exige que as duas sejam truncadas na mesma instrução.
-- RESTART IDENTITY faz os ids voltarem a começar em 1.
TRUNCATE TABLE pontuacao, jogador RESTART IDENTITY;

COMMIT;

-- Conferência: deve voltar 0 e 0.
SELECT (SELECT COUNT(*) FROM jogador)   AS jogadores,
       (SELECT COUNT(*) FROM pontuacao) AS respostas,
       (SELECT COUNT(*) FROM pergunta)  AS perguntas;

-- E o ranking deve vir vazio:
SELECT * FROM vw_ranking;
