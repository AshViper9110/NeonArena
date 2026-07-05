/* ============================================================
   NEON ARENA - ゲーム設定
   設定値、武器定義、マップ定義を管理
   ============================================================ */

const THREE = window.THREE;

/* === ゲーム設定 === */
const CONFIG = {
  playerSize: 1.0,       // プレイヤーの当たり判定サイズ
  playerHeight: 1.4,     // プレイヤーの高さ
  playerSpeed: 12,       // 移動速度
  projectileRadius: 0.2, // 弾の半径（デフォルト）
  projectileSpeed: 45,   // 弾の速度（デフォルト）
  projectileLifetime: 2.0, // 弾の生存時間（デフォルト）
  maxHealth: 100,        // 最大HP
  respawnDelay: 3,       // リスポーン遅延時間（秒）
  stateSendRate: 0.05,   // 状態同期の送信間隔（秒）
  gameTimeLimit: 180,    // ゲーム制限時間（秒）
  killCamDuration: 2,    // キルカメラの持続時間（秒）
  dashSpeed: 60,         // ダッシュ時の速度
  dashDuration: 0.2,    // ダッシュの持続時間（秒）
  dashCooldown: 0.8,     // ダッシュのクールダウン（秒）
  invincibleTime: 3,     // リスポーン後の無敵時間（秒）
  colors: { projectile: 0xffee00 },
};

/* 武器定義は WeaponRegistry.js へ移行 */
/* マップ定義は MapRegistry.js へ移行 */

/* === プレイヤーカラー === */
const PLAYER_COLORS = [
  0x00f0ff, 0xff0055, 0x00ff88, 0xffaa00,
  0xaa00ff, 0x00ccff, 0xff6600, 0xff44aa,
];

/* ベクトル演算用の再利用可能なオブジェクト */
const _v3 = new THREE.Vector3();
const _v3b = new THREE.Vector3();
