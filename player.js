// 1. GARANTA QUE O ID NO HTML SEJA 'sc-widget'
const widgetIframe = document.getElementById('sc-widget');
const widget = SC.Widget(widgetIframe);

let playlist = [];
let currentTrackIndex = 0;

// Configuração inicial
widget.bind(SC.Widget.Events.READY, () => {
    console.log("SoundCloud pronto");
    document.getElementById("status").innerText = "Pronto para carregar!";
    widget.setVolume(100);
});

// Auto-play para a próxima
widget.bind(SC.Widget.Events.FINISH, () => {
    nextTrack();
});

// Adicionar música
async function handleAddContent() {
    const urlInput = document.getElementById("videoUrl");
    const url = urlInput.value;
    
    if (url.includes("soundcloud.com")) {
        // Adiciona à fila com título temporário
        const newTrack = { url: url, title: "Carregando..." };
        playlist.push(newTrack);
        updatePlaylistUI();
        
        // Se for a única, toca agora
        if (playlist.length === 1) {
            playTrack(0);
        }
    }
    urlInput.value = "";
}

function playTrack(index) {
    if (index >= 0 && index < playlist.length) {
        currentTrackIndex = index;
        
        // O segredo do iPhone: load precisa de opções explícitas
        widget.load(playlist[index].url, {
            auto_play: true,
            hide_related: true,
            show_comments: false,
            callback: () => {
                // Força o play e busca as informações da música
                widget.play(); 
                widget.setVolume(100);
                
                setTimeout(() => {
                    widget.getCurrentSound((sound) => {
                        if (sound) {
                            playlist[index].title = sound.title;
                            document.getElementById("status").innerText = sound.title;
                            updatePlaylistUI();
                            updateMediaMetadata(sound);
                        }
                    });
                }, 1000); // Pequeno atraso para a API responder
            }
        });
    }
}

function nextTrack() {
    if (currentTrackIndex + 1 < playlist.length) {
        playTrack(currentTrackIndex + 1);
    }
}

function prevTrack() {
    if (currentTrackIndex - 1 >= 0) {
        playTrack(currentTrackIndex - 1);
    }
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
        // Criamos o texto e o botão de remover (opcional)
        li.innerHTML = `<span><strong>${index + 1}.</strong> ${item.title}</span>`;
        li.style.cursor = "pointer";
        
        if (index === currentTrackIndex) {
            li.style.color = "#ff5500"; // Cor do SoundCloud
            li.style.fontWeight = "bold";
        }
        
        li.onclick = () => playTrack(index);
        listElement.appendChild(li);
    });
}

// Botões
document.getElementById("btnLoad").addEventListener("click", handleAddContent);
document.getElementById("btnPlay").addEventListener("click", () => {
    widget.play();
    document.getElementById("status").innerText = playlist[currentTrackIndex]?.title || "Tocando...";
});
document.getElementById("btnPause").addEventListener("click", () => widget.pause());
document.getElementById("btnNext").addEventListener("click", nextTrack);
document.getElementById("btnPrev").addEventListener("click", prevTrack);
