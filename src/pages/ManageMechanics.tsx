import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores";
import { Loader } from "../components/Loader";
import { AdminService } from "../services/admin.service";
import { User } from "../interfaces/user.interface";
import { toast } from "sonner";
import { RiEditLine, RiDeleteBin6Line, RiMailLine, RiPhoneLine, RiMapPinLine, RiToolsFill, RiCheckboxCircleLine } from "react-icons/ri";

/**
 * EmptyState component for when no mechanics are found
 */
const EmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg text-center">
        <h3 className="text-xl font-medium text-gray-700 mb-2">
            No mechanics found
        </h3>
        <p className="text-gray-500 mb-4">
            There are no mechanics registered in the system
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
 * ManageMechanics component
 */
export const ManageMechanics = () => {
    // Component state
    const [mechanics, setMechanics] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Refs
    const isMountedRef = useRef(true);
    const dataFetchedRef = useRef(false);
    const isFetchingRef = useRef(false);

    // Auth store
    const user = useAuthStore(state => state.user);
    const status = useAuthStore(state => state.status);

    // Navigation
    const navigate = useNavigate();

    // Fetch mechanic data
    const fetchDataInternal = useCallback(async () => {
        // Prevent concurrent fetches
        if (!isMountedRef.current || isFetchingRef.current) {
            console.log(`Fetch skipped: mounted=${isMountedRef.current}, fetching=${isFetchingRef.current}`);
            return;
        }

        console.log('Starting data fetch for mechanics...');
        isFetchingRef.current = true;
        setError(null);

        try {
            const response = await AdminService.getMechanics();
            if (isMountedRef.current) {
                if (response.success && response.responseObject) {
                    setMechanics(Array.isArray(response.responseObject)
                        ? response.responseObject
                        : [response.responseObject]);
                } else {
                    setMechanics([]);
                }
                dataFetchedRef.current = true;
                console.log('Mechanics data fetch successful.');
            }
        } catch (err) {
            console.error('Data fetch error:', err);
            if (isMountedRef.current) {
                setError('Failed to load mechanic data.');
            }
        } finally {
            if (isMountedRef.current) {
                isFetchingRef.current = false;
                setIsLoading(false);
            }
            console.log('Finished data fetch attempt.');
        }
    }, []);

    const handleRetry = useCallback(() => {
        console.log('Retrying data fetch...');
        setError(null);
        dataFetchedRef.current = false;
        fetchDataInternal();
    }, [fetchDataInternal]);

    // --- Effects ---

    // Effect 1: Mount/Unmount tracking
    useEffect(() => {
        console.log('ManageMechanics mounted');
        isMountedRef.current = true;
        return () => {
            console.log('ManageMechanics unmounting');
            isMountedRef.current = false;
        };
    }, []);

    // Effect 2: Trigger data fetching when component is mounted
    useEffect(() => {
        console.log(`Fetch Trigger Effect: status=${status}, fetched=${dataFetchedRef.current}, fetching=${isFetchingRef.current}`);
        if (status === 'authorized' && isMountedRef.current && !dataFetchedRef.current && !isFetchingRef.current) {
            console.log('Triggering data fetch and setting loading state...');
            dataFetchedRef.current = true;
            setIsLoading(true);
            fetchDataInternal();
        } else if (status !== 'authorized' && isMountedRef.current) {
            console.log('Resetting fetched flag due to non-authorized status.');
            dataFetchedRef.current = false;
        }
    }, [status, fetchDataInternal]);

    // Functions for mechanic actions
    const handleEditMechanic = (mechanicId: string) => {
        toast.info(`Edit mechanic functionality not implemented for ID: ${mechanicId}`);
    };

    const handleDeleteMechanic = (mechanicId: string) => {
        toast.info(`Delete mechanic functionality not implemented for ID: ${mechanicId}`);
    };

    // Filter mechanics based on search query
    const filteredMechanics = mechanics.filter(mechanic => {
        const searchTerm = searchQuery.toLowerCase();
        return (
            mechanic.firstName.toLowerCase().includes(searchTerm) ||
            mechanic.lastName.toLowerCase().includes(searchTerm) ||
            mechanic.email.toLowerCase().includes(searchTerm) ||
            (mechanic.phone && mechanic.phone.toLowerCase().includes(searchTerm))
        );
    });

    // --- Render Logic ---
    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader />
            </div>
        );
    }

    if (error) {
        return <ErrorDisplay message={error} onRetry={handleRetry} />;
    }

    if (status !== 'authorized' || !user || user.role !== 'admin') {
        return (
            <div className="p-8 bg-red-50 rounded-lg">
                <h3 className="text-xl font-medium text-red-700 mb-2">Access Denied</h3>
                <p className="text-red-500">You do not have permission to manage mechanics.</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Manage Mechanics</h1>
                    <p className="text-gray-500">View and manage mechanic accounts</p>
                </div>

                {/* Search and filter */}
                <div className="w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Search mechanics..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-gray-600 text-sm font-medium">Total Mechanics</h3>
                    <p className="text-3xl font-bold mt-1">{mechanics.length}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-gray-600 text-sm font-medium">Verified Mechanics</h3>
                    <p className="text-3xl font-bold mt-1">
                        {mechanics.filter(m => m.isVerified).length || 0}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-gray-600 text-sm font-medium">Average Response Time</h3>
                    <p className="text-3xl font-bold mt-1">2.4 hrs</p>
                </div>
            </div>

            {/* Mechanics table */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                {filteredMechanics.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Contact Information
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Location
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredMechanics.map((mechanic) => {
                                    // Calculate account age
                                    const createdDate = new Date(mechanic.createdAt);
                                    const formattedDate = createdDate.toLocaleDateString();

                                    return (
                                        <tr key={mechanic.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                                                        <span className="text-purple-600 font-semibold">
                                                            {mechanic.firstName.charAt(0)}{mechanic.lastName.charAt(0)}
                                                        </span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {mechanic.firstName} {mechanic.lastName}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            ID: {mechanic.id.substring(0, 8)}...
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 flex items-center gap-1">
                                                    <RiMailLine className="text-gray-400" /> {mechanic.email}
                                                </div>
                                                {mechanic.phone && (
                                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                                        <RiPhoneLine className="text-gray-400" /> {mechanic.phone}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {mechanic.zipCode ? (
                                                    <div className="text-sm text-gray-900 flex items-center gap-1">
                                                        <RiMapPinLine className="text-gray-400" /> {mechanic.zipCode}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-500 italic">Not provided</span>
                                                )}
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Joined: {formattedDate}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                    ${mechanic.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {mechanic.isVerified ? 'Verified' : 'Pending'}
                                                </span>
                                                <div className="flex items-center mt-1">
                                                    <RiToolsFill className="text-gray-400 mr-1" />
                                                    <span className="text-xs text-gray-500">Active</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEditMechanic(mechanic.id)}
                                                        className="text-purple-600 hover:text-purple-900 bg-purple-50 p-1.5 rounded"
                                                        title="Edit mechanic"
                                                    >
                                                        <RiEditLine />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteMechanic(mechanic.id)}
                                                        className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded"
                                                        title="Delete mechanic"
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
        </div>
    );
}; 