import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { Users, TrendingUp, AlertCircle, RotateCcw, KeyRound, UserCog, Download, Trash2, Upload, Search, Database } from 'lucide-react';
import PasswordInput from '../components/PasswordInput';
import Sidebar from '../components/Sidebar';

/* ── Design tokens ── */
const T = {
  canvas:  '#ffffff',
  soft:    '#fafafa',
  dark:    '#171717',
  hairline:'#e5e5e5',
  hairlineStrong: '#d4d4d4',
  ink:     '#000000',
  inkDeep: '#090909',
  charcoal:'#525252',
  body:    '#737373',
  mute:    '#a3a3a3',
  onDark:  '#ffffff',
  onDarkMute: 'rgba(255,255,255,0.7)',
};

const card = {
  background: T.canvas,
  border: `1px solid ${T.hairline}`,
  borderRadius: 12,
  padding: '20px 24px',
};

const btnPrimary = {
  background: T.ink, color: T.onDark, border: 'none', borderRadius: 9999,
  padding: '0 16px', height: 34, fontSize: 13, fontWeight: 500, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
  transition: 'background 0.15s', whiteSpace: 'nowrap',
};

const btnOutline = {
  background: T.canvas, color: T.ink, border: `1px solid ${T.hairlineStrong}`,
  borderRadius: 9999, padding: '0 14px', height: 34, fontSize: 13, fontWeight: 500,
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
  fontFamily: 'inherit', transition: 'background 0.15s', whiteSpace: 'nowrap',
};

const inputStyle = {
  border: `1px solid ${T.hairline}`, borderRadius: 9999, padding: '0 12px 0 32px',
  height: 36, fontSize: 13, color: T.ink, background: T.canvas, outline: 'none',
  width: '100%', fontFamily: 'inherit',
};

const labelStyle = { fontSize: 11, fontWeight: 500, color: T.body, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 };

