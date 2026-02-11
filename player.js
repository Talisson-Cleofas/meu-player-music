// 1. Referências ao Widget e Variáveis de Controle
const widgetIframe = document.getElementById("sc-widget");
const widget = SC.Widget(widgetIframe);

let playlist = [];
let currentTrackIndex = 0;

// 2. Inicialização do Player
widget.bind(SC.Widget.Events.READY, () => {
  console.log("SoundCloud Pronto");
  document.getElementById("status").innerText = "Pronto para tocar!";
  widget.setVolume(100);
});

// 3. Evento para detectar quando a música termina
widget.bind(SC.Widget.Events.FINISH, () => {
  nextTrack();
});

// 4. Atualizar metadados e botões toda vez que o Play inicia
widget.bind(SC.Widget.Events.PLAY, () => {
  widget.getCurrentSound((sound) => {
    if (sound) {
      document.getElementById("status").innerText = sound.title;
      updateMediaMetadata(sound);
      updatePlaylistUI();
    }
  });
});

// 5. Função para Adicionar Música (Suporta links encurtados e álbuns)
async function handleAddContent() {
  const urlInput = document.getElementById("videoUrl");
  const url = urlInput.value.trim();

  if (url.includes("soundcloud.com")) {
    playlist.push({ url: url, title: "Carregando informações..." });
    updatePlaylistUI();

    if (playlist.length === 1) {
      playTrack(0);
    }
  } else {
    alert("Cole um link válido do SoundCloud.");
  }
  urlInput.value = "";
}

// 6. Função para Carregar e Tocar
function playTrack(index) {
  if (index >= 0 && index < playlist.length) {
    currentTrackIndex = index;

    widget.load(playlist[index].url, {
      auto_play: true,
      show_artwork: true,
      callback: () => {
        widget.play();
        widget.setVolume(100);
      },
    });
  }
}

// 7. Navegação entre Faixas (Álbuns e Playlist Manual)
function nextTrack() {
  widget.getSounds((sounds) => {
    widget.getCurrentSoundIndex((currentIndexInAlbum) => {
      // Se houver próxima música dentro do álbum atual
      if (sounds && currentIndexInAlbum < sounds.length - 1) {
        widget.next();
      } else {
        // Se o álbum acabou, pula para o próximo link da fila
        if (playlist.length > 1) {
          currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
          playTrack(currentTrackIndex);
        }
      }
    });
  });
}

function prevTrack() {
  widget.getCurrentSoundIndex((currentIndexInAlbum) => {
    if (currentIndexInAlbum > 0) {
      widget.prev();
    } else if (playlist.length > 1) {
      currentTrackIndex =
        (currentTrackIndex - 1 + playlist.length) % playlist.length;
      playTrack(currentTrackIndex);
    }
  });
}

// 8. CORREÇÃO DA TELA DE BLOQUEIO (Media Session API)
function updateMediaMetadata(sound) {
  if ("mediaSession" in navigator && sound) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: sound.title,
      artist: sound.user.username,
      album: "My SoundCloud Player",
      artwork: [
        {
          src: sound.artwork_url
            ? sound.artwork_url.replace("-large", "-t500x500")
            : "",
          sizes: "512x512",
          type: "image/jpg",
        },
      ],
    });

    // Registrar os Handlers força o iOS a mostrar as setas ⏭/⏮
    navigator.mediaSession.setActionHandler("play", () => widget.play());
    navigator.mediaSession.setActionHandler("pause", () => widget.pause());
    navigator.mediaSession.setActionHandler("previoustrack", () => prevTrack());
    navigator.mediaSession.setActionHandler("nexttrack", () => nextTrack());

    // Desativa os botões de 10 segundos (Seek) para priorizar as setas
    navigator.mediaSession.setActionHandler("seekbackward", null);
    navigator.mediaSession.setActionHandler("seekforward", null);
  }
}

// 9. Atualizar Interface Visual
function updatePlaylistUI() {
  const listElement = document.getElementById("playlistView");
  if (!listElement) return;

  listElement.innerHTML = "";
  playlist.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `<span><strong>${index + 1}.</strong> ${item.title}</span>`;
    li.style.color = index === currentTrackIndex ? "#1DB954" : "white";
    li.style.cursor = "pointer";
    li.style.padding = "8px";
    li.onclick = () => playTrack(index);
    listElement.appendChild(li);
  });
}

// 10. Vincular Eventos aos Botões do HTML
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnLoad").onclick = handleAddContent;
  document.getElementById("btnPlay").onclick = () => widget.play();
  document.getElementById("btnPause").onclick = () => widget.pause();
  document.getElementById("btnNext").onclick = nextTrack;
  document.getElementById("btnPrev").onclick = prevTrack;
});
