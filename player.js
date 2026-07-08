/* ============================================================
   NEON ARENA - プレイヤークラス
   3Dメッシュ構築、HP/弾薬管理、被弾・死亡エフェクト
   ============================================================ */

class Player {
  /* コンストラクタ：メッシュ生成、状態変数初期化、ランダムスポーン */
  constructor(scene, id, color) {
    this.scene = scene;
    this.id = id;
    this.color = color;

    /* === ステータス === */
    this.health = CONFIG.maxHealth;
    this.maxHealth = CONFIG.maxHealth;
    this.alive = true;
    this.name = '';

    /* === 戦績 === */
    this.kills = 0;
    this.deaths = 0;
    this.matchKills = 0;
    this.matchDeaths = 0;
    this.matchAssists = 0;
    this.currentKillStreak = 0;

    /* === 武器/弾薬 === */
    this.weapon = 'pistol';
    this.lastFireTime = 0;
    this.ammo = 0;
    this.maxAmmo = 0;
    this.reloading = false;
    this.reloadTimer = 0;
    this.onReloadComplete = null;

    /* === 死亡フェード === */
    this.deathFadeTimer = 0;

    /* === パッシブ/状態 === */
    this.moveSpeedMult = 1;
    this.dashSpeedMult = 1;
    this.healthRegen = 0;
    this.lastDamageTime = 0;
    this.statusEffects = [];

    /* === オーバーヒート === */
    this.heat = 0;
    this.maxHeat = 0;
    this.coolingSpeed = 0;
    this.overheated = false;

    /* === 3Dメッシュ（本体） === */
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

    /* === 足元の発光リング === */
    const ggeo = new THREE.BoxGeometry(CONFIG.playerSize * 1.6, CONFIG.playerHeight * 0.2, CONFIG.playerSize * 1.6);
    const gmat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.1 });
    this.glowRing = new THREE.Mesh(ggeo, gmat);
    this.glowRing.position.y = 0.05;
    this.scene.add(this.glowRing);

    /* === エッジライン（輪郭線） === */
    this.edgeGeo = new THREE.EdgesGeometry(geo);
    this.edgeMat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.4,
    });
    this.edgeLine = new THREE.LineSegments(this.edgeGeo, this.edgeMat);
    this.scene.add(this.edgeLine);

    /* === アウトライン（外側の光る枠） === */
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

    /* === 位置/回転 === */
    this.position = new THREE.Vector3();
    this.rotation = 0;
    this.targetPosition = new THREE.Vector3();
    this.targetRotation = 0;

    /* === エフェクト用タイマー === */
    this.damageFlashTimer = 0;
    this.emissivePulseTimer = 0;

    /* 初期スポーン */
    this.spawn();
  }

  /* 試合用の戦績（キル/デス/アシスト/連続キル）をリセット */
  resetMatchStats() {
    this.matchKills = 0;
    this.matchDeaths = 0;
    this.matchAssists = 0;
    this.currentKillStreak = 0;
  }

  /* メッシュの表示状態（透明度/発光/可視性）を初期状態に戻す */
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

  /* ランダム位置にプレイヤーをスポーン */
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

  /* 現在の武器定義に基づいて弾薬・オーバーヒート値を補充 */
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

  /* 被弾処理：HPを減らし、死亡判定を行い、被弾フラッシュを開始 */
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

  /* メッシュ位置・回転を現在の座標/角度に同期 */
  updateMesh() {
    this.mesh.position.set(this.position.x, CONFIG.playerHeight / 2, this.position.z);
    this.mesh.rotation.y = this.rotation;
    this.glowRing.position.set(this.position.x, 0.05, this.position.z);
    this.edgeLine.position.copy(this.mesh.position);
    this.edgeLine.rotation.y = this.rotation;
    this.outlineLine.position.copy(this.mesh.position);
    this.outlineLine.rotation.y = this.rotation;
  }

  /* 位置を即時設定（サーバー補正時などに使用） */
  setPosition(pos) {
    this.position.copy(pos);
    this.targetPosition.copy(pos);
  }

  /* 回転を即時設定 */
  setRotation(rot) {
    this.rotation = rot;
    this.targetRotation = rot;
  }

  /* リモートプレイヤーの位置・回転をターゲットに向かって補間 */
  lerpToTarget(dt) {
    this.position.lerp(this.targetPosition, 1 - Math.exp(-10 * dt));
    const diff = this.targetRotation - this.rotation;
    this.rotation += diff * Math.min(1, 10 * dt);
  }

  /* 毎フレームの更新：死亡フェードアウト/リロード/被弾フラッシュ/発光パルス */
  update(dt) {
    if (!this.alive) {
      /* 死亡後：フェードアウト → 非表示 */
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

    /* リロード進行 */
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

    /* 被弾フラッシュ：白色発光 */
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

    /* 発光パルスアニメーション */
    this.emissivePulseTimer += dt * 3;
    const pulse = 0.25 + 0.15 * Math.sin(this.emissivePulseTimer);
    this.mesh.material.emissiveIntensity = this.damageFlashTimer > 0 ? 0.8 + 0.2 * Math.sin(this.damageFlashTimer * 50) : pulse;
    this.outlineMat.opacity = 0.1 + 0.1 * Math.sin(this.emissivePulseTimer);

    this.edgeMat.opacity = 0.3 + 0.15 * Math.sin(this.emissivePulseTimer);

    this.updateMesh();
  }

  /* 全メッシュを非表示（死亡後完全に見えなくなる） */
  _hideAll() {
    this.mesh.visible = false;
    this.edgeLine.visible = false;
    this.glowRing.visible = false;
    this.outlineLine.visible = false;
  }

  /* 死亡エフェクト：赤発光＋フェードアウト開始 */
  playDeathEffect() {
    this.deathFadeTimer = 0.5;
    this.mesh.material.color.setHex(0xff0000);
    this.mesh.material.emissive.setHex(0xff0000);
    this.mesh.material.emissiveIntensity = 1.0;
    this.mesh.material.transparent = true;
    this.mesh.material.opacity = 1.0;
  }

  /* メッシュのメモリ解放とシーンからの削除 */
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
