import { StateCreator, create } from "zustand";
import { devtools, persist } from 'zustand/middleware';
import { Job } from "../../interfaces/job.interface.ts";
import { JobService } from "../../services/job.service.ts";
import { PartItem } from "../../interfaces/partItem.interface.ts";
import { toast } from "sonner";
import { Booking, BookingResponse, BookingRequest } from "../../interfaces/booking.interface.ts";
import { useAuthStore } from "../auth/auth.store"; // Import auth store

// Define interface for JobResponse (Maybe remove if not used elsewhere, or refine)
// interface JobResponse {
//     responseObject: any;
//     message?: string;
//     statusCode?: number;
// }

export interface JobState {
    jobs: Job[],
    bookings: Booking[],
    partItems: PartItem[],
    getPartItems: (vin: string, part: string) => void;
    getAllPartItems: () => Promise<PartItem[]>;
    cleanPartItems: () => void;
    getAllJobs: () => void;
    selectedCar: string | null;
    selectCar: (car: string | null) => void;
    getBookings: () => void;
    getMechanicBookings: () => void;
    isAdminBookingsFetched: boolean; // Flag for admin fetch
    fetchAdminBookings: () => Promise<void>; // Action for admin fetch
    toggleMechanicAssignment: (bookingId: string, assign: boolean) => Promise<void>;
    addBooking: (booking: BookingRequest) => void;
    deleteBooking: (id: string) => void;
    initiatePayment: (id: string) => void;
}


const storeApi: StateCreator<JobState> = (set, get) => ({
    jobs: [],
    bookings: [],
    isAdminBookingsFetched: false, // Default value for the new flag
    selectedCar: null,
    selectCar: (car: string | null) => {
        set({ selectedCar: car });
    },
    partItems: [],
    cleanPartItems: () => {
        set({ partItems: [] });
    },
    initiatePayment: async (id: string) => {
        try {
            await JobService.initiatePayment(id);
            toast.success("Payment initiated successfully")
        } catch (error) {
            throw new Error("Error initiating payment");
        }
    },
    getAllPartItems: async () => {
        try {
            const res = await JobService.getAllPartItems();
            const itemsArray = res.responseObject;

            set({ partItems: itemsArray });
            return itemsArray;
        } catch (error) {
            toast.error("Error getting part items");
            throw new Error("Error getting part items");
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

            set({ jobs: itemsArray });

        } catch (error) {
            throw new Error("Error getting jobs");
        }
    },
    getBookings: async () => {
        // Get current user from auth store state
        const authUser = useAuthStore.getState().user;

        // If user is admin, do nothing in this action
        if (authUser?.role === 'admin') {
            console.log("User is admin, skipping getBookings (user-specific bookings).");
            return;
        }

        // Proceed only if user is not admin
        try {
            console.log("Fetching user-specific bookings...");
            const res = await JobService.getAllBookings();
            const bookingsArray = Array.isArray(res.responseObject)
                ? res.responseObject
                : res.responseObject ? [res.responseObject] : [];

            set({ bookings: bookingsArray });
            console.log("User-specific bookings fetched.");

        } catch (error) {
            console.error("Error in getBookings:", error);
            // Avoid throwing error here if it's not critical, 
            // maybe just log or show a non-blocking toast
            toast.error("Could not fetch your bookings.");
        }
    },
    getMechanicBookings: async () => {
        try {
            const res = await JobService.getAllMechanicBookings();
            const bookingsArray = Array.isArray(res.responseObject)
                ? res.responseObject
                : res.responseObject ? [res.responseObject] : [];

            set({ bookings: bookingsArray });

        } catch (error) {
            throw new Error("Error getting service requests");
        }
    },

    fetchAdminBookings: async () => {
        // Prevent fetching if already fetched
        if (get().isAdminBookingsFetched) {
            console.log("Admin bookings already fetched, skipping fetchAdminBookings.");
            return;
        }

        console.log("Fetching admin-specific bookings...");
        try {
            const res = await JobService.getAdminBookings();
            const bookingsArray = Array.isArray(res.responseObject)
                ? res.responseObject
                : res.responseObject ? [res.responseObject] : [];

            // Normalization removed - perform in component if needed
            // const normalizedBookings = bookingsArray.map(b => normalizeBookingData(b));

            set({ bookings: bookingsArray, isAdminBookingsFetched: true });
            console.log("Admin-specific bookings fetched and stored.");

        } catch (error) {
            console.error("Error fetching admin bookings:", error);
            toast.error("Could not load admin booking data.");
            // Optionally set an error state in the store here
            set({ isAdminBookingsFetched: false }); // Reset flag on error?
        }
    },

    addBooking: async (booking: BookingRequest) => {
        try {
            const res = await JobService.addBooking(booking);
            const bookingResponse = res as unknown as BookingResponse;
            const returnedBooking = Array.isArray(bookingResponse.responseObject)
                ? bookingResponse.responseObject[0]
                : bookingResponse.responseObject;

            if (!returnedBooking) {
                throw new Error("Invalid booking data received from API");
            }

            if (bookingResponse.message) {
                toast.success(bookingResponse.message);
            } else {
                toast.success("Booking added successfully");
            }

            set(state => ({
                bookings: [...state.bookings, returnedBooking],
                selectedCar: null
            }));

        } catch (error) {
            console.error("Error adding booking in store:", error);
            throw new Error("Error adding booking");
        }
    },
    deleteBooking: async (id: string) => {
        try {
            await JobService.deleteBooking(id);
            set((state: JobState) => ({ bookings: state.bookings.filter(item => item.id !== id) }));
            toast.success("Booking removed successfully")
        } catch (error) {
            throw new Error("Error deleting booking");
        }
    },
    toggleMechanicAssignment: async (bookingId: string, assign: boolean) => {
        try {
            const res = await JobService.assignMechanic(bookingId, assign);
            const bookingResponse = res as BookingResponse;

            set((state) => {
                const newBookings = [...state.bookings];
                const index = newBookings.findIndex((b) => b.id === bookingId);

                if (index !== -1 && bookingResponse.responseObject) {
                    const updatedBooking = Array.isArray(bookingResponse.responseObject)
                        ? bookingResponse.responseObject[0]
                        : bookingResponse.responseObject;

                    newBookings[index] = updatedBooking;
                }

                return { bookings: newBookings };
            });

            toast.success(assign ? "Mechanic assigned successfully" : "Mechanic unassigned successfully");
        } catch (error) {
            console.error("Error assigning/unassigning mechanic:", error);
            toast.error("Failed to update mechanic assignment");
        }
    }

});

export const useJobStore = create<JobState>()(
    devtools(
        persist(
            storeApi,
            {
                name: "job-store"
            }
        )
    )
)

