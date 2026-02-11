const widgetIframe = document.getElementById("sc-widget");
const widget = SC.Widget(widgetIframe);
const btnTogglePlay = document.getElementById("btnTogglePlay");

// Áudio silencioso para manter o sistema acordado no Mobile
const audioFix = new Audio('https://raw.githubusercontent.com/anars/blank-audio/master/10-seconds-of-silence.mp3');
audioFix.loop = true;

let playlist = [];

// 1. Quando a música começa a tocar
widget.bind(SC.Widget.Events.PLAY, () => {
  btnTogglePlay.innerText = "⏸"; // Muda o botão para ícone de PAUSE
  widget.getCurrentSound((sound) => {
    if (sound) {
      document.getElementById("status").innerText = sound.title;
      applyMediaSession(sound);
      updateActiveTrackVisual(sound.title);
      audioFix.play().catch(() => {});
    }
  });
});

// 2. Quando a música pausa
widget.bind(SC.Widget.Events.PAUSE, () => {
  btnTogglePlay.innerText = "▶"; // Muda o botão para ícone de PLAY
});

widget.bind(SC.Widget.Events.FINISH, () => nextTrack());

// 3. Carregar conteúdo e normalizar links Mobile
async function handleAddContent() {
  const urlInput = document.getElementById("videoUrl");
  let url = urlInput.value.trim();

  if (url.includes("soundcloud.com")) {
    document.getElementById("status").innerText = "Sintonizando...";
    
    // Normaliza links: remove o "m." e limpa rastreadores do celular (?si=...)
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

// 4. Lógica do botão único Play/Pause
function togglePlayback() {
  widget.isPaused((paused) => {
    if (paused) {
      widget.play();
      audioFix.play().catch(() => {});
    } else {
      widget.pause();
      audioFix.pause();
    }
  });
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
    
    // Esconde os botões de 10 segundos
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

// 5. Configuração final dos eventos
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnLoad").onclick = handleAddContent;
  btnTogglePlay.onclick = togglePlayback; // Evento do botão único
  document.getElementById("btnNext").onclick = nextTrack;
  document.getElementById("btnPrev").onclick = prevTrack;
});
