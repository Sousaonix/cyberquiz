// =====================================================================
//  Áudio do CyberQuiz: efeitos + música ambiente, tudo sintetizado.
//
//  Nada de arquivo de áudio: Web Audio API pura. Isso mantém a página
//  leve, funciona offline e não depende de licença de música de terceiros.
//
//  O navegador só libera som depois de um gesto do usuário — por isso o
//  contexto nasce no primeiro clique (Jogar, abrir as configurações...).
// =====================================================================

const CHAVE_PREFERENCIAS = "cyberquiz.som";
const PADRAO = { efeitos: 0.8, musica: 0.35, musicaLigada: true };

let contexto = null;
let ganhoEfeitos = null;
let ganhoMusica = null;
let preferencias = { ...PADRAO };

// ---------------------------------------------------------------------
//  Contexto e volumes
// ---------------------------------------------------------------------

function audioDisponivel() {
  return typeof window !== "undefined" && Boolean(window.AudioContext || window.webkitAudioContext);
}

function garantirContexto() {
  if (!audioDisponivel()) return null;

  if (!contexto) {
    const AudioContexto = window.AudioContext || window.webkitAudioContext;
    contexto = new AudioContexto();

    ganhoEfeitos = contexto.createGain();
    ganhoEfeitos.gain.value = preferencias.efeitos;
    ganhoEfeitos.connect(contexto.destination);

    ganhoMusica = contexto.createGain();
    ganhoMusica.gain.value = 0; // sobe só quando a música é ligada
    ganhoMusica.connect(contexto.destination);
  }

  // Safari/iOS começa o contexto "suspended" mesmo após um clique.
  if (contexto.state === "suspended") {
    contexto.resume().catch(() => {});
  }

  return contexto;
}

export function lerPreferencias() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_PREFERENCIAS) || "{}");
    preferencias = {
      efeitos: numeroEntre(salvo.efeitos, PADRAO.efeitos),
      musica: numeroEntre(salvo.musica, PADRAO.musica),
      musicaLigada: typeof salvo.musicaLigada === "boolean" ? salvo.musicaLigada : PADRAO.musicaLigada,
    };
  } catch {
    preferencias = { ...PADRAO };
  }
  return { ...preferencias };
}

function salvarPreferencias() {
  try {
    localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify(preferencias));
  } catch {
    // modo privado pode bloquear o localStorage; o som continua funcionando
  }
}

function numeroEntre(valor, padrao) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return padrao;
  return Math.min(1, Math.max(0, numero));
}

export function definirVolumeEfeitos(valor) {
  preferencias.efeitos = numeroEntre(valor, PADRAO.efeitos);
  if (ganhoEfeitos && contexto) {
    ganhoEfeitos.gain.setTargetAtTime(preferencias.efeitos, contexto.currentTime, 0.03);
  }
  salvarPreferencias();
  return preferencias.efeitos;
}

export function definirVolumeMusica(valor) {
  preferencias.musica = numeroEntre(valor, PADRAO.musica);
  atualizarVolumeDaMusica();
  salvarPreferencias();
  return preferencias.musica;
}

function atualizarVolumeDaMusica() {
  if (!ganhoMusica || !contexto) return;
  const alvo = preferencias.musicaLigada ? preferencias.musica * 0.5 : 0;
  ganhoMusica.gain.setTargetAtTime(alvo, contexto.currentTime, 0.4);
}

// ---------------------------------------------------------------------
//  Notas
// ---------------------------------------------------------------------

