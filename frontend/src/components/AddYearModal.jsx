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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="ui-card rounded-3xl max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white rounded-t-3xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add Fees History Year</h2>
            <p className="text-gray-400 text-sm mt-0.5">{student.fullName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition"
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
                <Calendar size={16} className="text-emerald-600" />
                Academic Year *
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g., 2024"
                min="1900"
                max="2100"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
              />
              <p className="text-xs text-gray-400 mt-1">This will create Term 1, Term 2, and Other fees records</p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100 bg-white rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-medium text-sm disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Year'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddYearModal;
