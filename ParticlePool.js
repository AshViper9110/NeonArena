class ParticlePool {
  constructor(scene) {
    this.scene = scene;
    this.pool = [];
    this.active = [];
    this.maxSize = 500;
    this.sharedGeo = new THREE.SphereGeometry(0.08, 4, 4);
    this.sharedSparkGeo = new THREE.BoxGeometry(0.05, 0.05, 0.15);
  }

  _createParticle() {
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
    const mesh = new THREE.Mesh(this.sharedGeo, mat);
    return { mesh, mat, life: 0, maxLife: 0, velocity: new THREE.Vector3() };
  }

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
      p.velocity.y -= 5 * dt;
      p.mat.opacity = 1 - t;
      p.mesh.scale.setScalar(1 - t * 0.5);
    }
  }

  releaseAll() {
    [...this.active].forEach(p => this.release(p));
  }

  get activeCount() { return this.active.length; }
}
