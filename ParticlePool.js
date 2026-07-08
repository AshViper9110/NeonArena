/* ============================================================
   NEON ARENA - パーティクルプール
   エフェクト用パーティクルの生成・更新・管理
   ============================================================ */

/**
 * パーティクルプールクラス
 * 銃弾の火花や爆発エフェクトなどの粒子をプール管理する
 * 重力・減衰・移動をシミュレーションし、寿命が尽きたものを自動回収
 */
class ParticlePool {
  constructor(scene) {
    this.scene = scene;
    this.pool = [];               // 未使用パーティクル
    this.active = [];             // 使用中パーティクル
    this.maxSize = 500;           // プール上限
    this.sharedGeo = new THREE.SphereGeometry(0.08, 4, 4);
    this.sharedSparkGeo = new THREE.BoxGeometry(0.05, 0.05, 0.15);
  }

  /**
   * 新規パーティクルを生成
   * @returns {Object} パーティクルオブジェクト
   */
  _createParticle() {
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
    const mesh = new THREE.Mesh(this.sharedGeo, mat);
    return { mesh, mat, life: 0, maxLife: 0, velocity: new THREE.Vector3() };
  }

  /**
   * パーティクルを取得・初期化
   * @param {number} color - 色（16進数）
   * @param {THREE.Vector3} pos - 初期位置
   * @param {THREE.Vector3} vel - 初速度
   * @param {number} life - 寿命（秒）
   * @param {number} size - サイズ倍率
   * @returns {Object} パーティクルオブジェクト
   */
  get(color, pos, vel, life, size) {
    let p;
    if (this.pool.length > 0) {
      p = this.pool.pop();
    } else {
      p = this._createParticle();
    }
    p.mesh.material = p.mat;
    p.mat.color.setHex(color);
    p.mat.opacity = 1;
    p.mesh.position.copy(pos);
    p.mesh.scale.setScalar(size || 1);
    p.velocity.copy(vel);
    p.life = 0;
    p.maxLife = life || 0.5;
    p.alive = true;
    if (!p.mesh.parent) this.scene.add(p.mesh);
    p.mesh.visible = true;
    this.active.push(p);
    return p;
  }

  /**
   * 火花パーティクルを取得（専用形状）
   * @param {number} color - 色
   * @param {THREE.Vector3} pos - 位置
   * @param {THREE.Vector3} vel - 速度
   * @param {number} life - 寿命
   * @returns {Object} パーティクルオブジェクト
   */
  getSpark(color, pos, vel, life) {
    let p;
    if (this.pool.length > 0) {
      p = this.pool.pop();
    } else {
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
      const mesh = new THREE.Mesh(this.sharedSparkGeo, mat);
      p = { mesh, mat, life: 0, maxLife: 0, velocity: new THREE.Vector3() };
    }
    p.mat.color.setHex(color);
    p.mat.opacity = 1;
    p.mesh.position.copy(pos);
    p.mesh.scale.setScalar(1);
    p.velocity.copy(vel);
    p.life = 0;
    p.maxLife = life || 0.3;
    p.alive = true;
    if (!p.mesh.parent) this.scene.add(p.mesh);
    p.mesh.visible = true;
    this.active.push(p);
    return p;
  }

  /**
   * パーティクルをプールに戻す
   * @param {Object} p - 解放するパーティクル
   */
  release(p) {
    const idx = this.active.indexOf(p);
    if (idx >= 0) this.active.splice(idx, 1);
    p.mesh.visible = false;
    if (p.mesh.parent) p.mesh.parent.remove(p.mesh);
    if (this.pool.length < this.maxSize) {
      this.pool.push(p);
    } else {
      p.mat.dispose();
    }
  }

  /**
   * 全パーティクルを更新（移動・重力・減衰）
   * 寿命が尽きたものは自動解放
   * @param {number} dt - デルタタイム（秒）
   */
  update(dt) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.release(p);
        continue;
      }
      const t = p.life / p.maxLife;
      p.mesh.position.x += p.velocity.x * dt;
      p.mesh.position.y += p.velocity.y * dt;
      p.mesh.position.z += p.velocity.z * dt;
      p.velocity.y -= 5 * dt;           // 重力
      p.mat.opacity = 1 - t;            // フェードアウト
      p.mesh.scale.setScalar(1 - t * 0.5);  // 縮小
    }
  }

  /** 全パーティクルを解放 */
  releaseAll() {
    [...this.active].forEach(p => this.release(p));
  }

  /** アクティブなパーティクル数 */
  get activeCount() { return this.active.length; }
}
