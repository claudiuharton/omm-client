import { useEffect, useState, useCallback, useRef } from "react";
import { useAuthStore, useJobStore } from "../stores";
import { Loader } from "../components/Loader";
import { MechanicBooking } from "../components/MechanicBooking";
import { Booking as BookingObj } from "../interfaces/booking.interface";

/**
 * EmptyState component for when there are no items to display
 */
const EmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg text-center">
        <h3 className="text-xl font-medium text-gray-700 mb-2">
            No service requests found
        </h3>
        <p className="text-gray-500 mb-4">
            There are no pending service requests at this time
        </p>
    </div>
);

/**
 * ErrorDisplay component for showing error states
 */
const ErrorDisplay = ({ message, onRetry }: { message: string, onRetry: () => void }) => (
    <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg text-center">
        <h3 className="text-xl font-medium text-red-700 mb-2">
            Something went wrong
        </h3>
        <p className="text-red-500 mb-4">{message}</p>
        <button
            onClick={onRetry}
            className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
        >
            Try Again
        </button>
    </div>
);

/**
 * MechanicDashboard component
 */
export const MechanicDashboard = () => {
    // Component state
    const [isLoading, setIsLoading] = useState(true); // Assume loading until we know auth status
    const [error, setError] = useState<string | null>(null);

    // Refs
    const isMountedRef = useRef(true);
    const dataFetchedRef = useRef(false);
    const isFetchingRef = useRef(false); // Track if fetch is in progress

    // Store Selectors
    const getMechanicBookings = useJobStore(state => state.getMechanicBookings);
    const bookings = useJobStore(state => state.bookings);
    const user = useAuthStore(state => state.user);
    const status = useAuthStore(state => state.status);

    // --- Callbacks ---
    const fetchDataInternal = useCallback(async () => {
        // Prevent concurrent fetches
        if (!isMountedRef.current || isFetchingRef.current) {
            console.log(`Fetch skipped: mounted=${isMountedRef.current}, fetching=${isFetchingRef.current}`);
            return;
        }

        console.log('Starting data fetch for mechanic bookings...');
        isFetchingRef.current = true; // Mark as fetching START
        setError(null); // Clear previous errors

        try {
            await getMechanicBookings();
            if (isMountedRef.current) {
                dataFetchedRef.current = true;
                console.log('Mechanic bookings fetch successful.');
            }
        } catch (err) {
            console.error('Data fetch error:', err);
            if (isMountedRef.current) {
                setError('Failed to load service requests.');
            }
        } finally {
            // Important: Reset the fetching flag and component's isLoading state
            if (isMountedRef.current) {
                isFetchingRef.current = false; // Mark as fetching END
                setIsLoading(false);
            }
            console.log('Finished data fetch attempt.');
        }
    }, [getMechanicBookings]);

    const handleRetry = useCallback(() => {
        console.log('Retrying data fetch...');
        setError(null);
        dataFetchedRef.current = false;
        fetchDataInternal();
    }, [fetchDataInternal]);

    // --- Effects ---

    // Effect 1: Mount/Unmount tracking
    useEffect(() => {
        console.log('MechanicDashboard mounted');
        isMountedRef.current = true;
        return () => {
            console.log('MechanicDashboard unmounting');
            isMountedRef.current = false;
        };
    }, []);

    // Effect 2: Trigger data fetching *only* when conditions are met
    useEffect(() => {
        console.log(`Fetch Trigger Effect: status=${status}, fetched=${dataFetchedRef.current}, fetching=${isFetchingRef.current}`);
        if (status === 'authorized' && isMountedRef.current && !dataFetchedRef.current && !isFetchingRef.current) {
            console.log('Triggering data fetch and setting loading state...');
            // Mark that a fetch attempt has been initiated.
            // Resetting this requires a retry or auth status change.
            dataFetchedRef.current = true;
            setIsLoading(true); // SET LOADING TRUE HERE
            fetchDataInternal(); // Call the stable fetch callback
        } else if (status !== 'authorized' && isMountedRef.current) {
            // If user is no longer authorized (logged out, etc.), reset the fetched flag
            // so data is fetched again if they log back in.
            console.log('Resetting fetched flag due to non-authorized status.');
            dataFetchedRef.current = false;
        }
    }, [status, fetchDataInternal]);

    // Effect to refresh data when assignments change
    useEffect(() => {
        // Set up a periodic refresh every 30 seconds
        const refreshInterval = setInterval(() => {
            if (status === 'authorized' && isMountedRef.current && !isFetchingRef.current) {
                console.log('Refreshing booking data...');
                fetchDataInternal();
            }
        }, 30000); // 30 seconds

        return () => clearInterval(refreshInterval);
    }, [status, fetchDataInternal]);

    // --- Render Logic ---
    console.log(`Rendering: isLoading=${isLoading}, status=${status}, error=${error}, fetched=${dataFetchedRef.current}`);

    if (isLoading) {
        console.log('Render: Loader');
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader />
            </div>
        );
    }

    if (error) {
        console.log('Render: ErrorDisplay');
        return <ErrorDisplay message={error} onRetry={handleRetry} />;
    }

    // If not loading and no error, but still not authorized (edge case, AdminLayout should handle)
    if (status !== 'authorized') {
        console.warn('Render: Fallback null (status not authorized)');
        return null;
    }

    // Group bookings by assignment status
    const myBookings = bookings.filter(booking => booking.mechanicId === user?.id);
    const availableBookings = bookings.filter(booking => !booking.mechanicId);
    const otherBookings = bookings.filter(booking => booking.mechanicId && booking.mechanicId !== user?.id);

    // Authorized, not loading, no error: Render main content
    console.log('Render: Main Content');
    return (
        <div className="w-full max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Mechanic Dashboard</h1>
                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-md">
                    <p>Welcome, <span className="font-medium">{user?.firstName} {user?.lastName}</span></p>
                    <p className="text-sm">Specialization: {user?.specialization || "General"}</p>
                </div>
            </div>

            {/* My Jobs Section */}
            {myBookings.length > 0 && (
                <div className="mb-12">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">My Jobs</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myBookings.map((item: BookingObj) => (
                            <MechanicBooking key={item.id} item={item} />
                        ))}
                    </div>
                </div>
            )}

            {/* Available Jobs Section */}
            <div className="mb-12">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Available Jobs</h2>
                {availableBookings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableBookings.map((item: BookingObj) => (
                            <MechanicBooking key={item.id} item={item} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-500 text-center">No available jobs at this time</p>
                    </div>
                )}
            </div>

            {/* Other Mechanics' Jobs Section */}
            {otherBookings.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Other Mechanics' Jobs</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {otherBookings.map((item: BookingObj) => (
                            <MechanicBooking key={item.id} item={item} />
                        ))}
                    </div>
                </div>
            )}

            {/* Empty state if no jobs at all */}
            {bookings.length === 0 && <EmptyState />}
        </div>
    );
}; 