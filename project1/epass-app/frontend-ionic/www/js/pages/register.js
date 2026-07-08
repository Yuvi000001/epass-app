// =====================================================================
// E-PASS — Student Self-Registration (Campus Code + Email OTP)
// Step 1: Name, Email, Password, Campus Code  -> backend generates an OTP
// Step 2: Enter the 6-digit OTP emailed via EmailJS -> account created + auto-login
// =====================================================================

Pages['register'] = {
  _step: 1,
  _pendingEmail: '',
  _prefill: {},
  _pendingOtp: '',

  render(params = {}) {
    this._step = 1;
    this._pendingEmail = '';
    this._prefill = params || {};
    this._pendingOtp = '';
    return `
      <ion-header><ion-toolbar>
        <ion-buttons slot="start"><ion-back-button default-href="#" id="register-back-btn"></ion-back-button></ion-buttons>
        <ion-title>Create Account</ion-title>
      </ion-toolbar></ion-header>
      <ion-content fullscreen class="ion-padding"><div id="register-body" style="max-width:720px;margin:0 auto;width:100%;min-height:calc(100vh - 88px);display:flex;flex-direction:column;justify-content:center;"></div></ion-content>
    `;
  },

  afterRender() {
    document.getElementById('register-back-btn').addEventListener('click', (e) => { e.preventDefault(); Router.goBack(); });
    this._renderStep1();
  },

  _renderStep1() {
    const body = document.getElementById('register-body');
    const prefillName = UI.escapeHtml(this._prefill.name || '');
    const prefillEmail = UI.escapeHtml(this._prefill.email || '');
    body.innerHTML = `

      <!-- Header Card (HOD-style) -->
      <div style="background:rgba(var(--bgi-primary-rgb),0.05);border-radius:12px;padding:14px;margin-bottom:16px;border:1px solid rgba(var(--bgi-primary-rgb),0.1);">
        <div style="display:flex;align-items:center;gap:8px;">
          <ion-icon name="school-outline" style="color:var(--bgi-primary);font-size:20px;"></ion-icon>
          <span style="font-weight:600;font-size:14px;color:var(--bgi-primary);">Student Registration</span>
        </div>
        <p style="font-size:12px;color:var(--bgi-text-secondary);margin:4px 0 0;">Register using your Gmail and OTP verification</p>
      </div>

      <div style="margin-bottom:12px;">
        <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
          <ion-icon name="person-outline" slot="start" color="medium"></ion-icon>
          <ion-input id="reg-name" placeholder="Your full name" value="${prefillName}"></ion-input>
        </ion-item>
      </div>

      <div style="margin-bottom:12px;">
        <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
          <ion-icon name="card-outline" slot="start" color="medium"></ion-icon>
          <ion-input id="reg-roll-number" placeholder="Enrollment number"></ion-input>
        </ion-item>
      </div>

      <div style="margin-bottom:12px;">
        <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
          <ion-icon name="git-branch-outline" slot="start" color="medium"></ion-icon>
          <ion-select id="reg-branch" placeholder="Select branch" interface="action-sheet">
            <ion-select-option value="B.Tech CSE">B.Tech CSE</ion-select-option>
            <ion-select-option value="B.Tech ECE">B.Tech ECE</ion-select-option>
            <ion-select-option value="B.Tech ME">B.Tech ME</ion-select-option>
            <ion-select-option value="B.Tech Civil">B.Tech Civil</ion-select-option>
            <ion-select-option value="MCA">MCA</ion-select-option>
            <ion-select-option value="MBA">MBA</ion-select-option>
            <ion-select-option value="other">Other</ion-select-option>
          </ion-select>
        </ion-item>
      </div>
      <div id="reg-branch-other-container" style="display:none;margin-bottom:12px;">
        <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
          <ion-input id="reg-branch-other" placeholder="Enter branch"></ion-input>
        </ion-item>
      </div>

      <div style="margin-bottom:12px;">
        <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
          <ion-icon name="layers-outline" slot="start" color="medium"></ion-icon>
          <ion-input id="reg-department" placeholder="Your department"></ion-input>
        </ion-item>
      </div>

      <div style="margin-bottom:12px;">
        <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
          <ion-icon name="call-outline" slot="start" color="medium"></ion-icon>
          <ion-input id="reg-phone" type="tel" maxlength="10" placeholder="10-digit mobile number"></ion-input>
        </ion-item>
      </div>

      <div style="margin-bottom:12px;">
        <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
          <ion-icon name="mail-outline" slot="start" color="medium"></ion-icon>
          <ion-input id="reg-email" type="email" placeholder="yourname@gmail.com" value="${prefillEmail}"></ion-input>
        </ion-item>
      </div>

      <div style="margin-bottom:12px;">
        <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
          <ion-icon name="lock-closed-outline" slot="start" color="medium"></ion-icon>
          <ion-input id="reg-password" type="password" placeholder="Create password (min 6 chars)"></ion-input>
        </ion-item>
      </div>

      <div style="margin-bottom:6px;">
        <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
          <ion-icon name="business-outline" slot="start" color="medium"></ion-icon>
          <ion-select id="reg-campus" placeholder="Select college" interface="action-sheet">
            ${APP_CONFIG.campuses.map(c => `<ion-select-option value="${c.code}">${c.label}</ion-select-option>`).join('')}
          </ion-select>
        </ion-item>
      </div>

      <ion-button expand="block" id="reg-send-otp-btn" color="primary" style="--border-radius:12px;--padding-top:14px;--padding-bottom:14px;">
        <ion-icon name="mail-outline" slot="start"></ion-icon>
        <span id="reg-send-otp-label">Send OTP to Gmail</span>
        <ion-spinner name="dots" slot="end" class="hidden" id="reg-send-otp-spinner"></ion-spinner>
      </ion-button>
    `;
    document.getElementById('reg-send-otp-btn').addEventListener('click', () => this._handleSendOtp());
    // Branch select: show 'other' field when chosen
    const branchSelect = document.getElementById('reg-branch');
    if (branchSelect) {
      branchSelect.addEventListener('ionChange', (e) => {
        const v = e.detail.value;
        document.getElementById('reg-branch-other-container').style.display = v === 'other' ? 'block' : 'none';
      });
    }

    // Load departments into department input as chips and dropdown
    this._loadDepartments();
  },

  async _handleSendOtp() {
    const name = document.getElementById('reg-name').value.trim();
    const rollNumber = document.getElementById('reg-roll-number').value.trim();
    let branch = document.getElementById('reg-branch').value;
    if (branch === 'other') branch = document.getElementById('reg-branch-other').value.trim();
    const department = document.getElementById('reg-department').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const campusSelect = document.getElementById('reg-campus');
    const campus = campusSelect?.value;
    const selectedCampus = APP_CONFIG.campuses.find((c) => c.code === campus);
    const college = selectedCampus?.label || campus || '';

    if (!name || !rollNumber || !branch || !department || !phone || !email || !password || !campus) {
      return UI.toast('All fields are required', 'danger');
    }
    if (password.length < 6) return UI.toast('Password must be at least 6 characters', 'danger');
    if (phone.length < 10) return UI.toast('Valid 10-digit phone number is required', 'danger');

    this._setStep1Loading(true);
    try {
      const res = await Api.post('/auth/register/send-otp', { name, rollNumber, branch, department, college, phone, email, password, campus });
      const { emailSent, otp } = res.data || {};
      this._pendingOtp = otp || '';

      if (emailSent) {
        await UI.toast('OTP sent to your email', 'success');
      } else {
        await UI.toast('OTP could not be delivered. Please contact your administrator.', 'danger');
      }

      this._pendingEmail = email;
      this._renderStep2();
    } catch (e) {
      await UI.toast(e.message || 'Failed to send OTP', 'danger');
    } finally {
      this._setStep1Loading(false);
    }
  },


  _renderStep2() {
    this._step = 2;
    const body = document.getElementById('register-body');
    body.innerHTML = `
      <!-- Header Card (HOD-style) -->
      <div style="background:rgba(var(--bgi-primary-rgb),0.05);border-radius:12px;padding:14px;margin-bottom:16px;border:1px solid rgba(var(--bgi-primary-rgb),0.1);">
        <div style="display:flex;align-items:center;gap:8px;">
          <ion-icon name="shield-checkmark-outline" style="color:var(--bgi-primary);font-size:20px;"></ion-icon>
          <span style="font-weight:600;font-size:14px;color:var(--bgi-primary);">Verify OTP</span>
        </div>
        <p style="font-size:12px;color:var(--bgi-text-secondary);margin:4px 0 0;">📩 OTP sent to ${UI.escapeHtml(this._pendingEmail)}</p>
      ${this._pendingOtp ? `<p style="font-size:12px;color:var(--bgi-warning);margin:6px 0 0;">OTP for testing: <b>${UI.escapeHtml(this._pendingOtp)}</b></p>` : ''}
      </div>

      <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;margin-bottom:18px;">
        <ion-icon name="keypad-outline" slot="start" color="medium"></ion-icon>
        <ion-input id="reg-otp" type="tel" maxlength="6" placeholder="Enter 6-digit OTP" style="letter-spacing:4px;font-size:18px;"></ion-input>
      </ion-item>

      <ion-button expand="block" id="reg-verify-btn" color="success" style="--border-radius:12px;--padding-top:14px;--padding-bottom:14px;">
        <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
        <span id="reg-verify-label">Verify & Create Account</span>
        <ion-spinner name="dots" slot="end" class="hidden" id="reg-verify-spinner"></ion-spinner>
      </ion-button>

      <p class="text-center mt-16" style="font-size:13px;">
        Didn't receive OTP? <ion-text color="primary" id="reg-resend-link" style="cursor:pointer;font-weight:600;">Resend OTP</ion-text>
      </p>
    `;
    document.getElementById('reg-verify-btn').addEventListener('click', () => this._handleVerifyOtp());
    document.getElementById('reg-resend-link').addEventListener('click', () => this._handleResendOtp());
  },

  async _loadDepartments() {
    const staticDepts = ['CSE', 'EC', 'ME',  'IT' ,'cbsc', ];
    let depts = [];
    try {
      const res = await Api.get('/admin/departments');
      depts = res.data || [];
    } catch (_) {
      // backend unavailable — fall back to static list
      depts = staticDepts;
    }

    // convert department input into a select with options
    const deptInput = document.getElementById('reg-department');
    if (!deptInput) return;
    const optionsHtml = (depts || []).map(d => `<ion-select-option value="${UI.escapeHtml(d)}">${UI.escapeHtml(d)}</ion-select-option>`).join('');
    const selectHtml = `<ion-select id="reg-department-select" placeholder="Select department" interface="action-sheet">${optionsHtml}</ion-select>`;
    // replace the ion-item content while preserving the outer ion-item wrapper
    const parent = deptInput.parentElement;
    parent.innerHTML = `<ion-icon name="layers-outline" slot="start" color="medium"></ion-icon>${selectHtml}`;
    const sel = parent.querySelector('ion-select');
    if (sel) {
      sel.id = 'reg-department';
      sel.addEventListener('ionChange', () => {});
    }
  },

  async _handleVerifyOtp() {
    const otp = document.getElementById('reg-otp').value.trim();
    if (!otp) return UI.toast('Please enter the OTP', 'danger');

    this._setStep2Loading(true);
    try {
      const res = await Api.post('/auth/register/verify-otp', { email: this._pendingEmail, otp });
      const { token, user } = res.data;
      Storage.saveSession(token, user);
      await UI.toast('Account created! Welcome to E-PASS.', 'success');
      await Router.reset('student-dashboard');
    } catch (e) {
      await UI.toast(e.message || 'OTP verification failed', 'danger');
    } finally {
      this._setStep2Loading(false);
    }
  },

  async _handleResendOtp() {
    try {
      const res = await Api.post('/auth/register/resend-otp', { email: this._pendingEmail });
      const { emailSent } = res.data;
      if (emailSent) {
        await UI.toast('A new OTP has been sent', 'success');
      } else {
        await UI.toast('OTP could not be delivered. Please contact your administrator.', 'danger');
        return;
      }
    } catch (e) {
      await UI.toast(e.message || 'Failed to resend OTP', 'danger');
    }
  },

  _setStep1Loading(loading) {
    document.getElementById('reg-send-otp-btn').disabled = loading;
    document.getElementById('reg-send-otp-label').classList.toggle('hidden', loading);
    document.getElementById('reg-send-otp-spinner').classList.toggle('hidden', !loading);
  },

  _setStep2Loading(loading) {
    document.getElementById('reg-verify-btn').disabled = loading;
    document.getElementById('reg-verify-label').classList.toggle('hidden', loading);
    document.getElementById('reg-verify-spinner').classList.toggle('hidden', !loading);
  },
};