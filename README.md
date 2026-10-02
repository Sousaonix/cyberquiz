
# 🧠 CyberQuiz — Documentação do Banco de Dados

> Sistema de perguntas e respostas voltado para aprendizado e entretenimento na área de tecnologia.

---

## 📌 1. Introdução e contexto

O **CyberQuiz** é um sistema de perguntas e respostas que tem como objetivo proporcionar aprendizado e entretenimento por meio de quizzes organizados por categorias.

O banco de dados será responsável por armazenar e organizar perguntas, categorias, fontes, publicadores, idiomas e alternativas de respostas, permitindo que os jogadores escolham um tema e respondam às perguntas disponíveis.

### 🎯 Escopo do sistema

| O banco faz | O banco não faz |
|---|---|
| Armazena perguntas e suas informações. | Não permite conversas entre usuários. |
| Armazena categorias das perguntas. | Não funciona como uma rede social. |
| Armazena as fontes utilizadas nas perguntas. | Não realiza pesquisas na internet em tempo real. |
| Armazena os publicadores das informações. | Não é responsável por produzir o conteúdo. |
| Armazena o idioma das perguntas. | Não gerencia pagamentos ou compras. |
| Armazena as alternativas de cada pergunta. | Não armazena conversas entre usuários. |
| Organiza as perguntas por tema/categoria. | Não realiza comunicação entre usuários. |

### 👥 Usuários do sistema

| Usuário | Responsabilidade |
|---|---|
| **Jogador** | Realiza cadastro/login, escolhe uma categoria ou tema e responde às perguntas disponíveis. |
| **Responsável pelo cadastro** | Cadastra perguntas, categorias, fontes, publicadores, idiomas e alternativas de respostas. |

---

## 📝 2. Minimundo

O sistema CyberQuiz deve permitir cadastrar perguntas e suas respectivas informações, incluindo categoria, fonte utilizada, publicador e idioma.

Para cada pergunta, devem ser cadastradas alternativas de respostas, associadas à pergunta e identificadas de forma clara.

Inicialmente, cada pergunta poderá possuir duas alternativas. Entretanto, o banco de dados deverá ser estruturado de maneira flexível para permitir três ou mais alternativas futuramente, sem necessidade de modificar sua estrutura principal.

Cada pergunta deverá obrigatoriamente:
- Pertencer a uma categoria.
- Possuir uma fonte associada.
- Possuir um publicador associado.
- Estar vinculada a um idioma.
- Possuir uma ou mais alternativas de respostas.

---

## 📋 3. Requisitos e regras de negócio

### Requisitos funcionais

| Código | Descrição |
|---|---|
| RD01 | O sistema deve permitir cadastrar perguntas. |
| RD02 | O sistema deve permitir associar cada pergunta a uma categoria. |
| RD03 | O sistema deve permitir cadastrar a fonte utilizada para cada pergunta. |
| RD04 | O sistema deve permitir cadastrar o publicador da informação de cada pergunta. |
| RD05 | O sistema deve permitir associar cada pergunta a um idioma. |
| RD06 | O sistema deve permitir cadastrar alternativas de respostas para cada pergunta. |
| RD07 | O sistema deve permitir que uma pergunta possua mais de duas alternativas. |
| RD08 | O sistema deve permitir ao jogador escolher uma categoria ou tema para iniciar o quiz. |
| RD09 | O sistema deve permitir ao jogador responder às perguntas cadastradas. |
| RD10 | O sistema deve permitir o cadastro e o login dos jogadores. |
| RD11 | O sistema deve organizar as informações das perguntas para utilização no quiz. |

### Regras de negócio

| Código | Descrição |
|---|---|
| RA01 | Toda pergunta deve pertencer a uma categoria. |
| RA02 | Toda pergunta deve possuir uma fonte associada. |
| RA03 | Toda pergunta deve possuir um publicador associado. |
| RA04 | Toda pergunta deve estar associada a um idioma. |
| RA05 | Cada alternativa deve estar associada a uma pergunta. |
| RA06 | Uma pergunta deve possuir quantidade variável de alternativas, sem limitação estrutural a apenas duas. |
| RA07 | O banco deve garantir a integridade das informações, impedindo registros obrigatórios nulos ou duplicações quando não permitidas. |

---

## 🗂️ 4. Modelo Conceitual

O modelo conceitual representa as entidades, seus atributos e os relacionamentos existentes no banco de dados.

### 4.1 Entidades e atributos

