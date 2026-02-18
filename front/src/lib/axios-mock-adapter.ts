import { mockSignIn, isDemoAccount, mockGetUserInfo } from 'src/auth/mock-auth-handler';

import axios from './axios';

// ----------------------------------------------------------------------

/**
 * Setup mock API handlers for demo authentication
 * This intercepts API calls and returns mock data for demo accounts
 */
export function setupMockAuthHandlers() {
  // Intercept requests BEFORE they are sent
  axios.interceptors.request.use(
    async (config) => {
      // Intercept sign-in requests for demo accounts
      if (config.url === '/api/auth/sign-in' && config.data) {
        try {
          const requestData =
            typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
          const { email, password } = requestData;

          // For demo accounts, return mock response immediately without making HTTP request
          if (isDemoAccount(email)) {
            const result = mockSignIn(email, password);

            // Create a fake successful response
            const mockResponse = {
              data: result,
              status: 200,
              statusText: 'OK',
              headers: {},
              config,
            };

            // Override the axios adapter to return our mock response
            config.adapter = () => Promise.resolve(mockResponse);
          }
        } catch {
          // Continue with normal request
        }
      }

      // Intercept get user info for mock tokens
      if (config.url === '/api/auth/me') {
        const authHeader = config.headers?.Authorization || config.headers?.authorization;
        if (authHeader && typeof authHeader === 'string') {
          const token = authHeader.replace('Bearer ', '');
          // Check if it's a mock token
          try {
            const result = mockGetUserInfo(token);

            // Create a fake successful response
            const mockResponse = {
              data: result,
              status: 200,
              statusText: 'OK',
              headers: {},
              config,
            };

            // Override the axios adapter to return our mock response
            config.adapter = () => Promise.resolve(mockResponse);
          } catch {
            // Not a mock token, let it go to backend
          }
        }
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  // Intercept responses
  axios.interceptors.response.use(
    (response) => response,
    async (error) => Promise.reject(error)
  );
}
