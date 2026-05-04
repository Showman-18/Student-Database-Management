const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { get, run } = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const MAX_FAILED_ATTEMPTS = 5;
const COOLDOWN_MS = 2 * 60 * 1000;
const attemptTrackers = new Map();

// FIX M1: key the tracker by (action + IP) so different clients have independent counters
const makeTrackerKey = (action, req) => {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  return `${action}::${ip}`;
};

const getAttemptTracker = (key) => {
  if (!attemptTrackers.has(key)) {
    attemptTrackers.set(key, { attempts: 0, blockedUntil: 0 });
  }
  return attemptTrackers.get(key);
};

const getCooldownMessage = (blockedUntil) => {
  const remainingMs = Math.max(0, blockedUntil - Date.now());
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  if (minutes > 0) {
    return `Too many failed attempts. Please wait ${minutes} minute${minutes === 1 ? '' : 's'} and ${seconds} second${seconds === 1 ? '' : 's'} before trying again.`;
  }

  return `Too many failed attempts. Please wait ${seconds} second${seconds === 1 ? '' : 's'} before trying again.`;
};

const canAttempt = (key) => {
  const tracker = getAttemptTracker(key);

  if (tracker.blockedUntil && Date.now() < tracker.blockedUntil) {
    return { allowed: false, message: getCooldownMessage(tracker.blockedUntil) };
  }

  if (tracker.blockedUntil && Date.now() >= tracker.blockedUntil) {
    tracker.attempts = 0;
    tracker.blockedUntil = 0;
  }

  return { allowed: true };
};

const recordFailedAttempt = (key) => {
  const tracker = getAttemptTracker(key);
  tracker.attempts += 1;

  if (tracker.attempts >= MAX_FAILED_ATTEMPTS) {
    tracker.attempts = 0;
    tracker.blockedUntil = Date.now() + COOLDOWN_MS;
    return { blocked: true, message: getCooldownMessage(tracker.blockedUntil) };
  }

  return { blocked: false };
};

const resetAttempts = (key) => {
  attemptTrackers.delete(key);
};

const getAdminCount = async () => {
  const row = await get('SELECT COUNT(*) AS count FROM admins');
  return row?.count || 0;
};

