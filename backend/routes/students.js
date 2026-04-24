const express = require('express');
const { verifyToken } = require('../middleware/auth');
const XLSX = require('xlsx');
const { all, get, run } = require('../db');

const router = express.Router();
const PHONE_NUMBER_REGEX = /^\d{10}$/;
const AADHAR_REGEX = /^\d{12}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const CATEGORY_VALUES = new Set(['sc', 'st', 'nt', 'obc', 'sbc', 'open']);
const BLOOD_GROUP_VALUES = new Set(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);

const safeJsonParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const mapStudentRow = (row) => ({
  _id: String(row.id),
  dob: row.dob || '',
  fullName: row.full_name,
  grNo: row.gr_no,
  panNo: row.pan_no,
  phoneNumber: row.phone_number,
  caste: row.caste || '',
  religion: row.religion || '',
  address: row.address || '',
  idNo: row.id_no || '',
  aadharNo: row.aadhar_no || '',
  bloodGroup: row.blood_group || '',
  motherTongue: row.mother_tongue || '',
  subCaste: row.sub_caste || '',
  category: row.category || '',
  height: row.height ?? '',
  weight: row.weight ?? '',
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

const normalizeValue = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const validatePhoneFields = ({ phoneNumber, fatherContact, motherContact }) => {
  if (!PHONE_NUMBER_REGEX.test(phoneNumber)) {
    return 'Phone number must be exactly 10 digits';
  }

  if (fatherContact && !PHONE_NUMBER_REGEX.test(fatherContact)) {
    return 'Father contact must be exactly 10 digits';
  }

  if (motherContact && !PHONE_NUMBER_REGEX.test(motherContact)) {
    return 'Mother contact must be exactly 10 digits';
  }

  return null;
};

const validateStudentPayload = (student) => {
  if (!student.dob) return 'Date of birth is required';
  if (!student.fullName) return 'Full name is required';
  if (!student.grNo) return 'Reg No is required';
  if (!student.panNo) return 'PAN number is required';
  if (!student.phoneNumber) return 'Mobile number is required';
  if (!student.idNo) return 'Id number is required';
  if (!student.aadharNo) return 'Aadhar number is required';
  if (!student.bloodGroup) return 'Blood group is required';
  if (!student.motherTongue) return 'Mother tongue is required';
  if (!student.caste) return 'Caste is required';
  if (!student.subCaste) return 'Sub caste is required';
  if (!student.category) return 'Category is required';
  if (student.height === '') return 'Height is required';
  if (student.weight === '') return 'Weight is required';
  if (!student.address) return 'Address is required';
  if (!student.religion) return 'Religion is required';
  if (!student.fatherName) return 'Father name is required';
  if (!student.fatherContact) return 'Father contact is required';
  if (!student.motherName) return 'Mother name is required';
  if (!student.motherContact) return 'Mother contact is required';

  if (!/^\d{4}-\d{2}-\d{2}$/.test(student.dob)) return 'Date of birth must be in YYYY-MM-DD format';
  if (!PAN_REGEX.test(student.panNo.toUpperCase())) return 'PAN number must be in valid format';
  if (!AADHAR_REGEX.test(student.aadharNo)) return 'Aadhar number must be exactly 12 digits';
  if (!BLOOD_GROUP_VALUES.has(student.bloodGroup)) return 'Invalid blood group';
  if (!CATEGORY_VALUES.has(student.category.toLowerCase())) return 'Invalid category';
  if (!Number.isFinite(Number(student.height)) || Number(student.height) < 30 || Number(student.height) > 300) {
    return 'Height must be between 30 and 300';
  }
  if (!Number.isFinite(Number(student.weight)) || Number(student.weight) < 1 || Number(student.weight) > 500) {
    return 'Weight must be between 1 and 500';
  }

  return validatePhoneFields(student);
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
      dob,
      fullName,
      grNo,
      panNo,
      phoneNumber,
      caste,
      religion,
      address,
      idNo,
      aadharNo,
      bloodGroup,
      motherTongue,
      subCaste,
      category,
      height,
      weight,
      fatherName,
      fatherContact,
      motherName,
      motherContact,
    } = req.body;

    const normalizedStudent = {
      dob: normalizeValue(dob),
      fullName: normalizeValue(fullName),
      grNo: normalizeValue(grNo),
      panNo: normalizeValue(panNo).toUpperCase(),
      phoneNumber: normalizeValue(phoneNumber),
      caste: normalizeValue(caste),
      religion: normalizeValue(religion),
      address: normalizeValue(address),
      idNo: normalizeValue(idNo),
      aadharNo: normalizeValue(aadharNo),
      bloodGroup: normalizeValue(bloodGroup),
      motherTongue: normalizeValue(motherTongue),
      subCaste: normalizeValue(subCaste),
      category: normalizeValue(category),
      height: normalizeValue(height),
      weight: normalizeValue(weight),
      fatherName: normalizeValue(fatherName),
      fatherContact: normalizeValue(fatherContact),
      motherName: normalizeValue(motherName),
      motherContact: normalizeValue(motherContact),
    };

    const validationError = validateStudentPayload(normalizedStudent);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    // Check for duplicates
    const existingGrNo = await get('SELECT id FROM students WHERE gr_no = ?', [normalizedStudent.grNo]);
    const existingPanNo = await get('SELECT id FROM students WHERE pan_no = ?', [normalizedStudent.panNo]);

    if (existingGrNo) {
      return res.status(400).json({ message: 'GR No already exists' });
    }

    if (existingPanNo) {
      return res.status(400).json({ message: 'PAN No already exists' });
    }

    const inserted = await run(
      `INSERT INTO students (
        dob, full_name, gr_no, pan_no, phone_number, caste, religion, address,
        id_no, aadhar_no, blood_group, mother_tongue, sub_caste, category, height, weight,
        father_name, father_contact, mother_name, mother_contact, fees_history,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        normalizedStudent.dob,
        normalizedStudent.fullName,
        normalizedStudent.grNo,
        normalizedStudent.panNo,
        normalizedStudent.phoneNumber,
        normalizedStudent.caste,
        normalizedStudent.religion,
        normalizedStudent.address,
        normalizedStudent.idNo,
        normalizedStudent.aadharNo,
        normalizedStudent.bloodGroup,
        normalizedStudent.motherTongue,
        normalizedStudent.subCaste,
        normalizedStudent.category.toLowerCase(),
        Number(normalizedStudent.height),
        Number(normalizedStudent.weight),
        normalizedStudent.fatherName,
        normalizedStudent.fatherContact,
        normalizedStudent.motherName,
        normalizedStudent.motherContact,
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
      dob: 'dob',
      fullName: 'full_name',
      grNo: 'gr_no',
      panNo: 'pan_no',
      phoneNumber: 'phone_number',
      caste: 'caste',
      religion: 'religion',
      address: 'address',
      idNo: 'id_no',
      aadharNo: 'aadhar_no',
      bloodGroup: 'blood_group',
      motherTongue: 'mother_tongue',
      subCaste: 'sub_caste',
      category: 'category',
      height: 'height',
      weight: 'weight',
      fatherName: 'father_name',
      fatherContact: 'father_contact',
      motherName: 'mother_name',
      motherContact: 'mother_contact',
      feesHistory: 'fees_history',
    };

    const updates = [];
    const values = [];
    const normalizedBody = {};
    const currentStudent = mapStudentRow(existing);

    for (const [key, column] of Object.entries(fieldMap)) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        let value = req.body[key];
        if (key === 'feesHistory') {
          value = JSON.stringify(Array.isArray(value) ? value : []);
        } else if (value === null || value === undefined) {
          value = '';
        } else {
          value = normalizeValue(value);
        }

        if (['fullName', 'grNo', 'panNo', 'phoneNumber'].includes(key) && value === '') {
          const labels = {
            fullName: 'Full name',
            grNo: 'GR No',
            panNo: 'PAN No',
            phoneNumber: 'Phone number',
          };
          return res.status(400).json({ message: `${labels[key]} is required` });
        }

        if (key !== 'feesHistory') {
          normalizedBody[key] = value;
        }

        updates.push(`${column} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update' });
    }

    const studentForValidation = {
      ...currentStudent,
      ...normalizedBody,
      panNo: Object.prototype.hasOwnProperty.call(normalizedBody, 'panNo')
        ? String(normalizedBody.panNo).toUpperCase()
        : currentStudent.panNo,
      category: Object.prototype.hasOwnProperty.call(normalizedBody, 'category')
        ? String(normalizedBody.category).toLowerCase()
        : currentStudent.category,
    };

    const validationError = validateStudentPayload(studentForValidation);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'grNo')) {
      const duplicateGr = await get('SELECT id FROM students WHERE gr_no = ? AND id != ?', [
        normalizeValue(req.body.grNo),
        studentId,
      ]);
      if (duplicateGr) {
        return res.status(400).json({ message: 'GR No already exists' });
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'panNo')) {
      const duplicatePan = await get('SELECT id FROM students WHERE pan_no = ? AND id != ?', [
        normalizeValue(req.body.panNo).toUpperCase(),
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
    const excelData = students.map((student) => {
      const row = {
        DOB: student.dob || '',
        'Reg No': student.grNo,
        'Full Name': student.fullName,
        Address: student.address || '',
        'Mobile No': student.phoneNumber,
        'Id No': student.idNo || '',
        'Aadhar Card No': student.aadharNo || '',
        'Blood Group': student.bloodGroup || '',
        'Mother Tongue': student.motherTongue || '',
        Caste: student.caste || '',
        'Sub Caste': student.subCaste || '',
        Category: student.category || '',
        Height: student.height ?? '',
        Weight: student.weight ?? '',
        'PAN No': student.panNo,
        Religion: student.religion || '',
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

    const studentsData = req.body.data
      .map((studentData, index) => ({
        rowNumber: index + 2, // Header is row 1 in Excel
        dob: normalizeValue(studentData.dob),
        fullName: normalizeValue(studentData.fullName),
        grNo: normalizeValue(studentData.grNo),
        panNo: normalizeValue(studentData.panNo).toUpperCase(),
        phoneNumber: normalizeValue(studentData.phoneNumber),
        caste: normalizeValue(studentData.caste),
        religion: normalizeValue(studentData.religion),
        address: normalizeValue(studentData.address),
        idNo: normalizeValue(studentData.idNo),
        aadharNo: normalizeValue(studentData.aadharNo),
        bloodGroup: normalizeValue(studentData.bloodGroup),
        motherTongue: normalizeValue(studentData.motherTongue),
        subCaste: normalizeValue(studentData.subCaste),
        category: normalizeValue(studentData.category),
        height: normalizeValue(studentData.height),
        weight: normalizeValue(studentData.weight),
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

        const validationError = validateStudentPayload(studentData);
        if (validationError) {
          results.failed++;
          results.errors.push({
            rowNumber: studentData.rowNumber,
            grNo: studentData.grNo,
            error: validationError,
          });
          continue;
        }

        const phoneValidationError = validatePhoneFields(studentData);
        if (phoneValidationError) {
          results.failed++;
          results.errors.push({
            rowNumber: studentData.rowNumber,
            grNo: studentData.grNo || 'N/A',
            error: phoneValidationError,
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
            dob, full_name, gr_no, pan_no, phone_number, caste, religion, address,
            id_no, aadhar_no, blood_group, mother_tongue, sub_caste, category, height, weight,
            father_name, father_contact, mother_name, mother_contact, fees_history,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            studentData.dob,
            studentData.fullName,
            studentData.grNo,
            studentData.panNo,
            studentData.phoneNumber,
            studentData.caste || '',
            studentData.religion || '',
            studentData.address || '',
            studentData.idNo || '',
            studentData.aadharNo || '',
            studentData.bloodGroup || '',
            studentData.motherTongue || '',
            studentData.subCaste || '',
            studentData.category || '',
            studentData.height || '',
            studentData.weight || '',
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
