/* ============================================================
   NEON ARENA - エントリポイント＆UIイベントハンドラ
   グローバルな game インスタンス、タイトル/ロビー/設定UI
   ============================================================ */

const game = new Game();
game.init();

/* UI効果音再生のラッパー */
function _uiSound(name) {
  return () => { if (AUDIO) AUDIO.play(name); };
}

/* 全ボタンにホバー音を割り当て */
document.querySelectorAll('.btn, .ws-btn, .ms-btn').forEach(el => {
  el.addEventListener('mouseenter', _uiSound('ui_hover'));
});

/* ============================================================
   タイトル画面イベント
   ============================================================ */

/* ホスト：ルーム作成 */
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

/* 参加：ルームID入力画面を表示 */
document.getElementById('btn-join').addEventListener('click', () => {
  document.getElementById('join-section').style.display = '';
  document.getElementById('host-section').style.display = 'none';
  document.getElementById('title-status').textContent = 'Enter the host\'s room ID';
});

/* 参加キャンセル */
document.getElementById('btn-join-cancel').addEventListener('click', () => {
  document.getElementById('join-section').style.display = 'none';
  document.getElementById('title-status').textContent = 'Click Host or Join to start';
});

/* ルーム参加実行 */
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

/* プレイヤー名変更を即時同期 */
document.getElementById('player-name-input').addEventListener('input', () => {
  const name = document.getElementById('player-name-input').value.trim() || 'Player';
  const me = game.players.get(game.localId);
  if (me) {
    me.name = name;
    if (game.gameState === GameState.LOBBY) game._updateLobbyUI();
    game.network.sendNameChange(name);
  }
});

/* ---- 設定パネル ---- */
document.getElementById('btn-title-settings').addEventListener('click', () => {
  _uiSound('ui_click')();
  document.getElementById('settings-panel').style.display = 'flex';
});

/* ============================================================
   ロビー画面（試合開始・準備・マップ・武器選択）
   ============================================================ */

/* ゲーム開始（ホストのみ） */
document.getElementById('btn-start-game').addEventListener('click', () => {
  if (document.getElementById('btn-start-game').disabled) return;
  _uiSound('ui_start')();
  game._createArena(game.selectedMap);
  game.network.broadcast({ type: 'game_start', map: game.selectedMap });
  game.setState(GameState.COUNTDOWN);
});

/* 準備完了/キャンセル */
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

/* 武器選択ナビゲーションのセットアップ */
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

/* パッシブ選択ナビゲーションのセットアップ */
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

/* リスポーンボタン */
document.getElementById('respawn-btn').addEventListener('click', () => {
  if (game.respawnReady && !game.respawnRequested) {
    _uiSound('ui_click')();
    game._requestRespawn();
  }
});

/* マップ選択前/次（ホストのみ） */
document.getElementById('map-prev').addEventListener('click', () => {
  if (game.network.isHost) game._changeMap('prev');
});
document.getElementById('map-next').addEventListener('click', () => {
  if (game.network.isHost) game._changeMap('next');
});

/* ルームIDコピー（タイトル画面） */
document.getElementById('btn-copy-room').addEventListener('click', () => {
  _uiSound('ui_copy')();
  const text = document.getElementById('room-id-display').textContent;
  navigator.clipboard.writeText(text).catch(() => {});
  document.getElementById('title-status').textContent = '✅ Copied!';
});

/* ルームIDコピー（ロビー画面） */
document.getElementById('lobby-copy-room').addEventListener('click', () => {
  _uiSound('ui_copy')();
  const text = document.getElementById('lobby-room-id').textContent;
  if (!text || text === '---') return;
  navigator.clipboard.writeText(text).catch(() => {});
  const fb = document.getElementById('lobby-copy-feedback');
  fb.style.display = 'inline';
  setTimeout(() => { fb.style.display = 'none'; }, 2000);
});

/* ============================================================
   トレーニングモード
   ============================================================ */

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

/* ロビー退出 → タイトル画面へ */
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

/* ============================================================
   設定パネル（全設定項目のUI同期・反映）
   ============================================================ */

const settingsPanel = document.getElementById('settings-panel');
const settingsInner = document.getElementById('settings-inner');

function openSettings() {
  settingsPanel.style.display = 'flex';
  document.body.appendChild(settingsPanel);
  const titleScreen = document.getElementById('title-screen');
  if (titleScreen) titleScreen.style.pointerEvents = 'none';
  _uiSound('ui_click')();
  _syncSettingsUI();
}

