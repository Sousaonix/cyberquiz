// =====================================================================
//  CyberQuiz API — ponto de entrada.
//
//  Local:   npm install && npm run dev     -> http://localhost:3000
//  Render:  Start Command = node server.js (a porta vem de process.env.PORT)
// =====================================================================

import { createServer } from "./app.js";
import {
  carregarPerguntas,
  carregarRanking,
  salvarRespostas,
  supabaseConfigurado,
} from "./supabase.js";

const port = Number(process.env.PORT) || 3000;

const servidor = createServer({
  loadPerguntas: carregarPerguntas,
  loadRanking: carregarRanking,
  salvarRespostas: salvarRespostas,
  corsOrigin: process.env.CORS_ORIGIN,
});

servidor.listen(port, () => {
  console.log(`CyberQuiz API ouvindo em http://localhost:${port}`);
  if (!supabaseConfigurado) {
    console.warn(
      "Aviso: SUPABASE_URL/SUPABASE_KEY ausentes. /perguntas vai responder 503 até você configurar o .env.",
    );
  }
});

// O Render envia SIGTERM ao reiniciar o serviço. Fechar com calma evita
// conexões penduradas e deixa o deploy mais previsível.
for (const sinal of ["SIGTERM", "SIGINT"]) {
  process.on(sinal, () => {
    console.log(`${sinal} recebido, encerrando.`);
    servidor.close(() => process.exit(0));
  });
}
