import { VolunteerTask, VolunteerStats } from '../types/volunteer';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

function getBaseUrl(): string | null {
  if (!API_URL || API_URL.trim() === '') return null;
  return API_URL.replace(/\/$/, '');
}

async function http<T>(path: string, options?: RequestInit): Promise<T> {
  const base = getBaseUrl();
  if (!base) throw new Error('API URL not configured');
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Request failed (${res.status}): ${text || res.statusText}`);
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

export const VolunteerApi = {
  isEnabled(): boolean {
    return !!getBaseUrl();
  },

  async getTasks(): Promise<VolunteerTask[]> {
    return await httpWithAuth<VolunteerTask[]>('/api/volunteer/tasks');
  },

  async getTask(taskId: string): Promise<VolunteerTask> {
    return await httpWithAuth<VolunteerTask>(`/api/volunteer/tasks/${taskId}`);
  },

  async createTask(task: Omit<VolunteerTask, 'id'>): Promise<VolunteerTask> {
    return await httpWithAuth<VolunteerTask>('/api/volunteer/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  },

  async updateTaskStatus(taskId: string, status: VolunteerTask['status']): Promise<VolunteerTask> {
    return await httpWithAuth<VolunteerTask>(`/api/volunteer/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async rescheduleTask(taskId: string, pickupTime: string, deliveryTime?: string): Promise<VolunteerTask> {
    return await httpWithAuth<VolunteerTask>(`/api/volunteer/tasks/${taskId}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify({ pickupTime, deliveryTime }),
    });
  },

  async getStats(): Promise<VolunteerStats> {
    return await httpWithAuth<VolunteerStats>('/api/volunteer/stats');
  },

  async getClaimedDonations(page: number = 1, limit: number = 20): Promise<{
    donations: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const response = await httpWithAuth<any>(`/api/volunteer/claimed-donations?page=${page}&limit=${limit}`);
    // The backend returns { success: true, data: { donations: [], pagination: {} } }
    return response.data || response;
  },

  async acceptDonation(donationId: string): Promise<any> {
    return await httpWithAuth<any>('/api/volunteer/accept-donation', {
      method: 'POST',
      body: JSON.stringify({ donationId }),
    });
  },
};


