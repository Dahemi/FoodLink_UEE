import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface DonationResponse {
  _id: string;
  donorId: {
    _id: string;
    name: string;
    donorType: string;
    businessName?: string;
    phone?: string;
    rating?: number;
    totalDonations?: number;
  };
  claimedBy?: {
    _id: string;
    name: string;
    organizationType: string;
    contactPerson?: string;
    phone?: string;
  };
  title: string;
  status: 'available' | 'claimed' | 'completed' | 'cancelled' | 'expired';
  claimedAt?: string;
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
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  pickupSchedule: {
    urgency: string;
    availableFrom?: string;
    availableUntil?: string;
    specialInstructions?: string;
  };
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function getBaseUrl(): string | null {
  if (!API_URL) {
    console.warn('EXPO_PUBLIC_API_URL not configured');
    return null;
  }
  return API_URL;
}

async function getNGOAuthToken(): Promise<string | null> {
  try {
    const tokenStr = await AsyncStorage.getItem('ngoAuthToken');
    console.log('Retrieving NGO token:', { exists: !!tokenStr });
    
    if (!tokenStr) {
      console.error('No NGO auth token found in storage');
      return null;
    }
    
    const tokenData = JSON.parse(tokenStr);
    console.log('NGO token data:', { 
      hasAccessToken: !!tokenData.accessToken,
      expiresAt: tokenData.expiresAt,
      isExpired: tokenData.expiresAt ? Date.now() >= tokenData.expiresAt : 'unknown'
    });
    
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
    throw new Error('Not authenticated as NGO');
  }

  const url = `${baseUrl}${path}`;
  console.log(`NGO API Request: ${options?.method || 'GET'} ${url}`);
  console.log('Using token:', token.substring(0, 20) + '...');

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });

  console.log('NGO API Response status:', response.status);

  const responseData = await response.json();
  console.log('NGO API Response:', responseData);

  if (!response.ok) {
    throw new Error(responseData.message || `API request failed: ${response.status}`);
  }

  return responseData.data;
}

export const NGODonationApi = {
  isEnabled(): boolean {
    return !!getBaseUrl();
  },

  async getAvailableDonations(params?: {
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
    
    // Set default status to 'available' if not provided
    const finalParams = {
      status: 'available',
      ...params
    };
    
    console.log('getAvailableDonations called with params:', finalParams);
    
    Object.entries(finalParams).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    });

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    console.log('Full API query:', `/api/donations${query}`);
    
    const result = await httpWithNGOAuth<{
      donations: DonationResponse[];
      pagination: PaginationResponse;
    }>(`/api/donations${query}`);
    
    console.log('API returned:', {
      donationCount: result.donations.length,
      totalAvailable: result.pagination.total,
      firstDonation: result.donations[0] ? {
        id: result.donations[0]._id,
        title: result.donations[0].title,
        status: result.donations[0].status
      } : null
    });
    
    return result;
  },

  async getDonation(id: string): Promise<DonationResponse> {
    return await httpWithNGOAuth<DonationResponse>(`/api/donations/${id}`);
  },

  async expressInterest(
    donationId: string,
    message?: string
  ): Promise<DonationResponse> {
    console.log(`Expressing interest in donation ${donationId}`);
    
    // First express interest through the donations API
    const response = await httpWithNGOAuth<DonationResponse>(
      `/api/donations/${donationId}/interest`,
      {
        method: 'POST',
        body: JSON.stringify({ message }),
      }
    );
    
    // Then create accepted donation record
    try {
      await httpWithNGOAuth(
        '/api/accepted-donations/from-interest',
        {
          method: 'POST',
          body: JSON.stringify({
            donationId: donationId,
            donorId: response.donorId._id || response.donorId
          }),
        }
      );
    } catch (err) {
      console.error('Failed to create accepted donation record:', err);
    }
    
    return response;
  },
};