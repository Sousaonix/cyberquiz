// Gera o supabase/setup.sql (arquivo único para colar no SQL Editor).
// Uso: npm run build:sql
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const arquivos = [
  "docs/04-ddl.sql",
  "docs/07-seed-questoes.sql",
  "docs/08-views-api.sql",
];

const cabecalho = `-- =====================================================================
--  CyberQuiz — instalação completa no Supabase (arquivo único)
--
--  COMO USAR
--    1. Supabase -> SQL Editor -> New query
--    2. Cole este arquivo inteiro e clique em Run (Ctrl+Enter)
--    3. No fim aparece a conferência: 100 perguntas / 400 alternativas
--
--  Este arquivo é GERADO a partir de docs/04-ddl.sql,
--  docs/07-seed-questoes.sql e docs/08-views-api.sql.
--  Se mudar um deles, gere este de novo:
--      npm run build:sql
--  Não edite à mão.
-- =====================================================================
`;

const partes = arquivos.map(
  (nome) => `\n-- ===================== ${nome} =====================\n${readFileSync(nome, "utf8")}`,
);

mkdirSync("supabase", { recursive: true });
writeFileSync("supabase/setup.sql", cabecalho + partes.join("\n"), "utf8");
console.log("supabase/setup.sql gerado.");
