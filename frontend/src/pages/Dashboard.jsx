import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import StudentModal from '../components/StudentModal';
import CreateStudentModal from '../components/CreateStudentModal';
import UpdateStudentModal from '../components/UpdateStudentModal';
import { LogOut, Search, Users, Plus } from 'lucide-react';

const Dashboard = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name' or 'grNo'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  useEffect(() => {
    // Apply search and sort
    let results = students;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (student) =>
          student.fullName.toLowerCase().includes(query) ||
          student.grNo.toLowerCase().includes(query)
      );
    }

    // Sort results
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

  const handleCreateSuccess = () => {
    fetchStudents();
  };

  const handleUpdateSuccess = () => {
    fetchStudents();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-600 rounded-xl">
              <Users className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Student Directory</h1>
              <p className="text-slate-500 text-sm">Search, update, and manage profiles</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white hover:bg-teal-700 rounded-xl transition font-semibold"
            >
              <Plus size={18} />
              Add Student
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition font-medium"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or GR number..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition text-slate-900 placeholder-slate-400"
            />
          </div>
          <p className="text-slate-500 text-sm mt-2">{filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex gap-3">
            <span className="font-bold">!</span>
            <div>{error}</div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-teal-500 rounded-full animate-spin"></div>
          </div>
        )}

        {/* Students Grid */}
        {!loading && filteredStudents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <div
                key={student._id}
                onClick={() => handleStudentClick(student)}
                className="ui-card rounded-2xl overflow-hidden hover:shadow-xl transition cursor-pointer group"
              >
                <div className="h-1 bg-gradient-to-r from-teal-500 to-cyan-400"></div>
                
                {/* Card Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                        {student.fullName}
                      </h3>
                      <p className="text-slate-500 text-sm mt-0.5">{student.grNo}</p>
                    </div>
                    <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center group-hover:bg-teal-100 transition">
                      <span className="text-teal-700 font-semibold text-sm">
                        {student.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">PAN No</span>
                      <span className="text-slate-900 font-medium">{student.panNo}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">Phone</span>
                      <span className="text-slate-900 font-medium">{student.phoneNumber}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button className="w-full py-2 bg-teal-50 text-teal-700 rounded-xl hover:bg-teal-600 hover:text-white transition font-medium text-sm">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && filteredStudents.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="text-slate-400" size={32} />
            </div>
            <p className="text-slate-600 text-lg font-medium mb-1">
              {students.length === 0 ? 'No students yet' : 'No results found'}
            </p>
            <p className="text-slate-500">
              {students.length === 0
                ? 'Start by adding your first student'
                : 'Try adjusting your search filters'}
            </p>
          </div>
        )}
      </main>

      {/* Student Modal */}
      <StudentModal
        student={selectedStudent}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEdit={handleEditStudent}
        onDelete={handleDeleteStudent}
      />

      <CreateStudentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <UpdateStudentModal
        student={editingStudent}
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onSuccess={handleUpdateSuccess}
      />
    </div>
  );
};

export default Dashboard;
