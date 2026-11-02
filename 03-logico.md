# Passos 5 e 6 — Modelo lógico, normalização e dicionário

Marco M2. O desenho lógico (tabelas, colunas, PK e FK) é entregue em `03-logico.pdf`; este arquivo traz o mapeamento, a normalização e o dicionário. Os dois descrevem o mesmo esquema.

## 5. Modelo lógico

| Relacionamento no DER | Cardinalidade | Vira | Onde fica a FK ou a tabela associativa |
| --- | --- | --- | --- |
| CATEGORIA — PERGUNTA | 1:N | FK no lado N | `pergunta.id_categoria` → `categoria.id_categoria` |
| FONTE — PERGUNTA | 1:N | FK no lado N | `pergunta.id_fonte` → `fonte.id_fonte` |
| PUBLICADOR — FONTE | 1:N | FK no lado N | `fonte.id_publicador` → `publicador.id_publicador` |
| IDIOMA — FONTE | 1:N | FK no lado N | `fonte.id_idioma` → `idioma.id_idioma` |
| PERGUNTA — ALTERNATIVA | 1:N | FK no lado N | `alternativa.id_pergunta` → `pergunta.id_pergunta` |
| Regra de gabarito (RD06) | 1 alternativa correta por pergunta | atributo `correta` + índice único parcial + gatilho adiado | `alternativa.correta`; `ux_alternativa_uma_correta`; `fn_checar_gabarito` |
| JOGADOR — PONTUACAO | 1:N | FK no lado N | `pontuacao.id_jogador` → `jogador.id_jogador` |
| PERGUNTA — PONTUACAO | 1:N | FK no lado N | `pontuacao.id_pergunta` → `pergunta.id_pergunta` |
| ALTERNATIVA — PONTUACAO (escolhe) | 1:N | FK no lado N | `pontuacao.id_alternativa` → `alternativa.id_alternativa` |
| Um jogador responde cada pergunta uma única vez | — | restrição | `uq_pontuacao_jogador_pergunta (id_jogador, id_pergunta)` |

O relacionamento **escolhe** (ALTERNATIVA — PONTUACAO) é o que registra *qual* alternativa o jogador marcou; por isso a pontuação aponta para a alternativa, e não apenas para a pergunta. O par `(id_jogador, id_pergunta)` é único porque um jogador não responde a mesma pergunta duas vezes.

**Ranking não é tabela.** O DER não traz entidade de ranking: ele é calculado pela soma de `pontuacao.valor_pontos` por jogador, entregue pela view `vw_ranking` (`08-views-api.sql`).

**N:N:** não existe no recorte, e por isso não há tabela associativa. Nenhum requisito pede que uma entidade se ligue a várias da outra guardando atributos do par.

**Por que a regra de gabarito não virou FK em `pergunta`:** uma FK `pergunta.id_alternativa_correta` criaria dependência circular entre as duas tabelas (a alternativa precisa da pergunta, a pergunta precisa da alternativa). O atributo booleano em `alternativa`, com índice único parcial e verificação no `COMMIT`, garante a mesma regra — exatamente uma correta por pergunta — sem ciclo.

### Normalização

| ID | Dependência | Requisito |
| --- | --- | --- |
| DF1 | `id_categoria → nome` | RD01, RD10 |
| DF2 | `id_publicador → nome` | RD03, RD10 |
| DF3 | `id_idioma → nome, codigo` | RD04 |
| DF4 | `id_fonte → descricao, url, id_publicador, id_idioma` | RD02, RD03, RD04, RD10 |
| DF5 | `id_pergunta → codigo, titulo, enunciado, explicacao, id_categoria, id_fonte` | RD01, RD02, RD08, RD09 |
| DF6 | `id_alternativa → id_pergunta, identificador, texto, correta` | RD05, RD07 |
| DF7 | `(id_pergunta, identificador) → id_alternativa` | RD05 |
| DF8 | `codigo → id_pergunta` (chave candidata) | RD08 |
| DF9 | `id_jogador → nome, email, senha_hash` | cadastro/login |
| DF10 | `email → id_jogador` (chave candidata) | RNF02 |
| DF11 | `id_pontuacao → id_jogador, id_pergunta, id_alternativa, valor_pontos, data_resposta` | RA04, RD11 |
| DF12 | `(id_jogador, id_pergunta) → id_pontuacao` (chave candidata) | uma resposta por jogador |

