import {AxiosError} from "axios";
import {configApi} from "../api/configApi";
import {LoginResponse, ProfileResponse, } from "../interfaces";
import {useAuthStore} from "../stores";

export class ProfileService {


    static addAddress = async (item: string): Promise<ProfileResponse> => {
        try {
            const user = useAuthStore.getState().user;

            const {data} = await configApi.put<ProfileResponse>(`/api/users/${user?.id}`, {zipCode: item});
            return data;
        } catch (error) {
            if (error instanceof AxiosError) {
                throw new Error(error.response?.data?.message);
            }
            throw new Error("Error on creating item");
        }
    };

    static getUser = async (): Promise<LoginResponse> => {
        try {
            const user = useAuthStore.getState().user;

            const {data} = await configApi.get<LoginResponse>(`/api/users/${user?.id}`);
            return data;
        } catch (error) {
            if (error instanceof AxiosError) {
                throw new Error(error.response?.data?.message);
            }
            throw new Error("Error on getting item");
        }
    };


}
