class CheatManager {
  constructor(game) {
    this.game = game;
    this.reasons = new Map();
    this.cheatThreshold = 1;
    this.cheatTimer = 0;
  }

  report(peerId, reason) {
    const p = this.game.players.get(peerId);
    const name = p ? p.name : peerId;
    console.log('[CHEAT] Player=%s Reason=%s Timestamp=%d', name, reason, Date.now());
    this.reasons.set(peerId, reason);
    if (this.reasons.size >= this.cheatThreshold) {
      this._triggerCheatDetected(peerId, reason);
    }
  }

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

  reset() {
    this.reasons.clear();
    this.cheatTimer = 0;
  }
}