/* 設定パネルを閉じてタイトル画面の操作を復帰 */
function closeSettings() {
  settingsPanel.style.display = 'none';
  const titleScreen = document.getElementById('title-screen');
  if (titleScreen) titleScreen.style.pointerEvents = '';
  _uiSound('ui_click')();
}

/* 設定データをUIコントロールに同期 */
function _syncSettingsUI() {
  const all = SETTINGS.getAll();
/* 設定要素の変更イベント → 設定保存＋反映 */
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

/* 個別設定値を即座にゲーム状態に反映 */
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

/* ---- 設定タブ切り替え ---- */
document.querySelectorAll('.settings-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.settings-tab-content').forEach(c => c.classList.remove('active'));
    const target = document.getElementById('settings-' + tab.dataset.tab);
    if (target) target.classList.add('active');
  });
});

/* 設定パネルを閉じる */
document.getElementById('btn-settings-close').addEventListener('click', closeSettings);

/* 設定をデフォルトにリセット */
document.getElementById('btn-settings-reset').addEventListener('click', () => {
  SETTINGS.reset();
  _syncSettingsUI();
  for (const [key, val] of Object.entries(SETTINGS.getAll())) {
    _applySetting(key, val);
  }
  _uiSound('ui_click')();
});

/* Escapeキーで設定パネルを閉じる */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && settingsPanel.style.display === 'flex') {
    closeSettings();
    e.preventDefault();
  }
});

/* ---- ロビーから設定を開く ---- */
document.getElementById('btn-settings').addEventListener('click', openSettings);

/* ---- フルスクリーン切替 ---- */
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
/* 画面向き変更検知 */
window.addEventListener('resize', _checkOrientation);
window.addEventListener('orientationchange', () => {
  setTimeout(_checkOrientation, 300);
});
_checkOrientation();

/* モバイルデバイス判定（画面サイズ＋UA） */
var _isMobileDevice = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);

if (_isMobileDevice) {
  document.getElementById('btn-fullscreen').style.display = '';
}

/* =============================================================
   モバイルボタンレイアウトエディタ
   タッチ操作のFire/Dash/Reloadボタンの位置・サイズ・透明度を編集
   ============================================================= */
var _layoutEditMode = false;
var _layoutDragData = null;
var _layoutDragHandlers = {};

/* モバイルかどうか（画面サイズ＋ゲーム内検出） */
function _isMobile() {
  return _isMobileDevice || (game.input && game.input.isMobile);
}

/* 設定からレイアウトを読み込み（デフォルト値をフォールバック） */
function _getLayoutFromSettings() {
  const saved = SETTINGS.get('mobileButtonLayout');
  const def = SettingsManager.DEFAULTS.mobileButtonLayout;
  return {
    fire: { ...def.fire, ...(saved && saved.fire ? saved.fire : {}) },
    dash: { ...def.dash, ...(saved && saved.dash ? saved.dash : {}) },
    reload: { ...def.reload, ...(saved && saved.reload ? saved.reload : {}) },
  };
}

/* レイアウト設定をエディタのスライダーに反映 */
function _applyLayoutToEditor(layout) {
  ['fire', 'dash', 'reload'].forEach(action => {
    const cfg = layout[action];
    if (!cfg) return;
    const sizeSlider = document.querySelector('.mle-slider[data-btn="' + action + '"][data-prop="size"]');
    const opSlider = document.querySelector('.mle-slider[data-btn="' + action + '"][data-prop="opacity"]');
    const sizeVal = document.querySelector('[data-for="' + action + '-size"]');
    const opVal = document.querySelector('[data-for="' + action + '-opacity"]');
    if (sizeSlider) { sizeSlider.value = cfg.size; }
    if (opSlider) { opSlider.value = cfg.opacity; }
    if (sizeVal) { sizeVal.textContent = cfg.size; }
    if (opVal) { opVal.textContent = cfg.opacity; }
  });
}

/* レイアウト編集：ドラッグ開始 */
function _onLayoutDrag(e, action) {
  if (!_layoutEditMode) return;
  e.preventDefault();
  const btn = e.currentTarget;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX) || (e.touches && e.touches[0].clientX);
  const clientY = e.clientY || (e.changedTouches && e.changedTouches[0].clientY) || (e.touches && e.touches[0].clientY);
  if (clientX == null) return;
  const btnLeft = parseFloat(btn.style.left) || 0;
  const btnTop = parseFloat(btn.style.top) || 0;
  _layoutDragData = {
    action: action,
    btn: btn,
    offsetX: clientX - btnLeft,
    offsetY: clientY - btnTop,
  };
  if (e.pointerId != null) {
    try { btn.setPointerCapture(e.pointerId); } catch (ex) {}
  }
}

