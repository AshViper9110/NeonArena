/* ============================================================
   NEON ARENA - パッシブスキル適用
   パッシブスキルのモディファイア計算と適用を一元管理
   ============================================================ */

/**
 * パッシブスキル管理 - 全モディファイア計算の唯一の情報源
 * データ駆動設計: if/switchの連鎖は行わず、モディファイアキーで汎用的にプロパティをマッピング
 * 乗算系: 累積で乗算
 * 加算（flat）系: 累積で加算
 * 加算（additive）系: 累積で加算
 * 真偽値フラグ: OR結合
 */
const MODIFIER_TYPES = {
  multiplier: new Set([
    "moveSpeed","dashSpeed",
    "damageMultiplier","fireRateMultiplier","reloadMultiplier",
    "recoilMultiplier","spreadMultiplier","projSpeedMultiplier",
    "projSizeMultiplier","rangeMultiplier",
    "criticalDamageMultiplier",
    "beamWidthMultiplier","beamRangeMultiplier","beamDamageMultiplier",
    "beamSpreadMultiplier","beamCooldownMultiplier","plasmaBoomMultiplier",
    "switchSpeedMultiplier","magazineMultiplier","ammoCostMultiplier",
    "chainDamageMult","headshotMult","explosionRadiusMultiplier"
  ]),
  flat: new Set([
    "healthRegen","ammoRegenPerSec","explosiveAmmoRadius","lifeSteal"
  ]),
  additive: new Set([
    "pierceCount","ricochetCount","clusterCount",
    "chainCount","beamReflectCount","ammoRegenOnKill","criticalChance"
  ]),
  duration: new Set([
    "freezeDuration","burnDuration","poisonDuration"
  ]),
  dot: new Set([
    "burnDamagePerSec","poisonDamagePerSec"
  ]),
  threshold: new Set([
    "executionerThreshold"
  ]),
  flag: new Set([
    "explosiveAmmo"
  ])
};

/**
 * パッシブスキル管理クラス
 * プレイヤーに割り当てられたパッシブスキルからモディファイアを計算し、
 * 武器・発射物・ビーム・爆発などに適用する
 */
class PassiveManager {
  constructor(game) {
    this.game = game;
    this._playerPassives = {};       // プレイヤーID -> パッシブID配列
    this._modifierCache = {};        // プレイヤーID -> 計算済みモディファイア
    this._ammoRegenTimers = {};      // プレイヤーID -> 弾薬自動回復タイマー
  }

  /* ======================== */
  /* 互換性API                 */
  /* ======================== */

  setPassive(playerId, passiveId) {
    this.assignPassive(playerId, passiveId);
  }

  invalidate(playerId) {
    this._invalidateCache(playerId);
  }

  applyToPlayer(playerOrId) {
    let player, playerId;
    if (typeof playerOrId === 'object' && playerOrId !== null) {
      player = playerOrId;
      playerId = player.id || this.game.localId;
    } else {
      playerId = playerOrId;
      player = this.game && this.game.players ? this.game.players.get(playerId) : null;
    }
    if (!player) return;
    this._applyModifiersToPlayer(player, playerId);
  }

  reloadPlayerAmmo(playerId) {
    const player = this.game && this.game.players ? this.game.players.get(playerId) : null;
    if (!player) return;
    const wp = WEAPONS[player.weapon] || WEAPONS.pistol;
    const magMult = this.getMagazineSize(playerId, 1);
    player.maxAmmo = Math.round(wp.maxAmmo * magMult);
    player.ammo = player.maxAmmo;
  }

