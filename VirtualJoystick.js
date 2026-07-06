class VirtualJoystick {
  constructor(options = {}) {
    this.zone = options.zone || document.body;
    this.size = options.size || 120;
    this.threshold = options.threshold || 0.15;
    this.onInput = options.onInput || (() => {});
    this.onEnd = options.onEnd || (() => {});

    this.x = 0;
    this.y = 0;
    this._active = false;
    this._touchId = null;
    this._centerX = 0;
    this._centerY = 0;

    this._createUI();
    this._bindEvents();
  }

  _createUI() {
    this.el = document.createElement('div');
    this.el.className = 'virtual-joystick';
    this.el.innerHTML = '<div class="joystick-knob"></div>';
    this.knob = this.el.querySelector('.joystick-knob');
    Object.assign(this.el.style, {
      position: 'fixed',
      width: this.size + 'px',
      height: this.size + 'px',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.08)',
      border: '2px solid rgba(255,255,255,0.15)',
      zIndex: '80',
      touchAction: 'none',
      pointerEvents: 'auto',
      display: 'none',
    });
    Object.assign(this.knob.style, {
      position: 'absolute',
      width: '48%',
      height: '48%',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%,-50%)',
      borderRadius: '50%',
      background: 'radial-gradient(circle at 35% 35%, rgba(0,240,255,0.6), rgba(0,136,255,0.3))',
      border: '1px solid rgba(0,240,255,0.3)',
      transition: 'none',
    });
    this.zone.appendChild(this.el);
  }

  show(x, y) {
    this._centerX = x;
    this._centerY = y;
    this.el.style.display = '';
    this.el.style.left = (x - this.size / 2) + 'px';
    this.el.style.top = (y - this.size / 2) + 'px';
  }

  hide() {
    this.el.style.display = 'none';
    this.x = 0;
    this.y = 0;
    this._active = false;
    this._touchId = null;
    this._updateKnob();
  }

  _bindEvents() {
    this.el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this._active) return;
      this._active = true;
      this._touchId = e.pointerId;
      this.el.setPointerCapture(e.pointerId);
      this._onMove(e);
    });

    this.el.addEventListener('pointermove', (e) => {
      if (!this._active || e.pointerId !== this._touchId) return;
      this._onMove(e);
    });

    this.el.addEventListener('pointerup', (e) => {
      if (e.pointerId !== this._touchId) return;
      this._active = false;
      this._touchId = null;
      this.el.releasePointerCapture(e.pointerId);
      this.x = 0;
      this.y = 0;
      this._updateKnob();
      this.onEnd();
    });

    this.el.addEventListener('pointercancel', (e) => {
      if (e.pointerId !== this._touchId) return;
      this._active = false;
      this._touchId = null;
      this.x = 0;
      this.y = 0;
      this._updateKnob();
      this.onEnd();
    });
  }

  _onMove(e) {
    const dx = e.clientX - this._centerX;
    const dy = e.clientY - this._centerY;
    const maxR = this.size / 2;
    const dist = Math.sqrt(dx * dx + dy * dy);
    let nx = dx / maxR;
    let ny = dy / maxR;
    if (dist > maxR) {
      nx = dx / dist;
      ny = dy / dist;
    }
    if (Math.abs(nx) < this.threshold && Math.abs(ny) < this.threshold) {
      nx = 0;
      ny = 0;
    }
    this.x = Math.max(-1, Math.min(1, nx));
    this.y = Math.max(-1, Math.min(1, -ny));
    this._updateKnob();
    this.onInput(this.x, this.y);
  }

  _updateKnob() {
    const maxR = this.size / 2 - this.size * 0.24;
    const kx = this.x * maxR;
    const ky = -this.y * maxR;
    this.knob.style.transform = 'translate(calc(-50% + ' + kx + 'px), calc(-50% + ' + ky + 'px))';
  }

  destroy() {
    if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
  }
}
