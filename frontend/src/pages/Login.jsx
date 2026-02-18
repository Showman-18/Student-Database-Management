import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { Lock, User, LogIn, CheckCircle2, Zap, Shield } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-100/50 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-green-100/40 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left Side - Brand & Features */}
        <div className="hidden lg:flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-8">
              <Zap size={14} />
              Student Management System
            </div>
            <h1 className="text-5xl font-bold leading-tight text-gray-900 mb-6">
              Smart student
              <span className="block bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent"> management</span>
            </h1>
            <p className="text-gray-500 text-lg mb-12 leading-relaxed">
              Efficiently manage student records, track fees payments, and keep everything organized in one secure platform.
            </p>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle2 size={20} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-gray-900 font-semibold">Complete Database</p>
                  <p className="text-gray-500 text-sm mt-1">Manage all student information in one place</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0 mt-1">
                  <Zap size={20} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-gray-900 font-semibold">Lightning Fast</p>
                  <p className="text-gray-500 text-sm mt-1">Search and retrieve data instantly</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0 mt-1">
                  <Shield size={20} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-gray-900 font-semibold">Secure & Reliable</p>
                  <p className="text-gray-500 text-sm mt-1">Protected access with authentication</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Branding */}
          <div className="flex items-center gap-4 pt-8 border-t border-gray-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-200">
              SD
            </div>
            <div>
              <p className="text-gray-500 text-sm">Student Database</p>
              <p className="text-gray-900 font-semibold">Management System</p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-200 shadow-soft">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-500 text-sm">Sign in with your admin credentials</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2.5">
                Username
              </label>
              <div className="relative group">
                <div className="relative flex items-center">
                  <User className="absolute left-4 text-gray-400 group-focus-within:text-emerald-500 transition" size={18} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2.5">
                Password
              </label>
              <div className="relative group">
                <div className="relative flex items-center">
                  <Lock className="absolute left-4 text-gray-400 group-focus-within:text-emerald-500 transition" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-red-500 text-xs font-bold">!</span>
                </div>
                <div>{error}</div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-8 py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <p className="text-emerald-700 text-xs font-semibold mb-2">DEMO CREDENTIALS</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-gray-500 text-xs">Username</p>
                <p className="text-gray-900 font-mono font-semibold text-sm">admin</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Password</p>
                <p className="text-gray-900 font-mono font-semibold text-sm">admin123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
