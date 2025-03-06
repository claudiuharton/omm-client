import {Car} from "./car.interface.ts";
import {Job} from "./job.interface.ts";
import {PartItem} from "./partItem.interface.ts";

export interface Booking {
    id: string,
    car: Car,
    jobs: [Job],
    location: { postalCode: string }
    schedules: [{ id: string, timeInterval: string, dates: [string] }],
    jobsPrices: [{ id: string, price: number, duration: number }],
    partItemsPrices: [{ id: string, price: number }],
    partItems: [PartItem]
    totalPrice: number,
    createdAt: string,
    status: string

}

export interface BookingResponse {
    responseObject: [Booking];
}
