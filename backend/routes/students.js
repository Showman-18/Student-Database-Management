const express = require('express');
const { verifyToken } = require('../middleware/auth');
const XLSX = require('xlsx');
const { all, get, run } = require('../db');

const router = express.Router();

const safeJsonParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const mapStudentRow = (row) => ({
  _id: String(row.id),
  fullName: row.full_name,
  grNo: row.gr_no,
  panNo: row.pan_no,
  phoneNumber: row.phone_number,
  caste: row.caste || '',
  religion: row.religion || '',
  address: row.address || '',
  fatherName: row.father_name || '',
  fatherContact: row.father_contact || '',
  motherName: row.mother_name || '',
  motherContact: row.mother_contact || '',
  feesHistory: safeJsonParse(row.fees_history, []),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const getDefaultFeesHistory = () => {
  const currentYear = new Date().getFullYear();
  return [
    {
      year: currentYear,
      term1: { status: 'pending' },
      term2: { status: 'pending' },
      other: { status: 'pending' },
    },
  ];
};

// Get all students (Protected)
router.get('/', verifyToken, async (req, res) => {
  try {
    const rows = await all('SELECT * FROM students ORDER BY datetime(created_at) DESC');
    const students = rows.map(mapStudentRow);
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
});

// Get specific student by ID (Protected)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    if (Number.isNaN(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID' });
    }

    const row = await get('SELECT * FROM students WHERE id = ?', [studentId]);
    if (!row) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const student = mapStudentRow(row);
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
    const existingGrNo = await get('SELECT id FROM students WHERE gr_no = ?', [grNo]);
    const existingPanNo = await get('SELECT id FROM students WHERE pan_no = ?', [panNo]);

    if (existingGrNo) {
      return res.status(400).json({ message: 'GR No already exists' });
    }

    if (existingPanNo) {
      return res.status(400).json({ message: 'PAN No already exists' });
    }

    const inserted = await run(
      `INSERT INTO students (
        full_name, gr_no, pan_no, phone_number, caste, religion, address,
        father_name, father_contact, mother_name, mother_contact, fees_history,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        String(fullName).trim(),
        String(grNo).trim(),
        String(panNo).trim(),
        String(phoneNumber).trim(),
        caste || '',
        religion || '',
        address || '',
        fatherName || '',
        fatherContact || '',
        motherName || '',
        motherContact || '',
        JSON.stringify(getDefaultFeesHistory()),
      ]
    );

    const createdRow = await get('SELECT * FROM students WHERE id = ?', [inserted.lastID]);
    const student = mapStudentRow(createdRow);
    res.status(201).json({ message: 'Student created successfully', student });
  } catch (error) {
    res.status(500).json({ message: 'Error creating student', error: error.message });
  }
});

// Update student (Protected)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    if (Number.isNaN(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID' });
    }

    const existing = await get('SELECT * FROM students WHERE id = ?', [studentId]);
    if (!existing) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const fieldMap = {
      fullName: 'full_name',
      grNo: 'gr_no',
      panNo: 'pan_no',
      phoneNumber: 'phone_number',
      caste: 'caste',
      religion: 'religion',
      address: 'address',
      fatherName: 'father_name',
      fatherContact: 'father_contact',
      motherName: 'mother_name',
      motherContact: 'mother_contact',
      feesHistory: 'fees_history',
    };

    const updates = [];
    const values = [];

    for (const [key, column] of Object.entries(fieldMap)) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        let value = req.body[key];
        if (key === 'feesHistory') {
          value = JSON.stringify(Array.isArray(value) ? value : []);
        } else if (value === null || value === undefined) {
          value = '';
        } else {
          value = String(value).trim();
        }

        updates.push(`${column} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update' });
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'grNo')) {
      const duplicateGr = await get('SELECT id FROM students WHERE gr_no = ? AND id != ?', [
        String(req.body.grNo).trim(),
        studentId,
      ]);
      if (duplicateGr) {
        return res.status(400).json({ message: 'GR No already exists' });
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'panNo')) {
      const duplicatePan = await get('SELECT id FROM students WHERE pan_no = ? AND id != ?', [
        String(req.body.panNo).trim(),
        studentId,
      ]);
      if (duplicatePan) {
        return res.status(400).json({ message: 'PAN No already exists' });
      }
    }

    await run(
      `UPDATE students SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, studentId]
    );

    const updatedRow = await get('SELECT * FROM students WHERE id = ?', [studentId]);
    const student = mapStudentRow(updatedRow);

    res.json({ message: 'Student updated successfully', student });
  } catch (error) {
    res.status(500).json({ message: 'Error updating student', error: error.message });
  }
});

// Delete student (Protected)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    if (Number.isNaN(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID' });
    }

    const deleted = await run('DELETE FROM students WHERE id = ?', [studentId]);
    if (deleted.changes === 0) {
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
    const studentId = Number(id);

    if (Number.isNaN(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID' });
    }

    const row = await get('SELECT * FROM students WHERE id = ?', [studentId]);
    if (!row) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const student = mapStudentRow(row);

    if (!['term1', 'term2', 'other'].includes(term)) {
      return res.status(400).json({ message: 'Invalid fees term' });
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

    await run(
      'UPDATE students SET fees_history = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [JSON.stringify(student.feesHistory), studentId]
    );

    const updatedRow = await get('SELECT * FROM students WHERE id = ?', [studentId]);
    const updatedStudent = mapStudentRow(updatedRow);
    res.json({ message: 'Fees updated successfully', student: updatedStudent });
  } catch (error) {
    res.status(500).json({ message: 'Error updating fees', error: error.message });
  }
});

// Add new year to fees history (Protected)
router.post('/:id/fees/year', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { year } = req.body;
    const studentId = Number(id);

    if (Number.isNaN(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID' });
    }

    // Validate year
    if (!year || isNaN(year) || year < 1900 || year > 2100) {
      return res.status(400).json({ message: 'Invalid year provided' });
    }

    const row = await get('SELECT * FROM students WHERE id = ?', [studentId]);
    if (!row) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const student = mapStudentRow(row);

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

    await run(
      'UPDATE students SET fees_history = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [JSON.stringify(student.feesHistory), studentId]
    );

    const updatedRow = await get('SELECT * FROM students WHERE id = ?', [studentId]);
    const updatedStudent = mapStudentRow(updatedRow);
    res.json({ message: 'Year added successfully', student: updatedStudent });
  } catch (error) {
    res.status(500).json({ message: 'Error adding year', error: error.message });
  }
});

// Export students to Excel (Protected)
router.get('/export/excel', verifyToken, async (req, res) => {
  try {
    const rows = await all('SELECT * FROM students ORDER BY datetime(created_at) DESC');
    const students = rows.map(mapStudentRow);

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
    if (!Array.isArray(req.body.data)) {
      return res.status(400).json({ message: 'No data provided' });
    }

    const normalizeValue = (value) => {
      if (value === null || value === undefined) return '';
      return String(value).trim();
    };

    const studentsData = req.body.data
      .map((studentData, index) => ({
        rowNumber: index + 2, // Header is row 1 in Excel
        fullName: normalizeValue(studentData.fullName),
        grNo: normalizeValue(studentData.grNo),
        panNo: normalizeValue(studentData.panNo),
        phoneNumber: normalizeValue(studentData.phoneNumber),
        caste: normalizeValue(studentData.caste),
        religion: normalizeValue(studentData.religion),
        address: normalizeValue(studentData.address),
        fatherName: normalizeValue(studentData.fatherName),
        fatherContact: normalizeValue(studentData.fatherContact),
        motherName: normalizeValue(studentData.motherName),
        motherContact: normalizeValue(studentData.motherContact),
      }))
      .filter((studentData) => {
        // Skip entirely blank rows from Excel
        const { rowNumber, ...studentFields } = studentData;
        return Object.values(studentFields).some((value) => value !== '');
      });

    if (studentsData.length === 0) {
      return res.status(400).json({
        message:
          'No valid rows found in Excel file. Ensure the sheet has student rows and headers like Full Name, GR No, PAN No, Phone Number.',
      });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const studentData of studentsData) {
      try {
        // Validate required fields first
        if (!studentData.fullName || !studentData.grNo || !studentData.panNo || !studentData.phoneNumber) {
          results.failed++;
          results.errors.push({
            rowNumber: studentData.rowNumber,
            grNo: studentData.grNo || 'N/A',
            error: 'Missing required fields (Full Name, GR No, PAN No, Phone Number)',
          });
          continue;
        }

        // Check if student already exists
        const existingGrNo = await get('SELECT id FROM students WHERE gr_no = ?', [studentData.grNo]);
        const existingPanNo = await get('SELECT id FROM students WHERE pan_no = ?', [studentData.panNo]);

        if (existingGrNo || existingPanNo) {
          results.failed++;
          results.errors.push({
            rowNumber: studentData.rowNumber,
            grNo: studentData.grNo,
            error: existingGrNo ? 'GR No already exists' : 'PAN No already exists',
          });
          continue;
        }

        // Create new student
        await run(
          `INSERT INTO students (
            full_name, gr_no, pan_no, phone_number, caste, religion, address,
            father_name, father_contact, mother_name, mother_contact, fees_history,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            studentData.fullName,
            studentData.grNo,
            studentData.panNo,
            studentData.phoneNumber,
            studentData.caste || '',
            studentData.religion || '',
            studentData.address || '',
            studentData.fatherName || '',
            studentData.fatherContact || '',
            studentData.motherName || '',
            studentData.motherContact || '',
            JSON.stringify(getDefaultFeesHistory()),
          ]
        );

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          rowNumber: studentData.rowNumber,
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
