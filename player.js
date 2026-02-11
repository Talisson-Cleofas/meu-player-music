let player;
let playlist = [];
let currentTrackIndex = 0;
let wakeLock = null;

// Áudio de suporte: Essencial para o iOS não suspender o processo de rede
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
      disablekb: 1,
      fs: 1,
      origin: window.location.origin,
      widget_referrer: window.location.origin,
      host: "https://www.youtube-nocookie.com",
    },
    events: {
      onStateChange: onPlayerStateChange,
      onReady: (event) => {
        event.target.setVolume(100);
        console.log("Player pronto");
      },
    },
  });
}

// TÉCNICA PARA IOS: Mantém o canal de áudio aberto
document.addEventListener("visibilitychange", function () {
  if (
    document.hidden &&
    player &&
    player.getPlayerState() === YT.PlayerState.PLAYING
  ) {
    silentAudio.play().catch(() => {});
  }
});

async function requestWakeLock() {
  try {
    if ("wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");
    }
  } catch (err) {}
}

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
      silentAudio.play();
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      player.pauseVideo();
      silentAudio.pause();
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => prevTrack());
    navigator.mediaSession.setActionHandler("nexttrack", () => nextTrack());
  }
}

async function handleAddContent() {
  const url = document.getElementById("videoUrl").value;
  const videoId = extractVideoID(url);
  const playlistId = extractPlaylistID(url);

  if (playlistId) {
    player.cuePlaylist({ listType: "playlist", list: playlistId, index: 0 });
    document.getElementById("status").innerText = "Playlist pronta!";
    addToPlaylistArray(videoId || "", "🎬 Playlist Ativa");
  } else if (videoId) {
    const title = await getVideoTitle(videoId);
    addToPlaylistArray(videoId, title);
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
    return "Música Desconhecida";
  }
}

function addToPlaylistArray(id, title) {
  playlist.push({ id, title });
  updatePlaylistUI();
  if (playlist.length === 1) {
    player.cueVideoById(id);
    document.getElementById("status").innerText = "Aperte Play para iniciar";
  }
}

function playTrack(index) {
  if (index >= 0 && index < playlist.length) {
    currentTrackIndex = index;
    // iOS Hack: Tocar o áudio silencioso ANTES do vídeo prepara o sistema de som
    silentAudio
      .play()
      .then(() => {
        player.loadVideoById(playlist[currentTrackIndex].id);
        player.setVolume(100);
        player.unMute();
      })
      .catch(() => {
        player.loadVideoById(playlist[currentTrackIndex].id);
      });
    updatePlaylistUI();
  }
}

function nextTrack() {
  const ytPlaylist = player.getPlaylist();
  if (ytPlaylist && player.getPlaylistIndex() < ytPlaylist.length - 1) {
    player.nextVideo();
  } else if (currentTrackIndex + 1 < playlist.length) {
    playTrack(currentTrackIndex + 1);
  }
}

function prevTrack() {
  if (player.getPlaylistIndex() > 0) {
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
    requestWakeLock();
    updateMediaMetadata();
    silentAudio.play().catch(() => {});
  }
}

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

document.getElementById("btnLoad").addEventListener("click", handleAddContent);
document.getElementById("btnPlay").addEventListener("click", () => {
  player.playVideo();
  silentAudio.play().catch(() => {});
});
document.getElementById("btnPause").addEventListener("click", () => {
  player.pauseVideo();
  silentAudio.pause();
});
document.getElementById("btnNext").addEventListener("click", nextTrack);
document.getElementById("btnPrev").addEventListener("click", prevTrack);
