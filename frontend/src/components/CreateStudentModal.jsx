import React, { useState } from 'react';
import { X } from 'lucide-react';
import axios from '../api/axios';

const CreateStudentModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    grNo: '',
    panNo: '',
    phoneNumber: '',
    caste: '',
    religion: '',
    address: '',
    fatherName: '',
    fatherContact: '',
    motherName: '',
    motherContact: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await axios.post('/students', formData);
      setSuccess('Student created successfully!');
      setFormData({
        fullName: '',
        grNo: '',
        panNo: '',
        phoneNumber: '',
        caste: '',
        religion: '',
        address: '',
        fatherName: '',
        fatherContact: '',
        motherName: '',
        motherContact: '',
      });
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create student');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="sticky top-0 flex justify-between items-center p-6 border-b border-slate-200 bg-white">
          <h2 className="text-xl font-bold text-slate-900">Add New Student</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-2 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-3">
              <span className="text-lg">✓</span>
              <div>{success}</div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-3">
              <span className="text-lg">!</span>
              <div>{error}</div>
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="fullName"
                placeholder="Full Name *"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              />
              <input
                type="text"
                name="grNo"
                placeholder="GR Number *"
                value={formData.grNo}
                onChange={handleInputChange}
                required
                className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              />
              <input
                type="text"
                name="panNo"
                placeholder="PAN Number *"
                value={formData.panNo}
                onChange={handleInputChange}
                required
                className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              />
              <input
                type="tel"
                name="phoneNumber"
                placeholder="Phone Number *"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                required
                className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              />
            </div>
          </div>

          {/* Personal Details */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              Personal Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="caste"
                placeholder="Caste"
                value={formData.caste}
                onChange={handleInputChange}
                className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              />
              <input
                type="text"
                name="religion"
                placeholder="Religion"
                value={formData.religion}
                onChange={handleInputChange}
                className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              Address
            </h3>
            <textarea
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
            />
          </div>

          {/* Parent Details */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              Parent Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="fatherName"
                placeholder="Father's Name"
                value={formData.fatherName}
                onChange={handleInputChange}
                className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              />
              <input
                type="tel"
                name="fatherContact"
                placeholder="Father's Contact"
                value={formData.fatherContact}
                onChange={handleInputChange}
                className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              />
              <input
                type="text"
                name="motherName"
                placeholder="Mother's Name"
                value={formData.motherName}
                onChange={handleInputChange}
                className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              />
              <input
                type="tel"
                name="motherContact"
                placeholder="Mother's Contact"
                value={formData.motherContact}
                onChange={handleInputChange}
                className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 transition font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Student'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateStudentModal;
