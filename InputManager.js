class InputManager {
  constructor(game) {
    this.game = game;

    this.moveX = 0;
    this.moveZ = 0;
    this.lookX = 0;
    this.lookY = 0;
    this.firePressed = false;
    this.fireClicked = false;
    this.dashRequested = false;
    this.reloadRequested = false;
    this.respawnRequested = false;
    this.canFire = false;
    this.isMobile = this._detectMobile();

    this._keys = {};
    this._touchLookId = null;
    this._touchLookLastX = 0;
    this._touchLookLastY = 0;
    this._joystick = null;
    this._initialized = false;
  }

  _detectMobile() {
    if (/Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) return true;
    if (navigator.maxTouchPoints > 0 && window.innerWidth < 1024) return true;
    return false;
  }

  init() {
    if (this._initialized) return;
    this._initialized = true;

    this._setupKeyboard();
    this._setupMouse();
    this._setupPointerLock();
    this._setupResize();

    if (this.isMobile) {
      this._setupTouchControls();
    }
  }

  updateMovement() {
    this.moveX = 0;
    this.moveZ = 0;

    if (this._keys['w'] || this._keys['arrowup']) this.moveZ -= 1;
    if (this._keys['s'] || this._keys['arrowdown']) this.moveZ += 1;
    if (this._keys['a'] || this._keys['arrowleft']) this.moveX -= 1;
    if (this._keys['d'] || this._keys['arrowright']) this.moveX += 1;

    const len = Math.sqrt(this.moveX * this.moveX + this.moveZ * this.moveZ);
    if (len > 1) {
      this.moveX /= len;
      this.moveZ /= len;
    }

    if (this._joystick && this._joystick._active) {
      this.moveX = this._joystick.x;
      this.moveZ = this._joystick.y;
    }
  }

  endFrame() {
    this.fireClicked = false;
    this.dashRequested = false;
    this.reloadRequested = false;
    this.respawnRequested = false;
    this.lookX = 0;
    this.lookY = 0;
  }

  _setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      this._keys[key] = true;
      this.game.keys[key] = true;
      if (key === 'r' && (this.game.gameState === GameState.PLAYING || this.game.gameState === GameState.TRAINING)) {
        this.reloadRequested = true;
      }
      if ((e.key === ' ' || key === 'space') && this.game.respawnReady && !this.game.respawnRequested) {
        e.preventDefault();
        this.respawnRequested = true;
      }
      if (key === 'shift' && (this.game.gameState === GameState.PLAYING || this.game.gameState === GameState.TRAINING)) {
        this.dashRequested = true;
      }
    });
    document.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      this._keys[key] = false;
      this.game.keys[key] = false;
    });
  }

  _setupMouse() {
    this.game.renderer.domElement.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (this.game.respawnReady && !this.game.respawnRequested) {
        this.respawnRequested = true;
        return;
      }
      if (this.game.gameState === GameState.TRAINING) {
        const panel = document.getElementById('training-left-panel');
        if (panel && !panel.classList.contains('closed')) return;
      }
      this.firePressed = true;
      this.fireClicked = true;
      const needsLock = (this.game.gameState === GameState.PLAYING || this.game.gameState === GameState.TRAINING);
      if (!this.game.pointerLocked && needsLock && !(this.game.respawnTimer > 0)) {
        this.game.renderer.domElement.requestPointerLock();
      }
    });
    this.game.renderer.domElement.addEventListener('mouseup', (e) => {
      if (e.button !== 0) return;
      this.firePressed = false;
      if (AUDIO && this.game.localPlayer) {
        AUDIO.stopBeamHum(this.game.localPlayer.weapon);
      }
    });
    document.addEventListener('mousemove', (e) => {
      if (this.game.pointerLocked) {
        const sens = SETTINGS.get('mouseSensitivity');
        const invertY = SETTINGS.get('invertY') ? -1 : 1;
        this.lookX += e.movementX * sens;
        this.lookY += e.movementY * sens * invertY;
      }
    });
  }

  _setupPointerLock() {
    document.addEventListener('pointerlockchange', () => {
      this.game.pointerLocked = document.pointerLockElement === this.game.renderer.domElement;
      this.canFire = this.game.pointerLocked;
      const isTraining = this.game.gameState === GameState.TRAINING;
      document.getElementById('instructions').classList.toggle('hidden',
        !this.game.pointerLocked || this.game.respawnTimer > 0 || isTraining);
    });
  }

  _setupResize() {
    window.addEventListener('resize', () => {
      if (this.game.camera) {
        this.game.camera.aspect = window.innerWidth / window.innerHeight;
        this.game.camera.updateProjectionMatrix();
      }
      if (this.game.renderer) {
        this.game.renderer.setSize(window.innerWidth, window.innerHeight);
      }
    });
  }

  _setupTouchControls() {
    this._createJoystick();
    this._createTouchButtons();
    this._setupTouchLook();
    this._preventScroll();

    this.canFire = true;
    document.getElementById('instructions').textContent =
      'JOYSTICK: MOVE · RIGHT DRAG: AIM · FIRE: SHOOT · DASH · R: RELOAD';
    const trainingHint = document.querySelector('.training-hint');
    if (trainingHint) {
      trainingHint.textContent = 'JOYSTICK: MOVE · RIGHT DRAG: AIM · FIRE: SHOOT · DASH · R: RELOAD';
    }
  }

  _preventScroll() {
    document.addEventListener('touchmove', (e) => {
      if (e.target.closest('#touch-controls') || e.target.closest('.virtual-joystick')) {
        e.preventDefault();
      }
    }, { passive: false });
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('gesturechange', (e) => e.preventDefault());
  }

  _createJoystick() {
    const jsSize = Math.min(SETTINGS.get('joystickSize'), window.innerWidth * 0.25);
    this._joystick = new VirtualJoystick({
      zone: document.body,
      size: jsSize,
      threshold: 0.1,
      onInput: () => {},
      onEnd: () => {},
    });

    const container = document.getElementById('touch-controls');
    if (container) {
      container.appendChild(this._joystick.el);
    }
    this._joystick.el.style.opacity = (SETTINGS.get('joystickOpacity') / 100);

    let joystickActive = false;
    let joystickPointerId = null;

    document.addEventListener('touchstart', (e) => {
      const tc = document.getElementById('touch-controls');
      if (!tc || window.getComputedStyle(tc).display === 'none') return;
      const touch = e.changedTouches[0];
      if (touch.clientX < window.innerWidth * 0.4) {
        if (joystickActive) return;
        joystickActive = true;
        joystickPointerId = touch.identifier;
        this._joystick._active = true;
        this._joystick.show(touch.clientX, touch.clientY);
      }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (!joystickActive) return;
      const touch = Array.from(e.changedTouches).find(t => t.identifier === joystickPointerId);
      if (!touch) return;
      e.preventDefault();
      this._joystick._onMove({ clientX: touch.clientX, clientY: touch.clientY });
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
      const touch = Array.from(e.changedTouches).find(t => t.identifier === joystickPointerId);
      if (!touch) return;
      joystickActive = false;
      joystickPointerId = null;
      this._joystick._active = false;
      this._joystick.hide();
    }, { passive: true });

    document.addEventListener('touchcancel', () => {
      if (joystickActive) {
        joystickActive = false;
        joystickPointerId = null;
        this._joystick._active = false;
        this._joystick.hide();
      }
    }, { passive: true });
  }

  _createTouchButtons() {
    const container = document.getElementById('touch-controls');
    if (!container) return;
    const btnScale = SETTINGS.get('buttonSize') / 100;

    const buttons = [
      { id: 'touch-fire', label: 'FIRE', cls: 'touch-btn-fire', action: 'fire' },
      { id: 'touch-dash', label: 'DASH', cls: 'touch-btn-dash', action: 'dash' },
      { id: 'touch-reload', label: 'R', cls: 'touch-btn-reload', action: 'reload' },
    ];

    buttons.forEach(cfg => {
      const btn = document.createElement('button');
      btn.id = cfg.id;
      btn.className = 'touch-btn ' + cfg.cls;
      btn.textContent = cfg.label;
      btn.dataset.action = cfg.action;
      container.appendChild(btn);

      const press = () => this._handleTouchAction(cfg.action, true);
      const release = () => this._handleTouchAction(cfg.action, false);

      btn.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); press(); }, { passive: false });
      btn.addEventListener('touchend', (e) => { e.preventDefault(); e.stopPropagation(); release(); }, { passive: false });
      btn.style.transform = 'scale(' + btnScale + ')';
      btn.addEventListener('touchcancel', () => { if (cfg.action === 'fire') this.firePressed = false; }, { passive: true });
      btn.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); press(); });
      btn.addEventListener('pointerup', (e) => { e.preventDefault(); e.stopPropagation(); release(); });
      btn.addEventListener('pointercancel', () => { if (cfg.action === 'fire') this.firePressed = false; });
    });
  }

  _handleTouchAction(action, active) {
    switch (action) {
      case 'fire':
        if (active) {
          if (this.game.respawnReady && !this.game.respawnRequested) {
            this.respawnRequested = true;
            return;
          }
          this.firePressed = true;
          this.fireClicked = true;
        } else {
          this.firePressed = false;
          if (AUDIO && this.game.localPlayer) {
            AUDIO.stopBeamHum(this.game.localPlayer.weapon);
          }
        }
        break;
      case 'dash':
        if (active) this.dashRequested = true;
        break;
      case 'reload':
        if (active) this.reloadRequested = true;
        break;
    }
  }

  _setupTouchLook() {
    const canvas = this.game.renderer.domElement;

    canvas.addEventListener('touchstart', (e) => {
      const touch = e.changedTouches[0];
      if (touch.clientX > window.innerWidth * 0.5) {
        this._touchLookId = touch.identifier;
        this._touchLookLastX = touch.clientX;
        this._touchLookLastY = touch.clientY;
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      const touch = Array.from(e.changedTouches).find(t => t.identifier === this._touchLookId);
      if (!touch) return;
      e.preventDefault();
      const sens = SETTINGS.get('mobileSensitivity');
      const invertX = SETTINGS.get('invertLookX') ? -1 : 1;
      const invertY = SETTINGS.get('invertLookYMobile') ? -1 : 1;
      const dx = (touch.clientX - this._touchLookLastX) * sens * invertX;
      const dy = (touch.clientY - this._touchLookLastY) * sens * invertY;
      this.lookX += dx;
      this.lookY += dy;
      this._touchLookLastX = touch.clientX;
      this._touchLookLastY = touch.clientY;
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      const touch = Array.from(e.changedTouches).find(t => t.identifier === this._touchLookId);
      if (!touch) return;
      this._touchLookId = null;
    }, { passive: true });

    canvas.addEventListener('touchcancel', () => {
      this._touchLookId = null;
    }, { passive: true });
  }

  destroy() {
    if (this._joystick) {
      this._joystick.destroy();
      this._joystick = null;
    }
  }
}
