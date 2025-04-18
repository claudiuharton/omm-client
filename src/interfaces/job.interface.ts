export interface Job {
    id: string;
    name: string;
    description?: string;
    duration: number;
    basePrice?: number;
    category?: string;
    createdAt?: string;
    searchQuery?: string;
}

export interface JobResponse {
    success?: boolean;
    message?: string;
    responseObject: Job[];
}
