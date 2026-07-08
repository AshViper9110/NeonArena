/* ============================================================
   NEON ARENA - 【旧】モノリシック版ゲームスクリプト
   現在は script.js はエントリとして使われず、
   モジュール分割版（game.js, main.js, player.js 等）が
    index.html で読み込まれている。
   ここには過去の全クラス定義と重複したWEAPONSデータが残る。
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
  dashSpeed: 35,         // ダッシュ時の速度
  dashDuration: 0.12,    // ダッシュの持続時間（秒）
  dashCooldown: 0.8,     // ダッシュのクールダウン（秒）
  invincibleTime: 3,     // リスポーン後の無敵時間（秒）
  colors: { projectile: 0xffee00 },
};

/* === 武器設定 ===
   各武器のダメージ、連射速度、弾の速度、拡散、弾薬などを定義 */
const WEAPONS = {
  pistol: {
    name: 'PISTOL', damage: 20, fireRate: 0.25,
    projSpeed: 50, projLifetime: 1.5, projRadius: 0.2,
    spread: 0, color: 0xffee00, hitRadius: 0.8,
    maxAmmo: 10, reloadTime: 3,
  },
  assault: {
    name: 'ASSAULT', damage: 15, fireRate: 0.08,
    projSpeed: 55, projLifetime: 1.5, projRadius: 0.15,
    spread: 0.06, color: 0xff6600, hitRadius: 0.7,
    maxAmmo: 30, reloadTime: 3,
  },
  sniper: {
    name: 'SNIPER', damage: 40, fireRate: 1.0,
    projSpeed: 90, projLifetime: 2.0, projRadius: 0.3,
    spread: 0, color: 0x00ffff, hitRadius: 0.9,
    maxAmmo: 5, reloadTime: 3,
  },
  rpg: {
    name: 'RPG', damage: 60, fireRate: 1.2,
    projSpeed: 18, projLifetime: 3.0, projRadius: 0.4,
    spread: 0, color: 0xff2200, hitRadius: 2.5,
    explosive: true, // 爆発属性：範囲ダメージ
    maxAmmo: 1, reloadTime: 3,
  },
  shotgun: {
    name: 'SHOTGUN', damage: 4, fireRate: 0.6,
    projSpeed: 50, projLifetime: 0.8, projRadius: 0.12,
    spread: 0.18, color: 0xff6600, hitRadius: 0.3,
    maxAmmo: 8, reloadTime: 2,
    pellets: 6, // 同時発射数
  },
};

/* === プレイヤーカラー === */
const PLAYER_COLORS = [
  0x00f0ff, 0xff0055, 0x00ff88, 0xffaa00,
  0xaa00ff, 0x00ccff, 0xff6600, 0xff44aa,
];

/* === マップ定義 ===
   各マップのサイズ、壁の配置、カラーテーマを定義 */
const MAPS = {
  grid: {
    name: 'NEON GRID', desc: 'Standard open arena',
    size: 40, wallHeight: 3, wallThick: 0.5,
    bg: 0x0a0a12, fogNear: 30, fogFar: 60,
    wallColor: 0x1a1a2e, floorColor: 0x0d0d1a,
    edgeColors: [0x00f0ff, 0xff00ff],
    gridColor: 0x00f0ff,
    ambientColor: 0x111122, ambientIntensity: 0.5,
    dirColor: 0x8844ff, dirIntensity: 1.0,
    rimColors: [0x00f0ff, 0xff00ff, 0x00f0ff, 0xff00ff],
    walls: [],
    pads: [{ p: [0,0,0], s: [4,0.1,4], speed: 2.0 }], // 中央スピードパッド
  },
  maze: {
    name: 'MAZE', desc: 'Navigate corridors',
    size: 50, wallHeight: 4, wallThick: 0.5,
    bg: 0x0a0018, fogNear: 20, fogFar: 40,
    wallColor: 0x1a0030, floorColor: 0x080010,
    edgeColors: [0xaa00ff, 0xff00aa],
    gridColor: 0xaa00ff,
    ambientColor: 0x110022, ambientIntensity: 0.4,
    dirColor: 0x8844ff, dirIntensity: 0.8,
    rimColors: [0xaa00ff, 0xff00aa, 0xaa00ff, 0xff00aa],
    walls: [
      { p: [-10,2,0], s: [0.5,4,18] }, { p: [10,2,0], s: [0.5,4,18] },
      { p: [0,2,-10], s: [18,4,0.5] }, { p: [0,2,10], s: [18,4,0.5] },
      { p: [-6,2,-5], s: [0.5,4,8] }, { p: [6,2,5], s: [0.5,4,8] },
      { p: [-14,2,-14], s: [8,4,0.5] }, { p: [14,2,14], s: [8,4,0.5] },
      { p: [-18,2,8], s: [0.5,4,9] }, { p: [18,2,-8], s: [0.5,4,9] },
    ],
    pads: [],
  },
  colloseum: {
    name: 'COLLOSEUM', desc: 'Compact with pillars',
    size: 35, wallHeight: 3, wallThick: 0.5,
    bg: 0x120a00, fogNear: 22, fogFar: 45,
    wallColor: 0x2e1a0a, floorColor: 0x1a0a00,
    edgeColors: [0xff8800, 0xff4400],
    gridColor: 0xff6600,
    ambientColor: 0x221100, ambientIntensity: 0.4,
    dirColor: 0xff6600, dirIntensity: 0.8,
    rimColors: [0xff8800, 0xff4400, 0xff8800, 0xff4400],
    walls: [
      { p: [-8,2,-8], s: [1.5,4,1.5] }, { p: [8,2,-8], s: [1.5,4,1.5] },
      { p: [-8,2,8], s: [1.5,4,1.5] }, { p: [8,2,8], s: [1.5,4,1.5] },
      { p: [0,2,-12], s: [1.5,4,1.5] }, { p: [0,2,12], s: [1.5,4,1.5] },
      { p: [-12,2,0], s: [1.5,4,1.5] }, { p: [12,2,0], s: [1.5,4,1.5] },
    ],
    pads: [],
  },
  abyss: {
    name: 'ABYSS', desc: 'Deadly central vortex',
    size: 45, wallHeight: 3.5, wallThick: 0.5,
    bg: 0x000a12, fogNear: 25, fogFar: 50,
    wallColor: 0x0a1a2e, floorColor: 0x050a12,
    edgeColors: [0x00ffff, 0x0088ff],
    gridColor: 0x00aaff,
    ambientColor: 0x001122, ambientIntensity: 0.4,
    dirColor: 0x4488ff, dirIntensity: 0.8,
    rimColors: [0x00ffff, 0x0088ff, 0x00ffff, 0x0088ff],
    walls: [
      { p: [-7,2,-7], s: [2,4,2] }, { p: [7,2,-7], s: [2,4,2] },
      { p: [-7,2,7], s: [2,4,2] }, { p: [7,2,7], s: [2,4,2] },
      { p: [0,2,-14], s: [1,4,2] }, { p: [0,2,14], s: [1,4,2] },
      { p: [-14,2,0], s: [2,4,1] }, { p: [14,2,0], s: [2,4,1] },
    ],
    pads: [],
  },
  fort: {
    name: 'FORT', desc: 'Fortified stronghold',
    size: 48, wallHeight: 4, wallThick: 0.5,
    bg: 0x0a1208, fogNear: 22, fogFar: 44,
    wallColor: 0x0a1a0a, floorColor: 0x080a05,
    edgeColors: [0x00ff88, 0x00cc66],
    gridColor: 0x00ff66,
    ambientColor: 0x002211, ambientIntensity: 0.4,
    dirColor: 0x44ff88, dirIntensity: 0.8,
    rimColors: [0x00ff88, 0x00cc66, 0x00ff88, 0x00cc66],
    walls: [
      { p: [-13,2,-13], s: [7,4,0.5] }, { p: [13,2,13], s: [7,4,0.5] },
      { p: [-13,2,13], s: [7,4,0.5] }, { p: [13,2,-13], s: [7,4,0.5] },
      { p: [-6,2,0], s: [0.5,4,12] }, { p: [6,2,0], s: [0.5,4,12] },
      { p: [0,2,-6], s: [12,4,0.5] }, { p: [0,2,6], s: [12,4,0.5] },
    ],
    pads: [],
  },
  chaos: {
    name: 'CHAOS', desc: 'Dense obstacle field',
    size: 40, wallHeight: 2.5, wallThick: 0.4,
    bg: 0x120008, fogNear: 18, fogFar: 38,
    wallColor: 0x2e0a1a, floorColor: 0x1a0008,
    edgeColors: [0xff0055, 0xff44aa],
    gridColor: 0xff0088,
    ambientColor: 0x220011, ambientIntensity: 0.4,
    dirColor: 0xff4488, dirIntensity: 0.8,
    rimColors: [0xff0055, 0xff44aa, 0xff0055, 0xff44aa],
    walls: [
      { p: [-14,1.5,-14], s: [1,3,1] }, { p: [-14,1.5,-7], s: [1,3,1] }, { p: [-14,1.5,0], s: [1,3,1] }, { p: [-14,1.5,7], s: [1,3,1] }, { p: [-14,1.5,14], s: [1,3,1] },
      { p: [-7,1.5,-14], s: [1,3,1] }, { p: [-7,1.5,-7], s: [1,3,1] }, { p: [-7,1.5,0], s: [1,3,1] }, { p: [-7,1.5,7], s: [1,3,1] }, { p: [-7,1.5,14], s: [1,3,1] },
      { p: [0,1.5,-14], s: [1,3,1] }, { p: [0,1.5,0], s: [1,3,1] }, { p: [0,1.5,14], s: [1,3,1] },
      { p: [7,1.5,-14], s: [1,3,1] }, { p: [7,1.5,-7], s: [1,3,1] }, { p: [7,1.5,0], s: [1,3,1] }, { p: [7,1.5,7], s: [1,3,1] }, { p: [7,1.5,14], s: [1,3,1] },
      { p: [14,1.5,-14], s: [1,3,1] }, { p: [14,1.5,-7], s: [1,3,1] }, { p: [14,1.5,0], s: [1,3,1] }, { p: [14,1.5,7], s: [1,3,1] }, { p: [14,1.5,14], s: [1,3,1] },
    ],
    pads: [{ p: [0,0,0], s: [2,0.1,2], speed: 1.8 }],
  },
  /* --- 追加4マップ --- */
  reactor: {
    name: 'REACTOR', desc: 'Glowing core chamber',
    size: 42, wallHeight: 3.5, wallThick: 0.5,
    bg: 0x001208, fogNear: 24, fogFar: 48,
    wallColor: 0x0a1a0a, floorColor: 0x000a05,
    edgeColors: [0x00ff44, 0x00ff88],
    gridColor: 0x00ff66,
    ambientColor: 0x001104, ambientIntensity: 0.4,
    dirColor: 0x00ff66, dirIntensity: 0.8,
    rimColors: [0x00ff44, 0x00ff88, 0x00ff44, 0x00ff88],
    walls: [
      { p: [-8,2,0], s: [0.5,4,8] }, { p: [8,2,0], s: [0.5,4,8] },
      { p: [0,2,-8], s: [8,4,0.5] }, { p: [0,2,8], s: [8,4,0.5] },
      { p: [-12,2,-12], s: [4,4,0.5] }, { p: [12,2,12], s: [4,4,0.5] },
      { p: [-12,2,12], s: [4,4,0.5] }, { p: [12,2,-12], s: [4,4,0.5] },
    ],
    pads: [{ p: [0,0,0], s: [3,0.1,3], speed: 1.5 }],
  },
  ice: {
    name: 'ICE', desc: 'Slippery frozen tundra',
    size: 38, wallHeight: 2.5, wallThick: 0.5,
    bg: 0x080c18, fogNear: 28, fogFar: 55,
    wallColor: 0x1a2236, floorColor: 0x0a0e18,
    edgeColors: [0x4488ff, 0x88ccff],
    gridColor: 0x4488ff,
    ambientColor: 0x081122, ambientIntensity: 0.5,
    dirColor: 0x88aaff, dirIntensity: 1.0,
    rimColors: [0x4488ff, 0x88ccff, 0x4488ff, 0x88ccff],
    walls: [
      { p: [-4,1.5,-4], s: [1.5,3,1.5] }, { p: [4,1.5,-4], s: [1.5,3,1.5] },
      { p: [-4,1.5,4], s: [1.5,3,1.5] }, { p: [4,1.5,4], s: [1.5,3,1.5] },
      { p: [-10,1.5,-10], s: [1.5,3,1.5] }, { p: [10,1.5,10], s: [1.5,3,1.5] },
      { p: [-10,1.5,10], s: [1.5,3,1.5] }, { p: [10,1.5,-10], s: [1.5,3,1.5] },
    ],
    pads: [{ p: [0,0,0], s: [5,0.1,5], speed: 0 }], // speed=0 → テレポート
    teleport: { x: 14, z: 14 }, // 中央のパッドに乗ると(14,14)にワープ
  },
  dojo: {
    name: 'DOJO', desc: 'Symmetrical battle arena',
    size: 36, wallHeight: 3, wallThick: 0.5,
    bg: 0x0a0806, fogNear: 20, fogFar: 40,
    wallColor: 0x1a1210, floorColor: 0x0d0a08,
    edgeColors: [0xff4444, 0xff8888],
    gridColor: 0xff4444,
    ambientColor: 0x110808, ambientIntensity: 0.4,
    dirColor: 0xff6644, dirIntensity: 0.8,
    rimColors: [0xff4444, 0xff8888, 0xff4444, 0xff8888],
    walls: [
      { p: [-5,1.5,-5], s: [2,3,2] }, { p: [5,1.5,-5], s: [2,3,2] },
      { p: [-5,1.5,5], s: [2,3,2] }, { p: [5,1.5,5], s: [2,3,2] },
      { p: [-10,2,0], s: [0.5,4,0.5] }, { p: [10,2,0], s: [0.5,4,0.5] },
      { p: [0,2,-10], s: [0.5,4,0.5] }, { p: [0,2,10], s: [0.5,4,0.5] },
      { p: [-14,1.5,-6], s: [1,3,1] }, { p: [14,1.5,6], s: [1,3,1] },
      { p: [6,1.5,-14], s: [1,3,1] }, { p: [-6,1.5,14], s: [1,3,1] },
    ],
    pads: [
      { p: [-8,0,0], s: [1.5,0.1,1.5], speed: 2.2 },
      { p: [8,0,0], s: [1.5,0.1,1.5], speed: 2.2 },
    ],
  },
  twilight: {
    name: 'TWILIGHT', desc: 'Low visibility neon haze',
    size: 44, wallHeight: 3, wallThick: 0.5,
    bg: 0x06000a, fogNear: 12, fogFar: 28, // 濃いフォグで視界不良
    wallColor: 0x160020, floorColor: 0x08000a,
    edgeColors: [0xff00ff, 0x8800ff],
    gridColor: 0xcc00ff,
    ambientColor: 0x110022, ambientIntensity: 0.3,
    dirColor: 0xaa44ff, dirIntensity: 0.6,
    rimColors: [0xff00ff, 0x8800ff, 0xff00ff, 0x8800ff],
    walls: [
      { p: [-9,1.5,-9], s: [2,3,2] }, { p: [9,1.5,-9], s: [2,3,2] },
      { p: [-9,1.5,9], s: [2,3,2] }, { p: [9,1.5,9], s: [2,3,2] },
      { p: [-3,1.5,-3], s: [1.5,3,1.5] }, { p: [3,1.5,3], s: [1.5,3,1.5] },
      { p: [-3,1.5,3], s: [1.5,3,1.5] }, { p: [3,1.5,-3], s: [1.5,3,1.5] },
    ],
    pads: [],
  },
};

