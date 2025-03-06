import {AxiosError} from "axios";
import {configApi} from "../api/configApi";
import {JobResponse} from "../interfaces/job.interface.ts";
import {PartItemResponse} from "../interfaces/partItem.interface.ts";
import {BookingResponse} from "../interfaces/booking.interface.ts";

export class JobService {
    static getAllJobs = async (): Promise<JobResponse> => {
        try {
            const {data} = await configApi.get<JobResponse>("/api/jobs/all");
            return data;
        } catch (error) {
            if (error instanceof AxiosError) {
                console.log(error.response?.data);
                throw new Error(error.response?.data);
            }
            console.log(error);
            throw new Error("Error getting all jobs");
        }
    };

    static getAllBookings = async (): Promise<BookingResponse> => {
        try {
            const {data} = await configApi.get<BookingResponse>("/api/bookings");
            return data;
        } catch (error) {
            if (error instanceof AxiosError) {
                console.log(error.response?.data);
                throw new Error(error.response?.data);
            }
            console.log(error);
            throw new Error("Error getting all jobs");
        }
    };
    static getPartItems = async (vin: string, part: string): Promise<PartItemResponse> => {
        try {
            const {data} = await configApi.post<PartItemResponse>("/api/jobs/articles", {vin, part},
            );
            return data;
        } catch (error) {
            if (error instanceof AxiosError) {
                console.log(error.response?.data);
                throw new Error(error.response?.data);
            }
            console.log(error);
            throw new Error("Error getting part items");
        }
    };
    static initiatePayment = async (id: string): Promise<void> => {
        try {
            const {data} = await configApi.post<{ responseObject: { href:string } }>("/api/pay", {

                id,
                redirectUrl: "http://localhost:5173/thank-you"

            });
            window.location.replace(data.responseObject.href)
        } catch (error) {
            if (error instanceof AxiosError) {
                console.log(error.response?.data);
                throw new Error(error.response?.data);
            }
            console.log(error);
            throw new Error("Error getting part items");
        }
    };

    static addBooking = async (booking: {
        timeSlots: any;
        jobs: any;
        partItems: any;
        postalCode: any;
        selectedCar: string | null
    }): Promise<JobResponse> => {
        try {
            const {data} = await configApi.post<JobResponse>("/api/bookings", booking);
            return data;
        } catch (error) {
            if (error instanceof AxiosError) {
                console.log(error.response?.data);
                throw new Error(error.response?.data);
            }
            console.log(error);
            throw new Error("Error adding booking");
        }
    };
    static deleteBooking = async (id: string) => {
        try {
            const {data} = await configApi.delete(`/api/bookings/${id}`);
            return data;
        } catch (error) {
            if (error instanceof AxiosError) {
                console.log(error.response?.data);
                throw new Error(error.response?.data);
            }
            console.log(error);
            throw new Error("Error deleting booking");
        }
    }

}
