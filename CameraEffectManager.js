/* ============================================================
   NEON ARENA - カメラエフェクト管理
   画面シェイク・フラッシュ・FOV変更など視覚効果を担当
   ============================================================ */

/**
 * カメラエフェクト管理クラス
 * 被弾時の画面シェイク、フラッシュ、武器使用時の視野変更などを管理する
 */
class CameraEffectManager {
  constructor(camera) {
    this.camera = camera;

    /* 各種エフェクトの状態 */
    this.shakeIntensity = 0;        // 現在のシェイク強度
    this.shakeDecay = 0.92;         // シェイク減衰率
    this.flashOpacity = 0;          // フラッシュ透明度
    this.flashColor = null;         // フラッシュ色
    this.targetFov = null;          // 目標FOV
    this.fovSpeed = 6;              // FOV変更速度
    this.baseFov = camera.fov;      // 基準FOV

    /* フラッシュ表示用の全画面オーバーレイ */
    this.flashOverlay = this._createFlashOverlay();

    /* カメラの元の位置を保持（シェイクからの復帰用） */
    this.originalPosition = camera.position.clone();
  }

  /**
   * フラッシュ用の全画面オーバーレイを生成
   * @returns {HTMLElement} オーバーレイdiv要素
   */
  _createFlashOverlay() {
    const div = document.createElement('div');
    div.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none;
      z-index: 9999;
      opacity: 0;
      transition: none;
    `;
    document.body.appendChild(div);
    return div;
  }

  /**
   * 画面シェイクを発生させる
   * @param {number} intensity - シェイクの強さ
   */
  shake(intensity) {
    this.shakeIntensity = Math.min(
      this.shakeIntensity + intensity,
      intensity * 2
    );
  }

  /**
   * 画面フラッシュエフェクト
   * @param {string} color - フラッシュ色（CSS色指定）
   * @param {number} intensity - 透明度（0〜1）
   */
  flash(color, intensity) {
    this.flashColor = color;
    this.flashOpacity = Math.min(this.flashOpacity + intensity, 1);
  }

  /**
   * 武器発射時のFOVキック（視野拡大→復帰）
   * @param {number} amount - FOV変化量
   * @param {number} speed - 復帰速度
   */
  fovKick(amount, speed) {
    this.targetFov = (this.targetFov || this.baseFov) + amount;
    this.fovSpeed = speed || 8;
  }

  /**
   * 毎フレームの更新処理
   * @param {number} dt - デルタタイム（秒）
   */
  update(dt) {
    /* シェイク処理 */
    if (this.shakeIntensity > 0.01) {
      /* ランダム方向へのオフセット */
      this.camera.position.x = this.originalPosition.x +
        (Math.random() - 0.5) * this.shakeIntensity * 0.06;
      this.camera.position.y = this.originalPosition.y +
        (Math.random() - 0.5) * this.shakeIntensity * 0.06;
      this.shakeIntensity *= this.shakeDecay;
    } else {
      this.shakeIntensity = 0;
      this.camera.position.copy(this.originalPosition);
    }

    /* フラッシュ処理 */
    if (this.flashOpacity > 0.01) {
      this.flashOverlay.style.backgroundColor = this.flashColor || 'white';
      this.flashOverlay.style.opacity = this.flashOpacity;
      this.flashOpacity *= 0.88;    // 自然減衰
    } else {
      this.flashOpacity = 0;
      this.flashOverlay.style.opacity = 0;
    }

    /* FOV変更処理 */
    if (this.targetFov !== null) {
      const diff = this.targetFov - this.camera.fov;
      if (Math.abs(diff) > 0.1) {
        this.camera.fov += diff * Math.min(1, this.fovSpeed * dt);
        this.camera.updateProjectionMatrix();
      } else {
        /* 目標に達したら基準FOVに徐々に戻す */
        this.targetFov += (this.baseFov - this.targetFov) * 0.08;
        if (Math.abs(this.targetFov - this.baseFov) < 0.5) {
          this.targetFov = null;
          this.camera.fov = this.baseFov;
          this.camera.updateProjectionMatrix();
        }
      }
    }
  }

  /**
   * 全てのエフェクトをリセット
   */
  reset() {
    this.shakeIntensity = 0;
    this.flashOpacity = 0;
    this.flashOverlay.style.opacity = '0';
    this.targetFov = null;
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();
    this.camera.position.copy(this.originalPosition);
  }

  /**
   * リソースを解放（オーバーレイ要素を削除）
   */
  dispose() {
    if (this.flashOverlay && this.flashOverlay.parentNode) {
      this.flashOverlay.parentNode.removeChild(this.flashOverlay);
    }
  }
}
