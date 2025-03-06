export interface LoginResponse {
    responseObject: {
        user: {
            id: string;
            firstName: string;
            lastName: string;
            phone: string;
            email: string;
            role: string;
            updatedAt: string;
            zipCode: string;
            createdAt: string;
        }
        token: string;
    }
}

export interface RegisterUser {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    password: string;
}