/* レイアウト編集：ドラッグ中 */
function _onLayoutMove(e) {
  if (!_layoutDragData) return;
  e.preventDefault();
  const btn = _layoutDragData.btn;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX) || (e.touches && e.touches[0].clientX);
  const clientY = e.clientY || (e.changedTouches && e.changedTouches[0].clientY) || (e.touches && e.touches[0].clientY);
  if (clientX == null) return;
  const btnW = btn.offsetWidth || 80;
  const btnH = btn.offsetHeight || 80;
  let x = clientX - (_layoutDragData.offsetX || 0);
  let y = clientY - (_layoutDragData.offsetY || 0);
  x = Math.max(0, Math.min(w - btnW, x));
  y = Math.max(0, Math.min(h - btnH, y));
  btn.style.left = x + 'px';
  btn.style.top = y + 'px';
  btn.style.right = '';
  btn.style.bottom = '';
}

/* レイアウト編集：ドラッグ終了 */
function _onLayoutDragEnd(e) {
  if (!_layoutDragData) return;
  const action = _layoutDragData.action;
  const btn = _layoutDragData.btn;
  _layoutDragData = null;
  if (action === 'fire') console.log('[MobileUI] Fire button moved');
  else if (action === 'dash') console.log('[MobileUI] Dash button moved');
  else if (action === 'reload') console.log('[MobileUI] Reload button moved');
}

/* レイアウトエディタを開く */
function _openLayoutEditor() {
  console.log('[LayoutEditor] Open');
  _layoutEditMode = true;
  if (game.input) game.input._editingLayout = true;
  const titleScreen = document.getElementById('title-screen');
  if (titleScreen && titleScreen.style.display !== 'none') {
    titleScreen.style.display = 'none';
  }
  if (game.input) {
    if (!game.input._touchControlsCreated) {
      game.input.ensureEditorUI();
    } else {
      game.input._enforceTouchVisibility(true);
    }
  }
  ['fire', 'dash', 'reload'].forEach(a => {
    const el = document.getElementById('touch-' + a);
    if (el) console.log('[LayoutEditor] ' + a.charAt(0).toUpperCase() + a.slice(1) + ' found');
    else console.error('[LayoutEditor] touch-' + a + ' NOT found');
  });
  const layout = _getLayoutFromSettings();
  _applyLayoutToEditor(layout);
  document.getElementById('mobile-layout-editor').style.display = '';
  if (game.input) {
    game.input.firePressed = false;
    game.input.fireClicked = false;
  }
  _bindLayoutDrag();
}

/* レイアウトエディタを閉じる */
function _closeLayoutEditor() {
  _layoutEditMode = false;
  _layoutDragData = null;
  if (game.input) game.input._editingLayout = false;
  const titleScreen = document.getElementById('title-screen');
  if (titleScreen) {
    titleScreen.style.display = '';
  }
  document.getElementById('mobile-layout-editor').style.display = 'none';
  _unbindLayoutDrag();
}

/* ドラッグハンドラを各ボタンにバインド */
function _bindLayoutDrag() {
  _unbindLayoutDrag();
  ['fire', 'dash', 'reload'].forEach(action => {
    const btn = document.getElementById('touch-' + action);
    if (!btn) return;
    btn.style.cursor = 'grab';
    const handler = (e) => _onLayoutDrag(e, action);
    _layoutDragHandlers[action] = handler;
    btn.addEventListener('pointerdown', handler);
    btn.addEventListener('touchstart', handler, { passive: false });
  });
  if (!_layoutDragHandlers._move) {
    _layoutDragHandlers._move = (e) => _onLayoutMove(e);
    _layoutDragHandlers._end = (e) => _onLayoutDragEnd(e);
    document.addEventListener('pointermove', _layoutDragHandlers._move);
    document.addEventListener('touchmove', _layoutDragHandlers._move, { passive: false });
    document.addEventListener('pointerup', _layoutDragHandlers._end);
    document.addEventListener('touchend', _layoutDragHandlers._end);
  }
}

