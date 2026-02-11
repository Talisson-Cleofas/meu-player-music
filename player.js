const widgetIframe = document.getElementById("sc-widget");
const widget = SC.Widget(widgetIframe);

let playlist = [];
let currentTrackIndex = 0;

widget.bind(SC.Widget.Events.READY, () => {
  document.getElementById("status").innerText = "Pronto!";
  widget.setVolume(100);
});

// Sincroniza metadados sempre que a música começar a tocar de fato
widget.bind(SC.Widget.Events.PLAY, () => {
  updateMetadataRepeatedly();
});

widget.bind(SC.Widget.Events.FINISH, () => nextTrack());

async function handleAddContent() {
  const urlInput = document.getElementById("videoUrl");
  const url = urlInput.value.trim();
  if (url.includes("soundcloud.com")) {
    playlist.push({ url: url, title: "Carregando..." });
    updatePlaylistUI();
    if (playlist.length === 1) playTrack(0);
  }
  urlInput.value = "";
}

function playTrack(index) {
  if (index >= 0 && index < playlist.length) {
    currentTrackIndex = index;
    widget.load(playlist[index].url, {
      auto_play: true,
      show_artwork: true, // Garante que a capa seja carregada internamente
      callback: () => {
        widget.play();
        updatePlaylistUI();
      },
    });
  }
}

// NAVEGAÇÃO REFORÇADA PARA TELA DE BLOQUEIO
function nextTrack() {
  widget.next(); // Comando imediato para álbuns

  // Verificação para mudar de link na playlist manual
  setTimeout(() => {
    widget.getCurrentSoundIndex((idx) => {
      widget.getSounds((sounds) => {
        if (sounds && idx === sounds.length - 1) {
          if (playlist.length > 1) {
            currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
            playTrack(currentTrackIndex);
          }
        }
      });
    });
    widget.play(); // Reativa o áudio (crucial para o iOS)
  }, 500);
}

function prevTrack() {
  widget.prev();

  setTimeout(() => {
    widget.getCurrentSoundIndex((idx) => {
      if (idx === 0 && playlist.length > 1) {
        currentTrackIndex =
          (currentTrackIndex - 1 + playlist.length) % playlist.length;
        playTrack(currentTrackIndex);
      }
    });
    widget.play(); // Reativa o áudio
  }, 500);
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
    if (count >= 5) clearInterval(interval); // Aumentei para 5 tentativas
  }, 800);
}

function applyMediaSession(sound) {
  if ("mediaSession" in navigator) {
    // Melhoria na captura da capa: tenta a original de alta qualidade
    let artwork = sound.artwork_url
      ? sound.artwork_url
          .replace("http:", "https:")
          .replace("-large", "-t500x500")
      : sound.user && sound.user.avatar_url
        ? sound.user.avatar_url.replace("-large", "-t500x500")
        : "https://a-v2.sndcdn.com/assets/images/default_track_artwork-6db91781.png";

    navigator.mediaSession.metadata = new MediaMetadata({
      title: sound.title || "SoundCloud",
      artist: sound.user.username || "Artista",
      album: "My Music Player",
      artwork: [{ src: artwork, sizes: "500x500", type: "image/jpg" }],
    });

    const actions = [
      ["play", () => widget.play()],
      ["pause", () => widget.pause()],
      ["previoustrack", () => prevTrack()],
      ["nexttrack", () => nextTrack()],
      ["seekbackward", null],
      ["seekforward", null],
    ];

    actions.forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (e) {}
    });
  }
}

function updatePlaylistUI() {
  const listElement = document.getElementById("playlistView");
  if (!listElement) return;
  listElement.innerHTML = "";
  playlist.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${index + 1}.</strong> ${item.title}`;
    li.style.color = index === currentTrackIndex ? "#1DB954" : "white";
    li.style.fontWeight = index === currentTrackIndex ? "bold" : "normal";
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