/* ベクトル演算用の再利用可能なオブジェクト */
const _v3 = new THREE.Vector3();
const _v3b = new THREE.Vector3();

// ===== Projectile（弾丸クラス） =====

class Projectile {
  constructor(scene, origin, dir, ownerId, id, color, weapon) {
    this.scene = scene;
    this.ownerId = ownerId;
    this.id = id;
    this.weapon = weapon || 'pistol';
    this.wp = WEAPONS[this.weapon] || WEAPONS.pistol; // 武器データを参照
    this.alive = true;
    this.age = 0;
    this.color = this.wp.color;
    const r = this.wp.projRadius;
    // 弾のメッシュを作成
    const geo = new THREE.SphereGeometry(r * 1.5, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: this.color });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.copy(origin);
    this.mesh.position.y += CONFIG.playerHeight * 0.6;
    this.scene.add(this.mesh);
    // 進行方向に速度を設定
    this.velocity = dir.clone().multiplyScalar(this.wp.projSpeed);
    this.velocity.y = 0;
    // グローエフェクト（発光）
    const ggeo = new THREE.SphereGeometry(r * 3, 8, 8);
    const gmat = new THREE.MeshBasicMaterial({ color: this.color, transparent: true, opacity: 0.25 });
    this.glow = new THREE.Mesh(ggeo, gmat);
    this.glow.position.copy(this.mesh.position);
    this.scene.add(this.glow);
    this.trail = [];
    this.trailTimer = 0;
    this.exploded = false;
    this.hitPlayers = new Set(); // 命中済みプレイヤーID（連続ヒット防止）
  }
  // 毎フレームの更新処理
  update(dt) {
    if (!this.alive) return;
    this.age += dt;
    if (this.age > this.wp.projLifetime) { this.destroy(); return; }
    this.mesh.position.x += this.velocity.x * dt;
    this.mesh.position.z += this.velocity.z * dt;
    const half = 30;
    if (Math.abs(this.mesh.position.x) > half || Math.abs(this.mesh.position.z) > half) { this.destroy(); return; }
    this.glow.position.copy(this.mesh.position);
    const pulse = 1 + 0.3 * Math.sin(this.age * 20);
    this.glow.scale.setScalar(pulse);
    this.trailTimer += dt;
    if (this.trailTimer > 0.03) { this.trailTimer = 0; this._spawnTrail(); }
    this.trail = this.trail.filter(t => {
      t.life += dt;
      if (t.life > 0.4) { this.scene.remove(t.mesh); return false; }
      const s = 1 - t.life / 0.4;
      t.mesh.scale.setScalar(s * 2);
      t.mesh.material.opacity = s * 0.4;
      return true;
    });
  }
  // 軌跡（トレイル）を生成
  _spawnTrail() {
    const r = this.wp.projRadius;
    const geo = new THREE.SphereGeometry(r, 4, 4);
    const mat = new THREE.MeshBasicMaterial({ color: this.color, transparent: true, opacity: 0.4 });
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(this.mesh.position);
    this.scene.add(m);
    this.trail.push({ mesh: m, life: 0 });
  }
  // 爆発エフェクト
  explosionFX() {
    if (this.exploded) return;
    this.exploded = true;
    const r = this.wp.projRadius * 8;
    const geo = new THREE.SphereGeometry(r, 12, 12);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff4400, transparent: true, opacity: 0.6,
    });
    const boom = new THREE.Mesh(geo, mat);
    boom.position.copy(this.mesh.position);
    this.scene.add(boom);
    const start = performance.now();
    const anim = () => {
      const t = (performance.now() - start) / 400;
      if (t >= 1) { this.scene.remove(boom); boom.geometry.dispose(); boom.material.dispose(); return; }
      const s = 1 + t * 3;
      boom.scale.setScalar(s);
      boom.material.opacity = 0.6 * (1 - t);
      requestAnimationFrame(anim);
    };
    anim();
  }
  // 弾を破棄
  destroy() {
    if (!this.alive) return;
    if (this.wp.explosive) this.explosionFX();
    this.alive = false;
    this.scene.remove(this.mesh); this.scene.remove(this.glow);
    this.mesh.geometry.dispose(); this.mesh.material.dispose();
    this.glow.geometry.dispose(); this.glow.material.dispose();
    this.trail.forEach(t => { this.scene.remove(t.mesh); t.mesh.geometry.dispose(); t.mesh.material.dispose(); });
    this.trail = [];
  }
}

// ===== Player（プレイヤークラス） =====

