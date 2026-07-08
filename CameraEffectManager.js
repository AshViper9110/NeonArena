/* ============================================================
   NEON ARENA - カメラエフェクト管理
   画面シェイク・赤フラッシュ・FOV変更など視覚効果を担当
   ============================================================ */

class CameraEffectManager {
  constructor(camera) {
    this.camera = camera;
    this.shakeIntensity = 0;
    this.shakeDecay = 0.92;
    this.redFlash = 0;
    this.fovOffset = 0;
    this.fovDuration = 0;
    this.baseFov = camera.fov;
    this.slowMo = 0;
    this.slowMoDuration = 0;
    this.originalDt = 0;
  }

  shake(intensity) {
    this.shakeIntensity = Math.min(this.shakeIntensity + intensity, intensity * 2);
  }

  flash(color, intensity) {
    // 未使用（オリジナル互換）
  }

  fovKick(amount, speed) {
    this.fovOffset = amount;
    this.fovDuration = 0.15;
  }

  /* 被弾シェイク */
  hitShake(intensity) {
    this.shake(intensity || 3);
  }

  /* 赤色ダメージフラッシュ */
  damageFlash() {
    this.redFlash = 0.4;
  }

  /* キル時のスローモーション */
  killSlowMo() {
    this.slowMo = 1;
    this.slowMoDuration = 0.08;
    this.originalDt = 0;
  }

  /* 爆発シェイク */
  explosionShake(intensity) {
    this.shake(intensity || 6);
  }

  /* ダッシュFOV拡大 */
  dashFov() {
    this.fovOffset = 10;
    this.fovDuration = 0.15;
  }

  /* 現在の赤フラッシュ透明度を返す */
  getRedFlash() {
    return this.redFlash;
  }

  update(dt) {
    this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * dt);
    if (this.shakeIntensity > 0.1) {
      this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity * 0.1;
      this.camera.position.z += (Math.random() - 0.5) * this.shakeIntensity * 0.1;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity * 0.05;
    }

    if (this.fovDuration > 0) {
      this.fovDuration -= dt;
      this.camera.fov = this.baseFov + this.fovOffset * (this.fovDuration / 0.15);
      this.camera.updateProjectionMatrix();
      if (this.fovDuration <= 0) {
        this.fovOffset = 0;
        this.fovDuration = 0;
        this.camera.fov = this.baseFov;
        this.camera.updateProjectionMatrix();
      }
    }

    if (this.redFlash > 0) {
      this.redFlash = Math.max(0, this.redFlash - dt * 2);
    }

    return dt;
  }

  reset() {
    this.shakeIntensity = 0;
    this.fovOffset = 0;
    this.fovDuration = 0;
    this.redFlash = 0;
    this.slowMo = 0;
    this.slowMoDuration = 0;
    this.camera.fov = this.baseFov;
  }
}
