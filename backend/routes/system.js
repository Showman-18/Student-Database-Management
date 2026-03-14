const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
const multer = require('multer');
const { verifyToken } = require('../middleware/auth');
const { dbPath } = require('../db');
const {
  backupDir,
  createBackup,
  listBackups,
  resolveBackupPath,
  deleteBackup,
  importBackupFile,
  restoreBackup,
  checkDatabaseHealth,
} = require('../services/backupService');

const router = express.Router();

const uploadTempDir = path.join(os.tmpdir(), 'sdbms-backup-imports');
if (!fs.existsSync(uploadTempDir)) {
  fs.mkdirSync(uploadTempDir, { recursive: true });
}

const upload = multer({
  dest: uploadTempDir,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    if (extension !== '.db') {
      cb(new Error('Only .db files are allowed'));
      return;
    }
    cb(null, true);
  },
});

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

router.get('/backups/download/:fileName', verifyToken, async (req, res) => {
  try {
    const requestedFile = decodeURIComponent(req.params.fileName);
    const { safeFileName, fullPath } = resolveBackupPath(requestedFile);
    res.download(fullPath, safeFileName);
  } catch (error) {
    res.status(400).json({ message: 'Failed to download backup', error: error.message });
  }
});

router.delete('/backups/:fileName', verifyToken, async (req, res) => {
  try {
    const requestedFile = decodeURIComponent(req.params.fileName);
    const result = deleteBackup(requestedFile);
    res.json({ message: 'Backup deleted successfully', result });
  } catch (error) {
    res.status(400).json({ message: 'Failed to delete backup', error: error.message });
  }
});

router.post('/backups/import', verifyToken, upload.single('backupFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No backup file uploaded' });
    }

    const imported = importBackupFile(req.file.path, req.file.originalname);
    fs.unlinkSync(req.file.path);

    res.status(201).json({
      message: 'Backup file imported successfully',
      backup: imported,
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(400).json({ message: 'Failed to import backup file', error: error.message });
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
