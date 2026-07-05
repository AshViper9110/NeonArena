class WeaponRegistry {
  constructor() {
    this._list = [];
    this._map = {};
    this._defineAll();
    this._initDetails();
  }

  _add(id, def) {
    def.id = id;
    def.pellets = def.pellets || 1;
    def.explosive = def.explosive || false;
    def.auto = def.auto || def.fireMode === "Auto" || def.fireMode === "Beam";
    def.fireMode = def.fireMode || (def.auto ? "Auto" : "Semi");
    def.weaponType = def.weaponType || "projectile";
    def.projSpeed = def.projSpeed || 50;
    def.projLifetime = def.projLifetime || 1.5;
    def.projRadius = def.projRadius || 0.2;
    def.spread = def.spread || 0;
    def.hitRadius = def.hitRadius || 0.8;
    def.explosionRadius = def.explosionRadius || 0;
    def.range = def.range || 40;
    def.recoil = def.recoil || 0.5;
    def.recoilRecovery = def.recoilRecovery || (def.recoil * 2 || 1);
    def.icon = def.icon || "🔫";
    def.unlockLevel = def.unlockLevel || 1;
    def.name = def.displayName;
    def.maxAmmo = def.magazineSize;
    def.sound = def.sound || id;
    def.difficulty = def.difficulty || 1;
    def.playstyle = def.playstyle || "All-round";
    def.mobility = def.mobility != null ? def.mobility : 3;
    def.headshotMultiplier = def.headshotMultiplier || 2.0;
    def.criticalMultiplier = def.criticalMultiplier || 1.5;
    def.bulletDrop = def.bulletDrop || 0;
    def.penetration = def.penetration || 0;
    def.chargeTime = def.chargeTime || 0;
    def.heatCapacity = def.heatCapacity || 0;
    def.coolingSpeed = def.coolingSpeed || 0;
    /* Multi-language & detail defaults */
    def.displayNameJa = def.displayNameJa || def.displayName;
    def.categoryJa = def.categoryJa || def.category;
    def.descriptionEn = def.descriptionEn || "";
    def.strengths = def.strengths || [];
    def.weaknesses = def.weaknesses || [];
    def.recommendedPassives = def.recommendedPassives || [];
    def.recommendedFor = def.recommendedFor || [];
    this._list.push(id);
    this._map[id] = def;
  }

  _calcStars(wp) {
    const dmg = wp.damage * (wp.pellets || 1);
    const rate = 1 / (wp.fireRate || 0.25);
    const stars = {};
    stars.damage = this._star(dmg, [5, 15, 30, 60, 100]);
    stars.fireRate = this._star(rate, [1, 3, 6, 10, 20]);
    stars.range = this._star(wp.range, [10, 20, 35, 55, 75]);
    stars.accuracy = this._star(1 / (wp.spread + 0.01), [5, 15, 30, 60, 100]);
    stars.mobility = this._star(wp.mobility || 3, [1, 2, 3, 4, 5]);
    stars.reload = this._star(1 / (wp.reloadTime || 3), [0.2, 0.35, 0.5, 0.7, 1.0]);
    stars.magazine = this._star(wp.magazineSize, [2, 8, 20, 40, 80]);
    stars.recoil = this._star(1 / (wp.recoil + 0.1), [0.5, 1, 2, 4, 8]);
    return stars;
  }

  _star(val, thresholds) {
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (val >= thresholds[i]) return i + 1;
    }
    return 1;
  }

  _defineAll() {
    /* ======================== */
    /* PISTOL (6)               */
    /* ======================== */
    this._add("pistol", {
      displayName: "Pistol",
      category: "Pistol",
      description: "標準的なサイドアーム。信頼性が高く、精度も良好。",
      weaponType: "projectile",
      fireMode: "Semi", damage: 20, fireRate: 0.25,
      projSpeed: 50, magazineSize: 12, reloadTime: 1.5,
      spread: 0.02, pellets: 1, projRadius: 0.2, range: 40,
      recoil: 0.5, color: 0xffee00, mobility: 4,
      headshotMultiplier: 2.5, playstyle: "All-round", difficulty: 1,
    });
    this._add("heavy_pistol", {
      displayName: "Heavy Pistol",
      category: "Pistol",
      description: "大口径サイドアーム。高ダメージだが連射は遅い。",
      weaponType: "projectile",
      fireMode: "Semi", damage: 55, fireRate: 0.45,
      projSpeed: 55, magazineSize: 8, reloadTime: 2.0,
      spread: 0.03, pellets: 1, projRadius: 0.25, range: 45,
      recoil: 1.2, color: 0xffaa00, mobility: 3,
      headshotMultiplier: 3.0, playstyle: "Ambush", difficulty: 2,
    });
    this._add("machine_pistol", {
      displayName: "Machine Pistol",
      category: "Pistol",
      description: "フルオート式サイドアーム。高連射、低ダメージ。",
      weaponType: "projectile",
      fireMode: "Auto", damage: 12, fireRate: 0.07,
      projSpeed: 48, magazineSize: 20, reloadTime: 1.8,
      spread: 0.08, pellets: 1, projRadius: 0.15, range: 30,
      recoil: 0.8, color: 0xffaa44, mobility: 4,
      playstyle: "Rush", difficulty: 1,
    });
    this._add("revolver", {
      displayName: "Revolver",
      category: "Pistol",
      description: "6発装填の回転式。遅いがヘッドショットは致命的。",
      weaponType: "projectile",
      fireMode: "Semi", damage: 50, fireRate: 0.7,
      projSpeed: 60, magazineSize: 6, reloadTime: 2.5,
      spread: 0.01, pellets: 1, projRadius: 0.3, range: 50,
      recoil: 1.5, color: 0xff6600, mobility: 3,
      headshotMultiplier: 4.0, playstyle: "Precision", difficulty: 3,
    });
    this._add("burst_pistol", {
      displayName: "Burst Pistol",
      category: "Pistol",
      description: "3点バースト式サイドアーム。制御された連射。",
      weaponType: "projectile",
      fireMode: "Burst", damage: 18, fireRate: 0.3,
      projSpeed: 52, magazineSize: 15, reloadTime: 1.6,
      spread: 0.03, pellets: 1, projRadius: 0.18, range: 42,
      recoil: 0.6, color: 0xeedd00, mobility: 4,
      playstyle: "Mid-range", difficulty: 2,
    });
    this._add("auto_pistol", {
      displayName: "Auto Pistol",
      category: "Pistol",
      description: "セレクトファイア対応の軽量ピストル。汎用性が高い。",
      weaponType: "projectile",
      fireMode: "Auto", damage: 15, fireRate: 0.1,
      projSpeed: 50, magazineSize: 18, reloadTime: 1.7,
      spread: 0.06, pellets: 1, projRadius: 0.16, range: 35,
      recoil: 0.7, color: 0xeedd44, mobility: 4,
      playstyle: "Flexible", difficulty: 1,
    });

    /* ======================== */
    /* SMG (5)                  */
    /* ======================== */
    this._add("smg", {
      displayName: "SMG",
      category: "SMG",
      description: "近距離向け高速連射武器。制圧力に優れる。",
      weaponType: "projectile",
      fireMode: "Auto", damage: 12, fireRate: 0.06,
      projSpeed: 48, magazineSize: 35, reloadTime: 2.2,
      spread: 0.1, pellets: 1, projRadius: 0.1, range: 30,
      recoil: 0.6, color: 0x00ffaa, mobility: 4,
      playstyle: "Rush", difficulty: 1,
    });
    this._add("compact_smg", {
      displayName: "Compact SMG",
      category: "SMG",
      description: "小型軽量のSMG。リロードが速く機動性抜群。",
      weaponType: "projectile",
      fireMode: "Auto", damage: 10, fireRate: 0.05,
      projSpeed: 45, magazineSize: 25, reloadTime: 1.5,
      spread: 0.12, pellets: 1, projRadius: 0.1, range: 25,
      recoil: 0.5, color: 0x00ff88, mobility: 5,
      playstyle: "Speedster", difficulty: 1,
    });
    this._add("vector", {
      displayName: "Vector",
      category: "SMG",
      description: "ハイエンドSMG。驚異的な連射速度を誇る。",
      weaponType: "projectile",
      fireMode: "Auto", damage: 14, fireRate: 0.04,
      projSpeed: 50, magazineSize: 30, reloadTime: 2.0,
      spread: 0.09, pellets: 1, projRadius: 0.1, range: 28,
      recoil: 0.7, color: 0x00ffcc, mobility: 4,
      headshotMultiplier: 2.2, playstyle: "Rush", difficulty: 2,
    });
    this._add("mp7", {
      displayName: "MP7",
      category: "SMG",
      description: "対装甲SMG。やや長めの射程を持つ。",
      weaponType: "projectile",
      fireMode: "Auto", damage: 16, fireRate: 0.07,
      projSpeed: 52, magazineSize: 30, reloadTime: 2.2,
      spread: 0.07, pellets: 1, projRadius: 0.12, range: 35,
      recoil: 0.6, color: 0x22ffaa, mobility: 3,
      penetration: 0.5, playstyle: "Support", difficulty: 2,
    });
    this._add("p90", {
      displayName: "P90",
      category: "SMG",
      description: "大型マガジンのSMG。弾幕による制圧が可能。",
      weaponType: "projectile",
      fireMode: "Auto", damage: 11, fireRate: 0.06,
      projSpeed: 46, magazineSize: 50, reloadTime: 2.5,
      spread: 0.11, pellets: 1, projRadius: 0.1, range: 28,
      recoil: 0.7, color: 0x44ffaa, mobility: 3,
      playstyle: "Suppression", difficulty: 1,
    });

    /* ======================== */
    /* ASSAULT RIFLE (5)        */
    /* ======================== */
    this._add("assault", {
      displayName: "Assault Rifle",
      category: "Assault Rifle",
      description: "万能型アサルトライフル。バランスの取れた性能。",
      weaponType: "projectile",
      fireMode: "Auto", damage: 15, fireRate: 0.08,
      projSpeed: 55, magazineSize: 30, reloadTime: 2.5,
      spread: 0.06, pellets: 1, projRadius: 0.15, range: 45,
      recoil: 0.7, color: 0xff6600, mobility: 3,
      playstyle: "All-round", difficulty: 1,
    });
    this._add("ak_rifle", {
      displayName: "AK Rifle",
      category: "Assault Rifle",
      description: "強力なアサルトライフル。高火力だが反動が大きい。",
      weaponType: "projectile",
      fireMode: "Auto", damage: 20, fireRate: 0.1,
      projSpeed: 55, magazineSize: 30, reloadTime: 2.8,
      spread: 0.08, pellets: 1, projRadius: 0.16, range: 48,
      recoil: 1.0, color: 0xff4400, mobility: 2,
      headshotMultiplier: 2.5, playstyle: "Power", difficulty: 2,
    });
    this._add("carbine", {
      displayName: "Carbine",
      category: "Assault Rifle",
      description: "軽量カービン。取り回しが良く機動戦に向く。",
      weaponType: "projectile",
      fireMode: "Auto", damage: 14, fireRate: 0.07,
      projSpeed: 52, magazineSize: 25, reloadTime: 2.0,
      spread: 0.05, pellets: 1, projRadius: 0.14, range: 40,
      recoil: 0.5, color: 0xff8833, mobility: 4,
      playstyle: "Agile", difficulty: 1,
    });
    this._add("bullpup", {
      displayName: "Bullpup Rifle",
      category: "Assault Rifle",
      description: "ブルパップ式ライフル。高い命中精度を誇る。",
      weaponType: "projectile",
      fireMode: "Auto", damage: 17, fireRate: 0.09,
      projSpeed: 58, magazineSize: 28, reloadTime: 2.6,
      spread: 0.04, pellets: 1, projRadius: 0.15, range: 50,
      recoil: 0.6, color: 0xff7722, mobility: 3,
      playstyle: "Precision", difficulty: 2,
    });
    this._add("battlerifle", {
      displayName: "Battle Rifle",
      category: "Assault Rifle",
      description: "大口径バトルライフル。一発一発が強力で精密。",
      weaponType: "projectile",
      fireMode: "Semi", damage: 28, fireRate: 0.18,
      projSpeed: 65, magazineSize: 20, reloadTime: 2.8,
      spread: 0.02, pellets: 1, projRadius: 0.18, range: 55,
      recoil: 1.0, color: 0xffaa00, mobility: 2,
      headshotMultiplier: 2.8, playstyle: "Marksman", difficulty: 3,
    });

    /* ======================== */
    /* MARKSMAN RIFLE (4)       */
    /* ======================== */
    this._add("marksman", {
      displayName: "Marksman Rifle",
      category: "Marksman Rifle",
      description: "スコープ付きバトルライフル。中～長距離向け。",
      weaponType: "projectile",
      fireMode: "Semi", damage: 32, fireRate: 0.22,
      projSpeed: 70, magazineSize: 15, reloadTime: 3.0,
      spread: 0.01, pellets: 1, projRadius: 0.2, range: 60,
      recoil: 1.2, color: 0xffcc44, mobility: 2,
      headshotMultiplier: 3.0, playstyle: "Precision", difficulty: 3,
    });
    this._add("dmr", {
      displayName: "DMR",
      category: "Marksman Rifle",
      description: "指定射手用ライフル。非常に高い命中精度。",
      weaponType: "projectile",
      fireMode: "Semi", damage: 35, fireRate: 0.35,
      projSpeed: 75, magazineSize: 15, reloadTime: 3.0,
      spread: 0, pellets: 1, projRadius: 0.18, range: 65,
      recoil: 1.0, color: 0x44ffaa, mobility: 2,
      headshotMultiplier: 3.2, playstyle: "Sniper", difficulty: 3,
    });
    this._add("semi_auto_rifle", {
      displayName: "Semi Auto Rifle",
      category: "Marksman Rifle",
      description: "連射可能なセミオート。素早い追撃が可能。",
      weaponType: "projectile",
      fireMode: "Semi", damage: 28, fireRate: 0.2,
      projSpeed: 68, magazineSize: 20, reloadTime: 2.8,
      spread: 0.02, pellets: 1, projRadius: 0.17, range: 55,
      recoil: 0.8, color: 0x66ff88, mobility: 3,
      playstyle: "Aggressive", difficulty: 2,
    });
    this._add("scout_rifle", {
      displayName: "Scout Rifle",
      category: "Marksman Rifle",
      description: "軽量スカウトライフル。機動性が高く扱いやすい。",
      weaponType: "projectile",
      fireMode: "Semi", damage: 24, fireRate: 0.15,
      projSpeed: 65, magazineSize: 12, reloadTime: 2.0,
      spread: 0.015, pellets: 1, projRadius: 0.16, range: 50,
      recoil: 0.7, color: 0x88ff66, mobility: 4,
      playstyle: "Flanker", difficulty: 2,
    });

    /* ======================== */
    /* SNIPER RIFLE (4)         */
    /* ======================== */
    this._add("sniper", {
      displayName: "Sniper Rifle",
      category: "Sniper Rifle",
      description: "ボルトアクション狙撃銃。一撃必殺の可能性。",
      weaponType: "projectile",
      fireMode: "Semi", damage: 100, fireRate: 1.0,
      projSpeed: 350, magazineSize: 5, reloadTime: 3.5,
      spread: 0, pellets: 1, projRadius: 0.3, range: 80,
      recoil: 2.0, hitRadius: 0.9, color: 0x00ffff, mobility: 1,
      headshotMultiplier: 5.0, playstyle: "Sniper", difficulty: 4,
    });
    this._add("heavy_sniper", {
      displayName: "Heavy Sniper",
      category: "Sniper Rifle",
      description: "対物狙撃銃。極めて高いダメージを与える。",
      weaponType: "projectile",
      fireMode: "Semi", damage: 120, fireRate: 1.5,
      projSpeed: 300, magazineSize: 3, reloadTime: 4.0,
      spread: 0, pellets: 1, projRadius: 0.35, range: 90,
      recoil: 2.5, hitRadius: 1.0, color: 0x00ddff, mobility: 1,
      headshotMultiplier: 5.0, penetration: 2, playstyle: "Anti-material", difficulty: 5,
    });
    this._add("rail_sniper", {
      displayName: "Rail Sniper",
      category: "Sniper Rifle",
      description: "レールガン搭載。瞬間速度で標的を貫く。",
      weaponType: "projectile",
      fireMode: "Semi", damage: 80, fireRate: 1.2,
      projSpeed: 600, magazineSize: 4, reloadTime: 3.8,
      spread: 0, pellets: 1, projRadius: 0.25, range: 85,
      recoil: 2.0, hitRadius: 0.8, color: 0x44ddff, mobility: 1,
      penetration: 3, playstyle: "Precision", difficulty: 4,
    });
    this._add("anti_material_rifle", {
      displayName: "Anti-Material Rifle",
      category: "Sniper Rifle",
      description: "爆発性弾薬を使用。車両にも有効な対物兵器。",
      weaponType: "explosive",
      fireMode: "Semi", damage: 90, fireRate: 1.8,
      projSpeed: 200, magazineSize: 2, reloadTime: 5.0,
      spread: 0, pellets: 1, projRadius: 0.4, range: 95,
      recoil: 3.0, hitRadius: 1.5, color: 0x00aaff, mobility: 1,
      explosive: true, explosionRadius: 1.5, penetration: 4,
      playstyle: "Anti-material", difficulty: 5,
    });

    /* ======================== */
    /* SHOTGUN (5)              */
    /* ======================== */
    this._add("shotgun", {
      displayName: "Shotgun",
      category: "Shotgun",
      description: "クラシックなポンプアクション。近距離で絶大。",
      weaponType: "projectile",
      fireMode: "Shotgun", damage: 5, fireRate: 0.6,
      projSpeed: 50, magazineSize: 8, reloadTime: 2.5,
      spread: 0.18, pellets: 8, projRadius: 0.12, range: 15,
      recoil: 1.2, hitRadius: 0.3, color: 0xff6600, mobility: 2,
      playstyle: "Ambush", difficulty: 2,
    });
    this._add("auto_shotgun", {
      displayName: "Auto Shotgun",
      category: "Shotgun",
      description: "フルオート式ショットガン。高速で弾幕を張る。",
      weaponType: "projectile",
      fireMode: "Auto", damage: 4, fireRate: 0.25,
      projSpeed: 48, magazineSize: 12, reloadTime: 3.0,
      spread: 0.2, pellets: 8, projRadius: 0.1, range: 15,
      recoil: 1.0, hitRadius: 0.25, color: 0xff8844, mobility: 2,
      playstyle: "Rush", difficulty: 2,
    });
    this._add("double_barrel", {
      displayName: "Double Barrel",
      category: "Shotgun",
      description: "2連装ショットガン。圧倒的な瞬間火力。",
      weaponType: "projectile",
      fireMode: "Shotgun", damage: 8, fireRate: 0.9,
      projSpeed: 50, magazineSize: 2, reloadTime: 2.0,
      spread: 0.22, pellets: 32, projRadius: 0.12, range: 15,
      recoil: 2.0, hitRadius: 0.25, color: 0xff4400, mobility: 2,
      playstyle: "Ambush", difficulty: 3,
    });
    this._add("combat_shotgun", {
      displayName: "Combat Shotgun",
      category: "Shotgun",
      description: "軍用ショットガン。バランスの取れた信頼性。",
      weaponType: "projectile",
      fireMode: "Shotgun", damage: 6, fireRate: 0.5,
      projSpeed: 52, magazineSize: 10, reloadTime: 2.8,
      spread: 0.16, pellets: 16, projRadius: 0.14,       range: 16,
      recoil: 1.0, hitRadius: 0.3, color: 0xff8833, mobility: 2,
      playstyle: "All-round", difficulty: 2,
    });
    this._add("slug_shotgun", {
      displayName: "Slug Shotgun",
      category: "Shotgun",
      description: "スラグ弾使用。長距離でも精度を発揮する。",
      weaponType: "projectile",
      fireMode: "Semi", damage: 40, fireRate: 0.6,
      projSpeed: 60, magazineSize: 8, reloadTime: 2.5,
      spread: 0.01, pellets: 1, projRadius: 0.2, range: 25,
      recoil: 1.5, hitRadius: 0.4, color: 0xffaa33, mobility: 2,
      headshotMultiplier: 3.0, playstyle: "Precision", difficulty: 3,
    });

    /* ======================== */
    /* LMG (4)                  */
    /* ======================== */
    this._add("lmg", {
      displayName: "LMG",
      category: "LMG",
      description: "軽機関銃。制圧射撃によるエリアコントロール。",
      weaponType: "projectile",
      fireMode: "Auto", damage: 14, fireRate: 0.07,
      projSpeed: 50, magazineSize: 80, reloadTime: 5.0,
      spread: 0.12, pellets: 1, projRadius: 0.14, range: 40,
      recoil: 0.8, color: 0xff4444, mobility: 1,
      playstyle: "Suppression", difficulty: 2,
    });
    this._add("heavy_lmg", {
      displayName: "Heavy LMG",
      category: "LMG",
      description: "重機関銃。一発の威力が高く対物にも有効。",
      weaponType: "projectile",
      fireMode: "Auto", damage: 18, fireRate: 0.1,
      projSpeed: 52, magazineSize: 100, reloadTime: 6.5,
      spread: 0.14, pellets: 1, projRadius: 0.16, range: 45,
      recoil: 1.2, color: 0xff2222, mobility: 1,
      penetration: 1, playstyle: "Defense", difficulty: 3,
    });
    this._add("mobile_lmg", {
      displayName: "Mobile LMG",
      category: "LMG",
      description: "携行型LMG。機動性を重視した設計。",
      weaponType: "projectile",
      fireMode: "Auto", damage: 12, fireRate: 0.06,
      projSpeed: 48, magazineSize: 60, reloadTime: 4.0,
      spread: 0.13, pellets: 1, projRadius: 0.13, range: 35,
      recoil: 0.9, color: 0xff6644, mobility: 2,
      playstyle: "Aggressive", difficulty: 2,
    });
    this._add("minigun", {
      displayName: "Minigun",
      category: "LMG",
      description: "回転式機関砲。圧倒的な連射速度を誇る。",
      weaponType: "projectile",
      fireMode: "Auto", damage: 3, fireRate: 0.06,
      projSpeed: 55, magazineSize: 120, reloadTime: 8.0,
      spread: 0.15, pellets: 1, projRadius: 0.12, range: 35,
      recoil: 1.2, color: 0xff2222, mobility: 1,
      playstyle: "Suppression", difficulty: 3,
    });

    /* ======================== */
    /* BEAM (4)                 */
    /* ======================== */
    this._add("plasma_rifle", {
      displayName: "Plasma Rifle",
      category: "Beam",
      description: "高速連射のプラズマビーム兵器。",
      weaponType: "beam",
      fireMode: "Auto", damage: 14, fireRate: 0.5,
      magazineSize: 40, reloadTime: 2.5, spread: 0,
      range: 50, recoil: 0.3, hitRadius: 0.8,
      color: 0x00ffcc, mobility: 3,
      heatCapacity: 40, coolingSpeed: 15,
      playstyle: "Assault", difficulty: 2,
    });
    this._add("laser_rifle", {
      displayName: "Laser Rifle",
      category: "Beam",
      description: "精密レーザー。瞬間照射で高精度攻撃。",
      weaponType: "beam",
      fireMode: "Semi", damage: 40, fireRate: 0.5,
      magazineSize: 10, reloadTime: 2.0, spread: 0,
      range: 80, recoil: 0.2, hitRadius: 0.5,
      color: 0x88ddff, mobility: 3,
      heatCapacity: 20, coolingSpeed: 8,
      headshotMultiplier: 3.0, playstyle: "Sniper", difficulty: 3,
    });
    this._add("beam_cannon", {
      displayName: "Beam Cannon",
      category: "Beam",
      description: "重ビームキャノン。継続的な破壊力。",
      weaponType: "beam",
      fireMode: "Auto", damage: 25, fireRate: 0.8,
      magazineSize: 20, reloadTime: 3.5, spread: 0.02,
      range: 60, recoil: 0.8, hitRadius: 1.0,
      color: 0x00aaff, mobility: 1,
      heatCapacity: 60, coolingSpeed: 10,
      playstyle: "Defense", difficulty: 3,
    });
    this._add("continuous_beam", {
      displayName: "Continuous Beam",
      category: "Beam",
      description: "持続照射ビーム。照射時間に応じてダメージ上昇。",
      weaponType: "beam",
      fireMode: "Auto", damage: 8, fireRate: 0.1,
      magazineSize: 100, reloadTime: 4.0, spread: 0.01,
      range: 45, recoil: 0.1, hitRadius: 0.6,
      color: 0x44aaff, mobility: 2,
      heatCapacity: 80, coolingSpeed: 5,
      playstyle: "Suppression", difficulty: 2,
    });

    /* ======================== */
    /* ENERGY (4)               */
    /* ======================== */
    this._add("plasma_smg", {
      displayName: "Plasma SMG",
      category: "Energy",
      description: "高速プラズマ弾を連射。リロード不要のエネルギー兵器。",
      weaponType: "energy",
      fireMode: "Auto", damage: 13, fireRate: 0.05,
      projSpeed: 55, magazineSize: 30, reloadTime: 0,
      spread: 0.07, pellets: 1, projRadius: 0.15, range: 30,
      recoil: 0.4, color: 0xcc44ff, mobility: 4,
      heatCapacity: 35, coolingSpeed: 20,
      playstyle: "Rush", difficulty: 2,
    });
    this._add("ion_rifle", {
      displayName: "Ion Rifle",
      category: "Energy",
      description: "イオン弾を発射。遅いが確実なダメージ。",
      weaponType: "energy",
      fireMode: "Semi", damage: 45, fireRate: 0.5,
      projSpeed: 65, magazineSize: 15, reloadTime: 0,
      spread: 0.01, pellets: 1, projRadius: 0.25, range: 55,
      recoil: 0.6, color: 0xaa44ff, mobility: 3,
      heatCapacity: 25, coolingSpeed: 10,
      penetration: 1, playstyle: "Precision", difficulty: 3,
    });
    this._add("arc_rifle", {
      displayName: "Arc Rifle",
      category: "Energy",
      description: "電撃アークを放つ。近くの敵に連鎖する。",
      weaponType: "energy",
      fireMode: "Semi", damage: 22, fireRate: 0.35,
      projSpeed: 80, magazineSize: 20, reloadTime: 0,
      spread: 0, pellets: 1, projRadius: 0.2, range: 40,
      recoil: 0.5, color: 0x8844ff, mobility: 3,
      heatCapacity: 30, coolingSpeed: 12,
      playstyle: "Tactical", difficulty: 3,
    });
    this._add("pulse_carbine", {
      displayName: "Pulse Carbine",
      category: "Energy",
      description: "パルスバースト式。高い命中精度と連射性能。",
      weaponType: "energy",
      fireMode: "Burst", damage: 16, fireRate: 0.2,
      projSpeed: 60, magazineSize: 25, reloadTime: 0,
      spread: 0.03, pellets: 1, projRadius: 0.16, range: 45,
      recoil: 0.3, color: 0xbb44ff, mobility: 3,
      heatCapacity: 40, coolingSpeed: 18,
      playstyle: "All-round", difficulty: 2,
    });

    /* ======================== */
    /* EXPLOSIVE (5)            */
    /* ======================== */
    this._add("rpg", {
      displayName: "Rocket Launcher",
      category: "Explosive",
      description: "ロケット弾を発射。範囲攻撃で複数の敵を攻撃。",
      weaponType: "explosive",
      fireMode: "Launcher", damage: 60, fireRate: 1.2,
      projSpeed: 18, magazineSize: 1, reloadTime: 3.5,
      spread: 0, pellets: 1, projRadius: 0.4, range: 60,
      recoil: 1.5, hitRadius: 2.5, color: 0xff2200, mobility: 1,
      explosive: true, explosionRadius: 2.5, projLifetime: 3.0,
      playstyle: "Ambush", difficulty: 3,
    });
    this._add("grenade_launcher", {
      displayName: "Grenade Launcher",
      category: "Explosive",
      description: "グレネードを曲射。跳ねる爆発物で撹乱。",
      weaponType: "explosive",
      fireMode: "Launcher", damage: 80, fireRate: 0.9,
      projSpeed: 22, magazineSize: 4, reloadTime: 3.0,
      spread: 0.04, pellets: 1, projRadius: 0.35, range: 50,
      recoil: 1.2, hitRadius: 3.0, color: 0xff8800, mobility: 1,
      explosive: true, explosionRadius: 3.0, projLifetime: 2.5,
      bulletDrop: 0.5, playstyle: "Trajectory", difficulty: 4,
    });
    this._add("quad_rocket", {
      displayName: "Quad Rocket",
      category: "Explosive",
      description: "4連装ロケット。高速連続発射で圧倒する。",
      weaponType: "explosive",
      fireMode: "Launcher", damage: 55, fireRate: 0.15,
      projSpeed: 20, magazineSize: 4, reloadTime: 4.0,
      spread: 0.06, pellets: 1, projRadius: 0.35, range: 55,
      recoil: 1.0, hitRadius: 2.0, color: 0xff4400, mobility: 1,
      explosive: true, explosionRadius: 2.0, projLifetime: 2.8,
      playstyle: "Burst", difficulty: 3,
    });
    this._add("sticky_launcher", {
      displayName: "Sticky Launcher",
      category: "Explosive",
      description: "粘着爆弾を発射。遠隔起爆で待ち伏せ可能。",
      weaponType: "explosive",
      fireMode: "Launcher", damage: 70, fireRate: 0.7,
      projSpeed: 25, magazineSize: 3, reloadTime: 2.5,
      spread: 0.02, pellets: 1, projRadius: 0.3, range: 40,
      recoil: 0.8, hitRadius: 2.5, color: 0xffaa00, mobility: 2,
      explosive: true, explosionRadius: 2.8, projLifetime: 5.0,
      playstyle: "Trap", difficulty: 4,
    });
    this._add("cluster_launcher", {
      displayName: "Cluster Launcher",
      category: "Explosive",
      description: "クラスター爆弾。子弾に分裂し広範囲をカバー。",
      weaponType: "explosive",
      fireMode: "Launcher", damage: 40, fireRate: 1.0,
      projSpeed: 20, magazineSize: 3, reloadTime: 3.8,
      spread: 0.05, pellets: 1, projRadius: 0.3, range: 50,
      recoil: 1.2, hitRadius: 3.0, color: 0xff6600, mobility: 1,
      explosive: true, explosionRadius: 1.5, projLifetime: 2.5,
      playstyle: "Area denial", difficulty: 4,
    });

    /* ======================== */
    /* EXPERIMENTAL (1)         */
    /* ======================== */
    this._add("black_hole_launcher", {
      displayName: "Black Hole Launcher",
      category: "Experimental",
      description: "重力井戸を生成。周囲の敵を引き寄せる。",
      weaponType: "special",
      fireMode: "Launcher", damage: 5, fireRate: 2.0,
      projSpeed: 15, magazineSize: 1, reloadTime: 5.0,
      spread: 0, pellets: 1, projRadius: 0.5, range: 40,
      recoil: 0.5, color: 0x2200aa, mobility: 1,
      projLifetime: 1.5, playstyle: "Zone control", difficulty: 5,
    });

    /* ======================== */
    /* DRONE (1)                */
    /* ======================== */
    this._add("missile_drone", {
      displayName: "Missile Drone",
      category: "Drone",
      description: "追尾ミサイルを発射するドローンを展開。",
      weaponType: "summon",
      fireMode: "Semi", damage: 20, fireRate: 0.8,
      magazineSize: 1, reloadTime: 5.0, spread: 0,
      range: 40, recoil: 0, color: 0xff4444, mobility: 2,
      projLifetime: 10.0, playstyle: "Fire support", difficulty: 4,
    });

    /* ======================== */
    /* Compute stars for all    */
    /* ======================== */
    for (const id of this._list) {
      const wp = this._map[id];
      wp.stars = this._calcStars(wp);
    }
  }

  /* Add Japanese & detail data to all weapons */
  _initDetails() {
    const d = this._map;
    // Pistol (6)
    d.pistol.displayNameJa = "ハンドガン"; d.pistol.categoryJa = "ピストル";
    d.pistol.descriptionEn = "A reliable sidearm. Balanced for all situations.";
    d.pistol.strengths = ["機動力が高い", "反動が小さい", "リロードが速い"];
    d.pistol.weaknesses = ["火力が低い", "遠距離不向き"];
    d.pistol.recommendedPassives = ["runner", "quickReload", "steadyAim"];
    d.pistol.recommendedFor = ["初心者", "機動戦", "バランス型"];

    d.heavy_pistol.displayNameJa = "ヘビーピストル"; d.heavy_pistol.categoryJa = "ピストル";
    d.heavy_pistol.descriptionEn = "High-caliber sidearm. Devastating but slow.";
    d.heavy_pistol.strengths = ["高火力", "ヘッドショット倍率が高い"];
    d.heavy_pistol.weaknesses = ["連射が遅い", "マガジンが小さい", "反動が大きい"];
    d.heavy_pistol.recommendedPassives = ["heavyHands", "steadyAim", "extraMagazine"];
    d.heavy_pistol.recommendedFor = ["中級者以上", "精密射撃", "待ち伏せ"];

    d.machine_pistol.displayNameJa = "マシンピストル"; d.machine_pistol.categoryJa = "ピストル";
    d.machine_pistol.descriptionEn = "Full-auto sidearm. High fire rate, low damage.";
    d.machine_pistol.strengths = ["連射速度が高い", "機動戦に強い"];
    d.machine_pistol.weaknesses = ["弾の消費が激しい", "命中精度が低い"];
    d.machine_pistol.recommendedPassives = ["rapidFire", "extraMagazine", "luckyShot"];
    d.machine_pistol.recommendedFor = ["突撃型", "弾幕を張りたい人"];

    d.revolver.displayNameJa = "リボルバー"; d.revolver.categoryJa = "ピストル";
    d.revolver.descriptionEn = "Six-shooter revolver. Slow but lethal headshots.";
    d.revolver.strengths = ["最高クラスのヘッドショット倍率", "精度が高い"];
    d.revolver.weaknesses = ["装弾数が少ない", "リロードが遅い", "連射不可"];
    d.revolver.recommendedPassives = ["deadeye", "sharpshooter", "heavyHands"];
    d.revolver.recommendedFor = ["エイムに自信がある人", "一発逆転狙い"];

    d.burst_pistol.displayNameJa = "バーストピストル"; d.burst_pistol.categoryJa = "ピストル";
    d.burst_pistol.descriptionEn = "3-round burst sidearm. Controlled fire.";
    d.burst_pistol.strengths = ["制御された連射", "命中精度が良い"];
    d.burst_pistol.weaknesses = ["フルオート不可", "バーストに慣れが必要"];
    d.burst_pistol.recommendedPassives = ["steadyAim", "sharpshooter", "rapidFire"];
    d.burst_pistol.recommendedFor = ["中距離戦", "バースト好き"];

    d.auto_pistol.displayNameJa = "オートピストル"; d.auto_pistol.categoryJa = "ピストル";
    d.auto_pistol.descriptionEn = "Select-fire lightweight pistol. Versatile.";
    d.auto_pistol.strengths = "高い汎用性,機動力とのバランス".split(",");
    d.auto_pistol.weaknesses = ["突出した性能がない"];
    d.auto_pistol.recommendedPassives = ["runner", "quickReload"];
    d.auto_pistol.recommendedFor = ["オールラウンダー", "入門用"];

    // SMG (5)
    d.smg.displayNameJa = "SMG"; d.smg.categoryJa = "サブマシンガン";
    d.smg.descriptionEn = "Close-range full-auto. Great suppression.";
    d.smg.strengths = ["連射速度が高い", "近距離制圧力"];
    d.smg.weaknesses = ["遠距離火力不足", "弾切れが早い"];
    d.smg.recommendedPassives = ["rapidFire", "extraMagazine", "luckyShot"];
    d.smg.recommendedFor = ["突撃型", "近距離戦"];

    d.compact_smg.displayNameJa = "コンパクトSMG"; d.compact_smg.categoryJa = "サブマシンガン";
    d.compact_smg.descriptionEn = "Lightweight SMG. Fast reload, great mobility.";
    d.compact_smg.strengths = ["最高クラスの機動力", "リロードが速い"];
    d.compact_smg.weaknesses = ["火力が低い", "射程が短い"];
    d.compact_smg.recommendedPassives = ["sprinter", "runner", "quickReload"];
    d.compact_smg.recommendedFor = ["スピード重視", "遊撃型"];

    d.vector.displayNameJa = "ベクター"; d.vector.categoryJa = "サブマシンガン";
    d.vector.descriptionEn = "High-end SMG. Insane fire rate.";
    d.vector.strengths = ["驚異的な連射速度", "近距離での瞬間火力"];
    d.vector.weaknesses = ["弾消費が激しい", "反動制御が難しい"];
    d.vector.recommendedPassives = ["triggerHappy", "extraMagazine", "steadyAim"];
    d.vector.recommendedFor = ["上級者", "近距離特化"];

    d.mp7.displayNameJa = "MP7"; d.mp7.categoryJa = "サブマシンガン";
    d.mp7.descriptionEn = "Anti-armor SMG. Longer effective range.";
    d.mp7.strengths = ["やや長い射程", "軽装甲貫通"];
    d.mp7.weaknesses = ["火力がやや低い"];
    d.mp7.recommendedPassives = ["armorPiercing", "heavyBarrel", "sharpshooter"];
    d.mp7.recommendedFor = ["サポート役", "中~近距離"];

    d.p90.displayNameJa = "P90"; d.p90.categoryJa = "サブマシンガン";
    d.p90.descriptionEn = "Large-mag SMG. Suppressive fire specialist.";
    d.p90.strengths = "大型マガジン,持続火力".split(",");
    d.p90.weaknesses = ["リロードが遅い", "命中精度が低い"];
    d.p90.recommendedPassives = ["extraMagazine", "efficient", "steadyAim"];
    d.p90.recommendedFor = ["制圧射撃", "弾幕重視"];

    // Assault Rifle (5)
    d.assault.displayNameJa = "アサルトライフル"; d.assault.categoryJa = "アサルトライフル";
    d.assault.descriptionEn = "All-purpose rifle. Balanced stats.";
    d.assault.strengths = ["バランスが良い", "あらゆる距離に対応"];
    d.assault.weaknesses = "突出した性能がない".split(",");
    d.assault.recommendedPassives = ["heavyHands", "steadyAim", "quickReload"];
    d.assault.recommendedFor = ["初心者～上級者", "万能型"];

    d.ak_rifle.displayNameJa = "AKライフル"; d.ak_rifle.categoryJa = "アサルトライフル";
    d.ak_rifle.descriptionEn = "Powerful rifle. High damage, high recoil.";
    d.ak_rifle.strengths = ["高い火力", "貫通力"];
    d.ak_rifle.weaknesses = ["反動が大きい", "命中精度が低い"];
    d.ak_rifle.recommendedPassives = ["heavyHands", "steadyAim", "heavyBarrel"];
    d.ak_rifle.recommendedFor = ["パワー重視", "中級者以上"];

    d.carbine.displayNameJa = "カービン"; d.carbine.categoryJa = "アサルトライフル";
    d.carbine.descriptionEn = "Light carbine. Agile and easy to handle.";
    d.carbine.strengths = ["軽量で扱いやすい", "反動が小さい"];
    d.carbine.weaknesses = ["火力が控えめ"];
    d.carbine.recommendedPassives = ["runner", "quickReload", "sharpshooter"];
    d.carbine.recommendedFor = ["機動戦", "初心者"];

    d.bullpup.displayNameJa = "ブルパップライフル"; d.bullpup.categoryJa = "アサルトライフル";
    d.bullpup.descriptionEn = "Bullpup design. High accuracy.";
    d.bullpup.strengths = "高い命中精度,長射程".split(",");
    d.bullpup.weaknesses = ["リロードがやや遅い"];
    d.bullpup.recommendedPassives = ["sharpshooter", "heavyBarrel", "deadeye"];
    d.bullpup.recommendedFor = ["精密射撃", "中～長距離"];

    d.battlerifle.displayNameJa = "バトルライフル"; d.battlerifle.categoryJa = "アサルトライフル";
    d.battlerifle.descriptionEn = "Large-caliber battle rifle. Powerful and precise.";
    d.battlerifle.strengths = ["大口径の高火力", "高い命中精度"];
    d.battlerifle.weaknesses = ["連射が遅い", "反動が強い"];
    d.battlerifle.recommendedPassives = ["heavyHands", "steadyAim", "hollowPoint"];
    d.battlerifle.recommendedFor = ["精密射撃", "中級者～上級者"];

    // Marksman Rifle (4)
    d.marksman.displayNameJa = "マークスマンライフル"; d.marksman.categoryJa = "マークスマンライフル";
    d.marksman.descriptionEn = "Scoped battle rifle. Mid-to-long range.";
    d.marksman.strengths = ["高精度", "長射程"];
    d.marksman.weaknesses = ["連射が遅い", "機動性が低い"];
    d.marksman.recommendedPassives = ["deadeye", "sharpshooter", "heavyBarrel"];
    d.marksman.recommendedFor = ["中～長距離戦", "精密射撃"];

    d.dmr.displayNameJa = "DMR"; d.dmr.categoryJa = "マークスマンライフル";
    d.dmr.descriptionEn = "Designated marksman rifle. Exceptional accuracy.";
    d.dmr.strengths = ["最高クラスの命中精度", "長射程"];
    d.dmr.weaknesses = ["連射速度が低い", "取り回しが重い"];
    d.dmr.recommendedPassives = ["sharpshooter", "hollowPoint", "heavyHands"];
    d.dmr.recommendedFor = ["スナイパー志向", "精密射撃の極意"];

    d.semi_auto_rifle.displayNameJa = "セミオートライフル"; d.semi_auto_rifle.categoryJa = "マークスマンライフル";
    d.semi_auto_rifle.descriptionEn = "Semi-auto marksman rifle. Quick follow-up shots.";
    d.semi_auto_rifle.strengths = ["素早い連射が可能", "バランスが良い"];
    d.semi_auto_rifle.weaknesses = ["一発の火力は控えめ"];
    d.semi_auto_rifle.recommendedPassives = ["rapidFire", "sharpshooter", "steadyAim"];
    d.semi_auto_rifle.recommendedFor = ["積極的な射撃", "追撃型"];

    d.scout_rifle.displayNameJa = "スカウトライフル"; d.scout_rifle.categoryJa = "マークスマンライフル";
    d.scout_rifle.descriptionEn = "Light scout rifle. Mobile and easy to use.";
    d.scout_rifle.strengths = ["機動力が高い", "扱いやすい"];
    d.scout_rifle.weaknesses = ["火力がやや低い"];
    d.scout_rifle.recommendedPassives = ["runner", "quickReload", "steadyAim"];
    d.scout_rifle.recommendedFor = ["遊撃型", "フランカー"];

    // Sniper Rifle (4)
    d.sniper.displayNameJa = "スナイパーライフル"; d.sniper.categoryJa = "スナイパーライフル";
    d.sniper.descriptionEn = "Bolt-action sniper. One-shot potential.";
    d.sniper.strengths = ["超長射程", "一撃必殺の可能性", "ヘッドショット倍率が高い"];
    d.sniper.weaknesses = ["連射が非常に遅い", "接近戦に弱い", "機動性が低い"];
    d.sniper.recommendedPassives = ["deadeye", "hollowPoint", "sharpshooter"];
    d.sniper.recommendedFor = ["スナイパー", "待ち伏せ", "上級者"];

    d.heavy_sniper.displayNameJa = "ヘビースナイパー"; d.heavy_sniper.categoryJa = "スナイパーライフル";
    d.heavy_sniper.descriptionEn = "Anti-material sniper. Extreme damage.";
    d.heavy_sniper.strengths = ["最強クラスの火力", "対物能力"];
    d.heavy_sniper.weaknesses = ["装弾数が極小", "リロードが非常に遅い"];
    d.heavy_sniper.recommendedPassives = ["heavyHands", "extraMagazine", "deadeye"];
    d.heavy_sniper.recommendedFor = ["超火力志向", "上級者"];

    d.rail_sniper.displayNameJa = "レールスナイパー"; d.rail_sniper.categoryJa = "スナイパーライフル";
    d.rail_sniper.descriptionEn = "Railgun sniper. Instant velocity penetration.";
    d.rail_sniper.strengths = ["瞬間速度", "貫通力が高い"];
    d.rail_sniper.weaknesses = ["取り回しが重い", "接近戦に弱い"];
    d.rail_sniper.recommendedPassives = ["armorPiercing", "piercingRounds", "heavyBarrel"];
    d.rail_sniper.recommendedFor = ["貫通狙い", "上級者"];

    d.anti_material_rifle.displayNameJa = "対物ライフル"; d.anti_material_rifle.categoryJa = "スナイパーライフル";
    d.anti_material_rifle.descriptionEn = "Explosive ammo sniper. Anti-vehicle grade.";
    d.anti_material_rifle.strengths = ["爆発性弾薬", "範囲攻撃可能"];
    d.anti_material_rifle.weaknesses = ["装弾数2発", "リロードが極めて遅い"];
    d.anti_material_rifle.recommendedPassives = ["explosiveAmmo", "heavyHands", "efficient"];
    d.anti_material_rifle.recommendedFor = "対物・範囲攻撃,超上級者".split(",");

    // Shotgun (5)
    d.shotgun.displayNameJa = "ショットガン"; d.shotgun.categoryJa = "ショットガン";
    d.shotgun.descriptionEn = "Classic pump-action. Devastating up close.";
    d.shotgun.strengths = ["近距離での絶大な火力", "8ペレット同時発射"];
    d.shotgun.weaknesses = ["射程が極端に短い", "リロードが遅い"];
    d.shotgun.recommendedPassives = ["giantBullets", "heavyHands", "quickReload"];
    d.shotgun.recommendedFor = ["近距離特化", "待ち伏せ"];

    d.auto_shotgun.displayNameJa = "オートショットガン"; d.auto_shotgun.categoryJa = "ショットガン";
    d.auto_shotgun.descriptionEn = "Full-auto shotgun. Rapid pellet spam.";
    d.auto_shotgun.strengths = ["フルオート連射", "制圧力が高い"];
    d.auto_shotgun.weaknesses = ["弾消費が激しい", "精度が低い"];
    d.auto_shotgun.recommendedPassives = ["triggerHappy", "extraMagazine", "giantBullets"];
    d.auto_shotgun.recommendedFor = ["突撃型", "制圧射撃"];

    d.double_barrel.displayNameJa = "ダブルバレル"; d.double_barrel.categoryJa = "ショットガン";
    d.double_barrel.descriptionEn = "Double-barrel shotgun. Unmatched burst.";
    d.double_barrel.strengths = ["瞬間火力が全武器トップクラス"];
    d.double_barrel.weaknesses = ["装弾数2発", "リロードが頻繁に必要"];
    d.double_barrel.recommendedPassives = ["heavyHands", "quickReload", "giantBullets"];
    d.double_barrel.recommendedFor = ["一撃離脱", "待ち伏せ"];

    d.combat_shotgun.displayNameJa = "コンバットショットガン"; d.combat_shotgun.categoryJa = "ショットガン";
    d.combat_shotgun.descriptionEn = "Military shotgun. Balanced and reliable.";
    d.combat_shotgun.strengths = ["バランスが良い", "16ペレット"];
    d.combat_shotgun.weaknesses = ["突出した性能がない"];
    d.combat_shotgun.recommendedPassives = ["heavyHands", "sharpshooter", "quickReload"];
    d.combat_shotgun.recommendedFor = ["ショットガン入門", "オールラウンド"];

    d.slug_shotgun.displayNameJa = "スラグショットガン"; d.slug_shotgun.categoryJa = "ショットガン";
    d.slug_shotgun.descriptionEn = "Slug rounds. Accurate at longer ranges.";
    d.slug_shotgun.strengths = ["スラグ弾による高精度", "中距離でも戦える"];
    d.slug_shotgun.weaknesses = ["散弾ではないため範囲が狭い"];
    d.slug_shotgun.recommendedPassives = ["sharpshooter", "deadeye", "heavyHands"];
    d.slug_shotgun.recommendedFor = ["精密射撃", "中距離ショットガン"];

    // LMG (4)
    d.lmg.displayNameJa = "軽機関銃"; d.lmg.categoryJa = "LMG";
    d.lmg.descriptionEn = "Light machine gun. Area suppression.";
    d.lmg.strengths = "80発マガジン,持続火力,制圧力".split(",");
    d.lmg.weaknesses = ["リロードが遅い", "機動性が低い"];
    d.lmg.recommendedPassives = ["extraMagazine", "efficient", "steadyAim"];
    d.lmg.recommendedFor = ["制圧射撃", "拠点防衛"];

    d.heavy_lmg.displayNameJa = "重機関銃"; d.heavy_lmg.categoryJa = "LMG";
    d.heavy_lmg.descriptionEn = "Heavy MG. High damage per round, anti-material.";
    d.heavy_lmg.strengths = ["100発マガジン", "高火力", "貫通力"];
    d.heavy_lmg.weaknesses = ["機動性が極めて低い", "リロードが非常に遅い"];
    d.heavy_lmg.recommendedPassives = ["heavyHands", "armorPiercing", "efficient"];
    d.heavy_lmg.recommendedFor = ["拠点防衛", "火力重視"];

    d.mobile_lmg.displayNameJa = "モバイルLMG"; d.mobile_lmg.categoryJa = "LMG";
    d.mobile_lmg.descriptionEn = "Portable LMG. Mobility-focused design.";
    d.mobile_lmg.strengths = ["LMGとしては機動性が高い"];
    d.mobile_lmg.weaknesses = ["火力がやや控えめ"];
    d.mobile_lmg.recommendedPassives = ["runner", "extraMagazine", "rapidFire"];
    d.mobile_lmg.recommendedFor = ["機動戦", "積極的な制圧"];

    d.minigun.displayNameJa = "ミニガン"; d.minigun.categoryJa = "LMG";
    d.minigun.descriptionEn = "Rotary cannon. Overwhelming fire rate.";
    d.minigun.strengths = ["120発マガジン", "圧倒的な連射速度"];
    d.minigun.weaknesses = ["リロードが極めて遅い", "精度が低い", "機動性最低"];
    d.minigun.recommendedPassives = ["rapidFire", "triggerHappy", "extraMagazine"];
    d.minigun.recommendedFor = ["制圧射撃マニア", "防衛型"];

    // Beam (4)
    d.plasma_rifle.displayNameJa = "プラズマライフル"; d.plasma_rifle.categoryJa = "ビーム";
    d.plasma_rifle.descriptionEn = "Rapid-fire plasma beam weapon.";
    d.plasma_rifle.strengths = ["ビームの持続ダメージ", "命中精度が高い"];
    d.plasma_rifle.weaknesses = ["オーバーヒート管理が必要", "弾消費"];
    d.plasma_rifle.recommendedPassives = ["beamOvercharge", "coolingSystem", "wideBeam"];
    d.plasma_rifle.recommendedFor = ["ビーム入門", "継続火力"];

    d.laser_rifle.displayNameJa = "レーザーライフル"; d.laser_rifle.categoryJa = "ビーム";
    d.laser_rifle.descriptionEn = "Precision laser. High-damage semi-auto beam.";
    d.laser_rifle.strengths = ["精密照射", "高ヘッドショット倍率"];
    d.laser_rifle.weaknesses = ["連射が遅い", "オーバーヒートしやすい"];
    d.laser_rifle.recommendedPassives = ["beamOvercharge", "longBeam", "deadeye"];
    d.laser_rifle.recommendedFor = ["精密射撃", "スナイパーライク"];

    d.beam_cannon.displayNameJa = "ビームキャノン"; d.beam_cannon.categoryJa = "ビーム";
    d.beam_cannon.descriptionEn = "Heavy beam cannon. Sustained destruction.";
    d.beam_cannon.strengths = ["高ダメージビーム", "広い命中判定"];
    d.beam_cannon.weaknesses = ["機動性が低い", "オーバーヒートしやすい"];
    d.beam_cannon.recommendedPassives = ["wideBeam", "beamOvercharge", "longBeam"];
    d.beam_cannon.recommendedFor = ["防衛型", "重火力志向"];

    d.continuous_beam.displayNameJa = "コンティニアスビーム"; d.continuous_beam.categoryJa = "ビーム";
    d.continuous_beam.descriptionEn = "Sustained beam. Damage ramps up over time.";
    d.continuous_beam.strengths = ["持続照射で火力上昇", "制圧力が高い"];
    d.continuous_beam.weaknesses = ["オーバーヒート管理が重要", "機動性が低い"];
    d.continuous_beam.recommendedPassives = ["coolingSystem", "beamOvercharge", "wideBeam"];
    d.continuous_beam.recommendedFor = ["制圧射撃", "継続火力"];

    // Energy (4)
    d.plasma_smg.displayNameJa = "プラズマSMG"; d.plasma_smg.categoryJa = "エネルギー";
    d.plasma_smg.descriptionEn = "Fast plasma bolts. No reload energy weapon.";
    d.plasma_smg.strengths = ["リロード不要", "連射速度が高い", "機動性が高い"];
    d.plasma_smg.weaknesses = ["オーバーヒート管理が必要"];
    d.plasma_smg.recommendedPassives = ["coolingSystem", "rapidFire", "runner"];
    d.plasma_smg.recommendedFor = ["突撃型", "リロード不要を活かしたい人"];

    d.ion_rifle.displayNameJa = "イオンライフル"; d.ion_rifle.categoryJa = "エネルギー";
    d.ion_rifle.descriptionEn = "Ion bolt launcher. Slow but consistent.";
    d.ion_rifle.strengths = ["高火力", "貫通力", "リロード不要"];
    d.ion_rifle.weaknesses = ["連射が遅い", "弾速が遅い"];
    d.ion_rifle.recommendedPassives = ["coolingSystem", "heavyBarrel", "heavyHands"];
    d.ion_rifle.recommendedFor = ["精密射撃", "中～遠距離"];

    d.arc_rifle.displayNameJa = "アークライフル"; d.arc_rifle.categoryJa = "エネルギー";
    d.arc_rifle.descriptionEn = "Arc lightning. Chains to nearby enemies.";
    d.arc_rifle.strengths = ["電撃チェーン", "複数敵にダメージ", "リロード不要"];
    d.arc_rifle.weaknesses = ["直撃火力は控えめ"];
    d.arc_rifle.recommendedPassives = ["chainLightning", "coolingSystem", "luckyShot"];
    d.arc_rifle.recommendedFor = ["集団戦", "撹乱役"];

    d.pulse_carbine.displayNameJa = "パルスカービン"; d.pulse_carbine.categoryJa = "エネルギー";
    d.pulse_carbine.descriptionEn = "Pulse burst energy rifle. High accuracy.";
    d.pulse_carbine.strengths = ["バーストの精度が高い", "リロード不要"];
    d.pulse_carbine.weaknesses = ["バーストに慣れが必要"];
    d.pulse_carbine.recommendedPassives = ["coolingSystem", "sharpshooter", "steadyAim"];
    d.pulse_carbine.recommendedFor = ["中距離戦", "バースト好き"];

    // Explosive (5)
    d.rpg.displayNameJa = "ロケットランチャー"; d.rpg.categoryJa = "爆発物";
    d.rpg.descriptionEn = "Fires rockets. Area damage, watch the splash.";
    d.rpg.strengths = ["範囲攻撃", "高威力"];
    d.rpg.weaknesses = ["リロードが遅い", "至近距離での自爆注意"];
    d.rpg.recommendedPassives = ["heavyHands", "explosiveAmmo", "efficient"];
    d.rpg.recommendedFor = ["範囲攻撃", "待ち伏せ"];

    d.grenade_launcher.displayNameJa = "グレネードランチャー"; d.grenade_launcher.categoryJa = "爆発物";
    d.grenade_launcher.descriptionEn = "Lobbed grenades. Bouncing area denial.";
    d.grenade_launcher.strengths = ["曲射可能", "跳ねるグレネード", "広い爆発範囲"];
    d.grenade_launcher.weaknesses = ["直撃が難しい", "弾道予測が必要"];
    d.grenade_launcher.recommendedPassives = ["efficient", "explosiveAmmo", "heavyHands"];
    d.grenade_launcher.recommendedFor = ["戦術家", "曲射マスター"];

    d.quad_rocket.displayNameJa = "クアッドロケット"; d.quad_rocket.categoryJa = "爆発物";
    d.quad_rocket.descriptionEn = "4-tube rocket launcher. Rapid sequential fire.";
    d.quad_rocket.strengths = ["連続発射", "圧倒的な制圧力"];
    d.quad_rocket.weaknesses = ["リロードが長い", "弾消費が激しい"];
    d.quad_rocket.recommendedPassives = ["triggerHappy", "efficient", "extraMagazine"];
    d.quad_rocket.recommendedFor = ["制圧射撃", "弾幕型"];

    d.sticky_launcher.displayNameJa = "スティッキーランチャー"; d.sticky_launcher.categoryJa = "爆発物";
    d.sticky_launcher.descriptionEn = "Sticky bombs. Remote detonation traps.";
    d.sticky_launcher.strengths = ["粘着設置", "遠隔起爆", "トラップ設置可能"];
    d.sticky_launcher.weaknesses = ["直接火力は控えめ", "戦術的理解が必要"];
    d.sticky_launcher.recommendedPassives = ["efficient", "explosiveAmmo", "extraMagazine"];
    d.sticky_launcher.recommendedFor = ["トラッパー", "戦術家"];

    d.cluster_launcher.displayNameJa = "クラスターランチャー"; d.cluster_launcher.categoryJa = "爆発物";
    d.cluster_launcher.descriptionEn = "Cluster bombs. Split into sub-munitions.";
    d.cluster_launcher.strengths = ["子弾に分裂", "広範囲カバー"];
    d.cluster_launcher.weaknesses = ["単体火力は低い", "リロードが長い"];
    d.cluster_launcher.recommendedPassives = ["clusterRound", "explosiveAmmo", "efficient"];
    d.cluster_launcher.recommendedFor = ["範囲制圧", "エリア封鎖"];

    // Experimental (5) — guard unregistered
    if (d.gravity_gun) {
      d.gravity_gun.displayNameJa = "グラビティガン"; d.gravity_gun.categoryJa = "実験兵器";
      d.gravity_gun.descriptionEn = "Manipulates physics. Push/pull enemies.";
      d.gravity_gun.strengths = ["ノックバック", "引き寄せ", "ユニークな戦術"];
      d.gravity_gun.weaknesses = ["殺傷能力が低い"];
      d.gravity_gun.recommendedPassives = ["runner", "heavyHands", "efficient"];
      d.gravity_gun.recommendedFor = ["戦術家", "ユーティリティ志向"];
    }

    if (d.black_hole_launcher) {
      d.black_hole_launcher.displayNameJa = "ブラックホールランチャー"; d.black_hole_launcher.categoryJa = "実験兵器";
      d.black_hole_launcher.descriptionEn = "Creates gravity wells. Pulls enemies in.";
      d.black_hole_launcher.strengths = ["重力場で敵を集める", "範囲コントロール"];
      d.black_hole_launcher.weaknesses = ["リロードが極めて長い", "直接火力が低い"];
      d.black_hole_launcher.recommendedPassives = ["efficient", "heavyHands", "extraMagazine"];
      d.black_hole_launcher.recommendedFor = ["ゾーンコントロール", "サポート役"];
    }

    if (d.time_distorter) {
      d.time_distorter.displayNameJa = "タイムディストーター"; d.time_distorter.categoryJa = "実験兵器";
      d.time_distorter.descriptionEn = "Time-warp field. Slows enemies, speeds allies.";
      d.time_distorter.strengths = ["時間操作", "敵減速・味方加速"];
      d.time_distorter.weaknesses = ["直接火力が低い"];
      d.time_distorter.recommendedPassives = ["runner", "sprinter", "efficient"];
      d.time_distorter.recommendedFor = ["サポート役", "戦術家"];
    }

    if (d.boomerang_blade) {
      d.boomerang_blade.displayNameJa = "ブーメランブレード"; d.boomerang_blade.categoryJa = "実験兵器";
      d.boomerang_blade.descriptionEn = "Throwable boomerang blade. Unique trajectory.";
      d.boomerang_blade.strengths = ["独特な軌道", "予測困難"];
      d.boomerang_blade.weaknesses = "扱いが難しい,射程が限られる".split(",");
      d.boomerang_blade.recommendedPassives = ["ricochetExpert", "heavyHands", "highVelocity"];
      d.boomerang_blade.recommendedFor = ["トリッキー志向", "上級者"];
    }

    if (d.mirror_shot) {
      d.mirror_shot.displayNameJa = "ミラーショット"; d.mirror_shot.categoryJa = "実験兵器";
      d.mirror_shot.descriptionEn = "Wall-bouncing bullets. Unpredictable angles.";
      d.mirror_shot.strengths = ["壁跳ね返り", "予測不能な攻撃"];
      d.mirror_shot.weaknesses = ["操作が非常に難しい"];
      d.mirror_shot.recommendedPassives = ["ricochetExpert", "doubleRicochet", "sharpshooter"];
      d.mirror_shot.recommendedFor = ["超上級者", "トリッキー戦法"];
    }

    // Drone (4)
    if (d.attack_drone) {
      d.attack_drone.displayNameJa = "アタックドローン"; d.attack_drone.categoryJa = "ドローン";
      d.attack_drone.descriptionEn = "Deploys an attack drone. Auto-tracks enemies.";
      d.attack_drone.strengths = ["自動追尾", "設置後の継続攻撃"];
      d.attack_drone.weaknesses = ["展開中は他武器が使えない", "リロードが長い"];
      d.attack_drone.recommendedPassives = ["heavyBarrel", "longBeam", "luckyShot"];
      d.attack_drone.recommendedFor = ["サポート役", "ながら攻撃"];
    }

    if (d.missile_drone) {
      d.missile_drone.displayNameJa = "ミサイルドローン"; d.missile_drone.categoryJa = "ドローン";
      d.missile_drone.descriptionEn = "Deploys a missile drone. Tracking projectiles.";
      d.missile_drone.strengths = ["追尾ミサイル", "高火力"];
      d.missile_drone.weaknesses = ["展開中は他武器が使えない", "リロードが長い"];
      d.missile_drone.recommendedPassives = ["explosiveAmmo", "heavyHands", "efficient"];
      d.missile_drone.recommendedFor = ["火力支援", "防衛型"];
    }

    if (d.orbit_drone) {
      d.orbit_drone.displayNameJa = "オービットドローン"; d.orbit_drone.categoryJa = "ドローン";
      d.orbit_drone.descriptionEn = "Orbital drone. Passive area damage.";
      d.orbit_drone.strengths = ["周回ダメージ", "継続的な範囲攻撃"];
      d.orbit_drone.weaknesses = ["一発の火力は低い"];
      d.orbit_drone.recommendedPassives = ["wideBeam", "luckyShot", "efficient"];
      d.orbit_drone.recommendedFor = ["エリアコントロール", "継続ダメージ"];
    }

    if (d.turret_launcher) {
      d.turret_launcher.displayNameJa = "タレットランチャー"; d.turret_launcher.categoryJa = "ドローン";
      d.turret_launcher.descriptionEn = "Deploys a turret. Auto-targets enemies.";
      d.turret_launcher.strengths = ["固定式タレット", "自動照準", "防御線構築"];
      d.turret_launcher.weaknesses = ["設置場所が重要", "リロードが長い"];
      d.turret_launcher.recommendedPassives = ["sharpshooter", "rapidFire", "extraMagazine"];
      d.turret_launcher.recommendedFor = ["防衛型", "拠点確保"];
    }
  }

  getAll() { return this._list.slice(); }
  get(id) { return this._map[id] || null; }
  getIndex(id) { return this._list.indexOf(id); }
  at(index) {
    if (index < 0) index = this._list.length - 1;
    else if (index >= this._list.length) index = 0;
    return this._list[index];
  }
  next(id) {
    const idx = this.getIndex(id);
    if (idx === -1) return this._list[0];
    return this.at(idx + 1);
  }
  prev(id) {
    const idx = this.getIndex(id);
    if (idx === -1) return this._list[this._list.length - 1];
    return this.at(idx - 1);
  }
  count() { return this._list.length; }

  add(id, def) {
    if (this._map[id]) return false;
    this._add(id, def);
    if (this._map[id]) this._map[id].stars = this._calcStars(this._map[id]);
    return true;
  }

  getCategories() {
    const cats = new Set();
    for (const id of this._list) {
      cats.add(this._map[id].category);
    }
    return Array.from(cats);
  }

  getByCategory(category) {
    return this._list.filter(id => this._map[id].category === category);
  }

  getByType(weaponType) {
    return this._list.filter(id => this._map[id].weaponType === weaponType);
  }

  getByPlaystyle(playstyle) {
    return this._list.filter(id => this._map[id].playstyle === playstyle);
  }

  sortById() { return this._list.slice(); }
  sortByDamage() { return this._list.slice().sort((a, b) => (this._map[b].damage * (this._map[b].pellets || 1)) - (this._map[a].damage * (this._map[a].pellets || 1))); }
  sortByFireRate() { return this._list.slice().sort((a, b) => this._map[a].fireRate - this._map[b].fireRate); }
  sortByRange() { return this._list.slice().sort((a, b) => this._map[b].range - this._map[a].range); }

  search(query) {
    const q = query.toLowerCase();
    return this._list.filter(id => {
      const w = this._map[id];
      return w.displayName.toLowerCase().includes(q) ||
        w.category.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q) ||
        w.playstyle.toLowerCase().includes(q);
    });
  }

  starsToString(n) { return "★".repeat(Math.max(1, Math.min(5, n || 1))) + "☆".repeat(Math.max(0, 5 - Math.max(1, Math.min(5, n || 1)))); }

  _starStr(n) { return "★".repeat(Math.max(1, Math.min(5, n || 1))); }

  _statCell(label, stars, value) {
    const v = value != null ? ` <span class="ws-sval-num">${value}</span>` : '';
    return `<div class="ws-scell"><span class="ws-slbl">${label}</span><span class="ws-sval">${this._starStr(stars)}${v}</span></div>`;
  }

  statsLines(id) {
    const w = this.get(id);
    if (!w) return [];
    const s = w.stars || {};
    return [
      `<div class="ws-desc">${w.description}</div>`,
      `<div class="ws-meta">${w.category} · ${w.weaponType.toUpperCase()} · ${w.fireMode}</div>`,
      `<div class="ws-sgrid">`,
      this._statCell('DMG', s.damage, w.damage),
      this._statCell('RATE', s.fireRate, (w.fireRate * 1000).toFixed(0) + 'ms'),
      this._statCell('RNG', s.range, w.range + 'm'),
      this._statCell('ACC', s.accuracy),
      this._statCell('MOB', s.mobility),
      this._statCell('MAG', s.magazine, w.magazineSize),
      this._statCell('RLD', s.reload, w.reloadTime + 's'),
      this._statCell('REC', s.recoil),
      `</div>`,
      `<div class="ws-difficulty">${"◆".repeat(w.difficulty)}${"◇".repeat(5 - w.difficulty)}</div>`,
      `<div class="ws-playstyle"><strong>${w.playstyle}</strong></div>`,
    ];
  }
}

const WEAPON_REGISTRY = new WeaponRegistry();
const WEAPONS = {};
WEAPON_REGISTRY.getAll().forEach((id) => {
  WEAPONS[id] = WEAPON_REGISTRY.get(id);
});
