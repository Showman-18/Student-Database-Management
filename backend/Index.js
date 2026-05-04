const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// ── Environment setup ──────────────────────────────────────────────────────
// In development, load .env from the backend folder.
// In production (packaged Electron app), .env is intentionally excluded from
// the bundle. All values fall back to safe defaults defined below.
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

// JWT_SECRET: auto-generate a strong random secret if not set via .env.
// This is written to userData so it persists across app restarts — without
// this, every restart would invalidate all existing login sessions.
if (!process.env.JWT_SECRET) {
  const { app } = (() => {
    try { return require('electron'); } catch { return {}; }
  })();

  let secretStorePath;
  if (app && app.getPath) {
    // Running inside packaged Electron — store in userData
    secretStorePath = path.join(app.getPath('userData'), '.jwt_secret');
  } else {
    // Running in dev without Electron (e.g. plain node Index.js)
    secretStorePath = path.join(__dirname, 'data', '.jwt_secret');
  }

  try {
    if (fs.existsSync(secretStorePath)) {
      process.env.JWT_SECRET = fs.readFileSync(secretStorePath, 'utf8').trim();
    } else {
      const generated = crypto.randomBytes(48).toString('hex');
      fs.mkdirSync(path.dirname(secretStorePath), { recursive: true });
      fs.writeFileSync(secretStorePath, generated, { mode: 0o600 });
      process.env.JWT_SECRET = generated;
    }
  } catch (err) {
    // Last resort fallback — not ideal but won't crash the app
    process.env.JWT_SECRET = crypto.randomBytes(48).toString('hex');
    console.warn('Could not persist JWT_SECRET:', err.message);
  }
}

// ── App bootstrap ──────────────────────────────────────────────────────────
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./db');
const { createBackup, checkDatabaseHealth } = require('./services/backupService');
const { enforceDbSafety } = require('./middleware/dbSafety');

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const systemRoutes = require('./routes/system');

const app = express();
const PORT = process.env.PORT || 3000;
const backupIntervalMinutes = Number(process.env.BACKUP_INTERVAL_MINUTES || 1440);
const healthCheckIntervalMinutes = Number(process.env.DB_HEALTHCHECK_INTERVAL_MINUTES || 360);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// SQLite initialization
initDatabase()
  .then(async () => {
    console.log('SQLite database initialized');

    try {
      const health = await checkDatabaseHealth();
      if (!health.healthy) {
        console.error('Database integrity check reported issues:', health);
      }
    } catch (error) {
      console.error('Failed initial database health check:', error.message);
    }

    if (backupIntervalMinutes > 0) {
      setInterval(async () => {
        try {
          const result = await createBackup();
          console.log(`Auto backup created: ${result.fileName}`);
        } catch (error) {
          console.error('Auto backup failed:', error.message);
        }
      }, backupIntervalMinutes * 60 * 1000);
    }

    if (healthCheckIntervalMinutes > 0) {
      setInterval(async () => {
        try {
          const health = await checkDatabaseHealth();
          if (!health.healthy) {
            console.error('Periodic health check failed:', health);
          }
        } catch (error) {
          console.error('Periodic health check error:', error.message);
        }
      }, healthCheckIntervalMinutes * 60 * 1000);
    }
  })
  .catch((err) => console.log('SQLite initialization error:', err));

// Routes
app.use('/api', enforceDbSafety);
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/system', systemRoutes);

// Basic health check
app.get('/', (req, res) => {
  res.json({ message: 'Student Management System Backend is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