// Setup status route
router.get('/status', async (req, res) => {
  try {
    const adminCount = await getAdminCount();
    res.json({
      setupRequired: adminCount === 0,
      adminConfigured: adminCount > 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get auth status', error: error.message });
  }
});

// First-time setup route
router.post('/setup', async (req, res) => {
  try {
    const { username, password, recoveryQuestion, recoveryAnswer } = req.body;

    if (!username || !password || !recoveryQuestion || !recoveryAnswer) {
      return res.status(400).json({ message: 'Username, password, security question, and security answer are required' });
    }

    if (String(username).trim().length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (String(recoveryAnswer).trim().length < 2) {
      return res.status(400).json({ message: 'Security answer must be at least 2 characters' });
    }

    const adminCount = await getAdminCount();
    if (adminCount > 0) {
      return res.status(400).json({ message: 'Setup already completed. Please login.' });
    }

    const normalizedUsername = String(username).trim();
    const normalizedRecoveryQuestion = String(recoveryQuestion).trim();
    const normalizedRecoveryAnswer = String(recoveryAnswer).trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedRecoveryAnswer = await bcrypt.hash(normalizedRecoveryAnswer, 10);

    const inserted = await run(
      `INSERT INTO admins (username, password, recovery_question, recovery_answer_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [normalizedUsername, hashedPassword, normalizedRecoveryQuestion, hashedRecoveryAnswer]
    );

    const token = jwt.sign({ id: inserted.lastID }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    res.status(201).json({
      message: 'Account setup successful',
      token,
      admin: {
        id: inserted.lastID,
        username: normalizedUsername,
      },
    });
  } catch (error) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    res.status(500).json({ message: 'Error completing setup', error: error.message });
  }
});

// FIX M7: /init-admin route removed — it was unauthenticated, permanently public,
// and redundant with /setup. Any code that called it should use /setup instead.

// Login route
router.post('/login', async (req, res) => {
  try {
    // FIX M1: key by IP address so each client has an independent counter
    const trackerKey = makeTrackerKey('login', req);
    const attemptState = canAttempt(trackerKey);
    if (!attemptState.allowed) {
      return res.status(429).json({ message: attemptState.message });
    }

    const { username, password } = req.body;

    const adminCount = await getAdminCount();
    if (adminCount === 0) {
      return res.status(403).json({ message: 'Setup required. Create admin account first.' });
    }

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find admin user
    const admin = await get('SELECT * FROM admins WHERE username = ?', [username]);

    if (!admin) {
      const failureState = recordFailedAttempt(trackerKey);
      if (failureState.blocked) {
        return res.status(429).json({ message: failureState.message });
      }
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      const failureState = recordFailedAttempt(trackerKey);
      if (failureState.blocked) {
        return res.status(429).json({ message: failureState.message });
      }
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    resetAttempts(trackerKey);

    // Generate JWT token
    const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    res.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Login error', error: error.message });
  }
});

// Fetch recovery question (single-admin mode)
router.get('/recovery-question', async (req, res) => {
  try {
    const admin = await get('SELECT id, recovery_question FROM admins ORDER BY id ASC LIMIT 1');

    if (!admin) {
      return res.status(404).json({ message: 'Admin account not found' });
    }

    if (!admin.recovery_question) {
      return res.status(400).json({ message: 'Security question is not configured for this account' });
    }

    return res.json({ recoveryQuestion: admin.recovery_question });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch security question', error: error.message });
  }
});

// Verify recovery answer (single-admin mode)
router.post('/verify-recovery-answer', async (req, res) => {
  try {
    // FIX M1: key by IP address
    const trackerKey = makeTrackerKey('recovery-answer', req);
    const attemptState = canAttempt(trackerKey);
    if (!attemptState.allowed) {
      return res.status(429).json({ message: attemptState.message });
    }

    const { recoveryAnswer } = req.body;

    if (!recoveryAnswer) {
      return res.status(400).json({ message: 'Security answer is required' });
    }

    const admin = await get('SELECT recovery_answer_hash FROM admins ORDER BY id ASC LIMIT 1');

    if (!admin) {
      return res.status(404).json({ message: 'Admin account not found' });
    }

    if (!admin.recovery_answer_hash) {
      return res.status(400).json({ message: 'Security answer is not configured for this account' });
    }

    const normalizedAnswer = String(recoveryAnswer).trim().toLowerCase();
    const isValid = await bcrypt.compare(normalizedAnswer, admin.recovery_answer_hash);

    if (!isValid) {
      const failureState = recordFailedAttempt(trackerKey);
      if (failureState.blocked) {
        return res.status(429).json({ message: failureState.message });
      }
      return res.status(401).json({ message: 'Incorrect security answer' });
    }

    resetAttempts(trackerKey);

    return res.json({
      message: 'Security answer verified.',
      verified: true,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to verify security answer', error: error.message });
  }
});

// Recover credentials (single-admin mode)
router.post('/recover-credentials', async (req, res) => {
  try {
    const { recoveryAnswer, newUsername, newPassword } = req.body;

    if (!recoveryAnswer || !newUsername || !newPassword) {
      return res.status(400).json({ message: 'Security answer, new username, and new password are required' });
    }

    const normalizedUsername = String(newUsername).trim();
    if (normalizedUsername.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const admin = await get('SELECT id, recovery_answer_hash FROM admins ORDER BY id ASC LIMIT 1');

    if (!admin) {
      return res.status(404).json({ message: 'Admin account not found' });
    }

    if (!admin.recovery_answer_hash) {
      return res.status(400).json({ message: 'Security answer is not configured for this account' });
    }

    const normalizedAnswer = String(recoveryAnswer).trim().toLowerCase();
    const isValid = await bcrypt.compare(normalizedAnswer, admin.recovery_answer_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Incorrect security answer' });
    }

    const usernameTaken = await get('SELECT id FROM admins WHERE username = ? AND id != ?', [
      normalizedUsername,
      admin.id,
    ]);

    if (usernameTaken) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await run(
      'UPDATE admins SET username = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [normalizedUsername, hashedPassword, admin.id]
    );

    return res.json({
      message: 'Credentials recovered successfully. Please sign in with your new username and password.',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to recover credentials', error: error.message });
  }
});

// Update credentials route (Protected)
router.post('/update-credentials', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newUsername, newPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ message: 'Current password is required' });
    }

    if (!newUsername && !newPassword) {
      return res.status(400).json({ message: 'Provide new username or new password' });
    }

    const admin = await get('SELECT * FROM admins WHERE id = ?', [req.userId]);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const updates = [];
    const values = [];

    if (newUsername) {
      const normalizedUsername = String(newUsername).trim();
      if (normalizedUsername.length < 3) {
        return res.status(400).json({ message: 'Username must be at least 3 characters' });
      }

      const existingUser = await get('SELECT id FROM admins WHERE username = ? AND id != ?', [
        normalizedUsername,
        req.userId,
      ]);

      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }

      updates.push('username = ?');
      values.push(normalizedUsername);
    }

    if (newPassword) {
      if (String(newPassword).length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updates.push('password = ?');
      values.push(hashedPassword);
    }

    await run(
      `UPDATE admins SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, req.userId]
    );

    const updatedAdmin = await get('SELECT id, username FROM admins WHERE id = ?', [req.userId]);
    res.json({
      message: 'Credentials updated successfully',
      admin: updatedAdmin,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update credentials', error: error.message });
  }
});

module.exports = router;
