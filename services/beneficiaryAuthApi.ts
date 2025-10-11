import { BeneficiaryLoginCredentials, BeneficiaryRegisterData, BeneficiaryUser } from '../types/beneficiaryAuth';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresAt: number;
  user: BeneficiaryUser;
}

function getBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_URL || 'http://172.28.27.15:4000';
}

async function http<T>(path: string, options?: RequestInit): Promise<T> {
  const base = getBaseUrl();
  if (!base) throw new Error('API URL not configured');
  
  const res = await fetch(`${base}${path}`, {
    headers: { 
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || res.statusText);
  }

  return res.json() as Promise<T>;
}

export const BeneficiaryAuthApi = {
  async login(credentials: BeneficiaryLoginCredentials): Promise<AuthResponse> {
    return http<AuthResponse>('/api/auth/beneficiary/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      headers: {
        'Content-Type': 'application/json' 
      }
    });
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