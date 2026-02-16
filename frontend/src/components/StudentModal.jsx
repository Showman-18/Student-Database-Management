import React from 'react';
import { X, User, Phone, MapPin, Users } from 'lucide-react';

const StudentModal = ({ student, isOpen, onClose }) => {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="sticky top-0 flex justify-between items-center p-6 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">{student.fullName.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{student.fullName}</h2>
              <p className="text-slate-500 text-sm">{student.grNo}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-2 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <User className="text-blue-600 mt-1" size={18} />
              <div>
                <p className="text-slate-600 text-xs font-medium uppercase tracking-wide">PAN No</p>
                <p className="text-slate-900 font-semibold mt-0.5">{student.panNo}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
              <Phone className="text-green-600 mt-1" size={18} />
              <div>
                <p className="text-slate-600 text-xs font-medium uppercase tracking-wide">Phone</p>
                <p className="text-slate-900 font-semibold mt-0.5">{student.phoneNumber}</p>
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition">
                <p className="text-slate-500 text-xs font-medium mb-1">CASTE</p>
                <p className="text-slate-900 font-semibold">{student.caste || '—'}</p>
              </div>
              <div className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition">
                <p className="text-slate-500 text-xs font-medium mb-1">RELIGION</p>
                <p className="text-slate-900 font-semibold">{student.religion || '—'}</p>
              </div>
            </div>
          </div>

          {/* Address */}
          {student.address && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Address</h3>
              <div className="flex gap-3 p-4 border border-slate-200 rounded-lg bg-slate-50">
                <MapPin className="text-slate-400 mt-1 flex-shrink-0" size={18} />
                <p className="text-slate-700 leading-relaxed">{student.address}</p>
              </div>
            </div>
          )}

          {/* Parent Details */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users size={16} /> Parent Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Father */}
              <div className="border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 border-b border-slate-200">
                  <p className="text-blue-900 font-bold text-sm">Father</p>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-slate-500 text-xs font-medium mb-1">NAME</p>
                    <p className="text-slate-900 font-semibold">{student.fatherName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs font-medium mb-1">CONTACT</p>
                    <p className="text-slate-900 font-semibold">{student.fatherContact || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Mother */}
              <div className="border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition">
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-4 py-3 border-b border-slate-200">
                  <p className="text-purple-900 font-bold text-sm">Mother</p>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-slate-500 text-xs font-medium mb-1">NAME</p>
                    <p className="text-slate-900 font-semibold">{student.motherName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs font-medium mb-1">CONTACT</p>
                    <p className="text-slate-900 font-semibold">{student.motherContact || '—'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-6 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentModal;
