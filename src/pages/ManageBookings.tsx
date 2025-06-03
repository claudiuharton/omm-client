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
    
    // Handle jobsPrices - should be an object like partItemsPrices
    if (Array.isArray(normalizedBooking.jobsPrices)) {
        // Convert array format to object format for consistency
        const jobsPricesObj: Record<string, { price: number; duration: number }> = {};
        normalizedBooking.jobsPrices.forEach((jp: any) => {
            if (jp.id) {
                jobsPricesObj[jp.id] = { price: jp.price || 0, duration: jp.duration || 0 };
            }
        });
        normalizedBooking.jobsPrices = jobsPricesObj;
    } else if (typeof normalizedBooking.jobsPrices !== 'object' || normalizedBooking.jobsPrices === null) {
        normalizedBooking.jobsPrices = {};
    }
    
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
    
    // Enhanced filtering and sorting state
    const [selectedTier, setSelectedTier] = useState<string>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedGroup, setSelectedGroup] = useState<string>('all');
    const [stockFilter, setStockFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [groupByCategory, setGroupByCategory] = useState<boolean>(true);

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
        if (isOpen && editedBooking) {
            console.log('ManageBookings - Dialog opened, fetching parts for booking:', editedBooking);
            fetchAvailablePartItems();
        }
    }, [isOpen, editedBooking]);

    // Function to fetch available part items
    const fetchAvailablePartItems = async () => {
        setIsLoadingParts(true);
        setPartsError(null);

        try {
            // Always try car-specific gold-in-stock endpoint first if we have a car ID
            // Priority: 1. Car ID from booking, 2. Fallback to general endpoint
            const bookingCarId = editedBooking?.car?.id;
            
            console.log('=== MANAGE BOOKINGS PARTS FETCH DEBUG START ===');
            console.log('🔧 ManageBookings - fetchAvailablePartItems - Starting parts fetch');
            console.log('🔧 ManageBookings - Booking object:', editedBooking);
            console.log('🔧 ManageBookings - Booking Car object:', editedBooking?.car);
            console.log('🔧 ManageBookings - Booking Car ID:', bookingCarId);
            console.log('🔧 ManageBookings - Car ID type:', typeof bookingCarId);
            console.log('🔧 ManageBookings - Car ID length:', bookingCarId?.length);
            console.log('🔧 ManageBookings - Car ID trimmed:', bookingCarId?.trim());
            
            if (bookingCarId && bookingCarId.trim() !== '') {
                try {
                    // Use the car-specific gold-in-stock endpoint
                    console.log('✅ ManageBookings - Using car-specific endpoint:', `/api/parts/car/${bookingCarId}/gold-in-stock`);
                    console.log('✅ ManageBookings - About to call JobService.getCarPartItems with carId:', bookingCarId);
                    
                    const requestStart = Date.now();
                    console.log('🚀 ManageBookings - Starting car-specific API call at:', new Date().toISOString());
                    
                    const response = await JobService.getCarPartItems(bookingCarId);
                    
                    const requestEnd = Date.now();
                    console.log('✅ ManageBookings - Car-specific API call completed in:', requestEnd - requestStart, 'ms');
                    console.log('✅ ManageBookings - Car-specific API response:', response);
                    
                    if (response.responseObject) {
                        const partItemsData = Array.isArray(response.responseObject)
                            ? response.responseObject
                            : [response.responseObject];

                        console.log('✅ ManageBookings - Car-specific parts loaded successfully:', partItemsData.length, 'parts');
                        console.log('✅ ManageBookings - Sample parts data:', partItemsData.slice(0, 2));
                        setAvailablePartItems(partItemsData);
                        console.log('=== MANAGE BOOKINGS PARTS FETCH DEBUG END (SUCCESS) ===');
                        return; // Exit early on success
                    } else {
                        console.log('⚠️ ManageBookings - No parts returned from car-specific endpoint, trying fallback');
                        console.log('⚠️ ManageBookings - Response object was:', response.responseObject);
                    }
                } catch (carSpecificError) {
                    console.error('❌ ManageBookings - Car-specific endpoint failed with error:', carSpecificError);
                    console.error('❌ ManageBookings - Error details:', {
                        message: carSpecificError.message,
                        stack: carSpecificError.stack,
                        name: carSpecificError.name
                    });
                    console.log('❌ ManageBookings - Falling back to general endpoint due to car-specific error');
                }
            } else {
                console.log('❌ ManageBookings - No valid car ID available');
                console.log('❌ ManageBookings - Car ID details:', {
                    carId: bookingCarId,
                    type: typeof bookingCarId,
                    length: bookingCarId?.length,
                    trimmed: bookingCarId?.trim(),
                    isEmpty: !bookingCarId || bookingCarId.trim() === ''
                });
            }

            // Fallback to general endpoint if car-specific failed or no car ID
            console.log('🔄 ManageBookings - Using general endpoint as fallback');
            console.log('🔄 ManageBookings - About to call JobService.getAllPartItems');
            
            const fallbackRequestStart = Date.now();
            console.log('🚀 ManageBookings - Starting general API call at:', new Date().toISOString());
            
            const response = await JobService.getAllPartItems();
            
            const fallbackRequestEnd = Date.now();
            console.log('✅ ManageBookings - General API call completed in:', fallbackRequestEnd - fallbackRequestStart, 'ms');
            console.log('✅ ManageBookings - General API response:', response);
            
            if (response.responseObject) {
                const partItemsData = Array.isArray(response.responseObject)
                    ? response.responseObject
                    : [response.responseObject];

                console.log('✅ ManageBookings - General parts loaded:', partItemsData.length, 'parts');
                console.log('✅ ManageBookings - Sample parts data:', partItemsData.slice(0, 2));
                setAvailablePartItems(partItemsData);
            } else {
                console.log('❌ ManageBookings - No parts returned from general endpoint');
                console.log('❌ ManageBookings - Response object was:', response.responseObject);
                setAvailablePartItems([]);
            }
            console.log('=== MANAGE BOOKINGS PARTS FETCH DEBUG END (FALLBACK) ===');
        } catch (error) {
            console.error("❌ ManageBookings - Error fetching part items:", error);
            console.error("❌ ManageBookings - Error details:", {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            setPartsError("Failed to load available part items");
            console.log('=== MANAGE BOOKINGS PARTS FETCH DEBUG END (ERROR) ===');
        } finally {
            setIsLoadingParts(false);
        }
    };

    // Helper functions for filtering and sorting
    const getUniqueCategories = () => {
        const categories = availablePartItems
            .map(part => part.categoryTitle)
            .filter(Boolean)
            .filter((value, index, self) => self.indexOf(value) === index);
        return categories.sort();
    };

    const getUniqueGroups = () => {
        const groups = availablePartItems
            .flatMap(part => part.groups || [])
            .filter((value, index, self) => self.indexOf(value) === index);
        return groups.sort();
    };

    const getUniqueTiers = () => {
        const tiers = availablePartItems
            .map(part => part.tier)
            .filter(Boolean)
            .filter((value, index, self) => self.indexOf(value) === index);
        return tiers.sort();
    };

    // Group parts by category
    const getGroupedPartsByCategory = (parts: PartItem[]) => {
        const grouped: { [key: string]: { parts: PartItem[], categoryImage?: string } } = {};
        
        parts.forEach(part => {
            const category = part.categoryTitle || 'Uncategorized';
            if (!grouped[category]) {
                grouped[category] = {
                    parts: [],
                    categoryImage: part.categoryImage
                };
            }
            grouped[category].parts.push(part);
        });

        // Sort categories alphabetically
        const sortedCategories = Object.keys(grouped).sort();
        const sortedGrouped: { [key: string]: { parts: PartItem[], categoryImage?: string } } = {};
        
        sortedCategories.forEach(category => {
            sortedGrouped[category] = grouped[category];
        });

        return sortedGrouped;
    };

    // Filter and sort parts
    const getFilteredAndSortedParts = () => {
        const filtered = availablePartItems.filter(part => {
            // Text search
            if (partsSearchQuery.trim()) {
                const search = partsSearchQuery.toLowerCase();
                const matchesSearch = (
                    (part.title?.toLowerCase() ?? '').includes(search) ||
                    (part.sku?.toLowerCase() ?? '').includes(search) ||
                    (part.categoryTitle?.toLowerCase() ?? '').includes(search) ||
                    (part.groups?.some(group => group.toLowerCase().includes(search)) ?? false)
                );
                if (!matchesSearch) return false;
            }

            // Tier filter
            if (selectedTier !== 'all' && part.tier?.toLowerCase() !== selectedTier.toLowerCase()) {
                return false;
            }

            // Category filter
            if (selectedCategory !== 'all' && part.categoryTitle !== selectedCategory) {
                return false;
            }

            // Group filter
            if (selectedGroup !== 'all' && !part.groups?.includes(selectedGroup)) {
                return false;
            }

            // Stock filter
            if (stockFilter === 'in-stock' && !part.stockSummary?.toLowerCase().includes('in stock')) {
                return false;
            }
            if (stockFilter === 'out-of-stock' && part.stockSummary?.toLowerCase().includes('in stock')) {
                return false;
            }

            return true;
        });

        // Sort parts
        const sorted = filtered.sort((a, b) => {
            let aValue: any, bValue: any;

            switch (sortBy) {
                case 'name':
                    aValue = a.title?.toLowerCase() || '';
                    bValue = b.title?.toLowerCase() || '';
                    break;
                case 'sku':
                    aValue = a.sku?.toLowerCase() || '';
                    bValue = b.sku?.toLowerCase() || '';
                    break;
                case 'price':
                    aValue = a.priceForConsumer || 0;
                    bValue = b.priceForConsumer || 0;
                    break;
                case 'tier':
                    aValue = a.tier?.toLowerCase() || '';
                    bValue = b.tier?.toLowerCase() || '';
                    break;
                case 'category':
                    aValue = a.categoryTitle?.toLowerCase() || '';
                    bValue = b.categoryTitle?.toLowerCase() || '';
                    break;
                case 'stock':
                    aValue = a.stockSummary?.toLowerCase() || '';
                    bValue = b.stockSummary?.toLowerCase() || '';
                    break;
                default:
                    aValue = a.title?.toLowerCase() || '';
                    bValue = b.title?.toLowerCase() || '';
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            } else {
                return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
            }
        });

        return sorted;
    };

    // Reset filters
    const resetFilters = () => {
        setPartsSearchQuery('');
        setSelectedTier('all');
        setSelectedCategory('all');
        setSelectedGroup('all');
        setStockFilter('all');
        setSortBy('name');
        setSortOrder('asc');
        setGroupByCategory(true);
    };

    if (!isOpen || !editedBooking) return null;

    // Handler for job updates
    const handleJobChange = (index: number, field: string, value: string | number | boolean) => {
        const updatedJobs = [...editedBooking.jobs];
        updatedJobs[index] = { ...updatedJobs[index], [field]: value };

        // If the field affects pricing, update jobsPrices as well
        let updatedJobsPrices = { ...(editedBooking.jobsPrices || {}) };
        if (field === 'duration' || field === 'pricePerHour') {
            const job = updatedJobs[index];
            
            if (job.pricePerHour) {
                // Recalculate the price based on updated job properties
                const totalJobPrice = (job.pricePerHour * job.duration) / 60;
                updatedJobsPrices[job.id] = {
                    price: totalJobPrice,
                    duration: job.duration
                };
            }
        }

        setEditedBooking({
            ...editedBooking,
            jobs: updatedJobs,
            jobsPrices: updatedJobsPrices
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
                                                        £{editedBooking.jobsPrices?.[job.id]?.price?.toFixed(2) || '0.00'}
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
                                                                £{priceEntry ? priceEntry.price.toFixed(2) : part.priceForConsumer?.toFixed(2) ?? 'N/A'}
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
                                                        £{editedBooking.jobsPrices?.[job.id]?.price?.toFixed(2) || '0.00'}
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
                                                    value={editedBooking.jobsPrices?.[job.id]?.price || 0}
                                                    onChange={(e) => {
                                                        const updatedPrices = { ...editedBooking.jobsPrices };
                                                        updatedPrices[job.id] = {
                                                            price: parseFloat(e.target.value),
                                                            duration: job.duration
                                                        };
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
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            console.log('Manual refresh clicked - Current booking:', editedBooking);
                                            fetchAvailablePartItems();
                                        }}
                                        className="flex items-center text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Refresh Parts
                                    </button>
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
                                                            £{priceEntry ? priceEntry.price.toFixed(2) : part.priceForConsumer?.toFixed(2) ?? 'N/A'}
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
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-medium">Parts Library</h3>
                                    <p className="text-sm text-gray-500">Search, filter, and select parts for this booking</p>
                                    <p className="text-xs text-blue-600 mt-1">
                                        Car ID: {editedBooking?.car?.id || 'Not available'} | 
                                        Endpoint: {editedBooking?.car?.id ? `/api/parts/car/${editedBooking.car.id}/gold-in-stock` : '/api/parts (fallback)'}
                                    </p>
                                </div>
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

                            {/* Search and Filters */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
                                {/* Search */}
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="search"
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Search by name, SKU, category, or group..."
                                        value={partsSearchQuery}
                                        onChange={(e) => setPartsSearchQuery(e.target.value)}
                                    />
                                </div>

                                {/* Filters Row 1 */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                    {/* Tier Filter */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Tier</label>
                                        <select
                                            value={selectedTier}
                                            onChange={(e) => setSelectedTier(e.target.value)}
                                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="all">All Tiers</option>
                                            {getUniqueTiers().map(tier => (
                                                <option key={tier} value={tier}>{tier}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Category Filter */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                                        <select
                                            value={selectedCategory}
                                            onChange={(e) => setSelectedCategory(e.target.value)}
                                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="all">All Categories</option>
                                            {getUniqueCategories().map(category => (
                                                <option key={category} value={category}>{category}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Group Filter */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Group</label>
                                        <select
                                            value={selectedGroup}
                                            onChange={(e) => setSelectedGroup(e.target.value)}
                                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="all">All Groups</option>
                                            {getUniqueGroups().map(group => (
                                                <option key={group} value={group}>{group}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Stock Filter */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Stock</label>
                                        <select
                                            value={stockFilter}
                                            onChange={(e) => setStockFilter(e.target.value)}
                                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="all">All Stock</option>
                                            <option value="in-stock">In Stock</option>
                                            <option value="out-of-stock">Out of Stock</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Controls Row */}
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    {/* View Options */}
                                    <div className="flex items-center gap-4">
                                        {/* Group by Category Toggle */}
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={groupByCategory}
                                                onChange={(e) => setGroupByCategory(e.target.checked)}
                                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Group by Category</span>
                                        </label>

                                        {/* View Mode Toggle */}
                                        <div className="flex bg-gray-100 rounded-lg p-1">
                                            <button
                                                onClick={() => setViewMode('grid')}
                                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                                    viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                            >
                                                Grid
                                            </button>
                                            <button
                                                onClick={() => setViewMode('list')}
                                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                                    viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                            >
                                                List
                                            </button>
                                        </div>
                                    </div>

                                    {/* Sort and Actions */}
                                    <div className="flex items-center gap-2">
                                        {/* Sort By */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-600">Sort by:</span>
                                            <select
                                                value={sortBy}
                                                onChange={(e) => setSortBy(e.target.value)}
                                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="name">Name</option>
                                                <option value="sku">SKU</option>
                                                <option value="price">Price</option>
                                                <option value="tier">Tier</option>
                                                <option value="category">Category</option>
                                                <option value="stock">Stock Status</option>
                                            </select>
                                        </div>

                                        {/* Sort Order */}
                                        <button
                                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
                                        >
                                            {sortOrder === 'asc' ? (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                                                </svg>
                                            )}
                                            {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                                        </button>
                                    </div>

                                    {/* Filter Actions */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={resetFilters}
                                            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
                                        >
                                            Reset Filters
                                        </button>
                                        <span className="text-sm text-gray-500">
                                            {getFilteredAndSortedParts().length} of {availablePartItems.length} parts
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Parts Display */}
                            {isLoadingParts ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                </div>
                            ) : partsError ? (
                                <div className="text-center border border-red-200 bg-red-50 rounded-lg p-6 text-red-800">
                                    <div className="mb-2">
                                        <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium mb-2">Error Loading Parts</h3>
                                    <p className="mb-4">{partsError}</p>
                                    <button
                                        onClick={fetchAvailablePartItems}
                                        className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Try Again
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {getFilteredAndSortedParts().length > 0 ? (
                                        groupByCategory ? (
                                            // Grouped by Category View
                                            <div className="space-y-6 max-h-96 overflow-y-auto">
                                                {Object.entries(getGroupedPartsByCategory(getFilteredAndSortedParts())).map(([categoryName, categoryData]) => (
                                                    <div key={categoryName} className="space-y-3">
                                                        {/* Category Header */}
                                                        <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                                                            {categoryData.categoryImage ? (
                                                                <img 
                                                                    src={categoryData.categoryImage} 
                                                                    alt={categoryName}
                                                                    className="w-8 h-8 object-cover rounded-lg border"
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = 'none';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14-7H3a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <h3 className="text-lg font-semibold text-gray-900">{categoryName}</h3>
                                                                <p className="text-sm text-gray-500">{categoryData.parts.length} part{categoryData.parts.length !== 1 ? 's' : ''}</p>
                                                            </div>
                                                        </div>

                                                        {/* Category Parts */}
                                                        <div className={`${viewMode === 'grid' 
                                                            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
                                                            : 'space-y-2'
                                                        }`}>
                                                            {categoryData.parts.map(part => {
                                                                const isAlreadyAdded = editedBooking.partItems.some(p => p.id === part.id);
                                                                const isInStock = part.stockSummary?.toLowerCase().includes('in stock');

                                                                return (
                                                                    <div key={part.id} className={`border rounded-lg p-4 bg-white hover:shadow-md transition-shadow ${
                                                                        isAlreadyAdded ? 'border-green-200 bg-green-50' : 'border-gray-200'
                                                                    }`}>
                                                                        {/* Part Image */}
                                                                        <div className="flex items-start gap-3 mb-3">
                                                                            <div className="flex-shrink-0">
                                                                                {part.img ? (
                                                                                    <img 
                                                                                        src={part.img} 
                                                                                        alt={part.title}
                                                                                        className="w-12 h-12 object-cover rounded-lg border"
                                                                                        onError={(e) => {
                                                                                            e.currentTarget.style.display = 'none';
                                                                                        }}
                                                                                    />
                                                                                ) : (
                                                                                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                                                                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                                                        </svg>
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            <div className="flex-grow min-w-0">
                                                                                <h4 className="font-medium text-gray-900 truncate">{part.title}</h4>
                                                                                <p className="text-sm text-gray-600">{part.sku}</p>
                                                                                
                                                                                {/* Groups */}
                                                                                {part.groups && part.groups.length > 0 && (
                                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                                        {part.groups.slice(0, 2).map((group, index) => (
                                                                                            <span key={index} className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                                                                {group}
                                                                                            </span>
                                                                                        ))}
                                                                                        {part.groups.length > 2 && (
                                                                                            <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                                                                +{part.groups.length - 2}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Badges */}
                                                                        <div className="flex items-center gap-2 mb-3">
                                                                            {part.tier && (
                                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierBadgeClasses(part.tier)}`}>
                                                                                    {part.tier}
                                                                                </span>
                                                                            )}
                                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                                isInStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                                            }`}>
                                                                                {part.stockSummary || 'Unknown'}
                                                                            </span>
                                                                        </div>

                                                                        {/* Pricing */}
                                                                        <div className="mb-3">
                                                                            <div className="text-lg font-bold text-gray-900">
                                                                                £{part.priceForConsumer?.toFixed(2) ?? 'N/A'}
                                                                            </div>
                                                                            <div className="text-sm text-gray-500">
                                                                                Cost: £{part.price?.toFixed(2) ?? 'N/A'}
                                                                            </div>
                                                                        </div>

                                                                        {/* Action Button */}
                                                                        <button
                                                                            onClick={() => {
                                                                                if (!isAlreadyAdded && isInStock) {
                                                                                    setEditedBooking({
                                                                                        ...editedBooking,
                                                                                        partItems: [...editedBooking.partItems, part],
                                                                                        partItemsPrices: {
                                                                                            ...editedBooking.partItemsPrices,
                                                                                            [part.id]: { price: part.priceForConsumer || 0 }
                                                                                        }
                                                                                    });
                                                                                    toast.success(`Added ${part.title} to booking`);
                                                                                } else if (isAlreadyAdded) {
                                                                                    toast.info(`${part.title} is already added`);
                                                                                } else {
                                                                                    toast.warning(`${part.title} is not in stock`);
                                                                                }
                                                                            }}
                                                                            disabled={isAlreadyAdded || !isInStock}
                                                                            className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                                                                isAlreadyAdded 
                                                                                    ? 'bg-green-100 text-green-800 cursor-not-allowed'
                                                                                    : !isInStock
                                                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                                            }`}
                                                                        >
                                                                            {isAlreadyAdded ? 'Added' : !isInStock ? 'Out of Stock' : 'Add to Booking'}
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            // Ungrouped View
                                            <div className={`max-h-96 overflow-y-auto ${viewMode === 'grid' 
                                                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
                                                : 'space-y-2'
                                            }`}>
                                                {getFilteredAndSortedParts().map(part => {
                                                    const isAlreadyAdded = editedBooking.partItems.some(p => p.id === part.id);
                                                    const isInStock = part.stockSummary?.toLowerCase().includes('in stock');

                                                    return (
                                                        <div key={part.id} className={`border rounded-lg p-4 bg-white hover:shadow-md transition-shadow ${
                                                            isAlreadyAdded ? 'border-green-200 bg-green-50' : 'border-gray-200'
                                                        }`}>
                                                            {/* Same content as grouped view */}
                                                            <div className="flex items-start gap-3 mb-3">
                                                                <div className="flex-shrink-0">
                                                                    {part.img ? (
                                                                        <img 
                                                                            src={part.img} 
                                                                            alt={part.title}
                                                                            className="w-12 h-12 object-cover rounded-lg border"
                                                                            onError={(e) => {
                                                                                e.currentTarget.style.display = 'none';
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                                                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                                            </svg>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="flex-grow min-w-0">
                                                                    <h4 className="font-medium text-gray-900 truncate">{part.title}</h4>
                                                                    <p className="text-sm text-gray-600">{part.sku}</p>
                                                                    
                                                                    {/* Groups */}
                                                                    {part.groups && part.groups.length > 0 && (
                                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                                            {part.groups.slice(0, 2).map((group, index) => (
                                                                                <span key={index} className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                                                    {group}
                                                                                </span>
                                                                            ))}
                                                                            {part.groups.length > 2 && (
                                                                                <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                                                    +{part.groups.length - 2}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Badges */}
                                                            <div className="flex items-center gap-2 mb-3">
                                                                {part.tier && (
                                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierBadgeClasses(part.tier)}`}>
                                                                        {part.tier}
                                                                    </span>
                                                                )}
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                    isInStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                    {part.stockSummary || 'Unknown'}
                                                                </span>
                                                            </div>

                                                            {/* Pricing */}
                                                            <div className="mb-3">
                                                                <div className="text-lg font-bold text-gray-900">
                                                                    £{part.priceForConsumer?.toFixed(2) ?? 'N/A'}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    Cost: £{part.price?.toFixed(2) ?? 'N/A'}
                                                                </div>
                                                            </div>

                                                            {/* Action Button */}
                                                            <button
                                                                onClick={() => {
                                                                    if (!isAlreadyAdded && isInStock) {
                                                                        setEditedBooking({
                                                                            ...editedBooking,
                                                                            partItems: [...editedBooking.partItems, part],
                                                                            partItemsPrices: {
                                                                                ...editedBooking.partItemsPrices,
                                                                                [part.id]: { price: part.priceForConsumer || 0 }
                                                                            }
                                                                        });
                                                                        toast.success(`Added ${part.title} to booking`);
                                                                    } else if (isAlreadyAdded) {
                                                                        toast.info(`${part.title} is already added`);
                                                                    } else {
                                                                        toast.warning(`${part.title} is not in stock`);
                                                                    }
                                                                }}
                                                                disabled={isAlreadyAdded || !isInStock}
                                                                className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                                                    isAlreadyAdded 
                                                                        ? 'bg-green-100 text-green-800 cursor-not-allowed'
                                                                        : !isInStock
                                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                                }`}
                                                            >
                                                                {isAlreadyAdded ? 'Added' : !isInStock ? 'Out of Stock' : 'Add to Booking'}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )
                                    ) : (
                                        <div className="text-center border border-dashed border-gray-300 rounded-lg p-8 bg-gray-50">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                            </svg>
                                            <h3 className="mt-4 text-lg font-medium text-gray-900">No parts found</h3>
                                            <p className="mt-2 text-sm text-gray-500">
                                                {partsSearchQuery || selectedTier !== 'all' || selectedCategory !== 'all' || selectedGroup !== 'all' || stockFilter !== 'all'
                                                    ? 'Try adjusting your search criteria or filters.'
                                                    : 'No parts are available for this vehicle.'}
                                            </p>
                                            {(partsSearchQuery || selectedTier !== 'all' || selectedCategory !== 'all' || selectedGroup !== 'all' || stockFilter !== 'all') && (
                                                <button
                                                    onClick={resetFilters}
                                                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                >
                                                    Clear All Filters
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
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
        try {
            setIsLoading(true);
            
            // Convert the booking to the update request format
            const updateRequest = {
                selectedJobs: updatedBooking.jobs?.map(job => job.name) || [],
                totalPrice: updatedBooking.totalPrice,
                partItemsPrices: updatedBooking.partItems?.map(item => ({
                    id: item.id,
                    price: updatedBooking.partItemsPrices[item.id]?.price || 0
                })) || [],
                status: updatedBooking.status as any,
                clientId: updatedBooking.car.owner?.email || '',
                mechanicId: updatedBooking.mechanic?.id,
                carId: updatedBooking.car.id,
                jobs: updatedBooking.jobs?.map(job => ({
                    id: job.id,
                    duration: job.duration,
                    price: updatedBooking.jobsPrices?.[job.id]?.price || 0
                })) || [],
                location: {
                    address: "123 Main St", // Default values - you may want to get these from the booking
                    city: "New York",
                    postalCode: updatedBooking.location.postalCode,
                    country: "USA"
                },
                schedules: updatedBooking.schedules?.map(schedule => ({
                    id: schedule.id,
                    timeInterval: schedule.timeInterval,
                    dates: schedule.dates
                })) || []
            };

            console.log("Update request payload:", updateRequest);
            console.log("Jobs in update request:", updateRequest.jobs);

            // Call the actual API
            await JobService.updateBooking(updatedBooking.id, updateRequest);
            
            // Update local state with the normalized booking
            const normalizedSavedBooking = normalizeBookingData(updatedBooking);
            setBookings(prev =>
                prev.map(b => b.id === normalizedSavedBooking.id ? normalizedSavedBooking : b)
            );
            
            toast.success("Booking updated successfully");
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