  /**
   * 毎フレームの更新処理
   * 弾薬自動回復タイマーを進め、1秒ごとに回復を適用
   * @param {number} dt - デルタタイム（秒）
   */
  updateAll(dt) {
    for (const [playerId, timer] of Object.entries(this._ammoRegenTimers)) {
      this._ammoRegenTimers[playerId] = timer + dt;
      if (this._ammoRegenTimers[playerId] >= 1) {
        this._ammoRegenTimers[playerId] = 0;
        const mods = this.getAllModifiers(playerId);
        if (mods && mods.ammoRegenPerSec) {
          const player = this.game && this.game.players ? this.game.players.get(playerId) : null;
          if (player && player.alive) {
            player.ammo = Math.min(player.ammo + mods.ammoRegenPerSec, player.maxAmmo);
            this.game.updateAmmoUI();
          }
        }
      }
    }

    /* 新規プレイヤーの弾薬回復タイマーを初期化 */
    this.game.players.forEach((player, id) => {
      const mods = this.getAllModifiers(id);
      if (mods && mods.ammoRegenPerSec && this._ammoRegenTimers[id] === undefined) {
        this._ammoRegenTimers[id] = 0;
      }
    });
  }

  /**
   * キル時の弾薬回復処理
   * @param {string} playerId - キルしたプレイヤーID
   */
  onKill(playerId) {
    const mods = this.getAllModifiers(playerId);
    if (!mods) return;
    if (mods.ammoRegenOnKill) {
      const player = this.game && this.game.players ? this.game.players.get(playerId) : null;
      if (player && player.alive) {
        player.ammo = Math.min(player.ammo + mods.ammoRegenOnKill, player.maxAmmo);
        this.game.updateAmmoUI();
      }
    }
  }

  resetAll() {
    this.clearAll();
    this._ammoRegenTimers = {};
  }

  /* ======================== */
  /* HostAuthority API         */
  /* ======================== */

  getAmmoCost(playerId, baseCost) {
    const mult = this.getMultiplier('ammoCostMultiplier', playerId);
    return mult != null ? Math.round(baseCost * mult) : baseCost;
  }

  getMagazineSize(playerId, baseSize) {
    const mult = this.getMultiplier('magazineMultiplier', playerId);
    return mult != null ? Math.round(baseSize * mult) : baseSize;
  }

  getDamageMultiplier(playerId) {
    return this.getMultiplier('damageMultiplier', playerId) || 1;
  }

  getFireRateMultiplier(playerId) {
    return this.getMultiplier('fireRateMultiplier', playerId) || 1;
  }

  getReloadMultiplier(playerId) {
    return this.getMultiplier('reloadMultiplier', playerId) || 1;
  }

  getSpreadMultiplier(playerId) {
    return this.getMultiplier('spreadMultiplier', playerId) || 1;
  }

  /**
   * クリティカルヒット判定
   * @param {string} playerId - プレイヤーID
   * @returns {boolean} クリティカルならtrue
   */
  isCritical(playerId) {
    const chance = this.getAdditive('criticalChance', playerId) || 0;
    return Math.random() < chance;
  }

  getCriticalDamageMultiplier(playerId) {
    return this.getMultiplier('criticalDamageMultiplier', playerId) || 2;
  }

  getExplosionDamageMultiplier(playerId) {
    return this.getDamageMultiplier(playerId);
  }

  getExplosionRadius(playerId, baseRadius) {
    const mult = this.getMultiplier('explosionRadiusMultiplier', playerId);
    return mult != null ? baseRadius * mult : baseRadius;
  }

  getBeamRange(playerId, baseRange) {
    const mult = this.getMultiplier('beamRangeMultiplier', playerId);
    return mult != null ? baseRange * mult : baseRange;
  }

  getBeamWidth(playerId, baseWidth) {
    const mult = this.getMultiplier('beamWidthMultiplier', playerId);
    return mult != null ? baseWidth * mult : baseWidth;
  }

  getBeamDamage(playerId, baseDamage) {
    const dmgMult = this.getMultiplier('damageMultiplier', playerId);
    const beamMult = this.getMultiplier('beamDamageMultiplier', playerId);
    let result = baseDamage;
    if (dmgMult != null) result *= dmgMult;
    if (beamMult != null) result *= beamMult;
    return result;
  }

  /* ======================== */
  /* 公開API                  */
  /* ======================== */

  assignPassive(playerId, passiveId) {
    this._playerPassives[playerId] = [passiveId];
    this._invalidateCache(playerId);
  }

  assignPassives(playerId, passiveIds) {
    if (!passiveIds || !Array.isArray(passiveIds)) passiveIds = ["none"];
    this._playerPassives[playerId] = passiveIds;
    this._invalidateCache(playerId);
  }

