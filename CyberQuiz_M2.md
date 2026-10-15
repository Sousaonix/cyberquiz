# CyberQuiz — M2
## Passos 5 e 6: Modelo lógico, normalização e dicionário de dados

**Projeto:** CyberQuiz  
**Base:** M1 — Introdução, minimundo, requisitos e regras de negócio  
**SGBD previsto:** PostgreSQL

---

## 1. Objetivo do M2

Transformar o modelo conceitual do CyberQuiz em um modelo lógico relacional, definir as tabelas, suas chaves e relacionamentos, verificar a normalização e documentar os atributos no dicionário de dados. As decisões abaixo derivam do M1: perguntas, categorias, fontes, publicadores, idiomas, alternativas e jogadores.

## 2. Regras consideradas

- Cada pergunta pertence a uma categoria.
- Cada pergunta possui uma fonte associada.
- Cada pergunta possui um publicador associado.
- Cada pergunta está associada a um idioma.
- Cada alternativa pertence a uma pergunta.
- Uma pergunta pode ter duas, três ou mais alternativas; não se fixa a quantidade de alternativas em colunas.
- O sistema permite cadastro e login dos jogadores.
- O banco deve preservar integridade e impedir valores obrigatórios nulos e duplicações quando não permitidas.

**Decisão de modelagem:** para manter o desenho consistente, uma pergunta referencia uma única categoria, uma única fonte, um único publicador e um único idioma. Uma categoria, fonte, publicador ou idioma pode ser reutilizado por várias perguntas. O M1 não especifica se existe exatamente uma alternativa correta nem como guardar senhas; por isso, essas regras não são acrescentadas como requisitos obrigatórios neste M2.

## 3. Modelo lógico relacional

Convenção: **PK** = chave primária; **FK** = chave estrangeira; **UQ** = valor único; **NN** = obrigatório (NOT NULL).

### 3.1 Tabelas e atributos

**CATEGORIA**
- `id_categoria` — PK, inteiro.
- `nome` — texto obrigatório e único.
- ia - texto obrigatorio.
-cybersegurança - texto obrigadtorio.

**FONTE**
- `id_fonte` — PK, inteiro.
- `descricao` — texto obrigatório.
- `url` — texto opcional. O M1 não exige que toda fonte tenha URL.

**PUBLICADOR**
- `id_publicador` — PK, inteiro.
- `nome` — texto obrigatório.

**IDIOMA**
- `id_idioma` — PK, inteiro.
- `nome` — texto obrigatório e único.
- `codigo` — código de idioma obrigatório e único.

**PERGUNTA**
- `id_pergunta` — PK, inteiro.
- `enunciado` — texto obrigatório.
- `id_categoria` — FK para `CATEGORIA`, obrigatório.
- `id_fonte` — FK para `FONTE`, obrigatório.
- `id_publicador` — FK para `PUBLICADOR`, obrigatório.
- `id_idioma` — FK para `IDIOMA`, obrigatório.

**ALTERNATIVA**
- `id_alternativa` — PK, inteiro.
- `id_pergunta` — FK para `PERGUNTA`, obrigatório.
- `texto` — texto obrigatório.
- `identificador` — texto obrigatório, usado para distinguir as alternativas de uma pergunta.

**JOGADOR**
- `id_jogador` — PK, inteiro.
- `nome` — texto obrigatório.
- `email` — texto obrigatório e único.
- `senha_hash` — texto obrigatório, reservado para armazenar um hash da senha, nunca a senha em texto puro.

> O M1 informa que jogadores podem cadastrar-se e fazer login, mas não define os campos exatos do cadastro. Nome, e-mail e hash de senha são uma proposta mínima para viabilizar esse requisito e devem ser confirmados com a professora se ela exigir que o modelo contenha somente atributos explicitamente descritos no M1.

## 4. Relacionamentos e cardinalidades

- **CATEGORIA 1:N PERGUNTA** — cada pergunta pertence a uma categoria; uma categoria pode classificar várias perguntas.
- **FONTE 1:N PERGUNTA** — cada pergunta possui uma fonte; uma fonte pode ser usada em várias perguntas.
- **PUBLICADOR 1:N PERGUNTA** — cada pergunta possui um publicador; um publicador pode estar associado a várias perguntas.
- **IDIOMA 1:N PERGUNTA** — cada pergunta possui um idioma; um idioma pode ser usado por várias perguntas.
- **PERGUNTA 1:N ALTERNATIVA** — cada alternativa pertence a uma pergunta; uma pergunta pode ter várias alternativas.
- **JOGADOR** não possui relacionamento com as perguntas neste modelo lógico porque o M1 não pede para guardar respostas dadas, histórico ou pontuação do jogador.

## 5. Normalização

### Primeira Forma Normal (1FN)
Os atributos armazenam valores individuais. As alternativas não são guardadas em colunas como `alternativa_a` e `alternativa_b`; cada alternativa ocupa seu próprio registro na tabela `ALTERNATIVA`. Assim, o modelo permite acrescentar alternativas sem alterar a estrutura da tabela `PERGUNTA`.

