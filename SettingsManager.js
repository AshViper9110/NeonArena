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

  get(key) {
    return this._settings[key] !== undefined ? this._settings[key] : SettingsManager.DEFAULTS[key];
  }

  set(key, value) {
    const old = this._settings[key];
    if (old === value) return;
    this._settings[key] = value;
    this._save();
    this._notify(key, value, old);
  }

  setMultiple(updates) {
    for (const [key, value] of Object.entries(updates)) {
      this._settings[key] = value;
    }
    this._save();
    for (const key of Object.keys(updates)) {
      this._notify(key, this._settings[key]);
    }
  }

  reset() {
    this._settings = {};
    this._save();
    for (const key of Object.keys(SettingsManager.DEFAULTS)) {
      this._notify(key, SettingsManager.DEFAULTS[key]);
    }
  }

  getAll() {
    return { ...SettingsManager.DEFAULTS, ...this._settings };
  }

  on(key, callback) {
    if (!this._listeners[key]) this._listeners[key] = [];
    this._listeners[key].push(callback);
    return () => this.off(key, callback);
  }

  off(key, callback) {
    if (!this._listeners[key]) return;
    const idx = this._listeners[key].indexOf(callback);
    if (idx >= 0) this._listeners[key].splice(idx, 1);
  }

  _notify(key, value, old) {
    if (!this._listeners[key]) return;
    for (const cb of this._listeners[key]) {
      try { cb(value, old); } catch (e) { console.warn('[Settings] listener error:', e); }
    }
  }

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

  _save() {
    try {
      localStorage.setItem(SettingsManager.STORAGE_KEY, JSON.stringify(this._settings));
    } catch (e) {
      console.warn('[Settings] save failed:', e);
    }
  }
}

var SETTINGS = new SettingsManager();
