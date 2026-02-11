const widgetIframe = document.getElementById("sc-widget");
const widget = SC.Widget(widgetIframe);

let playlist = []; // Fila visual
let currentTrackIndex = 0;

widget.bind(SC.Widget.Events.READY, () => {
  document.getElementById("status").innerText = "Pronto!";
});

// Detecta troca de música INTERNA do SoundCloud (essencial para álbuns)
widget.bind(SC.Widget.Events.PLAY, () => {
  widget.getCurrentSound((sound) => {
    if (sound) {
      document.getElementById("status").innerText = sound.title;
      updateActiveTrackVisual(sound.title); // Sincroniza a lista visual
      applyMediaSession(sound);
    }
  });
});

widget.bind(SC.Widget.Events.FINISH, () => nextTrack());

async function handleAddContent() {
  const urlInput = document.getElementById("videoUrl");
  const url = urlInput.value.trim();
  
  if (url.includes("soundcloud.com")) {
    document.getElementById("status").innerText = "Carregando...";
    
    // Carregamos o link completo (seja música ou álbum)
    widget.load(url, {
      auto_play: true,
      callback: () => {
        widget.getSounds((sounds) => {
          // Limpamos a playlist antiga e adicionamos as novas faixas à lista visual
          playlist = sounds.map(s => ({ title: s.title }));
          updatePlaylistUI();
          widget.play();
        });
      }
    });
  }
  urlInput.value = "";
}

// Funções de navegação usando comandos internos (não interrompem o áudio no iOS)
function nextTrack() {
  widget.next(); 
}

function prevTrack() {
  widget.prev();
}

function updateActiveTrackVisual(currentTitle) {
  const items = document.querySelectorAll("#playlistView li");
  items.forEach((li, index) => {
    // Se o título na lista for igual ao que está tocando, destaca
    if (li.innerText.includes(currentTitle)) {
      items.forEach(el => el.classList.remove("active-track"));
      li.classList.add("active-track");
      currentTrackIndex = index;
    }
  });
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

    // Handlers que o iOS aceita sem travar
    navigator.mediaSession.setActionHandler("play", () => widget.play());
    navigator.mediaSession.setActionHandler("pause", () => widget.pause());
    navigator.mediaSession.setActionHandler("nexttrack", () => widget.next());
    navigator.mediaSession.setActionHandler("previoustrack", () => widget.prev());
  }
}

function updatePlaylistUI() {
  const listElement = document.getElementById("playlistView");
  listElement.innerHTML = "";
  playlist.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="track-num">${(index + 1).toString().padStart(2, '0')}</span>
                    <span class="track-name">${item.title}</span>`;
    
    // Se clicar na lista, o widget pula para aquela posição
    li.onclick = () => widget.skip(index);
    listElement.appendChild(li);
  });
}

// Eventos dos botões físicos no site
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnLoad").onclick = handleAddContent;
  document.getElementById("btnPlay").onclick = () => widget.play();
  document.getElementById("btnPause").onclick = () => widget.pause();
  document.getElementById("btnNext").onclick = () => widget.next();
  document.getElementById("btnPrev").onclick = () => widget.prev();
});
