-- =====================================================================
--  CyberQuiz — Passo 8: carga de teste e consultas
--  Equipe : <preencher>
--  Marco  : M4
--  Rode depois do 04-ddl.sql:
--    psql -d cyberquiz -v ON_ERROR_STOP=1 -f 05-dml-consultas.sql
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1) Massa mínima — ordem: categoria, publicador, idioma (já no DDL),
--    fonte, pergunta, alternativa.
-- ---------------------------------------------------------------------

INSERT INTO categoria (nome) VALUES
    ('CyberSegurança'),
    ('Inteligência Artificial'),
    ('Redes');

INSERT INTO publicador (nome) VALUES
    ('OWASP Foundation'),
    ('Equipe CyberQuiz'),
    ('Mozilla');

-- 4 fontes. 'Equipe CyberQuiz' assina 2 delas (RD03: um publicador pode
-- ter várias fontes). A mesma fonte (OWASP Top 10) ampara 2 perguntas.
INSERT INTO fonte (descricao, url, id_publicador, id_idioma)
SELECT v.descricao, v.url, p.id_publicador, i.id_idioma
FROM (VALUES
        (1, 'OWASP Top 10 2021',        'https://owasp.org/www-project-top-ten/',                        'OWASP Foundation', 'pt'),
        (2, 'Material de aula',         NULL,                                                            'Equipe CyberQuiz', 'pt'),
        (3, 'MDN — DNS',                'https://developer.mozilla.org/pt-BR/docs/Glossary/DNS',         'Mozilla',          'pt'),
        (4, 'Guia de senhas do NIST',   'https://pages.nist.gov/800-63-4/',                              'Equipe CyberQuiz', 'en')
     ) AS v(ordem, descricao, url, publicador, idioma)
JOIN publicador p ON p.nome   = v.publicador
JOIN idioma     i ON i.codigo = v.idioma
ORDER BY v.ordem;

-- 6 perguntas, com o código original preservado (RD08) e os textos
-- obrigatórios preenchidos (RD09).
INSERT INTO pergunta (codigo, titulo, enunciado, explicacao, id_categoria, id_fonte)
SELECT v.codigo, v.titulo, v.enunciado, v.explicacao, c.id_categoria, f.id_fonte
FROM (VALUES
        (1, 'fact-001',
            'MFA',
            'O que significa a sigla MFA em segurança da informação?',
            'MFA é autenticação multifator: exige dois ou mais fatores diferentes (algo que você sabe, tem ou é) para liberar o acesso.',
            'CyberSegurança',   'OWASP Top 10 2021'),
        (2, 'fact-002',
            'Phishing',
            'Qual ataque engana o usuário com um e-mail falso para roubar dados?',
            'Phishing é a fraude que imita uma comunicação legítima para induzir a vítima a entregar credenciais ou dados.',
            'CyberSegurança',   'OWASP Top 10 2021'),
        (3, 'fact-003',
            'Armazenamento de senhas',
            'Qual é a melhor forma de armazenar senhas em um banco de dados?',
            'Guarda-se apenas o hash, gerado por algoritmo lento com sal. Texto puro e Base64 são reversíveis e por isso inseguros.',
            'CyberSegurança',   'Guia de senhas do NIST'),
        (4, 'fact-004',
            'Sigla IA',
            'O que significa a sigla IA?',
            'IA é inteligência artificial: conjunto de técnicas que fazem o computador executar tarefas associadas à inteligência humana.',
            'Inteligência Artificial', 'Material de aula'),
        (5, 'fact-005',
            'Modelo OSI',
            'O modelo OSI possui sete camadas: física, enlace, rede, transporte, sessão, apresentação e aplicação.',
            'Afirmação correta: o modelo de referência OSI divide a comunicação em sete camadas.',
            'Redes',            'Material de aula'),
        (6, 'fact-006',
            'DNS',
            'O DNS serve para criptografar o tráfego entre o navegador e o servidor.',
            'Afirmação errada: o DNS traduz nomes de domínio em endereços IP; a criptografia do tráfego é papel do HTTPS/TLS.',
            'Redes',            'MDN — DNS')
     ) AS v(ordem, codigo, titulo, enunciado, explicacao, categoria, fonte)
JOIN categoria c ON c.nome      = v.categoria
JOIN fonte     f ON f.descricao = v.fonte
ORDER BY v.ordem;   -- ids 1..6 estáveis, para os comentários de resultado

