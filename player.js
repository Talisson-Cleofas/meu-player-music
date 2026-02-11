const widgetIframe = document.getElementById("sc-widget");
const widget = SC.Widget(widgetIframe);

// Truque para o iOS: Um som curto que autoriza a troca de faixa
const pulseAudio = new Audio('https://raw.githubusercontent.com/anars/blank-audio/master/250-milliseconds-of-silence.mp3');

let playlist = [];
let currentTrackIndex = 0;

widget.bind(SC.Widget.Events.READY, () => {
    document.getElementById("status").innerText = "Pronto!";
});

widget.bind(SC.Widget.Events.PLAY, () => {
    widget.getCurrentSound((sound) => {
        if (sound) {
            applyMediaSession(sound);
            document.getElementById("status").innerText = sound.title;
            updateActiveTrackVisual();
        }
    });
});

widget.bind(SC.Widget.Events.FINISH, () => nextTrack());

async function handleAddContent() {
    const urlInput = document.getElementById("videoUrl");
    const url = urlInput.value.trim();
    if (!url) return;

    document.getElementById("status").innerText = "Analisando...";
    
    // Carrega para extrair faixas
    widget.load(url, {
        auto_play: false,
        callback: () => {
            widget.getSounds((sounds) => {
                if (sounds && sounds.length > 0) {
                    sounds.forEach(s => playlist.push({ url: s.uri, title: s.title }));
                    updatePlaylistUI();
                    if (playlist.length === sounds.length) playTrack(0);
                    document.getElementById("status").innerText = "Playlist Atualizada";
                }
            });
        }
    });
    urlInput.value = "";
}

function playTrack(index) {
    if (index < 0 || index >= playlist.length) return;
    currentTrackIndex = index;

    // Antes de carregar, damos um "play" no áudio fantasma para o iOS não bloquear
    pulseAudio.play().catch(() => {});

    widget.load(playlist[index].url, {
        auto_play: true,
        show_artwork: true,
        callback: () => {
            widget.play();
            updateActiveTrackVisual();
        }
    });
}

function nextTrack() {
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    playTrack(currentTrackIndex);
}

function prevTrack() {
    currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    playTrack(currentTrackIndex);
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

        // Configura os handlers
        navigator.mediaSession.setActionHandler("play", () => widget.play());
        navigator.mediaSession.setActionHandler("pause", () => widget.pause());
        navigator.mediaSession.setActionHandler("nexttrack", () => nextTrack());
        navigator.mediaSession.setActionHandler("previoustrack", () => prevTrack());
        
        // Remove os 10s
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
        li.onclick = () => playTrack(index);
        listElement.appendChild(li);
    });
}

function updateActiveTrackVisual() {
    const items = document.querySelectorAll("#playlistView li");
    items.forEach((li, idx) => {
        li.classList.toggle("active-track", idx === currentTrackIndex);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btnLoad").onclick = handleAddContent;
    document.getElementById("btnPlay").onclick = () => widget.play();
    document.getElementById("btnPause").onclick = () => widget.pause();
    document.getElementById("btnNext").onclick = nextTrack;
    document.getElementById("btnPrev").onclick = prevTrack;
});
