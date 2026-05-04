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

  const day = now.toLocaleString('en-US', { weekday: 'long' });
  const date = String(now.getDate()).padStart(2, '0');
  const month = now.toLocaleString('en-US', { month: 'long' });
  const year = String(now.getFullYear());

  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const meridiem = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours === 0 ? 12 : hours;
  const formattedHours = String(hours).padStart(2, '0');

  const timestamp = `${day}_${date}_${month}_${year}_${formattedHours}-${minutes}-${seconds}_${meridiem}`;
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

const resolveBackupPath = (fileName) => {
  if (!fileName) {
    throw new Error('Backup filename is required');
  }

  const safeFileName = path.basename(fileName);
  const fullPath = path.join(backupDir, safeFileName);

  if (!fs.existsSync(fullPath)) {
    throw new Error('Backup file not found');
  }

  return {
    safeFileName,
    fullPath,
  };
};

const createBackup = async () => {
  ensureBackupDir();
  await checkpoint();

  const fileName = getBackupFileName();
  const destinationPath = path.join(backupDir, fileName);

  fs.copyFileSync(dbPath, destinationPath);

  // FIX m4: birthtime is unreliable on Linux (ext4 returns epoch or mtime).
  // Capture the actual wall-clock time right after the copy instead.
  const createdAt = new Date().toISOString();

  const retention = applyRetentionPolicy();
  const stats = fs.statSync(destinationPath);

  return {
    fileName,
    path: destinationPath,
    sizeBytes: stats.size,
    createdAt,
    retentionRemoved: retention.removed,
  };
};

const restoreBackup = async (fileName) => {
  const { safeFileName, fullPath: sourcePath } = resolveBackupPath(fileName);

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

const deleteBackup = (fileName) => {
  const { safeFileName, fullPath } = resolveBackupPath(fileName);
  fs.unlinkSync(fullPath);

  return {
    deletedFile: safeFileName,
    deletedAt: new Date().toISOString(),
  };
};

const importBackupFile = (sourcePath, originalFileName = 'imported_backup.db') => {
  ensureBackupDir();

  const parsed = path.parse(path.basename(originalFileName));
  if (parsed.ext.toLowerCase() !== '.db') {
    throw new Error('Only .db backup files are allowed');
  }

  const sanitizedName = parsed.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'imported_backup';
  const importedFileName = `imported_${getBackupFileName().replace('.db', '')}_${sanitizedName}.db`;
  const destinationPath = path.join(backupDir, importedFileName);

  fs.copyFileSync(sourcePath, destinationPath);

  // FIX m4: same as createBackup — capture wall-clock time, don't rely on birthtime
  const importedAt = new Date().toISOString();

  const retention = applyRetentionPolicy();
  const stats = fs.statSync(destinationPath);

  return {
    fileName: importedFileName,
    path: destinationPath,
    sizeBytes: stats.size,
    importedAt,
    retentionRemoved: retention.removed,
  };
};

const checkDatabaseHealth = async () => {
  const quick = await quickCheck();
  const integrity = await integrityCheck();
  const forcedRecoveryMode = String(process.env.FORCE_RECOVERY_MODE || '').toLowerCase() === 'true';

  return {
    quickCheck: quick,
    integrityCheck: integrity,
    healthy: !forcedRecoveryMode && quick === 'ok' && integrity === 'ok',
    forcedRecoveryMode,
    checkedAt: new Date().toISOString(),
  };
};

module.exports = {
  backupDir,
  createBackup,
  listBackups,
  resolveBackupPath,
  deleteBackup,
  importBackupFile,
  restoreBackup,
  checkDatabaseHealth,
};
