/* ============================================================
   NEON ARENA - ライトオブジェクトプール
   動的ライトの生成・更新・管理
   ============================================================ */

/**
 * ライトプールクラス
 * 爆発や発射物の動的なPointLightをプール管理する
 * 生成・減衰・自動解放を行う
 */
class LightPool {
  constructor(scene) {
    this.scene = scene;
    this.pool = [];               // 未使用ライト
    this.active = [];             // 使用中ライト
    this.maxSize = 10;            // 最大同時使用数
    this._defaultLife = 0.15;     // デフォルト寿命
  }

  /**
   * 新規ライトエントリを生成
   * @returns {Object} ライトエントリ
   */
  _createLight() {
    const light = new THREE.PointLight(0xffffff, 1, 10);
    return { light, life: 0, maxLife: 0 };
  }

  /**
   * プールからライトを取得
   * @param {number} color - 色（16進数）
   * @param {THREE.Vector3} pos - 位置
   * @param {number} intensity - 強度
   * @param {number} distance - 到達距離
   * @param {number} life - 寿命
   * @returns {Object} ライトエントリ
   */
  get(color, pos, intensity, distance, life) {
    let entry;
    if (this.pool.length > 0) {
      entry = this.pool.pop();
    } else if (this.active.length < this.maxSize) {
      entry = this._createLight();
    } else {
      entry = this.active.shift();
      if (entry.light.parent) entry.light.parent.remove(entry.light);
    }
    entry.light.color.setHex(color);
    entry.light.intensity = intensity || 2;
    entry.light.distance = distance || 15;
    entry.light.position.copy(pos);
    entry.life = 0;
    entry.maxLife = life || this._defaultLife;
    if (!entry.light.parent) this.scene.add(entry.light);
    entry.light.visible = true;
    this.active.push(entry);
    return entry;
  }

  /**
   * ライトをプールに戻す
   * @param {Object} entry - 解放するライトエントリ
   */
  release(entry) {
    const idx = this.active.indexOf(entry);
    if (idx >= 0) this.active.splice(idx, 1);
    entry.light.visible = false;
    if (entry.light.parent) entry.light.parent.remove(entry.light);
    if (this.pool.length < this.maxSize) {
      this.pool.push(entry);
    }
  }

  /**
   * 全ライトを更新（経過時間による減衰）
   * @param {number} dt - デルタタイム（秒）
   */
  update(dt) {
    const active = this.active;
    for (let i = active.length - 1; i >= 0; i--) {
      const e = active[i];
      e.life += dt;
      if (e.life >= e.maxLife) {
        this.release(e);
        continue;
      }
      e.light.intensity *= (1 - dt / e.maxLife);
    }
  }

  /** 全ライトを解放 */
  releaseAll() {
    for (let i = this.active.length - 1; i >= 0; i--) {
      this.release(this.active[i]);
    }
  }

  /** アクティブなライト数 */
  get activeCount() { return this.active.length; }
}
