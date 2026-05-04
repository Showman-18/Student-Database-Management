import React, { lazy, Suspense, useState, useEffect, useRef, useCallback } from 'react';
import axios from '../api/axios';
import { Search, Users, Plus, Download, Upload, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const StudentModal = lazy(() => import('../components/StudentModal'));
const CreateStudentModal = lazy(() => import('../components/CreateStudentModal'));
const UpdateStudentModal = lazy(() => import('../components/UpdateStudentModal'));

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

const avatarPalette = [
  { bg:'#f4f4f5', color:'#18181b' },
  { bg:'#f4f4f5', color:'#18181b' },
  { bg:'#f4f4f5', color:'#18181b' },
];

const statusBadge = {
  active:   { bg: T.soft, color: '#166534', label:'Active', border: T.hairline },
  pending:  { bg: T.soft, color: '#92400e', label:'Pending', border: T.hairline },
  inactive: { bg: T.soft, color: T.mute,    label:'Inactive', border: T.hairline },
};

const getStatus = (student) => {
  if (!student.feesHistory?.length) return 'inactive';
  const hasPending = student.feesHistory.some(y => ['term1','term2','other'].some(t => y[t]?.status === 'pending'));
  const hasPaid    = student.feesHistory.some(y => ['term1','term2','other'].some(t => y[t]?.status === 'paid'));
  return hasPending ? 'pending' : hasPaid ? 'active' : 'inactive';
};

const PAGE_SIZE = 10;

const Students = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dbHealth, setDbHealth] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileInputRef = useRef(null);

  // FIX M3: use refs so fetchStudents always sees current values without needing
  // them in its dependency array — avoids stale closure without re-creating the fn.
  const selectedStudentRef = useRef(selectedStudent);
  const isModalOpenRef = useRef(isModalOpen);
  useEffect(() => { selectedStudentRef.current = selectedStudent; }, [selectedStudent]);
  useEffect(() => { isModalOpenRef.current = isModalOpen; }, [isModalOpen]);

  const loadXlsx = async () => { const m = await import('xlsx'); return m; };

  // FIX M3: fetchStudents is stable (useCallback with no deps that change).
  // It reads the latest selectedStudent/isModalOpen via refs.
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const r = await axios.get('/students');
      setStudents(r.data);
      // FIX C4: always refresh selectedStudent from server response when modal is open
      if (selectedStudentRef.current && isModalOpenRef.current) {
        const upd = r.data.find(s => s._id === selectedStudentRef.current._id);
        if (upd) setSelectedStudent(upd);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  }, []); // stable — no deps needed because we read state via refs

  useEffect(() => {
    fetchStudents();
    fetchDbHealth();
  }, [fetchStudents]);

  // FIX M6: debounce window-focus / visibility re-fetches to avoid race conditions
  useEffect(() => {
    let debounceTimer = null;
    const debouncedFetch = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fetchStudents(), 300);
    };
    const onFocus = () => debouncedFetch();
    const onVis   = () => { if (!document.hidden) debouncedFetch(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearTimeout(debounceTimer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [fetchStudents]);

  const fetchDbHealth = async () => {
    try { const r = await axios.get('/system/db/status'); setDbHealth(r.data); }
    catch { setDbHealth(null); }
  };

  // FIX m5: only reset currentPage when search/sort changes, NOT when students list refreshes
  useEffect(() => {
    let res = [...students];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      res = res.filter(s => s.fullName.toLowerCase().includes(q) || s.grNo.toLowerCase().includes(q));
    }
    res.sort((a, b) => {
      const av = sortBy === 'name' ? a.fullName : a.grNo;
      const bv = sortBy === 'name' ? b.fullName : b.grNo;
      return sortOrder === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    setFilteredStudents(res);
  }, [students, searchQuery, sortBy, sortOrder]);

  // FIX m5: reset page only when the search/sort criteria change, not on every data refresh
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredStudents.length / PAGE_SIZE);
  const paged = filteredStudents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleStudentClick = (s) => { setSelectedStudent(s); setIsModalOpen(true); };
  const handleEditStudent   = (s) => { setEditingStudent(s); setIsModalOpen(false); setIsUpdateModalOpen(true); };
  const handleDeleteStudent = async (s) => {
    if (!s?._id || !window.confirm(`Delete ${s.fullName}? Cannot be undone.`)) return;
    try {
      await axios.delete(`/students/${s._id}`);
      setIsModalOpen(false);
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete student');
    }
  };

  const handleExport = async () => {
    try {
      const r = await axios.get('/students/export/excel', { responseType:'blob' });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a'); a.href=url; a.setAttribute('download', `students_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
    } catch (err) { setError(err.response?.data?.message || 'Export failed'); }
  };

  const handleDownloadTemplate = async () => {
    const XLSX = await loadXlsx();
    const tpl = [{ DOB:'','Reg No':'','Full Name':'',Address:'','Mobile No':'','Id No':'','Aadhar Card No':'','Blood Group':'','Mother Tongue':'',Caste:'','Sub Caste':'',Category:'',Height:'',Weight:'','PAN No':'',Religion:'','Father Name':'','Father Contact':'','Mother Name':'','Mother Contact':'' }];
    const ws = XLSX.utils.json_to_sheet(tpl); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students'); XLSX.writeFile(wb, 'student_import_template.xlsx');
  };

  const handleImport = (event) => {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const XLSX = await loadXlsx(); setError('');
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type:'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(ws, { raw:false, defval:'', blankrows:false });
        const norm = v => (v==null) ? '' : String(v).trim();
        const find = (row, aliases) => {
          const na = aliases.map(a => a.toLowerCase().replace(/[^a-z0-9]/g,''));
          for (const [k,v] of Object.entries(row)) { if (na.includes(String(k).toLowerCase().replace(/[^a-z0-9]/g,''))) return v; }
          return '';
        };
        const mapped = jsonData.map(row => ({
          dob:           norm(find(row,['DOB','Date of Birth'])),
          fullName:      norm(find(row,['Full Name','FullName','Name','Student Name'])),
          grNo:          norm(find(row,['Reg No','Registration No','GR No','GRNo','GR Number','GR'])),
          panNo:         norm(find(row,['PAN No','PANNo','PAN Number','PAN'])),
          phoneNumber:   norm(find(row,['Mobile No','Phone Number','Phone','Mobile Number','Mobile','Contact Number'])),
          idNo:          norm(find(row,['Id No','ID No','Id Number','ID Number'])),
          aadharNo:      norm(find(row,['Aadhar Card No','Aadhar No','Aadhaar No','Aadhar'])),
          bloodGroup:    norm(find(row,['Blood Group','Bloodgrp','Blood Grp'])),
          motherTongue:  norm(find(row,['Mother Tongue','MotherTongue'])),
          caste:         norm(find(row,['Caste'])),
          subCaste:      norm(find(row,['Sub Caste','SubCaste'])),
          category:      norm(find(row,['Category'])),
          height:        norm(find(row,['Height'])),
          weight:        norm(find(row,['Weight'])),
          religion:      norm(find(row,['Religion'])),
          address:       norm(find(row,['Address'])),
          fatherName:    norm(find(row,['Father Name','FatherName'])),
          fatherContact: norm(find(row,['Father Contact','FatherContact','Father Phone','Father Mobile'])),
          motherName:    norm(find(row,['Mother Name','MotherName'])),
          motherContact: norm(find(row,['Mother Contact','MotherContact','Mother Phone','Mother Mobile'])),
        }));
        if (!mapped.length) { setError('No rows found'); return; }
        const res = await axios.post('/students/import/excel', { data: mapped });
        const errs = res.data?.results?.errors || [];
        if (errs.length) alert(`${res.data.message}\n\n${errs.slice(0,5).map(i=>`Row ${i.rowNumber||'?'}: ${i.error}`).join('\n')}`);
        else alert(res.data.message);
        fetchStudents();
      } catch (err) { setError(err.response?.data?.message || 'Import failed'); }
    };
    reader.readAsArrayBuffer(file); event.target.value = '';
  };

  const getAvatar = (name) => avatarPalette[(name?.charCodeAt(0)||0) % avatarPalette.length];
  const getInitials = (name) => (name||'').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '??';

  const pageNums = () => {
    if (totalPages <= 5) return Array.from({length:totalPages},(_,i)=>i+1);
    const pages = [1];
    if (currentPage > 3) pages.push('…');
    for (let i=Math.max(2,currentPage-1); i<=Math.min(totalPages-1,currentPage+1); i++) pages.push(i);
    if (currentPage < totalPages-2) pages.push('…');
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  const sidebarW = sidebarOpen ? 220 : 60;

  const thStyle = { padding:'8px 14px', textAlign:'left', fontSize:11, fontWeight:500, color: T.mute, textTransform:'uppercase', letterSpacing:'0.06em', background: T.soft, borderBottom:`1px solid ${T.hairline}` };
  const tdStyle = { padding:'12px 14px', fontSize:13, borderBottom:`1px solid ${T.soft}`, verticalAlign:'middle' };

  const btnPrimary = {
    background: T.ink, color:'#fff', border:'none', borderRadius:9999,
    padding:'0 16px', height:34, fontSize:13, fontWeight:500, cursor:'pointer',
    display:'inline-flex', alignItems:'center', gap:6, fontFamily:'inherit',
    transition:'background 0.15s', whiteSpace:'nowrap',
  };
  const btnOutline = {
    background: T.canvas, color: T.ink, border:`1px solid ${T.hairlineStrong}`,
    borderRadius:9999, padding:'0 13px', height:34, fontSize:13, fontWeight:500,
    cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6,
    fontFamily:'inherit', transition:'background 0.15s', whiteSpace:'nowrap',
  };
  const inputStyle = {
    border:`1px solid ${T.hairline}`, borderRadius:9999, padding:'0 12px 0 30px',
    height:34, fontSize:13, color: T.ink, background: T.canvas, outline:'none',
    fontFamily:'inherit',
  };
  const selectStyle = {
    border:`1px solid ${T.hairline}`, borderRadius:9999, padding:'0 28px 0 12px',
    height:34, fontSize:13, color: T.ink, background: T.canvas, outline:'none',
    fontFamily:'inherit', appearance:'none',
    backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a3a3a3' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat:'no-repeat', backgroundPosition:'right 10px center',
  };

  return (
    <div style={{ display:'flex', height:'100vh', background: T.canvas, fontFamily:"'DM Sans',ui-sans-serif,system-ui,sans-serif" }}>
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(o=>!o)} />

      <div style={{ marginLeft:sidebarW, flex:1, display:'flex', flexDirection:'column', overflow:'hidden', transition:'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)' }}>
        <header style={{ height:56, background: T.canvas, borderBottom:`1px solid ${T.hairline}`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 28px', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontFamily:"'Nunito',sans-serif", fontSize:15, fontWeight:700, color: T.ink }}>Students</span>
            <span style={{ fontSize:13, color: T.mute }}>Manage records, fees, and more</span>
          </div>
          <button onClick={() => setIsCreateModalOpen(true)} style={btnPrimary}
            onMouseEnter={e => e.currentTarget.style.background = T.inkDeep}
            onMouseLeave={e => e.currentTarget.style.background = T.ink}>
            <Plus size={14}/>Add Student
          </button>
        </header>

        <main style={{ flex:1, overflowY:'auto', padding:'24px 32px' }}>
          {error && (
            <div style={{ marginBottom:14, padding:'10px 14px', background: T.soft, border:`1px solid ${T.hairline}`, borderRadius:8, color:'#dc2626', fontSize:13 }}>{error}</div>
          )}
          {dbHealth && !dbHealth.healthy && (
            <div style={{ marginBottom:14, padding:'10px 14px', background: T.soft, border:`1px solid ${T.hairline}`, borderRadius:8, color:'#dc2626', fontSize:13 }}>
              <strong>Database Recovery Mode Active</strong> — write operations are blocked.
            </div>
          )}

          {/* Toolbar */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, marginBottom:16, flexWrap:'wrap' }}>
            <div style={{ display:'flex', gap:7, alignItems:'center', flexWrap:'wrap' }}>
              <div style={{ position:'relative' }}>
                <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color: T.mute, pointerEvents:'none' }} />
                <input placeholder="Search by name, GR No..."
                  style={{ ...inputStyle, width:230 }}
                  value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} />
              </div>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ ...selectStyle, width:150 }}>
                <option value="name">Sort by Name</option>
                <option value="grNo">Sort by GR No</option>
              </select>
              <select value={sortOrder} onChange={e=>setSortOrder(e.target.value)} style={{ ...selectStyle, width:120 }}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
            <div style={{ display:'flex', gap:7 }}>
              <button onClick={handleDownloadTemplate} style={btnOutline}
                onMouseEnter={e => e.currentTarget.style.background = T.soft}
                onMouseLeave={e => e.currentTarget.style.background = T.canvas}>
                <Download size={13}/>Template
              </button>
              <button onClick={handleExport} style={btnOutline}
                onMouseEnter={e => e.currentTarget.style.background = T.soft}
                onMouseLeave={e => e.currentTarget.style.background = T.canvas}>
                <Download size={13}/>Export
              </button>
              <button onClick={() => fileInputRef.current?.click()} style={btnOutline}
                onMouseEnter={e => e.currentTarget.style.background = T.soft}
                onMouseLeave={e => e.currentTarget.style.background = T.canvas}>
                <Upload size={13}/>Import
              </button>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImport} style={{ display:'none' }} />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:220 }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ width:28, height:28, border:`2px solid ${T.hairline}`, borderTopColor: T.ink, borderRadius:'50%', animation:'spin 0.7s linear infinite', margin:'0 auto 10px' }}/>
                <p style={{ fontSize:13, color: T.mute }}>Loading...</p>
              </div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:200, gap:12 }}>
              <Users size={36} style={{ color: T.hairlineStrong }} />
              <p style={{ fontSize:14, color: T.mute, fontWeight:500 }}>No students found</p>
              <button onClick={() => setIsCreateModalOpen(true)} style={btnPrimary}
                onMouseEnter={e => e.currentTarget.style.background = T.inkDeep}
                onMouseLeave={e => e.currentTarget.style.background = T.ink}>
                <Plus size={13}/>Add First Student
              </button>
            </div>
          ) : (
            <>
              <div style={{ background: T.canvas, border:`1px solid ${T.hairline}`, borderRadius:12, overflow:'hidden', marginBottom:12 }}>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', minWidth:650 }}>
                    <thead>
                      <tr>
                        <th style={{ ...thStyle, width:'30%' }}>Name</th>
                        <th style={thStyle}>GR No</th>
                        <th style={thStyle}>Phone</th>
                        <th style={thStyle}>Fees</th>
                        <th style={thStyle}>Status</th>
                        <th style={{ ...thStyle, textAlign:'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((student, idx) => {
                        const av = getAvatar(student.fullName);
                        const status = getStatus(student);
                        const badge = statusBadge[status];
                        const fees = (student.feesHistory || []).reduce((sum, y) => sum + ['term1','term2','other'].reduce((s,t) => s + (y[t]?.status==='paid' ? (Number(y[t].amount)||0) : 0), 0), 0);
                        return (
                          <tr key={student._id}
                            style={{ borderBottom: idx===paged.length-1 ? 'none': `1px solid ${T.soft}`, cursor:'pointer', transition:'background 0.1s' }}
                            onClick={() => handleStudentClick(student)}
                            onMouseEnter={e => e.currentTarget.style.background = T.soft}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={tdStyle}>
                              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                <div style={{ width:30, height:30, borderRadius:9999, background: av.bg, color: av.color, border:`1px solid ${T.hairline}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>
                                  {getInitials(student.fullName)}
                                </div>
                                <span style={{ fontWeight:500, color: T.ink }}>{student.fullName}</span>
                              </div>
                            </td>
                            <td style={{ ...tdStyle, color: T.body }}>{student.grNo}</td>
                            <td style={{ ...tdStyle, color: T.body }}>{student.phoneNumber || '—'}</td>
                            <td style={{ ...tdStyle, fontWeight:500, color: T.ink }}>{fees > 0 ? `₹${fees.toLocaleString('en-IN')}` : '—'}</td>
                            <td style={tdStyle}>
                              <span style={{ fontSize:11, fontWeight:500, padding:'2px 10px', borderRadius:9999, background: badge.bg, color: badge.color, border:`1px solid ${badge.border}`, display:'inline-block' }}>{badge.label}</span>
                            </td>
                            <td style={{ ...tdStyle, textAlign:'right' }}>
                              <div className="row-actions" style={{ display:'inline-flex', gap:3, opacity:0, transition:'opacity 0.12s' }}>
                                <button onClick={e => { e.stopPropagation(); handleEditStudent(student); }}
                                  style={{ background:'none', border:'none', cursor:'pointer', padding:5, borderRadius:9999, color: T.mute, display:'flex', transition:'all 0.1s' }}
                                  onMouseEnter={e => { e.currentTarget.style.background = T.soft; e.currentTarget.style.color = T.ink; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = T.mute; }}>
                                  <Edit2 size={14}/>
                                </button>
                                <button onClick={e => { e.stopPropagation(); handleDeleteStudent(student); }}
                                  style={{ background:'none', border:'none', cursor:'pointer', padding:5, borderRadius:9999, color: T.mute, display:'flex', transition:'all 0.1s' }}
                                  onMouseEnter={e => { e.currentTarget.style.background = T.soft; e.currentTarget.style.color = '#dc2626'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = T.mute; }}>
                                  <Trash2 size={14}/>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:13, color: T.mute }}>
                  {(currentPage-1)*PAGE_SIZE+1}–{Math.min(currentPage*PAGE_SIZE, filteredStudents.length)} of {filteredStudents.length}
                </span>
                <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                  <button onClick={() => setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1}
                    style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 6px', borderRadius:9999, color: currentPage===1 ? T.hairlineStrong : T.body, display:'flex', alignItems:'center' }}>
                    <ChevronLeft size={15}/>
                  </button>
                  {pageNums().map((p, i) => (
                    <button key={i} onClick={() => typeof p==='number' && setCurrentPage(p)} disabled={p==='…'}
                      style={{ minWidth:28, height:28, borderRadius:9999, border: p===currentPage ? `1px solid ${T.hairlineStrong}` : 'none', fontSize:13,
                        fontWeight: p===currentPage ? 600 : 400, cursor: p==='…'?'default':'pointer', padding:'0 6px',
                        background: p===currentPage ? T.soft : 'none',
                        color: p===currentPage ? T.ink : p==='…' ? T.mute : T.body,
                        fontFamily:'inherit',
                      }}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages||totalPages===0}
                    style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 6px', borderRadius:9999, color: currentPage===totalPages||totalPages===0 ? T.hairlineStrong : T.body, display:'flex', alignItems:'center' }}>
                    <ChevronRight size={15}/>
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      <Suspense fallback={null}>
        <StudentModal student={selectedStudent} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onEdit={handleEditStudent} onDelete={handleDeleteStudent} onSuccess={fetchStudents} />
        <CreateStudentModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSuccess={fetchStudents} />
        <UpdateStudentModal student={editingStudent} isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} onSuccess={fetchStudents} />
      </Suspense>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .student-row:hover .row-actions { opacity: 1 !important; }
        tr:hover .row-actions { opacity: 1 !important; }
      `}</style>
    </div>
  );
};

export default Students;