function nota({
  frequencia,
  ateFrequencia,
  tipo = "sine",
  duracao = 0.16,
  volume = 0.1,
  atraso = 0,
  ataque = 0.008,
  destino = "efeitos",
}) {
  const ctx = garantirContexto();
  if (!ctx) return;
  if (destino === "efeitos" && preferencias.efeitos === 0) return;

  const alvo = destino === "musica" ? ganhoMusica : ganhoEfeitos;
  if (!alvo) return;

  const inicio = ctx.currentTime + atraso;
  const oscilador = ctx.createOscillator();
  const ganho = ctx.createGain();

  oscilador.type = tipo;
  oscilador.frequency.setValueAtTime(frequencia, inicio);
  if (ateFrequencia && ateFrequencia !== frequencia) {
    oscilador.frequency.exponentialRampToValueAtTime(ateFrequencia, inicio + duracao);
  }

  ganho.gain.setValueAtTime(0.0001, inicio);
  ganho.gain.linearRampToValueAtTime(volume, inicio + ataque);
  ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + duracao);

  oscilador.connect(ganho).connect(alvo);
  oscilador.start(inicio);
  oscilador.stop(inicio + duracao + 0.05);
}

// ---------------------------------------------------------------------
//  Efeitos
// ---------------------------------------------------------------------

export function playClick() {
  nota({ frequencia: 880, ateFrequencia: 660, tipo: "square", duracao: 0.06, volume: 0.05 });
}

export function playStart() {
  nota({ frequencia: 220, ateFrequencia: 660, tipo: "triangle", duracao: 0.28, volume: 0.09 });
  nota({ frequencia: 1320, tipo: "sine", duracao: 0.14, volume: 0.045, atraso: 0.12 });
}

export function playCorrect() {
  [523.25, 659.25, 783.99].forEach((frequencia, indice) => {
    nota({ frequencia, tipo: "triangle", duracao: 0.18, volume: 0.1, atraso: indice * 0.07 });
  });
  nota({ frequencia: 1567.98, tipo: "sine", duracao: 0.26, volume: 0.05, atraso: 0.2 });
}

export function playWrong() {
  nota({ frequencia: 220, ateFrequencia: 110, tipo: "sawtooth", duracao: 0.28, volume: 0.08 });
  nota({ frequencia: 110, ateFrequencia: 82.4, tipo: "square", duracao: 0.22, volume: 0.055, atraso: 0.04 });
}

export function playFinish(venceu = true) {
  if (venceu) {
    [523.25, 659.25, 783.99, 1046.5].forEach((frequencia, indice) => {
      nota({ frequencia, tipo: "triangle", duracao: 0.24, volume: 0.11, atraso: indice * 0.11 });
    });
    [523.25, 659.25, 783.99].forEach((frequencia) => {
      nota({ frequencia, tipo: "sine", duracao: 0.7, volume: 0.055, atraso: 0.46 });
    });
    return;
  }

  [392, 329.63].forEach((frequencia, indice) => {
    nota({ frequencia, tipo: "triangle", duracao: 0.34, volume: 0.08, atraso: indice * 0.16 });
  });
}

// ---------------------------------------------------------------------
//  Música ambiente
//
//  Um pad lento: cada acorde entra com ataque longo e sai devagar, então
//  as notas se misturam. A progressão é menor e sem batida — serve de
//  fundo, não compete com o jogo.
// ---------------------------------------------------------------------

const ACORDES = [
  [146.83, 220.0, 293.66], // Dm
  [130.81, 196.0, 261.63], // C
  [174.61, 261.63, 349.23], // F
  [196.0, 246.94, 293.66], // G
];

const DURACAO_ACORDE = 8; // segundos
const BRILHOS = [523.25, 587.33, 659.25, 783.99, 880.0];

let agendaMusica = null;
let indiceAcorde = 0;

function tocarAcorde() {
  const acorde = ACORDES[indiceAcorde % ACORDES.length];

  acorde.forEach((frequencia, indice) => {
    nota({
      frequencia,
      tipo: indice === 0 ? "sine" : "triangle",
      duracao: DURACAO_ACORDE + 1.5,
      volume: indice === 0 ? 0.09 : 0.055,
      atraso: indice * 0.35,
      ataque: 2.4,
      destino: "musica",
    });
  });

  // Um "sino" de vez em quando, bem discreto, para o loop não ficar parado.
  if (indiceAcorde % 2 === 1) {
    const brilho = BRILHOS[Math.floor(Math.random() * BRILHOS.length)];
    nota({
      frequencia: brilho,
      tipo: "sine",
      duracao: 3.2,
      volume: 0.035,
      atraso: 1.5,
      ataque: 0.5,
      destino: "musica",
    });
  }

  indiceAcorde += 1;
}

