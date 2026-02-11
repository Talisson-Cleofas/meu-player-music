const widgetIframe = document.getElementById("sc-widget");
const widget = SC.Widget(widgetIframe);
const pulseAudio = new Audio('https://raw.githubusercontent.com/anars/blank-audio/master/250-milliseconds-of-silence.mp3');
pulseAudio.loop = true;

let playlist = [];

// Sincronização ao dar Play
widget.bind(SC.Widget.Events.PLAY, () => {
  pulseAudio.play().catch(() => {}); 
  widget.getCurrentSound((sound) => {
    if (sound) {
      document.getElementById("status").innerText = sound.title;
      applyMediaSession(sound);
      updateActiveTrackVisual(sound.title);
    }
  });
});

widget.bind(SC.Widget.Events.FINISH, () => widget.next());

// FUNÇÃO REFORMULADA: Trata erros e diferentes tipos de links
function handleAddContent() {
  const urlInput = document.getElementById("videoUrl");
  const url = urlInput.value.trim();
  const statusElement = document.getElementById("status");

  if (url.includes("soundcloud.com")) {
    statusElement.innerText = "Sintonizando...";
    
    // Resetamos a playlist visual para evitar confusão se o link falhar
    playlist = []; 

    widget.load(url, {
      auto_play: true,
      show_artwork: true,
      callback: () => {
        // Tentativas repetidas para capturar os dados (ajuda em conexões lentas)
        let attempts = 0;
        const checkInterval = setInterval(() => {
          widget.getSounds((sounds) => {
            attempts++;
            
            if (sounds && sounds.length > 0) {
              playlist = sounds.map(s => ({ title: s.title }));
              updatePlaylistUI();
              statusElement.innerText = "Pronto!";
              clearInterval(checkInterval);
            } else if (attempts > 5) {
              // Se após 5 tentativas não ler o álbum, tenta ler como música única
              widget.getCurrentSound((s) => {
                if (s) {
                  playlist = [{ title: s.title }];
                  updatePlaylistUI();
                  statusElement.innerText = "Música única carregada";
                } else {
                  statusElement.innerText = "Erro: Este link bloqueia reprodução externa.";
                }
              });
              clearInterval(checkInterval);
            }
          });
        }, 800);
      }
    });
  }
  urlInput.value = "";
}

// Media Session permanece igual, mas adicionei playbackState para o iOS
function applyMediaSession(sound) {
  if ("mediaSession" in navigator) {
    const artwork = sound.artwork_url 
      ? sound.artwork_url.replace("http:", "https:").replace("-large", "-t500x500")
      : "https://a-v2.sndcdn.com/assets/images/default_track_artwork-6db91781.png";

    navigator.mediaSession.metadata = new MediaMetadata({
      title: sound.title,
      artist: sound.user.username,
      artwork: [{ src: artwork, sizes: "500x500", type: "image/jpg" }]
    });

    navigator.mediaSession.playbackState = "playing";

    const handlers = [
      ['play', () => widget.play()],
      ['pause', () => widget.pause()],
      ['nexttrack', () => widget.next()],
      ['previoustrack', () => widget.prev()]
    ];

    handlers.forEach(([action, handler]) => {
      try { navigator.mediaSession.setActionHandler(action, handler); } catch (e) {}
    });
  }
}

function updatePlaylistUI() {
  const listElement = document.getElementById("playlistView");
  listElement.innerHTML = "";
  playlist.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="track-num">${(index + 1).toString().padStart(2, '0')}</span><span class="track-name">${item.title}</span>`;
    li.onclick = () => widget.skip(index);
    listElement.appendChild(li);
  });
}

function updateActiveTrackVisual(currentTitle) {
  document.querySelectorAll("#playlistView li").forEach(li => {
    li.classList.remove("active-track");
    if (li.querySelector(".track-name").innerText === currentTitle) {
      li.classList.add("active-track");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnLoad").onclick = handleAddContent;
  document.getElementById("btnPlay").onclick = () => { widget.play(); pulseAudio.play(); };
  document.getElementById("btnPause").onclick = () => { widget.pause(); pulseAudio.pause(); };
  document.getElementById("btnNext").onclick = () => widget.next();
  document.getElementById("btnPrev").onclick = () => widget.prev();
});