-- Alternativas. As quatro primeiras perguntas são de múltipla escolha (A–D);
-- as duas últimas são Certo/Errado. A mesma estrutura serve às duas formas,
-- e nada impede acrescentar uma quinta alternativa (RD07).
INSERT INTO alternativa (id_pergunta, identificador, texto, correta)
SELECT q.id_pergunta, a.identificador, a.texto, a.correta
FROM (VALUES
        (1,  'fact-001', 'A', 'Autenticação multifator',            TRUE),
        (2,  'fact-001', 'B', 'Monitoramento de firewall ativo',    FALSE),
        (3,  'fact-001', 'C', 'Gerenciamento de falhas',            FALSE),
        (4,  'fact-001', 'D', 'Módulo de filtragem avançada',       FALSE),

        (5,  'fact-002', 'A', 'Ransomware',                         FALSE),
        (6,  'fact-002', 'B', 'Phishing',                           TRUE),
        (7,  'fact-002', 'C', 'Varredura de portas',                FALSE),
        (8,  'fact-002', 'D', 'Negação de serviço (DoS)',           FALSE),

        (9,  'fact-003', 'A', 'Em texto puro',                      FALSE),
        (10, 'fact-003', 'B', 'Apenas codificada em Base64',        FALSE),
        (11, 'fact-003', 'C', 'Somente o hash da senha',            TRUE),
        (12, 'fact-003', 'D', 'Em um arquivo .txt separado',        FALSE),

        (13, 'fact-004', 'A', 'Interface Avançada',                 FALSE),
        (14, 'fact-004', 'B', 'Integração Automática',              FALSE),
        (15, 'fact-004', 'C', 'Instrução Algorítmica',              FALSE),
        (16, 'fact-004', 'D', 'Inteligência Artificial',            TRUE),

        (17, 'fact-005', 'Certo',  'Certo',                         TRUE),
        (18, 'fact-005', 'Errado', 'Errado',                        FALSE),

        (19, 'fact-006', 'Certo',  'Certo',                         FALSE),
        (20, 'fact-006', 'Errado', 'Errado',                        TRUE)
     ) AS a(ordem, codigo, identificador, texto, correta)
JOIN pergunta q ON q.codigo = a.codigo
ORDER BY a.ordem;

COMMIT;

-- =====================================================================
--  CONSULTAS — RA01 a RA07
--  Cada bloco traz o SQL e o resultado obtido neste ambiente
--  (PostgreSQL 18, cliente em UTF-8).
-- =====================================================================

-- ---------------------------------------------------------------------
-- RA01. Categorias em ordem alfabética, com a quantidade de perguntas.
-- ---------------------------------------------------------------------
SELECT c.nome AS categoria,
       COUNT(q.id_pergunta) AS quantidade_perguntas
FROM categoria c
LEFT JOIN pergunta q ON q.id_categoria = c.id_categoria
GROUP BY c.nome
ORDER BY c.nome;

-- Resultado:
--  categoria              | quantidade_perguntas
-- -------------------------+----------------------
--  CyberSegurança          |                    3
--  Inteligência Artificial |                    1
--  Redes                   |                    2
-- (3 linhas)

-- ---------------------------------------------------------------------
-- RA02a. Uma pergunta aleatória, de qualquer categoria.
-- ---------------------------------------------------------------------
SELECT q.codigo, q.titulo, q.enunciado, c.nome AS categoria
FROM pergunta q
JOIN categoria c ON c.id_categoria = q.id_categoria
ORDER BY random()
LIMIT 1;

-- Resultado (o sorteio muda a cada execução; este é de uma execução):
--  codigo  |         titulo          |                            enunciado                            |   categoria
-- ---------+-------------------------+-----------------------------------------------------------------+----------------
--  fact-003 | Armazenamento de senhas | Qual é a melhor forma de armazenar senhas em um banco de dados? | CyberSegurança
-- (1 linha)

-- ---------------------------------------------------------------------
-- RA02b. Uma pergunta aleatória de uma categoria recebida por parâmetro.
--         O parâmetro entra pelo psql com \set (na API, é o bind da query).
-- ---------------------------------------------------------------------
\set categoria 'Redes'

SELECT q.codigo, q.titulo, q.enunciado, c.nome AS categoria
FROM pergunta q
JOIN categoria c ON c.id_categoria = q.id_categoria
WHERE c.nome = :'categoria'
ORDER BY random()
LIMIT 1;

-- Resultado (parâmetro = 'Redes'):
--  codigo  | titulo |                                enunciado                                | categoria
-- ---------+--------+-------------------------------------------------------------------------+-----------
--  fact-006 | DNS    | O DNS serve para criptografar o tráfego entre o navegador e o servidor. | Redes
-- (1 linha)

-- ---------------------------------------------------------------------
-- RA03. Título, enunciado e alternativas de uma pergunta.
-- ---------------------------------------------------------------------
\set codigo 'fact-001'

SELECT q.codigo,
       q.titulo,
       q.enunciado,
       a.identificador,
       a.texto AS alternativa
FROM pergunta q
JOIN alternativa a ON a.id_pergunta = q.id_pergunta
WHERE q.codigo = :'codigo'
ORDER BY a.identificador;

