const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

let initialized = false;

function initFirebase() {
  if (initialized) return admin;
  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceAccountPath) {
      // Resolve relative to the backend/ root (one level up from this config/ folder),
      // not relative to this file's own directory — path.resolve handles this correctly
      // regardless of whether the .env value starts with "./", "../", or is absolute.
      const resolvedPath = path.isAbsolute(serviceAccountPath)
        ? serviceAccountPath
        : path.resolve(__dirname, '..', serviceAccountPath);
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const serviceAccount = require(resolvedPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
      initialized = true;
      console.log('Firebase Admin initialized (Storage + Cloud Messaging)');
    } else {
      console.warn('FIREBASE_SERVICE_ACCOUNT_JSON not set — photo uploads & push notifications disabled');
    }
  } catch (err) {
    console.warn('Firebase Admin init skipped:', err.message);
  }
  return admin;
}

function getBucket() {
  if (!initialized) return null;
  return admin.storage().bucket();
}

async function sendPushNotification(fcmToken, title, body, data = {}) {
  if (!initialized || !fcmToken) return null;
  try {
    return await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data,
    });
  } catch (err) {
    console.error('FCM send failed:', err.message);
    return null;
  }
}

module.exports = { initFirebase, getBucket, sendPushNotification, isInitialized: () => initialized };
