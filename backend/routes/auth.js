const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { get, run } = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

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
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    if (String(username).trim().length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const adminCount = await getAdminCount();
    if (adminCount > 0) {
      return res.status(400).json({ message: 'Setup already completed. Please login.' });
    }

    const normalizedUsername = String(username).trim();
    const hashedPassword = await bcrypt.hash(password, 10);

    const inserted = await run(
      `INSERT INTO admins (username, password, created_at, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [normalizedUsername, hashedPassword]
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

// Initialize admin user (run once)
router.post('/init-admin', async (req, res) => {
  try {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const existingAdmin = await get('SELECT * FROM admins WHERE username = ?', [adminUsername]);
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await run(
      `INSERT INTO admins (username, password, created_at, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [adminUsername, hashedPassword]
    );

    res.status(201).json({ message: 'Admin created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating admin', error: error.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
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
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

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
