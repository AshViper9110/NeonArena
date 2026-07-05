function _osc(ctx, freq, type) {
  const o = ctx.createOscillator();
  o.type = type || 'sine';
  o.frequency.value = freq;
  return o;
}

function _noiseSrc(ctx, buf) {
  const s = ctx.createBufferSource();
  s.buffer = buf;
  s.loop = true;
  return s;
}

function _gain(ctx, val) {
  const g = ctx.createGain();
  g.gain.value = val;
  return g;
}

function _filter(ctx, type, freq, Q) {
  const f = ctx.createBiquadFilter();
  f.type = type || 'lowpass';
  f.frequency.value = freq || 1000;
  if (Q !== undefined) f.Q.value = Q;
  return f;
}

function _scheduleGain(gainParam, now, attack, hold, release, peak) {
  const startVal = 0;
  gainParam.setValueAtTime(startVal, now);
  gainParam.linearRampToValueAtTime(peak, now + attack);
  gainParam.setValueAtTime(peak, now + attack + hold);
  gainParam.linearRampToValueAtTime(0, now + attack + hold + release);
}

function _safeStop(src, after) {
  if (!src) return;
  try {
    if (after) {
      const t = src.context.currentTime + after;
      src.stop(t);
    } else {
      src.stop();
    }
  } catch (e) {}
}

const _tone = (ctx, out, freq, type, dur, vol, now) => {
  const o = _osc(ctx, freq, type);
  const g = _gain(ctx, 0);
  o.connect(g);
  g.connect(out);
  _scheduleGain(g.gain, now, 0.002, dur * 0.3, dur * 0.7, vol);
  o.start(now);
  _safeStop(o, dur);
  return { stop: () => { try { o.stop(); o.disconnect(); g.disconnect(); } catch(e) {} } };
};

const _noise = (ctx, out, dur, vol, now, noiseBuf) => {
  const n = _noiseSrc(ctx, noiseBuf);
  const g = _gain(ctx, 0);
  n.connect(g);
  g.connect(out);
  _scheduleGain(g.gain, now, 0.002, dur * 0.2, dur * 0.78, vol);
  n.start(now);
  _safeStop(n, dur);
  return { stop: () => { try { n.stop(); n.disconnect(); g.disconnect(); } catch(e) {} } };
};

const _oscNoise = (ctx, out, freq, type, dur, vol, now, noiseBuf, mix) => {
  const o = _osc(ctx, freq, type);
  const og = _gain(ctx, 0);
  o.connect(og);
  og.connect(out);
  const scheduleO = (g) => _scheduleGain(g, now, 0.002, dur * 0.3, dur * 0.7, vol * (1 - (mix || 0.3)));
  scheduleO(og.gain);
  o.start(now);
  _safeStop(o, dur);

  let noiseCleanup = null;
  if (mix > 0 && noiseBuf) {
    const n = _noiseSrc(ctx, noiseBuf);
    const ng = _gain(ctx, 0);
    n.connect(ng);
    ng.connect(out);
    _scheduleGain(ng.gain, now, 0.001, dur * 0.2, dur * 0.79, vol * mix);
    n.start(now);
    _safeStop(n, dur);
    noiseCleanup = { stop: () => { try { n.stop(); n.disconnect(); ng.disconnect(); } catch(e) {} } };
  }

  return {
    stop: () => {
      try { o.stop(); o.disconnect(); og.disconnect(); } catch(e) {}
      if (noiseCleanup) noiseCleanup.stop();
    }
  };
};

