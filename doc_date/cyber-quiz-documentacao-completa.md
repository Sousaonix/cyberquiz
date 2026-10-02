# CyberQuiz — Documentação do Banco de Dados

## 1. Introdução e contexto

O **CyberQuiz** é um sistema de perguntas e respostas voltado para aprendizado e entretenimento. O banco de dados tem como objetivo armazenar e organizar perguntas, suas categorias, fontes, publicadores, idiomas e alternativas de respostas, permitindo que os jogadores escolham um tema e respondam às perguntas disponíveis.

### Escopo

| O banco faz | O banco não faz |
|---|---|
| Armazena perguntas e suas informações. | Não permite conversas ou troca de mensagens entre usuários. |
| Armazena categorias das perguntas. | Não funciona como uma rede social. |
| Armazena as fontes utilizadas nas perguntas. | Não realiza comunicação entre usuários. |
| Armazena os publicadores das informações. | Não é responsável por produzir o conteúdo das perguntas. |
| Armazena o idioma das perguntas. | Não realiza pesquisas na internet em tempo real. |
| Armazena as alternativas de cada pergunta. | Não gerencia pagamentos ou compras. |
| Permite organizar as perguntas por tema/categoria. | Não armazena conversas entre usuários. |

### Usuários

| Usuário | O que faz |
|---|---|
| Jogador | Realiza o cadastro/login, escolhe uma categoria ou tema e responde às perguntas disponíveis no sistema. |
| Quem cadastra perguntas | Cadastra perguntas, categorias, fontes, publicadores, idiomas e alternativas de respostas no sistema. |

---

## 2. Minimundo

Quero um sistema que permita cadastrar uma pergunta, sua categoria, a fonte utilizada para respondê-la, o publicador da informação e o idioma. Para cada pergunta, o sistema deve permitir cadastrar alternativas de respostas, associadas à pergunta e identificadas de forma clara.

Inicialmente, cada pergunta poderá ter duas alternativas, mas o sistema deve ser estruturado de maneira flexível para permitir três ou mais alternativas no futuro, sem necessidade de alterar sua estrutura principal. As entidades e regras do sistema devem ser definidas a partir dessas informações, garantindo que cada pergunta pertença a uma categoria, tenha uma fonte e um publicador, esteja associada a um idioma e possa possuir uma quantidade variável de alternativas.

---

## 3. Requisitos e regras de negócio

| Código | Texto do requisito | Tipo |
|---|---|---|
| RD01 | O sistema deve permitir cadastrar perguntas. | Funcional |
| RD02 | O sistema deve permitir associar cada pergunta a uma categoria. | Funcional |
| RD03 | O sistema deve permitir cadastrar a fonte utilizada para cada pergunta. | Funcional |
| RD04 | O sistema deve permitir cadastrar o publicador da informação de cada pergunta. | Funcional |
| RD05 | O sistema deve permitir associar cada pergunta a um idioma. | Funcional |
| RD06 | O sistema deve permitir cadastrar alternativas de respostas para cada pergunta. | Funcional |
| RD07 | O sistema deve permitir que uma pergunta possua mais de duas alternativas. | Funcional |
| RD08 | O sistema deve permitir ao jogador escolher uma categoria ou tema para iniciar o quiz. | Funcional |
| RD09 | O sistema deve permitir ao jogador responder às perguntas cadastradas. | Funcional |
| RD10 | O sistema deve permitir o cadastro e o login dos jogadores. | Funcional |
| RD11 | O sistema deve organizar as informações das perguntas para que possam ser utilizadas no quiz. | Funcional |
| RA01 | Toda pergunta deve pertencer a uma categoria. | Regra de negócio |
| RA02 | Toda pergunta deve possuir uma fonte associada. | Regra de negócio |
| RA03 | Toda pergunta deve possuir um publicador associado. | Regra de negócio |
| RA04 | Toda pergunta deve estar associada a um idioma. | Regra de negócio |
| RA05 | Cada alternativa deve estar associada a uma pergunta. | Regra de negócio |
| RA06 | Uma pergunta deve poder possuir quantidade variável de alternativas, sem limitar a estrutura a apenas duas alternativas. | Regra de negócio |
| RA07 | O banco de dados deve garantir a integridade das informações, impedindo registros obrigatórios nulos ou duplicações quando não permitidas. | Não funcional |

