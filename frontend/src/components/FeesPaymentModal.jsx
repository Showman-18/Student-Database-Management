import React, { useState } from 'react';
import { X, Calendar, CreditCard, FileText, AlertCircle, MessageSquare } from 'lucide-react';
import axios from '../api/axios';

const FeesPaymentModal = ({ student, year, term, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    receiptNo: '',
    modeOfPayment: 'check',
    amount: '',
    paidDate: '',
    status: 'paid',
    comment: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !student) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const isOtherFees = term === 'other';
  const isNotApplicable = formData.status === 'not applicable';
  const isOtherPaymentMode = formData.modeOfPayment === 'other';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Only validate fields if not "not applicable"
    if (!isNotApplicable) {
      // If payment mode is "other", require comment and date
      if (isOtherPaymentMode) {
        if (!formData.comment || !formData.paidDate) {
          setError('Please fill all fields');
          return;
        }
      } else {
        // For other modes, require receipt, mode, amount, and date
        if (!formData.receiptNo || !formData.modeOfPayment || !formData.amount || !formData.paidDate) {
          setError('Please fill all fields');
          return;
        }
      }
    }

    setLoading(true);
    setError('');

    try {
      // Only include date if not "not applicable"
      const submitData = {
        status: formData.status,
      };
      
      if (!isNotApplicable) {
        submitData.modeOfPayment = formData.modeOfPayment;
        submitData.paidDate = new Date(formData.paidDate).toISOString();
        
        if (isOtherPaymentMode) {
          submitData.comment = formData.comment;
        } else {
          submitData.receiptNo = formData.receiptNo;
          submitData.amount = formData.amount;
        }
      }

      await axios.put(`/students/${student._id}/fees/${year}/${term}`, submitData);

      setFormData({
        receiptNo: '',
        modeOfPayment: 'check',
        amount: '',
        paidDate: '',
        status: 'paid',
        comment: '',
      });
      
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update fees');
    } finally {
      setLoading(false);
    }
  };

  const termLabel = term === 'term1' ? 'Term 1' : term === 'term2' ? 'Term 2' : 'Other';

  return (
    <div className="fixed inset-0 bg-black/35 backdrop-blur-sm flex items-center justify-center p-4 z-50">
  <div className="bg-white rounded-2xl border border-gray-100 max-w-lg w-full shadow-card">

    {/* Header */}
    <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 bg-white/80 backdrop-blur-md rounded-t-2xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Record Fees Payment</h2>
        <p className="text-gray-400 text-sm mt-0.5">
          {student.fullName} • {termLabel} {year}
        </p>
      </div>
      <button
        onClick={onClose}
        className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-500"
      >
        <X size={20} />
      </button>
    </div>

    {/* Content */}
    <div className="p-8">
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-red-600 text-sm">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Fees Receipt Number */}
        {!isNotApplicable && !isOtherPaymentMode && (
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-2">
              <FileText size={14} className="text-emerald-600" />
              Fees Receipt Number *
            </label>
            <input
              type="text"
              name="receiptNo"
              value={formData.receiptNo}
              onChange={handleChange}
              placeholder="e.g., REC-2024-001"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition text-sm"
            />
          </div>
        )}

        {/* Mode of Payment */}
        {!isNotApplicable && (
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-2">
              <CreditCard size={14} className="text-emerald-600" />
              Mode of Payment *
            </label>
            <select
              name="modeOfPayment"
              value={formData.modeOfPayment}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition text-sm"
            >
              <option value="check">Check</option>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="upi">UPI</option>
              <option value="other">Other</option>
            </select>
          </div>
        )}

        {/* Amount or Comment */}
        {!isNotApplicable && (
          <>
            {isOtherPaymentMode ? (
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-2">
                  <MessageSquare size={14} className="text-emerald-600" />
                  Comments *
                </label>
                <textarea
                  name="comment"
                  value={formData.comment}
                  onChange={handleChange}
                  placeholder="Enter payment details or comments..."
                  rows="4"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition text-sm resize-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition text-sm"
                />
              </div>
            )}
          </>
        )}

        {/* Payment Date */}
        {!isNotApplicable && (
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-2">
              <Calendar size={14} className="text-emerald-600" />
              Payment Date *
            </label>
            <input
              type="date"
              name="paidDate"
              value={formData.paidDate}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition text-sm"
            />
          </div>
        )}

        {/* Status */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">
            Status *
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition text-sm"
          >
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            {isOtherFees && <option value="not applicable">Not Applicable</option>}
          </select>
          {isNotApplicable && (
            <p className="text-xs text-gray-400 mt-2">Other fees marked as not applicable</p>
          )}
        </div>

      </form>
    </div>

    {/* Footer */}
    <div className="flex justify-end gap-3 px-8 py-6 border-t border-gray-100 bg-white/80 backdrop-blur-md rounded-b-2xl">
      <button
        onClick={onClose}
        className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium text-sm"
      >
        Cancel
      </button>
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-100 transition font-medium text-sm disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Record Payment'}
      </button>
    </div>

  </div>
</div>
  );
};

export default FeesPaymentModal;
