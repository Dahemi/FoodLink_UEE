import { fetch } from 'node-fetch';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Ensure a usable fetch function at runtime.
 */
async function getFetch(): Promise<typeof fetch> {
  if (typeof fetch !== 'undefined') {
    return fetch;
  }
  try {
    const mod = await import('cross-fetch');
    return mod.default;
  } catch (err) {
    throw new Error('No fetch implementation found');
  }
}

export const FeedbackService = {
  /**
   * Submit feedback for an NGO.
   */
  async submitFeedback(
    payload: { ngoId: string; rating: number; comment?: string; anonymous?: boolean; beneficiaryId?: string }
  ) {
    console.log('API_URL:', API_URL);
    console.log('Submitting feedback:', payload);
    const fetchFn = await getFetch();
    const res = await fetchFn(`${API_URL}/api/beneficiary-feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Failed to submit feedback (${res.status})`);
    }

    return res.json();
  },

  /**
   * Get all feedbacks for an NGO.
   */
  async getFeedbacksForNgo(ngoId: string) {
    const fetchFn = await getFetch();
    const res = await fetchFn(`${API_URL}/api/beneficiary-feedback/ngo/${ngoId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Failed to get feedbacks (${res.status})`);
    }

    const data = await res.json();
    console.log('Fetched feedback data:', data); // Add this log
    return data;
  },
};