import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface ClaimHistory {
  _id: string;
  donationId: {
    _id: string;
    title: string;
    foodDetails: {
      type: string;
      category: string;
      quantity: string;
      estimatedServings: number;
      description: string;
    };
    pickupLocation: {
      address: string;
      city: string;
      state: string;
    };
    images?: string[];
  };
  donorId: {
    _id: string;
    name: string;
    businessName?: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'picked_up' | 'delivered' | 'cancelled';
  requestMessage?: string;
  pickupScheduledAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  beneficiariesServed?: number;
  volunteersInvolved?: number;
  distributionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface HistoryStats {
  totalClaims: number;
  approvedClaims: number;
  completedClaims: number;
  totalServings: number;
  totalBeneficiaries: number;
}

interface HistoryResponse {
  claims: ClaimHistory[];
  stats: HistoryStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function getBaseUrl(): string | null {
  if (!API_URL || API_URL.trim() === '') {
    console.warn('EXPO_PUBLIC_API_URL not configured');
    return null;
  }
  return API_URL.replace(/\/$/, '');
}

async function getNGOAuthToken(): Promise<string | null> {
  try {
    const tokenStr = await AsyncStorage.getItem('ngoAuthToken');
    if (!tokenStr) {
      console.error('No NGO auth token found');
      return null;
    }
    const tokenData = JSON.parse(tokenStr);
    return tokenData.accessToken;
  } catch (error) {
    console.error('Error getting NGO auth token:', error);
    return null;
  }
}

async function httpWithNGOAuth<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    throw new Error('API URL not configured');
  }

  const token = await getNGOAuthToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  const url = `${baseUrl}${path}`;
  console.log(`NGO History API Request: ${options?.method || 'GET'} ${url}`);

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || data;
}

export const NGOHistoryApi = {
  isEnabled(): boolean {
    const baseUrl = getBaseUrl();
    return baseUrl !== null;
  },

  async getClaimHistory(params?: {
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
    const path = `/api/donations/ngo/claims${queryString ? `?${queryString}` : ''}`;

    return httpWithNGOAuth<HistoryResponse>(path);
  },

  async getClaimStats(): Promise<HistoryStats> {
    return httpWithNGOAuth<HistoryStats>('/api/donations/ngo/stats');
  },

  async getClaimDetails(claimId: string): Promise<ClaimHistory> {
    return httpWithNGOAuth<ClaimHistory>(`/api/donations/${claimId}`);
  },
};
