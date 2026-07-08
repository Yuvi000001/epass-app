// =====================================================================
// E-PASS — HOD Dashboard (Home / Requests tabs) with a hand-rolled SVG
// donut chart for the department overview (no external chart lib needed).
// =====================================================================

Pages['hod-dashboard'] = {
  _activeTab: 'home',
  _requestsFilter: 'Pending',
  _memberRole: 'STUDENT',
  _searchTerm: '',
  _departmentFilter: '',
  _collegeFilter: '',
  _membersById: {},

  render() {
    this._activeTab = 'home';
    return `
      <ion-header><ion-toolbar>
        <ion-buttons slot="start">
          <img src="assets/images/logo.png" alt="Bansal Group of Institutes" style="height:30px;width:auto;object-fit:contain;" onerror="this.style.display='none'" />
        </ion-buttons>
        <ion-title id="hod-dash-title">HOD Dashboard</ion-title>
        <ion-buttons slot="end"><ion-button id="hod-logout-btn"><ion-icon name="log-out-outline" slot="icon-only"></ion-icon></ion-button></ion-buttons>
      </ion-toolbar></ion-header>
      <ion-content fullscreen><div id="hod-dash-body" class="ion-padding"></div></ion-content>
      <ion-tab-bar id="hod-tabbar">
        <ion-tab-button data-tab="home" class="active"><ion-icon name="home-outline"></ion-icon><ion-label>Home</ion-label></ion-tab-button>
        <ion-tab-button data-tab="members"><ion-icon name="people-outline"></ion-icon><ion-label>Members</ion-label></ion-tab-button>
        <ion-tab-button data-tab="profile"><ion-icon name="person-circle-outline"></ion-icon><ion-label>Profile</ion-label></ion-tab-button>
        <ion-tab-button data-tab="requests"><ion-icon name="document-text-outline"></ion-icon><ion-label>Requests</ion-label></ion-tab-button>
      </ion-tab-bar>
    `;
  },

  afterRender() {
    document.getElementById('hod-logout-btn').addEventListener('click', () => {
      Auth.logout();
      Router.reset('login');
    });
    document.querySelectorAll('#hod-tabbar ion-tab-button').forEach((btn) => {
      btn.addEventListener('click', () => this._switchTab(btn.dataset.tab));
    });
    this._switchTab('home');
  },

  async _loadMembers() {
    const body = document.getElementById('hod-dash-body');
    body.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <ion-segment value="${this._memberRole}" id="hod-member-role-segment" style="flex:1;min-width:220px;">
          <ion-segment-button value="STUDENT"><ion-label>Students</ion-label></ion-segment-button>
          <ion-segment-button value="FACULTY"><ion-label>Faculty</ion-label></ion-segment-button>
          <ion-segment-button value="GUARD"><ion-label>Guards</ion-label></ion-segment-button>
        </ion-segment>
        <ion-item lines="none" style="flex:1;min-width:220px;border:1px solid var(--bgi-border);border-radius:10px;--min-height:38px;">
          <ion-icon name="search-outline" slot="start" color="medium" style="font-size:16px;"></ion-icon>
          <ion-input id="hod-member-search" placeholder="Search name, email, roll..." style="font-size:13px;"></ion-input>
        </ion-item>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:12px;">
        <ion-item lines="none" style="flex:1;min-width:220px;border:1px solid var(--bgi-border);border-radius:10px;--min-height:38px;">
          <ion-icon name="business-outline" slot="start" color="medium" style="font-size:16px;"></ion-icon>
          <ion-select id="hod-member-college-select" interface="action-sheet" placeholder="All Colleges" style="font-size:13px;">
            <ion-select-option value="">All Colleges</ion-select-option>
            ${APP_CONFIG.campuses.map((c) => `<ion-select-option value="${UI.escapeHtml(c.code)}">${UI.escapeHtml(c.label)}</ion-select-option>`).join('')}
          </ion-select>
        </ion-item>
      </div>
      ${this._memberRole === 'FACULTY' ? `
      <ion-card id="hod-faculty-pending-banner" style="margin:0 0 12px;border-left:3px solid var(--bgi-warning);cursor:pointer;">
        <div style="padding:10px 12px;display:flex;align-items:center;gap:8px;">
          <ion-icon name="time-outline" style="font-size:18px;color:var(--bgi-warning);flex-shrink:0;"></ion-icon>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:13px;">Pending Faculty Approvals</div>
            <div id="hod-faculty-pending-count" style="font-size:11px;color:var(--bgi-text-secondary);">Checking...</div>
          </div>
          <ion-icon name="chevron-forward-outline" style="font-size:16px;color:var(--bgi-text-secondary);"></ion-icon>
        </div>
      </ion-card>` : ''}
      ${this._memberRole === 'GUARD' ? `
      <ion-card id="hod-guard-pending-banner" style="margin:0 0 12px;border-left:3px solid var(--bgi-warning);cursor:pointer;">
        <div style="padding:10px 12px;display:flex;align-items:center;gap:8px;">
          <ion-icon name="time-outline" style="font-size:18px;color:var(--bgi-warning);flex-shrink:0;"></ion-icon>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:13px;">Pending Guard Approvals</div>
            <div id="hod-guard-pending-count" style="font-size:11px;color:var(--bgi-text-secondary);">Checking...</div>
          </div>
          <ion-icon name="chevron-forward-outline" style="font-size:16px;color:var(--bgi-text-secondary);"></ion-icon>
        </div>
      </ion-card>` : ''}
      <div id="hod-members-list" class="mt-16"></div>
    `;

    document.getElementById('hod-member-role-segment').addEventListener('ionChange', (e) => {
      this._memberRole = e.detail.value;
      this._renderMembers();
    });
    document.getElementById('hod-member-search').addEventListener('ionInput', (e) => {
      clearTimeout(this._memberSearchDebounce);
      this._memberSearchDebounce = setTimeout(() => {
        this._searchTerm = e.detail.value;
        this._renderMembersList();
      }, 300);
    });
    document.getElementById('hod-member-college-select')?.addEventListener('ionChange', (e) => {
      this._collegeFilter = e.detail.value;
      this._renderMembersList();
    });

    document.getElementById('hod-faculty-pending-banner')?.addEventListener('click', () => this._showPendingFacultyApprovals());
    document.getElementById('hod-guard-pending-banner')?.addEventListener('click', () => this._showPendingGuardApprovals());

    await Promise.all([
      this._refreshFacultyPendingCount(),
      this._refreshGuardPendingCount(),
      this._renderMembersList(),
    ]);
  },

  async _refreshFacultyPendingCount() {
    const el = document.getElementById('hod-faculty-pending-count');
    if (!el) return;
    try {
      const res = await Api.get('/hod/faculty/pending');
      const list = res.data || [];
      el.textContent = list.length
        ? `${list.length} request${list.length > 1 ? 's' : ''} awaiting approval`
        : 'No pending requests';
    } catch (e) {
      el.textContent = 'Unable to load';
    }
  },

  async _showPendingFacultyApprovals() {
    const modal = document.createElement('ion-modal');
    const self = this;
    modal.innerHTML = `
      <ion-header><ion-toolbar>
        <ion-title style="font-size:15px;">Pending Faculty Approvals</ion-title>
        <ion-buttons slot="end"><ion-button id="hod-facp-close" style="font-size:13px;">Close</ion-button></ion-buttons>
      </ion-toolbar></ion-header>
      <ion-content class="ion-padding"><div id="hod-facp-list">${this._spinner()}</div></ion-content>
    `;
    document.body.appendChild(modal);
    await modal.present();
    modal.querySelector('#hod-facp-close').addEventListener('click', () => modal.dismiss());

    const loadList = async () => {
      const list = modal.querySelector('#hod-facp-list');
      list.innerHTML = self._spinner();
      try {
        const res = await Api.get('/hod/faculty/pending');
        if (!res || typeof res !== 'object') {
          list.innerHTML = '<p class="empty-state" style="font-size:12px;">Invalid server response</p>';
          return;
        }
        const items = res.data || [];
        if (!Array.isArray(items)) {
          list.innerHTML = '<p class="empty-state" style="font-size:12px;">Invalid data format</p>';
          return;
        }
        if (!items.length) { list.innerHTML = '<p class="empty-state" style="font-size:12px;">No pending Faculty requests</p>'; return; }
        list.innerHTML = items.map((f) => self._hodFacultyPendingCardHtml(f)).join('');
        list.querySelectorAll('.hod-facp-approve-btn').forEach((btn) => btn.addEventListener('click', () => decide(btn.dataset.id, true)));
        list.querySelectorAll('.hod-facp-reject-btn').forEach((btn) => btn.addEventListener('click', () => decide(btn.dataset.id, false)));
      } catch (e) {
        list.innerHTML = `<p class="empty-state" style="font-size:12px;">${UI.escapeHtml(e.message)}</p>`;
      }
    };

    const decide = async (id, approve) => {
      if (approve) {
        try {
          await Api.put(`/hod/faculty/${id}/approve`, {});
          UI.toast('Faculty approved — they can now log in', 'success');
          await loadList();
          self._refreshFacultyPendingCount();
        } catch (e) { UI.toast(e.message || 'Failed', 'danger'); }
        return;
      }
      const { confirmed, remark } = await UI.confirmWithRemark({
        title: 'Reject Faculty Request?',
        placeholder: 'Reason for rejection (optional)',
        confirmText: 'Reject & Delete',
        confirmColor: 'danger',
      });
      if (!confirmed) return;
      try {
        await Api.put(`/hod/faculty/${id}/reject`, { remark });
        UI.toast('Faculty request rejected and removed');
        await loadList();
        self._refreshFacultyPendingCount();
      } catch (e) { UI.toast(e.message || 'Failed', 'danger'); }
    };

    loadList();
  },

  _hodFacultyPendingCardHtml(f) {
    if (!f || typeof f !== 'object') return '';
    const id = f._id || f.id || '';
    const name = f.name ? UI.escapeHtml(String(f.name)) : '(No name)';
    const email = f.email ? UI.escapeHtml(String(f.email)) : '(No email)';
    const empId = f.employeeId ? UI.escapeHtml(String(f.employeeId)) : '-';
    const dept = f.department ? UI.escapeHtml(String(f.department)) : '-';
    const designation = f.designation ? UI.escapeHtml(String(f.designation)) : '-';
    const phone = f.phone ? UI.escapeHtml(String(f.phone)) : '-';
    return `
      <ion-card style="margin-bottom:8px;border-left:3px solid var(--bgi-warning);">
        <div style="padding:10px 12px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px;margin-bottom:4px;">
            <div>
              <div style="font-weight:700;font-size:13px;">${name}</div>
              <div style="font-size:11px;color:var(--bgi-text-secondary);">${email}</div>
            </div>
            <span class="status-badge status-pending" style="font-size:9px;padding:2px 6px;">PENDING</span>
          </div>
          <div style="font-size:11px;color:var(--bgi-text-secondary);"><b>Emp ID:</b> ${empId} &bull; <b>Dept:</b> ${dept}</div>
          <div style="font-size:11px;color:var(--bgi-text-secondary);"><b>Designation:</b> ${designation}</div>
          <div style="font-size:11px;color:var(--bgi-text-secondary);"><b>Phone:</b> ${phone}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">
            <ion-button expand="block" size="small" color="success" class="hod-facp-approve-btn" data-id="${id}" style="font-size:12px;"><ion-icon name="checkmark-outline" slot="start"></ion-icon>Approve</ion-button>
            <ion-button expand="block" size="small" color="danger" class="hod-facp-reject-btn" data-id="${id}" style="font-size:12px;"><ion-icon name="close-outline" slot="start"></ion-icon>Reject</ion-button>
          </div>
        </div>
      </ion-card>`;
  },

  async _refreshGuardPendingCount() {
    const el = document.getElementById('hod-guard-pending-count');
    if (!el) return;
    try {
      const res = await Api.get('/hod/guards/pending');
      const list = res.data || [];
      el.textContent = list.length
        ? `${list.length} request${list.length > 1 ? 's' : ''} awaiting approval`
        : 'No pending requests';
    } catch (e) {
      el.textContent = 'Unable to load';
    }
  },

  async _showPendingGuardApprovals() {
    const modal = document.createElement('ion-modal');
    const self = this;
    modal.innerHTML = `
      <ion-header><ion-toolbar>
        <ion-title style="font-size:15px;">Pending Guard Approvals</ion-title>
        <ion-buttons slot="end"><ion-button id="hod-guardp-close" style="font-size:13px;">Close</ion-button></ion-buttons>
      </ion-toolbar></ion-header>
      <ion-content class="ion-padding"><div id="hod-guardp-list">${this._spinner()}</div></ion-content>
    `;
    document.body.appendChild(modal);
    await modal.present();
    modal.querySelector('#hod-guardp-close').addEventListener('click', () => modal.dismiss());

    const loadList = async () => {
      const list = modal.querySelector('#hod-guardp-list');
      list.innerHTML = self._spinner();
      try {
        const res = await Api.get('/hod/guards/pending');
        if (!res || typeof res !== 'object') {
          list.innerHTML = '<p class="empty-state" style="font-size:12px;">Invalid server response</p>';
          return;
        }
        const items = res.data || [];
        if (!Array.isArray(items)) {
          list.innerHTML = '<p class="empty-state" style="font-size:12px;">Invalid data format</p>';
          return;
        }
        if (!items.length) { list.innerHTML = '<p class="empty-state" style="font-size:12px;">No pending Guard requests</p>'; return; }
        list.innerHTML = items.map((g) => self._hodGuardPendingCardHtml(g)).join('');
        list.querySelectorAll('.hod-guardp-approve-btn').forEach((btn) => btn.addEventListener('click', () => decide(btn.dataset.id, true)));
        list.querySelectorAll('.hod-guardp-reject-btn').forEach((btn) => btn.addEventListener('click', () => decide(btn.dataset.id, false)));
      } catch (e) {
        list.innerHTML = `<p class="empty-state" style="font-size:12px;">${UI.escapeHtml(e.message)}</p>`;
      }
    };

    const decide = async (id, approve) => {
      if (approve) {
        try {
          await Api.put(`/hod/guards/${id}/approve`, {});
          UI.toast('Guard approved — they can now log in', 'success');
          await loadList();
          self._refreshGuardPendingCount();
        } catch (e) { UI.toast(e.message || 'Failed', 'danger'); }
        return;
      }
      const { confirmed, remark } = await UI.confirmWithRemark({
        title: 'Reject Guard Request?',
        placeholder: 'Reason for rejection (optional)',
        confirmText: 'Reject & Delete',
        confirmColor: 'danger',
      });
      if (!confirmed) return;
      try {
        await Api.put(`/hod/guards/${id}/reject`, { remark });
        UI.toast('Guard request rejected and removed');
        await loadList();
        self._refreshGuardPendingCount();
      } catch (e) { UI.toast(e.message || 'Failed', 'danger'); }
    };

    loadList();
  },

  _hodGuardPendingCardHtml(g) {
    if (!g || typeof g !== 'object') return '';
    const id = g._id || g.id || '';
    const name = g.name ? UI.escapeHtml(String(g.name)) : '(No name)';
    const email = g.email ? UI.escapeHtml(String(g.email)) : '(No email)';
    const empId = g.employeeId ? UI.escapeHtml(String(g.employeeId)) : '-';
    const gate = g.assignedGate ? UI.escapeHtml(String(g.assignedGate)) : '-';
    const phone = g.phone ? UI.escapeHtml(String(g.phone)) : '-';
    return `
      <ion-card style="margin-bottom:8px;border-left:3px solid var(--bgi-warning);">
        <div style="padding:10px 12px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px;margin-bottom:4px;">
            <div>
              <div style="font-weight:700;font-size:13px;">${name}</div>
              <div style="font-size:11px;color:var(--bgi-text-secondary);">${email}</div>
            </div>
            <span class="status-badge status-pending" style="font-size:9px;padding:2px 6px;">PENDING</span>
          </div>
          <div style="font-size:11px;color:var(--bgi-text-secondary);"><b>Emp ID:</b> ${empId} &bull; <b>Gate:</b> ${gate}</div>
          <div style="font-size:11px;color:var(--bgi-text-secondary);"><b>Phone:</b> ${phone}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">
            <ion-button expand="block" size="small" color="success" class="hod-guardp-approve-btn" data-id="${id}" style="font-size:12px;"><ion-icon name="checkmark-outline" slot="start"></ion-icon>Approve</ion-button>
            <ion-button expand="block" size="small" color="danger" class="hod-guardp-reject-btn" data-id="${id}" style="font-size:12px;"><ion-icon name="close-outline" slot="start"></ion-icon>Reject</ion-button>
          </div>
        </div>
      </ion-card>`;
  },

  async _renderMembersList() {
    const list = document.getElementById('hod-members-list');
    if (!list) return;
    list.innerHTML = `<div class="text-center mt-24"><ion-spinner color="primary"></ion-spinner></div>`;
    try {
      const res = await Api.get('/hod/members', {
        role: this._memberRole,
        search: this._searchTerm || undefined,
        college: this._collegeFilter || undefined,
        department: this._memberRole === 'GUARD' ? undefined : this._departmentFilter || undefined,
      });
      const members = res.data || [];
      this._membersById = members.reduce((acc, member) => {
        acc[member._id] = member;
        return acc;
      }, {});
      if (!members.length) {
        list.innerHTML = `<p class="empty-state">No ${this._memberRole.toLowerCase()}s found</p>`;
        return;
      }
      list.innerHTML = members.map((m) => this._memberCardHtml(m)).join('');
      list.querySelectorAll('.hod-member-card').forEach((card) => {
        card.addEventListener('click', () => this._showMemberDetail(card.dataset.memberId));
      });
    } catch (e) {
      list.innerHTML = `<p class="empty-state">${UI.escapeHtml(e.message)}</p>`;
    }
  },

  _memberCardHtml(m) {
    const roleLabel = m.role === 'STUDENT'
      ? `Roll: ${UI.escapeHtml(m.rollNumber || '-')} · ${UI.escapeHtml(m.branch || '-')} Sem ${m.semester || '-'}`
      : m.role === 'FACULTY'
        ? UI.escapeHtml(m.designation || 'Faculty')
        : `Gate: ${UI.escapeHtml(m.assignedGate || '-')}`;
    return `
      <ion-card class="hod-member-card" data-member-id="${UI.escapeHtml(m._id)}" style="margin-bottom:8px;cursor:pointer;">
        <div style="padding:12px;display:flex;gap:10px;align-items:center;">
          <div style="width:44px;height:44px;border-radius:50%;background:var(--bgi-bg);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <ion-icon name="person-circle-outline" style="font-size:24px;color:var(--bgi-primary);"></ion-icon>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px;">
              <span style="font-weight:700;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${UI.escapeHtml(m.name)}</span>
              <span class="status-badge ${m.isActive ? 'status-approved' : 'status-rejected'}" style="font-size:9px;padding:2px 6px;">${m.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <div style="font-size:11px;color:var(--bgi-text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${UI.escapeHtml(m.email)}</div>
            <div style="font-size:11px;color:var(--bgi-text-secondary);margin-top:4px;">${roleLabel}</div>
            <div style="font-size:10px;color:var(--bgi-text-secondary);margin-top:6px;display:flex;justify-content:space-between;align-items:center;">
              <span>Dept: ${UI.escapeHtml(m.department || '-')}</span>
              <span style="font-size:11px;color:var(--bgi-primary);font-weight:700;">View Profile</span>
            </div>
          </div>
        </div>
      </ion-card>`;
  },

  _switchTab(tab) {
    this._activeTab = tab;
    document.querySelectorAll('#hod-tabbar ion-tab-button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    const titles = {
      home: 'HOD Dashboard',
      members: 'HOD Members',
      profile: 'Profile',
      requests: 'HOD - All Requests',
    };
    document.getElementById('hod-dash-title').textContent = titles[tab] || 'HOD Dashboard';
    if (tab === 'home') this._loadHome();
    else if (tab === 'members') this._loadMembers();
    else if (tab === 'profile') this._loadProfile();
    else this._loadRequests();
  },

  async _loadHome() {
    const body = document.getElementById('hod-dash-body');
    body.innerHTML = `<div class="text-center mt-24"><ion-spinner color="primary"></ion-spinner></div>`;
    try {
      const res = await Api.get('/hod/stats');
      const s = res.data || {};
      const pending = Number(s.pending || 0);
      const approved = Number(s.approved || 0);
      const rejected = Number(s.rejected || 0);
      const total = Number(s.totalRequests || pending + approved + rejected);

      body.innerHTML = `
        <div class="stat-cards-grid">
          <ion-card class="stat-card" data-jump="all"><div class="value" style="color:var(--bgi-primary)">${total}</div><div class="label">Total Requests</div></ion-card>
          <ion-card class="stat-card" data-jump="Pending"><div class="value" style="color:var(--bgi-warning)">${pending}</div><div class="label">Pending</div></ion-card>
          <ion-card class="stat-card" data-jump="Approved"><div class="value" style="color:var(--bgi-success)">${approved}</div><div class="label">Approved</div></ion-card>
          <ion-card class="stat-card" data-jump="Rejected"><div class="value" style="color:var(--bgi-danger)">${rejected}</div><div class="label">Rejected</div></ion-card>
        </div>

        <ion-card>
          <div class="ion-padding">
            <p style="font-weight:600;margin:0 0 14px;">Department Overview</p>
            <div style="display:flex;align-items:center;gap:20px;">
              ${this._donutSvg(pending, approved, rejected)}
              <div style="flex:1;">
                <div class="legend-row"><span class="legend-dot" style="background:var(--bgi-warning)"></span><span class="legend-label">Pending</span><span class="legend-value">${pending}</span></div>
                <div class="legend-row"><span class="legend-dot" style="background:var(--bgi-success)"></span><span class="legend-label">Approved</span><span class="legend-value">${approved}</span></div>
                <div class="legend-row"><span class="legend-dot" style="background:var(--bgi-danger)"></span><span class="legend-label">Rejected</span><span class="legend-value">${rejected}</span></div>
              </div>
            </div>
          </div>
        </ion-card>
      `;

      body.querySelectorAll('.stat-card').forEach((card) => {
        card.addEventListener('click', () => {
          this._requestsFilter = card.dataset.jump === 'all' ? 'Pending' : card.dataset.jump;
          this._switchTab('requests');
        });
      });
    } catch (e) {
      body.innerHTML = `<p class="empty-state">${UI.escapeHtml(e.message)}</p>`;
    }
  },

  /** Builds a simple SVG donut chart (no chart library dependency). */
  _donutSvg(pending, approved, rejected) {
    const total = pending + approved + rejected;
    const r = 52, cx = 65, cy = 65, circumference = 2 * Math.PI * r;
    if (total === 0) {
      return `<svg width="130" height="130"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#E5E8EE" stroke-width="18"/></svg>`;
    }
    const segments = [
      { value: pending, color: '#E8920A' },
      { value: approved, color: '#1B8A4C' },
      { value: rejected, color: '#DB3B3B' },
    ];
    let offset = 0;
    const circles = segments.map((seg) => {
      const fraction = seg.value / total;
      const dash = fraction * circumference;
      const circle = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${seg.color}" stroke-width="18"
        stroke-dasharray="${dash} ${circumference - dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})"/>`;
      offset += dash;
      return circle;
    }).join('');
    return `<svg width="130" height="130" viewBox="0 0 130 130">${circles}</svg>`;
  },

  async _loadRequests() {
    const body = document.getElementById('hod-dash-body');
    const statuses = ['Pending', 'Approved', 'Rejected'];
    body.innerHTML = `
      <ion-segment value="${this._requestsFilter}" id="hod-segment">
        ${statuses.map((s) => `<ion-segment-button value="${s}"><ion-label>${s}</ion-label></ion-segment-button>`).join('')}
      </ion-segment>
      <div id="hod-requests-list" class="mt-16"></div>
    `;
    document.getElementById('hod-segment').addEventListener('ionChange', (e) => {
      this._requestsFilter = e.detail.value;
      this._renderList();
    });
    await this._renderList();
  },

  async _renderList() {
    const list = document.getElementById('hod-requests-list');
    list.innerHTML = `<div class="text-center mt-24"><ion-spinner color="primary"></ion-spinner></div>`;
    try {
      const res = await Api.get('/hod/requests', { status: this._requestsFilter });
      const requests = res.data || [];
      if (requests.length === 0) {
        list.innerHTML = `<p class="empty-state">No requests found</p>`;
        return;
      }
      list.innerHTML = requests.map((r) => UI.leaveCardHtml(r, { showStudentName: true, showHodActions: true })).join('');
      UI.attachLeaveCardHandlers(list, {
        onApprove: (id) => this._decide(id, true),
        onReject: (id) => this._decide(id, false),
      });
    } catch (e) {
      list.innerHTML = `<p class="empty-state">${UI.escapeHtml(e.message)}</p>`;
    }
  },

  async _decide(id, approve) {
    const { confirmed, remark } = await UI.confirmWithRemark({
      title: approve ? 'Final Approve' : 'Reject Request',
      confirmText: approve ? 'Approve' : 'Reject',
      confirmColor: approve ? 'primary' : 'danger',
    });
    if (!confirmed) return;

    try {
      const path = approve ? `/hod/requests/${id}/approve` : `/hod/requests/${id}/reject`;
      await Api.put(path, { remark });
      await UI.toast(approve ? 'Leave approved — E-Pass generated' : 'Leave rejected', approve ? 'success' : 'medium');
      this._renderList();
    } catch (e) {
      await UI.toast(e.message || 'Action failed', 'danger');
    }
  },

  async _showMemberDetail(memberId) {
    if (!memberId) return;
    const member = this._membersById[memberId];
    if (!member) {
      return UI.toast('Member details not loaded yet', 'danger');
    }

    const roleDetails = {
      STUDENT: `
        <ion-item><ion-label>Roll Number</ion-label><ion-note slot="end">${UI.escapeHtml(member.rollNumber || '-')}</ion-note></ion-item>
        <ion-item><ion-label>Branch</ion-label><ion-note slot="end">${UI.escapeHtml(member.branch || '-')}</ion-note></ion-note></ion-item>
        <ion-item><ion-label>Semester</ion-label><ion-note slot="end">${member.semester || '-'}</ion-note></ion-item>
        <ion-item><ion-label>Advisor</ion-label><ion-note slot="end">${UI.escapeHtml(member.facultyAdvisorId || '-')}</ion-note></ion-item>`,
      FACULTY: `
        <ion-item><ion-label>Designation</ion-label><ion-note slot="end">${UI.escapeHtml(member.designation || '-')}</ion-note></ion-item>`,
      GUARD: `
        <ion-item><ion-label>Assigned Gate</ion-label><ion-note slot="end">${UI.escapeHtml(member.assignedGate || '-')}</ion-note></ion-item>`,
      HOD: `
        <ion-item><ion-label>Employee ID</ion-label><ion-note slot="end">${UI.escapeHtml(member.employeeId || '-')}</ion-note></ion-item>
        <ion-item><ion-label>Qualification</ion-label><ion-note slot="end">${UI.escapeHtml(member.qualification || '-')}</ion-note></ion-item>
        <ion-item><ion-label>Alt. Contact</ion-label><ion-note slot="end">${UI.escapeHtml(member.alternatePhone || '-')}</ion-note></ion-item>
        <ion-item><ion-label>Office Room</ion-label><ion-note slot="end">${UI.escapeHtml(member.officeRoom || '-')}</ion-note></ion-item>`,
    };

    const modal = document.createElement('ion-modal');
    modal.innerHTML = `
      <ion-header><ion-toolbar>
        <ion-title>${UI.escapeHtml(member.name || 'Member')}</ion-title>
        <ion-buttons slot="end"><ion-button id="hod-member-detail-close">Close</ion-button></ion-buttons>
      </ion-toolbar></ion-header>
      <ion-content class="ion-padding">
        ${member.profileImageUrl ? `<div style="text-align:center;margin-bottom:12px;"><img src="${UI.escapeHtml(member.profileImageUrl)}" style="width:72px;height:72px;border-radius:50%;object-fit:cover;" /></div>` : ''}
        <ion-list lines="inset">
          <ion-item><ion-label>Name</ion-label><ion-note slot="end">${UI.escapeHtml(member.name)}</ion-note></ion-item>
          <ion-item><ion-label>Email</ion-label><ion-note slot="end">${UI.escapeHtml(member.email)}</ion-note></ion-item>
          <ion-item><ion-label>Role</ion-label><ion-note slot="end">${UI.escapeHtml(member.role)}</ion-note></ion-item>
          <ion-item><ion-label>Department</ion-label><ion-note slot="end">${UI.escapeHtml(member.department || '-')}</ion-note></ion-item>
          <ion-item><ion-label>Campus</ion-label><ion-note slot="end">${UI.escapeHtml(member.campus || '-')}</ion-note></ion-item>
          <ion-item><ion-label>Phone</ion-label><ion-note slot="end">${UI.escapeHtml(member.phone || '-')}</ion-note></ion-item>
          ${roleDetails[member.role] || ''}
        </ion-list>
      </ion-content>`;

    document.body.appendChild(modal);
    await modal.present();
    modal.querySelector('#hod-member-detail-close').addEventListener('click', () => modal.dismiss());
  },

  async _loadProfile() {
    const body = document.getElementById('hod-dash-body');
    body.innerHTML = `<div class="text-center mt-24"><ion-spinner color="primary"></ion-spinner></div>`;
    try {
      const user = await Auth.fetchProfile();
      body.innerHTML = `
        <div style="text-align:center;">
          ${user.profileImageUrl ? `<img src="${UI.escapeHtml(user.profileImageUrl)}" style="width:96px;height:96px;border-radius:50%;object-fit:cover;margin-bottom:14px;" />` : `<div style="width:96px;height:96px;border-radius:50%;background:var(--bgi-bg);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;"><ion-icon name="person-circle-outline" style="font-size:48px;color:var(--bgi-primary);"></ion-icon></div>`}
          <h2 style="margin:0 0 6px;font-size:18px;">${UI.escapeHtml(user.name || '')}</h2>
          <div style="font-size:12px;color:var(--bgi-text-secondary);margin-bottom:20px;">${UI.escapeHtml(user.role || 'HOD')}</div>
        </div>
        <ion-card>
          <ion-list lines="inset">
            <ion-item><ion-label>Name</ion-label><ion-note slot="end">${UI.escapeHtml(user.name || '-')}</ion-note></ion-item>
            <ion-item><ion-label>Email</ion-label><ion-note slot="end">${UI.escapeHtml(user.email || '-')}</ion-note></ion-item>
            <ion-item><ion-label>Role</ion-label><ion-note slot="end">${UI.escapeHtml(user.role || '-')}</ion-note></ion-item>
            <ion-item><ion-label>Campus</ion-label><ion-note slot="end">${UI.escapeHtml(user.campus || '-')}</ion-note></ion-item>
            <ion-item><ion-label>Department</ion-label><ion-note slot="end">${UI.escapeHtml(user.department || '-')}</ion-note></ion-item>
            <ion-item><ion-label>Phone</ion-label><ion-note slot="end">${UI.escapeHtml(user.phone || '-')}</ion-note></ion-item>
            <ion-item><ion-label>Employee ID</ion-label><ion-note slot="end">${UI.escapeHtml(user.employeeId || '-')}</ion-note></ion-item>
            <ion-item><ion-label>Qualification</ion-label><ion-note slot="end">${UI.escapeHtml(user.qualification || '-')}</ion-note></ion-item>
            <ion-item><ion-label>Alternate Phone</ion-label><ion-note slot="end">${UI.escapeHtml(user.alternatePhone || '-')}</ion-note></ion-item>
            <ion-item><ion-label>Office Room</ion-label><ion-note slot="end">${UI.escapeHtml(user.officeRoom || '-')}</ion-note></ion-item>
          </ion-list>
        </ion-card>`;
    } catch (e) {
      body.innerHTML = `<p class="empty-state">${UI.escapeHtml(e.message)}</p>`;
    }
  },
};
