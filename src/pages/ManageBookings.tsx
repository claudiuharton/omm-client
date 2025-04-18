import { useEffect, useState, useCallback, useRef } from "react";
// import { useNavigate } from "react-router-dom"; // Removed unused import
import { useAuthStore } from "../stores";
import { Loader } from "../components/Loader";
import { JobService } from "../services/job.service";
import { Booking, TimeSlot } from "../interfaces/booking.interface";
import { Job } from "../interfaces/job.interface";
import { PartItem } from "../interfaces/partItem.interface";
import { User } from "../interfaces/user.interface";
import { AdminService } from "../services/admin.service";
import { toast } from "sonner";
import { RiEditLine, RiDeleteBin6Line, RiCarLine, RiMapPinLine, RiCalendarCheckLine, RiMoneyDollarCircleLine, RiCloseLine, RiAddLine, RiSaveLine, RiUserLine } from "react-icons/ri";
import { useJobStore, JobState } from "../stores/jobs/job.store";

/**
 * EmptyState component for when no bookings are found
 */
const EmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg text-center">
        <h3 className="text-xl font-medium text-gray-700 mb-2">
            No bookings found
        </h3>
        <p className="text-gray-500 mb-4">
            There are no service bookings in the system
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
 * ConfirmDialog component for delete confirmations
 */
