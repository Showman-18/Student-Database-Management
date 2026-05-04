import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { User, LogIn, UserPlus } from 'lucide-react';
import PasswordInput from '../components/PasswordInput';

/* ── Design tokens ── */
const T = {
  canvas:  '#ffffff',
  soft:    '#fafafa',
  hairline:'#e5e5e5',
  hairlineStrong: '#d4d4d4',
  ink:     '#000000',
  inkDeep: '#090909',
  body:    '#737373',
  mute:    '#a3a3a3',
};

const inputStyle = {
  background: T.canvas,
  border: `1px solid ${T.hairline}`,
  borderRadius: 9999,
  padding: '0 16px 0 40px',
  height: 40,
  fontSize: 14,
  color: T.ink,
  outline: 'none',
  fontFamily: 'inherit',
  width: '100%',
  transition: 'border-color 0.15s',
};

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 500,
  color: T.body,
  marginBottom: 6,
};

const btnPrimary = {
  background: T.ink,
  color: '#fff',
  border: 'none',
  borderRadius: 9999,
  height: 40,
  padding: '0 20px',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  width: '100%',
  fontFamily: 'inherit',
  transition: 'background 0.15s',
};

const btnOutline = {
  background: T.canvas,
  color: T.ink,
  border: `1px solid ${T.hairlineStrong}`,
  borderRadius: 9999,
  height: 40,
  padding: '0 20px',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  flex: 1,
  fontFamily: 'inherit',
  transition: 'background 0.15s',
};

