const game = new Game();
game.init();

function _uiSound(name) {
  return () => { if (AUDIO) AUDIO.play(name); };
}

document.querySelectorAll('.btn, .ws-btn, .ms-btn').forEach(el => {
  el.addEventListener('mouseenter', _uiSound('ui_hover'));
});

/* ---- タイトル画面 ---- */

document.getElementById('btn-host').addEventListener('click', async () => {
  const name = document.getElementById('player-name-input').value.trim() || 'Player';
  document.getElementById('title-status').textContent = '⏳ Creating room...';
  document.getElementById('host-section').style.display = '';
  document.getElementById('join-section').style.display = 'none';
  try {
    const roomId = await game.network.createRoom();
    game.localId = roomId;
    game.isHost = true;
    game.addPlayer(roomId, PLAYER_COLORS[0], name);
    const me = game.players.get(roomId);
    if (me) { me.weapon = game.loadoutWeapon; me.lastFireTime = 0; }
    game.clientPassives.set(roomId, game.loadoutPassive);
    if (game.passiveManager) {
      game.passiveManager.assignPassive(roomId, game.loadoutPassive);
    }
    document.getElementById('room-id-display').textContent = roomId;
    document.getElementById('host-status').textContent = 'Waiting for players to join...';
    document.getElementById('title-status').textContent = 'Room created! Share the ID above';
    game.network.connected = true;
    game.onConnected();
    game.setState(GameState.LOBBY);
  } catch (err) {
    document.getElementById('title-status').textContent = '❌ Error: ' + err.message;
    document.getElementById('host-section').style.display = 'none';
  }
});

document.getElementById('btn-join').addEventListener('click', () => {
  document.getElementById('join-section').style.display = '';
  document.getElementById('host-section').style.display = 'none';
  document.getElementById('title-status').textContent = 'Enter the host\'s room ID';
});

document.getElementById('btn-join-cancel').addEventListener('click', () => {
  document.getElementById('join-section').style.display = 'none';
  document.getElementById('title-status').textContent = 'Click Host or Join to start';
});

document.getElementById('btn-join-room').addEventListener('click', async () => {
  let roomId = document.getElementById('room-id-input').value.trim().toUpperCase();
  if (!roomId.startsWith('NEON-')) roomId = 'NEON-' + roomId;
  if (roomId === 'NEON-') return;
  const playerName = document.getElementById('player-name-input').value.trim() || 'Player';
  document.getElementById('title-status').textContent = '⏳ Joining room...';
  try {
    await game.network.joinRoom(roomId, playerName);
    document.getElementById('title-status').textContent = '🔗 Connected!';
  } catch (err) {
    document.getElementById('title-status').textContent = '❌ Error: ' + err.message;
  }
});

document.getElementById('player-name-input').addEventListener('input', () => {
  const name = document.getElementById('player-name-input').value.trim() || 'Player';
  const me = game.players.get(game.localId);
  if (me) {
    me.name = name;
    if (game.gameState === GameState.LOBBY) game._updateLobbyUI();
    game.network.sendNameChange(name);
  }
});

/* ---- タイトル画面: Settings ---- */
document.getElementById('btn-title-settings').addEventListener('click', () => {
  _uiSound('ui_click')();
  document.getElementById('settings-panel').style.display = 'flex';
});

/* ---- ロビー ---- */

document.getElementById('btn-start-game').addEventListener('click', () => {
  if (document.getElementById('btn-start-game').disabled) return;
  _uiSound('ui_start')();
  game._createArena(game.selectedMap);
  game.network.broadcast({ type: 'game_start', map: game.selectedMap });
  game.setState(GameState.COUNTDOWN);
});

document.getElementById('btn-ready').addEventListener('click', () => {
  const btn = document.getElementById('btn-ready');
  const isReady = btn.dataset.ready !== 'true';
  if (AUDIO) AUDIO.play(isReady ? 'ui_ready' : 'ui_click');
  btn.dataset.ready = isReady ? 'true' : 'false';
  btn.textContent = isReady ? '✔ READY' : '▶ READY';
  btn.classList.toggle('btn-secondary', !isReady);
  btn.classList.toggle('btn-primary', isReady);
  game.network.sendReady(isReady);
  game._updateLobbyUI();
});

function setupWeaponNav(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.ws-btn');
    if (!btn) return;
    const dir = btn.classList.contains('ws-prev') ? 'prev' : 'next';
    game._changeWeapon(dir);
  });
}
setupWeaponNav('lobby-weapon-selector');
setupWeaponNav('death-weapon-selector');

function setupPassiveNav(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.ps-btn');
    if (!btn) return;
    const dir = btn.classList.contains('ps-prev') ? 'prev' : 'next';
    game._changePassive(dir);
  });
}
setupPassiveNav('lobby-passive-selector');
setupPassiveNav('death-passive-selector');