  getPassiveIds(playerId) {
    return this._playerPassives[playerId] || ["none"];
  }

  clearPassive(playerId) {
    this.assignPassive(playerId, "none");
  }

  clearAll() {
    this._playerPassives = {};
    this._modifierCache = {};
  }

  getActivePassives(playerId) {
    const ids = this.getPassiveIds(playerId);
    return ids.map(id => PassiveRegistry.get(id)).filter(Boolean);
  }

  hasPassive(playerId, passiveId) {
    return this.getPassiveIds(playerId).includes(passiveId);
  }

  /* --- モディファイア解決 --- */

  getMultiplier(key, playerId) {
    return this._resolve(playerId, 'multiplier', key);
  }

  getFlat(key, playerId) {
    return this._resolve(playerId, 'flat', key);
  }

  getAdditive(key, playerId) {
    return this._resolve(playerId, 'additive', key);
  }

  getDuration(key, playerId) {
    return this._resolve(playerId, 'duration', key);
  }

  getDot(key, playerId) {
    return this._resolve(playerId, 'dot', key);
  }

  getThreshold(key, playerId) {
    return this._resolveMin(playerId, 'threshold', key);
  }

  getFlag(key, playerId) {
    return this._resolveFlag(playerId, key);
  }

  get(key, playerId) {
    const type = this._typeOfKey(key);
    switch (type) {
      case 'multiplier': return this.getMultiplier(key, playerId);
      case 'flat': case 'additive': case 'duration': case 'dot':
        return this._resolve(playerId, type, key);
      case 'threshold': return this.getThreshold(key, playerId);
      case 'flag': return this.getFlag(key, playerId);
      default: return this.getMultiplier(key, playerId);
    }
  }

  getAllModifiers(playerId) {
    const cache = this._getOrComputeCache(playerId);
    return { ...cache.flat, ...cache.mult, ...cache.flags };
  }

  getDamageReduction(playerId, type) {
    return 1;
  }

  /* --- 適用ヘルパー --- */

  /**
   * モディファイアを発射物に適用
   * 速度・サイズ・射程・貫通・跳弾・チェイン・状態異常などを設定
   * @param {Object} projectile - 発射物オブジェクト
   * @param {string} ownerId - 発射したプレイヤーID
   */
  applyToProjectile(projectile, ownerId) {
    const mods = this.getAllModifiers(ownerId);
    if (!mods) return;

    if (mods.projSpeedMultiplier != null) {
      if (projectile.speed) {
        projectile.speed *= mods.projSpeedMultiplier;
        if (projectile.velocity) {
          projectile.velocity.normalize().multiplyScalar(projectile.speed);
        }
      }
    }
    if (mods.projSizeMultiplier != null) {
      if (projectile.mesh) {
        projectile.mesh.scale.setScalar(mods.projSizeMultiplier);
      }
    }
    if (mods.rangeMultiplier != null) {
      projectile.maxDist *= mods.rangeMultiplier;
    }

    if (mods.pierceCount != null) {
      projectile.pierceRemaining = (projectile.pierceRemaining || 0) + mods.pierceCount;
      projectile.pierceCount = projectile.pierceRemaining;
    }
    if (mods.ricochetCount != null) {
      projectile.ricochetRemaining = (projectile.ricochetRemaining || 0) + mods.ricochetCount;
      projectile.ricochetCount = projectile.ricochetRemaining;
    }

    if (mods.damageMultiplier != null) {
      if (projectile.baseDamage !== undefined) projectile.baseDamage *= mods.damageMultiplier;
      if (projectile.damage !== undefined) projectile.damage *= mods.damageMultiplier;
    }

    if (mods.criticalChance != null) {
      projectile.criticalChance = (projectile.criticalChance || 0) + mods.criticalChance;
    }
    if (mods.criticalDamageMultiplier != null) {
      projectile.criticalDamageMultiplier = mods.criticalDamageMultiplier;
    }

    if (mods.projSizeMultiplier != null) {
      projectile.passiveSizeMult = mods.projSizeMultiplier;
    }

    if (mods.explosiveAmmo) {
      projectile.explosiveAmmo = true;
      projectile.explosionRadius = mods.explosiveAmmoRadius || 2;
    }

    if (mods.clusterCount != null) projectile.clusterCount = mods.clusterCount;
    if (mods.chainCount != null) {
      projectile.chainCount = mods.chainCount;
      projectile.chainDamageMult = mods.chainDamageMult || 0.5;
    }
    if (mods.freezeDuration != null) {
      projectile.freezeDuration = mods.freezeDuration;
      projectile.freezeSlowAmount = mods.freezeSlowAmount || 0.5;
    }
    if (mods.burnDuration != null) {
      projectile.burnDuration = mods.burnDuration;
      projectile.burnDamagePerSec = mods.burnDamagePerSec;
    }
    if (mods.poisonDuration != null) {
      projectile.poisonDuration = mods.poisonDuration;
      projectile.poisonDamagePerSec = mods.poisonDamagePerSec;
    }

    if (mods.lifeSteal != null) {
      projectile.lifeSteal = mods.lifeSteal;
    }

    /* 処刑者（低HP対象へのボーナスダメージ） */
    if (mods.executionerThreshold != null) {
      projectile.executionerThreshold = mods.executionerThreshold;
      projectile.executionerDamageMult = mods.executionerDamageMult || 1.3;
    }
  }

