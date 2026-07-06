// ============================================================
// NEON ARENA - 武器マネージャー
// プレイヤーの武器選択・切り替え・お気に入り管理
// ============================================================

class WeaponManager {
  constructor(registry) {
    this.registry = registry || WEAPON_REGISTRY;
    this._current = this.registry.getAll()[0] || 'pistol';  // 現在選択中の武器ID
    this._prevWeapon = this._current;                         // 直前の武器ID（ロールバック用）
    this._favorites = new Set();                              // お気に入り武器IDセット
    this._filters = {};                                       // フィルタ設定
  }

  /** 現在選択中の武器ID */
  get current() { return this._current; }
  /** 現在選択中の武器定義 */
  get currentDef() { return this.registry.get(this._current); }
  /** 現在選択中の武器ID（エイリアス） */
  get currentId() { return this._current; }

  /**
   * 次の武器に切り替え
   * @returns {string} 新しい武器ID
   */
  next() {
    this._prevWeapon = this._current;
    const all = this.registry.getAll();
    const idx = all.indexOf(this._current);
    this._current = idx < all.length - 1 ? all[idx + 1] : all[0];
    return this._current;
  }

  /**
   * 前の武器に切り替え
   * @returns {string} 新しい武器ID
   */
  prev() {
    this._prevWeapon = this._current;
    const all = this.registry.getAll();
    const idx = all.indexOf(this._current);
    this._current = idx > 0 ? all[idx - 1] : all[all.length - 1];
    return this._current;
  }

  /**
   * 指定武器を選択
   * @param {string} id - 武器ID
   * @returns {boolean} 成功可否
   */
  set(id) {
    if (this.registry.get(id)) {
      this._prevWeapon = this._current;
      this._current = id;
      return true;
    }
    return false;
  }

  /** 直前の武器に戻す */
  rollback() {
    this._current = this._prevWeapon;
  }

  /**
   * 武器定義を取得
   * @param {string} id - 武器ID
   * @returns {Object|null} 武器定義
   */
  getWeapon(id) { return this.registry.get(id); }

  /**
   * 全武器IDを取得
   * @returns {string[]} 武器ID配列
   */
  getAll() { return this.registry.getAll(); }

  /**
   * 武器数を取得
   * @returns {number} 武器数
   */
  count() { return this.registry.count(); }

  /**
   * ビーム武器か判定
   * @param {string} id - 武器ID（省略時は現在選択中）
   * @returns {boolean} ビーム武器ならtrue
   */
  isBeamWeapon(id) {
    const w = this.registry.get(id || this._current);
    return w && w.weaponType === 'beam';
  }

  /* === NEW: Type checks === */
  /**
   * エネルギー武器か判定
   * @param {string} id - 武器ID
   * @returns {boolean} エネルギー武器ならtrue
   */
  isEnergyWeapon(id) {
    const w = this.registry.get(id || this._current);
    return w && w.weaponType === 'energy';
  }

  /**
   * 爆発武器か判定
   * @param {string} id - 武器ID
   * @returns {boolean} 爆発武器ならtrue
   */
  isExplosiveWeapon(id) {
    const w = this.registry.get(id || this._current);
    return w && (w.weaponType === 'explosive' || w.explosive);
  }

  /**
   * 召喚武器か判定
   * @param {string} id - 武器ID
   * @returns {boolean} 召喚武器ならtrue
   */
  isSummonWeapon(id) {
    const w = this.registry.get(id || this._current);
    return w && w.weaponType === 'summon';
  }

  /**
   * 特殊武器か判定
   * @param {string} id - 武器ID
   * @returns {boolean} 特殊武器ならtrue
   */
  isSpecialWeapon(id) {
    const w = this.registry.get(id || this._current);
    return w && w.weaponType === 'special';
  }

  /* === NEW: Category operations === */
  /** カテゴリ一覧を取得 */
  getCategories() { return this.registry.getCategories(); }

  /**
   * カテゴリで武器を絞り込み
   * @param {string} cat - カテゴリ名
   * @returns {string[]} 武器ID配列
   */
  getByCategory(cat) { return this.registry.getByCategory(cat); }

  /**
   * 武器タイプで絞り込み
   * @param {string} type - 武器タイプ
   * @returns {string[]} 武器ID配列
   */
  getByType(type) { return this.registry.getByType(type); }

  /* === NEW: Search === */
  /**
   * キーワード検索
   * @param {string} query - 検索クエリ
   * @returns {string[]} マッチする武器ID配列
   */
  search(query) { return this.registry.search(query); }

  /* === NEW: Sort === */
  /** ダメージ順ソート */
  sortByDamage() { return this.registry.sortByDamage(); }
  /** 連射速度順ソート */
  sortByFireRate() { return this.registry.sortByFireRate(); }
  /** 射程順ソート */
  sortByRange() { return this.registry.sortByRange(); }

  /* === NEW: Favorites === */
  /**
   * お気に入り切り替え
   * @param {string} id - 武器ID
   * @returns {boolean} お気に入り状態（true=追加、false=削除）
   */
  toggleFavorite(id) {
    if (this._favorites.has(id)) { this._favorites.delete(id); return false; }
    this._favorites.add(id); return true;
  }

  /**
   * お気に入りか判定
   * @param {string} id - 武器ID
   * @returns {boolean} お気に入りならtrue
   */
  isFavorite(id) { return this._favorites.has(id); }

  /**
   * お気に入り武器一覧を取得
   * @returns {string[]} お気に入り武器ID配列
   */
  getFavorites() { return Array.from(this._favorites); }
}
