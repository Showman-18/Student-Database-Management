const { checkDatabaseHealth } = require('../services/backupService');

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Keep a short-lived cache to avoid running integrity checks on every single request.
let healthCache = {
  checkedAt: 0,
  health: null,
};

const CACHE_TTL_MS = 15000;

const isWriteRequest = (method) => WRITE_METHODS.has(String(method || '').toUpperCase());

const isAllowedDuringRecovery = (path, method) => {
  const normalizedPath = String(path || '');
  const normalizedMethod = String(method || '').toUpperCase();

  // Allow auth status/login/setup flows.
  if (
    normalizedPath === '/auth/status' ||
    normalizedPath === '/auth/login' ||
    normalizedPath === '/auth/setup'
  ) {
    return true;
  }

  // Allow backup management and restore operations.
  if (normalizedPath.startsWith('/system/backups')) {
    return true;
  }

  // Allow reading DB status for diagnostics.
  if (normalizedPath === '/system/db/status' && normalizedMethod === 'GET') {
    return true;
  }

  return false;
};

const getCurrentHealth = async () => {
  const now = Date.now();

  if (healthCache.health && now - healthCache.checkedAt < CACHE_TTL_MS) {
    return healthCache.health;
  }

  const health = await checkDatabaseHealth();
  healthCache = {
    checkedAt: now,
    health,
  };

  return health;
};

const enforceDbSafety = async (req, res, next) => {
  try {
    if (!isWriteRequest(req.method)) {
      return next();
    }

    const health = await getCurrentHealth();

    if (health.healthy || isAllowedDuringRecovery(req.path, req.method)) {
      return next();
    }

    return res.status(503).json({
      message:
        'Database recovery mode is active. Write operations are temporarily blocked until health checks pass.',
      recoveryMode: true,
      health,
    });
  } catch (error) {
    return res.status(503).json({
      message: 'Unable to verify database health. Write operations are blocked for safety.',
      recoveryMode: true,
      error: error.message,
    });
  }
};

module.exports = { enforceDbSafety };
