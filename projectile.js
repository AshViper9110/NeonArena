/* ============================================================
   NEON ARENA - プロジェクタイル（弾丸）
   弾丸の生成、更新、軌跡描画、寿命/範囲管理
   ============================================================ */

/* 共有ジオメトリ（インスタンス間でメモリ節約） */
const _sharedProjGeo = new THREE.SphereGeometry(0.3, 6, 6);
const _sharedProjGlowGeo = new THREE.SphereGeometry(0.6, 6, 6);
const _v3_tmp = new THREE.Vector3();

class Projectile {
  /**
   * @param {THREE.Scene} scene - Three.jsシーン
   * @param {THREE.Vector3} origin - 発射原点
   * @param {THREE.Vector3} dir - 発射方向（正規化済み）
   * @param {string} ownerId - 発射したプレイヤーのID
   * @param {string|number} id - 弾丸固有ID
   * @param {number} color - 色（16進数）
   * @param {string} weapon - 武器ID
   * @param {number} mapHalf - マップの半分サイズ（境界判定用）
   */
  constructor(scene, origin, dir, ownerId, id, color, weapon, mapHalf) {
    this.scene = scene;
    this.ownerId = ownerId;
    this.id = id;
    this.weapon = weapon || 'pistol';
    this.wp = WEAPONS[this.weapon] || WEAPONS.pistol;
    this.alive = true;
    this.age = 0;
    this.color = color || this.wp.color;
    this.isHostProjectile = false;   /* ホスト生成の弾か */
    this.isRemote = false;           /* リモート通知由来か */
    this.mapHalf = mapHalf !== undefined ? mapHalf : 40;

    /* メイン球体 */
    this.mat = new THREE.MeshBasicMaterial({ color: this.color });
    this.mesh = new THREE.Mesh(_sharedProjGeo, this.mat);
    this.mesh.position.copy(origin);
    this.mesh.position.y += CONFIG.playerHeight * 0.6;
    this.scene.add(this.mesh);

    /* グロー（発光） */
    this.glowMat = new THREE.MeshBasicMaterial({ color: this.color, transparent: true, opacity: 0.25 });
    this.glow = new THREE.Mesh(_sharedProjGlowGeo, this.glowMat);
    this.glow.position.copy(this.mesh.position);
    this.scene.add(this.glow);

    /* 速度ベクトル */
    this.velocity = dir.clone().multiplyScalar(this.wp.projSpeed || 50);
    this.velocity.y = 0;

    /* 軌跡管理 */
    this.trail = [];
    this.trailTimer = 0;
    this.exploded = false;
    this.hitPlayers = new Set();
    this.speed = this.wp.projSpeed || 50;
    this.ricochetCount = 0;
    this.pierceCount = 0;
    this.passiveSizeMult = 1;
    this.ricocheted = false;
    this.isHoming = false;
    this.homingTargetId = null;
    this.homingStrength = 3;
    this._distTraveled = 0;
    this.maxDist = this.wp.range || 40;
    this.maxAge = this.wp.projLifetime || 3;
  }

  /**
   * 毎フレームの更新：移動・軌跡生成・有効範囲/寿命チェック
   * @param {number} dt - デルタタイム
   */
  update(dt) {
    if (!this.alive) return;
    this.age += dt;

    /* 進行距離/寿命による消滅判定 */
    const speed = this.velocity.length();
    this._distTraveled += speed * dt;
    if (this._distTraveled >= this.maxDist) { this.destroy(); return; }
    if (this.age > this.maxAge) { this.destroy(); return; }

    /* 位置更新 */
    this.mesh.position.x += this.velocity.x * dt;
    this.mesh.position.z += this.velocity.z * dt;

    /* アリーナ境界チェック */
    const half = this.mapHalf;
    if (Math.abs(this.mesh.position.x) > half || Math.abs(this.mesh.position.z) > half) {
      this.destroy();
      return;
    }

    /* グロー位置追従＋パルスアニメ */
    this.glow.position.copy(this.mesh.position);
    const pulse = 1 + 0.3 * Math.sin(this.age * 20);
    this.glow.scale.setScalar(pulse);

    /* 軌跡（テール）生成 */
    this.trailTimer += dt;
    if (this.trailTimer > 0.03) {
      this.trailTimer = 0;
      this._spawnTrail();
    }

    /* 軌跡のフェードアウト更新 */
    const trailLife = 0.2 + this.speed * 0.006;
    const trails = this.trail;
    for (let i = trails.length - 1; i >= 0; i--) {
      const t = trails[i];
      t.life += dt;
      if (t.life > trailLife) {
        if (t.mesh.parent) this.scene.remove(t.mesh);
        trails.splice(i, 1);
        continue;
      }
      const s = t.life / trailLife;
      const scale = (1 - s) * (0.5 + this.speed * 0.02);
      t.mesh.scale.setScalar(Math.max(scale, 0.01));
      t.mesh.material.opacity = (1 - s) * 0.4;
    }
  }

  /* 軌跡エフェクト（小さな半透明球）を現在位置に追加 */
  _spawnTrail() {
    const r = this.wp.projRadius || 0.2;
    const trailSize = r * (0.5 + this.speed * 0.01);
    const geo = new THREE.SphereGeometry(Math.min(trailSize, 0.5), 4, 4);
    const mat = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: 0.4,
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(this.mesh.position);
    this.scene.add(m);
    this.trail.push({ mesh: m, life: 0, geo, mat });
  }

  /* 爆発エフェクト：スケールアニメーション＋フェードアウト（requestAnimationFrame） */
  explosionFX() {
    if (this.exploded) return;
    this.exploded = true;
    const r = (this.wp.projRadius || 0.2) * 8;
    const boomMat = new THREE.MeshBasicMaterial({
      color: 0xff4400,
      transparent: true,
      opacity: 0.6,
    });
    const boom = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 10), boomMat);
    boom.position.copy(this.mesh.position);
    this.scene.add(boom);
    const start = performance.now();
    const anim = () => {
      const t = (performance.now() - start) / 400;
      if (t >= 1) {
        this.scene.remove(boom);
        boom.geometry.dispose();
        boom.material.dispose();
        return;
      }
      const s = 1 + t * 3;
      boom.scale.setScalar(s);
      boom.material.opacity = 0.6 * (1 - t);
      requestAnimationFrame(anim);
    };
    anim();
  }

  /* 弾丸破棄：爆発エフェクト（該当武器のみ）＋メモリ解放 */
  destroy() {
    if (!this.alive) return;
    if (this.wp.explosive) this.explosionFX();
    this.alive = false;
    if (this.mesh.parent) this.scene.remove(this.mesh);
    if (this.glow.parent) this.scene.remove(this.glow);
    this.mat.dispose();
    this.glowMat.dispose();
    /* 軌跡メッシュもすべて破棄 */
    const trails = this.trail;
    for (let i = 0; i < trails.length; i++) {
      const t = trails[i];
      if (t.mesh.parent) this.scene.remove(t.mesh);
      t.geo.dispose();
      t.mat.dispose();
    }
    this.trail = [];
  }
}
