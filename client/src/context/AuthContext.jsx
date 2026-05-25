import { createContext, useState, useCallback, useEffect, useContext } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  // Set local session
  const setSession = useCallback((userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
  }, []);

  // Clear session
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Backend logout call failed, cleaning up locally anyway.');
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  }, []);

  // Restore session from localStorage on mount
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data);
          setToken(storedToken);
        } catch {
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };
    restoreSession();
  }, []);

  // Email Sign-In
  const signInWithEmail = useCallback(async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      setSession(response.data.user, response.data.token);
      return { success: true, user: response.data.user };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }, [setSession]);

  // Email Sign-Up
  const signUpWithEmail = useCallback(async (signupData) => {
    try {
      const response = await api.post('/auth/signup', signupData);
      setSession(response.data.user, response.data.token);
      return { success: true, user: response.data.user };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }, [setSession]);

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    isOfficer: user?.role === 'officer',
    signInWithEmail,
    signUpWithEmail,
    logout,
    setSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
