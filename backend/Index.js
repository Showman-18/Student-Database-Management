const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./db');
const { createBackup, checkDatabaseHealth } = require('./services/backupService');

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
