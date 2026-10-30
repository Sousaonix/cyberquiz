# Passo 4 — Modelo conceitual

Marco M1. O desenho está em [`02-conceitual.png`](02-conceitual.png) — DER na notação de Chen, com entidades, atributos, relacionamentos, identificadores e cardinalidades. Nenhum tipo de coluna e nenhuma chave estrangeira aparecem ali: isso é o passo 5.

## Entidades

| Entidade | Atributos | Identificador |
| --- | --- | --- |
| CATEGORIA | `id_categoria`, `nome` | `id_categoria` |
| PUBLICADOR | `id_publicador`, `nome` | `id_publicador` |
| IDIOMA | `id_idioma`, `nome`, `codigo` | `id_idioma` |
| FONTE | `id_fonte`, `descricao`, `url` (opcional) | `id_fonte` |
| PERGUNTA | `id_pergunta`, `codigo`, `titulo`, `enunciado`, `explicacao` | `id_pergunta` |
| ALTERNATIVA | `id_alternativa`, `identificador`, `texto`, `correta` | `id_alternativa` |
| JOGADOR | `id_jogador`, `nome`, `email`, `senha_hash` | `id_jogador` |

`codigo` é o identificador original (`fact-001`, RD08) e é único: sobrevive à carga e não é regenerado. `correta` é o valor lógico da alternativa (RD05) e é ele que responde “acertou ou não” (RD06).

## Relacionamentos

| Relacionamento | Cardinalidade | Justificativa | Requisito |
| --- | --- | --- | --- |
| CATEGORIA — *classifica* — PERGUNTA | CATEGORIA (0,N) — PERGUNTA (1,1) | Cada pergunta tem exatamente uma categoria; uma categoria pode reunir nenhuma ou várias perguntas. Uma categoria recém-criada ainda pode não ter pergunta, daí o mínimo 0. | RD01 |
| FONTE — *ampara* — PERGUNTA | FONTE (0,N) — PERGUNTA (1,1) | Cada pergunta cita exatamente uma fonte; a mesma fonte pode amparar nenhuma ou várias perguntas. | RD02 |
| PUBLICADOR — *publica* — FONTE | PUBLICADOR (0,N) — FONTE (1,1) | Cada fonte tem exatamente um publicador; um publicador pode responder por nenhuma ou várias fontes. | RD03 |
| IDIOMA — *qualifica* — FONTE | IDIOMA (0,N) — FONTE (1,1) | Cada fonte está em exatamente um idioma; um idioma pode qualificar nenhuma ou várias fontes. | RD04 |
| PERGUNTA — *possui* — ALTERNATIVA | PERGUNTA (1,1) — ALTERNATIVA (2,N) | Cada alternativa pertence a exatamente uma pergunta; a pergunta tem no mínimo duas alternativas, e o máximo é livre — é isso que permite acrescentar uma terceira ou quarta sem refazer a ficha da pergunta. | RD05, RD07 |
| JOGADOR — *sem relacionamento* | — | O jogador não se liga a pergunta nem a alternativa neste recorte: não há histórico de respostas nem pontuação no escopo. A entidade existe só para o cadastro e o login. | (fora do núcleo) |

**Regra de gabarito (RD06):** cada pergunta tem exatamente uma alternativa com `correta = verdadeiro`. A regra é do modelo, não de uma coluna na pergunta — assim a mesma estrutura serve a perguntas de Certo/Errado e de múltipla escolha.

## Nota sobre a imagem

O `02-conceitual.png` é o desenho anterior a esta revisão. Em relação às tabelas acima, ele difere em três pontos: publicador e idioma aparecem ligados a PERGUNTA (o correto é FONTE, itens RD03 e RD04); não aparecem `codigo`, `titulo`, `explicacao` e `correta`; e há duas elipses “IA” e “CyberSegurança” em CATEGORIA, que são valores e não atributos. As tabelas deste arquivo são a versão válida.
