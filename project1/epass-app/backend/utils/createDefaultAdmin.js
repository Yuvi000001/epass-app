const User = require('../models/User');

/**
 * Ensures at least one ADMIN account exists, so there's always a way to log in
 * to the Admin Dashboard on a freshly deployed/seeded database.
 * Credentials come from .env (DEFAULT_ADMIN_*) — change the password after first login.
 */
async function createDefaultAdminIfNeeded() {
  const existingAdmin = await User.findOne({ role: 'ADMIN' });
  if (existingAdmin) return;

  const name = process.env.DEFAULT_ADMIN_NAME || 'Super Admin';
  const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@bgi.edu.in';
  const password = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';
  const campus = process.env.DEFAULT_ADMIN_CAMPUS || 'BIST';

  await User.create({ name, email, password, role: 'ADMIN', campus, isActive: true, isEmailVerified: true });
  console.log(`Default ADMIN account created -> email: ${email} / password: ${password} / campus: ${campus} (please change password after first login)`);
}

module.exports = createDefaultAdminIfNeeded;
