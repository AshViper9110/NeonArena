/* ============================================================
   NEON ARENA - チート管理
   チート検出報告、判定閾値管理、検出時の処理
   ============================================================ */

/**
 * チート管理クラス
 * 不審なプレイヤー行動を検出・報告し、
 * 閾値を超えた場合にチート判定イベントを発火する
 */
class CheatManager {
  constructor(game) {
    this.game = game;                    // Gameインスタンス参照
    this.reasons = new Map();            // プレイヤーID -> チート理由
    this.cheatThreshold = 1;             // 検出閾値（1回で即検出）
    this.cheatTimer = 0;                 // チート検出後のタイマー
  }

  /**
   * チート報告を受け付ける
   * ログ出力とマップへの記録を行い、閾値に達したら検出イベントを発火
   * @param {string} peerId - 報告対象プレイヤーID
   * @param {string} reason - チートと判断した理由
   */
  report(peerId, reason) {
    const p = this.game.players.get(peerId);
    const name = p ? p.name : peerId;
    console.log('[CHEAT] Player=%s Reason=%s Timestamp=%d', name, reason, Date.now());
    this.reasons.set(peerId, reason);
    if (this.reasons.size >= this.cheatThreshold) {
      this._triggerCheatDetected(peerId, reason);
    }
  }

  /**
   * チート検出イベントを発火
   * 全プレイヤーにチート検出メッセージをブロードキャストし、
   * ゲーム側のハンドラを呼び出す
   * @param {string} peerId - 検出されたプレイヤーID
   * @param {string} reason - 検出理由
   */
  _triggerCheatDetected(peerId, reason) {
    if (this.game.gameOver) return;
    const p = this.game.players.get(peerId);
    const name = p ? p.name : peerId;
    const msg = {
      type: 'cheat_detected',
      playerId: peerId,
      playerName: name,
      reason,
    };
    this.game.network.broadcast(msg);
    this.game._handleCheatDetected(msg);
  }

  /**
   * 状態をリセット
   * マップ変更やゲーム再開時に呼び出される
   */
  reset() {
    this.reasons.clear();
    this.cheatTimer = 0;
  }
}
