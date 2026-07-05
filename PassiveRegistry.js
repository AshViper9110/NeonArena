const PASSIVES = Object.freeze({
  none: { id:"none", displayName:"None", description:"No passive skill", category:"Basic", icon:"⬜", rarity:"common", modifiers:{}, enabled:true },

  /* ===== Movement ===== */
  runner: { id:"runner", displayName:"Runner", description:"Move speed +10%", category:"Movement", icon:"🏃", rarity:"common", modifiers:{ moveSpeed:1.1 }, enabled:true },
  sprinter: { id:"sprinter", displayName:"Sprinter", description:"Dash speed +15%", category:"Movement", icon:"💨", rarity:"common", modifiers:{ dashSpeed:1.15 }, enabled:true },

  /* ===== Survival ===== */
  regeneration: { id:"regeneration", displayName:"Regeneration", description:"Slowly heal out of combat", category:"Survival", icon:"🔄", rarity:"common", modifiers:{ healthRegen:3 }, enabled:true },

  /* ===== Weapon ===== */
  heavyHands: { id:"heavyHands", displayName:"Heavy Hands", description:"Damage +10%", category:"Weapon", icon:"💪", rarity:"common", modifiers:{ damageMultiplier:1.1 }, enabled:true },
  rapidFire: { id:"rapidFire", displayName:"Rapid Fire", description:"Fire rate +10%", category:"Weapon", icon:"⚡", rarity:"common", modifiers:{ fireRateMultiplier:1.1 }, enabled:true },
  triggerHappy: { id:"triggerHappy", displayName:"Trigger Happy", description:"Fire rate +20%", category:"Weapon", icon:"🔥", rarity:"rare", modifiers:{ fireRateMultiplier:1.2 }, enabled:true },
  quickReload: { id:"quickReload", displayName:"Quick Reload", description:"Reload 25% faster", category:"Weapon", icon:"🔄", rarity:"uncommon", modifiers:{ reloadMultiplier:0.75 }, enabled:true },
  steadyAim: { id:"steadyAim", displayName:"Steady Aim", description:"Recoil -25%", category:"Weapon", icon:"🎯", rarity:"common", modifiers:{ recoilMultiplier:0.75 }, enabled:true },
  sharpshooter: { id:"sharpshooter", displayName:"Sharpshooter", description:"Spread -20%", category:"Weapon", icon:"🎯", rarity:"uncommon", modifiers:{ spreadMultiplier:0.8 }, enabled:true },
  heavyBarrel: { id:"heavyBarrel", displayName:"Heavy Barrel", description:"Projectile speed +30%, range +20%", category:"Weapon", icon:"🔫", rarity:"uncommon", modifiers:{ projSpeedMultiplier:1.3, rangeMultiplier:1.2 }, enabled:true },
  highVelocity: { id:"highVelocity", displayName:"High Velocity", description:"Projectile speed +30%", category:"Weapon", icon:"💨", rarity:"uncommon", modifiers:{ projSpeedMultiplier:1.3 }, enabled:true },
  giantBullets: { id:"giantBullets", displayName:"Giant Bullets", description:"Projectile size +50%", category:"Weapon", icon:"🔵", rarity:"uncommon", modifiers:{ projSizeMultiplier:1.5 }, enabled:true },
  armorPiercing: { id:"armorPiercing", displayName:"Armor Piercing", description:"Pierce +1 enemy", category:"Weapon", icon:"🔱", rarity:"rare", modifiers:{ pierceCount:1 }, enabled:true },
  explosiveAmmo: { id:"explosiveAmmo", displayName:"Explosive Ammo", description:"Bullets explode on impact", category:"Weapon", icon:"💣", rarity:"epic", modifiers:{ explosiveAmmo:true, explosiveAmmoRadius:2 }, enabled:true },
  hollowPoint: { id:"hollowPoint", displayName:"Hollow Point", description:"Critical damage +50%", category:"Weapon", icon:"💥", rarity:"rare", modifiers:{ criticalDamageMultiplier:2.5 }, enabled:true },
  extraMagazine: { id:"extraMagazine", displayName:"Extra Magazine", description:"Magazine size +30%", category:"Weapon", icon:"📦", rarity:"common", modifiers:{ magazineMultiplier:1.3 }, enabled:true },
  efficient: { id:"efficient", displayName:"Efficient", description:"Ammo consumption -10%", category:"Weapon", icon:"💎", rarity:"rare", modifiers:{ ammoCostMultiplier:0.9 }, enabled:true },
  ammoPrinter: { id:"ammoPrinter", displayName:"Ammo Printer", description:"Regenerate ammo over time", category:"Weapon", icon:"📠", rarity:"rare", modifiers:{ ammoRegenPerSec:0.5 }, enabled:true },
  scavenger: { id:"scavenger", displayName:"Scavenger", description:"Restore ammo on kill", category:"Weapon", icon:"♻️", rarity:"uncommon", modifiers:{ ammoRegenOnKill:1 }, enabled:true },
  quickHands: { id:"quickHands", displayName:"Quick Hands", description:"Weapon switch speed +30%", category:"Weapon", icon:"🤲", rarity:"common", modifiers:{ switchSpeedMultiplier:1.3 }, enabled:true },
  fastHands: { id:"fastHands", displayName:"Fast Hands", description:"Weapon switch speed +30%", category:"Weapon", icon:"🤲", rarity:"uncommon", modifiers:{ switchSpeedMultiplier:1.3 }, enabled:true },
  vampire: { id:"vampire", displayName:"Vampire", description:"Heal 5% of damage dealt", category:"Weapon", icon:"🧛", rarity:"epic", modifiers:{ lifeSteal:0.05 }, enabled:true },

  /* ===== Critical ===== */
  luckyShot: { id:"luckyShot", displayName:"Lucky Shot", description:"Critical hit chance +10%", category:"Critical", icon:"🍀", rarity:"common", modifiers:{ criticalChance:0.1 }, enabled:true },
  deadeye: { id:"deadeye", displayName:"Deadeye", description:"Critical damage +50%", category:"Critical", icon:"🎯", rarity:"uncommon", modifiers:{ criticalDamageMultiplier:2.5 }, enabled:true },
  executioner: { id:"executioner", displayName:"Executioner", description:"+30% damage to enemies below 30% HP", category:"Critical", icon:"⚔️", rarity:"epic", modifiers:{ executionerThreshold:0.3, executionerDamageMult:1.3 }, enabled:true },

  /* ===== Projectile ===== */
  ricochetExpert: { id:"ricochetExpert", displayName:"Ricochet Expert", description:"Ricochet +1", category:"Projectile", icon:"🪀", rarity:"rare", modifiers:{ ricochetCount:1 }, enabled:true },
  doubleRicochet: { id:"doubleRicochet", displayName:"Double Ricochet", description:"Ricochet +2", category:"Projectile", icon:"🪀", rarity:"epic", modifiers:{ ricochetCount:2 }, enabled:true },
  piercingRounds: { id:"piercingRounds", displayName:"Piercing Rounds", description:"Pierce +1 enemy", category:"Projectile", icon:"🔱", rarity:"rare", modifiers:{ pierceCount:1 }, enabled:true },
  piercingShot: { id:"piercingShot", displayName:"Piercing Shot", description:"Pierce +2 enemies", category:"Projectile", icon:"🔱", rarity:"epic", modifiers:{ pierceCount:2 }, enabled:true },
  clusterRound: { id:"clusterRound", displayName:"Cluster Round", description:"Bullets split into 3 on hit", category:"Projectile", icon:"💥", rarity:"epic", modifiers:{ clusterCount:3 }, enabled:true },
  chainLightning: { id:"chainLightning", displayName:"Chain Lightning", description:"Hits chain to 2 nearby enemies", category:"Projectile", icon:"⚡", rarity:"epic", modifiers:{ chainCount:2, chainDamageMult:0.5 }, enabled:true },
  freezeBullet: { id:"freezeBullet", displayName:"Freeze Bullet", description:"Slows enemies on hit", category:"Projectile", icon:"❄️", rarity:"rare", modifiers:{ freezeDuration:1.5, freezeSlowAmount:0.5 }, enabled:true },
  incendiary: { id:"incendiary", displayName:"Incendiary", description:"Burns enemies on hit", category:"Projectile", icon:"🔥", rarity:"rare", modifiers:{ burnDuration:3, burnDamagePerSec:5 }, enabled:true },
  poisonBullet: { id:"poisonBullet", displayName:"Poison Bullet", description:"Poisons enemies on hit", category:"Projectile", icon:"☠️", rarity:"rare", modifiers:{ poisonDuration:4, poisonDamagePerSec:4 }, enabled:true },

  /* ===== Beam ===== */
  wideBeam: { id:"wideBeam", displayName:"Wide Beam", description:"Beam width +50%", category:"Beam", icon:"📡", rarity:"uncommon", modifiers:{ beamWidthMultiplier:1.5 }, enabled:true },
  longBeam: { id:"longBeam", displayName:"Long Beam", description:"Beam range +30%", category:"Beam", icon:"📏", rarity:"uncommon", modifiers:{ beamRangeMultiplier:1.3 }, enabled:true },
  beamOvercharge: { id:"beamOvercharge", displayName:"Beam Overcharge", description:"Beam damage +25%", category:"Beam", icon:"⚡", rarity:"rare", modifiers:{ beamDamageMultiplier:1.25 }, enabled:true },
  beamReflection: { id:"beamReflection", displayName:"Beam Reflection", description:"Beam reflects off walls once", category:"Beam", icon:"🪞", rarity:"epic", modifiers:{ beamReflectCount:1 }, enabled:true },
  energyMaster: { id:"energyMaster", displayName:"Energy Master", description:"Beam range +20%, damage +15%", category:"Beam", icon:"🔋", rarity:"rare", modifiers:{ beamRangeMultiplier:1.2, beamDamageMultiplier:1.15 }, enabled:true },
  plasmaOverload: { id:"plasmaOverload", displayName:"Plasma Overload", description:"Plasma explosion radius +30%", category:"Beam", icon:"☄️", rarity:"epic", modifiers:{ plasmaBoomMultiplier:1.3 }, enabled:true },
  beamStabilizer: { id:"beamStabilizer", displayName:"Beam Stabilizer", description:"Beam spread -30%", category:"Beam", icon:"📡", rarity:"uncommon", modifiers:{ beamSpreadMultiplier:0.7 }, enabled:true },
  coolingSystem: { id:"coolingSystem", displayName:"Cooling System", description:"Beam fire interval -20%", category:"Beam", icon:"❄️", rarity:"uncommon", modifiers:{ beamCooldownMultiplier:0.8 }, enabled:true },
});

