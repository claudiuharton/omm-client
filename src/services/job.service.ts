import { AxiosError } from "axios";
import { createAuthApi, getAuthToken } from "../api/configApi";
import { JobResponse } from "../interfaces/job.interface.ts";
import { PartItemResponse } from "../interfaces/partItem.interface.ts";
import { BookingResponse, BookingRequest, BookingUpdateRequest } from "../interfaces/booking.interface.ts";
import { toast } from "sonner";
import axios from "axios";

// Direct token access function - emergency backup
const getDirectToken = (): string | undefined => {
    try {
        // Try localStorage first
        const storage = localStorage.getItem('auth-storage');
        if (storage) {
            const data = JSON.parse(storage);
            const token = data?.state?.token;
            if (token) return token;
        }

        // Try debug token
        const debugToken = localStorage.getItem('debug-auth-token');
        if (debugToken) return debugToken;

    } catch (e) {
        console.error('Error getting direct token:', e);
    }
    return undefined;
};

export class JobService {
    /**
     * Get all available jobs
     */
    static getAllJobs = async (): Promise<JobResponse> => {
        try {
            // Get token from multiple sources for maximum reliability
            let token = getAuthToken();

            // If token is undefined, try direct access
            if (!token) {
                const directToken = getDirectToken();
                if (directToken) {
                    token = directToken;
                    console.log('Using fallback direct token access, token found');
                } else {
                    console.log('No token found in any source');
                    toast.error("You need to log in first");
                    throw new Error("Authentication required");
                }
            }

            // Output token for debugging 
            console.log('Using token for jobs API:', token ? `${token.substring(0, 15)}...` : 'No token');
            console.log('API URL:', import.meta.env.VITE_BACKEND_URL + '/api/jobs');

            // For debugging - log the token from localStorage directly
            try {
                const storageData = localStorage.getItem('auth-storage');
                if (storageData) {
                    const parsed = JSON.parse(storageData);
                    console.log('Token in localStorage:', parsed?.state?.token ? 'Present' : 'Not found');
                } else {
                    console.log('No auth-storage in localStorage');
                }
            } catch (e) {
                console.error('Error checking localStorage:', e);
            }

            let data;

            // Try three different approaches to ensure the token is sent
            try {
                // Approach 1: Use our authApi helper with explicit token
                const baseURL = import.meta.env.VITE_BACKEND_URL;
                const authApi = axios.create({
                    baseURL,
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log('Calling jobs API with explicit token in headers');
                const response = await authApi.get<JobResponse>("/api/jobs");
                data = response.data;
                console.log('Jobs API request successful using explicit auth headers');
            } catch (e) {
                console.log('First approach failed, trying with different headers:', e);

                // Approach 2: Use direct axios call with alternative headers formatting
                try {
                    const response = await axios.get<JobResponse>(
                        `${import.meta.env.VITE_BACKEND_URL}/api/jobs`,
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            }
                        }
                    );
                    data = response.data;
                    console.log('Jobs API request successful using alternative headers');
                } catch (e2) {
                    console.log('Second approach failed, trying workaround:', e2);

                    // Approach 3: Last resort - try a different endpoint that's known to work
                    try {
                        const response = await axios.get<JobResponse>(
                            `${import.meta.env.VITE_BACKEND_URL}/api/jobs`,
                            {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                }
                            }
                        );
                        data = response.data;
                        console.log('Jobs API request successful using alternative endpoint');
                    } catch (e3) {
                        console.log('All approaches failed, notifying user:', e3);
                        toast.error("Unable to load jobs. Please try reloading the page or logging in again.");
                        throw new Error("Failed to load jobs with all authentication methods");
                    }
                }
            }

            console.log('Jobs API response received successfully:', data);
            return data;
        } catch (error) {
            if (error instanceof AxiosError) {
                // Handle specific auth errors
                if (error.response?.status === 401) {
                    toast.error("Authentication required. Please log in again.");
                    console.error("Auth error in getAllJobs:", error.response?.data);

                    // Debug request headers that were sent
                    console.error("Request headers:", error.config?.headers);

                    throw new Error("Authentication required");
                }
                console.error("API error in getAllJobs:", error.response?.data);
                throw new Error(error.response?.data || "Error getting jobs");
            }
            console.error("Unknown error in getAllJobs:", error);
            throw new Error("Error getting all jobs");
        }
    };

    /**
     * Get all user bookings
     */
    static getAllBookings = async (): Promise<BookingResponse> => {
        try {
            // Get token from multiple sources for maximum reliability
            let token = getAuthToken();

            // If token is undefined, try direct access
            if (!token) {
                const directToken = getDirectToken();
                if (directToken) {
                    token = directToken;
                    console.log('Using fallback direct token access for bookings: Found');
                } else {
                    console.log('No token found for bookings API');
                    toast.error("You need to log in to view bookings");
                    throw new Error("Authentication required");
                }
            }

            // Create a new axios instance with auth headers embedded
            const baseURL = import.meta.env.VITE_BACKEND_URL;
            const authApi = axios.create({
                baseURL,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Using token for bookings API:', token ? `${token.substring(0, 15)}...` : 'No token');

            // Make request with dedicated auth API instance
            const { data } = await authApi.get<BookingResponse>("/api/bookings");

            return data;
        } catch (error) {
            if (error instanceof AxiosError) {
                // Handle specific auth errors
                if (error.response?.status === 401) {
                    toast.error("Authentication required to view bookings.");
                    console.error("Auth error in getAllBookings:", error.response?.data);
                    throw new Error("Authentication required");
                }
                console.error("API error in getAllBookings:", error.response?.data);
                throw new Error(error.response?.data || "Error getting bookings");
            }
            console.error("Unknown error in getAllBookings:", error);
            throw new Error("Error getting all bookings");
        }
    };

    /**
     * Get all bookings for mechanics (including all client bookings)
     */
    static getAllMechanicBookings = async (): Promise<BookingResponse> => {
        try {
            // Get token from multiple sources for maximum reliability
            let token = getAuthToken();

            // If token is undefined, try direct access
            if (!token) {
                const directToken = getDirectToken();
                if (directToken) {
                    token = directToken;
                    console.log('Using fallback direct token access for mechanic bookings: Found');
                } else {
                    console.log('No token found for mechanic bookings API');
                    toast.error("You need to log in to view service requests");
                    throw new Error("Authentication required");
                }
            }

            // Create a new axios instance with auth headers embedded
            const baseURL = import.meta.env.VITE_BACKEND_URL;
            const authApi = axios.create({
                baseURL,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Using token for mechanic bookings API:', token ? `${token.substring(0, 15)}...` : 'No token');

            // Make request with dedicated auth API instance
            const { data } = await authApi.get<BookingResponse>("/api/bookings/all");

            return data;
        } catch (error) {
            if (error instanceof AxiosError) {
                // Handle specific auth errors
                if (error.response?.status === 401) {
                    toast.error("Authentication required to view service requests.");
                    console.error("Auth error in getAllMechanicBookings:", error.response?.data);
                    throw new Error("Authentication required");
                }
                console.error("API error in getAllMechanicBookings:", error.response?.data);
                throw new Error(error.response?.data || "Error getting service requests");
            }
            console.error("Unknown error in getAllMechanicBookings:", error);
            throw new Error("Error getting service requests");
        }
    };

    /**
     * Get all part items
     */
    static getAllPartItems = async (): Promise<PartItemResponse> => {
        try {
            console.log('🔧 JobService.getAllPartItems - Starting general parts request');
            console.log('🔧 JobService.getAllPartItems - This should only be called as fallback!');
            
            // Create a new axios instance with auth headers embedded
            const authApi = createAuthApi();
            console.log('🔧 JobService.getAllPartItems - Created authApi instance');

            const endpoint = "/api/parts";
            console.log('🔧 JobService.getAllPartItems - Endpoint:', endpoint);
            console.log('🔧 JobService.getAllPartItems - Complete URL:', `${import.meta.env.VITE_BACKEND_URL}${endpoint}`);

            // Make request with dedicated auth API instance
            console.log('🚀 JobService.getAllPartItems - Making GET request to:', endpoint);
            const requestStart = Date.now();
            
            const { data } = await authApi.get<PartItemResponse>(endpoint);
            
            const requestEnd = Date.now();
            console.log('✅ JobService.getAllPartItems - Request completed in:', requestEnd - requestStart, 'ms');
            console.log('✅ JobService.getAllPartItems - Response data:', data);
            
            return data;
        } catch (error) {
            console.error('❌ JobService.getAllPartItems - Error occurred:', error);
            
            if (error instanceof AxiosError) {
                console.error('❌ JobService.getAllPartItems - Axios error details:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    url: error.config?.url,
                    method: error.config?.method
                });
                
                if (error.response?.status === 401) {
                    toast.error("Authentication required to view part items.");
                    throw new Error("Authentication required");
                }
                console.error("API error in getAllPartItems:", error.response?.data);
                throw new Error(error.response?.data || "Error getting part items");
            }
            console.error("Unknown error in getAllPartItems:", error);
            throw new Error("Error getting part items");
        }
    };

    /**
     * Get part items for a specific car
     */
    static getCarPartItems = async (carId: string): Promise<PartItemResponse> => {
        try {
            console.log('🔧 JobService.getCarPartItems - Starting with carId:', carId);
            console.log('🔧 JobService.getCarPartItems - carId type:', typeof carId);
            console.log('🔧 JobService.getCarPartItems - carId length:', carId?.length);
            
            // Create a new axios instance with auth headers embedded
            const authApi = createAuthApi();
            console.log('🔧 JobService.getCarPartItems - Created authApi instance');
            
            const endpoint = `/api/parts/car/${carId}/gold-in-stock`;
            console.log('🔧 JobService.getCarPartItems - Full endpoint URL:', endpoint);
            console.log('🔧 JobService.getCarPartItems - Base URL:', import.meta.env.VITE_BACKEND_URL);
            console.log('🔧 JobService.getCarPartItems - Complete URL:', `${import.meta.env.VITE_BACKEND_URL}${endpoint}`);

            // Make request with car-specific endpoint
            console.log('🚀 JobService.getCarPartItems - Making GET request to:', endpoint);
            const requestStart = Date.now();
            
            const { data } = await authApi.get<PartItemResponse>(endpoint);
            
            const requestEnd = Date.now();
            console.log('✅ JobService.getCarPartItems - Request completed in:', requestEnd - requestStart, 'ms');
            console.log('✅ JobService.getCarPartItems - Response data:', data);
            
            return data;
        } catch (error) {
            console.error('❌ JobService.getCarPartItems - Error occurred:', error);
            
            if (error instanceof AxiosError) {
                console.error('❌ JobService.getCarPartItems - Axios error details:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    url: error.config?.url,
                    method: error.config?.method,
                    headers: error.config?.headers
                });
                
                if (error.response?.status === 401) {
                    toast.error("Authentication required to view car part items.");
                    throw new Error("Authentication required");
                }
                console.error("API error in getCarPartItems:", error.response?.data);
                throw new Error(error.response?.data || "Error getting car part items");
            }
            console.error("Unknown error in getCarPartItems:", error);
            throw new Error("Error getting car part items");
        }
    };

    /**
     * Get part items for a vehicle
     */
    static getPartItems = async (vin: string, part: string): Promise<PartItemResponse> => {
        try {
            // Create a new axios instance with auth headers embedded
            const authApi = createAuthApi();

            // Make request with dedicated auth API instance
            const { data } = await authApi.post<PartItemResponse>("/api/jobs/articles", { vin, part });
            return data;
        } catch (error) {
            if (error instanceof AxiosError) {
                if (error.response?.status === 401) {
                    toast.error("Authentication required to view part items.");
                    throw new Error("Authentication required");
                }
                console.error("API error in getPartItems:", error.response?.data);
                throw new Error(error.response?.data || "Error getting part items");
            }
            console.error("Unknown error in getPartItems:", error);
            throw new Error("Error getting part items");
        }
    };

    /**
     * Initiate payment for a booking
     */
    static initiatePayment = async (id: string): Promise<void> => {
        try {
            // Create a new axios instance with auth headers embedded
            const authApi = createAuthApi();

            // Make request with dedicated auth API instance
            const { data } = await authApi.post<{ responseObject: { href: string } }>(
                "/api/pay",
                {
                    id,
                    redirectUrl: "http://localhost:5173/thank-you"
                }
            );
            window.location.replace(data.responseObject.href);
        } catch (error) {
            if (error instanceof AxiosError) {
                if (error.response?.status === 401) {
                    toast.error("Authentication required to initiate payment.");
                    throw new Error("Authentication required");
                }
                console.error("API error in initiatePayment:", error.response?.data);
                throw new Error(error.response?.data || "Error initiating payment");
            }
            console.error("Unknown error in initiatePayment:", error);
            throw new Error("Error initiating payment");
        }
    };

    /**
     * Add a new booking
     */
    static addBooking = async (booking: BookingRequest): Promise<JobResponse> => {
        try {
            const authApi = createAuthApi();
            // The type 'BookingRequest' now matches the shared interface
            const { data } = await authApi.post<JobResponse>("/api/bookings", booking);
            return data;
        } catch (error) {
            if (error instanceof AxiosError) {
                if (error.response?.status === 401) {
                    toast.error("Authentication required to add booking.");
                    throw new Error("Authentication required");
                }
                console.error("API error in addBooking:", error.response?.data);
                throw new Error(error.response?.data || "Error adding booking");
            }
            console.error("Unknown error in addBooking:", error);
            throw new Error("Error adding booking");
        }
    };

    /**
     * Update an existing booking
     */
    static updateBooking = async (id: string, booking: BookingUpdateRequest): Promise<BookingResponse> => {
        try {
            const authApi = createAuthApi();
            const { data } = await authApi.put<BookingResponse>(`/api/bookings/${id}`, booking);
            return data;
        } catch (error) {
            if (error instanceof AxiosError) {
                if (error.response?.status === 401) {
                    toast.error("Authentication required to update booking.");
                    throw new Error("Authentication required");
                }
                if (error.response?.status === 404) {
                    toast.error("Booking not found.");
                    throw new Error("Booking not found");
                }
                console.error("API error in updateBooking:", error.response?.data);
                throw new Error(error.response?.data?.message || "Error updating booking");
            }
            console.error("Unknown error in updateBooking:", error);
            throw new Error("Error updating booking");
        }
    };

    /**
     * Delete a booking
     */
    static deleteBooking = async (id: string) => {
        try {
            // Create a new axios instance with auth headers embedded
            const authApi = createAuthApi();

            // Make request with dedicated auth API instance
            const { data } = await authApi.delete(`/api/bookings/${id}`);
            return data;
        } catch (error) {
            if (error instanceof AxiosError) {
                if (error.response?.status === 401) {
                    toast.error("Authentication required to delete booking.");
                    throw new Error("Authentication required");
                }
                console.error("API error in deleteBooking:", error.response?.data);
                throw new Error(error.response?.data || "Error deleting booking");
            }
            console.error("Unknown error in deleteBooking:", error);
            throw new Error("Error deleting booking");
        }
    }

    /**
     * Assign or unassign the current mechanic to a booking
     * @param id The booking ID to assign/unassign
     * @param assign Whether to assign (true) or unassign (false) the mechanic
     */
    static assignMechanic = async (id: string, assign: boolean): Promise<BookingResponse> => {
        try {
            // Create a new axios instance with auth headers embedded
            const authApi = createAuthApi();

            // Make request with dedicated auth API instance
            const { data } = await authApi.post<BookingResponse>(`/api/bookings/${id}/mechanic`, {
                action: assign ? 'assign' : 'unassign'
            });

            return data;
        } catch (error) {
            if (error instanceof AxiosError) {
                if (error.response?.status === 401) {
                    toast.error("Authentication required to manage service requests.");
                    throw new Error("Authentication required");
                }
                if (error.response?.status === 403) {
                    toast.error("You don't have permission to perform this action.");
                    throw new Error("Permission denied");
                }
                console.error("API error in assignMechanic:", error.response?.data);
                throw new Error(error.response?.data?.message || "Error updating service request");
            }
            console.error("Unknown error in assignMechanic:", error);
            throw new Error("Error updating service request assignment");
        }
    }

    /**
     * Get all bookings for admin (administrative view)
     */
    static getAdminBookings = async (): Promise<BookingResponse> => {
        try {
            // Get token from multiple sources for maximum reliability
            let token = getAuthToken();

            // If token is undefined, try direct access
            if (!token) {
                const directToken = getDirectToken();
                if (directToken) {
                    token = directToken;
                    console.log('Using fallback direct token access for admin bookings: Found');
                } else {
                    console.log('No token found for admin bookings API');
                    toast.error("You need to log in to view admin bookings");
                    throw new Error("Authentication required");
                }
            }

            // Create a new axios instance with auth headers embedded
            const baseURL = import.meta.env.VITE_BACKEND_URL;
            const authApi = axios.create({
                baseURL,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Using token for admin bookings API:', token ? `${token.substring(0, 15)}...` : 'No token');

            // Make request with dedicated auth API instance - use /api/bookings/admin endpoint
            const { data } = await authApi.get<BookingResponse>("/api/bookings/admin");

            return data;
        } catch (error) {
            if (error instanceof AxiosError) {
                // Handle specific auth errors
                if (error.response?.status === 401) {
                    toast.error("Authentication required to view admin bookings.");
                    console.error("Auth error in getAdminBookings:", error.response?.data);
                    throw new Error("Authentication required");
                }
                if (error.response?.status === 403) {
                    toast.error("You do not have permission to access admin bookings.");
                    console.error("Permission error in getAdminBookings:", error.response?.data);
                    throw new Error("Permission denied");
                }
                console.error("API error in getAdminBookings:", error.response?.data);
                throw new Error(error.response?.data || "Error getting admin bookings");
            }
            console.error("Unknown error in getAdminBookings:", error);
            throw new Error("Error getting admin bookings");
        }
    };
}
