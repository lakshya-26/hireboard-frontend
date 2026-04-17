import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ACCESS_TOKEN_STORAGE_KEY, api, getApiErrorMessage } from '../lib/api';

const USER_KEY = 'hireboard_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() =>
    localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY),
  );
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    function onAccessTokenRefreshed(event) {
      const token = event.detail?.accessToken;
      if (token) setAccessToken(token);
    }
    function onSessionEnd() {
      setAccessToken(null);
      setUser(null);
    }
    window.addEventListener('hireboard:access-token', onAccessTokenRefreshed);
    window.addEventListener('hireboard:session-end', onSessionEnd);
    return () => {
      window.removeEventListener('hireboard:access-token', onAccessTokenRefreshed);
      window.removeEventListener('hireboard:session-end', onSessionEnd);
    };
  }, []);

  useEffect(() => {
    if (accessToken) {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
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
      if (data.accessToken) {
        setAccessToken(data.accessToken);
        setUser(data.user ?? null);
      }
      return { ok: true, message: response.data?.message };
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
