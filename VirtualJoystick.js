/* ============================================================
   NEON ARENA - バーチャルジョイスティック
   タッチ操作の仮想スティックを実装
   ============================================================ */

/**
 * バーチャルジョイスティッククラス
 * モバイルタッチ操作のための仮想スティックを提供する
 * Pointer Events APIを使用して、スティックの入力を正規化(-1〜1)で出力
 */
class VirtualJoystick {
  constructor(options = {}) {
    this.zone = options.zone || document.body;
    this.size = options.size || 120;
    this.threshold = options.threshold || 0.15;
    this.onInput = options.onInput || (() => {});
    this.onEnd = options.onEnd || (() => {});

    this.x = 0;               // 現在のX入力値（-1〜1）
    this.y = 0;               // 現在のY入力値（-1〜1）
    this._active = false;     // アクティブフラグ
    this._touchId = null;     // アクティブなタッチのID
    this._centerX = 0;        // スティックの中心X座標
    this._centerY = 0;        // スティックの中心Y座標

    this._createUI();
    this._bindEvents();
  }

  /**
   * ジョイスティックのDOM要素を作成
   */
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

  /**
   * ジョイスティックを表示し、指定座標に配置
   * @param {number} x - 画面X座標
   * @param {number} y - 画面Y座標
   */
  show(x, y) {
    this._centerX = x;
    this._centerY = y;
    this.el.style.display = '';
    this.el.style.left = (x - this.size / 2) + 'px';
    this.el.style.top = (y - this.size / 2) + 'px';
  }

  /**
   * ジョイスティックを非表示にし、入力をリセット
   */
  hide() {
    this.el.style.display = 'none';
    this.x = 0;
    this.y = 0;
    this._active = false;
    this._touchId = null;
    this._updateKnob();
  }

  /**
   * Pointer Eventsのバインド
   */
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

  /**
   * ポインター移動処理
   * 中心からの変位を正規化(-1〜1)して出力
   * @param {PointerEvent} e - ポインターイベント
   */
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
    /* 閾値以下の入力を無視（デッドゾーン） */
    if (Math.abs(nx) < this.threshold && Math.abs(ny) < this.threshold) {
      nx = 0;
      ny = 0;
    }
    this.x = Math.max(-1, Math.min(1, nx));
    this.y = Math.max(-1, Math.min(1, -ny));
    this._updateKnob();
    this.onInput(this.x, this.y);
  }

  /**
   * ノブの位置を入力値に応じて更新
   */
  _updateKnob() {
    const maxR = this.size / 2 - this.size * 0.24;
    const kx = this.x * maxR;
    const ky = -this.y * maxR;
    this.knob.style.transform = 'translate(calc(-50% + ' + kx + 'px), calc(-50% + ' + ky + 'px))';
  }

  /**
   * リソースを解放
   */
  destroy() {
    if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
  }
}
