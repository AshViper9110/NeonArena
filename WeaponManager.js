class WeaponManager {
  constructor(registry) {
    this.registry = registry || WEAPON_REGISTRY;
    this._current = this.registry.getAll()[0] || 'pistol';
    this._prevWeapon = this._current;
    this._favorites = new Set();
    this._filters = {};
  }

  get current() { return this._current; }
  get currentDef() { return this.registry.get(this._current); }
  get currentId() { return this._current; }

  next() {
    this._prevWeapon = this._current;
    const all = this.registry.getAll();
    const idx = all.indexOf(this._current);
    this._current = idx < all.length - 1 ? all[idx + 1] : all[0];
    return this._current;
  }

  prev() {
    this._prevWeapon = this._current;
    const all = this.registry.getAll();
    const idx = all.indexOf(this._current);
    this._current = idx > 0 ? all[idx - 1] : all[all.length - 1];
    return this._current;
  }

  set(id) {
    if (this.registry.get(id)) {
      this._prevWeapon = this._current;
      this._current = id;
      return true;
    }
    return false;
  }

  rollback() {
    this._current = this._prevWeapon;
  }

  getWeapon(id) { return this.registry.get(id); }

  getAll() { return this.registry.getAll(); }

  count() { return this.registry.count(); }

  isBeamWeapon(id) {
    const w = this.registry.get(id || this._current);
    return w && w.weaponType === 'beam';
  }

  /* === NEW: Type checks === */
  isEnergyWeapon(id) {
    const w = this.registry.get(id || this._current);
    return w && w.weaponType === 'energy';
  }

  isExplosiveWeapon(id) {
    const w = this.registry.get(id || this._current);
    return w && (w.weaponType === 'explosive' || w.explosive);
  }

  isSummonWeapon(id) {
    const w = this.registry.get(id || this._current);
    return w && w.weaponType === 'summon';
  }

  isSpecialWeapon(id) {
    const w = this.registry.get(id || this._current);
    return w && w.weaponType === 'special';
  }

  /* === NEW: Category operations === */
  getCategories() { return this.registry.getCategories(); }

  getByCategory(cat) { return this.registry.getByCategory(cat); }

  getByType(type) { return this.registry.getByType(type); }

  /* === NEW: Search === */
  search(query) { return this.registry.search(query); }

  /* === NEW: Sort === */
  sortByDamage() { return this.registry.sortByDamage(); }
  sortByFireRate() { return this.registry.sortByFireRate(); }
  sortByRange() { return this.registry.sortByRange(); }

  /* === NEW: Favorites === */
  toggleFavorite(id) {
    if (this._favorites.has(id)) { this._favorites.delete(id); return false; }
    this._favorites.add(id); return true;
  }
  isFavorite(id) { return this._favorites.has(id); }
  getFavorites() { return Array.from(this._favorites); }
}
