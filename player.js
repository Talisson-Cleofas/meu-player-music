let player;
let playlist = [];
let currentTrackIndex = 0;
let wakeLock = null;

// 1. Inicialização da API do YouTube
const tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(tag);

function onYouTubeIframeAPIReady() {
  player = new YT.Player("youtube-player", {
    height: "1", // Mínimo de 1px para evitar que o mobile bloqueie o áudio
    width: "1",
    events: {
      onStateChange: onPlayerStateChange,
      onReady: () => console.log("Player pronto"),
    },
  });
}

// 2. Wake Lock: Impede o PC/Celular de entrar em Standby
async function requestWakeLock() {
  try {
    if ("wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");
    }
  } catch (err) {
    console.log("Wake Lock não suportado ou negado.");
  }
}

// 3. Media Session: Habilita controles na tela de bloqueio e fones
function updateMediaMetadata() {
  if ("mediaSession" in navigator) {
    const videoData = player.getVideoData();
    navigator.mediaSession.metadata = new MediaMetadata({
      title: videoData.title,
      artist: videoData.author || "Web Music Player",
      artwork: [
        {
          src: `https://img.youtube.com/vi/${videoData.video_id}/maxresdefault.jpg`,
          sizes: "512x512",
          type: "image/jpg",
        },
      ],
    });

    // Conecta botões físicos/tela de bloqueio às funções do código
    navigator.mediaSession.setActionHandler("play", () => player.playVideo());
    navigator.mediaSession.setActionHandler("pause", () => player.pauseVideo());
    navigator.mediaSession.setActionHandler("previoustrack", () => prevTrack());
    navigator.mediaSession.setActionHandler("nexttrack", () => nextTrack());
  }
}

// 4. Lógica de Conteúdo
async function handleAddContent() {
  const url = document.getElementById("videoUrl").value;
  const videoId = extractVideoID(url);
  const playlistId = extractPlaylistID(url);

  if (playlistId) {
    player.loadPlaylist({ listType: "playlist", list: playlistId, index: 0 });
    document.getElementById("status").innerText =
      "Carregando Álbum/Playlist...";
    addToPlaylistArray(videoId || "", "🎬 Álbum/Playlist Ativa");
  } else if (videoId) {
    const title = await getVideoTitle(videoId);
    addToPlaylistArray(videoId, title);
  } else {
    alert("Link inválido!");
  }
  document.getElementById("videoUrl").value = "";
}

async function getVideoTitle(videoId) {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
    );
    const data = await response.json();
    return data.title;
  } catch (e) {
    return "Vídeo Desconhecido";
  }
}

function addToPlaylistArray(id, title) {
  playlist.push({ id, title });
  updatePlaylistUI();
  if (playlist.length === 1 && !title.includes("Álbum")) playTrack(0);
}

// 5. Controles
function playTrack(index) {
  if (index >= 0 && index < playlist.length) {
    currentTrackIndex = index;
    player.loadVideoById(playlist[currentTrackIndex].id);
    updatePlaylistUI();
  }
}

function nextTrack() {
  const ytPlaylist = player.getPlaylist();
  const currentIndex = player.getPlaylistIndex();
  if (ytPlaylist && currentIndex < ytPlaylist.length - 1) {
    player.nextVideo();
  } else if (currentTrackIndex + 1 < playlist.length) {
    playTrack(currentTrackIndex + 1);
  } else {
    document.getElementById("status").innerText = "Fim da fila";
  }
}

function prevTrack() {
  const currentIndex = player.getPlaylistIndex();
  if (currentIndex !== undefined && currentIndex > 0) {
    player.previousVideo();
  } else if (currentTrackIndex - 1 >= 0) {
    playTrack(currentTrackIndex - 1);
  }
}

function onPlayerStateChange(event) {
  const status = document.getElementById("status");
  const videoData = player.getVideoData();

  if (event.data === YT.PlayerState.ENDED) nextTrack();

  if (event.data === YT.PlayerState.PLAYING) {
    status.innerText = videoData.title;
    requestWakeLock(); // Impede standby
    updateMediaMetadata(); // Ativa controles de bloqueio
  }
  if (event.data === YT.PlayerState.PAUSED) {
    status.innerText = "Pausado: " + videoData.title;
    if (wakeLock) {
      wakeLock.release();
      wakeLock = null;
    }
  }
}

// 6. Interface e Remoção
function removeFromPlaylist(index) {
  if (index === currentTrackIndex) {
    playlist.splice(index, 1);
    if (playlist.length > 0) {
      const nextIdx = index < playlist.length ? index : playlist.length - 1;
      playTrack(nextIdx);
    } else {
      player.stopVideo();
      document.getElementById("status").innerText = "Fila vazia";
      currentTrackIndex = 0;
    }
  } else {
    playlist.splice(index, 1);
    if (index < currentTrackIndex) currentTrackIndex--;
  }
  updatePlaylistUI();
}

function updatePlaylistUI() {
  const listElement = document.getElementById("playlistView");
  listElement.innerHTML = "";
  playlist.forEach((item, index) => {
    const li = document.createElement("li");
    const textSpan = document.createElement("span");
    textSpan.innerHTML = `<strong>${index + 1}.</strong> ${item.title}`;
    textSpan.style.flex = "1";
    textSpan.onclick = () => playTrack(index);
    const delBtn = document.createElement("button");
    delBtn.innerHTML = "&times;";
    delBtn.className = "btn-remove";
    delBtn.onclick = (e) => {
      e.stopPropagation();
      removeFromPlaylist(index);
    };
    if (index === currentTrackIndex) {
      li.style.color = "#1DB954";
      li.style.background = "#2a2a2a";
    }
    li.appendChild(textSpan);
    li.appendChild(delBtn);
    listElement.appendChild(li);
  });
}

// Utilitários
function extractVideoID(url) {
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}
function extractPlaylistID(url) {
  const regExp = /[&?]list=([^#&?]+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

// Listeners
document.getElementById("btnLoad").addEventListener("click", handleAddContent);
document
  .getElementById("btnPlay")
  .addEventListener("click", () => player.playVideo());
document
  .getElementById("btnPause")
  .addEventListener("click", () => player.pauseVideo());
document.getElementById("btnNext").addEventListener("click", nextTrack);
document.getElementById("btnPrev").addEventListener("click", prevTrack);
