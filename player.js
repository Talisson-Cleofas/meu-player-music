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

// FUNÇÃO ALTERADA: Agora extrai músicas de álbuns dinamicamente
async function handleAddContent() {
  const urlInput = document.getElementById("videoUrl");
  const url = urlInput.value.trim();
  const statusDisplay = document.getElementById("status");

  if (url.includes("soundcloud.com")) {
    statusDisplay.innerText = "Analisando link...";

    // Carregamos o link temporariamente para extrair as faixas
    widget.load(url, {
      auto_play: false,
      callback: () => {
        widget.getSounds((sounds) => {
          if (sounds && sounds.length > 0) {
            // Se for álbum, sounds.length será > 1. Se for música única, será 1.
            sounds.forEach((track) => {
              playlist.push({
                url: track.uri, // Usamos a URI direta da música
                title: track.title,
              });
            });

            statusDisplay.innerText =
              sounds.length > 1 ? "Álbum adicionado!" : "Música adicionada!";
            updatePlaylistUI();

            // Se a playlist estava vazia, começa a tocar a primeira do álbum
            if (playlist.length === sounds.length) {
              playTrack(0);
            }
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

function nextTrack() {
  widget.play(); // Acorda o áudio para o iOS
  if (playlist.length > 1) {
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    playTrack(currentTrackIndex);
  }
}

function prevTrack() {
  widget.play();
  if (playlist.length > 1) {
    currentTrackIndex =
      (currentTrackIndex - 1 + playlist.length) % playlist.length;
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
      ? sound.artwork_url
          .replace("http:", "https:")
          .replace("-large", "-t500x500")
      : sound.user && sound.user.avatar_url
        ? sound.user.avatar_url
            .replace("http:", "https:")
            .replace("-large", "-t500x500")
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
    li.style.padding = "10px 0"; // Melhora o toque no mobile
    li.style.borderBottom = "1px solid #333";
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
