import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Auth({ mode = 'login' }) {
  const navigate = useNavigate();
  const { signInWithEmail, signUpWithEmail } = useAuth();
  
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [role, setRole] = useState('passenger'); // passenger | officer
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [department, setDepartment] = useState('Station Master');
  const [assignedZone, setAssignedZone] = useState('');

  // Password reset dialog state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const departments = ['TTE', 'Station Master', 'RPF', 'Catering Supervisor', 'Medical Team'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const res = await signInWithEmail(email, password);
        if (res.success) {
          // Route user based on role
          if (res.user.role === 'admin') {
            navigate('/admin');
          } else if (res.user.role === 'officer') {
            navigate('/officer');
          } else {
            navigate('/passenger');
          }
        } else {
          setError(res.error || 'Login failed. Please check credentials.');
        }
      } else {
        const signupData = {
          name,
          email,
          password,
          phoneNumber,
          role,
          department: role === 'officer' ? department : 'General Admin',
          assignedZone: role === 'officer' ? assignedZone : 'All Zones'
        };
        const res = await signUpWithEmail(signupData);
        if (res.success) {
          setSuccess('Account created successfully!');
          setTimeout(() => {
            if (res.user.role === 'officer') {
              navigate('/officer');
            } else {
              navigate('/passenger');
            }
          }, 1500);
        } else {
          setError(res.error || 'Signup failed.');
        }
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!forgotEmail) {
      setError('Please enter your email.');
      return;
    }
    
    try {
      // API call to forgot password mock
      const res = await fetch('http://localhost:5002/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message || 'Reset link sent!');
        setTimeout(() => setShowForgot(false), 2000);
      } else {
        setError(data.message || 'Forgot password request failed.');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans p-6 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.06),transparent_40%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(30,58,138,0.06),transparent_40%)] pointer-events-none" />

      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        
        {/* Header Branding */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block bg-red-600 text-white font-black text-sm px-3 py-1 rounded tracking-widest uppercase mb-4 shadow-lg shadow-red-600/10">
            Rail Madad AI
          </Link>
          <h2 className="text-2xl font-black tracking-tight text-white">
            {showForgot ? 'Reset Password' : isLogin ? 'Access Portal' : 'Create Account'}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {showForgot ? 'Enter your email to receive recovery link' : 'AI-Powered Railway Grievance Platform'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm mb-6 flex items-center space-x-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-sm mb-6 flex items-center space-x-2 animate-pulse">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{success}</span>
          </div>
        )}

        {showForgot ? (
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Registered Email</label>
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="passenger@railmadad.gov.in"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition text-white"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition text-sm flex items-center justify-center shadow-lg shadow-red-600/10"
            >
              Send Reset Link
            </button>
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowForgot(false)}
                className="text-slate-400 hover:text-white text-xs underline"
              >
                Back to Login
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Form Toggle: Passenger / Officer (Only on Sign Up) */}
            {!isLogin && (
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setRole('passenger')}
                  className={`py-2 text-xs font-bold rounded-lg transition ${role === 'passenger' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Passenger
                </button>
                <button
                  type="button"
                  onClick={() => setRole('officer')}
                  className={`py-2 text-xs font-bold rounded-lg transition ${role === 'officer' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Officer
                </button>
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rahul Kumar"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition text-white"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@railmadad.gov.in"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition text-white"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition text-white"
                />
              </div>
            )}

            {/* Officer Specific Fields */}
            {!isLogin && role === 'officer' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 pt-1"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition text-white"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assigned Zone / Station / Train</label>
                  <input
                    type="text"
                    required
                    value={assignedZone}
                    onChange={(e) => setAssignedZone(e.target.value)}
                    placeholder="e.g. Train 12951, NDLS Station"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition text-white"
                  />
                </div>
              </motion.div>
            )}

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-red-500 hover:text-red-400 text-xs font-medium"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition text-sm flex items-center justify-center shadow-lg shadow-red-600/10 mt-6"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-t-2 border-r-2 border-white rounded-full animate-spin" />
              ) : (
                isLogin ? 'Access Dashboard' : 'Complete Setup'
              )}
            </button>

            {/* Mode Switcher */}
            <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-800/60">
              {isLogin ? (
                <span>
                  New to Rail Madad?{' '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className="text-red-500 hover:underline font-bold"
                  >
                    Create Account
                  </button>
                </span>
              ) : (
                <span>
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className="text-red-500 hover:underline font-bold"
                  >
                    Login here
                  </button>
                </span>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
