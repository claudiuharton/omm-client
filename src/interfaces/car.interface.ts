export interface Car {

    id: string
    carNumber: string,

    "model": string,
    "make": string,
    "bookings": [],
    "engineSize": string,
    "dateOfManufacture": string,
    "motExpiryDate"?: string,
    "tecDocKType": string,
    "vin": string,

    createdAt: string,
    updatedAt: string,

}

export interface CarResponse {
    responseObject: [Car];
}
