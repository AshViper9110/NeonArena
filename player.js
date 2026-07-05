class Player {
  constructor(scene, id, color) {
    this.scene = scene;
    this.id = id;
    this.color = color;
    this.health = CONFIG.maxHealth;
    this.maxHealth = CONFIG.maxHealth;
    this.alive = true;
    this.name = '';
    this.kills = 0;
    this.deaths = 0;
    this.matchKills = 0;
    this.matchDeaths = 0;
    this.matchAssists = 0;
    this.currentKillStreak = 0;
    this.weapon = 'pistol';
    this.lastFireTime = 0;
    this.ammo = 0;
    this.maxAmmo = 0;
    this.reloading = false;
    this.reloadTimer = 0;
    this.onReloadComplete = null;
    this.deathFadeTimer = 0;
    this.moveSpeedMult = 1;
    this.dashSpeedMult = 1;
    this.healthRegen = 0;
    this.lastDamageTime = 0;
    this.statusEffects = [];
    this.heat = 0;
    this.maxHeat = 0;
    this.coolingSpeed = 0;
    this.overheated = false;

    const geo = new THREE.BoxGeometry(CONFIG.playerSize, CONFIG.playerHeight, CONFIG.playerSize);
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.3,
      metalness: 0.1,
      roughness: 0.4,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.scene.add(this.mesh);

    const ggeo = new THREE.BoxGeometry(CONFIG.playerSize * 1.6, CONFIG.playerHeight * 0.2, CONFIG.playerSize * 1.6);
    const gmat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.1 });
    this.glowRing = new THREE.Mesh(ggeo, gmat);
    this.glowRing.position.y = 0.05;
    this.scene.add(this.glowRing);

    this.edgeGeo = new THREE.EdgesGeometry(geo);
    this.edgeMat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.4,
    });
    this.edgeLine = new THREE.LineSegments(this.edgeGeo, this.edgeMat);
    this.scene.add(this.edgeLine);

    this.outlineMat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.15,
    });
    const outlineGeo = new THREE.EdgesGeometry(
      new THREE.BoxGeometry(CONFIG.playerSize * 1.3, CONFIG.playerHeight * 1.3, CONFIG.playerSize * 1.3)
    );
    this.outlineLine = new THREE.LineSegments(outlineGeo, this.outlineMat);
    this.outlineLine.renderOrder = 1;
    this.scene.add(this.outlineLine);

    this.position = new THREE.Vector3();
    this.rotation = 0;
    this.targetPosition = new THREE.Vector3();
    this.targetRotation = 0;
    this.damageFlashTimer = 0;
    this.emissivePulseTimer = 0;
    this.spawn();
  }

  resetMatchStats() {
    this.matchKills = 0;
    this.matchDeaths = 0;
    this.matchAssists = 0;
    this.currentKillStreak = 0;
  }

  resetVisualState() {
    this.mesh.material.transparent = false;
    this.mesh.material.opacity = 1;
    this.mesh.material.depthWrite = true;
    this.mesh.material.depthTest = true;
    this.mesh.material.color.setHex(this.color);
    this.mesh.material.emissive.setHex(this.color);
    this.mesh.material.emissiveIntensity = 0.3;
    this.mesh.visible = true;
    this.edgeMat.opacity = 0.4;
    this.edgeLine.visible = true;
    this.glowRing.material.opacity = 0.1;
    this.glowRing.visible = true;
    this.outlineMat.opacity = 0.15;
    this.outlineLine.visible = true;
    this.deathFadeTimer = 0;
    this.damageFlashTimer = 0;
  }

  spawn(halfExtent) {
    const half = (typeof halfExtent === 'number' && halfExtent > 0) ? halfExtent : 20;
    this.position.set(
      (Math.random() - 0.5) * half * 2,
      0,
      (Math.random() - 0.5) * half * 2
    );
    this.targetPosition.copy(this.position);
    this.health = CONFIG.maxHealth;
    this.alive = true;
    this.refillAmmo();
    this.resetVisualState();
    this.updateMesh();
  }

  refillAmmo() {
    const wp = WEAPONS[this.weapon] || WEAPONS.pistol;
    this.maxAmmo = wp.maxAmmo;
    this.ammo = wp.maxAmmo;
    this.reloading = false;
    this.reloadTimer = 0;
    this.heat = 0;
    this.overheated = false;
    this.maxHeat = wp.heatCapacity || 0;
    this.coolingSpeed = wp.coolingSpeed || 0;
  }

  takeDamage(amount) {
    this.lastDamageTime = Date.now();
    this.health = Math.max(0, this.health - amount);
    this.damageFlashTimer = 0.1;
    if (this.health <= 0 && this.alive) {
      this.alive = false;
      this.deaths++;
    }
    return !this.alive;
  }

  updateMesh() {
    this.mesh.position.set(this.position.x, CONFIG.playerHeight / 2, this.position.z);
    this.mesh.rotation.y = this.rotation;
    this.glowRing.position.set(this.position.x, 0.05, this.position.z);
    this.edgeLine.position.copy(this.mesh.position);
    this.edgeLine.rotation.y = this.rotation;
    this.outlineLine.position.copy(this.mesh.position);
    this.outlineLine.rotation.y = this.rotation;
  }

  setPosition(pos) {
    this.position.copy(pos);
    this.targetPosition.copy(pos);
  }

  setRotation(rot) {
    this.rotation = rot;
    this.targetRotation = rot;
  }

  lerpToTarget(dt) {
    this.position.lerp(this.targetPosition, 1 - Math.exp(-10 * dt));
    const diff = this.targetRotation - this.rotation;
    this.rotation += diff * Math.min(1, 10 * dt);
  }

  update(dt) {
    if (!this.alive) {
      if (this.deathFadeTimer > 0) {
        this.deathFadeTimer -= dt;
        const t = Math.max(0, this.deathFadeTimer / 0.5);
        this.mesh.material.transparent = true;
        this.mesh.material.opacity = t;
        this.edgeLine.material.opacity = t * 0.4;
        this.glowRing.material.opacity = t * 0.1;
        this.outlineLine.material.opacity = t * 0.15;
        this.mesh.visible = true;
        this.edgeLine.visible = true;
        this.glowRing.visible = true;
        this.outlineLine.visible = true;
        if (this.deathFadeTimer <= 0) {
          this._hideAll();
        }
      } else {
        this._hideAll();
      }
      return;
    }
    this.mesh.visible = true;
    this.mesh.material.transparent = false;
    this.mesh.material.opacity = 1;
    this.edgeLine.visible = true;
    this.glowRing.visible = true;
    this.outlineLine.visible = true;

    if (this.reloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        this.ammo = this.maxAmmo;
        this.reloading = false;
        this.reloadTimer = 0;
        this.lastFireTime = 0;
        if (this.onReloadComplete) this.onReloadComplete(this.weapon);
      }
    }

    if (this.damageFlashTimer > 0) {
      this.damageFlashTimer -= dt;
      this.mesh.material.color.setHex(0xffffff);
      this.mesh.material.emissive.setHex(0xffffff);
      this.mesh.material.emissiveIntensity = 0.8;
      if (this.damageFlashTimer <= 0) {
        this.mesh.material.color.setHex(this.color);
        this.mesh.material.emissive.setHex(this.color);
        this.mesh.material.emissiveIntensity = 0.3;
      }
    }

    this.emissivePulseTimer += dt * 3;
    const pulse = 0.25 + 0.15 * Math.sin(this.emissivePulseTimer);
    this.mesh.material.emissiveIntensity = this.damageFlashTimer > 0 ? 0.8 + 0.2 * Math.sin(this.damageFlashTimer * 50) : pulse;
    this.outlineMat.opacity = 0.1 + 0.1 * Math.sin(this.emissivePulseTimer);

    this.edgeMat.opacity = 0.3 + 0.15 * Math.sin(this.emissivePulseTimer);

    this.updateMesh();
  }

  _hideAll() {
    this.mesh.visible = false;
    this.edgeLine.visible = false;
    this.glowRing.visible = false;
    this.outlineLine.visible = false;
  }

  playDeathEffect() {
    this.deathFadeTimer = 0.5;
    this.mesh.material.color.setHex(0xff0000);
    this.mesh.material.emissive.setHex(0xff0000);
    this.mesh.material.emissiveIntensity = 1.0;
    this.mesh.material.transparent = true;
    this.mesh.material.opacity = 1.0;
  }

  destroy() {
    [this.mesh, this.glowRing, this.edgeLine, this.outlineLine].forEach(o => {
      if (o.parent) this.scene.remove(o);
    });
    try { this.mesh.geometry.dispose(); this.mesh.material.dispose(); } catch(e) {}
    try { this.glowRing.geometry.dispose(); this.glowRing.material.dispose(); } catch(e) {}
    try { this.edgeGeo.dispose(); this.edgeMat.dispose(); } catch(e) {}
    try {
      if (this.outlineLine.geometry) this.outlineLine.geometry.dispose();
      this.outlineMat.dispose();
    } catch(e) {}
  }
}