// FIX m2: format currency — show full value below 1L, lakhs above
const formatCurrency = (amount) => {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString('en-IN')}`;
};

const Dashboard = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [systemError, setSystemError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupActionLoading, setBackupActionLoading] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [dbHealth, setDbHealth] = useState(null);
  const [backups, setBackups] = useState([]);
  const [selectedBackup, setSelectedBackup] = useState('');
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [quickSearchTerm, setQuickSearchTerm] = useState('');
  const backupImportInputRef = useRef(null);
  const navigate = useNavigate();

  // FIX M6: stable fetch wrapped in useCallback
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const r = await axios.get('/students');
      setStudents(r.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchDbHealth();
    fetchBackups();
  }, [fetchStudents]);

  // FIX M6: debounce focus/visibility re-fetches to prevent race conditions from
  // rapid tab switching sending multiple concurrent requests
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

  const handleUpdateCredentials = async (e) => {
    e.preventDefault(); setSystemError('');
    if (!currentPassword) { setSystemError('Current password is required'); return; }
    if (!newUsername && !newPassword) { setSystemError('Provide a new username or new password'); return; }
    if (newPassword && newPassword !== confirmNewPassword) { setSystemError('Passwords do not match'); return; }
    try {
      setCredentialsLoading(true);
      const payload = { currentPassword };
      if (newUsername) payload.newUsername = newUsername;
      if (newPassword) payload.newPassword = newPassword;
      const r = await axios.post('/auth/update-credentials', payload);
      if (r.data?.admin?.username) localStorage.setItem('adminUsername', r.data.admin.username);
      setCurrentPassword(''); setNewUsername(''); setNewPassword(''); setConfirmNewPassword('');
      setCredentialsModalOpen(false);
      alert(r.data?.message || 'Credentials updated successfully');
    } catch (err) { setSystemError(err.response?.data?.message || 'Failed to update credentials'); }
    finally { setCredentialsLoading(false); }
  };

  const fetchDbHealth = async () => {
    try { setHealthLoading(true); const r = await axios.get('/system/db/status'); setDbHealth(r.data); setSystemError(''); }
    catch (err) { setSystemError(err.response?.data?.message || 'Failed to fetch database health'); }
    finally { setHealthLoading(false); }
  };

  const fetchBackups = async () => {
    try {
      const r = await axios.get('/system/backups');
      const items = r.data?.backups || [];
      setBackups(items);
      if (!items.length) { setSelectedBackup(''); return; }
      if (!items.some(i => i.fileName === selectedBackup)) setSelectedBackup(items[0].fileName);
      setSystemError('');
    } catch (err) { setSystemError(err.response?.data?.message || 'Failed to load backups'); }
  };

  const handleCreateBackup = async () => {
    try { setBackupLoading(true); setSystemError(''); const r = await axios.post('/system/backups'); await fetchBackups(); alert(r.data?.message || 'Backup created'); }
    catch (err) { setSystemError(err.response?.data?.message || 'Failed to create backup'); }
    finally { setBackupLoading(false); }
  };

  const handleRestoreBackup = async (f = selectedBackup) => {
    if (!f) { setSystemError('Select a backup'); return; }
    if (!window.confirm(`Restore ${f}? This will overwrite current data.`)) return;
    try { setRestoreLoading(true); setSystemError(''); const r = await axios.post('/system/backups/restore', { fileName: f }); await fetchStudents(); await fetchDbHealth(); alert(r.data?.message || 'Restored'); }
    catch (err) { setSystemError(err.response?.data?.message || 'Failed to restore'); }
    finally { setRestoreLoading(false); }
  };

  const handleDownloadBackup = async (f = selectedBackup) => {
    if (!f) { setSystemError('Select a backup'); return; }
    try {
      setBackupActionLoading(true); setSystemError('');
      const r = await axios.get(`/system/backups/download/${encodeURIComponent(f)}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a'); a.href = url; a.setAttribute('download', f);
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
    } catch (err) { setSystemError(err.response?.data?.message || 'Failed to download'); }
    finally { setBackupActionLoading(false); }
  };

  const handleDeleteBackup = async (f = selectedBackup) => {
    if (!f) { setSystemError('Select a backup'); return; }
    if (!window.confirm(`Delete ${f}? Cannot be undone.`)) return;
    try { setBackupActionLoading(true); setSystemError(''); await axios.delete(`/system/backups/${encodeURIComponent(f)}`); await fetchBackups(); alert('Deleted'); }
    catch (err) { setSystemError(err.response?.data?.message || 'Failed to delete'); }
    finally { setBackupActionLoading(false); }
  };

  const handleImportBackup = async (event) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.db')) { setSystemError('Only .db files allowed'); return; }
    try {
      setBackupActionLoading(true); setSystemError('');
      const fd = new FormData(); fd.append('backupFile', file);
      const r = await axios.post('/system/backups/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await fetchBackups();
      if (r.data?.backup?.fileName) setSelectedBackup(r.data.backup.fileName);
      alert(r.data?.message || 'Imported');
    } catch (err) { setSystemError(err.response?.data?.message || 'Failed to import'); }
    finally { setBackupActionLoading(false); }
  };

  /* Stats */
  const totalStudents = students.length;
  const totalFeesCollected = students.reduce((sum, s) => sum + (s.feesHistory || []).reduce((ss, y) => ss + ['term1','term2','other'].reduce((ts, t) => ts + (y[t]?.status === 'paid' ? (Number(y[t].amount) || 0) : 0), 0), 0), 0);
  const pendingPayments = students.reduce((cnt, s) => cnt + (s.feesHistory || []).reduce((sc, y) => sc + ['term1','term2','other'].filter(t => y[t]?.status === 'pending').length, 0), 0);
  const paidStudents = students.filter(s => (s.feesHistory || []).some(y => ['term1','term2','other'].some(t => y[t]?.status === 'paid'))).length;

  const paymentRecords = students.flatMap(s =>
    (s.feesHistory || []).flatMap(y =>
      ['term1','term2','other'].filter(t => y[t]?.status === 'paid').map(t => ({
        id: `${s._id}-${y.year}-${t}`, fullName: s.fullName, year: y.year, term: t,
        amount: Number(y[t]?.amount) || 0, paidDate: y[t]?.paidDate || '',
      }))
    )
  );

  const now = new Date();
  const isSameDate = (a, b) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
  const todayRecs = paymentRecords.filter(r => r.paidDate && isSameDate(new Date(r.paidDate), now));
  const todayAmount = todayRecs.reduce((s, r) => s + r.amount, 0);
  const recentPayments = [...paymentRecords].filter(r => r.paidDate).sort((a,b) => new Date(b.paidDate)-new Date(a.paidDate)).slice(0,5);

  const pendingByTerm = students.reduce((acc, s) => {
    (s.feesHistory || []).forEach(y => {
      ['term1','term2','other'].forEach(t => {
        if (y[t]?.status === 'pending') acc[t].push({ id:`${s._id}-${y.year}-${t}`, fullName: s.fullName, yearLabel: y.year ? `Year ${y.year}` : 'Year -' });
      });
    });
    return acc;
  }, { term1:[], term2:[], other:[] });

  const termMeta = {
    term1: { label:'Term 1' },
    term2: { label:'Term 2' },
    other: { label:'Other'  },
  };

  const normalizedSearch = quickSearchTerm.trim().toLowerCase();
  const quickResults = normalizedSearch
    ? students.filter(s => [s.fullName, s.grNo, s.panNo, s.phoneNumber].filter(Boolean).some(v => String(v).toLowerCase().includes(normalizedSearch))).slice(0,6)
    : [];

  const formatBytes = (b) => { if (!b && b!==0) return '-'; if (b===0) return '0 B'; const u=['B','KB','MB','GB']; const i=Math.min(Math.floor(Math.log(b)/Math.log(1024)),u.length-1); return `${(b/1024**i).toFixed(i===0?0:1)} ${u[i]}`; };
  const formatDT = (iso) => { if (!iso) return '-'; return new Date(iso).toLocaleString('en-US',{weekday:'short',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true}); };

  const sidebarW = sidebarOpen ? 220 : 60;

  // FIX m2: use formatCurrency so small amounts don't display as ₹0.0L
  const statCards = [
    { label: 'Total Students', value: totalStudents, icon: Users },
    { label: 'Fees Collected', value: formatCurrency(totalFeesCollected), icon: TrendingUp },
    { label: 'Pending Payments', value: pendingPayments, icon: AlertCircle },
    { label: 'Paid Students', value: paidStudents, icon: Users },
  ];

  const thStyle = { padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: T.mute, textTransform: 'uppercase', letterSpacing: '0.06em', background: T.soft, borderBottom: `1px solid ${T.hairline}` };
  const tdStyle = { padding: '11px 12px', fontSize: 13, borderBottom: `1px solid ${T.soft}`, color: T.charcoal, verticalAlign: 'middle' };

  return (
    <div style={{ display:'flex', height:'100vh', background: T.canvas, fontFamily:"'DM Sans',ui-sans-serif,system-ui,sans-serif" }}>
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />

      <div style={{ marginLeft: sidebarW, flex:1, display:'flex', flexDirection:'column', overflow:'hidden', transition:'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)' }}>
        {/* Topbar */}
        <header style={{ height:56, background: T.canvas, borderBottom:`1px solid ${T.hairline}`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 28px', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
            <span style={{ fontFamily:"'Nunito',sans-serif", fontSize:15, fontWeight:700, color: T.ink }}>Dashboard</span>
            <span style={{ fontSize:13, color: T.mute }}>Overview &amp; operations</span>
          </div>
          <button onClick={() => setCredentialsModalOpen(true)}
            style={btnOutline}
            onMouseEnter={e => e.currentTarget.style.background = T.soft}
            onMouseLeave={e => e.currentTarget.style.background = T.canvas}>
            <UserCog size={14}/>Account
          </button>
        </header>

        {/* Content */}
        <main style={{ flex:1, overflowY:'auto', padding:'28px 32px' }}>
          {error && (
            <div style={{ marginBottom:16, padding:'10px 14px', background: T.soft, border:`1px solid ${T.hairline}`, borderRadius:8, color:'#dc2626', fontSize:13, display:'flex', gap:8 }}>
              <AlertCircle size={15} style={{ flexShrink:0, marginTop:1 }}/>{error}
            </div>
          )}
          {systemError && (
            <div style={{ marginBottom:16, padding:'10px 14px', background: T.soft, border:`1px solid ${T.hairline}`, borderRadius:8, color:'#c2410c', fontSize:13, display:'flex', gap:8 }}>
              <AlertCircle size={15} style={{ flexShrink:0, marginTop:1 }}/>{systemError}
            </div>
          )}
          {dbHealth && !dbHealth.healthy && (
            <div style={{ marginBottom:16, padding:'10px 14px', background: T.soft, border:`1px solid ${T.hairline}`, borderRadius:8, color:'#dc2626', fontSize:13 }}>
              <strong>Database Recovery Mode Active</strong>
              <p style={{ margin:'3px 0 0', fontSize:12, color: T.body }}>{dbHealth.forcedRecoveryMode ? 'Forced recovery mode enabled. Disable FORCE_RECOVERY_MODE and restart.' : 'Write ops blocked. Restore a healthy backup then run health check.'}</p>
            </div>
          )}

          {loading ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300 }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ width:28, height:28, border:`2px solid ${T.hairline}`, borderTopColor: T.ink, borderRadius:'50%', animation:'spin 0.7s linear infinite', margin:'0 auto 10px' }}/>
                <p style={{ fontSize:13, color: T.mute }}>Loading...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Stat cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
                {statCards.map(({ label, value, icon }) => (
                  <div key={label} style={{ ...card, padding:'18px 20px' }}>
                    <p style={{ fontSize:11, color: T.mute, fontWeight:500, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</p>
                    <p style={{ fontSize:26, fontWeight:700, color: T.ink, margin:0 }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Quick search */}
              <div style={{ ...card, marginBottom:20 }}>
                <div style={{ position:'relative', marginBottom:6 }}>
                  <Search size={14} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color: T.mute, pointerEvents:'none' }} />
                  <input
                    value={quickSearchTerm}
                    onChange={e => setQuickSearchTerm(e.target.value)}
                    placeholder="Search by name, GR No, PAN No, phone..."
                    style={inputStyle}
                  />
                </div>
                <p style={{ fontSize:12, color: T.mute, margin:0 }}>Search across all student records</p>
                {normalizedSearch.length > 0 && (
                  <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:3 }}>
                    {quickResults.length === 0
                      ? <p style={{ fontSize:13, color: T.mute }}>No results.</p>
                      : quickResults.map(s => (
                        <button key={s._id} onClick={() => navigate('/students')}
                          style={{ background: T.soft, border:`1px solid ${T.hairline}`, borderRadius:9999, padding:'8px 14px', textAlign:'left', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', fontFamily:'inherit' }}
                          onMouseEnter={e => e.currentTarget.style.background = T.hairline}
                          onMouseLeave={e => e.currentTarget.style.background = T.soft}>
                          <span style={{ fontSize:13, fontWeight:500, color: T.ink }}>{s.fullName}</span>
                          <span style={{ fontSize:11, color: T.mute }}>GR: {s.grNo}</span>
                        </button>
                      ))
                    }
                  </div>
                )}
              </div>

              {/* Two-column */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:12, marginBottom:20 }}>
                {/* Collections Pulse */}
                <div style={card}>
                  <p style={{ fontSize:13, fontWeight:600, color: T.ink, marginBottom:16 }}>Collections Pulse</p>
                  <div style={{ display:'flex', gap:28, paddingBottom:14, marginBottom:14, borderBottom:`1px solid ${T.hairline}` }}>
                    <div>
                      <p style={{ fontSize:11, color: T.mute, marginBottom:3, textTransform:'uppercase', letterSpacing:'0.06em' }}>Today</p>
                      <p style={{ fontSize:22, fontWeight:700, color: T.ink, margin:0 }}>₹{todayAmount.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p style={{ fontSize:11, color: T.mute, marginBottom:3, textTransform:'uppercase', letterSpacing:'0.06em' }}>Transactions</p>
                      <p style={{ fontSize:22, fontWeight:700, color: T.ink, margin:0 }}>{todayRecs.length}</p>
                    </div>
                  </div>
                  <p style={{ fontSize:11, color: T.mute, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Recent Activity</p>
                  {recentPayments.length === 0
                    ? <p style={{ fontSize:13, color: T.mute }}>No payment history yet.</p>
                    : (
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                        <thead>
                          <tr>
                            {['Student','Amount','Date'].map(h => (
                              <th key={h} style={{ ...thStyle, textAlign: h==='Amount'||h==='Date' ? 'right':'left' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {recentPayments.map(r => (
                            <tr key={r.id}>
                              <td style={tdStyle}><span style={{ fontWeight:500, color: T.ink }}>{r.fullName}</span> <span style={{ color: T.mute, fontSize:11 }}>#{r.year}</span></td>
                              <td style={{ ...tdStyle, textAlign:'right', fontWeight:500, color: T.ink }}>₹{r.amount.toLocaleString('en-IN')}</td>
                              <td style={{ ...tdStyle, textAlign:'right', color: T.mute }}>{new Date(r.paidDate).toLocaleDateString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  }
                </div>

                {/* Right panel */}
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {/* Pending by term */}
                  <div style={card}>
                    <p style={{ fontSize:13, fontWeight:600, color: T.ink, marginBottom:14 }}>Pending by Term</p>
                    {['term1','term2','other'].map(t => (
                      <div key={t} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                        <span style={{ fontSize:13, color: T.charcoal }}>{termMeta[t].label}</span>
                        <span style={{ fontSize:13, fontWeight:600, color: T.ink }}>{pendingByTerm[t].length}</span>
                      </div>
                    ))}
                  </div>

                  {/* DB Health */}
                  <div style={card}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                      <p style={{ fontSize:13, fontWeight:600, color: T.ink, margin:0 }}>DB Health</p>
                      <button onClick={fetchDbHealth} disabled={healthLoading}
                        style={{ background:'none', border:'none', fontSize:11, fontWeight:500, color: T.body, cursor:'pointer', fontFamily:'inherit', padding:0, textTransform:'uppercase', letterSpacing:'0.05em' }}
                        onMouseEnter={e => e.currentTarget.style.color = T.ink}
                        onMouseLeave={e => e.currentTarget.style.color = T.body}>
                        {healthLoading ? '...' : 'Run'}
                      </button>
                    </div>
                    {[
                      { label:'Quick Check', val: dbHealth?.quickCheck },
                      { label:'Integrity', val: dbHealth?.integrityCheck },
                      { label:'Recovery', val: dbHealth?.healthy ? 'Standby' : 'Active' },
                    ].map(({ label, val }) => {
                      const ok = val==='ok'||val==='Standby';
                      const bad = val==='Active';
                      return (
                        <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                          <span style={{ fontSize:12, color: T.body }}>{label}</span>
                          <span style={{
                            fontSize:11, fontWeight:500, padding:'2px 10px', borderRadius:9999,
                            background: T.soft,
                            color: ok ? '#166534' : bad ? '#dc2626' : T.mute,
                            border: `1px solid ${T.hairline}`,
                          }}>{val || '—'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Backup Management */}
              <div style={card}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <p style={{ fontSize:13, fontWeight:600, color: T.ink, margin:0 }}>Backup Management</p>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => backupImportInputRef.current?.click()} disabled={backupActionLoading}
                      style={btnOutline}
                      onMouseEnter={e => e.currentTarget.style.background = T.soft}
                      onMouseLeave={e => e.currentTarget.style.background = T.canvas}>
                      <Upload size={13}/>Import
                    </button>
                    <button onClick={fetchBackups} style={btnOutline}
                      onMouseEnter={e => e.currentTarget.style.background = T.soft}
                      onMouseLeave={e => e.currentTarget.style.background = T.canvas}>
                      <RotateCcw size={13}/>Refresh
                    </button>
                    <button onClick={handleCreateBackup} disabled={backupLoading} style={btnPrimary}
                      onMouseEnter={e => { if (!backupLoading) e.currentTarget.style.background = T.inkDeep; }}
                      onMouseLeave={e => e.currentTarget.style.background = T.ink}>
                      {backupLoading ? 'Creating...' : 'Backup Now'}
                    </button>
                  </div>
                </div>
                <input ref={backupImportInputRef} type="file" accept=".db" onChange={handleImportBackup} style={{ display:'none' }} />
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr>
                      {['File','Size','Modified','Actions'].map((h,i) => (
                        <th key={h} style={{ ...thStyle, textAlign: i===3 ? 'right':'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {backups.length === 0 ? (
                      <tr><td colSpan={4} style={{ padding:'24px', textAlign:'center', fontSize:13, color: T.mute }}>No backup files available</td></tr>
                    ) : backups.map(b => (
                      <tr key={b.fileName} onClick={() => setSelectedBackup(b.fileName)}
                        style={{ borderBottom:`1px solid ${T.soft}`, cursor:'pointer', background: selectedBackup===b.fileName ? T.soft : 'transparent' }}>
                        <td style={{ ...tdStyle, display:'flex', alignItems:'center', gap:7 }}>
                          <Database size={13} style={{ color: T.mute }}/><span style={{ color: T.ink, fontWeight:500 }}>{b.fileName}</span>
                        </td>
                        <td style={tdStyle}>{formatBytes(b.sizeBytes)}</td>
                        <td style={tdStyle}>{formatDT(b.modifiedAt)}</td>
                        <td style={{ ...tdStyle, textAlign:'right' }}>
                          <div style={{ display:'inline-flex', gap:5 }}>
                            <button onClick={e => { e.stopPropagation(); handleRestoreBackup(b.fileName); }} disabled={restoreLoading||backupActionLoading}
                              style={{ ...btnOutline, height:28, padding:'0 10px', fontSize:12 }}
                              onMouseEnter={e => e.currentTarget.style.background = T.soft}
                              onMouseLeave={e => e.currentTarget.style.background = T.canvas}>Restore</button>
                            <button onClick={e => { e.stopPropagation(); handleDownloadBackup(b.fileName); }} disabled={restoreLoading||backupActionLoading}
                              style={{ ...btnOutline, height:28, padding:'0 10px', fontSize:12 }}
                              onMouseEnter={e => e.currentTarget.style.background = T.soft}
                              onMouseLeave={e => e.currentTarget.style.background = T.canvas}><Download size={12}/></button>
                            <button onClick={e => { e.stopPropagation(); handleDeleteBackup(b.fileName); }} disabled={restoreLoading||backupActionLoading}
                              style={{ background: T.soft, color:'#dc2626', border:`1px solid ${T.hairline}`, borderRadius:9999, height:28, width:28, display:'inline-flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:12 }}
                              onMouseEnter={e => e.currentTarget.style.background = T.hairline}
                              onMouseLeave={e => e.currentTarget.style.background = T.soft}><Trash2 size={12}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Credentials Modal */}
      {credentialsModalOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:60, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', padding:16, backdropFilter:'blur(2px)' }}>
          <div style={{ background: T.canvas, borderRadius:12, border:`1px solid ${T.hairline}`, padding:'28px 32px', width:'100%', maxWidth:440 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
              <KeyRound size={16} style={{ color: T.ink }} />
              <h3 style={{ fontFamily:"'Nunito',sans-serif", fontSize:16, fontWeight:700, color: T.ink, margin:0 }}>Update Credentials</h3>
            </div>
            <form onSubmit={handleUpdateCredentials} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {systemError && (
                <div style={{ padding:'10px 14px', background: T.soft, border:`1px solid ${T.hairline}`, borderRadius:8, color:'#dc2626', fontSize:13 }}>{systemError}</div>
              )}
              {[
                { label:'Current Password', key:'currentPassword', val:currentPassword, set:setCurrentPassword, comp:'pw', required:true },
                { label:'New Username (optional)', key:'newUsername', val:newUsername, set:setNewUsername, comp:'text' },
                { label:'New Password (optional)', key:'newPassword', val:newPassword, set:setNewPassword, comp:'pw' },
                { label:'Confirm New Password', key:'confirmNewPassword', val:confirmNewPassword, set:setConfirmNewPassword, comp:'pw', disabled:!newPassword },
              ].map(({ label, key, val, set, comp, required, disabled }) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  {comp==='pw'
                    ? <PasswordInput value={val} onChange={e => set(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-full focus:outline-none" required={required} disabled={disabled} />
                    : <input type="text" value={val} onChange={e => set(e.target.value)} style={{ ...inputStyle, paddingLeft: 12 }} minLength={3} />
                  }
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:4 }}>
                <button type="button" onClick={() => { setCredentialsModalOpen(false); setCurrentPassword(''); setNewUsername(''); setNewPassword(''); setConfirmNewPassword(''); }}
                  style={btnOutline}
                  onMouseEnter={e => e.currentTarget.style.background = T.soft}
                  onMouseLeave={e => e.currentTarget.style.background = T.canvas}>Cancel</button>
                <button type="submit" disabled={credentialsLoading} style={btnPrimary}
                  onMouseEnter={e => { if (!credentialsLoading) e.currentTarget.style.background = T.inkDeep; }}
                  onMouseLeave={e => e.currentTarget.style.background = T.ink}>
                  {credentialsLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Dashboard;
