const express = require('express');
const Student = require('../models/Student');
const { verifyToken } = require('../middleware/auth');
const XLSX = require('xlsx');

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

// Export students to Excel (Protected)
router.get('/export/excel', verifyToken, async (req, res) => {
  try {
    const students = await Student.find().lean();

    // Prepare data for Excel
    const excelData = students.map(student => {
      const row = {
        'Full Name': student.fullName,
        'GR No': student.grNo,
        'PAN No': student.panNo,
        'Phone Number': student.phoneNumber,
        'Caste': student.caste || '',
        'Religion': student.religion || '',
        'Address': student.address || '',
        'Father Name': student.fatherName || '',
        'Father Contact': student.fatherContact || '',
        'Mother Name': student.motherName || '',
        'Mother Contact': student.motherContact || '',
      };

      // Add fees history data
      if (student.feesHistory && student.feesHistory.length > 0) {
        student.feesHistory.forEach((yearHistory, index) => {
          row[`Year ${index + 1}`] = yearHistory.year;
          row[`Year ${index + 1} - Term 1 Status`] = yearHistory.term1?.status || 'pending';
          row[`Year ${index + 1} - Term 1 Amount`] = yearHistory.term1?.amount || '';
          row[`Year ${index + 1} - Term 2 Status`] = yearHistory.term2?.status || 'pending';
          row[`Year ${index + 1} - Term 2 Amount`] = yearHistory.term2?.amount || '';
        });
      }

      return row;
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: 'Error exporting students', error: error.message });
  }
});

// Import students from Excel (Protected)
router.post('/import/excel', verifyToken, async (req, res) => {
  try {
    if (!req.body.data) {
      return res.status(400).json({ message: 'No data provided' });
    }

    const studentsData = req.body.data;
    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const studentData of studentsData) {
      try {
        // Check if student already exists
        const existingGrNo = await Student.findOne({ grNo: studentData.grNo });
        const existingPanNo = await Student.findOne({ panNo: studentData.panNo });

        if (existingGrNo || existingPanNo) {
          results.failed++;
          results.errors.push({
            grNo: studentData.grNo,
            error: existingGrNo ? 'GR No already exists' : 'PAN No already exists',
          });
          continue;
        }

        // Create new student
        const student = new Student({
          fullName: studentData.fullName,
          grNo: studentData.grNo,
          panNo: studentData.panNo,
          phoneNumber: studentData.phoneNumber,
          caste: studentData.caste || '',
          religion: studentData.religion || '',
          address: studentData.address || '',
          fatherName: studentData.fatherName || '',
          fatherContact: studentData.fatherContact || '',
          motherName: studentData.motherName || '',
          motherContact: studentData.motherContact || '',
        });

        await student.save();
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          grNo: studentData.grNo,
          error: error.message,
        });
      }
    }

    res.json({
      message: `Import completed. ${results.success} students added, ${results.failed} failed.`,
      results,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error importing students', error: error.message });
  }
});

module.exports = router;
