/* ============================================================
   NEON ARENA - ネットワーク管理
   PeerJSを用いたスター型ネットワーク
   ホスト: 全クライアントと接続、ブロードキャスト
   クライアント: ホスト1台と接続、状態送信
   ============================================================ */

class NetworkManager {
  constructor(game) {
    this.game = game;                    /* Gameインスタンス参照 */
    this.peer = null;                    /* PeerJSピアインスタンス */
    this.connections = [];               /* ホスト側: クライアント接続配列 */
    this.conn = null;                    /* クライアント側: ホストへの単一接続 */
    this.isHost = false;                 /* ホストフラグ */
    this.roomId = null;                  /* ルームID（= ホストのPeerID） */
    this.myId = null;                    /* 自分のピアID */
    this.connected = false;              /* 接続状態 */
    this.sendTimer = 0;                  /* 状態送信用インターバルタイマー */
    this.peerPacketCount = new Map();    /* ピア別パケットカウンタ（診断用） */
  }

  /**
   * ルーム作成（ホストになる）
   * @returns {Promise<string>} 生成されたルームID
   */
  async createRoom() {
    this.isHost = true;
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.roomId = 'NEON-' + suffix;
    return new Promise((resolve, reject) => {
      this.peer = new Peer(this.roomId, { debug: 0 });
      this.peer.on('open', () => { this.myId = this.roomId; resolve(this.roomId); });
      this.peer.on('connection', (conn) => {
        this.connections.push(conn);
        this._setupConn(conn);
      });
      this.peer.on('error', (err) => reject(err));
    });
  }

  /**
   * ルーム参加（クライアントになる）
   * @param {string} roomId - 参加先ルームID
   * @param {string} playerName - プレイヤー名
   * @returns {Promise<void>}
   */
  async joinRoom(roomId, playerName) {
    this.isHost = false;
    this.roomId = roomId;
    return new Promise((resolve, reject) => {
      this.peer = new Peer(undefined, { debug: 0 });
      this.peer.on('open', (id) => {
        this.myId = id;
        const conn = this.peer.connect(roomId, { reliable: true });
        this.conn = conn;
        this._setupConn(conn);
        conn.on('open', () => {
          conn.send({ type: NetMsg.JOIN, name: playerName || 'Player' });
          resolve();
        });
      });
      this.peer.on('error', (err) => reject(err));
    });
  }

  /**
   * 接続の共通セットアップ：データ受信ハンドラ・切断ハンドラ
   * @param {Object} conn - PeerJS接続オブジェクト
   */
  _setupConn(conn) {
    console.log('[Network] _setupConn peerId=%s isHost=%s conn.open=%s', conn.peer, this.isHost, conn.open);
    /* データ受信 → Game.handleMessage に委譲 */
    conn.on('data', (data) => {
      this.game.handleMessage(data, conn);
    });
    /* 切断処理 */
    conn.on('close', () => {
      console.log('[Network] conn CLOSED peerId=%s isHost=%s', conn.peer, this.isHost);
      if (this.isHost) {
        const idx = this.connections.indexOf(conn);
        if (idx >= 0) this.connections.splice(idx, 1);
        this.game.onPlayerLeft(conn.peer);
      } else {
        this.connected = false;
        this.game.onDisconnected();
      }
    });
    /* クライアント側の接続確立ハンドラ */
    if (!this.isHost) {
      conn.on('open', () => {
        console.log('[Network] conn OPEN peerId=%s → connected=true', conn.peer);
        this.connected = true;
      });
    }
  }

  /**
   * 特定のピアを強制切断
   * @param {Object} conn - 切断する接続オブジェクト
   */
  _disconnectPeer(conn) {
    try { conn.close(); } catch(e) {}
    const idx = this.connections.indexOf(conn);
    if (idx >= 0) this.connections.splice(idx, 1);
    this.game.onPlayerLeft(conn.peer);
  }

  /**
   * ホスト宛にメッセージを送信（クライアント→ホスト）
   * @param {Object} data - 送信データ
   */
  send(data) {
    const canSend = this.conn && this.conn.open;
    console.log('[Network] send type=%s connected=%s conn=%s open=%s canSend=%s',
      data.type, this.connected, !!this.conn, this.conn ? this.conn.open : 'N/A', canSend);
    if (canSend) this.conn.send(data);
    else console.log('[Network] send BLOCKED: %s', !this.conn ? 'no conn' : 'conn not open');
  }

