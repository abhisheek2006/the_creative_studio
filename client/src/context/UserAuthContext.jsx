import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import api from '../services/api';

const UserAuthContext = createContext(null);

export function UserAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    const res = await api.get('/auth/me');
    setUser(res.data.data.user);
    return res.data.data.user;
  }, []);

  // Firebase Google popup -> backend exchange. Anyone can create an account.
  const loginWithGoogle = useCallback(async () => {
    const { getGoogleIdToken } = await import('../services/firebase');
    const { idToken } = await getGoogleIdToken();
    const res = await api.post('/auth/google', { idToken });
    const { user: data, token } = res.data.data;
    if (token) sessionStorage.setItem('tcs_user_token', token);
    setUser(data);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (_err) {
      // Ignore network errors on logout.
    }
    sessionStorage.removeItem('tcs_user_token');
    try {
      const { signOutFirebase } = await import('../services/firebase');
      await signOutFirebase();
    } catch (_err) {
      // Firebase may be unavailable; the local session is cleared regardless.
    }
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get('/auth/me');
        if (active) setUser(res.data.data.user);
      } catch (_err) {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <UserAuthContext.Provider value={{ user, loading, loginWithGoogle, logout, refreshMe, setUser }}>
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  const ctx = useContext(UserAuthContext);
  if (!ctx) throw new Error('useUserAuth must be used inside UserAuthProvider');
  return ctx;
}