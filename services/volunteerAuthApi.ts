import { LoginCredentials, RegisterData, VolunteerUser } from '../types/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresAt: number;
  user: VolunteerUser;
}

function getBaseUrl(): string | null {
  if (!API_URL || API_URL.trim() === '') return null;
  return API_URL.replace(/\/$/, '');
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
    const errorData = text ? JSON.parse(text) : {};
    throw new Error(errorData.message || `Request failed (${res.status}): ${res.statusText}`);
  }
  
  return (await res.json()) as T;
}

async function httpWithAuth<T>(path: string, options?: RequestInit): Promise<T> {
  const base = getBaseUrl();
  if (!base) throw new Error('API URL not configured');
  
  // Get token from storage
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  const authData = await AsyncStorage.getItem('@volunteer_auth');
  const token = authData ? JSON.parse(authData).token : null;
  
  if (!token) throw new Error('No authentication token found');
  
  const res = await fetch(`${base}${path}`, {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options?.headers || {}) 
    },
    ...options,
  });
  
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const errorData = text ? JSON.parse(text) : {};
    throw new Error(errorData.message || `Request failed (${res.status}): ${res.statusText}`);
  }
  
  return (await res.json()) as T;
}

export const VolunteerAuthApi = {
  isEnabled(): boolean {
    return !!getBaseUrl();
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return await http<AuthResponse>('/api/auth/volunteer/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    return await http<AuthResponse>('/api/auth/volunteer/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async logout(): Promise<void> {
    return await httpWithAuth<void>('/api/auth/volunteer/logout', {
      method: 'POST',
    });
  },

  async updateProfile(data: Partial<VolunteerUser>): Promise<VolunteerUser> {
    return await httpWithAuth<VolunteerUser>('/api/auth/volunteer/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async refreshToken(refreshToken: string): Promise<{ token: string; expiresAt: number; refreshToken: string }> {
    return await http<{ token: string; expiresAt: number; refreshToken: string }>('/api/auth/volunteer/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  async verifyEmail(token: string): Promise<void> {
    return await http<void>(`/api/auth/volunteer/verify-email?token=${token}`, {
      method: 'POST',
    });
  },

  async resendVerificationEmail(): Promise<void> {
    return await httpWithAuth<void>('/api/auth/volunteer/resend-verification', {
      method: 'POST',
    });
  },

  async forgotPassword(email: string): Promise<void> {
    return await http<void>('/api/auth/volunteer/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    return await http<void>('/api/auth/volunteer/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },
};
