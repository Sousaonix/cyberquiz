# CyberQuiz — M4
## Passos 8 e 9: Carga de dados, consultas e testes de integridade

**Projeto:** CyberQuiz  
**Base:** modelo físico do M3  
**SGBD:** PostgreSQL

---

## 1. Objetivo

Inserir dados de teste coerentes com o minimundo do CyberQuiz, demonstrar consultas úteis ao sistema e verificar se as restrições de integridade impedem registros inválidos.

> Execute este arquivo depois de executar o DDL do M3. Os testes que devem falhar estão isolados em comentários para não interromper a carga principal.

## 2. Carga inicial de dados

```sql
-- Categorias
INSERT INTO categoria (nome) VALUES
('Tecnologia'),
('Ciência'),
('História');

-- Fontes
INSERT INTO fonte (descricao, url) VALUES
('Portal oficial de documentação PostgreSQL', 'https://www.postgresql.org/docs/'),
('Material didático de ciência', NULL),
('Referência histórica de exemplo', NULL);

-- Publicadores
INSERT INTO publicador (nome) VALUES
('PostgreSQL Global Development Group'),
('Equipe CyberQuiz'),
('Publicador de referência');

-- Idiomas
INSERT INTO idioma (nome, codigo) VALUES
('Português', 'pt'),
('Inglês', 'en'),
('Espanhol', 'es');

-- Jogador de demonstração.
-- Em produção, senha_hash deve ser gerado por mecanismo seguro da aplicação.
INSERT INTO jogador (nome, email, senha_hash) VALUES
('Jogador de Teste', 'jogador.teste@example.com', 'HASH_DE_EXEMPLO_NAO_UTILIZAR_EM_PRODUCAO');

-- Perguntas: os IDs são recuperados por consulta para evitar pressupor
-- que as identidades começam em 1.
INSERT INTO pergunta
    (enunciado, id_categoria, id_fonte, id_publicador, id_idioma)
SELECT
    'Qual comando SQL consulta dados de uma tabela?',
    c.id_categoria, f.id_fonte, p.id_publicador, i.id_idioma
FROM categoria c
JOIN fonte f ON f.descricao = 'Portal oficial de documentação PostgreSQL'
JOIN publicador p ON p.nome = 'PostgreSQL Global Development Group'
JOIN idioma i ON i.codigo = 'pt'
WHERE c.nome = 'Tecnologia';

INSERT INTO pergunta
    (enunciado, id_categoria, id_fonte, id_publicador, id_idioma)
SELECT
    'Qual destes elementos é uma unidade básica da vida?',
    c.id_categoria, f.id_fonte, p.id_publicador, i.id_idioma
FROM categoria c
JOIN fonte f ON f.descricao = 'Material didático de ciência'
JOIN publicador p ON p.nome = 'Equipe CyberQuiz'
JOIN idioma i ON i.codigo = 'pt'
WHERE c.nome = 'Ciência';

-- Alternativas da primeira pergunta
INSERT INTO alternativa (id_pergunta, identificador, texto)
SELECT q.id_pergunta, a.identificador, a.texto
FROM pergunta q
CROSS JOIN (VALUES
    ('A', 'SELECT'),
    ('B', 'PAINT'),
    ('C', 'PRINT SCREEN'),
    ('D', 'DOWNLOAD')
) AS a(identificador, texto)
WHERE q.enunciado = 'Qual comando SQL consulta dados de uma tabela?';

-- Alternativas da segunda pergunta
INSERT INTO alternativa (id_pergunta, identificador, texto)
SELECT q.id_pergunta, a.identificador, a.texto
FROM pergunta q
CROSS JOIN (VALUES
    ('A', 'Célula'),
    ('B', 'Continente'),
    ('C', 'Estrela')
) AS a(identificador, texto)
WHERE q.enunciado = 'Qual destes elementos é uma unidade básica da vida?';
```

## 3. Consultas SQL

### Consulta 1 — Listar perguntas com categoria, fonte, publicador e idioma

```sql
SELECT
    q.id_pergunta,
    q.enunciado,
    c.nome AS categoria,
    f.descricao AS fonte,
    p.nome AS publicador,
    i.nome AS idioma
FROM pergunta q
JOIN categoria c ON c.id_categoria = q.id_categoria
JOIN fonte f ON f.id_fonte = q.id_fonte
JOIN publicador p ON p.id_publicador = q.id_publicador
JOIN idioma i ON i.id_idioma = q.id_idioma
ORDER BY q.id_pergunta;
```

### Consulta 2 — Buscar perguntas por categoria

```sql
SELECT q.id_pergunta, q.enunciado
FROM pergunta q
JOIN categoria c ON c.id_categoria = q.id_categoria
WHERE c.nome = 'Tecnologia'
ORDER BY q.id_pergunta;
```

### Consulta 3 — Exibir as alternativas de cada pergunta

```sql
SELECT
    q.id_pergunta,
    q.enunciado,
    a.identificador,
    a.texto AS alternativa
FROM pergunta q
JOIN alternativa a ON a.id_pergunta = q.id_pergunta
ORDER BY q.id_pergunta, a.identificador;
```

### Consulta 4 — Contar alternativas por pergunta

