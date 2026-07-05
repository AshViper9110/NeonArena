class ProjectilePool {
  constructor(scene) {
    this.scene = scene;
    this.pool = [];
    this.active = [];
    this.maxSize = 100;
    this._initGeos();
  }

  _initGeos() {
    this.sharedGeo = new THREE.SphereGeometry(0.3, 8, 8);
    this.sharedGlowGeo = new THREE.SphereGeometry(0.6, 8, 8);
  }

  _createProjectile() {
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const mesh = new THREE.Mesh(this.sharedGeo, mat);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 });
    const glow = new THREE.Mesh(this.sharedGlowGeo, glowMat);
    return { mesh, glow, mat, glowMat, trail: [], trailTimer: 0 };
  }

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

  releaseAll() {
    [...this.active].forEach(obj => this.release(obj));
  }

  get activeCount() { return this.active.length; }
}
