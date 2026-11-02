-- =====================================================================
--  CyberQuiz — Passo 7: modelo físico (DDL)
--  Equipe        : <preencher>
--  Marco         : M3
--  SGBD          : PostgreSQL 13+
--  Justificativa : é o SGBD adotado na disciplina e o que a equipe de
--                  Aplicativos para Web vai consultar; oferece IDENTITY,
--                  CHECK/UNIQUE declarativos, índice único parcial e
--                  gatilhos de restrição adiados, que são o que este
--                  modelo precisa para garantir um único gabarito.
--
--  CONTRATO COM APLICATIVOS PARA WEB
--  Os nomes de tabela e de coluna abaixo são os acordados com a disciplina
--  de Web. Alteração posterior exige registro no repositório e aviso à
--  equipe de Web.
--
--  COMO RODAR EM BANCO VAZIO
--    createdb cyberquiz
--    psql -d cyberquiz -v ON_ERROR_STOP=1 -f 04-ddl.sql
--
--  COMO RODAR NO SUPABASE (produção do quiz)
--    SQL Editor -> cole este arquivo inteiro -> Run
--    Depois: 07-seed-questoes.sql (perguntas reais)
--            08-views-api.sql    (views consumidas pela API)
--
--  Escopo deste arquivo: apenas esquema e domínio fixo (idiomas).
--  Categorias, publicadores, fontes, perguntas e alternativas ficam no
--  05-dml-consultas.sql (passo 8, massa de teste da disciplina) e no
--  07-seed-questoes.sql (carga real usada pelo jogo).
--
--  MAPA MER (Chen) -> TABELAS
--    CATEGORIA   (id_categoria, nome)          -> categoria
--    PUBLICADOR  (id_publicador, nome)         -> publicador
--    FONTE       (id_fonte, descricao, url)    -> fonte
--                 + publicador e idioma  ...... 1:1, viram FK em fonte
--    IDIOMA      (id_idioma, nome, codigo)     -> idioma (FK em fonte)
--    PERGUNTA    (id_pergunta, enunciado)      -> pergunta
--                 + codigo/titulo/explicacao .. atributos extra (RD08/RD09)
--    ALTERNATIVA (id_alternativa, identificador, texto, correta)
--                                              -> alternativa
--    JOGADOR     (id_jogador, nome)               -> jogador
--    PONTUACAO   (id_pontuacao, valor_pontos, data_resposta)
--                                              -> pontuacao
--
--    Relacionamentos do MER e como aparecem aqui:
--      CATEGORIA 1:N PERGUNTA   -> pergunta.id_categoria
--      FONTE     1:N PERGUNTA   -> pergunta.id_fonte
--      PUBLICADOR 1:N PERGUNTA  -> fonte.id_publicador (publicador é da fonte)
--      IDIOMA    1:N PERGUNTA   -> fonte.id_idioma     (idioma é da fonte)
--      PERGUNTA  1:N ALTERNATIVA-> alternativa.id_pergunta
--      JOGADOR   1:N PONTUACAO  -> pontuacao.id_jogador
--      PERGUNTA  1:N PONTUACAO  -> pontuacao.id_pergunta
--      ALTERNATIVA 1:N PONTUACAO (escolhe) -> pontuacao.id_alternativa
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1) Tabelas de apoio
-- ---------------------------------------------------------------------

CREATE TABLE categoria (
    id_categoria INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome         VARCHAR(100) NOT NULL,
    CONSTRAINT uq_categoria_nome UNIQUE (nome)
);

CREATE TABLE publicador (
    id_publicador INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome          VARCHAR(150) NOT NULL,
    CONSTRAINT uq_publicador_nome UNIQUE (nome)
);

CREATE TABLE idioma (
    id_idioma INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome      VARCHAR(80) NOT NULL,
    codigo    VARCHAR(10) NOT NULL,
    CONSTRAINT uq_idioma_nome   UNIQUE (nome),
    CONSTRAINT uq_idioma_codigo UNIQUE (codigo)
);

-- A fonte carrega o publicador e o idioma (RD03 e RD04): uma fonte tem
-- exatamente um publicador e um idioma; o que se repete entre perguntas
-- fica cadastrado uma única vez.
CREATE TABLE fonte (
    id_fonte      INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    descricao     VARCHAR(250) NOT NULL,
    url           TEXT,
    id_publicador INTEGER NOT NULL,
    id_idioma     INTEGER NOT NULL,

    CONSTRAINT fk_fonte_publicador
        FOREIGN KEY (id_publicador) REFERENCES publicador (id_publicador),
    CONSTRAINT fk_fonte_idioma
        FOREIGN KEY (id_idioma) REFERENCES idioma (id_idioma),
    -- RD02: a mesma URL não é cadastrada duas vezes.
    -- NULL é aceito e não conflita (fonte sem endereço, ex.: material impresso).
    CONSTRAINT uq_fonte_url UNIQUE (url)
);