const SOUNDS = {
  /* === UI === */
  ui_hover: {
    category: 'ui', duration: 0.04,
    create: (ctx, out, p) => _tone(ctx, out, 800, 'sine', 0.04, 0.08 * p.volScale, p.now),
  },
  ui_click: {
    category: 'ui', duration: 0.08,
    create: (ctx, out, p) => _tone(ctx, out, 600, 'sine', 0.08, 0.12 * p.volScale, p.now),
  },
  ui_ready: {
    category: 'ui', duration: 0.2,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const o = _osc(ctx, 400, 'sine');
      o.frequency.linearRampToValueAtTime(800, now + 0.15);
      const g = _gain(ctx, 0);
      o.connect(g); g.connect(out);
      _scheduleGain(g.gain, now, 0.02, 0.1, 0.08, 0.15 * v);
      o.start(now); _safeStop(o, 0.2);
      return { stop: () => { try { o.stop(); o.disconnect(); g.disconnect(); } catch(e) {} } };
    },
  },
  ui_start: {
    category: 'ui', duration: 0.5,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const o1 = _osc(ctx, 300, 'sawtooth');
      const o2 = _osc(ctx, 600, 'sine');
      const g = _gain(ctx, 0);
      o1.connect(g); o2.connect(g); g.connect(out);
      o1.frequency.linearRampToValueAtTime(800, now + 0.4);
      _scheduleGain(g.gain, now, 0.02, 0.35, 0.13, 0.2 * v);
      o1.start(now); o2.start(now);
      _safeStop(o1, 0.5); _safeStop(o2, 0.5);
      return { stop: () => { try { o1.stop(); o2.stop(); o1.disconnect(); o2.disconnect(); g.disconnect(); } catch(e) {} } };
    },
  },
  ui_map_change: {
    category: 'ui', duration: 0.15,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const o = _osc(ctx, 200, 'sine');
      o.frequency.linearRampToValueAtTime(600, now + 0.12);
      const g = _gain(ctx, 0);
      o.connect(g); g.connect(out);
      _scheduleGain(g.gain, now, 0.01, 0.08, 0.06, 0.1 * v);
      o.start(now); _safeStop(o, 0.15);
      return { stop: () => { try { o.stop(); o.disconnect(); g.disconnect(); } catch(e) {} } };
    },
  },
  ui_weapon_change: {
    category: 'ui', duration: 0.06,
    create: (ctx, out, p) => _tone(ctx, out, 500, 'sine', 0.06, 0.08 * p.volScale, p.now),
  },
  ui_copy: {
    category: 'ui', duration: 0.12,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const o = _osc(ctx, 1000, 'sine');
      const g = _gain(ctx, 0);
      o.connect(g); g.connect(out);
      _scheduleGain(g.gain, now, 0.002, 0.05, 0.068, 0.1 * v);
      o.start(now); _safeStop(o, 0.12);
      return { stop: () => { try { o.stop(); o.disconnect(); g.disconnect(); } catch(e) {} } };
    },
  },
  ui_result: {
    category: 'ui', duration: 0.8,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const notes = [523, 659, 784, 1047];
      const stops = [];
      notes.forEach((f, i) => {
        const o = _osc(ctx, f, 'sine');
        const g = _gain(ctx, 0);
        o.connect(g); g.connect(out);
        const t = now + i * 0.12;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.12 * v, t + 0.02);
        g.gain.linearRampToValueAtTime(0, t + 0.3);
        o.start(t); _safeStop(o, t + 0.35);
        stops.push({ stop: () => { try { o.stop(); o.disconnect(); g.disconnect(); } catch(e) {} } });
      });
      return { stop: () => stops.forEach(s => s.stop()) };
    },
  },

  /* === Weapon: Pistols === */
  pistol: {
    category: 'weapon', duration: 0.08,
    create: (ctx, out, p) => _oscNoise(ctx, out, 500, 'triangle', 0.08, 0.2 * p.volScale, p.now, p.noiseBuf, 0.2),
  },
  heavy_pistol: {
    category: 'weapon', duration: 0.1,
    create: (ctx, out, p) => _oscNoise(ctx, out, 250, 'sawtooth', 0.1, 0.25 * p.volScale, p.now, p.noiseBuf, 0.3),
  },
  machine_pistol: {
    category: 'weapon', duration: 0.05,
    create: (ctx, out, p) => _oscNoise(ctx, out, 550, 'triangle', 0.05, 0.15 * p.volScale, p.now, p.noiseBuf, 0.15),
  },
  revolver: {
    category: 'weapon', duration: 0.14,
    create: (ctx, out, p) => _oscNoise(ctx, out, 180, 'sawtooth', 0.14, 0.3 * p.volScale, p.now, p.noiseBuf, 0.4),
  },
  burst_pistol: {
    category: 'weapon', duration: 0.06,
    create: (ctx, out, p) => _oscNoise(ctx, out, 550, 'triangle', 0.06, 0.16 * p.volScale, p.now, p.noiseBuf, 0.18),
  },
  auto_pistol: {
    category: 'weapon', duration: 0.04,
    create: (ctx, out, p) => _oscNoise(ctx, out, 600, 'triangle', 0.04, 0.13 * p.volScale, p.now, p.noiseBuf, 0.14),
  },

  /* === Weapon: SMG === */
  smg: {
    category: 'weapon', duration: 0.05,
    create: (ctx, out, p) => _oscNoise(ctx, out, 650, 'triangle', 0.05, 0.14 * p.volScale, p.now, p.noiseBuf, 0.2),
  },
  compact_smg: {
    category: 'weapon', duration: 0.04,
    create: (ctx, out, p) => _oscNoise(ctx, out, 700, 'triangle', 0.04, 0.12 * p.volScale, p.now, p.noiseBuf, 0.15),
  },
  vector: {
    category: 'weapon', duration: 0.03,
    create: (ctx, out, p) => _oscNoise(ctx, out, 900, 'sine', 0.03, 0.1 * p.volScale, p.now, p.noiseBuf, 0.1),
  },
  mp7: {
    category: 'weapon', duration: 0.05,
    create: (ctx, out, p) => _oscNoise(ctx, out, 600, 'triangle', 0.05, 0.16 * p.volScale, p.now, p.noiseBuf, 0.2),
  },
  p90: {
    category: 'weapon', duration: 0.04,
    create: (ctx, out, p) => _oscNoise(ctx, out, 550, 'triangle', 0.04, 0.14 * p.volScale, p.now, p.noiseBuf, 0.18),
  },

  /* === Weapon: Assault Rifles === */
  assault: {
    category: 'weapon', duration: 0.07,
    create: (ctx, out, p) => _oscNoise(ctx, out, 500, 'triangle', 0.07, 0.18 * p.volScale, p.now, p.noiseBuf, 0.25),
  },
  ak_rifle: {
    category: 'weapon', duration: 0.08,
    create: (ctx, out, p) => _oscNoise(ctx, out, 400, 'sawtooth', 0.08, 0.22 * p.volScale, p.now, p.noiseBuf, 0.35),
  },
  carbine: {
    category: 'weapon', duration: 0.06,
    create: (ctx, out, p) => _oscNoise(ctx, out, 550, 'triangle', 0.06, 0.16 * p.volScale, p.now, p.noiseBuf, 0.2),
  },
  bullpup: {
    category: 'weapon', duration: 0.07,
    create: (ctx, out, p) => _oscNoise(ctx, out, 480, 'triangle', 0.07, 0.18 * p.volScale, p.now, p.noiseBuf, 0.2),
  },

  /* === Weapon: Battle Rifles === */
  battlerifle: {
    category: 'weapon', duration: 0.09,
    create: (ctx, out, p) => _oscNoise(ctx, out, 380, 'sawtooth', 0.09, 0.22 * p.volScale, p.now, p.noiseBuf, 0.3),
  },
  marksman: {
    category: 'weapon', duration: 0.09,
    create: (ctx, out, p) => _oscNoise(ctx, out, 420, 'triangle', 0.09, 0.2 * p.volScale, p.now, p.noiseBuf, 0.25),
  },

  /* === Weapon: DMR === */
  dmr: {
    category: 'weapon', duration: 0.08,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const o = _osc(ctx, 650, 'sine');
      const n = _noiseSrc(ctx, p.noiseBuf);
      const og = _gain(ctx, 0); const ng = _gain(ctx, 0);
      const f = _filter(ctx, 'highpass', 2000);
      o.connect(og); og.connect(f); f.connect(out);
      n.connect(ng); ng.connect(f);
      _scheduleGain(og.gain, now, 0.002, 0.02, 0.058, 0.18 * v);
      _scheduleGain(ng.gain, now, 0.001, 0.01, 0.069, 0.1 * v);
      o.start(now); n.start(now);
      _safeStop(o, 0.08); _safeStop(n, 0.08);
      return { stop: () => { try { o.stop(); n.stop(); o.disconnect(); n.disconnect(); og.disconnect(); ng.disconnect(); f.disconnect(); } catch(e) {} } };
    },
  },
  semi_auto_rifle: {
    category: 'weapon', duration: 0.07,
    create: (ctx, out, p) => _oscNoise(ctx, out, 580, 'triangle', 0.07, 0.18 * p.volScale, p.now, p.noiseBuf, 0.2),
  },
  scout_rifle: {
    category: 'weapon', duration: 0.06,
    create: (ctx, out, p) => _oscNoise(ctx, out, 600, 'triangle', 0.06, 0.15 * p.volScale, p.now, p.noiseBuf, 0.18),
  },

  /* === Weapon: Shotguns === */
  shotgun: {
    category: 'weapon', duration: 0.18,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const f = _filter(ctx, 'lowpass', 2000);
      const result = _noise(ctx, out, 0.18, 0.35 * v, now, p.noiseBuf);
      const o = _osc(ctx, 120, 'sine');
      const og = _gain(ctx, 0);
      o.connect(og); og.connect(out);
      _scheduleGain(og.gain, now, 0.005, 0.06, 0.115, 0.15 * v);
      o.start(now); _safeStop(o, 0.18);
      return { stop: () => { result.stop(); try { o.stop(); o.disconnect(); og.disconnect(); } catch(e) {} } };
    },
  },
  auto_shotgun: {
    category: 'weapon', duration: 0.14,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const result = _noise(ctx, out, 0.14, 0.3 * v, now, p.noiseBuf);
      const o = _osc(ctx, 140, 'sine');
      const og = _gain(ctx, 0);
      o.connect(og); og.connect(out);
      _scheduleGain(og.gain, now, 0.005, 0.05, 0.085, 0.12 * v);
      o.start(now); _safeStop(o, 0.14);
      return { stop: () => { result.stop(); try { o.stop(); o.disconnect(); og.disconnect(); } catch(e) {} } };
    },
  },
  double_barrel: {
    category: 'weapon', duration: 0.2,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const n = _noiseSrc(ctx, p.noiseBuf);
      const ng = _gain(ctx, 0);
      const f = _filter(ctx, 'lowpass', 1500);
      n.connect(ng); ng.connect(f); f.connect(out);
      _scheduleGain(ng.gain, now, 0.002, 0.06, 0.138, 0.4 * v);
      n.start(now); _safeStop(n, 0.2);
      const o = _osc(ctx, 100, 'sawtooth');
      const og = _gain(ctx, 0);
      o.connect(og); og.connect(out);
      _scheduleGain(og.gain, now, 0.003, 0.08, 0.117, 0.2 * v);
      o.start(now); _safeStop(o, 0.2);
      return { stop: () => { try { n.stop(); o.stop(); n.disconnect(); o.disconnect(); ng.disconnect(); og.disconnect(); f.disconnect(); } catch(e) {} } };
    },
  },
  combat_shotgun: {
    category: 'weapon', duration: 0.16,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const result = _noise(ctx, out, 0.16, 0.3 * v, now, p.noiseBuf);
      const o = _osc(ctx, 130, 'sawtooth');
      const og = _gain(ctx, 0);
      o.connect(og); og.connect(out);
      _scheduleGain(og.gain, now, 0.004, 0.05, 0.106, 0.14 * v);
      o.start(now); _safeStop(o, 0.16);
      return { stop: () => { result.stop(); try { o.stop(); o.disconnect(); og.disconnect(); } catch(e) {} } };
    },
  },
  slug_shotgun: {
    category: 'weapon', duration: 0.12,
    create: (ctx, out, p) => _oscNoise(ctx, out, 300, 'sawtooth', 0.12, 0.22 * p.volScale, p.now, p.noiseBuf, 0.3),
  },

  /* === Weapon: LMG === */
  lmg: {
    category: 'weapon', duration: 0.06,
    create: (ctx, out, p) => _oscNoise(ctx, out, 350, 'sawtooth', 0.06, 0.2 * p.volScale, p.now, p.noiseBuf, 0.3),
  },
  minigun: {
    category: 'weapon', duration: 0.03,
    create: (ctx, out, p) => _oscNoise(ctx, out, 300, 'triangle', 0.03, 0.12 * p.volScale, p.now, p.noiseBuf, 0.25),
  },
  heavy_lmg: {
    category: 'weapon', duration: 0.08,
    create: (ctx, out, p) => _oscNoise(ctx, out, 320, 'sawtooth', 0.08, 0.22 * p.volScale, p.now, p.noiseBuf, 0.32),
  },
  mobile_lmg: {
    category: 'weapon', duration: 0.05,
    create: (ctx, out, p) => _oscNoise(ctx, out, 400, 'triangle', 0.05, 0.16 * p.volScale, p.now, p.noiseBuf, 0.2),
  },

  /* === Weapon: Snipers === */
  sniper: {
    category: 'weapon', duration: 0.12,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const n = _noiseSrc(ctx, p.noiseBuf);
      const ng = _gain(ctx, 0);
      const f = _filter(ctx, 'highpass', 3000);
      n.connect(ng); ng.connect(f); f.connect(out);
      _scheduleGain(ng.gain, now, 0.001, 0.02, 0.099, 0.3 * v);
      n.start(now); _safeStop(n, 0.12);
      const o = _osc(ctx, 250, 'sawtooth');
      const og = _gain(ctx, 0);
      o.connect(og); og.connect(out);
      _scheduleGain(og.gain, now, 0.003, 0.04, 0.077, 0.25 * v);
      o.start(now); _safeStop(o, 0.12);
      return { stop: () => { try { n.stop(); o.stop(); n.disconnect(); o.disconnect(); ng.disconnect(); og.disconnect(); f.disconnect(); } catch(e) {} } };
    },
  },
  heavy_sniper: {
    category: 'weapon', duration: 0.15,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const n = _noiseSrc(ctx, p.noiseBuf);
      const ng = _gain(ctx, 0);
      const f = _filter(ctx, 'highpass', 2500);
      n.connect(ng); ng.connect(f); f.connect(out);
      _scheduleGain(ng.gain, now, 0.001, 0.03, 0.119, 0.35 * v);
      n.start(now); _safeStop(n, 0.15);
      const o = _osc(ctx, 200, 'sawtooth');
      const og = _gain(ctx, 0);
      o.connect(og); og.connect(out);
      _scheduleGain(og.gain, now, 0.003, 0.05, 0.097, 0.3 * v);
      o.start(now); _safeStop(o, 0.15);
      return { stop: () => { try { n.stop(); o.stop(); n.disconnect(); o.disconnect(); ng.disconnect(); og.disconnect(); f.disconnect(); } catch(e) {} } };
    },
  },
  rail_sniper: {
    category: 'weapon', duration: 0.1,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const f1 = _filter(ctx, 'highpass', 4000);
      const result = _noise(ctx, f1, 0.1, 0.25 * v, now, p.noiseBuf);
      const o = _osc(ctx, 800, 'sine');
      const og = _gain(ctx, 0);
      o.connect(og); og.connect(out);
      o.frequency.linearRampToValueAtTime(200, now + 0.08);
      _scheduleGain(og.gain, now, 0.002, 0.02, 0.078, 0.2 * v);
      o.start(now); _safeStop(o, 0.1);
      return { stop: () => { result.stop(); try { o.stop(); o.disconnect(); og.disconnect(); f1.disconnect(); } catch(e) {} } };
    },
  },
  anti_material_rifle: {
    category: 'weapon', duration: 0.2,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const n = _noiseSrc(ctx, p.noiseBuf);
      const ng = _gain(ctx, 0);
      const f = _filter(ctx, 'lowpass', 1500);
      n.connect(ng); ng.connect(f); f.connect(out);
      _scheduleGain(ng.gain, now, 0.005, 0.08, 0.115, 0.35 * v);
      n.start(now); _safeStop(n, 0.2);
      const o = _osc(ctx, 150, 'sawtooth');
      const og = _gain(ctx, 0);
      o.connect(og); og.connect(out);
      o.frequency.linearRampToValueAtTime(80, now + 0.15);
      _scheduleGain(og.gain, now, 0.005, 0.06, 0.135, 0.22 * v);
      o.start(now); _safeStop(o, 0.2);
      return { stop: () => { try { n.stop(); o.stop(); n.disconnect(); o.disconnect(); ng.disconnect(); og.disconnect(); f.disconnect(); } catch(e) {} } };
    },
  },

  /* === Weapon: Launchers === */
  rpg: {
    category: 'weapon', duration: 0.35,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const n = _noiseSrc(ctx, p.noiseBuf);
      const ng = _gain(ctx, 0);
      const f = _filter(ctx, 'lowpass', 800);
      n.connect(ng); ng.connect(f); f.connect(out);
      _scheduleGain(ng.gain, now, 0.01, 0.2, 0.14, 0.4 * v);
      n.start(now); _safeStop(n, 0.35);
      const o = _osc(ctx, 80, 'sawtooth');
      const og = _gain(ctx, 0);
      o.connect(og); og.connect(out);
      o.frequency.linearRampToValueAtTime(40, now + 0.3);
      _scheduleGain(og.gain, now, 0.01, 0.15, 0.19, 0.25 * v);
      o.start(now); _safeStop(o, 0.35);
      return { stop: () => { try { n.stop(); o.stop(); n.disconnect(); o.disconnect(); ng.disconnect(); og.disconnect(); f.disconnect(); } catch(e) {} } };
    },
  },
  grenade_launcher: {
    category: 'weapon', duration: 0.2,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const o = _osc(ctx, 180, 'sine');
      const g = _gain(ctx, 0);
      o.connect(g); g.connect(out);
      o.frequency.linearRampToValueAtTime(120, now + 0.15);
      _scheduleGain(g.gain, now, 0.005, 0.1, 0.095, 0.2 * v);
      o.start(now); _safeStop(o, 0.2);
      return { stop: () => { try { o.stop(); o.disconnect(); g.disconnect(); } catch(e) {} } };
    },
  },
  quad_rocket: {
    category: 'weapon', duration: 0.2,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const n = _noiseSrc(ctx, p.noiseBuf);
      const ng = _gain(ctx, 0);
      const f = _filter(ctx, 'lowpass', 1000);
      n.connect(ng); ng.connect(f); f.connect(out);
      _scheduleGain(ng.gain, now, 0.005, 0.1, 0.095, 0.3 * v);
      n.start(now); _safeStop(n, 0.2);
      const o = _osc(ctx, 100, 'sawtooth');
      const og = _gain(ctx, 0);
      o.connect(og); og.connect(out);
      o.frequency.linearRampToValueAtTime(60, now + 0.15);
      _scheduleGain(og.gain, now, 0.005, 0.08, 0.115, 0.18 * v);
      o.start(now); _safeStop(o, 0.2);
      return { stop: () => { try { n.stop(); o.stop(); n.disconnect(); o.disconnect(); ng.disconnect(); og.disconnect(); f.disconnect(); } catch(e) {} } };
    },
  },

  /* === Weapon: Explosive (additional) === */
  sticky_launcher: {
    category: 'weapon', duration: 0.18,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const o = _osc(ctx, 200, 'sine');
      const g = _gain(ctx, 0);
      o.connect(g); g.connect(out);
      o.frequency.linearRampToValueAtTime(140, now + 0.12);
      _scheduleGain(g.gain, now, 0.005, 0.08, 0.095, 0.18 * v);
      o.start(now); _safeStop(o, 0.18);
      return { stop: () => { try { o.stop(); o.disconnect(); g.disconnect(); } catch(e) {} } };
    },
  },
  cluster_launcher: {
    category: 'weapon', duration: 0.2,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const n = _noiseSrc(ctx, p.noiseBuf);
      const ng = _gain(ctx, 0);
      const f = _filter(ctx, 'lowpass', 900);
      n.connect(ng); ng.connect(f); f.connect(out);
      _scheduleGain(ng.gain, now, 0.005, 0.1, 0.095, 0.28 * v);
      n.start(now); _safeStop(n, 0.2);
      const o = _osc(ctx, 110, 'sawtooth');
      const og = _gain(ctx, 0);
      o.connect(og); og.connect(out);
      o.frequency.linearRampToValueAtTime(70, now + 0.14);
      _scheduleGain(og.gain, now, 0.005, 0.08, 0.115, 0.16 * v);
      o.start(now); _safeStop(o, 0.2);
      return { stop: () => { try { n.stop(); o.stop(); n.disconnect(); o.disconnect(); ng.disconnect(); og.disconnect(); f.disconnect(); } catch(e) {} } };
    },
  },

  /* === Weapon: Energy === */
  laser_rifle: {
    category: 'weapon', duration: 0.1,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const o = _osc(ctx, 3000, 'sawtooth');
      const f = _filter(ctx, 'highpass', 4000);
      const g = _gain(ctx, 0);
      o.connect(f); f.connect(g); g.connect(out);
      o.frequency.linearRampToValueAtTime(1000, now + 0.07);
      _scheduleGain(g.gain, now, 0.001, 0.02, 0.079, 0.2 * v);
      o.start(now); _safeStop(o, 0.1);
      const n = _noiseSrc(ctx, p.noiseBuf);
      const ng = _gain(ctx, 0);
      const nf = _filter(ctx, 'highpass', 5000);
      n.connect(ng); ng.connect(nf); nf.connect(out);
      _scheduleGain(ng.gain, now, 0.001, 0.01, 0.089, 0.08 * v);
      n.start(now); _safeStop(n, 0.1);
      return { stop: () => { try { o.stop(); n.stop(); o.disconnect(); n.disconnect(); f.disconnect(); nf.disconnect(); g.disconnect(); ng.disconnect(); } catch(e) {} } };
    },
  },
  plasma_rifle: {
    category: 'weapon', duration: 0.14,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const o = _osc(ctx, 250, 'sawtooth');
      const f = _filter(ctx, 'lowpass', 600);
      const g = _gain(ctx, 0);
      o.connect(f); f.connect(g); g.connect(out);
      o.frequency.linearRampToValueAtTime(150, now + 0.1);
      _scheduleGain(g.gain, now, 0.005, 0.06, 0.075, 0.2 * v);
      o.start(now); _safeStop(o, 0.14);
      const n = _noiseSrc(ctx, p.noiseBuf);
      const ng = _gain(ctx, 0);
      n.connect(ng); ng.connect(out);
      _scheduleGain(ng.gain, now, 0.003, 0.04, 0.097, 0.15 * v);
      n.start(now); _safeStop(n, 0.14);
      return { stop: () => { try { o.stop(); n.stop(); o.disconnect(); n.disconnect(); f.disconnect(); g.disconnect(); ng.disconnect(); } catch(e) {} } };
    },
  },
  beam_cannon: {
    category: 'weapon', duration: 0.18,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const o = _osc(ctx, 200, 'sawtooth');
      const f = _filter(ctx, 'lowpass', 500);
      const g = _gain(ctx, 0);
      o.connect(f); f.connect(g); g.connect(out);
      o.frequency.linearRampToValueAtTime(100, now + 0.12);
      _scheduleGain(g.gain, now, 0.005, 0.08, 0.095, 0.22 * v);
      o.start(now); _safeStop(o, 0.18);
      const n = _noiseSrc(ctx, p.noiseBuf);
      const ng = _gain(ctx, 0);
      n.connect(ng); ng.connect(out);
      _scheduleGain(ng.gain, now, 0.003, 0.05, 0.127, 0.18 * v);
      n.start(now); _safeStop(n, 0.18);
      return { stop: () => { try { o.stop(); n.stop(); o.disconnect(); n.disconnect(); f.disconnect(); g.disconnect(); ng.disconnect(); } catch(e) {} } };
    },
  },
  continuous_beam: {
    category: 'weapon', duration: 0.06,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const o = _osc(ctx, 800, 'sine');
      const g = _gain(ctx, 0);
      o.connect(g); g.connect(out);
      o.frequency.linearRampToValueAtTime(500, now + 0.04);
      _scheduleGain(g.gain, now, 0.002, 0.02, 0.038, 0.12 * v);
      o.start(now); _safeStop(o, 0.06);
      return { stop: () => { try { o.stop(); o.disconnect(); g.disconnect(); } catch(e) {} } };
    },
  },

  /* === Beam Hums (loop while firing) === */
  laser_rifle_hum: {
    category: 'weapon', duration: 0.05,
    create: (ctx, out, p) => {
      const now = p.now;
      const o = _osc(ctx, 5000, 'sine');
      const g = _gain(ctx, 0);
      o.connect(g); g.connect(out);
      g.gain.setValueAtTime(0.06, now);
      o.start(now);
      return { stop: () => { try { o.stop(); o.disconnect(); g.disconnect(); } catch(e) {} } };
    },
  },
  plasma_rifle_hum: {
    category: 'weapon', duration: 0.12,
    create: (ctx, out, p) => {
      const now = p.now;
      const o = _osc(ctx, 120, 'sawtooth');
      const f = _filter(ctx, 'lowpass', 300);
      const g = _gain(ctx, 0);
      o.connect(f); f.connect(g); g.connect(out);
      g.gain.setValueAtTime(0.08, now);
      o.start(now);
      const n = _noiseSrc(ctx, p.noiseBuf);
      const ng = _gain(ctx, 0);
      const nf = _filter(ctx, 'bandpass', 200, 2);
      n.connect(ng); ng.connect(nf); nf.connect(out);
      ng.gain.setValueAtTime(0.04, now);
      n.start(now);
      return {
        stop: () => {
          try { o.stop(); n.stop(); o.disconnect(); n.disconnect(); f.disconnect(); nf.disconnect(); g.disconnect(); ng.disconnect(); } catch(e) {}
        }
      };
    },
  },

  /* === Weapon: Energy === */
  plasma_smg: {
    category: 'weapon', duration: 0.04,
    create: (ctx, out, p) => _oscNoise(ctx, out, 750, 'triangle', 0.04, 0.14 * p.volScale, p.now, p.noiseBuf, 0.12),
  },
  ion_rifle: {
    category: 'weapon', duration: 0.12,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const o = _osc(ctx, 400, 'sine');
      const g = _gain(ctx, 0);
      o.connect(g); g.connect(out);
      o.frequency.linearRampToValueAtTime(200, now + 0.08);
      _scheduleGain(g.gain, now, 0.005, 0.04, 0.075, 0.2 * v);
      o.start(now); _safeStop(o, 0.12);
      const n = _noiseSrc(ctx, p.noiseBuf);
      const ng = _gain(ctx, 0);
      n.connect(ng); ng.connect(out);
      _scheduleGain(ng.gain, now, 0.002, 0.02, 0.098, 0.1 * v);
      n.start(now); _safeStop(n, 0.12);
      return { stop: () => { try { o.stop(); n.stop(); o.disconnect(); n.disconnect(); g.disconnect(); ng.disconnect(); } catch(e) {} } };
    },
  },
  arc_rifle: {
    category: 'weapon', duration: 0.1,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const o = _osc(ctx, 2000, 'sawtooth');
      const g = _gain(ctx, 0);
      o.connect(g); g.connect(out);
      o.frequency.linearRampToValueAtTime(500, now + 0.07);
      _scheduleGain(g.gain, now, 0.002, 0.02, 0.078, 0.16 * v);
      o.start(now); _safeStop(o, 0.1);
      return { stop: () => { try { o.stop(); o.disconnect(); g.disconnect(); } catch(e) {} } };
    },
  },
  pulse_carbine: {
    category: 'weapon', duration: 0.05,
    create: (ctx, out, p) => _oscNoise(ctx, out, 700, 'triangle', 0.05, 0.14 * p.volScale, p.now, p.noiseBuf, 0.14),
  },

  /* === Weapon: Special / Summon === */
  black_hole_launcher: {
    category: 'weapon', duration: 0.3,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const o = _osc(ctx, 60, 'sine');
      const g = _gain(ctx, 0);
      o.connect(g); g.connect(out);
      o.frequency.linearRampToValueAtTime(30, now + 0.25);
      _scheduleGain(g.gain, now, 0.01, 0.15, 0.14, 0.2 * v);
      o.start(now); _safeStop(o, 0.3);
      const n = _noiseSrc(ctx, p.noiseBuf);
      const ng = _gain(ctx, 0);
      const f = _filter(ctx, 'lowpass', 400);
      n.connect(ng); ng.connect(f); f.connect(out);
      _scheduleGain(ng.gain, now, 0.01, 0.12, 0.17, 0.2 * v);
      n.start(now); _safeStop(n, 0.3);
      return { stop: () => { try { o.stop(); n.stop(); o.disconnect(); n.disconnect(); g.disconnect(); ng.disconnect(); f.disconnect(); } catch(e) {} } };
    },
  },
  missile_drone: {
    category: 'weapon', duration: 0.15,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const o = _osc(ctx, 300, 'sine');
      const g = _gain(ctx, 0);
      o.connect(g); g.connect(out);
      o.frequency.linearRampToValueAtTime(500, now + 0.1);
      _scheduleGain(g.gain, now, 0.005, 0.06, 0.085, 0.12 * v);
      o.start(now); _safeStop(o, 0.15);
      return { stop: () => { try { o.stop(); o.disconnect(); g.disconnect(); } catch(e) {} } };
    },
  },

  /* === Explosions === */
  explosion: {
    category: 'explosion', duration: 0.6,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const n = _noiseSrc(ctx, p.noiseBuf);
      const ng = _gain(ctx, 0);
      const f = _filter(ctx, 'lowpass', 1200);
      n.connect(ng); ng.connect(f); f.connect(out);
      f.frequency.linearRampToValueAtTime(200, now + 0.4);
      _scheduleGain(ng.gain, now, 0.005, 0.2, 0.395, 0.5 * v);
      n.start(now); _safeStop(n, 0.6);
      const o = _osc(ctx, 60, 'sine');
      const og = _gain(ctx, 0);
      o.connect(og); og.connect(out);
      o.frequency.linearRampToValueAtTime(30, now + 0.5);
      _scheduleGain(og.gain, now, 0.01, 0.2, 0.39, 0.3 * v);
      o.start(now); _safeStop(o, 0.6);
      return { stop: () => { try { n.stop(); o.stop(); n.disconnect(); o.disconnect(); ng.disconnect(); og.disconnect(); f.disconnect(); } catch(e) {} } };
    },
  },

  /* === Hits === */
  hit: {
    category: 'player', duration: 0.06,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const n = _noiseSrc(ctx, p.noiseBuf);
      const ng = _gain(ctx, 0);
      n.connect(ng); ng.connect(out);
      _scheduleGain(ng.gain, now, 0.002, 0.01, 0.048, 0.2 * v);
      n.start(now); _safeStop(n, 0.06);
      return { stop: () => { try { n.stop(); n.disconnect(); ng.disconnect(); } catch(e) {} } };
    },
  },
  player_hit: {
    category: 'player', duration: 0.08,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const o = _osc(ctx, 150, 'sine');
      const g = _gain(ctx, 0);
      o.connect(g); g.connect(out);
      _scheduleGain(g.gain, now, 0.003, 0.02, 0.057, 0.2 * v);
      o.start(now); _safeStop(o, 0.08);
      return { stop: () => { try { o.stop(); o.disconnect(); g.disconnect(); } catch(e) {} } };
    },
  },
  wall_hit: {
    category: 'environment', duration: 0.06,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const n = _noiseSrc(ctx, p.noiseBuf);
      const f = _filter(ctx, 'highpass', 3000);
      const g = _gain(ctx, 0);
      n.connect(f); f.connect(g); g.connect(out);
      _scheduleGain(g.gain, now, 0.002, 0.01, 0.048, 0.12 * v);
      n.start(now); _safeStop(n, 0.06);
      return { stop: () => { try { n.stop(); n.disconnect(); f.disconnect(); g.disconnect(); } catch(e) {} } };
    },
  },
  headshot: {
    category: 'player', duration: 0.08,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const o = _osc(ctx, 1200, 'sine');
      const g = _gain(ctx, 0);
      o.connect(g); g.connect(out);
      _scheduleGain(g.gain, now, 0.001, 0.02, 0.059, 0.25 * v);
      o.start(now); _safeStop(o, 0.08);
      const n = _noiseSrc(ctx, p.noiseBuf);
      const ng = _gain(ctx, 0);
      n.connect(ng); ng.connect(out);
      _scheduleGain(ng.gain, now, 0.001, 0.01, 0.069, 0.1 * v);
      n.start(now); _safeStop(n, 0.08);
      return { stop: () => { try { o.stop(); n.stop(); o.disconnect(); n.disconnect(); g.disconnect(); ng.disconnect(); } catch(e) {} } };
    },
  },

  /* === Player === */
  player_jump: {
    category: 'player', duration: 0.15,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const o = _osc(ctx, 200, 'sine');
      const g = _gain(ctx, 0);
      o.connect(g); g.connect(out);
      o.frequency.linearRampToValueAtTime(400, now + 0.1);
      _scheduleGain(g.gain, now, 0.005, 0.06, 0.085, 0.12 * v);
      o.start(now); _safeStop(o, 0.15);
      return { stop: () => { try { o.stop(); o.disconnect(); g.disconnect(); } catch(e) {} } };
    },
  },
  player_land: {
    category: 'player', duration: 0.1,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const n = _noiseSrc(ctx, p.noiseBuf);
      const f = _filter(ctx, 'lowpass', 500);
      const g = _gain(ctx, 0);
      n.connect(f); f.connect(g); g.connect(out);
      _scheduleGain(g.gain, now, 0.003, 0.02, 0.077, 0.15 * v);
      n.start(now); _safeStop(n, 0.1);
      const o = _osc(ctx, 100, 'sine');
      const og = _gain(ctx, 0);
      o.connect(og); og.connect(out);
      _scheduleGain(og.gain, now, 0.003, 0.02, 0.077, 0.08 * v);
      o.start(now); _safeStop(o, 0.1);
      return { stop: () => { try { n.stop(); o.stop(); n.disconnect(); o.disconnect(); f.disconnect(); g.disconnect(); og.disconnect(); } catch(e) {} } };
    },
  },
  player_dash: {
    category: 'player', duration: 0.2,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const o = _osc(ctx, 300, 'sine');
      const g = _gain(ctx, 0);
      o.connect(g); g.connect(out);
      o.frequency.linearRampToValueAtTime(600, now + 0.12);
      _scheduleGain(g.gain, now, 0.005, 0.1, 0.095, 0.1 * v);
      o.start(now); _safeStop(o, 0.2);
      return { stop: () => { try { o.stop(); o.disconnect(); g.disconnect(); } catch(e) {} } };
    },
  },
  player_respawn: {
    category: 'player', duration: 0.4,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const o = _osc(ctx, 300, 'sine');
      const g = _gain(ctx, 0);
      o.connect(g); g.connect(out);
      o.frequency.linearRampToValueAtTime(800, now + 0.3);
      _scheduleGain(g.gain, now, 0.02, 0.2, 0.18, 0.15 * v);
      o.start(now); _safeStop(o, 0.4);
      return { stop: () => { try { o.stop(); o.disconnect(); g.disconnect(); } catch(e) {} } };
    },
  },
  player_kill: {
    category: 'player', duration: 0.35,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const o = _osc(ctx, 600, 'sine');
      const g = _gain(ctx, 0);
      o.connect(g); g.connect(out);
      o.frequency.linearRampToValueAtTime(1200, now + 0.25);
      _scheduleGain(g.gain, now, 0.01, 0.15, 0.19, 0.18 * v);
      o.start(now); _safeStop(o, 0.35);
      return { stop: () => { try { o.stop(); o.disconnect(); g.disconnect(); } catch(e) {} } };
    },
  },
  player_death: {
    category: 'player', duration: 0.5,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const o = _osc(ctx, 400, 'sawtooth');
      const g = _gain(ctx, 0);
      o.connect(g); g.connect(out);
      o.frequency.linearRampToValueAtTime(80, now + 0.4);
      _scheduleGain(g.gain, now, 0.01, 0.1, 0.39, 0.2 * v);
      o.start(now); _safeStop(o, 0.5);
      return { stop: () => { try { o.stop(); o.disconnect(); g.disconnect(); } catch(e) {} } };
    },
  },
  player_reload: {
    category: 'player', duration: 0.3,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const o = _osc(ctx, 300, 'triangle');
      const g = _gain(ctx, 0);
      o.connect(g); g.connect(out);
      o.frequency.linearRampToValueAtTime(600, now + 0.15);
      o.frequency.linearRampToValueAtTime(400, now + 0.25);
      _scheduleGain(g.gain, now, 0.01, 0.1, 0.19, 0.1 * v);
      o.start(now); _safeStop(o, 0.3);
      return { stop: () => { try { o.stop(); o.disconnect(); g.disconnect(); } catch(e) {} } };
    },
  },
  player_empty: {
    category: 'player', duration: 0.08,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const o = _osc(ctx, 200, 'triangle');
      const g = _gain(ctx, 0);
      o.connect(g); g.connect(out);
      _scheduleGain(g.gain, now, 0.005, 0.01, 0.065, 0.08 * v);
      o.start(now); _safeStop(o, 0.08);
      return { stop: () => { try { o.stop(); o.disconnect(); g.disconnect(); } catch(e) {} } };
    },
  },

  /* === Game === */
  game_countdown: {
    category: 'voice', duration: 0.3,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const o = _osc(ctx, 440, 'sine');
      const g = _gain(ctx, 0);
      o.connect(g); g.connect(out);
      _scheduleGain(g.gain, now, 0.02, 0.15, 0.13, 0.2 * v);
      o.start(now); _safeStop(o, 0.3);
      return { stop: () => { try { o.stop(); o.disconnect(); g.disconnect(); } catch(e) {} } };
    },
  },
  game_fight: {
    category: 'voice', duration: 0.5,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const o1 = _osc(ctx, 440, 'sine');
      const o2 = _osc(ctx, 880, 'sine');
      const g = _gain(ctx, 0);
      o1.connect(g); o2.connect(g); g.connect(out);
      _scheduleGain(g.gain, now, 0.02, 0.3, 0.18, 0.25 * v);
      o1.start(now); o2.start(now); _safeStop(o1, 0.5); _safeStop(o2, 0.5);
      return { stop: () => { try { o1.stop(); o2.stop(); o1.disconnect(); o2.disconnect(); g.disconnect(); } catch(e) {} } };
    },
  },
  game_victory: {
    category: 'voice', duration: 1.0,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const notes = [523, 659, 784, 1047, 784, 1047, 1319];
      const stops = [];
      notes.forEach((f, i) => {
        const o = _osc(ctx, f, 'sine');
        const g = _gain(ctx, 0);
        o.connect(g); g.connect(out);
        const t = now + i * 0.12;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.18 * v, t + 0.04);
        g.gain.linearRampToValueAtTime(0, t + 0.3);
        o.start(t); _safeStop(o, t + 0.35);
        stops.push({ stop: () => { try { o.stop(); o.disconnect(); g.disconnect(); } catch(e) {} } });
      });
      return { stop: () => stops.forEach(s => s.stop()) };
    },
  },
  game_defeat: {
    category: 'voice', duration: 0.8,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const notes = [392, 349, 330, 262];
      const stops = [];
      notes.forEach((f, i) => {
        const o = _osc(ctx, f, 'sine');
        const g = _gain(ctx, 0);
        o.connect(g); g.connect(out);
        const t = now + i * 0.18;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.15 * v, t + 0.04);
        g.gain.linearRampToValueAtTime(0, t + 0.35);
        o.start(t); _safeStop(o, t + 0.4);
        stops.push({ stop: () => { try { o.stop(); o.disconnect(); g.disconnect(); } catch(e) {} } });
      });
      return { stop: () => stops.forEach(s => s.stop()) };
    },
  },
  game_round_end: {
    category: 'voice', duration: 0.6,
    create: (ctx, out, p) => {
      const now = p.now; const v = p.volScale;
      const o = _osc(ctx, 400, 'sawtooth');
      const g = _gain(ctx, 0);
      o.connect(g); g.connect(out);
      o.frequency.linearRampToValueAtTime(100, now + 0.5);
      _scheduleGain(g.gain, now, 0.01, 0.2, 0.39, 0.2 * v);
      o.start(now); _safeStop(o, 0.6);
      return { stop: () => { try { o.stop(); o.disconnect(); g.disconnect(); } catch(e) {} } };
    },
  },
};
