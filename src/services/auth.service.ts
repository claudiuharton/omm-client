import { AxiosError } from "axios";
import { configApi } from "../api/configApi";
import { LoginResponse, RegisterUser } from "../interfaces";

export class AuthService {
    static login = async(email: string, password: string): Promise<LoginResponse> => {
        try {
            const { data } = await configApi.post<LoginResponse>('/api/auth/login', {email, password});
            return data;
        } catch (error) {
            if(error instanceof AxiosError){
                console.log(error.response?.data?.message);
                throw new Error(error.response?.data.message)
            }
            console.log(error);
            throw new Error('Cannot log in')
        }
    }

    static registerUser = async(dataUser: RegisterUser): Promise<RegisterUser> => {
        try {
            const { data } = await configApi.post<RegisterUser>('/api/auth/register/client', dataUser);
            return data;
        } catch (error) {
            if(error instanceof AxiosError){
                console.log(error.response?.data);
                throw new Error(error.response?.data)
            }
            console.log(error);
            throw new Error('Cannot register')
        }
    }
    static logoutUser = async(): Promise<RegisterUser> => {
        try {
            const { data } = await configApi.get<RegisterUser>('/api/auth/logout');
            return data;
        } catch (error) {
            if(error instanceof AxiosError){
                console.log(error.response?.data);
                throw new Error(error.response?.data)
            }
            console.log(error);
            throw new Error('Cannot register')
        }
    }
}