-- ---------------------------------------------------------------------
-- 2) Pergunta
--    `codigo` preserva o identificador original (RD08: fact-001...).
--    `titulo`, `enunciado` e `explicacao` são obrigatórios (RD09).
-- ---------------------------------------------------------------------

CREATE TABLE pergunta (
    id_pergunta  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo       VARCHAR(20)  NOT NULL,
    titulo       VARCHAR(150) NOT NULL,
    enunciado    TEXT         NOT NULL,
    explicacao   TEXT         NOT NULL,
    id_categoria INTEGER      NOT NULL,
    id_fonte     INTEGER      NOT NULL,

    CONSTRAINT uq_pergunta_codigo UNIQUE (codigo),
    CONSTRAINT fk_pergunta_categoria
        FOREIGN KEY (id_categoria) REFERENCES categoria (id_categoria),
    CONSTRAINT fk_pergunta_fonte
        FOREIGN KEY (id_fonte) REFERENCES fonte (id_fonte)
);

-- ---------------------------------------------------------------------
-- 3) Alternativa
--    `correta` é o valor lógico da alternativa (RD05) e é o que permite ao
--    banco dizer se o jogador acertou (RD06/RA04). A quantidade não é fixa:
--    a pergunta aceita 2, 4 ou mais alternativas sem mudar de estrutura
--    (RD07).
-- ---------------------------------------------------------------------

CREATE TABLE alternativa (
    id_alternativa INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_pergunta    INTEGER     NOT NULL,
    identificador  VARCHAR(20) NOT NULL,
    texto          TEXT        NOT NULL,
    correta        BOOLEAN     NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_alternativa_pergunta
        FOREIGN KEY (id_pergunta) REFERENCES pergunta (id_pergunta)
        ON DELETE CASCADE,
    CONSTRAINT uq_alternativa_identificador
        UNIQUE (id_pergunta, identificador)
);

-- No máximo UMA alternativa correta por pergunta.
CREATE UNIQUE INDEX ux_alternativa_uma_correta
    ON alternativa (id_pergunta) WHERE correta;

-- ---------------------------------------------------------------------
-- 4) Jogador (só o nome — sem login, sem e-mail)
--
--    Decisão de escopo: o quiz não tem cadastro nem senha. O jogador digita
--    o nome e começa a jogar; o nome é único para o ranking conseguir
--    somar as rodadas da mesma pessoa.
-- ---------------------------------------------------------------------

CREATE TABLE jogador (
    id_jogador INTEGER      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome       VARCHAR(120) NOT NULL,
    CONSTRAINT uq_jogador_nome UNIQUE (nome)
);

-- ---------------------------------------------------------------------
-- 5) Pontuação
--    MER corrigido: JOGADOR 1:N PONTUACAO (obtém),
--                   PERGUNTA 1:N PONTUACAO (gera),
--                   ALTERNATIVA 1:N PONTUACAO (escolhe).
--
--    Cada linha é uma resposta: qual jogador, qual pergunta, qual
--    alternativa ele escolheu, quantos pontos ganhou e quando respondeu.
--
--    Regras do MER implementadas aqui:
--      * o jogador pode responder de novo em outra rodada: cada rodada
--        grava as suas próprias linhas (não há UNIQUE jogador+pergunta);
--      * valor_pontos depende da alternativa escolhida ser a correta
--        (calculado pelo gatilho fn_pontuar_resposta);
--      * ranking NÃO é tabela: é a soma de valor_pontos por jogador,
--        entregue pela view vw_ranking (08-views-api.sql).
-- ---------------------------------------------------------------------

CREATE TABLE pontuacao (
    id_pontuacao   INTEGER     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_jogador     INTEGER     NOT NULL,
    id_pergunta    INTEGER     NOT NULL,
    id_alternativa INTEGER     NOT NULL,
    valor_pontos   INTEGER     NOT NULL DEFAULT 0,
    data_resposta  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_pontuacao_jogador
        FOREIGN KEY (id_jogador) REFERENCES jogador (id_jogador)
        ON DELETE CASCADE,
    CONSTRAINT fk_pontuacao_pergunta
        FOREIGN KEY (id_pergunta) REFERENCES pergunta (id_pergunta)
        ON DELETE CASCADE,
    CONSTRAINT fk_pontuacao_alternativa
        FOREIGN KEY (id_alternativa) REFERENCES alternativa (id_alternativa),
    CONSTRAINT ck_pontuacao_valor CHECK (valor_pontos >= 0)
);

