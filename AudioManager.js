/* ============================================================
   NEON ARENA - Audio再生、カテゴリ別音量、空間オーディオ
   サウンド管理：Web Audio APIを使用した効果音・BGMの再生制御
   ============================================================ */

/**
 * オーディオ管理クラス
 * Web Audio API を使用し、カテゴリ別音量制御・空間オーディオ（3D定位）・
 * ビーム持続音管理などを提供する
 */
class AudioManager {
  constructor() {
    this.ctx = null;                    // AudioContext
    this.masterGain = null;             // マスターゲインノード
    this.categories = {};               // カテゴリ別ゲインノード
    this._listenerPos = { x: 0, z: 0 };// リスナー位置
    this._initialized = false;
    this._noiseBuffer = null;           // ノイズバッファ（ビーム・効果音用）
    this._activeBeamHums = new Map();   // アクティブなビーム持続音
    this._volume = { master: 1, ui: 0.7, weapon: 0.6, explosion: 0.8, player: 0.6, environment: 0.5, voice: 0.7, bgm: 0.7 };
    this._savedVolume = null;           // 一時保存音量（ミュート用）
  }

  /**
   * AudioContextを初期化
   * マスターゲイン・カテゴリ別ゲイン・ノイズバッファを生成
   */
  _init() {
    if (this._initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1;
      this.masterGain.connect(this.ctx.destination);

      for (const cat of ['master', 'ui', 'weapon', 'explosion', 'player', 'environment', 'voice', 'bgm']) {
        const gain = this.ctx.createGain();
        gain.gain.value = this._volume[cat] || 1;
        gain.connect(this.masterGain);
        this.categories[cat] = gain;
      }

      /* ホワイトノイズバッファを生成（ビーム・衝撃音用） */
      const bufSize = this.ctx.sampleRate;
      this._noiseBuffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = this._noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

      this._initialized = true;
      this._resumeOnInteraction();
    } catch (e) {
      console.warn('[Audio] Web Audio API not available:', e);
    }
  }

  /**
   * ユーザー操作時にAudioContextを再開
   * （ブラウザの自動再生ポリシー対策）
   */
  _resumeOnInteraction() {
    const resume = () => {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      document.removeEventListener('click', resume);
      document.removeEventListener('keydown', resume);
      document.removeEventListener('touchstart', resume);
    };
    document.addEventListener('click', resume);
    document.addEventListener('keydown', resume);
    document.addEventListener('touchstart', resume);
  }

  /**
   * カテゴリ別音量を設定
   * @param {string} category - カテゴリ名
   * @param {number} value - 音量（0〜1）
   */
  setVolume(category, value) {
    this._volume[category] = value;
    if (this._initialized) {
      if (category === 'master' && this.masterGain) {
        this.masterGain.gain.value = value;
      } else if (this.categories[category]) {
        this.categories[category].gain.value = value;
      }
    }
  }

  /**
   * カテゴリ別音量を取得
   * @param {string} category - カテゴリ名
   * @returns {number} 音量（0〜1）
   */
  getVolume(category) {
    return this._volume[category] || 1;
  }

  /**
   * リスナー位置を更新（3Dオーディオ定位用）
   * @param {THREE.Vector3} pos - 新しい位置
   */
  updateListener(pos) {
    if (!this._initialized || !this.ctx.listener) return;
    this._listenerPos.x = pos.x;
    this._listenerPos.z = pos.z;
    if (this.ctx.listener.positionX) {
      this.ctx.listener.positionX.value = pos.x;
      this.ctx.listener.positionY.value = 1;
      this.ctx.listener.positionZ.value = pos.z;
    }
  }

