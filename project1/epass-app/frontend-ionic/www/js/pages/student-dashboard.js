// =====================================================================
// E-PASS — Student Dashboard (Home / Requests / History / Profile tabs)
// With Profile Photo Upload & Edit
// =====================================================================

Pages['student-dashboard'] = {
  _activeTab: 'home',
  _requestsFilter: 'All',
  _profilePhotoFile: null,

  render() {
    this._activeTab = 'home';
    this._profilePhotoFile = null;
    return `
      <ion-header><ion-toolbar>
        <div slot="start" style="padding-left:12px;display:flex;align-items:center;">
          <img src="assets/images/logo.png" alt="BGI Logo"
               style="height:36px;width:auto;object-fit:contain;"
               onerror="this.style.display='none'" />
        </div>
        <ion-title id="dash-title" style="text-align:center;font-size:16px;">Student Dashboard</ion-title>
        <ion-buttons slot="end" id="dash-header-actions"></ion-buttons>
      </ion-toolbar></ion-header>
      <ion-content fullscreen><div id="dash-body" class="ion-padding"></div></ion-content>
      <ion-tab-bar id="dash-tabbar">
        <ion-tab-button data-tab="home" class="active"><ion-icon name="home-outline"></ion-icon><ion-label>Home</ion-label></ion-tab-button>
        <ion-tab-button data-tab="requests"><ion-icon name="document-text-outline"></ion-icon><ion-label>Requests</ion-label></ion-tab-button>
        <ion-tab-button data-tab="history"><ion-icon name="time-outline"></ion-icon><ion-label>History</ion-label></ion-tab-button>
        <ion-tab-button data-tab="profile"><ion-icon name="person-outline"></ion-icon><ion-label>Profile</ion-label></ion-tab-button>
      </ion-tab-bar>
    `;
  },

  afterRender() {
    document.querySelectorAll('#dash-tabbar ion-tab-button').forEach((btn) => {
      btn.addEventListener('click', () => this._switchTab(btn.dataset.tab));
    });
    this._switchTab('home');
  },

  _switchTab(tab) {
    this._activeTab = tab;
    document.querySelectorAll('#dash-tabbar ion-tab-button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    const titles = { home: 'Student Dashboard', requests: 'My Requests', history: 'Leave History', profile: 'Profile' };
    document.getElementById('dash-title').textContent = titles[tab];

    const actions = document.getElementById('dash-header-actions');
    actions.innerHTML = tab === 'home'
      ? `<ion-button id="notif-bell-btn"><ion-icon name="notifications-outline" slot="icon-only"></ion-icon></ion-button>`
      : '';
    if (tab === 'home') {
      document.getElementById('notif-bell-btn').addEventListener('click', () => Router.navigate('notifications'));
    }

    if (tab === 'home') this._loadHome();
    else if (tab === 'requests') this._loadRequests();
    else if (tab === 'history') this._loadHistory();
    else if (tab === 'profile') this._loadProfile();
  },

  async _loadHome() {
    const body = document.getElementById('dash-body');
    body.innerHTML = `<div class="text-center mt-24"><ion-spinner color="primary"></ion-spinner></div>`;
    try {
      const [user, historyRes, unreadRes] = await Promise.all([
        Auth.fetchProfile(),
        Api.get('/leave/history'),
        Api.get('/notifications/unread-count'),
      ]);
      const requests = historyRes.data || [];
      const counts = { total: requests.length, approved: 0, pending: 0, rejected: 0 };
      requests.forEach((r) => {
        if (r.overall_status === 'Approved') counts.approved++;
        else if (r.overall_status === 'Rejected') counts.rejected++;
        else counts.pending++;
      });
      const unread = unreadRes.data?.count || 0;

      body.innerHTML = `
        <ion-card class="welcome-card">
          <div class="welcome-avatar" id="welcome-avatar">
            ${user.profile?.photo ? 
              `<img src="${UI.escapeHtml(user.profile.photo)}" style="width:46px;height:46px;border-radius:50%;object-fit:cover;" />` :
              `<ion-icon name="person"></ion-icon>`
            }
          </div>
          <div>
            <div class="welcome-name">Welcome, ${UI.escapeHtml(user.name)}</div>
            <div class="welcome-meta">Roll No. ${UI.escapeHtml(user.profile?.roll_number || '-')}</div>
            <div class="welcome-meta">${UI.escapeHtml(user.profile?.branch || '')} ${user.profile?.semester ? '- Sem ' + user.profile.semester : ''}</div>
          </div>
        </ion-card>

        <div class="action-grid">
          <ion-card class="action-tile" id="tile-apply-leave">
            <ion-icon name="create-outline"></ion-icon>
            <div class="action-tile-label">Apply Leave</div>
            <div class="action-tile-sub">Request for leave</div>
          </ion-card>
          <ion-card class="action-tile" id="tile-my-requests">
            <ion-icon name="list-outline"></ion-icon>
            <div class="action-tile-label">My Requests</div>
            <div class="action-tile-sub">View your leave status</div>
          </ion-card>
          <ion-card class="action-tile" id="tile-leave-history">
            <ion-icon name="time-outline"></ion-icon>
            <div class="action-tile-label">Leave History</div>
            <div class="action-tile-sub">Past leave details</div>
          </ion-card>
          <ion-card class="action-tile" id="tile-notifications">
            ${unread > 0 ? `<div class="action-tile-badge">${unread}</div>` : ''}
            <ion-icon name="notifications-outline"></ion-icon>
            <div class="action-tile-label">Notifications</div>
            <div class="action-tile-sub">View all notifications</div>
          </ion-card>
        </div>

        <ion-card>
          <div class="ion-padding">
            <p style="font-weight:600;margin:0 0 4px;">Leave Status Overview</p>
            <div class="stats-row">
              <div class="stat-col"><div class="stat-value">${counts.total}</div><div class="stat-label">Total</div></div>
              <div class="stat-col"><div class="stat-value" style="color:var(--bgi-success)">${counts.approved}</div><div class="stat-label">Approved</div></div>
              <div class="stat-col"><div class="stat-value" style="color:var(--bgi-warning)">${counts.pending}</div><div class="stat-label">Pending</div></div>
              <div class="stat-col"><div class="stat-value" style="color:var(--bgi-danger)">${counts.rejected}</div><div class="stat-label">Rejected</div></div>
            </div>
          </div>
        </ion-card>

        <div class="notice-banner mt-16">
          <ion-icon name="megaphone-outline"></ion-icon>
          <p><b>Important Notice:</b> All students must apply for leave at least 1 day before the leave.</p>
        </div>
      `;

      document.getElementById('tile-apply-leave').addEventListener('click', () => this._showApplyLeaveModal());
      document.getElementById('tile-my-requests').addEventListener('click', () => this._switchTab('requests'));
      document.getElementById('tile-leave-history').addEventListener('click', () => this._switchTab('history'));
      document.getElementById('tile-notifications').addEventListener('click', () => Router.navigate('notifications'));
    } catch (e) {
      body.innerHTML = `<p class="empty-state">${UI.escapeHtml(e.message)}</p>`;
    }
  },

  // ===================================================================
  // APPLY LEAVE MODAL (With Toggle Arrow for Date/Time)
  // ===================================================================
  _showApplyLeaveModal() {
    const modal = document.createElement('ion-modal');
    modal.cssText = '--height:auto;--width:100%;--max-height:95%;--border-radius:16px;';
    modal.innerHTML = `
      <ion-header>
        <ion-toolbar style="--background:var(--bgi-primary);--color:#fff;--min-height:44px;">
          <ion-title style="font-size:14px;font-weight:600;padding:0;">
            <ion-icon name="create-outline" style="margin-right:6px;font-size:16px;"></ion-icon> Apply Leave
          </ion-title>
          <ion-buttons slot="end">
            <ion-button id="apply-close-btn" style="color:#fff;font-size:18px;font-weight:300;--padding-start:8px;--padding-end:8px;">✕</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding" style="--background:var(--bgi-bg);--padding-top:8px;--padding-bottom:8px;">
        <div style="max-width:450px;margin:0 auto;">
          
          <!-- Reason -->
          <div style="background:var(--bgi-surface);border-radius:10px;border:1px solid var(--bgi-border);padding:2px 12px 4px;margin-bottom:8px;">
            <label style="font-size:10px;font-weight:700;color:var(--bgi-text-secondary);display:block;padding-top:4px;letter-spacing:0.3px;text-transform:uppercase;">📝 Reason *</label>
            <ion-textarea id="leave-reason" placeholder="e.g. Family function, Medical emergency..." style="font-size:14px;font-weight:600;color:var(--bgi-text);--padding-top:2px;--padding-bottom:2px;min-height:42px;--placeholder-color:var(--bgi-text-secondary);--placeholder-opacity:0.6;"></ion-textarea>
          </div>

          <!-- Date - With Toggle Arrow -->
          <div style="margin-bottom:6px;">
            <div style="background:var(--bgi-surface);border-radius:10px;border:1px solid var(--bgi-border);padding:2px 12px 4px;margin-bottom:6px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <label style="font-size:10px;font-weight:700;color:var(--bgi-text-secondary);display:block;padding-top:4px;letter-spacing:0.3px;text-transform:uppercase;">📅 Leave Date *</label>
                <ion-button id="toggle-date-btn" fill="clear" size="small" style="font-size:14px;--padding-start:4px;--padding-end:4px;height:24px;margin:0;color:var(--bgi-primary);">
                  <ion-icon id="date-arrow-icon" name="chevron-down-outline" style="font-size:18px;"></ion-icon>
                </ion-button>
              </div>
              <div id="date-picker-container" style="display:none;margin-top:4px;">
                <ion-datetime id="leave-date" presentation="date" style="font-size:13px;font-weight:500;--padding-top:0;--padding-bottom:2px;color:var(--bgi-text);--background:var(--bgi-surface);border-radius:8px;"></ion-datetime>
              </div>
              <div id="date-display" style="font-size:13px;font-weight:500;color:var(--bgi-text);padding:4px 0 2px;"></div>
            </div>
          </div>

          <!-- Entry Time - With Toggle Arrow -->
          <div style="margin-bottom:6px;">
            <div style="background:var(--bgi-surface);border-radius:10px;border:1px solid var(--bgi-border);padding:2px 12px 4px;margin-bottom:6px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <label style="font-size:10px;font-weight:700;color:var(--bgi-text-secondary);display:block;padding-top:4px;letter-spacing:0.3px;text-transform:uppercase;">🚪 Entry Time *</label>
                <ion-button id="toggle-entry-btn" fill="clear" size="small" style="font-size:14px;--padding-start:4px;--padding-end:4px;height:24px;margin:0;color:var(--bgi-primary);">
                  <ion-icon id="entry-arrow-icon" name="chevron-down-outline" style="font-size:18px;"></ion-icon>
                </ion-button>
              </div>
              <div id="entry-picker-container" style="display:none;margin-top:4px;">
                <ion-datetime id="entry-time" presentation="time" style="font-size:13px;font-weight:500;--padding-top:0;--padding-bottom:2px;color:var(--bgi-text);--background:var(--bgi-surface);border-radius:8px;"></ion-datetime>
              </div>
              <div id="entry-display" style="font-size:13px;font-weight:500;color:var(--bgi-text);padding:4px 0 2px;"></div>
            </div>
          </div>

          <!-- Exit Time - With Toggle Arrow -->
          <div style="margin-bottom:8px;">
            <div style="background:var(--bgi-surface);border-radius:10px;border:1px solid var(--bgi-border);padding:2px 12px 4px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <label style="font-size:10px;font-weight:700;color:var(--bgi-text-secondary);display:block;padding-top:4px;letter-spacing:0.3px;text-transform:uppercase;">🔙 Exit Time *</label>
                <ion-button id="toggle-exit-btn" fill="clear" size="small" style="font-size:14px;--padding-start:4px;--padding-end:4px;height:24px;margin:0;color:var(--bgi-primary);">
                  <ion-icon id="exit-arrow-icon" name="chevron-down-outline" style="font-size:18px;"></ion-icon>
                </ion-button>
              </div>
              <div id="exit-picker-container" style="display:none;margin-top:4px;">
                <ion-datetime id="exit-time" presentation="time" style="font-size:13px;font-weight:500;--padding-top:0;--padding-bottom:2px;color:var(--bgi-text);--background:var(--bgi-surface);border-radius:8px;"></ion-datetime>
              </div>
              <div id="exit-display" style="font-size:13px;font-weight:500;color:var(--bgi-text);padding:4px 0 2px;"></div>
            </div>
          </div>

          <!-- Medical Upload -->
          <div style="background:var(--bgi-surface);border-radius:10px;border:1px solid var(--bgi-border);padding:4px 12px 6px;margin-bottom:8px;">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <label style="font-size:10px;font-weight:700;color:var(--bgi-text-secondary);letter-spacing:0.3px;text-transform:uppercase;">🏥 Medical</label>
              <ion-button id="upload-medical-btn" fill="outline" size="small" style="font-size:10px;--padding-start:6px;--padding-end:6px;height:24px;font-weight:600;">
                <ion-icon name="cloud-upload-outline" style="font-size:12px;"></ion-icon> Upload
              </ion-button>
              <span id="medical-file-name" style="font-size:10px;color:var(--bgi-text-secondary);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">Optional</span>
              <input type="file" id="medical-file-input" accept="image/*,.pdf" style="display:none;" />
              <ion-button id="remove-medical-btn" fill="clear" size="small" style="font-size:12px;color:var(--bgi-danger);display:none;height:22px;min-width:22px;padding:0;">
                <ion-icon name="close-circle" style="font-size:16px;"></ion-icon>
              </ion-button>
            </div>
            <div id="medical-preview" style="display:none;margin-top:4px;border-radius:6px;overflow:hidden;border:1px solid var(--bgi-border);">
              <img id="medical-preview-img" style="width:100%;max-height:60px;object-fit:contain;background:#f5f5f5;" />
            </div>
          </div>

          <div id="apply-error" style="display:none;background:rgba(239,68,68,0.08);border:1px solid var(--bgi-danger);border-radius:8px;padding:6px 10px;margin-bottom:8px;font-size:11px;color:var(--bgi-danger);"></div>

          <ion-button expand="block" id="apply-submit-btn" style="--border-radius:10px;height:38px;font-weight:700;font-size:13px;--box-shadow:none;margin-top:2px;">
            <ion-icon name="send-outline" slot="start" style="font-size:15px;"></ion-icon> Submit Request
          </ion-button>
        </div>
      </ion-content>
    `;
    document.body.appendChild(modal);
    modal.present();

    let selectedMedicalFile = null;

    // --- Toggle Functions ---
    function togglePicker(pickerId, displayId, arrowId) {
      const picker = modal.querySelector(pickerId);
      const display = modal.querySelector(displayId);
      const arrow = modal.querySelector(arrowId);
      
      if (picker.style.display === 'none') {
        picker.style.display = 'block';
        arrow.name = 'chevron-up-outline';
        // Auto-select when opened
        setTimeout(() => {
          const datetime = picker.querySelector('ion-datetime');
          if (datetime && datetime.value) {
            const val = datetime.value;
            // Format display
            if (pickerId === '#date-picker-container') {
              const d = new Date(val);
              display.textContent = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            } else {
              const parts = val.split(':');
              const hour = parseInt(parts[0]);
              const minute = parts[1];
              const ampm = hour >= 12 ? 'PM' : 'AM';
              const hour12 = hour % 12 || 12;
              display.textContent = `${hour12}:${minute} ${ampm}`;
            }
          }
        }, 100);
      } else {
        picker.style.display = 'none';
        arrow.name = 'chevron-down-outline';
      }
    }

    // Date toggle
    modal.querySelector('#toggle-date-btn').addEventListener('click', () => {
      togglePicker('#date-picker-container', '#date-display', '#date-arrow-icon');
    });

    // Entry Time toggle
    modal.querySelector('#toggle-entry-btn').addEventListener('click', () => {
      togglePicker('#entry-picker-container', '#entry-display', '#entry-arrow-icon');
    });

    // Exit Time toggle
    modal.querySelector('#toggle-exit-btn').addEventListener('click', () => {
      togglePicker('#exit-picker-container', '#exit-display', '#exit-arrow-icon');
    });

    // --- Set Defaults ---
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Set date picker and display
    const datePicker = modal.querySelector('#leave-date');
    if (datePicker) {
      datePicker.value = todayStr;
      const display = modal.querySelector('#date-display');
      if (display) {
        display.textContent = today.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }

    // Set time defaults
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const defaultTime = `${hh}:${mm}`;
    
    // Format time for display
    const hour = now.getHours();
    const minute = String(now.getMinutes()).padStart(2, '0');
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    const timeDisplay = `${hour12}:${minute} ${ampm}`;

    const entryTime = modal.querySelector('#entry-time');
    if (entryTime) {
      entryTime.value = defaultTime;
      const display = modal.querySelector('#entry-display');
      if (display) display.textContent = timeDisplay;
    }

    const exitTime = modal.querySelector('#exit-time');
    if (exitTime) {
      const exitDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const exitHh = String(exitDate.getHours()).padStart(2, '0');
      const exitMm = String(exitDate.getMinutes()).padStart(2, '0');
      exitTime.value = `${exitHh}:${exitMm}`;
      
      const exitHour = exitDate.getHours();
      const exitMinute = String(exitDate.getMinutes()).padStart(2, '0');
      const exitAmpm = exitHour >= 12 ? 'PM' : 'AM';
      const exitHour12 = exitHour % 12 || 12;
      const display = modal.querySelector('#exit-display');
      if (display) display.textContent = `${exitHour12}:${exitMinute} ${exitAmpm}`;
    }

    // --- Auto-update display when date/time changes ---
    modal.querySelector('#leave-date').addEventListener('ionChange', (e) => {
      const val = e.detail.value;
      if (val) {
        const d = new Date(val);
        const display = modal.querySelector('#date-display');
        if (display) {
          display.textContent = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        }
      }
    });

    modal.querySelector('#entry-time').addEventListener('ionChange', (e) => {
      const val = e.detail.value;
      if (val) {
        const parts = val.split(':');
        const hour = parseInt(parts[0]);
        const minute = parts[1];
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        const display = modal.querySelector('#entry-display');
        if (display) display.textContent = `${hour12}:${minute} ${ampm}`;
      }
    });

    modal.querySelector('#exit-time').addEventListener('ionChange', (e) => {
      const val = e.detail.value;
      if (val) {
        const parts = val.split(':');
        const hour = parseInt(parts[0]);
        const minute = parts[1];
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        const display = modal.querySelector('#exit-display');
        if (display) display.textContent = `${hour12}:${minute} ${ampm}`;
      }
    });

    // Medical upload
    const fileInput = modal.querySelector('#medical-file-input');
    const fileName = modal.querySelector('#medical-file-name');
    const preview = modal.querySelector('#medical-preview');
    const previewImg = modal.querySelector('#medical-preview-img');
    const removeBtn = modal.querySelector('#remove-medical-btn');

    modal.querySelector('#upload-medical-btn').addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      selectedMedicalFile = file;
      fileName.textContent = file.name.substring(0, 20) + (file.name.length > 20 ? '...' : '');
      removeBtn.style.display = 'inline-flex';
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          previewImg.src = ev.target.result;
          preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      } else {
        preview.style.display = 'block';
        previewImg.src = '';
        previewImg.style.display = 'none';
      }
    });

    removeBtn.addEventListener('click', () => {
      selectedMedicalFile = null;
      fileInput.value = '';
      fileName.textContent = 'Optional';
      preview.style.display = 'none';
      removeBtn.style.display = 'none';
      previewImg.style.display = 'block';
    });

    modal.querySelector('#apply-close-btn').addEventListener('click', () => modal.dismiss());

    modal.querySelector('#apply-submit-btn').addEventListener('click', async () => {
      const reason = modal.querySelector('#leave-reason').value?.trim();
      const entryTimeVal = modal.querySelector('#entry-time').value;
      const exitTimeVal = modal.querySelector('#exit-time').value;
      const leaveDate = modal.querySelector('#leave-date').value;
      const errorEl = modal.querySelector('#apply-error');

      if (!reason) { 
        errorEl.style.display = 'block'; 
        errorEl.textContent = '⚠️ Please enter a reason for leave'; 
        return; 
      }
      if (!entryTimeVal) { 
        errorEl.style.display = 'block'; 
        errorEl.textContent = '⚠️ Please select entry time'; 
        return; 
      }
      if (!exitTimeVal) { 
        errorEl.style.display = 'block'; 
        errorEl.textContent = '⚠️ Please select exit time'; 
        return; 
      }
      if (!leaveDate) { 
        errorEl.style.display = 'block'; 
        errorEl.textContent = '⚠️ Please select leave date'; 
        return; 
      }

      errorEl.style.display = 'none';
      const btn = modal.querySelector('#apply-submit-btn');
      btn.disabled = true;
      btn.innerHTML = '<ion-spinner style="width:16px;height:16px;"></ion-spinner> Submitting...';

      try {
        const formData = new FormData();
        formData.append('reason', reason);
        formData.append('entryTime', entryTimeVal);
        formData.append('exitTime', exitTimeVal);
        formData.append('leaveDate', leaveDate);
        if (selectedMedicalFile) formData.append('medicalCertificate', selectedMedicalFile);

        let response;
        if (selectedMedicalFile) {
          const token = Storage.getToken();
          const res = await fetch(`${APP_CONFIG.baseUrl}/leave/apply`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          });
          response = await res.json();
          if (!res.ok) throw new Error(response.message || 'Failed');
        } else {
          response = await Api.post('/leave/apply', { 
            reason, 
            entryTime: entryTimeVal, 
            exitTime: exitTimeVal, 
            leaveDate 
          });
        }

        await UI.toast('✅ Leave request submitted!', 'success');
        modal.dismiss();
        this._loadHome();
      } catch (e) {
        errorEl.style.display = 'block';
        errorEl.textContent = e.message || '❌ Failed to apply. Try again.';
        btn.disabled = false;
        btn.innerHTML = '<ion-icon name="send-outline" slot="start" style="font-size:15px;"></ion-icon> Submit Request';
      }
    });
  },

  async _loadRequests() {
    const body = document.getElementById('dash-body');
    const statuses = ['All', 'Pending', 'Approved', 'Rejected'];
    body.innerHTML = `
      <ion-segment value="${this._requestsFilter}" id="requests-segment" scrollable>
        ${statuses.map((s) => `<ion-segment-button value="${s}"><ion-label>${s}</ion-label></ion-segment-button>`).join('')}
      </ion-segment>
      <div id="requests-list" class="mt-16"><div class="text-center mt-24"><ion-spinner color="primary"></ion-spinner></div></div>
    `;
    document.getElementById('requests-segment').addEventListener('ionChange', (e) => {
      this._requestsFilter = e.detail.value;
      this._renderRequestsList();
    });
    await this._renderRequestsList();
  },

  async _renderRequestsList() {
    const list = document.getElementById('requests-list');
    list.innerHTML = `<div class="text-center mt-24"><ion-spinner color="primary"></ion-spinner></div>`;
    try {
      const res = await Api.get('/leave/my-requests', { status: this._requestsFilter });
      const requests = res.data || [];
      if (requests.length === 0) {
        list.innerHTML = `<p class="empty-state">No leave requests found</p>`;
        return;
      }
      list.innerHTML = requests.map((r) => UI.leaveCardHtml(r, { clickableIfApproved: true })).join('');
      UI.attachLeaveCardHandlers(list, { onCardClick: (id) => Router.navigate('epass', { leaveRequestId: id }) });
    } catch (e) {
      list.innerHTML = `<p class="empty-state">${UI.escapeHtml(e.message)}</p>`;
    }
  },

  async _loadHistory() {
    const body = document.getElementById('dash-body');
    body.innerHTML = `<div class="text-center mt-24"><ion-spinner color="primary"></ion-spinner></div>`;
    try {
      const res = await Api.get('/leave/history');
      const requests = res.data || [];
      body.innerHTML = requests.length === 0
        ? `<p class="empty-state">No leave history yet</p>`
        : requests.map((r) => UI.leaveCardHtml(r, { clickableIfApproved: true })).join('');
      UI.attachLeaveCardHandlers(body, { onCardClick: (id) => Router.navigate('epass', { leaveRequestId: id }) });
    } catch (e) {
      body.innerHTML = `<p class="empty-state">${UI.escapeHtml(e.message)}</p>`;
    }
  },

  // ===================================================================
  // PROFILE TAB
  // ===================================================================
  async _loadProfile() {
    const body = document.getElementById('dash-body');
    body.innerHTML = `<div class="text-center mt-24"><ion-spinner color="primary"></ion-spinner></div>`;
    try {
      const user = await Auth.fetchProfile();
      const photoUrl = user.profile?.photo || '';

      const rows = [
        ['Role', 'Student'],
        ['Department', user.department || '-'],
        ['Roll Number', user.profile?.roll_number || '-'],
        ['Branch', user.profile?.branch || '-'],
        ['Semester', user.profile?.semester || '-'],
        ['Phone', user.phone || '-'],
        ['Email', user.email || '-'],
      ];

      body.innerHTML = `
        <div class="text-center mt-16">
          <div style="position:relative;display:inline-block;">
            <div class="welcome-avatar" style="width:80px;height:80px;margin:0 auto 8px;border-radius:50%;background:rgba(var(--bgi-primary-rgb),0.1);display:flex;align-items:center;justify-content:center;overflow:hidden;border:3px solid var(--bgi-primary);">
              ${photoUrl ? 
                `<img src="${UI.escapeHtml(photoUrl)}" style="width:100%;height:100%;object-fit:cover;" id="profile-photo-img" />` :
                `<ion-icon name="person" style="font-size:40px;color:var(--bgi-primary);"></ion-icon>`
              }
            </div>
            <ion-button id="edit-photo-btn" style="position:absolute;bottom:-2px;right:-2px;--padding-start:6px;--padding-end:6px;--padding-top:2px;--padding-bottom:2px;--border-radius:50%;--min-height:28px;--min-width:28px;height:28px;width:28px;font-size:12px;">
              <ion-icon name="camera-outline" style="font-size:14px;"></ion-icon>
            </ion-button>
            <input type="file" id="profile-photo-input" accept="image/*" style="display:none;" />
          </div>
          <p style="font-weight:700;font-size:16px;margin:4px 0 0;">${UI.escapeHtml(user.name)}</p>
          <p style="color:var(--bgi-text-secondary);margin:0;font-size:12px;">${UI.escapeHtml(user.email)}</p>
          <p style="color:var(--bgi-text-secondary);margin:0;font-size:11px;">${UI.escapeHtml(user.profile?.branch || '')} ${user.profile?.semester ? '- Sem ' + user.profile.semester : ''}</p>
        </div>

        <ion-card class="mt-16">
          <ion-list lines="inset">
            ${rows.map(([l, v]) => `
              <ion-item style="font-size:13px;--min-height:36px;"><ion-label>${l}</ion-label><ion-note slot="end">${UI.escapeHtml(String(v))}</ion-note></ion-item>
            `).join('')}
          </ion-list>
        </ion-card>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;">
          <ion-button expand="block" fill="outline" id="edit-profile-btn" style="font-size:12px;height:40px;">
            <ion-icon name="create-outline" slot="start" style="font-size:14px;"></ion-icon> Edit
          </ion-button>
          <ion-button expand="block" fill="outline" id="change-password-btn" style="font-size:12px;height:40px;">
            <ion-icon name="key-outline" slot="start" style="font-size:14px;"></ion-icon> Password
          </ion-button>
        </div>

        <ion-button expand="block" fill="outline" color="danger" class="mt-8" id="logout-btn" style="font-size:12px;height:40px;">
          <ion-icon name="log-out-outline" slot="start" style="font-size:14px;"></ion-icon> Logout
        </ion-button>

        <div id="photo-upload-overlay" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9999;display:none;align-items:center;justify-content:center;flex-direction:column;gap:12px;">
          <ion-spinner name="crescent" color="light" style="width:40px;height:40px;"></ion-spinner>
          <p style="color:#fff;font-size:14px;">Uploading...</p>
        </div>
      `;

      document.getElementById('edit-photo-btn').addEventListener('click', () => {
        document.getElementById('profile-photo-input').click();
      });

      document.getElementById('profile-photo-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        this._handleProfilePhotoUpload(file);
      });

      document.getElementById('edit-profile-btn').addEventListener('click', () => {
        this._showEditProfileModal(user);
      });

      document.getElementById('change-password-btn').addEventListener('click', () => {
        this._showChangePasswordModal();
      });

      document.getElementById('logout-btn').addEventListener('click', () => {
        Auth.logout();
        Router.reset('login');
      });

    } catch (e) {
      body.innerHTML = `<p class="empty-state">${UI.escapeHtml(e.message)}</p>`;
    }
  },

  // ---- Profile Photo Upload ----
  async _handleProfilePhotoUpload(file) {
    const overlay = document.getElementById('photo-upload-overlay');
    if (overlay) overlay.style.display = 'flex';

    try {
      const compressedFile = await this._compressImage(file, 800, 0.7);
      const formData = new FormData();
      formData.append('photo', compressedFile);

      const res = await fetch(`${APP_CONFIG.baseUrl}/user/profile/photo`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${Storage.getToken()}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');

      const img = document.getElementById('profile-photo-img');
      if (img) {
        const reader = new FileReader();
        reader.onload = (e) => img.src = e.target.result;
        reader.readAsDataURL(compressedFile);
      }

      const welcomeAvatar = document.querySelector('#welcome-avatar img');
      if (welcomeAvatar) {
        const reader = new FileReader();
        reader.onload = (e) => welcomeAvatar.src = e.target.result;
        reader.readAsDataURL(compressedFile);
      }

      const user = await Auth.fetchProfile();
      if (user) {
        user.profile.photo = data.data?.photo || '';
        Storage.saveUser(user);
      }

      await UI.toast('Photo updated!', 'success');
    } catch (e) {
      await UI.toast(e.message || 'Failed', 'danger');
    } finally {
      if (overlay) overlay.style.display = 'none';
    }
  },

  _compressImage(file, maxDimension = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read image'));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error('Could not load image'));
        img.onload = () => {
          let { width, height } = img;
          if (width > height && width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error('Compression failed'));
              const fileName = (file.name || 'photo').replace(/\.[^.]+$/, '') + '.jpg';
              resolve(new File([blob], fileName, { type: 'image/jpeg' }));
            },
            'image/jpeg',
            quality
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  },

  // ---- Edit Profile Modal ----
  _showEditProfileModal(user) {
    const modal = document.createElement('ion-modal');
    modal.cssText = '--height:auto;--width:100%;--max-height:90%;';
    modal.innerHTML = `
      <ion-header>
        <ion-toolbar>
          <ion-title style="font-size:15px;">Edit Profile</ion-title>
          <ion-buttons slot="end">
            <ion-button id="edit-profile-close" style="font-size:13px;">Close</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <ion-list lines="none" style="padding:0;">
          <ion-item style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;--min-height:44px;">
            <ion-label position="stacked" style="font-size:11px;">Full Name</ion-label>
            <ion-input id="edit-name" value="${UI.escapeHtml(user.name || '')}" style="font-size:13px;"></ion-input>
          </ion-item>
          <ion-item style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;--min-height:44px;">
            <ion-label position="stacked" style="font-size:11px;">Phone</ion-label>
            <ion-input id="edit-phone" type="tel" value="${UI.escapeHtml(user.phone || '')}" style="font-size:13px;"></ion-input>
          </ion-item>
          <ion-item style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;--min-height:44px;">
            <ion-label position="stacked" style="font-size:11px;">Branch</ion-label>
            <ion-input id="edit-branch" value="${UI.escapeHtml(user.profile?.branch || '')}" style="font-size:13px;"></ion-input>
          </ion-item>
          <ion-item style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;--min-height:44px;">
            <ion-label position="stacked" style="font-size:11px;">Semester</ion-label>
            <ion-input id="edit-semester" type="number" value="${user.profile?.semester || ''}" style="font-size:13px;"></ion-input>
          </ion-item>
          <ion-item style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:12px;--min-height:44px;">
            <ion-label position="stacked" style="font-size:11px;">Roll Number</ion-label>
            <ion-input id="edit-roll" value="${UI.escapeHtml(user.profile?.roll_number || '')}" style="font-size:13px;"></ion-input>
          </ion-item>
        </ion-list>
        <ion-button expand="block" id="edit-profile-save" style="--border-radius:10px;height:42px;font-size:13px;">
          <ion-icon name="save-outline" slot="start" style="font-size:14px;"></ion-icon> Save Changes
        </ion-button>
      </ion-content>
    `;
    document.body.appendChild(modal);
    modal.present();

    modal.querySelector('#edit-profile-close').addEventListener('click', () => modal.dismiss());

    modal.querySelector('#edit-profile-save').addEventListener('click', async () => {
      const name = modal.querySelector('#edit-name').value.trim();
      const phone = modal.querySelector('#edit-phone').value.trim();
      const branch = modal.querySelector('#edit-branch').value.trim();
      const semester = modal.querySelector('#edit-semester').value.trim();
      const rollNumber = modal.querySelector('#edit-roll').value.trim();

      if (!name) return UI.toast('Name is required', 'warning');

      try {
        const payload = { name, phone, profile: { branch, semester: semester ? parseInt(semester) : undefined, roll_number: rollNumber } };
        Object.keys(payload.profile).forEach(key => { if (!payload.profile[key]) delete payload.profile[key]; });
        await Api.put('/user/profile', payload);
        await UI.toast('Profile updated!', 'success');
        modal.dismiss();
        this._loadProfile();
        if (this._activeTab === 'home') this._loadHome();
      } catch (e) {
        await UI.toast(e.message || 'Failed', 'danger');
      }
    });
  },

  // ---- Change Password Modal ----
  _showChangePasswordModal() {
    const modal = document.createElement('ion-modal');
    modal.cssText = '--height:auto;--width:100%;--max-height:90%;';
    modal.innerHTML = `
      <ion-header>
        <ion-toolbar>
          <ion-title style="font-size:15px;">Change Password</ion-title>
          <ion-buttons slot="end">
            <ion-button id="cp-close" style="font-size:13px;">Close</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <ion-list lines="none" style="padding:0;">
          <ion-item style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;--min-height:44px;">
            <ion-label position="stacked" style="font-size:11px;">Current Password</ion-label>
            <ion-input id="cp-current" type="password" style="font-size:13px;"></ion-input>
          </ion-item>
          <ion-item style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:8px;--min-height:44px;">
            <ion-label position="stacked" style="font-size:11px;">New Password</ion-label>
            <ion-input id="cp-new" type="password" style="font-size:13px;"></ion-input>
          </ion-item>
          <ion-item style="border:1px solid var(--bgi-border);border-radius:10px;margin-bottom:12px;--min-height:44px;">
            <ion-label position="stacked" style="font-size:11px;">Confirm Password</ion-label>
            <ion-input id="cp-confirm" type="password" style="font-size:13px;"></ion-input>
          </ion-item>
        </ion-list>
        <div id="cp-match-indicator" style="font-size:11px;margin-bottom:10px;display:none;">
          <ion-icon name="checkmark-circle-outline" color="success"></ion-icon>
          <span style="color:var(--bgi-success);">Passwords match</span>
        </div>
        <ion-button expand="block" id="cp-submit" style="--border-radius:10px;height:42px;font-size:13px;">
          <ion-icon name="key-outline" slot="start" style="font-size:14px;"></ion-icon> Update Password
        </ion-button>
      </ion-content>
    `;
    document.body.appendChild(modal);
    modal.present();

    const newPwd = modal.querySelector('#cp-new');
    const confirmPwd = modal.querySelector('#cp-confirm');
    const indicator = modal.querySelector('#cp-match-indicator');

    if (newPwd && confirmPwd && indicator) {
      const checkMatch = () => {
        if (newPwd.value && confirmPwd.value && newPwd.value === confirmPwd.value) {
          indicator.style.display = 'block';
          indicator.querySelector('span').textContent = 'Passwords match ✅';
          indicator.querySelector('ion-icon').setAttribute('color', 'success');
        } else if (confirmPwd.value) {
          indicator.style.display = 'block';
          indicator.querySelector('span').textContent = 'Passwords do not match ❌';
          indicator.querySelector('ion-icon').setAttribute('color', 'danger');
        } else {
          indicator.style.display = 'none';
        }
      };
      newPwd.addEventListener('ionInput', checkMatch);
      confirmPwd.addEventListener('ionInput', checkMatch);
    }

    modal.querySelector('#cp-close').addEventListener('click', () => modal.dismiss());

    modal.querySelector('#cp-submit').addEventListener('click', async () => {
      const current = modal.querySelector('#cp-current').value;
      const newPwdVal = modal.querySelector('#cp-new').value;
      const confirm = modal.querySelector('#cp-confirm').value;

      if (!current || !newPwdVal || !confirm) return UI.toast('All fields required', 'warning');
      if (newPwdVal !== confirm) return UI.toast('Passwords do not match', 'danger');
      if (newPwdVal.length < 6) return UI.toast('Min 6 characters', 'warning');

      try {
        await Api.put('/auth/change-password', { currentPassword: current, newPassword: newPwdVal });
        await UI.toast('Password changed!', 'success');
        modal.dismiss();
      } catch (e) {
        await UI.toast(e.message || 'Failed', 'danger');
      }
    });
  },
};