| Entidade | Atributos | Identificador |
|---|---|---|
| **Pergunta** | Texto da pergunta | `id_pergunta` |
| **Categoria** | Nome da categoria | `id_categoria` |
| **Fonte** | Nome da fonte | `id_fonte` |
| **Publicador** | Nome do publicador | `id_publicador` |
| **Idioma** | Nome do idioma | `id_idioma` |
| **Alternativa** | Texto da alternativa, correta | `id_alternativa` |

### 4.2 Relacionamentos e cardinalidades

| Relacionamento | Cardinalidade | Requisito |
|---|---|---|
| Categoria classifica Pergunta | Categoria (0,N) — Pergunta (1,1) | RD02 / RA01 |
| Fonte referencia Pergunta | Fonte (0,N) — Pergunta (1,1) | RD03 / RA02 |
| Publicador publica Pergunta | Publicador (0,N) — Pergunta (1,1) | RD04 / RA03 |
| Idioma identifica Pergunta | Idioma (0,N) — Pergunta (1,1) | RD05 / RA04 |
| Pergunta possui Alternativa | Pergunta (1,N) — Alternativa (1,1) | RD06 / RA05 |

### 4.3 Representação textual do modelo

- Uma **Categoria** pode classificar nenhuma ou várias Perguntas.
- Cada **Pergunta** deve pertencer a exatamente uma Categoria.
- Uma **Fonte** pode ser utilizada por nenhuma ou várias Perguntas.
- Cada **Pergunta** deve possuir exatamente uma Fonte.
- Um **Publicador** pode estar associado a nenhuma ou várias Perguntas.
- Cada **Pergunta** deve possuir exatamente um Publicador.
- Um **Idioma** pode estar associado a nenhuma ou várias Perguntas.
- Cada **Pergunta** deve estar associada a exatamente um Idioma.
- Cada **Pergunta** deve possuir uma ou várias Alternativas.
- Cada **Alternativa** deve pertencer a exatamente uma Pergunta.

---

## 🔗 5. DER — Diagrama Entidade-Relacionamento

O Diagrama Entidade-Relacionamento (DER) representa graficamente a estrutura conceitual do banco de dados CyberQuiz.

### 5.1 Notação de Chen

Para construir o DER, devem ser utilizados os seguintes elementos:

| Elemento | Representação | Significado |
|---|---|---|
| Entidade | Retângulo | Representa as entidades do banco. |
| Atributo | Elipse | Representa as características das entidades. |
| Relacionamento | Losango | Representa as associações entre entidades. |
| Identificador | Atributo sublinhado | Identifica exclusivamente cada registro. |
| Cardinalidade | 0,N / 1,1 | Define a quantidade mínima e máxima de participações. |

### 5.2 Estrutura dos relacionamentos

```text
CATEGORIA (0,N) — CLASSIFICA — (1,1) PERGUNTA

FONTE (0,N) — REFERENCIA — (1,1) PERGUNTA

PUBLICADOR (0,N) — PUBLICA — (1,1) PERGUNTA

IDIOMA (0,N) — IDENTIFICA — (1,1) PERGUNTA

PERGUNTA (1,N) — POSSUI — (1,1) ALTERNATIVA
```

### 5.3 Entidades do DER

```text
CATEGORIA
- id_categoria (PK)
- nome

PERGUNTA
- id_pergunta (PK)
- texto_pergunta

FONTE
- id_fonte (PK)
- nome

PUBLICADOR
- id_publicador (PK)
- nome

IDIOMA
- id_idioma (PK)
- nome

ALTERNATIVA
- id_alternativa (PK)
- texto_alternativa
- correta
```

---

## ⚠️ 6. Observações importantes

- O modelo conceitual não apresenta tabelas, chaves estrangeiras ou tipos de coluna.
- Esses elementos serão definidos posteriormente nos modelos lógico e físico.
- Cada pergunta deverá possuir uma ou mais alternativas.
- A quantidade de alternativas não deverá ser limitada a apenas duas.
- A estrutura deverá permitir adicionar novas alternativas sem modificar o modelo principal.
- As informações obrigatórias deverão respeitar as regras de integridade do banco de dados.

---

## 📌 7. Resumo do projeto

O banco de dados CyberQuiz foi planejado para organizar perguntas e respostas de maneira estruturada, permitindo a separação das informações em entidades específicas e relacionamentos bem definidos.

**Principais entidades:**

- Pergunta
- Categoria
- Fonte
- Publicador
- Idioma
- Alternativa

**Objetivo principal:** desenvolver uma estrutura de banco de dados organizada, flexível e preparada para armazenar perguntas de diferentes categorias, idiomas e quantidades de alternativas.

---

<div align="center">

**🧠 CyberQuiz**

*Aprender • Jogar • Conhecer*

</div>