export type UserRole = 'donor' | 'ngo' | 'volunteer' | 'beneficiary';

export interface RoleState {
  selectedRole: UserRole | null;
  loading: boolean;
}

export interface RoleContextType {
  selectedRole: UserRole | null;
  setRole: (role: UserRole) => void;
  clearRole: () => void;
}
