# CyberQuiz — Identificação da equipe

Projeto da disciplina de Modelagem de Banco de Dados (Braz Cubas, 2026/2).
A equipe é a mesma de Aplicativos para Web.

| Campo       | Preenchimento |
| ----------- | ------------- |
| Equipe      | _CyberQuiz_   |
| Integrantes | _Joao H, Morata, Felipe Gustavo, Andrey, Matheus Lopes_   |
| Repositório | _https://github.com/Sousaonix/cyberquiz_   |
| Data        | _15/09/2026_   |

## Regras que valem para a entrega inteira

- **SGBD:** PostgreSQL.
- **Nomes:** português, minúsculos, sem acento, no singular. Chave primária no padrão `id_<tabela>`.
- **Modelo conceitual:** DER na notação de Chen (PDF ou imagem), no brModelo ou Visual Paradigm Online.
- **Modelo lógico:** outro desenho, com tabelas, colunas, PK e FK. Não é um segundo DER.
- **Scripts:** rodam em sequência, do zero, em banco vazio, sem erro.
- **Contrato com Web:** a partir do modelo físico, nomes de tabela e de coluna são o acordo com Aplicativos para Web. Mudança posterior entra no repositório e é comunicada.

## Arquivos desta pasta

```text
entregas/
  00-identificacao.md        <- este arquivo
  01-contexto.md             M1  passos 1 a 3
  02-conceitual.png          M1  passo 4 (DER em Chen)
  02-modelo-conceitual.md    M1  passo 4 (tabelas de entidades e relacionamentos)
  03-logico.md               M2  passos 5 e 6
  04-ddl.sql                 M3  passo 7
  05-dml-consultas.sql       M4  passo 8
  06-testes.sql              M4  passo 9
  PENDENCIAS.md              status da entrega e o que depende de você
```

Ordem de execução: `04-ddl.sql` → `05-dml-consultas.sql` → `06-testes.sql`.

```bash
createdb cyberquiz
psql -d cyberquiz -v ON_ERROR_STOP=1 -f 04-ddl.sql
psql -d cyberquiz -v ON_ERROR_STOP=1 -f 05-dml-consultas.sql
psql -d cyberquiz -v ON_ERROR_STOP=1 -f 06-testes.sql
```