### Segunda Forma Normal (2FN)
As tabelas usam chaves primárias simples (`id_...`). Portanto, não existem dependências parciais de atributos em relação a apenas uma parte de uma chave primária composta.

### Terceira Forma Normal (3FN)
Os dados descritivos de categoria, fonte, publicador e idioma ficam em tabelas próprias. A tabela `PERGUNTA` guarda seus identificadores como chaves estrangeiras, evitando repetir nomes de categorias, fontes, publicadores e idiomas em cada pergunta. Os atributos de cada tabela descrevem a entidade identificada pela sua chave primária.

## 6. Restrições de integridade previstas

- Chaves primárias impedem registros sem identificação única.
- Chaves estrangeiras impedem perguntas com categoria, fonte, publicador ou idioma inexistentes.
- A chave estrangeira de `ALTERNATIVA` impede alternativas sem pergunta associada.
- `NOT NULL` aplica obrigatoriedade aos atributos necessários.
- `UNIQUE` evita repetição de nome de categoria, nome de idioma, código de idioma e e-mail do jogador.
- `UNIQUE (id_pergunta, identificador)` impede repetir o identificador de alternativa dentro da mesma pergunta.
- A estrutura não limita a quantidade de alternativas por pergunta.

## 7. Dicionário de dados

| Tabela | Atributo | Significado | Regra principal |
|---|---|---|---|
| CATEGORIA | id_categoria | Identificador da categoria | PK |
| CATEGORIA | nome | Nome do tema/categoria | Obrigatório e único |
| FONTE | id_fonte | Identificador da fonte | PK |
| FONTE | descricao | Descrição da fonte utilizada | Obrigatório |
| FONTE | url | Endereço da fonte, quando houver | Opcional |
| PUBLICADOR | id_publicador | Identificador do publicador | PK |
| PUBLICADOR | nome | Nome do publicador da informação | Obrigatório |
| IDIOMA | id_idioma | Identificador do idioma | PK |
| IDIOMA | nome | Nome do idioma | Obrigatório e único |
| IDIOMA | codigo | Código do idioma | Obrigatório e único |
| PERGUNTA | id_pergunta | Identificador da pergunta | PK |
| PERGUNTA | enunciado | Texto da pergunta | Obrigatório |
| PERGUNTA | id_categoria | Categoria à qual pertence | FK, obrigatório |
| PERGUNTA | id_fonte | Fonte associada | FK, obrigatório |
| PERGUNTA | id_publicador | Publicador associado | FK, obrigatório |
| PERGUNTA | id_idioma | Idioma da pergunta | FK, obrigatório |
| ALTERNATIVA | id_alternativa | Identificador da alternativa | PK |
| ALTERNATIVA | id_pergunta | Pergunta à qual pertence | FK, obrigatório |
| ALTERNATIVA | texto | Texto da opção de resposta | Obrigatório |
| ALTERNATIVA | identificador | Letra ou rótulo da opção | Obrigatório; único por pergunta |
| JOGADOR | id_jogador | Identificador do jogador | PK |
| JOGADOR | nome | Nome do jogador | Obrigatório |
| JOGADOR | email | E-mail usado no login | Obrigatório e único |
| JOGADOR | senha_hash | Hash da senha | Obrigatório |

## 8. Modelo MER — notação Chen

O diagrama Chen correspondente é entregue separadamente no arquivo `Tech_Trivia_MER_Chen.svg`. Nele:
- retângulos representam entidades;
- losangos representam relacionamentos;
- elipses representam atributos;
- atributos identificadores aparecem sublinhados;
- cardinalidades aparecem junto aos relacionamentos.

## 9. Rastreabilidade com o M1

| Regra/requisito do M1 | Elemento do modelo lógico |
|---|---|
| RD01 — cadastrar perguntas | PERGUNTA |
| RD02 — associar pergunta à categoria | PERGUNTA.id_categoria → CATEGORIA |
| RD04 — cadastrar publicador | PUBLICADOR e PERGUNTA.id_publicador |
| RD05 — associar idioma | PERGUNTA.id_idioma → IDIOMA |
| RD06 e RD07 — alternativas variáveis | ALTERNATIVA em relação 1:N com PERGUNTA |
| RA01 | FK obrigatória para CATEGORIA |
| RA02 | FK obrigatória para FONTE |
| RA03 | FK obrigatória para PUBLICADOR |
| RA04 | FK obrigatória para IDIOMA |
| RA05 | FK obrigatória de ALTERNATIVA para PERGUNTA |
| RA06 | múltiplos registros em ALTERNATIVA por pergunta |
| RA07 | PK, FK, NOT NULL e UNIQUE |
| RD10 — cadastro/login de jogadores | JOGADOR (proposta mínima de atributos) |

## 10. Observações

1. O M1 fornecido não contém um requisito RD03; a numeração original foi preservada, sem renumerar os códigos existentes.
2. O M1 não define a estrutura de autenticação. O campo `senha_hash` é uma recomendação técnica de segurança para o requisito de login.
3. O M1 não informa que deve existir uma única alternativa correta. Essa regra não é imposta neste modelo.
4. O M1 menciona “fontes utilizadas”, mas não determina URL obrigatória; por isso, `url` está marcada como opcional.
