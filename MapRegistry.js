class MapRegistry {
  constructor() {
    this._list = [];
    this._map = {};
    this._build();
  }

  _add(id, def) {
    def.id = id;
    def.difficulty = def.difficulty || 1;
    def.recommendedPlayers = def.recommendedPlayers || '2-8';
    def.walls = def.walls || [];
    def.pads = def.pads || [];
    def.spawnPoints = def.spawnPoints || [];
    this._list.push(id);
    this._map[id] = def;
  }

  _build() {
    const s = (v, f) => Math.round(v * f);
    const w = (p, sz) => ({ p, s: sz });

    const sc = (base, f, hMul) => {
      const wallH = Math.min(Math.round(base.wallHeight * hMul), 6);
      const hm = Math.min(hMul, 2);
      return {
        name: base.name, desc: base.desc,
        nameJa: base.nameJa, descJa: base.descJa,
        size: s(base.size, f),
        wallHeight: wallH,
        wallThick: base.wallThick || 0.5,
        bg: base.bg, fogNear: s(base.fogNear, f), fogFar: s(base.fogFar, f),
        wallColor: base.wallColor, floorColor: base.floorColor,
        edgeColors: base.edgeColors, gridColor: base.gridColor,
        ambientColor: base.ambientColor,
        ambientIntensity: base.ambientIntensity,
        dirColor: base.dirColor, dirIntensity: base.dirIntensity,
        rimColors: base.rimColors,
        walls: (base.walls || []).map(w => ({
          p: [s(w.p[0], f), Math.round(w.p[1] * hm), s(w.p[2], f)],
          s: [s(w.s[0], f), Math.round(w.s[1] * hm), s(w.s[2], f)],
        })),
        pads: (base.pads || []).map(p => ({
          p: [s(p.p[0], f), p.p[1], s(p.p[2], f)],
          s: [s(p.s[0], f), p.s[1], s(p.s[2], f)],
          speed: p.speed,
        })),
        spawnPoints: (base.spawnPoints || []).map(sp => ({
          x: s(sp.x, f), z: s(sp.z, f),
        })),
        difficulty: base.difficulty,
        recommendedPlayers: base.recommendedPlayers,
      };
    };

    this._add('grid', (() => {
      const m = sc({
        name: 'Grid', desc: 'Open training arena with a speed pad',
        nameJa: 'グリッド', descJa: 'スピードパッドがあるオープンな訓練アリーナ',
        size: 40, wallHeight: 3, wallThick: 0.5,
        bg: 0x0a0a12, fogNear: 30, fogFar: 60,
        wallColor: 0x1a1a2e, floorColor: 0x0d0d1a,
        edgeColors: [0x00f0ff, 0xff00ff], gridColor: 0x00f0ff,
        ambientColor: 0x111122, ambientIntensity: 0.5,
        dirColor: 0x8844ff, dirIntensity: 1.0,
        rimColors: [0x00f0ff, 0xff00ff, 0x00f0ff, 0xff00ff],
        walls: [], pads: [{ p: [0,0,0], s: [4,0.1,4], speed: 2.0 }],
        difficulty: 1, recommendedPlayers: '2-4',
        spawnPoints: [
          { x: -16, z: -16 }, { x: 16, z: -16 },
          { x: -16, z: 16 }, { x: 16, z: 16 },
          { x: -10, z: 0 }, { x: 10, z: 0 },
          { x: 0, z: -10 }, { x: 0, z: 10 },
        ],
      }, 5, 2);
      m.wallHeight = 5;
      m.recommendedPlayers = '4-8';
      return m;
    })());

    this._add('chaos', (() => {
      const baseChaos = {
        name: 'Chaos', desc: 'Dense obstacle field with a central boost pad',
        nameJa: 'カオス', descJa: '中央ブーストパッドのある密集障害物フィールド',
        size: 40, wallHeight: 2.5, wallThick: 0.4,
        bg: 0x120008, fogNear: 18, fogFar: 38,
        wallColor: 0x2e0a1a, floorColor: 0x1a0008,
        edgeColors: [0xff0055, 0xff44aa], gridColor: 0xff0088,
        ambientColor: 0x220011, ambientIntensity: 0.4,
        dirColor: 0xff4488, dirIntensity: 0.8,
        rimColors: [0xff0055, 0xff44aa, 0xff0055, 0xff44aa],
        walls: [
          w([-14,1.5,-14],[1,3,1]),w([-14,1.5,-7],[1,3,1]),w([-14,1.5,0],[1,3,1]),w([-14,1.5,7],[1,3,1]),w([-14,1.5,14],[1,3,1]),
          w([-7,1.5,-14],[1,3,1]),w([-7,1.5,-7],[1,3,1]),w([-7,1.5,0],[1,3,1]),w([-7,1.5,7],[1,3,1]),w([-7,1.5,14],[1,3,1]),
          w([0,1.5,-14],[1,3,1]),w([0,1.5,0],[1,3,1]),w([0,1.5,14],[1,3,1]),
          w([7,1.5,-14],[1,3,1]),w([7,1.5,-7],[1,3,1]),w([7,1.5,0],[1,3,1]),w([7,1.5,7],[1,3,1]),w([7,1.5,14],[1,3,1]),
          w([14,1.5,-14],[1,3,1]),w([14,1.5,-7],[1,3,1]),w([14,1.5,0],[1,3,1]),w([14,1.5,7],[1,3,1]),w([14,1.5,14],[1,3,1]),
        ],
        pads: [{ p: [0,0,0], s: [2,0.1,2], speed: 1.8 }],
        difficulty: 4, recommendedPlayers: '4-8',
        spawnPoints: [
          { x: -16, z: -16 }, { x: 16, z: -16 },
          { x: -16, z: 16 }, { x: 16, z: 16 },
          { x: -8, z: -8 }, { x: 8, z: 8 },
          { x: -8, z: 8 }, { x: 8, z: -8 },
        ],
      };
      const m = sc(baseChaos, 5, 2);
      m.wallHeight = 5;
      m.recommendedPlayers = '6-10';
      return m;
    })());

    this._add('maze', (() => {
      const m = sc({
        name: 'Maze', desc: 'Navigate winding corridors and ambush opponents',
        nameJa: 'メイズ', descJa: '曲がりくねった通路を進み、敵を奇襲せよ',
        size: 50, wallHeight: 4, wallThick: 0.5,
        bg: 0x0a0018, fogNear: 20, fogFar: 40,
        wallColor: 0x1a0030, floorColor: 0x080010,
        edgeColors: [0xaa00ff, 0xff00aa], gridColor: 0xaa00ff,
        ambientColor: 0x110022, ambientIntensity: 0.4,
        dirColor: 0x8844ff, dirIntensity: 0.8,
        rimColors: [0xaa00ff, 0xff00aa, 0xaa00ff, 0xff00aa],
        walls: [
          w([-10,2,0],[0.5,4,18]),w([10,2,0],[0.5,4,18]),
          w([0,2,-10],[18,4,0.5]),w([0,2,10],[18,4,0.5]),
          w([-6,2,-5],[0.5,4,8]),w([6,2,5],[0.5,4,8]),
          w([-14,2,-14],[8,4,0.5]),w([14,2,14],[8,4,0.5]),
          w([-18,2,8],[0.5,4,9]),w([18,2,-8],[0.5,4,9]),
          w([-22,2,-6],[0.5,4,7]),w([22,2,6],[0.5,4,7]),
          w([-6,2,18],[7,4,0.5]),w([6,2,-18],[7,4,0.5]),
        ],
        difficulty: 3, recommendedPlayers: '4-8',
        spawnPoints: [
          { x: -20, z: -20 }, { x: 20, z: -20 },
          { x: -20, z: 20 }, { x: 20, z: 20 },
          { x: -10, z: 0 }, { x: 10, z: 0 },
          { x: 0, z: -10 }, { x: 0, z: 10 },
        ],
      }, 2, 1.4);
      m.recommendedPlayers = '4-10';
      return m;
    })());

    this._add('colloseum', (() => {
      const m = sc({
        name: 'Colloseum', desc: 'Compact arena with pillar cover',
        nameJa: 'コロシアム', descJa: '柱を遮蔽物にしたコンパクトなアリーナ',
        size: 35, wallHeight: 3, wallThick: 0.5,
        bg: 0x120a00, fogNear: 22, fogFar: 45,
        wallColor: 0x2e1a0a, floorColor: 0x1a0a00,
        edgeColors: [0xff8800, 0xff4400], gridColor: 0xff6600,
        ambientColor: 0x221100, ambientIntensity: 0.4,
        dirColor: 0xff6600, dirIntensity: 0.8,
        rimColors: [0xff8800, 0xff4400, 0xff8800, 0xff4400],
        walls: [
          w([-8,2,-8],[1.5,4,1.5]),w([8,2,-8],[1.5,4,1.5]),
          w([-8,2,8],[1.5,4,1.5]),w([8,2,8],[1.5,4,1.5]),
          w([0,2,-12],[1.5,4,1.5]),w([0,2,12],[1.5,4,1.5]),
          w([-12,2,0],[1.5,4,1.5]),w([12,2,0],[1.5,4,1.5]),
          w([-4,2,-4],[1.5,4,1.5]),w([4,2,4],[1.5,4,1.5]),
          w([-4,2,4],[1.5,4,1.5]),w([4,2,-4],[1.5,4,1.5]),
        ],
        difficulty: 2, recommendedPlayers: '2-6',
        spawnPoints: [
          { x: -14, z: -14 }, { x: 14, z: -14 },
          { x: -14, z: 14 }, { x: 14, z: 14 },
          { x: -8, z: 0 }, { x: 8, z: 0 },
          { x: 0, z: -8 }, { x: 0, z: 8 },
        ],
      }, 2, 1.4);
      m.recommendedPlayers = '4-8';
      return m;
    })());

    this._add('abyss', (() => {
      const m = sc({
        name: 'Abyss', desc: 'Deadly central vortex with watchtowers',
        nameJa: 'アビス', descJa: '致命的な中央渦と監視塔のある戦場',
        size: 45, wallHeight: 3.5, wallThick: 0.5,
        bg: 0x000a12, fogNear: 25, fogFar: 50,
        wallColor: 0x0a1a2e, floorColor: 0x050a12,
        edgeColors: [0x00ffff, 0x0088ff], gridColor: 0x00aaff,
        ambientColor: 0x001122, ambientIntensity: 0.4,
        dirColor: 0x4488ff, dirIntensity: 0.8,
        rimColors: [0x00ffff, 0x0088ff, 0x00ffff, 0x0088ff],
        walls: [
          w([-7,2,-7],[2,4,2]),w([7,2,-7],[2,4,2]),
          w([-7,2,7],[2,4,2]),w([7,2,7],[2,4,2]),
          w([0,2,-14],[1,4,2]),w([0,2,14],[1,4,2]),
          w([-14,2,0],[2,4,1]),w([14,2,0],[2,4,1]),
          w([-20,2,-10],[1.5,4,1.5]),w([20,2,10],[1.5,4,1.5]),
          w([-10,2,-20],[1.5,4,1.5]),w([10,2,20],[1.5,4,1.5]),
        ],
        difficulty: 4, recommendedPlayers: '4-8',
        spawnPoints: [
          { x: -18, z: -18 }, { x: 18, z: -18 },
          { x: -18, z: 18 }, { x: 18, z: 18 },
          { x: -12, z: 0 }, { x: 12, z: 0 },
          { x: 0, z: -12 }, { x: 0, z: 12 },
        ],
      }, 2, 1.4);
      m.recommendedPlayers = '4-10';
      return m;
    })());

    this._add('fort', (() => {
      const m = sc({
        name: 'Fort', desc: 'Fortified stronghold with defensive positions',
        nameJa: 'フォート', descJa: '防御拠点のある要塞化された要塞',
        size: 48, wallHeight: 4, wallThick: 0.5,
        bg: 0x0a1208, fogNear: 22, fogFar: 44,
        wallColor: 0x0a1a0a, floorColor: 0x080a05,
        edgeColors: [0x00ff88, 0x00cc66], gridColor: 0x00ff66,
        ambientColor: 0x002211, ambientIntensity: 0.4,
        dirColor: 0x44ff88, dirIntensity: 0.8,
        rimColors: [0x00ff88, 0x00cc66, 0x00ff88, 0x00cc66],
        walls: [
          w([-13,2,-13],[7,4,0.5]),w([13,2,13],[7,4,0.5]),
          w([-13,2,13],[7,4,0.5]),w([13,2,-13],[7,4,0.5]),
          w([-6,2,0],[0.5,4,12]),w([6,2,0],[0.5,4,12]),
          w([0,2,-6],[12,4,0.5]),w([0,2,6],[12,4,0.5]),
          w([-20,2,-10],[0.5,4,8]),w([20,2,10],[0.5,4,8]),
          w([-10,2,-20],[8,4,0.5]),w([10,2,20],[8,4,0.5]),
        ],
        difficulty: 3, recommendedPlayers: '4-8',
        spawnPoints: [
          { x: -20, z: -20 }, { x: 20, z: -20 },
          { x: -20, z: 20 }, { x: 20, z: 20 },
          { x: -12, z: 0 }, { x: 12, z: 0 },
          { x: 0, z: -12 }, { x: 0, z: 12 },
        ],
      }, 2, 1.4);
      m.recommendedPlayers = '4-10';
      return m;
    })());

    this._add('reactor', (() => {
      const m = sc({
        name: 'Reactor', desc: 'Glowing core chamber with speed boost',
        nameJa: 'リアクター', descJa: 'スピードブーストのある発光コア室',
        size: 42, wallHeight: 3.5, wallThick: 0.5,
        bg: 0x001208, fogNear: 24, fogFar: 48,
        wallColor: 0x0a1a0a, floorColor: 0x000a05,
        edgeColors: [0x00ff44, 0x00ff88], gridColor: 0x00ff66,
        ambientColor: 0x001104, ambientIntensity: 0.4,
        dirColor: 0x00ff66, dirIntensity: 0.8,
        rimColors: [0x00ff44, 0x00ff88, 0x00ff44, 0x00ff88],
        walls: [
          w([-8,2,0],[0.5,4,8]),w([8,2,0],[0.5,4,8]),
          w([0,2,-8],[8,4,0.5]),w([0,2,8],[8,4,0.5]),
          w([-12,2,-12],[4,4,0.5]),w([12,2,12],[4,4,0.5]),
          w([-12,2,12],[4,4,0.5]),w([12,2,-12],[4,4,0.5]),
          w([-18,2,-6],[1.5,4,1.5]),w([18,2,6],[1.5,4,1.5]),
          w([-6,2,-18],[1.5,4,1.5]),w([6,2,18],[1.5,4,1.5]),
        ],
        pads: [{ p: [0,0,0], s: [3,0.1,3], speed: 1.5 }],
        difficulty: 2, recommendedPlayers: '2-6',
        spawnPoints: [
          { x: -16, z: -16 }, { x: 16, z: -16 },
          { x: -16, z: 16 }, { x: 16, z: 16 },
          { x: -10, z: 0 }, { x: 10, z: 0 },
          { x: 0, z: -10 }, { x: 0, z: 10 },
        ],
      }, 2, 1.4);
      m.recommendedPlayers = '4-8';
      return m;
    })());

    this._add('ice', (() => {
      const m = sc({
        name: 'Ice', desc: 'Slippery frozen tundra with teleport pad',
        nameJa: 'アイス', descJa: '滑りやすい凍土とテレポートパッドのある氷原',
        size: 38, wallHeight: 2.5, wallThick: 0.5,
        bg: 0x080c18, fogNear: 28, fogFar: 55,
        wallColor: 0x1a2236, floorColor: 0x0a0e18,
        edgeColors: [0x4488ff, 0x88ccff], gridColor: 0x4488ff,
        ambientColor: 0x081122, ambientIntensity: 0.5,
        dirColor: 0x88aaff, dirIntensity: 1.0,
        rimColors: [0x4488ff, 0x88ccff, 0x4488ff, 0x88ccff],
        walls: [
          w([-4,1.5,-4],[1.5,3,1.5]),w([4,1.5,-4],[1.5,3,1.5]),
          w([-4,1.5,4],[1.5,3,1.5]),w([4,1.5,4],[1.5,3,1.5]),
          w([-10,1.5,-10],[1.5,3,1.5]),w([10,1.5,10],[1.5,3,1.5]),
          w([-10,1.5,10],[1.5,3,1.5]),w([10,1.5,-10],[1.5,3,1.5]),
          w([-16,1.5,-6],[1.5,3,1.5]),w([16,1.5,6],[1.5,3,1.5]),
          w([-6,1.5,-16],[1.5,3,1.5]),w([6,1.5,16],[1.5,3,1.5]),
        ],
        pads: [{ p: [0,0,0], s: [5,0.1,5], speed: 0 }],
        teleport: { x: 28, z: 28 },
        difficulty: 3, recommendedPlayers: '2-6',
        spawnPoints: [
          { x: -14, z: -14 }, { x: 14, z: -14 },
          { x: -14, z: 14 }, { x: 14, z: 14 },
          { x: -8, z: 0 }, { x: 8, z: 0 },
          { x: 0, z: -8 }, { x: 0, z: 8 },
        ],
      }, 2, 1.4);
      m.teleport = { x: s(14,2), z: s(14,2) };
      m.recommendedPlayers = '4-8';
      return m;
    })());

    this._add('dojo', (() => {
      const m = sc({
        name: 'Dojo', desc: 'Symmetrical battle arena with jump pads',
        nameJa: 'ドージョー', descJa: 'ジャンプパッドのある対称的なバトルアリーナ',
        size: 36, wallHeight: 3, wallThick: 0.5,
        bg: 0x0a0806, fogNear: 20, fogFar: 40,
        wallColor: 0x1a1210, floorColor: 0x0d0a08,
        edgeColors: [0xff4444, 0xff8888], gridColor: 0xff4444,
        ambientColor: 0x110808, ambientIntensity: 0.4,
        dirColor: 0xff6644, dirIntensity: 0.8,
        rimColors: [0xff4444, 0xff8888, 0xff4444, 0xff8888],
        walls: [
          w([-5,1.5,-5],[2,3,2]),w([5,1.5,-5],[2,3,2]),
          w([-5,1.5,5],[2,3,2]),w([5,1.5,5],[2,3,2]),
          w([-10,2,0],[0.5,4,0.5]),w([10,2,0],[0.5,4,0.5]),
          w([0,2,-10],[0.5,4,0.5]),w([0,2,10],[0.5,4,0.5]),
          w([-14,1.5,-6],[1,3,1]),w([14,1.5,6],[1,3,1]),
          w([6,1.5,-14],[1,3,1]),w([-6,1.5,14],[1,3,1]),
          w([-16,1.5,0],[0.5,4,0.5]),w([16,1.5,0],[0.5,4,0.5]),
        ],
        pads: [
          { p: [-8,0,0], s: [1.5,0.1,1.5], speed: 2.2 },
          { p: [8,0,0], s: [1.5,0.1,1.5], speed: 2.2 },
        ],
        difficulty: 2, recommendedPlayers: '2-6',
        spawnPoints: [
          { x: -14, z: -14 }, { x: 14, z: -14 },
          { x: -14, z: 14 }, { x: 14, z: 14 },
          { x: -8, z: 0 }, { x: 8, z: 0 },
          { x: 0, z: -8 }, { x: 0, z: 8 },
        ],
      }, 2, 1.4);
      m.recommendedPlayers = '4-8';
      return m;
    })());

    this._add('twilight', (() => {
      const m = sc({
        name: 'Twilight', desc: 'Low visibility neon haze maze',
        nameJa: 'トワイライト', descJa: '視界の悪いネオン煙霧迷路',
        size: 44, wallHeight: 3, wallThick: 0.5,
        bg: 0x06000a, fogNear: 12, fogFar: 28,
        wallColor: 0x160020, floorColor: 0x08000a,
        edgeColors: [0xff00ff, 0x8800ff], gridColor: 0xcc00ff,
        ambientColor: 0x110022, ambientIntensity: 0.3,
        dirColor: 0xaa44ff, dirIntensity: 0.6,
        rimColors: [0xff00ff, 0x8800ff, 0xff00ff, 0x8800ff],
        walls: [
          w([-9,1.5,-9],[2,3,2]),w([9,1.5,-9],[2,3,2]),
          w([-9,1.5,9],[2,3,2]),w([9,1.5,9],[2,3,2]),
          w([-3,1.5,-3],[1.5,3,1.5]),w([3,1.5,3],[1.5,3,1.5]),
          w([-3,1.5,3],[1.5,3,1.5]),w([3,1.5,-3],[1.5,3,1.5]),
          w([-15,1.5,-15],[1.5,3,1.5]),w([15,1.5,15],[1.5,3,1.5]),
          w([-15,1.5,15],[1.5,3,1.5]),w([15,1.5,-15],[1.5,3,1.5]),
        ],
        difficulty: 5, recommendedPlayers: '4-8',
        spawnPoints: [
          { x: -16, z: -16 }, { x: 16, z: -16 },
          { x: -16, z: 16 }, { x: 16, z: 16 },
          { x: -10, z: 0 }, { x: 10, z: 0 },
          { x: 0, z: -10 }, { x: 0, z: 10 },
        ],
      }, 2, 1.4);
      m.recommendedPlayers = '4-10';
      return m;
    })());
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

  metaLines(id) {
    const m = this.get(id);
    if (!m) return [];
    return [
      `Recommended`,
      `${m.recommendedPlayers} Players`,
      ``,
      `Difficulty`,
      `${'★'.repeat(m.difficulty)}${'☆'.repeat(5 - m.difficulty)}`,
    ];
  }
}

const MAP_REGISTRY = new MapRegistry();

const MAPS = {};
MAP_REGISTRY.getAll().forEach(id => {
  MAPS[id] = MAP_REGISTRY.get(id);
});
