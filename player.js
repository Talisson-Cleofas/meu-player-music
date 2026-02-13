// 1. Pegamos os elementos do seu HTML pelos IDs
const widgetIframe = document.getElementById("sc-widget");
const widget = SC.Widget(widgetIframe); // Ativa a API do SoundCloud no seu Iframe

const btnTogglePlay = document.getElementById("btnTogglePlay"); // Botão Play/Pause
const playIcon = document.getElementById("playIcon");           // Ícone dentro do botão
const statusDisplay = document.getElementById("status");       // Texto da música atual

// O "AudioFix" é um áudio silencioso que roda no fundo.
// Ele serve para o Android não "matar" o player quando você bloqueia a tela.
const audioFix = new Audio("https://raw.githubusercontent.com/anars/blank-audio/master/10-seconds-of-silence.mp3");
audioFix.loop = true;

// Barra de Progresso 
let isDragging = false; 
const progressSlider = document.getElementById("progressSlider");
const currentTimeDisplay = document.getElementById("currentTime");
const totalDurationDisplay = document.getElementById("totalDuration");

// Função para esconder a tela de carregamento (Splash)
function gerenciarSplash() {
  const splash = document.getElementById("splash-screen");
  
  if (splash) {
    // Definimos um tempo de 2.5 segundos (2500ms)
    setTimeout(() => {
      splash.style.opacity = "0"; // Faz o efeito de sumir suavemente
      
      // Depois que a animação de sumir termina (600ms), removemos do layout
      setTimeout(() => {
        splash.style.display = "none";
      }, 600);
      
    }, 2500);
  }
}

// Chamamos a função para ela começar a contar assim que a página carregar
gerenciarSplash();


// Função para Alternar Play e Pause
function togglePlayback() {
  // Perguntamos ao SoundCloud: "Você está pausado agora?"
  widget.isPaused((paused) => {
    if (paused) {
      // Se estiver pausado:
      audioFix.play(); // 1. Ativamos o áudio silencioso (importante para o Android)
      widget.play();   // 2. Mandamos o SoundCloud tocar
      playIcon.className = "fas fa-pause"; // 3. Mudamos o ícone para 'Pause'
    } else {
      // Se já estiver tocando:
      widget.pause();  // 1. Mandamos o SoundCloud parar
      playIcon.className = "fas fa-play";  // 2. Mudamos o ícone para 'Play'
    }
  });
}


// CARREGA OS ÁLBUNS E CRIA OS BOTÕES DINAMICAMENTE


// Vinculamos a função ao clique do seu botão de Play no HTML
btnTogglePlay.onclick = togglePlayback;

// 1. Sua lista de álbuns (exatamente como você tinha)
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

// Função que carrega a URL no player (Versão Manual Force)
function carregarAlbum(url) {
  statusDisplay.innerText = "Sintonizando...";
  
  // 1. Ativamos o áudio silencioso para o Android liberar o som
  audioFix.play().catch(() => {});

  // 2. Limpamos a URL do SoundCloud de espaços extras
  const linkLimpo = url.trim();

  // 3. Carregamos a nova URL
  widget.load(linkLimpo, {
    auto_play: true,
    show_artwork: false
  });

  // 4. Em vez de confiar no callback do load, usamos o bind de READY
  // Ele avisa assim que o player "acordar" com a música nova
  widget.bind(SC.Widget.Events.READY, () => {
    console.log("Player pronto com novo álbum!");
    
    // Pequeno tempo para o player se estabilizar
    setTimeout(() => {
      widget.play();
      if (playIcon) playIcon.className = "fas fa-pause";
      
      // Aqui vamos buscar o nome da música (opcional agora, mas bom para teste)
      widget.getCurrentSound((sound) => {
        if (sound) {
          statusDisplay.innerText = sound.title;
        }
      });
    }, 1000);
    
    // IMPORTANTE: Desativamos o bind após usar para não acumular
    widget.unbind(SC.Widget.Events.READY);
  });
}

// 3. Função que desenha os botões na tela
function desenharBotoes() {
  const container = document.getElementById("albumButtons");
  if (!container) return;

  meusAlbuns.forEach(album => {
    const botao = document.createElement("button");
    botao.className = "btn-album";
    botao.innerText = album.nome;
    
    // Quando clicar no botão, chama a função de carregar
    botao.onclick = () => carregarAlbum(album.url);
    
    container.appendChild(botao);
  });
}

// Chamamos a função para os botões aparecerem
desenharBotoes();

//FIM DO BLOCO DOS ALBUNS

//Função: Atualizar Nome da Música e Título

// Função para monitorar a música atual
function monitorarMusica() {
  // O evento PLAY dispara toda vez que uma música começa a tocar
  widget.bind(SC.Widget.Events.PLAY, () => {
    
    // Pedimos ao Widget as informações da música atual (Sound Object)
    widget.getCurrentSound((sound) => {
      if (sound) {
        // 1. Atualiza o texto na sua tela (o ID 'status')
        statusDisplay.innerText = sound.title;
        
        // 2. Atualiza o título da aba do navegador
        // O caractere '▶' ajuda a identificar qual aba está emitindo som
        document.title = "▶ " + sound.title;
        
        console.log("Tocando agora: " + sound.title);
      }
    });
    
    // Aproveitamos para garantir que o ícone do botão seja 'Pause'
    if (playIcon) playIcon.className = "fas fa-pause";
  });

  // Também monitoramos o PAUSE para limpar o título da aba
  widget.bind(SC.Widget.Events.PAUSE, () => {
    document.title = "CloudCast Player"; // Volta ao nome original
    if (playIcon) playIcon.className = "fas fa-play";
  });
}