document.getElementById('respawn-btn').addEventListener('click', () => {
  if (game.respawnReady && !game.respawnRequested) {
    _uiSound('ui_click')();
    game._requestRespawn();
  }
});

document.getElementById('map-prev').addEventListener('click', () => {
  if (game.network.isHost) game._changeMap('prev');
});
document.getElementById('map-next').addEventListener('click', () => {
  if (game.network.isHost) game._changeMap('next');
});

document.getElementById('btn-copy-room').addEventListener('click', () => {
  _uiSound('ui_copy')();
  const text = document.getElementById('room-id-display').textContent;
  navigator.clipboard.writeText(text).catch(() => {});
  document.getElementById('title-status').textContent = '✅ Copied!';
});

document.getElementById('lobby-copy-room').addEventListener('click', () => {
  _uiSound('ui_copy')();
  const text = document.getElementById('lobby-room-id').textContent;
  if (!text || text === '---') return;
  navigator.clipboard.writeText(text).catch(() => {});
  const fb = document.getElementById('lobby-copy-feedback');
  fb.style.display = 'inline';
  setTimeout(() => { fb.style.display = 'none'; }, 2000);
});

/* ---- トレーニング ---- */

document.getElementById('btn-training').addEventListener('click', () => {
  _uiSound('ui_click')();
  if (game.gameState === GameState.TRAINING) return;
  game.network.connected = false;
  game.isHost = false;
  game.localId = 'training';
  document.getElementById('host-section').style.display = 'none';
  document.getElementById('join-section').style.display = 'none';
  game.setState(GameState.TRAINING);
});

document.getElementById('btn-leave-lobby').addEventListener('click', () => {
  game.network.close();
  game.connectionHandled = false;
  game.players.forEach((p, id) => game.removePlayer(id));
  game.projectiles.forEach(p => p.destroy());
  game.projectiles = [];
  game.isHost = false;
  game.clientReady.clear();
  game.clientWeapons.clear();
  if (game.hostAuthority) game.hostAuthority.reset();
  if (game.effectManager) game.effectManager.clear();
  document.getElementById('kill-feed').innerHTML = '';
  document.getElementById('join-section').style.display = 'none';
  document.getElementById('host-section').style.display = 'none';
  game.setState(GameState.TITLE);
});

/* ---- Settings Panel ---- */

const settingsPanel = document.getElementById('settings-panel');
const settingsInner = document.getElementById('settings-inner');

function openSettings() {
  settingsPanel.style.display = 'flex';
  _uiSound('ui_click')();
  _syncSettingsUI();
}

function closeSettings() {
  settingsPanel.style.display = 'none';
  _uiSound('ui_click')();
}

function _syncSettingsUI() {
  const all = SETTINGS.getAll();
  document.querySelectorAll('[data-key]').forEach(el => {
    const key = el.dataset.key;
    const val = all[key];
    if (el.type === 'checkbox') {
      el.checked = !!val;
    } else if (el.tagName === 'SELECT') {
      el.value = String(val);
    } else if (el.type === 'color') {
      el.value = val || '#00f0ff';
    } else if (el.type === 'range') {
      el.value = val;
      const display = document.querySelector(`.settings-value[data-for="${key}"]`);
      if (display) {
        if (key === 'resolutionScale' || key === 'joystickOpacity' || key === 'masterVolume' || key === 'bgmVolume' || key === 'seVolume' || key === 'voiceVolume') {
          display.textContent = val + '%';
        } else if (key === 'uiScale' || key === 'mouseSensitivity' || key === 'mobileSensitivity' || key === 'aimSensitivityMultiplier' || key === 'adsSensitivity') {
          display.textContent = Number(val).toFixed(2);
        } else if (key === 'crosshairSize') {
          display.textContent = Number(val).toFixed(1);
        } else {
          display.textContent = val;
        }
      }
    }
  });
}

document.querySelectorAll('[data-key]').forEach(el => {
  el.addEventListener('input', () => {
    const key = el.dataset.key;
    let val;
    if (el.type === 'checkbox') {
      val = el.checked;
    } else if (el.type === 'number') {
      val = parseFloat(el.value);
    } else {
      val = el.value;
    }
    if (el.type === 'range') val = parseFloat(el.value);
    SETTINGS.set(key, val);
    _applySetting(key, val);
  });
  el.addEventListener('change', () => {
    const key = el.dataset.key;
    let val;
    if (el.type === 'checkbox') {
      val = el.checked;
    } else {
      val = el.value;
    }
    if (el.type === 'range') val = parseFloat(el.value);
    SETTINGS.set(key, val);
    _applySetting(key, val);
  });
});

