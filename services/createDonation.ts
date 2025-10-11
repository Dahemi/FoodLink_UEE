const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface DonationCreateData {
  title: string;
  foodDetails: {
    type: string;
    category: string;
    quantity: string;
    estimatedServings: number;
    description: string;
    ingredients?: string[];
    allergens?: string[];
    storageInstructions?: string;
  };
  images?: Array<{
    url: string;
    caption?: string;
    isPrimary?: boolean;
  }>;
  expiryDateTime: string;
  preparedDateTime?: string;
  pickupLocation: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  pickupSchedule: {
    availableFrom?: string;
    availableUntil?: string;
    urgency?: 'low' | 'medium' | 'high' | 'urgent';
    specialInstructions?: string;
  };
}

interface DonationResponse {
  _id: string;
  donorId: string;
  title: string;
  status: string;
  foodDetails: {
    type: string;
    category: string;
    quantity: string;
    estimatedServings: number;
    description: string;
    ingredients?: string[];
    allergens?: string[];
  };
  expiryDateTime: string;
  pickupLocation: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  pickupSchedule: {
    urgency: string;
    specialInstructions?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface PaginationResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function getBaseUrl(): string | null {
  if (!API_URL || API_URL.trim() === '') return null;
  return API_URL.replace(/\/$/, '');
}

async function getAuthToken(): Promise<string | null> {
  try {
    const AsyncStorage = (
      await import('@react-native-async-storage/async-storage')
    ).default;
    const authData = await AsyncStorage.getItem('@donor_auth');
    if (!authData) return null;
    const { token } = JSON.parse(authData);
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

async function httpWithAuth<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const base = getBaseUrl();
  if (!base) throw new Error('API URL not configured');

  const token = await getAuthToken();
  if (!token) throw new Error('No authentication token found');

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
    let errorMessage = `Request failed (${res.status}): ${res.statusText}`;

    try {
      const errorData = text ? JSON.parse(text) : {};
      errorMessage = errorData.message || errorData.error || errorMessage;

      // Handle validation errors
      if (errorData.errors) {
        const validationErrors = errorData.errors
          .map((e: any) => e.message || e)
          .join(', ');
        errorMessage = `Validation error: ${validationErrors}`;
      }
    } catch {
      // Use default error message if JSON parsing fails
    }

    throw new Error(errorMessage);
  }

  const response = await res.json();
  return response.data || response;
}

export const DonationApi = {
  isEnabled(): boolean {
    return !!getBaseUrl();
  },

  async createDonation(data: DonationCreateData): Promise<DonationResponse> {
    console.log('Creating donation with data:', JSON.stringify(data, null, 2));
    return await httpWithAuth<DonationResponse>('/api/donations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getDonations(params?: {
    page?: number;
    limit?: number;
    type?: string;
    category?: string;
    urgency?: string;
    status?: string;
  }): Promise<{
    donations: DonationResponse[];
    pagination: PaginationResponse;
  }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return await httpWithAuth<{
      donations: DonationResponse[];
      pagination: PaginationResponse;
    }>(`/api/donations${query}`);
  },

  async getDonation(id: string): Promise<DonationResponse> {
    return await httpWithAuth<DonationResponse>(`/api/donations/${id}`);
  },

  async updateDonation(
    id: string,
    data: Partial<DonationCreateData>
  ): Promise<DonationResponse> {
    return await httpWithAuth<DonationResponse>(`/api/donations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteDonation(id: string): Promise<void> {
    return await httpWithAuth<void>(`/api/donations/${id}`, {
      method: 'DELETE',
    });
  },

  async cancelDonation(
    id: string,
    reason: string,
    note?: string
  ): Promise<DonationResponse> {
    return await httpWithAuth<DonationResponse>(`/api/donations/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason, note }),
    });
  },

  async getMyDonations(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{
    donations: DonationResponse[];
    pagination: PaginationResponse;
  }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return await httpWithAuth<{
      donations: DonationResponse[];
      pagination: PaginationResponse;
    }>(`/api/donations/my${query}`);
  },
};
