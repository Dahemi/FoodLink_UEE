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

export const VolunteerApi = {
  isEnabled(): boolean {
    return !!getBaseUrl();
  },

  async getTasks(): Promise<VolunteerTask[]> {
    return await http<VolunteerTask[]>('/api/tasks');
  },

  async getTask(taskId: string): Promise<VolunteerTask> {
    return await http<VolunteerTask>(`/api/tasks/${taskId}`);
  },

  async createTask(task: Omit<VolunteerTask, 'id'>): Promise<VolunteerTask> {
    return await http<VolunteerTask>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  },

  async updateTaskStatus(taskId: string, status: VolunteerTask['status']): Promise<VolunteerTask> {
    return await http<VolunteerTask>(`/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async rescheduleTask(taskId: string, pickupTime: string, deliveryTime?: string): Promise<VolunteerTask> {
    return await http<VolunteerTask>(`/api/tasks/${taskId}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify({ pickupTime, deliveryTime }),
    });
  },

  async getStats(): Promise<VolunteerStats> {
    return await http<VolunteerStats>('/api/stats');
  },
};


