// 1. Definições globais
const widgetIframe = document.getElementById("sc-widget");
const widget = widgetIframe ? SC.Widget(widgetIframe) : null;
const btnTogglePlay = document.getElementById("btnTogglePlay");
const playIcon = document.getElementById("playIcon");
const progressSlider = document.getElementById("progressSlider");
const currentTimeDisplay = document.getElementById("currentTime");
const totalDurationDisplay = document.getElementById("totalDuration");

// AUDIO FIX: Mantém o canal de áudio aberto no Android
const audioFix = new Audio("https://raw.githubusercontent.com/anars/blank-audio/master/10-seconds-of-silence.mp3");
audioFix.loop = true;
audioFix.volume = 0.05;

let playlist = [];
let isProcessing = false;
let isDragging = false;

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

  // CORREÇÃO: Lógica de próximo e loop do álbum
  widget.bind(SC.Widget.Events.FINISH, () => {
    widget.getSounds((sounds) => {
      widget.getCurrentSoundIndex((index) => {
        if (index === sounds.length - 1) {
          // Se for a última música, volta para a primeira (0)
          widget.skip(0);
        } else {
          // Senão, vai para a próxima
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
  // Ativa o áudio no clique do botão (exigência do navegador)
  audioFix.play().catch(() => {});
  
  const urlInput = document.getElementById("videoUrl");
  let url = urlPersonalizada || (urlInput ? urlInput.value.trim() : "");

  if (url && url.includes("soundcloud.com") && widget) {
    document.getElementById("status").innerText = "Sintonizando...";
    widget.load(url, {
      auto_play: true, // Tenta o autoplay, mas o widget.play() abaixo garante
      show_artwork: false,
      callback: () => {
        // Pequeno delay para o SoundCloud processar o carregamento
        setTimeout(() => {
          widget.play(); 
          widget.getSounds((sounds) => {
            if (sounds) {
              playlist = sounds.map((s) => ({ title: s.title }));
              updatePlaylistUI();
            }
          });
        }, 1000);
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
      artwork: [{ src: artwork, sizes: "500x500", type: "image/jpg" }],
    });

    navigator.mediaSession.setActionHandler("play", async () => {
      audioFix.currentTime = 0;
      try {
        await audioFix.play();
        widget.play();
        navigator.mediaSession.playbackState = "playing";
      } catch (err) {
        widget.play();
      }
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      widget.pause();
      navigator.mediaSession.playbackState = "paused";
    });

    navigator.mediaSession.setActionHandler("previoustrack", () => { widget.prev(); });
    navigator.mediaSession.setActionHandler("nexttrack", () => { widget.next(); });
    
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime) widget.seekTo(details.seekTime * 1000);
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
    li.onclick = () => { 
        audioFix.play().catch(() => {});
        widget.skip(index); 
    };
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
  container.innerHTML = ""; // Limpa antes de renderizar
  meusAlbuns.forEach((album) => {
    const btn = document.createElement("button");
    btn.className = "btn-album";
    btn.innerText = album.nome;
    btn.onclick = () => carregarConteudo(album.url);
    container.appendChild(btn);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initAlbuns();
  if (btnTogglePlay) btnTogglePlay.onclick = togglePlayback;
  
  // Botão carregar manual
  const btnLoad = document.getElementById("btnLoad");
  if (btnLoad) btnLoad.onclick = () => carregarConteudo();

  if (document.getElementById("btnNext"))
    document.getElementById("btnNext").onclick = () => { audioFix.play().catch(() => {}); widget.next(); };
  if (document.getElementById("btnPrev"))
    document.getElementById("btnPrev").onclick = () => { audioFix.play().catch(() => {}); widget.prev(); };
});
