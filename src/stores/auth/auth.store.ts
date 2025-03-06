import {StateCreator, create} from "zustand";
import {AuthStatus, RegisterUser, User} from "../../interfaces";
import {devtools, persist} from "zustand/middleware";
import {AuthService} from "../../services/auth.service";
import {toast} from "sonner";
import {ProfileService} from "../../services/profile.service.ts";

export interface AuthState {
    status: AuthStatus;
    token?: string;
    user?: User;

    loginUser: (email: string, password: string) => Promise<void>;
    logoutUser: () => void;
    registerUser: (data: RegisterUser) => Promise<void>;
    getUser: () => void;
    addAddress: (item: string) => void;
}

const storeApi: StateCreator<AuthState> = (set) => ({
    status: "unauthorized",
    token: undefined,
    user: undefined,
    loginUser: async (email: string, password: string) => {
        try {
            const response = await AuthService.login(email, password);
            const {token, user} = response.responseObject;
            set({status: "authorized", token, user});
        } catch (error) {
            set({status: "unauthorized", token: undefined, user: undefined});
            toast.error((error as { message: string }).message);
        }
    },
    logoutUser: async () => {
        await AuthService.logoutUser();

        set({status: "unauthorized", token: undefined, user: undefined});
    },
    registerUser: async (data: RegisterUser) => {
        try {
            await AuthService.registerUser(data);
        } catch (error) {
            throw new Error(`${error}`);
        }
    },
    addAddress: async (item: string) => {
        try {

            const response = await ProfileService.addAddress(item);
            const user = response.responseObject;
            set({user});
        } catch (error) {
            toast.error(error.message)
            throw new Error(error);
        }
    },
    getUser: async () => {
        try {
            const response = await ProfileService.getUser();
            const user = response.responseObject.user;
            set({user});
        } catch (error) {
            throw new Error(`${error}`);
        }
    },
});

export const useAuthStore = create<AuthState>()(
    devtools(
        persist(
            storeApi, {name: "auth-storage"}
        ))
);