// Chamamos a função para ela ficar "vigiando" o player
monitorarMusica();

//FIM DO BLOCO DE NOME DA MÚSICA E TÍTULO

//BARRA DE PROGRESSO

// 1. Função para converter Milissegundos em Minutos:Segundos (Ex: 180000ms -> 3:00)
function formatarTempo(ms) {
  if (!ms || isNaN(ms)) return "0:00";
  const totalSegundos = Math.floor(ms / 1000);
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;
  return `${minutos}:${segundos < 10 ? "0" : ""}${segundos}`;
}

// 2. Monitorar o progresso da música
function configurarBarraProgresso() {
  // O evento PLAY_PROGRESS acontece o tempo todo enquanto a música toca
  widget.bind(SC.Widget.Events.PLAY_PROGRESS, (data) => {
    // Se o usuário NÃO estiver arrastando a barra, nós a atualizamos
    if (!isDragging && progressSlider) {
      const posicaoAtual = data.currentPosition; // tempo atual
      
      widget.getDuration((duracaoTotal) => {
        if (duracaoTotal > 0) {
          // Calculamos a porcentagem (0 a 100)
          const porcentagem = (posicaoAtual / duracaoTotal) * 100;
          progressSlider.value = porcentagem;
          
          // Atualizamos os textos de tempo na tela
          if (currentTimeDisplay) currentTimeDisplay.innerText = formatarTempo(posicaoAtual);
          if (totalDurationDisplay) totalDurationDisplay.innerText = formatarTempo(duracaoTotal);
        }
      });
    }
  });

  // 3. Permitir que o usuário "arraste" a música
  if (progressSlider) {
    // Quando o usuário começa a arrastar
    progressSlider.oninput = () => { isDragging = true; };

    // Quando o usuário solta a barra
    progressSlider.onchange = () => {
      widget.getDuration((duracaoTotal) => {
        // Calculamos onde ele soltou e mandamos o player para lá
        const novoTempoMs = (progressSlider.value / 100) * duracaoTotal;
        widget.seekTo(novoTempoMs);
        isDragging = false;
      });
    };
  }
}

// Ativamos a configuração
configurarBarraProgresso();

//FIM DO BLOCO DE BARRA DE PROGRESSO

//Próximo e Anterior e pular automaticamente

// 1. Configura os botões de Próximo e Anterior
function configurarBotoesNavegacao() {
  const btnNext = document.getElementById("btnNext");
  const btnPrev = document.getElementById("btnPrev");

  if (btnNext) {
    btnNext.onclick = () => {
      audioFix.play().catch(() => {}); // Mantém o foco do áudio
      widget.next(); // Comando nativo do SoundCloud para próxima
    };
  }

  if (btnPrev) {
    btnPrev.onclick = () => {
      audioFix.play().catch(() => {}); // Mantém o foco do áudio
      widget.prev(); // Comando nativo do SoundCloud para anterior
    };
  }
}

// 2. Lógica para quando a música ACABA (Auto-play e Loop do Álbum)
let travaDePulo = false; // Variável para controlar o tempo entre pulos

function configurarFimDaMusica() {
  // Vamos ouvir o evento de PLAY para detectar quando uma nova música começa
  widget.bind(SC.Widget.Events.PLAY, () => {
    widget.getSounds((sounds) => {
      widget.getCurrentSoundIndex((index) => {
        // Se o SoundCloud acabou de pular para uma música e é a primeira do álbum...
        // ...mas ele veio da última, não fazemos nada, ele já fez o ciclo.
        console.log("Tocando faixa índice: " + index);
      });
    });
  });

  // No FINISH, vamos agir APENAS se for a última música do álbum
  widget.bind(SC.Widget.Events.FINISH, () => {
    widget.getSounds((sounds) => {
      widget.getCurrentSoundIndex((index) => {
        // Se for a ÚLTIMA música do álbum
        if (index === sounds.length - 1) {
          console.log("Fim do álbum atingido. Reiniciando...");
          setTimeout(() => {
            widget.skip(0); // Força a volta para a primeira música
          }, 100);
        }
        // IMPORTANTE: Não colocamos o comando 'widget.next()' aqui.
        // O próprio player do SoundCloud já faz isso sozinho por causa do 
        // parâmetro '&continue=true' que está no seu Iframe no HTML.
      });
    });
  });
}
// Ativamos as funções
configurarBotoesNavegacao();
configurarFimDaMusica();

function configurarTelaDeBloqueio() {
  if ('mediaSession' in navigator) {
    
    // Toda vez que a música mudar, atualizamos os dados no Android
    widget.bind(SC.Widget.Events.PLAY, () => {
      widget.getCurrentSound((sound) => {
        if (sound) {
          const capa = sound.artwork_url ? sound.artwork_url.replace("-large", "-t500x500") : "";
          
          navigator.mediaSession.metadata = new MediaMetadata({
            title: sound.title,
            artist: "Colo de Deus",
            album: "CloudCast Player",
            artwork: [{ src: capa, sizes: "500x500", type: "image/jpg" }]
          });
        }
      });
    });

    // Configura os botões da tela de bloqueio
    navigator.mediaSession.setActionHandler('play', () => {
      audioFix.play();
      widget.play();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      widget.pause();
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      widget.prev();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      widget.next();
    });
  }
}

// Ativamos a configuração
configurarTelaDeBloqueio();
