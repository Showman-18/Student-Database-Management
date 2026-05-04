import React, { useState } from 'react';
import { X, CreditCard, FileText, Calendar, MessageSquare, AlertCircle } from 'lucide-react';
import axios from '../api/axios';

/* ── Design tokens ── */
const T = {
  canvas:  '#ffffff',
  soft:    '#fafafa',
  hairline:'#e5e5e5',
  hairlineStrong: '#d4d4d4',
  ink:     '#000000',
  inkDeep: '#090909',
  charcoal:'#525252',
  body:    '#737373',
  mute:    '#a3a3a3',
};

const inputStyle = {
  background: T.canvas,
  border: `1px solid ${T.hairline}`,
  borderRadius: 9999,
  padding: '0 14px',
  height: 38,
  fontSize: 13,
  color: T.ink,
  outline: 'none',
  fontFamily: 'inherit',
  width: '100%',
  transition: 'border-color 0.15s',
};

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a3a3a3' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: 32,
  cursor: 'pointer',
};

const labelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 11,
  fontWeight: 500,
  color: T.body,
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const onFocusStyle = e => { e.target.style.borderColor = T.ink; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; };
const onBlurStyle  = e => { e.target.style.borderColor = T.hairline; e.target.style.boxShadow = 'none'; };

const FeesPaymentModal = ({ student, year, term, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    receiptNo: '', modeOfPayment: 'check', amount: '',
    paidDate: '', status: 'paid', comment: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !student) return null;

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const isOtherFees      = term === 'other';
  const isNotApplicable  = formData.status === 'not applicable';
  const isOtherPayMode   = formData.modeOfPayment === 'other';

  // FIX M4: single handler, called only via form onSubmit.
  // The footer button is type="submit" so it triggers the form — no double-fire.
  const handleSubmit = async e => {
    e.preventDefault();

    // FIX C2: amount is always required when payment is being recorded
    if (!isNotApplicable) {
      if (!formData.amount || Number(formData.amount) <= 0) {
        setError('Please enter a valid amount greater than 0');
        return;
      }
      if (isOtherPayMode) {
        if (!formData.comment || !formData.paidDate) {
          setError('Please fill all required fields');
          return;
        }
      } else {
        if (!formData.receiptNo || !formData.modeOfPayment || !formData.paidDate) {
          setError('Please fill all required fields');
          return;
        }
      }
    }

    setLoading(true);
    setError('');
    try {
      const submitData = { status: formData.status };

      if (!isNotApplicable) {
        submitData.modeOfPayment = formData.modeOfPayment;

        // FIX m3: store date as local date string to avoid UTC timezone shift
        // Append local midnight so toISOString doesn't roll back a day in UTC+ zones
        const localDate = new Date(`${formData.paidDate}T00:00:00`);
        submitData.paidDate = localDate.toISOString();

        // FIX C1: amount is always sent regardless of modeOfPayment
        submitData.amount = formData.amount;

        if (isOtherPayMode) {
          submitData.comment = formData.comment;
        } else {
          submitData.receiptNo = formData.receiptNo;
        }
      }

      await axios.put(`/students/${student._id}/fees/${year}/${term}`, submitData);
      setFormData({ receiptNo: '', modeOfPayment: 'check', amount: '', paidDate: '', status: 'paid', comment: '' });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update fees');
    } finally {
      setLoading(false);
    }
  };

  const termLabel = term === 'term1' ? 'Term 1' : term === 'term2' ? 'Term 2' : 'Other';

  const btnPrimary = {
    background: T.ink, color: '#fff', border: 'none', borderRadius: 9999,
    padding: '0 20px', height: 36, fontSize: 13, fontWeight: 500,
    cursor: loading ? 'not-allowed' : 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
    opacity: loading ? 0.6 : 1, transition: 'background 0.15s',
  };
  const btnOutline = {
    background: T.canvas, color: T.ink, border: `1px solid ${T.hairlineStrong}`,
    borderRadius: 9999, padding: '0 18px', height: 36, fontSize: 13, fontWeight: 500,
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', fontFamily: 'inherit',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.32)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50, backdropFilter: 'blur(2px)', fontFamily: "'DM Sans',ui-sans-serif,system-ui,sans-serif" }}>
      <div style={{ background: T.canvas, borderRadius: 12, border: `1px solid ${T.hairline}`, maxWidth: 460, width: '100%' }}>

        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${T.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: "'Nunito',sans-serif", fontSize: 15, fontWeight: 700, color: T.ink, margin: 0 }}>Record Fees Payment</h2>
            <p style={{ fontSize: 12, color: T.mute, margin: '2px 0 0' }}>{student.fullName} · {termLabel} {year}</p>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 9999, color: T.mute, display: 'flex' }}
            onMouseEnter={e => e.currentTarget.style.color = T.ink}
            onMouseLeave={e => e.currentTarget.style.color = T.mute}>
            <X size={17} />
          </button>
        </div>

        {/* Body — single <form> with id so footer submit button targets it */}
        <form id="fees-payment-form" onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {error && (
            <div style={{ padding: '10px 14px', background: T.soft, border: `1px solid ${T.hairline}`, borderRadius: 8, fontSize: 13, color: '#dc2626', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />{error}
            </div>
          )}

          {/* Status */}
          <div>
            <label style={labelStyle}>Status *</label>
            <select name="status" value={formData.status} onChange={handleChange} style={selectStyle} onFocus={onFocusStyle} onBlur={onBlurStyle}>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              {isOtherFees && <option value="not applicable">Not Applicable</option>}
            </select>
            {isNotApplicable && <p style={{ fontSize: 11, color: T.mute, marginTop: 5 }}>Other fees marked as not applicable</p>}
          </div>

          {/* Receipt No — shown for all non-other payment modes */}
          {!isNotApplicable && !isOtherPayMode && (
            <div>
              <label style={labelStyle}><FileText size={12} />Receipt Number *</label>
              <input type="text" name="receiptNo" value={formData.receiptNo} onChange={handleChange} placeholder="e.g., REC-2024-001" style={inputStyle} onFocus={onFocusStyle} onBlur={onBlurStyle} />
            </div>
          )}

          {/* Mode of Payment */}
          {!isNotApplicable && (
            <div>
              <label style={labelStyle}><CreditCard size={12} />Mode of Payment *</label>
              <select name="modeOfPayment" value={formData.modeOfPayment} onChange={handleChange} style={selectStyle} onFocus={onFocusStyle} onBlur={onBlurStyle}>
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

          {/* Amount — FIX C1+C2: always shown and required when recording a payment */}
          {!isNotApplicable && (
            <div>
              <label style={labelStyle}>Amount (₹) *</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                required={!isNotApplicable}
                style={inputStyle}
                onFocus={onFocusStyle}
                onBlur={onBlurStyle}
              />
            </div>
          )}

          {/* Comment — only for "other" payment mode */}
          {!isNotApplicable && isOtherPayMode && (
            <div>
              <label style={labelStyle}><MessageSquare size={12} />Comments *</label>
              <textarea name="comment" value={formData.comment} onChange={handleChange} placeholder="Enter payment details or comments..." rows={3}
                style={{ ...inputStyle, height: 'auto', borderRadius: 10, padding: '10px 14px', resize: 'none' }}
                onFocus={onFocusStyle} onBlur={onBlurStyle} />
            </div>
          )}

          {/* Payment Date */}
          {!isNotApplicable && (
            <div>
              <label style={labelStyle}><Calendar size={12} />Payment Date *</label>
              <input type="date" name="paidDate" value={formData.paidDate} onChange={handleChange} style={inputStyle} onFocus={onFocusStyle} onBlur={onBlurStyle} />
            </div>
          )}

        </form>

        {/* Footer — FIX M4: button is type="submit" targeting the form; no onClick handler */}
        <div style={{ padding: '12px 24px', borderTop: `1px solid ${T.hairline}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose} style={btnOutline}
            onMouseEnter={e => e.currentTarget.style.background = T.soft}
            onMouseLeave={e => e.currentTarget.style.background = T.canvas}>
            Cancel
          </button>
          <button type="submit" form="fees-payment-form" disabled={loading} style={btnPrimary}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = T.inkDeep; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.ink; }}>
            {loading ? 'Saving...' : 'Record Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeesPaymentModal;
