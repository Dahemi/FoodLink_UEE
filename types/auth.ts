export interface VolunteerUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  vehicleType?: 'bike' | 'car' | 'van' | 'walking';
  availability: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  preferredTimeSlots: string[];
  maxDistance: number; // in km
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: VolunteerUser | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone: string;
  address: string;
  vehicleType?: 'bike' | 'car' | 'van' | 'walking';
  availability: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  preferredTimeSlots: string[];
  maxDistance: number;
}

export interface AuthContextType {
  authState: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<VolunteerUser>) => Promise<void>;
  refreshToken: () => Promise<void>;
}