| Forma | Por que o esquema atende | Tabela em que isso aparece |
| --- | --- | --- |
| 1FN | Todos os atributos são atômicos. As alternativas não estão em colunas fixas (`alternativa_a`, `alternativa_b`) nem em lista dentro da pergunta: cada uma é um registro próprio, e a quantidade é livre. | `alternativa` |
| 2FN | Nenhuma chave primária é composta — todas são `id_<tabela>` de uma coluna —, então não há dependência parcial a eliminar. A única chave composta do esquema é a restrição `UNIQUE (id_pergunta, identificador)`, que não é PK. | todas |
| 3FN | Nenhum atributo não-chave determina outro. Nome de categoria, nome de publicador, descrição/URL da fonte e nome/código do idioma ficam em tabelas próprias, referenciados por FK, em vez de repetidos na pergunta. | `categoria`, `publicador`, `fonte`, `idioma` |

## 6. Dicionário de dados

### Tabela: categoria

| Coluna | Tipo e tamanho | Nulo | Restrição | Descrição |
| --- | --- | --- | --- | --- |
| id_categoria | INTEGER | NOT NULL | PK | Identificador da categoria, gerado pelo banco |
| nome | VARCHAR(100) | NOT NULL | UNIQUE (`uq_categoria_nome`) | Nome do tema, sem repetição |

### Tabela: publicador

| Coluna | Tipo e tamanho | Nulo | Restrição | Descrição |
| --- | --- | --- | --- | --- |
| id_publicador | INTEGER | NOT NULL | PK | Identificador do publicador |
| nome | VARCHAR(150) | NOT NULL | UNIQUE (`uq_publicador_nome`) | Nome de quem publica a informação |

### Tabela: idioma

| Coluna | Tipo e tamanho | Nulo | Restrição | Descrição |
| --- | --- | --- | --- | --- |
| id_idioma | INTEGER | NOT NULL | PK | Identificador do idioma |
| nome | VARCHAR(80) | NOT NULL | UNIQUE (`uq_idioma_nome`) | Nome do idioma em português |
| codigo | VARCHAR(10) | NOT NULL | UNIQUE (`uq_idioma_codigo`) | Código do idioma (`pt`, `en`, `es`) |

### Tabela: fonte

| Coluna | Tipo e tamanho | Nulo | Restrição | Descrição |
| --- | --- | --- | --- | --- |
| id_fonte | INTEGER | NOT NULL | PK | Identificador da fonte |
| descricao | VARCHAR(250) | NOT NULL | — | Título/descrição da fonte citada |
| url | TEXT | NULL | UNIQUE (`uq_fonte_url`) | Endereço da fonte; opcional porque há material impresso, e único quando existe |
| id_publicador | INTEGER | NOT NULL | FK → publicador.id_publicador | Publicador responsável pela fonte |
| id_idioma | INTEGER | NOT NULL | FK → idioma.id_idioma | Idioma da fonte |

### Tabela: pergunta

| Coluna | Tipo e tamanho | Nulo | Restrição | Descrição |
| --- | --- | --- | --- | --- |
| id_pergunta | INTEGER | NOT NULL | PK | Identificador interno da pergunta |
| codigo | VARCHAR(20) | NOT NULL | UNIQUE (`uq_pergunta_codigo`) | Código original da pergunta (`fact-001`…), preservado entre cargas |
| titulo | VARCHAR(150) | NOT NULL | — | Título curto exibido na lista |
| enunciado | TEXT | NOT NULL | — | Texto da pergunta, sem limite curto |
| explicacao | TEXT | NOT NULL | — | Texto explicativo mostrado após a resposta |
| id_categoria | INTEGER | NOT NULL | FK → categoria.id_categoria | Categoria à qual a pergunta pertence |
| id_fonte | INTEGER | NOT NULL | FK → fonte.id_fonte | Fonte que ampara a pergunta |

