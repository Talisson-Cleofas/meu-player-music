// ==========================================
// 1. CONFIGURAÇÕES INICIAIS E ELEMENTOS
// ==========================================
const widgetIframe = document.getElementById("sc-widget");
const widget = SC.Widget(widgetIframe);

const btnTogglePlay = document.getElementById("btnTogglePlay");
const playIcon = document.getElementById("playIcon");
const statusDisplay = document.getElementById("status");
const progressSlider = document.getElementById("progressSlider");
const currentTimeDisplay = document.getElementById("currentTime");
const totalDurationDisplay = document.getElementById("totalDuration");

let isDragging = false;

// Áudio silencioso para manter o player vivo no Android/iOS
const audioFix = new Audio("https://raw.githubusercontent.com/anars/blank-audio/master/10-seconds-of-silence.mp3");
audioFix.loop = true;
audioFix.volume = 0.01;

// ==========================================
// 2. TELA SPLASH (FORÇADA PARA SUMIR)
// ==========================================
function gerenciarSplash() {
    const splash = document.getElementById("splash-screen");
    if (splash) {
        console.log("Iniciando contagem do Splash...");
        setTimeout(() => {
            splash.style.transition = "opacity 0.6s ease";
            splash.style.opacity = "0";
            setTimeout(() => {
                splash.style.display = "none";
                console.log("Splash removido.");
            }, 600);
        }, 2500);
    }
}
// Chamada imediata
gerenciarSplash();

// ==========================================
// 3. BIBLIOTECA DE ÁLBUNS
// ==========================================
const meusAlbuns = [
    { nome: "Efeito Atomiko", url: "https://soundcloud.com/colodedeus/sets/efeito-atomiko-ao-vivo-no" },
    { nome: "Camp Fire", url: "https://soundcloud.com/colodedeus/sets/camp-fire-ao-vivo" },
    { nome: "Rahamim", url: "https://soundcloud.com/colodedeus/sets/rahamim-4" },
    { nome: "AD10", url: "https://soundcloud.com/colodedeus/sets/adoracao-na-nossa-casa-e-1" },
    { nome: "Secreto", url: "https://soundcloud.com/colodedeus/sets/secreto-33" },
    { nome: "Deserto", url: "https://soundcloud.com/colodedeus/sets/deserto-5" },
    { nome: "Intimidade", url: "https://soundcloud.com/colodedeus/sets/intimidade-28" },
    { nome: "Confia", url: "https://soundcloud.com/colodedeus/sets/confia-8" },
    { nome: "Esdras", url: "https://soundcloud.com/colodedeus/sets/esdras-6" },
    { nome: "Cordeiro 1", url: "https://soundcloud.com/colodedeus/sets/o-cordeiro-o-leao-e-o-trono-parte-1-voz-e-violao" },
    { nome: "Cordeiro 2", url: "https://soundcloud.com/colodedeus/sets/o-cordeiro-o-leao-e-o-trono-parte-2-voz-e-violao" },
    { nome: "Cordeiro 3", url: "https://soundcloud.com/colodedeus/sets/o-cordeiro-o-leao-e-o-trono-4" },
    { nome: "Casa de Maria", url: "https://soundcloud.com/colodedeus/sets/projeto-casa-de-maria" }
];

// ==========================================
// 4. FUNÇÕES DO PLAYER
// ==========================================

function formatarTempo(ms) {
    if (!ms || isNaN(ms)) return "0:00";
    const totalSegundos = Math.floor(ms / 1000);
    const minutos = Math.floor(totalSegundos / 60);
    const segundos = totalSegundos % 60;
    return minutos + ":" + (segundos < 10 ? "0" : "") + segundos;
}

function carregarAlbum(url) {
    statusDisplay.innerText = "Sintonizando...";
    audioFix.play().catch(() => {});
    
    widget.load(url.trim(), {
        auto_play: true,
        show_artwork: false
    });

    widget.bind(SC.Widget.Events.READY, () => {
        setTimeout(() => {
            widget.play();
            if (playIcon) playIcon.className = "fas fa-pause";
        }, 1000);
        widget.unbind(SC.Widget.Events.READY);
    });
}

function desenharBotoes() {
    const container = document.getElementById("albumButtons");
    if (!container) return;
    container.innerHTML = "";
    meusAlbuns.forEach(album => {
        const botao = document.createElement("button");
        botao.className = "btn-album";
        botao.innerText = album.nome;
        botao.onclick = () => carregarAlbum(album.url);
        container.appendChild(botao);
    });
}
desenharBotoes();

// Play/Pause Principal
btnTogglePlay.onclick = () => {
    widget.isPaused((paused) => {
        if (paused) {
            audioFix.play().catch(() => {});
            widget.play();
            playIcon.className = "fas fa-pause";
        } else {
            widget.pause();
            playIcon.className = "fas fa-play";
        }
    });
};
// Função para dar o destaque visual nos botões
function destacarBotao(botaoId) {
    const btn = document.getElementById(botaoId);
    if (!btn) return;

    btn.classList.add('btn-highlight');
    
    // Remove a classe após 400ms (tempo da animação)
    setTimeout(() => {
        btn.classList.remove('btn-highlight');
    }, 400);
}

