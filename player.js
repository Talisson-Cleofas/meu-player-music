const widgetIframe = document.getElementById("sc-widget");
const widget = SC.Widget(widgetIframe);

let playlist = [];
let currentTrackIndex = 0;

widget.bind(SC.Widget.Events.READY, () => {
  document.getElementById("status").innerText = "Pronto!";
  widget.setVolume(100);
});

// Toda vez que a música der PLAY, forçamos os metadados várias vezes
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
      callback: () => {
        widget.play();
        updatePlaylistUI();
      },
    });
  }
}

function nextTrack() {
  widget.getSounds((sounds) => {
    widget.getCurrentSoundIndex((idx) => {
      if (sounds && idx < sounds.length - 1) {
        widget.next();
      } else if (playlist.length > 1) {
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
        playTrack(currentTrackIndex);
      }
    });
  });
}

function prevTrack() {
  widget.getCurrentSoundIndex((idx) => {
    if (idx > 0) {
      widget.prev();
    } else if (playlist.length > 1) {
      currentTrackIndex =
        (currentTrackIndex - 1 + playlist.length) % playlist.length;
      playTrack(currentTrackIndex);
    }
  });
}

// FUNÇÃO REFORÇADA: Tenta atualizar 3 vezes para garantir que o iOS aceite
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
    if (count >= 3) clearInterval(interval);
  }, 1000);
}

function applyMediaSession(sound) {
  if ("mediaSession" in navigator) {
    // Forçamos a imagem para HTTPS e um tamanho que o iOS aceite
    const artwork = sound.artwork_url
      ? sound.artwork_url
          .replace("http:", "https:")
          .replace("-large", "-t500x500")
      : "https://a-v2.sndcdn.com/assets/images/default_track_artwork-6db91781.png";

    navigator.mediaSession.metadata = new MediaMetadata({
      title: sound.title || "SoundCloud",
      artist: sound.user.username || "Artista",
      album: "My Music Player",
      artwork: [{ src: artwork, sizes: "500x500", type: "image/jpg" }],
    });

    // RE-REGISTRAR OS HANDLERS (Obrigatório para remover os botões de 10s)
    const actions = [
      ["play", () => widget.play()],
      ["pause", () => widget.pause()],
      ["previoustrack", () => prevTrack()],
      ["nexttrack", () => nextTrack()],
      // O segredo para remover os botões de 10s é declarar seek como null explicitamente
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
    li.className = index === currentTrackIndex ? "active-track" : "";
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
