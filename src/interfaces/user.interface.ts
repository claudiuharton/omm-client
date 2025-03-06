export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    createdAt: string;
    updatedAt: string;
    zipCode: string;
}

export interface ProfileResponse {
    responseObject: User ;
}
