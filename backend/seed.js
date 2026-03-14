const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const bcrypt = require('bcryptjs');
const { run, initDatabase } = require('./db');

const sampleAdmin = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin123',
};

const sampleStudents = [
  {
    fullName: 'John Doe',
    grNo: 'GR001',
    panNo: 'PAN001',
    phoneNumber: '+1234567890',
    caste: 'General',
    religion: 'Christian',
    address: '123 Main Street, New York',
    fatherName: 'James Doe',
    fatherContact: '+1234567891',
    motherName: 'Mary Doe',
    motherContact: '+1234567892',
    feesHistory: [
      {
        year: 2025,
        term1: {
          status: 'paid',
          amount: 25000,
          receiptNo: 'REC001',
          modeOfPayment: 'Cash',
          paidDate: new Date('2025-01-15'),
        },
        term2: {
          status: 'paid',
          amount: 25000,
          receiptNo: 'REC002',
          modeOfPayment: 'Online',
          paidDate: new Date('2025-06-10'),
        },
        other: {
          status: 'not applicable',
        }
      }
    ]
  },
  {
    fullName: 'Sarah Johnson',
    grNo: 'GR002',
    panNo: 'PAN002',
    phoneNumber: '+1234567893',
    caste: 'OBC',
    religion: 'Hindu',
    address: '456 Oak Avenue, Los Angeles',
    fatherName: 'Robert Johnson',
    fatherContact: '+1234567894',
    motherName: 'Lisa Johnson',
    motherContact: '+1234567895',
    feesHistory: [
      {
        year: 2025,
        term1: {
          status: 'paid',
          amount: 20000,
          receiptNo: 'REC003',
          modeOfPayment: 'Cheque',
          paidDate: new Date('2025-02-20'),
        },
        term2: {
          status: 'pending',
        },
        other: {
          status: 'not applicable',
        }
      }
    ]
  },
  {
    fullName: 'Priya Sharma',
    grNo: 'GR003',
    panNo: 'PAN003',
    phoneNumber: '+1234567896',
    caste: 'SC',
    religion: 'Hindu',
    address: '789 Pine Road, Chicago',
    fatherName: 'Rajesh Sharma',
    fatherContact: '+1234567897',
    motherName: 'Anita Sharma',
    motherContact: '+1234567898',
    feesHistory: [
      {
        year: 2025,
        term1: {
          status: 'pending',
        },
        term2: {
          status: 'pending',
        },
        other: {
          status: 'not applicable',
        }
      }
    ]
  },
  {
    fullName: 'David Williams',
    grNo: 'GR004',
    panNo: 'PAN004',
    phoneNumber: '+1234567899',
    caste: 'General',
    religion: 'Jewish',
    address: '321 Elm Street, Boston',
    fatherName: 'Michael Williams',
    fatherContact: '+1234567800',
    motherName: 'Jennifer Williams',
    motherContact: '+1234567801',
    feesHistory: [
      {
        year: 2025,
        term1: {
          status: 'paid',
          amount: 30000,
          receiptNo: 'REC004',
          modeOfPayment: 'Online',
          paidDate: new Date('2025-01-10'),
        },
        term2: {
          status: 'paid',
          amount: 30000,
          receiptNo: 'REC005',
          modeOfPayment: 'Online',
          paidDate: new Date('2025-07-05'),
        },
        other: {
          status: 'paid',
          amount: 5000,
          receiptNo: 'REC006',
          modeOfPayment: 'Cash',
          paidDate: new Date('2025-03-15'),
          comment: 'Library fees'
        }
      }
    ]
  },
  {
    fullName: 'Aisha Khan',
    grNo: 'GR005',
    panNo: 'PAN005',
    phoneNumber: '+1234567802',
    caste: 'General',
    religion: 'Islam',
    address: '654 Maple Drive, Houston',
    fatherName: 'Ahmed Khan',
    fatherContact: '+1234567803',
    motherName: 'Fatima Khan',
    motherContact: '+1234567804',
    feesHistory: [
      {
        year: 2025,
        term1: {
          status: 'paid',
          amount: 22000,
          receiptNo: 'REC007',
          modeOfPayment: 'UPI',
          paidDate: new Date('2025-01-25'),
        },
        term2: {
          status: 'pending',
        },
        other: {
          status: 'not applicable',
        }
      }
    ]
  },
  {
    fullName: 'Rohit Patel',
    grNo: 'GR006',
    panNo: 'PAN006',
    phoneNumber: '+1234567805',
    caste: 'OBC',
    religion: 'Hindu',
    address: '987 Cedar Lane, Phoenix',
    fatherName: 'Vikram Patel',
    fatherContact: '+1234567806',
    motherName: 'Sneha Patel',
    motherContact: '+1234567807',
  },
];

async function seedDatabase() {
  try {
    await initDatabase();
    console.log('Connected to SQLite');

    // Clear existing data
    await run('DELETE FROM admins');
    console.log('Cleared existing admin records');

    await run('DELETE FROM students');
    console.log('Cleared existing student records');

    // Insert default admin
    const hashedPassword = await bcrypt.hash(sampleAdmin.password, 10);
    await run(
      `INSERT INTO admins (username, password, created_at, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [sampleAdmin.username, hashedPassword]
    );
    console.log(`✓ Added default admin (Username: ${sampleAdmin.username})`);

    // Insert sample data
    for (const student of sampleStudents) {
      const feesHistory = Array.isArray(student.feesHistory) && student.feesHistory.length > 0
        ? student.feesHistory
        : [
            {
              year: new Date().getFullYear(),
              term1: { status: 'pending' },
              term2: { status: 'pending' },
              other: { status: 'pending' },
            },
          ];

      await run(
        `INSERT INTO students (
          full_name, gr_no, pan_no, phone_number, caste, religion, address,
          father_name, father_contact, mother_name, mother_contact, fees_history,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          student.fullName,
          student.grNo,
          student.panNo,
          student.phoneNumber,
          student.caste || '',
          student.religion || '',
          student.address || '',
          student.fatherName || '',
          student.fatherContact || '',
          student.motherName || '',
          student.motherContact || '',
          JSON.stringify(feesHistory),
        ]
      );
    }

    console.log(`✓ Added ${sampleStudents.length} sample students`);

    console.log('\nSample Students Added:');
    sampleStudents.forEach((student, index) => {
      console.log(`${index + 1}. ${student.fullName} (GR: ${student.grNo})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