class Player {
  constructor(scene, id, color) {
    this.scene = scene;
    this.id = id;
    this.color = color;
    this.health = CONFIG.maxHealth;
    this.maxHealth = CONFIG.maxHealth;
    this.alive = true;
    this.name = '';
    this.kills = 0;
    this.deaths = 0;
    this.weapon = 'pistol';
    this.lastFireTime = 0;
    this.ammo = 0;
    this.maxAmmo = 0;
    this.reloading = false;
    this.reloadTimer = 0;
    // プレイヤーメッシュ（直方体）
    const geo = new THREE.BoxGeometry(CONFIG.playerSize, CONFIG.playerHeight, CONFIG.playerSize);
    const mat = new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: 0.3, metalness: 0.1, roughness: 0.4,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.scene.add(this.mesh);
    // 足元の発光リング
    const ggeo = new THREE.BoxGeometry(CONFIG.playerSize * 1.6, CONFIG.playerHeight * 0.2, CONFIG.playerSize * 1.6);
    const gmat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.1 });
    this.glowRing = new THREE.Mesh(ggeo, gmat);
    this.glowRing.position.y = 0.05;
    this.scene.add(this.glowRing);
    // エッジライン（輪郭線）
    this.edgeGeo = new THREE.EdgesGeometry(geo);
    this.edgeMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.4 });
    this.edgeLine = new THREE.LineSegments(this.edgeGeo, this.edgeMat);
    this.scene.add(this.edgeLine);
    // 位置と回転
    this.position = new THREE.Vector3();
    this.rotation = 0;
    this.targetPosition = new THREE.Vector3();
    this.targetRotation = 0;
    this.spawn();
  }
  // 初期スポーン位置を設定
  spawn() {
    const half = 20;
    this.position.set((Math.random() - 0.5) * half * 2, 0, (Math.random() - 0.5) * half * 2);
    this.targetPosition.copy(this.position);
    this.health = CONFIG.maxHealth;
    this.alive = true;
    this.refillAmmo();
    this.updateMesh();
  }
  refillAmmo() {
    const wp = WEAPONS[this.weapon] || WEAPONS.pistol;
    this.maxAmmo = wp.maxAmmo;
    this.ammo = wp.maxAmmo;
    this.reloading = false;
    this.reloadTimer = 0;
  }
  // ダメージを受ける。戻り値: 死亡したかどうか
  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0 && this.alive) { this.alive = false; this.deaths++; }
    return !this.alive;
  }
  // メッシュの位置・回転を更新
  updateMesh() {
    this.mesh.position.set(this.position.x, CONFIG.playerHeight / 2, this.position.z);
    this.mesh.rotation.y = this.rotation;
    this.glowRing.position.set(this.position.x, 0.05, this.position.z);
    this.edgeLine.position.copy(this.mesh.position);
    this.edgeLine.rotation.y = this.rotation;
  }
  setPosition(pos) { this.position.copy(pos); this.targetPosition.copy(pos); }
  setRotation(rot) { this.rotation = rot; this.targetRotation = rot; }
  // 位置を補間（他のプレイヤーのスムーズ表示用）
  lerpToTarget(dt) {
    this.position.lerp(this.targetPosition, 1 - Math.exp(-10 * dt));
    const diff = this.targetRotation - this.rotation;
    this.rotation += diff * Math.min(1, 10 * dt);
  }
  // 毎フレーム更新（死亡時は非表示）
  update(dt) {
    if (!this.alive) {
      this.mesh.visible = false; this.edgeLine.visible = false; this.glowRing.visible = false;
      return;
    }
    this.mesh.visible = true; this.edgeLine.visible = true; this.glowRing.visible = true;
    if (this.reloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        this.ammo = this.maxAmmo;
        this.reloading = false;
        this.reloadTimer = 0;
      }
    }
    this.updateMesh();
  }
  // プレイヤーを破棄
  destroy() {
    [this.mesh, this.glowRing, this.edgeLine].forEach(o => { this.scene.remove(o); });
    this.mesh.geometry.dispose(); this.mesh.material.dispose();
    this.glowRing.geometry.dispose(); this.glowRing.material.dispose();
    this.edgeGeo.dispose(); this.edgeMat.dispose();
  }
}

// ===== NetworkManager（スター型ネットワーク管理） =====

class NetworkManager {
  constructor(game) {
    this.game = game;
    this.peer = null;
    this.connections = [];
    this.conn = null;
    this.isHost = false;
    this.roomId = null;
    this.myId = null;
    this.connected = false;
    this.sendTimer = 0;
  }
  // ホストとしてルームを作成
  async createRoom() {
    this.isHost = true;
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.roomId = 'NEON-' + suffix;
    return new Promise((resolve, reject) => {
      this.peer = new Peer(this.roomId, { debug: 0 });
      this.peer.on('open', () => { this.myId = this.roomId; resolve(this.roomId); });
      this.peer.on('connection', (conn) => {
        this.connections.push(conn);
        this._setupConn(conn);
      });
      this.peer.on('error', (err) => reject(err));
    });
  }
  // ゲストとしてルームに参加
  async joinRoom(roomId, playerName) {
    this.isHost = false;
    this.roomId = roomId;
    return new Promise((resolve, reject) => {
      this.peer = new Peer(undefined, { debug: 0 });
      this.peer.on('open', (id) => {
        this.myId = id;
        const conn = this.peer.connect(roomId, { reliable: true });
        this.conn = conn;
        this._setupConn(conn);
        conn.on('open', () => {
          conn.send({ type: 'join', name: playerName || 'Player' });
          resolve();
        });
      });
      this.peer.on('error', (err) => reject(err));
    });
  }
  // 接続のセットアップ（共通処理）
  _setupConn(conn) {
    conn.on('data', (data) => this.game.handleMessage(data, conn));
    conn.on('close', () => {
      if (this.isHost) {
        const idx = this.connections.indexOf(conn);
        if (idx >= 0) this.connections.splice(idx, 1);
        this.game.onPlayerLeft(conn.peer);
      } else {
        this.connected = false;
        this.game.onDisconnected();
      }
    });
    if (!this.isHost) {
      conn.on('open', () => { this.connected = true; });
    }
  }
  // データ送信
  send(data) { if (this.conn && this.conn.open) this.conn.send(data); }
  broadcast(data, exclude) { this.connections.forEach(c => { if (c !== exclude && c.open) c.send(data); }); }
  // プレイヤー状態を定期的に送信
  sendState(dt) {
    if (!this.connected && !this.isHost) return;
    this.sendTimer += dt;
    if (this.sendTimer < CONFIG.stateSendRate) return;
    this.sendTimer = 0;
    const p = this.game.localPlayer;
    if (!p || !p.scene) return;
    const data = {
      type: 'state',
      id: this.myId,
      pos: { x: p.position.x, y: p.position.y, z: p.position.z },
      rot: p.rotation, health: p.health, alive: p.alive,
    };
    if (this.isHost) this.broadcast(data);
    else this.send(data);
  }
  // 接続を閉じる
  close() {
    this.connections.forEach(c => c.close());
    if (this.conn) this.conn.close();
    if (this.peer) this.peer.destroy();
    this.connections = [];
    this.connected = false;
  }
}

// ===== Game（メインゲームクラス） =====

class Game {
  constructor() {
    this.players = new Map();          // 全プレイヤー（id -> Player）
    this.localId = null;               // ローカルプレイヤーのID
    this.projectiles = [];             // アクティブな弾丸リスト
    this.projIdCounter = 0;
    this.remoteProjIdCounter = 0;
    this.keys = {};                    // キー入力状態
    this.mouseDelta = 0;               // マウス移動量
    this.network = new NetworkManager(this);
    this.gameStarted = false;
    this.gameOver = false;
    this.connectionHandled = false;
    this.kills = 0;
    this.deaths = 0;
    this.respawnTimer = 0;             // リスポーンまでのカウントダウン
    this.gameTimer = CONFIG.gameTimeLimit;
    this.selectedMap = 'grid';
    this.pointerLocked = false;
    this.clock = new THREE.Clock();
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.arenaObjects = [];
    this.rimLights = [];
    this.scoreboard = new Map();
    this.killCamKillerId = null;       // キルカメラで映す殺したプレイヤーのID
    this.invincibleTimer = 0;          // リスポーン後の無敵時間カウントダウン
    this.teleportCooldown = 0;         // テレポート再使用までの待機時間
    this.loadoutWeapon = 'pistol';     // タイトル画面で選択した武器
    this.mouseDown = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
  }

  // ローカルプレイヤーへのショートカット
  get localPlayer() { return this.players.get(this.localId); }

