let player;
let playlist = [];
let currentTrackIndex = 0;
let wakeLock = null;

// Áudio de suporte para manter o canal de som aberto no iOS
const silentAudio = new Audio(
  "https://raw.githubusercontent.com/anars/blank-audio/master/10-minutes-of-silence.mp3",
);
silentAudio.loop = true;

const tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(tag);

function onYouTubeIframeAPIReady() {
  player = new YT.Player("youtube-player", {
    height: "100%",
    width: "100%",
    playerVars: {
      playsinline: 1,
      autoplay: 0,
      controls: 1,
      mute: 0,
      enablejsapi: 1,
      origin: window.location.origin,
    },
    events: {
      onReady: (event) => {
        // Tenta desmudar preventivamente
        event.target.unMute();
        event.target.setVolume(100);
      },
      onStateChange: onPlayerStateChange,
    },
  });
}

// Mantém o processo vivo ao sair da aba
document.addEventListener("visibilitychange", () => {
  if (
    document.hidden &&
    player &&
    player.getPlayerState() === YT.PlayerState.PLAYING
  ) {
    silentAudio.play().catch(() => {});
  }
});

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

    navigator.mediaSession.setActionHandler("play", () => {
      player.playVideo();
      player.unMute();
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      player.pauseVideo();
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => prevTrack());
    navigator.mediaSession.setActionHandler("nexttrack", () => nextTrack());
  }
}

function playTrack(index) {
  if (index >= 0 && index < playlist.length) {
    currentTrackIndex = index;
    // O segredo para o iOS: primeiro o áudio local, depois o YouTube desmudado
    silentAudio
      .play()
      .then(() => {
        player.loadVideoById(playlist[currentTrackIndex].id);
        player.unMute();
        player.setVolume(100);
      })
      .catch(() => {
        player.loadVideoById(playlist[currentTrackIndex].id);
      });
    updatePlaylistUI();
  }
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    event.target.unMute(); // Reafirma o som no início de cada faixa
    event.target.setVolume(100);
    updateMediaMetadata();
    silentAudio.play().catch(() => {});
    document.getElementById("status").innerText = player.getVideoData().title;
  }
  if (event.data === YT.PlayerState.ENDED) nextTrack();
}

// Funções de controle padrão
function nextTrack() {
  if (currentTrackIndex + 1 < playlist.length) playTrack(currentTrackIndex + 1);
}
function prevTrack() {
  if (currentTrackIndex - 1 >= 0) playTrack(currentTrackIndex - 1);
}

// Utilitários de Playlist e Extração (Mantenha os seus)
async function handleAddContent() {
  const url = document.getElementById("videoUrl").value;
  const videoId = extractVideoID(url);
  if (videoId) {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
    );
    const data = await response.json();
    playlist.push({ id: videoId, title: data.title });
    updatePlaylistUI();
    if (playlist.length === 1) player.cueVideoById(videoId);
  }
  document.getElementById("videoUrl").value = "";
}

function updatePlaylistUI() {
  const listElement = document.getElementById("playlistView");
  listElement.innerHTML = "";
  playlist.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `<span><strong>${index + 1}.</strong> ${item.title}</span>`;
    li.onclick = () => playTrack(index);
    if (index === currentTrackIndex) li.style.color = "#1DB954";
    listElement.appendChild(li);
  });
}

function extractVideoID(url) {
  const match = url.match(
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/,
  );
  return match && match[2].length === 11 ? match[2] : null;
}

// Listeners de Evento
document.getElementById("btnLoad").addEventListener("click", handleAddContent);
document.getElementById("btnPlay").addEventListener("click", () => {
  silentAudio.play().catch(() => {});
  player.unMute(); // Essencial para o Safari liberar o som
  player.setVolume(100);
  player.playVideo();
});
document.getElementById("btnPause").addEventListener("click", () => {
  player.pauseVideo();
  silentAudio.pause();
});
document.getElementById("btnNext").addEventListener("click", nextTrack);
document.getElementById("btnPrev").addEventListener("click", prevTrack);
