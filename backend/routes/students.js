const express = require('express');
const Student = require('../models/Student');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get all students (Protected)
router.get('/', verifyToken, async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
});

// Get specific student by ID (Protected)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student', error: error.message });
  }
});

// Create a new student (Protected)
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      fullName,
      grNo,
      panNo,
      phoneNumber,
      caste,
      religion,
      address,
      fatherName,
      fatherContact,
      motherName,
      motherContact,
    } = req.body;

    // Validate required fields
    if (!fullName || !grNo || !panNo || !phoneNumber) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check for duplicates
    const existingGrNo = await Student.findOne({ grNo });
    const existingPanNo = await Student.findOne({ panNo });

    if (existingGrNo) {
      return res.status(400).json({ message: 'GR No already exists' });
    }

    if (existingPanNo) {
      return res.status(400).json({ message: 'PAN No already exists' });
    }

    const student = new Student({
      fullName,
      grNo,
      panNo,
      phoneNumber,
      caste,
      religion,
      address,
      fatherName,
      fatherContact,
      motherName,
      motherContact,
    });

    await student.save();
    res.status(201).json({ message: 'Student created successfully', student });
  } catch (error) {
    res.status(500).json({ message: 'Error creating student', error: error.message });
  }
});

// Update student (Protected)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ message: 'Student updated successfully', student });
  } catch (error) {
    res.status(500).json({ message: 'Error updating student', error: error.message });
  }
});

// Delete student (Protected)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting student', error: error.message });
  }
});

module.exports = router;
