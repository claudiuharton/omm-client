import { useEffect, useState, useCallback, useRef } from "react";
import { useAuthStore } from "../stores";
import { PartItemService } from "../services"; // Import from index
import { PartItem, CreatePartItemDto } from "../interfaces"; // Import from index
import { toast } from "sonner";
import { RiDeleteBin6Line, RiAddLine, RiSaveLine, RiCloseLine, RiSearchLine } from "react-icons/ri";

// --- Reusable UI Components (Similar to ManageCars, adapt if needed) ---

const EmptyState = () => (
    <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
        <RiSearchLine className="mx-auto h-16 w-16 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No parts found</h3>
        <p className="mt-2 text-base text-gray-500 max-w-md mx-auto">There are currently no parts matching your criteria or added yet.</p>
        <button
            onClick={() => document.getElementById('add-part-button')?.click()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
            <RiAddLine className="mr-2" /> Add Your First Part
        </button>
    </div>
);

const ErrorDisplay = ({ message, onRetry }: { message: string, onRetry: () => void }) => (
    <div className="text-center py-10 bg-red-50 border border-red-200 rounded-md">
        <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-red-800">Error Loading Parts</h3>
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

// --- Add Part Dialog ---
interface PartAddDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (partData: CreatePartItemDto) => void;
}

const PartAddDialog: React.FC<PartAddDialogProps> = ({ isOpen, onClose, onSave }) => {
    const initialFormData: CreatePartItemDto = {
        title: '',
        sku: '',
        price: 0,
        priceForConsumer: 0,
        stockQuantity: 0,
        description: '',
        tier: '',
    };
    const [formData, setFormData] = useState<CreatePartItemDto>(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [currentStep, setCurrentStep] = useState(1);

    // Reset form when dialog opens
    useEffect(() => {
        if (isOpen) {
            setFormData(initialFormData);
            setIsSubmitting(false);
            setErrors({});
            setCurrentStep(1);
        }
    }, [isOpen]);

    const validateField = (name: string, value: any): string => {
        switch (name) {
            case 'title':
                return !value.trim() ? 'Title is required' : '';
            case 'sku':
                return !value.trim() ? 'Code is required' : '';
            case 'price':
                return value <= 0 ? 'Price must be greater than 0' : '';
            case 'priceForCustomer':
                return value <= 0 ? 'Customer price must be greater than 0' : '';
            case 'stockQuantity':
                return value < 0 ? 'Stock cannot be negative' : '';
            default:
                return '';
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isNumberField = type === 'number';
        const newValue = isNumberField ? (value === '' ? '' : Number(value)) : value;

        setFormData(prev => ({ ...prev, [name]: newValue }));

        // Validate field on change
        const error = validateField(name, newValue);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        let isValid = true;

        // Validate each field
        Object.entries(formData).forEach(([key, value]) => {
            const error = validateField(key, value);
            if (error) {
                newErrors[key] = error;
                isValid = false;
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please correct the errors in the form.");
            return;
        }

        setIsSubmitting(true);
        try {
            await onSave(formData);
        } catch (error) {
            console.error("Error saving part item in dialog:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const nextStep = () => {
        const fieldsToValidate = currentStep === 1
            ? ['name', 'itemCode', 'tier']
            : ['price', 'priceForCustomer', 'stockQuantity'];

        const stepErrors: Record<string, string> = {};
        let hasErrors = false;

        fieldsToValidate.forEach(field => {
            const error = validateField(field, formData[field as keyof CreatePartItemDto]);
            if (error) {
                stepErrors[field] = error;
                hasErrors = true;
            }
        });

        if (hasErrors) {
            setErrors(prev => ({ ...prev, ...stepErrors }));
            return;
        }

        setCurrentStep(2);
    };

    const prevStep = () => setCurrentStep(1);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
            <div className="relative mx-auto p-0 border w-full max-w-2xl shadow-2xl rounded-xl bg-white overflow-hidden">
                {/* Header with progress indicator */}
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold">
                            {currentStep === 1 ? 'Add New Part - Basic Info' : 'Add New Part - Pricing & Stock'}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-indigo-200 transition-colors"
                        >
                            <RiCloseLine className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Progress steps */}
                    <div className="mt-6 flex items-center">
                        <div className="flex items-center relative">
                            <div className={`rounded-full transition duration-500 ease-in-out h-10 w-10 flex items-center justify-center ${currentStep >= 1 ? 'bg-white text-indigo-600' : 'bg-indigo-300 text-white'
                                }`}>
                                <span className="text-center font-bold">1</span>
                            </div>
                            <div className="text-xs font-semibold absolute -bottom-6 w-32 text-center">Basic Information</div>
                        </div>
                        <div className={`flex-1 border-t-2 transition duration-500 ease-in-out ${currentStep > 1 ? 'border-white' : 'border-indigo-300'
                            }`}></div>
                        <div className="flex items-center relative">
                            <div className={`rounded-full transition duration-500 ease-in-out h-10 w-10 flex items-center justify-center ${currentStep >= 2 ? 'bg-white text-indigo-600' : 'bg-indigo-300 text-white'
                                }`}>
                                <span className="text-center font-bold">2</span>
                            </div>
                            <div className="text-xs font-semibold absolute -bottom-6 w-32 text-center">Pricing & Stock</div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="px-8 py-6">
                    {currentStep === 1 ? (
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className={`mt-1 input-field ${errors.name ? 'border-red-500 bg-red-50' : ''}`}
                                    placeholder="Enter part title"
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                            </div>

                            <div>
                                <label htmlFor="itemCode" className="block text-sm font-medium text-gray-700">SKU <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="itemCode"
                                    id="itemCode"
                                    value={formData.sku}
                                    onChange={handleChange}
                                    className={`mt-1 input-field font-mono ${errors.itemCode ? 'border-red-500 bg-red-50' : ''}`}
                                    placeholder="e.g. PART-12345"
                                />
                                {errors.itemCode && <p className="mt-1 text-sm text-red-600">{errors.itemCode}</p>}
                            </div>

                            <div>
                                <label htmlFor="tier" className="block text-sm font-medium text-gray-700">Tier</label>
                                <select
                                    name="tier"
                                    id="tier"
                                    value={formData.tier ?? ''}
                                    onChange={handleChange}
                                    className="mt-1 input-field"
                                >
                                    <option value="">-- Select a tier --</option>
                                    <option value="gold">Gold</option>
                                    <option value="silver">Silver</option>
                                    <option value="bronze">Bronze</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    name="description"
                                    id="description"
                                    value={formData.description ?? ''}
                                    onChange={handleChange}
                                    rows={3}
                                    className="mt-1 input-field"
                                    placeholder="Part description and details"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">Base Price (£) <span className="text-red-500">*</span></label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm">£</span>
                                        </div>
                                        <input
                                            type="number"
                                            name="price"
                                            id="price"
                                            value={formData.price}
                                            onChange={handleChange}
                                            min="0.01"
                                            step="0.01"
                                            className={`pl-7 input-field ${errors.price ? 'border-red-500 bg-red-50' : ''}`}
                                        />
                                    </div>
                                    {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                                </div>

                                <div>
                                    <label htmlFor="priceForCustomer" className="block text-sm font-medium text-gray-700">Customer Price (£) <span className="text-red-500">*</span></label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm">£</span>
                                        </div>
                                        <input
                                            type="number"
                                            name="priceForCustomer"
                                            id="priceForCustomer"
                                            value={formData.priceForCustomer}
                                            onChange={handleChange}
                                            min="0.01"
                                            step="0.01"
                                            className={`pl-7 input-field ${errors.priceForCustomer ? 'border-red-500 bg-red-50' : ''}`}
                                        />
                                    </div>
                                    {errors.priceForCustomer && <p className="mt-1 text-sm text-red-600">{errors.priceForCustomer}</p>}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700">Stock Quantity <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    name="stockQuantity"
                                    id="stockQuantity"
                                    value={formData.stockQuantity}
                                    onChange={handleChange}
                                    min="0"
                                    step="1"
                                    className={`mt-1 input-field ${errors.stockQuantity ? 'border-red-500 bg-red-50' : ''}`}
                                />
                                {errors.stockQuantity && <p className="mt-1 text-sm text-red-600">{errors.stockQuantity}</p>}
                            </div>

                            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-100">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-yellow-800">Pricing information</h3>
                                        <div className="mt-2 text-sm text-yellow-700">
                                            <p>The base price reflects your cost, while the customer price is what will be charged to customers. If customer price is not set, the base price will be used.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-6 border-t border-gray-200 mt-8 flex justify-between">
                        {currentStep === 1 ? (
                            <>
                                <button type="button" onClick={onClose} className="btn btn-ghost">
                                    <RiCloseLine className="mr-1" /> Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md flex items-center shadow-md hover:shadow transition-all"
                                >
                                    Next
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-md flex items-center shadow-md hover:shadow transition-all"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-md flex items-center shadow-md hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <RiSaveLine className="mr-1" /> Save Part
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Confirmation Dialog (Reuse or adapt from ManageCars) ---
interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    // Using Tailwind modal structure from ManageCars for consistency
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
                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">{title}</h3>
                        <div className="mt-2"><p className="text-sm text-gray-500">{message}</p></div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button type="button" className="btn btn-danger w-full sm:ml-3 sm:w-auto" onClick={onConfirm}>Confirm Delete</button>
                    <button type="button" className="btn btn-ghost mt-3 w-full sm:mt-0 sm:w-auto" onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
};


// --- Main ManageParts Component ---
export const ManageParts = () => {
    const [parts, setParts] = useState<PartItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
    const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
    const [filterText, setFilterText] = useState('');
    const [sortField, setSortField] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [viewMode, setViewMode] = useState<'all' | 'active' | 'deleted'>('active');

    const isMountedRef = useRef(true);
    const { token } = useAuthStore();

    // Fetch Data
    const fetchDataInternal = useCallback(async () => {
        if (!token) {
            setError("Authentication token not found.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await PartItemService.getAllPartItems(token);
            if (isMountedRef.current) {
                if (response.success && response.responseObject) {
                    setParts(response.responseObject);
                } else {
                    throw new Error(response.message || 'Failed to fetch parts');
                }
            }
        } catch (err: unknown) {
            if (isMountedRef.current) {
                const message = err instanceof Error ? err.message : 'Failed to load part data.';
                setError(message);
            }
        } finally {
            if (isMountedRef.current) setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        isMountedRef.current = true;
        fetchDataInternal();
        return () => { isMountedRef.current = false; };
    }, [fetchDataInternal]);

    // Save New Part
    const handleSavePart = async (newPartData: CreatePartItemDto) => {
        if (!token) {
            toast.error("Authentication failed."); return;
        }
        try {
            setIsLoading(true);
            const response = await PartItemService.createPartItem(newPartData, token);
            if (response.success && response.responseObject) {
                toast.success(response.message || "Part added successfully!");
                fetchDataInternal(); // Refresh list
                setIsAddDialogOpen(false);
            } else {
                throw new Error(response.message || `Failed to add part.`);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : `Failed to add part`;
            toast.error(message);
        } finally {
            if (isMountedRef.current) setIsLoading(false);
        }
    };

    // Delete Part
    const handleDeletePart = (partId: string) => {
        setSelectedPartId(partId);
        setIsConfirmDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedPartId || !token) {
            toast.error("Cannot delete part: Missing ID or authentication.");
            setIsConfirmDeleteDialogOpen(false);
            return;
        }
        try {
            setIsLoading(true);
            // Simulate delete by marking isDeleted
            console.warn(`Simulating delete for part ID: ${selectedPartId}. Implement actual API call.`);
            // const response = await PartItemService.deletePartItem(selectedPartId, token);
            // if (!response.success) throw new Error(response.message || 'Failed to delete');

            setParts(prev => prev.map(p => p.id === selectedPartId ? { ...p, isDeleted: true } : p));
            toast.success("Part marked as deleted (simulation).");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : `Failed to delete part`;
            toast.error(message);
        } finally {
            setIsConfirmDeleteDialogOpen(false);
            setSelectedPartId(null);
            if (isMountedRef.current) setIsLoading(false);
        }
    };

    // Handle sorting
    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Filter Logic with enhancements
    const filteredParts = parts.filter(part => {
        if (!part) return false; // Skip null/undefined parts

        // Filter by view mode
        if (viewMode === 'active' && part.isDeleted) return false;
        if (viewMode === 'deleted' && !part.isDeleted) return false;

        // Skip filter if empty
        if (!filterText) return true;

        const filterLower = filterText.toLowerCase();
        return (
            (part.title?.toLowerCase() ?? '').includes(filterLower) ||
            (part.sku?.toLowerCase() ?? '').includes(filterLower) ||
            (part.tier?.toLowerCase() ?? '').includes(filterLower) ||
            (part.description?.toLowerCase() ?? '').includes(filterLower) ||
            (part.stocksData?.Local?.toString() ?? '').includes(filterLower) ||
            (part.price?.toString() ?? '').includes(filterLower) ||
            (part.priceForConsumer?.toString() ?? '').includes(filterLower)
        );
    });

    // Sort logic
    const sortedParts = [...filteredParts].sort((a, b) => {
        if (!sortField) return 0;

        let valueA: any = a[sortField as keyof PartItem];
        let valueB: any = b[sortField as keyof PartItem];

        // Handle null/undefined values
        if (valueA === null || valueA === undefined) valueA = '';
        if (valueB === null || valueB === undefined) valueB = '';

        // Handle string comparison
        if (typeof valueA === 'string' && typeof valueB === 'string') {
            return sortDirection === 'asc'
                ? valueA.localeCompare(valueB)
                : valueB.localeCompare(valueA);
        }

        // Handle number comparison
        return sortDirection === 'asc'
            ? Number(valueA) - Number(valueB)
            : Number(valueB) - Number(valueA);
    });

    // Format currency
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
    };

    // Table header with sort indicators
    const TableHeader = ({ field, label, align = 'left' }: { field: string, label: string, align?: 'left' | 'right' | 'center' }) => (
        <th
            className={`th cursor-pointer hover:bg-gray-100 text-${align}`}
            onClick={() => handleSort(field)}
        >
            <div className={`flex items-center ${align === 'right' ? 'justify-end' :
                align === 'center' ? 'justify-center' :
                    'justify-start'
                }`}>
                <span>{label}</span>
                {sortField === field && (
                    <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                )}
            </div>
        </th>
    );

    // Skeleton loader for better loading UX
    const TableSkeleton = () => (
        <div className="overflow-x-auto shadow border-b border-gray-200 sm:rounded-lg animate-pulse">
            <div className="min-w-full bg-white">
                <div className="h-12 bg-gray-200 mb-4"></div>
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 mb-2"></div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="container mx-auto p-4 max-w-7xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Manage Part Items</h1>
                <button
                    id="add-part-button"
                    onClick={() => setIsAddDialogOpen(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-indigo-500/30 transition-all duration-200 transform hover:-translate-y-1 flex items-center"
                >
                    <span className="bg-white bg-opacity-30 rounded-full p-1 mr-2">
                        <RiAddLine className="h-5 w-5" />
                    </span>
                    Add New Part
                </button>
            </div>

            {/* Enhanced Controls */}
            <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                    <div className="relative w-full sm:w-80">
                        <input
                            type="text"
                            placeholder="Search parts..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm w-full transition-shadow"
                        />
                        <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        {filterText && (
                            <button
                                onClick={() => setFilterText('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-gray-600"
                            >
                                <RiCloseLine className="h-5 w-5" />
                            </button>
                        )}
                    </div>

                    {/* View toggle */}
                    <div className="flex space-x-2 border border-gray-300 rounded-md overflow-hidden">
                        <button
                            onClick={() => setViewMode('all')}
                            className={`px-4 py-2 text-sm ${viewMode === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setViewMode('active')}
                            className={`px-4 py-2 text-sm ${viewMode === 'active' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => setViewMode('deleted')}
                            className={`px-4 py-2 text-sm ${viewMode === 'deleted' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                        >
                            Deleted
                        </button>
                    </div>
                </div>
            </div>

            {/* Loading / Error / Empty States */}
            {isLoading && !parts.length && <TableSkeleton />}
            {error && <ErrorDisplay message={error} onRetry={fetchDataInternal} />}
            {!isLoading && !error && !filteredParts.length && <EmptyState />}

            {/* Parts Table with improved UX */}
            {!error && filteredParts.length > 0 && (
                <div className="overflow-x-auto shadow border-b border-gray-200 sm:rounded-lg bg-white">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <TableHeader field="title" label="Title" />
                                <TableHeader field="sku" label="Code" />
                                <TableHeader field="tier" label="Tier" />
                                <TableHeader field="price" label="Base Price" />
                                <TableHeader field="priceForConsumer" label="Customer Price" />
                                <TableHeader field="stockQuantity" label="Stock" />
                                <th className="th text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedParts.map((part) => (
                                <tr
                                    key={part.id}
                                    className={`
                                        ${part.isDeleted ? 'bg-gray-50 text-gray-500' : 'hover:bg-blue-50'} 
                                        transition-colors duration-150
                                    `}
                                >
                                    <td className="td font-medium text-gray-900">
                                        <div className="flex items-center">
                                            {part.isDeleted && <span className="mr-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">Deleted</span>}
                                            {part.title}
                                        </div>
                                    </td>
                                    <td className="td font-mono text-gray-600">{part.sku}</td>
                                    <td className="td">
                                        {part.tier ? (
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${part.tier.toLowerCase() === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                                                part.tier.toLowerCase() === 'silver' ? 'bg-gray-200 text-gray-800' :
                                                    part.tier.toLowerCase() === 'bronze' ? 'bg-amber-100 text-amber-800' :
                                                        'bg-blue-100 text-blue-800'
                                                }`}>
                                                {part.tier}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="td text-right">{formatCurrency(part.price)}</td>
                                    <td className="td text-right">{formatCurrency(part.priceForConsumer || part.price)}</td>
                                    <td className="td text-right">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(part.stocksData?.Local || 0) <= 0 ? 'bg-red-100 text-red-800' :
                                            (part.stocksData?.Local || 0) < 5 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                            {part.stocksData?.Local || 0}
                                        </span>
                                    </td>
                                    <td className="td text-right space-x-2">
                                        {!part.isDeleted ? (
                                            <button
                                                onClick={() => handleDeletePart(part.id)}
                                                title="Delete Part"
                                                className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <RiDeleteBin6Line className="h-5 w-5" />
                                            </button>
                                        ) : (
                                            <span className="text-sm text-gray-400">Deleted</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Stats summary */}
            {!isLoading && !error && parts.length > 0 && (
                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Inventory Summary</dt>
                                        <dd className="flex flex-col space-y-1 mt-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-500">Total Parts:</span>
                                                <span className="font-semibold text-gray-900">{parts.length}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-500">Active Parts:</span>
                                                <span className="font-semibold text-gray-900">{parts.filter(p => !p.isDeleted).length}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-500">Total Quantity:</span>
                                                <span className="font-semibold text-gray-900">
                                                    {parts.reduce((sum, part) => sum + (part.stocksData?.Local || 0), 0)}
                                                </span>
                                            </div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Inventory Value</dt>
                                        <dd className="flex flex-col space-y-1 mt-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-500">Total Value:</span>
                                                <span className="font-semibold text-gray-900">
                                                    {formatCurrency(parts.reduce((sum, part) => sum + (part.price * (part.stocksData?.Local || 0)), 0))}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-500">Average Value/Part:</span>
                                                <span className="font-semibold text-gray-900">
                                                    {formatCurrency(
                                                        parts.filter(p => !p.isDeleted).length > 0
                                                            ? parts.reduce((sum, part) => !part.isDeleted ? sum + part.price : sum, 0) / parts.filter(p => !p.isDeleted).length
                                                            : 0
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-500">Customer Value:</span>
                                                <span className="font-semibold text-gray-900">
                                                    {formatCurrency(parts.reduce((sum, part) =>
                                                        sum + ((part.priceForConsumer || part.price) * (part.stocksData?.Local || 0)), 0))}
                                                </span>
                                            </div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Stock Status</dt>
                                        <dd className="flex flex-col space-y-1 mt-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-500">Out of Stock:</span>
                                                <span className="font-semibold text-gray-900">
                                                    {parts.filter(p => !p.isDeleted && (p.stocksData?.Local === undefined || p.stocksData?.Local <= 0)).length}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-500">Low Stock (&lt;5):</span>
                                                <span className="font-semibold text-gray-900">
                                                    {parts.filter(p => !p.isDeleted && p.stocksData?.Local !== undefined && p.stocksData?.Local > 0 && p.stocksData?.Local < 5).length}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-500">Sufficient Stock:</span>
                                                <span className="font-semibold text-gray-900">
                                                    {parts.filter(p => !p.isDeleted && p.stocksData?.Local !== undefined && p.stocksData?.Local >= 5).length}
                                                </span>
                                            </div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Improved Modals */}
            <PartAddDialog
                isOpen={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                onSave={handleSavePart}
            />
            <ConfirmDialog
                isOpen={isConfirmDeleteDialogOpen}
                onClose={() => setIsConfirmDeleteDialogOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Part Item"
                message={`Are you sure you want to delete this part: ${parts.find(p => p.id === selectedPartId)?.name ?? ''}? This action cannot be undone.`}
            />
        </div>
    );
};

// Helper CSS classes (add to your global CSS or Tailwind config)
/*
.input-field {
  @apply mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm;
}
.th {
  @apply px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider;
}
.td {
   @apply px-6 py-4 whitespace-nowrap text-sm text-gray-500;
}
.btn {
    @apply inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2;
}
.btn-primary {
    @apply text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 disabled:opacity-50;
}
.btn-danger {
     @apply text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 disabled:opacity-50;
}
.btn-ghost {
     @apply text-gray-700 bg-white hover:bg-gray-50 border-gray-300 focus:ring-indigo-500 disabled:opacity-50;
}
*/ 