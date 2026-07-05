class BeamManager {
  constructor(scene) {
    this.scene = scene;
    this.activeBeams = [];
    this.impactEffects = [];
  }

  fireBeam(startPos, endPos, weaponDef, color) {
    const wp = weaponDef || {};
    const isPlasma = wp.id === 'plasma_rifle' || color === 0x00ffcc;
    const beamColor = color || wp.color || 0x88ddff;
    const duration = isPlasma ? 0.12 : 0.05;

    const beam = {
      start: startPos.clone(),
      end: endPos.clone(),
      color: beamColor,
      life: duration,
      maxLife: duration,
      isPlasma,
      mesh: null,
      glow: null,
    };

    this._createBeamMesh(beam);
    this.activeBeams.push(beam);

    this._spawnImpactEffect(endPos, beamColor, isPlasma);
  }

  _createBeamMesh(beam) {
    const dir = new THREE.Vector3().subVectors(beam.end, beam.start);
    const length = dir.length();

    // ========= メインビーム =========
    const radius = beam.isPlasma ? 0.18 : 0.10;

    const geo = new THREE.CylinderGeometry(
      radius,
      radius,
      length,
      8,
      1,
      false
    );

    const mat = new THREE.MeshBasicMaterial({
      color: beam.color,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const mesh = new THREE.Mesh(geo, mat);

    mesh.position.copy(beam.start).add(beam.end).multiplyScalar(0.5);

    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.normalize()
    );

    this.scene.add(mesh);

    beam.mesh = mesh;
    beam.geo = geo;
    beam.mat = mat;

    // ========= 外側グロー =========
    const glowRadius = radius * 2.2;

    const glowGeo = new THREE.CylinderGeometry(
      glowRadius,
      glowRadius,
      length,
      8,
      1,
      false
    );

    const glowMat = new THREE.MeshBasicMaterial({
      color: beam.color,
      transparent: true,
      opacity: beam.isPlasma ? 0.35 : 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const glow = new THREE.Mesh(glowGeo, glowMat);

    glow.position.copy(mesh.position);
    glow.quaternion.copy(mesh.quaternion);

    this.scene.add(glow);

    beam.glow = glow;
    beam.glowGeo = glowGeo;
    beam.glowMat = glowMat;
  }

  _spawnImpactEffect(pos, color, isPlasma) {
    const col = new THREE.Color(color);

    const sparkMat = new THREE.PointsMaterial({
      color: color,
      size: 0.15,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const sparkCount = isPlasma ? 12 : 6;
    const sparkPos = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount; i++) {
      sparkPos[i * 3] = pos.x + (Math.random() - 0.5) * 0.8;
      sparkPos[i * 3 + 1] = pos.y + 0.3 + Math.random() * 0.5;
      sparkPos[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 0.8;
    }
    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    const sparkMesh = new THREE.Points(sparkGeo, sparkMat);
    this.scene.add(sparkMesh);

    const ringMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    const ringGeo = new THREE.RingGeometry(0.1, isPlasma ? 0.6 : 0.3, 16);
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(pos.x, 0.15, pos.z);
    ring.rotation.x = -Math.PI / 2;
    this.scene.add(ring);

    if (isPlasma) {
      const boomMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
      });
      const boomGeo = new THREE.SphereGeometry(0.5, 8, 8);
      const boom = new THREE.Mesh(boomGeo, boomMat);
      boom.position.set(pos.x, 0.3, pos.z);
      this.scene.add(boom);
      this.impactEffects.push({
        mesh: boom, geo: boomGeo, mat: boomMat,
        life: 0.3, maxLife: 0.3, type: 'plasma_boom',
      });
    }

    this.impactEffects.push({
      mesh: sparkMesh, geo: sparkGeo, mat: sparkMat,
      life: 0.3, maxLife: 0.3, type: 'spark',
    });
    this.impactEffects.push({
      mesh: ring, geo: ringGeo, mat: ringMat,
      life: 0.25, maxLife: 0.25, type: 'ring',
      startScale: 1,
    });
  }

  update(dt) {
    for (let i = this.activeBeams.length - 1; i >= 0; i--) {
      const beam = this.activeBeams[i];
      beam.life -= dt;
      const t = Math.max(0, beam.life / beam.maxLife);
      if (beam.glowMat)
        beam.glowMat.opacity = t * (beam.isPlasma ? 0.35 : 0.18);
      if (beam.glowMat) beam.glowMat.opacity = t * 0.3;
      if (beam.life <= 0) {
        this._removeBeam(beam);
        this.activeBeams.splice(i, 1);
      }
    }

    for (let i = this.impactEffects.length - 1; i >= 0; i--) {
      const fx = this.impactEffects[i];
      fx.life -= dt;
      const t = Math.max(0, fx.life / fx.maxLife);
      if (fx.type === 'spark') {
        fx.mat.opacity = t * 0.8;
      } else if (fx.type === 'ring') {
        fx.mat.opacity = t * 0.4;
        const s = 1 + (1 - t) * 2;
        fx.mesh.scale.setScalar(s);
      } else if (fx.type === 'plasma_boom') {
        fx.mat.opacity = t * 0.3;
        const s = 1 + (1 - t) * 3;
        fx.mesh.scale.setScalar(s);
      }
      if (fx.life <= 0) {
        if (fx.mesh.parent) this.scene.remove(fx.mesh);
        fx.geo.dispose();
        fx.mat.dispose();
        this.impactEffects.splice(i, 1);
      }
    }
  }

  _removeBeam(beam) {
    if (beam.mesh && beam.mesh.parent) this.scene.remove(beam.mesh);
    if (beam.geo) beam.geo.dispose();
    if (beam.mat) beam.mat.dispose();
    if (beam.glow && beam.glow.parent) this.scene.remove(beam.glow);
    if (beam.glowGeo) beam.glowGeo.dispose();
    if (beam.glowMat) beam.glowMat.dispose();
  }

  clear() {
    this.activeBeams.forEach(b => this._removeBeam(b));
    this.activeBeams = [];
    this.impactEffects.forEach(fx => {
      if (fx.mesh.parent) this.scene.remove(fx.mesh);
      fx.geo.dispose();
      fx.mat.dispose();
    });
    this.impactEffects = [];
  }
}