  /**
   * 特定のピアへ送信（ホスト→クライアント）
   * @param {string} peerId - 宛先ピアID
   * @param {Object} data - 送信データ
   */
  sendTo(peerId, data) {
    if (this.isHost && peerId === this.myId) return;
    const conn = this.connections.find(c => c.peer === peerId);
    if (conn && conn.open) conn.send(data);
  }

  /**
   * 全クライアントへブロードキャスト（ホスト→全員）
   * @param {Object} data - 送信データ
   * @param {Object} [exclude] - 除外する接続（オプション）
   */
  broadcast(data, exclude) {
    const targets = this.connections.filter(c => c !== exclude && c.open);
    console.log('[Network] broadcast type=%s targetConnections=%d (total=%d exclude=%s)',
      data.type, targets.length, this.connections.length, !!exclude);
    this.connections.forEach(c => {
      if (c !== exclude && c.open) c.send(data);
    });
  }

  /**
   * 自プレイヤーの位置/状態を定期的にホスト/全員に送信
   * @param {number} dt - デルタタイム
   */
  sendState(dt) {
    if (!this.connected && !this.isHost) return;
    const p = this.game.localPlayer;
    if (!p || !p.scene) return;
    this.sendTimer += dt;
    if (this.sendTimer < CONFIG.stateSendRate) return;
    this.sendTimer = 0;
    const data = {
      type: 'state',
      id: this.myId,
      pos: { x: p.position.x, y: p.position.y, z: p.position.z },
      rot: p.rotation,
      health: p.health,
      alive: p.alive,
      weapon: p.weapon,
      timestamp: Date.now(),
    };
    if (this.isHost) {
      this.broadcast(data);
    } else {
      this.send(data);
    }
  }

  /**
   * 発射リクエストをホストに送信
   * @param {string} weapon - 武器ID
   * @param {THREE.Vector3} position - 発射位置
   * @param {THREE.Vector3} direction - 発射方向
   * @param {number} inputId - 入力ID（重複防止）
   * @param {number} color - プレイヤーカラー
   */
  sendFireRequest(weapon, position, direction, inputId, color) {
    console.log('[Network] send fire_request weapon=%s inputId=%s', weapon, inputId);
    this.send({
      type: 'fire_request',
      weapon,
      position: { x: position.x, y: position.y, z: position.z },
      direction: { x: direction.x, y: direction.y, z: direction.z },
      timestamp: Date.now(),
      inputId,
      color,
    });
  }

  /**
   * ビーム発射リクエストをホストに送信
   * @param {string} weapon - 武器ID
   * @param {THREE.Vector3} origin - 発射起点
   * @param {THREE.Vector3} direction - 発射方向
   * @param {number} inputId - 入力ID
   * @param {number} color - プレイヤーカラー
   */
  sendBeamFire(weapon, origin, direction, inputId, color) {
    this.send({
      type: 'beam_fire',
      weapon,
      origin: { x: origin.x, y: origin.y, z: origin.z },
      direction: { x: direction.x, y: direction.y, z: direction.z },
      timestamp: Date.now(),
      inputId,
      color,
    });
  }

  /* ============================================================
     ロビー同期メッセージ（準備・武器・パッシブ・名前変更）
     ============================================================ */

  /* 準備完了状態をホストに送信 */
  sendReady(ready) {
    this.send({ type: NetMsg.READY, ready });
  }

  /* 武器選択変更をホストに送信 */
  sendWeaponChange(weapon) {
    this.send({ type: NetMsg.WEAPON_CHANGE, weapon });
  }

  /* パッシブ選択変更をホストに送信 */
  sendPassiveChange(passiveId) {
    this.send({ type: 'passive_change', passiveId });
  }

  /* 名前変更をホストに送信 */
  sendNameChange(name) {
    this.send({ type: NetMsg.NAME_CHANGE, name });
  }

  /* 全接続を閉じてクリーンアップ */
  close() {
    this.connections.forEach(c => c.close());
    if (this.conn) this.conn.close();
    if (this.peer) this.peer.destroy();
    this.connections = [];
    this.connected = false;
  }
}
