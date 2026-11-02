# Passo 4 — Modelo conceitual

Marco M1. O desenho está em [`CyberQuiz_MER_Chen.png`](CyberQuiz_MER_Chen.png) (e em `CyberQuiz_MER_Chen.svg`, que é vetorial) — DER na notação de Chen, com entidades, atributos, relacionamentos, identificadores e cardinalidades. Nenhum tipo de coluna e nenhuma chave estrangeira aparecem ali: isso é o passo 5.

## Entidades

| Entidade | Atributos | Identificador |
| --- | --- | --- |
| CATEGORIA | `id_categoria`, `nome` | `id_categoria` |
| PUBLICADOR | `id_publicador`, `nome` | `id_publicador` |
| IDIOMA | `id_idioma`, `nome`, `codigo` | `id_idioma` |
| FONTE | `id_fonte`, `descricao`, `url` (opcional) | `id_fonte` |
| PERGUNTA | `id_pergunta`, `codigo`, `titulo`, `enunciado`, `explicacao` | `id_pergunta` |
| ALTERNATIVA | `id_alternativa`, `identificador`, `texto`, `correta` | `id_alternativa` |
| JOGADOR | `id_jogador`, `nome` | `id_jogador` |
| PONTUACAO | `id_pontuacao`, `valor_pontos`, `data_resposta` | `id_pontuacao` |

`codigo` é o identificador original (RD08) e é único: sobrevive à carga e não é regenerado. `correta` é o valor lógico da alternativa (RD05) e é ele que responde “acertou ou não” (RD06).

**JOGADOR não tem e-mail nem senha (RD12).** O quiz não pede cadastro: a pessoa digita o nome e joga. O nome é único para que o ranking consolide todas as rodadas da mesma pessoa.

## Relacionamentos

| Relacionamento | Cardinalidade | Justificativa | Requisito |
| --- | --- | --- | --- |
| CATEGORIA — *classifica* — PERGUNTA | CATEGORIA (0,N) — PERGUNTA (1,1) | Cada pergunta tem exatamente uma categoria; uma categoria pode reunir nenhuma ou várias perguntas. | RD01 |
| FONTE — *ampara* — PERGUNTA | FONTE (0,N) — PERGUNTA (1,1) | Cada pergunta cita exatamente uma fonte; a mesma fonte pode amparar nenhuma ou várias perguntas. | RD02 |
| PUBLICADOR — *publica* — FONTE | PUBLICADOR (0,N) — FONTE (1,1) | Cada fonte tem exatamente um publicador; um publicador pode responder por nenhuma ou várias fontes. | RD03 |
| IDIOMA — *identifica* — FONTE | IDIOMA (0,N) — FONTE (1,1) | Cada fonte está em exatamente um idioma; um idioma pode qualificar nenhuma ou várias fontes. | RD04 |
| PERGUNTA — *possui* — ALTERNATIVA | PERGUNTA (1,1) — ALTERNATIVA (4,N) | Cada alternativa pertence a exatamente uma pergunta; hoje toda pergunta tem quatro alternativas, e o máximo é livre. | RD05, RD07 |
| JOGADOR — *obtém* — PONTUACAO | JOGADOR (0,N) — PONTUACAO (1,1) | Cada pontuação pertence a um jogador; um jogador acumula nenhuma ou várias pontuações. | RD12, RA08 |
| PERGUNTA — *gera* — PONTUACAO | PERGUNTA (0,N) — PONTUACAO (1,1) | Cada pontuação nasce de uma pergunta respondida. | RA08 |
| ALTERNATIVA — *escolhe* — PONTUACAO | ALTERNATIVA (0,N) — PONTUACAO (1,1) | Cada pontuação registra **qual** alternativa foi marcada — é o que permite ao banco dizer se acertou. | RD06, RA08 |

**Regra de gabarito (RD06):** cada pergunta tem exatamente uma alternativa com `correta = verdadeiro`. A regra é do modelo, não de uma coluna na pergunta — assim a mesma estrutura serve a perguntas de Certo/Errado e de múltipla escolha.

**Ranking não é entidade.** O DER não tem tabela de ranking: ele é a soma de `valor_pontos` por jogador, calculada pela view `vw_ranking` (`08-views-api.sql`) e mostrada na tela de resultado.

## Nota sobre a imagem

O `CyberQuiz_MER_Chen.png` mostra oito entidades (as sete do núcleo mais PONTUACAO), com os atributos ligados por elipse e os relacionamentos em losango. O jogador aparece apenas com `id_jogador` e `nome`; não há e-mail, senha nem qualquer entidade de cadastro de perguntas.

A imagem anterior (`CyberQuiz_MER_Chen_corrigido (1).png`) mostrava `email` e `senha_hash` em JOGADOR — resquício de quando o quiz teria login. Ela foi substituída por esta versão.
