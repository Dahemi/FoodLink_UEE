import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RoleContextType, UserRole } from '../types';

const RoleContext = createContext<RoleContextType | undefined>(undefined);

interface RoleProviderProps {
  children: ReactNode;
}

export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  useEffect(() => {
    loadStoredRole();
  }, []);

  const loadStoredRole = async (): Promise<void> => {
    try {
      const storedRole = await AsyncStorage.getItem('selectedRole');
      if (
        storedRole &&
        ['donor', 'ngo', 'volunteer', 'beneficiary'].includes(storedRole)
      ) {
        setSelectedRole(storedRole as UserRole);
      }
    } catch (error) {
      console.error('Error loading stored role:', error);
    }
  };

  const setRole = async (role: UserRole): Promise<void> => {
    try {
      setSelectedRole(role);
      await AsyncStorage.setItem('selectedRole', role);
    } catch (error) {
      console.error('Error storing role:', error);
    }
  };

  const clearRole = async (): Promise<void> => {
    try {
      setSelectedRole(null);
      await AsyncStorage.removeItem('selectedRole');
    } catch (error) {
      console.error('Error clearing role:', error);
    }
  };

  const value: RoleContextType = {
    selectedRole,
    setRole,
    clearRole,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
