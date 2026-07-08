/* ============================================================
   NEON ARENA - トレーニングモード管理
   訓練用ターゲット・統計・アリーナ構築を担当
   ============================================================ */

/**
 * トレーニングモード管理クラス
 * 訓練用アリーナの生成、ターゲット配置、統計（DPS・命中率等）の計測・表示を行う
 */
class TrainingManager {
  constructor(game) {
    this.game = game;
    this.targets = null;           // TrainingTargetインスタンス
    this.stats = {
      totalDamage: 0,               // 累積ダメージ
      hitCount: 0,                  // 命中回数
      shotsFired: 0,                // 発射回数
      dps: 0,                       // 秒間ダメージ
      dpsHistory: [],               // DPS計算用履歴
      lastDpsUpdate: 0,             // 最終DPS更新時刻
      startTime: 0,                 // 開始時刻
      lastHitTime: 0,               // 最終命中時刻
    };
    this.selectedPassives = [];
    this.selectedWeapon = game.loadoutWeapon || 'pistol';
  }

  /**
   * トレーニングモードを初期化
   * アリーナ・ターゲット生成とUI更新を実行
   */
  init() {
    this.targets = new TrainingTarget(this.game.scene);
    this._createTrainingArena();
    this._spawnTargets();
    this.stats.startTime = performance.now();
    this.stats.lastDpsUpdate = performance.now();
    this._updateUIStats();
  }

