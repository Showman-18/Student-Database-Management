import React, { useEffect, useState } from 'react';
import { X, User, Check, AlertCircle } from 'lucide-react';
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
  display: 'block',
  fontSize: 11,
  fontWeight: 500,
  color: T.body,
  marginBottom: 5,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const onFocus = e => { e.target.style.borderColor = T.ink; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; };
const onBlur  = e => { e.target.style.borderColor = T.hairline; e.target.style.boxShadow = 'none'; };

const SectionLabel = ({ children }) => (
  <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: T.mute, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${T.hairline}` }}>
    {children}
  </p>
);

const Field = ({ label, children }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
);

const Grid2 = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>{children}</div>
);

const UpdateStudentModal = ({ student, isOpen, onClose, onSuccess }) => {
  const emptyForm = {
    dob: '', fullName: '', grNo: '', panNo: '', phoneNumber: '',
    idNo: '', aadharNo: '', bloodGroup: '', motherTongue: '', caste: '',
    subCaste: '', category: '', height: '', weight: '', religion: '',
    address: '', fatherName: '', fatherContact: '', motherName: '', motherContact: '',
  };

  const [formData, setFormData] = useState(emptyForm);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const categories  = ['sc', 'st', 'nt', 'obc', 'sbc', 'open'];

  const sanitizeDigits = (v, max) => v.replace(/\D/g, '').slice(0, max);
  const sanitizePan    = v => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);

  useEffect(() => {
    if (student) {
      setFormData({
        dob:           student.dob           || '',
        fullName:      student.fullName      || '',
        grNo:          student.grNo          || '',
        panNo:         student.panNo         || '',
        phoneNumber:   student.phoneNumber   || '',
        idNo:          student.idNo          || '',
        aadharNo:      student.aadharNo      || '',
        bloodGroup:    student.bloodGroup    || '',
        motherTongue:  student.motherTongue  || '',
        caste:         student.caste         || '',
        subCaste:      student.subCaste      || '',
        category:      student.category      || '',
        height:        student.height        ?? '',
        weight:        student.weight        ?? '',
        religion:      student.religion      || '',
        address:       student.address       || '',
        fatherName:    student.fatherName    || '',
        fatherContact: student.fatherContact || '',
        motherName:    student.motherName    || '',
        motherContact: student.motherContact || '',
      });
    }
  }, [student]);

  const handleChange = e => {
    const { name, value } = e.target;
    const v =
      ['phoneNumber','fatherContact','motherContact','aadharNo'].includes(name)
        ? sanitizeDigits(value, name === 'aadharNo' ? 12 : 10)
        : name === 'panNo' ? sanitizePan(value)
        : value;
    setFormData(p => ({ ...p, [name]: v }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!student?._id) return;
    setError(''); setSuccess(''); setLoading(true);
    try {
      await axios.put(`/students/${student._id}`, formData);
      setSuccess('Student updated successfully!');
      setTimeout(() => { onSuccess?.(); onClose(); }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update student');
    } finally { setLoading(false); }
  };

  if (!isOpen || !student) return null;

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
      <div style={{ background: T.canvas, borderRadius: 12, border: `1px solid ${T.hairline}`, maxWidth: 680, width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${T.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: T.ink, borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User size={15} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontFamily: "'Nunito',sans-serif", fontSize: 15, fontWeight: 700, color: T.ink, margin: 0 }}>Update Student</h2>
              <p style={{ fontSize: 12, color: T.mute, margin: '2px 0 0' }}>{student.fullName}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 9999, color: T.mute, display: 'flex' }}
            onMouseEnter={e => e.currentTarget.style.color = T.ink}
            onMouseLeave={e => e.currentTarget.style.color = T.mute}>
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <form id="update-student-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {success && (
              <div style={{ padding: '10px 14px', background: T.soft, border: `1px solid ${T.hairline}`, borderRadius: 8, fontSize: 13, color: '#166534', display: 'flex', gap: 8, alignItems: 'center' }}>
                <Check size={14} style={{ flexShrink: 0 }} />{success}
              </div>
            )}
            {error && (
              <div style={{ padding: '10px 14px', background: T.soft, border: `1px solid ${T.hairline}`, borderRadius: 8, fontSize: 13, color: '#dc2626', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />{error}
              </div>
            )}

            {/* Basic */}
            <div>
              <SectionLabel>Basic Information</SectionLabel>
              <Grid2>
                <Field label="Full Name *">
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="John Doe" required style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </Field>
                <Field label="Reg No *">
                  <input type="text" name="grNo" value={formData.grNo} onChange={handleChange} placeholder="REG001" required style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </Field>
                <Field label="Date of Birth *">
                  <input type="date" name="dob" value={formData.dob} onChange={handleChange} required style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </Field>
                <Field label="Mobile No *">
                  <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="9876543210" required inputMode="numeric" pattern="\d{10}" minLength={10} maxLength={10} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </Field>
              </Grid2>
            </div>

            {/* Identity */}
            <div>
              <SectionLabel>Identity Details</SectionLabel>
              <Grid2>
                <Field label="ID No *">
                  <input type="text" name="idNo" value={formData.idNo} onChange={handleChange} placeholder="ID001" required maxLength={20} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </Field>
                <Field label="Aadhar No *">
                  <input type="text" name="aadharNo" value={formData.aadharNo} onChange={handleChange} placeholder="12-digit Aadhar" required inputMode="numeric" pattern="\d{12}" minLength={12} maxLength={12} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </Field>
                <Field label="PAN No *">
                  <input type="text" name="panNo" value={formData.panNo} onChange={handleChange} placeholder="ABCDE1234F" required pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}" maxLength={10} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </Field>
                <Field label="Blood Group *">
                  <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} required style={selectStyle} onFocus={onFocus} onBlur={onBlur}>
                    <option value="">Select</option>
                    {bloodGroups.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </Field>
                <Field label="Mother Tongue *">
                  <input type="text" name="motherTongue" value={formData.motherTongue} onChange={handleChange} placeholder="e.g., Marathi" required style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </Field>
                <Field label="Category *">
                  <select name="category" value={formData.category} onChange={handleChange} required style={selectStyle} onFocus={onFocus} onBlur={onBlur}>
                    <option value="">Select</option>
                    {categories.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                  </select>
                </Field>
              </Grid2>
            </div>

            {/* Personal */}
            <div>
              <SectionLabel>Personal Details</SectionLabel>
              <Grid2>
                <Field label="Caste">
                  <input type="text" name="caste" value={formData.caste} onChange={handleChange} placeholder="e.g., Maratha" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </Field>
                <Field label="Sub Caste *">
                  <input type="text" name="subCaste" value={formData.subCaste} onChange={handleChange} placeholder="e.g., Kunbi" required style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </Field>
                <Field label="Religion *">
                  <input type="text" name="religion" value={formData.religion} onChange={handleChange} placeholder="e.g., Hindu" required style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                  <Field label="Height (cm) *">
                    <input type="number" name="height" value={formData.height} onChange={handleChange} placeholder="170" required min={30} max={300} step="0.1" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  </Field>
                  <Field label="Weight (kg) *">
                    <input type="number" name="weight" value={formData.weight} onChange={handleChange} placeholder="60" required min={1} max={500} step="0.1" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  </Field>
                </div>
              </Grid2>
            </div>

            {/* Address */}
            <div>
              <SectionLabel>Address</SectionLabel>
              <Field label="Full Address *">
                <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Enter full address..." required rows={2}
                  style={{ ...inputStyle, height: 'auto', borderRadius: 10, padding: '10px 14px', resize: 'none' }}
                  onFocus={onFocus} onBlur={onBlur} />
              </Field>
            </div>

            {/* Parents */}
            <div>
              <SectionLabel>Parent Information</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ border: `1px solid ${T.hairline}`, borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: T.charcoal, margin: 0 }}>Father</p>
                  <Field label="Name *">
                    <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} placeholder="Father's name" required style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  </Field>
                  <Field label="Contact *">
                    <input type="tel" name="fatherContact" value={formData.fatherContact} onChange={handleChange} placeholder="10-digit number" required inputMode="numeric" pattern="\d{10}" minLength={10} maxLength={10} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  </Field>
                </div>
                <div style={{ border: `1px solid ${T.hairline}`, borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: T.charcoal, margin: 0 }}>Mother</p>
                  <Field label="Name *">
                    <input type="text" name="motherName" value={formData.motherName} onChange={handleChange} placeholder="Mother's name" required style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  </Field>
                  <Field label="Contact *">
                    <input type="tel" name="motherContact" value={formData.motherContact} onChange={handleChange} placeholder="10-digit number" required inputMode="numeric" pattern="\d{10}" minLength={10} maxLength={10} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  </Field>
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 24px', borderTop: `1px solid ${T.hairline}`, display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
          <button type="button" onClick={onClose} style={btnOutline}
            onMouseEnter={e => e.currentTarget.style.background = T.soft}
            onMouseLeave={e => e.currentTarget.style.background = T.canvas}>
            Cancel
          </button>
          <button type="submit" form="update-student-form" disabled={loading} style={btnPrimary}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = T.inkDeep; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.ink; }}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateStudentModal;
