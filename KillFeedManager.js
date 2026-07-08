/* ============================================================
   NEON ARENA - キルフィード表示
   キルログを画面上部に時系列で表示するUI管理
   ============================================================ */

/**
 * キルフィード管理クラス
 * キル/デスの情報をDOM要素として画面右上に表示する
 * 最新のエントリほど上に表示され、古いものはフェードアウトする
 */
class KillFeedManager {
  constructor() {
    this.container = document.getElementById('kill-feed');
    this.entries = [];           // 表示中のエントリDOM配列
    this.maxEntries = 5;         // 最大表示数
    this.displayTime = 5000;     // 表示持続時間（ms）
    this.fadeOutTime = 500;      // フェードアウト時間（ms）
    this.weaponIcons = {};       // 武器ID -> アイコン文字列
  }

  /**
   * 武器アイコンマップを設定
   * @param {Object} map - 武器IDをキー、アイコン文字列を値とするオブジェクト
   */
  setWeaponIcons(map) {
    this.weaponIcons = map;
  }

  /**
   * キルエントリを追加
   * @param {string} killerName - キルしたプレイヤー名
   * @param {string} victimName - 倒されたプレイヤー名
   * @param {string} weaponId - 使用武器ID
   */
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

  /**
   * システムメッセージをキルフィードに追加
   * @param {string} text - 表示テキスト
   * @param {string} color - テキスト色（CSS指定）
   */
  addSystemMessage(text, color) {
    const el = document.createElement('div');
    el.className = 'kf-entry kf-system';
    el.textContent = text;
    if (color) el.style.color = color;
    this._prependEntry(el);
  }

  /**
   * エントリをリストの先頭に追加し、上限を超えた古いものを削除
   * アニメーションクラスを付与して表示・フェードアウトを制御
   * @param {HTMLElement} el - 追加する要素
   */
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

  /**
   * 全てのエントリをクリア
   */
  clear() {
    this.entries.forEach(el => {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    this.entries = [];
    this.container.innerHTML = '';
  }

  /**
   * 武器IDから表示アイコンを取得
   * カスタムマップ → 武器データ → デフォルトの順で解決
   * @param {string} weaponId - 武器ID
   * @returns {string} アイコン文字（絵文字）
   */
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
