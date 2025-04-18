import { configApi } from "../api/configApi";
import { PartItemApiResponse, SinglePartItemApiResponse, CreatePartItemDto } from "../interfaces";

export class PartItemService {
    private static BASE_URL = "/api/part-items"; // Updated to include /api prefix

    static async getAllPartItems(token: string): Promise<PartItemApiResponse> {
        try {
            const response = await configApi.get<PartItemApiResponse>(
                this.BASE_URL,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            console.log("PartItemService.getAllPartItems response:", response.data);
            return response.data;
        } catch (error: any) {
            console.error("Error fetching part items:", error);
            const message = error.response?.data?.message || error.message || "Failed to fetch part items";
            return { success: false, message, responseObject: [] };
        }
    }

    static async createPartItem(partData: CreatePartItemDto, token: string): Promise<SinglePartItemApiResponse> {
        try {
            const response = await configApi.post<SinglePartItemApiResponse>(
                this.BASE_URL,
                partData,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            console.log("PartItemService.createPartItem response:", response.data);
            return response.data;
        } catch (error: any) {
            console.error("Error creating part item:", error);
            const message = error.response?.data?.message || error.message || "Failed to create part item";
            return { success: false, message, responseObject: null as any }; // Return null object on failure
        }
    }

    static async deletePartItem(partItemId: string, token: string): Promise<{ success: boolean; message: string }> {
        // Assuming soft delete or actual delete - adjust based on API
        const url = `${this.BASE_URL}/${partItemId}`;
        try {
            // Using DELETE method for example
            const response = await configApi.delete<{ success: boolean; message: string }>(
                url,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            console.log("PartItemService.deletePartItem response:", response.data);
            return response.data;
        } catch (error: any) {
            console.error(`Error deleting part item ${partItemId}:`, error);
            const message = error.response?.data?.message || error.message || "Failed to delete part item";
            return { success: false, message };
        }
    }

    // Add updatePartItem if needed later
} 