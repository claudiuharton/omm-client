import { AxiosError } from "axios";
import { createAuthApi } from "../api/configApi";
import { Car, CarResponse } from "../interfaces";
import { toast } from "sonner";
import { useAuthStore } from "../stores";

export class CarService {
  static getAllCars = async (): Promise<CarResponse> => {
    try {
      // Check if user is admin before making request to /api/cars/all
      const user = useAuthStore.getState().user;

      // Create a new axios instance with auth headers embedded
      const authApi = createAuthApi();

      // Make request with authenticated API instance
      let url = "/api/cars";

      // Only use the /all endpoint if user is admin
      if (user?.role === 'admin') {
        url = "/api/cars/all";
      }

      const { data } = await authApi.get<CarResponse>(url);
      return data;
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error("API error in getAllCars:", error.response?.data);

        if (error.response?.status === 401) {
          toast.error("Authentication required to view cars.");
          throw new Error("Authentication required");
        }

        if (error.response?.status === 403) {
          toast.error("You don't have permission to view all cars.");
          throw new Error("Permission denied");
        }

        throw new Error(error.response?.data || "Error listing cars");
      }
      console.error("Unknown error in getAllCars:", error);
      throw new Error("Error listing cars");
    }
  };

  static getCar = async (id: string | undefined): Promise<CarResponse> => {
    try {
      // Create a new axios instance with auth headers embedded
      const authApi = createAuthApi();

      // Make request with authenticated API instance
      const { data } = await authApi.get<CarResponse>(`/api/cars/${id}`);
      return data;
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error("API error in getCar:", error.response?.data);

        if (error.response?.status === 401) {
          toast.error("Authentication required to view car details.");
          throw new Error("Authentication required");
        }

        throw new Error(error.response?.data || "Error getting car");
      }
      console.error("Unknown error in getCar:", error);
      throw new Error("Error getting car");
    }
  };

  static createCar = async (item: { carNumber: string }): Promise<CarResponse> => {
    try {
      // Create a new axios instance with auth headers embedded
      const authApi = createAuthApi();

      // Make request with authenticated API instance
      const { data } = await authApi.post<CarResponse>("/api/cars", item);
      return data;
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error("API error in createCar:", error.response?.data);

        if (error.response?.status === 401) {
          toast.error("Authentication required to create a car.");
          throw new Error("Authentication required");
        }

        throw new Error(error.response?.data?.message || "Error creating car");
      }
      console.error("Unknown error in createCar:", error);
      throw new Error("Error creating car");
    }
  };

  static deleteCar = async (id: string) => {
    try {
      // Create a new axios instance with auth headers embedded
      const authApi = createAuthApi();

      // Make request with authenticated API instance
      const { data } = await authApi.delete(`/api/cars/${id}`);
      return data;
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error("API error in deleteCar:", error.response?.data);

        if (error.response?.status === 401) {
          toast.error("Authentication required to delete a car.");
          throw new Error("Authentication required");
        }

        throw new Error(error.response?.data || "Error deleting car");
      }
      console.error("Unknown error in deleteCar:", error);
      throw new Error("Error deleting car");
    }
  };

  static updateCar = async (id: string | undefined, item: Car): Promise<CarResponse> => {
    try {
      // Create a new axios instance with auth headers embedded
      const authApi = createAuthApi();

      // Make request with authenticated API instance
      const { data } = await authApi.put<CarResponse>(
        `/api/cars/${id}`,
        {
          carNumber: item.carNumber,
          make: item.make,
          model: item.model
        }
      );
      return data;
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error("API error in updateCar:", error.response?.data);

        if (error.response?.status === 401) {
          toast.error("Authentication required to update a car.");
          throw new Error("Authentication required");
        }

        throw new Error(error.response?.data || "Error updating car");
      }
      console.error("Unknown error in updateCar:", error);
      throw new Error("Error updating car");
    }
  };
}