  /**
   * モディファイアをビームデータに適用
   * 幅・射程・ダメージ・拡散・反射・状態異常などを設定
   * @param {Object} beamData - ビームデータオブジェクト
   * @param {string} ownerId - 発射したプレイヤーID
   */
  applyToBeam(beamData, ownerId) {
    const mods = this.getAllModifiers(ownerId);
    if (!mods) return;

    if (mods.beamWidthMultiplier != null) {
      beamData.width = (beamData.width || 0.05) * mods.beamWidthMultiplier;
    }
    if (mods.beamRangeMultiplier != null) {
      beamData.range = (beamData.range || 10) * mods.beamRangeMultiplier;
    }
    if (mods.beamDamageMultiplier != null) {
      beamData.damage = (beamData.damage || 1) * mods.beamDamageMultiplier;
    }
    if (mods.beamSpreadMultiplier != null) {
      beamData.spread = (beamData.spread || 0.02) * mods.beamSpreadMultiplier;
    }
    if (mods.beamCooldownMultiplier != null) {
      beamData.cooldown = (beamData.cooldown || 0.1) * mods.beamCooldownMultiplier;
    }
    if (mods.beamReflectCount != null) {
      beamData.reflectCount = (beamData.reflectCount || 0) + mods.beamReflectCount;
    }
    if (mods.plasmaBoomMultiplier != null) {
      beamData.plasmaBoomRadius = (beamData.plasmaBoomRadius || 1) * mods.plasmaBoomMultiplier;
    }

    if (mods.criticalChance != null) {
      beamData.criticalChance = (beamData.criticalChance || 0) + mods.criticalChance;
    }
    if (mods.criticalDamageMultiplier != null) {
      beamData.criticalDamageMultiplier = mods.criticalDamageMultiplier;
    }
    if (mods.damageMultiplier != null) {
      beamData.damage = (beamData.damage || 1) * mods.damageMultiplier;
    }

    if (mods.freezeDuration != null) {
      beamData.freezeDuration = mods.freezeDuration;
      beamData.freezeSlowAmount = mods.freezeSlowAmount || 0.5;
    }
    if (mods.burnDuration != null) {
      beamData.burnDuration = mods.burnDuration;
      beamData.burnDamagePerSec = mods.burnDamagePerSec;
    }
    if (mods.poisonDuration != null) {
      beamData.poisonDuration = mods.poisonDuration;
      beamData.poisonDamagePerSec = mods.poisonDamagePerSec;
    }
    if (mods.chainCount != null) {
      beamData.chainCount = mods.chainCount;
      beamData.chainDamageMult = mods.chainDamageMult || 0.5;
    }
  }

