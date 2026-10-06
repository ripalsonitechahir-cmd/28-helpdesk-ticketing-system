import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api, session } from './api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [agent, setAgent] = useState(() => session.get()?.agent ?? null);

  const value = useMemo(() => {
    const logout = () => {
      session.clear();
      setAgent(null);
    };
    return {
      agent,
      logout,
      login: async (credentials) => {
        const { token, agent: me } = await api.login(credentials);
        session.set({ token, agent: me });
        setAgent(me);
      },
    };
  }, [agent]);

  // The API client fires this when a stored token is rejected.
  useEffect(() => {
    window.addEventListener('auth:expired', value.logout);
    return () => window.removeEventListener('auth:expired', value.logout);
  }, [value]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function RequireAgent({ children }) {
  const { agent } = useAuth();
  return agent ? children : <Navigate to="/login" replace />;
}