function _applySetting(key, val) {
  switch (key) {
    case 'masterVolume':
      if (AUDIO) AUDIO.setVolume('master', val / 100);
      break;
    case 'bgmVolume':
      if (AUDIO) AUDIO.setVolume('bgm', val / 100);
      break;
    case 'seVolume':
      if (AUDIO) {
        AUDIO.setVolume('ui', val / 100);
        AUDIO.setVolume('weapon', val / 100);
        AUDIO.setVolume('explosion', val / 100);
        AUDIO.setVolume('player', val / 100);
      }
      break;
    case 'voiceVolume':
      if (AUDIO) AUDIO.setVolume('voice', val / 100);
      break;
    case 'fov':
      if (game.camera) game.camera.fov = Number(val);
      if (game.camera) game.camera.updateProjectionMatrix();
      break;
    case 'crosshairSize': {
      const ch = document.getElementById('crosshair');
      if (ch) ch.style.transform = `translate(-50%, -50%) scale(${val})`;
      break;
    }
    case 'crosshairColor': {
      const ch = document.getElementById('crosshair');
      if (ch) ch.style.setProperty('--ch-color', val);
      const dot = document.getElementById('crosshair-dot');
      if (dot) dot.style.background = val;
      break;
    }
    case 'showFps': {
      let fpsEl = document.getElementById('fps-counter');
      if (val) {
        if (!fpsEl) {
          fpsEl = document.createElement('div');
          fpsEl.id = 'fps-counter';
          fpsEl.style.cssText = 'position:fixed;top:10px;right:60px;z-index:60;font-family:Orbitron,monospace;font-size:0.6em;color:#888;pointer-events:none;';
          document.body.appendChild(fpsEl);
        }
        fpsEl.style.display = '';
        game._showFps = true;
      } else {
        if (fpsEl) fpsEl.style.display = 'none';
        game._showFps = false;
      }
      break;
    }
    case 'showPing': {
      let pingEl = document.getElementById('ping-display');
      if (val) {
        if (!pingEl) {
          pingEl = document.createElement('div');
          pingEl.id = 'ping-display';
          pingEl.style.cssText = 'position:fixed;top:10px;right:110px;z-index:60;font-family:Orbitron,monospace;font-size:0.6em;color:#888;pointer-events:none;';
          document.body.appendChild(pingEl);
        }
        pingEl.style.display = '';
      } else {
        if (pingEl) pingEl.style.display = 'none';
      }
      break;
    }
    case 'graphicsQuality':
    case 'resolutionScale':
    case 'shadows':
    case 'postEffects':
    case 'antialias':
    case 'fpsLimit':
      if (game._applyGraphicsSettings) game._applyGraphicsSettings();
      break;
    case 'uiScale':
      document.getElementById('hud').style.fontSize = (val * 100) + '%';
      break;
    case 'mouseSensitivity':
    case 'invertY':
      if (game.input) {
        game.input._settingsDirty = true;
      }
      break;
    case 'language':
      break;
  }
}

/* ---- Settings: Tab switching ---- */
document.querySelectorAll('.settings-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.settings-tab-content').forEach(c => c.classList.remove('active'));
    const target = document.getElementById('settings-' + tab.dataset.tab);
    if (target) target.classList.add('active');
  });
});

document.getElementById('btn-settings-close').addEventListener('click', closeSettings);

document.getElementById('btn-settings-reset').addEventListener('click', () => {
  SETTINGS.reset();
  _syncSettingsUI();
  for (const [key, val] of Object.entries(SETTINGS.getAll())) {
    _applySetting(key, val);
  }
  _uiSound('ui_click')();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && settingsPanel.style.display === 'flex') {
    closeSettings();
    e.preventDefault();
  }
});

/* ---- Settings from lobby ---- */
document.getElementById('btn-settings').addEventListener('click', openSettings);

/* ---- フルスクリーン ---- */
document.getElementById('btn-fullscreen').addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});

/* ---- 画面向き検出 ---- */
function _checkOrientation() {
  const overlay = document.getElementById('orientation-overlay');
  if (!overlay) return;
  const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
  if (!isMobile) { overlay.style.display = 'none'; return; }
  const isPortrait = window.innerHeight > window.innerWidth;
  overlay.style.display = isPortrait ? '' : 'none';
}
window.addEventListener('resize', _checkOrientation);
window.addEventListener('orientationchange', () => {
  setTimeout(_checkOrientation, 300);
});
_checkOrientation();

if (/Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024)) {
  document.getElementById('btn-fullscreen').style.display = '';
}

window.addEventListener('beforeunload', () => {
  game.network.close();
});

/* ---- Apply settings on startup ---- */
(function applyStartupSettings() {
  const all = SETTINGS.getAll();
  for (const [key, val] of Object.entries(all)) {
    _applySetting(key, val);
  }
  if (game._applyGraphicsSettings) game._applyGraphicsSettings();
  _syncSettingsUI();
})();
