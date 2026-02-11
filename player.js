const widgetIframe = document.getElementById("sc-widget");
const widget = SC.Widget(widgetIframe);

// Áudio silencioso para manter o iOS acordado
const pulseAudio = new Audio('https://raw.githubusercontent.com/anars/blank-audio/master/250-milliseconds-of-silence.mp3');
pulseAudio.loop = true;

let playlist = [];

// 1. Sincroniza quando a música começa a tocar
widget.bind(SC.Widget.Events.PLAY, () => {
  pulseAudio.play().catch(() => {}); // "Acorda" o sistema de áudio do celular
  
  widget.getCurrentSound((sound) => {
    if (sound) {
      document.getElementById("status").innerText = sound.title;
      applyMediaSession(sound);
      updateActiveTrackVisual(sound.title);
    }
  });
});

// 2. Quando a música termina
widget.bind(SC.Widget.Events.FINISH, () => {
  widget.next();
});

// 3. Adiciona conteúdo (Carrega álbum ou música)
function handleAddContent() {
  const urlInput = document.getElementById("videoUrl");
  const url = urlInput.value.trim();

  if (url.includes("soundcloud.com")) {
    document.getElementById("status").innerText = "Carregando...";
    
    // Carregamos no widget. O Widget resolve o link sozinho (sem erro de API)
    widget.load(url, {
      auto_play: true,
      show_artwork: true,
      callback: () => {
        // Após carregar, pegamos a lista de músicas para mostrar na tela
        widget.getSounds((sounds) => {
          if (sounds) {
            playlist = sounds.map(s => ({ title: s.title }));
            updatePlaylistUI();
            widget.play();
          }
        });
      }
    });
  }
  urlInput.value = "";
}

// 4. Media Session (Controles da Tela de Bloqueio)
function applyMediaSession(sound) {
  if ("mediaSession" in navigator) {
    const artwork = sound.artwork_url 
      ? sound.artwork_url.replace("http:", "https:").replace("-large", "-t500x500")
      : "https://a-v2.sndcdn.com/assets/images/default_track_artwork-6db91781.png";

    navigator.mediaSession.metadata = new MediaMetadata({
      title: sound.title,
      artist: sound.user.username,
      album: "SoundCloud",
      artwork: [{ src: artwork, sizes: "500x500", type: "image/jpg" }]
    });

    navigator.mediaSession.setActionHandler("play", () => widget.play());
    navigator.mediaSession.setActionHandler("pause", () => widget.pause());
    
    // IMPORTANTE: Comandos diretos para o Widget
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      widget.next();
      setTimeout(() => widget.play(), 200);
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      widget.prev();
      setTimeout(() => widget.play(), 200);
    });

    // Remove botões de 10s
    navigator.mediaSession.setActionHandler('seekbackward', null);
    navigator.mediaSession.setActionHandler('seekforward', null);
  }
}

// 5. Interface Visual
function updatePlaylistUI() {
  const listElement = document.getElementById("playlistView");
  listElement.innerHTML = "";
  playlist.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="track-num">${(index + 1).toString().padStart(2, '0')}</span>
      <span class="track-name">${item.title}</span>
    `;
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

// 6. Configuração dos botões físicos
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnLoad").onclick = handleAddContent;
  document.getElementById("btnPlay").onclick = () => { widget.play(); pulseAudio.play(); };
  document.getElementById("btnPause").onclick = () => { widget.pause(); pulseAudio.pause(); };
  document.getElementById("btnNext").onclick = () => widget.next();
  document.getElementById("btnPrev").onclick = () => widget.prev();
});
