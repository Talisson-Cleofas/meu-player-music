const widgetIframe = document.getElementById("sc-widget");
const widget = SC.Widget(widgetIframe);

let playlist = [];
let currentTrackIndex = 0;

// 1. CONFIGURAÇÃO INICIAL
widget.bind(SC.Widget.Events.READY, () => {
  console.log("SoundCloud pronto");
  document.getElementById("status").innerText = "Pronto para tocar!";
  widget.setVolume(100);
});

// 2. O SEGREDO: Detectar quando uma música acaba e FORÇAR a próxima
widget.bind(SC.Widget.Events.FINISH, () => {
  console.log("Música terminou, acionando próxima...");
  nextTrack();
});

// 3. Atualizar o título quando a faixa muda (mesmo dentro de álbuns)
widget.bind(SC.Widget.Events.PLAY, () => {
  widget.getCurrentSound((sound) => {
    if (sound) {
      document.getElementById("status").innerText = sound.title;
      updateMediaMetadata(sound);
    }
  });
});

// 4. ADICIONAR CONTEÚDO
async function handleAddContent() {
  const urlInput = document.getElementById("videoUrl");
  const url = urlInput.value.trim();

  if (url.includes("soundcloud.com")) {
    playlist.push({ url: url, title: "Carregando informações..." });
    updatePlaylistUI();
    if (playlist.length === 1) playTrack(0);
  }
  urlInput.value = "";
}

// 5. FUNÇÃO DE PLAY (REFORMULADA)
function playTrack(index) {
  if (index >= 0 && index < playlist.length) {
    currentTrackIndex = index;

    // No load, forçamos o auto_play para o iOS não bloquear
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

// 6. NAVEGAÇÃO REFORÇADA
function nextTrack() {
  // Verificamos se estamos em um álbum ou playlist do SoundCloud
  widget.getSounds((sounds) => {
    widget.getCurrentSoundIndex((currentIndexInAlbum) => {
      // Se houver mais músicas no álbum atual, pula internamente
      if (sounds && currentIndexInAlbum < sounds.length - 1) {
        widget.next();
      } else {
        // Se o álbum acabou, pula para o PRÓXIMO LINK da sua lista
        if (playlist.length > 1) {
          currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
          playTrack(currentTrackIndex);
        } else {
          // Se só tem um link (um álbum), volta para a primeira música dele
          widget.skip(0);
        }
      }
    });
  });
}

function prevTrack() {
  widget.getCurrentSoundIndex((currentIndexInAlbum) => {
    if (currentIndexInAlbum > 0) {
      widget.prev();
    } else {
      if (playlist.length > 1) {
        currentTrackIndex =
          (currentTrackIndex - 1 + playlist.length) % playlist.length;
        playTrack(currentTrackIndex);
      }
    }
  });
}

// 7. INTERFACE E MEDIA SESSION
function updateMediaMetadata(sound) {
  if ("mediaSession" in navigator && sound) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: sound.title,
      artist: sound.user.username,
      artwork: [
        { src: sound.artwork_url || "", sizes: "512x512", type: "image/jpg" },
      ],
    });
  }
}

function updatePlaylistUI() {
  const listElement = document.getElementById("playlistView");
  if (!listElement) return;
  listElement.innerHTML = "";
  playlist.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `<span><strong>${index + 1}.</strong> ${item.title}</span>`;
    li.style.color = index === currentTrackIndex ? "#1DB954" : "white";
    li.style.cursor = "pointer";
    li.onclick = () => playTrack(index);
    listElement.appendChild(li);
  });
}

// 8. VINCULAR BOTÕES
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnLoad").onclick = handleAddContent;
  document.getElementById("btnPlay").onclick = () => widget.play();
  document.getElementById("btnPause").onclick = () => widget.pause();
  document.getElementById("btnNext").onclick = nextTrack;
  document.getElementById("btnPrev").onclick = prevTrack;
});
