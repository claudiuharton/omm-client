export interface PartItem {
    id: string;
    title?: string;
    sku?: string;
    name: string;
    description?: string;
    itemCode: string; // Required in our implementation
    tier?: string;
    top?: string[];
    price: number;
    priceForConsumer?: number; // Made optional
    stockQuantity: number; // Added for our implementation
    stockSummary?: string;
    stocksData?: {
        Local: number;
        Hub: number;
        Overnight: boolean;
        Company: boolean;
    };
    info?: any;
    category?: number;
    createdAt?: string;
    updatedAt?: string;
    isDeleted?: boolean; // Added for soft delete functionality
}

export interface PartItemApiResponse {
    success: boolean;
    message: string;
    responseObject: PartItem[];
    statusCode?: number; // Made optional
}

export interface SinglePartItemApiResponse {
    success: boolean;
    message: string;
    responseObject: PartItem;
    statusCode?: number; // Made optional
}

// DTO for creating a new part item
export interface CreatePartItemDto {
    title: string;
    sku: string;
    price: number;
    priceForConsumer: number;
    stockQuantity: number;
    description?: string;
    tier?: string;
} 