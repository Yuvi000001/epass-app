// =====================================================================
// E-PASS — Faculty Dashboard (Home / Requests tabs)
// =====================================================================

Pages['faculty-dashboard'] = {
  _activeTab: 'home',
  _requestsFilter: 'Pending',

  render() {
    this._activeTab = 'home';
    return `
      <ion-header><ion-toolbar><ion-title id="fac-dash-title">Faculty Dashboard</ion-title>
        <ion-buttons slot="end"><ion-button id="fac-logout-btn"><ion-icon name="log-out-outline" slot="icon-only"></ion-icon></ion-button></ion-buttons>
      </ion-toolbar></ion-header>
      <ion-content fullscreen><div id="fac-dash-body" class="ion-padding"></div></ion-content>
      <ion-tab-bar id="fac-tabbar">
        <ion-tab-button data-tab="home" class="active"><ion-icon name="home-outline"></ion-icon><ion-label>Home</ion-label></ion-tab-button>
        <ion-tab-button data-tab="requests"><ion-icon name="document-text-outline"></ion-icon><ion-label>Requests</ion-label></ion-tab-button>
      </ion-tab-bar>
    `;
  },

  afterRender() {
    document.getElementById('fac-logout-btn').addEventListener('click', () => {
      Auth.logout();
      Router.reset('login');
    });
    document.querySelectorAll('#fac-tabbar ion-tab-button').forEach((btn) => {
      btn.addEventListener('click', () => this._switchTab(btn.dataset.tab));
    });
    this._switchTab('home');
  },

  _switchTab(tab) {
    this._activeTab = tab;
    document.querySelectorAll('#fac-tabbar ion-tab-button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    document.getElementById('fac-dash-title').textContent = tab === 'home' ? 'Faculty Dashboard' : 'All Requests';
    if (tab === 'home') this._loadHome();
    else this._loadRequests();
  },

  async _loadHome() {
    const body = document.getElementById('fac-dash-body');
    body.innerHTML = `<div class="text-center mt-24"><ion-spinner color="primary"></ion-spinner></div>`;
    try {
      const res = await Api.get('/faculty/requests', { status: 'Pending' });
      const pendingCount = (res.data || []).length;

      body.innerHTML = `
        <ion-card style="background:var(--bgi-primary);border:none;" id="fac-pending-card">
          <div class="ion-padding" style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="color:rgba(255,255,255,0.8);">Pending Requests</div>
              <div style="color:#fff;font-size:32px;font-weight:800;">${pendingCount}</div>
            </div>
            <ion-icon name="document-text-outline" style="font-size:36px;color:#fff;"></ion-icon>
          </div>
        </ion-card>

        <ion-list class="mt-16" id="fac-menu-list" style="background:transparent;">
          <ion-item button id="menu-all"><ion-icon name="list-outline" slot="start" color="primary"></ion-icon><ion-label>All Requests</ion-label></ion-item>
          <ion-item button id="menu-approved"><ion-icon name="checkmark-circle-outline" slot="start" color="primary"></ion-icon><ion-label>Approved Requests</ion-label></ion-item>
          <ion-item button id="menu-rejected"><ion-icon name="close-circle-outline" slot="start" color="primary"></ion-icon><ion-label>Rejected Requests</ion-label></ion-item>
          <ion-item button id="menu-notifications"><ion-icon name="notifications-outline" slot="start" color="primary"></ion-icon><ion-label>Notifications</ion-label></ion-item>
        </ion-list>
      `;
      document.getElementById('fac-pending-card').addEventListener('click', () => this._switchTab('requests'));
      document.getElementById('menu-all').addEventListener('click', () => { this._requestsFilter = 'Pending'; this._switchTab('requests'); });
      document.getElementById('menu-approved').addEventListener('click', () => { this._requestsFilter = 'Approved'; this._switchTab('requests'); });
      document.getElementById('menu-rejected').addEventListener('click', () => { this._requestsFilter = 'Rejected'; this._switchTab('requests'); });
      document.getElementById('menu-notifications').addEventListener('click', () => Router.navigate('notifications'));
    } catch (e) {
      body.innerHTML = `<p class="empty-state">${UI.escapeHtml(e.message)}</p>`;
    }
  },

  async _loadRequests() {
    const body = document.getElementById('fac-dash-body');
    const statuses = ['Pending', 'Approved', 'Rejected'];
    body.innerHTML = `
      <ion-segment value="${this._requestsFilter}" id="fac-segment">
        ${statuses.map((s) => `<ion-segment-button value="${s}"><ion-label>${s}</ion-label></ion-segment-button>`).join('')}
      </ion-segment>
      <div id="fac-requests-list" class="mt-16"></div>
    `;
    document.getElementById('fac-segment').addEventListener('ionChange', (e) => {
      this._requestsFilter = e.detail.value;
      this._renderList();
    });
    await this._renderList();
  },

  async _renderList() {
    const list = document.getElementById('fac-requests-list');
    list.innerHTML = `<div class="text-center mt-24"><ion-spinner color="primary"></ion-spinner></div>`;
    try {
      const res = await Api.get('/faculty/requests', { status: this._requestsFilter });
      const requests = res.data || [];
      if (requests.length === 0) {
        list.innerHTML = `<p class="empty-state">No requests found</p>`;
        return;
      }
      list.innerHTML = requests.map((r) => UI.leaveCardHtml(r, { showStudentName: true, showFacultyActions: true })).join('');
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
      title: approve ? 'Approve & Forward to HOD' : 'Reject Request',
      confirmText: approve ? 'Approve' : 'Reject',
      confirmColor: approve ? 'primary' : 'danger',
    });
    if (!confirmed) return;

    try {
      const path = approve ? `/faculty/requests/${id}/approve` : `/faculty/requests/${id}/reject`;
      await Api.put(path, { remark });
      await UI.toast(approve ? 'Request approved and forwarded to HOD' : 'Request rejected', approve ? 'success' : 'medium');
      this._renderList();
    } catch (e) {
      await UI.toast(e.message || 'Action failed', 'danger');
    }
  },
};
