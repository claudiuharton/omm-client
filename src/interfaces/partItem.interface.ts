export interface PartItem {
    id: string;
    title: string;
    sku: string;
    name?: string;
    description?: string;
    itemCode?: string;
    tier: string;
    top?: string[];
    price?: number;
    priceForConsumer?: number;
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
    
    categoryTitle?: string;
    categoryImage?: string;
    img?: string;
    companyImg?: string;
    groups?: string[];
    fitment?: string | null;
    capacity?: string | null;
    updatedAt?: string;
}

export interface PartItemResponse {
    success: boolean;
    message: string;
    responseObject: PartItem[];
    statusCode: number;
}
