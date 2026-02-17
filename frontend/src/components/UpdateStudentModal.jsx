import React, { useEffect, useState } from 'react';
import { X, User, Phone, MapPin, Users, Check, AlertCircle } from 'lucide-react';
import axios from '../api/axios';

const UpdateStudentModal = ({ student, isOpen, onClose, onSuccess }) => {
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

  useEffect(() => {
    if (student) {
      setFormData({
        fullName: student.fullName || '',
        grNo: student.grNo || '',
        panNo: student.panNo || '',
        phoneNumber: student.phoneNumber || '',
        caste: student.caste || '',
        religion: student.religion || '',
        address: student.address || '',
        fatherName: student.fatherName || '',
        fatherContact: student.fatherContact || '',
        motherName: student.motherName || '',
        motherContact: student.motherContact || '',
      });
    }
  }, [student]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!student?._id) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await axios.put(`/students/${student._id}`, formData);
      setSuccess('Student updated successfully!');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update student');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
        {/* Header with Gradient Background */}
        <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-amber-600 px-8 py-8 text-white z-40">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center border-2 border-white/30">
                <User size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Update Student</h2>
                <p className="text-white/80 text-sm mt-1">{student.fullName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition text-white"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700 flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Check size={18} />
              </div>
              <div>
                <p className="font-semibold text-sm">{success}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle size={18} />
              </div>
              <div>
                <p className="font-semibold text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Basic Information
              </h3>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">FULL NAME *</label>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 border border-orange-300 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">GR NUMBER *</label>
                  <input
                    type="text"
                    name="grNo"
                    placeholder="GR001"
                    value={formData.grNo}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 border border-orange-300 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">PAN NUMBER *</label>
                  <input
                    type="text"
                    name="panNo"
                    placeholder="XXXXX0000X"
                    value={formData.panNo}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 border border-orange-300 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">PHONE NUMBER *</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="+91 9876543210"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 border border-orange-300 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Personal Details
              </h3>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">CASTE</label>
                  <input
                    type="text"
                    name="caste"
                    placeholder="e.g., General"
                    value={formData.caste}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-purple-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">RELIGION</label>
                  <input
                    type="text"
                    name="religion"
                    placeholder="e.g., Hindu"
                    value={formData.religion}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-purple-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Address
              </h3>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <textarea
                name="address"
                placeholder="Enter full address..."
                value={formData.address}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-2.5 border border-amber-300 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition bg-white resize-none"
              />
            </div>
          </div>

          {/* Parent Details */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Parent Information
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Father */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 space-y-4">
                <h4 className="text-sm font-bold text-blue-900 mb-2">Father</h4>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">NAME</label>
                  <input
                    type="text"
                    name="fatherName"
                    placeholder="Father's name"
                    value={formData.fatherName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-blue-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">CONTACT</label>
                  <input
                    type="tel"
                    name="fatherContact"
                    placeholder="Father's contact"
                    value={formData.fatherContact}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-blue-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition bg-white"
                  />
                </div>
              </div>

              {/* Mother */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6 space-y-4">
                <h4 className="text-sm font-bold text-purple-900 mb-2">Mother</h4>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">NAME</label>
                  <input
                    type="text"
                    name="motherName"
                    placeholder="Mother's name"
                    value={formData.motherName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-purple-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">CONTACT</label>
                  <input
                    type="tel"
                    name="motherContact"
                    placeholder="Mother's contact"
                    value={formData.motherContact}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-purple-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200 px-8 py-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-100 transition font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl hover:shadow-lg transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateStudentModal;
