import { useCallback, useState, useEffect } from 'react';
import { useAuthStore } from '../stores';
import { User, AuthStatus } from '../interfaces';
import { useStore } from 'zustand';

/**
 * Custom hook to access auth state and actions, simplified to avoid local state duplication.
 */
export function useAuth() {
    // Select state directly from the store using useStore
    const status = useStore(useAuthStore, (state) => state.status);
    const user = useStore(useAuthStore, (state) => state.user);
    const token = useStore(useAuthStore, (state) => state.token);

    // State for loading/error specific to actions initiated by *this hook instance*
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get actions directly from the store (these are stable)
    const storeLogin = useAuthStore((state) => state.loginUser);
    const storeCheckAuth = useAuthStore((state) => state.checkAuthStatus);
    const storeLogout = useAuthStore((state) => state.logoutUser);
    const storeAddAddress = useAuthStore((state) => state.addAddress);

    // Debug logging for status changes
    useEffect(() => {
        console.log(`[useAuth] Status changed: ${status}, User:`, user ? `${user.email} (${user.role})` : 'none');
    }, [status, user]);

    // --- Wrapped Actions with Loading/Error Handling ---

    const loginUser = useCallback(async (email: string, password: string) => {
        setLoading(true);
        setError(null);
        console.log(`[useAuth] Attempting login for: ${email}`);
        try {
            await storeLogin(email, password);
            // No need to update local state, store change will trigger re-render
            setLoading(false);
            console.log(`[useAuth] Login successful`);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
            setLoading(false);
            console.error(`[useAuth] Login failed:`, err);
            return false;
        }
    }, [storeLogin]);

    const checkAuthStatus = useCallback(async () => {
        // Prevent check if already loading from another action in this hook instance
        if (loading) {
            console.log(`[useAuth] Skipping checkAuthStatus - already loading`);
            return;
        }
        console.log(`[useAuth] Starting checkAuthStatus`);
        setLoading(true);
        setError(null);
        try {
            await storeCheckAuth();
            // Store update handles status change
            setLoading(false);
            console.log(`[useAuth] checkAuthStatus completed`);
        } catch (err) {
            console.error('[useAuth] Authentication check failed:', err);
            setError(err instanceof Error ? err.message : 'Authentication check failed');
            // Store's checkAuthStatus already sets status to unauthorized on error
            setLoading(false);
            // Re-throw if needed elsewhere, but often not necessary here
            // throw err;
        }
    }, [storeCheckAuth, loading]);

    const logoutUser = useCallback(() => {
        // Logout is typically quick, but we can add loading state if needed
        // setLoading(true);
        console.log(`[useAuth] Logging out user`);
        try {
            storeLogout();
            console.log(`[useAuth] Logout completed`);
            // Store update handles status change
        } catch (err) {
            console.error('[useAuth] Logout failed:', err);
            // setError('Logout failed'); // Optional: set error state
        }
        // finally {
        //     setLoading(false);
        // }
    }, [storeLogout]);

    const addAddress = useCallback(async (zipCode: string) => {
        setLoading(true);
        setError(null);
        console.log(`[useAuth] Adding address: ${zipCode}`);
        try {
            await storeAddAddress(zipCode);
            setLoading(false);
            console.log(`[useAuth] Address added successfully`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add address');
            setLoading(false);
            console.error(`[useAuth] Failed to add address:`, err);
        }
    }, [storeAddAddress]);

    // Return the selected state and wrapped actions
    return {
        status,
        user,
        token,
        loading, // Loading state specifically for actions called via this hook
        error,   // Error state specifically for actions called via this hook
        isAuthorized: status === 'authorized',
        isPending: status === 'pending',
        loginUser,
        checkAuthStatus,
        logoutUser,
        addAddress // Expose addAddress
    };
} 