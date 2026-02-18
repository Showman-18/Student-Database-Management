import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import StudentModal from '../components/StudentModal';
import CreateStudentModal from '../components/CreateStudentModal';
import UpdateStudentModal from '../components/UpdateStudentModal';
import { LogOut, Search, Users, Plus, BarChart3, Menu, X } from 'lucide-react';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      
      if (selectedStudent && isModalOpen) {
        const updatedStudent = response.data.find((s) => s._id === selectedStudent._id);
        if (updatedStudent) {
          setSelectedStudent(updatedStudent);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  useEffect(() => {
    let results = students;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (student) =>
          student.fullName.toLowerCase().includes(query) ||
          student.grNo.toLowerCase().includes(query)
      );
    }

    results.sort((a, b) => {
      let aVal = sortBy === 'name' ? a.fullName : a.grNo;
      let bVal = sortBy === 'name' ? b.fullName : b.grNo;

      if (sortOrder === 'asc') {
        return aVal.localeCompare(bVal);
      } else {
        return bVal.localeCompare(aVal);
      }
    });

    setFilteredStudents(results);
  }, [students, searchQuery, sortBy, sortOrder]);

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setIsModalOpen(false);
    setIsUpdateModalOpen(true);
  };

  const handleDeleteStudent = async (student) => {
    if (!student?._id) return;
    const confirmed = window.confirm(`Delete ${student.fullName}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await axios.delete(`/students/${student._id}`);
      setIsModalOpen(false);
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete student');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
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

          <nav className="flex-1 px-4 py-6 space-y-1">
            <button
              onClick={() => navigate('/dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition text-left text-sm font-medium ${!sidebarOpen && 'justify-center'}`}
            >
              <BarChart3 size={20} />
              {sidebarOpen && <span>Dashboard</span>}
            </button>
            <button
              onClick={() => navigate('/students')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 text-emerald-700 transition text-left text-sm font-medium ${!sidebarOpen && 'justify-center'}`}
            >
              <Users size={20} />
              {sidebarOpen && <span>Students</span>}
            </button>
          </nav>

          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition text-sm font-medium ${!sidebarOpen && 'justify-center'}`}
            >
              <LogOut size={16} />
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 min-h-screen flex flex-col ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Bar */}
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-40">
          <h2 className="text-xl font-bold text-gray-900">Students</h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-100 transition font-medium text-sm"
          >
            <Plus size={16} />
            Add Student
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Search Bar */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name or GR number..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
            >
              <option value="name">Sort by Name</option>
              <option value="grNo">Sort by GR No</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            >
              {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
          </div>

          {/* Students Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Loading students...</p>
              </div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Users size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No students found</p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium"
                >
                  Add First Student
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((student) => (
                <div
                  key={student._id}
                  onClick={() => handleStudentClick(student)}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-soft hover:shadow-card hover:border-emerald-200 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm">
                      {student.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{student.fullName}</h3>
                      <p className="text-sm text-gray-400">{student.grNo}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Phone:</span> {student.phoneNumber}
                    </p>
                    {student.address && (
                      <p className="text-sm text-gray-500 line-clamp-2">
                        <span className="font-semibold text-gray-600">Address:</span> {student.address}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditStudent(student);
                      }}
                      className="flex-1 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition font-medium text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStudent(student);
                      }}
                      className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <StudentModal
        student={selectedStudent}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEdit={handleEditStudent}
        onDelete={handleDeleteStudent}
        onSuccess={fetchStudents}
      />

      <CreateStudentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchStudents}
      />

      <UpdateStudentModal
        student={editingStudent}
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onSuccess={fetchStudents}
      />
    </div>
  );
};

export default Students;
