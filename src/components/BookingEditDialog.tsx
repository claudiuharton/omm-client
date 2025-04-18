import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Booking, TimeSlot } from "../interfaces/booking.interface";
import { Job } from "../interfaces/job.interface";
import { PartItem } from "../interfaces/partItem.interface";
import { User } from "../interfaces/user.interface";
import { JobService } from "../services/job.service";
import { Loader } from "./Loader";
import { RiCloseLine, RiAddLine, RiSaveLine, RiUserLine } from "react-icons/ri";
import { format } from "date-fns";
import { useAuth } from "../hooks/useAuth";
import { createAuthApi } from "../api/configApi";
import { Car } from "../interfaces/car.interface";

interface BookingEditDialogProps {
    isOpen: boolean;
    onClose: () => void;
    booking: Booking | null;
    mechanics?: User[];
    clients?: User[];
    onSave: (updatedBooking: Booking) => void;
    isAdmin?: boolean;
    carId?: string; // For new bookings (client mode)
}

/**
 * Normalize booking data to ensure all required fields are present and have the correct type
 */
const normalizeBookingData = (booking: Booking): Booking => {
    const normalizedBooking = { ...booking };

    // Ensure arrays
    if (!Array.isArray(normalizedBooking.jobs)) normalizedBooking.jobs = [];
    if (!Array.isArray(normalizedBooking.partItems)) normalizedBooking.partItems = [];
    if (!Array.isArray(normalizedBooking.schedules)) normalizedBooking.schedules = [];
    if (!Array.isArray(normalizedBooking.jobsPrices)) normalizedBooking.jobsPrices = [];
    if (typeof normalizedBooking.partItemsPrices !== 'object' || normalizedBooking.partItemsPrices === null || Array.isArray(normalizedBooking.partItemsPrices)) {
        normalizedBooking.partItemsPrices = {};
    }

    // Ensure other required fields
    if (!normalizedBooking.location) normalizedBooking.location = { postalCode: '' };
    if (!normalizedBooking.car) normalizedBooking.car = {
        id: '',
        carNumber: '',
        make: '',
        model: '',
        bookings: [],
        engineSize: '',
        dateOfManufacture: '',
        tecDocKType: '',
        vin: '',
        createdAt: '',
        updatedAt: ''
    };

    return normalizedBooking;
};

/**
 * BookingEditDialog component
 * Reusable component for creating and editing bookings
 * Works in both admin and client modes
 */
