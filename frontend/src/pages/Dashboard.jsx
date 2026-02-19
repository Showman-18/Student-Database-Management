import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { LogOut, Users, Plus, BarChart3, Menu, X, TrendingUp, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
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
    navigate('/login');
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
                  <div className="space-y-5">
                    {/* Progress Bars */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600">Paid</span>
                        <span className="text-sm font-semibold text-emerald-600">{paidStudents} students</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{
                            width: totalStudents > 0 ? `${(paidStudents / totalStudents) * 100}%` : '0%'
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600">Pending</span>
                        <span className="text-sm font-semibold text-amber-600">{pendingPayments} payments</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-500"
                          style={{
                            width: totalStudents > 0 ? `${((pendingPayments / (totalStudents * 3)) * 100).toFixed(1)}%` : '0%'
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-soft">
                  <h2 className="text-lg font-bold text-gray-900 mb-6">Quick Statistics</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <span className="text-sm text-gray-600">Average collected per student</span>
                      <span className="font-bold text-emerald-600">₹{totalStudents > 0 ? ((totalFeesCollected / totalStudents) / 1000).toFixed(1) : '0'}K</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <span className="text-sm text-gray-600">Students with payments</span>
                      <span className="font-bold text-emerald-600">{totalStudents > 0 ? ((paidStudents / totalStudents) * 100).toFixed(1) : '0'}%</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <span className="text-sm text-gray-600">Outstanding payments</span>
                      <span className="font-bold text-amber-600">{pendingPayments}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Analytics */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-soft">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Fee Collection Status</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Metric</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Value</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                        <td className="py-4 px-4 text-sm text-gray-600">Total Students</td>
                        <td className="text-right py-4 px-4 text-sm font-semibold text-gray-900">{totalStudents}</td>
                        <td className="text-right py-4 px-4 text-sm font-semibold text-gray-900">100%</td>
                      </tr>
                      <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                        <td className="py-4 px-4 text-sm text-gray-600 flex items-center gap-2">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                          Students with payments
                        </td>
                        <td className="text-right py-4 px-4 text-sm font-semibold text-emerald-600">{paidStudents}</td>
                        <td className="text-right py-4 px-4 text-sm font-semibold text-emerald-600">{totalStudents > 0 ? ((paidStudents / totalStudents) * 100).toFixed(1) : 0}%</td>
                      </tr>
                      <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                        <td className="py-4 px-4 text-sm text-gray-600 flex items-center gap-2">
                          <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                          Pending payments
                        </td>
                        <td className="text-right py-4 px-4 text-sm font-semibold text-amber-600">{pendingPayments}</td>
                        <td className="text-right py-4 px-4 text-sm font-semibold text-amber-600">{totalStudents > 0 ? ((pendingPayments / (totalStudents * 3)) * 100).toFixed(1) : 0}%</td>
                      </tr>
                      <tr className="hover:bg-gray-50/50 transition">
                        <td className="py-4 px-4 text-sm text-gray-600 flex items-center gap-2">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                          Total fees collected
                        </td>
                        <td className="text-right py-4 px-4 text-sm font-semibold text-emerald-600">₹{(totalFeesCollected / 100000).toFixed(2)}L</td>
                        <td className="text-right py-4 px-4 text-sm font-semibold text-emerald-600">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
