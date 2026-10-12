import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tried, setTried] = useState(false);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/admin/auth/login', { email, password });
    const { admin: data, token } = res.data.data;
    if (token) sessionStorage.setItem('tcs_admin_token', token);
    setAdmin(data);
    return data;
  }, []);

  // Firebase Google popup -> backend exchange. Only admin emails are admitted.
  const loginWithGoogle = useCallback(async () => {
    const { getGoogleIdToken } = await import('../services/firebase');
    const { idToken } = await getGoogleIdToken();
    const res = await api.post('/admin/auth/google', { idToken });
    const { admin: data, token } = res.data.data;
    if (token) sessionStorage.setItem('tcs_admin_token', token);
    setAdmin(data);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/admin/auth/logout');
    } catch (_err) {
      // Ignore network errors on logout.
    }
    sessionStorage.removeItem('tcs_admin_token');
    setAdmin(null);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get('/admin/auth/me');
        if (active) setAdmin(res.data.data.admin);
      } catch (_err) {
        if (active) setAdmin(null);
      } finally {
        if (active) {
          setLoading(false);
          setTried(true);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ admin, loading, tried, login, loginWithGoogle, logout, setAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}