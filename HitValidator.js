// ============================================================
// NEON ARENA - ヒット判定
// 弾丸・爆発・壁との当たり判定を提供
// ============================================================

class HitValidator {
  constructor(game) {
    this.game = game;  // Gameインスタンス参照
  }

  /**
   * 弾丸のプレイヤー命中判定
   * @param {Object} proj - 弾丸オブジェクト
   * @param {Object} targetPlayer - 対象プレイヤー
   * @returns {boolean} 命中ならtrue
   */
  checkProjectileHit(proj, targetPlayer) {
    const wp = proj.wp || WEAPONS[proj.weapon] || WEAPONS.pistol;
    const hitDist = CONFIG.playerSize * 0.5 + (wp.hitRadius || 0.8);
    const targetPos = new THREE.Vector3(
      targetPlayer.position.x,
      CONFIG.playerHeight / 2,
      targetPlayer.position.z
    );
    const dist = proj.mesh.position.distanceTo(targetPos);
    return dist < hitDist;
  }

  /**
   * 爆発のプレイヤー命中判定
   * @param {THREE.Vector3} explosionPos - 爆発中心座標
   * @param {Object} targetPlayer - 対象プレイヤー
   * @param {Object} wp - 武器定義
   * @returns {boolean} 範囲内ならtrue
   */
  checkExplosionHit(explosionPos, targetPlayer, wp) {
    const hitDist = CONFIG.playerSize * 0.5 + (wp.hitRadius || 2.5);
    const targetPos = new THREE.Vector3(
      targetPlayer.position.x,
      CONFIG.playerHeight / 2,
      targetPlayer.position.z
    );
    const dist = explosionPos.distanceTo(targetPos);
    return dist < hitDist;
  }

  /**
   * 弾丸の壁衝突判定
   * @param {Object} proj - 弾丸オブジェクト
   * @param {Array} walls - 壁配列
   * @param {number} half - マップ半分サイズ
   * @returns {boolean} 衝突ならtrue
   */
  checkWallHit(proj, walls, half) {
    const p = proj.mesh.position;
    const pr = CONFIG.projectileRadius;
    if (Math.abs(p.x) > half - pr || Math.abs(p.z) > half - pr) return true;
    if (!walls) return false;
    for (const w of walls) {
      const wx = w.p[0], wz = w.p[2];
      const wHalfX = w.s[0] / 2 + pr;
      const wHalfZ = w.s[2] / 2 + pr;
      if (Math.abs(p.x - wx) < wHalfX && Math.abs(p.z - wz) < wHalfZ) return true;
    }
    return false;
  }
}
