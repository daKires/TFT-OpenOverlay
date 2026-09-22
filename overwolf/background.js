// Background page do pacote Overwolf (JS puro, só usa a API global `overwolf`).
//
// Responsabilidades (e SÓ elas):
//   1) detectar o TFT rodando (gameId 21570);
//   2) assinar as features do GEP com RETRY (o GEP nem sempre está pronto de 1ª);
//   3) abrir a janela 'overlay' quando o TFT está rodando e escondê-la quando fecha;
//   4) registrar o hotkey de mostrar/esconder o overlay.
//
// NÃO faz mapeamento nenhum — quem lê o estado e chama o cérebro é a UI React
// (src/web), via src/integrations/overwolf.ts.
//
// A API `overwolf` é INJETADA pelo cliente Overwolf em runtime (não é pacote npm).

(function () {
  'use strict';

  var TFT_GAME_ID = 21570; // id do TFT no Overwolf
  var TFT_CLASS_ID = 2157; // gameId / 10 (checagem alternativa)
  var REQUIRED_FEATURES = ['me', 'board', 'bench', 'match_info'];
  var RETRY_MS = 2000;
  var HOTKEY_NAME = 'tft_overlay_toggle';

  var featuresReady = false;
  var retryTimer = null;
  var overlayVisible = false;

  // -------------------------------------------------------------------------
  // Detecção do jogo
  // -------------------------------------------------------------------------

  // A alguns callbacks chegam aninhados em `gameInfo`; normaliza os dois formatos.
  function extractGameInfo(info) {
    if (!info) return null;
    if (info.gameInfo && typeof info.gameInfo === 'object') return info.gameInfo;
    return info;
  }

  // True se o id corresponde ao TFT: id === 21570 OU id / 10 === 2157.
  function isTftId(id) {
    if (typeof id !== 'number' || !isFinite(id)) return false;
    return id === TFT_GAME_ID || id / 10 === TFT_CLASS_ID;
  }

  function isTftGame(gameInfo) {
    if (!gameInfo) return false;
    var id = typeof gameInfo.id === 'number' ? gameInfo.id : gameInfo.gameId;
    return isTftId(id);
  }

  // -------------------------------------------------------------------------
  // Assinatura das features do GEP (com retry)
  // -------------------------------------------------------------------------

  function setFeatures() {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    try {
      overwolf.games.events.setRequiredFeatures(REQUIRED_FEATURES, function (result) {
        if (result && result.status === 'success') {
          featuresReady = true;
          return;
        }
        // Falha (GEP ainda não pronto): tenta de novo daqui a ~2s.
        retryTimer = setTimeout(setFeatures, RETRY_MS);
      });
    } catch (e) {
      retryTimer = setTimeout(setFeatures, RETRY_MS);
    }
  }

  // -------------------------------------------------------------------------
  // Janela de overlay
  // -------------------------------------------------------------------------

  function withOverlayWindow(cb) {
    overwolf.windows.obtainDeclaredWindow('overlay', function (result) {
      if (result && result.status === 'success' && result.window && result.window.id) {
        cb(result.window.id);
      }
    });
  }

  function showOverlay() {
    withOverlayWindow(function (id) {
      overwolf.windows.restore(id, function () {
        overlayVisible = true;
      });
    });
  }

  function hideOverlay() {
    withOverlayWindow(function (id) {
      overwolf.windows.hide(id, function () {
        overlayVisible = false;
      });
    });
  }

  function toggleOverlay() {
    if (overlayVisible) hideOverlay();
    else showOverlay();
  }

  // -------------------------------------------------------------------------
  // Reação às mudanças de estado do jogo
  // -------------------------------------------------------------------------

  function onGameInfoUpdated(info) {
    var gameInfo = extractGameInfo(info);
    if (!isTftGame(gameInfo)) return; // não é o TFT: ignora

    var running = gameInfo.isRunning !== false;
    if (running) {
      if (!featuresReady) setFeatures();
      showOverlay();
    } else {
      hideOverlay();
    }
  }

  // -------------------------------------------------------------------------
  // Hotkey
  // -------------------------------------------------------------------------

  function registerHotkey() {
    var onPressed = null;
    if (overwolf.settings && overwolf.settings.hotkeys && overwolf.settings.hotkeys.onPressed) {
      onPressed = overwolf.settings.hotkeys.onPressed;
    } else if (overwolf.hotkeys && overwolf.hotkeys.onPressed) {
      onPressed = overwolf.hotkeys.onPressed;
    }
    if (!onPressed || typeof onPressed.addListener !== 'function') return;

    onPressed.addListener(function (event) {
      if (event && event.name === HOTKEY_NAME) toggleOverlay();
    });
  }

  // -------------------------------------------------------------------------
  // Inicialização
  // -------------------------------------------------------------------------

  function init() {
    overwolf.games.onGameInfoUpdated.addListener(onGameInfoUpdated);
    registerHotkey();

    // Snapshot inicial: se o TFT já estiver aberto quando o app inicia.
    try {
      overwolf.games.getRunningGameInfo(function (info) {
        onGameInfoUpdated(info);
      });
    } catch (e) {
      // getRunningGameInfo pode não existir em versões antigas: segue só por eventos.
    }
  }

  if (typeof overwolf !== 'undefined' && overwolf.games) {
    init();
  }
})();
