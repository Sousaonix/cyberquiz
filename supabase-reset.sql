-- =====================================================================
--  CyberQuiz — reset do banco (apaga APENAS os objetos do projeto)
--
--  Use quando o supabase-setup.sql reclamar que algo "já existe",
--  por exemplo: 42P07: relation "categoria" already exists.
--
--  O que ele NÃO toca: auth, storage, extensions e qualquer schema que
--  não seja o public do CyberQuiz.
--
--  ATENÇÃO: apaga as perguntas e as pontuações gravadas. Depois de rodar
--  este arquivo, rode o supabase-setup.sql de novo.
-- =====================================================================

BEGIN;

-- Views primeiro (dependem das tabelas)
DROP VIEW IF EXISTS vw_desempenho_pergunta CASCADE;
DROP VIEW IF EXISTS vw_ranking             CASCADE;
DROP VIEW IF EXISTS vw_quiz_json           CASCADE;
DROP VIEW IF EXISTS vw_pergunta_completa   CASCADE;

-- Tabelas (a ordem respeita as FKs; CASCADE cobre o resto)
DROP TABLE IF EXISTS pontuacao   CASCADE;
DROP TABLE IF EXISTS alternativa CASCADE;
DROP TABLE IF EXISTS pergunta    CASCADE;
DROP TABLE IF EXISTS fonte       CASCADE;
DROP TABLE IF EXISTS jogador     CASCADE;
DROP TABLE IF EXISTS categoria   CASCADE;
DROP TABLE IF EXISTS publicador  CASCADE;
DROP TABLE IF EXISTS idioma      CASCADE;

-- Funções e gatilhos
DROP FUNCTION IF EXISTS fn_pontuar_resposta()        CASCADE;
DROP FUNCTION IF EXISTS fn_trg_valida_pergunta()     CASCADE;
DROP FUNCTION IF EXISTS fn_trg_valida_alternativa()  CASCADE;
DROP FUNCTION IF EXISTS fn_checar_gabarito(integer)  CASCADE;

COMMIT;

-- Conferência: deve voltar vazio.
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