// --- INTEGRAÇÃO COM SEUS EVENTOS EXISTENTES ---

// No botão Anterior
document.getElementById('btnPrev').addEventListener('click', () => {
    widget.prev();
    destacarBotao('btnPrev');
});

// No botão Próximo
document.getElementById('btnNext').addEventListener('click', () => {
    widget.next();
    destacarBotao('btnNext');
});

// No botão Play/Pause (opcional, mas fica legal)
document.getElementById('btnTogglePlay').addEventListener('click', () => {
    destacarBotao('btnTogglePlay');
    // ... seu código de play/pause atual
});

// Monitoramento de música e Título
widget.bind(SC.Widget.Events.PLAY, () => {
    widget.getCurrentSound((sound) => {
        if (sound) {
            statusDisplay.innerText = sound.title;
            document.title = "▶ " + sound.title;
            atualizarMediaSession(sound);
        }
    });
    if (playIcon) playIcon.className = "fas fa-pause";
});

widget.bind(SC.Widget.Events.PAUSE, () => {
    document.title = "CloudCast Player";
    if (playIcon) playIcon.className = "fas fa-play";
});

// Barra de Progresso
widget.bind(SC.Widget.Events.PLAY_PROGRESS, (data) => {
    if (!isDragging) {
        const atual = data.currentPosition;
        widget.getDuration((total) => {
            if (total > 0) {
                progressSlider.value = (atual / total) * 100;
                currentTimeDisplay.innerText = formatarTempo(atual);
                totalDurationDisplay.innerText = formatarTempo(total);

                if ('mediaSession' in navigator && navigator.mediaSession.setPositionState) {
                    navigator.mediaSession.setPositionState({
                        duration: total / 1000,
                        playbackRate: 1,
                        position: atual / 1000
                    });
                }
            }
        });
    }
});

if (progressSlider) {
    progressSlider.oninput = () => { isDragging = true; };
    progressSlider.onchange = () => {
        widget.getDuration((total) => {
            widget.seekTo((progressSlider.value / 100) * total);
            isDragging = false;
        });
    };
}

// Navegação
document.getElementById("btnNext").onclick = () => { audioFix.play().catch(() => {}); widget.next(); };
document.getElementById("btnPrev").onclick = () => { audioFix.play().catch(() => {}); widget.prev(); };

// Fim da música (Loop do álbum)
widget.bind(SC.Widget.Events.FINISH, () => {
    widget.getSounds((sounds) => {
        widget.getCurrentSoundIndex((index) => {
            if (index === sounds.length - 1) {
                setTimeout(() => { widget.skip(0); }, 100);
            }
        });
    });
});

// ==========================================
// 5. TELA DE BLOQUEIO (MediaSession)
// ==========================================
function atualizarMediaSession(sound) {
    if ('mediaSession' in navigator) {
        const capa = sound.artwork_url ? sound.artwork_url.replace("-large", "-t500x500") : "";
        navigator.mediaSession.metadata = new MediaMetadata({
            title: sound.title,
            artist: "Colo de Deus",
            album: "CloudCast",
            artwork: [{ src: capa, sizes: "500x500", type: "image/jpg" }]
        });

        navigator.mediaSession.setActionHandler('play', () => { widget.play(); });
        navigator.mediaSession.setActionHandler('pause', () => { widget.pause(); });
        navigator.mediaSession.setActionHandler('previoustrack', () => { widget.prev(); });
        navigator.mediaSession.setActionHandler('nexttrack', () => { widget.next(); });
        navigator.mediaSession.setActionHandler('seekbackward', null);
        navigator.mediaSession.setActionHandler('seekforward', null);
    }
}

// ==========================================
// 6. LITA DE MUSICAS DO ÁLBUM
// ==========================================
function atualizarPlaylistVisual() {
    const playlistView = document.getElementById("playlistView");
    if (!playlistView) return;

    widget.getSounds((sounds) => {
        widget.getCurrentSoundIndex((currentIndex) => {
            playlistView.innerHTML = ""; // Limpa a lista

            sounds.forEach((sound, index) => {
                const li = document.createElement("li");
                
                // 1. Destaque da música ativa
                if (index === currentIndex) {
                    li.className = "active-track"; // Usa a classe que está no seu CSS
                }

                // Conteúdo da linha (Nome da música)
                const textSpan = document.createElement("span");
                textSpan.innerText = (index + 1) + ". " + sound.title;
                li.appendChild(textSpan);

                // 2. Adiciona as barrinhas se for a música atual
                if (index === currentIndex) {
                    const eq = document.createElement("div");
                    eq.className = "now-playing-equalizer"; // Classe que anima as barras
                    eq.innerHTML = "<span></span><span></span><span></span>";
                    li.appendChild(eq);
                }

                // Clique para trocar de música
                li.onclick = () => {
                    widget.skip(index);
                };

                playlistView.appendChild(li);
            });
        });
    });
}
// ATENÇÃO: Adicione a chamada desta função dentro do seu monitorarMusica:
widget.bind(SC.Widget.Events.PLAY, () => {
    atualizarPlaylistVisual(); // Isso faz a lista atualizar quando a música muda
    // ... resto do seu código de play
});