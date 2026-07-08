/* ============================================================
   NEON ARENA - 弾丸オブジェクトプール
   発射物（弾丸）の生成・再利用・管理
   ============================================================ */

/**
 * 弾丸プールクラス
 * 発射物のメッシュ・グロー・軌跡をプール管理する
 * 最大サイズを超えた場合はリソースを完全解放
 */
class ProjectilePool {
  constructor(scene) {
    this.scene = scene;
    this.pool = [];               // 未使用発射物
    this.active = [];             // 使用中発射物
    this.maxSize = 100;           // プール上限
    this._initGeos();
  }

  /**
   * 共有ジオメトリを初期化
   */
  _initGeos() {
    this.sharedGeo = new THREE.SphereGeometry(0.3, 8, 8);
    this.sharedGlowGeo = new THREE.SphereGeometry(0.6, 8, 8);
  }

  /**
   * 新規発射物を生成
   * @returns {Object} 発射物オブジェクト
   */
  _createProjectile() {
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const mesh = new THREE.Mesh(this.sharedGeo, mat);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 });
    const glow = new THREE.Mesh(this.sharedGlowGeo, glowMat);
    return { mesh, glow, mat, glowMat, trail: [], trailTimer: 0 };
  }

  /**
   * 発射物を初期状態にリセット
   * @param {Object} obj - 発射物オブジェクト
   */
  _resetProjectile(obj) {
    if (obj.mesh.parent) obj.mesh.parent.remove(obj.mesh);
    if (obj.glow.parent) obj.glow.parent.remove(obj.glow);
    obj.trail.forEach(t => {
      if (t.parent) t.parent.remove(t);
      if (t.geometry) t.geometry.dispose();
      if (t.material) t.material.dispose();
    });
    obj.trail = [];
    obj.trailTimer = 0;
  }

  /**
   * プールから発射物を取得
   * @returns {Object} 発射物オブジェクト
   */
  get() {
    let obj;
    if (this.pool.length > 0) {
      obj = this.pool.pop();
      this._resetProjectile(obj);
    } else {
      obj = this._createProjectile();
    }
    this.active.push(obj);
    return obj;
  }

  /**
   * 発射物をプールに戻す
   * @param {Object} obj - 解放する発射物
   */
  release(obj) {
    const idx = this.active.indexOf(obj);
    if (idx >= 0) this.active.splice(idx, 1);
    this._resetProjectile(obj);
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
    } else {
      obj.mat.dispose();
      obj.glowMat.dispose();
    }
  }

  /** 全発射物を解放 */
  releaseAll() {
    [...this.active].forEach(obj => this.release(obj));
  }

  /** アクティブな発射物数 */
  get activeCount() { return this.active.length; }
}
