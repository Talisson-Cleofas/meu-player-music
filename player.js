// 1. Definições globais com proteção

const widgetIframe = document.getElementById("sc-widget");

const widget = widgetIframe ? SC.Widget(widgetIframe) : null;

const btnTogglePlay = document.getElementById("btnTogglePlay");

const playIcon = document.getElementById("playIcon");

const btnRepeat = document.getElementById("btnRepeat");

// Audio fix para manter o player vivo em background

const audioFix = new Audio(
  "https://raw.githubusercontent.com/anars/blank-audio/master/10-seconds-of-silence.mp3",
);

audioFix.loop = true;

let playlist = [];

let isProcessing = false;

let isRepeating = true; // Loop ativado por padrão

// 2. FUNÇÃO SPLASH

function hideSplash() {
  const splash = document.getElementById("splash-screen");

  if (splash) {
    splash.style.opacity = "0";

    setTimeout(() => {
      splash.style.display = "none";

      console.log("Splash removida.");
    }, 600);
  }
}

setTimeout(hideSplash, 2500);

// --- BIBLIOTECA DE ÁLBUNS ---

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
    nome: "Cordeiro 1",

    url: "https://soundcloud.com/colodedeus/sets/o-cordeiro-o-leao-e-o-trono-parte-1-voz-e-violao",
  },

  {
    nome: "Cordeiro 2",

    url: "https://soundcloud.com/colodedeus/sets/o-cordeiro-o-leao-e-o-trono-parte-2-voz-e-violao",
  },

  {
    nome: "Cordeiro 3",

    url: "https://soundcloud.com/colodedeus/sets/o-cordeiro-o-leao-e-o-trono-4",
  },

  {
    nome: "Casa de Maria",

    url: "https://soundcloud.com/colodedeus/sets/projeto-casa-de-maria",
  },
];

// --- LOGICA DO PLAYER ---

if (widget) {
  // LÓGICA DE LOOP UNIVERSAL (Resolve Android/Chrome)

  widget.bind(SC.Widget.Events.FINISH, () => {
    if (isRepeating) {
      widget.getCurrentSoundIndex((index) => {
        widget.getSounds((sounds) => {
          if (sounds && index === sounds.length - 1) {
            // Se for a última música, volta para a primeira

            widget.skip(0);
          } else {
            // Senão, vai para a próxima

            widget.next();
          }

          widget.play();
        });
      });
    }
  });

  widget.bind(SC.Widget.Events.PLAY, () => {
    if (playIcon) playIcon.className = "fas fa-pause";

    widget.getCurrentSound((sound) => {
      if (sound) {
        document.getElementById("status").innerText = sound.title;

        document.title = "▶ " + sound.title;

        updateActiveTrackVisual(sound.title);

        audioFix.play().catch(() => {});

        applyMediaSession(sound);
      }
    });
  });

  widget.bind(SC.Widget.Events.PAUSE, () => {
    if (playIcon) playIcon.className = "fas fa-play";

    audioFix.pause();
  });
}

function togglePlayback() {
  if (isProcessing || !widget) return;

  isProcessing = true;

  widget.isPaused((paused) => {
    paused ? widget.play() : widget.pause();

    setTimeout(() => (isProcessing = false), 300);
  });
}

function carregarConteudo(urlPersonalizada) {
  const urlInput = document.getElementById("videoUrl");

  let url = urlPersonalizada || (urlInput ? urlInput.value.trim() : "");

  if (url && url.includes("soundcloud.com") && widget) {
    document.getElementById("status").innerText = "Sintonizando...";

    widget.load(url, {
      auto_play: true,

      show_artwork: false,

      callback: () => {
        setTimeout(() => {
          widget.getSounds((sounds) => {
            if (sounds) {
              playlist = sounds.map((s) => ({ title: s.title }));

              updatePlaylistUI();

              widget.setLoop(isRepeating);
            }
          });
        }, 1500);
      },
    });
  }
}

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

function applyMediaSession(sound) {
  if ("mediaSession" in navigator) {
    const artwork = sound.artwork_url
      ? sound.artwork_url.replace("-large", "-t500x500")
      : "";

    navigator.mediaSession.metadata = new MediaMetadata({
      title: sound.title,

      artist: sound.user.username,

      artwork: [{ src: artwork, sizes: "500x500", type: "image/jpg" }],
    });

    navigator.mediaSession.setActionHandler("nexttrack", () => widget.next());

    navigator.mediaSession.setActionHandler("previoustrack", () =>
      widget.prev(),
    );
  }
}

function updatePlaylistUI() {
  const listElement = document.getElementById("playlistView");

  if (!listElement) return;

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
    const nameElem = li.querySelector(".track-name");

    const isCurrent = nameElem && nameElem.innerText === currentTitle;

    // Remove a classe e o equalizador de todos primeiro

    li.classList.remove("active-track");

    const existingEqualizer = li.querySelector(".now-playing-equalizer");

    if (existingEqualizer) existingEqualizer.remove();

    if (isCurrent) {
      li.classList.add("active-track");

      // Cria e injeta o HTML das barrinhas

      const eq = document.createElement("div");

      eq.className = "now-playing-equalizer";

      eq.innerHTML = "<span></span><span></span><span></span>";

      li.appendChild(eq);
    }
  });
}

// Inicialização

document.addEventListener("DOMContentLoaded", () => {
  initAlbuns();

  if (btnTogglePlay) btnTogglePlay.onclick = togglePlayback;

  if (document.getElementById("btnLoad"))
    document.getElementById("btnLoad").onclick = () => carregarConteudo();

  if (document.getElementById("btnNext"))
    document.getElementById("btnNext").onclick = () => widget.next();

  if (document.getElementById("btnPrev"))
    document.getElementById("btnPrev").onclick = () => widget.prev();
});