const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message
}: {
    isOpen: boolean,
    onClose: () => void,
    onConfirm: () => void,
    title: string,
    message: string
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fade-in">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

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
 * BookingEditDialog component for editing booking details
 */
const BookingEditDialog = ({
    isOpen,
    onClose,
    booking,
    mechanics,
    clients,
    onSave
}: {
    isOpen: boolean,
    onClose: () => void,
    booking: Booking | null,
    mechanics: User[],
    clients: User[],
    onSave: (updatedBooking: Booking) => void
}) => {
    // Local state for editing
    const [editedBooking, setEditedBooking] = useState<Booking | null>(null);
    const [activeTab, setActiveTab] = useState('overview'); // Default to overview tab

    // State for part items selection
    const [availablePartItems, setAvailablePartItems] = useState<PartItem[]>([]);
    const [isLoadingParts, setIsLoadingParts] = useState(false);
    const [partsError, setPartsError] = useState<string | null>(null);
    const [partsSearchQuery, setPartsSearchQuery] = useState('');

    // Reset state when dialog opens with new booking
    useEffect(() => {
        if (booking) {
            // Normalize the booking data to ensure consistent structure
            setEditedBooking(normalizeBookingData(booking));
            // Reset tabs and search
            setActiveTab('overview');
            setPartsSearchQuery('');
        }
    }, [booking]);

    // Fetch available part items when the dialog opens
    useEffect(() => {
        if (isOpen) {
            fetchAvailablePartItems();
        }
    }, [isOpen]);

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
    const handleScheduleChange = (index: number, field: string, value: string | number) => {
        const updatedSchedules = [...editedBooking.schedules];

        if (field === 'dates' && typeof value === 'string') {
            // Handle dates as a comma-separated string
            updatedSchedules[index] = {
                ...updatedSchedules[index],
                [field]: value.split(',').map(date => date.trim())
            };
        } else {
            updatedSchedules[index] = { ...updatedSchedules[index], [field]: value };
        }

        setEditedBooking({
            ...editedBooking,
            schedules: updatedSchedules
        });
    };

    // Handler for mechanic assignment
    const handleMechanicChange = (mechanicId: string) => {
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
        updatedJobs.splice(index, 1);

        setEditedBooking({
            ...editedBooking,
            jobs: updatedJobs
        });
    };

    // Remove a schedule
    const handleRemoveSchedule = (index: number) => {
        const updatedSchedules = [...editedBooking.schedules];
        updatedSchedules.splice(index, 1);

        setEditedBooking({
            ...editedBooking,
            schedules: updatedSchedules
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
        const newTimeSlot: TimeSlot = {
            id: `temp-${Date.now()}`,
            timeInterval: '09:00-10:00',
            dates: [new Date().toISOString().split('T')[0]]
        };

        setEditedBooking({
            ...editedBooking,
            schedules: [...editedBooking.schedules, newTimeSlot]
        });
    };

    // Handle save
    const handleSave = () => {
        if (editedBooking) {
            onSave(editedBooking);
            onClose();
        }
    };

    // Filter parts based on search query
    const filteredParts = availablePartItems.filter(part => {
        if (!part) return false; // Skip null/undefined parts
        if (!partsSearchQuery.trim()) return true;

        const search = partsSearchQuery.toLowerCase();
        return (
            (part.name?.toLowerCase() ?? '').includes(search) ||
            (part.title?.toLowerCase() ?? '').includes(search) ||
            (part.tier?.toLowerCase() ?? '').includes(search) ||
            (part.itemCode?.toLowerCase() ?? '').includes(search)
        );
    });

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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Edit Booking - {editedBooking.car.carNumber}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <RiCloseLine size={24} />
                    </button>
                </div>

                {/* Header info */}
                <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                        <p className="text-sm text-gray-500">Vehicle</p>
                        <p className="font-medium">{editedBooking.car.make} {editedBooking.car.model} ({editedBooking.car.carNumber})</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Total Price</p>
                        <p className="font-medium">£{editedBooking.totalPrice.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium">{editedBooking.location.postalCode}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <p className="font-medium">{editedBooking.status}</p>
                    </div>
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
                        <button
                            onClick={() => setActiveTab('assignment')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'assignment'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Assignment
                        </button>
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
                                        {editedBooking.jobs.map(job => (
                                            <div key={job.id} className="bg-gray-50 p-3 rounded flex justify-between items-center">
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
                                    <div className="space-y-2">
                                        {editedBooking.partItems.map(part => {
                                            // Find the corresponding price entry using the part ID as the key
                                            const priceEntry = editedBooking.partItemsPrices?.[part.id];

                                            return (
                                                <div key={part.id} className="border rounded-lg p-3 bg-white flex justify-between items-center">
                                                    {/* Left Side: Part Info */}
                                                    <div className="flex-grow pr-4">
                                                        <div className="font-medium">{part.title}</div>
                                                        <div className="text-sm text-gray-600">
                                                            {part.sku} {part.tier && <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getTierBadgeClasses(part.tier)}`}>{part.tier}</span>}
                                                        </div>
                                                    </div>

                                                    {/* Right Side: Price & Actions */}
                                                    <div className="flex items-center gap-4 flex-shrink-0">
                                                        {/* Price Info */}
                                                        <div className="text-right">
                                                            <div className="font-medium">
                                                                £{priceEntry ? priceEntry.price.toFixed(2) : part.priceForConsumer.toFixed(2)}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                (Acq: £{part.price?.toFixed(2) ?? 'N/A'})
                                                            </div>
                                                        </div>
                                                        {/* Delete Button */}
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

                                                                toast.success(`Removed ${part.name ?? part.title} from booking`);
                                                            }}
                                                            className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                            </svg>
                                                        </button>
                                                    </div>
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

                            {/* Assignment Section */}
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
                                    onClick={handleAddJob}
                                    className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                                >
                                    <RiAddLine className="mr-1" /> Add Job
                                </button>
                            </div>

                            {/* Existing Jobs Summary */}
                            {editedBooking.jobs.length > 0 && (
                                <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                                    <h4 className="text-sm font-semibold uppercase text-gray-600 mb-3">
                                        Current Jobs
                                    </h4>
                                    <div className="space-y-2">
                                        {editedBooking.jobs.map(job => (
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
                                                    value={job.description}
                                                    onChange={(e) => handleJobChange(index, 'description', e.target.value)}
                                                    className="w-full p-1 border rounded text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500">Duration (min)</label>
                                                <input
                                                    type="number"
                                                    value={job.duration}
                                                    onChange={(e) => handleJobChange(index, 'duration', parseInt(e.target.value))}
                                                    className="w-full p-1 border rounded text-sm"
                                                    min="0"
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
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {editedBooking.jobs.length === 0 && (
                                    <div className="p-4 text-center text-gray-500">
                                        No jobs added yet
                                    </div>
                                )}
                            </div>
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
                                            <div key={part.id} className="border rounded-lg p-3 bg-white flex justify-between items-center">
                                                {/* Left Side: Part Info */}
                                                <div className="flex-grow pr-4">
                                                    <div className="font-medium">{part.title}</div>
                                                    <div className="text-sm text-gray-600">
                                                        {part.sku} {part.tier && <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getTierBadgeClasses(part.tier)}`}>{part.tier}</span>}
                                                    </div>
                                                </div>

                                                {/* Right Side: Price & Actions */}
                                                <div className="flex items-center gap-4 flex-shrink-0">
                                                    {/* Price Info */}
                                                    <div className="text-right">
                                                        <div className="font-medium">
                                                            £{priceEntry ? priceEntry.price.toFixed(2) : part.priceForConsumer.toFixed(2)}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            (Acq: £{part.price?.toFixed(2) ?? 'N/A'})
                                                        </div>
                                                    </div>
                                                    {/* Delete Button */}
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

                                                            toast.success(`Removed ${part.name ?? part.title} from booking`);
                                                        }}
                                                        className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-50"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                        </svg>
                                                    </button>
                                                </div>
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
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
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
                                    {filteredParts.length > 0 ? (
                                        <div className="border rounded-md divide-y max-h-96 overflow-y-auto">
                                            {filteredParts.map(part => {
                                                const isAlreadyAdded = editedBooking.partItems.some(p => p.id === part.id);
                                                // Find the corresponding price entry using the part ID as the key
                                                // const priceEntry = editedBooking.partItemsPrices?.[part.id]; // Removed unused variable

                                                return (
                                                    <div key={part.id} className="p-3 hover:bg-gray-50 flex justify-between items-center">
                                                        <div>
                                                            <div className="font-medium">{part.name ?? 'N/A'}</div>
                                                            {part.title && part.name && part.title !== part.name && (
                                                                <div className="text-sm text-gray-600">{part.title}</div>
                                                            )}
                                                            <div className="flex items-center mt-1 gap-2">
                                                                <span className="text-xs text-gray-500">
                                                                    ID: {part.id}
                                                                </span>
                                                                {part.tier && (
                                                                    <span className={`px-2 py-0.5 rounded-full text-xs ${getTierBadgeClasses(part.tier)}`}>
                                                                        {part.tier}
                                                                    </span>
                                                                )}
                                                                {part.itemCode && (
                                                                    <span className="text-xs text-gray-500">
                                                                        Code: {part.itemCode}
                                                                    </span>
                                                                )}
                                                                <span className="font-medium">
                                                                    Customer Price: £{part.priceForConsumer.toFixed(2)}
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    (Acq: £{part.price?.toFixed(2) ?? 'N/A'})
                                                                </span>
                                                            </div>
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
                                                            disabled={isAlreadyAdded}
                                                            className={`px-3 py-1 rounded-md text-sm ${isAlreadyAdded
                                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                                }`}
                                                        >
                                                            {isAlreadyAdded ? 'Added' : 'Add'}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center border p-4 rounded-lg bg-gray-50">
                                            <p className="text-gray-500">No parts found matching your search</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Schedule Tab */}
                    {activeTab === 'schedule' && (
                        <div>
                            <div className="flex justify-between mb-2">
                                <h3 className="text-lg font-medium">Schedules</h3>
                                <button
                                    onClick={handleAddSchedule}
                                    className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                                >
                                    <RiAddLine className="mr-1" /> Add Time Slot
                                </button>
                            </div>

                            {/* Existing Schedules Summary */}
                            {editedBooking.schedules.length > 0 && (
                                <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                                    <h4 className="text-sm font-semibold uppercase text-gray-600 mb-3">
                                        Current Time Slots
                                    </h4>
                                    <div className="space-y-2">
                                        {editedBooking.schedules.map(schedule => (
                                            <div key={`summary-${schedule.id}`} className="border-b border-gray-200 pb-2 last:border-b-0 last:pb-0">
                                                <div className="font-medium">{schedule.timeInterval}</div>
                                                <div className="text-sm text-gray-600">
                                                    Dates: {schedule.dates.join(', ')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-white rounded border">
                                {editedBooking.schedules.map((schedule, index) => (
                                    <div key={schedule.id} className="p-3 border-b last:border-b-0 hover:bg-gray-50">
                                        <div className="flex justify-between mb-2">
                                            <div className="font-medium">Time Slot {index + 1}</div>
                                            <button
                                                onClick={() => handleRemoveSchedule(index)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <RiCloseLine />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs text-gray-500">Time Interval</label>
                                                <input
                                                    type="text"
                                                    value={schedule.timeInterval}
                                                    onChange={(e) => handleScheduleChange(index, 'timeInterval', e.target.value)}
                                                    className="w-full p-1 border rounded text-sm"
                                                    placeholder="e.g., 09:00-10:00"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500">Dates (comma-separated)</label>
                                                <input
                                                    type="text"
                                                    value={schedule.dates.join(', ')}
                                                    onChange={(e) => handleScheduleChange(index, 'dates', e.target.value)}
                                                    className="w-full p-1 border rounded text-sm"
                                                    placeholder="YYYY-MM-DD, YYYY-MM-DD"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {editedBooking.schedules.length === 0 && (
                                    <div className="p-4 text-center text-gray-500">
                                        No schedules added yet
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Assignment Tab */}
                    {activeTab === 'assignment' && (
                        <div>
                            <h3 className="text-lg font-medium mb-4">Mechanic Assignment</h3>

                            {/* Current Assignment Summary */}
                            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-sm font-semibold uppercase text-gray-600 mb-3">
                                    Current Assignment
                                </h4>
                                {editedBooking.mechanic ? (
                                    <div className="flex items-start gap-3">
                                        <div className="bg-indigo-100 rounded-full p-2 mt-1">
                                            <RiUserLine className="text-indigo-600 text-xl" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-lg">
                                                {editedBooking.mechanic.firstName} {editedBooking.mechanic.lastName}
                                            </div>
                                            <div className="text-sm text-gray-600">{editedBooking.mechanic.email}</div>
                                            {editedBooking.mechanic.phone && (
                                                <div className="text-sm text-gray-600">{editedBooking.mechanic.phone}</div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic">No mechanic currently assigned to this booking</p>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Assigned Mechanic
                                </label>
                                <select
                                    value={editedBooking.mechanic?.id || ''}
                                    onChange={(e) => handleMechanicChange(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                    <option value="">Not Assigned</option>
                                    {mechanics.map(mechanic => (
                                        <option key={mechanic.id} value={mechanic.id}>
                                            {mechanic.firstName} {mechanic.lastName} ({mechanic.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg mt-4">
                                <p className="text-sm text-gray-600 mb-2">
                                    <strong>Note:</strong> Assigning a mechanic to this booking will make them responsible for the service.
                                </p>
                                <p className="text-sm text-gray-600">
                                    They will be notified of the assignment and will have access to all booking details.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action buttons */}
                <div className="flex justify-end mt-6 gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center"
                    >
                        <RiSaveLine className="mr-1" /> Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * ManageBookings component
 */
export const ManageBookings = () => {
    // Get bookings from the global store
    const storeBookings = useJobStore((state: JobState) => state.bookings);
    const isAdminBookingsFetched = useJobStore((state: JobState) => state.isAdminBookingsFetched);
    // const fetchAdminBookingsAction = useJobStore(state => state.fetchAdminBookings); // Keep if needed for retry

    // Component state
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(!isAdminBookingsFetched);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [mechanics, setMechanics] = useState<User[]>([]);
    const [clients, setClients] = useState<User[]>([]);

    // Refs
    const isMountedRef = useRef(true);
    // dataFetchedRef and isFetchingRef might be less relevant now

    // Auth store
    const user = useAuthStore(state => state.user);
    const status = useAuthStore(state => state.status);

    // --- Fetch Mechanics and Clients (for Dialog) ---
    const fetchMechanics = useCallback(async () => {
        try {
            const response = await AdminService.getMechanics();
            if (response.success && response.responseObject) {
                setMechanics(Array.isArray(response.responseObject)
                    ? response.responseObject
                    : [response.responseObject]);
            }
        } catch (error) {
            console.error("Error fetching mechanics:", error);
            toast.error("Failed to load mechanics");
        }
    }, []);

    const fetchClients = useCallback(async () => {
        try {
            const response = await AdminService.getClients();
            if (response.success && response.responseObject) {
                setClients(Array.isArray(response.responseObject)
                    ? response.responseObject
                    : [response.responseObject]);
            }
        } catch (error) {
            console.error("Error fetching clients:", error);
            toast.error("Failed to load clients");
        }
    }, []);

    // This function now only fetches supporting data for the dialog
    const fetchSupportingData = useCallback(async () => {
        if (!isMountedRef.current) return;
        console.log('Fetching supporting data (mechanics, clients)...');
        setIsLoading(true); // Show loading while fetching this too
        setError(null);
        try {
            await Promise.all([fetchMechanics(), fetchClients()]);
            console.log('Supporting data fetched.');
        } catch (err) {
            console.error('Supporting data fetch error:', err);
            setError('Failed to load mechanics/client data.');
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        }
    }, [fetchMechanics, fetchClients]);

    // --- Effects ---
    useEffect(() => {
        isMountedRef.current = true;
        // Fetch supporting data when component mounts (if admin)
        if (user?.role === 'admin') {
            fetchSupportingData();
        }
        return () => { isMountedRef.current = false; };
    }, [user?.role, fetchSupportingData]); // Depend on role and fetch function

    // Sync local bookings state with the global store bookings
    useEffect(() => {
        if (isAdminBookingsFetched) {
            // Normalize data when copying from store to local state
            const normalizedBookings = storeBookings.map((b: Booking) => normalizeBookingData(b)); // Add type for map
            setBookings(normalizedBookings);
            setIsLoading(false); // Stop loading once store data is available
            setError(null); // Clear any previous error
        }
    }, [storeBookings, isAdminBookingsFetched]);

    // --- Booking Action Handlers ---
    const handleEditBooking = (bookingId: string) => {
        const bookingToEdit = bookings.find(b => b.id === bookingId);
        if (bookingToEdit) {
            // Pass a normalized copy to the dialog
            setSelectedBooking(normalizeBookingData(bookingToEdit));
            setShowEditDialog(true);
        } else {
            toast.error("Booking not found");
        }
    };

    const handleSaveBooking = async (updatedBooking: Booking) => {
        console.log("Attempting to save booking:", updatedBooking);
        // In a real app, call API: await JobService.updateBooking(updatedBooking.id, updatedBooking);
        try {
            setIsLoading(true);
            // For now, update local state optimistically
            const normalizedSavedBooking = normalizeBookingData(updatedBooking);
            setBookings(prev =>
                prev.map(b => b.id === normalizedSavedBooking.id ? normalizedSavedBooking : b)
            );
            toast.success("Booking updated successfully (local).");
            // Optionally: re-fetch admin bookings from store/API to confirm
            // await fetchAdminBookingsAction(); 
        } catch (error) {
            console.error("Error saving booking:", error);
            toast.error("Failed to save booking.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteBooking = (bookingId: string) => {
        setSelectedBookingId(bookingId);
        setShowConfirmDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedBookingId) return;
        console.log("Attempting to delete booking:", selectedBookingId);
        // In a real app, call API: await JobService.deleteBooking(selectedBookingId);
        try {
            setIsLoading(true);
            // For now, update local state optimistically
            setBookings(prev => prev.filter(booking => booking.id !== selectedBookingId));
            toast.success("Booking deleted successfully (local).");
            // Optionally: re-fetch admin bookings from store/API
            // await fetchAdminBookingsAction(); 
        } catch (error) {
            console.error("Error deleting booking:", error);
            toast.error("Failed to delete booking.");
        } finally {
            setIsLoading(false);
            setSelectedBookingId(null); // Clear selection
        }
    };

    // Placeholder/Example - Adapt based on actual requirements
    const handleInitiatePayment = async (bookingId: string) => {
        console.log("Initiate payment for booking:", bookingId);
        toast.info("Payment initiation not implemented in this view.");
        // try {
        //     setIsLoading(true);
        //     await JobService.initiatePayment(bookingId);
        // } catch (error) { toast.error("Payment failed"); } 
        // finally { setIsLoading(false); }
    };

    const handleAssignMechanic = async (bookingId: string, assign: boolean) => {
        console.log(`Assigning mechanic (${assign}) for booking:`, bookingId);
        toast.info("Mechanic assignment not implemented in this view.");
        // try {
        //     setIsLoading(true);
        //     const updatedBookingData = await JobService.assignMechanic(bookingId, assign);
        //     // Update local state if API call is successful
        //     setBookings(prev => prev.map(b => b.id === bookingId ? updatedBookingData.responseObject : b));
        //     toast.success("Assignment updated!");
        // } catch (error) { toast.error("Assignment failed"); }
        // finally { setIsLoading(false); }
    };
    // --- End Booking Action Handlers ---

    // Handle potential errors if fetchAdminBookings fails in the store
    // This might need refinement based on how errors are handled in the store action
    // For now, we assume the Layout handles the main loading/error state

    // --- Component Render Logic ---

    // Filter bookings based on local state
    const filteredBookings = bookings.filter(booking => {
        // Status filtering
        if (statusFilter !== "all" && booking.status !== statusFilter) {
            return false;
        }

        // Search query filtering
        const searchTerm = searchQuery.toLowerCase();
        return (
            booking.car.carNumber.toLowerCase().includes(searchTerm) ||
            booking.car.make.toLowerCase().includes(searchTerm) ||
            booking.car.model.toLowerCase().includes(searchTerm) ||
            booking.location.postalCode.toLowerCase().includes(searchTerm) ||
            (booking.mechanic &&
                (`${booking.mechanic.firstName} ${booking.mechanic.lastName}`).toLowerCase().includes(searchTerm))
        );
    });

    // Check auth status and role (important for initial render)
    if (status !== 'authorized' || user?.role !== 'admin') {
        // Render loading or access denied based on status
        return (
            <div className="p-8 text-center">
                {status === 'pending' ? <Loader /> : 'Access Denied. You must be an admin.'}
            </div>
        );
    }

    // Initial loading state (while store might be fetching)
    if (isLoading && bookings.length === 0) {
        return <div className="flex justify-center items-center min-h-[60vh]"><Loader /></div>;
    }

    // Display error if supporting data fetch failed
    if (error) {
        // Provide a way to retry fetching supporting data?
        return <ErrorDisplay message={error} onRetry={fetchSupportingData} />;
    }

    // ... (rest of the component return, using filteredBookings)

    return (
        <div className="w-full max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Admin Booking Management</h1>
                    <p className="text-gray-500">Comprehensive control over all service bookings in the system</p>
                </div>

                {/* Search and filter */}
                <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        placeholder="Search bookings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="assigned">Assigned</option>
                        <option value="completed">Completed</option>
                        <option value="paid">Paid</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Bookings table */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                {filteredBookings.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Car
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Location
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Jobs
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Assigned To
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredBookings.map((booking) => {
                                    // Calculate booking age
                                    const createdDate = new Date(booking.createdAt);
                                    const formattedDate = createdDate.toLocaleDateString();

                                    // Get status color classes
                                    const statusColorClass =
                                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            booking.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                                                booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    booking.status === 'paid' ? 'bg-indigo-100 text-indigo-800' :
                                                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800';

                                    return (
                                        <tr key={booking.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                        <RiCarLine className="text-indigo-600 text-lg" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {booking.car.carNumber}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {booking.car.make} {booking.car.model}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 flex items-center gap-1">
                                                    <RiMapPinLine className="text-gray-400" /> {booking.location.postalCode}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">
                                                    {booking.jobs.length} job{booking.jobs.length !== 1 ? 's' : ''}
                                                </div>
                                                {booking.partItems.length > 0 && (
                                                    <div className="text-sm text-gray-500">
                                                        {booking.partItems.length} part{booking.partItems.length !== 1 ? 's' : ''}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    £{booking.totalPrice.toFixed(2)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded-full ${statusColorClass}`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formattedDate}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {booking.mechanic ? (
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {booking.mechanic.firstName} {booking.mechanic.lastName}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {booking.mechanic.email}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-500 italic">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex gap-2">
                                                    {user.role === 'mechanic' && !booking.mechanic && (
                                                        <button
                                                            onClick={() => handleAssignMechanic(booking.id, true)}
                                                            className="text-blue-600 hover:text-blue-900 bg-blue-50 p-1.5 rounded"
                                                            title="Assign to myself"
                                                        >
                                                            <RiCalendarCheckLine />
                                                        </button>
                                                    )}

                                                    {user.role === 'mechanic' && booking.mechanic?.id === user.id && (
                                                        <button
                                                            onClick={() => handleAssignMechanic(booking.id, false)}
                                                            className="text-yellow-600 hover:text-yellow-900 bg-yellow-50 p-1.5 rounded"
                                                            title="Unassign"
                                                        >
                                                            <RiCalendarCheckLine />
                                                        </button>
                                                    )}

                                                    {booking.status !== 'paid' && (
                                                        <button
                                                            onClick={() => handleInitiatePayment(booking.id)}
                                                            className="text-green-600 hover:text-green-900 bg-green-50 p-1.5 rounded"
                                                            title="Process Payment"
                                                        >
                                                            <RiMoneyDollarCircleLine />
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleEditBooking(booking.id)}
                                                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-1.5 rounded"
                                                        title="Edit"
                                                    >
                                                        <RiEditLine />
                                                    </button>

                                                    <button
                                                        onClick={() => handleDeleteBooking(booking.id)}
                                                        className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded"
                                                        title="Delete"
                                                    >
                                                        <RiDeleteBin6Line />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState />
                )}
            </div>

            {/* Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showConfirmDialog}
                onClose={() => setShowConfirmDialog(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Booking"
                message="Are you sure you want to delete this booking? This action cannot be undone."
            />

            {/* Edit Dialog */}
            <BookingEditDialog
                isOpen={showEditDialog}
                onClose={() => setShowEditDialog(false)}
                booking={selectedBooking}
                mechanics={mechanics}
                clients={clients}
                onSave={handleSaveBooking}
            />
        </div>
    );
}; 