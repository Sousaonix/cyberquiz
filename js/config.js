// =====================================================================
//  Configuração do frontend.
//
//  API_URL aponta para o backend publicado no Render. O quiz tenta a API
//  primeiro; se ela estiver fora do ar (ou demorar demais), cai sozinho
//  para o questoes.json local — importante na feira, quando a rede pode
//  falhar ou o Render estar "dormindo".
//
//  Para forçar o modo offline, abra o site com ?api= no fim da URL.
//  Para testar contra o servidor local, use ?api=http://localhost:3000
// =====================================================================

const parametro = new URLSearchParams(window.location.search).get("api");

export const API_URL =
  parametro !== null ? parametro : "https://cyberquiz-api.onrender.com";

// Se a API não responder nesse tempo, o quiz usa o banco local.
export const API_TIMEOUT_MS = 5000;
