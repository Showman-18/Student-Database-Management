import React, { useState } from 'react';
import { X, User, Phone, MapPin, Users, CreditCard, Calendar, Plus, Edit2, Trash2 } from 'lucide-react';
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
    if (status === 'paid') return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    if (status === 'pending') return 'bg-amber-50 border-amber-200 text-amber-700';
    return 'bg-gray-50 border-gray-200 text-gray-700';
  };

  const getStatusBadgeColor = (status) => {
    if (status === 'paid') return 'bg-emerald-100 text-emerald-700';
    if (status === 'pending') return 'bg-amber-100 text-amber-700';
    return 'bg-gray-100 text-gray-700';
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
        className={`p-4 rounded-2xl border-2 transition ${getStatusColor(
          status
        )} ${status === 'pending' ? 'cursor-pointer hover:shadow-lg' : ''}`}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide">{termLabel}</p>
            <p className={`text-xs font-semibold mt-1 inline-block px-2.5 py-1 rounded-lg ${getStatusBadgeColor(status)}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </p>
          </div>
          {status === 'paid' && termData && (
            <CreditCard size={16} className="text-emerald-600" />
          )}
        </div>

        {termData && (
          <div className="space-y-2 text-sm">
            {termData.receiptNo && (
              <div>
                <p className="text-xs opacity-75">Receipt No</p>
                <p className="font-mono font-semibold text-xs">{termData.receiptNo}</p>
              </div>
            )}
            {termData.modeOfPayment && (
              <div>
                <p className="text-xs opacity-75">Payment Mode</p>
                <p className="font-semibold capitalize text-xs">{termData.modeOfPayment.replace('_', ' ')}</p>
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
                <p className="font-semibold text-xs">{new Date(termData.paidDate).toLocaleDateString('en-IN')}</p>
              </div>
            )}
            {termData.comment && (
              <div>
                <p className="text-xs opacity-75">Comments</p>
                <p className="font-semibold text-xs break-words">{termData.comment}</p>
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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[95vh] overflow-y-auto shadow-elevated">
        {/* Header with Gradient Background */}
        <div className="sticky top-0 bg-emerald-600 px-8 py-8 text-white z-40 rounded-t-3xl">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center border-2 border-white/30">
                <span className="text-white font-bold text-2xl">{student.fullName.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{student.fullName}</h2>
                <p className="text-white/70 text-sm mt-1">{student.grNo}</p>
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
        <div className="p-8 space-y-8">
          {/* Contact Information Card */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Phone size={18} className="text-emerald-600" />
                </div>
                <p className="text-gray-500 text-xs font-bold uppercase">Phone</p>
              </div>
              <p className="text-gray-900 font-semibold text-lg">{student.phoneNumber}</p>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <User size={18} className="text-emerald-600" />
                </div>
                <p className="text-gray-500 text-xs font-bold uppercase">PAN No</p>
              </div>
              <p className="text-gray-900 font-semibold text-lg">{student.panNo}</p>
            </div>
          </div>

          {/* Personal Details */}
          {(student.caste || student.religion) && (
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User size={16} className="text-emerald-600" /> Personal Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {student.caste && (
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <p className="text-gray-400 text-xs font-bold mb-2">CASTE</p>
                    <p className="text-gray-900 font-semibold">{student.caste}</p>
                  </div>
                )}
                {student.religion && (
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <p className="text-gray-400 text-xs font-bold mb-2">RELIGION</p>
                    <p className="text-gray-900 font-semibold">{student.religion}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Address */}
          {student.address && (
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <MapPin size={16} className="text-emerald-600" /> Address
              </h3>
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <p className="text-gray-600 leading-relaxed">{student.address}</p>
              </div>
            </div>
          )}

          {/* Parent Details */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users size={16} className="text-emerald-600" /> Parent Information
            </h3>
            <div className="grid grid-cols-2 gap-6">
              {/* Father */}
              <div className="bg-gray-50 rounded-2xl p-6 border-l-4 border-l-emerald-500 border border-gray-100">
                <h4 className="text-emerald-800 font-bold text-sm mb-4">Father</h4>
                <div className="space-y-3">
                  {student.fatherName && (
                    <div>
                      <p className="text-gray-400 text-xs font-bold mb-1">NAME</p>
                      <p className="text-gray-900 font-semibold">{student.fatherName}</p>
                    </div>
                  )}
                  {student.fatherContact && (
                    <div>
                      <p className="text-gray-400 text-xs font-bold mb-1">CONTACT</p>
                      <p className="text-gray-900 font-semibold">{student.fatherContact}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Mother */}
              <div className="bg-gray-50 rounded-2xl p-6 border-l-4 border-l-emerald-400 border border-gray-100">
                <h4 className="text-emerald-800 font-bold text-sm mb-4">Mother</h4>
                <div className="space-y-3">
                  {student.motherName && (
                    <div>
                      <p className="text-gray-400 text-xs font-bold mb-1">NAME</p>
                      <p className="text-gray-900 font-semibold">{student.motherName}</p>
                    </div>
                  )}
                  {student.motherContact && (
                    <div>
                      <p className="text-gray-400 text-xs font-bold mb-1">CONTACT</p>
                      <p className="text-gray-900 font-semibold">{student.motherContact}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Fees Payment History */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <CreditCard size={16} className="text-emerald-600" /> Fees Payment History
              </h3>
              <button
                onClick={() => setAddYearModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition font-medium text-xs border border-emerald-200"
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
                      <h4 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b-2 border-emerald-400">
                        {year}
                      </h4>
                      
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
              <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl text-center">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="text-gray-400" size={24} />
                </div>
                <p className="text-gray-500 text-sm font-medium mb-3">No fees history yet</p>
                <button
                  onClick={() => setAddYearModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium text-sm"
                >
                  <Plus size={16} />
                  Add First Year
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-8 py-6 flex justify-end gap-3">
          <button
            onClick={() => onDelete?.(student)}
            className="flex items-center gap-2 px-6 py-2.5 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition font-medium text-sm"
          >
            <Trash2 size={16} />
            Delete
          </button>
          <button
            onClick={() => onEdit?.(student)}
            className="flex items-center gap-2 px-6 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium text-sm"
          >
            <Edit2 size={16} />
            Edit
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-medium text-sm"
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
