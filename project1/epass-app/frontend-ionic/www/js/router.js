// =====================================================================
// E-PASS — Lightweight SPA router (no framework — plain JS + Ionic web components)
// Pages are plain objects: { render(params) -> htmlString, afterRender(params) }
// =====================================================================

const Router = {
  _root: null,
  _stack: [], // [{ page, params }] — supports goBack()

  init(rootSelector) {
    this._root = document.querySelector(rootSelector);

    // Capacitor / Android hardware back button support
    document.addEventListener('ionBackButton', (ev) => {
      ev.detail.register(10, () => {
        if (this._stack.length > 1) this.goBack();
      });
    });
  },

  async navigate(pageKey, params = {}, { replace = false } = {}) {
    const page = Pages[pageKey];
    if (!page) {
      console.error('Unknown page:', pageKey);
      return;
    }

    this._root.innerHTML = page.render(params);
    if (typeof page.afterRender === 'function') {
      await page.afterRender(params);
    }

    const entry = { pageKey, params };
    if (replace) {
      this._stack[this._stack.length - 1] = entry;
    } else {
      this._stack.push(entry);
    }
  },

  /** Clears history and navigates fresh — used after login/logout. */
  async reset(pageKey, params = {}) {
    this._stack = [];
    await this.navigate(pageKey, params);
  },

  async goBack() {
    if (this._stack.length <= 1) return;
    this._stack.pop();
    const prev = this._stack[this._stack.length - 1];
    this._stack.pop(); // will be re-pushed by navigate()
    await this.navigate(prev.pageKey, prev.params);
  },
};

// Populated by each page module (see js/pages/*.js)
const Pages = {};