  /**
   * モディファイアを爆発データに適用
   * @param {Object} explosionData - 爆発データオブジェクト
   * @param {string} ownerId - 発生源プレイヤーID
   */
  applyToExplosion(explosionData, ownerId) {
    const mods = this.getAllModifiers(ownerId);
    if (!mods) return;

    if (mods.damageMultiplier != null) {
      explosionData.damage = (explosionData.damage || 1) * mods.damageMultiplier;
    }
    if (mods.explosionRadiusMultiplier != null) {
      explosionData.radius = (explosionData.radius || 2) * mods.explosionRadiusMultiplier;
    }
  }

  /* --- 内部処理 --- */

  /**
   * モディファイアをプレイヤー自身に適用（移動速度・体力回復など）
   * @param {Object} player - プレイヤーオブジェクト
   * @param {string} playerId - プレイヤーID
   */
  _applyModifiersToPlayer(player, playerId) {
    const mods = this.getAllModifiers(playerId);
    if (!mods) return;

    if (mods.moveSpeed != null) player.moveSpeedMult = mods.moveSpeed;
    else player.moveSpeedMult = 1;

    if (mods.dashSpeed != null) player.dashSpeedMult = mods.dashSpeed;
    else player.dashSpeedMult = 1;

    if (mods.healthRegen != null) {
      player.healthRegen = mods.healthRegen;
    } else {
      player.healthRegen = 0;
    }
  }

  _invalidateCache(playerId) {
    delete this._modifierCache[playerId];
  }

  _getOrComputeCache(playerId) {
    if (this._modifierCache[playerId]) return this._modifierCache[playerId];
    return this._computeModifiers(playerId);
  }

  /**
   * モディファイアの計算
   * パッシブ定義から全モディファイアを収集・集計する
   * @param {string} playerId - プレイヤーID
   * @returns {Object} 計算済みモディファイア（flat/mult/flags）
   */
  _computeModifiers(playerId) {
    const result = { flat: {}, mult: {}, flags: {} };
    const ids = this.getPassiveIds(playerId);

    for (const id of ids) {
      const def = PassiveRegistry.get(id);
      if (!def || !def.modifiers) continue;
      for (const [key, value] of Object.entries(def.modifiers)) {
        const type = this._typeOfKey(key);
        switch (type) {
          case 'multiplier':
            if (result.mult[key] === undefined) result.mult[key] = 1;
            result.mult[key] *= value;
            break;
          case 'flat':
          case 'additive':
          case 'duration':
          case 'dot':
            if (result.flat[key] === undefined) result.flat[key] = 0;
            result.flat[key] += value;
            break;
          case 'threshold':
            if (result.flat[key] === undefined || value < result.flat[key]) {
              result.flat[key] = value;
            }
            break;
          case 'flag':
            result.flags[key] = true;
            break;
        }
      }
    }

    this._modifierCache[playerId] = result;
    return result;
  }

  _resolve(playerId, type, key) {
    const cache = this._getOrComputeCache(playerId);
    if (!cache) return undefined;
    switch (type) {
      case 'multiplier': return cache.mult[key];
      case 'flat': case 'additive': case 'duration': case 'dot':
        return cache.flat[key];
      default: return undefined;
    }
  }

  _resolveMin(playerId, type, key) {
    const cache = this._getOrComputeCache(playerId);
    if (!cache) return undefined;
    return cache.flat[key];
  }

  _resolveFlag(playerId, key) {
    const cache = this._getOrComputeCache(playerId);
    if (!cache) return false;
    return !!cache.flags[key];
  }

  /**
   * モディファイアキーの種別を判定
   * @param {string} key - モディファイアキー
   * @returns {string} 種別名
   */
  _typeOfKey(key) {
    if (MODIFIER_TYPES.multiplier.has(key)) return 'multiplier';
    if (MODIFIER_TYPES.flat.has(key)) return 'flat';
    if (MODIFIER_TYPES.additive.has(key)) return 'additive';
    if (MODIFIER_TYPES.duration.has(key)) return 'duration';
    if (MODIFIER_TYPES.dot.has(key)) return 'dot';
    if (MODIFIER_TYPES.threshold.has(key)) return 'threshold';
    if (MODIFIER_TYPES.flag.has(key)) return 'flag';
    return 'multiplier';
  }
}
