import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContextType, AuthState, LoginCredentials, RegisterData, VolunteerUser } from '../types/auth';
import { VolunteerAuthApi } from '../services/volunteerAuthApi';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const AUTH_STORAGE_KEY = '@volunteer_auth';
const USER_STORAGE_KEY = '@volunteer_user';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
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
        
        // Check if token is still valid (basic check)
        if (authData.token && authData.expiresAt > Date.now()) {
          setAuthState({
            isAuthenticated: true,
            user: userData,
            loading: false,
            error: null,
          });
        } else {
          // Token expired, clear storage
          await clearAuth();
        }
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      setAuthState(prev => ({ ...prev, loading: false, error: 'Failed to load authentication' }));
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

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await VolunteerAuthApi.login(credentials);
      
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
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await VolunteerAuthApi.register(data);
      
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
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      // Call logout API if needed
      try {
        await VolunteerAuthApi.logout();
      } catch (error) {
        console.warn('Logout API call failed:', error);
      }
      
      await clearAuth();
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear local auth even if API call fails
      await clearAuth();
    }
  };

  const updateProfile = async (data: Partial<VolunteerUser>): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const updatedUser = await VolunteerAuthApi.updateProfile(data);
      
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
        loading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      setAuthState(prev => ({
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
      const response = await VolunteerAuthApi.refreshToken(authData.refreshToken);
      
      const newAuthData = {
        token: response.token,
        expiresAt: response.expiresAt,
        refreshToken: response.refreshToken,
      };
      
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newAuthData));
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout user
      await logout();
    }
  };

  const value: AuthContextType = {
    authState,
    login,
    register,
    logout,
    updateProfile,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};