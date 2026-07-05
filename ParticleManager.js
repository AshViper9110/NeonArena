const _pmV3 = new THREE.Vector3();
const SPARK_GEO = new THREE.BoxGeometry(0.04, 0.04, 0.12);
const PARTICLE_GEO = new THREE.SphereGeometry(0.1, 4, 4);
const SMOKE_GEO = new THREE.SphereGeometry(0.3, 6, 6);
const DEBRIS_GEO = new THREE.BoxGeometry(0.08, 0.06, 0.08);
const SPEEDLINE_GEO = new THREE.BoxGeometry(0.02, 0.02, 0.5);

class ParticleManager {
  constructor(scene) {
    this.scene = scene;
    this.pool = [];
    this.active = [];
    this.maxParticles = 200;
    this._geoCache = {};
  }

  _alloc() {
    if (this.pool.length > 0) return this.pool.pop();
    return {
      mesh: null, mat: null, geo: null,
      vel: new THREE.Vector3(),
      life: 0, maxLife: 0,
      gravity: false, rotSpeed: null, growSpeed: 0, type: '',
    };
  }

  _free(e) {
    if (e.mesh && e.mesh.parent) this.scene.remove(e.mesh);
    if (e.mat) {
      e.mat.color.setHex(0xffffff);
      e.mat.opacity = 1;
    }
    e.vel.set(0, 0, 0);
    e.rotSpeed = null;
    e.growSpeed = 0;
    e.gravity = false;
    e.type = '';
    this.pool.push(e);
  }

  _createParticle(geo, color, pos, vel, life, type, gravity, growSpeed) {
    if (this.active.length >= this.maxParticles) return null;
    const e = this._alloc();
    let mat, mesh;
    if (e.mesh) {
      mesh = e.mesh;
      if (mesh.geometry !== geo) mesh.geometry = geo;
      mesh.position.copy(pos);
      mesh.scale.setScalar(1);
      mesh.rotation.set(0, 0, 0);
      if (mesh.parent !== this.scene) this.scene.add(mesh);
      mat = e.mat;
      mat.color.setHex(color);
      mat.opacity = 1;
    } else {
      mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
      mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      this.scene.add(mesh);
    }
    e.mesh = mesh;
    e.mat = mat;
    e.geo = geo;
    e.vel.copy(vel);
    e.life = 0;
    e.maxLife = life || 0.5;
    e.type = type || 'particle';
    e.gravity = gravity;
    e.growSpeed = growSpeed || 0;
    e.rotSpeed = null;
    this.active.push(e);
    return e;
  }

  _addParticle(color, pos, vel, life, size) {
    if (size && Math.abs(size - 0.1) > 0.001) {
      const key = size.toFixed(3);
      let geo = this._geoCache[key];
      if (!geo) {
        geo = new THREE.SphereGeometry(size, 4, 4);
        this._geoCache[key] = geo;
      }
      return this._createParticle(geo, color, pos, vel, life, 'particle', true, 0);
    }
    return this._createParticle(PARTICLE_GEO, color, pos, vel, life, 'particle', true, 0);
  }

  _addSpark(color, pos, vel, life) {
    return this._createParticle(SPARK_GEO, color, pos, vel, life, 'spark', true, 0);
  }

  _addSmokeParticle(color, pos, vel, life) {
    const e = this._createParticle(SMOKE_GEO, color, pos, vel, life, 'smoke', false, 0.5 + Math.random() * 0.5);
    return e;
  }

  _addDebris(pos, vel, life) {
    const e = this._createParticle(DEBRIS_GEO, 0x888888, pos, vel, life, 'debris', true, 0);
    if (e) {
      e.rotSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
    }
    return e;
  }

  _addSpeedLine(color, pos, vel, life) {
    const e = this._createParticle(SPEEDLINE_GEO, color, pos, vel, life, 'speedline', false, 0);
    if (e) {
      e.mesh.lookAt(_pmV3.copy(pos).add(vel.clone().normalize()));
    }
    return e;
  }

