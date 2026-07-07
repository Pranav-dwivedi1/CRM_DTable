import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuthLogout = () => {
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userInfo');
    };

    window.addEventListener('auth_logout', handleAuthLogout);

    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const info = localStorage.getItem('userInfo');
      
      if (token && info) {
        try {
          setUser(JSON.parse(info));
          // Soft check to verify session status
          await api.get('/company/settings');
          // Connect socket for existing session
          connectSocket();
        } catch (error) {
          // Failure will trigger auth_logout if 401 is received
          console.log('Session verification check failed');
        }
      }
      setLoading(false);
    };

    initAuth();

    return () => {
      window.removeEventListener('auth_logout', handleAuthLogout);
    };
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken, user: userInfo } = res.data;
    
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    setUser(userInfo);
    // Connect socket after successful login
    connectSocket();
    return res.data;
  };

  const registerCompany = async (companyName, adminName, adminEmail, adminPassword) => {
    const res = await api.post('/auth/register-company', {
      companyName,
      adminName,
      adminEmail,
      adminPassword,
    });
    return res.data;
  };

  const logout = async () => {
    disconnectSocket();
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout error response:', e);
    }
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userInfo');
  };

  const updateUserProfile = (newProfile) => {
    const updatedUser = { ...user, ...newProfile };
    localStorage.setItem('userInfo', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        registerCompany,
        logout,
        updateUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
