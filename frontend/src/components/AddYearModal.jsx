import React, { useState } from 'react';
import { X, Calendar, AlertCircle } from 'lucide-react';
import axios from '../api/axios';

/* ── Design tokens ── */
const T = {
  canvas:  '#ffffff',
  soft:    '#fafafa',
  hairline:'#e5e5e5',
  hairlineStrong: '#d4d4d4',
  ink:     '#000000',
  inkDeep: '#090909',
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

const onFocus = e => { e.target.style.borderColor = T.ink; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; };
const onBlur  = e => { e.target.style.borderColor = T.hairline; e.target.style.boxShadow = 'none'; };

const AddYearModal = ({ student, isOpen, onClose, onSuccess, existingYears = [] }) => {
  const [year, setYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !student) return null;

  const handleSubmit = async e => {
    e.preventDefault();
    const yearNum = parseInt(year);
    if (!year || isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      setError('Please enter a valid year between 1900 and 2100'); return;
    }
    if (existingYears.includes(yearNum)) {
      setError(`Fees history for year ${year} already exists`); return;
    }
    setLoading(true); setError('');
    try {
      await axios.post(`/students/${student._id}/fees/year`, { year: yearNum });
      setYear(''); onSuccess?.(); onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add year');
    } finally { setLoading(false); }
  };

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
      <div style={{ background: T.canvas, borderRadius: 12, border: `1px solid ${T.hairline}`, maxWidth: 400, width: '100%' }}>

        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${T.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: "'Nunito',sans-serif", fontSize: 15, fontWeight: 700, color: T.ink, margin: 0 }}>Add Fees Year</h2>
            <p style={{ fontSize: 12, color: T.mute, margin: '2px 0 0' }}>{student.fullName}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 9999, color: T.mute, display: 'flex' }}
            onMouseEnter={e => e.currentTarget.style.color = T.ink}
            onMouseLeave={e => e.currentTarget.style.color = T.mute}>
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {error && (
            <div style={{ padding: '10px 14px', background: T.soft, border: `1px solid ${T.hairline}`, borderRadius: 8, fontSize: 13, color: '#dc2626', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />{error}
            </div>
          )}

          <div>
            <label style={labelStyle}><Calendar size={12} />Academic Year *</label>
            <input
              type="number"
              value={year}
              onChange={e => setYear(e.target.value)}
              placeholder="e.g., 2024"
              min="1900"
              max="2100"
              style={inputStyle}
              onFocus={onFocus}
              onBlur={onBlur}
            />
            <p style={{ fontSize: 11, color: T.mute, marginTop: 6 }}>Creates Term 1, Term 2, and Other fee records.</p>
          </div>

        </form>

        {/* Footer */}
        <div style={{ padding: '12px 24px', borderTop: `1px solid ${T.hairline}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose} style={btnOutline}
            onMouseEnter={e => e.currentTarget.style.background = T.soft}
            onMouseLeave={e => e.currentTarget.style.background = T.canvas}>
            Cancel
          </button>
          <button type="submit" onClick={handleSubmit} disabled={loading} style={btnPrimary}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = T.inkDeep; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.ink; }}>
            {loading ? 'Adding...' : 'Add Year'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddYearModal;
