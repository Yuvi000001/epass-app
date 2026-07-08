require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { initFirebase } = require('./config/firebase');
const createDefaultAdminIfNeeded = require('./utils/createDefaultAdmin');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const hodRoutes = require('./routes/hodRoutes');
const guardRoutes = require('./routes/guardRoutes');
const epassRoutes = require('./routes/epassRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// ---- Global middleware ----
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ---- Health check ----
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', service: 'E-PASS API', timestamp: new Date().toISOString() });
});

// ---- API routes ----
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/leave', leaveRoutes);
app.use('/api/v1/faculty', facultyRoutes);
app.use('/api/v1/hod', hodRoutes);
app.use('/api/v1/guard', guardRoutes);
app.use('/api/v1/epass', epassRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// ---- 404 handler ----
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ---- Centralized error handler ----
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  initFirebase();
  await createDefaultAdminIfNeeded();

  app.listen(PORT, () => {
    console.log(`E-PASS API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
}

start();

module.exports = app;