  // ゲームの初期化（シーン、カメラ、レンダラーのセットアップ）
  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a12);
    this.scene.fog = new THREE.Fog(0x0a0a12, 30, 60);
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 100);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    document.getElementById('game-container').appendChild(this.renderer.domElement);
    // ウィンドウリサイズ対応
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
    // ポインターロック（マウスキャプチャ）の状態変更
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.renderer.domElement;
      document.getElementById('instructions').classList.toggle('hidden', !this.pointerLocked || this.respawnTimer > 0);
    });
    document.addEventListener('mousemove', (e) => { if (this.pointerLocked) this.mouseDelta += e.movementX; });
    document.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key.toLowerCase() === 'r') this.reload();
    });
    document.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });
    this.renderer.domElement.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouseDown = true;
    });
    this.renderer.domElement.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouseDown = false;
    });
    this.renderer.domElement.addEventListener('click', () => {
      if (this.network.connected && !this.pointerLocked && this.gameStarted && !(this.respawnTimer > 0)) this.renderer.domElement.requestPointerLock();
    });
    this._setupLights();
    this._createArena(this.selectedMap);
    this.animate();
  }

  // 照明のセットアップ
  _setupLights() {
    this.ambientLight = new THREE.AmbientLight(0x111122, 0.5);
    this.scene.add(this.ambientLight);
    this.dirLight = new THREE.DirectionalLight(0x8844ff, 1.0);
    this.dirLight.position.set(10, 20, 10);
    this.scene.add(this.dirLight);
    [
      [[-20, 8, -20], 0x00f0ff], [[20, 8, -20], 0xff00ff],
      [[-20, 8, 20], 0x00f0ff], [[20, 8, 20], 0xff00ff],
    ].forEach(([pos, col]) => {
      const l = new THREE.PointLight(col, 0.6, 30);
      l.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(l);
      this.rimLights.push(l);
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: col }));
      h.position.copy(l.position);
      this.scene.add(h);
    });
  }

  // アリーナをクリア
  _clearArena() {
    this.arenaObjects.forEach(o => { this.scene.remove(o); if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    this.arenaObjects = [];
    this.rimLights.forEach(l => this.scene.remove(l));
    this.rimLights = [];
  }

  // マップに基づいてアリーナ（壁・床・装飾）を生成
  _createArena(mapKey) {
    this._clearArena();
    const map = MAPS[mapKey] || MAPS.grid;
    this.scene.background = new THREE.Color(map.bg);
    this.scene.fog = new THREE.Fog(map.bg, map.fogNear, map.fogFar);
    this.ambientLight.color.setHex(map.ambientColor);
    this.ambientLight.intensity = map.ambientIntensity;
    this.dirLight.color.setHex(map.dirColor);
    this.dirLight.intensity = map.dirIntensity;
    const half = map.size / 2;
    const wallMat = new THREE.MeshStandardMaterial({ color: map.wallColor, metalness: 0.2, roughness: 0.6 });
    const addWall = (pos, size, idx) => {
      const geo = new THREE.BoxGeometry(...size);
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(mesh); this.arenaObjects.push(mesh);
      const eg = new THREE.EdgesGeometry(geo);
      const em = new THREE.LineBasicMaterial({
        color: map.edgeColors[idx % map.edgeColors.length],
        transparent: true, opacity: 0.25,
      });
      const el = new THREE.LineSegments(eg, em);
      el.position.copy(mesh.position);
      this.scene.add(el); this.arenaObjects.push(el);
    };
    // 外周の壁を生成
    const wallData = [
      { p: [0, map.wallHeight/2, -half], s: [map.size, map.wallHeight, map.wallThick] },
      { p: [0, map.wallHeight/2, half], s: [map.size, map.wallHeight, map.wallThick] },
      { p: [-half, map.wallHeight/2, 0], s: [map.wallThick, map.wallHeight, map.size] },
      { p: [half, map.wallHeight/2, 0], s: [map.wallThick, map.wallHeight, map.size] },
    ];
    wallData.forEach((d, i) => addWall(d.p, d.s, i));
    // 内部の壁を生成
    map.walls.forEach((w, i) => addWall(w.p, w.s, i + 4));
    // 床
    const fgeo = new THREE.PlaneGeometry(map.size - 1, map.size - 1);
    const fmat = new THREE.MeshStandardMaterial({ color: map.floorColor, metalness: 0.3, roughness: 0.7 });
    const floor = new THREE.Mesh(fgeo, fmat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    this.scene.add(floor); this.arenaObjects.push(floor);
    // グリッド線
    const gh1 = new THREE.GridHelper(map.size - 2, 20, map.gridColor, 0x222255);
    gh1.material.transparent = true; gh1.material.opacity = 0.15;
    gh1.position.y = 0.02;
    this.scene.add(gh1); this.arenaObjects.push(gh1);
    const gh2 = new THREE.GridHelper(map.size - 2, 40, 0x4444aa, 0x222255);
    gh2.material.transparent = true; gh2.material.opacity = 0.08;
    gh2.position.y = 0.01;
    this.scene.add(gh2); this.arenaObjects.push(gh2);
    this.arenaMap = map;

    // === スピードパッド/テレポートパッドの描画 ===
    if (map.pads) {
      const padMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
      map.pads.forEach((pad, i) => {
        const g = new THREE.PlaneGeometry(pad.s[0], pad.s[2]);
        const m = new THREE.Mesh(g, padMat.clone());
        m.material.color.setHex(i % 2 === 0 ? 0x00f0ff : 0xff00ff);
        m.material.opacity = 0.12 + 0.06 * Math.sin(i);
        m.position.set(pad.p[0], 0.05, pad.p[2]);
        m.rotation.x = -Math.PI / 2;
        this.scene.add(m);
        this.arenaObjects.push(m);
        // エッジグロー
        const eg = new THREE.EdgesGeometry(g);
        const em = new THREE.LineBasicMaterial({ color: m.material.color, transparent: true, opacity: 0.3 });
        const el = new THREE.LineSegments(eg, em);
        el.position.copy(m.position);
        el.rotation.x = -Math.PI / 2;
        this.scene.add(el);
        this.arenaObjects.push(el);
      });
    }
  }

  // プレイヤーを追加
  addPlayer(id, color, name) {
    if (this.players.has(id)) return this.players.get(id);
    const p = new Player(this.scene, id, color);
    p.name = name || 'Player';
    this.players.set(id, p);
    return p;
  }

  // プレイヤーを削除
  removePlayer(id) {
    const p = this.players.get(id);
    if (p) { p.destroy(); this.players.delete(id); }
  }

  // 接続確立時のコールバック
  onConnected() {
    if (this.connectionHandled) return;
    this.connectionHandled = true;
    document.getElementById('conn-status').textContent = '● CONNECTED';
    document.getElementById('conn-status').classList.add('connected');
  }

  // プレイヤー切断時の処理
  onPlayerLeft(peerId) {
    this.removePlayer(peerId);
    this.updatePlayerListUI();
    this.addKillFeed('👋 A player disconnected');
  }

  // 待機室（ロビー）を表示
  showWaitingRoom() {
    document.querySelectorAll('.step-section').forEach(el => el.style.display = 'none');
    document.getElementById('waiting-room').style.display = 'block';
    if (this.network.isHost) {
      document.getElementById('map-select-host').style.display = 'block';
      document.getElementById('map-info-guest').style.display = 'none';
      document.getElementById('map-preview-container').style.display = 'block';
      document.getElementById('guest-map-preview-container').style.display = 'none';
      document.getElementById('waiting-room-status').textContent = 'Waiting for players...';
      document.getElementById('btn-start-game').style.display = 'inline-block';
      document.getElementById('overlay-status').textContent = 'Select map and press START';
      this._setupMapSelector();
    } else {
      document.getElementById('map-select-host').style.display = 'none';
      document.getElementById('map-info-guest').style.display = 'block';
      document.getElementById('map-preview-container').style.display = 'none';
      document.getElementById('guest-map-preview-container').style.display = 'block';
      document.getElementById('btn-start-game').style.display = 'none';
      document.getElementById('waiting-room-status').textContent = 'Connected! Waiting for host...';
      document.getElementById('overlay-status').textContent = 'Waiting for host to start...';
      this._drawGuestMapPreview(this.selectedMap);
    }
    this.updatePlayerListUI();
  }

  // マップ選択UIをセットアップ（左右ボタン方式）
  _setupMapSelector() {
    const container = document.getElementById('map-selector');
    container.innerHTML = '';
    const mapKeys = Object.keys(MAPS);
    const prevBtn = document.createElement('button');
    prevBtn.className = 'map-nav-btn';
    prevBtn.textContent = '◀';
    prevBtn.addEventListener('click', () => {
      const idx = mapKeys.indexOf(this.selectedMap);
      this.selectedMap = mapKeys[(idx - 1 + mapKeys.length) % mapKeys.length];
      this._updateMapUI();
      this.network.broadcast({ type: 'map_select', map: this.selectedMap });
    });
    const mapNameEl = document.createElement('span');
    mapNameEl.className = 'map-nav-name';
    mapNameEl.id = 'map-nav-name';
    const nextBtn = document.createElement('button');
    nextBtn.className = 'map-nav-btn';
    nextBtn.textContent = '▶';
    nextBtn.addEventListener('click', () => {
      const idx = mapKeys.indexOf(this.selectedMap);
      this.selectedMap = mapKeys[(idx + 1) % mapKeys.length];
      this._updateMapUI();
      this.network.broadcast({ type: 'map_select', map: this.selectedMap });
    });
    container.appendChild(prevBtn);
    container.appendChild(mapNameEl);
    container.appendChild(nextBtn);
    this._updateMapUI();
  }

  // マップUIの表示を更新（マップ名＋プレビュー）
  _updateMapUI() {
    const map = MAPS[this.selectedMap] || MAPS.grid;
    const nameEl = document.getElementById('map-nav-name');
    if (nameEl) nameEl.textContent = `${map.name} — ${map.desc}`;
    this._drawMapPreview(this.selectedMap);
    /* ゲストにもマップ情報を送信 */
    document.getElementById('guest-map-name').textContent = `${map.name} — ${map.desc}`;
    this._drawGuestMapPreview(this.selectedMap);
  }

  // マップの俯瞰図（上から見た図）をCanvasに描画
  _drawMapPreview(mapKey) {
    const canvas = document.getElementById('map-preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const map = MAPS[mapKey] || MAPS.grid;
    const W = canvas.width;
    const H = canvas.height;
    const pad = 10; // 余白
    const drawSize = W - pad * 2;
    const scale = drawSize / map.size;
    ctx.clearRect(0, 0, W, H);
    // 背景（濃い色）
    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(0, 0, W, H);
    // アリーナの床エリア
    const arenaX = pad + (W - drawSize) / 2;
    const arenaY = pad + (H - drawSize) / 2;
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(arenaX, arenaY, drawSize, drawSize);
    // 外周の壁
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(arenaX, arenaY, drawSize, drawSize);
    // 内部の壁を描画（上から見た四角形）
    ctx.fillStyle = 'rgba(0, 240, 255, 0.3)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
    ctx.lineWidth = 1;
    const halfMap = map.size / 2;
    // 壁の中心座標をキャンバス座標に変換する関数
    const toCanvas = (x, z) => ({
      cx: arenaX + (x + halfMap) * scale,
      cy: arenaY + (z + halfMap) * scale,
    });
    map.walls.forEach(w => {
      const { cx, cy } = toCanvas(w.p[0], w.p[2]);
      const wScaleX = w.s[0] * scale;
      const wScaleZ = w.s[2] * scale;
      ctx.fillRect(cx - wScaleX / 2, cy - wScaleZ / 2, wScaleX, wScaleZ);
      ctx.strokeRect(cx - wScaleX / 2, cy - wScaleZ / 2, wScaleX, wScaleZ);
    });
    // マップ名を表示
    ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.font = '10px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(map.name, W / 2, H - 4);
  }

  // ゲスト向けマッププレビューを描画
  _drawGuestMapPreview(mapKey) {
    const canvas = document.getElementById('guest-map-preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const map = MAPS[mapKey] || MAPS.grid;
    const W = canvas.width;
    const H = canvas.height;
    const pad = 6;
    const drawSize = W - pad * 2;
    const scale = drawSize / map.size;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(0, 0, W, H);
    const arenaX = pad + (W - drawSize) / 2;
    const arenaY = pad + (H - drawSize) / 2;
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(arenaX, arenaY, drawSize, drawSize);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(arenaX, arenaY, drawSize, drawSize);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.3)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
    ctx.lineWidth = 1;
    const halfMap = map.size / 2;
    const toCanvas = (x, z) => ({
      cx: arenaX + (x + halfMap) * scale,
      cy: arenaY + (z + halfMap) * scale,
    });
    map.walls.forEach(w => {
      const { cx, cy } = toCanvas(w.p[0], w.p[2]);
      const wScaleX = w.s[0] * scale;
      const wScaleZ = w.s[2] * scale;
      ctx.fillRect(cx - wScaleX / 2, cy - wScaleZ / 2, wScaleX, wScaleZ);
      ctx.strokeRect(cx - wScaleX / 2, cy - wScaleZ / 2, wScaleX, wScaleZ);
    });
    ctx.fillStyle = 'rgba(0, 240, 255, 0.3)';
    ctx.font = '8px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(map.name, W / 2, H - 3);
  }

  // プレイヤーリストUIの更新
  updatePlayerListUI() {
    const list = document.getElementById('player-list');
    list.innerHTML = '';
    this.players.forEach((p, id) => {
      const entry = document.createElement('div');
      entry.className = 'pl-entry';
      const dot = document.createElement('span');
      dot.className = 'pl-dot';
      dot.style.color = '#' + p.color.toString(16).padStart(6, '0');
      dot.style.background = '#' + p.color.toString(16).padStart(6, '0');
      const name = document.createElement('span');
      name.className = 'pl-name';
      name.textContent = p.name;
      const tag = document.createElement('span');
      tag.className = 'pl-tag';
      if (id === this.network.myId) { tag.textContent = 'YOU'; tag.classList.add('you'); }
      else if (id === this.network.roomId) { tag.textContent = 'HOST'; tag.classList.add('host'); }
      entry.appendChild(dot);
      entry.appendChild(name);
      entry.appendChild(tag);
      list.appendChild(entry);
    });
  }

  // ゲーム開始処理
  startGame() {
    this.gameStarted = true;
    this.gameOver = false;
    this.gameTimer = CONFIG.gameTimeLimit;
    this.kills = 0;
    this.deaths = 0;
    this.scoreboard.clear();
    this.killCamKillerId = null;
    this.invincibleTimer = 0;
    this.mouseDown = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.network.sendTimer = CONFIG.stateSendRate;
    document.getElementById('result-screen').classList.remove('show');
    document.getElementById('death-screen').classList.remove('show');
    document.getElementById('overlay').classList.add('hidden');
    document.getElementById('instructions').classList.remove('hidden');
    document.getElementById('match-btn').style.display = 'none'; /* 試合中は非表示 */
    /* スコア表示をリセット */
    document.getElementById('kill-count').textContent = '0';
    document.getElementById('death-count').textContent = '0';
    /* ローカルプレイヤーの弾薬を初期化 */
    const lp = this.localPlayer;
    if (lp) { lp.refillAmmo(); this.updateAmmoUI(); }
    this.addKillFeed('⚔ GAME START!');
    this.updateTimerUI();
    if (!this.pointerLocked) setTimeout(() => this.renderer.domElement.requestPointerLock(), 300);
  }

  // 切断時の処理
  onDisconnected() {
    document.getElementById('conn-status').textContent = '● DISCONNECTED';
    document.getElementById('conn-status').classList.remove('connected');
    this.addKillFeed('⚠ Connection lost');
  }

  // キルフィードにメッセージを追加
  addKillFeed(msg) {
    const feed = document.getElementById('kill-feed');
    const el = document.createElement('div');
    el.className = 'kill-msg';
    el.textContent = msg;
    feed.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, 3000);
  }

  // 弾を発射
  shoot() {
    const lp = this.localPlayer;
    if (!lp || !lp.alive) return;
    if (lp.reloading) return; /* リロード中は発射不可 */
    if (lp.ammo <= 0) { /* 弾切れ → 自動リロード */
      this.reload(); return;
    }
    const wp = WEAPONS[lp.weapon] || WEAPONS.pistol;
    const pellets = wp.pellets || 1;
    let dirs = [];
    for (let i = 0; i < pellets; i++) {
      const dir = new THREE.Vector3(0, 0, -1);
      dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), lp.rotation);
      dir.y = 0; dir.normalize();
      if (wp.spread > 0) {
        dir.x += (Math.random() - 0.5) * wp.spread;
        dir.z += (Math.random() - 0.5) * wp.spread;
        dir.normalize();
      }
      const pid = this.network.myId + '_' + (this.projIdCounter++);
      const proj = new Projectile(this.scene, lp.position, dir, this.network.myId, pid, lp.color, lp.weapon);
      this.projectiles.push(proj);
      dirs.push({ x: dir.x, y: 0, z: dir.z });
    }
    lp.ammo--;
    this.updateAmmoUI();
    const msg = {
      type: 'shoot', ownerId: this.network.myId, pellets,
      pos: { x: lp.position.x, y: 0, z: lp.position.z },
      dirs, color: lp.color, weapon: lp.weapon,
    };
    if (this.network.isHost) this.network.broadcast(msg);
    else this.network.send(msg);
  }

  // リロード処理
  reload() {
    const lp = this.localPlayer;
    if (!lp || !lp.alive || lp.reloading) return;
    if (lp.ammo >= lp.maxAmmo) return; /* 満タンなら不要 */
    const wp = WEAPONS[lp.weapon] || WEAPONS.pistol;
    lp.reloading = true;
    lp.reloadTimer = wp.reloadTime;
    this.addKillFeed('🔄 Reloading...');
    this.updateAmmoUI();
  }

  // 弾薬UIの更新
  updateAmmoUI() {
    const lp = this.localPlayer;
    if (!lp) { document.getElementById('ammo-display').textContent = '--/--'; return; }
    const el = document.getElementById('ammo-display');
    if (lp.reloading) {
      const remaining = Math.ceil(Math.max(0, lp.reloadTimer));
      el.textContent = `RELOAD ${remaining}s`;
    } else {
      el.textContent = `${lp.ammo} / ${lp.maxAmmo}`;
    }
  }

  // 受信メッセージの振り分け
  handleMessage(data, conn) {
    if (!data || !data.type) return;
    switch (data.type) {
      case 'join': if (this.network.isHost) this._handleJoin(data, conn); break;
      case 'welcome': this._handleWelcome(data); break;
      case 'player_joined': this._handlePlayerJoined(data); break;
      case 'state': this._handleState(data); break;
      case 'shoot': this._handleRemoteShoot(data); break;
      case 'hit': this._handleHit(data); break;
      case 'respawn': this._handleRemoteRespawn(data); break;
      case 'game_start': this._handleGameStart(data); break;
      case 'map_select': this._handleMapSelect(data); break;
      case 'start': this.startGame(); break;
      case 'game_over': this._handleGameOver(data); break;
    }
  }

  // 参加要求の処理（ホスト側）
  _handleJoin(data, conn) {
    const peerId = conn.peer;
    const colorIdx = this.players.size % PLAYER_COLORS.length;
    const color = PLAYER_COLORS[colorIdx];
    const name = data.name || 'Player';
    const joiningMidGame = this.gameStarted && !this.gameOver;
    this.addPlayer(peerId, color, name);
    if (joiningMidGame) {
      const half = (this.arenaMap ? this.arenaMap.size : 40) / 2 - 3;
      const p = this.players.get(peerId);
      if (p) {
        p.position.set((Math.random() - 0.5) * half * 2, 0, (Math.random() - 0.5) * half * 2);
        p.targetPosition.copy(p.position);
        p.health = CONFIG.maxHealth;
        p.alive = true;
        p.updateMesh();
      }
    }
    this.network.connected = true;
    if (!this.connectionHandled) {
      this.connectionHandled = true;
      this.onConnected();
      this.showWaitingRoom();
    }
    conn.send({
      type: 'welcome',
      players: Array.from(this.players.entries()).map(([id, p]) => ({ id, name: p.name, color: p.color })),
      yourId: peerId,
      map: this.selectedMap,
      gameStarted: this.gameStarted,
      gameTimer: this.gameTimer,
    });
    this.network.broadcast({ type: 'player_joined', id: peerId, name, color }, conn);
    this.updatePlayerListUI();
    this.addKillFeed(`⚡ ${name} joined`);
  }

  // ウェルカムメッセージの処理（ゲスト側）
  _handleWelcome(data) {
    this.connectionHandled = true;
    this.onConnected();
    data.players.forEach(p => {
      this.addPlayer(p.id, p.color, p.name);
    });
    this.localId = data.yourId;
    this.selectedMap = data.map || 'grid';
    if (this.localPlayer) {
      this.localPlayer.weapon = this.loadoutWeapon;
      this.localPlayer.lastFireTime = 0;
      this.localPlayer.refillAmmo();
    }
    if (data.gameStarted) {
      this._createArena(this.selectedMap);
      this.gameStarted = true;
      this.gameOver = false;
      this.gameTimer = data.gameTimer || CONFIG.gameTimeLimit;
      this.network.sendTimer = CONFIG.stateSendRate;
      document.getElementById('overlay').classList.add('hidden');
      document.getElementById('instructions').classList.remove('hidden');
      document.getElementById('result-screen').classList.remove('show');
      document.getElementById('death-screen').classList.remove('show');
      this.updateTimerUI();
      this.addKillFeed('⚔ Joined game in progress');
      if (!this.pointerLocked) setTimeout(() => this.renderer.domElement.requestPointerLock(), 300);
    } else {
      this.showWaitingRoom();
      if (data.map) {
        const map = MAPS[data.map] || MAPS.grid;
        document.getElementById('guest-map-name').textContent = `${map.name} — ${map.desc}`;
        this._drawGuestMapPreview(data.map);
      }
    }
  }

  // プレイヤー参加通知の処理
  _handlePlayerJoined(data) {
    this.addPlayer(data.id, data.color, data.name);
    this.updatePlayerListUI();
    this.addKillFeed(`⚡ ${data.name} joined`);
  }

  // 状態同期の処理
  _handleState(data) {
    const p = this.players.get(data.id);
    if (!p) return;
    p.targetPosition.set(data.pos.x, data.pos.y, data.pos.z);
    p.targetRotation = data.rot;
    if (data.alive !== undefined) p.alive = data.alive;
    if (data.health !== undefined) p.health = data.health;
    if (this.network.isHost) {
      this.network.broadcast(data, this._findConn(data.id));
    }
  }

  // コネクションをIDから検索
  _findConn(playerId) {
    return this.network.connections.find(c => c.peer === playerId);
  }

  // リモートの射撃処理
  _handleRemoteShoot(data) {
    const origin = new THREE.Vector3(data.pos.x, data.pos.y, data.pos.z);
    const pellets = data.pellets || 1;
    const wp = WEAPONS[data.weapon] || WEAPONS.pistol;
    for (let i = 0; i < pellets; i++) {
      const d = new THREE.Vector3(data.dirs[i].x, data.dirs[i].y, data.dirs[i].z);
      const pid = data.ownerId + '_r' + (this.remoteProjIdCounter++);
      const proj = new Projectile(this.scene, origin, d, data.ownerId, pid, data.color, data.weapon);
      proj.isRemote = true;
      this.projectiles.push(proj);
    }
    if (this.network.isHost) this.network.broadcast(data, this._findConn(data.ownerId));
  }

  // 被弾処理
  _handleHit(data) {
    if (data.targetId === this.network.myId) {
      // 無敵中ならダメージを受けない
      if (this.invincibleTimer > 0) return;
      const killed = this.localPlayer.takeDamage(data.damage || 1);
      this.updateHealthUI();
      if (killed) {
        this.deaths++;
        document.getElementById('death-count').textContent = this.deaths;
        this.respawnTimer = CONFIG.killCamDuration + CONFIG.respawnDelay;
        this.killCamKillerId = data.shooterId;
        document.getElementById('death-screen').classList.add('show');
        document.getElementById('respawn-timer').textContent = `RESPAWN IN ${Math.ceil(this.respawnTimer)}`;
        /* キルカメラ中はマウスを自由に */
        if (document.pointerLockElement) document.exitPointerLock();
        const wpName = data.weapon ? WEAPONS[data.weapon]?.name || data.weapon : '';
        this.addKillFeed(`☠ Eliminated by ${data.shooterName || 'opponent'}${wpName ? ' [' + wpName + ']' : ''}`);
      }
    }
    if (data.lethal) {
      this._trackKill(data.shooterId, data.targetId);
    }
    const shooter = this.players.get(data.shooterId);
    if (data.lethal && data.targetId !== this.network.myId) {
      const wpName = data.weapon ? WEAPONS[data.weapon]?.name || data.weapon : '';
      this.addKillFeed(`🎯 ${data.shooterName || 'Someone'} eliminated ${data.targetName || 'opponent'}${wpName ? ' [' + wpName + ']' : ''}`);
    }
    if (this.network.isHost) this.network.broadcast(data, this._findConn(data.shooterId));
  }

  // リモートのリスポーン処理
  _handleRemoteRespawn(data) {
    const p = this.players.get(data.id);
    if (p) {
      p.health = CONFIG.maxHealth;
      p.alive = true;
      if (data.pos) { p.position.set(data.pos.x, data.pos.y, data.pos.z); p.targetPosition.copy(p.position); }
      else p.spawn();
      p.updateMesh();
    }
    if (this.network.isHost) this.network.broadcast(data, this._findConn(data.id));
  }

  // ゲーム開始メッセージの処理
  _handleGameStart(data) {
    this.selectedMap = data.map;
    this._createArena(data.map);
    this.startGame();
  }

  // マップ選択メッセージの処理
  _handleMapSelect(data) {
    if (!this.network.isHost) {
      this.selectedMap = data.map;
      const map = MAPS[data.map] || MAPS.grid;
      document.getElementById('guest-map-name').textContent = `${map.name} — ${map.desc}`;
      this._drawGuestMapPreview(data.map);
    }
  }

  // ゲームオーバーメッセージの処理
  _handleGameOver(data) {
    if (data.scoreboard) {
      this.players.forEach((p, id) => {
        const entry = data.scoreboard.find(s => s.id === id);
        if (entry) { p.kills = entry.kills; p.deaths = entry.deaths; }
      });
    }
    this.gameStarted = false;
    this.showResultScreen();
  }

  // ヘルスバーUIの更新
  updateHealthUI() {
    const lp = this.localPlayer;
    if (!lp) return;
    const pct = (lp.health / lp.maxHealth) * 100;
    const bar = document.getElementById('health-bar');
    bar.style.width = pct + '%';
    bar.classList.toggle('low', pct <= 30);
  }

  // メイン更新ループ
  update(dt) {
    if (!this.gameStarted || this.gameOver) return;
    const lp = this.localPlayer;

    // === プレイヤー操作処理 ===
    if (lp && lp.alive) {
      let mx = 0, mz = 0;
      if (this.keys['w']) mz -= 1;
      if (this.keys['s']) mz += 1;
      if (this.keys['a']) mx -= 1;
      if (this.keys['d']) mx += 1;

      this.dashCooldown = Math.max(0, this.dashCooldown - dt);

      if (mx !== 0 || mz !== 0) {
        const len = Math.sqrt(mx * mx + mz * mz);
        mx /= len; mz /= len;
        const fwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), lp.rotation);
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), lp.rotation);
        _v3.copy(fwd).multiplyScalar(-mz);
        _v3b.copy(right).multiplyScalar(mx);
        _v3.add(_v3b).normalize();

        if (this.keys['shift'] && this.dashCooldown <= 0 && this.dashTimer <= 0) {
          this.dashTimer = CONFIG.dashDuration;
          this.dashCooldown = CONFIG.dashCooldown;
        }

        let speed = CONFIG.playerSpeed;
        if (this.dashTimer > 0) {
          speed = CONFIG.dashSpeed;
          this.dashTimer -= dt;
          if (this.dashTimer <= 0) this.dashTimer = 0;
        }
        /* スピードパッド/テレポートチェック（移動前に適用） */
        if (this.arenaMap && this.arenaMap.pads) {
          const pHalf = CONFIG.playerSize * 0.3;
          for (const pad of this.arenaMap.pads) {
            const px = pad.p[0], pz = pad.p[2];
            const hx = pad.s[0] / 2 + pHalf, hz = pad.s[2] / 2 + pHalf;
            if (Math.abs(lp.position.x - px) < hx && Math.abs(lp.position.z - pz) < hz) {
              if (pad.speed > 0 && pad.speed !== 1) {
                speed *= pad.speed; /* 加速パッド */
              }
              if (pad.speed === 0 && this.arenaMap.teleport && this.teleportCooldown <= 0) {
                /* テレポートパッド（即時ワープ） */
                lp.position.set(this.arenaMap.teleport.x, 0, this.arenaMap.teleport.z);
                this.teleportCooldown = 1.5; /* 再使用までのクールダウン */
                this.addKillFeed('🌀 Teleported!');
              }
            }
          }
        }

        _v3.multiplyScalar(speed * dt);
        lp.position.x += _v3.x;
        lp.position.z += _v3.z;
        const half = (this.arenaMap ? this.arenaMap.size : 40) / 2 - 0.8;
        lp.position.x = Math.max(-half, Math.min(half, lp.position.x));
        lp.position.z = Math.max(-half, Math.min(half, lp.position.z));
        this._checkWallCollision(lp.position);
        lp.targetPosition.copy(lp.position);
      }

      if (this.mouseDelta !== 0) {
        lp.rotation -= this.mouseDelta * 0.003;
        lp.targetRotation = lp.rotation;
        this.mouseDelta = 0;
      }

      const wp = WEAPONS[lp.weapon];
      if (this.mouseDown && this.pointerLocked) {
        const now = performance.now();
        if (now - lp.lastFireTime > wp.fireRate * 1000) {
          lp.lastFireTime = now;
          this.shoot();
        }
      }
    }

    // === 無敵タイマーの更新と点滅エフェクト ===
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
      if (lp && lp.alive) {
        const blink = Math.sin(this.invincibleTimer * 20) > 0;
        lp.mesh.material.transparent = true;
        lp.mesh.material.opacity = blink ? 0.3 : 1;
        lp.edgeLine.material.opacity = blink ? 0.1 : 0.4;
      }
      if (this.invincibleTimer <= 0 && lp) {
        lp.mesh.material.transparent = false;
        lp.mesh.material.opacity = 1;
        lp.edgeLine.material.opacity = 0.4;
      }
    }

    // === リロード中はUIを更新 ===
    if (lp && lp.reloading) this.updateAmmoUI();

    // === テレポートクールダウン ===
    if (this.teleportCooldown > 0) this.teleportCooldown -= dt;

    // === 他プレイヤーの補間 ===
    this.players.forEach(p => { if (p.id !== this.network.myId) p.lerpToTarget(dt); p.update(dt); });

    // === 弾丸更新 ===
    this.projectiles = this.projectiles.filter(p => p.alive);
    this.projectiles.forEach(p => {
      if (p.alive && p.wp.explosive && p.age + dt * 1.1 >= p.wp.projLifetime && p.ownerId === this.network.myId) {
        this._rpgExplosion(p);
      }
      p.update(dt);
    });
    this._checkProjectileWalls();
    this._checkProjectileHits();

    // === リスポーンタイマー ===
    if (this.respawnTimer > 0) {
      this.respawnTimer -= dt;
      const remaining = Math.ceil(Math.max(0, this.respawnTimer));
      document.getElementById('respawn-timer').textContent = `RESPAWN IN ${remaining}`;
      if (this.respawnTimer <= CONFIG.killCamDuration) {
        this.killCamKillerId = null;
      }
      if (this.respawnTimer <= 0) {
        this.respawnTimer = 0;
        this.killCamKillerId = null;
        document.getElementById('death-screen').classList.remove('show');
        this.mouseDown = false;
        this.dashTimer = 0;
        this.dashCooldown = 0;
        this._respawnLocal();
      }
    }

    // === ゲームタイマー ===
    this.gameTimer -= dt;
    this.updateTimerUI();
    if (this.gameTimer <= 0) {
      this.gameTimer = 0;
      this.endGame();
    }

    this.network.sendState(dt);
    this._updateCamera(dt);
  }

  // 弾の当たり判定
  _checkProjectileHits() {
    const lp = this.localPlayer;
    if (!lp) return;
    for (const p of this.projectiles) {
      if (!p.alive) continue;
      const wp = p.wp;
      const hitDist = CONFIG.playerSize * 0.5 + wp.hitRadius;
      if (p.ownerId === this.network.myId) {
        let rpgHitPlayers = [];
        this.players.forEach((other, id) => {
          if (id === this.network.myId || !other.alive) return;
          const dist = p.mesh.position.distanceTo(new THREE.Vector3(other.position.x, CONFIG.playerHeight / 2, other.position.z));
          if (dist < hitDist) {
            if (p.hitPlayers.has(id)) return;
            p.hitPlayers.add(id);
            if (wp.explosive) {
              rpgHitPlayers.push({ id, other, dist });
            } else {
              const killed = other.takeDamage(wp.damage);
              const hitMsg = {
                type: 'hit', shooterId: this.network.myId, targetId: id,
                damage: wp.damage, shooterName: lp.name, targetName: other.name,
                lethal: killed, weapon: lp.weapon,
              };
              if (this.network.isHost) this.network.broadcast(hitMsg);
              else this.network.send(hitMsg);
              if (killed) {
                this.kills++;
                document.getElementById('kill-count').textContent = this.kills;
                this.addKillFeed(`🎯 Eliminated ${other.name} [${wp.name}]`);
                this._trackKill(this.network.myId, id);
              }
              p.destroy(); /* 命中後は弾を即座に破棄（連続ヒット防止） */
            }
          }
        });
        if (wp.explosive && rpgHitPlayers.length > 0) {
          p.destroy();
          rpgHitPlayers.forEach(({ id, other }) => {
            const killed = other.takeDamage(wp.damage);
            const hitMsg = {
              type: 'hit', shooterId: this.network.myId, targetId: id,
              damage: wp.damage, shooterName: lp.name, targetName: other.name,
              lethal: killed, weapon: lp.weapon,
            };
            if (this.network.isHost) this.network.broadcast(hitMsg);
            else this.network.send(hitMsg);
            if (killed) {
              this.kills++;
              document.getElementById('kill-count').textContent = this.kills;
              this.addKillFeed(`🎯 Eliminated ${other.name} [${wp.name}]`);
              this._trackKill(this.network.myId, id);
            }
          });
        }
      } else {
        if (lp && lp.alive) {
          const dist = p.mesh.position.distanceTo(new THREE.Vector3(lp.position.x, CONFIG.playerHeight / 2, lp.position.z));
          if (dist < hitDist) p.destroy();
        }
      }
    }
  }

  // ローカルプレイヤーのリスポーン
  _respawnLocal() {
    const lp = this.localPlayer;
    if (!lp) return;
    const half = (this.arenaMap ? this.arenaMap.size : 40) / 2 - 3;
    lp.position.set((Math.random() - 0.5) * half * 2, 0, (Math.random() - 0.5) * half * 2);
    lp.targetPosition.copy(lp.position);
    lp.health = CONFIG.maxHealth;
    lp.alive = true;
    this.mouseDown = false;
    this.invincibleTimer = CONFIG.invincibleTime; // 無敵時間を設定
    lp.refillAmmo();
    this.updateAmmoUI();
    this.updateHealthUI();
    this.addKillFeed('🔄 Respawned');
    const msg = { type: 'respawn', id: this.network.myId, pos: { x: lp.position.x, y: 0, z: lp.position.z } };
    if (this.network.isHost) this.network.broadcast(msg);
    else this.network.send(msg);
  }

  // カメラ制御（キルカメラ → 三人称視点）
  _updateCamera(dt) {
    if (this.respawnTimer > CONFIG.respawnDelay && this.killCamKillerId) {
      const killer = this.players.get(this.killCamKillerId);
      if (killer && killer.alive) {
        const p = killer.position;
        const dist = 12, height = 10;
        const target = new THREE.Vector3(p.x + 8, p.y + height, p.z + 8);
        this.camera.position.lerp(target, 1 - Math.exp(-6 * dt));
        this.camera.lookAt(p.x, 0.5, p.z);
        return;
      }
    }
    const lp = this.localPlayer;
    if (!lp) return;
    const p = lp.position;
    const dist = 18, height = 14, angle = lp.rotation;
    const target = new THREE.Vector3(p.x + Math.sin(angle) * dist, p.y + height, p.z + Math.cos(angle) * dist);
    this.camera.position.lerp(target, 1 - Math.exp(-8 * dt));
    this.camera.lookAt(p.x, 0.5, p.z);
  }

  // キル/デスのトラッキング（スコアボード用）
  _trackKill(shooterId, targetId) {
    if (!this.scoreboard.has(shooterId)) {
      const p = this.players.get(shooterId);
      this.scoreboard.set(shooterId, { kills: 0, deaths: 0, name: p ? p.name : '?', color: p ? p.color : 0xffffff });
    }
    if (!this.scoreboard.has(targetId)) {
      const p = this.players.get(targetId);
      this.scoreboard.set(targetId, { kills: 0, deaths: 0, name: p ? p.name : '?', color: p ? p.color : 0xffffff });
    }
    this.scoreboard.get(shooterId).kills++;
    this.scoreboard.get(targetId).deaths++;
    const shooter = this.players.get(shooterId);
    if (shooter) shooter.kills++;
    const target = this.players.get(targetId);
    if (target) target.deaths++;
  }

  // 壁との衝突判定（プレイヤー用）
  _checkWallCollision(pos) {
    const map = this.arenaMap;
    if (!map || !map.walls || map.walls.length === 0) return;
    const pHalf = CONFIG.playerSize * 0.4;
    for (const w of map.walls) {
      const wx = w.p[0], wz = w.p[2];
      const wHalfX = w.s[0] / 2 + pHalf;
      const wHalfZ = w.s[2] / 2 + pHalf;
      const dx = pos.x - wx;
      const dz = pos.z - wz;
      const overlapX = wHalfX - Math.abs(dx);
      const overlapZ = wHalfZ - Math.abs(dz);
      if (overlapX > 0 && overlapZ > 0) {
        if (overlapX < overlapZ) {
          pos.x += dx > 0 ? overlapX : -overlapX;
        } else {
          pos.z += dz > 0 ? overlapZ : -overlapZ;
        }
      }
    }
  }

  // 弾と壁の衝突判定
  _checkProjectileWalls() {
    const map = this.arenaMap;
    if (!map) return;
    const half = map.size / 2;
    const wt = map.wallThick;
    const wh = map.wallHeight;
    const perimeterWalls = [
      { p: [0, wh/2, -half], s: [map.size, wh, wt] },
      { p: [0, wh/2, half], s: [map.size, wh, wt] },
      { p: [-half, wh/2, 0], s: [wt, wh, map.size] },
      { p: [half, wh/2, 0], s: [wt, wh, map.size] },
    ];
    const allWalls = (map.walls || []).concat(perimeterWalls);
    for (const p of this.projectiles) {
      if (!p.alive) continue;
      let hitWall = false;
      for (const w of allWalls) {
        const wx = w.p[0], wz = w.p[2];
        const wHalfX = w.s[0] / 2 + CONFIG.projectileRadius;
        const wHalfZ = w.s[2] / 2 + CONFIG.projectileRadius;
        const dx = p.mesh.position.x - wx;
        const dz = p.mesh.position.z - wz;
        if (Math.abs(dx) < wHalfX && Math.abs(dz) < wHalfZ) {
          if (p.wp.explosive && p.ownerId === this.network.myId) {
            this._rpgExplosion(p);
          }
          p.destroy();
          hitWall = true;
          break;
        }
      }
      if (hitWall) continue;
    }
  }

  // RPGの爆発処理（範囲ダメージ）
  _rpgExplosion(proj) {
    const lp = this.localPlayer;
    if (!lp) return;
    const wp = proj.wp;
    const rpgPos = proj.mesh.position;
    this.players.forEach((other, id) => {
      if (id === this.network.myId || !other.alive) return;
      if (proj.hitPlayers.has(id)) return;
      proj.hitPlayers.add(id);
      const dist = rpgPos.distanceTo(new THREE.Vector3(other.position.x, CONFIG.playerHeight / 2, other.position.z));
      if (dist < CONFIG.playerSize * 0.5 + wp.hitRadius) {
        const killed = other.takeDamage(wp.damage);
        const hitMsg = {
          type: 'hit', shooterId: this.network.myId, targetId: id,
          damage: wp.damage, shooterName: lp.name, targetName: other.name,
          lethal: killed, weapon: proj.weapon,
        };
        if (this.network.isHost) this.network.broadcast(hitMsg);
        else this.network.send(hitMsg);
        if (killed) {
          this.kills++;
          document.getElementById('kill-count').textContent = this.kills;
          this.addKillFeed(`💥 Eliminated ${other.name} [${wp.name}]`);
          this._trackKill(this.network.myId, id);
        }
      }
    });
  }

  // タイマーUIの更新
  updateTimerUI() {
    const remaining = Math.max(0, Math.ceil(this.gameTimer));
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const el = document.getElementById('timer-display');
    el.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    el.classList.toggle('urgent', remaining <= 10);
  }

  // リザルト画面の表示
  showResultScreen() {
    this.gameOver = true;
    document.getElementById('timer-display').textContent = '--:--';
    document.getElementById('death-screen').classList.remove('show');
    this.respawnTimer = 0;
    const sb = [];
    this.players.forEach((p, id) => {
      sb.push({ id, name: p.name, kills: p.kills, deaths: p.deaths, color: p.color });
    });
    if (sb.length === 0) {
      this.scoreboard.forEach((entry, id) => {
        sb.push({ id, name: entry.name, kills: entry.kills, deaths: entry.deaths, color: entry.color });
      });
    }
    sb.sort((a, b) => b.kills - a.kills);
    document.getElementById('result-screen').classList.add('show');
    const winnerEl = document.getElementById('result-winner');
    if (sb.length > 0 && sb[0].kills > 0) {
      winnerEl.textContent = `🏆 WINNER: ${sb[0].name} — ${sb[0].kills} KILLS`;
    } else {
      winnerEl.textContent = '💀 NO WINNER';
    }
    const list = document.getElementById('result-list');
    list.innerHTML = '';
    sb.forEach((entry, i) => {
      const div = document.createElement('div');
      div.className = 'result-entry' + (i === 0 && entry.kills > 0 ? ' winner' : '');
      const rank = document.createElement('span');
      rank.className = 'r-rank';
      if (i === 0) rank.textContent = '#' + (i + 1);
      else rank.textContent = '#' + (i + 1);
      const dot = document.createElement('span');
      dot.className = 'r-dot';
      dot.style.background = '#' + entry.color.toString(16).padStart(6, '0');
      const name = document.createElement('span');
      name.className = 'r-name';
      name.textContent = entry.name + (entry.id === this.network.myId ? ' (YOU)' : '');
      const kills = document.createElement('span');
      kills.className = 'r-kills';
      kills.textContent = entry.kills + ' K';
      const deaths = document.createElement('span');
      deaths.className = 'r-deaths';
      deaths.textContent = entry.deaths + ' D';
      div.appendChild(rank);
      div.appendChild(dot);
      div.appendChild(name);
      div.appendChild(kills);
      div.appendChild(deaths);
      list.appendChild(div);
    });
  }

  // ゲーム終了処理
  endGame() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.gameStarted = false;
    if (this.network.isHost) {
      const sb = [];
      this.players.forEach((p, id) => {
        sb.push({ id, name: p.name, kills: p.kills, deaths: p.deaths, color: p.color });
      });
      this.network.broadcast({ type: 'game_over', scoreboard: sb });
    }
    this.showResultScreen();
  }

  // アニメーションループ
  animate() {
    requestAnimationFrame(() => this.animate());
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
  }
}

