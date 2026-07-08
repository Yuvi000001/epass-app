const { getBucket } = require('../config/firebase');

/**
 * Uploads an in-memory buffer (from multer's memoryStorage) to Firebase Storage
 * and returns a public URL. If Firebase isn't configured yet (no service account
 * in .env), falls back to a base64 data URL so the app still works for local dev
 * — swap in real Firebase credentials before going to production.
 */
async function uploadBufferToFirebase(buffer, destPath, contentType) {
  const bucket = getBucket();

  if (!bucket) {
    console.warn('Firebase Storage not configured — returning a local base64 data URL instead.');
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  }

  const file = bucket.file(destPath);
  await file.save(buffer, { metadata: { contentType }, public: true });
  return `https://storage.googleapis.com/${bucket.name}/${destPath}`;
}

module.exports = { uploadBufferToFirebase };
