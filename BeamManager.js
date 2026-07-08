/* ============================================================
   NEON ARENA - ビーム武器の描画管理
   ビームの発射、メッシュ生成、衝突エフェクト、更新・削除を担当
   ============================================================ */

/**
 * ビーム管理クラス
 * ビーム兵器（プラズマライフル、レーザーライフルなど）の視覚表現を管理する
 * メインビーム + グロー + 着弾エフェクト（スパーク、リング、爆発）を生成・更新
 */
class BeamManager {
  constructor(scene) {
    this.scene = scene;               // Three.js シーン参照
    this.activeBeams = [];            // アクティブなビーム配列
    this.impactEffects = [];          // 着弾エフェクト配列
  }

  /**
   * ビームを発射する
   * @param {THREE.Vector3} startPos - 発射開始位置
   * @param {THREE.Vector3} endPos - 発射終了位置
   * @param {Object} weaponDef - 武器定義
   * @param {number} color - ビームの色（16進数）
   */
  fireBeam(startPos, endPos, weaponDef, color) {
    const wp = weaponDef || {};
    const isPlasma = wp.id === 'plasma_rifle' || color === 0x00ffcc;  // プラズマ兵器判定
    const beamColor = color || wp.color || 0x88ddff;
    const duration = isPlasma ? 0.12 : 0.05;  // プラズマは発光時間が長い

    const beam = {
      start: startPos.clone(),
      end: endPos.clone(),
      color: beamColor,
      life: duration,         // 現在の生存時間
      maxLife: duration,      // 最大生存時間
      isPlasma,
      mesh: null,             // メインビームメッシュ
      glow: null,             // グローメッシュ
    };

    this._createBeamMesh(beam);
    this.activeBeams.push(beam);

    this._spawnImpactEffect(endPos, beamColor, isPlasma);
  }

  /**
   * ビームのメッシュ（主ビーム + グロー）を作成
   * Three.js の CylinderGeometry を使って線状のビームを表現
   * @param {Object} beam - ビームオブジェクト
   */
  _createBeamMesh(beam) {
    const dir = new THREE.Vector3().subVectors(beam.end, beam.start);
    const length = dir.length();

    // ========= メインビーム =========
    const radius = beam.isPlasma ? 0.18 : 0.10;  // プラズマは太く

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
      opacity: 0.9,                      // 高輝度で発光表現
      blending: THREE.AdditiveBlending,  // 加算合成でグロー効果
      depthWrite: false
    });

    const mesh = new THREE.Mesh(geo, mat);

    /* ビームの中心を開始点と終了点の中間に配置 */
    mesh.position.copy(beam.start).add(beam.end).multiplyScalar(0.5);

    /* 円柱の向き（Y軸上方向）をビーム方向に回転 */
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.normalize()
    );

    this.scene.add(mesh);

    beam.mesh = mesh;
    beam.geo = geo;
    beam.mat = mat;

    // ========= 外側グロー =========
    const glowRadius = radius * 2.2;  // メインビームより大きく

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

    /* グローはメインビームと同じ位置・回転 */
    glow.position.copy(mesh.position);
    glow.quaternion.copy(mesh.quaternion);

    this.scene.add(glow);

    beam.glow = glow;
    beam.glowGeo = glowGeo;
    beam.glowMat = glowMat;
  }

  /**
   * 着弾エフェクトを生成
   * スパーク（粒子）・リング・プラズマ爆発を生成する
   * @param {THREE.Vector3} pos - 着弾位置
   * @param {number} color - エフェクトの色
   * @param {boolean} isPlasma - プラズマ兵器か
   */
  _spawnImpactEffect(pos, color, isPlasma) {
    const col = new THREE.Color(color);

    /* スパークエフェクト（小さな点群） */
    const sparkMat = new THREE.PointsMaterial({
      color: color,
      size: 0.15,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const sparkCount = isPlasma ? 12 : 6;  // プラズマは多め
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

    /* リングエフェクト（地面に広がる円環） */
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

    /* プラズマ爆発（球状の爆発エフェクト） */
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

    /* エフェクトを管理リストに追加 */
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

  /**
   * 毎フレームの更新処理
   * ビームとエフェクトの経過時間を減算し、透明度などを更新
   * 寿命が尽きたものは削除
   * @param {number} dt - デルタタイム（秒）
   */
  update(dt) {
    /* アクティブビームの更新 */
    for (let i = this.activeBeams.length - 1; i >= 0; i--) {
      const beam = this.activeBeams[i];
      beam.life -= dt;
      const t = Math.max(0, beam.life / beam.maxLife);
      /* 残り時間に応じてグローの透明度を減衰 */
      if (beam.glowMat)
        beam.glowMat.opacity = t * (beam.isPlasma ? 0.35 : 0.18);
      if (beam.glowMat) beam.glowMat.opacity = t * 0.3;
      if (beam.life <= 0) {
        this._removeBeam(beam);
        this.activeBeams.splice(i, 1);
      }
    }

    /* 着弾エフェクトの更新 */
    for (let i = this.impactEffects.length - 1; i >= 0; i--) {
      const fx = this.impactEffects[i];
      fx.life -= dt;
      const t = Math.max(0, fx.life / fx.maxLife);
      /* エフェクト種類ごとに異なるアニメーション */
      if (fx.type === 'spark') {
        fx.mat.opacity = t * 0.8;
      } else if (fx.type === 'ring') {
        fx.mat.opacity = t * 0.4;
        const s = 1 + (1 - t) * 2;  // リング拡大
        fx.mesh.scale.setScalar(s);
      } else if (fx.type === 'plasma_boom') {
        fx.mat.opacity = t * 0.3;
        const s = 1 + (1 - t) * 3;  // 爆発拡大
        fx.mesh.scale.setScalar(s);
      }
      /* 寿命が尽きたエフェクトを削除 */
      if (fx.life <= 0) {
        if (fx.mesh.parent) this.scene.remove(fx.mesh);
        fx.geo.dispose();
        fx.mat.dispose();
        this.impactEffects.splice(i, 1);
      }
    }
  }

  /**
   * ビームをシーンから削除し、リソースを解放
   * @param {Object} beam - 削除するビームオブジェクト
   */
  _removeBeam(beam) {
    if (beam.mesh && beam.mesh.parent) this.scene.remove(beam.mesh);
    if (beam.geo) beam.geo.dispose();
    if (beam.mat) beam.mat.dispose();
    if (beam.glow && beam.glow.parent) this.scene.remove(beam.glow);
    if (beam.glowGeo) beam.glowGeo.dispose();
    if (beam.glowMat) beam.glowMat.dispose();
  }

  /**
   * 全てのビームとエフェクトをクリア
   * マップ変更時やゲーム終了時に呼び出される
   */
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
