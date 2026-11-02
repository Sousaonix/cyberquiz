# 📚 Documentação do CyberQuiz

Tudo o que é documentação vive aqui. O site (HTML/CSS/JS) fica na raiz do
repositório porque é de lá que o GitHub Pages publica; o backend fica em
`../api/` e o SQL pronto para instalar, em `../supabase/`.

## Banco de dados — leia nesta ordem

| # | Arquivo | Conteúdo |
| --- | --- | --- |
| 1 | [`01-contexto.md`](01-contexto.md) | Contexto, minimundo, escopo, usuários e requisitos (RD/RA/RNF) |
| 2 | [`02-modelo-conceitual.md`](02-modelo-conceitual.md) | Entidades, atributos e relacionamentos (notação de Chen) |
| 3 | [`03-logico.md`](03-logico.md) | Mapeamento lógico, normalização e dicionário de dados |
| 4 | `04-ddl.sql` | Modelo físico: tabelas, chaves, índices e gatilhos |
| 5 | `05-dml-consultas.sql` | Massa de teste da disciplina e as consultas RA01–RA07 |
| 6 | `06-testes.sql` | Testes das regras de negócio (o que deve falhar e por quê) |
| 7 | `07-seed-questoes.sql` | Carga real: 100 perguntas, 400 alternativas, 88 fontes |
| 8 | `08-views-api.sql` | Views que a API consome: `vw_quiz_json`, `vw_ranking`, `vw_desempenho_pergunta` |

> Resumo de tudo em [`banco-de-dados.md`](banco-de-dados.md).

## Diagrama

| Arquivo | Uso |
| --- | --- |
| [`CyberQuiz_MER_Chen.png`](CyberQuiz_MER_Chen.png) | Imagem para slides e impressão |
| [`CyberQuiz_MER_Chen.svg`](CyberQuiz_MER_Chen.svg) | Vetorial (não perde qualidade em nenhum tamanho) |
| [`mer.dot`](mer.dot) | Fonte do desenho (Graphviz) — edite e gere de novo: `dot -Tpng -Gdpi=150 -o CyberQuiz_MER_Chen.png mer.dot` |

## Histórico

`doc_date/` guarda a **primeira versão** da documentação, mantida só como
registro da evolução do trabalho. Ela está marcada como histórica e não deve
ser usada como referência do modelo atual.
