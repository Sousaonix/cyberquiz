# 🧠 CyberQuiz — Documentação do banco de dados

> Quiz de perguntas e respostas sobre segurança cibernética e inteligência artificial.
> Este arquivo resume o modelo; o detalhe está nos documentos numerados.

## 📌 1. Contexto

O banco guarda as perguntas, suas categorias, as fontes que as amparam (com publicador e idioma), as alternativas de cada pergunta, o **nome do jogador** e a **pontuação de cada resposta**. É essa estrutura que permite montar a pergunta, corrigir a resposta, mostrar a procedência do conteúdo e fechar a rodada com o ranking.

O detalhamento de contexto, minimundo e requisitos está em [`01-contexto.md`](../01-contexto.md).

### 🎯 Escopo

| O banco faz | O banco não faz |
|---|---|
| Armazena perguntas, categorias, fontes, publicadores, idiomas e alternativas | Não monta tela nem faz autenticação de sessão |
| Guarda o nome do jogador e a pontuação de cada resposta | Não tem login, e-mail nem senha |
| Impede duplicidade e campo obrigatório vazio (PK, FK, UNIQUE, NOT NULL) | Não guarda imagens das perguntas |
| Responde às consultas do aplicativo, inclusive o ranking | Não recebe cadastro de perguntas pela interface |

### 👥 Quem usa

| Quem | O que faz |
|---|---|
| **Jogador** | Digita o nome, responde às perguntas e vê o resultado e o ranking. Sem cadastro, sem senha. |
| **Equipe do projeto** | Carrega as perguntas por script (`05-dml-consultas.sql` ou `07-seed-questoes.sql`). Não é um perfil do sistema. |

> Não existe tela nem permissão para "qualquer um criar perguntas": a carga é feita pela equipe, direto no banco.

## 📋 2. Requisitos (resumo)

- **RD01–RD11** — estrutura das perguntas: categoria, fonte, publicador, idioma, alternativas variáveis, código estável, textos obrigatórios e sem repetição de dados.
- **RD12** — o jogador é identificado **apenas pelo nome**, que é único; não há e-mail nem senha.
- **RA01–RA07** — consultas de apoio ao quiz (categorias, sorteio, alternativas, correção, fonte completa, publicadores e fontes mais citadas).
- **RA08** — ranking: soma de pontos por jogador.
- **RNF01/RNF02** — PostgreSQL e integridade (unicidade de categoria, URL, nome de jogador; obrigatoriedade dos textos).

Os textos completos estão em [`01-contexto.md`](../01-contexto.md).

## 🗂️ 3. Modelo

O desenho conceitual (Chen) está em [`../CyberQuiz_MER_Chen.png`](../CyberQuiz_MER_Chen.png), com versão vetorial em `../CyberQuiz_MER_Chen.svg`. O mapeamento lógico, a normalização e o dicionário de dados estão em [`../03-logico.md`](../03-logico.md).

| Entidade | Atributos principais |
|---|---|
| **CATEGORIA** | `id_categoria`, `nome` |
| **PUBLICADOR** | `id_publicador`, `nome` |
| **IDIOMA** | `id_idioma`, `nome`, `codigo` |
| **FONTE** | `id_fonte`, `descricao`, `url` (opcional), publicador, idioma |
| **PERGUNTA** | `id_pergunta`, `codigo`, `titulo`, `enunciado`, `explicacao` |
| **ALTERNATIVA** | `id_alternativa`, `identificador`, `texto`, `correta` |
| **JOGADOR** | `id_jogador`, `nome` |
| **PONTUACAO** | `id_pontuacao`, jogador, pergunta, alternativa escolhida, `valor_pontos`, `data_resposta` |

### Relacionamentos

```
CATEGORIA   (0,N) —classifica— (1,1) PERGUNTA
FONTE       (0,N) —ampara————— (1,1) PERGUNTA
PUBLICADOR  (0,N) —publica———— (1,1) FONTE
IDIOMA      (0,N) —identifica— (1,1) FONTE
PERGUNTA    (1,1) —possui————— (4,N) ALTERNATIVA
JOGADOR     (0,N) —obtém——————— (1,1) PONTUACAO
PERGUNTA    (0,N) —gera———————— (1,1) PONTUACAO
ALTERNATIVA (0,N) —escolhe———— (1,1) PONTUACAO
```

**Ranking não é uma entidade**: é a soma de `valor_pontos` por jogador, calculada pela view `vw_ranking`.

## 🗃️ 4. Arquivos

| Arquivo | Conteúdo |
|---|---|
| `01-contexto.md` | Contexto, minimundo e requisitos |
| `02-modelo-conceitual.md` | Entidades e relacionamentos (Chen) |
| `03-logico.md` | Modelo lógico, normalização e dicionário |
| `04-ddl.sql` | Esquema físico (tabelas, chaves, índices, gatilhos) |
| `05-dml-consultas.sql` | Massa de teste e consultas da disciplina |
| `06-testes.sql` | Testes das regras de negócio |
| `07-seed-questoes.sql` | Carga real: 100 perguntas do jogo |
| `08-views-api.sql` | Views que a API consome (`vw_quiz_json`, `vw_ranking`) |
| `supabase-setup.sql` | Os três SQL de produção em um arquivo só |
