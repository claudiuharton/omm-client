import { StateCreator, create } from "zustand";
import { devtools, persist } from 'zustand/middleware';
import { Car } from "../../interfaces";
import { CarService } from "../../services/car.service";
import { toast } from "sonner";

/**
 * Car state interface
 */
export interface CarState {
    // Data
    cars: Car[],
    car?: Car,

    // UI states
    isLoading: boolean,
    error: string | null,

    // Actions
    getAllCars: () => Promise<void>,
    getCar: (id: string) => Promise<void>,
    createCar: (car: { carNumber: string }) => Promise<void>,
    deleteCar: (id: string) => Promise<void>,
    updateCar: (id: string | undefined, car: Car) => Promise<void>,

    // State management helpers
    setError: (error: string | null) => void,
    resetState: () => void,
}

/**
 * Initial state for the car store
 */
const initialState = {
    cars: [],
    car: undefined,
    isLoading: false,
    error: null,
};

/**
 * Creates the car store with state management logic
 */
const createCarStore: StateCreator<CarState> = (set, get) => ({
    ...initialState,

    /**
     * Fetch all cars for the current user
     */
    getAllCars: async () => {
        try {
            set({ isLoading: true, error: null });
            const res = await CarService.getAllCars();
            set({ cars: res.responseObject, isLoading: false });
        } catch (error) {
            const errorMessage = error instanceof Error
                ? error.message
                : "Failed to retrieve cars";
            set({ error: errorMessage, isLoading: false });
            toast.error(errorMessage);
        }
    },

    /**
     * Get a specific car by ID
     */
    getCar: async (id: string) => {
        try {
            set({ isLoading: true, error: null });
            const res = await CarService.getCar(id);
            set({ car: res.responseObject[0], isLoading: false });
        } catch (error) {
            const errorMessage = error instanceof Error
                ? error.message
                : "Failed to retrieve car";
            set({ error: errorMessage, isLoading: false });
            toast.error(errorMessage);
        }
    },

    /**
     * Create a new car with the provided car number
     */
    createCar: async (item: { carNumber: string }) => {
        try {
            set({ isLoading: true, error: null });
            const res = await CarService.createCar(item);
            const newItem = res.responseObject;

            set((state) => ({
                cars: [...state.cars, newItem] as Car[],
                isLoading: false
            }));

            toast.success("Car successfully added");
        } catch (error) {
            const errorMessage = error instanceof Error
                ? error.message
                : "Failed to add car";
            set({ error: errorMessage, isLoading: false });
            toast.error(errorMessage);
        }
    },

    /**
     * Delete a car by ID
     */
    deleteCar: async (id: string) => {
        try {
            set({ isLoading: true, error: null });
            await CarService.deleteCar(id);

            set((state) => ({
                cars: state.cars.filter(item => item.id !== id),
                isLoading: false
            }));

            toast.success("Car removed successfully");
        } catch (error) {
            const errorMessage = error instanceof Error
                ? error.message
                : "Failed to delete car";
            set({ error: errorMessage, isLoading: false });
            toast.error(errorMessage);
        }
    },

    /**
     * Update an existing car's information
     */
    updateCar: async (id: string | undefined, item: Car) => {
        if (!id) {
            set({ error: "Car ID is required for updating" });
            toast.error("Car ID is required for updating");
            return;
        }

        try {
            set({ isLoading: true, error: null });
            const res = await CarService.updateCar(id, item);

            // Update cars array with the updated item
            set((state) => {
                const updatedCars = state.cars.map(car =>
                    car.id === id ? res.responseObject[0] : car
                );
                return { cars: updatedCars, isLoading: false };
            });

            toast.success("Car updated successfully");
        } catch (error) {
            const errorMessage = error instanceof Error
                ? error.message
                : "Failed to update car";
            set({ error: errorMessage, isLoading: false });
            toast.error(errorMessage);
        }
    },

    /**
     * Set error state
     */
    setError: (error: string | null) => set({ error }),

    /**
     * Reset state to initial values
     */
    resetState: () => set(initialState)
});

/**
 * Car store with middleware for development and persistence
 */
export const useCarStore = create<CarState>()(
    devtools(
        persist(
            createCarStore,
            {
                name: 'car-storage',
                partialize: (state) => ({
                    cars: state.cars
                })
            }
        )
    )
);

