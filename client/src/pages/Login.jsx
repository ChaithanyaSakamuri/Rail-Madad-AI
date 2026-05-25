import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Mail, Lock, User, Building, ArrowRight } from 'lucide-react';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isRegister) {
        const response = await api.post('/auth/signup', { name, email, password, company });
        login(response.data.user, response.data.token);
        navigate('/dashboard');
      } else {
        const response = await api.post('/auth/login', { email, password });
        login(response.data.user, response.data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || (isRegister ? 'Registration failed' : 'Login failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsRegister(!isRegister);
    setError('');
    setName('');
    setCompany('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden"
      >
        {/* Glow effect */}
        <div className="absolute -top-12 -left-12 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl"></div>

        <h1 className="text-3xl font-bold text-white mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          SmartStore AI
        </h1>
        <p className="text-gray-400 text-center mb-8">
          {isRegister ? 'Create an account to start shopping' : 'Dashboard, Analytics & Retail Catalog'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isRegister && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="space-y-4 overflow-hidden"
              >
                <div className="relative">
                  <User className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-blue-500 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none transition-colors"
                    required={isRegister}
                  />
                </div>

                <div className="relative">
                  <Building className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Company Name (Optional)"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-blue-500 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none transition-colors"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-blue-500 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none transition-colors"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-blue-500 rounded-lg pl-11 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none transition-colors"
              required
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 group"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                {isRegister ? 'Create Account' : 'Sign In'}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={handleToggleMode}
            className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
          </button>
        </div>

        {!isRegister && (
          <div className="mt-6 border-t border-white/10 pt-4 text-center">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Demo Credentials</p>
            <div className="inline-block bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 text-left text-xs text-gray-400">
              <span className="font-semibold text-gray-300">Admin:</span> admin@smartstore.ai / Admin@123
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
