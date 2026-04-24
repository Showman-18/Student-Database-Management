import React, { useState } from 'react';
import { X, Calendar, AlertCircle } from 'lucide-react';
import axios from '../api/axios';

const AddYearModal = ({ student, isOpen, onClose, onSuccess, existingYears = [] }) => {
  const [year, setYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !student) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate input
    const yearNum = parseInt(year);
    if (!year || isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      setError('Please enter a valid year between 1900 and 2100');
      return;
    }

    // Check for duplicates
    if (existingYears.includes(yearNum)) {
      setError(`Fees history for year ${year} already exists`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(`/students/${student._id}/fees/year`, {
        year: yearNum,
      });

      setYear('');
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add year');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/35 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-white rounded-t-2xl">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Add Fees History Year</h2>
            <p className="text-gray-500 text-sm mt-0.5">{student.fullName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-2 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-red-600 text-sm">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            {/* Year Input */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Calendar size={16} className="text-gray-700" />
                Academic Year *
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g., 2024"
                min="1900"
                max="2100"
                className="control-input"
              />
              <p className="text-xs text-gray-500 mt-1">This will create Term 1, Term 2, and Other fees records.</p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-white rounded-b-2xl">
          <button
            onClick={onClose}
            className="btn-ghost"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Year'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddYearModal;
