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
    jobsPrices: Record<string, { price: number, duration: number }>,
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
    timeSlots: {
        date: string;
        time: string;
    }[];
    jobs: {
        id: string;
        duration: number;
        price: number;
    }[];
    partItems: {
        id: string;
        price: number;
    }[];
    postalCode: string;
    selectedCar: string | null;
}

// Interface for updating bookings - matches the API response structure
export interface BookingUpdateRequest {
    selectedJobs?: string[];
    totalPrice?: number;
    partItemsPrices?: {
        id: string;
        price: number;
    }[];
    status?: "pending" | "accepted" | "completed" | "open" | "canceled" | "authorized" | "expired" | "failed" | "paid";
    clientId?: string;
    mechanicId?: string;
    carId?: string;
    pendingJobs?: {
        id: string;
        description: string;
        estimatedTime: number;
        estimatedCost: number;
    }[];
    jobs?: {
        id: string;
        jobName: string;
        timeRequired: number;
        status: string;
    }[];
    location?: {
        id?: string;
        address: string;
        city: string;
        postalCode: string;
        state?: string;
        country: string;
        latitude?: number;
        longitude?: number;
    };
    schedules?: {
        id?: string;
        timeInterval: string;
        dates?: string[];
    }[];
}
