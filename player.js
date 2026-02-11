const widgetIframe = document.getElementById("sc-widget");
const widget = SC.Widget(widgetIframe);
const btnTogglePlay = document.getElementById("btnTogglePlay");

const audioFix = new Audio('https://raw.githubusercontent.com/anars/blank-audio/master/10-seconds-of-silence.mp3');
audioFix.loop = true;

let playlist = [];
let isProcessing = false; // Evita cliques múltiplos que travam o pause

// 1. Sincronização de PLAY
widget.bind(SC.Widget.Events.PLAY, () => {
  btnTogglePlay.innerText = "⏸";
  if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
  
  widget.getCurrentSound((sound) => {
    if (sound) {
      document.getElementById("status").innerText = sound.title;
      applyMediaSession(sound);
      updateActiveTrackVisual(sound.title);
      audioFix.play().catch(() => {});
    }
  });
});

// 2. Sincronização de PAUSE
widget.bind(SC.Widget.Events.PAUSE, () => {
  btnTogglePlay.innerText = "▶";
  if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
  audioFix.pause();
});

// 3. Lógica do Botão Único (Corrigida para Navegador)
function togglePlayback() {
  if (isProcessing) return;
  isProcessing = true;

  // Perguntamos o estado real ao Widget antes de agir
  widget.isPaused((paused) => {
    if (paused) {
      widget.play();
      audioFix.play().catch(() => {});
    } else {
      widget.pause();
      // Reforço: Se o primeiro pause falhar (comum no Safari/Chrome), tenta de novo em 50ms
      setTimeout(() => {
        widget.isPaused((stillPlaying) => {
          if (!stillPlaying) widget.pause();
        });
      }, 50);
    }
    
    // Libera o botão após um curto delay
    setTimeout(() => { isProcessing = false; }, 300);
  });
}

// 4. Normalização e Carga
async function handleAddContent() {
  const urlInput = document.getElementById("videoUrl");
  let url = urlInput.value.trim();

  if (url.includes("soundcloud.com")) {
    document.getElementById("status").innerText = "Sintonizando...";
    
    // Limpa links móveis e parâmetros de rastreio
    url = url.replace("m.soundcloud.com", "soundcloud.com").split('?')[0];

    widget.load(url, {
      auto_play: true,
      callback: () => {
        setTimeout(() => {
          widget.getSounds((sounds) => {
            if (sounds && sounds.length > 0) {
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

    navigator.mediaSession.setActionHandler("play", () => widget.play());
    navigator.mediaSession.setActionHandler("pause", () => widget.pause());
    navigator.mediaSession.setActionHandler("nexttrack", () => nextTrack());
    navigator.mediaSession.setActionHandler("previoustrack", () => prevTrack());
    navigator.mediaSession.setActionHandler('seekbackward', null);
    navigator.mediaSession.setActionHandler('seekforward', null);
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
  const items = document.querySelectorAll("#playlistView li");
  items.forEach(li => {
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
