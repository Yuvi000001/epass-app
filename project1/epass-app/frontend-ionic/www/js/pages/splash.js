   // =====================================================================
// E-PASS — Splash Screen
// =====================================================================

Pages['splash'] = {
  render() {
    return `
      <div class="splash-screen">
        <img src="assets/images/logo.png" alt="BGI Logo" class="logo-image" style="object-fit:contain;"
             onload="document.getElementById('college-text-block').style.display='none';"
             onerror="this.replaceWith(Object.assign(document.createElement('div'), {className:'splash-logo', innerHTML:'<ion-icon name=\\'shield-half-outline\\'></ion-icon>'}));" />
        <div id="college-text-block">
          <div class="college-name">${APP_CONFIG.collegeName}</div>
          <div class="college-tagline">${APP_CONFIG.collegeTagline}</div>
        </div>
        <div class="app-badge"><ion-icon name="checkmark-done-circle-outline"></ion-icon></div>
        <div class="app-name">${APP_CONFIG.appName}</div>
        <div class="app-sub">Leave Management System</div>
        <ion-spinner name="crescent" color="primary"></ion-spinner>
      </div>
    `;
  },

  async afterRender() {
    await new Promise((r) => setTimeout(r, 1200));

    if (!Auth.isLoggedIn()) {
      await Router.reset('login');
      return;
    }

    const user = Auth.getCurrentUser();
    if (!user) {
      await Router.reset('login');
      return;
    }

    const dashboardByRole = {
      ADMIN: 'admin-dashboard',
      FACULTY: 'faculty-dashboard',
      HOD: 'hod-dashboard',
      GUARD: 'guard-dashboard',
      DIRECTOR: 'director-dashboard',
      STUDENT: 'student-dashboard',
    };
    await Router.reset(dashboardByRole[user.role] || 'student-dashboard');
  },
};
