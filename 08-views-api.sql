-- =====================================================================
--  CyberQuiz — Passo 11: views consumidas pela API
--  Rode depois de 04-ddl.sql e 07-seed-questoes.sql.
--
--  Para que servem
--    vw_pergunta_completa  -> uma linha por pergunta, com alternativas
--                             agregadas em JSON e o gabarito.
--    vw_quiz_json          -> o MESMO formato do questoes.json, pronto para
--                             o endpoint GET /perguntas do backend.
--    vw_ranking            -> soma de pontos por jogador (o MER diz que
--                             ranking é consulta, não tabela).
--    vw_desempenho_pergunta-> acertos/erros por pergunta (tela de estatística).
--
--  As views não guardam dados: refletem o que está nas tabelas.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1) Pergunta completa
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_pergunta_completa AS
SELECT
    q.id_pergunta,
    q.codigo,
    c.nome        AS categoria,
    q.titulo,
    q.enunciado,
    q.explicacao,
    f.url         AS fonte_url,
    f.descricao   AS fonte_descricao,
    p.nome        AS publicador,
    i.codigo      AS idioma,
    -- {"A": "...", "B": "...", "C": "...", "D": "..."}
    jsonb_object_agg(a.identificador, a.texto ORDER BY a.identificador)
                  AS alternativas,
    max(a.identificador) FILTER (WHERE a.correta)
                  AS resposta_correta
FROM pergunta q
JOIN categoria   c ON c.id_categoria  = q.id_categoria
JOIN fonte       f ON f.id_fonte      = q.id_fonte
JOIN publicador  p ON p.id_publicador = f.id_publicador
JOIN idioma      i ON i.id_idioma     = f.id_idioma
JOIN alternativa a ON a.id_pergunta   = q.id_pergunta
GROUP BY q.id_pergunta, q.codigo, c.nome, q.titulo, q.enunciado, q.explicacao,
         f.url, f.descricao, p.nome, i.codigo;

-- ---------------------------------------------------------------------
-- 2) Formato do frontend
--    Cada linha vira exatamente o objeto que js/quiz.js e js/session.js
--    esperam: id, categoria, pergunta, opcoes, resposta_correta,
--    explicacao, fonte.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_quiz_json AS
SELECT
    substring(v.codigo from 2)::int AS id,
    jsonb_build_object(
        'id',               substring(v.codigo from 2)::int,
        'categoria',        v.categoria,
        'pergunta',         v.enunciado,
        'opcoes',           v.alternativas,
        'resposta_correta', v.resposta_correta,
        'explicacao',       v.explicacao,
        'fonte',            COALESCE(v.fonte_url, '')
    ) AS questao
FROM vw_pergunta_completa v;

-- ---------------------------------------------------------------------
-- 3) Ranking (MER: soma de valor_pontos por jogador)
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_ranking AS
SELECT
    j.id_jogador,
    j.nome,
    COALESCE(SUM(pt.valor_pontos), 0)         AS total_pontos,
    COUNT(pt.id_pontuacao)                     AS respostas,
    COUNT(*) FILTER (WHERE a.correta)          AS acertos,
    COUNT(*) FILTER (WHERE a.correta IS FALSE) AS erros,
    MAX(pt.data_resposta)                      AS ultima_resposta
FROM jogador j
LEFT JOIN pontuacao   pt ON pt.id_jogador    = j.id_jogador
LEFT JOIN alternativa a  ON a.id_alternativa = pt.id_alternativa
GROUP BY j.id_jogador, j.nome
ORDER BY total_pontos DESC, acertos DESC, j.nome;

-- ---------------------------------------------------------------------
-- 4) Desempenho por pergunta (útil na apresentação: qual tema o público
--    mais erra)
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_desempenho_pergunta AS
SELECT
    q.codigo,
    c.nome AS categoria,
    q.enunciado,
    COUNT(pt.id_pontuacao) AS respostas,
    COUNT(*) FILTER (WHERE a.correta) AS acertos,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE a.correta)
        / NULLIF(COUNT(pt.id_pontuacao), 0), 1
    ) AS percentual_acerto
FROM pergunta q
JOIN categoria c ON c.id_categoria = q.id_categoria
LEFT JOIN pontuacao   pt ON pt.id_pergunta    = q.id_pergunta
LEFT JOIN alternativa a  ON a.id_alternativa = pt.id_alternativa
GROUP BY q.id_pergunta, q.codigo, c.nome, q.enunciado;

-- Em Supabase, libera as views para as chaves anon/authenticated. O bloco
-- só roda quando esses papéis existem (no PostgreSQL puro da disciplina
-- eles não existem, e aí o GRANT é ignorado).
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        EXECUTE 'GRANT SELECT ON vw_pergunta_completa, vw_quiz_json, vw_ranking, vw_desempenho_pergunta
                 TO anon, authenticated, service_role';
    END IF;
END
$$;

COMMIT;

-- =====================================================================
--  Exemplos de consulta (é isso que o backend vai rodar)
-- =====================================================================
--
-- GET /perguntas  -> lista completa em JSON
--   SELECT jsonb_agg(questao ORDER BY id) AS perguntas FROM vw_quiz_json;
--
-- GET /perguntas?categoria=Inteligência Artificial
--   SELECT jsonb_agg(v.questao ORDER BY v.id) AS perguntas
--   FROM vw_quiz_json v
--   WHERE v.questao->>'categoria' = 'Inteligência Artificial';
--
-- GET /ranking  -> 10 melhores
--   SELECT nome, total_pontos, acertos, respostas
--   FROM vw_ranking
--   LIMIT 10;
--
-- POST /respostas  -> registra a resposta e o banco calcula os pontos
--   INSERT INTO pontuacao (id_jogador, id_pergunta, id_alternativa)
--   VALUES ($1, $2, $3);
--
-- =====================================================================
--  RLS (Supabase)
--  Tabelas criadas pelo SQL Editor ficam SEM Row Level Security. Se você
--  ativar RLS, o backend com a chave `anon` passa a não ler nada sem uma
--  policy. Como o backend usa a chave de serviço (`service_role`), o
--  acesso continua liberado — mas se algum dia o frontend falar direto
--  com o Supabase, habilite leitura pública assim:
--
--    ALTER TABLE categoria    ENABLE ROW LEVEL SECURITY;
--    ALTER TABLE publicador   ENABLE ROW LEVEL SECURITY;
--    ALTER TABLE idioma       ENABLE ROW LEVEL SECURITY;
--    ALTER TABLE fonte        ENABLE ROW LEVEL SECURITY;
--    ALTER TABLE pergunta     ENABLE ROW LEVEL SECURITY;
--    ALTER TABLE alternativa  ENABLE ROW LEVEL SECURITY;
--
--    CREATE POLICY leitura_publica ON categoria   FOR SELECT TO anon USING (true);
--    CREATE POLICY leitura_publica ON publicador  FOR SELECT TO anon USING (true);
--    CREATE POLICY leitura_publica ON idioma      FOR SELECT TO anon USING (true);
--    CREATE POLICY leitura_publica ON fonte       FOR SELECT TO anon USING (true);
--    CREATE POLICY leitura_publica ON pergunta    FOR SELECT TO anon USING (true);
--    CREATE POLICY leitura_publica ON alternativa FOR SELECT TO anon USING (true);
-- =====================================================================
