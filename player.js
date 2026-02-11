// 1. Referência correta ao ID do iframe que está no seu HTML
let widget = SC.Widget(document.getElementById('sc-widget'));
let playlist = [];
let currentTrackIndex = 0;

// Configuração inicial
widget.bind(SC.Widget.Events.READY, () => {
    console.log("SoundCloud pronto");
    widget.setVolume(100);
});

// Evento de quando a música acaba (Auto-play para a próxima)
widget.bind(SC.Widget.Events.FINISH, () => {
    nextTrack();
});

// Adicionar música
async function handleAddContent() {
    const url = document.getElementById("videoUrl").value;
    if (url.includes("soundcloud.com")) {
        // No SoundCloud, a API busca o título automaticamente após o load, 
        // mas vamos adicionar à fila primeiro
        playlist.push({ url: url, title: "Carregando..." });
        updatePlaylistUI();
        
        if (playlist.length === 1) {
            playTrack(0);
        }
    }
    document.getElementById("videoUrl").value = "";
}

function playTrack(index) {
    if (index >= 0 && index < playlist.length) {
        currentTrackIndex = index;
        
        widget.load(playlist[index].url, {
            auto_play: true,
            show_artwork: true,
            callback: () => {
                widget.setVolume(100);
                // Busca o título real da música para atualizar a interface
                widget.getCurrentSound((sound) => {
                    playlist[index].title = sound.title;
                    document.getElementById("status").innerText = sound.title;
                    updatePlaylistUI();
                    updateMediaMetadata(sound);
                });
            }
        });
    }
}

// Funções de Navegação (Essenciais para não dar erro)
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

// Integração com a Tela de Bloqueio do iPhone
function updateMediaMetadata(sound) {
    if ("mediaSession" in navigator) {
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

// Atualizar a lista visual
function updatePlaylistUI() {
    const listElement = document.getElementById("playlistView");
    listElement.innerHTML = "";
    playlist.forEach((item, index) => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${index + 1}.</strong> ${item.title}`;
        li.style.cursor = "pointer";
        if (index === currentTrackIndex) li.style.color = "#1DB954";
        li.onclick = () => playTrack(index);
        listElement.appendChild(li);
    });
}

// Eventos dos Botões
document.getElementById("btnLoad").addEventListener("click", handleAddContent);
document.getElementById("btnPlay").addEventListener("click", () => widget.play());
document.getElementById("btnPause").addEventListener("click", () => widget.pause());
document.getElementById("btnNext").addEventListener("click", () => nextTrack());
document.getElementById("btnPrev").addEventListener("click", () => prevTrack());
