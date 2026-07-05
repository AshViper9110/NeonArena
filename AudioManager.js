class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.categories = {};
    this._listenerPos = { x: 0, z: 0 };
    this._initialized = false;
    this._noiseBuffer = null;
    this._activeBeamHums = new Map();
    this._volume = { master: 1, ui: 0.7, weapon: 0.6, explosion: 0.8, player: 0.6, environment: 0.5, voice: 0.7 };
    this._savedVolume = null;
  }

  _init() {
    if (this._initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1;
      this.masterGain.connect(this.ctx.destination);

      for (const cat of ['master', 'ui', 'weapon', 'explosion', 'player', 'environment', 'voice']) {
        const gain = this.ctx.createGain();
        gain.gain.value = this._volume[cat] || 1;
        gain.connect(this.masterGain);
        this.categories[cat] = gain;
      }

      const bufSize = this.ctx.sampleRate;
      this._noiseBuffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = this._noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

      this._initialized = true;
    } catch (e) {
      console.warn('[Audio] Web Audio API not available:', e);
    }
  }

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

  getVolume(category) {
    return this._volume[category] || 1;
  }

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

  play(id, options = {}) {
    this._init();
    if (!this._initialized) return null;
    if (this.ctx.state === 'suspended') this.ctx.resume();

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

  playWeapon(weaponId, options = {}) {
    const wp = WEAPONS[weaponId];
    const soundId = wp ? wp.sound : weaponId;
    return this.play(soundId, { ...options, category: 'weapon' });
  }

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

  updateBeamHumPos(weaponId, pos) {
    const hum = this._activeBeamHums.get(weaponId);
    if (hum && hum.panner) {
      hum.panner.positionX.value = pos.x;
      hum.panner.positionZ.value = pos.z;
    }
  }

  stopBeamHum(weaponId) {
    const hum = this._activeBeamHums.get(weaponId);
    if (hum) {
      if (hum.stop) hum.stop();
      if (hum.panner) { try { hum.panner.disconnect(); } catch (e) {} }
      this._activeBeamHums.delete(weaponId);
    }
  }

  stopAllBeamHums() {
    this._activeBeamHums.forEach((hum, id) => {
      if (hum.stop) hum.stop();
      if (hum.panner) { try { hum.panner.disconnect(); } catch (e) {} }
    });
    this._activeBeamHums.clear();
  }

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
