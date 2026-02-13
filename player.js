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
const btnNext = document.getElementById('btnNext');
const btnPrev = document.getElementById('btnPrev');

let isDragging = false;

// Áudio silencioso para manter o player vivo no Android/iOS
const audioFix = new Audio("https://raw.githubusercontent.com/anars/blank-audio/master/10-seconds-of-silence.mp3");
audioFix.loop = true;
audioFix.volume = 0.01;

// ==========================================
// 2. TELA SPLASH
// ==========================================
function gerenciarSplash() {
    const splash = document.getElementById("splash-screen");
    if (splash) {
        setTimeout(() => {
            splash.style.transition = "opacity 0.6s ease";
            splash.style.opacity = "0";
            setTimeout(() => { splash.style.display = "none"; }, 600);
        }, 2500);
    }
}
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

function destacarBotao(botaoId) {
    const btn = document.getElementById(botaoId);
    if (!btn) return;
    btn.classList.add('btn-highlight');
    setTimeout(() => btn.classList.remove('btn-highlight'), 400);
}

// Botão Play/Pause
btnTogglePlay.onclick = (e) => {
    e.preventDefault();
    destacarBotao('btnTogglePlay');
    widget.isPaused((paused) => {
        if (paused) {
            audioFix.play().catch(() => {});
            widget.play();
        } else {
            widget.pause();
        }
    });
};

// Botão Próximo
btnNext.onclick = (e) => {
    e.preventDefault();
    destacarBotao('btnNext');
    audioFix.play().catch(() => {});
    widget.getSounds((sounds) => {
        widget.getCurrentSoundIndex((index) => {
            if (index === sounds.length - 1) {
                widget.skip(0);
            } else {
                widget.next();
            }
        });
    });
};

// Botão Anterior
btnPrev.onclick = (e) => {
    e.preventDefault();
    destacarBotao('btnPrev');
    audioFix.play().catch(() => {});
    widget.getCurrentSoundIndex((index) => {
        if (index === 0) {
            widget.getSounds((sounds) => {
                widget.skip(sounds.length - 1);
            });
        } else {
            widget.prev();
        }
    });
};

// ==========================================
// 5. EVENTOS DO WIDGET
// ==========================================

widget.bind(SC.Widget.Events.PLAY, () => {
    widget.getCurrentSound((sound) => {
        if (sound) {
            statusDisplay.innerText = sound.title;
            document.title = "▶ " + sound.title;
            atualizarMediaSession(sound);
            atualizarPlaylistVisual(); 
        }
    });
    
    // Ativa animação das barrinhas
    const eq = document.querySelector('.now-playing-equalizer');
    if (eq) eq.classList.remove('paused');

    if (playIcon) playIcon.className = "fas fa-pause";
});

widget.bind(SC.Widget.Events.PAUSE, () => {
    document.title = "CloudCast Player";
    
    // Pausa animação das barrinhas
    const eq = document.querySelector('.now-playing-equalizer');
    if (eq) eq.classList.add('paused');

    if (playIcon) playIcon.className = "fas fa-play";
});

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

widget.bind(SC.Widget.Events.FINISH, () => {
    widget.getSounds((sounds) => {
        widget.getCurrentSoundIndex((index) => {
            if (index === sounds.length - 1) {
                setTimeout(() => { 
                    widget.skip(0); 
                    widget.play(); 
                }, 100);
            } else {
                widget.next();
            }
        });
    });
});

// ==========================================
// 6. TELA DE BLOQUEIO
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
        navigator.mediaSession.setActionHandler('previoustrack', () => { btnPrev.click(); });
        navigator.mediaSession.setActionHandler('nexttrack', () => { btnNext.click(); });
        navigator.mediaSession.setActionHandler('seekbackward', null);
        navigator.mediaSession.setActionHandler('seekforward', null);
    }
}

// ==========================================
// 7. PLAYLIST VISUAL
// ==========================================
function atualizarPlaylistVisual() {
    const playlistView = document.getElementById("playlistView");
    if (!playlistView) return;

    widget.getSounds((sounds) => {
        widget.getCurrentSoundIndex((currentIndex) => {
            playlistView.innerHTML = ""; 
            sounds.forEach((sound, index) => {
                const li = document.createElement("li");
                if (index === currentIndex) {
                    li.className = "active-track";
                }

                const textSpan = document.createElement("span");
                textSpan.innerText = (index + 1) + ". " + sound.title;
                li.appendChild(textSpan);

                if (index === currentIndex) {
                    const eq = document.createElement("div");
                    eq.className = "now-playing-equalizer";
                    eq.innerHTML = "<span></span><span></span><span></span>";
                    
                    // Se estiver pausado ao criar a lista, já aplica a classe 'paused'
                    widget.isPaused((paused) => {
                        if (paused) eq.classList.add('paused');
                    });

                    li.appendChild(eq);
                }

                li.onclick = () => { widget.skip(index); };
                playlistView.appendChild(li);
            });
        });
    });
}