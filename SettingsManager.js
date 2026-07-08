/* ============================================================
   NEON ARENA - 設定保存・読込
   localStorageを使用した永続設定の管理
   ============================================================ */

/**
 * 設定管理クラス
 * ゲーム設定をlocalStorageに保存・読み込みする
 * デフォルト定義・変更通知・一括更新をサポート
 */
class SettingsManager {
  static STORAGE_KEY = 'NeonArenaSettings';

  static DEFAULTS = {
    graphicsQuality: 'high',
    resolutionScale: 100,
    shadows: true,
    postEffects: true,
    antialias: true,
    fpsLimit: 0,

    masterVolume: 80,
    bgmVolume: 70,
    seVolume: 100,
    voiceVolume: 80,

    mouseSensitivity: 1.0,
    invertY: false,
    fov: 65,
    aimSensitivityMultiplier: 0.5,

    mobileSensitivity: 1.0,
    adsSensitivity: 0.5,
    joystickSize: 130,
    joystickOpacity: 100,
    buttonSize: 100,
    invertLookX: false,
    invertLookYMobile: false,

    language: 'ja',
    uiScale: 1.0,
    showDamage: true,
    showFps: false,
    showPing: false,
    crosshairSize: 1.0,
    crosshairColor: '#00f0ff',

    mobileButtonLayout: {
      fire: { x: 85, y: 85, size: 100, opacity: 100 },
      dash: { x: 15, y: 78, size: 100, opacity: 100 },
      reload: { x: 15, y: 58, size: 100, opacity: 100 },
    },
  };

  constructor() {
    this._settings = {};
    this._listeners = {};
    this._load();
  }

  /**
   * 設定値を取得（未設定の場合はデフォルト値を返す）
   * @param {string} key - 設定キー
   * @returns {*} 設定値
   */
  get(key) {
    return this._settings[key] !== undefined ? this._settings[key] : SettingsManager.DEFAULTS[key];
  }

  /**
   * 設定値を変更し、保存と通知を行う
   * @param {string} key - 設定キー
   * @param {*} value - 新しい値
   */
  set(key, value) {
    const old = this._settings[key];
    if (old === value) return;
    this._settings[key] = value;
    this._save();
    this._notify(key, value, old);
  }

  /**
   * 複数の設定を一括更新
   * @param {Object} updates - キーと値のオブジェクト
   */
  setMultiple(updates) {
    for (const [key, value] of Object.entries(updates)) {
      this._settings[key] = value;
    }
    this._save();
    for (const key of Object.keys(updates)) {
      this._notify(key, this._settings[key]);
    }
  }

  /**
   * 全設定をデフォルトにリセット
   */
  reset() {
    this._settings = {};
    this._save();
    for (const key of Object.keys(SettingsManager.DEFAULTS)) {
      this._notify(key, SettingsManager.DEFAULTS[key]);
    }
  }

  /**
   * 全ての設定値を取得（デフォルト値で未設定を補完）
   * @returns {Object} 全設定
   */
  getAll() {
    return { ...SettingsManager.DEFAULTS, ...this._settings };
  }

  /**
   * 設定変更のリスナーを登録
   * @param {string} key - 監視する設定キー
   * @param {Function} callback - 変更時コールバック
   * @returns {Function} 登録解除用関数
   */
  on(key, callback) {
    if (!this._listeners[key]) this._listeners[key] = [];
    this._listeners[key].push(callback);
    return () => this.off(key, callback);
  }

  /**
   * 設定変更のリスナーを削除
   * @param {string} key - 設定キー
   * @param {Function} callback - 削除するコールバック
   */
  off(key, callback) {
    if (!this._listeners[key]) return;
    const idx = this._listeners[key].indexOf(callback);
    if (idx >= 0) this._listeners[key].splice(idx, 1);
  }

  /**
   * リスナーに変更を通知
   * @param {string} key - 変更されたキー
   * @param {*} value - 新しい値
   * @param {*} old - 古い値
   */
  _notify(key, value, old) {
    if (!this._listeners[key]) return;
    for (const cb of this._listeners[key]) {
      try { cb(value, old); } catch (e) { console.warn('[Settings] listener error:', e); }
    }
  }

  /**
   * localStorageから設定を読み込み
   */
  _load() {
    try {
      const raw = localStorage.getItem(SettingsManager.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this._settings = { ...SettingsManager.DEFAULTS, ...parsed };
      } else {
        this._settings = { ...SettingsManager.DEFAULTS };
      }
    } catch (e) {
      this._settings = { ...SettingsManager.DEFAULTS };
    }
  }

  /**
   * localStorageに設定を保存
   */
  _save() {
    try {
      localStorage.setItem(SettingsManager.STORAGE_KEY, JSON.stringify(this._settings));
    } catch (e) {
      console.warn('[Settings] save failed:', e);
    }
  }
}

var SETTINGS = new SettingsManager();
