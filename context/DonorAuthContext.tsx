import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DonorAuthContextType,
  DonorAuthState,
  DonorLoginCredentials,
  DonorRegisterData,
  DonorUser,
} from '../types/donor';
import { DonorAuthApi } from '../services/donorAuthApi';

const DonorAuthContext = createContext<DonorAuthContextType | undefined>(
  undefined
);

interface DonorAuthProviderProps {
  children: ReactNode;
}

const AUTH_STORAGE_KEY = '@donor_auth';
const USER_STORAGE_KEY = '@donor_user';

export const DonorAuthProvider: React.FC<DonorAuthProviderProps> = ({
  children,
}) => {
  const [authState, setAuthState] = useState<DonorAuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async (): Promise<void> => {
    try {
      const [storedAuth, storedUser] = await Promise.all([
        AsyncStorage.getItem(AUTH_STORAGE_KEY),
        AsyncStorage.getItem(USER_STORAGE_KEY),
      ]);

      if (storedAuth && storedUser) {
        const authData = JSON.parse(storedAuth);
        const userData = JSON.parse(storedUser);

        // Check if token is expired
        if (authData.expiresAt && Date.now() < authData.expiresAt) {
          setAuthState({
            isAuthenticated: true,
            user: userData,
            loading: false,
            error: null,
          });
        } else {
          // Try to refresh token
          try {
            await refreshToken();
          } catch {
            await clearAuth();
          }
        }
      } else {
        setAuthState((prev) => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      setAuthState((prev) => ({ ...prev, loading: false }));
    }
  };

  const clearAuth = async (): Promise<void> => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(AUTH_STORAGE_KEY),
        AsyncStorage.removeItem(USER_STORAGE_KEY),
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

  const login = async (credentials: DonorLoginCredentials): Promise<void> => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await DonorAuthApi.login(credentials);

      // Store auth data
      const authData = {
        token: response.token,
        expiresAt: response.expiresAt,
        refreshToken: response.refreshToken,
      };

      await Promise.all([
        AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData)),
        AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user)),
      ]);

      setAuthState({
        isAuthenticated: true,
        user: response.user,
        loading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Login failed';
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  const register = async (data: DonorRegisterData): Promise<void> => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await DonorAuthApi.register(data);

      // Store auth data
      const authData = {
        token: response.token,
        expiresAt: response.expiresAt,
        refreshToken: response.refreshToken,
      };

      await Promise.all([
        AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData)),
        AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user)),
      ]);

      setAuthState({
        isAuthenticated: true,
        user: response.user,
        loading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Registration failed';
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (DonorAuthApi.isEnabled()) {
        await DonorAuthApi.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await clearAuth();
    }
  };

  const updateProfile = async (data: Partial<DonorUser>): Promise<void> => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      const updatedUser = await DonorAuthApi.updateProfile(data);

      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));

      setAuthState((prev) => ({
        ...prev,
        user: updatedUser,
        loading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Profile update failed';
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      const storedAuth = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (!storedAuth) return;

      const authData = JSON.parse(storedAuth);
      const response = await DonorAuthApi.refreshToken(authData.refreshToken);

      const newAuthData = {
        token: response.token,
        expiresAt: response.expiresAt,
        refreshToken: response.refreshToken,
      };

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newAuthData));
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
    }
  };

  const value: DonorAuthContextType = {
    authState,
    login,
    register,
    logout,
    updateProfile,
    refreshToken,
  };

  return (
    <DonorAuthContext.Provider value={value}>
      {children}
    </DonorAuthContext.Provider>
  );
};

export const useDonorAuth = (): DonorAuthContextType => {
  const context = useContext(DonorAuthContext);
  if (!context) {
    throw new Error('useDonorAuth must be used within DonorAuthProvider');
  }
  return context;
};
