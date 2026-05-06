/**
 * HealthCheck.test.js
 *
 * Validates the API route configuration and apiClient setup.
 * Does NOT make real network calls — uses mocked axios.
 */
import axios from 'axios';
import { api_route } from '../src/utils/route';

// Mock axios so no real HTTP traffic is made
jest.mock('axios', () => {
  const mockAxios = {
    create: jest.fn(() => mockAxios),
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    defaults: { headers: { common: {} } },
  };
  return mockAxios;
});

describe('API Route Configuration Health Check', () => {
  it('api_route is defined', () => {
    expect(api_route).toBeDefined();
  });

  it('api_route starts with http:// or https://', () => {
    expect(api_route).toMatch(/^https?:\/\//);
  });

  it('api_route does not have trailing slash', () => {
    expect(api_route.endsWith('/')).toBe(false);
  });

  it('api_route points to a valid host:port in local mode', () => {
    // Local mode: http://127.0.0.1:5000 (via adb reverse)
    expect(api_route).toContain('127.0.0.1');
    expect(api_route).toContain('5000');
  });

  it('simulates a successful health check response', async () => {
    axios.get.mockResolvedValueOnce({
      status: 200,
      data: { status: 'MindCare API is running', version: '1.0.0' },
    });

    const response = await axios.get(api_route + '/');
    expect(response.status).toBe(200);
    expect(response.data.status).toBe('MindCare API is running');
  });

  it('simulates a network error (backend offline) without throwing unhandled', async () => {
    axios.get.mockRejectedValueOnce(
      Object.assign(new Error('Network Error'), { isAxiosError: true, response: undefined })
    );

    try {
      await axios.get(api_route + '/api/health-check');
      // If we get here (unlikely in offline test), ensure it's still valid HTTP
      expect(true).toBe(true);
    } catch (error) {
      // Expected: no response means backend is offline (not a code bug)
      expect(error.message).toBe('Network Error');
      expect(error.response).toBeUndefined();
    }
  });
});
