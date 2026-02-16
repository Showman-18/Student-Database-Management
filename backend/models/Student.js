const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    grNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    panNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    caste: {
      type: String,
      default: '',
    },
    religion: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    fatherName: {
      type: String,
      default: '',
    },
    fatherContact: {
      type: String,
      default: '',
    },
    motherName: {
      type: String,
      default: '',
    },
    motherContact: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', StudentSchema);
