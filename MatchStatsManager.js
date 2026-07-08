/* ============================================================
   NEON ARENA - 試合統計
   キル/デス/アシストの記録、キルストリーク、試合結果集計
   ============================================================ */

/**
 * 試合統計管理クラス
 * 各プレイヤーのキル・デス・アシストを追跡し、
 * キルストリーク名の判定や最終結果のソート・勝者判定を行う
 */
class MatchStatsManager {
  constructor(game) {
    this.game = game;
    this.stats = new Map();          // プレイヤーID -> { kills, deaths, assists }
    this.killStreaks = new Map();    // プレイヤーID -> 現在の連続キル数
    this.killLog = [];               // 全キルイベントの時系列ログ
  }

  /**
   * 全ての統計データをリセット
   */
  resetAll() {
    this.stats.clear();
    this.killStreaks.clear();
    this.killLog = [];
  }

  /**
   * プレイヤーの統計エントリを初期化（なければ作成）
   * @param {string} id - プレイヤーID
   * @returns {Object} 統計オブジェクト
   */
  _ensure(id) {
    if (!this.stats.has(id)) {
      this.stats.set(id, { kills: 0, deaths: 0, assists: 0 });
    }
    return this.stats.get(id);
  }

  /**
   * キルイベントを登録
   * キル・デス・ストリークを更新し、ゲーム側のplayerプロパティも同期
   * @param {string} killerId - キルしたプレイヤーID
   * @param {string} victimId - 倒されたプレイヤーID
   * @param {string} weapon - 使用武器ID
   * @returns {Object} ストリーク情報とプレイヤー名
   */
  registerKill(killerId, victimId, weapon) {
    const killerStats = this._ensure(killerId);
    killerStats.kills++;

    const victimStats = this._ensure(victimId);
    victimStats.deaths++;

    const streak = (this.killStreaks.get(killerId) || 0) + 1;
    this.killStreaks.set(killerId, streak);

    const killer = this.game.players.get(killerId);
    const victim = this.game.players.get(victimId);

    if (killer) {
      killer.matchKills = killerStats.kills;
      killer.currentKillStreak = streak;
    }
    if (victim) {
      victim.matchDeaths = victimStats.deaths;
      victim.currentKillStreak = 0;
    }

    this.killStreaks.set(victimId, 0);

    this.killLog.push({
      killerId, victimId, weapon,
      time: Date.now(),
      streak,
    });

    return {
      streak,
      killerName: killer ? killer.name : '?',
      victimName: victim ? victim.name : '?',
    };
  }

  /**
   * 死亡イベントを登録（キルなしでの死亡用）
   * @param {string} playerId - 死亡したプレイヤーID
   */
  registerDeath(playerId) {
    const stats = this._ensure(playerId);
    stats.deaths++;
    this.killStreaks.set(playerId, 0);
    const p = this.game.players.get(playerId);
    if (p) {
      p.matchDeaths = stats.deaths;
      p.currentKillStreak = 0;
    }
  }

  /**
   * プレイヤーの現在のキルストリークを取得
   * @param {string} playerId - プレイヤーID
   * @returns {number} 連続キル数
   */
  getKillStreak(playerId) {
    return this.killStreaks.get(playerId) || 0;
  }

  /**
   * プレイヤーの統計を取得
   * @param {string} playerId - プレイヤーID
   * @returns {Object} 統計情報
   */
  getStats(playerId) {
    return this._ensure(playerId);
  }

  /**
   * 試合結果を取得（キル数降順、同数の場合はK/D比順）
   * @returns {Array} ソート済み結果配列
   */
  getResults() {
    const results = [];
    this.game.players.forEach((p, id) => {
      const s = this._ensure(id);
      results.push({
        id,
        name: p.name,
        color: p.color,
        kills: s.kills,
        deaths: s.deaths,
        assists: s.assists,
      });
    });
    results.sort((a, b) => {
      if (b.kills !== a.kills) return b.kills - a.kills;
      const kdA = a.kills / Math.max(a.deaths, 1);
      const kdB = b.kills / Math.max(b.deaths, 1);
      return kdB - kdA;
    });
    return results;
  }

  /**
   * 勝者を判定
   * 最高キル数のプレイヤーがいればその情報を返す
   * @returns {Object|null} 勝者情報（該当者なしはnull）
   */
  getWinner() {
    const results = this.getResults();
    if (results.length === 0) return null;
    const topKills = results[0].kills;
    if (topKills === 0) return null;
    const winners = results.filter(r => r.kills === topKills);
    return { winners, topKills };
  }

  /**
   * キルストリークの名称を取得
   * @param {number} count - 連続キル数
   * @returns {string|null} ストリーク名（該当なしはnull）
   */
  getStreakName(count) {
    if (count >= 5) return 'PENTA KILL';
    if (count >= 4) return 'QUADRA KILL';
    if (count >= 3) return 'TRIPLE KILL';
    if (count >= 2) return 'DOUBLE KILL';
    return null;
  }
}