---

# 4. Modelo Conceitual

## Entidades

| Entidade | Atributos | Identificador |
|---|---|---|
| Pergunta | texto da pergunta | id_pergunta |
| Categoria | nome da categoria | id_categoria |
| Fonte | nome da fonte | id_fonte |
| Publicador | nome do publicador | id_publicador |
| Idioma | nome do idioma | id_idioma |
| Alternativa | texto da alternativa, correta | id_alternativa |

## Relacionamentos

| Relacionamento | Cardinalidade | Justificativa | Requisito |
|---|---|---|---|
| Categoria classifica Pergunta | Categoria (0,N) — Pergunta (1,1) | Cada pergunta deve pertencer a uma categoria. | RD02 / RA01 |
| Fonte referencia Pergunta | Fonte (0,N) — Pergunta (1,1) | Cada pergunta deve possuir uma fonte. | RD03 / RA02 |
| Publicador publica Pergunta | Publicador (0,N) — Pergunta (1,1) | Cada pergunta deve possuir um publicador. | RD04 / RA03 |
| Idioma identifica Pergunta | Idioma (0,N) — Pergunta (1,1) | Cada pergunta deve estar associada a um idioma. | RD05 / RA04 |
| Pergunta possui Alternativa | Pergunta (1,N) — Alternativa (1,1) | Cada pergunta possui alternativas e cada alternativa pertence a uma pergunta. | RD06 / RA05 |

## Representação textual do modelo

- Uma **Categoria** pode classificar nenhuma ou várias **Perguntas**.
- Cada **Pergunta** deve pertencer a exatamente uma **Categoria**.
- Uma **Fonte** pode ser utilizada por nenhuma ou várias **Perguntas**.
- Cada **Pergunta** deve possuir exatamente uma **Fonte**.
- Um **Publicador** pode estar associado a nenhuma ou várias **Perguntas**.
- Cada **Pergunta** deve possuir exatamente um **Publicador**.
- Um **Idioma** pode estar associado a nenhuma ou várias **Perguntas**.
- Cada **Pergunta** deve estar associada a exatamente um **Idioma**.
- Cada **Pergunta** deve possuir uma ou várias **Alternativas**.
- Cada **Alternativa** deve pertencer a exatamente uma **Pergunta**.

## Observação

O modelo conceitual não apresenta tabelas, chaves estrangeiras ou tipos de coluna. Esses elementos serão definidos posteriormente no modelo lógico e no modelo físico.

A estrutura de alternativas foi definida de forma que uma pergunta possa possuir quantidade variável de alternativas, permitindo inicialmente duas e possibilitando três ou mais no futuro sem alterar a estrutura principal do modelo.

## DER — estrutura para representação em Chen

No desenho do DER, utilizar:

- Retângulos para as entidades.
- Elipses para os atributos.
- Losangos para os relacionamentos.
- Destacar o identificador de cada entidade conforme a notação de Chen.
- Representar as cardinalidades mínimas e máximas em cada relacionamento.

Estrutura dos relacionamentos:

1. `CATEGORIA (0,N) — CLASSIFICA — (1,1) PERGUNTA`
2. `FONTE (0,N) — REFERENCIA — (1,1) PERGUNTA`
3. `PUBLICADOR (0,N) — PUBLICA — (1,1) PERGUNTA`
4. `IDIOMA (0,N) — IDENTIFICA — (1,1) PERGUNTA`
5. `PERGUNTA (1,N) — POSSUI — (1,1) ALTERNATIVA`
