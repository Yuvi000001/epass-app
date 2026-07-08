const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;
  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    console.warn('Email (SMTP) not configured — OTP emails will not be sent. Set EMAIL_HOST/EMAIL_USER/EMAIL_PASS in .env');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT) || 465,
    secure: Number(EMAIL_PORT) === 465, // true for port 465, false for 587
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });

  return transporter;
}

/**
 * Sends the OTP verification email via Gmail SMTP (or any SMTP provider).
 * Returns true if an email was actually sent, false if SMTP isn't configured
 * (the caller should fall back to showing the OTP on-screen in that case).
 */
async function sendOtpEmail({ toEmail, toName, otp, expiryMinutes }) {
  const t = getTransporter();
  if (!t) return false;

  // DEV: log OTP to server console for local testing/debugging
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log(`[DEV] sendOtpEmail -> OTP for ${toEmail}: ${otp} (valid ${expiryMinutes} minutes)`);
    } catch (e) {}
  }

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const logoUrl = 'https://res.cloudinary.com/dnldcrhab/image/upload/f_auto,q_auto/18561_cxj7ez';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>BGI Email Template - OTP</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f0f6fe;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 30px auto;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
          overflow: hidden;
          border: 1px solid #dce8f5;
        }
        .inner { padding: 36px 40px 30px 40px; }
        .logo-area {
          text-align: center;
          padding-bottom: 18px;
          border-bottom: 3px solid #1a4b8c;
          margin-bottom: 24px;
        }
        .logo-area img { max-width: 170px; height: auto; }
        h2 {
          color: #0a2a4a;
          font-weight: 600;
          font-size: 22px;
          margin-top: 0;
          margin-bottom: 6px;
        }
        .sub-head {
          color: #1f3a5f;
          font-size: 15px;
          line-height: 1.6;
          margin-bottom: 22px;
        }
        .otp-box {
          background: #f5faff;
          border: 2px solid #d0e2f7;
          border-radius: 18px;
          padding: 28px 20px 24px 20px;
          text-align: center;
          margin: 20px 0 24px 0;
        }
        .otp-label {
          font-size: 14px;
          font-weight: 700;
          color: #1a4b8c;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 12px;
          display: block;
        }
        .otp-code {
          font-family: 'Courier New', monospace;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 8px;
          color: #0a2a4a;
          background: #ffffff;
          padding: 10px 18px;
          border-radius: 14px;
          border: 1px solid #b8cee8;
          display: inline-block;
          min-width: 160px;
          box-shadow: 0 2px 8px rgba(10, 42, 74, 0.06);
        }
        .otp-timer {
          margin-top: 14px;
          font-size: 14px;
          color: #2b5280;
          background: #e8f0fe;
          padding: 4px 18px;
          border-radius: 40px;
          display: inline-block;
          border: 1px solid #c8ddf5;
        }
        .divider {
          height: 2px;
          background: linear-gradient(to right, #c2d8f0, #ffffff);
          margin: 24px 0 18px 0;
          border: 0;
        }
        .signature { margin-top: 6px; color: #1f3a5f; }
        .signature .institute { color: #1a4b8c; font-weight: 700; }
        .tagline { font-size: 14px; color: #3b5f87; margin-top: 8px; }
        .tagline span {
          background: #eaf2fc;
          padding: 3px 14px;
          border-radius: 30px;
          border: 1px solid #c2d6ed;
          display: inline-block;
        }
        .footer {
          text-align: center;
          font-size: 13px;
          color: #4d6f96;
          background: #f4f9ff;
          padding: 14px 20px;
          border-radius: 40px;
          margin-top: 28px;
          border: 1px solid #d4e3f7;
        }
        .footer span { color: #0a2a4a; font-weight: 600; }
        @media (max-width: 520px) {
          .inner { padding: 24px 20px 20px 20px; }
          .otp-code {
            font-size: 22px;
            letter-spacing: 5px;
            padding: 8px 12px;
            min-width: 120px;
          }
          h2 { font-size: 19px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="inner">

          <div class="logo-area">
            <img src="${logoUrl}" alt="BGI Logo" width="170">
          </div>

          <h2>Hello ${toName || ''},</h2>
          <p class="sub-head">
            Thank you for contacting us. We appreciate your interest in
            <strong style="color:#0a2a4a;">Bansal Group of Institutes</strong>.
          </p>

          <div class="otp-box">
            <span class="otp-label">🔐 Your One-Time Password</span>
            <div class="otp-code">${otp}</div>
            <div class="otp-timer">⏱ Valid for ${expiryMinutes} minutes</div>
          </div>

          <hr class="divider">

          <div class="signature">
            <p style="margin-bottom: 2px;">
              Regards,<br>
              <strong class="institute">Bansal Group of Institutes (BGI)</strong>
            </p>
            <div class="tagline">
              <span>✦ excellence · innovation · integrity ✦</span>
            </div>
          </div>

          <div class="footer">
            <span>🏛️</span> &nbsp; BGI · where bright futures begin &nbsp; <span>🌱</span>
          </div>

        </div>
      </div>
    </body>
    </html>
  `;

  await t.sendMail({
    from: `"E-PASS — BGI" <${from}>`,
    to: toEmail,
    subject: 'Your E-PASS verification OTP',
    html,
  });

  return true;
}

module.exports = { sendOtpEmail };