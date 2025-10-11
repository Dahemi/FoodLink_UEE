import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BeneficiaryAuthApi } from '../services/beneficiaryAuthApi';
import { BeneficiaryUser, BeneficiaryLoginCredentials, BeneficiaryRegisterData } from '../types/beneficiaryAuth';

interface BeneficiaryAuthState {
  isAuthenticated: boolean;
  user: BeneficiaryUser | null;
  loading: boolean;
  error: string | null;
}

interface BeneficiaryAuthContextType {
  authState: BeneficiaryAuthState;
  login: (credentials: BeneficiaryLoginCredentials) => Promise<void>;
  register: (data: BeneficiaryRegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const BeneficiaryAuthContext = createContext<BeneficiaryAuthContextType | undefined>(undefined);

const BENEFICIARY_AUTH_KEY = '@beneficiary_auth';
const BENEFICIARY_USER_KEY = '@beneficiary_user';

export const BeneficiaryAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<BeneficiaryAuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedAuth, storedUser] = await Promise.all([
        AsyncStorage.getItem(BENEFICIARY_AUTH_KEY),
        AsyncStorage.getItem(BENEFICIARY_USER_KEY),
      ]);

      if (storedAuth && storedUser) {
        const authData = JSON.parse(storedAuth);
        const userData = JSON.parse(storedUser);

        if (authData.token && authData.expiresAt > Date.now()) {
          setAuthState({
            isAuthenticated: true,
            user: userData,
            loading: false,
            error: null,
          });
        } else {
          await clearAuth();
        }
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  const clearAuth = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(BENEFICIARY_AUTH_KEY),
        AsyncStorage.removeItem(BENEFICIARY_USER_KEY),
      ]);
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error clearing auth:', error);
    }
  };

  const login = async (credentials: BeneficiaryLoginCredentials) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      console.log('Attempting login...'); // Add logging
      const response = await BeneficiaryAuthApi.login(credentials);
      console.log('Login response:', response); // Add logging
      
      if (!response || !response.token || !response.user) {
        console.error('Invalid response structure:', response); // Add logging
        throw new Error('Invalid authentication response');
      }
      
      const authData = {
        token: response.token,
        expiresAt: response.expiresAt || Date.now() + (60 * 60 * 1000),
        refreshToken: response.refreshToken,
      };

      await AsyncStorage.setItem(BENEFICIARY_AUTH_KEY, JSON.stringify(authData));
      await AsyncStorage.setItem(BENEFICIARY_USER_KEY, JSON.stringify(response.user));

      setAuthState({
        isAuthenticated: true,
        user: response.user,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Login error:', error); // Add logging
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  const register = async (data: BeneficiaryRegisterData) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await BeneficiaryAuthApi.register(data);
      
      const authData = {
        token: response.token,
        expiresAt: response.expiresAt,
        refreshToken: response.refreshToken,
      };

      await Promise.all([
        AsyncStorage.setItem(BENEFICIARY_AUTH_KEY, JSON.stringify(authData)),
        AsyncStorage.setItem(BENEFICIARY_USER_KEY, JSON.stringify(response.user)),
      ]);

      setAuthState({
        isAuthenticated: true,
        user: response.user,
        loading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await BeneficiaryAuthApi.logout();
      await clearAuth();
    } catch (error) {
      console.error('Logout error:', error);
      await clearAuth();
    }
  };

  return (
    <BeneficiaryAuthContext.Provider value={{ authState, login, register, logout }}>
      {children}
    </BeneficiaryAuthContext.Provider>
  );
};

export const useBeneficiaryAuth = () => {
  const context = useContext(BeneficiaryAuthContext);
  if (!context) {
    throw new Error('useBeneficiaryAuth must be used within a BeneficiaryAuthProvider');
  }
  return context;
};