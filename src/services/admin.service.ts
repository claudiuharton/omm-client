import { AxiosError } from "axios";
import { createAuthApi } from "../api/configApi";
import { User } from "../interfaces/user.interface";
import { toast } from "sonner";

// Response type for admin API calls
export interface AdminResponse {
    success: boolean;
    message: string;
    responseObject?: any;
}

// Response type for client users
export interface ClientsResponse extends AdminResponse {
    responseObject?: User[];
}

export class AdminService {
    /**
     * Get all client users
     */
    static getClients = async (): Promise<ClientsResponse> => {
        try {
            // Create a new axios instance with auth headers embedded
            const authApi = createAuthApi();

            // Make request with authenticated API instance
            const { data } = await authApi.get<ClientsResponse>("/api/admin/users/clients");
            return data;
        } catch (error) {
            if (error instanceof AxiosError) {
                console.error("API error in getClients:", error.response?.data);

                if (error.response?.status === 401) {
                    toast.error("Authentication required to view clients.");
                    throw new Error("Authentication required");
                }

                if (error.response?.status === 403) {
                    toast.error("You don't have permission to access client data.");
                    throw new Error("Permission denied");
                }

                throw new Error(error.response?.data?.message || "Error fetching clients");
            }
            console.error("Unknown error in getClients:", error);
            throw new Error("Error fetching clients");
        }
    };

    /**
     * Get all mechanic users
     */
    static getMechanics = async (): Promise<AdminResponse> => {
        try {
            // Create a new axios instance with auth headers embedded
            const authApi = createAuthApi();

            // Make request with authenticated API instance
            const { data } = await authApi.get<AdminResponse>("/api/admin/users/mechanics");
            return data;
        } catch (error) {
            if (error instanceof AxiosError) {
                console.error("API error in getMechanics:", error.response?.data);

                if (error.response?.status === 401) {
                    toast.error("Authentication required to view mechanics.");
                    throw new Error("Authentication required");
                }

                if (error.response?.status === 403) {
                    toast.error("You don't have permission to access mechanic data.");
                    throw new Error("Permission denied");
                }

                throw new Error(error.response?.data?.message || "Error fetching mechanics");
            }
            console.error("Unknown error in getMechanics:", error);
            throw new Error("Error fetching mechanics");
        }
    };
} 