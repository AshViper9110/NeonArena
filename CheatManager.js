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
   * チート報告を受け付ける（現在無効化）
   */
  report(peerId, reason) {
    // 無効化
  }

  /**
   * チート検出イベントを発火（現在無効化）
   */
  _triggerCheatDetected(peerId, reason) {
    // 無効化
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
