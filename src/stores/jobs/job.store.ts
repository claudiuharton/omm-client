import {StateCreator, create} from "zustand";
import {devtools} from 'zustand/middleware';
import {Job} from "../../interfaces/job.interface.ts";
import {JobService} from "../../services/job.service.ts";
import {PartItem} from "../../interfaces/partItem.interface.ts";
import {toast} from "sonner";
import {Booking} from "../../interfaces/booking.interface.ts";


export interface JobState {
    jobs: Job[],
    bookings: Booking[],
    partItems: PartItem[],
    getPartItems: (vin: string, part: string) => void;
    cleanPartItems: () => void;
    getAllJobs: () => void;
    selectedCar: string | null;
    selectCar: (car: string | null) => void;
    getBookings: () => void;
    addBooking: (booking: {
        timeSlots: any;
        jobs: any;
        partItems: any;
        postalCode: any;
        selectedCar: string | null
    }) => void;
    deleteBooking: (id: string) => void;
    initiatePayment: (id: string) => void;
}


const storeApi: StateCreator<JobState> = (set) => ({
    jobs: [],
    bookings: [],
    selectedCar: null,
    selectCar: (car: string | null) => {
        set({selectedCar: car});
    },
    partItems: [],
    cleanPartItems: () => {
        set({partItems: []});
    },
    initiatePayment: async (id: string) => {
        try {
            await JobService.initiatePayment(id);
            toast.success("Payment initiated successfully")
        } catch (error) {
            throw new Error("Error initiating payment");
        }
    },
    getPartItems: async (vin: string, part: string) => {
        try {
            const res = await JobService.getPartItems(vin, part);
            const itemsArray = res.responseObject;
            const category = Date.now()
            set((state) => ({
                partItems: [...state.partItems.filter((item) => !itemsArray.map(el => el.id).includes(item.id)), ...itemsArray.map(item => ({
                    ...item,
                    category
                }))], // Merge existing items with new items
            }));
        } catch (error) {
            throw new Error("Error getting part items");
        }
    },
    getAllJobs: async () => {
        try {
            const res = await JobService.getAllJobs();
            const itemsArray = res.responseObject;

            set({jobs: itemsArray});

        } catch (error) {
            throw new Error("Error getting jobs");
        }
    },
    getBookings: async () => {
        try {
            const res = await JobService.getAllBookings();
            const itemsArray = res.responseObject;

            set({bookings: itemsArray});

        } catch (error) {
            throw new Error("Error getting jobs");
        }
    },

    addBooking: async (booking: {
        timeSlots: any;
        jobs: any;
        partItems: any;
        postalCode: any;
        selectedCar: string | null
    }) => {
        try {
            const res = await JobService.addBooking(booking);
            const returnedBooking = res.responseObject;
            toast.success(res.message)

            set(state => ({bookings: [...state.bookings, returnedBooking], selectedCar: null}));

        } catch (error) {
            console.error(error)
            throw new Error("Error adding booking");
        }
    },
    deleteBooking: async (id: string) => {
        try {
            await JobService.deleteBooking(id);
            set((state: JobState) => ({bookings: state.bookings.filter(item => item.id !== id)}));
            toast.success("Booking removed successfully")
        } catch (error) {
            throw new Error("Error deleting booking");
        }
    }

});

export const useJobStore = create<JobState>()(
    devtools(
        storeApi
    )
)

