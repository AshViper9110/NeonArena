class KillFeedManager {
  constructor() {
    this.container = document.getElementById('kill-feed');
    this.entries = [];
    this.maxEntries = 5;
    this.displayTime = 5000;
    this.fadeOutTime = 500;
    this.weaponIcons = {};
  }

  setWeaponIcons(map) {
    this.weaponIcons = map;
  }

  addEntry(killerName, victimName, weaponId) {
    const icon = this._getWeaponIcon(weaponId);

    const el = document.createElement('div');
    el.className = 'kf-entry';

    const iconSpan = document.createElement('span');
    iconSpan.className = 'kf-icon';
    iconSpan.textContent = icon;

    const killerSpan = document.createElement('span');
    killerSpan.className = 'kf-killer';
    killerSpan.textContent = killerName;

    const arrowSpan = document.createElement('span');
    arrowSpan.className = 'kf-arrow';
    arrowSpan.textContent = '→';

    const victimSpan = document.createElement('span');
    victimSpan.className = 'kf-victim';
    victimSpan.textContent = victimName;

    el.appendChild(killerSpan);
    el.appendChild(iconSpan);
    el.appendChild(arrowSpan);
    el.appendChild(victimSpan);

    this._prependEntry(el);
  }

  addSystemMessage(text, color) {
    const el = document.createElement('div');
    el.className = 'kf-entry kf-system';
    el.textContent = text;
    if (color) el.style.color = color;
    this._prependEntry(el);
  }

  _prependEntry(el) {
    if (this.entries.length >= this.maxEntries) {
      const oldest = this.entries.shift();
      if (oldest.parentNode) oldest.parentNode.removeChild(oldest);
    }

    this.container.insertBefore(el, this.container.firstChild);
    this.entries.push(el);

    el.classList.add('kf-enter');
    requestAnimationFrame(() => {
      el.classList.add('kf-visible');
    });

    setTimeout(() => {
      el.classList.remove('kf-visible');
      el.classList.add('kf-fadeout');
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
        const idx = this.entries.indexOf(el);
        if (idx >= 0) this.entries.splice(idx, 1);
      }, this.fadeOutTime);
    }, this.displayTime);
  }

  clear() {
    this.entries.forEach(el => {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    this.entries = [];
    this.container.innerHTML = '';
  }

  _getWeaponIcon(weaponId) {
    if (this.weaponIcons[weaponId]) return this.weaponIcons[weaponId];

    const wp = WEAPONS[weaponId] || WEAPON_REGISTRY.get(weaponId);
    if (!wp) return '🔫';

    if (wp.weaponType === 'beam') return '⚡';
    if (wp.explosive) {
      const name = (wp.displayName || weaponId).toLowerCase();
      if (name.includes('grenade')) return '💣';
      if (name.includes('rocket')) return '🚀';
      return '💥';
    }
    if (wp.category === 'Shotgun' || wp.fireMode === 'Shotgun') return '🔫';
    if (wp.category === 'Sniper Rifle') return '🎯';
    if (wp.weaponType === 'energy') return '⚡';
    if (wp.weaponType === 'special') return '✦';
    if (wp.weaponType === 'summon') return '🛸';
    if (wp.category === 'Experimental') return '✦';
    if (wp.category === 'Drone') return '🛸';
    return '🔫';
  }
}
