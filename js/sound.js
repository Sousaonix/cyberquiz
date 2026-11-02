// =====================================================================
//  Efeitos sonoros do CyberQuiz.
//
//  Tudo é sintetizado na hora com a Web Audio API: nenhum arquivo de áudio
//  para baixar, nada de licença de terceiros e zero peso extra na página.
//  Também significa que o som funciona offline, no celular, sem depender
//  da rede da feira.
//
//  O navegador só libera áudio depois de um gesto do usuário — por isso o
//  contexto é criado no primeiro clique (o botão "Jogar").
// =====================================================================

const CHAVE_PREFERENCIA = "cyberquiz.som";
const VOLUME_MESTRE = 0.5;

let contexto = null;
let mestra = null;
let mudo = false;

function audioDisponivel() {
  return typeof window !== "undefined" && Boolean(window.AudioContext || window.webkitAudioContext);
}

function garantirContexto() {
  if (!audioDisponivel()) return null;

  if (!contexto) {
    const AudioContexto = window.AudioContext || window.webkitAudioContext;
    contexto = new AudioContexto();
    mestra = contexto.createGain();
    mestra.gain.value = mudo ? 0 : VOLUME_MESTRE;
    mestra.connect(contexto.destination);
  }

  // Safari/iOS começa o contexto "suspended" mesmo após um clique.
  if (contexto.state === "suspended") {
    contexto.resume().catch(() => {});
  }

  return contexto;
}

// Uma nota simples: ataque rápido, decadência exponencial (evita "clique").
function nota({
  frequencia,
  ateFrequencia,
  tipo = "sine",
  duracao = 0.16,
  volume = 0.1,
  atraso = 0,
  ataque = 0.008,
}) {
  const ctx = garantirContexto();
  if (!ctx || mudo) return;

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

  oscilador.connect(ganho).connect(mestra);
  oscilador.start(inicio);
  oscilador.stop(inicio + duracao + 0.03);
}

// ---------------------------------------------------------------------
//  Sons
// ---------------------------------------------------------------------

export function playClick() {
  nota({ frequencia: 880, ateFrequencia: 660, tipo: "square", duracao: 0.06, volume: 0.045 });
}

export function playStart() {
  // "Varredura" para cima: dá a sensação de partida.
  nota({ frequencia: 220, ateFrequencia: 660, tipo: "triangle", duracao: 0.28, volume: 0.08 });
  nota({ frequencia: 1320, tipo: "sine", duracao: 0.14, volume: 0.04, atraso: 0.12 });
}

export function playCorrect() {
  // Arpejo maior (dó–mi–sol) + brilho no fim.
  [523.25, 659.25, 783.99].forEach((frequencia, indice) => {
    nota({
      frequencia,
      tipo: "triangle",
      duracao: 0.18,
      volume: 0.09,
      atraso: indice * 0.07,
    });
  });
  nota({ frequencia: 1567.98, tipo: "sine", duracao: 0.26, volume: 0.045, atraso: 0.2 });
}

export function playWrong() {
  // Queda grave com serra + baque: "errou".
  nota({ frequencia: 220, ateFrequencia: 110, tipo: "sawtooth", duracao: 0.28, volume: 0.075 });
  nota({ frequencia: 110, ateFrequencia: 82.4, tipo: "square", duracao: 0.22, volume: 0.05, atraso: 0.04 });
}

export function playFinish(venceu = true) {
  if (venceu) {
    [523.25, 659.25, 783.99, 1046.5].forEach((frequencia, indice) => {
      nota({ frequencia, tipo: "triangle", duracao: 0.24, volume: 0.1, atraso: indice * 0.11 });
    });
    // Acorde final sustentado.
    [523.25, 659.25, 783.99].forEach((frequencia) => {
      nota({ frequencia, tipo: "sine", duracao: 0.7, volume: 0.05, atraso: 0.46 });
    });
    return;
  }

  [392, 329.63].forEach((frequencia, indice) => {
    nota({ frequencia, tipo: "triangle", duracao: 0.34, volume: 0.075, atraso: indice * 0.16 });
  });
}

// ---------------------------------------------------------------------
//  Liga/desliga (com preferência guardada no navegador)
// ---------------------------------------------------------------------

export function somLigado() {
  return !mudo;
}

export function lerPreferenciaDeSom() {
  try {
    mudo = localStorage.getItem(CHAVE_PREFERENCIA) === "off";
  } catch {
    mudo = false;
  }
  return !mudo;
}

export function alternarSom() {
  mudo = !mudo;

  try {
    localStorage.setItem(CHAVE_PREFERENCIA, mudo ? "off" : "on");
  } catch {
    // modo privado pode bloquear o localStorage; o som continua funcionando
  }

  if (mestra && contexto) {
    mestra.gain.setTargetAtTime(mudo ? 0 : VOLUME_MESTRE, contexto.currentTime, 0.02);
  }

  if (!mudo) playClick();
  return !mudo;
}

export function configurarBotaoSom(botao) {
  if (!botao) return;

  const atualizar = () => {
    const ligado = !mudo;
    botao.setAttribute("aria-pressed", String(ligado));
    botao.setAttribute("aria-label", ligado ? "Desligar sons" : "Ligar sons");
    botao.title = ligado ? "Desligar sons" : "Ligar sons";
    botao.classList.toggle("is-muted", !ligado);
  };

  atualizar();
  botao.addEventListener("click", () => {
    alternarSom();
    atualizar();
  });
}
