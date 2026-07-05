class MatchStatsManager {
  constructor(game) {
    this.game = game;
    this.stats = new Map();
    this.killStreaks = new Map();
    this.killLog = [];
  }

  resetAll() {
    this.stats.clear();
    this.killStreaks.clear();
    this.killLog = [];
  }

  _ensure(id) {
    if (!this.stats.has(id)) {
      this.stats.set(id, { kills: 0, deaths: 0, assists: 0 });
    }
    return this.stats.get(id);
  }

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

  getKillStreak(playerId) {
    return this.killStreaks.get(playerId) || 0;
  }

  getStats(playerId) {
    return this._ensure(playerId);
  }

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

  getWinner() {
    const results = this.getResults();
    if (results.length === 0) return null;
    const topKills = results[0].kills;
    if (topKills === 0) return null;
    const winners = results.filter(r => r.kills === topKills);
    return { winners, topKills };
  }

  getStreakName(count) {
    if (count >= 5) return 'PENTA KILL';
    if (count >= 4) return 'QUADRA KILL';
    if (count >= 3) return 'TRIPLE KILL';
    if (count >= 2) return 'DOUBLE KILL';
    return null;
  }
}
