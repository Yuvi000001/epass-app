const QRCode = require('qrcode');
const { getBucket } = require('../config/firebase');

/**
 * Generates a QR code PNG encoding the pass verification URL, uploads it to
 * Firebase Storage, and returns the public URL.
 */
async function generateQrCode(passId) {
  const verifyUrl = `${process.env.CLIENT_BASE_URL || 'https://epass.bgi.edu.in'}/verify/${passId}`;

  const buffer = await QRCode.toBuffer(verifyUrl, {
    type: 'png',
    width: 400,
    margin: 2,
    color: { dark: '#0A4DAD', light: '#FFFFFF' },
  });

  const bucket = getBucket();
  if (!bucket) {
    console.warn('Firebase Storage not configured — QR code returned as a base64 data URL.');
    return `data:image/png;base64,${buffer.toString('base64')}`;
  }

  const destPath = `epass/qrcodes/qr_${passId}.png`;
  const file = bucket.file(destPath);
  await file.save(buffer, { metadata: { contentType: 'image/png' }, public: true });

  return `https://storage.googleapis.com/${bucket.name}/${destPath}`;
}

module.exports = { generateQrCode };
