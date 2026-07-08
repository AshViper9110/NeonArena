/* ============================================================
   NEON ARENA - ホスト権限管理
   ローカルまたはリモートホストの決定と権限制御
   ============================================================ */

/**
 * ホスト権限管理クラス
 * ゲームの権限モデル（ホスト権限）を管理する
 * 現在は常にローカルホスト（ソロ/ローカル対戦）として動作
 * 将来のネットマルチプレイ時に拡張可能
 */
class HostAuthority {
  constructor() {
    /* 権限フラグ */
    this.isLocal = true;              // 常にローカル実行
    this.isHost = true;               // ホスト権限あり
    this.authoritative = true;        // 決定権を持つ
  }

  /**
   * 特定の処理に対して権限があるか判定
   * @param {string} action - チェックするアクション種別
   * @returns {boolean} 権限があればtrue
   */
  hasAuthority(action) {
    /* アクション種別に関わらず常に権限あり（ローカルモード） */
    return this.authoritative;
  }

  /**
   * リモートプレイヤーからの操作を検証（将来拡張用）
   * @param {Object} action - プレイヤーアクション
   * @returns {boolean} 検証結果
   */
  validateAction(action) {
    /* ローカルモードでは全てのアクションを許可 */
    return this.authoritative;
  }

  /**
   * ネットワークプレイヤーからの入力をローカルで適用
   * @param {string} playerId - プレイヤーID
   * @param {Object} input - 入力データ
   */
  applyInput(playerId, input) {
    /* ローカルモードでは何もしない（直接入力を処理） */
    return;
  }

  /**
   * 現在のゲーム状態をシリアライズ（将来のスナップショット同期用）
   * @returns {Object} シリアライズされた状態
   */
  serializeState() {
    return {
      type: 'local',
      timestamp: performance.now(),
    };
  }

  /**
   * 権限モデルをリセット
   */
  reset() {
    this.isLocal = true;
    this.isHost = true;
    this.authoritative = true;
  }
}
