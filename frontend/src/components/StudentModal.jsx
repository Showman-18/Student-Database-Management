import React, { useState } from 'react';
import { X, CreditCard, Plus, Edit2, Trash2 } from 'lucide-react';
import FeesPaymentModal from './FeesPaymentModal';
import AddYearModal from './AddYearModal';

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

const badgeStyle = (status) => {
  if (status === 'paid')    return { bg: T.soft, color: '#166534', border: T.hairline };
  if (status === 'pending') return { bg: T.soft, color: '#92400e', border: T.hairline };
  return { bg: T.soft, color: T.mute, border: T.hairline };
};

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', color: T.mute, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${T.hairline}` }}>{title}</p>
    {children}
  </div>
);

// FIX m1: use explicit null/undefined/''/null check so numeric 0 is still rendered
const Field = ({ label, value }) => (value !== null && value !== undefined && value !== '') ? (
  <div style={{ marginBottom: 10 }}>
    <p style={{ fontSize: 11, color: T.mute, fontWeight: 500, marginBottom: 3 }}>{label}</p>
    <p style={{ fontSize: 13, color: T.ink, fontWeight: 400, margin: 0 }}>{value}</p>
  </div>
) : null;

const StudentModal = ({ student, isOpen, onClose, onEdit, onDelete, onSuccess }) => {
  const [feesModal, setFeesModal] = useState({ isOpen: false, year: null, term: null });
  const [addYearModal, setAddYearModal] = useState(false);
  if (!isOpen || !student) return null;

  const allYears = (student.feesHistory || []).map(e => e.year).sort((a, b) => b - a);
  const getYear = (year) => (student.feesHistory || []).find(e => e.year === year) || { year, term1: { status: 'pending' }, term2: { status: 'pending' }, other: { status: 'pending' } };

  const renderCard = (term, label, yh) => {
    const td = yh?.[term];
    const st = td?.status || 'pending';
    const year = yh.year;
    const b = badgeStyle(st);
    return (
      <div key={term}
        onClick={() => st === 'pending' && setFeesModal({ isOpen: true, year, term })}
        style={{ border: `1px solid ${T.hairline}`, borderRadius: 12, padding: '14px 16px', background: T.canvas, cursor: st === 'pending' ? 'pointer' : 'default', transition: 'background 0.12s' }}
        onMouseEnter={e => { if (st === 'pending') e.currentTarget.style.background = T.soft; }}
        onMouseLeave={e => { e.currentTarget.style.background = T.canvas; }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.mute, marginBottom: 6 }}>{label}</p>
            <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 9999, background: b.bg, color: b.color, border: `1px solid ${b.border}` }}>{st.charAt(0).toUpperCase() + st.slice(1)}</span>
          </div>
          {st === 'paid' && <CreditCard size={14} style={{ color: '#166534' }} />}
        </div>
        {td && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12 }}>
            {td.receiptNo    && <div><span style={{ color: T.mute }}>Receipt: </span><span style={{ fontWeight: 500 }}>{td.receiptNo}</span></div>}
            {td.modeOfPayment && <div><span style={{ color: T.mute }}>Mode: </span><span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{td.modeOfPayment.replace('_', ' ')}</span></div>}
            {td.amount       && <div><span style={{ color: T.mute }}>Amount: </span><span style={{ fontWeight: 500 }}>₹{Number(td.amount).toLocaleString('en-IN')}</span></div>}
            {td.paidDate     && <div><span style={{ color: T.mute }}>Paid: </span><span style={{ fontWeight: 500 }}>{new Date(td.paidDate).toLocaleDateString('en-IN')}</span></div>}
            {td.comment      && <div><span style={{ color: T.mute }}>Note: </span><span style={{ fontWeight: 500 }}>{td.comment}</span></div>}
          </div>
        )}
        {st === 'pending' && <p style={{ fontSize: 11, color: T.mute, marginTop: 8 }}>Click to record payment</p>}
      </div>
    );
  };

  const btnPrimary = { background: T.ink, color: '#fff', border: 'none', borderRadius: 9999, padding: '7px 16px', height: 34, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', transition: 'background 0.15s' };
  const btnOutline = { background: T.canvas, color: T.ink, border: `1px solid ${T.hairlineStrong}`, borderRadius: 9999, padding: '7px 14px', height: 34, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' };
  const btnDanger  = { background: T.soft, color: '#dc2626', border: `1px solid ${T.hairline}`, borderRadius: 9999, padding: '7px 14px', height: 34, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50, backdropFilter: 'blur(2px)', fontFamily: "'DM Sans',ui-sans-serif,system-ui,sans-serif" }}>
      <div style={{ background: T.canvas, borderRadius: 12, border: `1px solid ${T.hairline}`, maxWidth: 700, width: '100%', maxHeight: '92vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(6px)', padding: '16px 24px', borderBottom: `1px solid ${T.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: T.ink, borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>
              {student.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontFamily: "'Nunito',sans-serif", fontSize: 16, fontWeight: 700, color: T.ink, margin: 0 }}>{student.fullName}</h2>
              <p style={{ fontSize: 12, color: T.mute, margin: '2px 0 0' }}>{student.grNo}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 9999, color: T.mute, display: 'flex' }}
            onMouseEnter={e => e.currentTarget.style.color = T.ink}
            onMouseLeave={e => e.currentTarget.style.color = T.mute}>
            <X size={17} />
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <Section title="Contact">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Phone" value={student.phoneNumber} />
              <Field label="PAN No" value={student.panNo} />
              <Field label="Aadhar No" value={student.aadharNo} />
              <Field label="ID No" value={student.idNo} />
            </div>
          </Section>

          <Section title="Personal Details">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Field label="DOB" value={student.dob} />
              <Field label="Blood Group" value={student.bloodGroup} />
              <Field label="Mother Tongue" value={student.motherTongue} />
              <Field label="Religion" value={student.religion} />
              <Field label="Caste" value={student.caste} />
              <Field label="Sub Caste" value={student.subCaste} />
              <Field label="Category" value={student.category} />
              {/* FIX m1: pass raw numbers; Field now renders 0 correctly */}
              <Field label="Height" value={student.height !== null && student.height !== undefined && student.height !== '' ? `${student.height} cm` : null} />
              <Field label="Weight" value={student.weight !== null && student.weight !== undefined && student.weight !== '' ? `${student.weight} kg` : null} />
            </div>
          </Section>

          {student.address && (
            <Section title="Address">
              <p style={{ fontSize: 13, color: T.charcoal, margin: 0 }}>{student.address}</p>
            </Section>
          )}

          <Section title="Parent Information">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ borderLeft: `2px solid ${T.hairlineStrong}`, paddingLeft: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: T.body, marginBottom: 8 }}>Father</p>
                <Field label="Name" value={student.fatherName} />
                <Field label="Contact" value={student.fatherContact} />
              </div>
              <div style={{ borderLeft: `2px solid ${T.hairlineStrong}`, paddingLeft: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: T.body, marginBottom: 8 }}>Mother</p>
                <Field label="Name" value={student.motherName} />
                <Field label="Contact" value={student.motherContact} />
              </div>
            </div>
          </Section>

          {/* Fees */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${T.hairline}` }}>
              <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', color: T.mute, margin: 0 }}>Fees Payment History</p>
              <button onClick={() => setAddYearModal(true)}
                style={{ background: 'none', border: 'none', color: T.body, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.color = T.ink}
                onMouseLeave={e => e.currentTarget.style.color = T.body}>
                <Plus size={13} />Add Year
              </button>
            </div>
            {allYears.length === 0 ? (
              <div style={{ padding: '28px', border: `1px dashed ${T.hairlineStrong}`, borderRadius: 12, textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: T.mute, marginBottom: 12 }}>No fees history yet</p>
                <button onClick={() => setAddYearModal(true)} style={{ ...btnPrimary }}
                  onMouseEnter={e => e.currentTarget.style.background = T.inkDeep}
                  onMouseLeave={e => e.currentTarget.style.background = T.ink}>
                  <Plus size={13} />Add First Year
                </button>
              </div>
            ) : allYears.map(year => (
              <div key={year} style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${T.hairline}` }}>{year}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {renderCard('term1', 'Term 1', getYear(year))}
                  {renderCard('term2', 'Term 2', getYear(year))}
                  {renderCard('other', 'Other', getYear(year))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: 'sticky', bottom: 0, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(6px)', borderTop: `1px solid ${T.hairline}`, padding: '12px 24px', display: 'flex', justifyContent: 'flex-end', gap: 7 }}>
          <button onClick={() => onDelete?.(student)} style={btnDanger}
            onMouseEnter={e => e.currentTarget.style.background = T.hairline}
            onMouseLeave={e => e.currentTarget.style.background = T.soft}>
            <Trash2 size={13} />Delete
          </button>
          <button onClick={() => onEdit?.(student)} style={btnOutline}
            onMouseEnter={e => e.currentTarget.style.background = T.soft}
            onMouseLeave={e => e.currentTarget.style.background = T.canvas}>
            <Edit2 size={13} />Edit
          </button>
          <button onClick={onClose} style={btnPrimary}
            onMouseEnter={e => e.currentTarget.style.background = T.inkDeep}
            onMouseLeave={e => e.currentTarget.style.background = T.ink}>
            Close
          </button>
        </div>

        <FeesPaymentModal student={student} year={feesModal.year} term={feesModal.term} isOpen={feesModal.isOpen} onClose={() => setFeesModal({ isOpen: false, year: null, term: null })} onSuccess={() => { onSuccess?.(); setFeesModal({ isOpen: false, year: null, term: null }); }} />
        <AddYearModal student={student} isOpen={addYearModal} onClose={() => setAddYearModal(false)} existingYears={allYears} onSuccess={() => { onSuccess?.(); setAddYearModal(false); }} />
      </div>
    </div>
  );
};

export default StudentModal;