// ===== UIイベント設定 =====

const game = new Game();
game.init();

/* ホストゲームボタン */
document.getElementById('btn-host').addEventListener('click', async () => {
  document.getElementById('step-1').style.display = 'none';
  document.getElementById('step-host').style.display = 'block';
  document.getElementById('overlay-status').textContent = '⏳ Creating room...';
  try {
    const roomId = await game.network.createRoom();
    game.localId = roomId;
    const hostName = document.getElementById('host-name-input').value.trim() || 'Host';
    game.addPlayer(roomId, PLAYER_COLORS[0], hostName);
    const me = game.players.get(roomId);
    if (me) { me.weapon = game.loadoutWeapon; me.lastFireTime = 0; }
    document.getElementById('room-id-display').textContent = roomId;
    document.getElementById('overlay-status').textContent = 'Share this room ID with friends';
    document.getElementById('step-host-status').textContent = 'Waiting for players to join...';
  } catch (err) {
    document.getElementById('overlay-status').textContent = '❌ Error: ' + err.message;
  }
});

/* ホスト戻るボタン */
document.getElementById('btn-host-back').addEventListener('click', () => {
  game.network.close();
  game.connectionHandled = false;
  game.players.forEach((p, id) => { if (id !== game.localId) game.removePlayer(id); });
  document.getElementById('step-host').style.display = 'none';
  document.getElementById('step-1').style.display = 'block';
  document.getElementById('overlay-status').textContent = 'Click a button to start';
});

