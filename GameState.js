/* ============================================================
   NEON ARENA - ゲーム状態管理
   状態遷移と定数を一元管理
   ============================================================ */

const GameState = Object.freeze({
  TITLE: 'TITLE',
  LOBBY: 'LOBBY',
  COUNTDOWN: 'COUNTDOWN',
  PLAYING: 'PLAYING',
  RESULT: 'RESULT',
  CHEAT_DETECTED: 'CHEAT_DETECTED',
  TRAINING: 'TRAINING',
});

/* ネットワーク経由で同期するメッセージタイプ一覧 */
const NetMsg = Object.freeze({
  JOIN: 'join',
  WELCOME: 'welcome',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  STATE: 'state',
  FIRE_REQUEST: 'fire_request',
  PROJ_SPAWN: 'proj_spawn',
  HIT: 'hit',
  HIT_EFFECT: 'hit_effect',
  EXPLOSION: 'explosion',
  AMMO_UPDATE: 'ammo_update',
  PLAYER_CORRECT: 'player_correct',
  RESPAWN: 'respawn',
  GAME_START: 'game_start',
  MAP_SELECT: 'map_select',
  GAME_OVER: 'game_over',
  RELOAD_COMPLETE: 'reload_complete',
  /* 新規メッセージ */
  READY: 'ready',
  WEAPON_CHANGE: 'weapon_change',
  NAME_CHANGE: 'name_change',
  LOBBY_STATE: 'lobby_state',
  COUNTDOWN_SYNC: 'countdown_sync',
  GAME_TIMER: 'game_timer',
  RESULT_SYNC: 'result_sync',
  RETURN_LOBBY: 'return_lobby',
  KILL_FEED: 'kill_feed',
  RESPAWN_REQUEST: 'respawn_request',
  CHEAT_DETECTED: 'cheat_detected',
});
