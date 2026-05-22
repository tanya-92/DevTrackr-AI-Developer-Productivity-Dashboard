import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const { data } = await api.post('/auth/login', { email, password });
      
      localStorage.setItem('user', JSON.stringify(data));
      localStorage.setItem('token', data.token);
      
      setUser(data);
      setError(null);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, githubUsername) => {
    try {
      setLoading(true);
      const { data } = await api.post('/auth/signup', { 
        name, email, password, githubUsername 
      });
      
      localStorage.setItem('user', JSON.stringify(data));
      localStorage.setItem('token', data.token);
      
      setUser(data);
      setError(null);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateGithubConnection = (githubUsername) => {
    const updatedUser = { ...user, githubUsername };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        error, 
        login, 
        register, 
        logout,
        updateGithubConnection 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
