// contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import {data} from '../../config';

const BASE_URL = data.BASE_URL;
const AuthContext = createContext({});

// SecureStore wrapper with error handling
const secureStorage = {
  setItem: async (key, value) => {
    try {
      await SecureStore.setItemAsync(key, value);
      console.log(`✅ Stored ${key} successfully`);
      return true;
    } catch (error) {
      console.warn(`⚠️ Failed to store ${key}:`, error.message);
      return false;
    }
  },
  
  getItem: async (key) => {
    try {
      const value = await SecureStore.getItemAsync(key);
      console.log(`📖 Retrieved ${key}:`, value ? 'Found' : 'Not found');
      return value;
    } catch (error) {
      console.warn(`⚠️ Failed to retrieve ${key}:`, error.message);
      return null;
    }
  },
  
  deleteItem: async (key) => {
    try {
      await SecureStore.deleteItemAsync(key);
      console.log(`🗑️ Deleted ${key} successfully`);
      return true;
    } catch (error) {
      console.warn(`⚠️ Failed to delete ${key}:`, error.message);
      return false;
    }
  },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState(null);

  // Load user data from storage on app start
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      console.log('Loading user data from storage...');
      
      // Try both 'access' and 'authToken' keys for backward compatibility
      let token = await secureStorage.getItem('access');
      if (!token) {
        token = await secureStorage.getItem('authToken');
      }
      
      const userData = await secureStorage.getItem('userData');
      
      console.log('Token found:', !!token);
      console.log('UserData found:', !!userData);
      
      if (token && userData) {
        setAuthToken(token);
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
        console.log('User authenticated successfully');
      } else {
        console.log('No authentication data found');
        setIsAuthenticated(false);
        setAuthToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setIsAuthenticated(false);
      setAuthToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Login function - Updated to match your API response
  const login = async (email, password) => {
    try {
      console.log('Attempting login with email:', email);
      const loginUrl = `${BASE_URL}/auth/api/login`;
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password,
        }),
      });
      
      const data = await response.json();
      console.log('Login response status:', response.status);
      console.log('Login response data:', JSON.stringify(data, null, 2));
      
      if (response.ok) {
        // Store access token (from your API response)
        const accessToken = data.access;
        if (accessToken) {
          await secureStorage.setItem('access', accessToken);
          setAuthToken(accessToken);
          console.log('Access token stored successfully');
        }
        
        // Store refresh token if available
        if (data.refresh) {
          await secureStorage.setItem('refreshToken', data.refresh);
        }
        
        // Store user data - structure from your API
        const userData = {
          id: data.user?.id || null,
          username: data.user?.username || '',
          email: data.user?.email || email,
          img: data.user?.img || null,
          first_name: data.user?.first_name || '',
          last_name: data.user?.last_name || '',
          is_staff: data.user?.is_staff || false,
        };
        
        console.log('Storing user data:', userData);
        await secureStorage.setItem('userData', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
        
        console.log('Login successful, isAuthenticated set to true');
        return { success: true, data: userData };
      } else {
        const errorMessage = data.error || data.message || 'Invalid email or password';
        console.log('Login failed:', errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Failed to connect to server';
      if (error.message === 'Network request failed') {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await secureStorage.deleteItem('access');
      await secureStorage.deleteItem('authToken');
      await secureStorage.deleteItem('userData');
      await secureStorage.deleteItem('refreshToken');
      setAuthToken(null);
      setUser(null);
      setIsAuthenticated(false);
      console.log('Logout successful');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  };

  // Update user data
  const updateUserData = async (updatedData) => {
    try {
      const newUserData = { ...user, ...updatedData };
      await secureStorage.setItem('userData', JSON.stringify(newUserData));
      setUser(newUserData);
      return { success: true };
    } catch (error) {
      console.error('Error updating user data:', error);
      return { success: false, error: error.message };
    }
  };

  // Get user email
  const getUserEmail = () => {
    return user?.email || null;
  };

  // Get username
  const getUsername = () => {
    return user?.username || user?.email?.split('@')[0] || null;
  };

  // Get user full name
  const getUserFullName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.first_name || user?.username || getUsername();
  };

  // Get user avatar/image
  const getUserAvatar = () => {
    if (user?.img) {
      // Check if it's a full URL or relative path
      if (user.img.startsWith('http')) {
        return user.img;
      }
      return `${BASE_URL}${user.img}`;
    }
    return null;
  };

  // Get user initials for avatar placeholder
  const getUserInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user?.first_name) {
      return user.first_name[0].toUpperCase();
    }
    if (user?.username) {
      return user.username[0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  // Get user ID
  const getUserId = () => {
    return user?.id || null;
  };

  // Get auth token
  const getAuthToken = () => {
    return authToken;
  };

  // Check if user is staff/admin
  const isStaff = () => {
    return user?.is_staff === true;
  };

  // Get user's display name
  const getDisplayName = () => {
    if (user?.first_name) {
      return user.first_name;
    }
    if (user?.username) {
      return user.username;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  // Get complete user object
  const getUser = () => {
    return user;
  };

  // Check if user is authenticated - FIXED: Don't require token for authentication status
  const isUserAuthenticated = () => {
    // Since we have user data and isAuthenticated state, token check is redundant
    // But let's keep both for consistency
    const authenticated = isAuthenticated === true && user !== null;
    console.log('isUserAuthenticated called. State:', { 
      isAuthenticated, 
      hasToken: !!authToken, 
      hasUser: !!user,
      result: authenticated 
    });
    return authenticated;
  };

  // Force refresh user data from storage
  const refreshAuthState = async () => {
    await loadUserData();
  };

  const value = {
    // State
    user,
    isAuthenticated,
    isLoading,
    authToken,
    
    // Authentication functions
    login,
    logout,
    updateUserData,
    refreshAuthState,
    
    // Getter functions
    getUser,
    getUserEmail,
    getUsername,
    getUserFullName,
    getUserAvatar,
    getUserInitials,
    getUserId,
    getAuthToken,
    getDisplayName,
    
    // Check functions
    isUserAuthenticated,
    isStaff,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper functions for non-React contexts
export const checkAuthStatus = async () => {
  try {
    const token = await secureStorage.getItem('access');
    const userData = await secureStorage.getItem('userData');
    return !!(token && userData);
  } catch (error) {
    console.error('Error checking auth status:', error);
    return false;
  }
};

export const getStoredAuthToken = async () => {
  try {
    let token = await secureStorage.getItem('access');
    if (!token) {
      token = await secureStorage.getItem('authToken');
    }
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const getStoredUserData = async () => {
  try {
    const userData = await secureStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

export default AuthProvider;