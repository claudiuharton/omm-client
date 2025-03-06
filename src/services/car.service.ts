import { AxiosError } from "axios";
import { configApi } from "../api/configApi";
import {Car, CarResponse} from "../interfaces";

export class CarService {
  static getAllCars = async (): Promise<CarResponse> => {
    try {
      const { data } = await configApi.get<CarResponse>("/api/cars");
      return data;
    } catch (error) {
      if (error instanceof AxiosError) {
        console.log(error.response?.data);
        throw new Error(error.response?.data);
      }
      console.log(error);
      throw new Error("Error al listar los items");
    }
  };

  static getCar = async (id: string | undefined): Promise<CarResponse> => {
    try {
      const { data } = await configApi.get<CarResponse>(`/api/cars/${id}`);
      return data;
    } catch (error) {
      if (error instanceof AxiosError) {
        console.log(error.response?.data);
        throw new Error(error.response?.data);
      }
      console.log(error);
      throw new Error("Error on getting item");
    }
  };

  static createCar = async (item: { carNumber: string }): Promise<CarResponse> => {
    try {
      const { data } = await configApi.post<CarResponse>("/api/cars", item);
      return data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(error.response?.data?.message);
      }
      throw new Error("Error on creating item");
    }
  };

  static deleteCar = async (id: string) => {
    try {
      const { data } = await configApi.delete(`/api/cars/${id}`);
      return data;
    } catch (error) {
      if (error instanceof AxiosError) {
        console.log(error.response?.data);
        throw new Error(error.response?.data);
      }
      console.log(error);
      throw new Error("Error al eliminar el item");
    }
  };

  static updateCar = async (id: string | undefined, item: Car): Promise<CarResponse> => {
    try {
      const { data } = await configApi.put<CarResponse>(`/api/cars/${id}`, {carNumber: item.carNumber, make: item.make, model: item.model});
      return data;
    } catch (error) {
      if (error instanceof AxiosError) {
        console.log(error.response?.data);
        throw new Error(error.response?.data);
      }
      console.log(error);
      throw new Error("Error al actualizar el item");
    }
  };
}