/* 参加画面へボタン */
document.getElementById('btn-join').addEventListener('click', () => {
  document.getElementById('step-1').style.display = 'none';
  document.getElementById('step-join').style.display = 'block';
  document.getElementById('overlay-status').textContent = 'Enter the host\'s room ID';
});

/* タイトル画面の武器ボタンの初期アクティブ状態 */
document.querySelector('#title-weapon-btns .map-btn')?.classList.add('active');

/* 参加戻るボタン */
document.getElementById('btn-join-back').addEventListener('click', () => {
  document.getElementById('step-join').style.display = 'none';
  document.getElementById('step-1').style.display = 'block';
  document.getElementById('overlay-status').textContent = 'Click a button to start';
});

/* ルーム参加ボタン */
document.getElementById('btn-join-room').addEventListener('click', async () => {
  let roomId = document.getElementById('room-id-input').value.trim().toUpperCase();
  if (!roomId.startsWith('NEON-')) roomId = 'NEON-' + roomId;
  if (roomId === 'NEON-') return;
  const playerName = document.getElementById('player-name-input').value.trim() || 'Player';
  document.getElementById('overlay-status').textContent = '⏳ Joining room...';
  try {
    await game.network.joinRoom(roomId, playerName);
    document.getElementById('overlay-status').textContent = '🔗 Connecting...';
  } catch (err) {
    document.getElementById('overlay-status').textContent = '❌ Error: ' + err.message;
  }
});

