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
--  Escopo deste arquivo: apenas esquema e domínio fixo (idiomas).
--  Categorias, publicadores, fontes, perguntas e alternativas ficam no
--  05-dml-consultas.sql (passo 8).
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
-- 4) Jogador (cadastro e login)
-- ---------------------------------------------------------------------

CREATE TABLE jogador (
    id_jogador INTEGER      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome       VARCHAR(120) NOT NULL,
    email      VARCHAR(254) NOT NULL,
    senha_hash TEXT         NOT NULL,
    CONSTRAINT uq_jogador_email UNIQUE (email)
);

-- ---------------------------------------------------------------------
-- 5) Índices auxiliares (consultas por relacionamento)
-- ---------------------------------------------------------------------

CREATE INDEX idx_fonte_publicador     ON fonte (id_publicador);
CREATE INDEX idx_fonte_idioma         ON fonte (id_idioma);
CREATE INDEX idx_pergunta_categoria   ON pergunta (id_categoria);
CREATE INDEX idx_pergunta_fonte       ON pergunta (id_fonte);
CREATE INDEX idx_alternativa_pergunta ON alternativa (id_pergunta);

-- ---------------------------------------------------------------------
-- 6) Regra de negócio: toda pergunta tem pelo menos 2 alternativas e
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
-- 7) Domínio fixo
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