-- Resultado:
--  codigo   | titulo |                        enunciado                        | identificador |           alternativa
-- ----------+--------+---------------------------------------------------------+---------------+---------------------------------
--  fact-001 | MFA    | O que significa a sigla MFA em segurança da informação? | A             | Autenticação multifator
--  fact-001 | MFA    | O que significa a sigla MFA em segurança da informação? | B             | Monitoramento de firewall ativo
--  fact-001 | MFA    | O que significa a sigla MFA em segurança da informação? | C             | Gerenciamento de falhas
--  fact-001 | MFA    | O que significa a sigla MFA em segurança da informação? | D             | Módulo de filtragem avançada
-- (4 linhas)

-- ---------------------------------------------------------------------
-- RA04. Dada a pergunta e a alternativa escolhida, dizer se acertou.
--       Provado duas vezes: com a alternativa correta e com a errada.
-- ---------------------------------------------------------------------
\set id_pergunta 1
\set id_escolhida 1

SELECT a.id_alternativa,
       a.identificador,
       a.texto AS alternativa_escolhida,
       a.correta AS acertou
FROM alternativa a
WHERE a.id_pergunta = :id_pergunta
  AND a.id_alternativa = :id_escolhida;

-- Resultado (alternativa A de fact-001, que é a correta):
--  id_alternativa | identificador | alternativa_escolhida | acertou
-- ----------------+---------------+-----------------------+---------
--               1 | A             | Autenticação multifator | t
-- (1 linha)

\set id_escolhida 2

SELECT a.id_alternativa,
       a.identificador,
       a.texto AS alternativa_escolhida,
       a.correta AS acertou
FROM alternativa a
WHERE a.id_pergunta = :id_pergunta
  AND a.id_alternativa = :id_escolhida;

-- Resultado (alternativa B de fact-001, que é errada):
--  id_alternativa | identificador | alternativa_escolhida      | acertou
-- ----------------+---------------+----------------------------+---------
--               2 | B             | Monitoramento de firewall ativo | f
-- (1 linha)

-- ---------------------------------------------------------------------
-- RA05. Explicação e fonte completa: descrição, publicador, URL e idioma.
-- ---------------------------------------------------------------------
SELECT q.codigo,
       q.explicacao,
       f.descricao AS fonte,
       p.nome      AS publicador,
       f.url       AS url,
       i.nome      AS idioma
FROM pergunta q
JOIN fonte      f ON f.id_fonte      = q.id_fonte
JOIN publicador p ON p.id_publicador = f.id_publicador
JOIN idioma     i ON i.id_idioma     = f.id_idioma
WHERE q.codigo = 'fact-001';

-- Resultado:
--  codigo   |                                                         explicacao                                                         |       fonte       |    publicador    |                  url                   |  idioma
-- ----------+----------------------------------------------------------------------------------------------------------------------------+-------------------+------------------+----------------------------------------+-----------
--  fact-001 | MFA é autenticação multifator: exige dois ou mais fatores diferentes (algo que você sabe, tem ou é) para liberar o acesso. | OWASP Top 10 2021 | OWASP Foundation | https://owasp.org/www-project-top-ten/ | Português
-- (1 linha)

-- ---------------------------------------------------------------------
-- RA06. Publicadores mais citados, com o número de perguntas.
--       Atravessa pergunta → fonte → publicador (o publicador é da fonte).
-- ---------------------------------------------------------------------
SELECT p.nome AS publicador,
       COUNT(q.id_pergunta) AS quantidade_perguntas
FROM publicador p
LEFT JOIN fonte    f ON f.id_publicador = p.id_publicador
LEFT JOIN pergunta q ON q.id_fonte      = f.id_fonte
GROUP BY p.nome
ORDER BY quantidade_perguntas DESC, p.nome;

-- Resultado:
--    publicador    | quantidade_perguntas
-- ------------------+----------------------
--  Equipe CyberQuiz |                    3
--  OWASP Foundation |                    2
--  Mozilla          |                    1
-- (3 linhas)

-- ---------------------------------------------------------------------
-- RA07. Fontes citadas por mais de uma pergunta.
-- ---------------------------------------------------------------------
SELECT f.id_fonte,
       f.descricao AS fonte,
       p.nome      AS publicador,
       COUNT(q.id_pergunta) AS quantidade_perguntas
FROM fonte f
JOIN pergunta  q ON q.id_fonte      = f.id_fonte
JOIN publicador p ON p.id_publicador = f.id_publicador
GROUP BY f.id_fonte, f.descricao, p.nome
HAVING COUNT(q.id_pergunta) > 1
ORDER BY quantidade_perguntas DESC;

-- Resultado:
--  id_fonte |        fonte        |    publicador    | quantidade_perguntas
-- ----------+---------------------+------------------+----------------------
--         1 | OWASP Top 10 2021   | OWASP Foundation |                    2
--         2 | Material de aula    | Equipe CyberQuiz |                    2
-- (2 linhas)
