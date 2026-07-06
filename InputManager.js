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
    this.jumpRequested = false;
    this.reloadRequested = false;
    this.respawnRequested = false;
    this.weaponNextRequested = false;
    this.weaponPrevRequested = false;
    this.canFire = false;
    this.isMobile = this._detectMobile();

    this._keys = {};
    this._touchLookId = null;
    this._touchLookStartX = 0;
    this._touchLookStartY = 0;
    this._touchLookLastX = 0;
    this._touchLookLastY = 0;
    this._lookSensitivity = this.isMobile ? 0.005 : 0.003;
    this._touchFireHeld = false;
    this._joystick = null;
    this._touchButtons = {};
    this._initialized = false;
    this._preventNextClick = false;
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
      document.getElementById('touch-controls').style.display = '';
    }
  }

  update() {
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

    this.fireClicked = false;
    this.dashRequested = false;
    this.jumpRequested = false;
    this.reloadRequested = false;
    this.respawnRequested = false;
    this.weaponNextRequested = false;
    this.weaponPrevRequested = false;
  }

  resetLook() {
    this.lookX = 0;
    this.lookY = 0;
  }

  _setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      this._keys[e.key.toLowerCase()] = true;
      const key = e.key.toLowerCase();
      if (key === 'r' && (this.game.gameState === GameState.PLAYING || this.game.gameState === GameState.TRAINING)) {
        this.reloadRequested = true;
      }
      if ((e.key === ' ' || key === 'space') && this.game.respawnReady && !this.game.respawnRequested) {
        e.preventDefault();
        this.respawnRequested = true;
      }
    });
    document.addEventListener('keyup', (e) => {
      this._keys[e.key.toLowerCase()] = false;
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
        this.lookX += e.movementX;
        this.lookY += e.movementY;
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
      'JOYSTICK: MOVE · RIGHT DRAG: AIM · FIRE: SHOOT · DASH · JUMP';
    const trainingHint = document.querySelector('.training-hint');
    if (trainingHint) {
      trainingHint.textContent = 'JOYSTICK: MOVE · RIGHT DRAG: AIM · FIRE: SHOOT · DASH · JUMP';
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
    this._joystick = new VirtualJoystick({
      zone: document.body,
      size: Math.min(130, window.innerWidth * 0.2),
      threshold: 0.1,
      onInput: (x, y) => {},
      onEnd: () => {},
    });
    this._joystick.show(0, 0);
    this._joystick.el.style.display = 'none';

    const container = document.getElementById('touch-controls');
    if (container) {
      container.appendChild(this._joystick.el);
    }

    let joystickActive = false;
    let joystickPointerId = null;

    const startJoystick = (e) => {
      const touch = e.changedTouches ? e.changedTouches[0] : e;
      if (joystickActive) return;
      joystickActive = true;
      joystickPointerId = touch.identifier != null ? touch.identifier : touch.pointerId;
      const x = touch.clientX;
      const y = touch.clientY;
      this._joystick.show(x, y);
    };

    const moveJoystick = (e) => {
      if (!joystickActive) return;
      const touch = Array.from(e.changedTouches || [e]).find(t =>
        (t.identifier != null ? t.identifier : t.pointerId) === joystickPointerId
      );
      if (!touch) return;
      e.preventDefault();
      this._joystick._onMove({ clientX: touch.clientX, clientY: touch.clientY });
    };

    const endJoystick = (e) => {
      const touch = Array.from(e.changedTouches || [e]).find(t =>
        (t.identifier != null ? t.identifier : t.pointerId) === joystickPointerId
      );
      if (!touch) return;
      joystickActive = false;
      joystickPointerId = null;
      this._joystick.hide();
    };

    document.addEventListener('touchstart', (e) => {
      const touch = e.changedTouches[0];
      if (touch.clientX < window.innerWidth * 0.4) {
        startJoystick(e);
      }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      moveJoystick(e);
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
      endJoystick(e);
    }, { passive: true });

    document.addEventListener('touchcancel', (e) => {
      if (joystickActive) {
        joystickActive = false;
        joystickPointerId = null;
        this._joystick.hide();
      }
    }, { passive: true });
  }

  _createTouchButtons() {
    const container = document.getElementById('touch-controls');
    if (!container) return;

    const btnConfigs = [
      { id: 'touch-fire', label: 'FIRE', cls: 'touch-btn-fire', action: 'fire' },
      { id: 'touch-jump', label: 'JUMP', cls: 'touch-btn-jump', action: 'jump' },
      { id: 'touch-reload', label: 'R', cls: 'touch-btn-reload', action: 'reload' },
      { id: 'touch-dash', label: 'DASH', cls: 'touch-btn-dash', action: 'dash' },
      { id: 'touch-weapon-next', label: '>', cls: 'touch-btn-weapon', action: 'weaponNext' },
      { id: 'touch-weapon-prev', label: '<', cls: 'touch-btn-weapon', action: 'weaponPrev' },
    ];

    btnConfigs.forEach(cfg => {
      const btn = document.createElement('button');
      btn.id = cfg.id;
      btn.className = 'touch-btn ' + cfg.cls;
      btn.textContent = cfg.label;
      btn.dataset.action = cfg.action;
      container.appendChild(btn);
      this._touchButtons[cfg.action] = btn;

      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._handleTouchButtonAction(cfg.action, true);
      }, { passive: false });

      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (cfg.action === 'fire') {
          this._handleTouchButtonAction(cfg.action, false);
        }
      }, { passive: false });

      btn.addEventListener('touchcancel', (e) => {
        if (cfg.action === 'fire') {
          this.firePressed = false;
        }
      }, { passive: true });

      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._handleTouchButtonAction(cfg.action, true);
      });

      btn.addEventListener('pointerup', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (cfg.action === 'fire') {
          this._handleTouchButtonAction(cfg.action, false);
        }
      });

      btn.addEventListener('pointercancel', (e) => {
        if (cfg.action === 'fire') {
          this.firePressed = false;
        }
      });
    });
  }

  _handleTouchButtonAction(action, active) {
    switch (action) {
      case 'fire':
        if (active) {
          this.firePressed = true;
          this.fireClicked = true;
          if (this.game.respawnReady && !this.game.respawnRequested) {
            this.respawnRequested = true;
            this.firePressed = false;
          }
        } else {
          this.firePressed = false;
          if (AUDIO && this.game.localPlayer) {
            AUDIO.stopBeamHum(this.game.localPlayer.weapon);
          }
        }
        break;
      case 'jump':
        if (active) this.jumpRequested = true;
        break;
      case 'reload':
        if (active) this.reloadRequested = true;
        break;
      case 'dash':
        if (active) this.dashRequested = true;
        break;
      case 'weaponNext':
        if (active) this.weaponNextRequested = true;
        break;
      case 'weaponPrev':
        if (active) this.weaponPrevRequested = true;
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
        this._touchLookStartX = touch.clientX;
        this._touchLookStartY = touch.clientY;
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      const touch = Array.from(e.changedTouches).find(t => t.identifier === this._touchLookId);
      if (!touch) return;
      e.preventDefault();
      const dx = touch.clientX - this._touchLookLastX;
      const dy = touch.clientY - this._touchLookLastY;
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
