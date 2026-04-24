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
    if (status === 'paid') return 'text-green-700';
    if (status === 'pending') return 'text-amber-700';
    return 'text-gray-700';
  };

  const getStatusBadgeColor = (status) => {
    if (status === 'paid') return 'bg-green-100 text-green-700';
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
        className={`p-4 rounded-xl border border-gray-200 bg-white transition ${status === 'pending' ? 'cursor-pointer hover:bg-gray-50' : ''}`}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide">{termLabel}</p>
            <p className={`text-xs font-semibold mt-1 inline-block px-2.5 py-1 rounded-lg ${getStatusBadgeColor(status)}`}>
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

<div className="fixed inset-0 bg-black/35 backdrop-blur-sm flex items-center justify-center p-4 z-50">
  <div className="bg-white rounded-2xl border border-gray-100 max-w-3xl w-full max-h-[95vh] overflow-y-auto shadow-card">
    {/* Header */}
    <div className="sticky top-0 bg-white/80 backdrop-blur-md px-8 py-6 border-b border-gray-100 z-40 rounded-t-2xl">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-sm">
            <span className="font-bold text-2xl">{student.fullName.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{student.fullName}</h2>
            <p className="text-gray-400 text-sm mt-1">{student.grNo}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-500"
        >
          <X size={20} />
        </button>
      </div>
    </div>

    <div className="p-8 space-y-8">
      {/* Phone + PAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-gray-100 pb-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">Phone</p>
          <p className="text-gray-900 font-medium">{student.phoneNumber || '-'}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">PAN No</p>
          <p className="text-gray-900 font-medium">{student.panNo || '-'}</p>
        </div>
      </div>

      {/* Personal Details */}
      {(student.caste || student.religion) && (
        <div>
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <User size={14} className="text-emerald-600" /> Personal Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {student.caste && (
              <div className="py-2 border-b border-gray-100">
                <p className="text-gray-400 text-xs font-medium mb-2">CASTE</p>
                <p className="text-gray-900 font-medium">{student.caste}</p>
              </div>
            )}
            {student.religion && (
              <div className="py-2 border-b border-gray-100">
                <p className="text-gray-400 text-xs font-medium mb-2">RELIGION</p>
                <p className="text-gray-900 font-medium">{student.religion}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Address */}
      {student.address && (
        <div>
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <MapPin size={14} className="text-emerald-600" /> Address
          </h3>
          <div className="py-2 border-y border-gray-100">
            <p className="text-gray-600 leading-relaxed">{student.address}</p>
          </div>
        </div>
      )}

      {/* Parent Information */}
      <div>
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Users size={14} className="text-emerald-600" /> Parent Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-2 border-l-2 border-l-emerald-200">
            <h4 className="text-gray-900 font-medium text-sm mb-4">Father</h4>
            <div className="space-y-3">
              {student.fatherName && (
                <div>
                  <p className="text-gray-400 text-xs font-medium mb-1">NAME</p>
                  <p className="text-gray-900 font-medium">{student.fatherName}</p>
                </div>
              )}
              {student.fatherContact && (
                <div>
                  <p className="text-gray-400 text-xs font-medium mb-1">CONTACT</p>
                  <p className="text-gray-900 font-medium">{student.fatherContact}</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-2 border-l-2 border-l-emerald-200">
            <h4 className="text-gray-900 font-medium text-sm mb-4">Mother</h4>
            <div className="space-y-3">
              {student.motherName && (
                <div>
                  <p className="text-gray-400 text-xs font-medium mb-1">NAME</p>
                  <p className="text-gray-900 font-medium">{student.motherName}</p>
                </div>
              )}
              {student.motherContact && (
                <div>
                  <p className="text-gray-400 text-xs font-medium mb-1">CONTACT</p>
                  <p className="text-gray-900 font-medium">{student.motherContact}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fees Payment History */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <CreditCard size={14} className="text-emerald-600" /> Fees Payment History
          </h3>
          <button
            onClick={() => setAddYearModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition"
          >
            <Plus size={14} />
            Add Year
          </button>
        </div>

        {allYears.length > 0 ? (
          <div className="space-y-8">
            {allYears.map((year) => {
              const yearFeesHistory = getFeesHistoryForYear(year);
              return (
                <div key={year}>
                  <h4 className="text-base font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">
                    {year}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {renderFeesCard('term1', 'Term 1', yearFeesHistory)}
                    {renderFeesCard('term2', 'Term 2', yearFeesHistory)}
                    {renderFeesCard('other', 'Other', yearFeesHistory)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <CreditCard className="text-emerald-600" size={20} />
            </div>
            <p className="text-gray-500 text-sm font-medium mb-3">No fees history yet</p>
            <button
              onClick={() => setAddYearModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-medium text-sm mx-auto"
            >
              <Plus size={16} />
              Add First Year
            </button>
          </div>
        )}
      </div>
    </div>

    {/* Footer */}
    <div className="sticky bottom-0 bg-white/80 backdrop-blur-md border-t border-gray-100 px-8 py-6 flex justify-end gap-3">
      <button
        onClick={() => onDelete?.(student)}
        className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition font-medium text-sm"
      >
        <Trash2 size={16} />
        Delete
      </button>
      <button
        onClick={() => onEdit?.(student)}
        className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium text-sm"
      >
        <Edit2 size={16} />
        Edit
      </button>
      <button
        onClick={onClose}
        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-100 transition font-medium text-sm"
      >
        Close
      </button>
    </div>

    {/* Sub-modals unchanged */}
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
