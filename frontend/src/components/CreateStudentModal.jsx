import React, { useState } from 'react';
import { X, User, Phone, MapPin, Users, Check, AlertCircle } from 'lucide-react';
import axios from '../api/axios';

const CreateStudentModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    dob: '',
    fullName: '',
    grNo: '',
    panNo: '',
    phoneNumber: '',
    idNo: '',
    aadharNo: '',
    bloodGroup: '',
    motherTongue: '',
    caste: '',
    subCaste: '',
    category: '',
    height: '',
    weight: '',
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

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const categories = ['sc', 'st', 'nt', 'obc', 'sbc', 'open'];

  const sanitizeDigitsInput = (value, maxLength) => value.replace(/\D/g, '').slice(0, maxLength);
  const sanitizePanInput = (value) => value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const normalizedValue =
      ['phoneNumber', 'fatherContact', 'motherContact', 'aadharNo'].includes(name)
        ? sanitizeDigitsInput(value, name === 'aadharNo' ? 12 : 10)
        : name === 'panNo'
          ? sanitizePanInput(value)
        : value;

    setFormData((prev) => ({
      ...prev,
      [name]: normalizedValue,
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
        dob: '',
        fullName: '',
        grNo: '',
        panNo: '',
        phoneNumber: '',
        idNo: '',
        aadharNo: '',
        bloodGroup: '',
        motherTongue: '',
        caste: '',
        subCaste: '',
        category: '',
        height: '',
        weight: '',
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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[95vh] overflow-y-auto shadow-elevated">
        {/* Header with Gradient Background */}
        <div className="sticky top-0 bg-emerald-600 px-8 py-8 text-white z-40 rounded-t-3xl">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center border-2 border-white/30">
                <User size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Add New Student</h2>
                <p className="text-white/70 text-sm mt-1">Create a new student record</p>
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
        <form onSubmit={handleSubmit} className="p-8 pb-28 space-y-8">
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
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Basic Information
              </h3>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">DOB *</label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 border border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">REG NO *</label>
                  <input
                    type="text"
                    name="grNo"
                    placeholder="REG001"
                    value={formData.grNo}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 border border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">FULL NAME *</label>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 border border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">ADDRESS *</label>
                  <input
                    type="text"
                    name="address"
                    placeholder="Enter full address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 border border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">MOBILE NO *</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="9876543210"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    required
                    inputMode="numeric"
                    pattern="\d{10}"
                    minLength={10}
                    maxLength={10}
                    title="Enter exactly 10 digits"
                    className="w-full px-4 py-2.5 border border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Identity Details */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Identity Details
              </h3>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">ID NO *</label>
                  <input
                    type="text"
                    name="idNo"
                    placeholder="ID001"
                    value={formData.idNo}
                    onChange={handleInputChange}
                    required
                    maxLength={20}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">AADHAR CARD NO *</label>
                  <input
                    type="text"
                    name="aadharNo"
                    placeholder="12-digit Aadhar number"
                    value={formData.aadharNo}
                    onChange={handleInputChange}
                    required
                    inputMode="numeric"
                    pattern="\d{12}"
                    minLength={12}
                    maxLength={12}
                    title="Enter exactly 12 digits"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">PAN NUMBER *</label>
                  <input
                    type="text"
                    name="panNo"
                    placeholder="ABCDE1234F"
                    value={formData.panNo}
                    onChange={handleInputChange}
                    required
                    inputMode="text"
                    pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                    maxLength={10}
                    title="Enter a valid PAN format like ABCDE1234F"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">BLOOD GROUP *</label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition bg-white"
                  >
                    <option value="">Select blood group</option>
                    {bloodGroups.map((group) => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">MOTHER TONGUE *</label>
                  <input
                    type="text"
                    name="motherTongue"
                    placeholder="e.g., Marathi"
                    value={formData.motherTongue}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">CATEGORY *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition bg-white"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>{category.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Additional Details
              </h3>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">HEIGHT *</label>
                  <input
                    type="number"
                    name="height"
                    placeholder="Height in cm"
                    value={formData.height}
                    onChange={handleInputChange}
                    required
                    min={30}
                    max={300}
                    step="0.1"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">WEIGHT *</label>
                  <input
                    type="number"
                    name="weight"
                    placeholder="Weight in kg"
                    value={formData.weight}
                    onChange={handleInputChange}
                    required
                    min={1}
                    max={500}
                    step="0.1"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Personal Details
              </h3>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">CASTE</label>
                  <input
                    type="text"
                    name="caste"
                    placeholder="e.g., Maratha"
                    value={formData.caste}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">SUB CASTE *</label>
                  <input
                    type="text"
                    name="subCaste"
                    placeholder="e.g., Kunbi"
                    value={formData.subCaste}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">RELIGION *</label>
                  <input
                    type="text"
                    name="religion"
                    placeholder="e.g., Hindu"
                    value={formData.religion}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Address
              </h3>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
              <textarea
                name="address"
                placeholder="Enter full address..."
                value={formData.address}
                onChange={handleInputChange}
                rows="3"
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition bg-white resize-none"
              />
            </div>
          </div>

          {/* Parent Details */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Parent Information
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Father */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 space-y-4">
                <h4 className="text-sm font-bold text-emerald-800 mb-2">Father</h4>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">NAME</label>
                  <input
                    type="text"
                    name="fatherName"
                    placeholder="Father's name"
                    value={formData.fatherName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">CONTACT</label>
                  <input
                    type="tel"
                    name="fatherContact"
                    placeholder="10-digit contact"
                    value={formData.fatherContact}
                    onChange={handleInputChange}
                    inputMode="numeric"
                    pattern="\d{10}"
                    minLength={10}
                    maxLength={10}
                    title="Enter exactly 10 digits"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition bg-white"
                  />
                </div>
              </div>

              {/* Mother */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 space-y-4">
                <h4 className="text-sm font-bold text-emerald-800 mb-2">Mother</h4>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">NAME</label>
                  <input
                    type="text"
                    name="motherName"
                    placeholder="Mother's name"
                    value={formData.motherName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">CONTACT</label>
                  <input
                    type="tel"
                    name="motherContact"
                    placeholder="10-digit contact"
                    value={formData.motherContact}
                    onChange={handleInputChange}
                    inputMode="numeric"
                    pattern="\d{10}"
                    minLength={10}
                    maxLength={10}
                    title="Enter exactly 10 digits"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-gray-100 px-8 py-6 flex justify-end gap-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)]">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition font-medium text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Student'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateStudentModal;
