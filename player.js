const widgetIframe = document.getElementById("sc-widget");
const widget = SC.Widget(widgetIframe);

// CRUCIAL: Criamos um áudio silencioso para manter o sistema acordado
const audioFix = new Audio('https://raw.githubusercontent.com/anars/blank-audio/master/10-seconds-of-silence.mp3');
audioFix.loop = true;

let playlist = [];

widget.bind(SC.Widget.Events.READY, () => {
  document.getElementById("status").innerText = "Pronto!";
});

widget.bind(SC.Widget.Events.PLAY, () => {
  widget.getCurrentSound((sound) => {
    if (sound) {
      document.getElementById("status").innerText = sound.title;
      applyMediaSession(sound);
      updateActiveTrackVisual(sound.title);
      // Quando o SoundCloud toca, iniciamos o áudio silencioso para "segurar" o canal
      audioFix.play().catch(() => {});
    }
  });
});

widget.bind(SC.Widget.Events.FINISH, () => nextTrack());

async function handleAddContent() {
  const urlInput = document.getElementById("videoUrl");
  let url = urlInput.value.trim();
  const statusElement = document.getElementById("status");

  if (url.includes("soundcloud.com")) {
    statusElement.innerText = "Normalizando link...";

    // 1. CONVERSÃO DE LINK MOBILE PARA DESKTOP
    // Remove o "m." (mobile) e substitui por "www."
    url = url.replace("m.soundcloud.com", "soundcloud.com");
    
    // Se for link curto (on.soundcloud.com), ele precisa ser expandido (opcional, mas o replace resolve o principal)
    // O Widget costuma aceitar o soundcloud.com puro melhor que o m.soundcloud.com

    statusElement.innerText = "Sintonizando...";
    
    widget.load(url, {
      auto_play: true,
      show_artwork: true, // Garante que os metadados venham junto
      callback: () => {
        // Pequeno delay para o widget processar a mudança de domínio
        setTimeout(() => {
          widget.getSounds((sounds) => {
            if (sounds && sounds.length > 0) {
              playlist = sounds.map(s => ({ title: s.title }));
              updatePlaylistUI();
              statusElement.innerText = "Pronto!";
              widget.play();
            } else {
              // Fallback para música única se getSounds falhar
              widget.getCurrentSound((s) => {
                if(s) {
                   playlist = [{ title: s.title }];
                   updatePlaylistUI();
                } else {
                   statusElement.innerText = "Erro: Link móvel incompatível.";
                }
              });
            }
          });
        }, 1000);
      }
    });
  }
  urlInput.value = "";
}


// NAVEGAÇÃO: Agora o comando é disparado com prioridade máxima
function nextTrack() {
  // 1. Acorda o sistema
  audioFix.play().catch(() => {});
  // 2. Comanda o widget
  widget.next();
  // 3. Força a UI a se manter ativa
  if ("mediaSession" in navigator) {
    navigator.mediaSession.playbackState = "playing";
  }
}

function prevTrack() {
  audioFix.play().catch(() => {});
  widget.prev();
}

function applyMediaSession(sound) {
  if ("mediaSession" in navigator) {
    const artwork = sound.artwork_url 
      ? sound.artwork_url.replace("http:", "https:").replace("-large", "-t500x500")
      : "https://a-v2.sndcdn.com/assets/images/default_track_artwork-6db91781.png";

    navigator.mediaSession.metadata = new MediaMetadata({
      title: sound.title,
      artist: sound.user.username,
      album: "SoundCloud Player",
      artwork: [{ src: artwork, sizes: "500x500", type: "image/jpg" }]
    });

    // Mapeamos os botões DIRETAMENTE para as funções de navegação
    navigator.mediaSession.setActionHandler("play", () => {
        widget.play();
        audioFix.play();
    });
    navigator.mediaSession.setActionHandler("pause", () => {
        widget.pause();
        audioFix.pause();
    });
    
    // Vinculação direta para tela de bloqueio
    navigator.mediaSession.setActionHandler("nexttrack", nextTrack);
    navigator.mediaSession.setActionHandler("previoustrack", prevTrack);

    // Remove botões de 10s
    navigator.mediaSession.setActionHandler('seekbackward', null);
    navigator.mediaSession.setActionHandler('seekforward', null);
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
  const items = document.querySelectorAll("#playlistView li");
  items.forEach(li => {
    li.classList.remove("active-track");
    if (li.querySelector(".track-name").innerText === currentTitle) {
      li.classList.add("active-track");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnLoad").onclick = handleAddContent;
  document.getElementById("btnPlay").onclick = () => { widget.play(); audioFix.play(); };
  document.getElementById("btnPause").onclick = () => { widget.pause(); audioFix.pause(); };
  document.getElementById("btnNext").onclick = nextTrack;
  document.getElementById("btnPrev").onclick = prevTrack;
});