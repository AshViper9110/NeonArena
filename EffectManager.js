const _emV3 = new THREE.Vector3();
const _emQuat = new THREE.Quaternion();

class EffectManager {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.particleManager = new ParticleManager(scene);
    this.lightPool = new LightPool(scene);
    this.activeEffects = [];
    this.ringGeo = new THREE.RingGeometry(0.1, 0.3, 8);
    this.shockwaveRingGeo = new THREE.RingGeometry(0.5, 1.0, 12);
    this.planeGeo = new THREE.PlaneGeometry(1, 1);
    this.sphereGeo = new THREE.SphereGeometry(0.4, 6, 6);
    this.sphereSmallGeo = new THREE.SphereGeometry(0.3, 5, 5);
    this.sphereGlowGeo = new THREE.SphereGeometry(0.8, 6, 6);
    this.cylinderGeo = new THREE.CylinderGeometry(0.02, 0.08, 1.5, 4);
    this.hitRingGeo = new THREE.RingGeometry(0.1, 0.4, 8);
    this.explosionFlashGeo = new THREE.SphereGeometry(0.5, 6, 6);
    this.explosionBoomGeo = new THREE.SphereGeometry(0.8, 8, 8);
    this.explosionRingGeo = new THREE.RingGeometry(0.3, 0.8, 12);
    this.explosionRing2Geo = new THREE.RingGeometry(0.2, 0.5, 12);
    this.explosionAfterglowGeo = new THREE.SphereGeometry(2, 8, 8);
    this.killRingGeo = new THREE.RingGeometry(0.5, 1.5, 12);
    this.respawnRingGeo = new THREE.RingGeometry(0.3, 0.8, 12);
    this.respawnPillarGeo = new THREE.CylinderGeometry(0.05, 1.0, 3, 6);
    this.landingRingGeo = new THREE.RingGeometry(0.3, 0.8, 8);
    this.dashRingGeo = new THREE.RingGeometry(0.2, 0.5, 8);
    this.jumpPadRingGeo = new THREE.RingGeometry(0.2, 0.6, 8);
  }

  _addEffect(mesh, mat, geo, maxLife, scaleSpeed) {
    this.scene.add(mesh);
    this.activeEffects.push({ mesh, mat, geo, life: 0, maxLife, scaleSpeed: scaleSpeed || 0 });
  }

  spawnMuzzleFlash(pos, dir, color) {
    const c = color || 0xffee00;
    const p = _emV3.copy(pos).addScaledVector(dir, 0.8);
    p.y += CONFIG.playerHeight * 0.6;

    const flashMat = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9 });
    const flash = new THREE.Mesh(this.sphereGeo, flashMat);
    flash.position.copy(p);
    this._addEffect(flash, flashMat, this.sphereGeo, 0.08);

    const glowMat = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.4 });
    const glow = new THREE.Mesh(this.sphereGlowGeo, glowMat);
    glow.position.copy(p);
    this._addEffect(glow, glowMat, this.sphereGlowGeo, 0.12);

    const beamMat = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.3 });
    const beam = new THREE.Mesh(this.cylinderGeo, beamMat);
    beam.position.copy(p);
    const up = new THREE.Vector3(0, 1, 0);
    _emQuat.setFromUnitVectors(up, dir);
    beam.quaternion.copy(_emQuat);
    this._addEffect(beam, beamMat, this.cylinderGeo, 0.1);

    this.lightPool.get(c, p, 3, 8, 0.15);

    for (let i = 0; i < 4; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 4;
      _emV3.set(
        dir.x * spd + Math.cos(a) * 2,
        (Math.random() - 0.5) * 3,
        dir.z * spd + Math.sin(a) * 2
      );
      this.particleManager._addSpark(c, p, _emV3, 0.12 + Math.random() * 0.08);
    }

    const ringMat = new THREE.MeshBasicMaterial({
      color: c, transparent: true, opacity: 0.5, side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(this.ringGeo, ringMat);
    ring.position.copy(p);
    ring.lookAt(p.clone().add(dir));
    this._addEffect(ring, ringMat, this.ringGeo, 0.12);
  }

  spawnHitEffect(pos, color) {
    const c = color || 0xffffff;

    for (let i = 0; i < 5; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 3 + Math.random() * 8;
      _emV3.set(Math.cos(a) * spd, (Math.random() - 0.5) * 6, Math.sin(a) * spd);
      this.particleManager._addSpark(c, pos, _emV3, 0.15 + Math.random() * 0.1);
    }

    const ringMat = new THREE.MeshBasicMaterial({
      color: c, transparent: true, opacity: 0.6, side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(this.hitRingGeo, ringMat);
    ring.position.copy(pos);
    ring.rotation.x = -Math.PI / 2;
    this._addEffect(ring, ringMat, this.hitRingGeo, 0.2);

    this.lightPool.get(c, pos, 2, 6, 0.15);

    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    const flash = new THREE.Mesh(this.sphereSmallGeo, flashMat);
    flash.position.copy(pos);
    this._addEffect(flash, flashMat, this.sphereSmallGeo, 0.06);
  }

  spawnExplosion(pos, color) {
    const c = color || 0xff4400;
    const p = pos.clone();

    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
    const flash = new THREE.Mesh(this.explosionFlashGeo, flashMat);
    flash.position.copy(p);
    this._addEffect(flash, flashMat, this.explosionFlashGeo, 0.08, 8);

    const boomMat = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.7 });
    const boom = new THREE.Mesh(this.explosionBoomGeo, boomMat);
    boom.position.copy(p);
    this._addEffect(boom, boomMat, this.explosionBoomGeo, 0.4, 5);

    const ringMat = new THREE.MeshBasicMaterial({
      color: c, transparent: true, opacity: 0.8, side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(this.explosionRingGeo, ringMat);
    ring.position.copy(p);
    ring.rotation.x = -Math.PI / 2;
    this._addEffect(ring, ringMat, this.explosionRingGeo, 0.35, 6);

    const ring2Mat = new THREE.MeshBasicMaterial({
      color: c, transparent: true, opacity: 0.4, side: THREE.DoubleSide,
    });
    const ring2 = new THREE.Mesh(this.explosionRing2Geo, ring2Mat);
    ring2.position.copy(p);
    this._addEffect(ring2, ring2Mat, this.explosionRing2Geo, 0.5, 4);

    this.particleManager.spawnExplosionParticles(p, c, 16);
    this.particleManager.spawnSparks(p, 0xffffaa, 5);

    this.lightPool.get(0xff8800, p, 8, 20, 0.5);
    this.lightPool.get(c, p, 4, 12, 0.3);

    const afterglowMat = new THREE.MeshBasicMaterial({
      color: c, transparent: true, opacity: 0.15,
    });
    const afterglow = new THREE.Mesh(this.explosionAfterglowGeo, afterglowMat);
    afterglow.position.copy(p);
    this._addEffect(afterglow, afterglowMat, this.explosionAfterglowGeo, 0.8, 2);
  }

  spawnDashEffect(pos, dir) {
    const p = _emV3.copy(pos);
    p.y += CONFIG.playerHeight * 0.3;

    for (let i = 0; i < 5; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.5 + Math.random() * 1.5;
      _emV3.set(
        Math.cos(a) * r * 3,
        (Math.random() - 0.5) * 2,
        Math.sin(a) * r * 3
      );
      this.particleManager._addParticle(0x00f0ff, p, _emV3, 0.15 + Math.random() * 0.1, 0.08);
    }

    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff, transparent: true, opacity: 0.4, side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(this.dashRingGeo, ringMat);
    ring.position.copy(p);
    ring.rotation.x = -Math.PI / 2;
    this._addEffect(ring, ringMat, this.dashRingGeo, 0.25, 4);

    this.particleManager.spawnSpeedLines(p, dir, 6);
  }

  spawnLandingEffect(pos) {
    const p = _emV3.copy(pos);
    p.y = 0.05;

    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff, transparent: true, opacity: 0.3, side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(this.landingRingGeo, ringMat);
    ring.position.copy(p);
    ring.rotation.x = -Math.PI / 2;
    this._addEffect(ring, ringMat, this.landingRingGeo, 0.2, 5);
  }

  spawnRespawnEffect(pos, color) {
    const c = color || 0x00f0ff;
    const p = _emV3.copy(pos);
    p.y = 0.5;

    this.particleManager.spawnRespawnParticles(p, c, 12);

    const ringMat = new THREE.MeshBasicMaterial({
      color: c, transparent: true, opacity: 0.5, side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(this.respawnRingGeo, ringMat);
    ring.position.copy(p);
    ring.rotation.x = -Math.PI / 2;
    this._addEffect(ring, ringMat, this.respawnRingGeo, 0.4, 4);

    const pillarMat = new THREE.MeshBasicMaterial({
      color: c, transparent: true, opacity: 0.2,
    });
    const pillar = new THREE.Mesh(this.respawnPillarGeo, pillarMat);
    pillar.position.copy(p);
    pillar.position.y += 1.5;
    this._addEffect(pillar, pillarMat, this.respawnPillarGeo, 0.6);

    this.lightPool.get(c, p, 4, 10, 0.5);
  }

  spawnJumpPadEffect(pos, color) {
    const c = color || 0x00f0ff;
    const p = _emV3.copy(pos);
    p.y = 0.1;

    this.particleManager.spawnJumpPadParticles(p, c);

    const ringMat = new THREE.MeshBasicMaterial({
      color: c, transparent: true, opacity: 0.3, side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(this.jumpPadRingGeo, ringMat);
    ring.position.copy(p);
    ring.rotation.x = -Math.PI / 2;
    this._addEffect(ring, ringMat, this.jumpPadRingGeo, 0.3, 3);

    this.lightPool.get(c, p, 2, 6, 0.3);
  }

  spawnKillEffect(pos) {
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff0044, transparent: true, opacity: 0.6, side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(this.killRingGeo, ringMat);
    ring.position.set(pos.x, 0.5, pos.z);
    ring.rotation.x = -Math.PI / 2;
    this._addEffect(ring, ringMat, this.killRingGeo, 0.5, 6);

    this.particleManager.spawnNeonBurst(
      _emV3.set(pos.x, 0.5, pos.z),
      0xff0044, 8
    );

    this.lightPool.get(0xff0044, _emV3.set(pos.x, 0.5, pos.z), 6, 15, 0.4);
  }

  spawnPlayerDamageFlash(player) {
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.5,
    });
    const flash = new THREE.Mesh(this.planeGeo, flashMat);
    flash.scale.set(CONFIG.playerSize * 1.5, CONFIG.playerHeight * 1.5, 1);
    flash.position.copy(player.mesh.position);
    flash.position.y = CONFIG.playerHeight / 2;
    flash.lookAt(this.camera.position);
    this.scene.add(flash);
    this.activeEffects.push({
      type: 'dmg_flash', mesh: flash, mat: flashMat,
      life: 0, maxLife: 0.1,
    });
  }

  spawnTrailSegment(pos, color, speed) {
    const trailLen = Math.min(1 + speed / 30, 3);
    const geo = new THREE.SphereGeometry(0.05 * trailLen, 4, 4);
    const mat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.3,
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(pos);
    this._addEffect(m, mat, geo, 0.3 + speed * 0.005);
  }

  update(dt) {
    this.particleManager.update(dt);
    this.lightPool.update(dt);

    const effects = this.activeEffects;
    for (let i = effects.length - 1; i >= 0; i--) {
      const e = effects[i];
      e.life += dt;
      if (e.life >= e.maxLife) {
        this.scene.remove(e.mesh);
        if (e.geo && e.geo !== this.ringGeo && e.geo !== this.shockwaveRingGeo &&
            e.geo !== this.planeGeo && e.geo !== this.sphereGeo &&
            e.geo !== this.sphereSmallGeo && e.geo !== this.sphereGlowGeo &&
            e.geo !== this.cylinderGeo && e.geo !== this.hitRingGeo &&
            e.geo !== this.explosionFlashGeo && e.geo !== this.explosionBoomGeo &&
            e.geo !== this.explosionRingGeo && e.geo !== this.explosionRing2Geo &&
            e.geo !== this.explosionAfterglowGeo && e.geo !== this.killRingGeo &&
            e.geo !== this.respawnRingGeo && e.geo !== this.respawnPillarGeo &&
            e.geo !== this.landingRingGeo && e.geo !== this.dashRingGeo &&
            e.geo !== this.jumpPadRingGeo) {
          e.geo.dispose();
        }
        if (e.mat) e.mat.dispose();
        if (e.cleanup) e.cleanup();
        effects.splice(i, 1);
        continue;
      }
      const t = e.life / e.maxLife;
      e.mat.opacity = 1 - t;
      if (e.scaleSpeed) {
        const s = 1 + t * e.scaleSpeed;
        e.mesh.scale.setScalar(s);
      }
    }
  }

  getParticleCount() {
    return this.particleManager.count + this.activeEffects.length;
  }

  clear() {
    const effects = this.activeEffects;
    for (let i = 0; i < effects.length; i++) {
      const e = effects[i];
      this.scene.remove(e.mesh);
      if (e.geo) e.geo.dispose();
      if (e.mat) e.mat.dispose();
      if (e.cleanup) e.cleanup();
    }
    this.activeEffects = [];
    this.particleManager.clear();
    this.lightPool.releaseAll();
  }
}
