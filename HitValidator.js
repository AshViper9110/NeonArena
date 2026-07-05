class HitValidator {
  constructor(game) {
    this.game = game;
  }

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
