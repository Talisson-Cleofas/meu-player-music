const widgetIframe = document.getElementById("sc-widget");
const widget = SC.Widget(widgetIframe);

let playlist = [];
let currentTrackIndex = 0;

widget.bind(SC.Widget.Events.READY, () => {
  document.getElementById("status").innerText = "Pronto!";
  widget.setVolume(100);
});

widget.bind(SC.Widget.Events.PLAY, () => {
  updateMetadataRepeatedly();
});

widget.bind(SC.Widget.Events.FINISH, () => nextTrack());

async function handleAddContent() {
  const urlInput = document.getElementById("videoUrl");
  const url = urlInput.value.trim();
  const statusDisplay = document.getElementById("status");

  if (url.includes("soundcloud.com")) {
    statusDisplay.innerText = "Analisando link...";
    widget.load(url, {
      auto_play: false,
      callback: () => {
        widget.getSounds((sounds) => {
          if (sounds && sounds.length > 0) {
            sounds.forEach((track) => {
              playlist.push({
                url: track.uri,
                title: track.title,
                user: track.user.username
              });
            });
            statusDisplay.innerText = "Adicionado!";
            updatePlaylistUI();
            if (playlist.length === sounds.length) playTrack(0);
          }
        });
      },
    });
  }
  urlInput.value = "";
}

function playTrack(index) {
  if (index >= 0 && index < playlist.length) {
    currentTrackIndex = index;
    // O segredo para o iOS: carregar com auto_play true e chamar play no callback
    widget.load(playlist[index].url, {
      auto_play: true,
      show_artwork: true,
      callback: () => {
        widget.play();
        updatePlaylistUI();
      },
    });
  }
}

// Funções de navegação otimizadas para MediaSession
function nextTrack() {
  if (playlist.length > 0) {
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    playTrack(currentTrackIndex);
  }
}

function prevTrack() {
  if (playlist.length > 0) {
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    playTrack(currentTrackIndex);
  }
}

function updateMetadataRepeatedly() {
  let count = 0;
  const interval = setInterval(() => {
    widget.getCurrentSound((sound) => {
      if (sound) {
        applyMediaSession(sound);
        document.getElementById("status").innerText = sound.title;
      }
    });
    count++;
    if (count >= 5) clearInterval(interval);
  }, 800);
}

function applyMediaSession(sound) {
  if ("mediaSession" in navigator) {
    let artwork = sound.artwork_url
      ? sound.artwork_url.replace("http:", "https:").replace("-large", "-t500x500")
      : (sound.user && sound.user.avatar_url 
         ? sound.user.avatar_url.replace("http:", "https:").replace("-large", "-t500x500") 
         : "https://a-v2.sndcdn.com/assets/images/default_track_artwork-6db91781.png");

    navigator.mediaSession.metadata = new MediaMetadata({
      title: sound.title || "SoundCloud",
      artist: sound.user.username || "Artista",
      album: "My Music Player",
      artwork: [{ src: artwork, sizes: "500x500", type: "image/jpg" }],
    });

    // Handlers mapeados diretamente para as funções globais
    navigator.mediaSession.setActionHandler("play", () => widget.play());
    navigator.mediaSession.setActionHandler("pause", () => widget.pause());
    navigator.mediaSession.setActionHandler("nexttrack", nextTrack);
    navigator.mediaSession.setActionHandler("previoustrack", prevTrack);
  }
}

function updatePlaylistUI() {
  const listElement = document.getElementById("playlistView");
  if (!listElement) return;
  listElement.innerHTML = "";
  
  playlist.forEach((item, index) => {
    const li = document.createElement("li");
    
    // Aplica a classe ativa para o novo CSS
    if (index === currentTrackIndex) {
      li.classList.add("active-track");
    }

    li.innerHTML = `
      <span class="track-num">${(index + 1).toString().padStart(2, '0')}</span>
      <div class="track-info">
        <span class="track-name">${item.title}</span>
      </div>
    `;
    
    li.onclick = () => playTrack(index);
    listElement.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnLoad").onclick = handleAddContent;
  document.getElementById("btnPlay").onclick = () => widget.play();
  document.getElementById("btnPause").onclick = () => widget.pause();
  document.getElementById("btnNext").onclick = nextTrack;
  document.getElementById("btnPrev").onclick = prevTrack;
});
