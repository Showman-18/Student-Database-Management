import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { LogOut, Users, BarChart3, Menu, X, TrendingUp, AlertCircle, Database, ShieldCheck, RotateCcw, KeyRound, UserCog, Download, Trash2, Upload, Search } from 'lucide-react';
import PasswordInput from '../components/PasswordInput';

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

  useEffect(() => {
    fetchStudents();
    fetchDbHealth();
    fetchBackups();
  }, []);

  // Refresh data when window gains focus (when navigating back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchStudents();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', fetchStudents);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', fetchStudents);
    };
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/students');
      setStudents(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminUsername');
    navigate('/login');
  };

  const handleUpdateCredentials = async (e) => {
    e.preventDefault();
    setSystemError('');

    if (!currentPassword) {
      setSystemError('Current password is required');
      return;
    }

    if (!newUsername && !newPassword) {
      setSystemError('Provide a new username or new password');
      return;
    }

    if (newPassword && newPassword !== confirmNewPassword) {
      setSystemError('New password and confirmation do not match');
      return;
    }

    try {
      setCredentialsLoading(true);

      const payload = {
        currentPassword,
      };

      if (newUsername) payload.newUsername = newUsername;
      if (newPassword) payload.newPassword = newPassword;

      const response = await axios.post('/auth/update-credentials', payload);
      if (response.data?.admin?.username) {
        localStorage.setItem('adminUsername', response.data.admin.username);
      }

      setCurrentPassword('');
      setNewUsername('');
      setNewPassword('');
      setConfirmNewPassword('');
      setCredentialsModalOpen(false);
      alert(response.data?.message || 'Credentials updated successfully');
    } catch (err) {
      setSystemError(err.response?.data?.message || 'Failed to update credentials');
    } finally {
      setCredentialsLoading(false);
    }
  };

  const fetchDbHealth = async () => {
    try {
      setHealthLoading(true);
      const response = await axios.get('/system/db/status');
      setDbHealth(response.data);
      setSystemError('');
    } catch (err) {
      setSystemError(err.response?.data?.message || 'Failed to fetch database health');
    } finally {
      setHealthLoading(false);
    }
  };

  const fetchBackups = async () => {
    try {
      const response = await axios.get('/system/backups');
      const backupItems = response.data?.backups || [];
      setBackups(backupItems);

      if (backupItems.length === 0) {
        setSelectedBackup('');
      } else {
        const stillExists = backupItems.some((item) => item.fileName === selectedBackup);
        if (!stillExists) {
          setSelectedBackup(backupItems[0].fileName);
        }
      }

      setSystemError('');
    } catch (err) {
      setSystemError(err.response?.data?.message || 'Failed to load backups');
    }
  };

  const handleCreateBackup = async () => {
    try {
      setBackupLoading(true);
      setSystemError('');
      const response = await axios.post('/system/backups');
      await fetchBackups();
      alert(response.data?.message || 'Backup created successfully');
    } catch (err) {
      setSystemError(err.response?.data?.message || 'Failed to create backup');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreBackup = async (targetFile = selectedBackup) => {
    if (!targetFile) {
      setSystemError('Select a backup to restore');
      return;
    }

    const confirmed = window.confirm(
      `Restore backup ${targetFile}? This will overwrite current database data.`
    );
    if (!confirmed) return;

    try {
      setRestoreLoading(true);
      setSystemError('');
      const response = await axios.post('/system/backups/restore', { fileName: targetFile });
      await fetchStudents();
      await fetchDbHealth();
      alert(response.data?.message || 'Backup restored successfully');
    } catch (err) {
      setSystemError(err.response?.data?.message || 'Failed to restore backup');
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleDownloadBackup = async (targetFile = selectedBackup) => {
    if (!targetFile) {
      setSystemError('Select a backup to download');
      return;
    }

    try {
      setBackupActionLoading(true);
      setSystemError('');
      const response = await axios.get(`/system/backups/download/${encodeURIComponent(targetFile)}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', targetFile);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setSystemError(err.response?.data?.message || 'Failed to download backup');
    } finally {
      setBackupActionLoading(false);
    }
  };

  const handleDeleteBackup = async (targetFile = selectedBackup) => {
    if (!targetFile) {
      setSystemError('Select a backup to delete');
      return;
    }

    const confirmed = window.confirm(`Delete backup ${targetFile}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setBackupActionLoading(true);
      setSystemError('');
      await axios.delete(`/system/backups/${encodeURIComponent(targetFile)}`);
      await fetchBackups();
      alert('Backup deleted successfully');
    } catch (err) {
      setSystemError(err.response?.data?.message || 'Failed to delete backup');
    } finally {
      setBackupActionLoading(false);
    }
  };

  const handleImportBackup = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    const lowerName = String(file.name).toLowerCase();
    if (!lowerName.endsWith('.db')) {
      setSystemError('Only .db backup files are allowed');
      return;
    }

    try {
      setBackupActionLoading(true);
      setSystemError('');

      const formData = new FormData();
      formData.append('backupFile', file);

      const response = await axios.post('/system/backups/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      await fetchBackups();
      if (response.data?.backup?.fileName) {
        setSelectedBackup(response.data.backup.fileName);
      }
      alert(response.data?.message || 'Backup imported successfully');
    } catch (err) {
      setSystemError(err.response?.data?.message || 'Failed to import backup file');
    } finally {
      setBackupActionLoading(false);
    }
  };

  // Calculate statistics
  const totalStudents = students.length;
  
  const totalFeesCollected = students.reduce((sum, student) => {
    if (!student.feesHistory) return sum;
    return sum + student.feesHistory.reduce((studentSum, yearHistory) => {
      let yearAmount = 0;
      ['term1', 'term2', 'other'].forEach((term) => {
        if (yearHistory[term]?.status === 'paid' && yearHistory[term]?.amount) {
          yearAmount += yearHistory[term].amount;
        }
      });
      return studentSum + yearAmount;
    }, 0);
  }, 0);

  const pendingPayments = students.reduce((count, student) => {
    if (!student.feesHistory) return count;
    return count + student.feesHistory.reduce((studentCount, yearHistory) => {
      let yearCount = 0;
      ['term1', 'term2', 'other'].forEach((term) => {
        if (yearHistory[term]?.status === 'pending') {
          yearCount += 1;
        }
      });
      return studentCount + yearCount;
    }, 0);
  }, 0);

  const paidStudents = students.filter(student => {
    if (!student.feesHistory) return false;
    return student.feesHistory.some(yearHistory => 
      ['term1', 'term2', 'other'].some(term => yearHistory[term]?.status === 'paid')
    );
  }).length;

  const paymentRecords = students.flatMap((student) => {
    if (!Array.isArray(student.feesHistory)) return [];

    return student.feesHistory.flatMap((yearHistory) => {
      const year = yearHistory?.year;

      return ['term1', 'term2', 'other']
        .filter((term) => yearHistory?.[term]?.status === 'paid')
        .map((term) => ({
          id: `${student._id}-${year || 'na'}-${term}`,
          fullName: student.fullName,
          year,
          term,
          amount: Number(yearHistory?.[term]?.amount) || 0,
          paidDate: yearHistory?.[term]?.paidDate || '',
        }));
    });
  });

  const isSameDate = (dateA, dateB) => {
    return (
      dateA.getFullYear() === dateB.getFullYear() &&
      dateA.getMonth() === dateB.getMonth() &&
      dateA.getDate() === dateB.getDate()
    );
  };

  const now = new Date();
  const todayPaymentRecords = paymentRecords.filter((record) => {
    if (!record.paidDate) return false;
    const paidAt = new Date(record.paidDate);
    if (Number.isNaN(paidAt.getTime())) return false;
    return isSameDate(paidAt, now);
  });

  const todayCollectedAmount = todayPaymentRecords.reduce((sum, record) => sum + record.amount, 0);
  const recentPaymentHistory = paymentRecords
    .filter((record) => record.paidDate)
    .sort((a, b) => new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime())
    .slice(0, 5);

  const pendingStudentsByTerm = students.reduce(
    (acc, student) => {
      if (!Array.isArray(student.feesHistory)) return acc;

      student.feesHistory.forEach((yearHistory) => {
        const yearLabel = yearHistory?.year ? `Year ${yearHistory.year}` : 'Year -';

        ['term1', 'term2', 'other'].forEach((term) => {
          if (yearHistory?.[term]?.status === 'pending') {
            acc[term].push({
              id: `${student._id}-${yearHistory?.year || 'na'}-${term}`,
              fullName: student.fullName,
              yearLabel,
            });
          }
        });
      });

      return acc;
    },
    { term1: [], term2: [], other: [] }
  );

  const termMeta = {
    term1: { label: 'Term 1', accent: 'text-amber-700', dot: 'bg-amber-500' },
    term2: { label: 'Term 2', accent: 'text-orange-700', dot: 'bg-orange-500' },
    other: { label: 'Other', accent: 'text-rose-700', dot: 'bg-rose-500' },
  };

  const normalizedQuickSearch = quickSearchTerm.trim().toLowerCase();
  const quickSearchResults = normalizedQuickSearch
    ? students
      .filter((student) => {
        return [
          student.fullName,
          student.grNo,
          student.panNo,
          student.phoneNumber,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuickSearch));
      })
      .slice(0, 6)
    : [];

  const formatBytes = (bytes) => {
    if (!bytes && bytes !== 0) return '-';
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / 1024 ** index;
    return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
  };

  const formatDateTime = (isoDate) => {
    if (!isoDate) return '-';
    const date = new Date(isoDate);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/40 via-white to-green-50/30">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-100 transition-all duration-300 z-50 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            {sidebarOpen && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600 rounded-xl text-white shadow-sm">
                  <BarChart3 size={20} />
                </div>
                <span className="font-bold text-lg text-gray-900">SDBMS</span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            <div className={`flex items-center gap-3 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-medium cursor-pointer ${!sidebarOpen && 'justify-center'}`}>
              <BarChart3 size={20} />
              {sidebarOpen && <span>Dashboard</span>}
            </div>
            <div
              onClick={() => navigate('/students')}
              className={`flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-700 rounded-xl cursor-pointer transition ${!sidebarOpen && 'justify-center'}`}
            >
              <Users size={20} />
              {sidebarOpen && <span>Students</span>}
            </div>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition ${!sidebarOpen && 'justify-center'}`}
            >
              <LogOut size={20} />
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Bar */}
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
          <div className="px-8 py-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-400 text-sm mt-1">Overview & analytics of student records</p>
            </div>
            <button
              onClick={() => setCredentialsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium"
            >
              <UserCog size={16} />
              Account Security
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 flex gap-3">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {systemError && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-xl text-orange-700 flex gap-3">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <div>{systemError}</div>
            </div>
          )}

          {dbHealth && !dbHealth.healthy && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex gap-3">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Database Recovery Mode Active</p>
                <p className="text-sm mt-1">
                  {dbHealth.forcedRecoveryMode
                    ? 'Forced recovery mode is enabled for testing (FORCE_RECOVERY_MODE=true). Disable it and restart backend.'
                    : 'Write operations are blocked for safety. Restore a healthy backup, then run health check again.'}
                </p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-32">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 font-medium">Loading dashboard...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Students */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-soft hover:shadow-card transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Total Students</p>
                      <p className="text-4xl font-bold text-gray-900 mt-2">{totalStudents}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl">
                      <Users className="text-emerald-600" size={24} />
                    </div>
                  </div>
                  <p className="text-xs text-emerald-600 font-medium">Active records</p>
                </div>

                {/* Fees Collected */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-soft hover:shadow-card transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Fees Collected</p>
                      <p className="text-4xl font-bold text-gray-900 mt-2">₹{(totalFeesCollected / 100000).toFixed(1)}L</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-xl">
                      <TrendingUp className="text-green-600" size={24} />
                    </div>
                  </div>
                  <p className="text-xs text-green-600 font-medium">Total amount</p>
                </div>

                {/* Pending Payments */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-soft hover:shadow-card transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Pending Payments</p>
                      <p className="text-4xl font-bold text-gray-900 mt-2">{pendingPayments}</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl">
                      <AlertCircle className="text-amber-500" size={24} />
                    </div>
                  </div>
                  <p className="text-xs text-amber-600 font-medium">Awaiting payment</p>
                </div>

                {/* Paid Students */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-soft hover:shadow-card transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-gray-500 text-sm font-medium">Paid Students</p>
                      <p className="text-4xl font-bold text-gray-900 mt-2">{paidStudents}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl">
                      <BarChart3 className="text-emerald-600" size={24} />
                    </div>
                  </div>
                  <p className="text-xs text-emerald-600 font-medium">With paid fees</p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Payment Status Distribution */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-soft">
                  <h2 className="text-lg font-bold text-gray-900 mb-6">Payment Status</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-semibold text-gray-800 mb-4">Daily Overview</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                          <p className="text-sm text-emerald-700">Today Collected</p>
                          <p className="text-2xl font-bold text-emerald-700 mt-1">₹{todayCollectedAmount.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                          <p className="text-sm text-blue-700">Today Transactions</p>
                          <p className="text-2xl font-bold text-blue-700 mt-1">{todayPaymentRecords.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Recent Payment History</h4>
                      {recentPaymentHistory.length === 0 ? (
                        <p className="text-sm text-gray-500">No payment history available</p>
                      ) : (
                        <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                          {recentPaymentHistory.map((record) => (
                            <div key={record.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2.5">
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-700 truncate">{record.fullName}</p>
                                <p className="text-gray-500">
                                  {record.term.toUpperCase()} {record.year ? `- ${record.year}` : ''}
                                </p>
                              </div>
                              <div className="text-right whitespace-nowrap ml-3">
                                <p className="font-semibold text-emerald-700">₹{record.amount.toLocaleString('en-IN')}</p>
                                <p className="text-gray-500">{new Date(record.paidDate).toLocaleDateString('en-IN')}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pending Students By Term */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-soft">
                  <h2 className="text-lg font-bold text-gray-900 mb-6">Pending Students (Term-wise)</h2>
                  <div className="space-y-4">
                    {['term1', 'term2', 'other'].map((termKey) => {
                      const termStudents = pendingStudentsByTerm[termKey];
                      const meta = termMeta[termKey];

                      return (
                        <div key={termKey} className="p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`}></span>
                              <span className="text-sm font-semibold text-gray-700">{meta.label}</span>
                            </div>
                            <span className={`text-sm font-semibold ${meta.accent}`}>{termStudents.length} pending</span>
                          </div>

                          {termStudents.length === 0 ? (
                            <p className="text-xs text-gray-500">No pending students</p>
                          ) : (
                            <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                              {termStudents.map((item) => (
                                <div key={item.id} className="text-xs text-gray-700 flex justify-between gap-3">
                                  <span className="font-medium truncate">{item.fullName}</span>
                                  <span className="text-gray-500 whitespace-nowrap">{item.yearLabel}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Daily Utilities */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-soft">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Daily Desk Utilities</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Quick Student Search</h3>
                    <div className="relative mb-3">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={quickSearchTerm}
                        onChange={(e) => setQuickSearchTerm(e.target.value)}
                        placeholder="Search by name, GR No, PAN No, or phone"
                        className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>

                    {normalizedQuickSearch.length === 0 ? (
                      <p className="text-sm text-gray-500">Start typing to quickly find a student.</p>
                    ) : quickSearchResults.length === 0 ? (
                      <p className="text-sm text-gray-500">No student found for this search.</p>
                    ) : (
                      <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                        {quickSearchResults.map((student) => (
                          <button
                            key={student._id}
                            onClick={() => navigate('/students')}
                            className="w-full text-left bg-white rounded-lg border border-gray-100 px-3 py-2 hover:border-emerald-200 hover:bg-emerald-50/40 transition"
                          >
                            <p className="text-sm font-semibold text-gray-700 truncate">{student.fullName}</p>
                            <p className="text-xs text-gray-500 mt-0.5">GR: {student.grNo} | PAN: {student.panNo}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Database Health Check</h3>
                    <div className="space-y-3">
                      <button
                        onClick={fetchDbHealth}
                        disabled={healthLoading}
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 hover:bg-white text-sm font-medium text-gray-700 disabled:opacity-60"
                      >
                        {healthLoading ? 'Checking...' : 'Run Health Check'}
                      </button>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Current Status</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Database Quick Check</span>
                        <span className={`font-semibold ${dbHealth?.quickCheck === 'ok' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {dbHealth?.quickCheck || 'Not run'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Integrity Check</span>
                        <span className={`font-semibold ${dbHealth?.integrityCheck === 'ok' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {dbHealth?.integrityCheck || 'Not run'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Recovery Mode</span>
                        <span className={`font-semibold ${dbHealth?.healthy ? 'text-emerald-600' : 'text-red-600'}`}>
                          {dbHealth?.healthy ? 'Normal' : 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Backup Management */}
              <div className="mt-8 bg-white rounded-2xl p-6 border border-gray-100 shadow-soft">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Backup Management</h2>
                <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
                  <button
                    onClick={handleCreateBackup}
                    disabled={backupLoading}
                    className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-60"
                  >
                    {backupLoading ? 'Creating...' : 'Backup Now'}
                  </button>
                  <button
                    onClick={fetchBackups}
                    className="px-4 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-sm font-medium"
                  >
                    <span className="inline-flex items-center gap-1"><RotateCcw size={14} /> Refresh</span>
                  </button>
                  <input
                    ref={backupImportInputRef}
                    type="file"
                    accept=".db"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                  <button
                    onClick={() => backupImportInputRef.current?.click()}
                    disabled={backupActionLoading}
                    className="px-4 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-sm font-medium disabled:opacity-60 inline-flex items-center gap-1"
                  >
                    <Upload size={14} />
                    Import
                  </button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                  <table className="w-full min-w-[700px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Backup File</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Size</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Modified</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backups.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-sm text-gray-500 text-center">
                            No backup files available
                          </td>
                        </tr>
                      ) : (
                        backups.map((backup) => {
                          const isSelected = selectedBackup === backup.fileName;

                          return (
                            <tr
                              key={backup.fileName}
                              onClick={() => setSelectedBackup(backup.fileName)}
                              className={`cursor-pointer border-b border-gray-100 last:border-b-0 ${
                                isSelected ? 'bg-emerald-50/70' : 'hover:bg-gray-50'
                              }`}
                            >
                              <td className="px-4 py-3 text-sm text-gray-700 font-medium">{backup.fileName}</td>
                              <td className="px-4 py-3 text-sm text-gray-700 text-right">{formatBytes(backup.sizeBytes)}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(backup.modifiedAt)}</td>
                              <td className="px-4 py-3 text-right">
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRestoreBackup(backup.fileName);
                                    }}
                                    disabled={restoreLoading || backupActionLoading}
                                    className="px-2.5 py-1.5 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium disabled:opacity-60"
                                  >
                                    Restore
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadBackup(backup.fileName);
                                    }}
                                    disabled={restoreLoading || backupActionLoading}
                                    className="px-2.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium disabled:opacity-60"
                                  >
                                    Download
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteBackup(backup.fileName);
                                    }}
                                    disabled={restoreLoading || backupActionLoading}
                                    className="px-2.5 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-medium disabled:opacity-60"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {credentialsModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <KeyRound size={18} className="text-emerald-600" />
              <h3 className="text-lg font-bold text-gray-900">Update Login Credentials</h3>
            </div>

            <form onSubmit={handleUpdateCredentials} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                <PasswordInput
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Username (optional)</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  minLength={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password (optional)</label>
                <PasswordInput
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                <PasswordInput
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  minLength={6}
                  disabled={!newPassword}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCredentialsModalOpen(false);
                    setCurrentPassword('');
                    setNewUsername('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                  }}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={credentialsLoading}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-60"
                >
                  {credentialsLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
