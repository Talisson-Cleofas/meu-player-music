// 1. Definições globais
const widgetIframe = document.getElementById("sc-widget");
const widget = widgetIframe ? SC.Widget(widgetIframe) : null;
const btnTogglePlay = document.getElementById("btnTogglePlay");
const playIcon = document.getElementById("playIcon");
const progressSlider = document.getElementById("progressSlider");
const currentTimeDisplay = document.getElementById("currentTime");
const totalDurationDisplay = document.getElementById("totalDuration");

// AUDIO FIX: Canal de áudio
const audioFix = new Audio("https://raw.githubusercontent.com/anars/blank-audio/master/10-seconds-of-silence.mp3");
audioFix.loop = true;
audioFix.volume = 0.05;

let playlist = [];
let isProcessing = false;
let isDragging = false;
let isChangingTrack = false; // TRAVA para evitar pulo duplo

// 2. FUNÇÃO SPLASH
function hideSplash() {
  const splash = document.getElementById("splash-screen");
  if (splash) {
    splash.style.opacity = "0";
    setTimeout(() => { splash.style.display = "none"; }, 600);
  }
}
setTimeout(hideSplash, 2500);

// --- BIBLIOTECA DE ÁLBUNS ---
const meusAlbuns = [
  { nome: "Efeito Atomiko", url: "https://soundcloud.com/colodedeus/sets/efeito-atomiko-ao-vivo-no" },
  { nome: "Camp Fire", url: "https://soundcloud.com/colodedeus/sets/camp-fire-ao-vivo" },
  { nome: "Rahamim", url: "https://soundcloud.com/colodedeus/sets/rahamim-4" },
  { nome: "AD10", url: "https://soundcloud.com/colodedeus/sets/adoracao-na-nossa-casa-e-1" },
  { nome: "Secreto", url: "https://soundcloud.com/colodedeus/sets/secreto-33" },
  { nome: "Deserto", url: "https://soundcloud.com/colodedeus/sets/deserto-5" },
  { nome: "Intimidade", url: "https://soundcloud.com/colodedeus/sets/intimidade-28" },
  { nome: "Confia", url: "https://soundcloud.com/colodedeus/sets/confia-8" },
  { nome: "Esdras", url: "https://soundcloud.com/colodedeus/sets/esdras-6" },
  { nome: "Cordeiro 1", url: "https://soundcloud.com/colodedeus/sets/o-cordeiro-o-leao-e-o-trono-parte-1-voz-e-violao" },
  { nome: "Cordeiro 2", url: "https://soundcloud.com/colodedeus/sets/o-cordeiro-o-leao-e-o-trono-parte-2-voz-e-violao" },
  { nome: "Cordeiro 3", url: "https://soundcloud.com/colodedeus/sets/o-cordeiro-o-leao-e-o-trono-4" },
  { nome: "Casa de Maria", url: "https://soundcloud.com/colodedeus/sets/projeto-casa-de-maria" },
];

// --- LOGICA DO PLAYER ---
if (widget) {
  widget.bind(SC.Widget.Events.PLAY_PROGRESS, (data) => {
    if (!isDragging && progressSlider) {
      const currentPos = data.currentPosition;
      widget.getDuration((duration) => {
        if (duration > 0) {
          const percentage = (currentPos / duration) * 100;
          progressSlider.value = percentage;
          if (currentTimeDisplay) currentTimeDisplay.innerText = formatTime(currentPos);
          if (totalDurationDisplay) totalDurationDisplay.innerText = formatTime(duration);
          updatePositionState(currentPos, duration);
        }
      });
    }
  });

  widget.bind(SC.Widget.Events.PLAY, () => {
    isChangingTrack = false; // Libera a trava quando a música começa
    if (playIcon) playIcon.className = "fas fa-pause";
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";

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
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
  });

  // LÓGICA DE PRÓXIMA MÚSICA E REINÍCIO DO ÁLBUM
  widget.bind(SC.Widget.Events.FINISH, () => {
    if (isChangingTrack) return; // Se já estiver mudando, ignora o segundo evento
    isChangingTrack = true;

    widget.getSounds((sounds) => {
      widget.getCurrentSoundIndex((index) => {
        if (index === sounds.length - 1) {
          // Chegou no fim do álbum: Volta para a primeira
          setTimeout(() => { widget.skip(0); }, 500);
        } else {
          // Vai para a próxima
          widget.next();
        }
      });
    });
  });
}

