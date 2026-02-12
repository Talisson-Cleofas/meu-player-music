const widgetIframe = document.getElementById("sc-widget");
const widget = SC.Widget(widgetIframe);
const btnTogglePlay = document.getElementById("btnTogglePlay");
const playIcon = document.getElementById("playIcon");
const btnRepeat = document.getElementById("btnRepeat"); // Referência ao novo botão

const audioFix = new Audio(
  "https://raw.githubusercontent.com/anars/blank-audio/master/10-seconds-of-silence.mp3",
);
audioFix.loop = true;

let playlist = [];
let isProcessing = false;
let isRepeating = false; // Estado inicial da repetição

// --- CONFIGURAÇÃO DA BIBLIOTECA DE ÁLBUNS ---
const meusAlbuns = [
  {
    nome: "Efeito Atomiko",
    url: "https://soundcloud.com/colodedeus/sets/efeito-atomiko-ao-vivo-no",
  },
  {
    nome: "Camp Fire",
    url: "https://soundcloud.com/colodedeus/sets/camp-fire-ao-vivo",
  },
  { nome: "Rahamim", url: "https://soundcloud.com/colodedeus/sets/rahamim-4" },
  {
    nome: "AD10",
    url: "https://soundcloud.com/colodedeus/sets/adoracao-na-nossa-casa-e-1",
  },
  { nome: "Secreto", url: "https://soundcloud.com/colodedeus/sets/secreto-33" },
  { nome: "Deserto", url: "https://soundcloud.com/colodedeus/sets/deserto-5" },
  {
    nome: "Intimidade",
    url: "https://soundcloud.com/colodedeus/sets/intimidade-28",
  },
  { nome: "Confia", url: "https://soundcloud.com/colodedeus/sets/confia-8" },
  { nome: "Esdras", url: "https://soundcloud.com/colodedeus/sets/esdras-6" },
  {
    nome: "O Cordeiro, o leão e o trono Part 1",
    url: "https://soundcloud.com/colodedeus/sets/o-cordeiro-o-leao-e-o-trono-parte-1-voz-e-violao",
  },
  {
    nome: "O Cordeiro, o leão e o trono Part 2",
    url: "https://soundcloud.com/colodedeus/sets/o-cordeiro-o-leao-e-o-trono-parte-2-voz-e-violao",
  },
  {
    nome: "O Cordeiro, o leão e o trono Part 3",
    url: "https://soundcloud.com/colodedeus/sets/o-cordeiro-o-leao-e-o-trono-4",
  },
  {
    nome: "Casa de Maria",
    url: "https://soundcloud.com/colodedeus/sets/projeto-casa-de-maria",
  },
];

// 1. Sincronização de PLAY
widget.bind(SC.Widget.Events.PLAY, () => {
  playIcon.className = "fas fa-pause";

  widget.getCurrentSound((sound) => {
    if (sound) {
      document.getElementById("status").innerText = sound.title;

      setTimeout(() => {
        applyMediaSession(sound);
      }, 400);

      updateActiveTrackVisual(sound.title);
      audioFix.play().catch(() => {});
    }
  });
});

// 2. Sincronização de PAUSE
widget.bind(SC.Widget.Events.PAUSE, () => {
  playIcon.className = "fas fa-play";
  if ("mediaSession" in navigator)
    navigator.mediaSession.playbackState = "paused";
  audioFix.pause();
});

// 3. Lógica do Botão Único (Play/Pause)
function togglePlayback() {
  if (isProcessing) return;
  isProcessing = true;
  widget.isPaused((paused) => {
    if (paused) {
      widget.play();
      audioFix.play().catch(() => {});
    } else {
      widget.pause();
    }
    setTimeout(() => {
      isProcessing = false;
    }, 300);
  });
}

// 3.1 Lógica do Botão de Repetir
function toggleRepeat() {
  isRepeating = !isRepeating;

  // Define o loop no Widget do SoundCloud
  widget.setLoop(isRepeating);

  // Atualiza visual do botão
  if (isRepeating) {
    btnRepeat.classList.add("btn-repeat-active");
  } else {
    btnRepeat.classList.remove("btn-repeat-active");
  }
}

