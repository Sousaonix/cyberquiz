# 🧠 CyberQuiz

Quiz de **segurança cibernética** e **inteligência artificial**: o jogador digita o nome, responde 10 perguntas sorteadas de um banco de 100 e recebe o placar, o tempo e uma explicação com a fonte de cada resposta.

Projeto integrado de **Desenvolvimento Frontend**, **Modelagem de Banco de Dados** e **Algoritmos e Pensamento Computacional** — apresentado na Mostra de Tecnologia.

🔗 **Jogue online:** <https://sousaonix.github.io/cyberquiz/>

---

## Como funciona

```
┌──────────────────────────┐
│  Navegador (HTML/CSS/JS) │  GitHub Pages  ·  estático, sem build
└────────────┬─────────────┘
             │  GET /perguntas  (JSON)
             ▼
┌──────────────────────────┐
│  API Node.js (http puro) │  Render  ·  sem framework, rotas na mão
└────────────┬─────────────┘
             │  @supabase/supabase-js
             ▼
┌──────────────────────────┐
│  PostgreSQL              │  Supabase  ·  tabelas + views do MER
└──────────────────────────┘
```

O quiz pede as perguntas para a API. Se a API estiver fora do ar ou demorar
mais de 5 segundos, ele **cai automaticamente para o `questoes.json` local** —
o jogo nunca fica na mão na frente do público.

---

## Estrutura do repositório

| Caminho | O que é |
| --- | --- |
| `index.html` | Telas de entrada, pergunta e resultado |
| `css/styles.css` | Visual neon, um tema de cor por pergunta |
| `js/quiz.js` | Interação, nome do jogador, cronômetro, carregamento da API |
| `js/session.js` | Sorteio da rodada, placar e formatação do tempo |
| `js/sound.js` | Efeitos sonoros sintetizados na hora (Web Audio API) |
| `js/config.js` | Endereço da API |
| `questoes.json` | Banco local usado no modo offline |
| `assets/` | Logo, mascotes, fundos (WebP) e as ilustrações por categoria (SVG) |
| `api/` | Backend Node.js (Express? não — `node:http` puro) |
| `tests/` | Testes da lógica da rodada |
| `01`–`08` (raiz) | Entregas da disciplina de Banco de Dados: contexto, modelos, DDL, DML, testes, carga real e views |
| `docs/banco-de-dados.md` | Documentação do modelo de dados |
| `render.yaml` | Blueprint de deploy da API no Render |
| `.github/workflows/keepalive.yml` | Ping periódico para a API não dormir |

---

## Rodando na sua máquina

### Frontend

```bash
npx serve .      # ou: python -m http.server 8000
```

Abra o endereço mostrado. Para usar um backend local em vez do publicado:

```
http://localhost:8000/?api=http://localhost:3000
```

Para forçar o modo offline (só o `questoes.json`): `?api=`.

### API

```bash
cd api
npm install
cp .env.example .env    # preencha SUPABASE_URL e SUPABASE_KEY
npm run dev             # http://localhost:3000
```

Rotas: `GET /` · `GET /health` · `GET /perguntas` · `GET /perguntas/:id` ·
`GET /categorias` · `GET /ranking`

Filtros: `/perguntas?categoria=Inteligência Artificial` · `/perguntas?limite=10`

### Testes

```bash
npm test                # lógica do frontend (tests/)
npm run test:api        # rotas da API, com banco falso (api/test/)
```

---

## Banco de dados

O esquema segue o **MER (notação Chen)** e o contrato de nomes acordado com a
disciplina de Web. No **SQL Editor do Supabase**, rode nesta ordem:

| Ordem | Arquivo | O que faz |
| --- | --- | --- |
| 1 | `04-ddl.sql` | Cria tabelas, chaves, índices e gatilhos (inclui `pontuacao`) |
| 2 | `07-seed-questoes.sql` | Carrega as 100 perguntas, 400 alternativas, 88 fontes e 43 publicadores |
| 3 | `08-views-api.sql` | Cria `vw_quiz_json` (o JSON da API) e `vw_ranking` |

> `05-dml-consultas.sql` e `06-testes.sql` são a **massa de teste da disciplina
> de Banco de Dados**. Não rode no Supabase: eles acrescentariam perguntas de
> exemplo no meio das perguntas reais.

---

## Publicando (passo a passo)

1. **Supabase** — crie o projeto, rode os três arquivos SQL acima e copie
   `Project URL` + `service_role key` (Settings → API).
2. **Render** — *New +* → *Blueprint* → escolha este repositório. O
   `render.yaml` cria o serviço `cyberquiz-api` sozinho; depois preencha
   `SUPABASE_URL` e `SUPABASE_KEY` em *Environment*.
3. **GitHub Pages** — *Settings* → *Pages* → *Deploy from a branch* →
   `main` / `/ (root)`.
4. **Conectar os dois** — coloque a URL do Render em `js/config.js`
   (`API_URL`). Enquanto não colocar, o site funciona com o banco local.
5. **Evitar a soneira do Render** — rode uma vez o workflow
   *Manter a API acordada* em *Actions* (ou abra `/health` 5 minutos antes de
   apresentar).

---

## Tecnologias

HTML5 · CSS3 (variáveis, grid, `clamp`) · JavaScript ES Modules (sem framework)
· Web Audio API (sons gerados no navegador, sem arquivo de áudio) ·
Node.js (`node:http`, sem Express) · PostgreSQL 13+ · Supabase · Render ·
GitHub Pages · WebP (14,9 MB → 1,1 MB de imagens) · `node --test`

---

## Equipe

Projeto do **CyberQuiz** — segurança cibernética e IA.
*Equipe: <preencher>* · *Orientação: <preencher>*
