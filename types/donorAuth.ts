export interface DonorUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  donorType:
    | 'individual'
    | 'restaurant'
    | 'hotel'
    | 'catering'
    | 'grocery'
    | 'bakery'
    | 'other';
  businessName?: string;
  address: string;
  profileImage?: string;
  averageDonationFrequency?: 'daily' | 'weekly' | 'monthly' | 'occasional';
  preferredPickupTimes?: string[];
  specialInstructions?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DonorAuthState {
  isAuthenticated: boolean;
  user: DonorUser | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface DonorRegisterData {
  email: string;
  password: string;
  name: string;
  phone: string;
  donorType:
    | 'individual'
    | 'restaurant'
    | 'hotel'
    | 'catering'
    | 'grocery'
    | 'bakery'
    | 'other';
  businessName?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  averageDonationFrequency?: 'daily' | 'weekly' | 'monthly' | 'occasional';
  preferredPickupTimes?: string[];
  specialInstructions?: string;
}

export interface DonorAuthContextType {
  authState: DonorAuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: DonorRegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<DonorUser>) => Promise<void>;
  refreshToken: () => Promise<void>;
}