const PASSIVE_IDS = Object.keys(PASSIVES);

const PASSIVE_DETAILS = {
  runner:{displayNameJa:"ランナー",categoryJa:"移動",descriptionJa:"移動速度が10%上昇する。シンプルかつ強力な移動系パッシブ。",effect:"移動速度+10%",synergyWeapons:["smg","compact_smg","carbine","shotgun"],antiSynergyWeapons:["heavy_sniper","minigun","beam_cannon"],recommendedPlaystyle:["積極的な機動戦","遊撃戦"],merits:["常時発動で効果が安定","どんな武器とも組み合わせやすい"],demerits:["効果が地味","速度上昇は慣れが必要"]},
  sprinter:{displayNameJa:"スプリンター",categoryJa:"移動",descriptionJa:"ダッシュ速度が15%上昇する。素早い接近・離脱が可能に。",effect:"ダッシュ速度+15%",synergyWeapons:["compact_smg","vector","shotgun"],antiSynergyWeapons:["heavy_sniper","lmg"],recommendedPlaystyle:["突撃","ヒットアンドアウェイ"],merits:["ダッシュが強化される","接近戦で有利"],demerits:["ダッシュ中以外は効果なし"]},
  regeneration:{displayNameJa:"リジェネレーション",categoryJa:"生存",descriptionJa:"戦闘外でHPが自動回復する。持久戦に有効。",effect:"戦闘外HP回復(毎秒3)",synergyWeapons:["sniper","marksman","dmr"],antiSynergyWeapons:[],recommendedPlaystyle:["遠距離戦","持久戦"],merits:["自然回復で有利","アイテム節約"],demerits:["戦闘中は回復しない","即効性がない"]},

  heavyHands:{displayNameJa:"ヘビーハンズ",categoryJa:"武器",descriptionJa:"すべての与ダメージが10%増加する。シンプルに火力を底上げ。",effect:"与ダメージ+10%",synergyWeapons:["sniper","revolver","heavy_sniper"],antiSynergyWeapons:[],recommendedPlaystyle:["火力重視","どんなスタイルにも"],merits:["常時発動で安定した火力増加","全武器に対応"],demerits:["効果が地味","他のバフと重複するが加算"]},
  rapidFire:{displayNameJa:"ラピッドファイア",categoryJa:"武器",descriptionJa:"連射速度が10%上昇する。トリガーハッピーなプレイヤーに。",effect:"連射速度+10%",synergyWeapons:["vector","minigun","machine_pistol"],antiSynergyWeapons:["sniper","revolver"],recommendedPlaystyle:["弾幕型","ラッシュ"],merits:["DPSが確実に上昇","連射武器との相性が良い"],demerits:["弾消費が増える","精密武器には効果が薄い"]},
  triggerHappy:{displayNameJa:"トリガーハッピー",categoryJa:"武器",descriptionJa:"連射速度が20%上昇する。弾をばらまきたい人に。",effect:"連射速度+20%",synergyWeapons:["vector","minigun","machine_pistol","auto_shotgun"],antiSynergyWeapons:["sniper","revolver","heavy_sniper"],recommendedPlaystyle:["弾幕型","ラッシュ"],merits:["DPSが大きく上昇","連射武器で真価を発揮"],demerits:["弾切れが早くなる","制御が難しくなる"]},
  quickReload:{displayNameJa:"クイックリロード",categoryJa:"武器",descriptionJa:"リロード時間が25%短縮される。装填の隙を減らせる。",effect:"リロード速度+25%",synergyWeapons:["shotgun","double_barrel","heavy_sniper","lmg"],antiSynergyWeapons:[],recommendedPlaystyle:["手数重視","継続戦闘"],merits:["リロードのストレスが減る","装弾数の少ない武器ほど恩恵が大きい"],demerits:["リロードしない武器には無意味","直接火力は上がらない"]},
  steadyAim:{displayNameJa:"ステディエイム",categoryJa:"武器",descriptionJa:"反動が25%減少する。精度の高い射撃が可能に。",effect:"反動-25%",synergyWeapons:["ak_rifle","vector","heavy_pistol"],antiSynergyWeapons:[],recommendedPlaystyle:["精密射撃","中～遠距離"],merits:["反動制御が楽になる","連射武器の精度が向上"],demerits:["反動の少ない武器には効果が薄い"]},
  sharpshooter:{displayNameJa:"シャープシューター",categoryJa:"武器",descriptionJa:"弾のばらつきが20%減少する。より正確な射撃が可能に。",effect:"精度+20%",synergyWeapons:["dmr","marksman","sniper","bullpup"],antiSynergyWeapons:["shotgun","auto_shotgun"],recommendedPlaystyle:["精密射撃","スナイピング"],merits:["遠距離の命中率が向上","精密武器との相性が抜群"],demerits:["散弾武器には効果が薄い"]},
  heavyBarrel:{displayNameJa:"ヘビーバレル",categoryJa:"武器",descriptionJa:"弾速が30%、射程が20%向上する。遠距離戦が有利に。",effect:"弾速+30%、射程+20%",synergyWeapons:["dmr","marksman","bullpup","rail_sniper"],antiSynergyWeapons:["shotgun","smg"],recommendedPlaystyle:["遠距離戦","精密射撃"],merits:["長距離の射撃が有利に","弾速上昇でリード射撃が容易"],demerits:["近距離では効果を実感しにくい"]},
  highVelocity:{displayNameJa:"ハイベロシティ",categoryJa:"武器",descriptionJa:"弾速が30%上昇する。遠距離の命中精度が向上。",effect:"弾速+30%",synergyWeapons:["sniper","dmr","marksman","rail_sniper"],antiSynergyWeapons:[],recommendedPlaystyle:["遠距離戦","先読み射撃"],merits:["遠距離のリード射撃が容易","弾速の遅い武器ほど恩恵が大きい"],demerits:["近距離ではほぼ意味がない"]},
  giantBullets:{displayNameJa:"ジャイアントバレット",categoryJa:"武器",descriptionJa:"弾のサイズが50%大きくなる。命中判定が広がる。",effect:"弾サイズ+50%",synergyWeapons:["shotgun","smg","lmg"],antiSynergyWeapons:[],recommendedPlaystyle:["近距離戦","弾幕型"],merits:["命中しやすくなる","近距離での制圧力が向上"],demerits:["遠距離では効果が薄い","弾が見えやすくなる"]},
  armorPiercing:{displayNameJa:"アーマーピアシング",categoryJa:"武器",descriptionJa:"弾が敵を1体貫通する。複数の敵を同時に攻撃可能。",effect:"貫通+1",synergyWeapons:["rail_sniper","heavy_sniper","ak_rifle","lmg"],antiSynergyWeapons:[],recommendedPlaystyle:["集団戦","一直線上の敵"],merits:["複数ヒットのチャンス","敵の密集地で効果的"],demerits:["単体への効果は薄い","貫通後のダメージ減衰があるかも"]},
  explosiveAmmo:{displayNameJa:"爆発弾",categoryJa:"武器",descriptionJa:"弾丸が着弾時に爆発するようになる。範囲攻撃が可能に。",effect:"弾丸が爆発する",synergyWeapons:["shotgun","rpg","sniper","lmg"],antiSynergyWeapons:[],recommendedPlaystyle:["範囲攻撃","制圧"],merits:["範囲ダメージが追加される","集団戦で強い"],demerits:["自爆に注意","爆発半径は小さい"]},
  hollowPoint:{displayNameJa:"ホローポイント",categoryJa:"武器",descriptionJa:"クリティカルダメージが50%増加する。ヘッドショットがより強力に。",effect:"クリティカルダメージ+50%",synergyWeapons:["revolver","sniper","marksman","heavy_pistol"],antiSynergyWeapons:[],recommendedPlaystyle:["精密射撃","ヘッドショット狙い"],merits:["ヘッドショットのリターンが大きい","精密武器と好相性"],demerits:["クリティカルが出せないと意味がない"]},
  extraMagazine:{displayNameJa:"エクストラマガジン",categoryJa:"武器",descriptionJa:"マガジン容量が30%増加する。リロードの頻度が減る。",effect:"マガジン+30%",synergyWeapons:["vector","minigun","smg","p90"],antiSynergyWeapons:["sniper","revolver"],recommendedPlaystyle:["弾幕型","継続戦闘"],merits:["連射し続けられる","リロード回数が減少"],demerits:["リロード速度は変わらない"]},
  efficient:{displayNameJa:"エフィシェント",categoryJa:"武器",descriptionJa:"弾薬の消費が10%減少する。少ない弾でより多くの攻撃を。",effect:"弾薬消費-10%",synergyWeapons:["minigun","vector","smg","auto_shotgun"],antiSynergyWeapons:[],recommendedPlaystyle:["節約型","継続戦闘"],merits:["弾持ちが良くなる","リロード回数が減る"],demerits:["効果は控えめ"]},
  ammoPrinter:{displayNameJa:"アモプリンター",categoryJa:"武器",descriptionJa:"時間とともに弾薬が回復する。弾切れの心配が減る。",effect:"弾薬自動回復(毎秒0.5発)",synergyWeapons:["minigun","lmg","vector","auto_shotgun"],antiSynergyWeapons:[],recommendedPlaystyle:["弾幕型","継続戦闘"],merits:["弾切れしにくくなる","長時間の戦闘が可能"],demerits:["回復量はわずか","リロードの代わりにはならない"]},
  scavenger:{displayNameJa:"スカベンジャー",categoryJa:"武器",descriptionJa:"キルを取ると弾薬が回復する。敵を倒し続ければ弾切れ知らず。",effect:"キル時に弾薬回復",synergyWeapons:["smg","shotgun","vector"],antiSynergyWeapons:[],recommendedPlaystyle:["積極攻勢","キル志向"],merits:["連続キルが可能に","弾薬管理の負担軽減"],demerits:["キルできないと無意味"]},
  quickHands:{displayNameJa:"クイックハンズ",categoryJa:"武器",descriptionJa:"武器の切り替え速度が30%上昇する。状況に応じた武器変更がスムーズに。",effect:"武器切替速度+30%",synergyWeapons:[],antiSynergyWeapons:[],recommendedPlaystyle:["状況対応型","マルチウエポン"],merits:["武器変更が速くなる","臨機応変な戦い方が可能"],demerits:["戦闘に直接影響しない"]},
  fastHands:{displayNameJa:"ファストハンズ",categoryJa:"武器",descriptionJa:"武器切り替え速度が30%上昇する。状況に応じた素早い武器変更を。",effect:"武器切替速度+30%",synergyWeapons:[],antiSynergyWeapons:[],recommendedPlaystyle:["状況対応型"],merits:["武器変更が速い"],demerits:["戦闘に直接影響しない"]},
  vampire:{displayNameJa:"ヴァンパイア",categoryJa:"武器",descriptionJa:"与えたダメージの5%をHPとして吸収する。攻撃しながら回復。",effect:"与ダメージの5%をHP吸収",synergyWeapons:["vector","minigun","smg","shotgun"],antiSynergyWeapons:["sniper","heavy_sniper"],recommendedPlaystyle:["攻撃的な回復","継続戦闘"],merits:["攻撃しながら回復","連射武器で回復量を稼げる"],demerits:["一発武器では回復量が少ない","吸収量は多くない"]},

  luckyShot:{displayNameJa:"ラッキーショット",categoryJa:"クリティカル",descriptionJa:"クリティカルヒット率が10%上昇する。運が良ければ大ダメージ。",effect:"クリティカル率+10%",synergyWeapons:["vector","smg","machine_pistol","auto_shotgun"],antiSynergyWeapons:[],recommendedPlaystyle:["運任せ","手数重視"],merits:["連射武器で発動しやすい","追加ダメージが期待できる"],demerits:["確率依存","必ず発動するわけではない"]},
  deadeye:{displayNameJa:"デッドアイ",categoryJa:"クリティカル",descriptionJa:"クリティカルダメージが50%増加する。精密な一撃がより強力に。",effect:"クリティカルダメージ+50%",synergyWeapons:["revolver","sniper","marksman","heavy_pistol"],antiSynergyWeapons:[],recommendedPlaystyle:["精密射撃","一撃必殺"],merits:["クリティカルの価値が上昇","高倍率武器との相性が良い"],demerits:["クリティカルが出せないと無意味"]},
  executioner:{displayNameJa:"エクスキューショナー",categoryJa:"クリティカル",descriptionJa:"HPが30%以下の敵に対するダメージが30%増加する。とどめの一撃に特化。",effect:"瀕死の敵に+30%ダメージ",synergyWeapons:["sniper","heavy_sniper","revolver","shotgun"],antiSynergyWeapons:[],recommendedPlaystyle:["フィニッシャー","狩人"],merits:["瀕死の敵を確実に仕留められる","高火力武器との相性が良い"],demerits:["HP満タンの敵には効果なし"]},

  ricochetExpert:{displayNameJa:"リコシェエキスパート",categoryJa:"投射物",descriptionJa:"弾が壁で1回跳ね返るようになる。角度次第で予想外の攻撃を仕掛けられる。",effect:"跳ね返り+1",synergyWeapons:["mirror_shot","boomerang_blade","pistol"],antiSynergyWeapons:[],recommendedPlaystyle:["トリッキー","ショットアングル"],merits:["壁裏の敵を攻撃可能","予測不能な弾道"],demerits:["操作が難しい","跳ね返りを前提とした立ち回りが必要"]},
  doubleRicochet:{displayNameJa:"ダブルリコシェ",categoryJa:"投射物",descriptionJa:"弾が壁で2回跳ね返る。複雑な角度からの攻撃が可能。",effect:"跳ね返り+2",synergyWeapons:["mirror_shot","boomerang_blade"],antiSynergyWeapons:[],recommendedPlaystyle:["超トリッキー","上級者向け"],merits:["複雑な角度から攻撃","敵の予想を裏切る"],demerits:["非常に操作が難しい","味方を誤射しないように注意"]},
  piercingRounds:{displayNameJa:"ピアシングラウンズ",categoryJa:"投射物",descriptionJa:"弾が敵を1体貫通する。密集した敵に有効。",effect:"貫通+1",synergyWeapons:["rail_sniper","lmg","ak_rifle","heavy_sniper"],antiSynergyWeapons:[],recommendedPlaystyle:["集団戦","一直線"],merits:["複数ヒットの可能性","敵の集団で真価を発揮"],demerits:["単体戦では無意味"]},
  piercingShot:{displayNameJa:"ピアシングショット",categoryJa:"投射物",descriptionJa:"弾が敵を2体貫通する。一直線上の敵をまとめて攻撃。",effect:"貫通+2",synergyWeapons:["rail_sniper","heavy_sniper","lmg"],antiSynergyWeapons:[],recommendedPlaystyle:["集団戦","一直線"],merits:["最大3体まで貫通","密集地での制圧力が高い"],demerits:["状況を選ぶ","単体では無意味"]},
  clusterRound:{displayNameJa:"クラスターラウンド",categoryJa:"投射物",descriptionJa:"命中時に弾が3つに分裂する。範囲攻撃が可能に。",effect:"命中時に3分裂",synergyWeapons:["shotgun","lmg","cluster_launcher"],antiSynergyWeapons:[],recommendedPlaystyle:["範囲攻撃","制圧"],merits:["分裂後の範囲攻撃","集団戦で有効"],demerits:["分裂後の弾は威力が下がるかも"]},
  chainLightning:{displayNameJa:"チェーンライトニング",categoryJa:"投射物",descriptionJa:"命中した敵から近くの敵2体に電撃が連鎖する。連鎖ダメージは50%。",effect:"チェーン+2(ダメージ50%)",synergyWeapons:["arc_rifle","plasma_smg","ion_rifle"],antiSynergyWeapons:[],recommendedPlaystyle:["集団戦","チェーン"],merits:["複数敵に同時ダメージ","集団戦で非常に有効"],demerits:["単体には効果がない","連鎖ダメージは減衰"]},
  freezeBullet:{displayNameJa:"フリーズバレット",categoryJa:"投射物",descriptionJa:"命中した敵を1.5秒間、50%減速する。足の遅い敵は格好の的。",effect:"命中時、敵を1.5秒間減速(50%)",synergyWeapons:["sniper","marksman","shotgun","rpg"],antiSynergyWeapons:[],recommendedPlaystyle:["遅延","サポート"],merits:["敵の動きを封じる","追撃や逃走に役立つ"],demerits:["直接ダメージはない","減速効果のみ"]},
  incendiary:{displayNameJa:"インセンダリー",categoryJa:"投射物",descriptionJa:"命中した敵を3秒間燃やし、毎秒5の追加ダメージを与える。",effect:"3秒間の燃焼ダメージ(毎秒5)",synergyWeapons:["smg","vector","lmg","machine_pistol"],antiSynergyWeapons:[],recommendedPlaystyle:["継続ダメージ","制圧"],merits:["追加ダメージが蓄積","継続火力を稼げる"],demerits:["即効性がない","効果が切れると追加ダメージなし"]},
  poisonBullet:{displayNameJa:"ポイズンバレット",categoryJa:"投射物",descriptionJa:"命中した敵を4秒間毒状態にし、毎秒4のダメージを与える。",effect:"4秒間の毒ダメージ(毎秒4)",synergyWeapons:["smg","vector","lmg","machine_pistol"],antiSynergyWeapons:[],recommendedPlaystyle:["継続ダメージ","ヒットアンドアウェイ"],merits:["毒ダメージが蓄積","撤退しながらでもダメージを与えられる"],demerits:["即効性がない","毒ダメージのみ"]},

  wideBeam:{displayNameJa:"ワイドビーム",categoryJa:"ビーム",descriptionJa:"ビームの幅が50%拡大する。命中判定が広がり、当てやすくなる。",effect:"ビーム幅+50%",synergyWeapons:["beam_cannon","continuous_beam","plasma_rifle"],antiSynergyWeapons:[],recommendedPlaystyle:["ビーム戦","制圧"],merits:["命中しやすくなる","判定の広いビームで圧倒"],demerits:["精密さは失われる","遠距離では効果が薄い"]},
  longBeam:{displayNameJa:"ロングビーム",categoryJa:"ビーム",descriptionJa:"ビームの射程が30%延長する。遠距離の敵も射程圏内に。",effect:"ビーム射程+30%",synergyWeapons:["laser_rifle","beam_cannon","plasma_rifle"],antiSynergyWeapons:[],recommendedPlaystyle:["遠距離ビーム","スナイピング"],merits:["遠くの敵も捕捉可能","射程外から攻撃できる"],demerits:["接近戦ではほとんど意味がない"]},
  beamOvercharge:{displayNameJa:"ビームオーバーチャージ",categoryJa:"ビーム",descriptionJa:"ビームのダメージが25%増加する。火力重視のビーム使いに。",effect:"ビームダメージ+25%",synergyWeapons:["beam_cannon","laser_rifle","continuous_beam"],antiSynergyWeapons:[],recommendedPlaystyle:["ビーム火力","攻撃型"],merits:["ビームのDPSが大幅上昇","ビーム武器必須"],demerits:["ビーム武器以外では無意味"]},
  beamReflection:{displayNameJa:"ビームリフレクション",categoryJa:"ビーム",descriptionJa:"ビームが壁で1回反射するようになる。角度次第で死角からの攻撃が可能に。",effect:"ビーム反射+1",synergyWeapons:["laser_rifle","plasma_rifle"],antiSynergyWeapons:[],recommendedPlaystyle:["トリッキー","戦術家"],merits:["壁裏の敵を攻撃","予測不能な射線"],demerits:["操作が難しい","反射角度の計算が必要"]},
  energyMaster:{displayNameJa:"エナジーマスター",categoryJa:"ビーム",descriptionJa:"ビームの射程が20%、ダメージが15%上昇する。バランスの良い強化。",effect:"ビーム射程+20%、ダメージ+15%",synergyWeapons:["plasma_rifle","beam_cannon","laser_rifle"],antiSynergyWeapons:[],recommendedPlaystyle:["ビーム全般","バランス型"],merits:["射程と火力の両方が伸びる","ビーム武器との相性が良い"],demerits:["ビーム武器以外では無意味"]},
  plasmaOverload:{displayNameJa:"プラズマオーバーロード",categoryJa:"ビーム",descriptionJa:"プラズマの爆発半径が30%拡大する。範囲攻撃が強化。",effect:"プラズマ爆発半径+30%",synergyWeapons:["plasma_rifle","beam_cannon"],antiSynergyWeapons:[],recommendedPlaystyle:["範囲ビーム","制圧"],merits:["プラズマ爆発の範囲拡大","集団戦で有効"],demerits:["プラズマ武器限定"]},
  beamStabilizer:{displayNameJa:"ビームスタビライザー",categoryJa:"ビーム",descriptionJa:"ビームの拡散が30%減少する。より精密な照射が可能に。",effect:"ビーム拡散-30%",synergyWeapons:["laser_rifle","plasma_rifle"],antiSynergyWeapons:[],recommendedPlaystyle:["精密ビーム","狙撃"],merits:["遠距離の命中精度向上","精密ビームとの相性が良い"],demerits:["ビーム武器限定"]},
  coolingSystem:{displayNameJa:"冷却システム",categoryJa:"ビーム",descriptionJa:"ビームの発射間隔が20%短縮される。より速い連射が可能に。",effect:"ビーム発射間隔-20%",synergyWeapons:["continuous_beam","beam_cannon","plasma_rifle"],antiSynergyWeapons:[],recommendedPlaystyle:["継続ビーム","高速照射"],merits:["ビームの連射速度向上","DPSが上がる"],demerits:["ビーム武器限定"]},
};

const PASSIVE_CATEGORIES = [
  "Basic","Movement","Survival","Weapon","Critical","Projectile","Beam"
];

class PassiveRegistry {
  static getAll() { return PASSIVE_IDS; }
  static get(id) { return PASSIVES[id] || null; }
  static has(id) { return id in PASSIVES; }
  static getByCategory(category) { return PASSIVE_IDS.filter(id => PASSIVES[id].category === category); }
  static getCategories() { return PASSIVE_CATEGORIES.slice(); }

  static statsLines(id) {
    const p = PASSIVES[id];
    if (!p) return [];
    const lines = [];
    if (p.rarity) lines.push(`◈ ${p.rarity.toUpperCase()}`);
    if (p.description) lines.push(p.description);
    return lines;
  }

  static getDetail(id) {
    const p = PASSIVES[id];
    if (!p) return null;
    const d = PASSIVE_DETAILS[id] || {};
    return { ...p, ...d };
  }
}
