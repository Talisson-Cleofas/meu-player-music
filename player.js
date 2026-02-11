const widgetIframe = document.getElementById("sc-widget");
const widget = SC.Widget(widgetIframe);
const btnTogglePlay = document.getElementById("btnTogglePlay");
const playIcon = document.getElementById("playIcon");

const audioFix = new Audio('https://raw.githubusercontent.com/anars/blank-audio/master/10-seconds-of-silence.mp3');
audioFix.loop = true;

let playlist = [];
let isProcessing = false;

// 1. Sincronização de PLAY
widget.bind(SC.Widget.Events.PLAY, () => {
  playIcon.className = "fas fa-pause";
  
  widget.getCurrentSound((sound) => {
    if (sound) {
      document.getElementById("status").innerText = sound.title;
      
      // O SEGREDO: Pequeno atraso e reset de metadados para forçar os botões de faixa
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
  if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
  audioFix.pause();
});

// 3. Lógica do Botão Único
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

// 4. Carregar e Normalizar Links
async function handleAddContent() {
  const urlInput = document.getElementById("videoUrl");
  let url = urlInput.value.trim();
  if (url.includes("soundcloud.com")) {
    document.getElementById("status").innerText = "Sintonizando...";
    // Converte mobile para desktop e limpa parâmetros
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

// 5. Configuração da MediaSession (Forçar Próximo/Anterior)
function applyMediaSession(sound) {
  if ("mediaSession" in navigator) {
    // RESET TOTAL: Limpar para o navegador esquecer os botões de 10s
    navigator.mediaSession.metadata = null;

    const artwork = sound.artwork_url 
      ? sound.artwork_url.replace("http:", "https:").replace("-large", "-t500x500")
      : "https://a-v2.sndcdn.com/assets/images/default_track_artwork-6db91781.png";

    navigator.mediaSession.metadata = new MediaMetadata({
      title: sound.title,
      artist: sound.user.username,
      album: "SoundCloud Player",
      artwork: [{ src: artwork, sizes: "500x500", type: "image/jpg" }]
    });

    // Avisa que é uma música (habilita botões de faixa)
    navigator.mediaSession.playbackState = "playing";

    // Registrar Ações
    navigator.mediaSession.setActionHandler("play", () => widget.play());
    navigator.mediaSession.setActionHandler("pause", () => widget.pause());
    navigator.mediaSession.setActionHandler("nexttrack", () => nextTrack());
    navigator.mediaSession.setActionHandler("previoustrack", () => prevTrack());

    // BLOQUEIO EXPLÍCITO de 10 segundos
    const disableActions = ['seekbackward', 'seekforward', 'seekto'];
    disableActions.forEach(action => {
      try { navigator.mediaSession.setActionHandler(action, null); } catch (e) {}
    });
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
    // Remove o estado ativo e qualquer equalizador existente
    li.classList.remove("active-track");
    const existingEq = li.querySelector(".now-playing-equalizer");
    if (existingEq) existingEq.remove();

    // Se o nome da música for igual ao que está tocando
    const nameText = li.querySelector(".track-name").innerText;
    if (nameText === currentTitle) {
      li.classList.add("active-track");

      // Cria o elemento do equalizador
      const eq = document.createElement("div");
      eq.className = "now-playing-equalizer";
      eq.innerHTML = "<span></span><span></span><span></span>";
      
      // Adiciona o equalizador ao lado do nome
      li.appendChild(eq);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnLoad").onclick = handleAddContent;
  btnTogglePlay.onclick = togglePlayback;
  document.getElementById("btnNext").onclick = nextTrack;
  document.getElementById("btnPrev").onclick = prevTrack;
});
