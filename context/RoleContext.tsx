import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Role = 'volunteer' | 'donor' | 'ngo' | 'beneficiary' | null;

interface RoleContextType {
  selectedRole: Role;
  setRole: (role: Role) => void;
  clearRole: () => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const ROLE_STORAGE_KEY = '@selected_role';

export const RoleProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredRole();
  }, []);

  const loadStoredRole = async () => {
    try {
      const storedRole = await AsyncStorage.getItem(ROLE_STORAGE_KEY);
      if (storedRole) {
        setSelectedRole(storedRole as Role);
        console.log('📌 Loaded stored role:', storedRole);
      }
    } catch (error) {
      console.error('Error loading stored role:', error);
    } finally {
      setLoading(false);
    }
  };

  const setRole = async (role: Role) => {
    try {
      setSelectedRole(role);
      if (role) {
        await AsyncStorage.setItem(ROLE_STORAGE_KEY, role);
        console.log('💾 Saved role:', role);
      } else {
        await AsyncStorage.removeItem(ROLE_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error saving role:', error);
    }
  };

  const clearRole = async () => {
    try {
      setSelectedRole(null);
      await AsyncStorage.removeItem(ROLE_STORAGE_KEY);
      console.log('🗑️ Cleared role');
    } catch (error) {
      console.error('Error clearing role:', error);
    }
  };

  if (loading) {
    return null; // or a loading spinner
  }

  return (
    <RoleContext.Provider value={{ selectedRole, setRole, clearRole }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
