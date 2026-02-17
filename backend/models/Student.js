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
    feesHistory: [
      {
        year: {
          type: Number,
          required: true,
        },
        term1: {
          status: {
            type: String,
            enum: ['pending', 'paid', 'not applicable'],
            default: 'pending',
          },
          receiptNo: String,
          modeOfPayment: String,
          amount: Number,
          paidDate: Date,
          comment: String,
        },
        term2: {
          status: {
            type: String,
            enum: ['pending', 'paid', 'not applicable'],
            default: 'pending',
          },
          receiptNo: String,
          modeOfPayment: String,
          amount: Number,
          paidDate: Date,
          comment: String,
        },
        other: {
          status: {
            type: String,
            enum: ['pending', 'paid', 'not applicable'],
            default: 'pending',
          },
          receiptNo: String,
          modeOfPayment: String,
          amount: Number,
          paidDate: Date,
          comment: String,
        },
      },
    ],
  },
  { timestamps: true }
);

// Auto-generate fees history for current year if not present
StudentSchema.pre('save', function (next) {
  const currentYear = new Date().getFullYear();

  // Check if fees history for current year exists
  const currentYearHistory = this.feesHistory.find((entry) => entry.year === currentYear);

  if (!currentYearHistory) {
    // Create new fees history entry for current year
    this.feesHistory.push({
      year: currentYear,
      term1: { status: 'pending' },
      term2: { status: 'pending' },
      other: { status: 'pending' },
    });
  }

  next();
});

module.exports = mongoose.model('Student', StudentSchema);
