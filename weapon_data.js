const WEAPON_DETAILS = {
  // ===== Pistol (6) =====
  pistol: {
    displayNameJa: "ピストル",
    descriptionEn: "Standard sidearm with reliable damage and accuracy at close to medium range.",
    categoryJa: "ピストル",
    strengths: ["バランスの良い性能", "装填速度が速い", "持ち替えが素早い"],
    weaknesses: ["遠距離火力が低い", "連射力に欠ける"],
    recommendedPassives: ["steadyAim", "quickReload"],
    recommendedFor: ["初心者におすすめ", "サブウェポンとして"]
  },
  heavy_pistol: {
    displayNameJa: "ヘビーピストル",
    descriptionEn: "High-caliber handgun that deals massive damage per shot with slow fire rate.",
    categoryJa: "ピストル",
    strengths: ["高い単発火力", "ヘッドショット倍率が高い"],
    weaknesses: ["連射速度が遅い", "リロードが長い", "弾数が少ない"],
    recommendedPassives: ["sharpshooter", "heavyBarrel"],
    recommendedFor: ["精密射撃が得意な方", "一発逆転を狙いたい方"]
  },
  machine_pistol: {
    displayNameJa: "マシンピストル",
    descriptionEn: "Fully automatic pistol that sacrifices accuracy for a high rate of fire.",
    categoryJa: "ピストル",
    strengths: ["高い連射速度", "機動性が高い"],
    weaknesses: ["精度が低い", "弾の消費が激しい", "遠距離は苦手"],
    recommendedPassives: ["triggerHappy", "extraMagazine"],
    recommendedFor: ["接近戦を好む方", "弾幕を張りたい方"]
  },
  revolver: {
    displayNameJa: "リボルバー",
    descriptionEn: "Powerful six-shooter with immense stopping power and a slow reload.",
    categoryJa: "ピストル",
    strengths: ["圧倒的な単発火力", "精密射撃に優れる"],
    weaknesses: ["装弾数が6発", "リロードが非常に遅い", "連射不可"],
    recommendedPassives: ["deadeye", "sharpshooter"],
    recommendedFor: ["漢気を求める方", "命中率に自信がある方"]
  },
  burst_pistol: {
    displayNameJa: "バーストピストル",
    descriptionEn: "Three-round burst pistol that rewards trigger discipline with high burst damage.",
    categoryJa: "ピストル",
    strengths: ["3点バーストの中距離火力", "低反動"],
    weaknesses: ["フルオート不可", "接戦では扱いにくい"],
    recommendedPassives: ["steadyAim", "heavyBarrel"],
    recommendedFor: ["中距離戦を好む方", "リズム感のあるプレイヤー"]
  },
  auto_pistol: {
    displayNameJa: "オートピストル",
    descriptionEn: "Lightweight rapid-fire pistol ideal for mobile, aggressive playstyles.",
    categoryJa: "ピストル",
    strengths: ["軽量で機動性抜群", "バランスの良い連射性能"],
    weaknesses: ["一発の火力が低い", "装甲目標に弱い"],
    recommendedPassives: ["runner", "adrenaline"],
    recommendedFor: ["スピード重視の方", "ヒット＆アウェイ戦法"]
  },

  // ===== SMG (5) =====
  smg: {
    displayNameJa: "サブマシンガン",
    descriptionEn: "Versatile submachine gun with a high fire rate, ideal for close-quarters combat.",
    categoryJa: "サブマシンガン",
    strengths: ["高い連射速度", "機動性が良い", "近距離で高いDPS"],
    weaknesses: ["遠距離の精度が低い", "単発火力は低め"],
    recommendedPassives: ["triggerHappy", "quickReload"],
    recommendedFor: ["近距離戦主体の方", "初心者にも扱いやすい"]
  },
  compact_smg: {
    displayNameJa: "コンパクトSMG",
    descriptionEn: "Ultra-light SMG with excellent hip-fire accuracy and mobility.",
    categoryJa: "サブマシンガン",
    strengths: ["最高クラスの機動性", "腰だめ射撃が正確"],
    weaknesses: ["有効射程が短い", "火力がやや低い"],
    recommendedPassives: ["runner", "sprinter"],
    recommendedFor: ["超接近戦スタイル", "移動速度を活かしたい方"]
  },
  vector: {
    displayNameJa: "ベクター",
    descriptionEn: "High-tech SMG with an extremely high fire rate and compact design.",
    categoryJa: "サブマシンガン",
    strengths: ["驚異的な連射速度", "非常に高い近距離DPS"],
    weaknesses: ["弾切れが早い", "反動制御が難しい", "装弾数が少ない"],
    recommendedPassives: ["extraMagazine", "berserker"],
    recommendedFor: ["トリガーハッピーな方", "リスクを取れる方"]
  },
  mp7: {
    displayNameJa: "MP7",
    descriptionEn: "Reliable PDW with good penetration and controllable recoil.",
    categoryJa: "サブマシンガン",
    strengths: ["高い貫通力", "反動が少なく扱いやすい"],
    weaknesses: ["決定打に欠ける", "火力は平均的"],
    recommendedPassives: ["armorPiercing", "steadyAim"],
    recommendedFor: ["安定した立ち回り", "アーマー敵対策に"]
  },
  p90: {
    displayNameJa: "P90",
    descriptionEn: "Bullpup SMG with an enormous magazine and high fire rate.",
    categoryJa: "サブマシンガン",
    strengths: ["50発の大容量マガジン", "高い連射速度"],
    weaknesses: ["リロードが遅い", "遠距離の精度が低い"],
    recommendedPassives: ["extraMagazine", "ammoPrinter"],
    recommendedFor: ["弾幕を張りたい方", "リロードを減らしたい方"]
  },

  // ===== Assault Rifle (5) =====
  assault: {
    displayNameJa: "アサルトライフル",
    descriptionEn: "All-around assault rifle, effective at most ranges with a balanced fire rate.",
    categoryJa: "アサルトライフル",
    strengths: ["万能な性能", "全距離で対応可能"],
    weaknesses: ["突出した性能がない", "専門武器に劣る場面も"],
    recommendedPassives: ["steadyAim", "quickReload"],
    recommendedFor: ["オールラウンダー", "最初に使う武器として"]
  },
  ak_rifle: {
    displayNameJa: "AKライフル",
    descriptionEn: "Hard-hitting rifle with high damage but strong recoil.",
    categoryJa: "アサルトライフル",
    strengths: ["高い単発火力", "信頼性の高さ"],
    weaknesses: ["反動が強い", "連射時の制御が難しい"],
    recommendedPassives: ["heavyBarrel", "sharpshooter"],
    recommendedFor: ["パワー重視の方", "反動制御に自信のある方"]
  },
  carbine: {
    displayNameJa: "カービン",
    descriptionEn: "Lightweight carbine rifle offering great mobility and handling.",
    categoryJa: "アサルトライフル",
    strengths: ["軽量で機動性良好", "扱いやすい反動"],
    weaknesses: ["火力がやや控えめ", "長距離は苦手"],
    recommendedPassives: ["runner", "aimDownSights"],
    recommendedFor: ["機動戦を好む方", "中距離での立ち回り"]
  },
  bullpup: {
    displayNameJa: "ブルパップ",
    descriptionEn: "Bullpup rifle with great hip-fire accuracy and a compact frame.",
    categoryJa: "アサルトライフル",
    strengths: ["腰だめ精度が高い", "取り回しが良い"],
    weaknesses: ["ADS時の利点が少ない", "射程がやや短い"],
    recommendedPassives: ["steadyAim", "triggerHappy"],
    recommendedFor: ["腰だめ射撃主体の方", "近〜中距離戦"]
  },
  battlerifle: {
    displayNameJa: "バトルライフル",
    descriptionEn: "Heavy semi-automatic battle rifle that dominates at mid range.",
    categoryJa: "アサルトライフル",
    strengths: ["高いダメージ効率", "中距離での制圧力"],
    weaknesses: ["連射速度が遅い", "装弾数が少ない"],
    recommendedPassives: ["deadeye", "heavyBarrel"],
    recommendedFor: ["中距離で支配したい方", "精密射撃型"]
  },

  // ===== Marksman Rifle (4) =====
  marksman: {
    displayNameJa: "マークスマンライフル",
    descriptionEn: "Semi-auto marksman rifle, bridging the gap between assault and sniper rifles.",
    categoryJa: "マークスマンライフル",
    strengths: ["中長距離での精度", "連射が効くスナイパー"],
    weaknesses: ["一撃必殺ではない", "至近距離では不利"],
    recommendedPassives: ["sharpshooter", "highVelocity"],
    recommendedFor: ["アグレッシブなスナイパー", "中距離の要として"]
  },
  dmr: {
    displayNameJa: "DMR",
    descriptionEn: "Designated marksman rifle with exceptional accuracy and range.",
    categoryJa: "マークスマンライフル",
    strengths: ["高い命中精度", "長距離でも威力が減衰しにくい"],
    weaknesses: ["連射速度が遅め", "装弾数が少ない"],
    recommendedPassives: ["deadeye", "highVelocity"],
    recommendedFor: ["精密射撃の極み", "カバーリングファイア"]
  },
  semi_auto_rifle: {
    displayNameJa: "セミオートライフル",
    descriptionEn: "Classic semi-automatic rifle with reliable performance at range.",
    categoryJa: "マークスマンライフル",
    strengths: ["扱いやすいセミオート", "安定したダメージ出力"],
    weaknesses: ["火力がやや平凡", "フルオート武器に近距離で劣る"],
    recommendedPassives: ["steadyAim", "armorPiercing"],
    recommendedFor: ["安定志向の方", "長く使い続けたい方"]
  },
  scout_rifle: {
    displayNameJa: "スカウトライフル",
    descriptionEn: "Light scout rifle with high mobility and quick aim-down-sights speed.",
    categoryJa: "マークスマンライフル",
    strengths: ["高い機動性", "ADSが速い"],
    weaknesses: ["ダメージがやや低い", "連射速度に制限"],
    recommendedPassives: ["runner", "sharpshooter"],
    recommendedFor: ["偵察型プレイヤー", "機動狙撃"]
  },

  // ===== Sniper Rifle (4) =====
  sniper: {
    displayNameJa: "スナイパーライフル",
    descriptionEn: "Standard bolt-action sniper rifle capable of one-shot kills to the head.",
    categoryJa: "スナイパーライフル",
    strengths: ["ヘッドショット即死", "超長距離対応"],
    weaknesses: ["連射速度が極めて遅い", "近距離では無力"],
    recommendedPassives: ["deadeye", "sharpshooter"],
    recommendedFor: ["クラシックスナイパー", "長距離の支配者"]
  },
  heavy_sniper: {
    displayNameJa: "ヘビースナイパー",
    descriptionEn: "Anti-personnel heavy sniper that can one-shot kill to the body at short range.",
    categoryJa: "スナイパーライフル",
    strengths: ["胴体でも即死級", "高い貫通力"],
    weaknesses: ["リロードが非常に遅い", "持ち替えが遅い"],
    recommendedPassives: ["heavyBarrel", "armorPiercing"],
    recommendedFor: ["パワー型スナイパー", "確定キルを狙いたい方"]
  },
  rail_sniper: {
    displayNameJa: "レールスナイパー",
    descriptionEn: "Railgun sniper with instant-hit projectile and extreme penetration.",
    categoryJa: "スナイパーライフル",
    strengths: ["ヒットスキャン級の速さ", "複数貫通可能"],
    weaknesses: ["チャージ時間が必要", "熱管理が難しい"],
    recommendedPassives: ["highVelocity", "piercingRounds"],
    recommendedFor: ["テクノロジー兵器好き", "貫通射撃を活かしたい方"]
  },
  anti_material_rifle: {
    displayNameJa: "対物ライフル",
    descriptionEn: "Anti-material rifle designed to destroy vehicles and penetrate thick armor.",
    categoryJa: "スナイパーライフル",
    strengths: ["対装甲に特化", "障害物越しの射撃"],
    weaknesses: ["極端に遅い連射", "重量級で機動性が低い"],
    recommendedPassives: ["armorPiercing", "explosiveAmmo"],
    recommendedFor: ["ヘビー級ファイター", "装甲敵対策の要"]
  },

  // ===== Shotgun (5) =====
  shotgun: {
    displayNameJa: "ショットガン",
    descriptionEn: "Classic pump-action shotgun devastating at close range.",
    categoryJa: "ショットガン",
    strengths: ["近距離での絶大な火力", "広い弾の散布"],
    weaknesses: ["射程が極端に短い", "一発ごとのリロード"],
    recommendedPassives: ["giantBullets", "hollowPoint"],
    recommendedFor: ["接近戦の王者", "初心者でも扱いやすい"]
  },
  auto_shotgun: {
    displayNameJa: "オートショットガン",
    descriptionEn: "Fully automatic shotgun that unloads shells rapidly into targets.",
    categoryJa: "ショットガン",
    strengths: ["連射可能なショットガン", "高い制圧力"],
    weaknesses: ["弾の消費が激しい", "リロード頻度が高い"],
    recommendedPassives: ["triggerHappy", "extraMagazine"],
    recommendedFor: ["トリガーハッピーな方", "近距離での弾幕"]
  },
  double_barrel: {
    displayNameJa: "ダブルバレル",
    descriptionEn: "Double-barrel shotgun with immense burst damage from both barrels.",
    categoryJa: "ショットガン",
    strengths: ["2発同時発射の爆発力", "リロードが比較的速い"],
    weaknesses: ["2発撃ち切ると装填が必要", "装弾数が2発のみ"],
    recommendedPassives: ["hollowPoint", "quickReload"],
    recommendedFor: ["一撃必殺を狙う方", "度胸試しがしたい方"]
  },
  combat_shotgun: {
    displayNameJa: "コンバットショットガン",
    descriptionEn: "Tactical shotgun with tighter spread and faster pump action.",
    categoryJa: "ショットガン",
    strengths: ["ショットガンとしては長い射程", "集弾性が高い"],
    weaknesses: ["純粋な近距離火力では劣る", "命中精度が要求される"],
    recommendedPassives: ["steadyAim", "sharpshooter"],
    recommendedFor: ["戦術的な立ち回り", "ショットガンの中距離運用"]
  },
  slug_shotgun: {
    displayNameJa: "スラッグショットガン",
    descriptionEn: "Shotgun firing a single heavy slug with excellent accuracy and range.",
    categoryJa: "ショットガン",
    strengths: ["ショットガン級の威力を遠距離に", "高い精度"],
    weaknesses: ["一発必中のプレッシャー", "連射速度が遅い"],
    recommendedPassives: ["deadeye", "highVelocity"],
    recommendedFor: ["精度重視のショットガン使い", "ユニークな戦法を好む方"]
  },

  // ===== LMG (4) =====
  lmg: {
    displayNameJa: "軽機関銃",
    descriptionEn: "General-purpose light machine gun with a large magazine for suppressive fire.",
    categoryJa: "軽機関銃",
    strengths: ["大容量マガジン", "制圧射撃に最適"],
    weaknesses: ["持ち替えが遅い", "移動速度が低下"],
    recommendedPassives: ["extraMagazine", "juggernaut"],
    recommendedFor: ["制圧射撃型", "チーム戦での支援役"]
  },
  heavy_lmg: {
    displayNameJa: "ヘビーLMG",
    descriptionEn: "Heavy machine gun with devastating firepower but very slow handling.",
    categoryJa: "軽機関銃",
    strengths: ["圧倒的な連射火力", "非常に高いDPS"],
    weaknesses: ["機動性が極めて低い", "リロードが非常に長い"],
    recommendedPassives: ["juggernaut", "ironSkin"],
    recommendedFor: ["タンク型プレイヤー", "定点防衛"]
  },
  mobile_lmg: {
    displayNameJa: "モバイルLMG",
    descriptionEn: "Lightweight LMG designed for run-and-gun suppressive fire.",
    categoryJa: "軽機関銃",
    strengths: ["LMGとしては軽量", "移動射撃に強い"],
    weaknesses: ["火力は控えめ", "LMGの割に装弾数が少ない"],
    recommendedPassives: ["runner", "adrenaline"],
    recommendedFor: ["機動型サプレッサー", "LMGの常識を覆したい方"]
  },
  minigun: {
    displayNameJa: "ミニガン",
    descriptionEn: "Rotary barrel minigun with spin-up time and devastating sustained fire.",
    categoryJa: "軽機関銃",
    strengths: ["スピンアップ後の圧倒的火力", "持続火力では最強"],
    weaknesses: ["スピンアップに時間が必要", "移動速度の大幅低下"],
    recommendedPassives: ["juggernaut", "berserker"],
    recommendedFor: ["火力こそ正義", "チームの要として"]
  },

  // ===== Beam (4) =====
  plasma_rifle: {
    displayNameJa: "プラズマライフル",
    descriptionEn: "Energy rifle firing superheated plasma bolts that burn targets.",
    categoryJa: "ビーム兵器",
    strengths: ["プラズマの持続ダメージ", "シールドに効果的"],
    weaknesses: ["弾速がやや遅い", "エネルギー消費が大きい"],
    recommendedPassives: ["efficient", "highVelocity"],
    recommendedFor: ["エネルギー兵器入門に", "持続ダメージ戦法"]
  },
  laser_rifle: {
    displayNameJa: "レーザーライフル",
    descriptionEn: "Precision laser rifle with pinpoint accuracy and a continuous beam.",
    categoryJa: "ビーム兵器",
    strengths: ["命中精度が極めて高い", "瞬間着弾"],
    weaknesses: ["集中射撃が必要", "連射時のオーバーヒート"],
    recommendedPassives: ["sharpshooter", "steadyAim"],
    recommendedFor: ["精密射撃マスター", "エイムに自信のある方"]
  },
  beam_cannon: {
    displayNameJa: "ビームキャノン",
    descriptionEn: "Heavy beam cannon charging a powerful blast that pierces through enemies.",
    categoryJa: "ビーム兵器",
    strengths: ["チャージショットの貫通", "高い単発火力"],
    weaknesses: ["チャージ時間が必要", "エネルギー効率が悪い"],
    recommendedPassives: ["piercingRounds", "heavyBarrel"],
    recommendedFor: ["ヘビーアタッカー", "一発逆転を狙う方"]
  },
  continuous_beam: {
    displayNameJa: "コンティニュアスビーム",
    descriptionEn: "Continuous beam weapon that deals ramping damage the longer it hits.",
    categoryJa: "ビーム兵器",
    strengths: ["命中時間に応じた火力増加", "持続火力が高い"],
    weaknesses: ["継続的な照準が必要", "一度外すとリセット"],
    recommendedPassives: ["berserker", "adrenaline"],
    recommendedFor: ["集中力が武器", "継続火力を活かしたい方"]
  },

  // ===== Energy (4) =====
  plasma_smg: {
    displayNameJa: "プラズマSMG",
    descriptionEn: "Rapid-fire plasma SMG excelling at close-range energy combat.",
    categoryJa: "エネルギ兵器",
    strengths: ["連射速度が非常に高い", "エネルギー武器の扱いやすさ"],
    weaknesses: ["射程が短い", "ダメージ減衰が大きい"],
    recommendedPassives: ["triggerHappy", "efficient"],
    recommendedFor: ["近距離エネルギー戦", "素早い攻撃が好きな方"]
  },
  ion_rifle: {
    displayNameJa: "イオンライフル",
    descriptionEn: "Ion rifle firing charged bolts that disrupt enemy shields.",
    categoryJa: "エネルギ兵器",
    strengths: ["シールド破壊に特化", "中距離での扱いやすさ"],
    weaknesses: ["生身へのダメージが低い", "連射速度が遅め"],
    recommendedPassives: ["armorPiercing", "highVelocity"],
    recommendedFor: ["シールド対策に", "サポート型アタッカー"]
  },
  arc_rifle: {
    displayNameJa: "アークライフル",
    descriptionEn: "Arc rifle that chains lightning between nearby enemies.",
    categoryJa: "エネルギ兵器",
    strengths: ["連鎖する雷撃", "複数敵へのダメージ"],
    weaknesses: ["単体火力は低い", "距離が離れると連鎖しない"],
    recommendedPassives: ["ricochetExpert", "efficient"],
    recommendedFor: ["集団戦で輝く方", "ユニークな戦法を好む方"]
  },
  pulse_carbine: {
    displayNameJa: "パルスカービン",
    descriptionEn: "Pulse carbine with rapid energy bursts and excellent handling.",
    categoryJa: "エネルギ兵器",
    strengths: ["バランスの良い性能", "エネルギー武器の軽量モデル"],
    weaknesses: ["火力が平均的", "突出した強みがない"],
    recommendedPassives: ["steadyAim", "quickReload"],
    recommendedFor: ["エネルギー武器の練習に", "万能型プレイヤー"]
  },

  // ===== Explosive (5) =====
  rpg: {
    displayNameJa: "RPG",
    descriptionEn: "Rocket-propelled grenade launcher with high splash damage.",
    categoryJa: "爆発兵器",
    strengths: ["高い爆発火力", "範囲攻撃"],
    weaknesses: ["リロードが遅い", "至近距離での自爆リスク"],
    recommendedPassives: ["explosiveAmmo", "juggernaut"],
    recommendedFor: ["範囲攻撃を制する方", "爆発物大好き"]
  },
  grenade_launcher: {
    displayNameJa: "グレネードランチャー",
    descriptionEn: "Grenade launcher firing arcing projectiles that bounce off walls.",
    categoryJa: "爆発兵器",
    strengths: ["バウンド弾道", "遮蔽物越しの攻撃"],
    weaknesses: ["直撃が難しい", "炸裂までのタイムラグ"],
    recommendedPassives: ["ricochetExpert", "explosiveAmmo"],
    recommendedFor: ["テクニカルな爆撃", "角度を活かしたい方"]
  },
  quad_rocket: {
    displayNameJa: "クアッドロケット",
    descriptionEn: "Quad-barrel rocket launcher firing four rockets at once.",
    categoryJa: "爆発兵器",
    strengths: ["4連射の圧倒的火力", "面制圧能力"],
    weaknesses: ["弾薬消費が激しい", "リロードが長い"],
    recommendedPassives: ["ammoPrinter", "extraMagazine"],
    recommendedFor: ["火力過多を望む方", "一斉掃射"]
  },
  sticky_launcher: {
    displayNameJa: "スティッキーランチャー",
    descriptionEn: "Launcher that fires sticky explosives that attach to surfaces and enemies.",
    categoryJa: "爆発兵器",
    strengths: ["貼り付け爆弾", "タイムリリース可能"],
    weaknesses: ["起爆タイミングの管理", "直撃ダメージが低い"],
    recommendedPassives: ["efficient", "explosiveAmmo"],
    recommendedFor: ["戦略家", "トラップ設置型"]
  },
  cluster_launcher: {
    displayNameJa: "クラスターランチャー",
    descriptionEn: "Launcher firing a shell that splits into multiple sub-munitions.",
    categoryJa: "爆発兵器",
    strengths: ["広範囲をカバー", "分裂する子弾"],
    weaknesses: ["子弾の散らばりがランダム", "直撃火力は控えめ"],
    recommendedPassives: ["giantBullets", "explosiveAmmo"],
    recommendedFor: ["エリア封鎖", "運試しが好きな方"]
  },

  // ===== Experimental (5) =====
  gravity_gun: {
    displayNameJa: "グラビティガン",
    descriptionEn: "Experimental gravity gun that pushes and pulls enemies and objects.",
    categoryJa: "実験兵器",
    strengths: ["敵の位置を操作", "落下ダメージとのコンボ"],
    weaknesses: ["直接的なダメージが低い", "扱いが難しい"],
    recommendedPassives: ["adrenaline", "runner"],
    recommendedFor: ["ユーティリティ重視", "クリエイティブな戦い方"]
  },
  black_hole_launcher: {
    displayNameJa: "ブラックホールランチャー",
    descriptionEn: "Creates a miniature black hole that pulls in and damages enemies.",
    categoryJa: "実験兵器",
    strengths: ["敵を引き寄せる", "範囲内の継続ダメージ"],
    weaknesses: ["クールダウンが長い", "自分も影響を受ける可能性"],
    recommendedPassives: ["efficient", "berserker"],
    recommendedFor: ["チームプレイを重視", "コンボを狙いたい方"]
  },
  time_distorter: {
    displayNameJa: "タイムディストーター",
    descriptionEn: "Experimental device that slows enemies and speeds up allies.",
    categoryJa: "実験兵器",
    strengths: ["時間操作のユーティリティ", "戦局を一変させる"],
    weaknesses: ["攻撃力が皆無", "サポート特化"],
    recommendedPassives: ["runner", "survivor"],
    recommendedFor: ["サポート特化型", "チームの潤滑油"]
  },
  boomerang_blade: {
    displayNameJa: "ブーメランブレード",
    descriptionEn: "Bladed boomerang that returns to the thrower after hitting targets.",
    categoryJa: "実験兵器",
    strengths: ["戻ってくる弾道", "複数ヒット可能"],
    weaknesses: ["弾道の予測が難しい", "戻ってくるまでの隙"],
    recommendedPassives: ["ricochetExpert", "hollowPoint"],
    recommendedFor: ["トリッキーな戦法", "ユニーク武器マニア"]
  },
  mirror_shot: {
    displayNameJa: "ミラーショット",
    descriptionEn: "Fires a projectile that splits into multiple shots upon hitting surfaces.",
    categoryJa: "実験兵器",
    strengths: ["反射分裂", "狭隘な場所での真価"],
    weaknesses: ["広い場所では弱い", "制御が難しい"],
    recommendedPassives: ["ricochetExpert", "giantBullets"],
    recommendedFor: ["テクニカルプレイヤー", "閉所戦術家"]
  },

  // ===== Drone (4) =====
  attack_drone: {
    displayNameJa: "アタックドローン",
    descriptionEn: "Deploy an autonomous drone that fires at nearby enemies.",
    categoryJa: "ドローン",
    strengths: ["自動攻撃", "マルチタスク可能"],
    weaknesses: ["ドローンの耐久が低い", "クールダウンあり"],
    recommendedPassives: ["survivor", "regeneration"],
    recommendedFor: ["手数を増やしたい方", "マルチタスク型"]
  },
  missile_drone: {
    displayNameJa: "ミサイルドローン",
    descriptionEn: "Deploy a drone that launches homing missiles at targets.",
    categoryJa: "ドローン",
    strengths: ["追尾ミサイル", "高威力攻撃"],
    weaknesses: ["ミサイルが迎撃されうる", "発射までに時間がかかる"],
    recommendedPassives: ["efficient", "ammoPrinter"],
    recommendedFor: ["追尾兵器を好む方", "確実なダメージ源"]
  },
  orbit_drone: {
    displayNameJa: "オービットドローン",
    descriptionEn: "Deploy an orbital drone that circles and provides area denial.",
    categoryJa: "ドローン",
    strengths: ["エリアデニアル", "持続的なプレッシャー"],
    weaknesses: ["移動が遅い", "展開位置が重要"],
    recommendedPassives: ["ironSkin", "juggernaut"],
    recommendedFor: ["エリアコントロール", "ゾーンプレイ"]
  },
  turret_launcher: {
    displayNameJa: "タレットランチャー",
    descriptionEn: "Launches a stationary turret that automatically engages enemies.",
    categoryJa: "ドローン",
    strengths: ["設置型自動砲台", "強力な定点防御"],
    weaknesses: ["設置に時間がかかる", "破壊されると無力"],
    recommendedPassives: ["ironSkin", "regeneration"],
    recommendedFor: ["据え置き戦術", "拠点防衛の要"]
  }
};
