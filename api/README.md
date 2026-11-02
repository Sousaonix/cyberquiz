# CyberQuiz API

Backend do quiz: entrega as perguntas do Supabase em JSON para o frontend.

Sem Express, sem Fastify — só `node:http`, como pede o roteiro da disciplina.
O roteamento está em `app.js`, o acesso ao banco em `supabase.js` e o start em
`server.js`.

## As quatro etapas do roteiro, onde estão no código

| Etapa | O que era | Onde ficou |
| --- | --- | --- |
| 1 | Servidor Node com rotas `GET` e dados mock | `app.js` — o roteamento não sabe de onde vêm os dados; recebe `loadPerguntas` por injeção |
| 2 | Tabela criada no Supabase | `04-ddl.sql` + `07-seed-questoes.sql` |
| 3 | Backend consultando o banco de verdade | `supabase.js` — consulta a view `vw_quiz_json` |
| 4 | Backend publicado com URL pública | `render.yaml` + este README |

A injeção da etapa 1 é o que torna o roteamento testável: `test/api.test.js`
roda as rotas com um banco falso, sem precisar de Supabase.

## Rodando local

```bash
cd api
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm run dev               # http://localhost:3000
```

Sem `.env`, as rotas respondem `503` com uma mensagem explicando o que falta.

## Variáveis de ambiente

| Nome | Para que serve |
| --- | --- |
| `SUPABASE_URL` | URL do projeto (`https://xxxx.supabase.co`) |
| `SUPABASE_KEY` | Chave **service_role** — só no servidor |
| `CORS_ORIGIN` | Origens liberadas, separadas por vírgula |
| `PORT` | Porta local (o Render define a dele) |

> A chave `service_role` ignora o RLS. Ela nunca pode ir para o frontend nem
> para o GitHub — por isso o `.env` está no `.gitignore`.

## Rotas

| Rota | Resposta |
| --- | --- |
| `GET /` | Nome, descrição e lista de endpoints |
| `GET /health` | `{ status, perguntas, hora }` — usado pelo keep-alive |
| `GET /perguntas` | Lista completa no formato do frontend |
| `GET /perguntas?categoria=...` | Filtra por categoria (ignora acento/maiúsculas) |
| `GET /perguntas?limite=10` | Limita a quantidade |
| `GET /perguntas/:id` | Uma pergunta (404 se não existir) |
| `GET /categorias` | Categorias com a contagem de perguntas |
| `GET /ranking` | Top jogadores da view `vw_ranking` |

## Deploy no Render

1. *New +* → *Blueprint* → selecione o repositório do CyberQuiz.
2. O `render.yaml` da raiz cria o serviço `cyberquiz-api` (`rootDir: api`).
3. Em *Environment*, preencha `SUPABASE_URL` e `SUPABASE_KEY`.
4. A URL final fica `https://cyberquiz-api.onrender.com` — coloque em
   `js/config.js` no frontend.

**Plano free:** o serviço dorme após ~15 min sem acesso e leva ~1 min para
acordar. O workflow `.github/workflows/keepalive.yml` faz um ping a cada 10
minutos para evitar isso durante a feira.

## Problemas comuns

| Sintoma | Causa provável |
| --- | --- |
| `503` em `/perguntas` | `.env` ausente ou variáveis não preenchidas no Render |
| `502` em `/perguntas` | View não criada, ou `08-views-api.sql` não rodou |
| Navegador bloqueia a chamada (erro de CORS) | Origem do site fora do `CORS_ORIGIN` |
| `/ranking` vazio | Nenhuma pontuação gravada ainda — a tabela `pontuacao` existe, mas o quiz ainda não envia respostas |