### Tabela: alternativa

| Coluna | Tipo e tamanho | Nulo | Restrição | Descrição |
| --- | --- | --- | --- | --- |
| id_alternativa | INTEGER | NOT NULL | PK | Identificador da alternativa |
| id_pergunta | INTEGER | NOT NULL | FK → pergunta.id_pergunta (ON DELETE CASCADE) | Pergunta dona da alternativa |
| identificador | VARCHAR(20) | NOT NULL | UNIQUE (id_pergunta, identificador) | Rótulo da opção na pergunta (`A`…`D`, `Certo`, `Errado`) |
| texto | TEXT | NOT NULL | — | Texto da opção de resposta |
| correta | BOOLEAN | NOT NULL | DEFAULT FALSE; índice único parcial `ux_alternativa_uma_correta (id_pergunta) WHERE correta` | Valor lógico da alternativa; exatamente uma por pergunta |

### Tabela: jogador

| Coluna | Tipo e tamanho | Nulo | Restrição | Descrição |
| --- | --- | --- | --- | --- |
| id_jogador | INTEGER | NOT NULL | PK | Identificador do jogador |
| nome | VARCHAR(120) | NOT NULL | — | Nome exibido no jogo |
| email | VARCHAR(254) | NOT NULL | UNIQUE (`uq_jogador_email`) | E-mail usado no login |
| senha_hash | TEXT | NOT NULL | — | Hash da senha; a senha em texto puro nunca é gravada |

### Tabela: pontuacao

| Coluna | Tipo e tamanho | Nulo | Restrição | Descrição |
| --- | --- | --- | --- | --- |
| id_pontuacao | INTEGER | NOT NULL | PK | Identificador da resposta registrada |
| id_jogador | INTEGER | NOT NULL | FK → jogador.id_jogador (ON DELETE CASCADE) | Jogador que respondeu |
| id_pergunta | INTEGER | NOT NULL | FK → pergunta.id_pergunta (ON DELETE CASCADE) | Pergunta respondida |
| id_alternativa | INTEGER | NOT NULL | FK → alternativa.id_alternativa | Alternativa escolhida (relacionamento *escolhe*) |
| valor_pontos | INTEGER | NOT NULL | DEFAULT 0; CHECK >= 0; calculado pelo gatilho `trg_pontuacao_pontua` | 10 quando a alternativa escolhida é a correta, 0 quando é errada |
| data_resposta | TIMESTAMPTZ | NOT NULL | DEFAULT `now()` | Momento em que a resposta foi registrada |

Chave candidata: `UNIQUE (id_jogador, id_pergunta)` (`uq_pontuacao_jogador_pergunta`).

### Regras que não cabem em uma coluna

| Regra | Onde é garantida |
| --- | --- |
| Exatamente uma alternativa correta por pergunta (RD06) | índice parcial `ux_alternativa_uma_correta` + gatilho adiado `trg_pergunta_valida` / `trg_alternativa_valida` |
| No mínimo duas alternativas por pergunta (RD05/RD07) | função `fn_checar_gabarito`, chamada no `COMMIT` |
| Alternativas desaparecem com a pergunta | `ON DELETE CASCADE` em `alternativa.id_pergunta` |
| A alternativa escolhida pertence à pergunta respondida | gatilho `fn_pontuar_resposta` (BEFORE INSERT/UPDATE em `pontuacao`) |
| `valor_pontos` depende de acertar ou errar | gatilho `fn_pontuar_resposta` — o valor não é digitado pela aplicação |
| Ranking por jogador | view `vw_ranking` (soma de `valor_pontos`) |
