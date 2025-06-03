import { AxiosError } from "axios";
import { createAuthApi } from "../api/configApi";
import { PartItemApiResponse, SinglePartItemApiResponse, CreatePartItemDto } from "../interfaces";
import { toast } from "sonner";

export class PartItemService {
    static getAllPartItems = async (): Promise<PartItemApiResponse> => {
        try {
            // Create a new axios instance with auth headers embedded
            const authApi = createAuthApi();

            // Make request with authenticated API instance
            const { data } = await authApi.get<PartItemApiResponse>("/api/part-items");
            return data;
        } catch (error) {
            if (error instanceof AxiosError) {
                console.error("API error in getAllPartItems:", error.response?.data);

                if (error.response?.status === 401) {
                    toast.error("Authentication required to view part items.");
                    throw new Error("Authentication required");
                }

                throw new Error(error.response?.data?.message || "Error listing part items");
            }
            console.error("Unknown error in getAllPartItems:", error);
            throw new Error("Error listing part items");
        }
    };

    static getCarPartItems = async (carId: string): Promise<PartItemApiResponse> => {
        try {
            // Create a new axios instance with auth headers embedded
            const authApi = createAuthApi();

            // Make request with car-specific endpoint
            const { data } = await authApi.get<PartItemApiResponse>(`/api/part-items/car/${carId}/gold-in-stock`);
            return data;
        } catch (error) {
            if (error instanceof AxiosError) {
                console.error("API error in getCarPartItems:", error.response?.data);

                if (error.response?.status === 401) {
                    toast.error("Authentication required to view car part items.");
                    throw new Error("Authentication required");
                }

                throw new Error(error.response?.data?.message || "Error listing car part items");
            }
            console.error("Unknown error in getCarPartItems:", error);
            throw new Error("Error listing car part items");
        }
    };

    static createPartItem = async (partData: CreatePartItemDto): Promise<SinglePartItemApiResponse> => {
        try {
            // Create a new axios instance with auth headers embedded
            const authApi = createAuthApi();

            // Make request with authenticated API instance
            const { data } = await authApi.post<SinglePartItemApiResponse>("/api/part-items", partData);
            return data;
        } catch (error) {
            if (error instanceof AxiosError) {
                console.error("API error in createPartItem:", error.response?.data);

                if (error.response?.status === 401) {
                    toast.error("Authentication required to create a part item.");
                    throw new Error("Authentication required");
                }

                throw new Error(error.response?.data?.message || "Error creating part item");
            }
            console.error("Unknown error in createPartItem:", error);
            throw new Error("Error creating part item");
        }
    };

    static deletePartItem = async (partItemId: string): Promise<{ success: boolean; message: string }> => {
        try {
            // Create a new axios instance with auth headers embedded
            const authApi = createAuthApi();

            // Make request with authenticated API instance
            const { data } = await authApi.delete<{ success: boolean; message: string }>(`/api/part-items/${partItemId}`);
            return data;
        } catch (error) {
            if (error instanceof AxiosError) {
                console.error("API error in deletePartItem:", error.response?.data);

                if (error.response?.status === 401) {
                    toast.error("Authentication required to delete a part item.");
                    throw new Error("Authentication required");
                }

                throw new Error(error.response?.data?.message || "Error deleting part item");
            }
            console.error("Unknown error in deletePartItem:", error);
            throw new Error("Error deleting part item");
        }
    };

    static importPartsFromGsf = async (carNumber: string): Promise<{ success: boolean; message: string }> => {
        try {
            // Create a new axios instance with auth headers embedded
            const authApi = createAuthApi();

            // Make request with authenticated API instance
            const { data } = await authApi.post<{ success: boolean; message: string }>(`/api/part-items/import/gsf/${carNumber}`);
            return data;
        } catch (error) {
            if (error instanceof AxiosError) {
                console.error("API error in importPartsFromGsf:", error.response?.data);

                if (error.response?.status === 401) {
                    toast.error("Authentication required to import parts.");
                    throw new Error("Authentication required");
                }

                throw new Error(error.response?.data?.message || "Error importing parts from GSF");
            }
            console.error("Unknown error in importPartsFromGsf:", error);
            throw new Error("Error importing parts from GSF");
        }
    };
} 