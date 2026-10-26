import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const token = localStorage.getItem('smartquiz_token');
    const storedUser = localStorage.getItem('smartquiz_user');
    if (!token || !storedUser) return null;

    const user = JSON.parse(storedUser);
    if (!user || !Number.isInteger(user.id) || !['student', 'admin'].includes(user.role)) {
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  useEffect(() => {
    function handleUnauthorized() {
      setUser(null);
    }

    window.addEventListener('smartquiz:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('smartquiz:unauthorized', handleUnauthorized);
  }, []);

  function login(token, userData) {
    if (
      typeof token !== 'string' ||
      !token ||
      !userData ||
      !Number.isInteger(userData.id) ||
      !['student', 'admin'].includes(userData.role)
    ) {
      throw new Error('A valid authentication token and user profile are required.');
    }

    localStorage.setItem('smartquiz_token', token);
    localStorage.setItem('smartquiz_user', JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('smartquiz_token');
    localStorage.removeItem('smartquiz_user');
    setUser(null);
  }

  const value = useMemo(() => ({ user, login, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
