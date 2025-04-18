import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores";
import { Loader } from "../components/Loader";
import { AdminService } from "../services/admin.service";
import { User } from "../interfaces/user.interface";
import { toast } from "sonner";
import { RiEditLine, RiDeleteBin6Line, RiMailLine, RiPhoneLine, RiMapPinLine } from "react-icons/ri";

/**
 * EmptyState component for when no clients are found
 */
const EmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg text-center">
        <h3 className="text-xl font-medium text-gray-700 mb-2">
            No clients found
        </h3>
        <p className="text-gray-500 mb-4">
            There are no clients registered in the system
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
 * ManageClients component
 */
export const ManageClients = () => {
    // Component state
    const [clients, setClients] = useState<User[]>([]);
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

    // Fetch client data
    const fetchDataInternal = useCallback(async () => {
        // Prevent concurrent fetches
        if (!isMountedRef.current || isFetchingRef.current) {
            console.log(`Fetch skipped: mounted=${isMountedRef.current}, fetching=${isFetchingRef.current}`);
            return;
        }

        console.log('Starting data fetch for clients...');
        isFetchingRef.current = true;
        setError(null);

        try {
            const response = await AdminService.getClients();
            if (isMountedRef.current) {
                if (response.success && response.responseObject) {
                    setClients(Array.isArray(response.responseObject)
                        ? response.responseObject
                        : [response.responseObject]);
                } else {
                    setClients([]);
                }
                dataFetchedRef.current = true;
                console.log('Clients data fetch successful.');
            }
        } catch (err) {
            console.error('Data fetch error:', err);
            if (isMountedRef.current) {
                setError('Failed to load client data.');
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
        console.log('ManageClients mounted');
        isMountedRef.current = true;
        return () => {
            console.log('ManageClients unmounting');
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

    // Functions for client actions
    const handleEditClient = (clientId: string) => {
        toast.info(`Edit client functionality not implemented for ID: ${clientId}`);
    };

    const handleDeleteClient = (clientId: string) => {
        toast.info(`Delete client functionality not implemented for ID: ${clientId}`);
    };

    // Filter clients based on search query
    const filteredClients = clients.filter(client => {
        const searchTerm = searchQuery.toLowerCase();
        return (
            client.firstName.toLowerCase().includes(searchTerm) ||
            client.lastName.toLowerCase().includes(searchTerm) ||
            client.email.toLowerCase().includes(searchTerm) ||
            (client.phone && client.phone.toLowerCase().includes(searchTerm))
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
                <p className="text-red-500">You do not have permission to manage clients.</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Manage Clients</h1>
                    <p className="text-gray-500">View and manage client accounts</p>
                </div>

                {/* Search and filter */}
                <div className="w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {/* Clients table */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                {filteredClients.length > 0 ? (
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
                                        Account Created
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredClients.map((client) => {
                                    // Calculate account age
                                    const createdDate = new Date(client.createdAt);
                                    const formattedDate = createdDate.toLocaleDateString();

                                    return (
                                        <tr key={client.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                        <span className="text-indigo-600 font-semibold">
                                                            {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                                                        </span>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {client.firstName} {client.lastName}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            ID: {client.id.substring(0, 8)}...
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 flex items-center gap-1">
                                                    <RiMailLine className="text-gray-400" /> {client.email}
                                                </div>
                                                {client.phone && (
                                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                                        <RiPhoneLine className="text-gray-400" /> {client.phone}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {client.zipCode ? (
                                                    <div className="text-sm text-gray-900 flex items-center gap-1">
                                                        <RiMapPinLine className="text-gray-400" /> {client.zipCode}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-500 italic">Not provided</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formattedDate}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEditClient(client.id)}
                                                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-1.5 rounded"
                                                    >
                                                        <RiEditLine />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClient(client.id)}
                                                        className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded"
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