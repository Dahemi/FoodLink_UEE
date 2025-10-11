import {
  LoginCredentials,
  DonorRegisterData,
  DonorUser,
} from '../types/donorAuth';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresAt: number;
  user: DonorUser;
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
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const errorData = text ? JSON.parse(text) : {};
    throw new Error(
      errorData.message || `Request failed (${res.status}): ${res.statusText}`
    );
  }

  return (await res.json()) as T;
}

async function httpWithAuth<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const base = getBaseUrl();
  if (!base) throw new Error('API URL not configured');

  // Get token from storage
  const AsyncStorage =
    require('@react-native-async-storage/async-storage').default;
  const authDataStr = await AsyncStorage.getItem('@donor_auth');
  const authData = authDataStr ? JSON.parse(authDataStr) : null;
  const token = authData?.token;

  if (!token) {
    throw new Error('No authentication token available');
  }

  const res = await fetch(`${base}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const errorData = text ? JSON.parse(text) : {};
    throw new Error(
      errorData.message || `Request failed (${res.status}): ${res.statusText}`
    );
  }

  return (await res.json()) as T;
}

export const DonorAuthApi = {
  isEnabled(): boolean {
    return !!getBaseUrl();
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return await http<AuthResponse>('/api/auth/donor/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async register(data: DonorRegisterData): Promise<AuthResponse> {
    return await http<AuthResponse>('/api/auth/donor/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async logout(): Promise<void> {
    return await httpWithAuth<void>('/api/auth/donor/logout', {
      method: 'POST',
    });
  },

  async getProfile(): Promise<DonorUser> {
    return await httpWithAuth<DonorUser>('/api/auth/donor/profile', {
      method: 'GET',
    });
  },

  async updateProfile(data: Partial<DonorUser>): Promise<DonorUser> {
    return await httpWithAuth<DonorUser>('/api/auth/donor/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async refreshToken(
    refreshToken: string
  ): Promise<{ token: string; expiresAt: number; refreshToken: string }> {
    return await http<{
      token: string;
      expiresAt: number;
      refreshToken: string;
    }>('/api/auth/donor/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  async forgotPassword(email: string): Promise<void> {
    return await http<void>('/api/auth/donor/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    return await http<void>('/api/auth/donor/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },
};
