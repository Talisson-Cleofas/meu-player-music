// Configuração inicial
const CLIENT_ID = 'aa0d756de68c6a086a3107e117498df3'; // Client ID de exemplo (público)
SC.initialize({ client_id: CLIENT_ID });

let currentSound = null; // Objeto de áudio nativo
let playlist = [];
let currentIndex = 0;

async function handleAddContent() {
    const url = document.getElementById("videoUrl").value.trim();
    if (!url) return;

    document.getElementById("status").innerText = "Buscando faixas...";

    try {
        // Resolve o link (seja música ou álbum) para dados puros
        const resolveData = await SC.resolve(url);
        
        if (resolveData.kind === "playlist") {
            playlist = [...playlist, ...resolveData.tracks];
        } else {
            playlist.push(resolveData);
        }

        updatePlaylistUI();
        if (!currentSound) playTrack(0);
        
    } catch (e) {
        document.getElementById("status").innerText = "Erro ao carregar.";
    }
    document.getElementById("videoUrl").value = "";
}

async function playTrack(index) {
    if (index < 0 || index >= playlist.length) return;
    
    currentIndex = index;
    if (currentSound) currentSound.stop();

    document.getElementById("status").innerText = "Carregando áudio...";

    // CRIAR O PLAYER NATIVO (Não é Iframe!)
    currentSound = await SC.stream(`/tracks/${playlist[index].id}`);
    
    currentSound.play();
    updatePlaylistUI();
    setupMediaSession(playlist[index]);

    // Quando a música acabar
    currentSound.on('finish', () => nextTrack());
}

function nextTrack() {
    if (currentIndex + 1 < playlist.length) {
        playTrack(currentIndex + 1);
    }
}

function prevTrack() {
    if (currentIndex - 1 >= 0) {
        playTrack(currentIndex - 1);
    }
}

function setupMediaSession(track) {
    if ('mediaSession' in navigator) {
        const artwork = track.artwork_url ? track.artwork_url.replace("-large", "-t500x500") : "";
        
        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: track.user.username,
            artwork: [{ src: artwork, sizes: '500x500', type: 'image/jpg' }]
        });

        // AGORA OS BOTÕES FUNCIONAM: O áudio pertence à sua página
        navigator.mediaSession.setActionHandler('play', () => currentSound.play());
        navigator.mediaSession.setActionHandler('pause', () => currentSound.pause());
        navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
        navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
    }
}

function updatePlaylistUI() {
    const listElement = document.getElementById("playlistView");
    listElement.innerHTML = "";
    playlist.forEach((track, index) => {
        const li = document.createElement("li");
        li.className = index === currentIndex ? "active-track" : "";
        li.innerHTML = `
            <span class="track-num">${(index + 1).toString().padStart(2, '0')}</span>
            <span class="track-name">${track.title}</span>
        `;
        li.onclick = () => playTrack(index);
        listElement.appendChild(li);
    });
}

// Botões da interface
document.getElementById("btnLoad").onclick = handleAddContent;
document.getElementById("btnPlay").onclick = () => currentSound?.play();
document.getElementById("btnPause").onclick = () => currentSound?.pause();
document.getElementById("btnNext").onclick = nextTrack;
document.getElementById("btnPrev").onclick = prevTrack;
