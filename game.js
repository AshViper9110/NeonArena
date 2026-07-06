/* ============================================================
   NEON ARENA - メインゲームクラス
   GameStateによる状態管理、ゲームループ、全ゲームロジック
   ============================================================ */

class Game {
  constructor() {
    this.players = new Map();
    this.localId = null;
    this.projectiles = [];
    this.remoteProjIdCounter = 0;
    this.keys = {};
    this.mouseDelta = 0;
    this.network = new NetworkManager(this);
    this.gameState = GameState.TITLE;
    this.gameStarted = false;
    this.gameOver = false;
    this.connectionHandled = false;
    this.kills = 0;
    this.deaths = 0;
    this.respawnTimer = 0;
    this.respawnCountdownValue = 0;
    this.gameTimer = CONFIG.gameTimeLimit;
    this.selectedMap = 'grid';
    this.mapIndex = 0;
    this.pointerLocked = false;
    this.clock = new THREE.Clock();
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.arenaObjects = [];
    this.rimLights = [];
    this.scoreboard = new Map();
    this.killCamKillerId = null;
    this.killCamKillerName = '';
    this.killCamWeapon = '';
    this.invincibleTimer = 0;
    this.teleportCooldown = 0;
    this.loadoutWeapon = WEAPON_REGISTRY.getAll()[0] || 'pistol';
    this.weaponManager = new WeaponManager(WEAPON_REGISTRY);
    this.weaponManager.set(this.loadoutWeapon);
    this.mouseDown = false;
    this.mouseClicked = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.dashTriggered = false;
    this.inputIdCounter = 0;
    this.isFalling = false;
    this.wasGrounded = true;
    this.killStreak = 0;
    this.lastKillTime = 0;
    this.multiKillTimer = 0;
    this.killCountThisLife = 0;
    this.countdownValue = 0;
    this.countdownTimer = 0;
    this.resultTimer = 0;
    this.cheatDetectedTimer = 0;
    this.isHost = false;
    this.clientReady = new Map();
    this.clientWeapons = new Map();
    this.loadoutPassive = 'none';
    this.clientPassives = new Map();

    this._lastPreviewedMap = null;
    this._spawnIndex = 0;

    this.cheatValidator = null;
    this.hostAuthority = null;
    this.hitValidator = null;
    this.effectManager = null;
    this.cameraEffectManager = null;
    this.matchStats = null;
    this.killFeedManager = null;
    this.passiveManager = null;
    this.trainingManager = null;
    this.trainingUI = null;
    this.input = null;
    this.pitch = 0;
  }

  get localPlayer() { return this.players.get(this.localId); }

  /* ----------------------------------------------------------
     GameState管理
     ---------------------------------------------------------- */
  setState(newState) {
    if (this.gameState === newState) return;
    const prev = this.gameState;
    this.gameState = newState;
    this._onStateChange(prev, newState);
  }

  _onStateChange(prev, next) {
    this._hideAllScreens();
    switch (next) {
      case GameState.TITLE:
        document.getElementById('title-screen').style.display = '';
        this._clearGameWorld();
        this._updateTouchControlsVisibility();
        break;
      case GameState.LOBBY:
        document.getElementById('lobby-screen').style.display = '';
        this._lastPreviewedMap = null;
        this._updateLobbyRoomID();
        this._updateLobbyUI();
        this._updateTouchControlsVisibility();
        break;
      case GameState.COUNTDOWN:
        this._startCountdown();
        break;
      case GameState.PLAYING:
        document.getElementById('hud').style.display = '';
        document.getElementById('instructions').classList.remove('hidden');
        this._updateTouchControlsVisibility();
        break;
      case GameState.RESULT:
        document.getElementById('result-screen').classList.add('show');
        document.getElementById('hud').style.display = 'none';
        document.getElementById('instructions').classList.add('hidden');
        document.getElementById('death-screen').classList.remove('show');
        this._updateTouchControlsVisibility();
        break;
      case GameState.CHEAT_DETECTED:
        document.getElementById('cheat-detected-screen').classList.add('show');
        document.getElementById('hud').style.display = 'none';
        document.getElementById('instructions').classList.add('hidden');
        document.getElementById('death-screen').classList.remove('show');
        document.getElementById('respawn-prompt').style.display = 'none';
        this._updateTouchControlsVisibility();
        break;
      case GameState.TRAINING:
        document.getElementById('training-overlays').style.display = '';
        document.getElementById('hud').style.display = 'none';
        document.getElementById('instructions').classList.add('hidden');
        this._enterTraining();
        this._updateTouchControlsVisibility();
        break;
    }
  }

  _hideAllScreens() {
    document.getElementById('title-screen').style.display = 'none';
    document.getElementById('lobby-screen').style.display = 'none';
    document.getElementById('countdown-overlay').style.display = 'none';
    document.getElementById('hud').style.display = 'none';
    document.getElementById('instructions').classList.add('hidden');
    document.getElementById('death-screen').classList.remove('show');
    document.getElementById('result-screen').classList.remove('show');
    document.getElementById('cheat-detected-screen').classList.remove('show');
    document.getElementById('training-overlays').style.display = 'none';
  }