export function iniciarMusica() {
  if (!preferencias.musicaLigada) return;
  if (!garantirContexto()) return;

  atualizarVolumeDaMusica();
  if (agendaMusica) return;

  tocarAcorde();
  agendaMusica = setInterval(tocarAcorde, DURACAO_ACORDE * 1000);
}

export function pararMusica() {
  if (agendaMusica) {
    clearInterval(agendaMusica);
    agendaMusica = null;
  }
  atualizarVolumeDaMusica();
}

export function definirMusicaLigada(ligada) {
  preferencias.musicaLigada = Boolean(ligada);
  salvarPreferencias();

  if (preferencias.musicaLigada) {
    iniciarMusica();
  } else {
    pararMusica();
  }

  return preferencias.musicaLigada;
}

export function musicaLigada() {
  return preferencias.musicaLigada;
}

// ---------------------------------------------------------------------
//  Painel de configurações
// ---------------------------------------------------------------------

export function iniciarPainelSom() {
  if (typeof document === "undefined") return;

  const botao = document.querySelector("#settings-toggle");
  const painel = document.querySelector("#settings-panel");
  const fechar = document.querySelector("#settings-close");
  const volumeEfeitos = document.querySelector("#volume-efeitos");
  const rotuloEfeitos = document.querySelector("#volume-efeitos-valor");
  const volumeMusica = document.querySelector("#volume-musica");
  const rotuloMusica = document.querySelector("#volume-musica-valor");
  const musicaCheck = document.querySelector("#musica-ligada");

  if (!botao || !painel) return;

  lerPreferencias();

  const atualizarTela = () => {
    const efeitos = Math.round(preferencias.efeitos * 100);
    const musica = Math.round(preferencias.musica * 100);

    if (volumeEfeitos) volumeEfeitos.value = String(efeitos);
    if (rotuloEfeitos) rotuloEfeitos.textContent = `${efeitos}%`;
    if (volumeMusica) volumeMusica.value = String(musica);
    if (rotuloMusica) rotuloMusica.textContent = `${musica}%`;
    if (musicaCheck) musicaCheck.checked = preferencias.musicaLigada;
  };

  const abrir = (sim) => {
    painel.hidden = !sim;
    botao.setAttribute("aria-expanded", String(sim));
    if (sim) {
      atualizarTela();
      painel.querySelector("input, button")?.focus({ preventScroll: true });
    } else {
      botao.focus({ preventScroll: true });
    }
  };

  botao.addEventListener("click", () => {
    garantirContexto();
    abrir(painel.hidden);
  });

  fechar?.addEventListener("click", () => abrir(false));

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && !painel.hidden) abrir(false);
  });

  document.addEventListener("pointerdown", (evento) => {
    if (painel.hidden) return;
    if (painel.contains(evento.target) || botao.contains(evento.target)) return;
    abrir(false);
  });

  volumeEfeitos?.addEventListener("input", () => {
    definirVolumeEfeitos(Number(volumeEfeitos.value) / 100);
    if (rotuloEfeitos) rotuloEfeitos.textContent = `${volumeEfeitos.value}%`;
  });

  // Só toca o "clique" ao soltar o slider, senão o arrasto vira metralhadora.
  volumeEfeitos?.addEventListener("change", () => playClick());

  volumeMusica?.addEventListener("input", () => {
    definirVolumeMusica(Number(volumeMusica.value) / 100);
    if (rotuloMusica) rotuloMusica.textContent = `${volumeMusica.value}%`;
  });

  musicaCheck?.addEventListener("change", () => {
    definirMusicaLigada(musicaCheck.checked);
  });

  // Música só pode começar depois de um gesto: o primeiro clique na
  // página (inclusive no botão Jogar) dispara.
  const acordar = () => {
    garantirContexto();
    if (preferencias.musicaLigada) iniciarMusica();
  };
  window.addEventListener("pointerdown", acordar, { once: true });
  window.addEventListener("keydown", acordar, { once: true });

  atualizarTela();
}
