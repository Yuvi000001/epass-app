// =====================================================================
// E-PASS — Add Member (Admin only)
// One form, fields adapt based on the selected role:
//   STUDENT -> Roll Number, Branch, Semester, Faculty Advisor
//   FACULTY -> Designation
//   HOD     -> (no extra fields)
//   GUARD   -> Assigned Gate
// =====================================================================

Pages['add-member'] = {
  _role: 'STUDENT',
  _facultyOptions: [],

  render(params) {
    this._role = (params && params.defaultRole) || 'STUDENT';
    return `
      <ion-header><ion-toolbar>
        <ion-buttons slot="start"><ion-back-button default-href="#" id="add-member-back-btn"></ion-back-button></ion-buttons>
        <ion-title>Add Member</ion-title>
      </ion-toolbar></ion-header>
      <ion-content class="ion-padding">

        <p style="font-weight:600;margin-bottom:8px;">Role</p>
        <ion-segment value="${this._role}" id="role-segment" scrollable class="mb-16">
          <ion-segment-button value="STUDENT"><ion-label>Student</ion-label></ion-segment-button>
          <ion-segment-button value="FACULTY"><ion-label>Faculty</ion-label></ion-segment-button>
          <ion-segment-button value="HOD"><ion-label>HOD</ion-label></ion-segment-button>
          <ion-segment-button value="GUARD"><ion-label>Guard</ion-label></ion-segment-button>
        </ion-segment>

        <p style="font-weight:600;">Full Name</p>
        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:12px;margin-bottom:14px;">
          <ion-icon name="person-outline" slot="start" color="medium"></ion-icon>
          <ion-input id="member-name" placeholder="e.g. John Doe"></ion-input>
        </ion-item>

        <p style="font-weight:600;">Email</p>
        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:12px;margin-bottom:14px;">
          <ion-icon name="mail-outline" slot="start" color="medium"></ion-icon>
          <ion-input id="member-email" type="email" placeholder="name@bgi.edu.in"></ion-input>
        </ion-item>

        <p style="font-weight:600;">Temporary Password</p>
        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:12px;margin-bottom:14px;">
          <ion-icon name="lock-closed-outline" slot="start" color="medium"></ion-icon>
          <ion-input id="member-password" type="text" placeholder="Min 6 characters"></ion-input>
        </ion-item>

        <p style="font-weight:600;">Phone</p>
        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:12px;margin-bottom:14px;">
          <ion-icon name="call-outline" slot="start" color="medium"></ion-icon>
          <ion-input id="member-phone" type="tel" placeholder="e.g. 9876543210"></ion-input>
        </ion-item>

        <p style="font-weight:600;">Department</p>
        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:12px;">
          <ion-icon name="business-outline" slot="start" color="medium"></ion-icon>
          <ion-input id="member-department" placeholder="e.g. CSE, ECE, ME"></ion-input>
        </ion-item>
        <div id="department-chips" style="margin:8px 0 14px;display:flex;flex-wrap:wrap;gap:6px;"></div>

        <div id="role-specific-fields"></div>

        <ion-button expand="block" class="mt-16" id="save-member-btn">
          <span id="save-btn-label">Add Member</span>
          <ion-spinner name="dots" slot="end" class="hidden" id="save-spinner"></ion-spinner>
        </ion-button>
      </ion-content>
    `;
  },

  async afterRender() {
    document.getElementById('add-member-back-btn').addEventListener('click', (e) => { e.preventDefault(); Router.goBack(); });

    document.getElementById('role-segment').addEventListener('ionChange', (e) => {
      this._role = e.detail.value;
      this._renderRoleFields();
    });

    document.getElementById('save-member-btn').addEventListener('click', () => this._submit());

    this._loadDepartmentChips();
    await this._renderRoleFields();
  },

  async _loadDepartmentChips() {
    try {
      const res = await Api.get('/admin/departments');
      const container = document.getElementById('department-chips');
      (res.data || []).forEach((dept) => {
        const chip = document.createElement('ion-chip');
        chip.outline = true;
        chip.textContent = dept;
        chip.style.cursor = 'pointer';
        chip.addEventListener('click', () => { document.getElementById('member-department').value = dept; });
        container.appendChild(chip);
      });
    } catch (_) { /* non-critical */ }
  },

  async _renderRoleFields() {
    const container = document.getElementById('role-specific-fields');

    if (this._role === 'STUDENT') {
      container.innerHTML = `
        <p style="font-weight:600;">Roll Number</p>
        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:12px;margin-bottom:14px;">
          <ion-icon name="card-outline" slot="start" color="medium"></ion-icon>
          <ion-input id="member-roll" placeholder="e.g. 21CS1001"></ion-input>
        </ion-item>

        <p style="font-weight:600;">Branch</p>
        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:12px;margin-bottom:14px;">
          <ion-icon name="school-outline" slot="start" color="medium"></ion-icon>
          <ion-input id="member-branch" placeholder="e.g. B.Tech CSE"></ion-input>
        </ion-item>

        <p style="font-weight:600;">Semester</p>
        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:12px;margin-bottom:14px;">
          <ion-select id="member-semester" interface="action-sheet" placeholder="Select semester">
            ${[1, 2, 3, 4, 5, 6, 7, 8].map((s) => `<ion-select-option value="${s}">Semester ${s}</ion-select-option>`).join('')}
          </ion-select>
        </ion-item>

        <p style="font-weight:600;">Faculty Advisor</p>
        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:12px;margin-bottom:14px;">
          <ion-icon name="person-circle-outline" slot="start" color="medium"></ion-icon>
          <ion-select id="member-advisor" interface="action-sheet" placeholder="Select faculty advisor">
            ${this._facultyOptions.map((f) => `<ion-select-option value="${f.id}">${UI.escapeHtml(f.name)} (${UI.escapeHtml(f.email)})</ion-select-option>`).join('')}
          </ion-select>
        </ion-item>
      `;
      await this._loadFacultyOptions();
    } else if (this._role === 'FACULTY') {
      container.innerHTML = `
        <p style="font-weight:600;">Designation</p>
        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:12px;margin-bottom:14px;">
          <ion-icon name="ribbon-outline" slot="start" color="medium"></ion-icon>
          <ion-input id="member-designation" placeholder="e.g. Assistant Professor"></ion-input>
        </ion-item>
      `;
    } else if (this._role === 'GUARD') {
      container.innerHTML = `
        <p style="font-weight:600;">Assigned Gate</p>
        <ion-item lines="none" style="border:1px solid var(--bgi-border);border-radius:12px;margin-bottom:14px;">
          <ion-icon name="lock-closed-outline" slot="start" color="medium"></ion-icon>
          <ion-input id="member-gate" placeholder="e.g. Main Gate"></ion-input>
        </ion-item>
      `;
    } else {
      container.innerHTML = ''; // HOD has no extra fields
    }
  },

  async _loadFacultyOptions() {
    try {
      const res = await Api.get('/admin/faculty', { limit: 200 });
      this._facultyOptions = res.data || [];
      const select = document.getElementById('member-advisor');
      if (select) {
        select.innerHTML = this._facultyOptions
          .map((f) => `<ion-select-option value="${f.id}">${UI.escapeHtml(f.name)} (${UI.escapeHtml(f.email)})</ion-select-option>`)
          .join('');
      }
    } catch (_) { /* non-critical */ }
  },

  async _submit() {
    const name = document.getElementById('member-name').value.trim();
    const email = document.getElementById('member-email').value.trim();
    const password = document.getElementById('member-password').value;
    const phone = document.getElementById('member-phone').value.trim();
    const department = document.getElementById('member-department').value.trim();

    if (!name || !email || !password) return UI.toast('Name, email and password are required', 'danger');
    if (password.length < 6) return UI.toast('Password must be at least 6 characters', 'danger');
    if (this._role !== 'ADMIN' && !department) return UI.toast('Department is required', 'danger');

    const payload = { name, email, password, role: this._role, phone, department };

    if (this._role === 'STUDENT') {
      const rollNumber = document.getElementById('member-roll').value.trim();
      if (!rollNumber) return UI.toast('Roll number is required for students', 'danger');
      Object.assign(payload, {
        rollNumber,
        branch: document.getElementById('member-branch').value.trim(),
        semester: document.getElementById('member-semester').value || undefined,
        facultyAdvisorId: document.getElementById('member-advisor').value || undefined,
      });
    } else if (this._role === 'FACULTY') {
      payload.designation = document.getElementById('member-designation').value.trim();
    } else if (this._role === 'GUARD') {
      payload.assignedGate = document.getElementById('member-gate').value.trim();
    }

    this._setLoading(true);
    try {
      await Api.post('/admin/members', payload);
      await UI.toast(`${this._role} added successfully`, 'success');
      Router.goBack();
    } catch (e) {
      await UI.toast(e.message || 'Failed to add member', 'danger');
    } finally {
      this._setLoading(false);
    }
  },

  _setLoading(loading) {
    document.getElementById('save-member-btn').disabled = loading;
    document.getElementById('save-btn-label').classList.toggle('hidden', loading);
    document.getElementById('save-spinner').classList.toggle('hidden', !loading);
  },
};