```sql
SELECT
    q.id_pergunta,
    q.enunciado,
    COUNT(a.id_alternativa) AS quantidade_alternativas
FROM pergunta q
LEFT JOIN alternativa a ON a.id_pergunta = q.id_pergunta
GROUP BY q.id_pergunta, q.enunciado
ORDER BY q.id_pergunta;
```

### Consulta 5 — Demonstrar que uma pergunta pode ter mais de duas alternativas

```sql
SELECT
    q.id_pergunta,
    q.enunciado,
    COUNT(a.id_alternativa) AS quantidade_alternativas
FROM pergunta q
JOIN alternativa a ON a.id_pergunta = q.id_pergunta
GROUP BY q.id_pergunta, q.enunciado
HAVING COUNT(a.id_alternativa) > 2;
```

### Consulta 6 — Pesquisar perguntas por trecho do enunciado

```sql
SELECT id_pergunta, enunciado
FROM pergunta
WHERE enunciado ILIKE '%SQL%'
ORDER BY id_pergunta;
```

## 4. Testes de integridade

Execute os testes válidos primeiro. Para cada teste negativo, retire os comentários e execute separadamente; o PostgreSQL deve rejeitar a operação.

### Teste 1 — Impedir categoria duplicada

```sql
-- Esperado: erro de violação da restrição UNIQUE.
-- INSERT INTO categoria (nome) VALUES ('Tecnologia');
```

**Resultado esperado:** a inserção é rejeitada porque `categoria.nome` é único.

### Teste 2 — Impedir pergunta com categoria inexistente

```sql
-- Esperado: erro de violação da chave estrangeira.
-- INSERT INTO pergunta
--     (enunciado, id_categoria, id_fonte, id_publicador, id_idioma)
-- VALUES ('Pergunta inválida', 999999, 1, 1, 1);
```

**Resultado esperado:** a inserção é rejeitada se o identificador de categoria não existir. Os demais IDs também precisam existir; para isolar esse teste, use IDs reais de fonte, publicador e idioma.

### Teste 3 — Impedir alternativa sem pergunta

```sql
-- Esperado: erro de violação da chave estrangeira.
-- INSERT INTO alternativa (id_pergunta, identificador, texto)
-- VALUES (999999, 'A', 'Alternativa órfã');
```

**Resultado esperado:** a alternativa é rejeitada porque não há pergunta correspondente.

### Teste 4 — Impedir rótulo duplicado na mesma pergunta

```sql
-- Esperado: erro de violação da restrição UNIQUE.
-- Substitua 1 por um id_pergunta existente se necessário.
-- INSERT INTO alternativa (id_pergunta, identificador, texto)
-- VALUES (1, 'A', 'Outro texto com o rótulo A');
```

**Resultado esperado:** a operação é rejeitada se a pergunta já possuir uma alternativa com o identificador `A`.

### Teste 5 — Impedir e-mail duplicado de jogador

```sql
-- Esperado: erro de violação da restrição UNIQUE.
-- INSERT INTO jogador (nome, email, senha_hash)
-- VALUES ('Outro Jogador', 'jogador.teste@example.com', 'HASH_DE_EXEMPLO');
```

**Resultado esperado:** a inserção é rejeitada porque o e-mail já está cadastrado.

### Teste 6 — Impedir campo obrigatório nulo

```sql
-- Esperado: erro de violação de NOT NULL.
-- INSERT INTO categoria (nome) VALUES (NULL);
```

**Resultado esperado:** a inserção é rejeitada porque o nome da categoria é obrigatório.

## 5. Verificações finais

### Verificar a quantidade de registros

```sql
SELECT 'categoria' AS tabela, COUNT(*) AS total FROM categoria
UNION ALL
SELECT 'fonte', COUNT(*) FROM fonte
UNION ALL
SELECT 'publicador', COUNT(*) FROM publicador
UNION ALL
SELECT 'idioma', COUNT(*) FROM idioma
UNION ALL
SELECT 'pergunta', COUNT(*) FROM pergunta
UNION ALL
SELECT 'alternativa', COUNT(*) FROM alternativa
UNION ALL
SELECT 'jogador', COUNT(*) FROM jogador;
```

### Verificar perguntas sem alternativas

```sql
SELECT q.id_pergunta, q.enunciado
FROM pergunta q
LEFT JOIN alternativa a ON a.id_pergunta = q.id_pergunta
WHERE a.id_alternativa IS NULL;
```

Essa consulta pode retornar perguntas sem alternativas. O M1 exige que as alternativas sejam associadas às perguntas, mas não declara que toda pergunta precisa ter ao menos uma alternativa no mesmo instante em que é cadastrada; portanto, não foi adicionada uma restrição extra para impedir esse estado.

## 6. Conclusão

A carga de teste demonstra a organização de perguntas por categoria, fonte, publicador e idioma, além do armazenamento flexível das alternativas. As consultas recuperam e organizam os dados para o uso do quiz. Os testes negativos verificam as restrições de chave primária, chave estrangeira, obrigatoriedade e unicidade definidas no M3.

**Importante:** registre os resultados reais após executar os comandos no PostgreSQL. Não declare que os testes foram executados com sucesso antes de os executar no seu ambiente.
