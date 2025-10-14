import { BeneficiaryLoginCredentials, BeneficiaryRegisterData, BeneficiaryUser } from '../types/beneficiaryAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

async function httpWithAuth<T>(path: string, options?: RequestInit): Promise<T> {
  const base = getBaseUrl();
  if (!base) throw new Error('API URL not configured');

  // Try multiple keys (current and legacy) to resolve token
  const keys = ['@beneficiary_auth', 'beneficiaryAuthToken', 'beneficiary_token', 'authToken', 'beneficiary_auth'];
  let token: string | null = null;

  for (const k of keys) {
    try {
      const raw = await AsyncStorage.getItem(k);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        token = parsed?.token || parsed?.accessToken || parsed?.access_token || (typeof parsed === 'string' ? parsed : null);
      } catch {
        token = raw;
      }
      if (token) break;
    } catch {
      continue;
    }
  }

  if (!token) {
    throw new Error('No authentication token available');
  }

  const res = await fetch(`${base}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options?.headers || {})
    },
    ...options
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const message = (json && (json.message || json.error)) || `Request failed (${res.status})`;
    throw new Error(message);
  }

  // Normalize response shape to return data field when present
  return (json?.data || json) as T;
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
  },

  async updateProfile(data: Partial<BeneficiaryUser>): Promise<BeneficiaryUser> {
    return httpWithAuth<BeneficiaryUser>('/api/auth/beneficiary/profile', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }
};