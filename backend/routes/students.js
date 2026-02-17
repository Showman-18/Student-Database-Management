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

// Update fees payment details (Protected)
router.put('/:id/fees/:year/:term', verifyToken, async (req, res) => {
  try {
    const { id, year, term } = req.params;
    const { status, receiptNo, modeOfPayment, amount, paidDate, comment } = req.body;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Find or create fees history for the year
    let feesEntry = student.feesHistory.find((entry) => entry.year === parseInt(year));
    if (!feesEntry) {
      feesEntry = {
        year: parseInt(year),
        term1: { status: 'pending' },
        term2: { status: 'pending' },
        other: { status: 'pending' },
      };
      student.feesHistory.push(feesEntry);
    }

    // Update the specific term
    if (feesEntry[term]) {
      feesEntry[term].status = status;
      if (receiptNo) feesEntry[term].receiptNo = receiptNo;
      if (modeOfPayment) feesEntry[term].modeOfPayment = modeOfPayment;
      if (amount) feesEntry[term].amount = amount;
      if (paidDate) feesEntry[term].paidDate = paidDate;
      if (comment) feesEntry[term].comment = comment;
    }

    await student.save();
    res.json({ message: 'Fees updated successfully', student });
  } catch (error) {
    res.status(500).json({ message: 'Error updating fees', error: error.message });
  }
});

// Add new year to fees history (Protected)
router.post('/:id/fees/year', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { year } = req.body;

    // Validate year
    if (!year || isNaN(year) || year < 1900 || year > 2100) {
      return res.status(400).json({ message: 'Invalid year provided' });
    }

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if year already exists
    const yearExists = student.feesHistory.find((entry) => entry.year === parseInt(year));
    if (yearExists) {
      return res.status(400).json({ message: `Fees history for year ${year} already exists` });
    }

    // Create new fees history entry for the year
    student.feesHistory.push({
      year: parseInt(year),
      term1: { status: 'pending' },
      term2: { status: 'pending' },
      other: { status: 'pending' },
    });

    await student.save();
    res.json({ message: 'Year added successfully', student });
  } catch (error) {
    res.status(500).json({ message: 'Error adding year', error: error.message });
  }
});

module.exports = router;
