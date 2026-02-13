// 1. Definições globais
const widgetIframe = document.getElementById("sc-widget");
const widget = widgetIframe ? SC.Widget(widgetIframe) : null;

// Referências da UI
const btnTogglePlay = document.getElementById("btnTogglePlay");
const playIcon = document.getElementById("playIcon");
const progressSlider = document.getElementById("progressSlider");
const currentTimeDisplay = document.getElementById("currentTime");
const totalDurationDisplay = document.getElementById("totalDuration");
const btnNext = document.getElementById("btnNext");
const btnPrev = document.getElementById("btnPrev");

// AUDIO FIX
const audioFix = new Audio("https://raw.githubusercontent.com/anars/blank-audio/master/10-seconds-of-silence.mp3");
audioFix.loop = true;
audioFix.volume = 0.05;

let playlist = [];
let isProcessing = false;
let isDragging = false;
let isChangingTrack = false;

// --- LOGICA DO PLAYER ---
if (widget) {
  // ATUALIZAÇÃO DA BARRA DE PROGRESSO
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
    isChangingTrack = false;
    if (playIcon) playIcon.className = "fas fa-pause";
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";

    widget.getCurrentSound((sound) => {
      if (sound) {
        document.getElementById("status").innerText = sound.title;
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

  widget.bind(SC.Widget.Events.FINISH, () => {
    if (isChangingTrack) return;
    isChangingTrack = true;

    widget.getSounds((sounds) => {
      widget.getCurrentSoundIndex((index) => {
        if (index === sounds.length - 1) {
          setTimeout(() => { widget.skip(0); }, 500);
        } else {
          widget.next();
        }
      });
    });
  });
}

// FORMATAR TEMPO
function formatTime(ms) {
  if (!ms || isNaN(ms)) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

// CONTROLE DO SLIDER (ARRASTAR)
if (progressSlider) {
  progressSlider.addEventListener("input", () => { isDragging = true; });
  progressSlider.addEventListener("change", () => {
    widget.getDuration((duration) => {
      const seekToMs = (progressSlider.value / 100) * duration;
      widget.seekTo(seekToMs);
      isDragging = false;
    });
  });
}

// TOGGLE PLAY/PAUSE
function togglePlayback() {
  if (isProcessing || !widget) return;
  isProcessing = true;
  widget.isPaused((paused) => {
    if (paused) {
      audioFix.play().then(() => { widget.play(); }).catch(() => widget.play());
    } else {
      widget.pause();
    }
    setTimeout(() => { isProcessing = false; }, 300);
  });
}

// CARREGAR ÁLBUM
function carregarConteudo(urlPersonalizada) {
  audioFix.play().catch(() => {});
  const urlInput = document.getElementById("videoUrl");
  let url = urlPersonalizada || (urlInput ? urlInput.value.trim() : "");

  if (url && url.includes("soundcloud.com") && widget) {
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
      }
    });
  }
}

// MEDIA SESSION
function applyMediaSession(sound) {
  if ("mediaSession" in navigator) {
    const artwork = sound.artwork_url ? sound.artwork_url.replace("-large", "-t500x500") : "";
    navigator.mediaSession.metadata = new MediaMetadata({
      title: sound.title,
      artist: "Colo de Deus",
      artwork: [{ src: artwork, sizes: "500x500", type: "image/jpg" }]
    });

    navigator.mediaSession.setActionHandler("play", () => { widget.play(); });
    navigator.mediaSession.setActionHandler("pause", () => { widget.pause(); });
    navigator.mediaSession.setActionHandler("previoustrack", () => { widget.prev(); });
    navigator.mediaSession.setActionHandler("nexttrack", () => { widget.next(); });
  }
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
    if (isCurrent) li.classList.add("active-track");
  });
}

// INICIALIZAÇÃO
document.addEventListener("DOMContentLoaded", () => {
  // Configurar botões de álbuns
  const albumContainer = document.getElementById("albumButtons");
  if (albumContainer) {
    meusAlbuns.forEach((album) => {
      const btn = document.createElement("button");
      btn.className = "btn-album";
      btn.innerText = album.nome;
      btn.onclick = () => carregarConteudo(album.url);
      albumContainer.appendChild(btn);
    });
  }

  // Binds de eventos
  if (btnTogglePlay) btnTogglePlay.onclick = togglePlayback;
  if (btnNext) btnNext.onclick = () => widget.next();
  if (btnPrev) btnPrev.onclick = () => widget.prev();
  
  const btnLoad = document.getElementById("btnLoad");
  if (btnLoad) btnLoad.onclick = () => carregarConteudo();

  // Esconder splash
  setTimeout(() => {
    const splash = document.getElementById("splash-screen");
    if (splash) splash.style.display = "none";
  }, 2500);
});
