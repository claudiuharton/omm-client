import { useEffect, useState, useCallback, useRef } from "react";
import { useAuthStore, useJobStore } from "../stores";
import { Loader } from "../components/Loader";
import { Booking as BookingObj } from "../interfaces/booking.interface";
import { useNavigate } from "react-router-dom";
import {
    RiGroupLine,
    RiUserSettingsLine,
    RiCalendarCheckLine,
    RiCarLine,
    RiDatabase2Line,
    RiSettings4Line,
    RiDashboardLine,
    RiPieChartLine,
    RiToolsLine
} from "react-icons/ri";

/**
 * EmptyState component for when there are no items to display
 */
const EmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg text-center">
        <h3 className="text-xl font-medium text-gray-700 mb-2">
            No data found
        </h3>
        <p className="text-gray-500 mb-4">
            There is no data to display at this time
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
 * StatCard component for displaying statistics
 */
const StatCard = ({
    title,
    value,
    description,
    icon,
    color = "indigo"
}: {
    title: string,
    value: string | number,
    description?: string,
    icon?: React.ReactNode,
    color?: "indigo" | "purple" | "teal" | "green" | "amber" | "blue" | "red"
}) => {
    const colorClasses = {
        indigo: "bg-indigo-100 text-indigo-600",
        purple: "bg-purple-100 text-purple-600",
        teal: "bg-teal-100 text-teal-600",
        green: "bg-green-100 text-green-600",
        amber: "bg-amber-100 text-amber-600",
        blue: "bg-blue-100 text-blue-600",
        red: "bg-red-100 text-red-600"
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 relative overflow-hidden">
            {icon && (
                <div className={`absolute right-4 top-4 p-2 rounded-full ${colorClasses[color]}`}>
                    {icon}
                </div>
            )}
            <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {description && <p className="text-gray-500 text-sm mt-1">{description}</p>}
            <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 ${colorClasses[color]}`}></div>
        </div>
    );
};

/**
 * AdminAction component for buttons on dashboard
 */
const AdminAction = ({
    title,
    onClick,
    icon,
    color = "indigo",
    description,
}: {
    title: string;
    onClick: () => void;
    icon: React.ReactNode;
    color: "indigo" | "purple" | "teal" | "green" | "amber" | "blue" | "red";
    description?: string;
}) => {
    const colorClasses = {
        indigo: "bg-indigo-600 hover:bg-indigo-700",
        purple: "bg-purple-600 hover:bg-purple-700",
        teal: "bg-teal-600 hover:bg-teal-700",
        green: "bg-green-600 hover:bg-green-700",
        amber: "bg-amber-600 hover:bg-amber-700",
        blue: "bg-blue-600 hover:bg-blue-700",
        red: "bg-red-600 hover:bg-red-700",
    };

    return (
        <button
            onClick={onClick}
            className={`${colorClasses[color]} text-white p-4 rounded-lg transition-colors flex flex-col items-center justify-center h-full`}
        >
            <div className="text-3xl mb-2">{icon}</div>
            <span className="font-medium text-lg">{title}</span>
            {description && <p className="text-xs mt-1 text-white/80">{description}</p>}
        </button>
    );
};

/**
 * AdminDashboard component
 */
export const AdminDashboard = () => {
    // Component state
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Refs
    const isMountedRef = useRef(true);
    const dataFetchedRef = useRef(false);
    const isFetchingRef = useRef(false);

    // Store Selectors
    const getBookings = useJobStore(state => state.getBookings);
    const bookings = useJobStore(state => state.bookings);
    const user = useAuthStore(state => state.user);
    const status = useAuthStore(state => state.status);

    // Navigation
    const navigate = useNavigate();

    // --- Callbacks ---
    const fetchDataInternal = useCallback(async () => {
        // Prevent concurrent fetches
        if (!isMountedRef.current || isFetchingRef.current) {
            console.log(`Fetch skipped: mounted=${isMountedRef.current}, fetching=${isFetchingRef.current}`);
            return;
        }

        console.log('Starting data fetch for admin dashboard...');
        isFetchingRef.current = true;
        setError(null);

        try {
            await getBookings();
            if (isMountedRef.current) {
                dataFetchedRef.current = true;
                console.log('Admin dashboard data fetch successful.');
            }
        } catch (err) {
            console.error('Data fetch error:', err);
            if (isMountedRef.current) {
                setError('Failed to load dashboard data.');
            }
        } finally {
            if (isMountedRef.current) {
                isFetchingRef.current = false;
                setIsLoading(false);
            }
            console.log('Finished data fetch attempt.');
        }
    }, [getBookings]);

    const handleRetry = useCallback(() => {
        console.log('Retrying data fetch...');
        setError(null);
        dataFetchedRef.current = false;
        fetchDataInternal();
    }, [fetchDataInternal]);

    // --- Effects ---

    // Effect 1: Mount/Unmount tracking
    useEffect(() => {
        console.log('AdminDashboard mounted');
        isMountedRef.current = true;
        return () => {
            console.log('AdminDashboard unmounting');
            isMountedRef.current = false;
        };
    }, []);

    // Effect 2: Trigger data fetching when conditions are met
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

    // Effect 3: Refresh data periodically
    useEffect(() => {
        const refreshInterval = setInterval(() => {
            if (status === 'authorized' && isMountedRef.current && !isFetchingRef.current) {
                console.log('Refreshing admin dashboard data...');
                fetchDataInternal();
            }
        }, 30000); // 30 seconds

        return () => clearInterval(refreshInterval);
    }, [status, fetchDataInternal]);

    // --- Navigation Handlers ---
    const handleManageClients = () => {
        navigate('/admin/manage-clients');
    };

    const handleManageMechanics = () => {
        navigate('/admin/manage-mechanics');
    };

    const handleViewAllBookings = () => {
        navigate('/admin/manage-bookings');
    };

    const handleManagePartItems = () => {
        navigate('/admin/manage-parts');
    };

    const handleManageCars = () => {
        navigate('/admin/manage-cars');
    };

    const handleManageJobs = () => {
        navigate('/admin/manage-jobs');
    };

    const handleSystemSettings = () => {
        // This would navigate to system settings once implemented
        console.log('System settings not yet implemented');
    };

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
                <p className="text-red-500">You do not have permission to access the admin dashboard.</p>
            </div>
        );
    }

    // Calculate statistics
    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;
    const completedBookings = bookings.filter(b => b.status === 'completed').length;
    const totalRevenue = bookings
        .filter(b => b.status === 'paid' || b.status === 'completed')
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    // Get percentage of completed bookings
    const completionRate = totalBookings > 0
        ? Math.round((completedBookings / totalBookings) * 100)
        : 0;

    return (
        <div className="w-full max-w-7xl mx-auto px-4">
            {/* Dashboard Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                    <p className="text-gray-500">Manage your business operations and monitor performance</p>
                </div>
                <div className="bg-purple-100 text-purple-800 px-6 py-3 rounded-xl shadow-sm">
                    <p>Welcome, <span className="font-medium">{user.firstName} {user.lastName}</span></p>
                    <p className="text-sm font-medium">System Administrator</p>
                </div>
            </div>

            {/* System Overview Section */}
            <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                    <RiPieChartLine className="text-indigo-600 text-xl" />
                    <h2 className="text-xl font-bold text-gray-800">System Overview</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Bookings"
                        value={totalBookings}
                        icon={<RiCalendarCheckLine size={20} />}
                        color="indigo"
                    />
                    <StatCard
                        title="Pending Bookings"
                        value={pendingBookings}
                        icon={<RiCalendarCheckLine size={20} />}
                        color="amber"
                    />
                    <StatCard
                        title="Completed Bookings"
                        value={completedBookings}
                        description={`${completionRate}% completion rate`}
                        icon={<RiCalendarCheckLine size={20} />}
                        color="green"
                    />
                    <StatCard
                        title="Total Revenue"
                        value={`£${totalRevenue.toFixed(2)}`}
                        icon={<RiDatabase2Line size={20} />}
                        color="blue"
                    />
                </div>
            </div>

            {/* Quick Actions Section */}
            <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                    <RiDashboardLine className="text-indigo-600 text-xl" />
                    <h2 className="text-xl font-bold text-gray-800">Quick Actions</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-md">
                        <h3 className="font-semibold text-lg mb-3 text-gray-700">Recent Bookings</h3>
                        {bookings.length > 0 ? (
                            <div className="space-y-3">
                                {bookings.slice(0, 3).map((booking) => (
                                    <div key={booking.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                        <span className="text-sm">{booking.car.carNumber}</span>
                                        <span className={`px-2 py-1 text-xs rounded-full 
                                            ${booking.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'}`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                ))}
                                <button
                                    onClick={handleViewAllBookings}
                                    className="w-full mt-2 py-2 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors text-sm font-medium"
                                >
                                    View All Bookings
                                </button>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No bookings available</p>
                        )}
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-md flex flex-col">
                        <h3 className="font-semibold text-lg mb-3 text-gray-700">System Status</h3>
                        <div className="flex-grow space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Bookings</span>
                                <span className="text-sm font-medium text-green-600">Online</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Payments</span>
                                <span className="text-sm font-medium text-green-600">Online</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">API</span>
                                <span className="text-sm font-medium text-green-600">Online</span>
                            </div>
                        </div>
                        <button
                            onClick={handleSystemSettings}
                            className="w-full mt-4 py-2 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors text-sm font-medium"
                        >
                            System Settings
                        </button>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-4 rounded-lg shadow-md text-white flex flex-col">
                        <h3 className="font-semibold text-lg mb-3">Admin Quick Links</h3>
                        <div className="flex-grow space-y-2 mb-4">
                            <button
                                onClick={handleManageClients}
                                className="w-full py-2 bg-white/20 hover:bg-white/30 rounded transition-colors text-sm font-medium text-left px-3 flex items-center gap-2"
                            >
                                <RiGroupLine />
                                Manage Clients
                            </button>
                            <button
                                onClick={handleManageMechanics}
                                className="w-full py-2 bg-white/20 hover:bg-white/30 rounded transition-colors text-sm font-medium text-left px-3 flex items-center gap-2"
                            >
                                <RiUserSettingsLine />
                                Manage Mechanics
                            </button>
                            <button
                                onClick={handleManageCars}
                                className="w-full py-2 bg-white/20 hover:bg-white/30 rounded transition-colors text-sm font-medium text-left px-3 flex items-center gap-2"
                            >
                                <RiCarLine />
                                Manage Cars
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Actions Section */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <RiSettings4Line className="text-indigo-600 text-xl" />
                    <h2 className="text-xl font-bold text-gray-800">Admin Actions</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AdminAction
                        title="Manage Clients"
                        onClick={handleManageClients}
                        icon={<RiGroupLine />}
                        color="indigo"
                        description="View and edit client accounts"
                    />
                    <AdminAction
                        title="Manage Mechanics"
                        onClick={handleManageMechanics}
                        icon={<RiUserSettingsLine />}
                        color="purple"
                        description="Manage mechanic staff and assignments"
                    />
                    <AdminAction
                        title="View Bookings"
                        onClick={handleViewAllBookings}
                        icon={<RiCalendarCheckLine />}
                        color="green"
                        description="Review and manage all bookings"
                    />
                    <AdminAction
                        title="Manage Parts"
                        onClick={handleManagePartItems}
                        icon={<RiDatabase2Line />}
                        color="amber"
                        description="Manage inventory and parts"
                    />
                    <AdminAction
                        title="Manage Cars"
                        onClick={handleManageCars}
                        icon={<RiCarLine />}
                        color="teal"
                        description="View and edit registered vehicles"
                    />
                    <AdminAction
                        title="Manage Jobs"
                        onClick={handleManageJobs}
                        icon={<RiToolsLine />}
                        color="blue"
                        description="Create and manage service jobs"
                    />
                </div>
            </div>
        </div>
    );
}; 