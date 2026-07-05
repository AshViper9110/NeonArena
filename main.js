/* ============================================================
   NEON ARENA - エントリーポイント
   UIイベントバインディング（ゲームロジックはgame.jsに委譲）
   ============================================================ */

const game = new Game();
game.init();

/* ---- タイトル画面 ---- */

/* UI Sounds Helper */
function _uiSound(name) {
  return () => { if (AUDIO) AUDIO.play(name); };
}

/* Hover sounds for buttons */
document.querySelectorAll('.btn, .ws-btn, .ms-btn').forEach(el => {
  el.addEventListener('mouseenter', _uiSound('ui_hover'));
});

/* Host */
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

/* Join */
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

/* 名前変更（常時可能） */
document.getElementById('player-name-input').addEventListener('input', () => {
  const name = document.getElementById('player-name-input').value.trim() || 'Player';
  const me = game.players.get(game.localId);
  if (me) {
    me.name = name;
    if (game.gameState === GameState.LOBBY) game._updateLobbyUI();
    game.network.sendNameChange(name);
  }
});

/* ---- ロビー ---- */

/* ホスト: ゲーム開始 */
document.getElementById('btn-start-game').addEventListener('click', () => {
  if (document.getElementById('btn-start-game').disabled) return;
  _uiSound('ui_start')();
  game._createArena(game.selectedMap);
  game.network.broadcast({ type: 'game_start', map: game.selectedMap });
  game.setState(GameState.COUNTDOWN);
});

/* クライアント: Ready */
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

/* 武器変更（左右矢印） */
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

/* リスポーンボタン */
document.getElementById('respawn-btn').addEventListener('click', () => {
  if (game.respawnReady && !game.respawnRequested) {
    _uiSound('ui_click')();
    game._requestRespawn();
  }
});

/* マップ変更（左右矢印 / Hostのみ） */
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

/* ロビー退出 */
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

/* === Settings Panel Toggle === */
document.getElementById('btn-settings').addEventListener('click', () => {
  document.getElementById('settings-panel').style.display = 'flex';
  _uiSound('ui_click')();
});
document.getElementById('btn-settings-close').addEventListener('click', () => {
  document.getElementById('settings-panel').style.display = 'none';
  _uiSound('ui_click')();
});
/* Volume sliders */
function setupSlider(id, category) {
  const slider = document.getElementById(id);
  slider.addEventListener('input', () => {
    const val = parseInt(slider.value) / 100;
    if (AUDIO) AUDIO.setVolume(category, val);
  });
}
setupSlider('vol-master', 'master');
setupSlider('vol-weapon', 'weapon');
setupSlider('vol-ui', 'ui');
setupSlider('vol-explosion', 'explosion');
setupSlider('vol-player', 'player');

/* ブラウザ終了時 */
window.addEventListener('beforeunload', () => {
  game.network.close();
});
