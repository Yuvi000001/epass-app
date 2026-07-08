// =====================================================================
// E-PASS — App bootstrap
// =====================================================================

window.addEventListener('DOMContentLoaded', () => {
  Router.init('#app-root');
  Router.navigate('splash');
});

// If running inside the Capacitor native shell, hide the splash screen
// (the web "splash" page above is shown first; this just dismisses the
// native launch screen once our JS has taken over).
if (window.Capacitor?.Plugins?.SplashScreen) {
  window.Capacitor.Plugins.SplashScreen.hide();
}
