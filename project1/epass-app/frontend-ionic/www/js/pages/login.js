// =====================================================================
// E-PASS — Login Screen (With Updated College Full Forms)
// BIST = Bansal Institute of Science & Technology
// BIRT = Bansal Institute of Research & Technology
// BIRTS = Bansal Institute of Research Technology & Science
// =====================================================================

Pages['login'] = {
  _selectedRole: 'STUDENT',
  _adminMode: false,
  _adminRegisterMode: false,
  _facultyRegisterMode: false,
  _hodRegisterMode: false,
  _guardRegisterMode: false,
  _directorRegisterMode: false,
  _selectedCollege: 'BIST',
  _selectedDepartment: '',
  _adminOtpRequested: false,
  _adminPendingEmail: '',
  _hodRegisterOtpRequested: false,
  _hodRegisterPendingEmail: '',
  _facultyOtpRequested: false,
  _facultyPendingEmail: '',
  _guardOtpRequested: false,
  _guardPendingEmail: '',
  _directorOtpRequested: false,
  _directorPendingEmail: '',
  _directorRegisterToken: '',

  render() {
    // Reset all modes on render
    this._selectedRole = 'STUDENT';
    this._adminMode = false;
    this._adminRegisterMode = false;
    this._facultyRegisterMode = false;
    this._hodRegisterMode = false;
    this._guardRegisterMode = false;
    this._directorRegisterMode = false;
    this._selectedCollege = 'BIST';
    this._selectedDepartment = '';
    this._adminOtpRequested = false;
    this._adminPendingEmail = '';
    this._hodRegisterOtpRequested = false;
    this._hodRegisterPendingEmail = '';
    this._facultyOtpRequested = false;
    this._facultyPendingEmail = '';
    this._guardOtpRequested = false;
    this._guardPendingEmail = '';
    this._directorOtpRequested = false;
    this._directorPendingEmail = '';
    this._directorRegisterToken = '';

    return `
      <ion-content class="ion-padding" fullscreen>
        <div style="max-width:440px;margin:0 auto;padding-bottom:40px;">

          <!-- Logo -->
          <div class="text-center mt-16">
            ${this._logoHtml()}
          </div>

          <!-- App Name -->
          <div class="text-center mt-16 mb-16">
            <ion-icon name="checkmark-done-circle-outline" style="font-size:28px;color:var(--bgi-primary);"></ion-icon>
            <div class="app-name" style="font-size:22px;">${APP_CONFIG.appName}</div>
            <div class="app-sub" style="margin-bottom:0;">Leave Management System</div>
          </div>

          <!-- Role Section -->
          <div id="role-section">${this._roleSectionHtml()}</div>

          <!-- ============================================================ -->
          <!-- MAIN LOGIN FIELDS (Visible by default) -->
          <!-- ============================================================ -->
          <div id="main-login-fields">
            <!-- Email -->
            <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;margin-bottom:12px;">
              <ion-icon name="mail-outline" slot="start" color="medium"></ion-icon>
              <ion-input id="login-email" type="email" placeholder="Enter Gmail address"></ion-input>
            </ion-item>

            <!-- Password -->
            <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;margin-bottom:8px;">
              <ion-icon name="lock-closed-outline" slot="start" color="medium"></ion-icon>
              <ion-input id="login-password" type="password" placeholder="Enter Password"></ion-input>
              <ion-icon id="toggle-password" name="eye-off-outline" slot="end" color="medium" style="cursor:pointer;"></ion-icon>
            </ion-item>

            <div style="text-align:right;margin:0 0 14px;">
              <ion-text color="primary" style="font-size:12px;cursor:pointer;" id="forgot-password-link">Forgot Password?</ion-text>
            </div>

            <!-- Login Button -->
            <ion-button expand="block" id="login-btn" color="primary" style="--border-radius:12px;--padding-top:14px;--padding-bottom:14px;">
              <span id="login-btn-label">Login</span>
              <ion-spinner name="dots" slot="end" class="hidden" id="login-spinner"></ion-spinner>
            </ion-button>
          </div>

          <!-- ============================================================ -->
          <!-- HOD LOGIN FIELDS (Hidden by default) -->
          <!-- ============================================================ -->
          <div id="hod-login-fields" class="hidden">
            <div style="background:rgba(var(--bgi-primary-rgb),0.05);border-radius:12px;padding:12px;margin-bottom:12px;border:1px solid rgba(var(--bgi-primary-rgb),0.1);">
              <div style="display:flex;align-items:center;gap:8px;">
                <ion-icon name="shield-checkmark-outline" style="color:var(--bgi-primary);font-size:20px;"></ion-icon>
                <span style="font-weight:600;font-size:14px;color:var(--bgi-primary);">HOD Login</span>
              </div>
              <p style="font-size:12px;color:var(--bgi-text-secondary);margin:4px 0 0;">Login with your Gmail and password</p>
            </div>

            <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;margin-bottom:12px;">
              <ion-icon name="mail-outline" slot="start" color="medium"></ion-icon>
              <ion-input id="hod-login-email" type="email" placeholder="Enter Gmail address"></ion-input>
            </ion-item>

            <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;margin-bottom:8px;">
              <ion-icon name="lock-closed-outline" slot="start" color="medium"></ion-icon>
              <ion-input id="hod-login-password" type="password" placeholder="Enter Password"></ion-input>
              <ion-icon id="hod-toggle-password" name="eye-off-outline" slot="end" color="medium" style="cursor:pointer;"></ion-icon>
            </ion-item>

            <div style="text-align:right;margin:0 0 12px;">
              <ion-text color="primary" style="font-size:12px;cursor:pointer;" id="hod-forgot-password-link">Forgot Password? Contact Admin</ion-text>
            </div>

            <ion-button expand="block" id="hod-password-login-btn-submit" color="primary" style="--border-radius:12px;--padding-top:14px;--padding-bottom:14px;">
              <span id="hod-password-login-label">Login as HOD</span>
              <ion-spinner name="dots" slot="end" class="hidden" id="hod-password-login-spinner"></ion-spinner>
            </ion-button>
          </div>

          <!-- ============================================================ -->
          <!-- REGISTRATION FIELDS (Hidden by default) -->
          <!-- ============================================================ -->

          <!-- FACULTY REGISTRATION -->
          <div id="faculty-register-fields" class="hidden">
            <div style="background:rgba(var(--bgi-primary-rgb),0.05);border-radius:12px;padding:12px;margin-bottom:12px;border:1px solid rgba(var(--bgi-primary-rgb),0.1);">
              <div style="display:flex;align-items:center;gap:8px;">
                <ion-icon name="person-outline" style="color:var(--bgi-primary);font-size:20px;"></ion-icon>
                <span style="font-weight:600;font-size:14px;color:var(--bgi-primary);">Faculty Registration</span>
              </div>
            </div>
            <div style="margin-bottom:12px;">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
                <ion-icon name="person-outline" slot="start" color="medium"></ion-icon>
                <ion-input id="faculty-reg-name" placeholder="Full name"></ion-input>
              </ion-item>
            </div>
            <div style="margin-bottom:12px;">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
                <ion-icon name="card-outline" slot="start" color="medium"></ion-icon>
                <ion-input id="faculty-reg-employee-id" placeholder="Employee ID"></ion-input>
              </ion-item>
            </div>
            <div style="margin-bottom:12px;">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
                <ion-icon name="school-outline" slot="start" color="medium"></ion-icon>
                <ion-select id="faculty-reg-department" interface="action-sheet" placeholder="Select department">
                  <ion-select-option value="CSE">CSE</ion-select-option>
                  <ion-select-option value="ECE">ECE</ion-select-option>
                  <ion-select-option value="ME">Mechanical</ion-select-option>
                  <ion-select-option value="CIVIL">Civil</ion-select-option>
                  <ion-select-option value="EEE">EEE</ion-select-option>
                  <ion-select-option value="IT">IT</ion-select-option>
                  <ion-select-option value="AIDS">AIDS</ion-select-option>
                  <ion-select-option value="AIML">AIML</ion-select-option>
                </ion-select>
              </ion-item>
            </div>
            <div style="margin-bottom:12px;">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
                <ion-icon name="ribbon-outline" slot="start" color="medium"></ion-icon>
                <ion-input id="faculty-reg-designation" placeholder="Designation"></ion-input>
              </ion-item>
            </div>
            <div style="margin-bottom:12px;">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
                <ion-icon name="business-outline" slot="start" color="medium"></ion-icon>
                <ion-select id="faculty-reg-college" interface="action-sheet" placeholder="Select college">
                  <ion-select-option value="BIST">BIST (Bansal Institute of Science & Technology)</ion-select-option>
                  <ion-select-option value="BIRT">BIRT (Bansal Institute of Research & Technology)</ion-select-option>
                  <ion-select-option value="BIRTS">BIRTS (Bansal Institute of Research Technology & Science)</ion-select-option>
                </ion-select>
              </ion-item>
            </div>
            <div style="margin-bottom:12px;">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
                <ion-icon name="call-outline" slot="start" color="medium"></ion-icon>
                <ion-input id="faculty-reg-phone" type="tel" placeholder="Phone number"></ion-input>
              </ion-item>
            </div>
            <div style="margin-bottom:12px;">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
                <ion-icon name="lock-closed-outline" slot="start" color="medium"></ion-icon>
                <ion-input id="faculty-reg-password" type="password" placeholder="Create password (min 6 chars)"></ion-input>
              </ion-item>
            </div>
            <div style="margin-bottom:12px;">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
                <ion-icon name="mail-outline" slot="start" color="medium"></ion-icon>
                <ion-input id="faculty-reg-email" type="email" placeholder="Gmail address"></ion-input>
              </ion-item>
            </div>
            <div id="faculty-register-otp-wrap" style="margin-bottom:12px;">
              <ion-button expand="block" id="faculty-register-send-otp-btn" color="primary" style="--border-radius:12px;--padding-top:14px;--padding-bottom:14px;">
                <ion-icon name="mail-outline" slot="start"></ion-icon>
                <span id="faculty-register-send-otp-label">Send OTP to Gmail</span>
                <ion-spinner name="dots" slot="end" class="hidden" id="faculty-register-send-otp-spinner"></ion-spinner>
              </ion-button>
            </div>
            <div id="faculty-register-verify-wrap" class="hidden">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;margin-bottom:12px;">
                <ion-icon name="keypad-outline" slot="start" color="medium"></ion-icon>
                <ion-input id="faculty-register-otp" type="tel" maxlength="6" placeholder="Enter 6-digit OTP"></ion-input>
              </ion-item>
              <ion-button expand="block" id="faculty-register-verify-btn" color="success" style="--border-radius:12px;--padding-top:14px;--padding-bottom:14px;margin-bottom:8px;">
                <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
                <span id="faculty-register-verify-label">Verify OTP</span>
                <ion-spinner name="dots" slot="end" class="hidden" id="faculty-register-verify-spinner"></ion-spinner>
              </ion-button>
              <p class="text-center" style="font-size:13px;margin-top:8px;">
                Didn't receive OTP? <ion-text color="primary" id="faculty-register-resend-link" style="cursor:pointer;font-weight:600;">Resend OTP</ion-text>
              </p>
            </div>
          </div>

          <!-- HOD REGISTRATION -->
          <div id="hod-register-fields" class="hidden">
            <div style="background:rgba(var(--bgi-primary-rgb),0.05);border-radius:12px;padding:12px;margin-bottom:12px;border:1px solid rgba(var(--bgi-primary-rgb),0.1);">
              <div style="display:flex;align-items:center;gap:8px;">
                <ion-icon name="shield-checkmark-outline" style="color:var(--bgi-primary);font-size:20px;"></ion-icon>
                <span style="font-weight:600;font-size:14px;color:var(--bgi-primary);">HOD Registration</span>
              </div>
            </div>
            <div style="margin-bottom:12px;">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
                <ion-icon name="person-outline" slot="start" color="medium"></ion-icon>
                <ion-input id="hod-reg-name" placeholder="Full name"></ion-input>
              </ion-item>
            </div>
            <div style="margin-bottom:12px;">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
                <ion-icon name="card-outline" slot="start" color="medium"></ion-icon>
                <ion-input id="hod-reg-employee-id" placeholder="Employee ID"></ion-input>
              </ion-item>
            </div>
            <div style="margin-bottom:12px;">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
                <ion-icon name="school-outline" slot="start" color="medium"></ion-icon>
                <ion-select id="hod-reg-department" interface="action-sheet" placeholder="Select department">
                  <ion-select-option value="CSE">CSE</ion-select-option>
                  <ion-select-option value="ECE">ECE</ion-select-option>
                  <ion-select-option value="ME">Mechanical</ion-select-option>
                  <ion-select-option value="CIVIL">Civil</ion-select-option>
                  <ion-select-option value="EEE">EEE</ion-select-option>
                  <ion-select-option value="IT">IT</ion-select-option>
                  <ion-select-option value="AIDS">AIDS</ion-select-option>
                  <ion-select-option value="AIML">AIML</ion-select-option>
                </ion-select>
              </ion-item>
            </div>
            <div style="margin-bottom:12px;">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
                <ion-icon name="business-outline" slot="start" color="medium"></ion-icon>
                <ion-select id="hod-reg-college" interface="action-sheet" placeholder="Select college">
                  <ion-select-option value="BIST">BIST (Bansal Institute of Science & Technology)</ion-select-option>
                  <ion-select-option value="BIRT">BIRT (Bansal Institute of Research & Technology)</ion-select-option>
                  <ion-select-option value="BIRTS">BIRTS (Bansal Institute of Research Technology & Science)</ion-select-option>
                </ion-select>
              </ion-item>
            </div>
            <div style="margin-bottom:12px;">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
                <ion-icon name="call-outline" slot="start" color="medium"></ion-icon>
                <ion-input id="hod-reg-phone" type="tel" placeholder="Phone number"></ion-input>
              </ion-item>
            </div>
            <div style="margin-bottom:12px;">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
                <ion-icon name="mail-outline" slot="start" color="medium"></ion-icon>
                <ion-input id="hod-reg-email" type="email" placeholder="Gmail address"></ion-input>
              </ion-item>
            </div>
            <div style="margin-bottom:12px;">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
                <ion-icon name="lock-closed-outline" slot="start" color="medium"></ion-icon>
                <ion-input id="hod-reg-password" type="password" placeholder="Create password (min 6 chars)"></ion-input>
              </ion-item>
            </div>
            <div style="margin-bottom:12px;">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
                <ion-icon name="lock-closed-outline" slot="start" color="medium"></ion-icon>
                <ion-input id="hod-reg-password-confirm" type="password" placeholder="Confirm password"></ion-input>
              </ion-item>
            </div>

            <!-- HOD Register: Send OTP -->
            <div id="hod-register-otp-wrap" style="margin-bottom:12px;">
              <ion-button expand="block" id="hod-register-send-otp-btn" color="primary" style="--border-radius:12px;--padding-top:14px;--padding-bottom:14px;">
                <ion-icon name="mail-outline" slot="start"></ion-icon>
                <span id="hod-register-send-otp-label">Send OTP to Gmail</span>
                <ion-spinner name="dots" slot="end" class="hidden" id="hod-register-send-otp-spinner"></ion-spinner>
              </ion-button>
            </div>

            <!-- HOD Register: OTP verify -->
            <div id="hod-register-verify-wrap" class="hidden">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;margin-bottom:12px;">
                <ion-icon name="keypad-outline" slot="start" color="medium"></ion-icon>
                <ion-input id="hod-register-otp" type="tel" maxlength="6" placeholder="Enter 6-digit OTP"></ion-input>
              </ion-item>
              <ion-button expand="block" id="hod-register-verify-btn" color="success" style="--border-radius:12px;--padding-top:14px;--padding-bottom:14px;margin-bottom:8px;">
                <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
                <span id="hod-register-verify-label">Verify OTP</span>
                <ion-spinner name="dots" slot="end" class="hidden" id="hod-register-verify-spinner"></ion-spinner>
              </ion-button>
              <p class="text-center" style="font-size:13px;margin-top:8px;">
                Didn't receive OTP? <ion-text color="primary" id="hod-register-resend-link" style="cursor:pointer;font-weight:600;">Resend OTP</ion-text>
              </p>
            </div>

            <!-- HOD Register: Create Password -->
            <div id="hod-register-password-wrap" class="hidden">
              <p style="font-size:12px;color:var(--bgi-text-secondary);margin-bottom:12px;"><ion-icon name="checkmark-circle-outline" style="color:var(--bgi-success);"></ion-icon> Password already set. Verifying email...</p>
              <ion-button expand="block" id="hod-register-create-btn" color="success" style="--border-radius:12px;--padding-top:14px;--padding-bottom:14px;">
                <ion-icon name="person-add-outline" slot="start"></ion-icon>
                <span id="hod-register-create-label">Complete Registration</span>
                <ion-spinner name="dots" slot="end" class="hidden" id="hod-register-create-spinner"></ion-spinner>
              </ion-button>
            </div>
          </div>

          <!-- GUARD REGISTRATION -->
          <div id="guard-register-fields" class="hidden">
            <div style="background:rgba(var(--bgi-primary-rgb),0.05);border-radius:12px;padding:12px;margin-bottom:12px;border:1px solid rgba(var(--bgi-primary-rgb),0.1);">
              <div style="display:flex;align-items:center;gap:8px;">
                <ion-icon name="lock-closed-outline" style="color:var(--bgi-primary);font-size:20px;"></ion-icon>
                <span style="font-weight:600;font-size:14px;color:var(--bgi-primary);">Guard Registration</span>
              </div>
            </div>
            <div style="margin-bottom:12px;">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
                <ion-icon name="person-outline" slot="start" color="medium"></ion-icon>
                <ion-input id="guard-reg-name" placeholder="Full name"></ion-input>
              </ion-item>
            </div>
            <div style="margin-bottom:12px;">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
                <ion-icon name="card-outline" slot="start" color="medium"></ion-icon>
                <ion-input id="guard-reg-employee-id" placeholder="Employee ID"></ion-input>
              </ion-item>
            </div>
            <div style="margin-bottom:12px;">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
                <ion-icon name="location-outline" slot="start" color="medium"></ion-icon>
                <ion-input id="guard-reg-gate" placeholder="Assigned gate"></ion-input>
              </ion-item>
            </div>
            <div style="margin-bottom:12px;">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
                <ion-icon name="lock-closed-outline" slot="start" color="medium"></ion-icon>
                <ion-input id="guard-reg-password" type="password" placeholder="Create password (min 6 chars)"></ion-input>
              </ion-item>
            </div>
            <div style="margin-bottom:12px;">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
                <ion-icon name="business-outline" slot="start" color="medium"></ion-icon>
                <ion-select id="guard-reg-college" interface="action-sheet" placeholder="Select college">
                  <ion-select-option value="BIST">BIST (Bansal Institute of Science & Technology)</ion-select-option>
                  <ion-select-option value="BIRT">BIRT (Bansal Institute of Research & Technology)</ion-select-option>
                  <ion-select-option value="BIRTS">BIRTS (Bansal Institute of Research Technology & Science)</ion-select-option>
                </ion-select>
              </ion-item>
            </div>
            <div style="margin-bottom:12px;">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
                <ion-icon name="call-outline" slot="start" color="medium"></ion-icon>
                <ion-input id="guard-reg-phone" type="tel" placeholder="Phone number"></ion-input>
              </ion-item>
            </div>
            <div style="margin-bottom:12px;">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
                <ion-icon name="mail-outline" slot="start" color="medium"></ion-icon>
                <ion-input id="guard-reg-email" type="email" placeholder="Gmail address"></ion-input>
              </ion-item>
            </div>
            <div id="guard-register-otp-wrap" style="margin-bottom:12px;">
              <ion-button expand="block" id="guard-register-send-otp-btn" color="primary" style="--border-radius:12px;--padding-top:14px;--padding-bottom:14px;">
                <ion-icon name="mail-outline" slot="start"></ion-icon>
                <span id="guard-register-send-otp-label">Send OTP to Gmail</span>
                <ion-spinner name="dots" slot="end" class="hidden" id="guard-register-send-otp-spinner"></ion-spinner>
              </ion-button>
            </div>
            <div id="guard-register-verify-wrap" class="hidden">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;margin-bottom:12px;">
                <ion-icon name="keypad-outline" slot="start" color="medium"></ion-icon>
                <ion-input id="guard-register-otp" type="tel" maxlength="6" placeholder="Enter 6-digit OTP"></ion-input>
              </ion-item>
              <ion-button expand="block" id="guard-register-verify-btn" color="success" style="--border-radius:12px;--padding-top:14px;--padding-bottom:14px;margin-bottom:8px;">
                <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
                <span id="guard-register-verify-label">Verify OTP</span>
                <ion-spinner name="dots" slot="end" class="hidden" id="guard-register-verify-spinner"></ion-spinner>
              </ion-button>
              <p class="text-center" style="font-size:13px;margin-top:8px;">
                Didn't receive OTP? <ion-text color="primary" id="guard-register-resend-link" style="cursor:pointer;font-weight:600;">Resend OTP</ion-text>
              </p>
            </div>
          </div>

          <!-- DIRECTOR REGISTRATION -->
          <div id="director-register-fields" class="hidden">
            <div style="background:rgba(var(--bgi-primary-rgb),0.05);border-radius:12px;padding:12px;margin-bottom:12px;border:1px solid rgba(var(--bgi-primary-rgb),0.1);">
              <div style="display:flex;align-items:center;gap:8px;">
                <ion-icon name="people-circle-outline" style="color:var(--bgi-primary);font-size:20px;"></ion-icon>
                <span style="font-weight:600;font-size:14px;color:var(--bgi-primary);">Director Registration</span>
              </div>
            </div>
            <div style="margin-bottom:12px;">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
                <ion-icon name="person-outline" slot="start" color="medium"></ion-icon>
                <ion-input id="director-reg-name" placeholder="Full name"></ion-input>
              </ion-item>
            </div>
            <div style="margin-bottom:12px;">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
                <ion-icon name="card-outline" slot="start" color="medium"></ion-icon>
                <ion-input id="director-reg-employee-id" placeholder="Employee ID"></ion-input>
              </ion-item>
            </div>
            <div style="margin-bottom:12px;">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
                <ion-icon name="business-outline" slot="start" color="medium"></ion-icon>
                <ion-select id="director-reg-college" interface="action-sheet" placeholder="Select college">
                  <ion-select-option value="BIST">BIST (Bansal Institute of Science & Technology)</ion-select-option>
                  <ion-select-option value="BIRT">BIRT (Bansal Institute of Research & Technology)</ion-select-option>
                  <ion-select-option value="BIRTS">BIRTS (Bansal Institute of Research Technology & Science)</ion-select-option>
                </ion-select>
              </ion-item>
            </div>
            <div style="margin-bottom:12px;">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
                <ion-icon name="call-outline" slot="start" color="medium"></ion-icon>
                <ion-input id="director-reg-phone" type="tel" placeholder="Phone number"></ion-input>
              </ion-item>
            </div>
            <div style="margin-bottom:12px;">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
                <ion-icon name="mail-outline" slot="start" color="medium"></ion-icon>
                <ion-input id="director-reg-email" type="email" placeholder="Gmail address"></ion-input>
              </ion-item>
            </div>
            <div style="margin-bottom:12px;">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
                <ion-icon name="lock-closed-outline" slot="start" color="medium"></ion-icon>
                <ion-input id="director-reg-password" type="password" placeholder="Create password (min 6 chars)"></ion-input>
              </ion-item>
            </div>
            <div style="margin-bottom:12px;">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;">
                <ion-icon name="lock-closed-outline" slot="start" color="medium"></ion-icon>
                <ion-input id="director-reg-password-confirm" type="password" placeholder="Confirm password"></ion-input>
              </ion-item>
            </div>
            <div id="director-register-otp-wrap" style="margin-bottom:12px;">
              <ion-button expand="block" id="director-register-send-otp-btn" color="primary" style="--border-radius:12px;--padding-top:14px;--padding-bottom:14px;">
                <ion-icon name="mail-outline" slot="start"></ion-icon>
                <span id="director-register-send-otp-label">Send OTP to Gmail</span>
                <ion-spinner name="dots" slot="end" class="hidden" id="director-register-send-otp-spinner"></ion-spinner>
              </ion-button>
            </div>
            <div id="director-register-verify-wrap" class="hidden">
              <ion-item lines="none" style="--background:#fff;border:1px solid var(--bgi-border);border-radius:12px;margin-bottom:12px;">
                <ion-icon name="keypad-outline" slot="start" color="medium"></ion-icon>
                <ion-input id="director-register-otp" type="tel" maxlength="6" placeholder="Enter 6-digit OTP"></ion-input>
              </ion-item>
              <ion-button expand="block" id="director-register-verify-btn" color="success" style="--border-radius:12px;--padding-top:14px;--padding-bottom:14px;margin-bottom:8px;">
                <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
                <span id="director-register-verify-label">Verify OTP</span>
                <ion-spinner name="dots" slot="end" class="hidden" id="director-register-verify-spinner"></ion-spinner>
              </ion-button>
              <p class="text-center" style="font-size:13px;margin-top:8px;">
                Didn't receive OTP? <ion-text color="primary" id="director-register-resend-link" style="cursor:pointer;font-weight:600;">Resend OTP</ion-text>
              </p>
            </div>
            <div id="director-register-password-wrap" class="hidden">
              <p style="font-size:12px;color:var(--bgi-text-secondary);margin-bottom:12px;"><ion-icon name="checkmark-circle-outline" style="color:var(--bgi-success);"></ion-icon> Password already set. Verifying email...</p>
              <ion-button expand="block" id="director-register-create-btn" color="success" style="--border-radius:12px;--padding-top:14px;--padding-bottom:14px;">
                <ion-icon name="person-add-outline" slot="start"></ion-icon>
                <span id="director-register-create-label">Complete Registration</span>
                <ion-spinner name="dots" slot="end" class="hidden" id="director-register-create-spinner"></ion-spinner>
              </ion-button>
            </div>
          </div>


          <!-- REGISTRATION LINK (Dynamic based on role) -->
          <!-- ============================================================ -->
          <p class="text-center mt-16" id="register-link-wrap" style="font-size:13px;">
            <span id="register-link-text">New student?</span>
            <ion-text color="primary" id="register-link" style="cursor:pointer;font-weight:600;">
              <span id="register-link-label">Create an account</span>
            </ion-text>
          </p>

          <!-- ============================================================ -->
          <!-- ADMIN TOGGLE -->
          <!-- ============================================================ -->
          <p class="text-center mt-16" id="admin-toggle-link" style="color:var(--bgi-text-secondary);font-size:13px;cursor:pointer;">
            <ion-icon name="shield-checkmark-outline" style="vertical-align:-2px;"></ion-icon>
            Admin Login
          </p>

          <!-- ============================================================ -->
          <!-- BACK TO LOGIN (from registration) -->
          <!-- ============================================================ -->
          <p class="text-center mt-8 hidden" id="back-to-login-link" style="font-size:13px;cursor:pointer;">
            <ion-text color="primary" id="back-to-login-btn">&larr; Back to login</ion-text>
          </p>

        </div>
      </ion-content>
    `;
  },

  _logoHtml() {
    return `
      <img src="assets/images/logo.png" alt="BGI Logo"
           style="width:160px;max-width:70%;height:auto;object-fit:contain;margin:0 auto 14px;display:block;"
           onload="document.getElementById('login-college-text').style.display='none';"
           onerror="this.style.display='none';document.getElementById('logo-fallback').style.display='flex';" />
      <div id="logo-fallback" class="splash-logo" style="display:none;">
        <ion-icon name="shield-half-outline" style="font-size:38px;"></ion-icon>
      </div>
    `;
  },

  _roleSectionHtml() {
    if (this._adminMode) {
      return `
        <div class="text-center mb-16">
          <div style="display:inline-flex;align-items:center;gap:8px;background:var(--bgi-primary);color:#fff;padding:8px 16px;border-radius:12px;font-weight:600;font-size:13px;">
            <ion-icon name="shield-checkmark-outline"></ion-icon> Admin Portal
          </div>
          <p style="margin-top:8px;">
            <ion-text color="primary" style="font-size:12px;cursor:pointer;" id="back-to-roles-link">&larr; Back to login</ion-text>
          </p>
        </div>

        <p style="font-size:11px;color:var(--bgi-text-secondary);margin:0 0 10px;">
          🔐 Login with your admin Gmail and password.
        </p>
      `;
    }
    return `
      <p style="font-weight:600;margin-bottom:8px;font-size:13px;">Login as</p>
      <div class="role-tabs" id="role-tabs">
        ${this._roleTab('STUDENT', 'school-outline', 'Student')}
        ${this._roleTab('FACULTY', 'person-outline', 'Faculty')}
        ${this._roleTab('HOD', 'shield-outline', 'HOD')}
        ${this._roleTab('GUARD', 'lock-closed-outline', 'Guard')}
        ${this._roleTab('DIRECTOR', 'people-circle-outline', 'Director')}
      </div>
    `;
  },

  _collegeTab(code) {
    const active = code === this._selectedCollege ? 'active' : '';
    const fullNames = {
      'BIST': 'Bansal Institute of Science & Technology',
      'BIRT': 'Bansal Institute of Research & Technology',
      'BIRTS': 'Bansal Institute of Research Technology & Science'
    };
    return `<div class="role-tab campus-tab ${active}" data-college="${code}"><ion-icon name="business-outline"></ion-icon><span>${code}</span></div>`;
  },

  _roleTab(role, icon, label) {
    const active = role === this._selectedRole ? 'active' : '';
    return `<div class="role-tab ${active}" data-role="${role}"><ion-icon name="${icon}"></ion-icon><span>${label}</span></div>`;
  },

  afterRender() {
    this._bindRoleTabs();
    this._updateLoginMode();
    this._updateRegisterLink();

    // Toggle password visibility
    document.getElementById('toggle-password')?.addEventListener('click', (e) => {
      const input = document.getElementById('login-password');
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      e.target.setAttribute('name', isPassword ? 'eye-outline' : 'eye-off-outline');
    });

    // Toggle password visibility (HOD)
    document.getElementById('hod-toggle-password')?.addEventListener('click', (e) => {
      const input = document.getElementById('hod-login-password');
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      e.target.setAttribute('name', isPassword ? 'eye-outline' : 'eye-off-outline');
    });

    // Forgot password
    document.getElementById('forgot-password-link')?.addEventListener('click', () => {
      UI.toast('Contact your campus admin to reset your password.', 'warning');
    });

    // HOD Forgot password
    document.getElementById('hod-forgot-password-link')?.addEventListener('click', () => {
      UI.toast('Contact your campus admin to reset your password.', 'warning');
    });

    // Admin toggle
    document.getElementById('admin-toggle-link')?.addEventListener('click', () => {
      this._adminMode = true;
      this._adminRegisterMode = false;
      this._selectedRole = 'ADMIN';
      document.getElementById('role-section').innerHTML = this._roleSectionHtml();
      document.getElementById('admin-toggle-link').classList.add('hidden');
      document.getElementById('register-link-wrap').classList.add('hidden');
      document.getElementById('back-to-login-link').classList.add('hidden');
      this._bindRoleTabs();
      this._updateLoginMode();
      this._updateRegisterLink();
    });

    // Register link
    document.getElementById('register-link')?.addEventListener('click', () => {
      const role = this._selectedRole;
      if (role === 'STUDENT') {
        this._showStudentRegistration();
      } else if (role === 'FACULTY') {
        this._showFacultyRegistration();
      } else if (role === 'HOD') {
        this._showHodRegistration();
      } else if (role === 'GUARD') {
        this._showGuardRegistration();
      } else if (role === 'DIRECTOR') {
        this._showDirectorRegistration();
      }
    });

    // Back to login
    document.getElementById('back-to-login-btn')?.addEventListener('click', () => {
      this._hideAllRegistrations();
      this._selectedRole = 'STUDENT';
      document.getElementById('role-section').innerHTML = this._roleSectionHtml();
      document.getElementById('register-link-wrap').classList.remove('hidden');
      document.getElementById('admin-toggle-link').classList.remove('hidden');
      document.getElementById('back-to-login-link').classList.add('hidden');
      this._bindRoleTabs();
      this._updateLoginMode();
      this._updateRegisterLink();
    });

    // Login button
    document.getElementById('login-btn')?.addEventListener('click', () => this._handleLogin());

    // HOD Password Login
    document.getElementById('hod-password-login-btn-submit')?.addEventListener('click', () => this._handleHodPasswordLogin());

    // Faculty Registration
    document.getElementById('faculty-register-btn')?.addEventListener('click', () => {
      this._handleFacultyRegister();
    });
    document.getElementById('faculty-register-send-otp-btn')?.addEventListener('click', () => {
      this._handleFacultyRegister();
    });
    document.getElementById('faculty-register-verify-btn')?.addEventListener('click', () => {
      this._handleFacultyVerifyOtp();
    });
    document.getElementById('faculty-register-resend-link')?.addEventListener('click', () => {
      this._handleFacultyRegister(true);
    });

    // HOD Registration
    document.getElementById('hod-register-send-otp-btn')?.addEventListener('click', () => {
      this._handleHodRegisterSendOtp();
    });
    document.getElementById('hod-register-verify-btn')?.addEventListener('click', () => {
      this._handleHodRegisterVerifyOtp();
    });
    document.getElementById('hod-register-resend-link')?.addEventListener('click', () => {
      this._handleHodRegisterSendOtp(true);
    });
    document.getElementById('hod-register-create-btn')?.addEventListener('click', () => {
      this._handleHodRegisterCreate();
    });

    // Director Registration
    document.getElementById('director-register-send-otp-btn')?.addEventListener('click', () => {
      this._handleDirectorRegisterSendOtp();
    });
    document.getElementById('director-register-verify-btn')?.addEventListener('click', () => {
      this._handleDirectorRegisterVerifyOtp();
    });
    document.getElementById('director-register-resend-link')?.addEventListener('click', () => {
      this._handleDirectorRegisterSendOtp(true);
    });
    document.getElementById('director-register-create-btn')?.addEventListener('click', () => {
      this._handleDirectorRegisterCreate();
    });

    // Guard Registration
    document.getElementById('guard-register-btn')?.addEventListener('click', () => {
      this._handleGuardRegister();
    });
    document.getElementById('guard-register-send-otp-btn')?.addEventListener('click', () => {
      this._handleGuardRegister();
    });
    document.getElementById('guard-register-verify-btn')?.addEventListener('click', () => {
      this._handleGuardVerifyOtp();
    });
    document.getElementById('guard-register-resend-link')?.addEventListener('click', () => {
      this._handleGuardRegister(true);
    });

    // Admin Register
  },

  _bindRoleTabs() {
    document.querySelectorAll('.role-tab[data-role]').forEach((el) => {
      el.addEventListener('click', () => {
        this._selectedRole = el.dataset.role;
        document.querySelectorAll('.role-tab[data-role]').forEach((t) => t.classList.remove('active'));
        el.classList.add('active');
        // Reset registration modes when role changes
        this._hideAllRegistrations();
        this._updateLoginMode();
        this._updateRegisterLink();
      });
    });

    document.querySelectorAll('.campus-tab').forEach((el) => {
      el.addEventListener('click', () => {
        this._selectedCollege = el.dataset.college;
        document.querySelectorAll('.campus-tab').forEach((t) => t.classList.remove('active'));
        el.classList.add('active');
      });
    });

    document.getElementById('role-section')?.addEventListener('click', (e) => {
      if (e.target.closest('#admin-mode-login-btn')) { this._switchAdminMode(false); return; }
    });

    const backLink = document.getElementById('back-to-roles-link');
    if (backLink) {
      backLink.addEventListener('click', () => {
        this._adminMode = false;
        this._selectedRole = 'STUDENT';
        this._adminOtpRequested = false;
        this._hideAllRegistrations();
        document.getElementById('role-section').innerHTML = this._roleSectionHtml();
        document.getElementById('admin-toggle-link').classList.remove('hidden');
        document.getElementById('register-link-wrap').classList.remove('hidden');
        document.getElementById('back-to-login-link').classList.add('hidden');
        this._bindRoleTabs();
        this._updateLoginMode();
        this._updateRegisterLink();
      });
    }
  },

  _switchAdminMode(registerMode) {
    this._adminRegisterMode = false;
    this._adminOtpRequested = false;
    this._adminPendingEmail = '';
    this._hideAllRegistrations();
    document.getElementById('role-section').innerHTML = this._roleSectionHtml();
    this._bindRoleTabs();
    this._updateLoginMode();
    this._updateRegisterLink();
  },

  _updateLoginMode() {
    const isHod = this._selectedRole === 'HOD' && !this._adminMode;
    const isAnyRegistration = this._facultyRegisterMode || 
                             this._hodRegisterMode || this._guardRegisterMode || this._directorRegisterMode;

    // Main login fields - hide for HOD and registrations only
    document.getElementById('main-login-fields').classList.toggle('hidden', isHod || isAnyRegistration || this._adminRegisterMode);

    // HOD login fields - show only when HOD is selected and not in registration
    document.getElementById('hod-login-fields').classList.toggle('hidden', !isHod || isAnyRegistration);

    // Registration fields
    document.getElementById('faculty-register-fields').classList.toggle('hidden', !this._facultyRegisterMode);
    document.getElementById('hod-register-fields').classList.toggle('hidden', !this._hodRegisterMode);
    document.getElementById('guard-register-fields').classList.toggle('hidden', !this._guardRegisterMode);
    document.getElementById('director-register-fields').classList.toggle('hidden', !this._directorRegisterMode);
    const adminRegisterFields = document.getElementById('admin-register-fields');
    if (adminRegisterFields) adminRegisterFields.classList.toggle('hidden', !this._adminRegisterMode);

    // Faculty Register OTP sections
    const isFacultyRegister = this._facultyRegisterMode;
    document.getElementById('faculty-register-otp-wrap').classList.toggle('hidden', !isFacultyRegister || this._facultyOtpRequested);
    document.getElementById('faculty-register-verify-wrap').classList.toggle('hidden', !isFacultyRegister || !this._facultyOtpRequested);

    // HOD Register OTP sections
    const isHodRegister = this._hodRegisterMode;
    const hodOtpVerified = !!this._hodRegisterToken;
    document.getElementById('hod-register-otp-wrap').classList.toggle('hidden', !isHodRegister || this._hodRegisterOtpRequested);
    document.getElementById('hod-register-verify-wrap').classList.toggle('hidden', !isHodRegister || !this._hodRegisterOtpRequested || hodOtpVerified);
    document.getElementById('hod-register-password-wrap').classList.toggle('hidden', !isHodRegister || !hodOtpVerified);

    // Guard Register OTP sections
    const isGuardRegister = this._guardRegisterMode;
    document.getElementById('guard-register-otp-wrap').classList.toggle('hidden', !isGuardRegister || this._guardOtpRequested);
    document.getElementById('guard-register-verify-wrap').classList.toggle('hidden', !isGuardRegister || !this._guardOtpRequested);

    // Director Register OTP sections
    const isDirectorRegister = this._directorRegisterMode;
    const directorOtpVerified = !!this._directorRegisterToken;
    document.getElementById('director-register-otp-wrap').classList.toggle('hidden', !isDirectorRegister || this._directorOtpRequested);
    document.getElementById('director-register-verify-wrap').classList.toggle('hidden', !isDirectorRegister || !this._directorOtpRequested || directorOtpVerified);
    document.getElementById('director-register-password-wrap').classList.toggle('hidden', !isDirectorRegister || !directorOtpVerified);

    // Admin Register OTP
    const adminRegisterOtpWrap = document.getElementById('admin-register-otp-wrap');
    if (adminRegisterOtpWrap) adminRegisterOtpWrap.classList.toggle('hidden', !this._adminRegisterMode || this._adminOtpRequested);
    const adminVerifyWrap = document.getElementById('admin-verify-wrap');
    if (adminVerifyWrap) adminVerifyWrap.classList.toggle('hidden', !this._adminRegisterMode || !this._adminOtpRequested);

    // Forgot password link
    document.getElementById('forgot-password-link').classList.toggle('hidden', isHod || isAnyRegistration || this._adminMode);
  },

  _updateRegisterLink() {
    const role = this._selectedRole;
    const linkText = document.getElementById('register-link-text');
    const linkLabel = document.getElementById('register-link-label');

    if (!linkText || !linkLabel) return;

    if (role === 'STUDENT') {
      linkText.textContent = 'New student? ';
      linkLabel.textContent = 'Create an account';
    } else if (role === 'FACULTY') {
      linkText.textContent = 'New Faculty? ';
      linkLabel.textContent = 'Register as Faculty';
    } else if (role === 'HOD') {
      linkText.textContent = 'New HOD? ';
      linkLabel.textContent = 'Register as HOD';
    } else if (role === 'GUARD') {
      linkText.textContent = 'New Guard? ';
      linkLabel.textContent = 'Register as Guard';
    } else if (role === 'DIRECTOR') {
      linkText.textContent = 'New Director? ';
      linkLabel.textContent = 'Register as Director';
    } else {
      linkText.textContent = 'New user? ';
      linkLabel.textContent = 'Register here';
    }

    // Hide registration link when in registration mode or admin mode
    const isAnyRegistration = this._studentRegisterMode || this._facultyRegisterMode || 
                             this._hodRegisterMode || this._guardRegisterMode || this._directorRegisterMode;
    document.getElementById('register-link-wrap').classList.toggle('hidden', isAnyRegistration || this._adminMode);
  },

  _hideAllRegistrations() {
    this._facultyRegisterMode = false;
    this._hodRegisterMode = false;
    this._guardRegisterMode = false;
    this._directorRegisterMode = false;
    this._hodRegisterOtpRequested = false;
    this._facultyOtpRequested = false;
    this._guardOtpRequested = false;
    this._directorOtpRequested = false;
    this._facultyPendingEmail = '';
    this._guardPendingEmail = '';
    this._directorPendingEmail = '';
    this._directorRegisterToken = '';
  },

  _showStudentRegistration() {
    Router.navigate('register');
  },

  _showFacultyRegistration() {
    this._hideAllRegistrations();
    this._facultyRegisterMode = true;
    document.getElementById('admin-toggle-link').classList.add('hidden');
    document.getElementById('back-to-login-link').classList.remove('hidden');
    this._updateLoginMode();
    this._updateRegisterLink();
  },

  _showHodRegistration() {
    this._hideAllRegistrations();
    this._hodRegisterMode = true;
    document.getElementById('admin-toggle-link').classList.add('hidden');
    document.getElementById('back-to-login-link').classList.remove('hidden');
    this._updateLoginMode();
    this._updateRegisterLink();
  },

  _showGuardRegistration() {
    this._hideAllRegistrations();
    this._guardRegisterMode = true;
    document.getElementById('admin-toggle-link').classList.add('hidden');
    document.getElementById('back-to-login-link').classList.remove('hidden');
    this._updateLoginMode();
    this._updateRegisterLink();
  },

  _showDirectorRegistration() {
    this._hideAllRegistrations();
    this._directorRegisterMode = true;
    document.getElementById('admin-toggle-link').classList.add('hidden');
    document.getElementById('back-to-login-link').classList.remove('hidden');
    this._updateLoginMode();
    this._updateRegisterLink();
  },

  async _handleDirectorRegisterSendOtp(isResend = false) {
    const name = document.getElementById('director-reg-name').value.trim();
    const employeeId = document.getElementById('director-reg-employee-id').value.trim();
    const college = document.getElementById('director-reg-college').value;
    const phone = document.getElementById('director-reg-phone').value.trim();
    const email = document.getElementById('director-reg-email').value.trim();
    const password = document.getElementById('director-reg-password').value;
    const passwordConfirm = document.getElementById('director-reg-password-confirm').value;

    if (!isResend) {
      if (!name) return UI.toast('Please enter full name', 'warning');
      if (!employeeId) return UI.toast('Please enter employee ID', 'warning');
      if (!college) return UI.toast('Please select college', 'warning');
      if (!phone) return UI.toast('Please enter phone number', 'warning');
      if (!email) return UI.toast('Please enter Gmail address', 'warning');
      if (!email.includes('@')) return UI.toast('Please enter a valid email', 'warning');
      if (!password || password.length < 6) return UI.toast('Password must be at least 6 characters', 'warning');
      if (password !== passwordConfirm) return UI.toast('Passwords do not match', 'danger');
    }

    this._setDirectorSendLoading(true);
    try {
      const res = await Api.post('/auth/director/register/send-otp', {
        name,
        employeeId,
        college,
        phone,
        campus: college,
        email: email || this._directorPendingEmail,
      });

      const { emailSent } = res.data;
      this._directorPendingEmail = email || this._directorPendingEmail;
      this._directorPassword = password;
      this._directorOtpRequested = true;
      this._directorRegisterToken = '';
      this._updateLoginMode();

      if (emailSent) {
        await UI.toast(isResend ? 'New OTP sent ✅' : 'OTP sent to your Gmail ✅', 'success');
      } else {
        await UI.toast('OTP email could not be delivered. Please contact your administrator.', 'danger');
      }
    } catch (e) {
      await UI.toast(e.message || 'Unable to send OTP', 'danger');
    } finally {
      this._setDirectorSendLoading(false);
    }
  },

  async _handleDirectorRegisterVerifyOtp() {
    const otp = document.getElementById('director-register-otp').value.trim();
    if (!otp || otp.length < 4) return UI.toast('Enter the OTP sent to your Gmail', 'danger');

    this._setDirectorVerifyLoading(true);
    try {
      const res = await Api.post('/auth/director/register/verify-otp', {
        email: this._directorPendingEmail,
        otp,
      });
      const token = res?.token || res?.data?.token;
      if (!token) throw new Error('OTP verification did not return a token');
      this._directorRegisterToken = token;
      this._updateLoginMode();
      await UI.toast('OTP verified! Creating your account now...', 'success');
    } catch (e) {
      await UI.toast(e.message || 'OTP verification failed', 'danger');
    } finally {
      this._setDirectorVerifyLoading(false);
    }
  },

  async _handleDirectorRegisterCreate() {
    this._setDirectorSendLoading(true);
    try {
      await Api.post('/auth/director/register/complete', {
        email: this._directorPendingEmail,
        password: this._directorPassword,
        token: this._directorRegisterToken,
      });
      await UI.toast('Director registration submitted. Awaiting admin approval.', 'success');
      await Router.reset('login');
    } catch (e) {
      await UI.toast(e.message || 'Failed to submit registration', 'danger');
    } finally {
      this._setDirectorRegisterLoading(false);
    }
  },

  _setDirectorRegisterLoading(isLoading) {
    const label = document.getElementById('director-register-create-label');
    const spinner = document.getElementById('director-register-create-spinner');
    const button = document.getElementById('director-register-create-btn');
    if (button) button.disabled = isLoading;
    if (spinner) spinner.classList.toggle('hidden', !isLoading);
    if (label) label.textContent = isLoading ? 'Creating account...' : 'Create Director Account';
  },

  // ---- Login Handlers ----

  // Common Login (Student, Faculty, Guard)
  async _handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    if (!email || !password) return UI.toast('Email and password are required', 'danger');

    this._setLoading(true);
    try {
      // Admin login: no campus filter (admin sees all colleges)
      const college = this._adminMode ? undefined : undefined;
      const user = await Auth.login(email, password, this._selectedRole, college);
      const dashMap = { ADMIN: 'admin-dashboard', FACULTY: 'faculty-dashboard', HOD: 'hod-dashboard', GUARD: 'guard-dashboard', DIRECTOR: 'director-dashboard', STUDENT: 'student-dashboard' };
      await Router.reset(dashMap[user.role] || 'student-dashboard');
    } catch (e) {
      await UI.toast(e.message || 'Login failed', 'danger');
    } finally {
      this._setLoading(false);
    }
  },

  // HOD Login
  async _handleHodPasswordLogin() {
    const email = document.getElementById('hod-login-email').value.trim();
    const password = document.getElementById('hod-login-password').value;
    
    if (!email || !password) return UI.toast('Email and password are required', 'danger');

    this._setHodPasswordLoading(true);
    try {
      const user = await Auth.login(email, password, 'HOD');
      await Router.reset('hod-dashboard');
    } catch (e) {
      await UI.toast(e.message || 'Login failed. Please check your credentials.', 'danger');
    } finally {
      this._setHodPasswordLoading(false);
    }
  },

  // ---- Registration Handlers ----

  // Faculty Registration
  async _handleFacultyRegister(isResend = false) {
    const name = document.getElementById('faculty-reg-name').value.trim();
    const employeeId = document.getElementById('faculty-reg-employee-id').value.trim();
    const department = document.getElementById('faculty-reg-department').value;
    const designation = document.getElementById('faculty-reg-designation').value.trim();
    const college = document.getElementById('faculty-reg-college').value;
    const phone = document.getElementById('faculty-reg-phone').value.trim();
    const password = document.getElementById('faculty-reg-password').value;
    const email = document.getElementById('faculty-reg-email').value.trim();

    if (!isResend) {
      if (!name) return UI.toast('Please enter full name', 'warning');
      if (!employeeId) return UI.toast('Please enter employee ID', 'warning');
      if (!department) return UI.toast('Please select department', 'warning');
      if (!designation) return UI.toast('Please enter designation', 'warning');
      if (!college) return UI.toast('Please select college', 'warning');
      if (!phone) return UI.toast('Please enter phone number', 'warning');
      if (!password || password.length < 6) return UI.toast('Please enter password at least 6 characters', 'warning');
      if (!email) return UI.toast('Please enter Gmail address', 'warning');
      if (!email.includes('@')) return UI.toast('Please enter a valid email', 'warning');
    }

    this._setFacultyRegisterLoading(true);
    try {
      const res = await Api.post('/auth/faculty/register/send-otp', {
        name,
        employeeId,
        department,
        designation,
        college,
        phone,
        campus: college,
        password,
        email: email || this._facultyPendingEmail,
      });

      const { emailSent } = res.data;
      this._facultyPendingEmail = email || this._facultyPendingEmail;
      this._facultyOtpRequested = true;
      this._updateLoginMode();
      if (emailSent) {
        await UI.toast(isResend ? 'New OTP sent ✅' : 'OTP sent to your Gmail ✅', 'success');
      } else {
        await UI.toast('OTP email could not be delivered. Please contact your administrator.', 'danger');
      }
    } catch (e) {
      await UI.toast(e.message || 'Registration failed', 'danger');
    } finally {
      this._setFacultyRegisterLoading(false);
    }
  },

  async _handleFacultyVerifyOtp() {
    const otp = document.getElementById('faculty-register-otp').value.trim();
    if (!otp || otp.length < 4) return UI.toast('Enter the OTP sent to your Gmail', 'danger');

    this._setFacultyRegisterLoading(true);
    try {
      const res = await Api.post('/auth/faculty/register/verify-otp', {
        email: this._facultyPendingEmail,
        otp,
      });
      await UI.toast(res.message || 'Faculty registration submitted. Awaiting admin approval.', 'success');
      await Router.reset('login');
    } catch (e) {
      await UI.toast(e.message || 'OTP verification failed', 'danger');
    } finally {
      this._setFacultyRegisterLoading(false);
    }
  },

  // HOD Registration
  async _handleHodRegisterSendOtp(isResend = false) {
    const name = document.getElementById('hod-reg-name').value.trim();
    const employeeId = document.getElementById('hod-reg-employee-id').value.trim();
    const department = document.getElementById('hod-reg-department').value;
    const college = document.getElementById('hod-reg-college').value;
    const phone = document.getElementById('hod-reg-phone').value.trim();
    const email = document.getElementById('hod-reg-email').value.trim();
    const password = document.getElementById('hod-reg-password').value;
    const passwordConfirm = document.getElementById('hod-reg-password-confirm').value;

    if (!isResend) {
      if (!name) return UI.toast('Please enter full name', 'warning');
      if (!employeeId) return UI.toast('Please enter employee ID', 'warning');
      if (!department) return UI.toast('Please select department', 'warning');
      if (!college) return UI.toast('Please select college', 'warning');
      if (!phone) return UI.toast('Please enter phone number', 'warning');
      if (!email) return UI.toast('Please enter Gmail address', 'warning');
      if (!email.includes('@')) return UI.toast('Please enter a valid email', 'warning');
      if (!password || password.length < 6) return UI.toast('Password must be at least 6 characters', 'warning');
      if (password !== passwordConfirm) return UI.toast('Passwords do not match', 'danger');
    }

    this._setHodRegisterSendLoading(true);
    try {
      const res = await Api.post('/auth/hod/register/send-otp', {
        name, employeeId, department, college, phone,
        email: email || this._hodRegisterPendingEmail
      });
      const { emailSent } = res.data;
      this._hodRegisterPendingEmail = email || this._hodRegisterPendingEmail;
      this._hodRegisterPassword = password;
      this._hodRegisterOtpRequested = true;
      this._updateLoginMode();
      if (emailSent) {
        await UI.toast(isResend ? 'New OTP sent ✅' : 'OTP sent to your Gmail ✅', 'success');
      } else {
        await UI.toast('OTP email could not be delivered. Please contact your administrator.', 'danger');
      }
    } catch (e) {
      await UI.toast(e.message || 'Failed to send OTP', 'danger');
    } finally {
      this._setHodRegisterSendLoading(false);
    }
  },

  async _handleHodRegisterVerifyOtp() {
    const otp = document.getElementById('hod-register-otp').value.trim();
    if (!otp || otp.length < 4) return UI.toast('Enter the OTP sent to your Gmail', 'danger');

    this._setHodRegisterVerifyLoading(true);
    try {
      const res = await Api.post('/auth/hod/register/verify-otp', {
        email: this._hodRegisterPendingEmail,
        otp,
      });
      const token = res?.token || res?.data?.token;
      if (!token) throw new Error('OTP verification did not return a token');
      this._hodRegisterToken = token;
      this._hodRegisterOtpRequested = true;
      this._updateLoginMode();
      await UI.toast('OTP verified! Creating your account now...', 'success');
    } catch (e) {
      await UI.toast(e.message || 'OTP verification failed', 'danger');
    } finally {
      this._setHodRegisterVerifyLoading(false);
    }
  },

  async _handleHodRegisterCreate() {
    this._setHodRegisterCreateLoading(true);
    try {
      await Api.post('/auth/hod/register/complete', {
        email: this._hodRegisterPendingEmail,
        password: this._hodRegisterPassword,
        token: this._hodRegisterToken,
      });
      await UI.toast('HOD registration submitted. Awaiting admin approval.', 'success');
      await Router.reset('login');
    } catch (e) {
      await UI.toast(e.message || 'Failed to submit registration', 'danger');
    } finally {
      this._setHodRegisterCreateLoading(false);
    }
  },

  // Guard Registration
  async _handleGuardRegister(isResend = false) {
    const name = document.getElementById('guard-reg-name').value.trim();
    const employeeId = document.getElementById('guard-reg-employee-id').value.trim();
    const gate = document.getElementById('guard-reg-gate').value.trim();
    const college = document.getElementById('guard-reg-college').value;
    const phone = document.getElementById('guard-reg-phone').value.trim();
    const password = document.getElementById('guard-reg-password').value;
    const email = document.getElementById('guard-reg-email').value.trim();

    if (!isResend) {
      if (!name) return UI.toast('Please enter full name', 'warning');
      if (!employeeId) return UI.toast('Please enter employee ID', 'warning');
      if (!gate) return UI.toast('Please enter assigned gate', 'warning');
      if (!college) return UI.toast('Please select college', 'warning');
      if (!phone) return UI.toast('Please enter phone number', 'warning');
      if (!password || password.length < 6) return UI.toast('Please enter password at least 6 characters', 'warning');
      if (!email) return UI.toast('Please enter Gmail address', 'warning');
      if (!email.includes('@')) return UI.toast('Please enter a valid email', 'warning');
    }

    this._setGuardRegisterLoading(true);
    try {
      const res = await Api.post('/auth/guard/register/send-otp', {
        name,
        employeeId,
        gate,
        college,
        phone,
        campus: college,
        password,
        email: email || this._guardPendingEmail,
      });

      const { emailSent } = res.data;
      this._guardPendingEmail = email || this._guardPendingEmail;
      this._guardOtpRequested = true;
      this._updateLoginMode();
      if (emailSent) {
        await UI.toast(isResend ? 'New OTP sent ✅' : 'OTP sent to your Gmail ✅', 'success');
      } else {
        await UI.toast('OTP email could not be delivered. Please contact your administrator.', 'danger');
      }
    } catch (e) {
      await UI.toast(e.message || 'Registration failed', 'danger');
    } finally {
      this._setGuardRegisterLoading(false);
    }
  },

  async _handleGuardVerifyOtp() {
    const otp = document.getElementById('guard-register-otp').value.trim();
    if (!otp || otp.length < 4) return UI.toast('Enter the OTP sent to your Gmail', 'danger');

    this._setGuardRegisterLoading(true);
    try {
      const res = await Api.post('/auth/guard/register/verify-otp', {
        email: this._guardPendingEmail,
        otp,
      });
      await UI.toast(res.message || 'Guard registration submitted. Awaiting admin approval.', 'success');
      await Router.reset('login');
    } catch (e) {
      await UI.toast(e.message || 'OTP verification failed', 'danger');
    } finally {
      this._setGuardRegisterLoading(false);
    }
  },

  // Admin Register
  async _handleAdminSendOtp(isResend = false) {
    const name = document.getElementById('admin-register-name').value.trim();
    const email = document.getElementById('admin-register-email').value.trim();
    const password = document.getElementById('admin-register-password').value;
    const college = document.getElementById('admin-register-college').value;
    const campusCodeRaw = document.getElementById('admin-campus-code').value;
    const campusCode = String(campusCodeRaw || '').trim();
    const campusCodeKey = campusCode.toLowerCase();

    if (!isResend) {
      if (!name) return UI.toast('Enter your full name', 'danger');
      if (!email) return UI.toast('Enter your Gmail address', 'danger');
      if (!password || password.length < 6) return UI.toast('Password must be at least 6 characters', 'danger');
      if (!college) return UI.toast('Select your college', 'danger');
      if (!campusCode) return UI.toast('Enter campus code', 'danger');

      const validCodes = { 'bist@#123': 'BIST', 'birt@#123': 'BIRT', 'birts@#123': 'BIRTS' };
      if (!validCodes[campusCodeKey]) return UI.toast('Invalid campus code', 'danger');
    }

    this._setAdminSendLoading(true);
    try {
      const res = await Api.post('/auth/admin/register/send-otp', {
        name,
        email: email || this._adminPendingEmail,
        password,
        college,
        campusCode,
      });
      const { emailSent } = res.data;
      this._adminPendingEmail = email || this._adminPendingEmail;
      this._adminOtpRequested = true;
      this._updateLoginMode();
      if (emailSent) {
        await UI.toast(isResend ? 'New OTP sent ✅' : 'OTP sent to your Gmail ✅', 'success');
      } else {
        await UI.toast('OTP email could not be delivered. Please contact your administrator.', 'danger');
      }
    } catch (e) {
      await UI.toast(e.message || 'Failed to send OTP', 'danger');
    } finally {
      this._setAdminSendLoading(false);
    }
  },

  async _handleAdminVerifyOtp() {
    const otp = document.getElementById('admin-otp').value.trim();
    if (!otp || otp.length < 4) return UI.toast('Enter the OTP sent to your Gmail', 'danger');

    this._setAdminVerifyLoading(true);
    try {
      const res = await Api.post('/auth/admin/register/verify-otp', {
        email: this._adminPendingEmail,
        otp,
      });
      const { token, user } = res.data;
      Storage.saveSession(token, user);
      await UI.toast('Admin account created! Welcome ✅', 'success');
      await Router.reset('admin-dashboard');
    } catch (e) {
      await UI.toast(e.message || 'OTP verification failed', 'danger');
    } finally {
      this._setAdminVerifyLoading(false);
    }
  },

  // ---- Loading Helpers ----

  _setLoading(on) {
    const btn = document.getElementById('login-btn');
    if (btn) btn.disabled = on;
    const label = document.getElementById('login-btn-label');
    if (label) label.classList.toggle('hidden', on);
    const spinner = document.getElementById('login-spinner');
    if (spinner) spinner.classList.toggle('hidden', !on);
  },

  _setHodPasswordLoading(on) {
    const btn = document.getElementById('hod-password-login-btn-submit');
    if (btn) btn.disabled = on;
    const label = document.getElementById('hod-password-login-label');
    if (label) label.classList.toggle('hidden', on);
    const spinner = document.getElementById('hod-password-login-spinner');
    if (spinner) spinner.classList.toggle('hidden', !on);
  },


  _setFacultyRegisterLoading(on) {
    const btn = document.getElementById('faculty-register-btn');
    if (btn) {
      btn.disabled = on;
      btn.innerHTML = on ? 
        '<ion-spinner name="dots" style="width:20px;height:20px;"></ion-spinner> Registering...' :
        '<ion-icon name="person-add-outline" slot="start"></ion-icon> Register as Faculty';
    }
  },

  _setHodRegisterSendLoading(on) {
    const btn = document.getElementById('hod-register-send-otp-btn');
    if (btn) btn.disabled = on;
    const label = document.getElementById('hod-register-send-otp-label');
    if (label) label.classList.toggle('hidden', on);
    const spinner = document.getElementById('hod-register-send-otp-spinner');
    if (spinner) spinner.classList.toggle('hidden', !on);
  },

  _setHodRegisterVerifyLoading(on) {
    const btn = document.getElementById('hod-register-verify-btn');
    if (btn) btn.disabled = on;
    const label = document.getElementById('hod-register-verify-label');
    if (label) label.classList.toggle('hidden', on);
    const spinner = document.getElementById('hod-register-verify-spinner');
    if (spinner) spinner.classList.toggle('hidden', !on);
  },

  _setHodRegisterCreateLoading(on) {
    const btn = document.getElementById('hod-register-create-btn');
    if (btn) {
      btn.disabled = on;
      btn.innerHTML = on ?
        '<ion-spinner name="dots" style="width:20px;height:20px;"></ion-spinner> Creating...' :
        '<ion-icon name="person-add-outline" slot="start"></ion-icon> Create HOD Account';
    }
  },

  _setDirectorSendLoading(on) {
    const btn = document.getElementById('director-register-send-otp-btn');
    if (btn) btn.disabled = on;
    const label = document.getElementById('director-register-send-otp-label');
    if (label) label.classList.toggle('hidden', on);
    const spinner = document.getElementById('director-register-send-otp-spinner');
    if (spinner) spinner.classList.toggle('hidden', !on);
  },

  _setDirectorVerifyLoading(on) {
    const btn = document.getElementById('director-register-verify-btn');
    if (btn) btn.disabled = on;
    const label = document.getElementById('director-register-verify-label');
    if (label) label.classList.toggle('hidden', on);
    const spinner = document.getElementById('director-register-verify-spinner');
    if (spinner) spinner.classList.toggle('hidden', !on);
  },

  _setGuardRegisterLoading(on) {
    const btn = document.getElementById('guard-register-btn');
    if (btn) {
      btn.disabled = on;
      btn.innerHTML = on ?
        '<ion-spinner name="dots" style="width:20px;height:20px;"></ion-spinner> Registering...' :
        '<ion-icon name="person-add-outline" slot="start"></ion-icon> Register as Guard';
    }
  },

  _setAdminSendLoading(on) {
    const btn = document.getElementById('admin-send-otp-btn');
    if (btn) btn.disabled = on;
    const label = document.getElementById('admin-send-otp-label');
    if (label) label.classList.toggle('hidden', on);
    const spinner = document.getElementById('admin-send-otp-spinner');
    if (spinner) spinner.classList.toggle('hidden', !on);
  },

  _setAdminVerifyLoading(on) {
    const btn = document.getElementById('admin-verify-btn');
    if (btn) btn.disabled = on;
    const label = document.getElementById('admin-verify-label');
    if (label) label.classList.toggle('hidden', on);
    const spinner = document.getElementById('admin-verify-spinner');
    if (spinner) spinner.classList.toggle('hidden', !on);
  },
};