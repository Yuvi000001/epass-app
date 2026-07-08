// =====================================================================
// E-PASS — Auth helper (login, logout, current user, profile fetch)
// =====================================================================

const Auth = {
  async login(email, password, role, campus) {
    const res = await Api.post('/auth/login', { email, password, role, campus });
    const { token, user } = res.data;
    Storage.saveSession(token, user);
    return user;
  },

  async fetchProfile() {
    const res = await Api.get('/auth/me');
    Storage.setUser(res.data);
    return res.data;
  },

  getCurrentUser() {
    return Storage.getUser();
  },

  isLoggedIn() {
    return Storage.isLoggedIn();
  },

  logout() {
    Storage.clearSession();
  },
};
