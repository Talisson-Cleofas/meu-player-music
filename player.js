const widgetIframe = document.getElementById("sc-widget");
const widget = SC.Widget(widgetIframe);
const btnTogglePlay = document.getElementById("btnTogglePlay");
const playIcon = document.getElementById("playIcon");

const audioFix = new Audio('https://raw.githubusercontent.com/anars/blank-audio/master/10-seconds-of-silence.mp3');
audioFix.loop = true;

let playlist = [];
let isProcessing = false;

// 1. Sincronização de PLAY (Reforçada para travar os controles)
widget.bind(SC.Widget.Events.PLAY, () => {
  playIcon.className = "fas fa-pause";
  
  widget.getCurrentSound((sound) => {
    if (sound) {
      document.getElementById("status").innerText = sound.title;
      // Atualiza a MediaSession TODA VEZ que o som muda
      applyMediaSession(sound);
      updateActiveTrackVisual(sound.title);
      audioFix.play().catch(() => {});
    }
  });
});

widget.bind(SC.Widget.Events.PAUSE, () => {
  playIcon.className = "fas fa-play";
  if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
  audioFix.pause();
});

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
    setTimeout(() => { isProcessing = false; }, 300);
  });
}

async function handleAddContent() {
  const urlInput = document.getElementById("videoUrl");
  let url = urlInput.value.trim();
  if (url.includes("soundcloud.com")) {
    document.getElementById("status").innerText = "Sintonizando...";
    url = url.replace("m.soundcloud.com", "soundcloud.com").split('?')[0];
    widget.load(url, {
      auto_play: true,
      callback: () => {
        setTimeout(() => {
          widget.getSounds((sounds) => {
            if (sounds) {
              playlist = sounds.map(s => ({ title: s.title }));
              updatePlaylistUI();
              widget.play();
            }
          });
        }, 1000);
      }
    });
  }
  urlInput.value = "";
}

function nextTrack() {
  audioFix.play().catch(() => {});
  widget.next();
}

function prevTrack() {
  audioFix.play().catch(() => {});
  widget.prev();
}

// CORREÇÃO AQUI: Forçamos o estado "playing" e limpamos os handlers de seek
function applyMediaSession(sound) {
  if ("mediaSession" in navigator) {
    const artwork = sound.artwork_url 
      ? sound.artwork_url.replace("http:", "https:").replace("-large", "-t500x500")
      : "https://a-v2.sndcdn.com/assets/images/default_track_artwork-6db91781.png";

    navigator.mediaSession.metadata = new MediaMetadata({
      title: sound.title,
      artist: sound.user.username,
      artwork: [{ src: artwork, sizes: "500x500", type: "image/jpg" }]
    });

    // Força o estado para o navegador habilitar os botões de faixa
    navigator.mediaSession.playbackState = "playing";

    // VINCULAÇÃO DOS BOTÕES
    navigator.mediaSession.setActionHandler("play", () => widget.play());
    navigator.mediaSession.setActionHandler("pause", () => widget.pause());
    navigator.mediaSession.setActionHandler("nexttrack", () => nextTrack());
    navigator.mediaSession.setActionHandler("previoustrack", () => prevTrack());

    // O SEGREDO: Setar como null explicitamente os comandos de "pular tempo"
    navigator.mediaSession.setActionHandler('seekbackward', null);
    navigator.mediaSession.setActionHandler('seekforward', null);
    try { navigator.mediaSession.setActionHandler('seekto', null); } catch (e) {}
  }
}

function updatePlaylistUI() {
  const listElement = document.getElementById("playlistView");
  listElement.innerHTML = "";
  playlist.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="track-num">${(index + 1).toString().padStart(2, '0')}</span><span class="track-name">${item.title}</span>`;
    li.onclick = () => widget.skip(index);
    listElement.appendChild(li);
  });
}

function updateActiveTrackVisual(currentTitle) {
  document.querySelectorAll("#playlistView li").forEach(li => {
    li.classList.remove("active-track");
    if (li.querySelector(".track-name").innerText === currentTitle) {
      li.classList.add("active-track");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnLoad").onclick = handleAddContent;
  btnTogglePlay.onclick = togglePlayback;
  document.getElementById("btnNext").onclick = nextTrack;
  document.getElementById("btnPrev").onclick = prevTrack;
});
