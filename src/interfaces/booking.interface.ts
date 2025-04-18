import { Car } from "./car.interface.ts";
import { Job } from "./job.interface.ts";
import { PartItem } from "./partItem.interface.ts";

export interface TimeSlot {
    id: string;
    timeInterval: string;
    dates: string[];
}

export interface Booking {
    id: string,
    car: Car,
    jobs: Job[],
    location: { postalCode: string }
    schedules: TimeSlot[],
    jobsPrices: { id: string, price: number, duration: number }[],
    partItemsPrices: Record<string, { price: number }>,
    partItems: PartItem[]
    totalPrice: number,
    createdAt: string,
    status: string,
    mechanic?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    }
}

export interface BookingResponse {
    responseObject: Booking | Booking[];
    message?: string;
    statusCode?: number;
}

export interface BookingRequest {
    timeSlots: TimeSlot[];
    jobs: Job[];
    partItems: PartItem[];
    postalCode: string;
    selectedCar: string | null;
}
