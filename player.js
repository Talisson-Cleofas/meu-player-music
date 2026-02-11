// 1. Inicialização do Widget e Variáveis de Controle
const widgetIframe = document.getElementById("sc-widget");
const widget = SC.Widget(widgetIframe);

let playlist = [];
let currentTrackIndex = 0;

// 2. Configuração Inicial (READY)
widget.bind(SC.Widget.Events.READY, () => {
  console.log("SoundCloud pronto");
  document.getElementById("status").innerText =
    "Insira um link e clique em Carregar";
  widget.setVolume(100);
});

// 3. Evento de Próxima Automática (FINISH)
widget.bind(SC.Widget.Events.FINISH, () => {
  nextTrack();
});

// 4. Função para Adicionar Conteúdo (Suporta links curtos e longos)
async function handleAddContent() {
  const urlInput = document.getElementById("videoUrl");
  const url = urlInput.value.trim();

  if (url.includes("soundcloud.com")) {
    const statusDisplay = document.getElementById("status");
    statusDisplay.innerText = "Adicionando à fila...";

    // Adiciona à lista local
    const newTrack = { url: url, title: "Música Carregando..." };
    playlist.push(newTrack);
    updatePlaylistUI();

    // Se for a primeira música da fila, toca imediatamente
    if (playlist.length === 1) {
      playTrack(0);
    }
  } else {
    alert("Por favor, cole um link válido do SoundCloud.");
  }
  urlInput.value = "";
}

// 5. Função Principal de Reprodução
function playTrack(index) {
  if (index >= 0 && index < playlist.length) {
    currentTrackIndex = index;
    const statusDisplay = document.getElementById("status");

    statusDisplay.innerText = "Carregando áudio...";
    updatePlaylistUI(); // Atualiza a cor na lista visual

    // Carrega a nova URL no player do SoundCloud
    widget.load(playlist[index].url, {
      auto_play: true,
      show_artwork: true,
      callback: () => {
        widget.play();
        widget.setVolume(100);

        // Tenta buscar o título real da música para a interface
        let attempts = 0;
        const checkSound = setInterval(() => {
          widget.getCurrentSound((sound) => {
            if (sound && sound.title) {
              playlist[index].title = sound.title;
              statusDisplay.innerText = sound.title;
              updatePlaylistUI();
              updateMediaMetadata(sound);
              clearInterval(checkSound);
            }
          });
          attempts++;
          if (attempts > 10) clearInterval(checkSound);
        }, 1000);
      },
    });
  }
}

// 6. Funções de Navegação (CORRIGIDAS)
function nextTrack() {
  if (playlist.length > 0) {
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    playTrack(currentTrackIndex);
  }
}

function prevTrack() {
  if (playlist.length > 0) {
    currentTrackIndex =
      (currentTrackIndex - 1 + playlist.length) % playlist.length;
    playTrack(currentTrackIndex);
  }
}

// 7. Integração com a Tela de Bloqueio do iPhone (MediaSession)
function updateMediaMetadata(sound) {
  if ("mediaSession" in navigator && sound) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: sound.title,
      artist: sound.user.username,
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

    navigator.mediaSession.setActionHandler("play", () => widget.play());
    navigator.mediaSession.setActionHandler("pause", () => widget.pause());
    navigator.mediaSession.setActionHandler("previoustrack", () => prevTrack());
    navigator.mediaSession.setActionHandler("nexttrack", () => nextTrack());
  }
}

// 8. Atualização Visual da Playlist
function updatePlaylistUI() {
  const listElement = document.getElementById("playlistView");
  listElement.innerHTML = "";

  playlist.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `<span><strong>${index + 1}.</strong> ${item.title}</span>`;

    // Estilo dinâmico para a música que está tocando
    if (index === currentTrackIndex) {
      li.style.color = "#1DB954";
      li.style.fontWeight = "bold";
      li.style.background = "#2a2a2a";
    }

    li.onclick = () => playTrack(index);
    listElement.appendChild(li);
  });
}

// 9. Listeners de Evento para os Botões
document.getElementById("btnLoad").addEventListener("click", handleAddContent);

document.getElementById("btnPlay").addEventListener("click", () => {
  widget.play();
});

document.getElementById("btnPause").addEventListener("click", () => {
  widget.pause();
});

document.getElementById("btnNext").addEventListener("click", () => {
  nextTrack();
});

document.getElementById("btnPrev").addEventListener("click", () => {
  prevTrack();
});
