# Passos 1 a 3 — Contexto, minimundo e requisitos

Marco M1. Projeto **CyberQuiz**.

## 1. Introdução e contexto

O CyberQuiz é um quiz de perguntas de múltipla escolha sobre segurança da informação, inteligência artificial e redes. O jogador escolhe uma pergunta, marca uma alternativa e recebe a confirmação da resposta junto com a explicação e a fonte. Este banco guarda as perguntas, suas categorias, as fontes que as amparam, os publicadores e idiomas dessas fontes, as alternativas de cada pergunta e o cadastro dos jogadores, de modo que a aplicação Web consiga montar a pergunta, corrigir a resposta e mostrar a procedência do conteúdo sem repetir dado nenhum.

### Escopo

| O banco faz | O banco não faz |
| --- | --- |
| Cadastra perguntas com enunciado, categoria, fonte, publicador e idioma | Não monta tela nem faz autenticação de sessão |
| Guarda as alternativas de cada pergunta, em quantidade variável | Não guarda pontuação, ranking nem histórico de respostas |
| Guarda o cadastro do jogador (nome, e-mail e hash da senha) | Não faz recuperação de senha nem envia e-mail |
| Responde às consultas do aplicativo (RA01–RA07) | Não versiona o texto das perguntas nem guarda auditoria |
| Impede duplicidade e campo obrigatório vazio (PK, FK, UNIQUE, NOT NULL) | Não conversa com outras bases nem importa dados externos |

> **Nota sobre `jogador`.** É a única tabela fora do núcleo de perguntas. Ela existe porque o CyberQuiz tem login próprio; a orientação manda não criá-la quando nenhum requisito pede cadastro, e aqui o requisito existe. A decisão está registrada em `03-logico.md`.

### Usuários

| Usuário | O que faz |
| --- | --- |
| Jogador | Cadastra-se, entra na conta, escolhe uma categoria, lê a pergunta, marca uma alternativa e vê a confirmação, a explicação e a fonte. |
| Quem cadastra perguntas | Inclui pergunta, categoria, fonte, publicador e idioma. No estado atual esse cadastro é feito pelo script de carga (`05-dml-consultas.sql`); a ausência de tela não apaga o fato de que os dados entram no banco. |

## 2. Minimundo

Preciso de um banco para um quiz de perguntas de múltipla escolha. Cada pergunta tem um código estável, no formato `fact-001`, `fact-002`, e esse código não pode ser regenerado a cada carga: é por ele que a equipe de Web se refere à pergunta. Além do código, a pergunta tem um título curto, o enunciado, que pode ser longo, e uma explicação que o jogador lê depois de responder; título, enunciado e explicação são obrigatórios.

Toda pergunta pertence a exatamente uma categoria, e não quero duas categorias com o mesmo nome. Toda pergunta cita exatamente uma fonte, e a mesma fonte pode amparar várias perguntas — se duas perguntas vierem do mesmo endereço, o endereço é cadastrado uma vez só. Cada fonte tem um único publicador, e o nome do publicador é gravado uma única vez; cada fonte tem também um idioma, vindo de um conjunto controlado, com código e descrição. Hoje a resposta é Certo ou Errado, e cada pergunta precisa indicar qual alternativa é a correta; mas quero poder acrescentar uma terceira ou quarta alternativa depois sem refazer a ficha da pergunta. Nome de categoria, nome de publicador e dados da fonte não podem ficar copiados dentro de cada pergunta.

## 3. Requisitos e regras de negócio

### Requisitos de dados e regras de negócio

| Código | Texto do requisito | Tipo |
| --- | --- | --- |
| RD01 | Toda pergunta pertence a exatamente uma categoria. Não há duas categorias com o mesmo nome. | regra de negócio |
| RD02 | Toda pergunta cita exatamente uma fonte. A mesma fonte pode ser citada por várias perguntas. A URL é única. | regra de negócio |
| RD03 | Toda fonte tem exatamente um publicador. O nome do publicador é único. | regra de negócio |
| RD04 | Toda fonte tem um idioma de um conjunto controlado, com código e descrição. | regra de negócio |
| RD05 | As alternativas atuais são Certo e Errado, cada uma com rótulo e valor lógico. | regra de negócio |
| RD06 | Toda pergunta indica qual alternativa é a correta. | regra de negócio |
| RD07 | O banco aceita, no futuro, mais de duas alternativas sem refazer a estrutura da pergunta. | funcional |
| RD08 | O identificador original da pergunta (fact-001, fact-002, …) é preservado. | regra de negócio |
| RD09 | Título, enunciado e explicação são obrigatórios. Enunciado e explicação podem ser longos. | regra de negócio |
| RD10 | Nome de categoria, nome de publicador e dados da fonte não se repetem em cada pergunta. | regra de negócio |
| RD11 | As perguntas da carga entram sem perda de campo. | funcional |

### Consultas que o banco precisa responder

| Código | Texto do requisito | Tipo |
| --- | --- | --- |
| RA01 | Listar as categorias em ordem alfabética, com a quantidade de perguntas. | funcional |
| RA02 | Sortear uma pergunta de qualquer categoria ou de uma categoria escolhida. | funcional |
| RA03 | Exibir título, enunciado e as alternativas. | funcional |
| RA04 | Dizer se a alternativa escolhida é a correta. | funcional |
| RA05 | Exibir a explicação e a fonte completa: título, publicador, URL e idioma. | funcional |
| RA06 | Listar os publicadores mais citados, com o número de perguntas. | funcional |
| RA07 | Listar as fontes citadas por mais de uma pergunta. | funcional |

### Requisitos não funcionais

| Código | Texto do requisito | Tipo |
| --- | --- | --- |
| RNF01 | O SGBD é PostgreSQL. | não funcional |
| RNF02 | Integridade: nome de categoria único, URL única, textos da pergunta obrigatórios, toda chave estrangeira do núcleo preenchida. | não funcional |

> **Rastreabilidade.** RD01–RD11 aparecem em `02-modelo-conceitual.md` (entidades e relacionamentos) e `03-logico.md` (mapeamento, dependências e dicionário); RA01–RA07 são respondidos em `05-dml-consultas.sql`, com o resultado de cada consulta; RNF01–RNF02 são verificados em `06-testes.sql`.
