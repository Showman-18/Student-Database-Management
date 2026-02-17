import React, { useState } from 'react';
import { X, User, Phone, MapPin, Users, CreditCard, Calendar, Plus } from 'lucide-react';
import FeesPaymentModal from './FeesPaymentModal';
import AddYearModal from './AddYearModal';

const StudentModal = ({ student, isOpen, onClose, onEdit, onDelete, onSuccess }) => {
  const [feesModal, setFeesModal] = useState({ isOpen: false, year: null, term: null });
  const [addYearModal, setAddYearModal] = useState(false);

  if (!isOpen || !student) return null;

  const currentYear = new Date().getFullYear();
  const allYears = student.feesHistory && student.feesHistory.length > 0 
    ? student.feesHistory.map(entry => entry.year).sort((a, b) => b - a)
    : [];

  const getFeesHistoryForYear = (year) => {
    if (!student.feesHistory || student.feesHistory.length === 0) {
      return {
        year: year,
        term1: { status: 'pending' },
        term2: { status: 'pending' },
        other: { status: 'pending' },
      };
    }
    
    const entry = student.feesHistory.find((entry) => entry.year === year);
    
    if (!entry) {
      return {
        year: year,
        term1: { status: 'pending' },
        term2: { status: 'pending' },
        other: { status: 'pending' },
      };
    }
    
    return entry;
  };

  const getStatusColor = (status) => {
    if (status === 'paid') return 'bg-green-50 border-green-200 text-green-700';
    if (status === 'pending') return 'bg-yellow-50 border-yellow-200 text-yellow-700';
    return 'bg-slate-50 border-slate-200 text-slate-700';
  };

  const getStatusBadgeColor = (status) => {
    if (status === 'paid') return 'bg-green-100 text-green-700';
    if (status === 'pending') return 'bg-yellow-100 text-yellow-700';
    return 'bg-slate-100 text-slate-700';
  };

  const handleFeesCardClick = (term, year, status) => {
    if (status === 'pending') {
      setFeesModal({ isOpen: true, year: year, term });
    }
  };

  const renderFeesCard = (term, termLabel, feesHistory) => {
    const termData = feesHistory?.[term];
    const status = termData?.status || 'pending';
    const year = feesHistory.year;

    return (
      <div
        key={term}
        onClick={() => handleFeesCardClick(term, year, status)}
        className={`p-4 border-2 rounded-xl transition ${getStatusColor(
          status
        )} ${status === 'pending' ? 'cursor-pointer hover:shadow-md' : ''}`}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide">{termLabel}</p>
            <p className={`text-xs font-semibold mt-1 inline-block px-2 py-1 rounded-lg ${getStatusBadgeColor(status)}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </p>
          </div>
          {status === 'paid' && termData && (
            <CreditCard size={16} className="text-green-700" />
          )}
        </div>

        {termData && (
          <div className="space-y-2 text-sm">
            {termData.receiptNo && (
              <div>
                <p className="text-xs opacity-75">Receipt No</p>
                <p className="font-mono font-semibold">{termData.receiptNo}</p>
              </div>
            )}
            {termData.modeOfPayment && (
              <div>
                <p className="text-xs opacity-75">Payment Mode</p>
                <p className="font-semibold capitalize">{termData.modeOfPayment.replace('_', ' ')}</p>
              </div>
            )}
            {termData.amount && (
              <div>
                <p className="text-xs opacity-75">Amount</p>
                <p className="font-semibold">₹{termData.amount.toLocaleString('en-IN')}</p>
              </div>
            )}
            {termData.paidDate && (
              <div>
                <p className="text-xs opacity-75">Paid Date</p>
                <p className="font-semibold">{new Date(termData.paidDate).toLocaleDateString('en-IN')}</p>
              </div>
            )}
            {termData.comment && (
              <div>
                <p className="text-xs opacity-75">Comments</p>
                <p className="font-semibold text-sm break-words">{termData.comment}</p>
              </div>
            )}
          </div>
        )}

        {status === 'pending' && (
          <p className="text-xs opacity-75 mt-3 italic">Click to record payment</p>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="ui-card rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex justify-between items-center p-6 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center">
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
            <div className="flex items-start gap-3 p-3 bg-teal-50 rounded-xl border border-teal-100">
              <User className="text-teal-700 mt-1" size={18} />
              <div>
                <p className="text-slate-600 text-xs font-medium uppercase tracking-wide">PAN No</p>
                <p className="text-slate-900 font-semibold mt-0.5">{student.panNo}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-cyan-50 rounded-xl border border-cyan-100">
              <Phone className="text-cyan-700 mt-1" size={18} />
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
              <div className="flex gap-3 p-4 border border-slate-200 rounded-xl bg-slate-50">
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

          {/* Fees Payment History */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <CreditCard size={16} /> Fees Payment History
              </h3>
              <button
                onClick={() => setAddYearModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition font-medium text-xs"
              >
                <Plus size={14} />
                Add Year
              </button>
            </div>

            {/* Display all years */}
            {allYears.length > 0 ? (
              <div className="space-y-8">
                {allYears.map((year) => {
                  const yearFeesHistory = getFeesHistoryForYear(year);
                  return (
                    <div key={year}>
                      {/* Year Heading */}
                      <h4 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b-2 border-teal-200">
                        {year}
                      </h4>
                      
                      {/* Fees Cards for this year */}
                      <div className="grid grid-cols-3 gap-4">
                        {renderFeesCard('term1', 'Term 1', yearFeesHistory)}
                        {renderFeesCard('term2', 'Term 2', yearFeesHistory)}
                        {renderFeesCard('other', 'Other', yearFeesHistory)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <p className="text-slate-600 text-sm font-medium mb-3">No fees history yet</p>
                <button
                  onClick={() => setAddYearModal(true)}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium text-sm"
                >
                  <Plus size={16} />
                  Add First Year
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={() => onDelete?.(student)}
            className="px-6 py-2.5 border border-red-200 text-red-700 rounded-xl hover:bg-red-50 transition font-medium text-sm"
          >
            Delete
          </button>
          <button
            onClick={() => onEdit?.(student)}
            className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 transition font-medium text-sm"
          >
            Edit
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition font-medium text-sm"
          >
            Close
          </button>
        </div>

        {/* Fees Payment Modal */}
        <FeesPaymentModal
          student={student}
          year={feesModal.year}
          term={feesModal.term}
          isOpen={feesModal.isOpen}
          onClose={() => setFeesModal({ isOpen: false, year: null, term: null })}
          onSuccess={() => {
            // Refresh student data
            onSuccess?.();
            setFeesModal({ isOpen: false, year: null, term: null });
          }}
        />

        {/* Add Year Modal */}
        <AddYearModal
          student={student}
          isOpen={addYearModal}
          onClose={() => setAddYearModal(false)}
          existingYears={allYears}
          onSuccess={() => {
            onSuccess?.();
            setAddYearModal(false);
          }}
        />
      </div>
    </div>
  );
};

export default StudentModal;
