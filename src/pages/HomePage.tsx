import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore, useCarStore, useJobStore } from "../stores";
import { Car } from "../components/Car";
import { Booking } from "../components/Booking";
import { Loader } from "../components/Loader";
import { BookingEditDialog } from "../components/BookingEditDialog";
import { Booking as BookingObj, BookingRequest } from "../interfaces/booking.interface";
import { Car as CarObj } from "../interfaces/car.interface";
import { toast } from "sonner";

/**
 * EmptyState component for when there are no items to display
 */
const EmptyState = ({ type, onAction }: { type: 'cars' | 'bookings', onAction?: () => void }) => (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg text-center">
        <h3 className="text-xl font-medium text-gray-700 mb-2">
            No {type} found
        </h3>
        <p className="text-gray-500 mb-4">
            {type === 'cars'
                ? 'Add your first car to get started'
                : 'No bookings available yet'}
        </p>
        {type === 'cars' && onAction && (
            <button
                onClick={onAction}
                className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
                Add Your First Car
            </button>
        )}
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
 * HomePage component - Refined logic
 */
export const HomePage = () => {
    // Component state
    const [isLoading, setIsLoading] = useState(true); // Assume loading until we know auth status
    const [error, setError] = useState<string | null>(null);
    const [isAddJobDialogOpen, setIsAddJobDialogOpen] = useState(false);
    const [selectedCarForJob, setSelectedCarForJob] = useState<CarObj | null>(null);
    const [hasRedirected, setHasRedirected] = useState(false);
    
    // Edit booking state
    const [isEditBookingDialogOpen, setIsEditBookingDialogOpen] = useState(false);
    const [selectedBookingForEdit, setSelectedBookingForEdit] = useState<BookingObj | null>(null);

    // Refs
    const isMountedRef = useRef(true);
    const dataFetchedRef = useRef(false);
    const isFetchingRef = useRef(false); // Track if fetch is in progress
    const redirectedZipRef = useRef(false);

    // Hooks
    const navigate = useNavigate();

    // Store Selectors - Refactored for stability
    const getAllCars = useCarStore(state => state.getAllCars);
    const cars = useCarStore(state => state.cars);
    const getAllJobs = useJobStore(state => state.getAllJobs);
    const getBookings = useJobStore(state => state.getBookings);
    const bookings = useJobStore(state => state.bookings);
    const user = useAuthStore(state => state.user);
    const status = useAuthStore(state => state.status);
    const addBooking = useJobStore(state => state.addBooking);
    const updateBooking = useJobStore(state => state.updateBooking);

    // --- Callbacks ---
    const handleAddCar = useCallback(() => navigate("/new-car"), [navigate]);

    const handleCarSelectForJob = useCallback((car: CarObj) => {
        console.log("Selected car for job:", car);
        setSelectedCarForJob(car);
        setIsAddJobDialogOpen(true);
    }, []);

    const handleCloseAddJobDialog = useCallback(() => {
        setIsAddJobDialogOpen(false);
        setSelectedCarForJob(null); // Optionally clear selection on close
    }, []);

    // Edit booking handlers
    const handleEditBooking = useCallback((booking: BookingObj) => {
        console.log("Selected booking for edit:", booking);
        setSelectedBookingForEdit(booking);
        setIsEditBookingDialogOpen(true);
    }, []);

    const handleCloseEditBookingDialog = useCallback(() => {
        setIsEditBookingDialogOpen(false);
        setSelectedBookingForEdit(null);
    }, []);

    const fetchDataInternal = useCallback(async () => {
        // Prevent concurrent fetches
        if (!isMountedRef.current || isFetchingRef.current) {
            console.log(`Fetch skipped: mounted=${isMountedRef.current}, fetching=${isFetchingRef.current}`);
            return;
        }

        console.log('Starting data fetch...');
        isFetchingRef.current = true; // Mark as fetching START
        setError(null); // Clear previous errors

        try {
            await getAllCars();
            await getAllJobs();

            // Only fetch bookings if user is not a mechanic
            if (user?.role !== 'mechanic') {
                await getBookings();
            }

            if (isMountedRef.current) {
                dataFetchedRef.current = true;
                console.log('Data fetch successful.');
            }
        } catch (err) {
            console.error('Data fetch error:', err);
            if (isMountedRef.current) {
                setError('Failed to load dashboard data.');
            }
        } finally {
            // Important: Reset the fetching flag and component's isLoading state
            if (isMountedRef.current) {
                isFetchingRef.current = false; // Mark as fetching END
                setIsLoading(false);
            }
            console.log('Finished data fetch attempt.');
        }
    }, [getAllCars, getAllJobs, getBookings, user?.role]);

    const handleRetry = useCallback(() => {
        console.log('Retrying data fetch...');
        setError(null);
        dataFetchedRef.current = false;
        fetchDataInternal();
    }, [fetchDataInternal]);

    // --- Effects ---

    // Effect 1: Mount/Unmount tracking
    useEffect(() => {
        console.log('HomePage mounted');
        isMountedRef.current = true;
        return () => {
            console.log('HomePage unmounting');
            isMountedRef.current = false;
        };
    }, []);

    // Effect 3: Trigger data fetching *only* when conditions are met
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
            setIsLoading(false); // SET LOADING FALSE HERE WHEN UNAUTHORIZED
        }
    }, [status, fetchDataInternal]);

    // Effect 4: Handle zip code redirection
    useEffect(() => {
        if (status === 'authorized' && user && !user.zipCode && !redirectedZipRef.current && isMountedRef.current) {
            console.log('Redirecting for zip code');
            redirectedZipRef.current = true;
            navigate('/add-address');
        }
    }, [status, user, navigate]);

    // Combined redirection logic for mechanic and admin in a single useEffect
    useEffect(() => {
        if (status === 'authorized' && user && isMountedRef.current && !hasRedirected) {
            if (user.role === 'mechanic') {
                console.log('Redirecting mechanic to mechanic dashboard');
                setHasRedirected(true);
                navigate('/mechanic-dashboard');
            } else if (user.role === 'admin') {
                console.log('Redirecting admin to admin dashboard');
                setHasRedirected(true);
                navigate('/admin');  // Changed to '/admin' to match router config
            }
        }
    }, [status, user, navigate, hasRedirected]);

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

    // Authentication is now handled by MainLayout, so we can render content directly
    console.log('Render: Main Content');
    return (
        <div className="w-full max-w-7xl mx-auto px-4">
            {/* Cars Section */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Your Cars</h1>
                {cars?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cars.map((item) => (
                            <Car key={item.id} item={item} onSelectForJob={handleCarSelectForJob} />
                        ))}
                    </div>
                ) : (
                    <EmptyState type="cars" onAction={handleAddCar} />
                )}
            </div>

            {/* Bookings Section */}
            {bookings && bookings.length > 0 && (
                <div className="mt-10">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Bookings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bookings.map((item: BookingObj) => (
                            <Booking 
                                key={item.id} 
                                item={item} 
                                onEdit={handleEditBooking}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Booking Edit Dialog (replaced AddJobDialog) */}
            {isAddJobDialogOpen && selectedCarForJob && (
                <BookingEditDialog
                    isOpen={isAddJobDialogOpen}
                    onClose={handleCloseAddJobDialog}
                    booking={null} // Pass null to indicate this is a new booking
                    onSave={async (newBooking: BookingObj) => {
                        // Validate required fields before API call
                        if (!newBooking.jobs || newBooking.jobs.length === 0) {
                            toast.error("Please select at least one job for the booking");
                            throw new Error("Please select at least one job for the booking");
                        }
                        
                        if (!newBooking.schedules || newBooking.schedules.length === 0) {
                            toast.error("Please add at least one schedule for the booking");
                            throw new Error("Please add at least one schedule for the booking");
                        }
                        
                        if (!newBooking.location?.postalCode) {
                            toast.error("Please set a postal code in the Location tab");
                            throw new Error("Please set a postal code in the Location tab");
                        }
                        
                        // Transform Booking to BookingRequest format to match API schema
                        const bookingRequest: BookingRequest = {
                            // Transform timeSlots: from {timeInterval, dates[]} to {date, time}[]
                            timeSlots: newBooking.schedules?.flatMap(schedule => 
                                schedule.dates.map(date => ({
                                    date: date,
                                    time: schedule.timeInterval
                                }))
                            ) || [],
                            // Transform jobs: add price field calculated from pricePerHour * duration / 60
                            jobs: newBooking.jobs?.map(job => ({
                                id: job.id,
                                duration: job.duration,
                                price: job.pricePerHour ? (job.pricePerHour * job.duration) / 60 : 0
                            })) || [],
                            // Transform partItems: change priceForConsumer to price
                            partItems: newBooking.partItems?.map(part => ({
                                id: part.id,
                                price: part.priceForConsumer || 0
                            })) || [],
                            postalCode: newBooking.location?.postalCode || '',
                            selectedCar: selectedCarForJob.id
                        };
                        
                        try {
                            // Use the existing addBooking from jobStore
                            await addBooking(bookingRequest);
                            toast.success(`Booking created for ${selectedCarForJob.make} ${selectedCarForJob.model}`);
                            // Success - let the BookingEditDialog close the modal
                        } catch (error: any) {
                            console.error('Error creating booking:', error);
                            const errorMsg = error instanceof Error ? error.message : "Failed to create booking";
                            toast.error(errorMsg);
                            // Re-throw the error so BookingEditDialog knows to keep the modal open
                            throw error;
                        }
                    }}
                    carId={selectedCarForJob.id} // Pass the car ID for the new booking
                />
            )}

            {/* Edit Booking Dialog */}
            {isEditBookingDialogOpen && selectedBookingForEdit && (
                <BookingEditDialog
                    isOpen={isEditBookingDialogOpen}
                    onClose={handleCloseEditBookingDialog}
                    booking={selectedBookingForEdit}
                    onSave={async (updatedBooking: BookingObj) => {
                        try {
                            // Transform the updated booking to the format expected by the API
                            const bookingUpdateRequest = {
                                // Transform timeSlots: from {timeInterval, dates[]} to {date, time}[]
                                timeSlots: updatedBooking.schedules?.flatMap(schedule => 
                                    schedule.dates.map(date => ({
                                        date: date,
                                        time: schedule.timeInterval
                                    }))
                                ) || [],
                                // Transform jobs: use the format expected by BookingUpdateRequest
                                jobs: updatedBooking.jobs?.map(job => ({
                                    id: job.id,
                                    duration: job.duration,
                                    price: updatedBooking.jobsPrices?.[job.id]?.price || 0
                                })) || [],
                                // Transform partItems: use the price from partItemsPrices
                                partItems: updatedBooking.partItems?.map(part => ({
                                    id: part.id,
                                    price: updatedBooking.partItemsPrices?.[part.id]?.price || part.priceForConsumer || 0
                                })) || [],
                                postalCode: updatedBooking.location?.postalCode || '',
                                status: updatedBooking.status as "pending" | "accepted" | "completed" | "open" | "canceled" | "authorized" | "expired" | "failed" | "paid"
                            };
                            
                            // Use the existing updateBooking from jobStore
                            await updateBooking(updatedBooking.id, bookingUpdateRequest);
                            toast.success(`Booking updated successfully`);
                            // Success - let the BookingEditDialog close the modal
                        } catch (error: any) {
                            console.error('Error updating booking:', error);
                            const errorMsg = error instanceof Error ? error.message : "Failed to update booking";
                            toast.error(errorMsg);
                            // Re-throw the error so BookingEditDialog knows to keep the modal open
                            throw error;
                        }
                    }}
                />
            )}
        </div>
    );
};