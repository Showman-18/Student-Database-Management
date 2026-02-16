import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import StudentModal from '../components/StudentModal';
import { LogOut, Search, Users, Plus, ArrowUpDown, Filter } from 'lucide-react';

const Dashboard = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name' or 'grNo'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <Users className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Student Directory</h1>
              <p className="text-slate-500 text-sm">Manage and view all students</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition font-medium"
          >
            <LogOut size={18} />
            Logout
          </button>
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
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition text-slate-900 placeholder-slate-400"
            />
          </div>
          <p className="text-slate-500 text-sm mt-2">{filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex gap-3">
            <span className="font-bold">!</span>
            <div>{error}</div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}

        {/* Students Grid */}
        {!loading && filteredStudents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <div
                key={student._id}
                onClick={() => handleStudentClick(student)}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slat-300 hover:shadow-lg transition cursor-pointer group"
              >
                {/* Card Header */}
                <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                
                {/* Card Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                        {student.fullName}
                      </h3>
                      <p className="text-slate-500 text-sm mt-0.5">{student.grNo}</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition">
                      <span className="text-blue-600 font-semibold text-sm">
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
                  <button className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-medium text-sm group-hover:bg-blue-600 group-hover:text-white">
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
      />
    </div>
  );
};

export default Dashboard;