  /**
   * トレーニングアリーナを構築
   * 背景色・照明・床・壁・距離マーカー・遮蔽物を生成
   */
  _createTrainingArena() {
    const scene = this.game.scene;
    const size = 120;
    const half = size / 2;

    scene.background = new THREE.Color(0x0a0a18);
    scene.fog = null;

    if (this.game.ambientLight) {
      this.game.ambientLight.color.setHex(0x222244);
      this.game.ambientLight.intensity = 0.6;
    }
    if (this.game.dirLight) {
      this.game.dirLight.color.setHex(0x8844ff);
      this.game.dirLight.intensity = 1.2;
    }

    /* 床（暗いメタリック面） */
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0d0d1a,
      metalness: 0.4,
      roughness: 0.6,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(size, size), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    scene.add(floor);
    this.game.arenaObjects.push(floor);

    /* グリッド（2重の半透明グリッドで奥行き感を演出） */
    const grid1 = new THREE.GridHelper(size, 30, 0x00f0ff, 0x003355);
    grid1.material.transparent = true;
    grid1.material.opacity = 0.12;
    grid1.position.y = 0.02;
    scene.add(grid1);
    this.game.arenaObjects.push(grid1);

    const grid2 = new THREE.GridHelper(size, 60, 0x4444aa, 0x222255);
    grid2.material.transparent = true;
    grid2.material.opacity = 0.06;
    grid2.position.y = 0.01;
    scene.add(grid2);
    this.game.arenaObjects.push(grid2);

    /* 壁（ネオンエッジ付き） */
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      metalness: 0.2,
      roughness: 0.6,
    });

    const addWall = (pos, s) => {
      const geo = new THREE.BoxGeometry(s[0], s[1], s[2]);
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(pos[0], pos[1], pos[2]);
      scene.add(mesh);
      this.game.arenaObjects.push(mesh);
      const eg = new THREE.EdgesGeometry(geo);
      const em = new THREE.LineBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.1,
      });
      const el = new THREE.LineSegments(eg, em);
      el.position.copy(mesh.position);
      scene.add(el);
      this.game.arenaObjects.push(el);
    };

    addWall([0, 4, -half], [size, 8, 1]);
    addWall([0, 4, half], [size, 8, 1]);
    addWall([-half, 4, 0], [1, 8, size]);
    addWall([half, 4, 0], [1, 8, size]);

    /* 距離レーンマーカーとラベル */
    const laneMarkers = [-50, -25, 0, 25, 50];
    for (const z of laneMarkers) {
      const markerMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.15,
      });
      const marker = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 2), markerMat);
      marker.position.set(0, 0.02, z);
      marker.rotation.x = -Math.PI / 2;
      scene.add(marker);
      this.game.arenaObjects.push(marker);

      const distLabel = document.createElement('div');
      distLabel.className = 'distance-label';
      const absZ = Math.abs(z);
      distLabel.textContent = absZ + 'm';
      distLabel.style.cssText = `position:absolute;color:#00f0ff;font-family:Orbitron,monospace;
        font-size:12px;pointer-events:none;opacity:0.3;
        text-shadow:0 0 6px rgba(0,240,255,0.3);`;
      document.body.appendChild(distLabel);

      const screenPos = new THREE.Vector3(0, 1.5, z);
      screenPos.project(game.camera);
      const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
      distLabel.style.left = x + 'px';
      distLabel.style.top = y + 'px';

      distLabel.dataset.z = z;
      this._distLabels = this._distLabels || [];
      this._distLabels.push(distLabel);
    }

    /* 遮蔽物（半透明ボックス） */
    const coverMat = new THREE.MeshStandardMaterial({
      color: 0x222244,
      metalness: 0.3,
      roughness: 0.5,
      transparent: true,
      opacity: 0.5,
    });
    const coverPositions = [
      [-15, 0, -30], [15, 0, -30],
      [-20, 0, 0], [20, 0, 0],
      [-15, 0, 30], [15, 0, 30],
    ];
    for (const cp of coverPositions) {
      const cGeo = new THREE.BoxGeometry(2, 2, 1);
      const cMesh = new THREE.Mesh(cGeo, coverMat);
      cMesh.position.set(cp[0], cp[1] + 1, cp[2]);
      scene.add(cMesh);
      this.game.arenaObjects.push(cMesh);
      const ceg = new THREE.EdgesGeometry(cGeo);
      const cem = new THREE.LineBasicMaterial({
        color: 0x4444aa, transparent: true, opacity: 0.2,
      });
      const cel = new THREE.LineSegments(ceg, cem);
      cel.position.copy(cMesh.position);
      scene.add(cel);
      this.game.arenaObjects.push(cel);
    }

    this.game.arenaMap = { size, walls: [] };
  }

  /**
   * ターゲットを配置
   * 固定ターゲット（10〜100m）と移動ターゲット（15〜60m）を生成
   */
  _spawnTargets() {
    const distances = [10, 25, 50, 75, 100];
    for (const d of distances) {
      this.targets.addFixed(new THREE.Vector3(0, 0, d));
    }
    const movingDists = [15, 35, 60];
    for (const d of movingDists) {
      this.targets.addMoving(new THREE.Vector3(0, 0, d));
    }
  }

  recordShot() {
    this.stats.shotsFired++;
  }

  recordHit(damage) {
    this.stats.totalDamage += damage;
    this.stats.hitCount++;
    this.stats.lastHitTime = performance.now();
    this._updateUIStats();
  }

  /**
   * 統計UIを更新
   * ダメージ・DPS・命中数・発射数・命中率を表示
   */
  _updateUIStats() {
    const now = performance.now();
    const elapsed = (now - this.stats.startTime) / 1000;
    if (elapsed > 0) {
      this.stats.dpsHistory.push({
        time: now,
        damage: this.stats.totalDamage,
      });
      const cutoff = now - 2000;
      this.stats.dpsHistory = this.stats.dpsHistory.filter(h => h.time > cutoff);
      if (this.stats.dpsHistory.length >= 2) {
        const first = this.stats.dpsHistory[0];
        const last = this.stats.dpsHistory[this.stats.dpsHistory.length - 1];
        const deltaT = (last.time - first.time) / 1000;
        const deltaD = last.damage - first.damage;
        this.stats.dps = deltaT > 0 ? (deltaD / deltaT) : 0;
      }
    }

    document.getElementById('training-damage-value').textContent = this.stats.totalDamage.toFixed(0);
    document.getElementById('training-dps-value').textContent = this.stats.dps.toFixed(1);
    document.getElementById('training-hits-value').textContent = this.stats.hitCount;
    document.getElementById('training-shots-value').textContent = this.stats.shotsFired;
    const accuracy = this.stats.shotsFired > 0
      ? ((this.stats.hitCount / this.stats.shotsFired) * 100).toFixed(1)
      : '0.0';
    document.getElementById('training-accuracy-value').textContent = accuracy + '%';
  }

  /**
   * トレーニングをリセット
   * 統計・ターゲット・プレイヤー状態を初期化
   */
  reset() {
    this.stats.totalDamage = 0;
    this.stats.hitCount = 0;
    this.stats.shotsFired = 0;
    this.stats.dps = 0;
    this.stats.dpsHistory = [];
    this.stats.lastDpsUpdate = performance.now();
    this.stats.startTime = performance.now();
    this.stats.lastHitTime = 0;
    if (this.targets) this.targets.resetAll();

    const lp = this.game.localPlayer;
    if (lp) {
      lp.health = 9999;
      lp.ammo = lp.maxAmmo;
      lp.reloading = false;
      lp.reloadTimer = 0;
      lp.lastFireTime = 0;
      this.game.updateAmmoUI();
      this.game.updateHealthUI();
    }
    this._updateUIStats();
  }

  /**
   * 距離ラベルの位置をカメラに追従させる
   */
  updateDistanceLabels() {
    if (!this._distLabels) return;
    for (const label of this._distLabels) {
      const z = parseFloat(label.dataset.z);
      const screenPos = new THREE.Vector3(0, 1.5, z);
      screenPos.project(game.camera);
      const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
      label.style.left = x + 'px';
      label.style.top = y + 'px';
      label.style.display = game.gameState === 'TRAINING' ? '' : 'none';
    }
  }

  /**
   * 毎フレームの更新処理
   * @param {number} dt - デルタタイム（秒）
   */
  update(dt) {
    if (this.targets) this.targets.update(dt);
    this.updateDistanceLabels();
    this._updateUIStats();
  }

  /**
   * リソースを解放
   */
  destroy() {
    if (this.targets) this.targets.destroy();
    if (this._distLabels) {
      this._distLabels.forEach(l => {
        if (l.parentNode) l.parentNode.removeChild(l);
      });
      this._distLabels = [];
    }
  }
}