function updatePositionState(currentMs, totalMs) {
  if ("setPositionState" in navigator.mediaSession) {
    navigator.mediaSession.setPositionState({
      duration: totalMs / 1000,
      playbackRate: 1.0,
      position: currentMs / 1000,
    });
  }
}

function formatTime(ms) {
  if (!ms || isNaN(ms)) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function togglePlayback() {
  if (isProcessing || !widget) return;
  isProcessing = true;
  widget.isPaused((paused) => {
    if (paused) {
      audioFix.play().then(() => { widget.play(); }).catch(() => widget.play());
    } else {
      widget.pause();
    }
    setTimeout(() => (isProcessing = false), 300);
  });
}

function carregarConteudo(urlPersonalizada) {
  audioFix.play().catch(() => {});
  const urlInput = document.getElementById("videoUrl");
  let url = urlPersonalizada || (urlInput ? urlInput.value.trim() : "");

  if (url && url.includes("soundcloud.com") && widget) {
    document.getElementById("status").innerText = "Sintonizando...";
    widget.load(url, {
      auto_play: true,
      show_artwork: false,
      callback: () => {
        setTimeout(() => {
          widget.play();
          widget.getSounds((sounds) => {
            if (sounds) {
              playlist = sounds.map((s) => ({ title: s.title }));
              updatePlaylistUI();
            }
          });
        }, 1200);
      },
    });
  }
}

function applyMediaSession(sound) {
  if ("mediaSession" in navigator) {
    const artwork = sound.artwork_url ? sound.artwork_url.replace("-large", "-t500x500") : "";
    navigator.mediaSession.metadata = new MediaMetadata({
      title: sound.title,
      artist: "Colo de Deus",
      album: "CloudCast",
      artwork: [{ src: artwork, sizes: "500x500", type: "image/jpg" }]
    });

    navigator.mediaSession.setActionHandler("play", async () => {
      await audioFix.play().catch(() => {});
      widget.play();
    });

    navigator.mediaSession.setActionHandler("pause", () => { widget.pause(); });
    navigator.mediaSession.setActionHandler("previoustrack", () => { widget.prev(); });
    navigator.mediaSession.setActionHandler("nexttrack", () => { widget.next(); });
  }
}

function updatePlaylistUI() {
  const listElement = document.getElementById("playlistView");
  if (!listElement) return;
  listElement.innerHTML = "";
  playlist.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="track-num">${(index + 1).toString().padStart(2, "0")}</span><span class="track-name">${item.title}</span>`;
    li.onclick = () => { widget.skip(index); };
    listElement.appendChild(li);
  });
}

function updateActiveTrackVisual(currentTitle) {
  const items = document.querySelectorAll("#playlistView li");
  items.forEach((li) => {
    const nameElem = li.querySelector(".track-name");
    const isCurrent = nameElem && nameElem.innerText === currentTitle;
    li.classList.remove("active-track");
    const existingEq = li.querySelector(".now-playing-equalizer");
    if (existingEq) existingEq.remove();
    if (isCurrent) {
      li.classList.add("active-track");
      const eq = document.createElement("div");
      eq.className = "now-playing-equalizer";
      eq.innerHTML = "<span></span><span></span><span></span>";
      li.appendChild(eq);
    }
  });
}

function initAlbuns() {
  const container = document.getElementById("albumButtons");
  if (!container) return;
  container.innerHTML = "";
  meusAlbuns.forEach((album) => {
    const btn = document.createElement("button");
    btn.className = "btn-album";
    btn.innerText = album.nome;
    btn.onclick = () => carregarConteudo(album.url);
    container.appendChild(btn);
  });
}

// RESTAURAÇÃO DOS BOTÕES E CLIQUES
document.addEventListener("DOMContentLoaded", () => {
  initAlbuns();
  
  if (btnTogglePlay) btnTogglePlay.onclick = togglePlayback;
  
  const btnLoad = document.getElementById("btnLoad");
  if (btnLoad) btnLoad.onclick = () => carregarConteudo();

  // IDs corrigidos conforme o seu HTML
  const btnNext = document.getElementById("btnNext");
  const btnPrev = document.getElementById("btnPrev");

  if (btnNext) {
    btnNext.onclick = () => {
      audioFix.play().catch(() => {});
      widget.next();
    };
  }

  if (btnPrev) {
    btnPrev.onclick = () => {
      audioFix.play().catch(() => {});
      widget.prev();
    };
  }
});
