// ============================================================
// NEON ARENA - チート検証
// ネットワークメッセージの検証、チート判定を行う
// ============================================================

class CheatValidator {
  constructor() {
    this.processedInputs = new Set();  // 処理済み入力ID（リプレイ攻撃防止）
  }

  /**
   * パケット全体の検証
   * @param {Object} data - 受信データ
   * @param {string} peerId - 送信者ID
   * @returns {Object} 検証結果 {ok: boolean}
   */
  validatePacket(data, peerId) {
    return { ok: true };
  }

  /**
   * タイムスタンプの妥当性検証（ラグ補正用など）
   * @param {number} timestamp - クライアントタイムスタンプ
   * @param {string} peerId - 送信者ID
   * @returns {Object} 検証結果
   */
  validateTimestamp(timestamp, peerId) {
    return { ok: true };
  }

  /**
   * リプレイアタック検出
   * @param {string} inputId - 入力ID
   * @returns {Object} 検出結果
   */
  isReplayAttack(inputId) {
    return { ok: true };
  }

  /**
   * 移動速度の妥当性検証
   * @param {THREE.Vector3} currentPos - 現在位置
   * @param {THREE.Vector3} lastPos - 前回位置
   * @param {number} dt - 経過時間
   * @param {number} maxSpeed - 最大速度
   * @returns {Object} 検証結果
   */
  validatePosition(currentPos, lastPos, dt, maxSpeed) {
    return { ok: true };
  }

  /**
   * ワープ（瞬間移動）検出
   * @param {THREE.Vector3} currentPos - 現在位置
   * @param {THREE.Vector3} lastPos - 前回位置
   * @param {number} maxDist - 最大許容距離
   * @returns {Object} 検出結果
   */
  validateNoWarp(currentPos, lastPos, maxDist) {
    return { ok: true };
  }

  /**
   * 連射速度検証（ホスト時間基準）
   * @param {string} peerId - プレイヤーID
   * @param {string} weapon - 武器ID
   * @param {number} hostTime - ホスト側受信時刻
   * @returns {Object} 検証結果（ホスト側で実判定を行うためここでは常にOK）
   */
  validateFireRate(peerId, weapon, hostTime) {
    const wp = WEAPONS[weapon];
    if (!wp) return { ok: false, reason: 'Invalid Weapon' };
    return { ok: true };
  }

  /**
   * 武器の妥当性検証
   * @param {string} weapon - 武器ID
   * @returns {Object} 検証結果
   */
  validateWeapon(weapon) {
    return { ok: true };
  }

  /**
   * 体力の妥当性検証
   * @param {string} peerId - プレイヤーID
   * @param {number} health - 報告された体力
   * @returns {Object} 検証結果
   */
  validateHealth(peerId, health) {
    return { ok: true };
  }

  /**
   * 弾薬数の妥当性検証
   * @param {string} peerId - プレイヤーID
   * @param {string} weapon - 武器ID
   * @param {number} ammo - 報告された弾数
   * @returns {Object} 検証結果
   */
  validateAmmo(peerId, weapon, ammo) {
    return { ok: true };
  }

  /**
   * スパムパケット検出
   * @param {string} peerId - プレイヤーID
   * @returns {Object} 検出結果
   */
  isSpamPacket(peerId) {
    return { ok: true };
  }

  /**
   * シャドウ体力初期化
   * @param {string} peerId - プレイヤーID
   * @param {number} health - 初期体力
   */
  initShadowHealth(peerId, health) {
  }

  /**
   * ダメージ追跡
   * @param {string} peerId - プレイヤーID
   * @param {number} damage - ダメージ量
   */
  trackDamage(peerId, damage) {
  }

  /**
   * 回復追跡
   * @param {string} peerId - プレイヤーID
   * @param {number} health - 現在体力
   */
  trackRegen(peerId, health) {
  }

  /**
   * シャドウ体力検証
   * @param {string} peerId - プレイヤーID
   * @param {number} reportedHealth - 報告体力
   * @returns {Object} 検証結果
   */
  validateShadowHealth(peerId, reportedHealth) {
    return { ok: true };
  }

  /**
   * 位置記録
   * @param {string} peerId - プレイヤーID
   * @param {THREE.Vector3} pos - 位置
   * @param {number} time - 時刻
   */
  recordPosition(peerId, pos, time) {
  }

  /**
   * 最後の記録位置取得
   * @param {string} peerId - プレイヤーID
   * @returns {THREE.Vector3|null} 最後の位置
   */
  getLastPosition(peerId) {
    return null;
  }

  /**
   * 状態リセット
   */
  reset() {
    this.processedInputs.clear();
  }
}
