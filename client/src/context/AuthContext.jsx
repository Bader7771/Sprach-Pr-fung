import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import http from '../api/http.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('sms_token'));
  const [admin, setAdmin] = useState(() => {
    const stored = localStorage.getItem('sms_admin');
    try {
      return stored ? JSON.parse(stored) : null;
    } catch {
      localStorage.removeItem('sms_admin');
      return null;
    }
  });

  async function login(email, password) {
    const { data } = await http.post('/auth/login', { email, password });
    const user = data.user || data.admin;
    localStorage.setItem('sms_token', data.token);
    localStorage.setItem('sms_admin', JSON.stringify(user));
    setToken(data.token);
    setAdmin(user);
  }

  function logout() {
    localStorage.removeItem('sms_token');
    localStorage.removeItem('sms_admin');
    setToken(null);
    setAdmin(null);
  }

  useEffect(() => {
    window.addEventListener('sms:unauthorized', logout);
    return () => window.removeEventListener('sms:unauthorized', logout);
  }, []);

  const value = useMemo(() => ({ token, admin, login, logout }), [token, admin]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
