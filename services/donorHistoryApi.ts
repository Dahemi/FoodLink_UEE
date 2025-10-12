const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface DonationHistory {
  _id: string;
  title: string;
  status: 'available' | 'claimed' | 'pickup_scheduled' | 'picked_up' | 'delivered' | 'expired' | 'cancelled';
  foodDetails: {
    type: string;
    category: string;
    quantity: string;
    estimatedServings: number;
  };
  pickupSchedule: {
    urgency: string;
  };
  claimedBy?: {
    _id: string;
    name: string;
    organizationType: string;
  };
  createdAt: string;
  expiryDateTime: string;
  claimedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  images?: string[];
}

interface HistoryStats {
  totalDonations: number;
  activeDonations: number;
  completedDonations: number;
  totalServings: number;
  totalImpact: number;
}

interface HistoryResponse {
  donations: DonationHistory[];
  stats: HistoryStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function getBaseUrl(): string | null {
  if (!API_URL || API_URL.trim() === '') return null;
  return API_URL.replace(/\/$/, '');
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

  const jsonData = await res.json();
  return jsonData.data || jsonData;
}

export const DonorHistoryApi = {
  isEnabled(): boolean {
    return !!getBaseUrl();
  },

  async getDonationHistory(params?: {
    page?: number;
    limit?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<HistoryResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);

    const queryString = queryParams.toString();
    const path = `/api/donations/donor/history${queryString ? `?${queryString}` : ''}`;

    return await httpWithAuth<HistoryResponse>(path, { method: 'GET' });
  },

  async getDonationStats(): Promise<HistoryStats> {
    return await httpWithAuth<HistoryStats>('/api/donations/donor/stats', {
      method: 'GET',
    });
  },
};
