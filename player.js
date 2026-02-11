const widgetIframe = document.getElementById('sc-widget');
const widget = SC.Widget(widgetIframe);

let playlist = [];
let currentTrackIndex = 0;

// Inicialização
widget.bind(SC.Widget.Events.READY, () => {
    console.log("SoundCloud pronto");
    document.getElementById("status").innerText = "Insira um link e clique em Carregar";
    widget.setVolume(100);
});

// Auto-play para a próxima
widget.bind(SC.Widget.Events.FINISH, () => {
    nextTrack();
});

async function handleAddContent() {
    const urlInput = document.getElementById("videoUrl");
    const url = urlInput.value.trim();
    
    if (url.includes("soundcloud.com")) {
        // Adiciona à fila com título temporário
        const newTrack = { url: url, title: "Carregando informações..." };
        playlist.push(newTrack);
        updatePlaylistUI();
        
        // Se for a primeira, toca agora
        if (playlist.length === 1) {
            playTrack(0);
        }
    } else {
        alert("Cole um link válido do SoundCloud.");
    }
    urlInput.value = "";
}

function playTrack(index) {
    if (index >= 0 && index < playlist.length) {
        currentTrackIndex = index;
        const statusDisplay = document.getElementById("status");
        
        statusDisplay.innerText = "Carregando áudio...";
        
        widget.load(playlist[index].url, {
            auto_play: true,
            callback: () => {
                widget.play();
                widget.setVolume(100);
                
                // Tenta pegar o nome da música (o SoundCloud pode demorar uns segundos)
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
                    if (attempts > 10) clearInterval(checkSound); // Para após 10 tentativas
                }, 1000);
            }
        });
    }
}

function nextTrack() {
    if (currentTrackIndex + 1 < playlist.length) playTrack(currentTrackIndex + 1);
}

function prevTrack() {
    if (currentTrackIndex - 1 >= 0) playTrack(currentTrackIndex - 1);
}

function updateMediaMetadata(sound) {
    if ("mediaSession" in navigator && sound) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: sound.title,
            artist: sound.user.username,
            artwork: [{ src: sound.artwork_url || '', sizes: '512x512', type: 'image/jpg' }]
        });

        navigator.mediaSession.setActionHandler("play", () => widget.play());
        navigator.mediaSession.setActionHandler("pause", () => widget.pause());
        navigator.mediaSession.setActionHandler("previoustrack", () => prevTrack());
        navigator.mediaSession.setActionHandler("nexttrack", () => nextTrack());
    }
}

function updatePlaylistUI() {
    const listElement = document.getElementById("playlistView");
    listElement.innerHTML = "";
    playlist.forEach((item, index) => {
        const li = document.createElement("li");
        li.innerHTML = `<span><strong>${index + 1}.</strong> ${item.title}</span>`;
        li.style.cursor = "pointer";
        li.style.padding = "10px";
        li.style.marginBottom = "5px";
        li.style.borderRadius = "5px";
        li.style.background = index === currentTrackIndex ? "#2a2a2a" : "transparent";
        li.style.color = index === currentTrackIndex ? "#1DB954" : "white";
        
        li.onclick = () => playTrack(index);
        listElement.appendChild(li);
    });
}

// Eventos de clique
document.getElementById("btnLoad").addEventListener("click", handleAddContent);
document.getElementById("btnPlay").addEventListener("click", () => {
    widget.play();
    widget.getCurrentSound((s) => { if(s) document.getElementById("status").innerText = s.title; });
});
document.getElementById("btnPause").addEventListener("click", () => widget.pause());
document.getElementById("btnNext").addEventListener("click", nextTrack);
document.getElementById("btnPrev").addEventListener("click", prevTrack);
