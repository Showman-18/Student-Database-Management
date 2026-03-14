const fs = require('fs');
const path = require('path');
const { dbPath, checkpoint, closeDatabase, initDatabase, quickCheck, integrityCheck } = require('../db');

const configuredBackupDir = process.env.SQLITE_BACKUP_DIR;
const defaultBackupDir = path.join(path.dirname(dbPath), 'backups');
const backupDir = configuredBackupDir ? path.resolve(configuredBackupDir) : defaultBackupDir;
const backupRetentionCount = Number(process.env.BACKUP_RETENTION_COUNT || 30);

const ensureBackupDir = () => {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
};

const getBackupFileName = () => {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  return `student_management_backup_${timestamp}.db`;
};

const listBackups = () => {
  ensureBackupDir();

  return fs
    .readdirSync(backupDir)
    .filter((fileName) => fileName.endsWith('.db'))
    .map((fileName) => {
      const absolutePath = path.join(backupDir, fileName);
      const stats = fs.statSync(absolutePath);
      return {
        fileName,
        sizeBytes: stats.size,
        createdAt: stats.birthtime.toISOString(),
        modifiedAt: stats.mtime.toISOString(),
      };
    })
    .sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
};

const applyRetentionPolicy = () => {
  const backups = listBackups();
  const extras = backups.slice(backupRetentionCount);

  extras.forEach((entry) => {
    fs.unlinkSync(path.join(backupDir, entry.fileName));
  });

  return {
    removed: extras.map((entry) => entry.fileName),
  };
};

const createBackup = async () => {
  ensureBackupDir();
  await checkpoint();

  const fileName = getBackupFileName();
  const destinationPath = path.join(backupDir, fileName);

  fs.copyFileSync(dbPath, destinationPath);

  const retention = applyRetentionPolicy();
  const stats = fs.statSync(destinationPath);

  return {
    fileName,
    path: destinationPath,
    sizeBytes: stats.size,
    createdAt: stats.birthtime.toISOString(),
    retentionRemoved: retention.removed,
  };
};

const restoreBackup = async (fileName) => {
  if (!fileName) {
    throw new Error('Backup filename is required');
  }

  const safeFileName = path.basename(fileName);
  const sourcePath = path.join(backupDir, safeFileName);

  if (!fs.existsSync(sourcePath)) {
    throw new Error('Backup file not found');
  }

  await closeDatabase();

  const tempRestorePath = `${dbPath}.restore_tmp`;
  fs.copyFileSync(sourcePath, tempRestorePath);
  fs.renameSync(tempRestorePath, dbPath);

  await initDatabase();

  return {
    restoredFrom: safeFileName,
    restoredAt: new Date().toISOString(),
  };
};

const checkDatabaseHealth = async () => {
  const quick = await quickCheck();
  const integrity = await integrityCheck();

  return {
    quickCheck: quick,
    integrityCheck: integrity,
    healthy: quick === 'ok' && integrity === 'ok',
    checkedAt: new Date().toISOString(),
  };
};

module.exports = {
  backupDir,
  createBackup,
  listBackups,
  restoreBackup,
  checkDatabaseHealth,
};
