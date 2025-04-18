import { AxiosError } from "axios";
import { configApi, createAuthApi, getAuthToken } from "../api/configApi";
import { LoginResponse, RegisterUser, RegisterMechanic } from "../interfaces";
import { toast } from "sonner";

// List of registered mechanic emails for demo purposes
const MECHANIC_EMAILS: string[] = [];

export class AuthService {
    static login = async (email: string, password: string): Promise<LoginResponse> => {
        try {
            console.log('[AuthService] Attempting login for:', email);
            const { data } = await configApi.post<LoginResponse>('/api/auth/login', { email, password });

            console.log('[AuthService] Login response:', JSON.stringify(data));
            console.log('[AuthService] Login successful, token received:', data.responseObject?.token ? 'Yes' : 'No');

            // For demo: Force role to be "mechanic" if the email is in our mechanic list
            if (MECHANIC_EMAILS.includes(email.toLowerCase())) {
                console.log('[AuthService] Setting user role to mechanic');
                if (data.responseObject && data.responseObject.user) {
                    data.responseObject.user.role = "mechanic";
                }
            }

            // Store token in localStorage for debugging
            if (data.responseObject?.token) {
                // Store this for debugging only - will be overwritten by zustand persist
                localStorage.setItem('debug-auth-token', data.responseObject.token);
                console.log('[AuthService] Token saved to debug storage');
            }

            return data;
        } catch (error) {
            console.error('[AuthService] Login error:', error);
            if (error instanceof AxiosError) {
                console.error('[AuthService] Login API error:', error.response?.data);
                toast.error(error.response?.data.message || "Login failed");
                throw new Error(error.response?.data.message || "Login failed");
            }
            toast.error("Cannot log in");
            throw new Error('Cannot log in');
        }
    }

    static registerUser = async (userData: RegisterUser): Promise<RegisterUser> => {
        try {
            console.log('[AuthService] Registering user:', userData.email);
            const { data } = await configApi.post<RegisterUser>('/api/auth/register', userData);
            console.log('[AuthService] User registration successful');
            toast.success('Registered successfully! Please log in.');
            return data;
        } catch (error) {
            console.error('[AuthService] Registration error:', error);
            if (error instanceof AxiosError) {
                console.error('[AuthService] Registration API error:', error.response?.data);
                const message = error.response?.data.message || 'Registration failed';
                toast.error(message);
                throw new Error(message);
            }
            toast.error('Registration failed');
            throw new Error('Registration failed');
        }
    }

    static registerMechanic = async (userData: RegisterMechanic): Promise<RegisterUser> => {
        try {
            console.log('[AuthService] Registering mechanic:', userData.email);
            const { data } = await configApi.post<RegisterUser>('/api/auth/register-mechanic', userData);
            console.log('[AuthService] Mechanic registration successful');
            toast.success('Mechanic registered successfully! Please log in.');
            return data;
        } catch (error) {
            console.error('[AuthService] Mechanic registration error:', error);
            if (error instanceof AxiosError) {
                console.error('[AuthService] Mechanic registration API error:', error.response?.data);
                const message = error.response?.data.message || 'Mechanic registration failed';
                toast.error(message);
                throw new Error(message);
            }
            toast.error('Mechanic registration failed');
            throw new Error('Mechanic registration failed');
        }
    }

    static logoutUser = async (): Promise<RegisterUser> => {
        try {
            console.log('[AuthService] Attempting logout');
            // Use auth API to ensure token is included
            const authApi = createAuthApi();
            const { data } = await authApi.get<RegisterUser>('/api/auth/logout');

            console.log('[AuthService] Logout response:', JSON.stringify(data));
            console.log('[AuthService] Logout successful');

            // Clear debug token
            localStorage.removeItem('debug-auth-token');

            return data;
        } catch (error) {
            console.error('[AuthService] Logout error:', error);
            if (error instanceof AxiosError) {
                console.error('[AuthService] Logout API error:', error.response?.data);
            }
            // Still consider logout successful even if API fails
            toast.error("Logout on server failed, but you've been logged out locally");
            return {} as RegisterUser;
        }
    }

    static checkAuth = async (): Promise<LoginResponse> => {
        try {
            console.log('[AuthService] Checking authentication status');
            const token = getAuthToken();
            console.log('[AuthService] Current token status:', token ? `Token exists (${token.substring(0, 10)}...)` : 'No token');

            if (!token) {
                console.warn('[AuthService] No token available for auth check');
                throw new Error('No authentication token available');
            }

            // Use auth API to ensure token is included
            const authApi = createAuthApi();

            // Log the request config for debugging
            console.log('[AuthService] Auth API headers:', authApi.defaults.headers);

            // Debug: Print token in Authorization header directly
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
            console.log('[AuthService] Using explicit headers for auth check:', headers);

            // Make request with explicit headers to ensure token is sent
            const { data } = await authApi.get<LoginResponse>('/api/auth/check', {
                headers: headers
            });

            console.log('[AuthService] Auth check response:', JSON.stringify(data));
            console.log('[AuthService] Auth check successful, still authorized:', data.responseObject?.token ? 'Yes' : 'No');

            if (data.responseObject?.user) {
                console.log('[AuthService] User from auth check:', JSON.stringify(data.responseObject.user));
            }

            return data;
        } catch (error) {
            console.error('[AuthService] Authentication check error:', error);
            if (error instanceof AxiosError) {
                console.error('[AuthService] Auth check API error:', error.response?.data);
                console.error('[AuthService] Auth check request details:', error.config);
                if (error.response?.status === 401) {
                    toast.error("Your session has expired. Please log in again.");
                }
            }
            throw new Error('Authentication check failed');
        }
    }
}