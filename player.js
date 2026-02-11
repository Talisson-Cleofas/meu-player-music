const widgetIframe = document.getElementById("sc-widget");
const widget = SC.Widget(widgetIframe);

// Áudio silencioso para manter o canal aberto no mobile
const pulseAudio = new Audio('https://raw.githubusercontent.com/anars/blank-audio/master/250-milliseconds-of-silence.mp3');
pulseAudio.loop = true;

let playlist = [];

// 1. Monitora o estado de PLAY
widget.bind(SC.Widget.Events.PLAY, () => {
  pulseAudio.play().catch(() => {}); 
  
  widget.getCurrentSound((sound) => {
    if (sound) {
      document.getElementById("status").innerText = sound.title;
      applyMediaSession(sound);
      updateActiveTrackVisual(sound.title);
    }
  });
});

// 2. Quando terminar, vai para a próxima
widget.bind(SC.Widget.Events.FINISH, () => {
  widget.next();
});

// 3. FUNÇÃO DE CARREGAR AJUSTADA (Resolve o "Aguardando música")
function handleAddContent() {
  const urlInput = document.getElementById("videoUrl");
  const url = urlInput.value.trim();
  const statusElement = document.getElementById("status");

  if (url.includes("soundcloud.com")) {
    statusElement.innerText = "Carregando faixas...";
    
    widget.load(url, {
      auto_play: true,
      show_artwork: true,
      callback: () => {
        // Tentativa de pegar as músicas após o carregamento
        setTimeout(() => {
          widget.getSounds((sounds) => {
            if (sounds && sounds.length > 0) {
              playlist = sounds.map(s => ({ title: s.title }));
              updatePlaylistUI();
              statusElement.innerText = "Playlist pronta!";
              widget.play();
            } else {
              statusElement.innerText = "Erro ao ler álbum.";
            }
          });
        }, 1000); // Espera 1 segundo para o widget processar o link
      }
    });
  }
  urlInput.value = "";
}

// 4. Media Session (Tela de Bloqueio)
function applyMediaSession(sound) {
  if ("mediaSession" in navigator) {
    const artwork = sound.artwork_url 
      ? sound.artwork_url.replace("http:", "https:").replace("-large", "-t500x500")
      : "https://a-v2.sndcdn.com/assets/images/default_track_artwork-6db91781.png";

    navigator.mediaSession.metadata = new MediaMetadata({
      title: sound.title,
      artist: sound.user.username,
      album: "SoundCloud Player",
      artwork: [{ src: artwork, sizes: "500x500", type: "image/jpg" }]
    });

    navigator.mediaSession.setActionHandler("play", () => widget.play());
    navigator.mediaSession.setActionHandler("pause", () => widget.pause());
    navigator.mediaSession.setActionHandler("nexttrack", () => widget.next());
    navigator.mediaSession.setActionHandler("previoustrack", () => widget.prev());
  }
}

// 5. Interface da Fila
function updatePlaylistUI() {
  const listElement = document.getElementById("playlistView");
  if (!listElement) return;
  
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
    const nameSpan = li.querySelector(".track-name");
    if (nameSpan && nameSpan.innerText === currentTitle) {
      li.classList.add("active-track");
    }
  });
}

// 6. Botões
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnLoad").onclick = handleAddContent;
  document.getElementById("btnPlay").onclick = () => { widget.play(); pulseAudio.play(); };
  document.getElementById("btnPause").onclick = () => { widget.pause(); pulseAudio.pause(); };
  document.getElementById("btnNext").onclick = () => widget.next();
  document.getElementById("btnPrev").onclick = () => widget.prev();
});
