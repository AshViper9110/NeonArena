/* ============================================================
   NEON ARENA - 命中判定検証
   ヒットスキャン方式の命中判定と当たり判定を担当
   ============================================================ */

/**
 * 命中判定検証クラス
 * レイキャストによるHitscan方式の命中判定を行う
 * オブジェクトプールからアクティブなオブジェクトとの交差を検証
 */
class HitValidator {
  constructor(scene, objectPool) {
    this.scene = scene;
    this.objectPool = objectPool;

    /* レイキャスト用のレイ */
    this.raycaster = new THREE.Raycaster();

    /* 命中無視リスト（自プレイヤーなど） */
    this.ignoreList = [];
  }

  /**
   * 指定された発射位置と方向で命中判定を実行
   * @param {THREE.Vector3} origin - 発射原点
   * @param {THREE.Vector3} direction - 発射方向（正規化済み）
   * @param {number} range - 有効射程距離
   * @returns {Object|null} 命中結果（位置・対象など）、命中なしはnull
   */
  validateHit(origin, direction, range) {
    /* レイを設定 */
    this.raycaster.set(origin, direction);
    this.raycaster.far = range;

    /* アクティブなオブジェクトのメッシュリストを収集 */
    const targets = this._getValidTargets();

    /* 交差判定を実行（ソート済みで最も近いもののみ取得） */
    const intersects = this.raycaster.intersectObjects(targets, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      /* メッシュの所属オブジェクトを特定 */
      const hitObject = this._findOwner(hit.object);
      return {
        position: hit.point,              // 衝突位置（ワールド座標）
        normal: hit.face.normal,          // 衝突面の法線
        object: hitObject,                // 衝突したゲームオブジェクト
        distance: hit.distance,           // 発射点からの距離
        mesh: hit.object,                 // 衝突したメッシュ
      };
    }
    return null;
  }

  /**
   * 検証対象となるアクティブオブジェクトのメッシュ一覧を収集
   * @returns {THREE.Mesh[]} 対象メッシュ配列
   */
  _getValidTargets() {
    const targets = [];

    if (!this.objectPool) return targets;

    /* オブジェクトプールからアクティブなオブジェクトのメッシュを取得 */
    const pool = this.objectPool;
    const categories = [
      pool.activeEnemies,
      pool.activeProjectiles,
      pool.activePowerups,
    ];

    for (const cat of categories) {
      if (cat && Array.isArray(cat)) {
        for (const obj of cat) {
          if (obj && obj.mesh) {
            targets.push(obj.mesh);
          }
        }
      }
    }

    return targets;
  }

  /**
   * 衝突したメッシュから所有オブジェクトを特定
   * @param {THREE.Mesh} mesh - 衝突したメッシュ
   * @returns {Object|null} 所有オブジェクト
   */
  _findOwner(mesh) {
    /* メッシュの userData にオブジェクト参照があれば利用 */
    if (mesh.userData && mesh.userData.owner) {
      return mesh.userData.owner;
    }
    return null;
  }

  /**
   * 貫通可能かどうかを判定
   * @param {Object} hitObject - 命中したオブジェクト
   * @returns {boolean} 貫通可能ならtrue
   */
  canPenetrate(hitObject) {
    /* エネミーのみ貫通不可、それ以外（発射物等）は貫通可能 */
    return !hitObject || !hitObject.isEnemy;
  }

  /**
   * 無視リストにオブジェクトを追加
   * @param {Object} obj - 無視するオブジェクト
   */
  addIgnore(obj) {
    if (!this.ignoreList.includes(obj)) {
      this.ignoreList.push(obj);
    }
  }

  /**
   * 状態をリセット
   */
  reset() {
    this.ignoreList = [];
  }
}
