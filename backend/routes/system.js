const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { dbPath } = require('../db');
const {
  backupDir,
  createBackup,
  listBackups,
  restoreBackup,
  checkDatabaseHealth,
} = require('../services/backupService');

const router = express.Router();

router.get('/db/status', verifyToken, async (req, res) => {
  try {
    const health = await checkDatabaseHealth();
    res.json({
      ...health,
      dbPath,
      backupDir,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to check database health', error: error.message });
  }
});

router.get('/backups', verifyToken, async (req, res) => {
  try {
    const backups = listBackups();
    res.json({ backups });
  } catch (error) {
    res.status(500).json({ message: 'Failed to list backups', error: error.message });
  }
});

router.post('/backups', verifyToken, async (req, res) => {
  try {
    const backup = await createBackup();
    res.status(201).json({ message: 'Backup created successfully', backup });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create backup', error: error.message });
  }
});

router.post('/backups/restore', verifyToken, async (req, res) => {
  try {
    const { fileName } = req.body;
    const result = await restoreBackup(fileName);

    res.json({
      message: 'Backup restored successfully',
      result,
    });
  } catch (error) {
    res.status(400).json({ message: 'Failed to restore backup', error: error.message });
  }
});

module.exports = router;