// 4. Carregar Álbum da Biblioteca ou Input
async function carregarConteudo(urlPersonalizada) {
  const urlInput = document.getElementById("videoUrl");
  let url = urlPersonalizada || urlInput.value.trim();

  if (url.includes("soundcloud.com")) {
    const status = document.getElementById("status");
    status.innerText = "Sintonizando...";

    url = url.replace("m.soundcloud.com", "soundcloud.com").split("?")[0];

    widget.load(url, {
      auto_play: true,
      show_artwork: false,
      callback: () => {
        // 1. Primeiro esperamos o Widget estar pronto para nos dar a lista
        setTimeout(() => {
          widget.getSounds((sounds) => {
            if (sounds && sounds.length > 0) {
              playlist = sounds.map((s) => ({ title: s.title }));
              updatePlaylistUI();

              // 2. SÓ ATIVAMOS O LOOP DEPOIS QUE A LISTA JÁ FOI RENDERIZADA
              setTimeout(() => {
                widget.setLoop(true);
                console.log("Loop automático ativado.");
              }, 500);

              widget.play();
            } else {
              // Tentativa de emergência caso o SoundCloud demore a responder
              recarregarListaManual();
            }
          });
        }, 1500); // Tempo seguro para o Iframe processar o link
      },
    });
  }
  if (!urlPersonalizada) urlInput.value = "";
}

// Função de segurança para garantir que a lista apareça
function recarregarListaManual() {
  widget.getSounds((sounds) => {
    if (sounds) {
      playlist = sounds.map((s) => ({ title: s.title }));
      updatePlaylistUI();
    }
  });
}

// 5. Inicializar Botões de Álbuns
function initAlbuns() {
  const container = document.getElementById("albumButtons");
  if (!container) return;

  meusAlbuns.forEach((album) => {
    const btn = document.createElement("button");
    btn.className = "btn-album";
    btn.innerText = album.nome;
    btn.onclick = () => carregarConteudo(album.url);
    container.appendChild(btn);
  });
}

function nextTrack() {
  audioFix.play().catch(() => {});

  // Verifica qual é a música atual antes de pular
  widget.getCurrentSoundIndex((index) => {
    widget.getSounds((sounds) => {
      if (sounds) {
        const totalTracks = sounds.length;

        // Se o índice atual for o último (total - 1), pula para a primeira (0)
        if (index === totalTracks - 1) {
          widget.skip(0);
        } else {
          widget.next(); // Caso contrário, pula normal
        }
      }
    });
  });
}

function prevTrack() {
  audioFix.play().catch(() => {});
  widget.prev();
}

// 6. Configuração da MediaSession
function applyMediaSession(sound) {
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = null;

    const artwork = sound.artwork_url
      ? sound.artwork_url
          .replace("http:", "https:")
          .replace("-large", "-t500x500")
      : "https://a-v2.sndcdn.com/assets/images/default_track_artwork-6db91781.png";

    navigator.mediaSession.metadata = new MediaMetadata({
      title: sound.title,
      artist: sound.user.username,
      album: "SoundCloud Player",
      artwork: [{ src: artwork, sizes: "500x500", type: "image/jpg" }],
    });

    navigator.mediaSession.playbackState = "playing";

    navigator.mediaSession.setActionHandler("play", () => widget.play());
    navigator.mediaSession.setActionHandler("pause", () => widget.pause());
    navigator.mediaSession.setActionHandler("nexttrack", () => nextTrack());
    navigator.mediaSession.setActionHandler("previoustrack", () => prevTrack());

    const disableActions = ["seekbackward", "seekforward", "seekto"];
    disableActions.forEach((action) => {
      try {
        navigator.mediaSession.setActionHandler(action, null);
      } catch (e) {}
    });
  }
}

function updatePlaylistUI() {
  const listElement = document.getElementById("playlistView");
  listElement.innerHTML = "";
  playlist.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="track-num">${(index + 1).toString().padStart(2, "0")}</span><span class="track-name">${item.title}</span>`;
    li.onclick = () => widget.skip(index);
    listElement.appendChild(li);
  });
}

function updateActiveTrackVisual(currentTitle) {
  const items = document.querySelectorAll("#playlistView li");

  items.forEach((li) => {
    li.classList.remove("active-track");
    const existingEq = li.querySelector(".now-playing-equalizer");
    if (existingEq) existingEq.remove();

    const nameText = li.querySelector(".track-name").innerText;
    if (nameText === currentTitle) {
      li.classList.add("active-track");
      const eq = document.createElement("div");
      eq.className = "now-playing-equalizer";
      eq.innerHTML = "<span></span><span></span><span></span>";
      li.appendChild(eq);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initAlbuns();
  document.getElementById("btnLoad").onclick = () => carregarConteudo();
  btnTogglePlay.onclick = togglePlayback;
  document.getElementById("btnNext").onclick = nextTrack;
  document.getElementById("btnPrev").onclick = prevTrack;
  btnRepeat.onclick = toggleRepeat; // Evento de clique para o botão de repetição
  // Garante que o estado inicial do widget seja loop
  widget.setLoop(true);
});
