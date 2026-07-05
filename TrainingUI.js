class TrainingUI {
  constructor(game) {
    this.game = game;
    this.weapons = WEAPON_REGISTRY.getAll();
    this.weaponIndex = 0;
    this.passiveIds = PASSIVE_IDS;
    this.selectedPassives = new Set();
    this.initialized = false;
    this.panelOpen = true;
    this._escHandler = null;
    this._hoveredWeapon = null;
    this._hoveredPassive = null;
    this._tooltipTimer = null;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    const idx = this.weapons.indexOf(this.game.loadoutWeapon);
    this.weaponIndex = idx >= 0 ? idx : 0;

    this._renderWeaponList();
    this._renderPassiveList();
    this._bindEvents();
    this._updateWeaponInfo();
    this._setupTooltips();
    this._setupEscHandler();
  }

  _setupEscHandler() {
    if (this._escHandler) return;
    this._escHandler = (e) => {
      if (e.key === 'Escape' && this.game.gameState === GameState.TRAINING) {
        e.preventDefault();
        const guide = document.getElementById('training-game-guide');
        if (guide && guide.style.display !== 'none') {
          guide.style.display = 'none';
          return;
        }
        if (this.panelOpen) {
          this._closePanel();
        } else {
          this._openPanel();
        }
      }
    };
    document.addEventListener('keydown', this._escHandler);
  }

  _renderWeaponList() {
    const container = document.getElementById('training-weapon-list');
    if (!container) return;
    container.innerHTML = '';

    const categories = {};
    const catOrder = ["Pistol","SMG","Assault Rifle","Marksman Rifle","Sniper Rifle","Shotgun","LMG","Beam","Energy","Explosive","Experimental","Drone"];
    for (const id of this.weapons) {
      const wp = WEAPON_REGISTRY.get(id);
      const cat = wp.categoryJa || wp.category || 'Other';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(id);
    }

    for (const cat of catOrder) {
      const engCat = cat;
      const ids = Object.keys(categories).reduce((acc, k) => {
        const engMap = {"Pistol":"ピストル","SMG":"サブマシンガン","Assault Rifle":"アサルトライフル","Marksman Rifle":"マークスマンライフル","Sniper Rifle":"スナイパーライフル","Shotgun":"ショットガン","LMG":"LMG","Beam":"ビーム","Energy":"エネルギー","Explosive":"爆発物","Experimental":"実験兵器","Drone":"ドローン"};
        if (engMap[engCat] === k) acc = categories[k];
        return acc;
      }, null);
      if (!ids) continue;
      const catEl = document.createElement('div');
      catEl.className = 'tw-category';
      const catTitle = document.createElement('div');
      catTitle.className = 'tw-category-title';
      catTitle.dataset.collapsed = 'false';
      const catJa = WEAPON_REGISTRY.get(ids[0]).categoryJa || cat;
      catTitle.innerHTML = `<span class="tw-cat-arrow">▾</span> ${catJa} <span class="tw-cat-count">${ids.length}</span>`;
      catTitle.addEventListener('click', () => {
        const collapsed = catTitle.dataset.collapsed === 'true';
        catTitle.dataset.collapsed = collapsed ? 'false' : 'true';
        catTitle.querySelector('.tw-cat-arrow').textContent = collapsed ? '▾' : '▸';
        const body = catEl.querySelector('.tw-category-body');
        if (body) body.style.display = collapsed ? '' : 'none';
      });
      catEl.appendChild(catTitle);

      const body = document.createElement('div');
      body.className = 'tw-category-body';
      for (const id of ids) {
        const wp = WEAPON_REGISTRY.get(id);
        const item = document.createElement('div');
        item.className = 'tw-item';
        item.dataset.weaponId = id;
        const typeIcon = wp.weaponType === 'beam' ? '⚡ ' : (
          wp.weaponType === 'energy' ? '⚡ ' : (
            wp.weaponType === 'explosive' ? '💥 ' : (
              wp.weaponType === 'summon' ? '🛸 ' : (
                wp.weaponType === 'special' ? '✦ ' : ''))));
        item.innerHTML = `<span class="tw-item-name">${typeIcon}${wp.displayNameJa || wp.displayName}</span>
          <span class="tw-item-dmg">${wp.damage}</span>`;
        item.addEventListener('mouseenter', () => { this._hoveredWeapon = id; this._showTooltip('weapon', id); });
        item.addEventListener('mouseleave', () => { this._hoveredWeapon = null; this._hideTooltip(); });
        if (id === this.game.loadoutWeapon) item.classList.add('selected');
        body.appendChild(item);
      }
      catEl.appendChild(body);
      container.appendChild(catEl);
    }
  }

  _renderPassiveList() {
    const container = document.getElementById('training-passive-list');
    if (!container) return;
    container.innerHTML = '';

    const catJa = { "Basic":"基本","Movement":"移動","Weapon":"武器","Critical":"クリティカル","Projectile":"投射物","Beam":"ビーム","Survival":"生存","Ammo":"弾薬","Utility":"ユーティリティ","Ultimate":"アルティメット" };
    const categories = {};
    for (const id of this.passiveIds) {
      const p = PASSIVES[id];
      const cat = p.category || 'Other';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(id);
    }

    for (const [cat, ids] of Object.entries(categories)) {
      const catEl = document.createElement('div');
      catEl.className = 'tp-category';
      const catTitle = document.createElement('div');
      catTitle.className = 'tp-category-title';
      catTitle.textContent = catJa[cat] || cat;
      catEl.appendChild(catTitle);

      for (const id of ids) {
        const p = PASSIVES[id];
        const d = PASSIVE_DETAILS[id] || {};
        const item = document.createElement('div');
        item.className = 'tp-item';
        item.dataset.passiveId = id;
        const checked = this.selectedPassives.has(id) ? '☑' : '☐';
        item.innerHTML = `<span class="tp-check">${checked}</span>
          <span class="tp-icon">${p.icon || ''}</span>
          <span class="tp-name">${d.displayNameJa || p.displayName || id}</span>`;
        item.addEventListener('mouseenter', () => { this._hoveredPassive = id; this._showTooltip('passive', id); });
        item.addEventListener('mouseleave', () => { this._hoveredPassive = null; this._hideTooltip(); });
        if (id !== 'none' && this.selectedPassives.has(id)) {
          item.classList.add('selected');
        }
        catEl.appendChild(item);
      }
      container.appendChild(catEl);
    }
  }

  _bindEvents() {
    const weaponList = document.getElementById('training-weapon-list');
    if (weaponList) {
      weaponList.addEventListener('click', (e) => {
        const item = e.target.closest('.tw-item');
        if (!item) return;
        const weaponId = item.dataset.weaponId;
        if (!weaponId) return;
        this._selectWeapon(weaponId);
      });
    }

    const passiveList = document.getElementById('training-passive-list');
    if (passiveList) {
      passiveList.addEventListener('click', (e) => {
        const item = e.target.closest('.tp-item');
        if (!item) return;
        const passiveId = item.dataset.passiveId;
        if (!passiveId) return;
        this._togglePassive(passiveId);
      });
    }

    const applyBtn = document.getElementById('training-apply-btn');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        this._applyChanges();
        this._closePanel();
      });
    }

    const closeBtn = document.getElementById('training-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this._closePanel();
      });
    }

    const resetBtn = document.getElementById('training-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (this.game.trainingManager) {
          this.game.trainingManager.reset();
          if (AUDIO) AUDIO.play('ui_click');
        }
      });
    }

    const exitBtn = document.getElementById('training-exit-btn');
    if (exitBtn) {
      exitBtn.addEventListener('click', () => {
        this._exitTraining();
      });
    }

    const toggleBtn = document.getElementById('training-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this._openPanel();
      });
    }

    const guideBtn = document.getElementById('training-guide-btn');
    if (guideBtn) {
      guideBtn.addEventListener('click', () => {
        document.getElementById('training-game-guide').style.display = 'flex';
        if (AUDIO) AUDIO.play('ui_click');
      });
    }

    const guideClose = document.querySelector('.tgg-close-btn');
    if (guideClose) {
      guideClose.addEventListener('click', () => {
        document.getElementById('training-game-guide').style.display = 'none';
        if (AUDIO) AUDIO.play('ui_click');
      });
    }
  }

  _selectWeapon(weaponId) {
    this.game.loadoutWeapon = weaponId;
    if (this.game.weaponManager) this.game.weaponManager.set(weaponId);
    if (this.game.localPlayer) {
      this.game.localPlayer.weapon = weaponId;
      this.game.localPlayer.refillAmmo();
      this.game.localPlayer.lastFireTime = 0;
      this.game.updateAmmoUI();
      this.game.updateHeatUI();
    }
    this._updateWeaponInfo();
    document.querySelectorAll('.tw-item').forEach(el => {
      el.classList.toggle('selected', el.dataset.weaponId === weaponId);
    });
    if (AUDIO) AUDIO.play('ui_weapon_change');
  }

  _togglePassive(passiveId) {
    if (passiveId === 'none') return;
    if (this.selectedPassives.has(passiveId)) {
      this.selectedPassives.delete(passiveId);
    } else {
      this.selectedPassives.add(passiveId);
    }
    this._renderPassiveList();
    if (this.selectedPassives.size > 0) {
      const lastToggled = passiveId;
      this._updatePassiveInfo(lastToggled);
    } else {
      document.getElementById('training-detail-panel').style.display = 'none';
    }
    if (AUDIO) AUDIO.play('ui_click');
  }

  _closePanel() {
    this.panelOpen = false;
    const panel = document.getElementById('training-left-panel');
    if (panel) panel.classList.add('closed');
    const detailPanel = document.getElementById('training-detail-panel');
    if (detailPanel) detailPanel.style.display = 'none';
    const toggleBtn = document.getElementById('training-toggle-btn');
    if (toggleBtn) toggleBtn.style.display = '';
    if (document.pointerLockElement !== this.game.renderer.domElement) {
      this.game.renderer.domElement.requestPointerLock();
    }
    this.game.mouseDown = false;
    this.game.mouseClicked = false;
    if (AUDIO) AUDIO.play('ui_click');
  }

  _openPanel() {
    this.panelOpen = true;
    const panel = document.getElementById('training-left-panel');
    if (panel) panel.classList.remove('closed');
    const toggleBtn = document.getElementById('training-toggle-btn');
    if (toggleBtn) toggleBtn.style.display = 'none';
    if (document.pointerLockElement) document.exitPointerLock();
    this._updateWeaponInfo();
    if (AUDIO) AUDIO.play('ui_click');
  }

  _applyChanges() {
    const wp = WEAPON_REGISTRY.get(this.game.loadoutWeapon);
    if (wp) {
      if (this.game.weaponManager) this.game.weaponManager.set(this.game.loadoutWeapon);
      if (this.game.localPlayer) {
        this.game.localPlayer.weapon = this.game.loadoutWeapon;
        this.game.localPlayer.refillAmmo();
        this.game.localPlayer.lastFireTime = 0;
        this.game.updateAmmoUI();
        this.game.updateHeatUI();
      }
    }

    if (this.game.passiveManager && this.game.localId) {
      let passivesArray = Array.from(this.selectedPassives);
      if (passivesArray.length === 0) passivesArray = ['none'];
      const primaryPassive = passivesArray[0];
      this.game.loadoutPassive = primaryPassive;
      this.game.passiveManager.assignPassives(this.game.localId, passivesArray);
      if (this.game.localPlayer) {
        this.game.passiveManager.applyToPlayer(this.game.localPlayer);
      }
    }

    if (this.game.trainingManager) {
      const lp = this.game.localPlayer;
      if (lp) {
        lp.health = 9999;
        this.game.updateHealthUI();
      }
    }
    if (AUDIO) AUDIO.play('ui_click');
  }

  /* -----------------------------------------------------
     詳細パネル表示
     ----------------------------------------------------- */
  _updateWeaponInfo() {
    const wp = WEAPON_REGISTRY.get(this.game.loadoutWeapon);
    if (!wp) return;
    const r = WEAPON_REGISTRY;
    const stars = wp.stars || {};

    /* 左パネル */
    const nameEl = document.getElementById('training-weapon-name');
    const statsEl = document.getElementById('training-weapon-stats');
    const descEl = document.getElementById('training-weapon-desc');
    const playstyleEl = document.getElementById('training-weapon-playstyle');

    if (nameEl) nameEl.textContent = wp.displayNameJa || wp.displayName;
    if (descEl) descEl.textContent = wp.description || '';
    if (playstyleEl) playstyleEl.innerHTML =
      `<span class="ws-difficulty">難易度: ${"◆".repeat(wp.difficulty)}${"◇".repeat(5 - wp.difficulty)}</span>
       <span class="ws-playstyle">スタイル: <strong>${wp.playstyle}</strong></span>`;

    if (statsEl) statsEl.innerHTML = `
      <div class="tw-stat-row"><span class="tw-stat-label">威力</span><span class="tw-stat-stars">${r.starsToString(stars.damage)}</span><span class="tw-stat-val">${wp.damage}</span></div>
      <div class="tw-stat-row"><span class="tw-stat-label">連射速度</span><span class="tw-stat-stars">${r.starsToString(stars.fireRate)}</span><span class="tw-stat-val">${(wp.fireRate * 1000).toFixed(0)}ms</span></div>
      <div class="tw-stat-row"><span class="tw-stat-label">射程</span><span class="tw-stat-stars">${r.starsToString(stars.range)}</span><span class="tw-stat-val">${wp.range}m</span></div>
      <div class="tw-stat-row"><span class="tw-stat-label">命中精度</span><span class="tw-stat-stars">${r.starsToString(stars.accuracy)}</span><span class="tw-stat-val"></span></div>
      <div class="tw-stat-row"><span class="tw-stat-label">機動力</span><span class="tw-stat-stars">${r.starsToString(stars.mobility)}</span><span class="tw-stat-val"></span></div>
      <div class="tw-stat-row"><span class="tw-stat-label">マガジン</span><span class="tw-stat-stars">${r.starsToString(stars.magazine)}</span><span class="tw-stat-val">${wp.magazineSize}</span></div>
      <div class="tw-stat-row"><span class="tw-stat-label">リロード</span><span class="tw-stat-stars">${r.starsToString(stars.reload)}</span><span class="tw-stat-val">${wp.reloadTime}s</span></div>
      <div class="tw-stat-row"><span class="tw-stat-label">反動</span><span class="tw-stat-stars">${r.starsToString(stars.recoil)}</span><span class="tw-stat-val"></span></div>
      <div class="tw-dps-row">DPS: <strong>${((wp.damage * (wp.pellets || 1)) / wp.fireRate).toFixed(0)}</strong></div>
    `;

    /* 右詳細パネル */
    this._showWeaponDetailPanel(wp, stars);
  }

  _showWeaponDetailPanel(wp, stars) {
    const panel = document.getElementById('training-detail-panel');
    const r = WEAPON_REGISTRY;

    document.getElementById('td-weapon-header').style.display = '';
    document.getElementById('td-weapon-stats-section').style.display = '';
    document.getElementById('td-weapon-detail-section').style.display = '';
    document.getElementById('td-passive-header').style.display = 'none';
    document.getElementById('td-passive-detail-section').style.display = 'none';

    document.getElementById('td-wp-name').textContent = wp.displayNameJa || wp.displayName;
    document.getElementById('td-wp-category').textContent = wp.categoryJa || wp.category;
    document.getElementById('td-wp-stars').textContent = `総合評価: ★${Math.round((stars.damage + stars.fireRate + stars.range + stars.accuracy + stars.mobility + stars.reload + stars.magazine + stars.recoil) / 8 * 10) / 10}`;
    document.getElementById('td-wp-desc').textContent = wp.description || '';

    /* ステータス一覧 */
    const statKeys = [
      {label:'威力', key:'damage', val: wp.damage},
      {label:'連射速度', key:'fireRate', val: (wp.fireRate * 1000).toFixed(0)+'ms'},
      {label:'射程', key:'range', val: wp.range+'m'},
      {label:'命中精度', key:'accuracy', val: ''},
      {label:'機動力', key:'mobility', val: ''},
      {label:'マガジン', key:'magazine', val: wp.magazineSize},
      {label:'リロード', key:'reload', val: wp.reloadTime+'s'},
      {label:'反動', key:'recoil', val: ''},
    ];
    const statsHtml = statKeys.map(sk =>
      `<div class="tw-stat-row"><span class="tw-stat-label">${sk.label}</span><span class="tw-stat-stars">${r.starsToString(stars[sk.key])}</span><span class="tw-stat-val">${sk.val}</span></div>`
    ).join('');
    document.getElementById('td-wp-stats').innerHTML = statsHtml;

    /* 装備中との比較 */
    this._showWeaponCompare(wp, stars);

    /* 長所・短所・おすすめ */
    const s = (wp.strengths || []).map(x => `<div class="td-bullet td-bullet-plus">${x}</div>`).join('');
    document.getElementById('td-wp-strengths').innerHTML = s ? `<div class="td-subtitle">【長所】</div>${s}` : '';
    const w = (wp.weaknesses || []).map(x => `<div class="td-bullet td-bullet-minus">${x}</div>`).join('');
    document.getElementById('td-wp-weaknesses').innerHTML = w ? `<div class="td-subtitle">【短所】</div>${w}` : '';
    const rec = (wp.recommendedFor || []).map(x => `<span class="td-tag">${x}</span>`).join('');
    document.getElementById('td-wp-recommended').innerHTML = rec ? `<div class="td-subtitle">おすすめ</div><div class="td-tags">${rec}</div>` : '';
    const rp = (wp.recommendedPassives || []).map(id => {
      const pd = PASSIVE_DETAILS[id];
      return pd ? `<span class="td-tag td-tag-ps">${pd.displayNameJa || id}</span>` : '';
    }).join('');
    document.getElementById('td-wp-passives').innerHTML = rp ? `<div class="td-subtitle">おすすめパッシブ</div><div class="td-tags">${rp}</div>` : '';

    panel.style.display = '';
  }

  _showWeaponCompare(wp, stars) {
    const currentId = this.game.loadoutWeapon;
    const cur = WEAPON_REGISTRY.get(currentId);
    const container = document.getElementById('td-wp-compare');
    if (!cur || cur.id === wp.id) { container.innerHTML = ''; return; }

    const curStars = cur.stars || {};
    const fields = [
      {label:'威力', ck:'damage', nk:'damage', cv:cur.damage, nv:wp.damage},
      {label:'連射速度', ck:'fireRate', nk:'fireRate', cv:1/(cur.fireRate||0.25), nv:1/(wp.fireRate||0.25)},
      {label:'射程', ck:'range', nk:'range', cv:cur.range, nv:wp.range},
      {label:'命中精度', ck:'accuracy', nk:'accuracy', cv:curStars.accuracy||3, nv:stars.accuracy||3},
      {label:'機動力', ck:'mobility', nk:'mobility', cv:curStars.mobility||3, nv:stars.mobility||3},
      {label:'マガジン', ck:'magazine', nk:'magazine', cv:cur.magazineSize, nv:wp.magazineSize},
      {label:'リロード', ck:'reload', nk:'reload', cv:1/(cur.reloadTime||3), nv:1/(wp.reloadTime||3)},
    ];
    const rows = fields.map(f => {
      const cVal = f.cv;
      const nVal = f.nv;
      const diff = nVal - cVal;
      const pct = cVal > 0 ? ((diff / cVal) * 100).toFixed(0) : '0';
      const cls = diff > 0 ? 'td-cmp-up' : (diff < 0 ? 'td-cmp-down' : 'td-cmp-eq');
      const arrow = diff > 0 ? '↑' : (diff < 0 ? '↓' : '→');
      const barW = Math.min(100, Math.abs(diff) / Math.max(cVal, nVal) * 100 + 10);
      return `<div class="td-cmp-row ${cls}">
        <span class="td-cmp-label">${f.label}</span>
        <span class="td-cmp-bar"><span class="td-cmp-fill" style="width:${barW}%"></span></span>
        <span class="td-cmp-diff">${arrow} ${pct}%</span>
      </div>`;
    }).join('');
    container.innerHTML = `<div class="td-subtitle">装備中との比較</div>${rows}`;
  }

  _updatePassiveInfo(passiveId) {
    const d = PassiveRegistry.getDetail(passiveId);
    if (!d) return;
    const panel = document.getElementById('training-detail-panel');

    document.getElementById('td-passive-header').style.display = '';
    document.getElementById('td-passive-detail-section').style.display = '';
    document.getElementById('td-weapon-header').style.display = 'none';
    document.getElementById('td-weapon-stats-section').style.display = 'none';
    document.getElementById('td-weapon-detail-section').style.display = 'none';

    document.getElementById('td-ps-name').textContent = d.displayNameJa || d.displayName;
    document.getElementById('td-ps-category').textContent = d.categoryJa || d.category;
    const rarityColors = {common:'#8888aa', uncommon:'#00ff88', rare:'#00aaff', epic:'#aa44ff'};
    const rarEl = document.getElementById('td-ps-rarity');
    rarEl.textContent = d.rarity ? d.rarity.toUpperCase() : '';
    rarEl.style.color = rarityColors[d.rarity] || '#8888aa';

    document.getElementById('td-ps-effect').textContent = d.effect || d.description;
    document.getElementById('td-ps-desc').textContent = d.descriptionJa || d.descriptionEn || '';

    /* 相性の良い武器 */
    const sw = (d.synergyWeapons || []).map(id => {
      const w = WEAPON_REGISTRY.get(id);
      return w ? `<span class="td-tag td-tag-wp">${w.displayNameJa || w.displayName}</span>` : '';
    }).join('');
    document.getElementById('td-ps-synergy').innerHTML = sw ? `<div class="td-subtitle">相性の良い武器</div><div class="td-tags">${sw}</div>` : '';

    /* 相性の悪い武器 */
    const aw = (d.antiSynergyWeapons || []).map(id => {
      const w = WEAPON_REGISTRY.get(id);
      return w ? `<span class="td-tag td-tag-wp">${w.displayNameJa || w.displayName}</span>` : '';
    }).join('');
    document.getElementById('td-ps-anti').innerHTML = aw ? `<div class="td-subtitle">相性の悪い武器</div><div class="td-tags">${aw}</div>` : '';

    /* おすすめプレイスタイル */
    const ps = (d.recommendedPlaystyle || []).map(x => `<span class="td-tag">${x}</span>`).join('');
    document.getElementById('td-ps-playstyle').innerHTML = ps ? `<div class="td-subtitle">おすすめプレイスタイル</div><div class="td-tags">${ps}</div>` : '';

    /* メリット */
    const m = (d.merits || []).map(x => `<div class="td-bullet td-bullet-plus">${x}</div>`).join('');
    document.getElementById('td-ps-merits').innerHTML = m ? `<div class="td-subtitle">【メリット】</div>${m}` : '';

    /* デメリット */
    const dm = (d.demerits || []).map(x => `<div class="td-bullet td-bullet-minus">${x}</div>`).join('');
    document.getElementById('td-ps-demerits').innerHTML = dm ? `<div class="td-subtitle">【デメリット】</div>${dm}` : '';

    /* パッシブ比較 */
    this._showPassiveCompare(passiveId, d);

    panel.style.display = '';
  }

  _showPassiveCompare(passiveId, d) {
    const container = document.getElementById('td-ps-compare');
    const currentPassive = this.game.loadoutPassive;
    const cur = PASSIVES[currentPassive];
    if (!cur || currentPassive === 'none' || currentPassive === passiveId) {
      container.innerHTML = '';
      return;
    }
    const curD = PassiveRegistry.getDetail(currentPassive);
    if (!curD) { container.innerHTML = ''; return; }

    /* 修飾子の比較表示 */
    const curMods = cur.modifiers || {};
    const newMods = d.modifiers || {};
    const allKeys = new Set([...Object.keys(curMods), ...Object.keys(newMods)]);
    const labelMap = {moveSpeed:'移動速度', dashSpeed:'ダッシュ速度', damageMultiplier:'ダメージ倍率', fireRateMultiplier:'連射速度倍率', reloadMultiplier:'リロード速度倍率', maxHealthFlat:'最大HP', incomingDamageMultiplier:'被ダメ倍率'};
    const rows = [];
    for (const key of allKeys) {
      const oldVal = curMods[key];
      const newVal = newMods[key];
      if (oldVal === newVal) continue;
      const label = labelMap[key] || key;
      const oldPct = typeof oldVal === 'number' ? ((oldVal - 1) * 100).toFixed(0) : '';
      const newPct = typeof newVal === 'number' ? ((newVal - 1) * 100).toFixed(0) : '';
      const arrow = (newVal || 0) > (oldVal || 0) ? '↑' : '↓';
      rows.push(`<div class="td-cmp-row ${(newVal||0) > (oldVal||0) ? 'td-cmp-up' : 'td-cmp-down'}">
        <span class="td-cmp-label">${label}</span>
        <span class="td-cmp-diff">${oldPct}% → ${newPct}% ${arrow}</span>
      </div>`);
    }
    if (rows.length > 0) {
      container.innerHTML = `<div class="td-subtitle">現在選択中との比較</div>${rows.join('')}`;
    } else {
      container.innerHTML = '';
    }
  }

  /* -----------------------------------------------------
     ツールチップ
     ----------------------------------------------------- */
  _showTooltip(type, id) {
    this._hideTooltip();
    this._tooltipTimer = setTimeout(() => {
      const tt = document.getElementById('training-tooltip');
      if (!tt) return;
      if (type === 'weapon') {
        const w = WEAPON_REGISTRY.get(id);
        if (!w) return;
        const stars = w.stars || {};
        const r = WEAPON_REGISTRY;
        tt.innerHTML = `<div class="tt-name">${w.displayNameJa || w.displayName}</div>
          <div class="tt-stars">${r.starsToString(stars.damage)} ${w.damage}DMG</div>
          <div class="tt-desc">${w.description || ''}</div>`;
      } else {
        const d = PASSIVE_DETAILS[id];
        if (!d) return;
        tt.innerHTML = `<div class="tt-name">${d.displayNameJa || id}</div>
          <div class="tt-desc">${d.descriptionJa || d.description || ''}</div>`;
      }
      tt.style.display = 'block';
    }, 400);
  }

  _hideTooltip() {
    if (this._tooltipTimer) {
      clearTimeout(this._tooltipTimer);
      this._tooltipTimer = null;
    }
    const tt = document.getElementById('training-tooltip');
    if (tt) tt.style.display = 'none';
  }

  _exitTraining() {
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
      this._escHandler = null;
    }
    if (this.game.trainingManager) {
      this.game.trainingManager.destroy();
      this.game.trainingManager = null;
    }
    this.game.trainingUI = null;
    if (document.pointerLockElement) document.exitPointerLock();
    this.game._clearArena();
    this.game._createArena(this.game.selectedMap);
    this.game.setState(GameState.TITLE);
    if (AUDIO) AUDIO.play('ui_click');
  }
}
