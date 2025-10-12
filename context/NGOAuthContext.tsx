import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NGOUser {
  _id: string;
  email: string;
  name: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  registrationNumber: string;
  organizationType: 'charity' | 'ngo' | 'religious' | 'community' | 'government';
  servingAreas: string[];
  capacity: number;
  operatingHours: {
    start: string;
    end: string;
  };
  website?: string;
  description?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NGOAuthState {
  isAuthenticated: boolean;
  user: NGOUser | null;
  loading: boolean;
  error: string | null;
}

interface NGOAuthContextType {
  authState: NGOAuthState;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  clearError: () => void;
}

const NGOAuthContext = createContext<NGOAuthContextType | undefined>(undefined);

export const useNGOAuth = (): NGOAuthContextType => {
  const context = useContext(NGOAuthContext);
  if (!context) {
    throw new Error('useNGOAuth must be used within an NGOAuthProvider');
  }
  return context;
};

export const NGOAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<NGOAuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
  });

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const tokenStr = await AsyncStorage.getItem('ngoAuthToken');
      const userData = await AsyncStorage.getItem('ngoUser');

      console.log('NGOAuth: Checking auth state:', { 
        hasToken: !!tokenStr, 
        hasUser: !!userData 
      });

      if (tokenStr && userData) {
        const tokenData = JSON.parse(tokenStr);
        const user = JSON.parse(userData);
        
        // Check if token is expired
        if (tokenData.expiresAt && Date.now() < tokenData.expiresAt) {
          setAuthState({
            isAuthenticated: true,
            user,
            loading: false,
            error: null,
          });
        } else {
          console.log('NGOAuth: Token expired, logging out');
          await logout();
        }
      } else {
        // Try legacy keys
        const legacyToken = await AsyncStorage.getItem('ngo_token');
        const legacyUserData = await AsyncStorage.getItem('ngo_user');
        
        if (legacyToken && legacyUserData) {
          console.log('NGOAuth: Found legacy tokens, migrating...');
          const user = JSON.parse(legacyUserData);
          
          // Migrate to new format
          await AsyncStorage.setItem('ngoAuthToken', JSON.stringify({
            accessToken: legacyToken,
            expiresAt: Date.now() + (24 * 60 * 60 * 1000)
          }));
          await AsyncStorage.setItem('ngoUser', legacyUserData);
          
          setAuthState({
            isAuthenticated: true,
            user,
            loading: false,
            error: null,
          });
        } else {
          setAuthState({
            isAuthenticated: false,
            user: null,
            loading: false,
            error: null,
          });
        }
      }
    } catch (error) {
      console.error('Auth state check error:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: 'Failed to restore authentication state',
      });
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log('NGOAuth: Attempting login with:', credentials.email); // Debug log
      console.log('NGOAuth: API URL:', API_URL); // Debug log
      
      const response = await fetch(`${API_URL}/api/auth/ngo/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      console.log('NGOAuth: Login response:', data); // Debug log

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Login failed');
      }

      // Handle different response structures
      const userData = data.data ? data.data.user : data.user;
      const token = data.data ? data.data.token : data.token;
      const refreshToken = data.data ? data.data.refreshToken : data.refreshToken;

      if (!userData || !token) {
        console.error('NGOAuth: Invalid response structure:', data);
        throw new Error('Invalid response from server');
      }

      // Store with consistent keys for NGO Donation API
      await AsyncStorage.setItem('ngoAuthToken', JSON.stringify({
        accessToken: token,
        refreshToken: refreshToken,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours from now
      }));
      await AsyncStorage.setItem('ngoUser', JSON.stringify(userData));
      
      // Keep legacy keys for backward compatibility
      await AsyncStorage.setItem('ngo_token', token);
      if (refreshToken) {
        await AsyncStorage.setItem('ngo_refresh_token', refreshToken);
      }
      await AsyncStorage.setItem('ngo_user', JSON.stringify(userData));

      console.log('NGOAuth: Setting auth state with user:', userData.name); // Debug log
      console.log('NGOAuth: Token stored successfully'); // Debug log

      setAuthState({
        isAuthenticated: true,
        user: userData,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('NGOAuth: Login error:', error); // Debug log
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }));
      throw error;
    }
  };

  const register = async (registrationData: any) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`${API_URL}/api/auth/ngo/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Extract token, refreshToken, and userData from response
      const userData = data.data ? data.data.user : data.user;
      const token = data.data ? data.data.token : data.token;
      const refreshToken = data.data ? data.data.refreshToken : data.refreshToken;

      await AsyncStorage.setItem('ngoAuthToken', JSON.stringify({
        accessToken: token,
        refreshToken: refreshToken,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours from now
      }));
      await AsyncStorage.setItem('ngoUser', JSON.stringify(userData));
      
      // Keep legacy keys for backward compatibility
      await AsyncStorage.setItem('ngo_token', token);
      if (refreshToken) {
        await AsyncStorage.setItem('ngo_refresh_token', refreshToken);
      }
      await AsyncStorage.setItem('ngo_user', JSON.stringify(userData));

      setAuthState({
        isAuthenticated: true,
        user: userData,
        loading: false,
        error: null,
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      const token = await AsyncStorage.getItem('ngo_token');
      
      if (token) {
        await fetch(`${API_URL}/api/auth/ngo/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout request error:', error);
    } finally {
      // Clear both new and legacy keys
      await AsyncStorage.multiRemove([
        'ngoAuthToken', 
        'ngoUser',
        'ngo_token', 
        'ngo_refresh_token', 
        'ngo_user'
      ]);
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      });
    }
  };

  const updateProfile = async (profileData: any) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const token = await AsyncStorage.getItem('ngo_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/api/auth/ngo/profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Profile update failed');
      }

      await AsyncStorage.setItem('ngo_user', JSON.stringify(data.data));

      setAuthState(prev => ({
        ...prev,
        user: data.data,
        loading: false,
        error: null,
      }));
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Profile update failed',
      }));
      throw error;
    }
  };

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  return (
    <NGOAuthContext.Provider
      value={{
        authState,
        login,
        register,
        logout,
        updateProfile,
        clearError,
      }}
    >
      {children}
    </NGOAuthContext.Provider>
  );
};