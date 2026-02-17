import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { LogOut, Users, Plus, BarChart3, Menu, X, TrendingUp, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-200 transition-all duration-300 z-50 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center w-full'}`}>
              <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg text-white">
                <BarChart3 size={20} />
              </div>
              {sidebarOpen && <span className="font-bold text-lg text-slate-900">SDBMS</span>}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <div className={`flex items-center gap-3 px-4 py-3 bg-teal-50 text-teal-700 rounded-lg font-medium cursor-pointer ${!sidebarOpen && 'justify-center'}`}>
              <BarChart3 size={20} />
              {sidebarOpen && <span>Dashboard</span>}
            </div>
            <div
              onClick={() => navigate('/students')}
              className={`flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition ${!sidebarOpen && 'justify-center'}`}
            >
              <Users size={20} />
              {sidebarOpen && <span>Students</span>}
            </div>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-slate-200">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition ${!sidebarOpen && 'justify-center'}`}
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
        <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="px-8 py-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-500 text-sm mt-1">Overview & analytics of student records</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex gap-3">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-32">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-teal-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600 font-medium">Loading dashboard...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Students */}
                <div className="bg-white rounded-2xl p-6 border-l-4 border-l-teal-500 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">Total Students</p>
                      <p className="text-4xl font-bold text-slate-900 mt-2">{totalStudents}</p>
                    </div>
                    <div className="p-3 bg-teal-100 rounded-xl">
                      <Users className="text-teal-600" size={24} />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">Active records</p>
                </div>

                {/* Fees Collected */}
                <div className="bg-white rounded-2xl p-6 border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">Fees Collected</p>
                      <p className="text-4xl font-bold text-slate-900 mt-2">₹{(totalFeesCollected / 100000).toFixed(1)}L</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-xl">
                      <TrendingUp className="text-green-600" size={24} />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">Total amount</p>
                </div>

                {/* Pending Payments */}
                <div className="bg-white rounded-2xl p-6 border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">Pending Payments</p>
                      <p className="text-4xl font-bold text-slate-900 mt-2">{pendingPayments}</p>
                    </div>
                    <div className="p-3 bg-amber-100 rounded-xl">
                      <AlertCircle className="text-amber-600" size={24} />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">Awaiting payment</p>
                </div>

                {/* Paid Students */}
                <div className="bg-white rounded-2xl p-6 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">Paid Students</p>
                      <p className="text-4xl font-bold text-slate-900 mt-2">{paidStudents}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <BarChart3 className="text-blue-600" size={24} />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">With paid fees</p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Payment Status Distribution */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900 mb-6">Payment Status</h2>
                  <div className="space-y-4">
                    {/* Progress Bars */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-600">Paid</span>
                        <span className="text-sm font-bold text-green-600">{paidStudents} students</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300"
                          style={{
                            width: totalStudents > 0 ? `${(paidStudents / totalStudents) * 100}%` : '0%'
                          }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-600">Pending</span>
                        <span className="text-sm font-bold text-amber-600">{pendingPayments} payments</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-300"
                          style={{
                            width: totalStudents > 0 ? `${((pendingPayments / (totalStudents * 3)) * 100).toFixed(1)}%` : '0%'
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900 mb-6">Quick Statistics</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm text-slate-600">Average collected per student</span>
                      <span className="font-bold text-teal-600">₹{totalStudents > 0 ? ((totalFeesCollected / totalStudents) / 1000).toFixed(1) : '0'}K</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm text-slate-600">Students with payments</span>
                      <span className="font-bold text-green-600">{totalStudents > 0 ? ((paidStudents / totalStudents) * 100).toFixed(1) : '0'}%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm text-slate-600">Outstanding payments</span>
                      <span className="font-bold text-amber-600">{pendingPayments}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Analytics */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-6">Fee Collection Status</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Metric</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-900">Value</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-900">Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="py-3 px-4 text-sm text-slate-600">Total Students</td>
                        <td className="text-right py-3 px-4 text-sm font-semibold text-slate-900">{totalStudents}</td>
                        <td className="text-right py-3 px-4 text-sm font-semibold text-slate-900">100%</td>
                      </tr>
                      <tr className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="py-3 px-4 text-sm text-slate-600 flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Students with payments
                        </td>
                        <td className="text-right py-3 px-4 text-sm font-semibold text-green-600">{paidStudents}</td>
                        <td className="text-right py-3 px-4 text-sm font-semibold text-green-600">{totalStudents > 0 ? ((paidStudents / totalStudents) * 100).toFixed(1) : 0}%</td>
                      </tr>
                      <tr className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="py-3 px-4 text-sm text-slate-600 flex items-center gap-2">
                          <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                          Pending payments
                        </td>
                        <td className="text-right py-3 px-4 text-sm font-semibold text-amber-600">{pendingPayments}</td>
                        <td className="text-right py-3 px-4 text-sm font-semibold text-amber-600">{totalStudents > 0 ? ((pendingPayments / (totalStudents * 3)) * 100).toFixed(1) : 0}%</td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 text-sm text-slate-600 flex items-center gap-2">
                          <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                          Total fees collected
                        </td>
                        <td className="text-right py-3 px-4 text-sm font-semibold text-teal-600">₹{(totalFeesCollected / 100000).toFixed(2)}L</td>
                        <td className="text-right py-3 px-4 text-sm font-semibold text-teal-600">-</td>
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
