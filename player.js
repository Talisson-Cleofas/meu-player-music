const widgetIframe = document.getElementById("sc-widget");
const widget = SC.Widget(widgetIframe);

let playlist = [];

// 1. Monitora quando a música muda
widget.bind(SC.Widget.Events.PLAY, () => {
  widget.getCurrentSound((sound) => {
    if (sound) {
      document.getElementById("status").innerText = sound.title;
      applyMediaSession(sound);
      updateActiveTrackVisual(sound.title);
    }
  });
});

// 2. Quando o álbum acabar
widget.bind(SC.Widget.Events.FINISH, () => {
  nextTrack();
});

// 3. Adiciona conteúdo
async function handleAddContent() {
  const urlInput = document.getElementById("videoUrl");
  const url = urlInput.value.trim();

  if (url.includes("soundcloud.com")) {
    document.getElementById("status").innerText = "Sintonizando...";
    
    widget.load(url, {
      auto_play: true,
      callback: () => {
        widget.getSounds((sounds) => {
          if (sounds) {
            playlist = sounds.map(s => ({ title: s.title }));
            updatePlaylistUI();
            // Pequeno delay para garantir o play inicial
            setTimeout(() => widget.play(), 500);
          }
        });
      }
    });
  }
  urlInput.value = "";
}

// 4. Navegação FORÇADA (O segredo para a tela de bloqueio)
function nextTrack() {
  // Tentativa 1: Comando via API
  widget.next();
  // Tentativa 2: Comando via PostMessage (Fura o bloqueio do Iframe)
  widgetIframe.contentWindow.postMessage(JSON.stringify({ method: 'next' }), '*');
  
  // Força o áudio a continuar
  setTimeout(() => widget.play(), 200);
}

function prevTrack() {
  widget.prev();
  widgetIframe.contentWindow.postMessage(JSON.stringify({ method: 'prev' }), '*');
  setTimeout(() => widget.play(), 200);
}

// 5. Media Session Ultra-Resiliente
function applyMediaSession(sound) {
  if ("mediaSession" in navigator) {
    const artwork = sound.artwork_url 
      ? sound.artwork_url.replace("http:", "https:").replace("-large", "-t500x500")
      : "https://a-v2.sndcdn.com/assets/images/default_track_artwork-6db91781.png";

    navigator.mediaSession.metadata = new MediaMetadata({
      title: sound.title,
      artist: sound.user.username,
      album: "Tocando do SoundCloud",
      artwork: [{ src: artwork, sizes: "500x500", type: "image/jpg" }]
    });

    // Handlers
    navigator.mediaSession.setActionHandler("play", () => widget.play());
    navigator.mediaSession.setActionHandler("pause", () => widget.pause());
    
    // Vinculamos os botões de pular às nossas funções forçadas
    navigator.mediaSession.setActionHandler("nexttrack", nextTrack);
    navigator.mediaSession.setActionHandler("previoustrack", prevTrack);

    // Desativa os 10s para garantir as setas
    try {
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
    } catch (e) {}
  }
}

// 6. Interface Visual
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
    const trackName = li.querySelector(".track-name").innerText;
    if (trackName === currentTitle) {
      li.classList.add("active-track");
    }
  });
}

// 7. Eventos dos botões da página
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnLoad").onclick = handleAddContent;
  document.getElementById("btnPlay").onclick = () => widget.play();
  document.getElementById("btnPause").onclick = () => widget.pause();
  document.getElementById("btnNext").onclick = nextTrack;
  document.getElementById("btnPrev").onclick = prevTrack;
});
