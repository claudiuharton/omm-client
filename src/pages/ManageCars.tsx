import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../stores";
import { Loader } from "../components/Loader";
import { CarService } from "../services/car.service";
import { Car } from "../interfaces/car.interface";
import { toast } from "sonner";
import { RiDeleteBin6Line, RiAddLine, RiSaveLine, RiCloseLine, RiSearchLine, RiBookOpenLine } from "react-icons/ri";

// --- Reusable UI Components ---

const EmptyState = () => (
    <div className="text-center py-10">
        <RiSearchLine className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No cars found</h3>
        <p className="mt-1 text-sm text-gray-500">There are currently no cars matching your criteria.</p>
    </div>
);

const ErrorDisplay = ({ message, onRetry }: { message: string, onRetry: () => void }) => (
    <div className="text-center py-10 bg-red-50 border border-red-200 rounded-md">
        <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-red-800">Error Loading Cars</h3>
        <p className="mt-1 text-sm text-red-700">{message}</p>
        <div className="mt-4">
            <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
                Try Again
            </button>
        </div>
    </div>
);

interface CarAddDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (carData: { carNumber: string }) => void;
}

const CarAddDialog: React.FC<CarAddDialogProps> = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({ carNumber: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData({ carNumber: '' });
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.carNumber) {
            toast.error("Car Plate (VRM) is required.");
            return;
        }
        setIsSubmitting(true);
        try {
            await onSave({ carNumber: formData.carNumber });
        } catch (error) {
            console.error("Error saving car in dialog:", error);
        } finally {
            setIsSubmitting(false);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
            <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Add New Car by Plate</h3>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                        <label htmlFor="carNumber" className="block text-sm font-medium text-gray-700">
                            Car Plate (VRM)
                        </label>
                        <input
                            type="text"
                            name="carNumber"
                            id="carNumber"
                            value={formData.carNumber}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="e.g., AB12 CDE"
                            maxLength={8}
                        />
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            <RiCloseLine className="mr-2 h-5 w-5" /> Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            <RiSaveLine className="mr-2 h-5 w-5" /> {isSubmitting ? 'Saving...' : 'Save Car'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity z-50 flex justify-center items-center">
            <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full p-6">
                <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                            {title}
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={onConfirm}
                    >
                        Confirm Delete
                    </button>
                    <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ManageCars = () => {
    const [cars, setCars] = useState<Car[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
    const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
    const [filterText, setFilterText] = useState('');

    const isMountedRef = useRef(true);
    const { token } = useAuthStore();

    const fetchDataInternal = useCallback(async () => {
        if (!token) {
            setError("Authentication token not found. Please log in.");
            return;
        }
        setIsLoading(true);
        setError(null);
        console.log("Fetching cars...");
        try {
            const response = await CarService.getAllCars(token);
            console.log("Cars fetched:", response);

            if (isMountedRef.current) {
                if (response.success && response.responseObject) {
                    setCars(response.responseObject);
                } else {
                    throw new Error(response.message || 'Failed to fetch cars: Invalid response format.');
                }
            }
        } catch (err: unknown) {
            console.error('ManageCars: Data fetch error:', err);
            if (isMountedRef.current) {
                const message = err instanceof Error ? err.message : 'Failed to load car data.';
                setError(message);
            }
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        }
    }, [token]);

    useEffect(() => {
        isMountedRef.current = true;
        fetchDataInternal();

        return () => {
            isMountedRef.current = false;
        };
    }, [fetchDataInternal]);

    const handleSaveCar = async (newCarData: { carNumber: string }) => {
        if (!token) {
            toast.error("Authentication failed. Cannot save car.");
            return;
        }

        try {
            setIsLoading(true);

            const response = await CarService.createCar(newCarData, token);

            if (response.success && response.responseObject) {
                toast.success(response.message || "Car added successfully!");
                fetchDataInternal();
            } else {
                throw new Error(response.message || `Failed to add car.`);
            }
            setIsAddDialogOpen(false);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : `Failed to add car`;
            toast.error(message);
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        }
    };

    const handleDeleteCar = (carId: string) => {
        setSelectedCarId(carId);
        setIsConfirmDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedCarId || !token) {
            toast.error("Cannot delete car: Missing ID or authentication.");
            setIsConfirmDeleteDialogOpen(false);
            return;
        }

        try {
            setIsLoading(true);
            console.warn(`Simulating delete for car ID: ${selectedCarId}. Implement actual API call or mark.`);
            setCars(prev => prev.map(c => c.id === selectedCarId ? { ...c, isDeleted: true } : c));
            toast.success("Car marked as deleted (simulation).");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : `Failed to delete car`;
            toast.error(message);
        } finally {
            setIsConfirmDeleteDialogOpen(false);
            setSelectedCarId(null);
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        }
    };

    const filteredCars = cars.filter(car => {
        const filterLower = filterText.toLowerCase();
        return (
            (car.make?.toLowerCase() ?? '').includes(filterLower) ||
            (car.model?.toLowerCase() ?? '').includes(filterLower) ||
            (car.carNumber?.toLowerCase() ?? '').includes(filterLower) ||
            (car.owner?.email?.toLowerCase() ?? '').includes(filterLower)
        );
    });

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-semibold text-gray-800 mb-6">Manage Cars</h1>

            <div className="mb-4 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                <div className="relative w-full sm:w-auto">
                    <input
                        type="text"
                        placeholder="Filter by make, model, plate, owner..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm w-full"
                    />
                    <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>

                <button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <RiAddLine className="mr-2 h-5 w-5" /> Add New Car
                </button>

            </div>

            {isLoading && !cars.length && <Loader />}
            {error && <ErrorDisplay message={error} onRetry={fetchDataInternal} />}

            {!isLoading && !error && !filteredCars.length && <EmptyState />}
            {!error && filteredCars.length > 0 && (
                <div className="overflow-x-auto shadow border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plate (VRM)</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Make</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner Email</th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCars.map((car) => (
                                <tr key={car.id} className={`${car.isDeleted ? 'bg-gray-100 opacity-70' : ''} hover:bg-gray-50`}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{car.carNumber || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{car.make || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{car.model || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{car.owner?.email || 'Unassigned'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                        <Link
                                            to={`/admin/bookings/car/${car.id}`}
                                            title="View Bookings"
                                            className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${car.isDeleted ? 'pointer-events-none opacity-50' : ''}`}
                                        >
                                            <RiBookOpenLine className="h-4 w-4" />
                                        </Link>

                                        {!car.isDeleted && (
                                            <button
                                                onClick={() => handleDeleteCar(car.id)}
                                                title="Delete Car"
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <RiDeleteBin6Line className="h-5 w-5" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <CarAddDialog
                isOpen={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                onSave={handleSaveCar}
            />

            <ConfirmDialog
                isOpen={isConfirmDeleteDialogOpen}
                onClose={() => setIsConfirmDeleteDialogOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Car"
                message={`Are you sure you want to delete this car? ${cars.find(c => c.id === selectedCarId)?.carNumber ?? ''}? This action cannot be undone.`}
            />

        </div>
    );
};