const ErrorBox = ({ msg }) => msg ? (
  <div style={{ padding: '10px 14px', background: T.soft, border: `1px solid ${T.hairline}`, borderRadius: 8, fontSize: 13, color: '#dc2626', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
    <span style={{ flexShrink: 0, marginTop: 1 }}>!</span>
    <span>{msg}</span>
  </div>
) : null;

const StatusBox = ({ msg }) => msg ? (
  <div style={{ padding: '10px 14px', background: T.soft, border: `1px solid ${T.hairline}`, borderRadius: 8, fontSize: 13, color: T.body }}>{msg}</div>
) : null;

const Field = ({ label, children }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    {children}
  </div>
);

const Spinner = () => (
  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
);

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
    setError(''); setForgotStatus(''); setForgotVerified(false);
    try {
      setForgotLoading(true);
      const response = await axios.get('/auth/recovery-question');
      setForgotQuestion(response.data?.recoveryQuestion || '');
      setForgotAnswer(''); setRecoveredUsername(''); setRecoveredPassword(''); setRecoveredConfirmPassword('');
      setForgotMode(true);
    } catch (err) { setError(err.response?.data?.message || 'Unable to load security question'); }
    finally { setForgotLoading(false); }
  };

  const handleVerifyForgotAnswer = async () => {
    setError(''); setForgotStatus('');
    if (!forgotAnswer.trim()) { setError('Security answer is required'); return; }
    try {
      setForgotLoading(true);
      const response = await axios.post('/auth/verify-recovery-answer', { recoveryAnswer: forgotAnswer });
      setForgotStatus(response.data?.message || 'Security answer verified.');
      setForgotVerified(true);
    } catch (err) {
      if (err.response?.status === 401) setError('Invalid answer');
      else if (err.response?.status === 429) setError(err.response?.data?.message || 'Too many failed attempts. Please wait before trying again.');
      else setError(err.response?.data?.message || 'Failed to verify security answer');
    } finally { setForgotLoading(false); }
  };

  const handleRecoverCredentials = async () => {
    setError(''); setForgotStatus('');
    if (!recoveredUsername.trim() || !recoveredPassword || !recoveredConfirmPassword) { setError('New username, new password, and confirmation are required'); return; }
    if (recoveredUsername.trim().length < 3) { setError('Username must be at least 3 characters'); return; }
    if (recoveredPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (recoveredPassword !== recoveredConfirmPassword) { setError('Passwords do not match'); return; }
    try {
      setForgotLoading(true);
      const response = await axios.post('/auth/recover-credentials', { recoveryAnswer: forgotAnswer, newUsername: recoveredUsername, newPassword: recoveredPassword });
      setForgotMode(false); setForgotVerified(false); setForgotQuestion(''); setForgotAnswer('');
      setRecoveredPassword(''); setRecoveredConfirmPassword(''); setUsername(recoveredUsername.trim()); setPassword(''); setForgotStatus('');
      window.alert(response.data?.message || 'Credentials recovered successfully. Please sign in.');
    } catch (err) { setError(err.response?.data?.message || 'Failed to recover credentials'); }
    finally { setForgotLoading(false); }
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get('/auth/status');
        const needsSetup = Boolean(response.data?.setupRequired);
        setSetupRequired(needsSetup);
        if (!needsSetup) setSetupStep('credentials');
      } catch { setError('Unable to reach authentication service'); }
      finally { setAuthStatusLoading(false); }
    };
    checkAuthStatus();
  }, []);

  const handleSetupContinue = () => {
    setError('');
    if (!username.trim() || !password || !confirmPassword) { setError('Username, password, and confirmation are required'); return; }
    if (username.trim().length < 3) { setError('Username must be at least 3 characters'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setSetupStep('recovery');
  };

  const handleSubmit = async (e) => {
    // FIX m6: always clear both error and forgotStatus at the start of every
    // submission so stale forgot-mode messages don't persist when the user
    // switches back to the normal login form and retries.
    e.preventDefault(); setError(''); setForgotStatus(''); setLoading(true);
    try {
      let response;
      if (setupRequired) {
        if (setupStep === 'credentials') { setLoading(false); return; }
        if (password !== confirmPassword) { setError('Passwords do not match'); setLoading(false); return; }
        if (!recoveryQuestion.trim() || !recoveryAnswer.trim()) { setError('Security question and answer are required'); setLoading(false); return; }
        response = await axios.post('/auth/setup', { username, password, recoveryQuestion, recoveryAnswer });
      } else {
        response = await axios.post('/auth/login', { username, password });
      }
      localStorage.setItem('token', response.data.token);
      if (response.data?.admin?.username) localStorage.setItem('adminUsername', response.data.admin.username);
      navigate('/dashboard');
    } catch (err) {
      if (!setupRequired && err.response?.status === 401) setError('Invalid username or password');
      else if (!setupRequired && err.response?.status === 429) setError(err.response?.data?.message || 'Too many failed attempts. Please wait before trying again.');
      else setError(err.response?.data?.message || (setupRequired ? 'Setup failed. Please try again.' : 'Login failed. Please try again.'));
    } finally { setLoading(false); }
  };

  if (authStatusLoading) {
    return (
      <div style={{ minHeight: '100vh', background: T.canvas, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 28, height: 28, border: `2px solid ${T.hairline}`, borderTopColor: T.ink, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: T.mute, fontSize: 14, margin: 0 }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: T.canvas, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo mark */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 40, height: 40, background: T.ink, borderRadius: 9999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <User size={18} color="#fff" />
          </div>
          <h1 style={{ fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 700, color: T.ink, margin: '0 0 4px' }}>
            {setupRequired ? 'First-time setup' : forgotMode ? 'Recover access' : 'Sign in'}
          </h1>
          <p style={{ fontSize: 14, color: T.body, margin: 0 }}>
            {setupRequired
              ? setupStep === 'credentials' ? 'Create your admin credentials.' : 'Set a recovery question.'
              : forgotMode ? 'Verify your identity to reset credentials.' : 'EduManager admin portal'}
          </p>
        </div>

        {/* Card */}
        <div style={{ background: T.canvas, border: `1px solid ${T.hairline}`, borderRadius: 12, padding: 32 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── Login mode ── */}
            {!setupRequired && !forgotMode && (
              <>
                <Field label="Username">
                  <div style={{ position: 'relative' }}>
                    <User size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: T.mute, pointerEvents: 'none' }} />
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username"
                      style={inputStyle} disabled={loading} minLength={3} required
                      onFocus={e => { e.target.style.borderColor = T.ink; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)'; }}
                      onBlur={e => { e.target.style.borderColor = T.hairline; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </Field>
                <Field label="Password">
                  <PasswordInput value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                    className="w-full" style={inputStyle} disabled={loading} minLength={6} required />
                </Field>
                <ErrorBox msg={error} />
                <button type="submit" disabled={loading} style={btnPrimary}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = T.inkDeep; }}
                  onMouseLeave={e => { e.currentTarget.style.background = loading ? T.soft : T.ink; }}>
                  {loading ? <><Spinner />Signing in...</> : <><LogIn size={15} />Sign In</>}
                </button>
                <button type="button" onClick={handleForgotPassword} disabled={loading || forgotLoading}
                  style={{ background: 'none', border: 'none', color: T.body, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', padding: 0, textAlign: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.color = T.ink}
                  onMouseLeave={e => e.currentTarget.style.color = T.body}>
                  {forgotLoading ? 'Loading...' : 'Forgot password?'}
                </button>
              </>
            )}

            {/* ── Setup: credentials step ── */}
            {setupRequired && setupStep === 'credentials' && (
              <>
                <div style={{ padding: '10px 14px', background: T.soft, border: `1px solid ${T.hairline}`, borderRadius: 8, fontSize: 13, color: T.body }}>
                  First launch detected. You only do this once.
                </div>
                <Field label="Username">
                  <div style={{ position: 'relative' }}>
                    <User size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: T.mute, pointerEvents: 'none' }} />
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Choose a username"
                      style={inputStyle} disabled={loading} minLength={3} required
                      onFocus={e => { e.target.style.borderColor = T.ink; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)'; }}
                      onBlur={e => { e.target.style.borderColor = T.hairline; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </Field>
                <Field label="Password">
                  <PasswordInput value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                    className="w-full" style={inputStyle} disabled={loading} minLength={6} required />
                </Field>
                <Field label="Confirm Password">
                  <PasswordInput value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••"
                    className="w-full" style={inputStyle} disabled={loading} minLength={6} required />
                </Field>
                <ErrorBox msg={error} />
                <button type="button" onClick={handleSetupContinue} disabled={loading} style={btnPrimary}
                  onMouseEnter={e => e.currentTarget.style.background = T.inkDeep}
                  onMouseLeave={e => e.currentTarget.style.background = T.ink}>
                  Continue
                </button>
              </>
            )}

            {/* ── Setup: recovery step ── */}
            {setupRequired && setupStep === 'recovery' && (
              <>
                <div style={{ padding: '10px 14px', background: T.soft, border: `1px solid ${T.hairline}`, borderRadius: 8, fontSize: 13, color: T.body }}>
                  Save this security question — it's your only password recovery option.
                </div>
                <Field label="Security Question">
                  <input type="text" value={recoveryQuestion} onChange={e => setRecoveryQuestion(e.target.value)}
                    placeholder="Write your own question" style={{ ...inputStyle, paddingLeft: 16 }} disabled={loading} required
                    onFocus={e => { e.target.style.borderColor = T.ink; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)'; }}
                    onBlur={e => { e.target.style.borderColor = T.hairline; e.target.style.boxShadow = 'none'; }}
                  />
                </Field>
                <Field label="Security Answer">
                  <PasswordInput value={recoveryAnswer} onChange={e => setRecoveryAnswer(e.target.value)}
                    placeholder="Enter answer" className="w-full" style={inputStyle} disabled={loading} minLength={2} required />
                </Field>
                <ErrorBox msg={error} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setSetupStep('credentials')} style={btnOutline}
                    onMouseEnter={e => e.currentTarget.style.background = T.soft}
                    onMouseLeave={e => e.currentTarget.style.background = T.canvas}>Back</button>
                  <button type="submit" disabled={loading} style={{ ...btnPrimary, flex: 1 }}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.background = T.inkDeep; }}
                    onMouseLeave={e => e.currentTarget.style.background = loading ? T.soft : T.ink}>
                    {loading ? <><Spinner />Creating...</> : <>Create Account</>}
                  </button>
                </div>
              </>
            )}

            {/* ── Forgot password: verify step ── */}
            {!setupRequired && forgotMode && !forgotVerified && (
              <>
                <StatusBox msg={forgotStatus} />
                <Field label="Security Question">
                  <div style={{ padding: '10px 16px', background: T.soft, border: `1px solid ${T.hairline}`, borderRadius: 9999, fontSize: 14, color: T.body, minHeight: 40, display: 'flex', alignItems: 'center' }}>
                    {forgotQuestion}
                  </div>
                </Field>
                <Field label="Your Answer">
                  <PasswordInput value={forgotAnswer} onChange={e => setForgotAnswer(e.target.value)}
                    placeholder="Enter answer" className="w-full" style={inputStyle} disabled={forgotLoading} minLength={2} required />
                </Field>
                <ErrorBox msg={error} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => { setForgotMode(false); setForgotVerified(false); setForgotQuestion(''); setForgotAnswer(''); setRecoveredUsername(''); setRecoveredPassword(''); setRecoveredConfirmPassword(''); setForgotStatus(''); setError(''); }}
                    style={btnOutline}
                    onMouseEnter={e => e.currentTarget.style.background = T.soft}
                    onMouseLeave={e => e.currentTarget.style.background = T.canvas}>Back</button>
                  <button type="button" onClick={handleVerifyForgotAnswer} disabled={forgotLoading}
                    style={{ ...btnPrimary, flex: 1 }}
                    onMouseEnter={e => { if (!forgotLoading) e.currentTarget.style.background = T.inkDeep; }}
                    onMouseLeave={e => e.currentTarget.style.background = forgotLoading ? T.soft : T.ink}>
                    {forgotLoading ? <><Spinner />Verifying...</> : 'Verify'}
                  </button>
                </div>
              </>
            )}

            {/* ── Forgot password: reset credentials step ── */}
            {!setupRequired && forgotMode && forgotVerified && (
              <>
                <StatusBox msg={forgotStatus} />
                <Field label="New Username">
                  <input type="text" value={recoveredUsername} onChange={e => setRecoveredUsername(e.target.value)}
                    placeholder="Enter new username" style={{ ...inputStyle, paddingLeft: 16 }} disabled={forgotLoading} minLength={3} required
                    onFocus={e => { e.target.style.borderColor = T.ink; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)'; }}
                    onBlur={e => { e.target.style.borderColor = T.hairline; e.target.style.boxShadow = 'none'; }}
                  />
                </Field>
                <Field label="New Password">
                  <PasswordInput value={recoveredPassword} onChange={e => setRecoveredPassword(e.target.value)}
                    placeholder="Enter new password" className="w-full" style={inputStyle} disabled={forgotLoading} minLength={6} required />
                </Field>
                <Field label="Confirm New Password">
                  <PasswordInput value={recoveredConfirmPassword} onChange={e => setRecoveredConfirmPassword(e.target.value)}
                    placeholder="Confirm new password" className="w-full" style={inputStyle} disabled={forgotLoading} minLength={6} required />
                </Field>
                <ErrorBox msg={error} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => { setForgotVerified(false); setRecoveredUsername(''); setRecoveredPassword(''); setRecoveredConfirmPassword(''); setForgotStatus(''); setError(''); }}
                    style={btnOutline}
                    onMouseEnter={e => e.currentTarget.style.background = T.soft}
                    onMouseLeave={e => e.currentTarget.style.background = T.canvas}>Back</button>
                  <button type="button" onClick={handleRecoverCredentials} disabled={forgotLoading}
                    style={{ ...btnPrimary, flex: 1 }}
                    onMouseEnter={e => { if (!forgotLoading) e.currentTarget.style.background = T.inkDeep; }}
                    onMouseLeave={e => e.currentTarget.style.background = forgotLoading ? T.soft : T.ink}>
                    {forgotLoading ? <><Spinner />Saving...</> : 'Save Credentials'}
                  </button>
                </div>
              </>
            )}

          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: T.mute, marginTop: 24 }}>Student Management System</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Login;