  spawnExplosionParticles(pos, color, count) {
    count = Math.min(count || 20, 30);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 15;
      _pmV3.set(
        Math.cos(angle) * speed,
        Math.random() * 10 + 2,
        Math.sin(angle) * speed
      );
      this._addParticle(color || 0xff4400, pos, _pmV3, 0.4 + Math.random() * 0.4, 0.2 + Math.random() * 0.3);
    }
  }

  spawnSparks(pos, color, count) {
    count = Math.min(count || 6, 10);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 8;
      _pmV3.set(
        Math.cos(angle) * speed,
        Math.random() * 6 - 3,
        Math.sin(angle) * speed
      );
      this._addSpark(color || 0xffff00, pos, _pmV3, 0.15 + Math.random() * 0.15);
    }
  }

  spawnSmoke(pos, color, count) {
    count = Math.min(count || 3, 5);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      _pmV3.set(
        Math.cos(angle) * speed,
        2 + Math.random() * 3,
        Math.sin(angle) * speed
      );
      this._addSmokeParticle(color || 0x444444, pos, _pmV3, 0.6 + Math.random() * 0.4);
    }
  }

  spawnDebris(pos, count) {
    count = Math.min(count || 3, 4);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 8;
      _pmV3.set(
        Math.cos(angle) * speed,
        3 + Math.random() * 5,
        Math.sin(angle) * speed
      );
      this._addDebris(pos, _pmV3, 0.3 + Math.random() * 0.3);
    }
  }

  spawnRingParticles(pos, color, count, radius) {
    count = Math.min(count || 8, 12);
    const r = radius || 2;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      _pmV3.set(
        pos.x + Math.cos(angle) * r,
        pos.y,
        pos.z + Math.sin(angle) * r
      ).sub(pos).normalize().multiplyScalar(5 + Math.random() * 3);
      this._addParticle(color || 0xffffff, pos, _pmV3, 0.3, 0.15);
    }
  }

  spawnNeonBurst(pos, color, count) {
    count = Math.min(count || 12, 15);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 8 + Math.random() * 12;
      _pmV3.set(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed
      );
      this._addParticle(color || 0x00f0ff, pos, _pmV3, 0.4 + Math.random() * 0.4, 0.12 + Math.random() * 0.1);
    }
  }

  spawnSpeedLines(pos, dir, count) {
    count = Math.min(count || 5, 8);
    for (let i = 0; i < count; i++) {
      const spread = 1.5;
      _pmV3.set(
        dir.x * 20 + (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread,
        dir.z * 20 + (Math.random() - 0.5) * spread
      );
      const p = new THREE.Vector3(
        pos.x + (Math.random() - 0.5) * 2,
        0.2 + Math.random() * 0.3,
        pos.z + (Math.random() - 0.5) * 2
      );
      this._addSpeedLine(0x00f0ff, p, _pmV3, 0.12);
    }
  }

  spawnRespawnParticles(pos, color, count) {
    count = Math.min(count || 15, 20);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 2 + Math.random() * 3;
      _pmV3.set(
        Math.cos(theta) * r,
        Math.random() * 6 + 2,
        Math.sin(theta) * r
      );
      this._addParticle(color || 0x00f0ff, pos, _pmV3, 0.5 + Math.random() * 0.4, 0.15 + Math.random() * 0.15);
    }
  }

  spawnJumpPadParticles(pos, color) {
    for (let i = 0; i < 5; i++) {
      const theta = (i / 8) * Math.PI * 2;
      _pmV3.set(
        Math.cos(theta) * 3,
        2 + Math.random() * 2,
        Math.sin(theta) * 3
      );
      this._addParticle(color || 0x00f0ff, pos, _pmV3, 0.4, 0.12);
    }
  }

  update(dt) {
    const active = this.active;
    for (let i = active.length - 1; i >= 0; i--) {
      const e = active[i];
      e.life += dt;
      if (e.life >= e.maxLife) {
        this._free(e);
        active.splice(i, 1);
        continue;
      }
      const t = e.life / e.maxLife;
      const m = e.mesh;
      const v = e.vel;
      m.position.x += v.x * dt;
      m.position.y += v.y * dt;
      m.position.z += v.z * dt;
      if (e.gravity) v.y -= 9.8 * dt;
      e.mat.opacity = 1 - t;
      if (e.type === 'smoke') {
        const s = 1 + t * e.growSpeed;
        m.scale.setScalar(s);
      }
      if (e.rotSpeed) {
        m.rotation.x += e.rotSpeed.x * dt;
        m.rotation.y += e.rotSpeed.y * dt;
        m.rotation.z += e.rotSpeed.z * dt;
      }
      if (e.type === 'speedline') {
        m.scale.setScalar(1 - t * 0.8);
      }
      if (e.type === 'spark' || e.type === 'particle') {
        const s = 1 - t * 0.5;
        m.scale.setScalar(Math.max(s, 0.01));
      }
    }
  }

  clear() {
    const all = [...this.active, ...this.pool];
    for (let i = 0; i < all.length; i++) {
      const e = all[i];
      if (e.mesh && e.mesh.parent) this.scene.remove(e.mesh);
      if (e.mat) e.mat.dispose();
    }
    this.active = [];
    this.pool = [];
    for (const key in this._geoCache) {
      this._geoCache[key].dispose();
    }
    this._geoCache = {};
  }

  get count() { return this.active.length; }
}
