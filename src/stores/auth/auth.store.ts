import { StateCreator, create } from "zustand";
import { AuthStatus, RegisterUser, RegisterMechanic, User } from "../../interfaces";
import { devtools, persist } from "zustand/middleware";
import { AuthService } from "../../services/auth.service";
import { toast } from "sonner";
import { ProfileService } from "../../services/profile.service.ts";

export interface AuthState {
    status: AuthStatus;
    token?: string;
    user?: User;

    loginUser: (email: string, password: string) => Promise<void>;
    logoutUser: () => void;
    registerUser: (data: RegisterUser) => Promise<void>;
    registerMechanic: (data: RegisterMechanic) => Promise<void>;
    getUser: () => void;
    addAddress: (item: string) => void;
    checkAuthStatus: () => Promise<void>;
}

const storeApi: StateCreator<AuthState> = (set, get) => ({
    status: "pending", // Start with pending to show initial loading
    token: undefined,
    user: undefined,
    loginUser: async (email: string, password: string) => {
        try {
            console.log('[AuthStore] Login attempt:', email);
            const response = await AuthService.login(email, password);
            const { token, user } = response.responseObject;
            console.log('[AuthStore] Login successful, setting status to authorized');
            set({ status: "authorized", token, user });
        } catch (error) {
            console.error('[AuthStore] Login failed:', error);
            toast.error("Login failed. Please check your credentials.");
            throw error;
        }
    },
    logoutUser: async () => {
        try {
            console.log('[AuthStore] Logging out user');
            await AuthService.logoutUser();
        } catch (error) {
            console.error("[AuthStore] Logout error:", error);
        }
        console.log('[AuthStore] Setting status to unauthorized');
        set({ status: "unauthorized", token: undefined, user: undefined });
    },
    registerUser: async (data: RegisterUser) => {
        try {
            console.log('[AuthStore] Registering user:', data.email);
            await AuthService.registerUser(data);
        } catch (error) {
            console.error('[AuthStore] Registration failed:', error);
            throw new Error(`${error}`);
        }
    },
    registerMechanic: async (data: RegisterMechanic) => {
        try {
            console.log('[AuthStore] Registering mechanic:', data.email);
            await AuthService.registerMechanic(data);
        } catch (error) {
            console.error('[AuthStore] Mechanic registration failed:', error);
            throw new Error(`${error}`);
        }
    },
    addAddress: async (item: string) => {
        try {
            console.log('[AuthStore] Adding address:', item);
            const response = await ProfileService.addAddress(item);
            const user = response.responseObject;
            console.log('[AuthStore] Address added, updating user');
            set({ user });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Error adding address";
            console.error('[AuthStore] Add address failed:', errorMessage);
            toast.error(errorMessage);
            throw new Error(errorMessage);
        }
    },
    getUser: async () => {
        try {
            console.log('[AuthStore] Getting user info');
            const response = await ProfileService.getUser();
            const user = response.responseObject.user;
            console.log('[AuthStore] User info retrieved, updating user');
            set({ user });
        } catch (error) {
            console.error('[AuthStore] Get user failed:', error);
            throw new Error(`${error}`);
        }
    },
    checkAuthStatus: async () => {
        const currentStatus = get().status;
        console.log(`[AuthStore] Checking auth status (current: ${currentStatus})`);
        try {
            const response = await AuthService.checkAuth();
            if (response.responseObject) {
                const { token, user } = response.responseObject;
                console.log('[AuthStore] Auth check successful, setting status to authorized');
                set({ status: "authorized", token, user });
            } else {
                console.log('[AuthStore] Auth check returned no user, setting status to unauthorized');
                set({ status: "unauthorized", token: undefined, user: undefined });
            }
        } catch (error) {
            console.error("[AuthStore] Auth check error:", error);
            console.log('[AuthStore] Auth check failed, setting status to unauthorized');
            set({ status: "unauthorized", token: undefined, user: undefined });
            throw error;
        }
    },
});

export const useAuthStore = create<AuthState>()(
    devtools(
        persist(
            storeApi,
            {
                name: "auth-storage",
                onRehydrateStorage: () => (state) => {
                    // After rehydration, verify the token if we have one
                    console.log('[AuthStore] Rehydration complete, state:', state ? `Token: ${state.token ? 'exists' : 'none'}, Status: ${state.status}` : 'null');

                    if (state && state.token) {
                        // We have a token from storage, verify it
                        state.checkAuthStatus().catch(err => {
                            console.error('[AuthStore] Token verification after rehydration failed:', err);
                        });
                    } else if (state) {
                        // No token in storage, set to unauthorized explicitly
                        state.status = "unauthorized";
                        console.log('[AuthStore] No token after rehydration, setting status to unauthorized');
                    }
                }
            }
        ))
);
