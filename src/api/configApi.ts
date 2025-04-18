import axios, { AxiosRequestHeaders, AxiosInstance, AxiosRequestConfig } from "axios";
import { useAuthStore } from "../stores";

// Create API instance with base URL from environment
export const configApi = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL
});

/**
 * Get the current auth token from store or localStorage
 * This handles cases where zustand might not have initialized yet
 */
const getTokenFromStorage = (): string | undefined => {
  try {
    // Try to get from store first
    const storeToken = useAuthStore.getState()?.token;
    if (storeToken) {
      console.log('Token found in store:', storeToken.substring(0, 10) + '...');
      return storeToken;
    }
    console.log('No token in store, checking localStorage');

    // Fallback to localStorage if store doesn't have it
    const storageData = localStorage.getItem('auth-storage');
    if (storageData) {
      try {
        const parsedData = JSON.parse(storageData);
        const localToken = parsedData?.state?.token;

        if (localToken) {
          console.log('Token found in localStorage:', localToken.substring(0, 10) + '...');
          return localToken;
        } else {
          console.warn('Storage data found but no token in it');
        }
      } catch (parseError) {
        console.error('Error parsing localStorage data:', parseError);
      }
    } else {
      console.warn('No auth data found in localStorage');
    }

    // As a last resort, check debug token
    const debugToken = localStorage.getItem('debug-auth-token');
    if (debugToken) {
      console.log('Using debug token as fallback');
      return debugToken;
    }

    console.warn('NO TOKEN FOUND in any storage location');
  } catch (e) {
    console.error('Error retrieving token:', e);
  }
  return undefined;
};

/**
 * Create an authenticated API instance with the current auth token
 * This can be used when the default interceptors aren't working properly
 */
export const createAuthApi = (): AxiosInstance => {
  // Get token from both possible sources
  const token = getTokenFromStorage();

  // Explicitly warn if no token is found
  if (!token) {
    console.warn('Creating auth API with NO TOKEN - auth requests will likely fail');
  } else {
    console.log('Creating auth API with token:', `${token.substring(0, 10)}...`);
  }

  // Create new instance with same base config
  const authApi = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });

  // Add request interceptor to log request headers and ensure token is set
  authApi.interceptors.request.use(
    (config) => {
      // Double-check for token on each request (in case it was updated)
      const currentToken = getTokenFromStorage();

      // If we have a token now, add it to headers
      if (currentToken && (!config.headers.Authorization || !config.headers['Authorization'])) {
        console.log('Adding token to request headers for URL:', config.url);
        config.headers['Authorization'] = `Bearer ${currentToken}`;
      }

      // Log full headers for debugging
      console.log('AUTH API Request Headers for URL', config.url, ':', JSON.stringify(config.headers));
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Add response interceptor to handle 401 errors
  authApi.interceptors.response.use(
    (response) => {
      console.log('AUTH API Response Success:', response.status, response.config.url);
      return response;
    },
    (error) => {
      if (error.response?.status === 401) {
        console.error("Authentication error:", error.response?.data);
        console.error("Request config that caused 401:", {
          url: error.config.url,
          method: error.config.method,
          headers: error.config.headers
        });

        // Clear auth state
        useAuthStore.getState().logoutUser();

        if (typeof window !== 'undefined') {
          window.location.href = '/auth';
        }
      }

      console.error('AUTH API Error:', error.message, error.response?.data);
      return Promise.reject(error);
    }
  );

  return authApi;
};

// Helper to get current auth token
export const getAuthToken = (): string | undefined => {
  return getTokenFromStorage();
};

// Request interceptor - Always get the current token from the store
configApi.interceptors.request.use((config) => {
  // Get the current token 
  const token = getTokenFromStorage();

  // Ensure headers object exists
  if (!config.headers) {
    config.headers = {} as AxiosRequestHeaders;
  }

  if (token) {
    // Ensure Authorization header is set with the Bearer token
    config.headers["Authorization"] = `Bearer ${token}`;
    // Ensure all requests have the content-type for JSON
    config.headers["Content-Type"] = "application/json";

    // Log successful header setting
    console.log(`Added auth token to request: ${config.method} ${config.url}`);
  } else {
    console.warn('No token available for request:', config.url);
  }

  // Log API requests for debugging
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
    hasToken: !!token,
  });

  return config;
}, (error) => {
  // Handle request errors
  console.error("API Request Error:", error);
  return Promise.reject(error);
});

// Response interceptor - Handle 401 errors and other response issues
configApi.interceptors.response.use(
  (response) => {
    // Log successful responses
    console.log(`API Response Success: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.error("Authentication error:", error.response.data);
      // Clear auth state on 401 errors
      useAuthStore.getState().logoutUser();

      // Redirect to login page if on client side
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      }
    }

    // Log all API errors with detailed information
    console.error(
      `API Error ${error.response?.status || 'unknown'}: ${error.config?.url || 'unknown url'}`,
      {
        data: error.response?.data,
        message: error.message,
        config: {
          method: error.config?.method,
          url: error.config?.url,
        }
      }
    );

    return Promise.reject(error);
  }
);

/**
 * Helper function to create request config with auth token
 * Use this when the interceptor approach isn't working
 */
export const createAuthConfig = (config?: AxiosRequestConfig): AxiosRequestConfig => {
  const token = getTokenFromStorage();

  return {
    ...config,
    headers: {
      ...(config?.headers || {}),
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  };
};