export const BookingEditDialog = ({
    isOpen,
    onClose,
    booking,
    mechanics = [],
    clients = [],
    onSave,
    isAdmin = false,
    carId
}: BookingEditDialogProps) => {
    // Local state for editing
    const [editedBooking, setEditedBooking] = useState<Booking | null>(null);
    const [activeTab, setActiveTab] = useState('overview'); // Default to overview tab

    // State for part items selection
    const [availablePartItems, setAvailablePartItems] = useState<PartItem[]>([]);
    const [isLoadingParts, setIsLoadingParts] = useState(false);
    const [partsError, setPartsError] = useState<string | null>(null);
    const [partsSearchQuery, setPartsSearchQuery] = useState('');

    // State for jobs selection
    const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
    const [isLoadingJobs, setIsLoadingJobs] = useState(false);
    const [jobsError, setJobsError] = useState<string | null>(null);
    const [jobsSearchQuery, setJobsSearchQuery] = useState('');

    // State for cars
    const [cars, setCars] = useState<Car[]>([]);
    const [isLoadingCars, setIsLoadingCars] = useState(false);
    const [carsError, setCarsError] = useState<string | null>(null);

    // Get auth state
    const { user } = useAuth();

    // Reset state when dialog opens with new booking
    useEffect(() => {
        if (booking) {
            // Normalize the booking data to ensure consistent structure
            setEditedBooking(normalizeBookingData(booking));
            // Reset tabs and search
            setActiveTab('overview');
            setPartsSearchQuery('');
            setJobsSearchQuery('');
        } else if (isOpen && !booking && carId) {
            // Create a new booking
            const newBooking: Booking = {
                id: `temp-${Date.now()}`,
                car: {
                    id: carId,
                    carNumber: '',
                    make: '',
                    model: '',
                    bookings: [],
                    engineSize: '',
                    dateOfManufacture: '',
                    tecDocKType: '',
                    vin: '',
                    createdAt: '',
                    updatedAt: ''
                },
                jobs: [],
                location: { postalCode: '' },
                schedules: [],
                jobsPrices: [],
                partItemsPrices: {},
                partItems: [],
                totalPrice: 0,
                createdAt: new Date().toISOString(),
                status: 'pending'
            };
            setEditedBooking(newBooking);
            // Set active tab to jobs for new bookings
            setActiveTab('jobs');
        }
    }, [booking, isOpen, carId]);

    // Fetch available part items and jobs when the dialog opens
    useEffect(() => {
        if (isOpen) {
            fetchAvailablePartItems();
            fetchAvailableJobs();
        }
    }, [isOpen, user]);

    // Function to fetch available part items
    const fetchAvailablePartItems = async () => {
        setIsLoadingParts(true);
        setPartsError(null);

        try {
            const response = await JobService.getAllPartItems();
            if (response.responseObject) {
                const partItemsData = Array.isArray(response.responseObject)
                    ? response.responseObject
                    : [response.responseObject];

                setAvailablePartItems(partItemsData);
            } else {
                setAvailablePartItems([]);
            }
        } catch (error) {
            console.error("Error fetching part items:", error);
            setPartsError("Failed to load available part items");
        } finally {
            setIsLoadingParts(false);
        }
    };

    // Function to fetch available jobs
    const fetchAvailableJobs = async () => {
        setIsLoadingJobs(true);
        setJobsError(null);

        try {
            const response = await JobService.getAllJobs();
            if (response.responseObject) {
                const jobsData = Array.isArray(response.responseObject)
                    ? response.responseObject
                    : [response.responseObject];

                setAvailableJobs(jobsData);
            } else {
                setAvailableJobs([]);
            }
        } catch (error) {
            console.error("Error fetching jobs:", error);
            setJobsError("Failed to load available jobs");
        } finally {
            setIsLoadingJobs(false);
        }
    };

    // Function to fetch all cars (admin only)
    const fetchAllCars = async () => {
        if (user?.role !== 'admin') {
            console.log('Cars fetch skipped: User is not admin', user?.role);
            return;
        }

        console.log('Fetching cars as admin user', user?.role);
        setIsLoadingCars(true);
        setCarsError(null);

        try {
            // Create a new axios instance with auth headers embedded
            const authApi = createAuthApi();

            // Make request with authenticated API instance
            const { data } = await authApi.get('/api/cars/all');

            if (data.responseObject) {
                const carsData = Array.isArray(data.responseObject)
                    ? data.responseObject
                    : [data.responseObject];

                setCars(carsData);
                console.log('Cars fetched successfully:', carsData.length);
            } else {
                setCars([]);
                console.log('No cars found');
            }
        } catch (error) {
            console.error("Error fetching cars:", error);
            setCarsError("Failed to load cars");
            toast.error("Failed to load cars");
        } finally {
            setIsLoadingCars(false);
        }
    };

    if (!isOpen || !editedBooking) return null;

    // Handler for job updates
    const handleJobChange = (index: number, field: string, value: string | number | boolean) => {
        const updatedJobs = [...editedBooking.jobs];
        updatedJobs[index] = { ...updatedJobs[index], [field]: value };

        setEditedBooking({
            ...editedBooking,
            jobs: updatedJobs
        });
    };

    // Handler for schedule updates
    const handleScheduleChange = (index: number, field: string, value: any) => {
        const newSchedules = [...(editedBooking.schedules || [])];
        newSchedules[index] = {
            ...newSchedules[index],
            [field]: value
        };

        setEditedBooking({
            ...editedBooking,
            schedules: newSchedules
        });
    };

    // Handler for mechanic assignment
    const handleMechanicChange = (mechanicId: string) => {
        if (!isAdmin) return; // Only admins can assign mechanics

        const selectedMechanic = mechanics.find(m => m.id === mechanicId);

        setEditedBooking({
            ...editedBooking,
            mechanic: selectedMechanic ? {
                id: selectedMechanic.id,
                firstName: selectedMechanic.firstName,
                lastName: selectedMechanic.lastName,
                email: selectedMechanic.email,
                phone: selectedMechanic.phone || ''
            } : undefined
        });
    };

    // Remove a job
    const handleRemoveJob = (index: number) => {
        const updatedJobs = [...editedBooking.jobs];
        const removedJob = updatedJobs[index];
        updatedJobs.splice(index, 1);

        // Also remove from jobsPrices
        const updatedJobsPrices = editedBooking.jobsPrices.filter(jp => jp.id !== removedJob.id);

        setEditedBooking({
            ...editedBooking,
            jobs: updatedJobs,
            jobsPrices: updatedJobsPrices
        });
    };

    // Remove a schedule
    const handleRemoveSchedule = (index: number) => {
        const newSchedules = [...(editedBooking.schedules || [])];
        newSchedules.splice(index, 1);

        setEditedBooking({
            ...editedBooking,
            schedules: newSchedules
        });
    };

    // Add a new job (placeholder, would need proper job selection UI in production)
    const handleAddJob = () => {
        const newJob: Job = {
            id: `temp-${Date.now()}`,
            name: 'New Job',
            description: 'Description',
            duration: 60,
            basePrice: 0,
            category: 'Other',
            createdAt: new Date().toISOString()
        };

        setEditedBooking({
            ...editedBooking,
            jobs: [...editedBooking.jobs, newJob]
        });
    };

    // Add a new schedule
    const handleAddSchedule = () => {
        const newSchedule = {
            date: format(new Date(), 'yyyy-MM-dd'),
            time: '09:00',
            notes: '',
            completed: false
        };

        setEditedBooking({
            ...editedBooking,
            schedules: [...(editedBooking.schedules || []), newSchedule]
        });
    };

    // Handle save
    const handleSave = () => {
        if (editedBooking) {
            onSave(editedBooking);
            onClose();
        }
    };

    // Helper function to get tier badge styles
    const getTierBadgeClasses = (tier: string): string => {
        const tierLower = tier?.toLowerCase();
        switch (tierLower) {
            case 'gold':
                return 'bg-yellow-100 text-yellow-800';
            case 'silver':
                return 'bg-gray-200 text-gray-800';
            case 'bronze':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-blue-100 text-blue-800'; // Default/Standard tier style
        }
    };

    // Minimal content for now - will expand in next edits
    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {booking ? 'Edit Booking' : 'Create New Booking'}
                        {editedBooking.car.carNumber && ` - ${editedBooking.car.carNumber}`}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <RiCloseLine size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-4">
                    <nav className="flex -mb-px space-x-8">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('jobs')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'jobs'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Jobs ({editedBooking.jobs.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('parts')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'parts'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Parts ({editedBooking.partItems.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('schedule')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'schedule'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Schedule ({editedBooking.schedules.length})
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => setActiveTab('assignment')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'assignment'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Assignment
                            </button>
                        )}
                    </nav>
                </div>

                {/* Tab content */}
                <div className="mb-6">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div>
                            <h3 className="text-lg font-medium mb-4">Booking Overview</h3>

                            {/* Jobs Section */}
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold uppercase text-gray-600 border-b pb-2 mb-3">
                                    Jobs ({editedBooking.jobs.length})
                                </h4>
                                {editedBooking.jobs.length > 0 ? (
                                    <div className="space-y-2">
                                        {editedBooking.jobs.map((job, index) => (
                                            <div key={job.id} className="bg-gray-50 p-3 rounded flex justify-between items-center">
                                                <div>
                                                    <div className="font-medium">{job.name}</div>
                                                    <div className="text-sm text-gray-500">{job.description}</div>
                                                </div>
                                                <div className="flex items-center">
                                                    <div className="text-right mr-3">
                                                        <div className="text-sm font-medium">
                                                            £{Array.isArray(editedBooking.jobsPrices)
                                                                ? editedBooking.jobsPrices.find(jp => jp.id === job.id)?.price.toFixed(2) || '0.00'
                                                                : '0.00'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">{job.duration} min</div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveJob(index)}
                                                        className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-50"
                                                        title="Remove Job"
                                                    >
                                                        <RiCloseLine />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm italic">No jobs added</p>
                                )}
                            </div>

                            {/* Parts Section */}
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold uppercase text-gray-600 border-b pb-2 mb-3">
                                    Parts ({editedBooking.partItems.length})
                                </h4>
                                {editedBooking.partItems.length > 0 ? (
                                    <div className="space-y-3">
                                        {editedBooking.partItems.map((part) => {
                                            // Find the corresponding price entry using the part ID as the key
                                            const priceEntry = editedBooking.partItemsPrices?.[part.id];

                                            return (
                                                <div key={part.id} className="border rounded-lg p-3 bg-white grid grid-cols-[1fr_100px_40px] gap-2 items-center">
                                                    {/* Left Side: Part Info */}
                                                    <div className="pr-2">
                                                        <div className="font-medium">{part.title}</div>
                                                        <div className="text-sm text-gray-600">
                                                            {part.sku} {part.tier && <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getTierBadgeClasses(part.tier)}`}>{part.tier}</span>}
                                                        </div>
                                                    </div>

                                                    {/* Middle: Price Info - Fixed width column */}
                                                    <div className="text-right">
                                                        <div className="font-medium">
                                                            £{priceEntry ? priceEntry.price.toFixed(2) : part.priceForConsumer.toFixed(2)}
                                                        </div>
                                                        {isAdmin && (
                                                            <div className="text-xs text-gray-500">
                                                                (Acq: £{part.price?.toFixed(2) ?? 'N/A'})
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Right Side: Delete button - Fixed width */}
                                                    <button
                                                        onClick={() => {
                                                            // Remove the part from partItems
                                                            const updatedPartItems = editedBooking.partItems.filter(p => p.id !== part.id);
                                                            // Remove the price from partItemsPrices object
                                                            const updatedPrices = { ...editedBooking.partItemsPrices };
                                                            delete updatedPrices[part.id];

                                                            setEditedBooking({
                                                                ...editedBooking,
                                                                partItems: updatedPartItems,
                                                                partItemsPrices: updatedPrices
                                                            });

                                                            toast.success(`Removed ${part.title} from booking`);
                                                        }}
                                                        className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 justify-self-end"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                        </svg>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm italic">No parts added</p>
                                )}
                            </div>

                            {/* Schedules Section */}
                            <div className="mb-6">
                                <h4 className="text-sm font-semibold uppercase text-gray-600 border-b pb-2 mb-3">
                                    Schedules ({editedBooking.schedules.length})
                                </h4>
                                {editedBooking.schedules.length > 0 ? (
                                    <div className="space-y-2">
                                        {editedBooking.schedules.map(schedule => (
                                            <div key={schedule.id} className="bg-gray-50 p-3 rounded">
                                                <div className="font-medium mb-1">{schedule.timeInterval}</div>
                                                <div className="text-sm text-gray-600">
                                                    Dates: {schedule.dates.join(', ')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm italic">No schedules added</p>
                                )}
                            </div>

                            {/* Assignment Section - for admin only */}
                            {isAdmin && (
                                <div>
                                    <h4 className="text-sm font-semibold uppercase text-gray-600 border-b pb-2 mb-3">
                                        Assignment
                                    </h4>
                                    {editedBooking.mechanic ? (
                                        <div className="bg-indigo-50 p-3 rounded">
                                            <div className="flex items-center gap-2">
                                                <RiUserLine className="text-indigo-600" />
                                                <span className="font-medium">
                                                    {editedBooking.mechanic.firstName} {editedBooking.mechanic.lastName}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-600 ml-6">{editedBooking.mechanic.email}</div>
                                            {editedBooking.mechanic.phone && (
                                                <div className="text-sm text-gray-600 ml-6">{editedBooking.mechanic.phone}</div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-sm italic">No mechanic assigned</p>
                                    )}
                                </div>
                            )}

                            {/* Summary Section */}
                            <div className="mt-6 pt-4 border-t border-gray-200">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">Total Price:</span>
                                    <span className="font-bold text-lg">£{editedBooking.totalPrice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-gray-600 mt-1">
                                    <span>Status:</span>
                                    <span className={`px-2 py-0.5 rounded-full ${editedBooking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        editedBooking.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                                            editedBooking.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                editedBooking.status === 'paid' ? 'bg-indigo-100 text-indigo-800' :
                                                    editedBooking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'
                                        }`}>
                                        {editedBooking.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Jobs Tab */}
                    {activeTab === 'jobs' && (
                        <div>
                            <div className="flex justify-between mb-2">
                                <h3 className="text-lg font-medium">Service Jobs</h3>
                                <button
                                    onClick={() => setActiveTab('selectJobs')}
                                    className="inline-flex items-center text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1.5 rounded-md"
                                >
                                    <RiAddLine className="mr-1" /> Select Jobs
                                </button>
                            </div>

                            {/* Existing Jobs Summary */}
                            {editedBooking.jobs.length > 0 && (
                                <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                                    <h4 className="text-sm font-semibold uppercase text-gray-600 mb-3">
                                        Current Jobs
                                    </h4>
                                    <div className="space-y-2">
                                        {editedBooking.jobs.map((job, index) => (
                                            <div key={`summary-${job.id}`} className="flex justify-between items-start border-b border-gray-200 pb-2 last:border-b-0 last:pb-0">
                                                <div>
                                                    <div className="font-medium">{job.name}</div>
                                                    <div className="text-sm text-gray-500">{job.description}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium">
                                                        £{Array.isArray(editedBooking.jobsPrices)
                                                            ? editedBooking.jobsPrices.find(jp => jp.id === job.id)?.price.toFixed(2) || '0.00'
                                                            : '0.00'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{job.duration} min</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-white rounded border">
                                {editedBooking.jobs.map((job, index) => (
                                    <div key={job.id} className="p-3 border-b last:border-b-0 hover:bg-gray-50">
                                        <div className="flex justify-between mb-2">
                                            <div className="font-medium">{job.name}</div>
                                            <button
                                                onClick={() => handleRemoveJob(index)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <RiCloseLine />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                            <div>
                                                <label className="block text-xs text-gray-500">Description</label>
                                                <input
                                                    type="text"
                                                    value={job.description || ''}
                                                    onChange={(e) => handleJobChange(index, 'description', e.target.value)}
                                                    className="w-full p-1 border rounded text-sm"
                                                    disabled={!isAdmin} // Only admin can edit description
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500">Duration (min)</label>
                                                <input
                                                    type="number"
                                                    value={job.duration || 0}
                                                    onChange={(e) => handleJobChange(index, 'duration', parseInt(e.target.value))}
                                                    className="w-full p-1 border rounded text-sm"
                                                    min="0"
                                                    disabled={!isAdmin} // Only admin can edit duration
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500">Price (£)</label>
                                                <input
                                                    type="number"
                                                    value={Array.isArray(editedBooking.jobsPrices)
                                                        ? editedBooking.jobsPrices.find(jp => jp.id === job.id)?.price || 0
                                                        : 0}
                                                    onChange={(e) => {
                                                        if (!isAdmin) return; // Only admin can edit price

                                                        const updatedPrices = Array.isArray(editedBooking.jobsPrices)
                                                            ? [...editedBooking.jobsPrices]
                                                            : [];
                                                        const priceIdx = updatedPrices.findIndex(jp => jp.id === job.id);
                                                        if (priceIdx >= 0) {
                                                            updatedPrices[priceIdx].price = parseFloat(e.target.value);
                                                        } else {
                                                            updatedPrices.push({
                                                                id: job.id,
                                                                price: parseFloat(e.target.value),
                                                                duration: job.duration
                                                            });
                                                        }
                                                        setEditedBooking({
                                                            ...editedBooking,
                                                            jobsPrices: updatedPrices
                                                        });
                                                    }}
                                                    className="w-full p-1 border rounded text-sm"
                                                    min="0"
                                                    step="0.01"
                                                    disabled={!isAdmin} // Only admin can edit price
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {editedBooking.jobs.length === 0 && (
                                    <div className="text-center p-8 border border-dashed rounded-lg">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs added</h3>
                                        <p className="mt-1 text-sm text-gray-500">Get started by selecting jobs for this booking.</p>
                                        <div className="mt-6">
                                            <button
                                                onClick={() => setActiveTab('selectJobs')}
                                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            >
                                                <RiAddLine className="-ml-1 mr-2 h-5 w-5" />
                                                Select Jobs
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Select Jobs Tab */}
                    {activeTab === 'selectJobs' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium">Select Jobs</h3>
                                <button
                                    onClick={() => setActiveTab('jobs')}
                                    className="flex items-center text-sm text-gray-600 hover:text-gray-800"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back to Jobs
                                </button>
                            </div>

                            {/* Search box */}
                            <div className="relative mb-4">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                                    </svg>
                                </div>
                                <input
                                    type="search"
                                    className="block w-full p-2.5 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Search jobs by name or category..."
                                    value={jobsSearchQuery}
                                    onChange={(e) => setJobsSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Jobs list */}
                            {isLoadingJobs ? (
                                <div className="flex justify-center items-center py-8">
                                    <Loader />
                                </div>
                            ) : jobsError ? (
                                <div className="text-center border border-red-200 bg-red-50 rounded-lg p-4 text-red-800">
                                    <p>Error loading jobs: {jobsError}</p>
                                    <button
                                        onClick={fetchAvailableJobs}
                                        className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
                                    >
                                        Try again
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {availableJobs.length > 0 ? (
                                        <div className="border rounded-md divide-y max-h-96 overflow-y-auto">
                                            {availableJobs
                                                .filter(job => {
                                                    if (!jobsSearchQuery.trim()) return true;
                                                    const search = jobsSearchQuery.toLowerCase();
                                                    return (
                                                        (job.name?.toLowerCase() ?? '').includes(search) ||
                                                        (job.description?.toLowerCase() ?? '').includes(search) ||
                                                        (job.category?.toLowerCase() ?? '').includes(search)
                                                    );
                                                })
                                                .map(job => {
                                                    const isAlreadyAdded = editedBooking.jobs.some(j => j.id === job.id);
                                                    return (
                                                        <div key={job.id} className="p-3 hover:bg-gray-50 flex justify-between items-center">
                                                            <div>
                                                                <div className="font-medium">{job.name}</div>
                                                                <div className="text-sm text-gray-600">{job.description}</div>
                                                                <div className="flex items-center mt-1 gap-2">
                                                                    <span className="text-xs text-gray-500">
                                                                        {job.duration} minutes
                                                                    </span>
                                                                    {job.category && (
                                                                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs">
                                                                            {job.category}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    if (!isAlreadyAdded) {
                                                                        // Add job
                                                                        const updatedJobs = [...editedBooking.jobs, job];

                                                                        // Calculate price
                                                                        const price = job.basePrice || (job.pricePerHour ? job.pricePerHour * (job.duration / 60) : 50 * (job.duration / 60));

                                                                        // Update jobsPrices
                                                                        const updatedPrices = [...editedBooking.jobsPrices];
                                                                        updatedPrices.push({
                                                                            id: job.id,
                                                                            price,
                                                                            duration: job.duration
                                                                        });

                                                                        setEditedBooking({
                                                                            ...editedBooking,
                                                                            jobs: updatedJobs,
                                                                            jobsPrices: updatedPrices
                                                                        });

                                                                        toast.success(`Added ${job.name} to booking`);
                                                                    } else {
                                                                        toast.info(`${job.name} is already added`);
                                                                    }
                                                                }}
                                                                className={`px-3 py-1 rounded text-sm font-medium ${isAlreadyAdded ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
                                                                disabled={isAlreadyAdded}
                                                            >
                                                                {isAlreadyAdded ? 'Added' : 'Add Job'}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    ) : (
                                        <div className="text-center border border-dashed p-8 rounded-lg">
                                            <p className="text-gray-500">No jobs available.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Parts Tab */}
                    {activeTab === 'parts' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium">Parts</h3>
                                <button
                                    onClick={() => setActiveTab('selectParts')}
                                    className="flex items-center text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1.5 rounded-md"
                                >
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                    </svg>
                                    Select Parts
                                </button>
                            </div>

                            {editedBooking.partItems.length > 0 ? (
                                <div className="space-y-3">
                                    {editedBooking.partItems.map((part) => {
                                        // Find the corresponding price entry using the part ID as the key
                                        const priceEntry = editedBooking.partItemsPrices?.[part.id];

                                        return (
                                            <div key={part.id} className="border rounded-lg p-3 bg-white grid grid-cols-[1fr_100px_40px] gap-2 items-center">
                                                {/* Left Side: Part Info */}
                                                <div className="pr-2">
                                                    <div className="font-medium">{part.title}</div>
                                                    <div className="text-sm text-gray-600">
                                                        {part.sku} {part.tier && <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getTierBadgeClasses(part.tier)}`}>{part.tier}</span>}
                                                    </div>
                                                </div>

                                                {/* Middle: Price Info - Fixed width column */}
                                                <div className="text-right">
                                                    <div className="font-medium">
                                                        £{priceEntry ? priceEntry.price.toFixed(2) : part.priceForConsumer.toFixed(2)}
                                                    </div>
                                                    {isAdmin && (
                                                        <div className="text-xs text-gray-500">
                                                            (Acq: £{part.price?.toFixed(2) ?? 'N/A'})
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right Side: Delete button - Fixed width */}
                                                <button
                                                    onClick={() => {
                                                        // Remove the part from partItems
                                                        const updatedPartItems = editedBooking.partItems.filter(p => p.id !== part.id);
                                                        // Remove the price from partItemsPrices object
                                                        const updatedPrices = { ...editedBooking.partItemsPrices };
                                                        delete updatedPrices[part.id];

                                                        setEditedBooking({
                                                            ...editedBooking,
                                                            partItems: updatedPartItems,
                                                            partItemsPrices: updatedPrices
                                                        });

                                                        toast.success(`Removed ${part.title} from booking`);
                                                    }}
                                                    className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50 justify-self-end"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center p-8 border border-dashed rounded-lg">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No parts added</h3>
                                    <p className="mt-1 text-sm text-gray-500">Get started by selecting parts for this booking.</p>
                                    <div className="mt-6">
                                        <button
                                            onClick={() => setActiveTab('selectParts')}
                                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            Select Parts
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Select Parts Tab */}
                    {activeTab === 'selectParts' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium">Select Parts</h3>
                                <button
                                    onClick={() => setActiveTab('parts')}
                                    className="flex items-center text-sm text-gray-600 hover:text-gray-800"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back to Parts
                                </button>
                            </div>

                            {/* Search box */}
                            <div className="relative mb-4">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                                    </svg>
                                </div>
                                <input
                                    type="search"
                                    className="block w-full p-2.5 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Search by name, tier, or code..."
                                    value={partsSearchQuery}
                                    onChange={(e) => setPartsSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Parts list */}
                            {isLoadingParts ? (
                                <div className="flex justify-center items-center py-8">
                                    <Loader />
                                </div>
                            ) : partsError ? (
                                <div className="text-center border border-red-200 bg-red-50 rounded-lg p-4 text-red-800">
                                    <p>Error loading parts: {partsError}</p>
                                    <button
                                        onClick={fetchAvailablePartItems}
                                        className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
                                    >
                                        Try again
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {availablePartItems.length > 0 ? (
                                        <div className="border rounded-md divide-y max-h-96 overflow-y-auto">
                                            {availablePartItems
                                                .filter(part => {
                                                    if (!partsSearchQuery.trim()) return true;
                                                    const search = partsSearchQuery.toLowerCase();
                                                    return (
                                                        (part.title?.toLowerCase() ?? '').includes(search) ||
                                                        (part.tier?.toLowerCase() ?? '').includes(search) ||
                                                        (part.sku?.toLowerCase() ?? '').includes(search)
                                                    );
                                                })
                                                .filter(part => part.stockSummary === "In stock.")
                                                .map(part => {
                                                    const isAlreadyAdded = editedBooking.partItems.some(p => p.id === part.id);

                                                    return (
                                                        <div key={part.id} className="p-3 hover:bg-gray-50 flex justify-between items-center">
                                                            <div>
                                                                <div className="font-medium">{part.title ?? 'N/A'}</div>
                                                                <div className="text-sm text-gray-600">
                                                                    {part.sku} {part.tier && <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getTierBadgeClasses(part.tier)}`}>{part.tier}</span>}
                                                                </div>

                                                            </div>
                                                            <div className="text-right mr-4">
                                                                <div className="font-medium">
                                                                    £{part.priceForConsumer.toFixed(2)}
                                                                </div>
                                                                <span className="text-xs text-gray-500">
                                                                    {isAdmin && `(Acq: £${part.price?.toFixed(2) ?? 'N/A'})`}
                                                                </span>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    if (!isAlreadyAdded) {
                                                                        // Add part using priceForConsumer
                                                                        setEditedBooking({
                                                                            ...editedBooking,
                                                                            partItems: [...editedBooking.partItems, part],
                                                                            partItemsPrices: {
                                                                                ...editedBooking.partItemsPrices,
                                                                                [part.id]: { price: part.priceForConsumer } // Store CUSTOMER price
                                                                            }
                                                                        });
                                                                        toast.success(`Added ${part.name ?? part.title} to booking`);
                                                                    } else {
                                                                        toast.info(`${part.name ?? part.title} is already added`);
                                                                    }
                                                                }}
                                                                className={`px-3 py-1 rounded text-sm font-medium ${isAlreadyAdded ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
                                                                disabled={isAlreadyAdded}
                                                            >
                                                                {isAlreadyAdded ? 'Added' : 'Add Part'}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    ) : (
                                        <div className="text-center border border-dashed p-8 rounded-lg">
                                            <p className="text-gray-500">No parts available.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Schedule Tab */}
                    {activeTab === 'schedule' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium">Schedule</h3>
                                {isAdmin && (
                                    <button
                                        onClick={() => handleAddSchedule()}
                                        className="flex items-center text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1.5 rounded-md"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                        </svg>
                                        Add Schedule
                                    </button>
                                )}
                            </div>

                            {editedBooking.schedules && editedBooking.schedules.length > 0 ? (
                                <div className="space-y-3">
                                    {editedBooking.schedules.map((schedule, index) => (
                                        <div key={index} className="border rounded-lg p-4 bg-white">
                                            <div className="flex justify-between mb-2">
                                                <h4 className="font-medium">Appointment {index + 1}</h4>
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => handleRemoveSchedule(index)}
                                                        className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                                    <input
                                                        type="date"
                                                        value={format(new Date(schedule.date), 'yyyy-MM-dd')}
                                                        onChange={(e) => handleScheduleChange(index, 'date', e.target.value)}
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                        disabled={!isAdmin}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                                    <input
                                                        type="time"
                                                        value={schedule.time || ""}
                                                        onChange={(e) => handleScheduleChange(index, 'time', e.target.value)}
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                        disabled={!isAdmin}
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                                <textarea
                                                    value={schedule.notes || ""}
                                                    onChange={(e) => handleScheduleChange(index, 'notes', e.target.value)}
                                                    rows={2}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                    disabled={!isAdmin}
                                                    placeholder="Special instructions or details about this appointment..."
                                                />
                                            </div>

                                            {isAdmin && (
                                                <div className="mt-4">
                                                    <div className="flex items-center">
                                                        <input
                                                            id={`completed-${index}`}
                                                            type="checkbox"
                                                            checked={schedule.completed || false}
                                                            onChange={(e) => handleScheduleChange(index, 'completed', e.target.checked)}
                                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                        />
                                                        <label htmlFor={`completed-${index}`} className="ml-2 block text-sm text-gray-900">
                                                            Mark as completed
                                                        </label>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center p-8 border border-dashed rounded-lg">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments scheduled</h3>
                                    <p className="mt-1 text-sm text-gray-500">Schedule an appointment for this booking.</p>
                                    {isAdmin && (
                                        <div className="mt-6">
                                            <button
                                                onClick={() => handleAddSchedule()}
                                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            >
                                                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                                Add Schedule
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'assignment' && isAdmin && (
                        <div>
                            <h3 className="text-lg font-medium mb-4">Assignment Tab Content</h3>
                            <p className="text-gray-500">Assignment tab content will be implemented in the next edit.</p>
                        </div>
                    )}
                </div>

                {/* Footer with buttons */}
                <div className="mt-8 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
                    >
                        <RiSaveLine className="mr-1" />
                        Save Booking
                    </button>
                </div>
            </div>
        </div>
    );
}; 