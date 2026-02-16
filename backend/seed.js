require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('./models/Student');

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
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Student.deleteMany({});
    console.log('Cleared existing student records');

    // Insert sample data
    const result = await Student.insertMany(sampleStudents);
    console.log(`✓ Added ${result.length} sample students`);

    console.log('\nSample Students Added:');
    result.forEach((student, index) => {
      console.log(`${index + 1}. ${student.fullName} (GR: ${student.grNo})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
