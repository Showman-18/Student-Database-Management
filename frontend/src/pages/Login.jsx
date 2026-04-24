import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { User, LogIn, CheckCircle2, Zap, Shield, UserPlus } from 'lucide-react';
import PasswordInput from '../components/PasswordInput';

const Login = () => {
  const [authStatusLoading, setAuthStatusLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [setupStep, setSetupStep] = useState('credentials');
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotVerified, setForgotVerified] = useState(false);
  const [forgotQuestion, setForgotQuestion] = useState('');
  const [forgotAnswer, setForgotAnswer] = useState('');
  const [recoveredUsername, setRecoveredUsername] = useState('');
  const [recoveredPassword, setRecoveredPassword] = useState('');
  const [recoveredConfirmPassword, setRecoveredConfirmPassword] = useState('');
  const [forgotStatus, setForgotStatus] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryQuestion, setRecoveryQuestion] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleForgotPassword = async () => {
    setError('');
    setForgotStatus('');
    setForgotVerified(false);

    try {
      setForgotLoading(true);
      const response = await axios.get('/auth/recovery-question');
      setForgotQuestion(response.data?.recoveryQuestion || '');
      setForgotAnswer('');
      setRecoveredUsername('');
      setRecoveredPassword('');
      setRecoveredConfirmPassword('');
      setForgotMode(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load security question');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyForgotAnswer = async () => {
    setError('');
    setForgotStatus('');

    if (!forgotAnswer.trim()) {
      setError('Security answer is required');
      return;
    }

    try {
      setForgotLoading(true);
      const response = await axios.post('/auth/verify-recovery-answer', {
        recoveryAnswer: forgotAnswer,
      });
      setForgotStatus(response.data?.message || 'Security answer verified.');
      setForgotVerified(true);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Invalid answer');
      } else if (err.response?.status === 429) {
        setError(err.response?.data?.message || 'Too many failed attempts. Please wait before trying again.');
      } else {
        setError(err.response?.data?.message || 'Failed to verify security answer');
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const handleRecoverCredentials = async () => {
    setError('');
    setForgotStatus('');

    if (!recoveredUsername.trim() || !recoveredPassword || !recoveredConfirmPassword) {
      setError('New username, new password, and confirmation are required');
      return;
    }

    if (recoveredUsername.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (recoveredPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (recoveredPassword !== recoveredConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setForgotLoading(true);
      const response = await axios.post('/auth/recover-credentials', {
        recoveryAnswer: forgotAnswer,
        newUsername: recoveredUsername,
        newPassword: recoveredPassword,
      });

      setForgotMode(false);
      setForgotVerified(false);
      setForgotQuestion('');
      setForgotAnswer('');
      setRecoveredPassword('');
      setRecoveredConfirmPassword('');
      setUsername(recoveredUsername.trim());
      setPassword('');
      setForgotStatus('');
      window.alert(response.data?.message || 'Credentials recovered successfully. Please sign in.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to recover credentials');
    } finally {
      setForgotLoading(false);
    }
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get('/auth/status');
        const needsSetup = Boolean(response.data?.setupRequired);
        setSetupRequired(needsSetup);
        if (!needsSetup) {
          setSetupStep('credentials');
        }
      } catch {
        setError('Unable to reach authentication service');
      } finally {
        setAuthStatusLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleSetupContinue = () => {
    setError('');

    if (!username.trim() || !password || !confirmPassword) {
      setError('Username, password, and confirmation are required');
      return;
    }

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSetupStep('recovery');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let response;

      if (setupRequired) {
        if (setupStep === 'credentials') {
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        if (!recoveryQuestion.trim() || !recoveryAnswer.trim()) {
          setError('Security question and answer are required');
          setLoading(false);
          return;
        }

        response = await axios.post('/auth/setup', {
          username,
          password,
          recoveryQuestion,
          recoveryAnswer,
        });
      } else {
        response = await axios.post('/auth/login', { username, password });
      }

      localStorage.setItem('token', response.data.token);
      if (response.data?.admin?.username) {
        localStorage.setItem('adminUsername', response.data.admin.username);
      }
      navigate('/dashboard');
    } catch (err) {
      if (!setupRequired && err.response?.status === 401) {
        setError('Invalid username or password');
      } else if (!setupRequired && err.response?.status === 429) {
        setError(err.response?.data?.message || 'Too many failed attempts. Please wait before trying again.');
      } else {
        setError(
          err.response?.data?.message ||
            (setupRequired ? 'Setup failed. Please try again.' : 'Login failed. Please try again.')
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (authStatusLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-100/50 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-green-100/40 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
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

        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-200 shadow-soft">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {setupRequired ? 'Set Up Admin Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-500 text-sm">
              {setupRequired
                ? setupStep === 'credentials'
                  ? 'First launch detected. Create your admin username and password first.'
                  : 'Now add a custom security question and answer for password recovery.'
                : 'Sign in with your admin credentials'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {((!setupRequired && !forgotMode) || (setupRequired && setupStep === 'credentials')) && (
              <>
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2.5">Username</label>
                  <div className="relative group">
                    <div className="relative flex items-center">
                      <User className="absolute left-4 text-gray-400 group-focus-within:text-emerald-500 transition" size={18} />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder={setupRequired ? 'Choose username' : 'Enter username'}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                        disabled={loading || forgotLoading || (!setupRequired && forgotMode)}
                        minLength={3}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2.5">Password</label>
                  <div className="relative group">
                    <PasswordInput
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                      disabled={loading}
                      minLength={6}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {setupRequired && setupStep === 'credentials' && (
              <>
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2.5">Confirm Password</label>
                  <div className="relative group">
                    <PasswordInput
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                      disabled={loading}
                      minLength={6}
                      required
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSetupContinue}
                  disabled={loading}
                  className="w-full mt-8 py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  <UserPlus size={18} />
                  <span>Continue</span>
                </button>
              </>
            )}

            {setupRequired && setupStep === 'recovery' && (
              <>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                  The security question and answer above will be used for password recovery. There will be no other option to recover your password. Make sure you save it.
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2.5">Security Question</label>
                  <input
                    type="text"
                    value={recoveryQuestion}
                    onChange={(e) => setRecoveryQuestion(e.target.value)}
                    placeholder="Enter your own security question"
                    className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2.5">Security Answer</label>
                  <PasswordInput
                    value={recoveryAnswer}
                    onChange={(e) => setRecoveryAnswer(e.target.value)}
                    placeholder="Enter security answer"
                    className="w-full py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                    disabled={loading}
                    minLength={2}
                    required
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-500 text-xs font-bold">!</span>
                    </div>
                    <div>{error}</div>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSetupStep('credentials')}
                    className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 transition duration-300 flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <span>Create Account</span>
                    )}
                  </button>
                </div>
              </>
            )}

            {!setupRequired && !forgotMode && (
              <>
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-500 text-xs font-bold">!</span>
                    </div>
                    <div>{error}</div>
                  </div>
                )}

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

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading || forgotLoading}
                  className="w-full text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition"
                >
                  {forgotLoading ? 'Loading security question...' : 'Forgot password?'}
                </button>
              </>
            )}

            {!setupRequired && forgotMode && (
              <>
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-500 text-xs font-bold">!</span>
                    </div>
                    <div>{error}</div>
                  </div>
                )}

                {forgotStatus && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
                    {forgotStatus}
                  </div>
                )}

                {!forgotVerified && (
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2.5">Security Question</label>
                    <div className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900">
                      {forgotQuestion}
                    </div>
                  </div>
                )}

                {!forgotVerified && (
                  <>
                    <div>
                      <label className="block text-gray-700 text-sm font-semibold mb-2.5">Security Answer</label>
                      <PasswordInput
                        value={forgotAnswer}
                        onChange={(e) => setForgotAnswer(e.target.value)}
                        placeholder="Enter security answer"
                        className="w-full py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                        disabled={forgotLoading}
                        minLength={2}
                        required
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setForgotMode(false);
                          setForgotVerified(false);
                          setForgotQuestion('');
                          setForgotAnswer('');
                          setRecoveredUsername('');
                          setRecoveredPassword('');
                          setRecoveredConfirmPassword('');
                          setForgotStatus('');
                          setError('');
                        }}
                        className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition"
                      >
                        Back to login
                      </button>
                      <button
                        type="button"
                        onClick={handleVerifyForgotAnswer}
                        disabled={forgotLoading}
                        className="flex-1 py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {forgotLoading ? 'Verifying...' : 'Verify Answer'}
                      </button>
                    </div>
                  </>
                )}

                {forgotVerified && (
                  <>
                    <div>
                      <label className="block text-gray-700 text-sm font-semibold mb-2.5">New Username</label>
                      <input
                        type="text"
                        value={recoveredUsername}
                        onChange={(e) => setRecoveredUsername(e.target.value)}
                        placeholder="Enter new username"
                        className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                        disabled={forgotLoading}
                        minLength={3}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-semibold mb-2.5">New Password</label>
                      <PasswordInput
                        value={recoveredPassword}
                        onChange={(e) => setRecoveredPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                        disabled={forgotLoading}
                        minLength={6}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-semibold mb-2.5">Confirm New Password</label>
                      <PasswordInput
                        value={recoveredConfirmPassword}
                        onChange={(e) => setRecoveredConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                        disabled={forgotLoading}
                        minLength={6}
                        required
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setForgotVerified(false);
                          setRecoveredUsername('');
                          setRecoveredPassword('');
                          setRecoveredConfirmPassword('');
                          setForgotStatus('');
                          setError('');
                        }}
                        className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleRecoverCredentials}
                        disabled={forgotLoading}
                        className="flex-1 py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {forgotLoading ? 'Saving...' : 'Save Credentials'}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {setupRequired && setupStep === 'credentials' && error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-red-500 text-xs font-bold">!</span>
                </div>
                <div>{error}</div>
              </div>
            )}

            {setupRequired && setupStep === 'credentials' && (
              <div className="mt-8 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <p className="text-emerald-700 text-xs font-semibold mb-1">FIRST-TIME SETUP</p>
                <p className="text-gray-600 text-sm">You only do this once after installation. Later, use these credentials to sign in.</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