  /* ----------------------------------------------------------
     初期化
     ---------------------------------------------------------- */
  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a12);
    this.scene.fog = new THREE.Fog(0x0a0a12, 20, 40);
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 100);
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.toneMapping = THREE.NoToneMapping;
    document.getElementById('game-container').appendChild(this.renderer.domElement);

    this.cheatValidator = new CheatValidator();
    this.cheatManager = new CheatManager(this);
    this.hostAuthority = new HostAuthority(this);
    this.hitValidator = new HitValidator(this);
    this.effectManager = new EffectManager(this.scene, this.camera);
    this.cameraEffectManager = new CameraEffectManager(this.camera);
    this.beamManager = new BeamManager(this.scene);
    this.matchStats = new MatchStatsManager(this);
    this.killFeedManager = new KillFeedManager();
    this.passiveManager = new PassiveManager(this);

    this._wireReloadCallback();
    this.input = new InputManager(this);
    this.input.init();
    this._setupLights();
    this._createArena(this.selectedMap);
    this.setState(GameState.TITLE);
    this.animate();
  }

  _updateTouchControlsVisibility() {
    const tc = document.getElementById('touch-controls');
    if (!tc) return;
    if (!this.input || !this.input.isMobile) { tc.style.display = 'none'; return; }
    if (this.gameState === GameState.PLAYING) {
      tc.style.display = '';
    } else if (this.gameState === GameState.TRAINING) {
      const panel = document.getElementById('training-left-panel');
      tc.style.display = (panel && !panel.classList.contains('closed')) ? 'none' : '';
    } else {
      tc.style.display = 'none';
    }
  }

  _setupLights() {
    this.ambientLight = new THREE.AmbientLight(0x111122, 0.5);
    this.scene.add(this.ambientLight);
    this.dirLight = new THREE.DirectionalLight(0x8844ff, 1.0);
    this.dirLight.position.set(10, 20, 10);
    this.scene.add(this.dirLight);
    [
      [[-20, 8, -20], 0x00f0ff], [[20, 8, -20], 0xff00ff],
      [[-20, 8, 20], 0x00f0ff], [[20, 8, 20], 0xff00ff],
    ].forEach(([pos, col]) => {
      const l = new THREE.PointLight(col, 0.6, 30);
      l.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(l);
      this.rimLights.push(l);
      const h = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 8),
        new THREE.MeshBasicMaterial({ color: col })
      );
      h.position.copy(l.position);
      this.scene.add(h);
    });
  }

  _clearArena() {
    this.arenaObjects.forEach(o => {
      this.scene.remove(o);
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
    this.arenaObjects = [];
    this.rimLights.forEach(l => this.scene.remove(l));
    this.rimLights = [];
  }

  _createArena(mapKey) {
    this._clearArena();
    const map = MAP_REGISTRY.get(mapKey) || MAP_REGISTRY.get('grid');
    this.scene.background = new THREE.Color(map.bg);
    this.scene.fog = new THREE.Fog(map.bg, map.fogNear, map.fogFar);
    if (this.ambientLight) {
      this.ambientLight.color.setHex(map.ambientColor);
      this.ambientLight.intensity = map.ambientIntensity;
    }
    if (this.dirLight) {
      this.dirLight.color.setHex(map.dirColor);
      this.dirLight.intensity = map.dirIntensity;
    }
    const half = map.size / 2;
    const wallMat = new THREE.MeshStandardMaterial({
      color: map.wallColor, metalness: 0.2, roughness: 0.6,
    });
    const addWall = (pos, size, idx) => {
      const geo = new THREE.BoxGeometry(...size);
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(pos[0], pos[1], pos[2]);
      this.scene.add(mesh);
      this.arenaObjects.push(mesh);
      const eg = new THREE.EdgesGeometry(geo);
      const em = new THREE.LineBasicMaterial({
        color: map.edgeColors[idx % map.edgeColors.length],
        transparent: true, opacity: 0.25,
      });
      const el = new THREE.LineSegments(eg, em);
      el.position.copy(mesh.position);
      this.scene.add(el);
      this.arenaObjects.push(el);
    };
    const wallData = [
      { p: [0, map.wallHeight / 2, -half], s: [map.size, map.wallHeight, map.wallThick] },
      { p: [0, map.wallHeight / 2, half], s: [map.size, map.wallHeight, map.wallThick] },
      { p: [-half, map.wallHeight / 2, 0], s: [map.wallThick, map.wallHeight, map.size] },
      { p: [half, map.wallHeight / 2, 0], s: [map.wallThick, map.wallHeight, map.size] },
    ];
    wallData.forEach((d, i) => addWall(d.p, d.s, i));
    map.walls.forEach((w, i) => addWall(w.p, w.s, i + 4));
    const fgeo = new THREE.PlaneGeometry(map.size - 1, map.size - 1);
    const fmat = new THREE.MeshStandardMaterial({
      color: map.floorColor, metalness: 0.3, roughness: 0.7,
    });
    const floor = new THREE.Mesh(fgeo, fmat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    this.scene.add(floor);
    this.arenaObjects.push(floor);
    const gh1 = new THREE.GridHelper(map.size - 2, 20, map.gridColor, 0x222255);
    gh1.material.transparent = true;
    gh1.material.opacity = 0.15;
    gh1.position.y = 0.02;
    this.scene.add(gh1);
    this.arenaObjects.push(gh1);
    const gh2 = new THREE.GridHelper(map.size - 2, 40, 0x4444aa, 0x222255);
    gh2.material.transparent = true;
    gh2.material.opacity = 0.08;
    gh2.position.y = 0.01;
    this.scene.add(gh2);
    this.arenaObjects.push(gh2);
    this.arenaMap = map;
    if (map.pads) {
      map.pads.forEach((pad, i) => {
        const g = new THREE.PlaneGeometry(pad.s[0], pad.s[2]);
        const padMat = new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? 0x00f0ff : 0xff00ff,
          transparent: true, opacity: 0.12 + 0.06 * Math.sin(i),
          side: THREE.DoubleSide,
        });
        const m = new THREE.Mesh(g, padMat);
        m.position.set(pad.p[0], 0.05, pad.p[2]);
        m.rotation.x = -Math.PI / 2;
        this.scene.add(m);
        this.arenaObjects.push(m);
        const eg = new THREE.EdgesGeometry(g);
        const em = new THREE.LineBasicMaterial({
          color: m.material.color, transparent: true, opacity: 0.3,
        });
        const el = new THREE.LineSegments(eg, em);
        el.position.copy(m.position);
        el.rotation.x = -Math.PI / 2;
        this.scene.add(el);
        this.arenaObjects.push(el);
      });
    }
  }

  _clearGameWorld() {
    this.players.forEach(p => p.destroy());
    this.players.clear();
    this.projectiles.forEach(p => p.destroy());
    this.projectiles = [];
    if (this.hostAuthority) this.hostAuthority.reset();
    if (this.cheatValidator) this.cheatValidator.reset();
    if (this.cheatManager) this.cheatManager.reset();
    if (this.effectManager) this.effectManager.clear();
    if (this.beamManager) this.beamManager.clear();
    document.getElementById('kill-feed').innerHTML = '';
    document.getElementById('kill-count').textContent = '0';
    document.getElementById('death-count').textContent = '0';
    this.kills = 0;
    this.deaths = 0;
    this.killStreak = 0;
    this.multiKillTimer = 0;
    this.lastKillTime = 0;
    this.killCountThisLife = 0;
    this.gameTimer = CONFIG.gameTimeLimit;
    this.respawnTimer = 0;
    this.invincibleTimer = 0;
    this.pitch = 0;
  }

  _enterTraining() {
    if (this.trainingManager) {
      this.trainingManager.destroy();
      this.trainingManager = null;
    }
    this._clearGameWorld();
    this._clearArena();
    this.trainingManager = new TrainingManager(this);
    this.trainingManager.init();

    if (!this.localPlayer) {
      this.addPlayer('training', 0x00f0ff, 'Player');
      this.localId = 'training';
    }
    const lp = this.localPlayer;
    if (lp) {
      lp.position.set(0, 0, -8);
      lp.targetPosition.copy(lp.position);
      lp.health = 9999;
      lp.alive = true;
      lp.weapon = this.loadoutWeapon;
      lp.refillAmmo();
      lp.lastFireTime = 0;
      lp.moveSpeedMult = 1;
      lp.healthRegen = 0;
      lp.onReloadComplete = (weapon) => {
        if (lp) { lp.ammo = lp.maxAmmo; }
      };
      this.updateAmmoUI();
      this.updateHealthUI();
      this.updateHeatUI();
    }

    if (this.passiveManager) {
      this.passiveManager.assignPassive(this.localId, this.loadoutPassive);
      if (this.localPlayer) this.passiveManager.applyToPlayer(this.localPlayer);
    }

    const panel = document.getElementById('training-left-panel');
    if (panel) panel.classList.remove('closed');
    const toggleBtn = document.getElementById('training-toggle-btn');
    if (toggleBtn) toggleBtn.style.display = 'none';

    this.trainingUI = new TrainingUI(this);
    this.trainingUI.init();

    if (document.pointerLockElement) document.exitPointerLock();
    this.pointerLocked = false;
  }

  /* ----------------------------------------------------------
     プレイヤー管理
     ---------------------------------------------------------- */
  addPlayer(id, color, name) {
    if (this.players.has(id)) return this.players.get(id);
    const p = new Player(this.scene, id, color);
    p.name = name || 'Player';
    this.players.set(id, p);
    console.log('[Player Init] id=%s name=%s weapon=%s ammo=%s/%s alive=%s color=#%s',
      id, p.name, p.weapon, p.ammo, p.maxAmmo, p.alive, p.color.toString(16).padStart(6, '0'));
    return p;
  }

  removePlayer(id) {
    const p = this.players.get(id);
    if (p) { p.destroy(); this.players.delete(id); }
  }

  onConnected() {
    if (this.connectionHandled) return;
    this.connectionHandled = true;
  }

  onPlayerLeft(peerId) {
    this.removePlayer(peerId);
    this.clientReady.delete(peerId);
    this.clientWeapons.delete(peerId);
    if (this.network.isHost) {
      this.network.broadcast({ type: 'player_left', peerId });
      if (this.gameState === GameState.LOBBY) {
        this._syncLobbyState();
      }
    }
    if (this.gameState === GameState.LOBBY) {
      this._updateLobbyUI();
    }
  }

  onDisconnected() {
    this.addKillFeed('Connection lost');
  }

  /* ----------------------------------------------------------
     ネットワークメッセージ処理
     ---------------------------------------------------------- */
  handleMessage(data, conn) {
    if (!data || !data.type) return;
    switch (data.type) {
      case 'join': if (this.network.isHost) this._handleJoin(data, conn); break;
      case 'welcome': this._handleWelcome(data); break;
      case 'player_joined': this._handlePlayerJoined(data); break;
      case 'state': this._handleState(data, conn); break;
      case 'fire_request':
        console.log('[Network] recv fire_request from=%s weapon=%s', conn ? conn.peer : '?', data.weapon);
        if (this.network.isHost) this._handleFireRequest(data, conn);
        else console.log('[Network] NOT host, ignoring fire_request');
        break;
      case 'proj_spawn': this._handleProjSpawn(data); break;
      case 'hit': this._handleHit(data); break;
      case 'hit_effect': this._handleHitEffect(data); break;
      case 'explosion': this._handleExplosionEffect(data); break;
      case 'ammo_update': this._handleAmmoUpdate(data); break;
      case 'player_correct': this._handlePlayerCorrect(data); break;
      case 'respawn': this._handleRemoteRespawn(data); break;
      case 'respawn_request':
        if (this.network.isHost) this._handleRespawnRequest(data, conn);
        break;
      case 'game_start': this._handleGameStart(data); break;
      case 'map_select': this._handleMapSelect(data); break;
      case 'game_over': this._handleGameOver(data); break;
      case 'reload_complete':
        if (this.network.isHost && this.hostAuthority) {
          this.hostAuthority.refillAmmo(conn.peer, data.weapon);
        }
        break;
      case 'beam_fire':
        if (this.network.isHost && this.hostAuthority && conn) {
          if (data.inputId === undefined) break;
          this.hostAuthority.handleBeamFireRequest(data, conn.peer, conn.peer + '_' + data.inputId);
        }
        break;
      case 'beam_effect':
        this._handleBeamEffect(data);
        break;
      /* 新規メッセージ */
      case 'ready': if (this.network.isHost) this._handleReady(data, conn); break;
      case 'weapon_change': this._handleWeaponChange(data, conn); break;
      case 'passive_change': this._handlePassiveChange(data, conn); break;
      case 'name_change': this._handleNameChange(data, conn); break;
      case 'lobby_state': this._handleLobbyState(data); break;
      case 'countdown_sync': this._handleCountdownSync(data); break;
      case 'game_timer': this._handleGameTimerSync(data); break;
      case 'player_left': this._handlePlayerLeft(data); break;
      case 'return_lobby': this._handleReturnLobby(data); break;
      case 'kill_feed': this._handleKillFeed(data); break;
      case 'cheat_detected': this._handleCheatDetected(data); break;
      case 'gravity_zone': this._handleGravityZone(data); break;
    }
  }

  /* ---- 既存メッセージ ---- */
  _handleJoin(data, conn) {
    const peerId = conn.peer;
    const colorIdx = this.players.size % PLAYER_COLORS.length;
    const color = PLAYER_COLORS[colorIdx];
    const name = data.name || 'Player';
    this.addPlayer(peerId, color, name);
    this.clientReady.set(peerId, false);
    const defaultWeapon = WEAPON_REGISTRY.getAll()[0] || 'pistol';
    this.clientWeapons.set(peerId, defaultWeapon);
    this.clientPassives.set(peerId, 'none');
    if (!this.clientWeapons.has(this.network.myId)) {
      this.clientWeapons.set(this.network.myId, this.loadoutWeapon);
    }
    if (!this.clientPassives.has(this.network.myId)) {
      this.clientPassives.set(this.network.myId, this.loadoutPassive);
    }
    const joiningMidGame = this.gameStarted && !this.gameOver;
    if (joiningMidGame) {
      const p = this.players.get(peerId);
      if (p) {
        const sp = this._getSpawnPosition();
        p.position.copy(sp);
        p.targetPosition.copy(sp);
        p.health = CONFIG.maxHealth;
        p.alive = true;
        const weapon = this.clientWeapons.get(peerId) || defaultWeapon;
        p.weapon = weapon;
        p.refillAmmo();
        if (this.passiveManager) {
          const passiveId = this.clientPassives.get(peerId) || 'none';
          this.passiveManager.assignPassive(peerId, passiveId);
          this.passiveManager.applyToPlayer(p);
          this.passiveManager.reloadPlayerAmmo(peerId);
        }
        p.updateMesh();
      }
    }
    this.network.connected = true;
    console.log('[Player Init] _handleJoin peerId=%s name=%s weapon=%s playerCount=%d',
      peerId, name, defaultWeapon, this.players.size);
    if (!this.connectionHandled) {
      this.connectionHandled = true;
      this.onConnected();
    }
    conn.send({
      type: 'welcome',
      players: Array.from(this.players.entries()).map(([id, p]) => ({
        id, name: p.name, color: p.color, weapon: this.clientWeapons.get(id) || defaultWeapon,
        passive: this.clientPassives.get(id) || 'none',
        ready: id === this.network.myId ? true : (this.clientReady.get(id) || false),
      })),
      yourId: peerId,
      map: this.selectedMap,
      gameStarted: this.gameStarted,
      gameTimer: this.gameTimer,
    });
    this.network.broadcast({
      type: 'player_joined', id: peerId, name, color,
      weapon: defaultWeapon, passive: 'none', ready: false
    }, conn);
    if (!joiningMidGame) {
      this._updateLobbyUI();
      this._syncLobbyState();
    }
  }

  _handleWelcome(data) {
    this.connectionHandled = true;
    this.onConnected();
    const defaultWeapon = WEAPON_REGISTRY.getAll()[0] || 'pistol';
    data.players.forEach(p => {
      this.addPlayer(p.id, p.color, p.name);
      this.clientWeapons.set(p.id, p.weapon || defaultWeapon);
      this.clientPassives.set(p.id, p.passive || 'none');
      if (p.id === data.yourId) {
        this.loadoutWeapon = p.weapon || defaultWeapon;
        this.loadoutPassive = p.passive || 'none';
      }
      this.clientReady.set(p.id, p.ready || false);
    });
    this.localId = data.yourId;
    this.weaponManager.set(this.loadoutWeapon);
    this.selectedMap = data.map || 'grid';
    this.mapIndex = MAP_REGISTRY.getIndex(this.selectedMap);
    this._lastPreviewedMap = null;
    if (this.localPlayer) {
      this.localPlayer.weapon = this.loadoutWeapon;
      this.localPlayer.lastFireTime = 0;
      this.localPlayer.onReloadComplete = this._onReloadComplete;
      this.localPlayer.refillAmmo();
    }
    console.log('[Player Init] _handleWelcome localId=%s loadoutWeapon=%s alive=%s ammo=%d/%d',
      this.localId, this.loadoutWeapon, this.localPlayer ? this.localPlayer.alive : '?',
      this.localPlayer ? this.localPlayer.ammo : '?', this.localPlayer ? this.localPlayer.maxAmmo : '?');
    if (data.gameStarted) {
      this._createArena(this.selectedMap);
      this.gameStarted = true;
      this.gameOver = false;
      this.gameTimer = data.gameTimer || CONFIG.gameTimeLimit;
      this.network.sendTimer = CONFIG.stateSendRate;
      this.addKillFeed('Joined game in progress');
      this.setState(GameState.PLAYING);
      if (!this.pointerLocked) {
        setTimeout(() => this.renderer.domElement.requestPointerLock(), 300);
      }
    } else {
      this._createArena(this.selectedMap);
      this.setState(GameState.LOBBY);
    }
  }

  _handlePlayerJoined(data) {
    this.addPlayer(data.id, data.color, data.name);
    this.clientReady.set(data.id, data.ready !== undefined ? data.ready : false);
    this.clientWeapons.set(data.id, data.weapon || WEAPON_REGISTRY.getAll()[0]);
    this.clientPassives.set(data.id, data.passive || 'none');
    this._updateLobbyUI();
    this.addKillFeed(`${data.name} joined`);
  }

  _handleState(data, conn) {
    const p = this.players.get(data.id);
    if (!p) return;
    p.targetPosition.set(data.pos.x, data.pos.y, data.pos.z);
    p.targetRotation = data.rot;
    if (data.alive !== undefined) p.alive = data.alive;
    if (data.health !== undefined) p.health = data.health;
    if (data.weapon !== undefined) p.weapon = data.weapon;
    if (this.network.isHost) {
      this.network.broadcast(data, this._findConn(data.id));
    }
  }

  _findConn(playerId) {
    return this.network.connections.find(c => c.peer === playerId);
  }

  _handleFireRequest(data, conn) {
    if (!this.hostAuthority) return;
    if (data.inputId === undefined) return;
    this.hostAuthority.handleFireRequest(data, conn.peer, conn.peer + '_' + data.inputId);
  }

  _handleProjSpawn(data) {
    console.log('[Projectile Receive] ownerId=%s pid=%s weapon=%s localId=%s', data.ownerId, data.pid, data.weapon, this.network.myId);
    const origin = new THREE.Vector3(data.pos.x, data.pos.y, data.pos.z);
    const dir = new THREE.Vector3(data.dir.x, data.dir.y, data.dir.z);
    const mapHalf = this.arenaMap ? this.arenaMap.size / 2 : 40;
    const proj = new Projectile(this.scene, origin, dir,
      data.ownerId, data.pid, data.color, data.weapon, mapHalf);
    proj.isRemote = true;
    if (data.homing) {
      proj.isHoming = true;
      proj.homingTargetId = data.homingTarget || null;
    }
    this.projectiles.push(proj);
    const owner = this.players.get(data.ownerId);
    if (owner) {
      this.effectManager.spawnMuzzleFlash(origin, dir, data.color || owner.color);
    }
  }

  _handleBeamEffect(data) {
    if (this.beamManager) {
      const startPos = new THREE.Vector3(data.startPos.x, 0, data.startPos.z);
      const endPos = new THREE.Vector3(data.endPos.x, 0, data.endPos.z);
      const wp = WEAPONS[data.weapon];
      this.beamManager.fireBeam(startPos, endPos, wp, data.color);
    }
  }

  _applyLocalHitEffects(data) {
    if (this.invincibleTimer > 0 || !this.localPlayer) return;
    this.cameraEffectManager.hitShake(3);
    this.cameraEffectManager.damageFlash();
    this.updateHealthUI();
    if (this.effectManager) {
      this.effectManager.spawnPlayerDamageFlash(this.localPlayer);
    }
    if (data.lethal) {
      this.deaths++;
      document.getElementById('death-count').textContent = this.deaths;
      this._showDeathScreen(data);
    }
  }

  _showDeathScreen(data) {
    this.respawnTimer = 3;
    this.respawnCountdownValue = 3;
    this.respawnReady = false;
    this.respawnRequested = false;
    this.killCamKillerId = data.shooterId;
    this.killCamKillerName = data.shooterName || 'Unknown';
    const wpData = data.weapon ? WEAPONS[data.weapon] : null;
    const beamIcon = wpData && wpData.weaponType === 'beam' ? '⚡ ' : '';
    this.killCamWeapon = wpData ? beamIcon + wpData.displayName : (data.weapon || '');
    document.getElementById('death-screen').classList.add('show');
    document.getElementById('death-killer-name').textContent = `Killed By ${this.killCamKillerName}`;
    document.getElementById('death-weapon-name').textContent = this.killCamWeapon;
    document.getElementById('respawn-countdown').textContent = '3';
    document.getElementById('respawn-prompt').style.display = 'none';
    this._updateWeaponSelectorUI('death');
    this._updatePassiveSelectorUI('death');
    if (document.pointerLockElement) document.exitPointerLock();
  }

  _playRemoteDeathEffect(victimId, data) {
    const victim = this.players.get(victimId);
    if (!victim) return;

    victim.playDeathEffect();

    if (this.effectManager) {
      this.effectManager.spawnKillEffect(victim.position);
      this.effectManager.spawnPlayerDamageFlash(victim);
    }

    if (AUDIO) {
      AUDIO.play('player_death', { position: victim.position });
    }
  }

  _handleHit(data) {
    if (data.targetId === this.network.myId) {
      if (this.invincibleTimer > 0) return;
      const killed = this.localPlayer.takeDamage(data.damage || 1);
      data.lethal = killed;
      this._applyLocalHitEffects(data);
      if (AUDIO) {
        AUDIO.play('player_hit', { position: this.localPlayer.position });
        if (data.lethal) AUDIO.play('player_death', { position: this.localPlayer.position });
      }
    }
    if (data.shooterId === this.network.myId) {
      if (AUDIO) AUDIO.play(data.lethal ? 'player_kill' : 'hit');
    }
    if (data.lethal) {
      this._trackKill(data.shooterId, data.targetId, data.weapon);
      if (data.targetId !== this.network.myId) {
        this._playRemoteDeathEffect(data.targetId, data);
      }
    }
    if (this.network.isHost) {
      this.network.broadcast(data, this._findConn(data.shooterId));
    }
  }



  _handleHitEffect(data) {
    const pos = new THREE.Vector3(data.pos.x, data.pos.y, data.pos.z);
    if (AUDIO) AUDIO.play('wall_hit', { position: pos });
    if (this.effectManager) {
      this.effectManager.spawnHitEffect(pos.clone(), data.color || 0xffffff);
    }
    this._removeLocalProjectile(data.pid);
  }

  /* 命中/爆発が確定した弾を、各クライアントが表示用に持っている
     ローカルの弾（エコー用Projectile）から取り除く。
     これをしないと、着弾後も見た目上の弾が壁や相手を貫通して
     飛び続けてしまう（衝突判定はホスト側のみで行われるため）。 */
  _removeLocalProjectile(pid) {
    if (pid === undefined || pid === null) return;
    const idx = this.projectiles.findIndex(p => p.id === pid);
    if (idx >= 0) {
      this.projectiles[idx].destroy();
      this.projectiles.splice(idx, 1);
    }
  }

  _handleExplosionEffect(data) {
    const pos = new THREE.Vector3(data.pos.x, data.pos.y, data.pos.z);
    if (AUDIO) AUDIO.play('explosion', { position: pos });
    if (this.effectManager) {
      this.effectManager.spawnExplosion(pos.clone(), data.color || 0xff4400);
    }
    this._removeLocalProjectile(data.pid);
    this.cameraEffectManager.explosionShake(8);
    const dist = this.localPlayer
      ? pos.distanceTo(new THREE.Vector3(this.localPlayer.position.x, 0, this.localPlayer.position.z))
      : Infinity;
    if (dist < 15) {
      this.cameraEffectManager.explosionShake(12 - dist * 0.5);
    }
  }

  _handleGravityZone(data) {
    const pos = new THREE.Vector3(data.pos.x, 0, data.pos.z);
    if (this.effectManager) {
      this.effectManager.spawnExplosion(pos.clone(), data.color || 0x2200aa);
    }
    this.cameraEffectManager.explosionShake(4);
  }

  _handleAmmoUpdate(data) {
    const lp = this.localPlayer;
    if (!lp) return;
    if (lp.weapon === data.weapon) {
      lp.ammo = data.ammo;
      lp.maxAmmo = data.maxAmmo || lp.maxAmmo;
      this.updateAmmoUI();
    }
  }

  _handlePlayerCorrect(data) {
    const p = this.players.get(data.id);
    if (p && data.id === this.network.myId) {
      p.position.set(data.pos.x, data.pos.y, data.pos.z);
      p.targetPosition.copy(p.position);
    }
  }

  _handleRemoteRespawn(data) {
    console.log('[Respawn] _handleRemoteRespawn id=%s isHost=%s exists=%s alive=%s',
      data.id, this.network.isHost, !!this.players.get(data.id),
      this.players.get(data.id) ? this.players.get(data.id).alive : '?');
    const p = this.players.get(data.id);
    if (p) {
      p.health = CONFIG.maxHealth;
      p.alive = true;
      p.resetVisualState();
      if (this.passiveManager && this.network.isHost) {
        this.passiveManager.applyToPlayer(p);
      }
      if (data.pos) {
        p.position.set(data.pos.x, data.pos.y, data.pos.z);
        p.targetPosition.copy(p.position);
      } else {
        p.spawn(this._spawnHalfExtent());
      }
      p.updateMesh();
      if (data.id === this.network.myId) {
        const lp = p;
        lp.weapon = this.loadoutWeapon;
        lp.refillAmmo();
        lp.reloading = false;
        lp.reloadTimer = 0;
        lp.lastFireTime = 0;
        this.mouseDown = false;
        this.mouseClicked = false;
        this.invincibleTimer = CONFIG.invincibleTime;
        lp.onReloadComplete = this._onReloadComplete;
        this.updateAmmoUI();
        this.updateHealthUI();
        this.updateHeatUI();
        this.killCountThisLife = 0;
        this.killStreak = 0;
        this.killCamKillerId = null;
        this.respawnReady = false;
        this.respawnRequested = false;
        document.getElementById('death-screen').classList.remove('show');
        document.getElementById('respawn-countdown').style.display = '';
        document.getElementById('respawn-prompt').style.display = 'none';
        if (this.matchStats && lp) {
          this.matchStats.killStreaks.set(this.network.myId, 0);
          lp.currentKillStreak = 0;
        }
      }
    }
    if (this.effectManager && data.pos) {
      this.effectManager.spawnRespawnEffect(
        new THREE.Vector3(data.pos.x, 0.5, data.pos.z),
        p ? p.color : 0x00f0ff
      );
    }
    if (this.network.isHost) {
      this.network.broadcast(data);
      if (this.hostAuthority) {
        this.hostAuthority.refillAllAmmo(data.id);
        this.hostAuthority.respawnedPeers.add(data.id);
      }
    }
  }

  _handleRespawnRequest(data, conn) {
    const peerId = conn.peer;
    const p = this.players.get(peerId);
    if (!p || p.alive) return;
    console.log('[Host] respawn_request from %s', peerId);
    const spawnPos = this._getSpawnPosition();
    const msg = {
      type: 'respawn', id: peerId,
      pos: { x: spawnPos.x, y: 0, z: spawnPos.z },
    };
    this._handleRemoteRespawn(msg);
  }

  _handleGameStart(data) {
    this.selectedMap = data.map;
    this.mapIndex = MAP_REGISTRY.getIndex(this.selectedMap);
    this._createArena(data.map);
    this.setState(GameState.COUNTDOWN);
  }

  _handleMapSelect(data) {
    this.selectedMap = data.map;
    this.mapIndex = MAP_REGISTRY.getIndex(this.selectedMap);
    this._lastPreviewedMap = null;
    if (this.gameState === GameState.LOBBY) {
      this._updateLobbyUI();
    }
  }

  _handleGameOver(data) {
    this.gameStarted = false;
    this.gameOver = true;
    if (data.scoreboard) {
      this.players.forEach((p, id) => {
        const entry = data.scoreboard.find(s => s.id === id);
        if (entry) { p.kills = entry.kills; p.deaths = entry.deaths; }
      });
    }
    this._showResultScreen(data.scoreboard);
  }

  /* ---- 新規メッセージ ---- */
  _handleReady(data, conn) {
    const peerId = conn.peer;
    this.clientReady.set(peerId, !!data.ready);
    if (this.gameState === GameState.LOBBY) {
      this._updateLobbyUI();
      this._syncLobbyState();
    }
  }

  _handleWeaponChange(data, conn) {
    const peerId = this.network.isHost ? conn.peer : data.id;
    this.clientWeapons.set(peerId, data.weapon);
    if (peerId === this.localId) {
      this.loadoutWeapon = data.weapon;
      this.weaponManager.set(data.weapon);
      if (this.localPlayer) this.localPlayer.weapon = data.weapon;
    }
    if (this.gameState === GameState.LOBBY) this._updateLobbyUI();
    if (this.network.isHost) {
      this._syncLobbyState();
    }
  }

  _handlePassiveChange(data, conn) {
    const peerId = this.network.isHost ? conn.peer : data.id;
    this.clientPassives.set(peerId, data.passiveId);
    if (peerId === this.localId) {
      this.loadoutPassive = data.passiveId;
      if (this.passiveManager) {
        this.passiveManager.assignPassive(peerId, data.passiveId);
        if (this.gameState === GameState.PLAYING && this.localPlayer && this.localPlayer.alive) {
          this.passiveManager.applyToPlayer(peerId);
        }
      }
    }
    if (this.gameState === GameState.LOBBY || this.gameState === GameState.RESULT) this._updateLobbyUI();
    if (this.network.isHost) {
      this._syncLobbyState();
    }
  }

  _handleNameChange(data, conn) {
    const peerId = this.network.isHost ? conn.peer : data.id;
    const p = this.players.get(peerId);
    if (p) p.name = data.name;
    if (this.network.isHost) {
      this.network.broadcast({ type: 'name_change', id: peerId, name: data.name }, conn);
      this._syncLobbyState();
    }
    if (this.gameState === GameState.LOBBY) this._updateLobbyUI();
  }

  _handleLobbyState(data) {
    this.selectedMap = data.map;
    this.mapIndex = MAP_REGISTRY.getIndex(this.selectedMap);
    this._lastPreviewedMap = null;
    if (data.players) {
      const ids = new Set();
      data.players.forEach(p => {
        ids.add(p.id);
        this.clientReady.set(p.id, p.ready);
        this.clientWeapons.set(p.id, p.weapon);
        this.clientPassives.set(p.id, p.passive || 'none');
        if (p.id === this.localId) {
          this.loadoutWeapon = p.weapon;
          this.weaponManager.set(p.weapon);
          this.loadoutPassive = p.passive || 'none';
          if (this.passiveManager) {
            this.passiveManager.setPassive(p.id, this.loadoutPassive);
          }
          const btn = document.getElementById('btn-ready');
          if (btn) {
            const isReady = !!p.ready;
            btn.dataset.ready = isReady ? 'true' : 'false';
            btn.textContent = isReady ? '✔ READY' : '▶ READY';
          }
        }
        const player = this.players.get(p.id);
        if (player && p.name) player.name = p.name;
      });
      this.players.forEach((player, id) => {
        if (!ids.has(id) && id !== this.localId) {
          this.removePlayer(id);
        }
      });
    }
    this._updateLobbyUI();
  }

  _handleCountdownSync(data) {
    if (this.gameState !== GameState.COUNTDOWN) return;
    this.countdownValue = data.value;
    this.countdownTimer = 0;
    if (this.countdownValue > 0) {
      this._showCountdownNumber(this.countdownValue);
    } else if (this.countdownValue === 0) {
      this._showCountdownNumber(0);
    } else {
      document.getElementById('countdown-overlay').style.display = 'none';
      this._startMatch();
    }
  }

  _handleGameTimerSync(data) {
    this.gameTimer = data.time;
  }

  _handlePlayerLeft(data) {
    this.removePlayer(data.peerId);
    if (this.gameState === GameState.LOBBY) {
      this._updateLobbyUI();
    }
  }

  _handleReturnLobby(data) {
    this._returnToLobby();
  }

  _handleCheatDetected(data) {
    console.log('[CheatDetected] player=%s reason=%s', data.playerName, data.reason);
    this.gameStarted = false;
    this.gameOver = true;
    this.respawnReady = false;
    this.respawnRequested = false;
    document.getElementById('cheat-detected-player').textContent = 'Player: ' + (data.playerName || data.playerId);
    document.getElementById('cheat-detected-reason').textContent = 'Reason: ' + (data.reason || 'Unknown');
    this.cheatDetectedTimer = 3;
    this.setState(GameState.CHEAT_DETECTED);
  }

  _handleKillFeed(data) {
    if (this.gameState !== GameState.PLAYING && this.gameState !== GameState.RESULT) return;
    // Non-host clients: display feed from host broadcast; host adds directly in _trackKill
    if (!this.network.isHost && this.killFeedManager) {
      this.killFeedManager.addEntry(data.killerName, data.victimName, data.weapon);
    }
  }

  /* ----------------------------------------------------------
     ロビー機能
     ---------------------------------------------------------- */
  _changeMap(direction) {
    if (this.gameState !== GameState.LOBBY) return;
    if (!this.network.isHost) return;
    if (AUDIO) AUDIO.play('ui_map_change');
    const count = MAP_REGISTRY.count();
    if (direction === 'next') {
      this.mapIndex = (this.mapIndex + 1) % count;
    } else {
      this.mapIndex = (this.mapIndex - 1 + count) % count;
    }
    this.selectedMap = MAP_REGISTRY.at(this.mapIndex);
    this._lastPreviewedMap = null;
    this._updateLobbyUI();
    this._syncLobbyState();
    this.network.broadcast({ type: 'map_select', map: this.selectedMap });
  }

  _updateLobbyRoomID() {
    const roomId = this.network.roomId;
    const el = document.getElementById('lobby-room-id');
    const roleEl = document.getElementById('lobby-room-role');
    if (!el) return;
    if (roomId) {
      el.textContent = roomId;
    } else {
      el.textContent = this.network.isHost ? '作成中...' : '接続中...';
    }
    if (roleEl) {
      roleEl.textContent = this.network.isHost ? 'ホスト' : '参加済み';
    }
  }

  _updateLobbyUI() {
    const isHost = this.network.isHost;
    document.getElementById('lobby-controls-host').style.display = isHost ? '' : 'none';
    document.getElementById('lobby-controls-client').style.display = isHost ? 'none' : '';
    const mapNav = document.getElementById('lobby-map-selector');
    if (mapNav) {
      const prevBtn = mapNav.querySelector('.ms-prev');
      const nextBtn = mapNav.querySelector('.ms-next');
      if (prevBtn) prevBtn.style.display = isHost ? '' : 'none';
      if (nextBtn) nextBtn.style.display = isHost ? '' : 'none';
    }
    this._updateLobbyMapInfo();
    this._renderPlayerList();
    this._updateStartButton();
    this._updateWeaponSelectorUI('lobby');
    this._updatePassiveSelectorUI('lobby');
    this._updateLobbyStatus();
    if (this._lastPreviewedMap !== this.selectedMap) {
      this._lastPreviewedMap = this.selectedMap;
      this._drawMapPreviews();
    }
  }

  _updateLobbyMapInfo() {
    const map = MAP_REGISTRY.get(this.selectedMap) || MAP_REGISTRY.get('grid');
    const nameEl = document.getElementById('lobby-map-name');
    const descEl = document.getElementById('lobby-map-desc');
    const recEl = document.getElementById('lobby-map-rec');
    const diffEl = document.getElementById('lobby-map-diff');
    if (nameEl) nameEl.textContent = map.nameJa || map.name;
    if (descEl) descEl.textContent = map.descJa || map.desc;
    if (recEl) recEl.innerHTML = `推奨人数<br>${map.recommendedPlayers}`;
    if (diffEl) diffEl.innerHTML = `難易度<br>${'★'.repeat(map.difficulty)}${'☆'.repeat(5 - map.difficulty)}`;
  }

  _updateLobbyStatus() {
    const total = this.players.size;
    let readyCount = 0;
    this.players.forEach((p, id) => {
      if (id === this.network.roomId) { readyCount++; return; }
      if (id === this.network.myId) {
        if (document.getElementById('btn-ready') && document.getElementById('btn-ready').dataset.ready === 'true') { readyCount++; }
        return;
      }
      if (this.clientReady.get(id)) readyCount++;
    });
    const countEl = document.getElementById('lobby-player-count');
    const readyEl = document.getElementById('lobby-ready-count');
    const statusEl = document.getElementById('lobby-status-text');
    if (countEl) countEl.textContent = `${total} / 8`;
    if (readyEl) readyEl.textContent = `${readyCount} / ${total}`;
    if (statusEl) {
      if (total === 0) {
        statusEl.textContent = 'プレイヤーを待機中...';
      } else if (total >= 2 && readyCount >= total - 1) {
        statusEl.textContent = '準備完了！';
      } else {
        const need = total - 1 - readyCount;
        statusEl.textContent = need <= 0 ? 'ホストの開始を待機中...' : `${need}人のプレイヤーを待機中...`;
      }
    }
  }

  _drawMapPreviews() {
    this._drawMapPreview(this.selectedMap);
    this._drawGuestMapPreview(this.selectedMap);
    this._lastPreviewedMap = this.selectedMap;
  }

  _drawMapPreview(mapKey) {
    const canvas = document.getElementById('map-preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const map = MAP_REGISTRY.get(mapKey) || MAP_REGISTRY.get('grid');
    const W = canvas.width, H = canvas.height;
    const pad = 10;
    const drawSize = W - pad * 2;
    const scale = drawSize / map.size;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(0, 0, W, H);
    const arenaX = pad + (W - drawSize) / 2;
    const arenaY = pad + (H - drawSize) / 2;
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(arenaX, arenaY, drawSize, drawSize);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(arenaX, arenaY, drawSize, drawSize);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.3)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
    ctx.lineWidth = 1;
    const halfMap = map.size / 2;
    const toCanvas = (x, z) => ({
      cx: arenaX + (x + halfMap) * scale,
      cy: arenaY + (z + halfMap) * scale,
    });
    map.walls.forEach(w => {
      const { cx, cy } = toCanvas(w.p[0], w.p[2]);
      const wScaleX = w.s[0] * scale;
      const wScaleZ = w.s[2] * scale;
      ctx.fillRect(cx - wScaleX / 2, cy - wScaleZ / 2, wScaleX, wScaleZ);
      ctx.strokeRect(cx - wScaleX / 2, cy - wScaleZ / 2, wScaleX, wScaleZ);
    });
    ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.font = '10px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(map.nameJa || map.name, W / 2, H - 4);
  }

  _drawGuestMapPreview(mapKey) {
    const canvas = document.getElementById('guest-map-preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const map = MAP_REGISTRY.get(mapKey) || MAP_REGISTRY.get('grid');
    const W = canvas.width, H = canvas.height;
    const pad = 6;
    const drawSize = W - pad * 2;
    const scale = drawSize / map.size;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(0, 0, W, H);
    const arenaX = pad + (W - drawSize) / 2;
    const arenaY = pad + (H - drawSize) / 2;
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(arenaX, arenaY, drawSize, drawSize);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(arenaX, arenaY, drawSize, drawSize);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.3)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
    ctx.lineWidth = 1;
    const halfMap = map.size / 2;
    const toCanvas = (x, z) => ({
      cx: arenaX + (x + halfMap) * scale,
      cy: arenaY + (z + halfMap) * scale,
    });
    map.walls.forEach(w => {
      const { cx, cy } = toCanvas(w.p[0], w.p[2]);
      const wScaleX = w.s[0] * scale;
      const wScaleZ = w.s[2] * scale;
      ctx.fillRect(cx - wScaleX / 2, cy - wScaleZ / 2, wScaleX, wScaleZ);
      ctx.strokeRect(cx - wScaleX / 2, cy - wScaleZ / 2, wScaleX, wScaleZ);
    });
    ctx.fillStyle = 'rgba(0, 240, 255, 0.3)';
    ctx.font = '8px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(map.nameJa || map.name, W / 2, H - 3);
  }

  _updateWeaponSelectorUI(target) {
    target = target || 'lobby';
    const wp = this.loadoutWeapon;
    const w = WEAPON_REGISTRY.get(wp);
    const nameEl = document.getElementById(target + '-ws-name');
    const statsEl = document.getElementById(target + '-ws-stats');
    if (nameEl) {
      const beamIcon = w && w.weaponType === 'beam' ? '⚡ ' : '';
      nameEl.textContent = w ? beamIcon + (w.displayNameJa || w.displayName) : '?';
    }
    if (statsEl) statsEl.innerHTML = w ? WEAPON_REGISTRY.statsLines(wp).join('<br>') : '';
  }

  _updateDeathWeaponSelector() {
    this._updateWeaponSelectorUI('death');
    this._updatePassiveSelectorUI('death');
  }

  _changeWeapon(direction) {
    if (AUDIO) AUDIO.play('ui_weapon_change');
    if (direction === 'next') {
      this.loadoutWeapon = WEAPON_REGISTRY.next(this.loadoutWeapon);
    } else {
      this.loadoutWeapon = WEAPON_REGISTRY.prev(this.loadoutWeapon);
    }
    this.weaponManager.set(this.loadoutWeapon);
    if (this.localPlayer) {
      this.localPlayer.weapon = this.loadoutWeapon;
    }
    this.clientWeapons.set(this.network.myId, this.loadoutWeapon);
    this._updateWeaponSelectorUI('lobby');
    this._updateWeaponSelectorUI('death');
    this.network.sendWeaponChange(this.loadoutWeapon);
    if (this.network.isHost) {
      this._syncLobbyState();
    }
  }

  _changePassive(direction) {
    if (AUDIO) AUDIO.play('ui_weapon_change');
    const ids = PassiveRegistry.getAll();
    let idx = ids.indexOf(this.loadoutPassive);
    if (direction === 'next') {
      idx = (idx + 1) % ids.length;
    } else {
      idx = (idx - 1 + ids.length) % ids.length;
    }
    this.loadoutPassive = ids[idx];
    this.clientPassives.set(this.network.myId, this.loadoutPassive);
    if (this.passiveManager) {
      this.passiveManager.assignPassive(this.network.myId, this.loadoutPassive);
    }
    this._updatePassiveSelectorUI('lobby');
    this._updatePassiveSelectorUI('death');
    this.network.sendPassiveChange(this.loadoutPassive);
    if (this.network.isHost) {
      this._syncLobbyState();
    }
  }

  _updatePassiveSelectorUI(target) {
    target = target || 'lobby';
    const p = PassiveRegistry.get(this.loadoutPassive);
    if (!p) return;
    const nameEl = document.getElementById(target + '-ps-name');
    const iconEl = document.getElementById(target + '-ps-icon');
    const descEl = document.getElementById(target + '-ps-desc');
    const rarityEl = document.getElementById(target + '-ps-rarity');
    const detail = PassiveRegistry.getDetail(this.loadoutPassive);
    if (nameEl) nameEl.textContent = (detail && detail.displayNameJa) || p.displayName || this.loadoutPassive;
    if (iconEl) iconEl.textContent = p.icon || '';
    if (descEl) descEl.textContent = (detail && detail.descriptionJa) || p.description || '';
    if (rarityEl) {
      const rarColors = { common: '#8888aa', uncommon: '#00ff88', rare: '#00aaff', epic: '#aa44ff' };
      rarityEl.textContent = p.rarity ? p.rarity.toUpperCase() : '';
      rarityEl.style.color = rarColors[p.rarity] || '#8888aa';
    }
  }

  _renderPlayerList() {
    const list = document.getElementById('player-list');
    list.innerHTML = '';
    const isHost = this.network.isHost;
    this.players.forEach((p, id) => {
      const card = document.createElement('div');
      card.className = 'pl-card';

      const dot = document.createElement('div');
      dot.className = 'pl-card-dot';
      dot.style.color = '#' + p.color.toString(16).padStart(6, '0');
      dot.style.background = '#' + p.color.toString(16).padStart(6, '0');

      const info = document.createElement('div');
      info.className = 'pl-card-info';

      const nameRow = document.createElement('div');
      nameRow.className = 'pl-card-name';
      const isHostPlayer = id === this.network.roomId;
      if (isHostPlayer) {
        const crown = document.createElement('span');
        crown.className = 'crown';
        crown.textContent = '👑';
        nameRow.appendChild(crown);
      }
      const nameSpan = document.createElement('span');
      nameSpan.textContent = p.name;
      nameRow.appendChild(nameSpan);
      if (id === this.network.myId && !isHostPlayer) {
        const you = document.createElement('span');
        you.className = 'you-tag';
        you.textContent = 'YOU';
        nameRow.appendChild(you);
      }

      const meta = document.createElement('div');
      meta.className = 'pl-card-meta';

      const weaponEl = document.createElement('span');
      weaponEl.className = 'pl-card-weapon';
      const wpId = this.clientWeapons.get(id) || WEAPON_REGISTRY.getAll()[0];
      const wpData = WEAPON_REGISTRY.get(wpId);
      const beamIcon = wpData && wpData.weaponType === 'beam' ? '⚡ ' : '';
      weaponEl.textContent = wpData ? beamIcon + wpData.displayName : wpId;

      const readyEl = document.createElement('span');
      readyEl.className = 'pl-card-ready';
      let isReady = false;
      if (isHostPlayer) {
        isReady = true;
        readyEl.classList.add('ready');
        readyEl.textContent = 'READY';
      } else if (id === this.network.myId) {
        isReady = document.getElementById('btn-ready') && document.getElementById('btn-ready').dataset.ready === 'true';
        readyEl.classList.add(isReady ? 'ready' : 'notready');
        readyEl.textContent = isReady ? 'READY' : 'NOT READY';
      } else {
        isReady = this.clientReady.get(id) || false;
        readyEl.classList.add(isReady ? 'ready' : 'notready');
        readyEl.textContent = isReady ? 'READY' : 'NOT READY';
      }

      const passiveEl = document.createElement('span');
      passiveEl.className = 'pl-card-passive';
      const passiveId = this.clientPassives.get(id) || 'none';
      const pData = PASSIVES[passiveId];
      if (pData) {
        const pIcon = document.createElement('span');
        pIcon.className = 'pl-card-passive-icon';
        pIcon.textContent = pData.icon || '';
        passiveEl.appendChild(pIcon);
        passiveEl.appendChild(document.createTextNode(pData.displayName || passiveId));
      } else {
        passiveEl.textContent = passiveId;
      }

      meta.appendChild(weaponEl);
      meta.appendChild(passiveEl);
      meta.appendChild(readyEl);
      info.appendChild(nameRow);
      info.appendChild(meta);

      const stats = document.createElement('div');
      stats.className = 'pl-card-stats';
      const k = document.createElement('span');
      k.className = 'pl-card-kills';
      k.textContent = `K${p.kills || 0}`;
      const d = document.createElement('span');
      d.className = 'pl-card-deaths';
      d.textContent = `D${p.deaths || 0}`;
      stats.appendChild(k);
      stats.appendChild(d);

      card.appendChild(dot);
      card.appendChild(info);
      card.appendChild(stats);
      list.appendChild(card);
    });
  }

  _updateStartButton() {
    const btn = document.getElementById('btn-start-game');
    const playerCount = this.players.size;
    let allReady = true;
    this.players.forEach((p, id) => {
      if (id === this.network.myId) return;
      if (!this.clientReady.get(id)) allReady = false;
    });
    const canStart = playerCount >= 2 && allReady;
    btn.disabled = !canStart;
    btn.style.opacity = canStart ? '1' : '0.4';
    btn.style.cursor = canStart ? 'pointer' : 'not-allowed';
  }

  _syncLobbyState() {
    if (!this.network.isHost) return;
    const players = [];
    this.players.forEach((p, id) => {
      players.push({
        id, name: p.name, ready: id === this.network.myId ? true : (this.clientReady.get(id) || false),
        weapon: this.clientWeapons.get(id) || WEAPON_REGISTRY.getAll()[0],
        passive: this.clientPassives.get(id) || 'none',
      });
    });
    this.network.broadcast({
      type: 'lobby_state', map: this.selectedMap, players,
      hostId: this.network.myId,
    });
  }

  /* ----------------------------------------------------------
     カウントダウン → 試合開始
     ---------------------------------------------------------- */
  _startCountdown() {
    this.countdownValue = 3;
    this.countdownTimer = 0;
    document.getElementById('countdown-overlay').style.display = '';
    this._showCountdownNumber(3);
  }

  _showCountdownNumber(value) {
    const el = document.getElementById('countdown-text');
    if (value > 0) {
      if (AUDIO) AUDIO.play('game_countdown', { position: null });
      el.textContent = String(value);
      el.style.animation = 'none';
      void el.offsetWidth;
      el.style.animation = 'countPulse 1s ease forwards';
    } else if (value === 0) {
      if (AUDIO) AUDIO.play('game_fight', { position: null });
      el.textContent = 'FIGHT!!';
      el.style.color = '#ff0044';
      el.style.textShadow = '0 0 60px rgba(255,0,68,0.5)';
      el.style.animation = 'none';
      void el.offsetWidth;
      el.style.animation = 'countPulse 1s ease forwards';
    }
  }

  _startMatch() {
    this.gameStarted = true;
    this.gameOver = false;
    this.gameTimer = CONFIG.gameTimeLimit;
    this.kills = 0;
    this.deaths = 0;
    this.scoreboard.clear();
    this.killCamKillerId = null;
    this.invincibleTimer = 0;
    this.mouseDown = false;
    this.mouseClicked = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.killStreak = 0;
    this.killCountThisLife = 0;
    this.multiKillTimer = 0;

    if (this.matchStats) this.matchStats.resetAll();
    this.players.forEach(p => p.resetMatchStats());

    if (this.killFeedManager) this.killFeedManager.clear();
    document.getElementById('kill-announcement').innerHTML = '';

    const hostId = this.network.myId;
    this.clientReady.forEach((v, id) => {
      if (id !== hostId) this.clientReady.delete(id);
    });
    this.clientReady.set(hostId, true);
    this.network.sendTimer = CONFIG.stateSendRate;
    document.getElementById('kill-count').textContent = '0';
    document.getElementById('death-count').textContent = '0';
    document.getElementById('kill-feed').innerHTML = '';
    document.getElementById('timer-display').textContent = '03:00';
    document.getElementById('timer-display').classList.remove('urgent');
    this.addKillFeed('GAME START!');
    let spawnIdx = 0;
    console.log('[Weapon Init] _startMatch players=%d clientWeapons=%d', this.players.size, this.clientWeapons.size);
    this.players.forEach((p) => {
      p.health = CONFIG.maxHealth;
      p.alive = true;
      const weapon = this.clientWeapons.get(p.id) || WEAPON_REGISTRY.getAll()[0];
      p.weapon = weapon;
      p.refillAmmo();
      const passiveId = this.clientPassives.get(p.id) || 'none';
      if (this.passiveManager) {
        this.passiveManager.assignPassive(p.id, passiveId);
        this.passiveManager.applyToPlayer(p);
        this.passiveManager.reloadPlayerAmmo(p.id);
      }
      const sp = this._getSpawnPosition(spawnIdx++);
      p.position.copy(sp);
      p.targetPosition.copy(sp);
      p.updateMesh();
      if (p.id === this.localId) {
        p.onReloadComplete = this._onReloadComplete;
      }
      console.log('[Weapon Init] player=%s weapon=%s passive=%s ammo=%d/%d alive=%s', p.id, weapon, passiveId, p.ammo, p.maxAmmo, p.alive);
    });
    const lp = this.localPlayer;
    if (lp) {
      lp.weapon = this.loadoutWeapon;
      this.passiveManager.reloadPlayerAmmo(this.network.myId);
      this.updateAmmoUI();
      this.updateHealthUI();
      this.updateHeatUI();
    }
    this.setState(GameState.PLAYING);
    if (!this.pointerLocked) {
      setTimeout(() => this.renderer.domElement.requestPointerLock(), 500);
    }
  }

  /* ----------------------------------------------------------
     試合中処理
     ---------------------------------------------------------- */
  shoot() {
    const lp = this.localPlayer;
    if (!lp || !lp.alive) { console.log('[Fire] shoot BLOCKED: !lp=%s !alive=%s', !lp, lp ? !lp.alive : true); return; }
    if (lp.reloading) { console.log('[Fire] shoot BLOCKED: reloading'); return; }
    if (lp.overheated) { console.log('[Fire] shoot BLOCKED: overheated'); return; }
    if (lp.ammo <= 0) { console.log('[Fire] shoot BLOCKED: ammo=0 → reload'); if (AUDIO) AUDIO.play('player_empty', { position: lp.position }); this.reload(); return; }
    const wp = WEAPONS[lp.weapon] || WEAPONS.pistol;
    console.log('[Fire] shoot weapon=%s ammo=%d/%d fireMode=%s', lp.weapon, lp.ammo, lp.maxAmmo, wp.fireMode);

    if (this.gameState === GameState.TRAINING) {
      this._trainingShoot(wp, lp);
      return;
    }

    const handler = this._weaponHandlers[wp.weaponType] || this._fireProjectile;
    handler.call(this, wp, lp);
  }

  get _weaponHandlers() {
    return {
      projectile: this._fireProjectile,
      beam: this._fireBeam,
      explosive: this._fireProjectile,
      energy: this._fireEnergy,
      summon: this._fireSummon,
      special: this._fireProjectile,
    };
  }

  _fireProjectile(wp, lp) {
    const pellets = wp.pellets || 1;

    const baseDir = new THREE.Vector3(0, 0, -1);
    baseDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), lp.rotation);
    baseDir.y = 0;
    baseDir.normalize();

    const inputId = this.inputIdCounter++;
    const dirData = { x: baseDir.x, y: 0, z: baseDir.z };
    console.log('[Fire Request] sending weapon=%s isHost=%s inputId=%s', lp.weapon, this.network.isHost, inputId);
    if (this.network.isHost) {
      if (this.hostAuthority) {
        this.hostAuthority.handleFireRequest({
          weapon: lp.weapon,
          position: { x: lp.position.x, y: 0, z: lp.position.z },
          direction: dirData,
          color: lp.color,
          timestamp: Date.now(),
        }, this.network.myId, 'local_' + inputId);
      }
    } else {
      this.network.sendFireRequest(lp.weapon, lp.position, dirData, inputId, lp.color);
    }

    if (this.effectManager) {
      for (let i = 0; i < pellets; i++) {
        const flashDir = baseDir.clone();
        if (i > 0 && wp.spread > 0) {
          flashDir.x += (Math.random() - 0.5) * wp.spread;
          flashDir.z += (Math.random() - 0.5) * wp.spread;
          flashDir.normalize();
        }
        this.effectManager.spawnMuzzleFlash(lp.position, flashDir, lp.color);
      }
    }

    if (AUDIO) AUDIO.playWeapon(lp.weapon, { position: lp.position });

    lp.ammo--;
    this.updateAmmoUI();
  }

  _fireBeam(wp, lp) {
    if (lp.overheated) return;

    const baseDir = new THREE.Vector3(0, 0, -1);
    baseDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), lp.rotation);
    baseDir.y = 0;
    baseDir.normalize();

    const origin = lp.position.clone();
    const inputId = this.inputIdCounter++;

    if (this.network.isHost) {
      if (this.hostAuthority) {
        this.hostAuthority.handleBeamFireRequest({
          weapon: lp.weapon,
          origin: { x: origin.x, y: 0, z: origin.z },
          direction: { x: baseDir.x, y: 0, z: baseDir.z },
          color: lp.color,
          timestamp: Date.now(),
        }, this.network.myId, 'local_' + inputId);
      }
    } else {
      this.network.sendBeamFire(lp.weapon, origin, baseDir, inputId, lp.color);
    }

    if (this.effectManager) {
      this.effectManager.spawnMuzzleFlash(origin, baseDir, lp.color);
    }

    if (AUDIO) {
      AUDIO.playWeapon(lp.weapon, { position: lp.position });
      AUDIO.startBeamHum(lp.weapon, { position: lp.position });
    }

    lp.ammo--;
    this.updateAmmoUI();

    /* Beam weapons also generate heat */
    if (lp.maxHeat > 0) {
      const heatPerShot = Math.max(1, Math.ceil(lp.maxHeat * (wp.fireRate || 0.25) / 1.5));
      lp.heat = Math.min(lp.maxHeat, lp.heat + heatPerShot);
      if (lp.heat >= lp.maxHeat) lp.overheated = true;
    }
    this.updateHeatUI();
  }

  _fireEnergy(wp, lp) {
    if (lp.overheated) return;

    const baseDir = new THREE.Vector3(0, 0, -1);
    baseDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), lp.rotation);
    baseDir.y = 0;
    baseDir.normalize();

    if (this.network.isHost) {
      if (this.hostAuthority) {
        this.hostAuthority.handleFireRequest({
          weapon: lp.weapon,
          position: { x: lp.position.x, y: 0, z: lp.position.z },
          direction: { x: baseDir.x, y: 0, z: baseDir.z },
          color: lp.color,
          timestamp: Date.now(),
        }, this.network.myId, 'local_' + (this.inputIdCounter++));
      }
    } else {
      this.network.sendFireRequest(lp.weapon, lp.position, { x: baseDir.x, y: 0, z: baseDir.z }, this.inputIdCounter++, lp.color);
    }

    if (this.effectManager) {
      const flashDir = baseDir.clone();
      this.effectManager.spawnMuzzleFlash(lp.position, flashDir, lp.color);
    }
    if (AUDIO) AUDIO.playWeapon(lp.weapon, { position: lp.position });

    /* Energy weapons: no ammo consumption, use overheat system */
    if (lp.maxHeat > 0) {
      const heatPerShot = Math.max(1, Math.ceil(lp.maxHeat * (wp.fireRate || 0.25) / 1.5));
      lp.heat = Math.min(lp.maxHeat, lp.heat + heatPerShot);
      if (lp.heat >= lp.maxHeat) lp.overheated = true;
    }
    this.updateHeatUI();
    this.updateAmmoUI();
  }

  _fireSummon(wp, lp) {
    const baseDir = new THREE.Vector3(0, 0, -1);
    baseDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), lp.rotation);
    baseDir.y = 0;
    baseDir.normalize();

    if (this.network.isHost) {
      if (this.hostAuthority) {
        this.hostAuthority.handleFireRequest({
          weapon: lp.weapon,
          position: { x: lp.position.x, y: 0, z: lp.position.z },
          direction: { x: baseDir.x, y: 0, z: baseDir.z },
          color: lp.color,
          timestamp: Date.now(),
        }, this.network.myId, 'local_' + (this.inputIdCounter++));
      }
    } else {
      this.network.sendFireRequest(lp.weapon, lp.position, { x: baseDir.x, y: 0, z: baseDir.z }, this.inputIdCounter++, lp.color);
    }

    if (AUDIO) AUDIO.playWeapon(lp.weapon, { position: lp.position });
    lp.ammo--;
    this.updateAmmoUI();
  }

  _trainingShoot(wp, lp) {
    if (lp.overheated) return;

    const pellets = wp.pellets || 1;
    const baseDir = new THREE.Vector3(0, 0, -1);
    baseDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), lp.rotation);
    baseDir.y = 0;
    baseDir.normalize();

    if (this.trainingManager) this.trainingManager.recordShot();

    if (wp.weaponType === 'beam') {
      const origin = lp.position.clone();
      const endPoint = baseDir.clone().multiplyScalar(wp.range || 80).add(origin);
      if (this.beamManager) {
        this.beamManager.fireBeam(origin, endPoint, wp, lp.color);
      }
      if (this.trainingManager && this.trainingManager.targets) {
        for (const t of this.trainingManager.targets.targets) {
          if (!t.alive) continue;
          const toTarget = new THREE.Vector3().copy(t.group.position).sub(origin);
          const dist = toTarget.length();
          if (dist > (wp.range || 80)) continue;
          toTarget.normalize();
          const dot = baseDir.dot(toTarget);
          if (dot > 0.95) {
            this.trainingManager.recordHit(wp.damage);
            this.trainingManager.targets.flashTarget(t.id);
            if (this.effectManager) {
              this.effectManager.spawnHitEffect(t.group.position.clone(), lp.color);
            }
          }
        }
      }
    } else {
      const mapHalf = 60;
      const spreadMult = this.passiveManager ? this.passiveManager.getSpreadMultiplier(this.localId) : 1;
      for (let i = 0; i < pellets; i++) {
        const projDir = baseDir.clone();
        if (i > 0 && wp.spread > 0) {
          projDir.x += (Math.random() - 0.5) * wp.spread * spreadMult;
          projDir.z += (Math.random() - 0.5) * wp.spread * spreadMult;
          projDir.normalize();
        }
        const proj = new Projectile(this.scene, lp.position, projDir,
          this.localId, this.inputIdCounter++, lp.color, lp.weapon, mapHalf);
        proj.isTraining = true;
        proj._gravityWell = (lp.weapon === 'black_hole_launcher');
        proj._isDrone = (lp.weapon === 'missile_drone');
        proj._droneTimer = 2.0;
        if (this.passiveManager) {
          this.passiveManager.applyToProjectile(proj, this.localId);
        }
        this.projectiles.push(proj);
      }
    }

    if (this.effectManager) {
      this.effectManager.spawnMuzzleFlash(lp.position, baseDir, lp.color);
    }
    if (AUDIO) AUDIO.playWeapon(lp.weapon, { position: lp.position });

    if (wp.weaponType !== 'energy') {
      lp.ammo--;
    }
    this.updateAmmoUI();

    /* Heat generation in training */
    if (lp.maxHeat > 0 && (wp.weaponType === 'energy' || wp.weaponType === 'beam')) {
      const heatPerShot = Math.max(1, Math.ceil(lp.maxHeat * (wp.fireRate || 0.25) / 1.5));
      lp.heat = Math.min(lp.maxHeat, lp.heat + heatPerShot);
      if (lp.heat >= lp.maxHeat) lp.overheated = true;
    }
    this.updateHeatUI();
  }

  _checkProjectileTargetHit(proj) {
    const targets = this.trainingManager.targets.targets;
    for (const t of targets) {
      if (!t.alive) continue;
      const dist = proj.mesh.position.distanceTo(t.group.position);
      if (dist < 1.5) {
        this.trainingManager.recordHit(proj.wp ? (proj.wp.damage || 10) : 10);
        this.trainingManager.targets.flashTarget(t.id);
        const isExplosive = (proj.wp && proj.wp.explosive) || proj.explosiveAmmo;
        if (isExplosive) {
          if (this.effectManager) {
            this.effectManager.spawnExplosion(t.group.position.clone(), proj.color || 0xff4400);
          }
          if (AUDIO) AUDIO.play('explosion', { position: t.group.position });
        } else {
          if (this.effectManager) {
            this.effectManager.spawnHitEffect(t.group.position.clone(), proj.color);
          }
        }
        proj.destroy();
        return;
      }
    }
  }

  reload() {
    const lp = this.localPlayer;
    if (!lp || !lp.alive || lp.reloading) return;
    if (lp.ammo >= lp.maxAmmo) return;
    const wp = WEAPONS[lp.weapon] || WEAPONS.pistol;
    if (AUDIO) AUDIO.play('player_reload', { position: lp.position });
    lp.reloading = true;
    const reloadMult = this.passiveManager ? this.passiveManager.getReloadMultiplier(this.localId) : 1;
    lp.reloadTimer = wp.reloadTime * reloadMult;
    this.updateAmmoUI();
  }

  updateAmmoUI() {
    const lp = this.localPlayer;
    if (!lp) { document.getElementById('ammo-display').textContent = '--/--'; return; }
    const el = document.getElementById('ammo-display');
    const wp = WEAPONS[lp.weapon];
    if (wp && wp.weaponType === 'energy') {
      if (lp.maxHeat > 0) {
        const pct = Math.round((lp.heat / lp.maxHeat) * 100);
        el.textContent = lp.overheated ? 'OVERHEAT' : `HEAT ${pct}%`;
      } else {
        el.textContent = 'HEAT --';
      }
    } else if (lp.reloading) {
      const remaining = Math.ceil(Math.max(0, lp.reloadTimer));
      el.textContent = `RELOAD ${remaining}s`;
    } else {
      el.textContent = `${lp.ammo} / ${lp.maxAmmo}`;
    }
    const beamIcon = wp && wp.weaponType === 'beam' ? '⚡ ' : '';
    document.getElementById('weapon-name').textContent = wp ? beamIcon + wp.displayName : '';
  }

  updateHealthUI() {
    const lp = this.localPlayer;
    if (!lp) return;
    const pct = (lp.health / lp.maxHealth) * 100;
    const bar = document.getElementById('health-bar');
    bar.style.width = pct + '%';
    bar.classList.toggle('low', pct <= 30);
  }

  updateHeatUI() {
    const lp = this.localPlayer;
    if (!lp || lp.maxHeat <= 0) {
      document.getElementById('heat-bar-container').style.display = 'none';
      document.getElementById('training-heat-bar-container').style.display = 'none';
      return;
    }
    const pct = (lp.heat / lp.maxHeat) * 100;
    const fill = document.getElementById('heat-bar');
    const tFill = document.getElementById('training-heat-bar');
    fill.style.width = pct + '%';
    fill.classList.toggle('overheated', lp.overheated);
    document.getElementById('heat-bar-container').style.display = '';
    if (tFill) {
      tFill.style.width = pct + '%';
      tFill.classList.toggle('overheated', lp.overheated);
    }
    document.getElementById('training-heat-bar-container').style.display = '';
    document.getElementById('heat-bar-overheated').style.display = lp.overheated ? '' : 'none';
    const tOh = document.getElementById('training-heat-bar-overheated');
    if (tOh) tOh.style.display = lp.overheated ? '' : 'none';
  }

  updateTimerUI() {
    const remaining = Math.max(0, Math.ceil(this.gameTimer));
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const el = document.getElementById('timer-display');
    el.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    el.classList.toggle('urgent', remaining <= 10);
  }

  addKillFeed(msg) {
    if (this.killFeedManager) {
      this.killFeedManager.addSystemMessage(msg);
    } else {
      const feed = document.getElementById('kill-feed');
      const el = document.createElement('div');
      el.className = 'kill-msg';
      el.textContent = msg;
      feed.appendChild(el);
      setTimeout(() => { if (el.parentNode) el.remove(); }, 3000);
    }
  }

  showKillMessage(text) {
    const existing = document.querySelector('.kill-center-msg');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.className = 'kill-center-msg';
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, 800);
  }

  _showKillAnnouncement(streak) {
    const container = document.getElementById('kill-announcement');
    if (!container) return;

    container.innerHTML = '';

    const scoreEl = document.createElement('div');
    scoreEl.className = 'ka-score';
    scoreEl.textContent = '+100';

    const labelEl = document.createElement('div');
    labelEl.className = 'ka-label';
    labelEl.textContent = 'KILL';

    container.appendChild(scoreEl);
    container.appendChild(labelEl);

    container.style.animation = 'none';
    void container.offsetWidth;
    container.style.animation = 'kaAppear 0.3s ease forwards';

    setTimeout(() => {
      if (container.parentNode) {
        container.style.animation = 'kaFadeOut 0.5s ease forwards';
      }
    }, 1200);

    const streakName = this.matchStats ? this.matchStats.getStreakName(streak) : null;
    if (streakName) {
      setTimeout(() => {
        this.showKillMessage(streakName);
      }, 300);
    }
  }

  /* ----------------------------------------------------------
     メインアップデート
     ---------------------------------------------------------- */
  update(dt) {
    if (this.gameState === GameState.COUNTDOWN) {
      this._updateCountdown(dt);
    }
    if (this.gameState === GameState.PLAYING) {
      this._updatePlaying(dt);
    }
    if (this.gameState === GameState.RESULT) {
      this._updateResult(dt);
    }
    if (this.gameState === GameState.CHEAT_DETECTED) {
      this._updateCheatDetected(dt);
    }
    if (this.gameState === GameState.TRAINING) {
      this._updateTraining(dt);
    }
    if (this.gameState === GameState.PLAYING) {
      this.network.sendState(dt);
    }
    if (this.passiveManager) {
      this.passiveManager.updateAll(dt);
    }
    this._updateCamera(dt);
  }

  _updateCountdown(dt) {
    if (!this.network.isHost) return;
    this.countdownTimer += dt;
    if (this.countdownTimer >= 1.0) {
      this.countdownTimer = 0;
      this.countdownValue--;
      this.network.broadcast({ type: 'countdown_sync', value: this.countdownValue });
      if (this.countdownValue > 0) {
        this._showCountdownNumber(this.countdownValue);
      } else if (this.countdownValue === 0) {
        this._showCountdownNumber(0);
      } else {
        document.getElementById('countdown-overlay').style.display = 'none';
        this._startMatch();
      }
    }
  }

  _updateTraining(dt) {
    const lp = this.localPlayer;
    if (lp && lp.alive) {
      const panel = document.getElementById('training-left-panel');
      if (panel && !panel.classList.contains('closed')) {
        this.mouseDown = false;
        this.mouseClicked = false;
        if (this.input) { this.input.firePressed = false; this.input.fireClicked = false; }
      }
      this._handlePlayerInput(lp, dt);
    }

    if (lp && lp.reloading) {
      lp.reloadTimer -= dt;
      if (lp.reloadTimer <= 0) {
        lp.ammo = lp.maxAmmo;
        lp.reloading = false;
        lp.reloadTimer = 0;
        lp.lastFireTime = 0;
      }
      this.updateAmmoUI();
    }

    /* Heat dissipation */
    if (lp && lp.maxHeat > 0) {
      lp.heat = Math.max(0, lp.heat - (lp.coolingSpeed || 15) * dt);
      if (lp.overheated && lp.heat <= 0) {
        lp.overheated = false;
      }
      this.updateHeatUI();
    }

    /* Health regen (out of combat) */
    if (lp && lp.alive && lp.healthRegen > 0) {
      const now = Date.now();
      if (now - lp.lastDamageTime > 3000) {
        lp.health = Math.min(lp.health + lp.healthRegen * dt, lp.maxHealth);
        this.updateHealthUI();
      }
    }

    this.players.forEach(p => {
      if (p.id !== this.localId) {
        p.lerpToTarget(dt);
      }
      p.update(dt);
    });

    const targets = this.trainingManager && this.trainingManager.targets ? this.trainingManager.targets.targets : null;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (!p.alive) { this.projectiles.splice(i, 1); continue; }
      p.update(dt);

      /* Explosive projectile death: trigger explosion for explosive weapons */
      if (!p.alive && ((p.wp && p.wp.explosive) || p.explosiveAmmo || p._gravityWell)) {
        const ep = p.mesh.position.clone();
        const eColor = p._gravityWell ? 0x2200aa : (p.color || 0xff4400);
        if (this.effectManager) {
          this.effectManager.spawnExplosion(ep, eColor);
        }
        if (AUDIO) AUDIO.play('explosion', { position: ep });
        if (targets && !p._gravityWell) {
          for (const t of targets) {
            if (!t.alive) continue;
            if (ep.distanceTo(t.group.position) < 3) {
              this.trainingManager.recordHit(p.wp ? p.wp.damage : 20);
              this.trainingManager.targets.flashTarget(t.id);
            }
          }
        }
      }

      /* Black Hole: spawn gravity zone on death */
      if (!p.alive && p._gravityWell) {
        if (!this._trainingGravityZones) this._trainingGravityZones = [];
        this._trainingGravityZones.push({ pos: p.mesh.position.clone(), timer: 4 });
      }

      /* Missile Drone: hover and auto-fire */
      if (p.alive && p._isDrone) {
        if (p.age > 0.5 && p.velocity.lengthSq() > 0.01) {
          p.velocity.set(0, 0, 0);
        }
        if (p.age > 0.5 && targets) {
          p._droneTimer -= dt;
          if (p._droneTimer <= 0) {
            p._droneTimer = 1.5;
            let nearest = null, nearDist = Infinity;
            for (const t of targets) {
              if (!t.alive) continue;
              const d = p.mesh.position.distanceTo(t.group.position);
              if (d < nearDist) { nearDist = d; nearest = t; }
            }
            if (nearest) {
              this.trainingManager.recordHit(20);
              this.trainingManager.targets.flashTarget(nearest.id);
              if (this.effectManager) {
                this.effectManager.spawnHitEffect(nearest.group.position.clone(), 0xff4444);
              }
            }
          }
        }
      }

      if (p.alive && targets) {
        this._checkProjectileTargetHit(p);
      }
    }

    /* Update training gravity zones */
    if (this._trainingGravityZones) {
      for (let i = this._trainingGravityZones.length - 1; i >= 0; i--) {
        const gz = this._trainingGravityZones[i];
        gz.timer -= dt;
        if (gz.timer <= 0) {
          this._trainingGravityZones.splice(i, 1);
          continue;
        }
        if (targets) {
          for (const t of targets) {
            if (!t.alive) continue;
            const dir = new THREE.Vector3().copy(gz.pos).sub(t.group.position);
            const dist = dir.length();
            if (dist < 8 && dist > 0.5) {
              const pullStrength = 8 * dt * (1 - dist / 8);
              dir.normalize().multiplyScalar(pullStrength);
              t.group.position.add(dir);
            }
          }
        }
      }
    }

    this._tickStatusEffects(dt);
    if (this.effectManager) this.effectManager.update(dt);
    if (this.beamManager) this.beamManager.update(dt);
    if (this.trainingManager) this.trainingManager.update(dt);
    if (AUDIO) {
      if (lp) AUDIO.updateListener(lp.position);
    }
  }

  _tickStatusEffects(dt) {
    this.players.forEach((player) => {
      if (!player.alive || !player.statusEffects) return;
      for (let i = player.statusEffects.length - 1; i >= 0; i--) {
        const se = player.statusEffects[i];
        se.remaining -= dt;
        if (se.remaining <= 0) {
          player.statusEffects.splice(i, 1);
          continue;
        }
        if (se.type === 'burn' || se.type === 'poison') {
          player.health = Math.max(0, player.health - se.damagePerSec * dt);
          if (player.health <= 0 && player.alive) {
            const msg = { type: 'died', playerId: player.id, killerId: 0, weapon: se.sourceWeapon || 'status' };
            this.network.broadcast(msg);
            this._handleDied(msg);
          }
        }
      }
    });
  }

  _updatePlaying(dt) {
    if (!this.gameStarted || this.gameOver || this.gameState === GameState.CHEAT_DETECTED) {
      if (!this.gameStarted) console.log('[Update] _updatePlaying: gameStarted=false');
      if (this.gameOver) console.log('[Update] _updatePlaying: gameOver=true');
      return;
    }
    const lp = this.localPlayer;
    if (!lp) { console.log('[Update] _updatePlaying: localPlayer MISSING (localId=%s)', this.network.myId); return; }

    if (lp.alive) {
      this._handlePlayerInput(lp, dt);
    } else {
      console.log('[Update] _updatePlaying: lp.alive=false weapon=%s ammo=%d/%d reloading=%s',
        lp.weapon, lp.ammo, lp.maxAmmo, lp.reloading);
    }

    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
      if (lp && lp.alive) {
        const blink = Math.sin(this.invincibleTimer * 20) > 0;
        lp.mesh.material.transparent = true;
        lp.mesh.material.opacity = blink ? 0.3 : 1;
        lp.edgeLine.material.opacity = blink ? 0.1 : 0.4;
        lp.glowRing.material.opacity = blink ? 0.03 : 0.1;
        lp.outlineMat.opacity = blink ? 0.04 : 0.15;
      }
      if (this.invincibleTimer <= 0 && lp) {
        lp.resetVisualState();
      }
    }

    if (lp && lp.reloading) {
      lp.reloadTimer -= dt;
      if (lp.reloadTimer <= 0) {
        lp.ammo = lp.maxAmmo;
        lp.reloading = false;
        lp.reloadTimer = 0;
        lp.lastFireTime = 0;
        if (lp.onReloadComplete) lp.onReloadComplete(lp.weapon);
      }
      this.updateAmmoUI();
    }

    /* Heat dissipation */
    if (lp && lp.maxHeat > 0) {
      lp.heat = Math.max(0, lp.heat - (lp.coolingSpeed || 15) * dt);
      if (lp.overheated && lp.heat <= 0) {
        lp.overheated = false;
      }
      this.updateHeatUI();
    }

    /* Health regen (out of combat) */
    if (lp && lp.alive && lp.healthRegen > 0) {
      const now = Date.now();
      if (now - lp.lastDamageTime > 3000) {
        lp.health = Math.min(lp.health + lp.healthRegen * dt, lp.maxHealth);
        this.updateHealthUI();
      }
    }

    if (this.teleportCooldown > 0) this.teleportCooldown -= dt;

    this.players.forEach(p => {
      if (p.id !== this.network.myId) {
        p.lerpToTarget(dt);
        if (lp) {
          const dist = p.position.distanceTo(lp.position);
          const far = dist > 30;
          p.mesh.visible = p.alive && !far;
          p.edgeLine.visible = p.alive && !far;
          p.outlineLine.visible = p.alive && !far;
          p.glowRing.visible = p.alive && !far;
        }
      }
      p.update(dt);
    });

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (!p.alive) { this.projectiles.splice(i, 1); continue; }
      p.update(dt);
    }

    this._tickStatusEffects(dt);
    if (this.effectManager) this.effectManager.update(dt);
    if (this.beamManager) this.beamManager.update(dt);
    if (AUDIO) {
      const lp = this.localPlayer;
      if (lp) AUDIO.updateListener(lp.position);
    }
    if (this.hostAuthority && this.network.isHost) {
      this.hostAuthority.handleHostProjectiles(dt);
    }

    this._updateRespawn(dt);
    this._updateGameTimer(dt);
  }

  _handlePlayerInput(lp, dt) {
    const inp = this.input;
    inp.updateMovement();

    this.dashCooldown = Math.max(0, this.dashCooldown - dt);

    if (inp.dashRequested && this.dashCooldown <= 0 && this.dashTimer <= 0) {
      this.dashTimer = CONFIG.dashDuration;
      this.dashCooldown = CONFIG.dashCooldown;
      this.dashTriggered = true;
      const fwd = new THREE.Vector3(0, 0, -1)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), lp.rotation);
      if (this.effectManager) this.effectManager.spawnDashEffect(lp.position, fwd);
      if (this.cameraEffectManager) this.cameraEffectManager.dashFov();
      if (AUDIO) AUDIO.play('player_dash', { position: lp.position });
    }

    if (inp.reloadRequested && (this.gameState === GameState.PLAYING || this.gameState === GameState.TRAINING)) {
      this.reload();
    }
    if (inp.respawnRequested && this.respawnReady && !this.respawnRequested) {
      this._requestRespawn();
    }

    const mx = inp.moveX;
    const mz = inp.moveZ;

    if (mx !== 0 || mz !== 0) {
      const fwd = new THREE.Vector3(0, 0, -1)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), lp.rotation);
      const right = new THREE.Vector3(1, 0, 0)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), lp.rotation);
      _v3.copy(fwd).multiplyScalar(-mz);
      _v3b.copy(right).multiplyScalar(mx);
      _v3.add(_v3b).normalize();

      let speed = CONFIG.playerSpeed * (lp.moveSpeedMult || 1);
      if (lp.statusEffects) {
        for (const se of lp.statusEffects) {
          if (se.type === 'freeze' && se.slowAmount != null) speed *= se.slowAmount;
        }
      }
      if (this.dashTimer > 0) {
        speed = CONFIG.dashSpeed * (lp.dashSpeedMult || 1);
        if (lp.statusEffects) {
          for (const se of lp.statusEffects) {
            if (se.type === 'freeze' && se.slowAmount != null) speed *= se.slowAmount;
          }
        }
        this.dashTimer -= dt;
        if (this.dashTimer <= 0) {
          this.dashTimer = 0;
          if (this.effectManager) this.effectManager.spawnLandingEffect(lp.position);
          if (AUDIO) AUDIO.play('player_land', { position: lp.position });
        }
      }
      if (this.arenaMap && this.arenaMap.pads) {
        this._handlePadInteraction(lp, speed, dt);
      }
      _v3.multiplyScalar(speed * dt);
      lp.position.x += _v3.x;
      lp.position.z += _v3.z;
      const half = (this.arenaMap ? this.arenaMap.size : 40) / 2 - 0.8;
      lp.position.x = Math.max(-half, Math.min(half, lp.position.x));
      lp.position.z = Math.max(-half, Math.min(half, lp.position.z));
      this._checkWallCollision(lp.position);
      lp.targetPosition.copy(lp.position);
    }

    if (inp.lookX !== 0) {
      lp.rotation -= inp.lookX * 0.003;
    }
    if (inp.lookY !== 0) {
      this.pitch -= inp.lookY * 0.003;
      this.pitch = Math.max(-0.5, Math.min(0.5, this.pitch));
    }

    if (lp.recoilOffset) {
      lp.rotation -= lp.recoilOffset * dt * 8;
    }
    lp.targetRotation = lp.rotation;

    if ((this.network.isHost || this.gameState === GameState.TRAINING) && this.effectManager && this.dashTriggered) {
      this.dashTriggered = false;
    }

    let shouldFire = false;
    const wp = WEAPONS[lp.weapon];
    const canFire = this.input.isMobile ? true : this.pointerLocked;
    if (wp && canFire) {
      if (wp.fireMode === 'Semi' || wp.fireMode === 'Beam') {
        if (inp.fireClicked) {
          shouldFire = true;
        }
      } else {
        if (inp.firePressed) {
          shouldFire = true;
        }
      }
    }
    if (shouldFire) {
      const now = Date.now();
      const fireRateMult = this.passiveManager ? this.passiveManager.getFireRateMultiplier(this.localId) : 1;
      const effectiveInterval = (wp.fireRate * 1000) / fireRateMult;
      if (now - lp.lastFireTime > effectiveInterval) {
        lp.lastFireTime = now;
        this.shoot();
        if (wp.recoil > 0) {
          const recoilMult = this.passiveManager ? this.passiveManager.getMultiplier('recoilMultiplier', this.localId) : 1;
          const recoilAmount = wp.recoil * (recoilMult != null ? recoilMult : 1) * 0.02;
          lp.recoilOffset = (lp.recoilOffset || 0) + (recoilAmount + (Math.random() - 0.5) * recoilAmount * 0.5);
        }
      }
    }
    if (lp.recoilOffset) {
      const recovery = 6 * dt;
      if (Math.abs(lp.recoilOffset) < recovery) lp.recoilOffset = 0;
      else lp.recoilOffset -= Math.sign(lp.recoilOffset) * recovery;
    }

    inp.endFrame();
  }

  _handlePadInteraction(lp, speed, dt) {
    const pHalf = CONFIG.playerSize * 0.3;
    let onPad = false;
    for (const pad of this.arenaMap.pads) {
      const px = pad.p[0], pz = pad.p[2];
      const hx = pad.s[0] / 2 + pHalf, hz = pad.s[2] / 2 + pHalf;
      if (Math.abs(lp.position.x - px) < hx && Math.abs(lp.position.z - pz) < hz) {
        onPad = true;
        if (!this._lastOnPad) {
          if (this.effectManager) {
            this.effectManager.spawnJumpPadEffect(
              new THREE.Vector3(px, 0.1, pz),
              pad.speed === 0 ? 0xff00ff : 0x00f0ff
            );
          }
        }
        if (pad.speed > 0 && pad.speed !== 1) speed *= pad.speed;
        if (pad.speed === 0 && this.arenaMap.teleport && this.teleportCooldown <= 0) {
          lp.position.set(this.arenaMap.teleport.x, 0, this.arenaMap.teleport.z);
          this.teleportCooldown = 1.5;
          this.addKillFeed('Teleported!');
        }
      }
    }
    this._lastOnPad = onPad;
  }

  _updateRespawn(dt) {
    if (this.respawnTimer > 0) {
      const prev = Math.ceil(this.respawnTimer);
      this.respawnTimer -= dt;
      const now = Math.ceil(this.respawnTimer);
      if (now !== prev && now > 0) {
        document.getElementById('respawn-countdown').textContent = String(now);
      }
      if (this.respawnTimer <= 0 && !this.respawnReady) {
        this.respawnTimer = 0;
        this.respawnReady = true;
        document.getElementById('respawn-countdown').style.display = 'none';
        document.getElementById('respawn-prompt').style.display = '';
      }
    }
  }

  _updateGameTimer(dt) {
    this.gameTimer -= dt;
    this.updateTimerUI();
    if (this.network.isHost) {
      this.network.broadcast({ type: 'game_timer', time: this.gameTimer });
    }
    if (this.gameTimer <= 0) {
      this.gameTimer = 0;
      this.endGame();
    }
  }

  _updateResult(dt) {
    this.resultTimer -= dt;
    if (this.resultTimer <= 0 && this.network.isHost) {
      this.network.broadcast({ type: NetMsg.RETURN_LOBBY });
      this._returnToLobby();
    }
  }

  _updateCheatDetected(dt) {
    if (this.gameOver && this.cheatDetectedTimer > 0) {
      this.cheatDetectedTimer -= dt;
      if (this.cheatDetectedTimer <= 0) {
        this.cheatDetectedTimer = 0;
        if (this.network.isHost) {
          this.network.broadcast({ type: NetMsg.RETURN_LOBBY });
        }
        this._returnToLobby();
      }
    }
  }

  /* ----------------------------------------------------------
     リスポーン
     ---------------------------------------------------------- */
  _spawnHalfExtent() {
    return this.arenaMap ? Math.max(this.arenaMap.size / 2 - 3, 2) : 17;
  }

  _getSpawnPosition(playerIndex) {
    const map = this.arenaMap || MAP_REGISTRY.get(this.selectedMap);
    if (map && map.spawnPoints && map.spawnPoints.length > 0) {
      const idx = (playerIndex !== undefined ? playerIndex : this._spawnIndex++) % map.spawnPoints.length;
      const sp = map.spawnPoints[idx];
      return new THREE.Vector3(sp.x, 0, sp.z);
    }
    const half = this._spawnHalfExtent();
    return new THREE.Vector3(
      (Math.random() - 0.5) * half * 2, 0, (Math.random() - 0.5) * half * 2
    );
  }

  _requestRespawn() {
    if (this.respawnRequested || !this.respawnReady) return;
    this.respawnRequested = true;
    document.getElementById('respawn-prompt').style.display = 'none';
    if (this.network.isHost) {
      this.killCamKillerId = null;
      this.mouseDown = false;
      if (this.input) { this.input.firePressed = false; this.input.fireClicked = false; }
      this.dashTimer = 0;
      this.dashCooldown = 0;
      this.killStreak = 0;
      document.getElementById('death-screen').classList.remove('show');
      document.getElementById('respawn-countdown').style.display = '';
      this._respawnLocal();
    } else {
      this.network.send({ type: 'respawn_request' });
    }
  }

  _respawnLocal() {
    const lp = this.localPlayer;
    if (AUDIO) AUDIO.play('player_respawn', { position: lp ? lp.position : null });
    if (!lp) { console.log('[Respawn] BLOCKED: no localPlayer'); return; }
    console.log('[Respawn] _respawnLocal isHost=%s alive=%s weapon=%s mouseDown=%s mouseClicked=%s',
      this.network.isHost, lp.alive, this.loadoutWeapon, this.mouseDown, this.mouseClicked);
    const spawnPos = this._getSpawnPosition();
    lp.position.copy(spawnPos);
    lp.targetPosition.copy(spawnPos);
    lp.health = CONFIG.maxHealth;
    lp.alive = true;
    lp.reloading = false;
    lp.reloadTimer = 0;
    lp.lastFireTime = 0;
    lp.weapon = this.loadoutWeapon;
    lp.refillAmmo();
    if (this.passiveManager) {
      this.passiveManager.assignPassive(this.network.myId, this.loadoutPassive);
      this.passiveManager.applyToPlayer(lp);
      this.passiveManager.reloadPlayerAmmo(this.network.myId);
    }
    this.mouseDown = false;
    this.mouseClicked = false;
    if (this.input) { this.input.firePressed = false; this.input.fireClicked = false; }
    console.log('[Respawn] after reset: mouseDown=%s mouseClicked=%s pointerLocked=%s',
      this.mouseDown, this.mouseClicked, this.pointerLocked);
    this.invincibleTimer = CONFIG.invincibleTime;
    lp.onReloadComplete = this._onReloadComplete;
      this.updateAmmoUI();
      this.updateHealthUI();
      this.updateHeatUI();
      this.killCountThisLife = 0;
      if (this.matchStats && lp) {
      this.matchStats.killStreaks.set(this.network.myId, 0);
      lp.currentKillStreak = 0;
    }
    if (this.hostAuthority) {
      this.hostAuthority.respawnedPeers.add(this.network.myId);
      if (this.network.isHost) {
        this.hostAuthority.refillAmmo(this.network.myId, lp.weapon);
      }
    }
    if (this.effectManager) {
      this.effectManager.spawnRespawnEffect(spawnPos, lp.color);
    }
    const msg = {
      type: 'respawn', id: this.network.myId,
      pos: { x: spawnPos.x, y: 0, z: spawnPos.z },
    };
    if (this.network.isHost) this.network.broadcast(msg);
    else this.network.send(msg);
  }

  _wireReloadCallback() {
    this._onReloadComplete = (weapon) => {
      if (this.hostAuthority && this.network.isHost) {
        this.hostAuthority.refillAmmo(this.network.myId, weapon);
      }
      if (!this.network.isHost) {
        this.network.send({ type: 'reload_complete', weapon });
      }
    };
  }

  /* ----------------------------------------------------------
     カメラ
     ---------------------------------------------------------- */
  _updateCamera(dt) {
    const effectiveDt = this.cameraEffectManager
      ? this.cameraEffectManager.update(dt) : dt;

    if (this.gameState === GameState.TRAINING) {
      const lp = this.localPlayer;
      if (lp) {
        const p = lp.position;
        const dist = 18, angle = lp.rotation;
        const pitchAngle = (this.pitch || 0) * 0.5;
        const height = 14 - Math.sin(pitchAngle) * dist * 0.3;
        const target = new THREE.Vector3(
          p.x + Math.sin(angle) * dist, p.y + Math.max(2, height), p.z + Math.cos(angle) * dist
        );
        this.camera.position.lerp(target, 1 - Math.exp(-8 * effectiveDt));
        this.camera.lookAt(p.x, 0.5 + Math.sin(pitchAngle) * 2, p.z);
      }
      return;
    }
    if (this.respawnTimer > 0 && this.killCamKillerId && this.gameState === GameState.PLAYING) {
      const killer = this.players.get(this.killCamKillerId);
      if (killer && killer.alive) {
        const p = killer.position;
        const target = new THREE.Vector3(p.x + 8, p.y + 10, p.z + 8);
        this.camera.position.lerp(target, 1 - Math.exp(-6 * effectiveDt));
        this.camera.lookAt(p.x, 0.5, p.z);
        return;
      }
    }
    const lp = this.localPlayer;
    if (!lp) return;
    const p = lp.position;
    const dist = 18, angle = lp.rotation;
    const pitchAngle = (this.pitch || 0) * 0.5;
    const height = 14 - Math.sin(pitchAngle) * dist * 0.3;
    const target = new THREE.Vector3(
      p.x + Math.sin(angle) * dist, p.y + Math.max(2, height), p.z + Math.cos(angle) * dist
    );
    this.camera.position.lerp(target, 1 - Math.exp(-8 * effectiveDt));
    this.camera.lookAt(p.x, 0.5 + Math.sin(pitchAngle) * 2, p.z);

    if (this.cameraEffectManager && this.cameraEffectManager.getRedFlash() > 0) {
      const redOverlay = document.getElementById('damage-overlay') || (() => {
        const el = document.createElement('div');
        el.id = 'damage-overlay';
        el.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;
          pointer-events:none;z-index:55;
          background:radial-gradient(ellipse at center, transparent 50%, rgba(255,0,0,0.3) 100%);
          opacity:0;transition:opacity 0.05s;`;
        document.body.appendChild(el);
        return el;
      })();
      redOverlay.style.opacity = Math.min(1, this.cameraEffectManager.getRedFlash() * 2);
    } else {
      const redOverlay = document.getElementById('damage-overlay');
      if (redOverlay) redOverlay.style.opacity = '0';
    }
  }

  /* ----------------------------------------------------------
     キル追跡
     ---------------------------------------------------------- */
  _trackKill(shooterId, targetId, weapon) {
    if (!this.matchStats) return;

    /* Scavenger: ammo regen on kill */
    if (this.passiveManager && this.players.get(shooterId) === this.localPlayer) {
      this.passiveManager.onKill(shooterId);
    }

    if (this.network.isHost && this.cheatManager) {
      const now = performance.now();
      if (!this._killTimestamps) this._killTimestamps = new Map();
      const kills = this._killTimestamps.get(shooterId) || [];
      kills.push(now);
      const recent = kills.filter(t => now - t < 200);
      this._killTimestamps.set(shooterId, recent);
      if (recent.length > 3) {
        this.cheatManager.report(shooterId, 'All-Kill Hack');
        return;
      }
    }

    const result = this.matchStats.registerKill(shooterId, targetId, weapon || 'pistol');

    const shooter = this.players.get(shooterId);
    const target = this.players.get(targetId);
    if (shooter) shooter.kills++;
    if (target) target.deaths++;

    if (this.network.isHost && this.killFeedManager) {
      this.network.broadcast({
        type: 'kill_feed',
        killerName: result.killerName,
        victimName: result.victimName,
        weapon: weapon || 'pistol',
      });
    }

    if (shooterId === this.network.myId) {
      this.kills++;
      document.getElementById('kill-count').textContent = this.kills;
      this.cameraEffectManager.killSlowMo();
      this.cameraEffectManager.hitShake(5);
      this.killStreak = this.matchStats.getKillStreak(shooterId);
      this.killCountThisLife = this.killStreak;

      this._showKillAnnouncement(this.killStreak);

      if (this.effectManager && targetId) {
        const victim = this.players.get(targetId);
        if (victim) this.effectManager.spawnKillEffect(victim.position);
      }
      if (this.hostAuthority && this.network.isHost) {
        this.hostAuthority.refillAmmo(shooterId, this.localPlayer ? this.localPlayer.weapon : 'pistol');
      }
    }

    // Host adds kill feed entry locally; clients receive via kill_feed broadcast
    if (this.network.isHost && this.killFeedManager) {
      this.killFeedManager.addEntry(result.killerName, result.victimName, weapon || 'pistol');
    }
  }

  _checkWallCollision(pos) {
    const map = this.arenaMap;
    if (!map || !map.walls || map.walls.length === 0) return;
    const pHalf = CONFIG.playerSize * 0.4;
    for (const w of map.walls) {
      const wx = w.p[0], wz = w.p[2];
      const wHalfX = w.s[0] / 2 + pHalf;
      const wHalfZ = w.s[2] / 2 + pHalf;
      const dx = pos.x - wx;
      const dz = pos.z - wz;
      const overlapX = wHalfX - Math.abs(dx);
      const overlapZ = wHalfZ - Math.abs(dz);
      if (overlapX > 0 && overlapZ > 0) {
        if (overlapX < overlapZ) {
          pos.x += dx > 0 ? overlapX : -overlapX;
        } else {
          pos.z += dz > 0 ? overlapZ : -overlapZ;
        }
      }
    }
  }

  /* ----------------------------------------------------------
     試合終了 → リザルト
     ---------------------------------------------------------- */
  endGame() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.gameStarted = false;
    this.mouseDown = false;
    if (this.input) { this.input.firePressed = false; this.input.fireClicked = false; }
    if (document.pointerLockElement) document.exitPointerLock();
    const sb = this.matchStats ? this.matchStats.getResults() : [];
    if (this.network.isHost) {
      this.network.broadcast({ type: 'game_over', scoreboard: sb });
    }
    this._showResultScreen(sb);
  }

  _showResultScreen(scoreboard) {
    this.setState(GameState.RESULT);

    let sb = scoreboard || [];
    if (this.matchStats) {
      sb = this.matchStats.getResults();
    } else {
      sb.sort((a, b) => b.kills - a.kills);
    }

    const winnerData = this.matchStats ? this.matchStats.getWinner() : null;
    const topKills = winnerData ? winnerData.topKills : (sb.length > 0 ? sb[0].kills : 0);
    const winners = winnerData ? winnerData.winners : (topKills > 0 ? sb.filter(e => e.kills === topKills) : []);

    if (AUDIO) {
      const iWon = winners.some(w => w.id === this.network.myId);
      AUDIO.play(iWon ? 'game_victory' : 'game_defeat', { position: null });
      AUDIO.play('ui_result', { position: null });
    }

    const winnerNameEl = document.getElementById('result-winner-name');
    const winnerLabelEl = document.getElementById('result-winner-label');
    if (winners.length >= 2 && topKills > 0) {
      winnerLabelEl.textContent = 'DRAW';
      winnerNameEl.textContent = winners.map(w => w.name).join(' vs ');
    } else if (topKills > 0) {
      winnerLabelEl.textContent = 'WINNER';
      winnerNameEl.textContent = `${winners[0].name} — ${topKills} KILLS`;
    } else {
      winnerLabelEl.textContent = 'DRAW';
      winnerNameEl.textContent = 'No kills';
    }

    const list = document.getElementById('result-list');
    list.innerHTML = '';
    sb.forEach((entry, i) => {
      const div = document.createElement('div');
      div.className = 'result-entry' + (i === 0 && topKills > 0 ? ' winner' : '');
      const rank = document.createElement('span');
      rank.className = 'r-rank';
      rank.textContent = '#' + (i + 1);
      const dot = document.createElement('span');
      dot.className = 'r-dot';
      dot.style.background = '#' + entry.color.toString(16).padStart(6, '0');
      const name = document.createElement('span');
      name.className = 'r-name';
      name.textContent = entry.name + (entry.id === this.network.myId ? ' (YOU)' : '');
      const kills = document.createElement('span');
      kills.className = 'r-kills';
      kills.textContent = entry.kills + ' K';
      const deaths = document.createElement('span');
      deaths.className = 'r-deaths';
      deaths.textContent = entry.deaths + ' D';
      const kd = document.createElement('span');
      kd.className = 'r-kd';
      const kdVal = entry.kills / Math.max(entry.deaths, 1);
      kd.textContent = kdVal.toFixed(2);
      div.appendChild(rank);
      div.appendChild(dot);
      div.appendChild(name);
      div.appendChild(kills);
      div.appendChild(deaths);
      div.appendChild(kd);
      list.appendChild(div);
    });
    this.resultTimer = 5;
  }

  /* ----------------------------------------------------------
     ロビーへ戻る
     ---------------------------------------------------------- */
  _returnToLobby() {
    this.gameStarted = false;
    this.gameOver = false;
    this.mouseDown = false;
    if (this.input) { this.input.firePressed = false; this.input.fireClicked = false; }
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.invincibleTimer = 0;
    this.respawnTimer = 0;
    this.respawnReady = false;
    this.respawnRequested = false;
    this.cheatDetectedTimer = 0;
    this.killCamKillerId = null;

    const readyBtn = document.getElementById('btn-ready');
    if (readyBtn) {
      readyBtn.dataset.ready = 'false';
      readyBtn.textContent = '\u25B6 READY';
    }

    if (this.matchStats) this.matchStats.resetAll();
    this.players.forEach(p => {
      p.resetMatchStats();
      p.alive = true;
      p.health = CONFIG.maxHealth;
      p.updateMesh();
    });

    if (this.passiveManager) {
      this.passiveManager.resetAll();
      this.players.forEach((p, id) => {
        this.passiveManager.clearPassive(id);
      });
      this.loadoutPassive = 'none';
      this.clientPassives.clear();
    }
    if (this.killFeedManager) this.killFeedManager.clear();
    document.getElementById('kill-announcement').innerHTML = '';

    const hostId = this.network.myId;
    this.clientReady.forEach((v, id) => {
      if (id !== hostId) this.clientReady.delete(id);
    });
    this.clientReady.set(hostId, true);
    this.projectiles.forEach(p => p.destroy());
    this.projectiles = [];
    if (this.hostAuthority) this.hostAuthority.reset();
    if (this.cheatValidator) this.cheatValidator.reset();
    if (this.cheatManager) this.cheatManager.reset();
    if (this.effectManager) this.effectManager.clear();
    if (this.beamManager) this.beamManager.clear();
    document.getElementById('kill-feed').innerHTML = '';
    document.getElementById('timer-display').textContent = '--:--';
    document.getElementById('ammo-display').textContent = '--/--';
    document.getElementById('kill-count').textContent = '0';
    document.getElementById('death-count').textContent = '0';
    this.kills = 0;
    this.deaths = 0;
    this.killStreak = 0;
    this.multiKillTimer = 0;
    this.lastKillTime = 0;
    this._killTimestamps = null;
    this.scoreboard.clear();
    this.gameTimer = CONFIG.gameTimeLimit;
    this.connectionHandled = false;
    this._lastPreviewedMap = null;
    this.setState(GameState.LOBBY);
    if (this.network.isHost) this._syncLobbyState();
  }

  /* ----------------------------------------------------------
     ゲームループ
     ---------------------------------------------------------- */
  animate() {
    requestAnimationFrame(() => this.animate());
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
  }
}