/* タイトル画面の武器選択 */
document.getElementById('title-weapon-btns').addEventListener('click', (e) => {
  const btn = e.target.closest('.map-btn');
  if (!btn) return;
  const wp = btn.dataset.weapon;
  game.loadoutWeapon = wp;
  if (game.localPlayer) game.localPlayer.weapon = wp;
  document.querySelectorAll('#title-weapon-btns .map-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
});

/* ルームIDコピーボタン */
document.getElementById('btn-copy-room').addEventListener('click', () => {
  const text = document.getElementById('room-id-display').textContent;
  navigator.clipboard.writeText(text).catch(() => {});
  document.getElementById('overlay-status').textContent = '✅ Copied! Share this ID with friends';
});

/* ゲーム開始ボタン（ホスト用） */
document.getElementById('btn-start-game').addEventListener('click', () => {
  game._createArena(game.selectedMap);
  game.network.broadcast({ type: 'game_start', map: game.selectedMap });
  game.startGame();
});

/* ホスト名入力 */
document.getElementById('host-name-input').addEventListener('input', () => {
  const p = game.players.get(game.localId);
  if (p) {
    p.name = document.getElementById('host-name-input').value.trim() || 'Host';
    game.updatePlayerListUI();
  }
});

/* ロビーに戻るボタン */
document.getElementById('btn-back-lobby').addEventListener('click', () => {
  document.getElementById('result-screen').classList.remove('show');
  game.gameStarted = false;
  game.gameOver = false;
  game.mouseDown = false;
  game.dashTimer = 0;
  game.dashCooldown = 0;
  game.invincibleTimer = 0;
  game.players.forEach(p => { p.alive = true; p.health = CONFIG.maxHealth; p.updateMesh(); });
  game.projectiles.forEach(p => p.destroy());
  game.projectiles = [];
  document.getElementById('overlay').classList.remove('hidden');
  document.getElementById('instructions').classList.add('hidden');
  document.getElementById('death-screen').classList.remove('show');
  document.getElementById('timer-display').textContent = '--:--';
  document.getElementById('ammo-display').textContent = '--/--';
  document.getElementById('match-btn').style.display = ''; /* 再表示 */
  game.updatePlayerListUI();
  if (game.network.isHost) {
    const name = document.getElementById('host-name-input').value.trim() || 'Host';
    const me = game.players.get(game.localId);
    if (me) me.name = name;
    document.querySelectorAll('.step-section').forEach(el => el.style.display = 'none');
    document.getElementById('waiting-room').style.display = 'block';
    document.getElementById('overlay-status').textContent = 'Select map and press START';
    game.updatePlayerListUI();
  } else {
    document.querySelectorAll('.step-section').forEach(el => el.style.display = 'none');
    document.getElementById('waiting-room').style.display = 'block';
    document.getElementById('overlay-status').textContent = 'Waiting for host...';
  }
});

/* マッチボタン（クイック参加） */
document.getElementById('match-btn').addEventListener('click', () => {
  document.getElementById('player-name-input').value = 'Player' + Math.floor(Math.random() * 9000 + 1000);
  document.querySelector('#title-weapon-btns .map-btn.active')?.click() ||
    document.querySelector('#title-weapon-btns .map-btn')?.click();
  document.getElementById('btn-join-room')?.click();
});

/* デス画面の武器選択 */
document.getElementById('death-weapon-btns').addEventListener('click', (e) => {
  const btn = e.target.closest('.map-btn');
  if (!btn) return;
  const wp = btn.dataset.weapon;
  if (game.localPlayer) {
    game.localPlayer.weapon = wp;
    game.localPlayer.lastFireTime = 0;
  }
  document.querySelectorAll('#death-weapon-btns .map-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
});

/* 待機室退出ボタン */
document.getElementById('btn-leave-lobby').addEventListener('click', () => {
  game.network.close();
  game.connectionHandled = false;
  game.players.forEach((p, id) => game.removePlayer(id));
  game.projectiles.forEach(p => p.destroy());
  game.projectiles = [];
  game.gameStarted = false;
  game.gameOver = false;
  document.getElementById('result-screen').classList.remove('show');
  document.getElementById('death-screen').classList.remove('show');
  document.getElementById('overlay').classList.remove('hidden');
  document.querySelectorAll('.step-section').forEach(el => el.style.display = 'none');
  document.getElementById('waiting-room').style.display = 'none';
  document.getElementById('step-1').style.display = 'block';
  document.getElementById('overlay-status').textContent = 'Click a button to start';
  document.getElementById('match-btn').style.display = '';
});

/* ブラウザリロード/タブ閉じ時のクリーンアップ */
window.addEventListener('beforeunload', () => {
  game.network.close();
});

console.log('🚀 NEON ARENA loaded. Click "Host Game" or "Join Game" to begin.');
