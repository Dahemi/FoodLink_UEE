import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export interface ServerNotification {
  _id?: string;
  notificationId?: string;
  title: string;
  body: string;
  shortText?: string;
  type?: string;
  createdAt?: string;
  isRead?: boolean;
  recipientId?: string;
  recipientType?: string;
  data?: Record<string, any>;
}

function getBaseUrl(): string {
  if (!API_URL) throw new Error('API URL not configured');
  return API_URL.replace(/\/$/, '');
}

async function httpWithAuth<T>(path: string, options?: RequestInit): Promise<T> {
  const base = getBaseUrl();

  // Try to get token from various storage keys
  const keys = ['@beneficiary_auth', 'beneficiaryAuthToken', 'authToken'];
  let token = null;
  
  for (const k of keys) {
    try {
      const raw = await AsyncStorage.getItem(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      token = parsed?.token || parsed?.accessToken || (typeof parsed === 'string' ? parsed : null);
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

  if (!res.ok) {
    const text = await res.text();
    const error = text ? JSON.parse(text) : {};
    throw new Error(error.message || `Request failed (${res.status})`);
  }

  return (await res.json()).data || [];
}

export const NotificationApi = {
  async getNotifications(recipientId?: string, recipientType: string = 'beneficiary'): Promise<ServerNotification[]> {
    const query = new URLSearchParams();
    if (recipientId) query.set('recipientId', recipientId);
    query.set('recipientType', recipientType);
    return httpWithAuth<ServerNotification[]>(`/api/notifications?${query.toString()}`);
  },

  async markAsRead(notificationId: string): Promise<void> {
    await httpWithAuth(`/api/notifications/${notificationId}/mark-read`, {
      method: 'POST'
    });
  },

  async markMultipleAsRead(notificationIds: string[], recipientId?: string): Promise<void> {
    await httpWithAuth('/api/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ notificationIds, recipientId })
    });
  },

  async deleteAllForRecipient(recipientId: string, recipientType: string = 'beneficiary'): Promise<void> {
    await httpWithAuth('/api/notifications/clear', {
      method: 'POST',
      body: JSON.stringify({ recipientId, recipientType })
    });
  },

  async getDonationNotifications(beneficiaryId: string): Promise<ServerNotification[]> {
    const query = new URLSearchParams();
    query.set('recipientId', beneficiaryId);
    query.set('recipientType', 'beneficiary');
    query.set('type', 'donation_available');
    return httpWithAuth<ServerNotification[]>(`/api/notifications?${query.toString()}`);
  },

  async getAllBeneficiaryNotifications(): Promise<ServerNotification[]> {
    return httpWithAuth<ServerNotification[]>('/api/beneficiary-notifications/all');
  }
};