// =====================================================================
// E-PASS — App-wide configuration
// =====================================================================

// Point this at your deployed backend (see docs/DEPLOYMENT_GUIDE.md).
// When running inside an Android emulator via Capacitor's local dev server,
// use 10.0.2.2 instead of localhost.
const APP_CONFIG = {
  baseUrl: 'https://epass-app.onrender.com/api',
  appName: 'E-PASS',
  collegeName: 'Bansal Group of Institutes',
  collegeTagline: 'Bhopal | Indore | Mandideep',
  leaveTypes: ['Medical', 'Personal', 'Family Function', 'Emergency', 'Other'],
  maxReasonLength: 250,

  // 3 campuses — used on the Admin login picker and the registration form
  campuses: [
    { code: 'BIST', label: 'BIST (Bansal Institute of Science & Technology)' },
    { code: 'BIRT', label: 'BIRT (Bansal Institute of Research & Technology)' },
    { code: 'BIRTS', label: 'BIRTS (Bansal Institute of Research Technology & Science)' },
  ],

  // ---- EmailJS (sends the OTP email straight from the browser — no backend mail server needed) ----
  // Get these 3 values from https://dashboard.emailjs.com after creating a free account:
  //   1. "Email Services" tab -> Add Service (e.g. connect your Gmail) -> copy the Service ID
  //   2. "Email Templates" tab -> Create Template using variables {{to_name}}, {{to_email}}, {{otp_code}}
  //      -> copy the Template ID
  //   3. "Account" -> "General" -> copy your Public Key
  emailjs: {
    publicKey: 'FnU10eqISuYJJ0Hdi',
    serviceId: 'service_hsz4h2p',
    templateId: 'template_efbqrro',
  },
};
