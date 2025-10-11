import { BeneficiaryLoginCredentials, BeneficiaryRegisterData, BeneficiaryUser } from '../types/beneficiaryAuth';

interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresAt: number;
  user: BeneficiaryUser;
}

function getBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) throw new Error('API URL not configured');
  return url.trim();
}

async function http<T>(path: string, options?: RequestInit): Promise<T> {
  const base = getBaseUrl();
  
  try {
    const res = await fetch(`${base}${path}`, {
      headers: { 
        'Content-Type': 'application/json',
        ...(options?.headers || {}) 
      },
      ...options,
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.message || `Request failed (${res.status})`);
    }
    
    // Return the data field from the response
    return (data.data || data) as T;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

export const BeneficiaryAuthApi = {
  async login(credentials: BeneficiaryLoginCredentials): Promise<AuthResponse> {
    const response = await http<AuthResponse>('/api/auth/beneficiary/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    if (!response || !response.token || !response.user) {
      throw new Error('Invalid authentication response');
    }
    
    return response;
  },

  async register(data: BeneficiaryRegisterData): Promise<AuthResponse> {
    return http<AuthResponse>('/api/auth/beneficiary/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async logout(): Promise<void> {
    return http<void>('/api/auth/beneficiary/logout', {
      method: 'POST',
    });
  }
};