/* ドラッグハンドラを解除 */
function _unbindLayoutDrag() {
  ['fire', 'dash', 'reload'].forEach(action => {
    const btn = document.getElementById('touch-' + action);
    if (!btn) return;
    btn.style.cursor = '';
    const handler = _layoutDragHandlers[action];
    if (handler) {
      btn.removeEventListener('pointerdown', handler);
      btn.removeEventListener('touchstart', handler);
    }
    delete _layoutDragHandlers[action];
  });
}

/* レイアウトを設定に保存 */
function _saveLayout() {
  const layout = _getLayoutFromSettings();
  ['fire', 'dash', 'reload'].forEach(action => {
    if (!layout[action]) layout[action] = { x: 50, y: 50, size: 100, opacity: 100 };
    const btn = document.getElementById('touch-' + action);
    if (btn) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const btnW = btn.offsetWidth || 80;
      const btnH = btn.offsetHeight || 80;
      const left = parseFloat(btn.style.left) || 0;
      const top = parseFloat(btn.style.top) || 0;
      layout[action].x = Math.round(((left + btnW / 2) / w) * 100);
      layout[action].y = Math.round(((top + btnH / 2) / h) * 100);
    }
    const sizeSlider = document.querySelector('.mle-slider[data-btn="' + action + '"][data-prop="size"]');
    const opSlider = document.querySelector('.mle-slider[data-btn="' + action + '"][data-prop="opacity"]');
    if (sizeSlider) layout[action].size = parseInt(sizeSlider.value);
    if (opSlider) layout[action].opacity = parseInt(opSlider.value);
  });
  SETTINGS.set('mobileButtonLayout', layout);
  if (game.input && game.input.applyLayout) {
    game.input.applyLayout();
  }
  console.log('[LayoutEditor] Save complete');
  _closeLayoutEditor();
}

/* レイアウトをデフォルトにリセット */
function _resetLayout() {
  const def = SettingsManager.DEFAULTS.mobileButtonLayout;
  SETTINGS.set('mobileButtonLayout', {
    fire: { ...def.fire },
    dash: { ...def.dash },
    reload: { ...def.reload },
  });
  if (game.input && game.input.applyLayout) {
    game.input.applyLayout();
  }
  _applyLayoutToEditor(SettingsManager.DEFAULTS.mobileButtonLayout);
  console.log('[MobileUI] Layout reset');
}

/* ---- レイアウト編集ボタン ---- */
document.getElementById('btn-layout-edit').addEventListener('click', () => {
  console.log('[LayoutEditor] Button clicked');
  closeSettings();
  _openLayoutEditor();
});

/* ---- レイアウトエディタ保存/戻る ---- */
document.getElementById('mle-confirm').addEventListener('click', _saveLayout);
document.getElementById('mle-back').addEventListener('click', _closeLayoutEditor);


/* ---- リサイズ時にレイアウト再適用 ---- */
window.addEventListener('resize', () => {
  if (_layoutEditMode) return;
  if (game.input && game.input.applyLayout) {
    game.input.applyLayout();
  }
});

/* ---- ボタンごとのサイズ/透明度スライダー ---- */
document.querySelectorAll('.mle-slider').forEach(slider => {
  slider.addEventListener('input', () => {
    const btn = slider.dataset.btn;
    const prop = slider.dataset.prop;
    const val = slider.value;
    const display = document.querySelector('[data-for="' + btn + '-' + prop + '"]');
    if (display) display.textContent = val;
    const layout = _getLayoutFromSettings();
    if (!layout[btn]) layout[btn] = { x: 50, y: 50, size: 100, opacity: 100 };
    layout[btn][prop] = parseInt(val);
    SETTINGS.set('mobileButtonLayout', layout);
    if (game.input && game.input.applyLayout) {
      game.input.applyLayout();
    }
  });
});

/* ページ離脱時にネットワーク切断 */
window.addEventListener('beforeunload', () => {
  game.network.close();
});

/* ---- 起動時に設定を適用 ---- */
(function applyStartupSettings() {
  try {
    const all = SETTINGS.getAll();
    for (const [key, val] of Object.entries(all)) {
      _applySetting(key, val);
    }
    if (game._applyGraphicsSettings) game._applyGraphicsSettings();
    _syncSettingsUI();
    if (_isMobile()) {
      if (game.input && game.input.applyLayout) {
        game.input.applyLayout();
      }
      console.log('[MobileUI] Layout loaded');
    }
  } catch (e) {
    console.warn('[Settings] startup apply error:', e);
  }
})();