-- O banco calcula a pontuação e recusa combinações impossíveis:
-- a alternativa escolhida precisa pertencer à pergunta respondida.
CREATE FUNCTION fn_pontuar_resposta() RETURNS TRIGGER AS $$
DECLARE
    v_correta BOOLEAN;
BEGIN
    SELECT a.correta
      INTO v_correta
      FROM alternativa a
     WHERE a.id_alternativa = NEW.id_alternativa
       AND a.id_pergunta    = NEW.id_pergunta;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'A alternativa % nao pertence a pergunta %.',
                        NEW.id_alternativa, NEW.id_pergunta;
    END IF;

    -- 10 pontos por acerto, 0 por erro (RA: valor depende de acertar ou não).
    NEW.valor_pontos  := CASE WHEN v_correta THEN 10 ELSE 0 END;
    NEW.data_resposta := COALESCE(NEW.data_resposta, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pontuacao_pontua
    BEFORE INSERT OR UPDATE ON pontuacao
    FOR EACH ROW EXECUTE FUNCTION fn_pontuar_resposta();

-- ---------------------------------------------------------------------
-- 6) Índices auxiliares (consultas por relacionamento)
-- ---------------------------------------------------------------------

CREATE INDEX idx_fonte_publicador     ON fonte (id_publicador);
CREATE INDEX idx_fonte_idioma         ON fonte (id_idioma);
CREATE INDEX idx_pergunta_categoria   ON pergunta (id_categoria);
CREATE INDEX idx_pergunta_fonte       ON pergunta (id_fonte);
CREATE INDEX idx_alternativa_pergunta ON alternativa (id_pergunta);
CREATE INDEX idx_pontuacao_jogador    ON pontuacao (id_jogador);
CREATE INDEX idx_pontuacao_pergunta   ON pontuacao (id_pergunta);

-- ---------------------------------------------------------------------
-- 7) Regra de negócio: toda pergunta tem pelo menos 2 alternativas e
--    exatamente 1 correta (RD06).
--    Verificação no COMMIT, para permitir inserir a pergunta e as suas
--    alternativas na mesma transação.
-- ---------------------------------------------------------------------

CREATE FUNCTION fn_checar_gabarito(p_id INT) RETURNS VOID AS $$
DECLARE
    v_total    INT;
    v_corretas INT;
BEGIN
    -- pergunta já removida (DELETE em cascata): nada a validar
    IF NOT EXISTS (SELECT 1 FROM pergunta WHERE id_pergunta = p_id) THEN
        RETURN;
    END IF;

    SELECT COUNT(*), COUNT(*) FILTER (WHERE correta)
      INTO v_total, v_corretas
      FROM alternativa
     WHERE id_pergunta = p_id;

    IF v_total < 2 THEN
        RAISE EXCEPTION 'Pergunta % possui % alternativa(s); o minimo e 2.', p_id, v_total;
    END IF;

    IF v_corretas <> 1 THEN
        RAISE EXCEPTION 'Pergunta % possui % alternativa(s) correta(s); deve haver exatamente 1.',
                        p_id, v_corretas;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION fn_trg_valida_alternativa() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        PERFORM fn_checar_gabarito(OLD.id_pergunta);
    END IF;
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        PERFORM fn_checar_gabarito(NEW.id_pergunta);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION fn_trg_valida_pergunta() RETURNS TRIGGER AS $$
BEGIN
    PERFORM fn_checar_gabarito(NEW.id_pergunta);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_alternativa_valida
    AFTER INSERT OR UPDATE OR DELETE ON alternativa
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION fn_trg_valida_alternativa();

CREATE CONSTRAINT TRIGGER trg_pergunta_valida
    AFTER INSERT ON pergunta
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION fn_trg_valida_pergunta();

-- ---------------------------------------------------------------------
-- 8) Domínio fixo
--    Idiomas são conjunto pequeno, controlado e reutilizado: entram já no
--    DDL. As alternativas NÃO têm domínio fixo: cada pergunta tem as suas,
--    e a quantidade é variável (RD07). Por isso não há INSERT em
--    `alternativa` neste arquivo.
-- ---------------------------------------------------------------------

INSERT INTO idioma (nome, codigo) VALUES
    ('Português', 'pt'),
    ('Inglês',    'en'),
    ('Espanhol',  'es');

COMMIT;
