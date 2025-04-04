import { StateCreator, create } from "zustand";
import { devtools } from 'zustand/middleware';
import { Car } from "../../interfaces";
import { CarService } from "../../services/car.service";
import { toast } from "sonner";


export interface CarState {
    cars: Car[],
    car?: Car,
    carLoading?: boolean,
    getAllCars: () => void;
    getCar: (id: string) => void;
    createCar: (car: { vrm: string }) => void;
    deleteCar: (id: string) => void;
    updateCar: (id: string | undefined, car: Car) => void;
}


const storeApi: StateCreator<CarState> = (set) => ({
    cars: [],
    car: undefined,
    getAllCars: async () => {
        try {
            const res = await CarService.getAllCars();
            const itemsArray = res.responseObject;
            set({ cars: itemsArray });
        } catch (error) {
            throw new Error("Error al obtener los items");
        }
    },
    getCar: async (id: string) => {
        try {
            const res = await CarService.getCar(id);
            const item = res.responseObject;

            set({ cars: item });
        } catch (error) {
            throw new Error("Error on get item");
        }
    },
    createCar: async (item: { vrm: string }) => {
        try {
            set({ carLoading: true });
            const res = await CarService.createCar(item);
            const newItem = res.responseObject;

            set((state: CarState) => ({ cars: [...state.cars, newItem] as Car[] }));
            set({ carLoading: false });

            toast.success("Car successfully added")
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error("An unexpected error occurred")
            }
            set({ carLoading: false });
            throw error;
        }
    },
    deleteCar: async (id: string) => {
        try {
            await CarService.deleteCar(id);
            set((state: CarState) => ({ cars: state.cars.filter(item => item.id !== id) }));
            toast.success("Car removed successfully")
        } catch (error) {
            throw new Error("Error al eliminar el item");
        }
    },
    updateCar: async (id: string | undefined, item: Car) => {
        try {
            const res = await CarService.updateCar(id, item);
            const updatedItem = res.responseObject;

            set({ cars: updatedItem });
            toast.success("Car updated successfully")
        } catch (error) {
            throw new Error("Error al obtener el item");
        }
    }
});

export const useCarStore = create<CarState>()(
    devtools(
        storeApi
    )
)

