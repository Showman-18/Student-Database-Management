const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

const router = express.Router();

// Initialize admin user (run once)
router.post('/init-admin', async (req, res) => {
  try {
    const existingAdmin = await Admin.findOne({ username: process.env.ADMIN_USERNAME });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const admin = new Admin({
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD,
    });

    await admin.save();
    res.status(201).json({ message: 'Admin created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating admin', error: error.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find admin user
    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare passwords
    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    res.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Login error', error: error.message });
  }
});

module.exports = router;