  /**
   * 効果音を再生
   * SoundRegistryの定義に基づき、3D定位・カテゴリ別音量を適用
   * @param {string} id - サウンドID
   * @param {Object} options - オプション（volume, position, category等）
   * @returns {Object|null} 再生制御オブジェクト
   */
  play(id, options = {}) {
    this._init();
    if (!this._initialized) return null;
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});

    const def = SOUNDS[id];
    if (!def) return null;

    const catName = def.category || 'ui';
    let catOutput = this.categories[catName];
    if (!catOutput) catOutput = this.categories.ui;

    const volScale = options.volume !== undefined ? options.volume : 1;
    const now = this.ctx.currentTime;
    const dur = def.duration || 0.1;

    let panner = null;
    let spatialOutput = catOutput;

    if (options.position) {
      panner = this.ctx.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'linear';
      panner.refDistance = 5;
      panner.maxDistance = 40;
      panner.rolloffFactor = 1.2;
      panner.positionX.value = options.position.x;
      panner.positionY.value = 0.5;
      panner.positionZ.value = options.position.z;
      panner.connect(catOutput);
      spatialOutput = panner;
    }

    if (def.create) {
      try {
        const result = def.create(this.ctx, spatialOutput, { ...options, volScale, now, dur, noiseBuf: this._noiseBuffer });
        if (options.position && panner) {
          const dx = options.position.x - this._listenerPos.x;
          const dz = options.position.z - this._listenerPos.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist > 40) {
            if (result && result.stop) setTimeout(() => result.stop(), 10);
            return null;
          }
        }
        return result || null;
      } catch (e) {
        console.warn('[Audio] Error playing', id, e);
        return null;
      }
    }

    return null;
  }

  /**
   * 武器の発射音を再生
   * @param {string} weaponId - 武器ID
   * @param {Object} options - 再生オプション
   * @returns {Object|null} 再生制御オブジェクト
   */
  playWeapon(weaponId, options = {}) {
    const wp = WEAPONS[weaponId];
    const soundId = wp ? wp.sound : weaponId;
    return this.play(soundId, { ...options, category: 'weapon' });
  }

  /**
   * ビームの持続音を開始
   * @param {string} weaponId - 武器ID
   * @param {Object} options - オプション（position等）
   */
  startBeamHum(weaponId, options = {}) {
    if (this._activeBeamHums.has(weaponId)) return;
    this._init();
    if (!this._initialized) return;

    const def = SOUNDS[weaponId + '_hum'];
    if (!def) return;

    const catOutput = this.categories.weapon;
    const panner = this.ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'linear';
    panner.refDistance = 5;
    panner.maxDistance = 40;
    panner.rolloffFactor = 1.2;
    if (options.position) {
      panner.positionX.value = options.position.x;
      panner.positionY.value = 0.5;
      panner.positionZ.value = options.position.z;
    }
    panner.connect(catOutput);

    const result = def.create(this.ctx, panner, {
      now: this.ctx.currentTime,
      noiseBuf: this._noiseBuffer,
      volScale: this._volume.weapon
    });

    if (result) {
      this._activeBeamHums.set(weaponId, { ...result, panner, updatePos: options.position });
    }
  }

  /**
   * ビーム持続音の位置を更新
   * @param {string} weaponId - 武器ID
   * @param {THREE.Vector3} pos - 新しい位置
   */
  updateBeamHumPos(weaponId, pos) {
    const hum = this._activeBeamHums.get(weaponId);
    if (hum && hum.panner) {
      hum.panner.positionX.value = pos.x;
      hum.panner.positionZ.value = pos.z;
    }
  }

  /**
   * ビーム持続音を停止
   * @param {string} weaponId - 武器ID
   */
  stopBeamHum(weaponId) {
    const hum = this._activeBeamHums.get(weaponId);
    if (hum) {
      if (hum.stop) hum.stop();
      if (hum.panner) { try { hum.panner.disconnect(); } catch (e) {} }
      this._activeBeamHums.delete(weaponId);
    }
  }

  /**
   * 全てのビーム持続音を停止
   */
  stopAllBeamHums() {
    this._activeBeamHums.forEach((hum, id) => {
      if (hum.stop) hum.stop();
      if (hum.panner) { try { hum.panner.disconnect(); } catch (e) {} }
    });
    this._activeBeamHums.clear();
  }

  /**
   * AudioManagerを破棄
   * AudioContextを閉じてリソースを解放
   */
  destroy() {
    this.stopAllBeamHums();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this._initialized = false;
  }
}

const AUDIO = new AudioManager();
