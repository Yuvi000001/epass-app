// =====================================================================
// E-PASS — Admin Dashboard (Complete Production-Ready)
// Faculty + HOD Add/Edit forms integrated
// =====================================================================

Pages['admin-dashboard'] = {
  _activeTab: 'home',
  _memberRole: 'STUDENT',
  _departmentFilter: '',
  _searchTerm: '',
  _notifCount: 0,
  _currentRole: 'ADMIN',

  render() {
    this._activeTab = 'home';
    return `
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <img src="assets/images/logo.png" alt="Bansal Group of Institutes" style="height:30px;width:auto;margin-left:6px;" />
          </ion-buttons>
          <ion-title id="admin-dash-title" style="font-size:16px;">Dashboard</ion-title>
          <ion-buttons slot="end">
            <ion-button id="admin-notif-btn" style="position:relative;">
              <ion-icon name="notifications-outline" slot="icon-only" style="font-size:20px;"></ion-icon>
              <span id="notif-badge" style="display:none;position:absolute;top:6px;right:6px;background:var(--bgi-danger);color:#fff;border-radius:50%;width:14px;height:14px;font-size:9px;line-height:14px;text-align:center;"></span>
            </ion-button>
            <ion-button id="admin-logout-btn">
              <ion-icon name="log-out-outline" slot="icon-only" style="font-size:20px;"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content fullscreen id="admin-main-content">
        <div id="admin-dash-body" style="padding:12px;padding-bottom:72px;"></div>
      </ion-content>
      <ion-tab-bar id="admin-tabbar" style="--background:var(--bgi-surface);border-top:1px solid var(--bgi-border);">
        <ion-tab-button data-tab="home"><ion-icon name="grid-outline" style="font-size:20px;"></ion-icon><ion-label style="font-size:10px;">Home</ion-label></ion-tab-button>
        <ion-tab-button data-tab="members"><ion-icon name="people-outline" style="font-size:20px;"></ion-icon><ion-label style="font-size:10px;">Members</ion-label></ion-tab-button>
        <ion-tab-button data-tab="passes"><ion-icon name="id-card-outline" style="font-size:20px;"></ion-icon><ion-label style="font-size:10px;">Passes</ion-label></ion-tab-button>
        <ion-tab-button data-tab="reports"><ion-icon name="bar-chart-outline" style="font-size:20px;"></ion-icon><ion-label style="font-size:10px;">Reports</ion-label></ion-tab-button>
        <ion-tab-button data-tab="settings"><ion-icon name="settings-outline" style="font-size:20px;"></ion-icon><ion-label style="font-size:10px;">Settings</ion-label></ion-tab-button>
      </ion-tab-bar>
    `;
  },

  afterRender() {
    document.getElementById('admin-logout-btn').addEventListener('click', () => {
      Auth.logout(); Router.reset('login');
    });
    document.getElementById('admin-notif-btn').addEventListener('click', () => this._loadNotifications());
    document.querySelectorAll('#admin-tabbar ion-tab-button').forEach((btn) => {
      btn.addEventListener('click', () => this._switchTab(btn.dataset.tab));
    });
    this._switchTab('home');
    this._pollNotifications();
  },

  _switchTab(tab) {
    this._activeTab = tab;
    document.querySelectorAll('#admin-tabbar ion-tab-button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    const titles = { home: this._currentRole === 'DIRECTOR' ? 'Director Dashboard' : 'Dashboard', members: 'Members', passes: 'Gate Passes', reports: 'Reports', settings: 'Settings' };
    document.getElementById('admin-dash-title').textContent = titles[tab] || 'Dashboard';
    if (tab === 'home') this._loadHome();
    else if (tab === 'members') this._loadMembersTab();
    else if (tab === 'passes') this._loadPassesTab();
    else if (tab === 'reports') this._loadReportsTab();
    else if (tab === 'settings') this._loadSettingsTab();
  },

  async _pollNotifications() {
    try {
      const res = await Api.get('/notifications', { unread: true, limit: 1 });
      const count = res.unreadCount || 0;
      const badge = document.getElementById('notif-badge');
      if (badge) {
        badge.style.display = count > 0 ? 'block' : 'none';
        badge.textContent = count > 99 ? '99+' : count;
      }
    } catch (_) {}
    setTimeout(() => this._pollNotifications(), 30000);
  },

  // ===================================================================
  // HOME TAB
  // ===================================================================
  async _loadHome() {
    const body = document.getElementById('admin-dash-body');
    body.innerHTML = this._spinner();
    try {
      const [userRes, statsRes, deptRes, trendRes, auditRes, todayRes] = await Promise.all([
        Api.get('/auth/me'),
        Api.get('/admin/stats'),
        Api.get('/admin/charts/department-wise'),
        Api.get('/admin/charts/monthly-trend'),
        Api.get('/admin/audit-logs', { limit: 5 }),
        Api.get('/admin/stats/today'),
      ]);
      const user = userRes.data || userRes;
      this._currentRole = user.role || 'ADMIN';
      const stats = statsRes.data || {};
      const departments = deptRes.data || [];
      const trend = trendRes.data || [];
      const audits = auditRes.data || [];
      const today = todayRes.data || {};
      const roleLabel = this._currentRole === 'DIRECTOR' ? 'Director' : 'Super Admin';
      const titleText = this._currentRole === 'DIRECTOR' ? 'Director Dashboard' : 'Dashboard';
      document.getElementById('admin-dash-title').textContent = titleText;

      body.innerHTML = `
        <!-- Welcome -->
        <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bgi-surface);border-radius:12px;margin-bottom:10px;border:1px solid var(--bgi-border);">
          <div style="width:40px;height:40px;border-radius:50%;background:var(--bgi-bg);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <ion-icon name="shield-checkmark-outline" style="font-size:20px;color:var(--bgi-primary);"></ion-icon>
          </div>
          <div>
            <div style="font-weight:700;font-size:13px;">Hello, ${UI.escapeHtml(user.name || 'Admin')}</div>
            <div style="color:var(--bgi-text-secondary);font-size:11px;">${UI.escapeHtml(user.campus || '')} &bull; ${UI.escapeHtml(roleLabel)}</div>
          </div>
        </div>

        <!-- Stats grid -->
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:8px;">
          ${this._statCard('Students', stats.totalStudents, 'people-outline', 'var(--bgi-primary)')}
          ${this._statCard('Faculty', stats.totalFaculty, 'school-outline', '#6366f1')}
          ${this._statCard('HODs', stats.totalHod, 'ribbon-outline', '#0ea5e9')}
          ${this._statCard('Guards', stats.totalGuards, 'shield-outline', '#f59e0b')}
        </div>

        <!-- Today's activity -->
        <ion-card style="margin:0 0 8px;border-left:3px solid var(--bgi-primary);">
          <div style="padding:10px 12px;">
            <p style="font-weight:700;margin:0 0 8px;font-size:11px;color:var(--bgi-text-secondary);text-transform:uppercase;letter-spacing:.5px;">Today's Activity</p>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;text-align:center;">
              <div><div style="font-size:18px;font-weight:800;color:var(--bgi-primary);">${today.entries ?? 0}</div><div style="font-size:10px;color:var(--bgi-text-secondary);">Entries</div></div>
              <div><div style="font-size:18px;font-weight:800;color:var(--bgi-success);">${today.exits ?? 0}</div><div style="font-size:10px;color:var(--bgi-text-secondary);">Exits</div></div>
              <div><div style="font-size:18px;font-weight:800;color:var(--bgi-warning);">${today.pendingToday ?? 0}</div><div style="font-size:10px;color:var(--bgi-text-secondary);">Pending</div></div>
            </div>
          </div>
        </ion-card>

        <!-- Gate pass summary -->
        <ion-card style="margin:0 0 8px;">
          <div style="padding:10px 12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <p style="font-weight:700;margin:0;font-size:13px;">Gate Pass Summary</p>
              <span class="status-badge status-pending" style="font-size:10px;padding:2px 8px;">${stats.pending ?? 0} Pending</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;text-align:center;">
              <div style="background:var(--bgi-bg);border-radius:8px;padding:8px;">
                <div style="font-size:16px;font-weight:800;">${stats.totalRequests ?? 0}</div>
                <div style="font-size:10px;color:var(--bgi-text-secondary);">Total</div>
              </div>
              <div style="background:rgba(34,197,94,.08);border-radius:8px;padding:8px;">
                <div style="font-size:16px;font-weight:800;color:var(--bgi-success);">${stats.approved ?? 0}</div>
                <div style="font-size:10px;color:var(--bgi-text-secondary);">Approved</div>
              </div>
              <div style="background:rgba(239,68,68,.08);border-radius:8px;padding:8px;">
                <div style="font-size:16px;font-weight:800;color:var(--bgi-danger);">${stats.rejected ?? 0}</div>
                <div style="font-size:10px;color:var(--bgi-text-secondary);">Rejected</div>
              </div>
            </div>
          </div>
        </ion-card>

        <!-- Quick Actions -->
        <p style="font-weight:700;font-size:11px;color:var(--bgi-text-secondary);text-transform:uppercase;letter-spacing:.5px;margin:10px 0 6px;">Quick Actions</p>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px;">
          ${this._quickTile('person-add-outline', 'Add Member', 'tile-add-member', '#6366f1')}
          ${this._quickTile('qr-code-outline', 'QR Scan', 'tile-qr-scan', '#0ea5e9')}
          ${this._quickTile('people-circle-outline', 'Visitors', 'tile-visitors', '#f59e0b')}
          ${this._quickTile('id-card-outline', 'Passes', 'tile-passes', 'var(--bgi-primary)')}
          ${this._quickTile('newspaper-outline', 'Audit Logs', 'tile-audit', '#8b5cf6')}
          ${this._quickTile('bar-chart-outline', 'Reports', 'tile-reports', '#10b981')}
        </div>

        <!-- Department Insights -->
        <ion-card style="margin:0 0 8px;">
          <div style="padding:10px 12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <p style="font-weight:700;margin:0;font-size:13px;">Department Insights</p>
              <ion-button size="small" fill="outline" id="dept-details-btn" style="font-size:11px;height:28px;">Details</ion-button>
            </div>
            ${departments.length ? this._renderDepartmentBars(departments) : '<p class="empty-state" style="padding:0;font-size:12px;">No department data</p>'}
          </div>
        </ion-card>

        <!-- Monthly Trend -->
        <ion-card style="margin:0 0 8px;">
          <div style="padding:10px 12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <p style="font-weight:700;margin:0;font-size:13px;">Monthly Trend</p>
              <span style="font-size:11px;color:var(--bgi-text-secondary);">${trend.length} months</span>
            </div>
            ${trend.length ? this._buildTrendHtml(trend) : '<p class="empty-state" style="padding:0;font-size:12px;">No trend data</p>'}
          </div>
        </ion-card>

        <!-- Recent Activity -->
        <ion-card style="margin:0 0 8px;">
          <div style="padding:10px 12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <p style="font-weight:700;margin:0;font-size:13px;">Recent Activity</p>
              <ion-button size="small" fill="outline" id="audit-details-btn" style="font-size:11px;height:28px;">All Logs</ion-button>
            </div>
            ${audits.length ? audits.map((l) => this._auditRow(l)).join('') : '<p class="empty-state" style="padding:0;font-size:12px;">No recent activity</p>'}
          </div>
        </ion-card>
      `;

      document.getElementById('tile-add-member')?.addEventListener('click', () => this._goToAddMember());
      document.getElementById('tile-qr-scan')?.addEventListener('click', () => this._openQRScanner());
      document.getElementById('tile-visitors')?.addEventListener('click', () => this._loadVisitors());
      document.getElementById('tile-passes')?.addEventListener('click', () => this._switchTab('passes'));
      document.getElementById('tile-audit')?.addEventListener('click', () => this._showAuditLogs());
      document.getElementById('tile-reports')?.addEventListener('click', () => this._switchTab('reports'));
      document.getElementById('dept-details-btn')?.addEventListener('click', () => this._showDepartmentReport(departments));
      document.getElementById('audit-details-btn')?.addEventListener('click', () => this._showAuditLogs());
    } catch (e) {
      body.innerHTML = `<p class="empty-state" style="font-size:12px;">${UI.escapeHtml(e.message)}</p>`;
    }
  },

  _statCard(label, value, icon, color) {
    return `
      <ion-card style="margin:0;padding:10px;text-align:center;">
        <ion-icon name="${icon}" style="font-size:20px;color:${color};margin-bottom:3px;display:block;"></ion-icon>
        <div style="font-size:18px;font-weight:800;color:${color};">${value ?? 0}</div>
        <div style="font-size:10px;color:var(--bgi-text-secondary);">${label}</div>
      </ion-card>`;
  },

  _quickTile(icon, label, id, color) {
    return `
      <ion-card id="${id}" style="margin:0;padding:10px;text-align:center;cursor:pointer;">
        <ion-icon name="${icon}" style="font-size:22px;color:${color};margin-bottom:4px;display:block;"></ion-icon>
        <div style="font-size:10px;font-weight:600;">${label}</div>
      </ion-card>`;
  },

  _renderDepartmentBars(departments = []) {
    const maxCount = Math.max(...departments.map((i) => i.total), 1);
    return departments.slice(0, 6).map((item) => `
      <div style="margin-bottom:6px;">
        <div style="font-size:11px;margin-bottom:2px;">${UI.escapeHtml(item.department || 'Unknown')}</div>
        <div style="display:flex;align-items:center;gap:6px;">
          <div style="flex:1;height:6px;background:var(--bgi-border);border-radius:3px;">
            <div style="width:${Math.round((item.total / maxCount) * 100)}%;height:100%;background:var(--bgi-primary);border-radius:3px;"></div>
          </div>
          <div style="font-size:11px;font-weight:700;min-width:20px;">${item.total}</div>
        </div>
      </div>`).join('');
  },

  _buildTrendHtml(trend = []) {
    const maxCount = Math.max(...trend.map((i) => i.total), 1);
    return `<div style="display:flex;align-items:flex-end;gap:4px;height:60px;padding-bottom:14px;">
      ${trend.map((item) => `
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;height:100%;">
          <div style="flex:1;display:flex;align-items:flex-end;">
            <div style="width:100%;height:${Math.max(6, Math.round((item.total / maxCount) * 45))}px;background:var(--bgi-primary);border-radius:3px 3px 0 0;opacity:.85;"></div>
          </div>
          <div style="font-size:8px;color:var(--bgi-text-secondary);white-space:nowrap;">${UI.escapeHtml(item.month)}</div>
        </div>`).join('')}
    </div>`;
  },

  _auditRow(log) {
    return `
      <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid var(--bgi-border);">
        <ion-icon name="time-outline" style="font-size:14px;color:var(--bgi-primary);margin-top:2px;flex-shrink:0;"></ion-icon>
        <div>
          <div style="font-weight:600;font-size:12px;">${UI.escapeHtml(log.user?.name || 'System')}</div>
          <div style="font-size:11px;color:var(--bgi-text-secondary);">${UI.escapeHtml(log.action?.replace(/_/g, ' ') || '')} &bull; ${UI.formatDate(log.createdAt)}</div>
        </div>
      </div>`;
  },

  // ===================================================================
  // MEMBERS TAB
  // ===================================================================
  _loadMembersTab() {
    const body = document.getElementById('admin-dash-body');
    const showDirectorTile = this._currentRole !== 'DIRECTOR';
    body.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        ${this._memberMenuTile('people-outline', 'Students', 'STUDENT', '#6366f1')}
        ${this._memberMenuTile('school-outline', 'Faculty', 'FACULTY', '#0ea5e9')}
        ${this._memberMenuTile('ribbon-outline', 'HODs', 'HOD', '#f59e0b')}
        ${this._memberMenuTile('shield-outline', 'Guards', 'GUARD', '#10b981')}
        ${showDirectorTile ? this._memberMenuTile('person-circle-outline', 'Directors', 'DIRECTOR', '#ec4899') : ''}
      </div>
    `;
    body.querySelectorAll('.member-menu-tile').forEach((tile) => {
      tile.addEventListener('click', () => this._loadMemberList(tile.dataset.role));
    });
  },

  _memberMenuTile(icon, label, role, color) {
    return `
      <ion-card class="member-menu-tile" data-role="${role}" style="margin:0;padding:14px;text-align:center;cursor:pointer;">
        <ion-icon name="${icon}" style="font-size:26px;color:${color};margin-bottom:6px;display:block;"></ion-icon>
        <div style="font-weight:700;font-size:12px;">${label}</div>
        <div style="font-size:10px;color:var(--bgi-text-secondary);margin-top:2px;">Manage ${label}</div>
      </ion-card>`;
  },

  async _loadMemberList(role) {
    this._memberRole = role;
    this._collegeFilter = '';
    const body = document.getElementById('admin-dash-body');
    const roleLabels = { STUDENT: 'Students', FACULTY: 'Faculty', HOD: 'HODs', GUARD: 'Guards', DIRECTOR: 'Directors' };
    body.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <ion-button fill="clear" size="small" id="back-to-members-btn"><ion-icon name="arrow-back-outline" slot="icon-only" style="font-size:18px;"></ion-icon></ion-button>
        <h2 style="margin:0;font-size:15px;font-weight:700;">${roleLabels[role]}</h2>
        ${role !== 'HOD' ? `
        <ion-button size="small" id="add-member-top-btn" style="margin-left:auto;font-size:12px;">
          <ion-icon name="add" slot="start" style="font-size:14px;"></ion-icon>Add
        </ion-button>` : ''}
      </div>

      ${role === 'HOD' ? `
      <ion-card id="hod-pending-banner" style="margin:0 0 10px;border-left:3px solid var(--bgi-warning);cursor:pointer;">
        <div style="padding:10px 12px;display:flex;align-items:center;gap:8px;">
          <ion-icon name="time-outline" style="font-size:18px;color:var(--bgi-warning);flex-shrink:0;"></ion-icon>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:13px;">Pending HOD Signups</div>
            <div id="hod-pending-count" style="font-size:11px;color:var(--bgi-text-secondary);">Checking...</div>
          </div>
          <ion-icon name="chevron-forward-outline" style="font-size:16px;color:var(--bgi-text-secondary);"></ion-icon>
        </div>
      </ion-card>` : ''}

      ${role === 'DIRECTOR' ? `
      <ion-card id="director-pending-banner" style="margin:0 0 10px;border-left:3px solid var(--bgi-warning);cursor:pointer;">
        <div style="padding:10px 12px;display:flex;align-items:center;gap:8px;">
          <ion-icon name="time-outline" style="font-size:18px;color:var(--bgi-warning);flex-shrink:0;"></ion-icon>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:13px;">Pending Director Signups</div>
            <div id="director-pending-count" style="font-size:11px;color:var(--bgi-text-secondary);">Checking...</div>
          </div>
          <ion-icon name="chevron-forward-outline" style="font-size:16px;color:var(--bgi-text-secondary);"></ion-icon>
        </div>
      </ion-card>` : ''}

      ${role === 'FACULTY' ? `
      <ion-card id="faculty-pending-banner" style="margin:0 0 10px;border-left:3px solid var(--bgi-warning);cursor:pointer;">
        <div style="padding:10px 12px;display:flex;align-items:center;gap:8px;">
          <ion-icon name="time-outline" style="font-size:18px;color:var(--bgi-warning);flex-shrink:0;"></ion-icon>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:13px;">Pending Faculty Approvals</div>
            <div id="faculty-pending-count" style="font-size:11px;color:var(--bgi-text-secondary);">Checking...</div>
          </div>
          <ion-icon name="chevron-forward-outline" style="font-size:16px;color:var(--bgi-text-secondary);"></ion-icon>
        </div>
      </ion-card>` : ''}

      ${role === 'GUARD' ? `
      <ion-card id="guard-pending-banner" style="margin:0 0 10px;border-left:3px solid var(--bgi-warning);cursor:pointer;">
        <div style="padding:10px 12px;display:flex;align-items:center;gap:8px;">
          <ion-icon name="time-outline" style="font-size:18px;color:var(--bgi-warning);flex-shrink:0;"></ion-icon>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:13px;">Pending Guard Approvals</div>
            <div id="guard-pending-count" style="font-size:11px;color:var(--bgi-text-secondary);">Checking...</div>
          </div>
          <ion-icon name="chevron-forward-outline" style="font-size:16px;color:var(--bgi-text-secondary);"></ion-icon>
        </div>
      </ion-card>` : ''}

      <!-- College Filter (for all roles) -->
      <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;--min-height:38px;">
        <ion-icon name="business-outline" slot="start" color="medium" style="font-size:16px;"></ion-icon>
        <ion-select id="college-filter-select" interface="action-sheet" placeholder="All Colleges" style="font-size:13px;">
          <ion-select-option value="">All Colleges</ion-select-option>
          <ion-select-option value="BIST">Bansal Institute of Science & Technology - BIST</ion-select-option>
          <ion-select-option value="BIRT">Bansal Institute of Research & Technology - BIRT</ion-select-option>
          <ion-select-option value="BIRTS">Bansal Institute of Research Technology & Science - BIRTS</ion-select-option>
        </ion-select>
      </ion-item>

      <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;--min-height:38px;">
        <ion-icon name="search-outline" slot="start" color="medium" style="font-size:16px;"></ion-icon>
        <ion-input id="member-search-input" placeholder="Search name, email..." style="font-size:13px;"></ion-input>
      </ion-item>

      ${role === 'STUDENT' || role === 'FACULTY' || role === 'HOD' || role === 'DIRECTOR' ? `
      <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:10px;--min-height:38px;">
        <ion-icon name="layers-outline" slot="start" color="medium" style="font-size:16px;"></ion-icon>
        <ion-select id="department-filter-select" interface="action-sheet" placeholder="All Departments" style="font-size:13px;">
          <ion-select-option value="">All Departments</ion-select-option>
        </ion-select>
      </ion-item>` : ''}

      <div id="members-list">${this._spinner()}</div>

      ${role !== 'HOD' ? `
      <ion-fab vertical="bottom" horizontal="end" slot="fixed" style="margin-bottom:10px;">
        <ion-fab-button id="fab-add-member" style="width:48px;height:48px;"><ion-icon name="add" style="font-size:20px;"></ion-icon></ion-fab-button>
      </ion-fab>` : ''}
    `;

    document.getElementById('back-to-members-btn').addEventListener('click', () => this._loadMembersTab());
    document.getElementById('add-member-top-btn')?.addEventListener('click', () => this._goToAddMember(role));
    document.getElementById('fab-add-member')?.addEventListener('click', () => this._goToAddMember(role));
    document.getElementById('hod-pending-banner')?.addEventListener('click', () => this._showPendingHodApprovals());
    document.getElementById('director-pending-banner')?.addEventListener('click', () => this._showPendingDirectorApprovals());
    document.getElementById('faculty-pending-banner')?.addEventListener('click', () => this._showPendingFacultyApprovals());
    document.getElementById('guard-pending-banner')?.addEventListener('click', () => this._showPendingGuardApprovals());
    if (role === 'HOD') this._refreshHodPendingCount();
    if (role === 'DIRECTOR') this._refreshDirectorPendingCount();
    if (role === 'FACULTY') this._refreshFacultyPendingCount();
    if (role === 'GUARD') this._refreshGuardPendingCount();

    // College filter
    const collegeSel = document.getElementById('college-filter-select');
    if (collegeSel) {
      collegeSel.addEventListener('ionChange', (e) => { this._collegeFilter = e.detail.value; this._renderMembersList(); });
    }

    let debounce;
    document.getElementById('member-search-input').addEventListener('ionInput', (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => { this._searchTerm = e.detail.value; this._renderMembersList(); }, 350);
    });

    const deptSel = document.getElementById('department-filter-select');
    if (deptSel) {
      deptSel.addEventListener('ionChange', (e) => { this._departmentFilter = e.detail.value; this._renderMembersList(); });
      this._loadDepartmentOptions();
    }

    this._searchTerm = '';
    this._departmentFilter = '';
    await this._renderMembersList();
  },

  async _loadDepartmentOptions() {
    try {
      const res = await Api.get('/admin/departments');
      const select = document.getElementById('department-filter-select');
      if (!select) return;
      (res.data || []).forEach((dept) => {
        const opt = document.createElement('ion-select-option');
        opt.value = dept; opt.textContent = dept;
        select.appendChild(opt);
      });
    } catch (_) {}
  },

  // ===================================================================
  // HOD SELF-SIGNUP — PENDING APPROVALS
  // HOD ab khud register karta hai (OTP-verified) lekin tab tak login nahi
  // kar sakta jab tak Admin approve na kare. Yeh banner + list us queue ko
  // dikhata hai. Reject karne par account permanently delete ho jaata hai
  // (backend: PUT /admin/hod/:id/reject) — HOD dobara naya signup karega.
  // ===================================================================
  async _refreshHodPendingCount() {
    const el = document.getElementById('hod-pending-count');
    if (!el) return;
    try {
      const res = await Api.get('/admin/hod/pending');
      const list = res.data || [];
      el.textContent = list.length
        ? `${list.length} request${list.length > 1 ? 's' : ''} awaiting approval`
        : 'No pending requests';
    } catch (e) {
      el.textContent = 'Unable to load';
    }
  },

  async _showPendingHodApprovals() {
    const modal = document.createElement('ion-modal');
    const self = this; // Store reference to 'this'
    modal.innerHTML = `
      <ion-header><ion-toolbar>
        <ion-title style="font-size:15px;">Pending HOD Signups</ion-title>
        <ion-buttons slot="end"><ion-button id="hodp-modal-close" style="font-size:13px;">Close</ion-button></ion-buttons>
      </ion-toolbar></ion-header>
      <ion-content class="ion-padding"><div id="hodp-list">${this._spinner()}</div></ion-content>
    `;
    document.body.appendChild(modal);
    await modal.present();
    modal.querySelector('#hodp-modal-close').addEventListener('click', () => modal.dismiss());

    const loadList = async () => {
      const list = modal.querySelector('#hodp-list');
      list.innerHTML = self._spinner();
      try {
        const res = await Api.get('/admin/hod/pending');
        if (!res || typeof res !== 'object') {
          list.innerHTML = '<p class="empty-state" style="font-size:12px;">Invalid server response</p>';
          return;
        }
        const items = res.data || [];
        if (!Array.isArray(items)) {
          list.innerHTML = '<p class="empty-state" style="font-size:12px;">Invalid data format</p>';
          return;
        }
        if (!items.length) { list.innerHTML = '<p class="empty-state" style="font-size:12px;">No pending HOD requests</p>'; return; }
        list.innerHTML = items.map((h) => self._hodPendingCardHtml(h)).join('');
        list.querySelectorAll('.hodp-approve-btn').forEach((btn) => btn.addEventListener('click', () => decide(btn.dataset.id, true)));
        list.querySelectorAll('.hodp-reject-btn').forEach((btn) => btn.addEventListener('click', () => decide(btn.dataset.id, false)));
      } catch (e) {
        list.innerHTML = `<p class="empty-state" style="font-size:12px;">${UI.escapeHtml(e.message)}</p>`;
      }
    };

    const decide = async (id, approve) => {
      if (approve) {
        try {
          await Api.put(`/admin/hod/${id}/approve`, {});
          UI.toast('HOD approved — they can now log in', 'success');
          await loadList();
          self._refreshHodPendingCount();
        } catch (e) { UI.toast(e.message || 'Failed', 'danger'); }
        return;
      }
      const { confirmed, remark } = await UI.confirmWithRemark({
        title: 'Reject HOD Request?',
        placeholder: 'Reason for rejection (optional)',
        confirmText: 'Reject & Delete',
        confirmColor: 'danger',
      });
      if (!confirmed) return;
      try {
        await Api.put(`/admin/hod/${id}/reject`, { remark });
        UI.toast('HOD request rejected and removed');
        await loadList();
        self._refreshHodPendingCount();
      } catch (e) { UI.toast(e.message || 'Failed', 'danger'); }
    };

    loadList();
  },

  _hodPendingCardHtml(h) {
    if (!h || typeof h !== 'object') return '';
    const id = h._id || h.id || '';
    const name = h.name ? UI.escapeHtml(String(h.name)) : '(No name)';
    const email = h.email ? UI.escapeHtml(String(h.email)) : '(No email)';
    const empId = h.employeeId ? UI.escapeHtml(String(h.employeeId)) : '-';
    const dept = h.department ? UI.escapeHtml(String(h.department)) : '-';
    const phone = h.phone ? UI.escapeHtml(String(h.phone)) : '-';
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
          <div style="font-size:11px;color:var(--bgi-text-secondary);"><b>Phone:</b> ${phone}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">
            <ion-button expand="block" size="small" color="success" class="hodp-approve-btn" data-id="${id}" style="font-size:12px;"><ion-icon name="checkmark-outline" slot="start"></ion-icon>Approve</ion-button>
            <ion-button expand="block" size="small" color="danger" class="hodp-reject-btn" data-id="${id}" style="font-size:12px;"><ion-icon name="close-outline" slot="start"></ion-icon>Reject</ion-button>
          </div>
        </div>
      </ion-card>`;
  },

  // ===================================================================
  // DIRECTOR SELF-SIGNUP — PENDING APPROVALS
  // ===================================================================
  async _refreshDirectorPendingCount() {
    const el = document.getElementById('director-pending-count');
    if (!el) return;
    try {
      const res = await Api.get('/admin/directors/pending');
      const list = res.data || [];
      el.textContent = list.length
        ? `${list.length} request${list.length > 1 ? 's' : ''} awaiting approval`
        : 'No pending requests';
    } catch (e) {
      el.textContent = 'Unable to load';
    }
  },

  async _showPendingDirectorApprovals() {
    const modal = document.createElement('ion-modal');
    const self = this; // Store reference to 'this'
    modal.innerHTML = `
      <ion-header><ion-toolbar>
        <ion-title style="font-size:15px;">Pending Director Signups</ion-title>
        <ion-buttons slot="end"><ion-button id="dirp-modal-close" style="font-size:13px;">Close</ion-button></ion-buttons>
      </ion-toolbar></ion-header>
      <ion-content class="ion-padding"><div id="dirp-list">${this._spinner()}</div></ion-content>
    `;
    document.body.appendChild(modal);
    await modal.present();
    modal.querySelector('#dirp-modal-close').addEventListener('click', () => modal.dismiss());

    const loadList = async () => {
      const list = modal.querySelector('#dirp-list');
      list.innerHTML = self._spinner();
      try {
        const res = await Api.get('/admin/directors/pending');
        if (!res || typeof res !== 'object') {
          list.innerHTML = '<p class="empty-state" style="font-size:12px;">Invalid server response</p>';
          return;
        }
        const items = res.data || [];
        if (!Array.isArray(items)) {
          list.innerHTML = '<p class="empty-state" style="font-size:12px;">Invalid data format</p>';
          return;
        }
        if (!items.length) { list.innerHTML = '<p class="empty-state" style="font-size:12px;">No pending Director requests</p>'; return; }
        list.innerHTML = items.map((d) => self._directorPendingCardHtml(d)).join('');
        list.querySelectorAll('.dirp-approve-btn').forEach((btn) => btn.addEventListener('click', () => decide(btn.dataset.id, true)));
        list.querySelectorAll('.dirp-reject-btn').forEach((btn) => btn.addEventListener('click', () => decide(btn.dataset.id, false)));
      } catch (e) {
        list.innerHTML = `<p class="empty-state" style="font-size:12px;">${UI.escapeHtml(e.message)}</p>`;
      }
    };

    const decide = async (id, approve) => {
      if (approve) {
        try {
          await Api.put(`/admin/directors/${id}/approve`, {});
          UI.toast('Director approved — they can now log in', 'success');
          await loadList();
          self._refreshDirectorPendingCount();
        } catch (e) { UI.toast(e.message || 'Failed', 'danger'); }
        return;
      }
      const { confirmed, remark } = await UI.confirmWithRemark({
        title: 'Reject Director Request?',
        placeholder: 'Reason for rejection (optional)',
        confirmText: 'Reject & Delete',
        confirmColor: 'danger',
      });
      if (!confirmed) return;
      try {
        await Api.put(`/admin/directors/${id}/reject`, { remark });
        UI.toast('Director request rejected and removed');
        await loadList();
        self._refreshDirectorPendingCount();
      } catch (e) { UI.toast(e.message || 'Failed', 'danger'); }
    };

    loadList();
  },

  _directorPendingCardHtml(d) {
    if (!d || typeof d !== 'object') return '';
    const id = d._id || d.id || '';
    const name = d.name ? UI.escapeHtml(String(d.name)) : '(No name)';
    const email = d.email ? UI.escapeHtml(String(d.email)) : '(No email)';
    const empId = d.employeeId ? UI.escapeHtml(String(d.employeeId)) : '-';
    const campus = d.campus ? UI.escapeHtml(String(d.campus)) : '-';
    const phone = d.phone ? UI.escapeHtml(String(d.phone)) : '-';
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
          <div style="font-size:11px;color:var(--bgi-text-secondary);"><b>Emp ID:</b> ${empId} &bull; <b>Campus:</b> ${campus}</div>
          <div style="font-size:11px;color:var(--bgi-text-secondary);"><b>Phone:</b> ${phone}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">
            <ion-button expand="block" size="small" color="success" class="dirp-approve-btn" data-id="${id}" style="font-size:12px;"><ion-icon name="checkmark-outline" slot="start"></ion-icon>Approve</ion-button>
            <ion-button expand="block" size="small" color="danger" class="dirp-reject-btn" data-id="${id}" style="font-size:12px;"><ion-icon name="close-outline" slot="start"></ion-icon>Reject</ion-button>
          </div>
        </div>
      </ion-card>`;
  },

  async _refreshFacultyPendingCount() {
    const el = document.getElementById('faculty-pending-count');
    if (!el) return;
    try {
      const res = await Api.get('/admin/faculty/pending');
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
        <ion-buttons slot="end"><ion-button id="facp-modal-close" style="font-size:13px;">Close</ion-button></ion-buttons>
      </ion-toolbar></ion-header>
      <ion-content class="ion-padding"><div id="facp-list">${this._spinner()}</div></ion-content>
    `;
    document.body.appendChild(modal);
    await modal.present();
    modal.querySelector('#facp-modal-close').addEventListener('click', () => modal.dismiss());

    const loadList = async () => {
      const list = modal.querySelector('#facp-list');
      list.innerHTML = self._spinner();
      try {
        const res = await Api.get('/admin/faculty/pending');
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
        list.innerHTML = items.map((f) => self._facultyPendingCardHtml(f)).join('');
        list.querySelectorAll('.facp-approve-btn').forEach((btn) => btn.addEventListener('click', () => decide(btn.dataset.id, true)));
        list.querySelectorAll('.facp-reject-btn').forEach((btn) => btn.addEventListener('click', () => decide(btn.dataset.id, false)));
      } catch (e) {
        list.innerHTML = `<p class="empty-state" style="font-size:12px;">${UI.escapeHtml(e.message)}</p>`;
      }
    };

    const decide = async (id, approve) => {
      if (approve) {
        try {
          await Api.put(`/admin/faculty/${id}/approve`, {});
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
        await Api.put(`/admin/faculty/${id}/reject`, { remark });
        UI.toast('Faculty request rejected and removed');
        await loadList();
        self._refreshFacultyPendingCount();
      } catch (e) { UI.toast(e.message || 'Failed', 'danger'); }
    };

    loadList();
  },

  _facultyPendingCardHtml(f) {
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
            <ion-button expand="block" size="small" color="success" class="facp-approve-btn" data-id="${id}" style="font-size:12px;"><ion-icon name="checkmark-outline" slot="start"></ion-icon>Approve</ion-button>
            <ion-button expand="block" size="small" color="danger" class="facp-reject-btn" data-id="${id}" style="font-size:12px;"><ion-icon name="close-outline" slot="start"></ion-icon>Reject</ion-button>
          </div>
        </div>
      </ion-card>`;
  },

  async _refreshGuardPendingCount() {
    const el = document.getElementById('guard-pending-count');
    if (!el) return;
    try {
      const res = await Api.get('/admin/guards/pending');
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
        <ion-buttons slot="end"><ion-button id="guardp-modal-close" style="font-size:13px;">Close</ion-button></ion-buttons>
      </ion-toolbar></ion-header>
      <ion-content class="ion-padding"><div id="guardp-list">${this._spinner()}</div></ion-content>
    `;
    document.body.appendChild(modal);
    await modal.present();
    modal.querySelector('#guardp-modal-close').addEventListener('click', () => modal.dismiss());

    const loadList = async () => {
      const list = modal.querySelector('#guardp-list');
      list.innerHTML = self._spinner();
      try {
        const res = await Api.get('/admin/guards/pending');
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
        list.innerHTML = items.map((g) => self._guardPendingCardHtml(g)).join('');
        list.querySelectorAll('.guardp-approve-btn').forEach((btn) => btn.addEventListener('click', () => decide(btn.dataset.id, true)));
        list.querySelectorAll('.guardp-reject-btn').forEach((btn) => btn.addEventListener('click', () => decide(btn.dataset.id, false)));
      } catch (e) {
        list.innerHTML = `<p class="empty-state" style="font-size:12px;">${UI.escapeHtml(e.message)}</p>`;
      }
    };

    const decide = async (id, approve) => {
      if (approve) {
        try {
          await Api.put(`/admin/guards/${id}/approve`, {});
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
        await Api.put(`/admin/guards/${id}/reject`, { remark });
        UI.toast('Guard request rejected and removed');
        await loadList();
        self._refreshGuardPendingCount();
      } catch (e) { UI.toast(e.message || 'Failed', 'danger'); }
    };

    loadList();
  },

  _guardPendingCardHtml(g) {
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
            <ion-button expand="block" size="small" color="success" class="guardp-approve-btn" data-id="${id}" style="font-size:12px;"><ion-icon name="checkmark-outline" slot="start"></ion-icon>Approve</ion-button>
            <ion-button expand="block" size="small" color="danger" class="guardp-reject-btn" data-id="${id}" style="font-size:12px;"><ion-icon name="close-outline" slot="start"></ion-icon>Reject</ion-button>
          </div>
        </div>
      </ion-card>`;
  },

  async _renderMembersList() {
    const list = document.getElementById('members-list');
    if (!list) return;
    list.innerHTML = this._spinner();
    const endpointByRole = { STUDENT: '/admin/students', FACULTY: '/admin/faculty', HOD: '/admin/hod', GUARD: '/admin/guards', DIRECTOR: '/admin/directors' };
    try {
      const res = await Api.get(endpointByRole[this._memberRole], {
        department: this._departmentFilter || undefined,
        campus: this._collegeFilter || undefined,
        search: this._searchTerm || undefined,
      });
      const members = res.data || [];
      if (!members.length) { list.innerHTML = `<p class="empty-state" style="font-size:12px;">No ${this._memberRole.toLowerCase()}s found</p>`; return; }
      list.innerHTML = members.map((m) => this._memberCardHtml(m)).join('');
      list.querySelectorAll('.member-card').forEach((card) => {
        card.addEventListener('click', () => this._showMemberDetail(card.dataset.id, this._memberRole));
      });
      list.querySelectorAll('.member-delete-btn').forEach((btn) => {
        btn.addEventListener('click', async (event) => {
          event.stopPropagation();
          const id = btn.dataset.id;
          const { confirmed } = await UI.confirmWithRemark({ title: 'Delete this member?', confirmText: 'Delete', confirmColor: 'danger' });
          if (!confirmed) return;
          try {
            await Api.delete(`/admin/members/${id}`);
            UI.toast('Member deleted');
            this._renderMembersList();
          } catch (err) {
            UI.toast(err.message || 'Failed to delete member', 'danger');
          }
        });
      });
    } catch (e) {
      list.innerHTML = `<p class="empty-state" style="font-size:12px;">${UI.escapeHtml(e.message)}</p>`;
    }
  },

  _memberCardHtml(m) {
    const subMap = {
      STUDENT: `Roll: ${UI.escapeHtml(m.rollNumber || '-')} &bull; ${UI.escapeHtml(m.branch || '-')} Sem ${m.semester || '-'}`,
      FACULTY: UI.escapeHtml(m.designation || 'Faculty'),
      HOD: 'Head of Department',
      GUARD: `Gate: ${UI.escapeHtml(m.assignedGate || '-')}`,
      DIRECTOR: 'Director',
    };
    const photoHtml = m.photo
      ? `<img src="${UI.escapeHtml(m.photo)}" style="width:38px;height:38px;border-radius:50%;object-fit:cover;flex-shrink:0;" />`
      : `<div style="width:38px;height:38px;border-radius:50%;background:var(--bgi-bg);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><ion-icon name="person" style="font-size:18px;color:var(--bgi-primary);"></ion-icon></div>`;

    return `
      <ion-card class="member-card" data-id="${m._id}" style="cursor:pointer;margin-bottom:6px;">
        <div style="padding:10px 12px;display:flex;gap:10px;align-items:center;">
          ${photoHtml}
          <div style="flex:1;min-width:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
              <span style="font-weight:700;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${UI.escapeHtml(m.name)}</span>
              <div style="display:flex;align-items:center;gap:6px;">
                <span class="status-badge ${m.isActive ? 'status-approved' : 'status-rejected'}" style="font-size:9px;padding:2px 6px;flex-shrink:0;">${m.isActive ? 'Active' : 'Inactive'}</span>
                <ion-button fill="clear" size="small" class="member-delete-btn" data-id="${m._id}" style="font-size:12px;color:var(--bgi-danger);min-width:0;width:28px;height:28px;line-height:0;">
                  <ion-icon name="trash-outline" slot="icon-only" style="font-size:16px;"></ion-icon>
                </ion-button>
              </div>
            </div>
            <div style="font-size:11px;color:var(--bgi-text-secondary);margin:1px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${UI.escapeHtml(m.email)}</div>
            <div style="font-size:11px;color:var(--bgi-text-secondary);">${subMap[m.role] || ''}</div>
            ${m.department ? `<div style="font-size:10px;color:var(--bgi-text-secondary);"><b>Dept:</b> ${UI.escapeHtml(m.department)}</div>` : ''}
          </div>
        </div>
      </ion-card>`;
  },

  async _showMemberDetail(id, role) {
    let member;
    try {
      const res = await Api.get(`/admin/members/${id}`);
      member = res.data;
    } catch (e) { return UI.toast(e.message || 'Failed to load', 'danger'); }

    const extraMap = {
      STUDENT: `
        <ion-item><ion-label style="font-size:13px;">Enrollment No</ion-label><ion-note slot="end" style="font-size:12px;">${UI.escapeHtml(member.enrollmentNumber || '-')}</ion-note></ion-item>
        <ion-item><ion-label style="font-size:13px;">Roll Number</ion-label><ion-note slot="end" style="font-size:12px;">${UI.escapeHtml(member.rollNumber || '-')}</ion-note></ion-item>
        <ion-item><ion-label style="font-size:13px;">Branch</ion-label><ion-note slot="end" style="font-size:12px;">${UI.escapeHtml(member.branch || '-')}</ion-note></ion-item>
        <ion-item><ion-label style="font-size:13px;">Semester</ion-label><ion-note slot="end" style="font-size:12px;">${member.semester || '-'}</ion-note></ion-item>
        <ion-item><ion-label style="font-size:13px;">Section</ion-label><ion-note slot="end" style="font-size:12px;">${UI.escapeHtml(member.section || '-')}</ion-note></ion-item>
        <ion-item><ion-label style="font-size:13px;">Parent Name</ion-label><ion-note slot="end" style="font-size:12px;">${UI.escapeHtml(member.parentName || '-')}</ion-note></ion-item>
        <ion-item><ion-label style="font-size:13px;">Parent Mobile</ion-label><ion-note slot="end" style="font-size:12px;">${UI.escapeHtml(member.parentPhone || '-')}</ion-note></ion-item>`,
      FACULTY: `
        <ion-item><ion-label style="font-size:13px;">Employee ID</ion-label><ion-note slot="end" style="font-size:12px;">${UI.escapeHtml(member.employeeId || '-')}</ion-note></ion-item>
        <ion-item><ion-label style="font-size:13px;">Designation</ion-label><ion-note slot="end" style="font-size:12px;">${UI.escapeHtml(member.designation || '-')}</ion-note></ion-item>
        <ion-item><ion-label style="font-size:13px;">Qualification</ion-label><ion-note slot="end" style="font-size:12px;">${UI.escapeHtml(member.qualification || '-')}</ion-note></ion-item>
        <ion-item><ion-label style="font-size:13px;">Experience</ion-label><ion-note slot="end" style="font-size:12px;">${member.experience ? member.experience + ' yrs' : '-'}</ion-note></ion-item>
        <ion-item><ion-label style="font-size:13px;">Joining Date</ion-label><ion-note slot="end" style="font-size:12px;">${member.joiningDate ? UI.formatDate(member.joiningDate) : '-'}</ion-note></ion-item>
        <ion-item><ion-label style="font-size:13px;">Campus</ion-label><ion-note slot="end" style="font-size:12px;">${UI.escapeHtml(member.campus || '-')}</ion-note></ion-item>`,
      HOD: `
        <ion-item><ion-label style="font-size:13px;">Employee ID</ion-label><ion-note slot="end" style="font-size:12px;">${UI.escapeHtml(member.employeeId || '-')}</ion-note></ion-item>
        <ion-item><ion-label style="font-size:13px;">Qualification</ion-label><ion-note slot="end" style="font-size:12px;">${UI.escapeHtml(member.qualification || '-')}</ion-note></ion-item>
        <ion-item><ion-label style="font-size:13px;">Experience</ion-label><ion-note slot="end" style="font-size:12px;">${member.experience ? member.experience + ' yrs' : '-'}</ion-note></ion-item>
        <ion-item><ion-label style="font-size:13px;">Joining Date</ion-label><ion-note slot="end" style="font-size:12px;">${member.joiningDate ? UI.formatDate(member.joiningDate) : '-'}</ion-note></ion-item>
        <ion-item><ion-label style="font-size:13px;">Campus</ion-label><ion-note slot="end" style="font-size:12px;">${UI.escapeHtml(member.campus || '-')}</ion-note></ion-item>
        <ion-item><ion-label style="font-size:13px;">Alt. Contact</ion-label><ion-note slot="end" style="font-size:12px;">${UI.escapeHtml(member.alternatePhone || '-')}</ion-note></ion-item>
        <ion-item><ion-label style="font-size:13px;">Office Room</ion-label><ion-note slot="end" style="font-size:12px;">${UI.escapeHtml(member.officeRoom || '-')}</ion-note></ion-item>`,
      GUARD: `<ion-item><ion-label style="font-size:13px;">Assigned Gate</ion-label><ion-note slot="end" style="font-size:12px;">${UI.escapeHtml(member.assignedGate || '-')}</ion-note></ion-item>`,
      ADMIN: '',
    };

    const modal = document.createElement('ion-modal');
    modal.innerHTML = `
      <ion-header><ion-toolbar>
        <ion-title style="font-size:15px;">${UI.escapeHtml(member.name)}</ion-title>
        <ion-buttons slot="end"><ion-button id="member-modal-close" style="font-size:13px;">Close</ion-button></ion-buttons>
      </ion-toolbar></ion-header>
      <ion-content class="ion-padding">
        ${member.photo ? `<div style="text-align:center;margin-bottom:12px;"><img src="${UI.escapeHtml(member.photo)}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;" /></div>` : ''}
        <ion-list lines="inset">
          <ion-item><ion-label style="font-size:13px;">Email</ion-label><ion-note slot="end" style="font-size:12px;">${UI.escapeHtml(member.email)}</ion-note></ion-item>
          <ion-item><ion-label style="font-size:13px;">Role</ion-label><ion-note slot="end" style="font-size:12px;">${UI.escapeHtml(member.role)}</ion-note></ion-item>
          <ion-item><ion-label style="font-size:13px;">Department</ion-label><ion-note slot="end" style="font-size:12px;">${UI.escapeHtml(member.department || '-')}</ion-note></ion-item>
          <ion-item><ion-label style="font-size:13px;">Phone</ion-label><ion-note slot="end" style="font-size:12px;">${UI.escapeHtml(member.phone || '-')}</ion-note></ion-item>
          ${extraMap[role] || ''}
          <ion-item><ion-label style="font-size:13px;">Status</ion-label><ion-note slot="end" style="font-size:12px;">${member.isActive ? 'Active' : 'Inactive'}</ion-note></ion-item>
          <ion-item><ion-label style="font-size:13px;">Email Verified</ion-label><ion-note slot="end" style="font-size:12px;">${member.isEmailVerified ? '✅ Yes' : '❌ No'}</ion-note></ion-item>
          <ion-item><ion-label style="font-size:13px;">Added On</ion-label><ion-note slot="end" style="font-size:12px;">${UI.formatDate(member.createdAt)}</ion-note></ion-item>
        </ion-list>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;">
          <ion-button expand="block" fill="outline" id="modal-toggle-btn" style="font-size:12px;">${member.isActive ? 'Deactivate' : 'Activate'}</ion-button>
          <ion-button expand="block" fill="outline" id="modal-reset-pwd-btn" style="font-size:12px;">Reset Password</ion-button>
        </div>

        ${(role === 'FACULTY' || role === 'HOD') ? `
        <ion-button expand="block" fill="outline" color="primary" id="modal-edit-btn" style="font-size:12px;margin-top:8px;">
          <ion-icon name="create-outline" slot="start" style="font-size:14px;"></ion-icon> Edit Details
        </ion-button>` : ''}

        <ion-button expand="block" color="danger" style="margin-top:8px;font-size:12px;" id="modal-delete-btn">
          <ion-icon name="trash-outline" slot="start" style="font-size:14px;"></ion-icon> Delete Member
        </ion-button>
      </ion-content>
    `;
    document.body.appendChild(modal);
    await modal.present();

    modal.querySelector('#member-modal-close').addEventListener('click', () => modal.dismiss());
    modal.querySelector('#modal-toggle-btn').addEventListener('click', async () => {
      try { await Api.put(`/admin/members/${id}/toggle-active`, {}); UI.toast('Status updated'); modal.dismiss(); this._renderMembersList(); }
      catch (e) { UI.toast(e.message || 'Failed', 'danger'); }
    });
    modal.querySelector('#modal-reset-pwd-btn').addEventListener('click', async () => {
      try { await Api.post(`/admin/members/${id}/reset-password`, {}); UI.toast('Password reset email sent'); }
      catch (e) { UI.toast(e.message || 'Failed', 'danger'); }
    });
    modal.querySelector('#modal-edit-btn')?.addEventListener('click', () => {
      modal.dismiss();
      if (role === 'FACULTY') this._addFacultyModal(member);
      if (role === 'HOD') this._addHodModal(member);
    });
    modal.querySelector('#modal-delete-btn').addEventListener('click', async () => {
      const { confirmed } = await UI.confirmWithRemark({ title: `Delete ${member.name}?`, confirmText: 'Delete', confirmColor: 'danger' });
      if (!confirmed) return;
      try { await Api.delete(`/admin/members/${id}`); UI.toast('Member deleted'); modal.dismiss(); this._renderMembersList(); }
      catch (e) { UI.toast(e.message || 'Failed', 'danger'); }
    });
  },

  // ===================================================================
  // ADD MEMBER — ROUTER
  // FACULTY ke liye inline modal. HOD ab khud signup karta hai (OTP + Admin
  // approval) — admin ke "Add" button se HOD nahi bana sakte, isliye HOD
  // role se yeh button hata diya gaya hai (_loadMembersTab/_loadMemberList
  // me check hai). Baaki roles ke liye staff-register page.
  // ===================================================================
  _goToAddMember(role) {
    const r = role || this._memberRole;
    if (r === 'FACULTY') return this._addFacultyModal();
    if (r === 'HOD') return; // self-registration only — no admin-initiated create
    Router.navigate('staff-register', { defaultRole: r });
  },

  // ===================================================================
  // FACULTY — ADD / EDIT MODAL
  // Fields: Name, Email, Phone, Password, Employee ID,
  //         Department, Designation, Campus, Qualification,
  //         Experience, Joining Date
  // ===================================================================
  async _addFacultyModal(existingData = null) {
    const isEdit = !!existingData;
    const d = existingData || {};

    let deptOptions = '';
    try {
      const res = await Api.get('/admin/departments');
      deptOptions = (res.data || [])
        .map((dept) => `<option value="${UI.escapeHtml(dept)}" ${d.department === dept ? 'selected' : ''}>${UI.escapeHtml(dept)}</option>`)
        .join('');
    } catch (_) {}

    const modal = document.createElement('ion-modal');
    modal.innerHTML = `
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button id="fac-modal-close">
              <ion-icon name="arrow-back-outline" slot="icon-only" style="font-size:20px;"></ion-icon>
            </ion-button>
          </ion-buttons>
          <ion-title style="font-size:15px;">${isEdit ? 'Edit Faculty' : 'Add Faculty'}</ion-title>
          <ion-buttons slot="end">
            <ion-button id="fac-save-hdr-btn" strong style="font-size:13px;color:var(--bgi-primary);">Save</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">

        <p style="font-size:10px;font-weight:700;color:var(--bgi-text-secondary);text-transform:uppercase;letter-spacing:.5px;margin:0 0 8px;">Basic Information</p>

        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;--min-height:54px;">
          <ion-label position="stacked" style="font-size:11px;color:var(--bgi-text-secondary);">Full Name *</ion-label>
          <ion-input id="fac-name" value="${UI.escapeHtml(d.name || '')}" placeholder="e.g. Dr. Ramesh Sharma" style="font-size:13px;"></ion-input>
        </ion-item>

        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;--min-height:54px;">
          <ion-label position="stacked" style="font-size:11px;color:var(--bgi-text-secondary);">Email Address *</ion-label>
          <ion-input id="fac-email" type="email" value="${UI.escapeHtml(d.email || '')}" placeholder="e.g. ramesh@college.edu" style="font-size:13px;"></ion-input>
        </ion-item>

        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;--min-height:54px;">
          <ion-label position="stacked" style="font-size:11px;color:var(--bgi-text-secondary);">Mobile Number *</ion-label>
          <ion-input id="fac-phone" type="tel" value="${UI.escapeHtml(d.phone || '')}" placeholder="10-digit mobile" maxlength="10" style="font-size:13px;"></ion-input>
        </ion-item>

        ${!isEdit ? `
        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;--min-height:54px;">
          <ion-label position="stacked" style="font-size:11px;color:var(--bgi-text-secondary);">Password *</ion-label>
          <ion-input id="fac-password" type="password" placeholder="Min. 8 characters" style="font-size:13px;"></ion-input>
        </ion-item>` : ''}

        <p style="font-size:10px;font-weight:700;color:var(--bgi-text-secondary);text-transform:uppercase;letter-spacing:.5px;margin:12px 0 8px;">Professional Details</p>

        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;--min-height:54px;">
          <ion-label position="stacked" style="font-size:11px;color:var(--bgi-text-secondary);">Employee ID *</ion-label>
          <ion-input id="fac-empid" value="${UI.escapeHtml(d.employeeId || '')}" placeholder="e.g. EMP2024001" style="font-size:13px;"></ion-input>
        </ion-item>

        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;--min-height:54px;">
          <ion-label position="stacked" style="font-size:11px;color:var(--bgi-text-secondary);">Department *</ion-label>
          <div style="width:100%;padding:8px 0 4px;">
            <select id="fac-dept" style="width:100%;background:transparent;border:none;font-size:13px;color:var(--ion-text-color);outline:none;">
              <option value="">-- Select Department --</option>
              ${deptOptions}
            </select>
          </div>
        </ion-item>

        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;--min-height:54px;">
          <ion-label position="stacked" style="font-size:11px;color:var(--bgi-text-secondary);">Designation *</ion-label>
          <ion-input id="fac-designation" value="${UI.escapeHtml(d.designation || '')}" placeholder="e.g. Assistant Professor" style="font-size:13px;"></ion-input>
        </ion-item>

        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;--min-height:54px;">
          <ion-label position="stacked" style="font-size:11px;color:var(--bgi-text-secondary);">College / Campus</ion-label>
          <ion-input id="fac-campus" value="${UI.escapeHtml(d.campus || '')}" placeholder="e.g. Main Campus" style="font-size:13px;"></ion-input>
        </ion-item>

        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;--min-height:54px;">
          <ion-label position="stacked" style="font-size:11px;color:var(--bgi-text-secondary);">Qualification</ion-label>
          <ion-input id="fac-qual" value="${UI.escapeHtml(d.qualification || '')}" placeholder="e.g. M.Tech, Ph.D" style="font-size:13px;"></ion-input>
        </ion-item>

        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;--min-height:54px;">
          <ion-label position="stacked" style="font-size:11px;color:var(--bgi-text-secondary);">Experience (Years)</ion-label>
          <ion-input id="fac-exp" type="number" value="${d.experience || ''}" placeholder="e.g. 5" style="font-size:13px;"></ion-input>
        </ion-item>

        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:12px;--min-height:54px;">
          <ion-label position="stacked" style="font-size:11px;color:var(--bgi-text-secondary);">Joining Date</ion-label>
          <ion-input id="fac-joining" type="date" value="${UI.escapeHtml(d.joiningDate ? d.joiningDate.slice(0, 10) : '')}" style="font-size:13px;"></ion-input>
        </ion-item>

        <div id="fac-error" style="display:none;background:rgba(239,68,68,.1);border:1px solid var(--bgi-danger);border-radius:8px;padding:10px;margin-bottom:10px;font-size:12px;color:var(--bgi-danger);"></div>

        <ion-button expand="block" id="fac-submit-btn" style="font-size:13px;margin-bottom:20px;">
          <ion-icon name="${isEdit ? 'save-outline' : 'person-add-outline'}" slot="start" style="font-size:16px;"></ion-icon>
          ${isEdit ? 'Update Faculty' : 'Add Faculty'}
        </ion-button>

      </ion-content>
    `;

    document.body.appendChild(modal);
    await modal.present();

    const showError = (msg) => {
      const box = modal.querySelector('#fac-error');
      box.style.display = 'block';
      box.textContent = msg;
    };

    const submit = async () => {
      const payload = {
        name: modal.querySelector('#fac-name').value?.trim(),
        email: modal.querySelector('#fac-email').value?.trim(),
        phone: modal.querySelector('#fac-phone').value?.trim(),
        employeeId: modal.querySelector('#fac-empid').value?.trim(),
        department: modal.querySelector('#fac-dept').value,
        designation: modal.querySelector('#fac-designation').value?.trim(),
        campus: modal.querySelector('#fac-campus').value?.trim(),
        qualification: modal.querySelector('#fac-qual').value?.trim(),
        experience: modal.querySelector('#fac-exp').value || undefined,
        joiningDate: modal.querySelector('#fac-joining').value || undefined,
        role: 'FACULTY',
      };
      if (!isEdit) payload.password = modal.querySelector('#fac-password').value;

      if (!payload.name) return showError('Full name required hai');
      if (!payload.email || !payload.email.includes('@')) return showError('Valid email required hai');
      if (!payload.phone || payload.phone.length < 10) return showError('Valid 10-digit mobile number required hai');
      if (!payload.employeeId) return showError('Employee ID required hai');
      if (!payload.department) return showError('Department select karo');
      if (!payload.designation) return showError('Designation required hai');
      if (!isEdit && (!payload.password || payload.password.length < 8)) return showError('Password minimum 8 characters ka hona chahiye');

      const btn = modal.querySelector('#fac-submit-btn');
      btn.disabled = true;
      btn.innerHTML = '<ion-spinner style="width:18px;height:18px;margin-right:8px;"></ion-spinner> Saving...';

      try {
        if (isEdit) {
          await Api.put(`/admin/members/${d._id}`, payload);
          UI.toast('Faculty updated successfully', 'success');
        } else {
          await Api.post('/admin/faculty', payload);
          UI.toast('Faculty added successfully', 'success');
        }
        modal.dismiss();
        this._renderMembersList();
      } catch (e) {
        showError(e.message || 'Kuch galat hua, dobara try karo');
        btn.disabled = false;
        btn.innerHTML = `<ion-icon name="${isEdit ? 'save-outline' : 'person-add-outline'}" slot="start"></ion-icon> ${isEdit ? 'Update Faculty' : 'Add Faculty'}`;
      }
    };

    modal.querySelector('#fac-modal-close').addEventListener('click', () => modal.dismiss());
    modal.querySelector('#fac-save-hdr-btn').addEventListener('click', submit);
    modal.querySelector('#fac-submit-btn').addEventListener('click', submit);
  },

  // ===================================================================
  // HOD — EDIT MODAL (existing, already-approved HOD only)
  // HOD accounts are no longer created here by Admin — HOD now self-registers
  // via the login page's "Create an account" (OTP + Admin approval, see
  // _showPendingHodApprovals above). This modal is only reachable from the
  // "Edit Details" button on an existing HOD's profile, so it always runs
  // in edit mode (no password field, no /admin/hod POST).
  // Fields: Name, Email, Phone, Employee ID, Department, Campus,
  //         Qualification, Experience, Joining Date, Alternate Phone, Office Room
  // ===================================================================
  async _addHodModal(existingData) {
    const d = existingData || {};

    let deptOptions = '';
    try {
      const res = await Api.get('/admin/departments');
      deptOptions = (res.data || [])
        .map((dept) => `<option value="${UI.escapeHtml(dept)}" ${d.department === dept ? 'selected' : ''}>${UI.escapeHtml(dept)}</option>`)
        .join('');
    } catch (_) {}

    const modal = document.createElement('ion-modal');
    modal.innerHTML = `
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button id="hod-modal-close">
              <ion-icon name="arrow-back-outline" slot="icon-only" style="font-size:20px;"></ion-icon>
            </ion-button>
          </ion-buttons>
          <ion-title style="font-size:15px;">Edit HOD</ion-title>
          <ion-buttons slot="end">
            <ion-button id="hod-save-hdr-btn" strong style="font-size:13px;color:var(--bgi-primary);">Save</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">

        <p style="font-size:10px;font-weight:700;color:var(--bgi-text-secondary);text-transform:uppercase;letter-spacing:.5px;margin:0 0 8px;">Basic Information</p>

        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;--min-height:54px;">
          <ion-label position="stacked" style="font-size:11px;color:var(--bgi-text-secondary);">Full Name *</ion-label>
          <ion-input id="hod-name" value="${UI.escapeHtml(d.name || '')}" placeholder="e.g. Prof. Sunita Verma" style="font-size:13px;"></ion-input>
        </ion-item>

        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;--min-height:54px;">
          <ion-label position="stacked" style="font-size:11px;color:var(--bgi-text-secondary);">Email Address *</ion-label>
          <ion-input id="hod-email" type="email" value="${UI.escapeHtml(d.email || '')}" placeholder="e.g. sunita@college.edu" style="font-size:13px;"></ion-input>
        </ion-item>

        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;--min-height:54px;">
          <ion-label position="stacked" style="font-size:11px;color:var(--bgi-text-secondary);">Mobile Number *</ion-label>
          <ion-input id="hod-phone" type="tel" value="${UI.escapeHtml(d.phone || '')}" placeholder="10-digit mobile" maxlength="10" style="font-size:13px;"></ion-input>
        </ion-item>

        <p style="font-size:10px;font-weight:700;color:var(--bgi-text-secondary);text-transform:uppercase;letter-spacing:.5px;margin:12px 0 8px;">Department & Role</p>

        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;--min-height:54px;">
          <ion-label position="stacked" style="font-size:11px;color:var(--bgi-text-secondary);">Employee ID *</ion-label>
          <ion-input id="hod-empid" value="${UI.escapeHtml(d.employeeId || '')}" placeholder="e.g. HOD2024001" style="font-size:13px;"></ion-input>
        </ion-item>

        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;--min-height:54px;">
          <ion-label position="stacked" style="font-size:11px;color:var(--bgi-text-secondary);">Department (Head Of) *</ion-label>
          <div style="width:100%;padding:8px 0 4px;">
            <select id="hod-dept" style="width:100%;background:transparent;border:none;font-size:13px;color:var(--ion-text-color);outline:none;">
              <option value="">-- Select Department --</option>
              ${deptOptions}
            </select>
          </div>
        </ion-item>

        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;--min-height:54px;">
          <ion-label position="stacked" style="font-size:11px;color:var(--bgi-text-secondary);">College / Campus</ion-label>
          <ion-input id="hod-campus" value="${UI.escapeHtml(d.campus || '')}" placeholder="e.g. Main Campus" style="font-size:13px;"></ion-input>
        </ion-item>

        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;--min-height:54px;">
          <ion-label position="stacked" style="font-size:11px;color:var(--bgi-text-secondary);">Qualification</ion-label>
          <ion-input id="hod-qual" value="${UI.escapeHtml(d.qualification || '')}" placeholder="e.g. Ph.D, M.Tech" style="font-size:13px;"></ion-input>
        </ion-item>

        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;--min-height:54px;">
          <ion-label position="stacked" style="font-size:11px;color:var(--bgi-text-secondary);">Experience (Years)</ion-label>
          <ion-input id="hod-exp" type="number" value="${d.experience || ''}" placeholder="e.g. 10" style="font-size:13px;"></ion-input>
        </ion-item>

        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;--min-height:54px;">
          <ion-label position="stacked" style="font-size:11px;color:var(--bgi-text-secondary);">Joining Date</ion-label>
          <ion-input id="hod-joining" type="date" value="${UI.escapeHtml(d.joiningDate ? d.joiningDate.slice(0, 10) : '')}" style="font-size:13px;"></ion-input>
        </ion-item>

        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;--min-height:54px;">
          <ion-label position="stacked" style="font-size:11px;color:var(--bgi-text-secondary);">Alternate Contact (optional)</ion-label>
          <ion-input id="hod-alt-phone" type="tel" value="${UI.escapeHtml(d.alternatePhone || '')}" placeholder="Alternate mobile" maxlength="10" style="font-size:13px;"></ion-input>
        </ion-item>

        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:12px;--min-height:54px;">
          <ion-label position="stacked" style="font-size:11px;color:var(--bgi-text-secondary);">Office Room / Extension</ion-label>
          <ion-input id="hod-office" value="${UI.escapeHtml(d.officeRoom || '')}" placeholder="e.g. Room 204, Ext. 312" style="font-size:13px;"></ion-input>
        </ion-item>

        <div id="hod-error" style="display:none;background:rgba(239,68,68,.1);border:1px solid var(--bgi-danger);border-radius:8px;padding:10px;margin-bottom:10px;font-size:12px;color:var(--bgi-danger);"></div>

        <ion-button expand="block" id="hod-submit-btn" style="font-size:13px;margin-bottom:20px;">
          <ion-icon name="save-outline" slot="start" style="font-size:16px;"></ion-icon>
          Update HOD
        </ion-button>

      </ion-content>
    `;

    document.body.appendChild(modal);
    await modal.present();

    const showError = (msg) => {
      const box = modal.querySelector('#hod-error');
      box.style.display = 'block';
      box.textContent = msg;
    };

    const submit = async () => {
      const payload = {
        name: modal.querySelector('#hod-name').value?.trim(),
        email: modal.querySelector('#hod-email').value?.trim(),
        phone: modal.querySelector('#hod-phone').value?.trim(),
        employeeId: modal.querySelector('#hod-empid').value?.trim(),
        department: modal.querySelector('#hod-dept').value,
        campus: modal.querySelector('#hod-campus').value?.trim(),
        qualification: modal.querySelector('#hod-qual').value?.trim(),
        experience: modal.querySelector('#hod-exp').value || undefined,
        joiningDate: modal.querySelector('#hod-joining').value || undefined,
        alternatePhone: modal.querySelector('#hod-alt-phone').value?.trim() || undefined,
        officeRoom: modal.querySelector('#hod-office').value?.trim() || undefined,
        role: 'HOD',
      };

      if (!payload.name) return showError('Full name required hai');
      if (!payload.email || !payload.email.includes('@')) return showError('Valid email required hai');
      if (!payload.phone || payload.phone.length < 10) return showError('Valid 10-digit mobile number required hai');
      if (!payload.employeeId) return showError('Employee ID required hai');
      if (!payload.department) return showError('Department select karo');

      const btn = modal.querySelector('#hod-submit-btn');
      btn.disabled = true;
      btn.innerHTML = '<ion-spinner style="width:18px;height:18px;margin-right:8px;"></ion-spinner> Saving...';

      try {
        await Api.put(`/admin/members/${d._id}`, payload);
        UI.toast('HOD updated successfully', 'success');
        modal.dismiss();
        this._renderMembersList();
      } catch (e) {
        showError(e.message || 'Kuch galat hua, dobara try karo');
        btn.disabled = false;
        btn.innerHTML = '<ion-icon name="save-outline" slot="start"></ion-icon> Update HOD';
      }
    };

    modal.querySelector('#hod-modal-close').addEventListener('click', () => modal.dismiss());
    modal.querySelector('#hod-save-hdr-btn').addEventListener('click', submit);
    modal.querySelector('#hod-submit-btn').addEventListener('click', submit);
  },

  // ===================================================================
  // GATE PASSES TAB
  // ===================================================================
  _loadPassesTab() {
    const body = document.getElementById('admin-dash-body');
    body.innerHTML = `
      <ion-segment value="pending" id="pass-status-segment" scrollable style="margin-bottom:10px;">
        <ion-segment-button value="pending"><ion-label style="font-size:11px;">Pending</ion-label></ion-segment-button>
        <ion-segment-button value="approved"><ion-label style="font-size:11px;">Approved</ion-label></ion-segment-button>
        <ion-segment-button value="rejected"><ion-label style="font-size:11px;">Rejected</ion-label></ion-segment-button>
        <ion-segment-button value="all"><ion-label style="font-size:11px;">All</ion-label></ion-segment-button>
      </ion-segment>
      <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;--min-height:38px;">
        <ion-icon name="search-outline" slot="start" color="medium" style="font-size:16px;"></ion-icon>
        <ion-input id="pass-search-input" placeholder="Search student..." style="font-size:13px;"></ion-input>
      </ion-item>
      <div id="passes-list">${this._spinner()}</div>
    `;

    let passStatus = 'pending', passSearch = '', passDebounce;
    const loadPasses = async () => {
      const list = document.getElementById('passes-list');
      if (!list) return;
      list.innerHTML = this._spinner();
      try {
        const res = await Api.get('/epass', { status: passStatus === 'all' ? undefined : passStatus, search: passSearch || undefined });
        const passes = res.data || [];
        if (!passes.length) { list.innerHTML = `<p class="empty-state" style="font-size:12px;">No ${passStatus} passes found</p>`; return; }
        list.innerHTML = passes.map((p) => this._passCardHtml(p)).join('');
        list.querySelectorAll('.pass-card').forEach((card) => card.addEventListener('click', () => this._showPassDetail(card.dataset.id)));
      } catch (e) { list.innerHTML = `<p class="empty-state" style="font-size:12px;">${UI.escapeHtml(e.message)}</p>`; }
    };
    document.getElementById('pass-status-segment').addEventListener('ionChange', (e) => { passStatus = e.detail.value; loadPasses(); });
    document.getElementById('pass-search-input').addEventListener('ionInput', (e) => {
      clearTimeout(passDebounce); passDebounce = setTimeout(() => { passSearch = e.detail.value; loadPasses(); }, 350);
    });
    loadPasses();
  },

  _passCardHtml(p) {
    const statusClass = { pending: 'status-pending', approved: 'status-approved', rejected: 'status-rejected' }[p.status] || 'status-pending';
    return `
      <ion-card class="pass-card" data-id="${p._id}" style="cursor:pointer;margin-bottom:6px;">
        <div style="padding:10px 12px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px;margin-bottom:4px;">
            <div>
              <div style="font-weight:700;font-size:13px;">${UI.escapeHtml(p.student?.name || '-')}</div>
              <div style="font-size:11px;color:var(--bgi-text-secondary);">${UI.escapeHtml(p.student?.enrollmentNumber || '-')} &bull; ${UI.escapeHtml(p.student?.branch || '-')}</div>
            </div>
            <span class="status-badge ${statusClass}" style="font-size:9px;padding:2px 6px;">${p.status?.toUpperCase()}</span>
          </div>
          <div style="font-size:11px;color:var(--bgi-text-secondary);"><b>Type:</b> ${UI.escapeHtml(p.passType || '-')} &bull; <b>Reason:</b> ${UI.escapeHtml(p.reason || '-')}</div>
          <div style="font-size:11px;margin-top:3px;">
            <span class="status-badge ${p.parentApproval ? 'status-approved' : 'status-pending'}" style="font-size:9px;padding:1px 5px;">Parent ${p.parentApproval ? '✓' : '?'}</span>
            <span class="status-badge ${p.facultyApproval ? 'status-approved' : 'status-pending'}" style="font-size:9px;padding:1px 5px;margin-left:3px;">Faculty ${p.facultyApproval ? '✓' : '?'}</span>
            <span class="status-badge ${p.hodApproval ? 'status-approved' : 'status-pending'}" style="font-size:9px;padding:1px 5px;margin-left:3px;">HOD ${p.hodApproval ? '✓' : '?'}</span>
          </div>
        </div>
      </ion-card>`;
  },

  async _showPassDetail(id) {
    let pass;
    try { const res = await Api.get(`/epass/${id}`); pass = res.data; }
    catch (e) { return UI.toast(e.message || 'Failed to load', 'danger'); }

    const modal = document.createElement('ion-modal');
    modal.innerHTML = `
      <ion-header><ion-toolbar>
        <ion-title style="font-size:15px;">Gate Pass Details</ion-title>
        <ion-buttons slot="end"><ion-button id="pass-modal-close" style="font-size:13px;">Close</ion-button></ion-buttons>
      </ion-toolbar></ion-header>
      <ion-content class="ion-padding">
        ${pass.student?.photo ? `<div style="text-align:center;margin-bottom:10px;"><img src="${UI.escapeHtml(pass.student.photo)}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;" /></div>` : ''}
        <ion-list lines="inset" style="font-size:13px;">
          <ion-item><ion-label style="font-size:13px;">Student</ion-label><ion-note slot="end" style="font-size:12px;">${UI.escapeHtml(pass.student?.name || '-')}</ion-note></ion-item>
          <ion-item><ion-label style="font-size:13px;">Enrollment</ion-label><ion-note slot="end" style="font-size:12px;">${UI.escapeHtml(pass.student?.enrollmentNumber || '-')}</ion-note></ion-item>
          <ion-item><ion-label style="font-size:13px;">Branch/Sem</ion-label><ion-note slot="end" style="font-size:12px;">${UI.escapeHtml(pass.student?.branch || '-')} / ${pass.student?.semester || '-'}</ion-note></ion-item>
          <ion-item><ion-label style="font-size:13px;">Pass Type</ion-label><ion-note slot="end" style="font-size:12px;">${UI.escapeHtml(pass.passType || '-')}</ion-note></ion-item>
          <ion-item><ion-label style="font-size:13px;">Reason</ion-label><ion-note slot="end" style="font-size:12px;white-space:normal;text-align:right;max-width:55%;">${UI.escapeHtml(pass.reason || '-')}</ion-note></ion-item>
          <ion-item><ion-label style="font-size:13px;">Status</ion-label><ion-note slot="end" style="font-size:12px;">${pass.status?.toUpperCase()}</ion-note></ion-item>
          <ion-item><ion-label style="font-size:13px;">Parent</ion-label><ion-note slot="end" style="font-size:12px;">${pass.parentApproval ? '✅' : '⏳ Pending'}</ion-note></ion-item>
          <ion-item><ion-label style="font-size:13px;">Faculty</ion-label><ion-note slot="end" style="font-size:12px;">${pass.facultyApproval ? '✅' : '⏳ Pending'}</ion-note></ion-item>
          <ion-item><ion-label style="font-size:13px;">HOD</ion-label><ion-note slot="end" style="font-size:12px;">${pass.hodApproval ? '✅' : '⏳ Pending'}</ion-note></ion-item>
        </ion-list>
        ${pass.qrCode ? `<div style="text-align:center;margin:12px 0;"><img src="${UI.escapeHtml(pass.qrCode)}" style="width:140px;height:140px;" /></div>` : ''}
        ${pass.status === 'pending' ? `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;">
            <ion-button expand="block" color="success" id="pass-approve-btn" style="font-size:12px;"><ion-icon name="checkmark-outline" slot="start"></ion-icon>Approve</ion-button>
            <ion-button expand="block" color="danger" id="pass-reject-btn" style="font-size:12px;"><ion-icon name="close-outline" slot="start"></ion-icon>Reject</ion-button>
          </div>` : ''}
      </ion-content>
    `;
    document.body.appendChild(modal);
    await modal.present();
    modal.querySelector('#pass-modal-close').addEventListener('click', () => modal.dismiss());
    modal.querySelector('#pass-approve-btn')?.addEventListener('click', async () => {
      try { await Api.put(`/epass/${id}/approve`, {}); UI.toast('Gate pass approved'); modal.dismiss(); this._loadPassesTab(); }
      catch (e) { UI.toast(e.message || 'Failed', 'danger'); }
    });
    modal.querySelector('#pass-reject-btn')?.addEventListener('click', async () => {
      const { confirmed, remark } = await UI.confirmWithRemark({ title: 'Reject Gate Pass', placeholder: 'Reason for rejection', confirmText: 'Reject', confirmColor: 'danger' });
      if (!confirmed) return;
      try { await Api.put(`/epass/${id}/reject`, { remark }); UI.toast('Gate pass rejected'); modal.dismiss(); this._loadPassesTab(); }
      catch (e) { UI.toast(e.message || 'Failed', 'danger'); }
    });
  },

  // ===================================================================
  // QR SCANNER
  // ===================================================================
  async _openQRScanner() {
    const modal = document.createElement('ion-modal');
    modal.innerHTML = `
      <ion-header><ion-toolbar>
        <ion-title style="font-size:15px;">QR Verification</ion-title>
        <ion-buttons slot="end"><ion-button id="qr-modal-close" style="font-size:13px;">Close</ion-button></ion-buttons>
      </ion-toolbar></ion-header>
      <ion-content class="ion-padding">
        <div style="text-align:center;margin-bottom:12px;">
          <ion-icon name="qr-code-outline" style="font-size:48px;color:var(--bgi-primary);"></ion-icon>
          <p style="color:var(--bgi-text-secondary);font-size:12px;">Enter QR token or Pass ID</p>
        </div>
        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:10px;">
          <ion-input id="qr-input" placeholder="Paste QR token..." style="font-size:13px;" clearInput></ion-input>
        </ion-item>
        <ion-button expand="block" id="qr-verify-btn" style="font-size:13px;"><ion-icon name="scan-outline" slot="start"></ion-icon>Verify</ion-button>
        <div id="qr-result" style="margin-top:12px;"></div>
      </ion-content>
    `;
    document.body.appendChild(modal);
    await modal.present();
    modal.querySelector('#qr-modal-close').addEventListener('click', () => modal.dismiss());
    modal.querySelector('#qr-verify-btn').addEventListener('click', async () => {
      const token = modal.querySelector('#qr-input').value?.trim();
      if (!token) return UI.toast('Enter a QR token', 'warning');
      const result = document.getElementById('qr-result');
      result.innerHTML = this._spinner();
      try {
        const res = await Api.post('/guard/verify-qr', { token });
        if (!res || typeof res !== 'object') {
          result.innerHTML = '<ion-card style="border-left:3px solid var(--bgi-danger);"><div style="padding:10px 12px;"><div style="font-weight:700;color:var(--bgi-danger);font-size:13px;">❌ Invalid Response</div></div></ion-card>';
          return;
        }
        const p = res.data || res;
        if (!p || typeof p !== 'object' || !p._id) {
          result.innerHTML = '<ion-card style="border-left:3px solid var(--bgi-danger);"><div style="padding:10px 12px;"><div style="font-weight:700;color:var(--bgi-danger);font-size:13px;">❌ Invalid Pass Data</div></div></ion-card>';
          return;
        }
        const studentName = p.student?.name || (p.studentName ? UI.escapeHtml(String(p.studentName)) : '-');
        const passType = p.passType ? UI.escapeHtml(String(p.passType)) : '-';
        const status = p.status ? UI.escapeHtml(String(p.status)) : '-';
        result.innerHTML = `
          <ion-card style="border-left:3px solid var(--bgi-success);">
            <div style="padding:10px 12px;">
              <div style="font-weight:700;color:var(--bgi-success);font-size:13px;margin-bottom:6px;">✅ Valid Gate Pass</div>
              <div style="font-size:12px;"><b>Student:</b> ${UI.escapeHtml(String(studentName))}</div>
              <div style="font-size:12px;"><b>Type:</b> ${passType} &bull; <b>Status:</b> ${status}</div>
            </div>
          </ion-card>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">
            <ion-button expand="block" color="success" id="mark-entry-btn" style="font-size:12px;"><ion-icon name="enter-outline" slot="start"></ion-icon>Entry</ion-button>
            <ion-button expand="block" color="warning" id="mark-exit-btn" style="font-size:12px;"><ion-icon name="exit-outline" slot="start"></ion-icon>Exit</ion-button>
          </div>`;
        document.getElementById('mark-entry-btn').addEventListener('click', async () => {
          try { await Api.post('/guard/mark-entry', { passId: p._id }); UI.toast('Entry marked'); } catch (e) { UI.toast(e.message, 'danger'); }
        });
        document.getElementById('mark-exit-btn').addEventListener('click', async () => {
          try { await Api.post('/guard/mark-exit', { passId: p._id }); UI.toast('Exit marked'); } catch (e) { UI.toast(e.message, 'danger'); }
        });
      } catch (e) {
        result.innerHTML = `<ion-card style="border-left:3px solid var(--bgi-danger);"><div style="padding:10px 12px;"><div style="font-weight:700;color:var(--bgi-danger);font-size:13px;">❌ Invalid or Expired QR</div><div style="font-size:12px;color:var(--bgi-text-secondary);margin-top:4px;">${UI.escapeHtml(e.message)}</div></div></ion-card>`;
      }
    });
  },

  // ===================================================================
  // VISITORS
  // ===================================================================
  async _loadVisitors() {
    const modal = document.createElement('ion-modal');
    modal.innerHTML = `
      <ion-header><ion-toolbar>
        <ion-title style="font-size:15px;">Visitor Management</ion-title>
        <ion-buttons slot="end">
          <ion-button id="add-visitor-btn"><ion-icon name="add" slot="icon-only" style="font-size:20px;"></ion-icon></ion-button>
          <ion-button id="visitor-modal-close" style="font-size:13px;">Close</ion-button>
        </ion-buttons>
      </ion-toolbar></ion-header>
      <ion-content class="ion-padding"><div id="visitors-content">${this._spinner()}</div></ion-content>
    `;
    document.body.appendChild(modal);
    await modal.present();
    modal.querySelector('#visitor-modal-close').addEventListener('click', () => modal.dismiss());
    modal.querySelector('#add-visitor-btn').addEventListener('click', () => this._addVisitorForm());
    const loadVisitors = async () => {
      const content = document.getElementById('visitors-content');
      try {
        const res = await Api.get('/admin/visitors');
        const visitors = res.data || [];
        if (!visitors.length) { content.innerHTML = '<p class="empty-state" style="font-size:12px;">No visitors today</p>'; return; }
        content.innerHTML = visitors.map((v) => `
          <ion-card style="margin-bottom:6px;">
            <div style="padding:10px 12px;">
              <div style="font-weight:700;font-size:13px;">${UI.escapeHtml(v.name)}</div>
              <div style="font-size:11px;color:var(--bgi-text-secondary);">${UI.escapeHtml(v.mobile)} &bull; ${UI.escapeHtml(v.purpose)}</div>
              <div style="font-size:11px;margin-top:3px;"><b>To Meet:</b> ${UI.escapeHtml(v.personToMeet || '-')} &bull; <b>Dept:</b> ${UI.escapeHtml(v.department || '-')}</div>
              <div style="font-size:11px;"><b>In:</b> ${UI.formatDate(v.entryTime)} ${v.exitTime ? `&bull; <b>Out:</b> ${UI.formatDate(v.exitTime)}` : '<span class="status-badge status-pending" style="font-size:9px;">Inside</span>'}</div>
            </div>
          </ion-card>`).join('');
      } catch (e) { const c = document.getElementById('visitors-content'); if (c) c.innerHTML = `<p class="empty-state" style="font-size:12px;">${UI.escapeHtml(e.message)}</p>`; }
    };
    loadVisitors();
  },

  async _addVisitorForm() {
    const modal = document.createElement('ion-modal');
    modal.innerHTML = `
      <ion-header><ion-toolbar>
        <ion-title style="font-size:15px;">Add Visitor</ion-title>
        <ion-buttons slot="end"><ion-button id="av-close" style="font-size:13px;">Close</ion-button></ion-buttons>
      </ion-toolbar></ion-header>
      <ion-content class="ion-padding">
        <ion-list lines="none">
          <ion-item style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;"><ion-label position="stacked" style="font-size:12px;">Visitor Name *</ion-label><ion-input id="av-name" placeholder="Full name" style="font-size:13px;"></ion-input></ion-item>
          <ion-item style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;"><ion-label position="stacked" style="font-size:12px;">Mobile *</ion-label><ion-input id="av-mobile" type="tel" placeholder="Mobile number" style="font-size:13px;"></ion-input></ion-item>
          <ion-item style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;"><ion-label position="stacked" style="font-size:12px;">Purpose *</ion-label><ion-input id="av-purpose" placeholder="Purpose of visit" style="font-size:13px;"></ion-input></ion-item>
          <ion-item style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;"><ion-label position="stacked" style="font-size:12px;">Person to Meet</ion-label><ion-input id="av-person" placeholder="Name" style="font-size:13px;"></ion-input></ion-item>
          <ion-item style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:12px;"><ion-label position="stacked" style="font-size:12px;">Department</ion-label><ion-input id="av-dept" placeholder="Department" style="font-size:13px;"></ion-input></ion-item>
        </ion-list>
        <ion-button expand="block" id="av-submit" style="font-size:13px;"><ion-icon name="person-add-outline" slot="start"></ion-icon>Register Visitor</ion-button>
      </ion-content>
    `;
    document.body.appendChild(modal);
    await modal.present();
    modal.querySelector('#av-close').addEventListener('click', () => modal.dismiss());
    modal.querySelector('#av-submit').addEventListener('click', async () => {
      const body = { name: modal.querySelector('#av-name').value?.trim(), mobile: modal.querySelector('#av-mobile').value?.trim(), purpose: modal.querySelector('#av-purpose').value?.trim(), personToMeet: modal.querySelector('#av-person').value?.trim(), department: modal.querySelector('#av-dept').value?.trim() };
      if (!body.name || !body.mobile || !body.purpose) return UI.toast('Fill required fields', 'warning');
      try { await Api.post('/admin/visitors', body); UI.toast('Visitor registered'); modal.dismiss(); }
      catch (e) { UI.toast(e.message || 'Failed', 'danger'); }
    });
  },

  // ===================================================================
  // REPORTS TAB
  // ===================================================================
  _loadReportsTab() {
    const body = document.getElementById('admin-dash-body');
    body.innerHTML = `
      <p style="font-weight:700;font-size:11px;color:var(--bgi-text-secondary);text-transform:uppercase;letter-spacing:.5px;margin:0 0 8px;">Generate Reports</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
        ${this._reportTile('today-outline', 'Daily', 'daily', '#6366f1')}
        ${this._reportTile('calendar-outline', 'Weekly', 'weekly', '#0ea5e9')}
        ${this._reportTile('calendar-clear-outline', 'Monthly', 'monthly', '#f59e0b')}
        ${this._reportTile('business-outline', 'Department', 'department', '#10b981')}
        ${this._reportTile('git-branch-outline', 'Branch Wise', 'branch', '#8b5cf6')}
        ${this._reportTile('layers-outline', 'Semester', 'semester', '#ec4899')}
      </div>
      <div id="report-output"></div>
    `;
    body.querySelectorAll('.report-tile').forEach((tile) => tile.addEventListener('click', () => this._generateReport(tile.dataset.type)));
  },

  _reportTile(icon, label, type, color) {
    return `
      <ion-card class="report-tile" data-type="${type}" style="margin:0;padding:12px;text-align:center;cursor:pointer;">
        <ion-icon name="${icon}" style="font-size:22px;color:${color};display:block;margin-bottom:4px;"></ion-icon>
        <div style="font-size:11px;font-weight:600;">${label}</div>
      </ion-card>`;
  },

  async _generateReport(type) {
    const output = document.getElementById('report-output');
    output.innerHTML = this._spinner();
    try {
      const res = await Api.get(`/admin/reports/${type}`);
      const data = res.data || [];
      if (!data.length) { output.innerHTML = '<p class="empty-state" style="font-size:12px;">No data for this period</p>'; return; }
      output.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <p style="font-weight:700;margin:0;font-size:13px;text-transform:capitalize;">${type} Report</p>
          <div style="display:flex;gap:6px;">
            <ion-button size="small" fill="outline" id="export-pdf-btn" style="font-size:11px;"><ion-icon name="document-outline" slot="start" style="font-size:14px;"></ion-icon>PDF</ion-button>
            <ion-button size="small" fill="outline" id="export-excel-btn" style="font-size:11px;"><ion-icon name="grid-outline" slot="start" style="font-size:14px;"></ion-icon>Excel</ion-button>
          </div>
        </div>
        <ion-card>
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:11px;">
              <thead><tr style="background:var(--bgi-bg);">${Object.keys(data[0]).map((k) => `<th style="padding:8px 10px;text-align:left;font-weight:700;border-bottom:1px solid var(--bgi-border);white-space:nowrap;">${UI.escapeHtml(k)}</th>`).join('')}</tr></thead>
              <tbody>${data.map((row, i) => `<tr style="${i % 2 === 0 ? '' : 'background:var(--bgi-bg);'}">${Object.values(row).map((v) => `<td style="padding:8px 10px;border-bottom:1px solid var(--bgi-border);">${UI.escapeHtml(String(v ?? '-'))}</td>`).join('')}</tr>`).join('')}</tbody>
            </table>
          </div>
        </ion-card>
      `;
      document.getElementById('export-pdf-btn').addEventListener('click', async () => {
        try { const r = await Api.get(`/admin/reports/${type}/export?format=pdf`); if (r.url) window.open(r.url); } catch (e) { UI.toast(e.message || 'Export failed', 'danger'); }
      });
      document.getElementById('export-excel-btn').addEventListener('click', async () => {
        try { const r = await Api.get(`/admin/reports/${type}/export?format=excel`); if (r.url) window.open(r.url); } catch (e) { UI.toast(e.message || 'Export failed', 'danger'); }
      });
    } catch (e) { output.innerHTML = `<p class="empty-state" style="font-size:12px;">${UI.escapeHtml(e.message)}</p>`; }
  },

  // ===================================================================
  // NOTIFICATIONS
  // ===================================================================
  async _loadNotifications() {
    const modal = document.createElement('ion-modal');
    modal.innerHTML = `
      <ion-header><ion-toolbar>
        <ion-title style="font-size:15px;">Notifications</ion-title>
        <ion-buttons slot="end">
          <ion-button id="mark-all-read-btn" style="font-size:12px;">Mark All Read</ion-button>
          <ion-button id="notif-modal-close" style="font-size:13px;">Close</ion-button>
        </ion-buttons>
      </ion-toolbar></ion-header>
      <ion-content class="ion-padding"><div id="notif-list-content">${this._spinner()}</div></ion-content>
    `;
    document.body.appendChild(modal);
    await modal.present();
    modal.querySelector('#notif-modal-close').addEventListener('click', () => modal.dismiss());
    const loadNotifs = async () => {
      const content = document.getElementById('notif-list-content');
      try {
        const res = await Api.get('/notifications', { limit: 30 });
        const notifs = res.data || [];
        if (!notifs.length) { content.innerHTML = '<p class="empty-state" style="font-size:12px;">No notifications</p>'; return; }
        content.innerHTML = notifs.map((n) => `
          <ion-card style="margin-bottom:6px;${n.isRead ? 'opacity:.7;' : 'border-left:3px solid var(--bgi-primary);'}">
            <div style="padding:10px 12px;display:flex;gap:8px;align-items:flex-start;">
              <ion-icon name="${this._notifIcon(n.type)}" style="font-size:18px;color:var(--bgi-primary);flex-shrink:0;margin-top:1px;"></ion-icon>
              <div>
                <div style="font-weight:${n.isRead ? '400' : '700'};font-size:13px;">${UI.escapeHtml(n.title || n.type?.replace(/_/g, ' ') || 'Notification')}</div>
                <div style="font-size:11px;color:var(--bgi-text-secondary);margin-top:1px;">${UI.escapeHtml(n.message || '')}</div>
                <div style="font-size:10px;color:var(--bgi-text-secondary);margin-top:3px;">${UI.formatDate(n.createdAt)}</div>
              </div>
            </div>
          </ion-card>`).join('');
      } catch (e) { const c = document.getElementById('notif-list-content'); if (c) c.innerHTML = `<p class="empty-state" style="font-size:12px;">${UI.escapeHtml(e.message)}</p>`; }
    };
    modal.querySelector('#mark-all-read-btn').addEventListener('click', async () => {
      try { await Api.put('/notifications/mark-all-read', {}); loadNotifs(); this._pollNotifications(); } catch (e) { UI.toast(e.message, 'danger'); }
    });
    loadNotifs();
  },

  _notifIcon(type) {
    const map = { NEW_REQUEST: 'document-outline', APPROVED: 'checkmark-circle-outline', REJECTED: 'close-circle-outline', EMERGENCY: 'warning-outline', PASSWORD_RESET: 'key-outline', ACCOUNT_CREATED: 'person-add-outline' };
    return map[type] || 'notifications-outline';
  },

  // ===================================================================
  // SETTINGS TAB
  // ===================================================================
  async _loadSettingsTab() {
    const body = document.getElementById('admin-dash-body');
    body.innerHTML = this._spinner();
    try {
      const res = await Api.get('/auth/me');
      const user = res.data || res;
      body.innerHTML = `
        <div style="text-align:center;margin-bottom:16px;">
          <div style="width:64px;height:64px;border-radius:50%;background:var(--bgi-bg);display:flex;align-items:center;justify-content:center;margin:0 auto 8px;">
            <ion-icon name="shield-checkmark" style="font-size:32px;color:var(--bgi-primary);"></ion-icon>
          </div>
          <p style="font-weight:700;font-size:15px;margin:0;">${UI.escapeHtml(user.name)}</p>
          <p style="color:var(--bgi-text-secondary);margin:2px 0 0;font-size:12px;">${UI.escapeHtml(user.email)}</p>
          <p style="font-size:11px;color:var(--bgi-text-secondary);">${UI.escapeHtml(user.campus || '')} &bull; Super Admin</p>
        </div>
        <ion-list lines="inset" style="border-radius:12px;overflow:hidden;margin-bottom:12px;">
          <ion-item button id="setting-college-info" detail>
            <ion-icon name="business-outline" slot="start" color="primary" style="font-size:18px;"></ion-icon>
            <ion-label style="font-size:13px;">College Information</ion-label>
          </ion-item>
          <ion-item button id="setting-change-pwd" detail>
            <ion-icon name="key-outline" slot="start" color="warning" style="font-size:18px;"></ion-icon>
            <ion-label style="font-size:13px;">Change Password</ion-label>
          </ion-item>
          <ion-item button id="setting-backup" detail>
            <ion-icon name="cloud-download-outline" slot="start" color="success" style="font-size:18px;"></ion-icon>
            <ion-label style="font-size:13px;">Backup & Restore</ion-label>
          </ion-item>
          <ion-item button id="setting-audit" detail>
            <ion-icon name="newspaper-outline" slot="start" color="tertiary" style="font-size:18px;"></ion-icon>
            <ion-label style="font-size:13px;">Audit Logs</ion-label>
          </ion-item>
        </ion-list>
        <ion-button expand="block" fill="outline" color="danger" id="settings-logout-btn" style="font-size:13px;">
          <ion-icon name="log-out-outline" slot="start" style="font-size:16px;"></ion-icon> Logout
        </ion-button>
      `;
      document.getElementById('settings-logout-btn').addEventListener('click', () => { Auth.logout(); Router.reset('login'); });
      document.getElementById('setting-change-pwd').addEventListener('click', () => this._changePasswordModal());
      document.getElementById('setting-audit').addEventListener('click', () => this._showAuditLogs());
      document.getElementById('setting-college-info').addEventListener('click', () => this._collegeInfoModal());
      document.getElementById('setting-backup').addEventListener('click', () => UI.toast('Backup feature coming soon', 'warning'));
    } catch (e) { body.innerHTML = `<p class="empty-state" style="font-size:12px;">${UI.escapeHtml(e.message)}</p>`; }
  },

  async _changePasswordModal() {
    const modal = document.createElement('ion-modal');
    modal.innerHTML = `
      <ion-header><ion-toolbar>
        <ion-title style="font-size:15px;">Change Password</ion-title>
        <ion-buttons slot="end"><ion-button id="cp-close" style="font-size:13px;">Close</ion-button></ion-buttons>
      </ion-toolbar></ion-header>
      <ion-content class="ion-padding">
        <ion-list lines="none">
          <ion-item style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;"><ion-label position="stacked" style="font-size:12px;">Current Password</ion-label><ion-input id="cp-current" type="password" style="font-size:13px;"></ion-input></ion-item>
          <ion-item style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;"><ion-label position="stacked" style="font-size:12px;">New Password</ion-label><ion-input id="cp-new" type="password" style="font-size:13px;"></ion-input></ion-item>
          <ion-item style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:12px;"><ion-label position="stacked" style="font-size:12px;">Confirm New Password</ion-label><ion-input id="cp-confirm" type="password" style="font-size:13px;"></ion-input></ion-item>
        </ion-list>
        <ion-button expand="block" id="cp-submit" style="font-size:13px;"><ion-icon name="key-outline" slot="start"></ion-icon>Update Password</ion-button>
      </ion-content>
    `;
    document.body.appendChild(modal);
    await modal.present();
    modal.querySelector('#cp-close').addEventListener('click', () => modal.dismiss());
    modal.querySelector('#cp-submit').addEventListener('click', async () => {
      const current = modal.querySelector('#cp-current').value;
      const newPwd = modal.querySelector('#cp-new').value;
      const confirm = modal.querySelector('#cp-confirm').value;
      if (!current || !newPwd || !confirm) return UI.toast('All fields required', 'warning');
      if (newPwd !== confirm) return UI.toast('Passwords do not match', 'danger');
      try { await Api.put('/auth/change-password', { currentPassword: current, newPassword: newPwd }); UI.toast('Password updated'); modal.dismiss(); }
      catch (e) { UI.toast(e.message || 'Failed', 'danger'); }
    });
  },

  async _collegeInfoModal() {
    let info = {};
    try { const res = await Api.get('/admin/college-info'); info = res.data || {}; } catch (_) {}
    const modal = document.createElement('ion-modal');
    modal.innerHTML = `
      <ion-header><ion-toolbar>
        <ion-title style="font-size:15px;">College Information</ion-title>
        <ion-buttons slot="end"><ion-button id="ci-close" style="font-size:13px;">Close</ion-button></ion-buttons>
      </ion-toolbar></ion-header>
      <ion-content class="ion-padding">
        <ion-list lines="none">
          <ion-item style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;"><ion-label position="stacked" style="font-size:12px;">College Name</ion-label><ion-input id="ci-name" value="${UI.escapeHtml(info.name || '')}" style="font-size:13px;"></ion-input></ion-item>
          <ion-item style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;"><ion-label position="stacked" style="font-size:12px;">Address</ion-label><ion-input id="ci-address" value="${UI.escapeHtml(info.address || '')}" style="font-size:13px;"></ion-input></ion-item>
          <ion-item style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:12px;"><ion-label position="stacked" style="font-size:12px;">Contact Email</ion-label><ion-input id="ci-email" type="email" value="${UI.escapeHtml(info.email || '')}" style="font-size:13px;"></ion-input></ion-item>
        </ion-list>
        <ion-button expand="block" id="ci-save" style="font-size:13px;"><ion-icon name="save-outline" slot="start"></ion-icon>Save</ion-button>
      </ion-content>
    `;
    document.body.appendChild(modal);
    await modal.present();
    modal.querySelector('#ci-close').addEventListener('click', () => modal.dismiss());
    modal.querySelector('#ci-save').addEventListener('click', async () => {
      try { await Api.put('/admin/college-info', { name: modal.querySelector('#ci-name').value, address: modal.querySelector('#ci-address').value, email: modal.querySelector('#ci-email').value }); UI.toast('Saved'); modal.dismiss(); }
      catch (e) { UI.toast(e.message || 'Failed', 'danger'); }
    });
  },

  async _showAuditLogs() {
    const modal = document.createElement('ion-modal');
    modal.innerHTML = `
      <ion-header><ion-toolbar>
        <ion-title style="font-size:15px;">Audit Logs</ion-title>
        <ion-buttons slot="end"><ion-button id="audit-modal-close" style="font-size:13px;">Close</ion-button></ion-buttons>
      </ion-toolbar></ion-header>
      <ion-content class="ion-padding"><div id="audit-log-content">${this._spinner()}</div></ion-content>
    `;
    document.body.appendChild(modal);
    await modal.present();
    modal.querySelector('#audit-modal-close').addEventListener('click', () => modal.dismiss());
    try {
      const res = await Api.get('/admin/audit-logs', { limit: 50 });
      const logs = res.data || [];
      const content = document.getElementById('audit-log-content');
      if (!logs.length) { content.innerHTML = '<p class="empty-state" style="font-size:12px;">No audit logs</p>'; return; }
      content.innerHTML = logs.map((log) => `
        <ion-card style="margin-bottom:6px;">
          <div style="padding:10px 12px;">
            <div style="font-weight:700;font-size:13px;">${UI.escapeHtml(log.user?.name || 'System')}</div>
            <div style="font-size:11px;color:var(--bgi-text-secondary);margin:3px 0;">${UI.escapeHtml(log.action?.replace(/_/g, ' ') || '')}</div>
            <div style="font-size:10px;color:var(--bgi-text-secondary);">${UI.formatDate(log.createdAt)}</div>
          </div>
        </ion-card>`).join('');
    } catch (e) { const c = document.getElementById('audit-log-content'); if (c) c.innerHTML = `<p class="empty-state" style="font-size:12px;">${UI.escapeHtml(e.message || 'Failed')}</p>`; }
  },

  async _showDepartmentReport(departments = []) {
    const modal = document.createElement('ion-modal');
    modal.innerHTML = `
      <ion-header><ion-toolbar>
        <ion-title style="font-size:15px;">Department Report</ion-title>
        <ion-buttons slot="end"><ion-button id="dept-modal-close" style="font-size:13px;">Close</ion-button></ion-buttons>
      </ion-toolbar></ion-header>
      <ion-content class="ion-padding">
        ${departments.length ? this._renderDepartmentBars(departments) : '<p class="empty-state" style="font-size:12px;">No department data</p>'}
      </ion-content>
    `;
    document.body.appendChild(modal);
    await modal.present();
    modal.querySelector('#dept-modal-close').addEventListener('click', () => modal.dismiss());
  },

  _spinner() {
    return `<div class="text-center mt-24"><ion-spinner color="primary"></ion-spinner></div>`;
  },
};

// Alias director dashboard to admin dashboard so directors use the same interface.
Pages['director-dashboard'] = Pages['admin-dashboard'];