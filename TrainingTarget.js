class TrainingTarget {
  constructor(scene) {
    this.scene = scene;
    this.targets = [];
    this._nextId = 0;
  }

  _createTargetMesh(pos, isMoving, id) {
    const group = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(1.2, 2.0, 0.4);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      metalness: 0.3,
      roughness: 0.4,
      emissive: 0x004466,
      emissiveIntensity: 0.2,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.0;
    group.add(body);

    const ringGeo = new THREE.TorusGeometry(0.7, 0.08, 8, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      transparent: true,
      opacity: 0.3,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 1.0;
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    const headGeo = new THREE.SphereGeometry(0.25, 8, 8);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.2;
    group.add(head);

    group.position.set(pos.x, pos.y, pos.z);
    this.scene.add(group);

    const edgeGeo = new THREE.EdgesGeometry(bodyGeo);
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.15,
    });
    const edgeLine = new THREE.LineSegments(edgeGeo, edgeMat);
    edgeLine.position.copy(group.position);
    edgeLine.position.y += 1.0;
    this.scene.add(edgeLine);

    const labelDiv = document.createElement('div');
    labelDiv.className = 'target-label';
    labelDiv.textContent = `${pos.distanceTo(new THREE.Vector3(0, 0, 0)).toFixed(0)}m`;
    labelDiv.style.cssText = `position:absolute;color:#00f0ff;font-family:Orbitron,monospace;font-size:11px;
      pointer-events:none;text-shadow:0 0 8px rgba(0,240,255,0.5);`;
    document.body.appendChild(labelDiv);

    return {
      id,
      group,
      edgeLine,
      body,
      ring,
      head,
      labelDiv,
      pos: new THREE.Vector3(pos.x, pos.y, pos.z),
      isMoving,
      alive: true,
      hitFlashTimer: 0,
      moveTimer: Math.random() * Math.PI * 2,
      moveSpeed: 1.0 + Math.random() * 1.5,
      moveRange: 3.0 + Math.random() * 2.0,
      moveAxis: Math.random() > 0.5 ? 'x' : 'z',
      basePos: new THREE.Vector3(pos.x, pos.y, pos.z),
      hp: 9999,
      maxHp: 9999,
    };
  }

  addFixed(pos) {
    const id = this._nextId++;
    const t = this._createTargetMesh(pos, false, id);
    this.targets.push(t);
    return t;
  }

  addMoving(pos) {
    const id = this._nextId++;
    const t = this._createTargetMesh(pos, true, id);
    this.targets.push(t);
    return t;
  }

  hitTarget(targetId, damage) {
    const t = this.targets.find(tt => tt.id === targetId);
    if (!t || !t.alive) return false;
    t.hitFlashTimer = 0.15;
    t.hp -= damage;
    if (t.hp <= 0) {
      t.alive = false;
      t.group.visible = false;
      t.edgeLine.visible = false;
    }
    return true;
  }

  flashTarget(targetId) {
    const t = this.targets.find(tt => tt.id === targetId);
    if (!t) return;
    t.hitFlashTimer = 0.15;
  }

  resetAll() {
    this.targets.forEach(t => {
      t.alive = true;
      t.hp = t.maxHp;
      t.group.visible = true;
      t.edgeLine.visible = true;
      t.group.position.copy(t.basePos);
      t.edgeLine.position.set(t.basePos.x, t.basePos.y + 1.0, t.basePos.z);
      t.hitFlashTimer = 0;
    });
  }

  update(dt) {
    for (const t of this.targets) {
      if (t.hitFlashTimer > 0) {
        t.hitFlashTimer -= dt;
        const intensity = t.hitFlashTimer > 0 ? 0.8 : 0.2;
        t.body.material.emissiveIntensity = intensity;
        t.body.material.color.setHex(t.hitFlashTimer > 0 ? 0xffffff : 0x00f0ff);
      } else {
        t.body.material.emissiveIntensity = 0.2;
        t.body.material.color.setHex(0x00f0ff);
      }

      if (t.isMoving && t.alive) {
        t.moveTimer += dt * t.moveSpeed;
        const offset = Math.sin(t.moveTimer) * t.moveRange;
        if (t.moveAxis === 'x') {
          t.group.position.x = t.basePos.x + offset;
          t.edgeLine.position.x = t.basePos.x + offset;
        } else {
          t.group.position.z = t.basePos.z + offset;
          t.edgeLine.position.z = t.basePos.z + offset;
        }
      }

      const screenPos = t.pos.clone();
      screenPos.project(game.camera);
      const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
      const dist = t.pos.distanceTo(game.localPlayer ? game.localPlayer.position : new THREE.Vector3());
      t.labelDiv.style.left = x + 'px';
      t.labelDiv.style.top = (y - 30) + 'px';
      t.labelDiv.textContent = dist.toFixed(0) + 'm';
      t.labelDiv.style.display = game.gameState === 'TRAINING' && t.alive ? '' : 'none';
    }
  }

  destroy() {
    this.targets.forEach(t => {
      this.scene.remove(t.group);
      this.scene.remove(t.edgeLine);
      t.group.children.forEach(c => {
        if (c.geometry) c.geometry.dispose();
        if (c.material) c.material.dispose();
      });
      if (t.edgeLine.geometry) t.edgeLine.geometry.dispose();
      if (t.edgeLine.material) t.edgeLine.material.dispose();
      if (t.labelDiv && t.labelDiv.parentNode) t.labelDiv.parentNode.removeChild(t.labelDiv);
    });
    this.targets = [];
  }
}
