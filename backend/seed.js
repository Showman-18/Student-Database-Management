const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const bcrypt = require('bcryptjs');
const { run, initDatabase } = require('./db');

const sampleAdmin = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin123',
};

const firstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Krishna', 'Arjun', 'Rahul', 'Rohan', 'Ritika', 'Ananya',
  'Priya', 'Sakshi', 'Neha', 'Kavya', 'Aisha', 'Fatima', 'Zara', 'Karan', 'Ishaan',
  'Harsh', 'Meera', 'Pooja', 'Sneha', 'Nikita', 'Tanvi', 'Yash', 'Manav', 'Dev', 'Parth',
];

const lastNames = [
  'Sharma', 'Patel', 'Singh', 'Verma', 'Gupta', 'Mehta', 'Khan', 'Shaikh', 'Joshi',
  'Jadhav', 'Kulkarni', 'Nair', 'Reddy', 'Iyer', 'Das', 'Pillai', 'Pandey', 'Yadav',
  'Chauhan', 'Mishra',
];

const streets = [
  'Nehru Nagar', 'MG Road', 'Shivaji Path', 'Station Road', 'Lake View Colony',
  'Saraswati Nagar', 'Gokul Society', 'Green Park', 'Shanti Vihar', 'Vidya Nagar',
];

const cities = [
  'Mumbai', 'Pune', 'Nashik', 'Ahmedabad', 'Surat', 'Indore', 'Bhopal',
  'Jaipur', 'Lucknow', 'Nagpur',
];

const castes = ['General', 'OBC', 'SC', 'ST'];
const religions = ['Hindu', 'Islam', 'Christian', 'Sikh', 'Buddhist'];
const paymentModes = ['Cash', 'UPI', 'Online', 'Cheque'];

const createPaidTerm = (index, termOrder, amount) => {
  const month = 1 + ((index + termOrder * 2) % 11);
  const day = 5 + ((index * 3 + termOrder) % 20);

  return {
    status: 'paid',
    amount,
    receiptNo: `REC${String(2000 + index * 10 + termOrder).padStart(4, '0')}`,
    modeOfPayment: paymentModes[(index + termOrder) % paymentModes.length],
    paidDate: new Date(new Date().getFullYear(), month - 1, day),
  };
};

const generateFeesHistory = (index) => {
  const currentYear = new Date().getFullYear();
  const baseAmount = 18000 + (index % 6) * 2000;

  const currentYearEntry = {
    year: currentYear,
    term1: index % 4 === 0 ? { status: 'pending' } : createPaidTerm(index, 1, baseAmount),
    term2: index % 3 === 0 ? { status: 'pending' } : createPaidTerm(index, 2, baseAmount),
    other: index % 5 === 0
      ? createPaidTerm(index, 3, 3000 + (index % 3) * 1000)
      : { status: index % 2 === 0 ? 'pending' : 'not applicable' },
  };

  if (index % 3 !== 0) {
    return [currentYearEntry];
  }

  return [
    {
      year: currentYear - 1,
      term1: createPaidTerm(index + 100, 1, baseAmount - 1000),
      term2: createPaidTerm(index + 100, 2, baseAmount - 1000),
      other: { status: 'not applicable' },
    },
    currentYearEntry,
  ];
};

const generateSampleStudents = (count = 68) => {
  const students = [];

  for (let index = 0; index < count; index += 1) {
    const firstName = firstNames[index % firstNames.length];
    const lastName = lastNames[Math.floor(index / firstNames.length) % lastNames.length];
    const fullName = `${firstName} ${lastName}`;

    const fatherFirstName = firstNames[(index + 7) % firstNames.length];
    const motherFirstName = firstNames[(index + 11) % firstNames.length];
    const city = cities[index % cities.length];
    const street = streets[index % streets.length];

    students.push({
      fullName,
      grNo: `GR${String(index + 1).padStart(3, '0')}`,
      panNo: `PAN${String(index + 1).padStart(4, '0')}`,
      phoneNumber: `+9198${String(10000000 + index).padStart(8, '0')}`,
      caste: castes[index % castes.length],
      religion: religions[index % religions.length],
      address: `${100 + index}, ${street}, ${city}`,
      fatherName: `${fatherFirstName} ${lastName}`,
      fatherContact: `+9197${String(20000000 + index).padStart(8, '0')}`,
      motherName: `${motherFirstName} ${lastName}`,
      motherContact: `+9196${String(30000000 + index).padStart(8, '0')}`,
      feesHistory: generateFeesHistory(index),
    });
  }

  return students;
};

const sampleStudents = generateSampleStudents(68);

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

    console.log('\nSample Students Added (first 10 shown):');
    sampleStudents.slice(0, 10).forEach((student, index) => {
      console.log(`${index + 1}. ${student.fullName} (GR: ${student.grNo})`);
    });
    if (sampleStudents.length > 10) {
      console.log(`...and ${sampleStudents.length - 10} more students`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
