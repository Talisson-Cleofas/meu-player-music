let widget = SC.Widget(document.getElementById('sc-player'));
let playlist = [];
let currentTrackIndex = 0;

// Configuração inicial
widget.bind(SC.Widget.Events.READY, () => {
    console.log("SoundCloud pronto");
    widget.setVolume(100);
});

// Evento de quando a música acaba
widget.bind(SC.Widget.Events.FINISH, () => {
    nextTrack();
});

async function handleAddContent() {
    const url = document.getElementById("videoUrl").value; // Agora cole o link do SoundCloud
    if (url.includes("soundcloud.com")) {
        // No SoundCloud, basta carregar a URL no widget
        playlist.push({ url: url, title: "Música do SoundCloud" });
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
                updateMediaMetadata(playlist[index].title);
            }
        });
        updatePlaylistUI();
    }
}

// Controles
document.getElementById("btnPlay").addEventListener("click", () => widget.play());
document.getElementById("btnPause").addEventListener("click", () => widget.pause());
document.getElementById("btnNext").addEventListener("click", () => nextTrack());
document.getElementById("btnPrev").addEventListener("click", () => prevTrack());
