export interface BeneficiaryUser {
  id: string;
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
  householdSize: number;
  dietaryRestrictions: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  verificationStatus: 'pending' | 'verified' | 'rejected';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BeneficiaryLoginCredentials {
  email: string;
  password: string;
}

export interface BeneficiaryRegisterData {
  email: string;
  password: string;
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
  householdSize: number;
  dietaryRestrictions: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}