import { useState, useCallback, useEffect } from "react";

/**
 * Interface for the useAsync hook return value
 */
interface UseAsyncReturn<T, E = Error> {
    isLoading: boolean;
    error: E | null;
    data: T | null;
    execute: (...args: any[]) => Promise<T | null>;
    reset: () => void;
}

/**
 * Hook for managing asynchronous operations with loading, error and success states
 * 
 * @param asyncFunction - The async function to execute
 * @param immediate - Whether to execute the function immediately on mount
 * @returns Object with loading state, error state, data, and control functions
 */
export function useAsync<T, E = Error>(
    asyncFunction: (...args: any[]) => Promise<T>,
    immediate = false
): UseAsyncReturn<T, E> {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<E | null>(null);
    const [data, setData] = useState<T | null>(null);

    // Function to execute the async function
    const execute = useCallback(
        async (...args: any[]): Promise<T | null> => {
            try {
                setIsLoading(true);
                setError(null);

                const result = await asyncFunction(...args);
                setData(result);
                return result;
            } catch (e) {
                setError(e as E);
                return null;
            } finally {
                setIsLoading(false);
            }
        },
        [asyncFunction]
    );

    // Reset all states
    const reset = useCallback(() => {
        setIsLoading(false);
        setError(null);
        setData(null);
    }, []);

    // Execute immediately if specified
    useEffect(() => {
        if (immediate) {
            execute();
        }
    }, [execute, immediate]);

    return { isLoading, error, data, execute, reset };
} 