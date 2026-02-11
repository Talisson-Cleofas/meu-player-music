const widgetIframe = document.getElementById("sc-widget");
const widget = SC.Widget(widgetIframe);

let playlist = [];

// 1. Monitora quando a música muda (Internamente no SoundCloud)
widget.bind(SC.Widget.Events.PLAY, () => {
  widget.getCurrentSound((sound) => {
    if (sound) {
      document.getElementById("status").innerText = sound.title;
      // Sincroniza a capa e os botões da tela de bloqueio
      applyMediaSession(sound);
      // Sincroniza a fila visual
      updateActiveTrackVisual(sound.title);
    }
  });
});

// 2. Quando o álbum acabar ou uma música terminar
widget.bind(SC.Widget.Events.FINISH, () => {
  widget.next(); // O comando .next() não exige novo Play no iPhone
});

// 3. Adiciona conteúdo (Carrega o álbum INTEIRO de uma vez)
async function handleAddContent() {
  const urlInput = document.getElementById("videoUrl");
  const url = urlInput.value.trim();

  if (url.includes("soundcloud.com")) {
    document.getElementById("status").innerText = "Sintonizando...";
    
    // CARREGAMENTO ÚNICO: Isso é o que impede de pausar
    widget.load(url, {
      auto_play: true,
      callback: () => {
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

// 4. Navegação (Comandos nativos que não bloqueiam no iOS)
function nextTrack() {
  widget.next();
}

function prevTrack() {
  widget.prev();
}

// 5. Atualiza a Media Session (Tela de Bloqueio)
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

    // Vincula os botões físicos aos comandos nativos
    navigator.mediaSession.setActionHandler("play", () => widget.play());
    navigator.mediaSession.setActionHandler("pause", () => widget.pause());
    navigator.mediaSession.setActionHandler("nexttrack", () => widget.next());
    navigator.mediaSession.setActionHandler("previoustrack", () => widget.prev());
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
    // Skip também é permitido no iOS sem pausar
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

// 7. Eventos dos botões da página
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnLoad").onclick = handleAddContent;
  document.getElementById("btnPlay").onclick = () => widget.play();
  document.getElementById("btnPause").onclick = () => widget.pause();
  document.getElementById("btnNext").onclick = nextTrack;
  document.getElementById("btnPrev").onclick = prevTrack;
});
