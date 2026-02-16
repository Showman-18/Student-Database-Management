import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { Lock, User, LogIn } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/auth/login', { username, password });
      localStorage.setItem('token', response.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="hidden lg:flex flex-col justify-between p-10 rounded-3xl ui-card">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold">
              Student Management System
            </div>
            <h1 className="text-4xl font-bold mt-6 leading-tight text-slate-900">
              Manage students with
              <span className="text-teal-600"> clarity</span> and
              <span className="text-teal-600"> speed</span>.
            </h1>
            <p className="text-slate-600 mt-4">
              Search instantly, view detailed records, and keep everything organized in one place.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-teal-500 flex items-center justify-center text-white font-bold">
              SM
            </div>
            <div>
              <p className="text-sm text-slate-500">Secure access</p>
              <p className="text-base font-semibold text-slate-900">Admin dashboard</p>
            </div>
          </div>
        </div>

        <div className="ui-card rounded-3xl p-8 sm:p-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
              <p className="text-slate-500 text-sm mt-1">Use your admin credentials</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-teal-500 flex items-center justify-center">
              <LogIn className="text-white" size={22} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 mt-8">
            {/* Username Field */}
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-3">
                <span className="text-red-500 font-bold text-lg">!</span>
                <div>{error}</div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm">
            <p className="text-slate-600">
              Demo: <span className="font-semibold">admin</span> / <span className="font-semibold">admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
