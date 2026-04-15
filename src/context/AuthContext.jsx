import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getApiErrorMessage } from '../lib/api';

const TOKEN_KEY = 'hireboard_access_token';
const USER_KEY = 'hireboard_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (accessToken) {
      localStorage.setItem(TOKEN_KEY, accessToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [accessToken]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  const login = useCallback(async (payload) => {
    try {
      const response = await api.post('/auth/login', payload);
      const data = response.data?.data ?? {};
      setAccessToken(data.accessToken ?? null);
      setUser(data.user ?? null);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: getApiErrorMessage(error) };
    }
  }, []);

  const register = useCallback(async (payload) => {
    try {
      const response = await api.post('/auth/register', payload);
      const data = response.data?.data ?? {};
      setAccessToken(data.accessToken ?? null);
      setUser(data.user ?? null);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: getApiErrorMessage(error) };
    }
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = Boolean(accessToken);

  const value = useMemo(
    () => ({
      accessToken,
      user,
      isAuthenticated,
      login,
      register,
      logout,
    }),
    [accessToken, user, isAuthenticated, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }
  return context;
}
