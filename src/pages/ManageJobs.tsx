import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { RiAddLine, RiCloseLine, RiSearchLine, RiDeleteBin6Line, RiEdit2Line, RiFilterLine, RiCheckboxCircleLine, RiCheckboxBlankCircleLine } from "react-icons/ri";
import { useAuthStore } from "../stores/auth/auth.store";
import { JobService } from "../services/job.service";
import { Job } from "../interfaces/job.interface";

// --- Empty State Component ---
const EmptyState = ({ onAddNew }: { onAddNew: () => void }) => (
    <div className="text-center py-12 bg-white rounded-lg shadow-sm">
        <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new job.</p>
        <div className="mt-6">
            <button
                type="button"
                onClick={onAddNew}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                <RiAddLine className="-ml-1 mr-2 h-5 w-5" />
                Add New Job
            </button>
        </div>
    </div>
);

// --- Error State Component ---
const ErrorDisplay = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
    <div className="rounded-md bg-red-50 p-4 mb-6">
        <div className="flex">
            <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                    />
                </svg>
            </div>
            <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading jobs</h3>
                <div className="mt-2 text-sm text-red-700">
                    <p>{message}</p>
                </div>
                <div className="mt-4">
                    <button
                        type="button"
                        onClick={onRetry}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        Retry
                    </button>
                </div>
            </div>
        </div>
    </div>
);

// --- Table Header Component for sortable columns ---
const TableHeader = ({ field, label, sortField, sortDirection, onSort }: {
    field: string;
    label: string;
    sortField: string | null;
    sortDirection: 'asc' | 'desc';
    onSort: (field: string) => void;
}) => (
    <th
        scope="col"
        className="th cursor-pointer hover:bg-gray-100"
        onClick={() => onSort(field)}
    >
        <div className="flex items-center">
            <span>{label}</span>
            {sortField === field ? (
                <span className="ml-2">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
            ) : null}
        </div>
    </th>
);

// --- Job Form Dialog Component ---
interface JobFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (job: Partial<Job>) => void;
    job?: Job;
}

const JobFormDialog = ({ isOpen, onClose, onSave, job }: JobFormDialogProps) => {
    const [formData, setFormData] = useState<Partial<Job>>({
        name: '',
        description: '',
        duration: 0, // Duration in minutes
        pricePerHour: 0,
    });

    useEffect(() => {
        if (job) {
            setFormData({
                name: job.name || '',
                description: job.description || '',
                duration: job.duration || 0, // Duration in minutes
                pricePerHour: job.pricePerHour || 0,
            });
        } else {
            setFormData({
                name: '',
                description: '',
                duration: 0, // Duration in minutes
                pricePerHour: 0,
            });
        }
    }, [job, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'duration' || name === 'pricePerHour' ? parseFloat(value) : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold">{job ? 'Edit Job' : 'Add New Job'}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                        <RiCloseLine className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-4">
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Job Name *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                                Duration (minutes) *
                            </label>
                            <input
                                type="number"
                                id="duration"
                                name="duration"
                                required
                                min="1"
                                step="1"
                                value={formData.duration}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="pricePerHour" className="block text-sm font-medium text-gray-700 mb-1">
                                Price Per Hour (£) *
                            </label>
                            <input
                                type="number"
                                id="pricePerHour"
                                name="pricePerHour"
                                required
                                min="0"
                                step="0.01"
                                value={formData.pricePerHour}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {job ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Confirm Dialog Component ---
interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message }: ConfirmDialogProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                    <p className="mt-2 text-sm text-gray-500">{message}</p>
                </div>
                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-2 rounded-b-lg">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---
export const ManageJobs = () => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState<Job | undefined>(undefined);
    const [filterText, setFilterText] = useState('');
    const [sortField, setSortField] = useState<string | null>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);

    const isMountedRef = useRef(true);
    const navigate = useNavigate();
    const { token } = useAuthStore();

    // Fetch data
    const fetchDataInternal = useCallback(async () => {
        if (!token) {
            setError("Authentication token not found.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await JobService.getAllJobs();
            if (isMountedRef.current) {
                if (response.success && response.responseObject) {
                    setJobs(response.responseObject);
                } else {
                    throw new Error(response.message || 'Failed to fetch jobs');
                }
            }
        } catch (err: unknown) {
            if (isMountedRef.current) {
                const message = err instanceof Error ? err.message : 'Failed to load job data.';
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

    // Handle job save/update
    const handleSaveJob = async (jobData: Partial<Job>) => {
        try {
            setIsLoading(true);

            // Here we would make an API call to save the job
            // For now, we'll simulate adding a new job with a fake ID
            if (selectedJob?.id) {
                // Update existing job
                const updatedJobs = jobs.map(job =>
                    job.id === selectedJob.id ? { ...job, ...jobData } : job
                );
                setJobs(updatedJobs);
                toast.success("Job updated successfully!");
            } else {
                // Add new job
                const newJob: Job = {
                    id: `temp-${Date.now()}`,
                    name: jobData.name || '',
                    description: jobData.description,
                    duration: jobData.duration || 0,
                    pricePerHour: jobData.pricePerHour || 0,
                    createdAt: new Date().toISOString(),
                };
                setJobs([...jobs, newJob]);
                toast.success("Job added successfully!");
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : `Failed to ${selectedJob ? 'update' : 'add'} job`;
            toast.error(message);
        } finally {
            setIsFormDialogOpen(false);
            setSelectedJob(undefined);
            setIsLoading(false);
        }
    };

    // Delete job
    const handleDeleteJob = (job: Job) => {
        setSelectedJob(job);
        setIsConfirmDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedJob) return;

        try {
            setIsLoading(true);

            // Here we would make an API call to delete the job
            // For now, we'll simulate removing the job from the array
            const filteredJobs = jobs.filter(job => job.id !== selectedJob.id);
            setJobs(filteredJobs);

            // Also remove from selected jobs if needed
            if (selectedJobIds.includes(selectedJob.id)) {
                setSelectedJobIds(selectedJobIds.filter(id => id !== selectedJob.id));
            }

            toast.success("Job deleted successfully!");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to delete job';
            toast.error(message);
        } finally {
            setIsConfirmDeleteDialogOpen(false);
            setSelectedJob(undefined);
            setIsLoading(false);
        }
    };

    // Handle edit job
    const handleEditJob = (job: Job) => {
        setSelectedJob(job);
        setIsFormDialogOpen(true);
    };

    // Handle job selection
    const toggleJobSelection = (jobId: string) => {
        setSelectedJobIds(prev =>
            prev.includes(jobId)
                ? prev.filter(id => id !== jobId)
                : [...prev, jobId]
        );
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

    // Format price as currency
    const formatCurrency = (amount?: number) => {
        if (amount === undefined) return '£0.00';
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
        }).format(amount);
    };

    // Calculate total price based on duration and hourly rate
    const calculateTotalPrice = (duration: number, pricePerHour: number) => {
        // Convert minutes to hours and multiply by hourly rate
        return (duration / 60) * pricePerHour;
    };

    // Format duration as hours and minutes
    const formatDuration = (minutes: number) => {
        if (minutes < 60) {
            return `${minutes} min`;
        } else {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            return remainingMinutes > 0
                ? `${hours} hr ${remainingMinutes} min`
                : `${hours} hr`;
        }
    };

    // Filter jobs based on search text
    const filteredJobs = jobs
        .filter(job => {
            // Filter by search text
            return !filterText ||
                job.name?.toLowerCase().includes(filterText.toLowerCase()) ||
                job.description?.toLowerCase().includes(filterText.toLowerCase());
        })
        .sort((a, b) => {
            if (!sortField) return 0;

            let aValue: any = a[sortField as keyof Job];
            let bValue: any = b[sortField as keyof Job];

            // Handle undefined values
            if (aValue === undefined) aValue = '';
            if (bValue === undefined) bValue = '';

            // Handle string comparison
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                const comparison = aValue.localeCompare(bValue);
                return sortDirection === 'asc' ? comparison : -comparison;
            }

            // Handle number comparison
            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

    // Get selected jobs
    const selectedJobs = jobs.filter(job => selectedJobIds.includes(job.id));

    // Calculate totals for selected jobs
    const totalMinutes = selectedJobs.reduce((sum, job) => sum + (job.duration || 0), 0);
    const totalPrice = selectedJobs.reduce((sum, job) =>
        sum + calculateTotalPrice(job.duration || 0, job.pricePerHour || 0), 0);

    return (
        <div className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="sm:flex sm:items-center mb-6">
                    <div className="sm:flex-auto">
                        <h1 className="text-2xl font-semibold text-gray-900">Manage Jobs</h1>
                        <p className="mt-2 text-sm text-gray-700">
                            View, add, edit, and delete jobs. Select jobs to see combined totals.
                        </p>
                    </div>
                    <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedJob(undefined);
                                setIsFormDialogOpen(true);
                            }}
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <RiAddLine className="-ml-1 mr-2 h-5 w-5" />
                            Add Job
                        </button>
                    </div>
                </div>

                {isLoading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                )}

                {error && <ErrorDisplay message={error} onRetry={fetchDataInternal} />}

                {!isLoading && !error && jobs.length === 0 && (
                    <EmptyState onAddNew={() => setIsFormDialogOpen(true)} />
                )}

                {!isLoading && !error && jobs.length > 0 && (
                    <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                            <div className="relative w-full md:w-80">
                                <input
                                    type="text"
                                    placeholder="Search jobs..."
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

                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">
                                    {selectedJobIds.length} job{selectedJobIds.length !== 1 ? 's' : ''} selected
                                </span>
                                {selectedJobIds.length > 0 && (
                                    <button
                                        onClick={() => setSelectedJobIds([])}
                                        className="text-sm text-indigo-600 hover:text-indigo-800"
                                    >
                                        Clear selection
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {!isLoading && !error && jobs.length > 0 && (
                    <div className="overflow-x-auto shadow border-b border-gray-200 sm:rounded-lg bg-white">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="th">
                                        Select
                                    </th>
                                    <TableHeader
                                        field="name"
                                        label="Name"
                                        sortField={sortField}
                                        sortDirection={sortDirection}
                                        onSort={handleSort}
                                    />
                                    <TableHeader
                                        field="duration"
                                        label="Duration"
                                        sortField={sortField}
                                        sortDirection={sortDirection}
                                        onSort={handleSort}
                                    />
                                    <TableHeader
                                        field="pricePerHour"
                                        label="Rate (hr)"
                                        sortField={sortField}
                                        sortDirection={sortDirection}
                                        onSort={handleSort}
                                    />
                                    <th scope="col" className="th">
                                        Total Price
                                    </th>
                                    <TableHeader
                                        field="createdAt"
                                        label="Created"
                                        sortField={sortField}
                                        sortDirection={sortDirection}
                                        onSort={handleSort}
                                    />
                                    <th scope="col" className="th text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredJobs.map((job) => (
                                    <tr key={job.id} className={`hover:bg-gray-50 ${selectedJobIds.includes(job.id) ? 'bg-indigo-50' : ''}`}>
                                        <td className="px-4 py-4 text-sm text-gray-500 text-center">
                                            <button
                                                onClick={() => toggleJobSelection(job.id)}
                                                className="text-gray-400 hover:text-indigo-600"
                                            >
                                                {selectedJobIds.includes(job.id) ? (
                                                    <RiCheckboxCircleLine className="h-6 w-6 text-indigo-600" />
                                                ) : (
                                                    <RiCheckboxBlankCircleLine className="h-6 w-6" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-900">
                                            <div className="font-medium">{job.name}</div>
                                            {job.description && (
                                                <div className="text-xs text-gray-500 mt-1 max-w-xs overflow-hidden text-ellipsis">
                                                    {job.description}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-500">
                                            {formatDuration(job.duration || 0)}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-500">
                                            {formatCurrency(job.pricePerHour)}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-500 font-medium">
                                            {formatCurrency(calculateTotalPrice(job.duration || 0, job.pricePerHour || 0))}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-500">
                                            {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-500 text-center">
                                            <div className="flex justify-center space-x-2">
                                                <button
                                                    onClick={() => handleEditJob(job)}
                                                    className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                                    title="Edit job"
                                                >
                                                    <RiEdit2Line className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteJob(job)}
                                                    className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                    title="Delete job"
                                                >
                                                    <RiDeleteBin6Line className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!isLoading && !error && jobs.length > 0 && filteredJobs.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                        <p className="text-gray-500">No jobs match your search criteria.</p>
                        <button
                            onClick={() => setFilterText('')}
                            className="mt-4 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Clear filters
                        </button>
                    </div>
                )}

                {/* Selected Jobs Summary */}
                {selectedJobIds.length > 0 && (
                    <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Selected Jobs Summary
                            </h3>
                        </div>
                        <div className="bg-gray-50 px-4 py-5 sm:p-6">
                            <div className="space-y-6">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Job
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Duration
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Rate (hr)
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Price
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {selectedJobs.map(job => (
                                                <tr key={job.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {job.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatDuration(job.duration || 0)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatCurrency(job.pricePerHour)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatCurrency(calculateTotalPrice(job.duration || 0, job.pricePerHour || 0))}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50">
                                            <tr>
                                                <th scope="row" colSpan={1} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Totals
                                                </th>
                                                <td className="px-6 py-3 text-left text-xs font-medium text-gray-900">
                                                    {formatDuration(totalMinutes)}
                                                </td>
                                                <td className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                                                </td>
                                                <td className="px-6 py-3 text-left text-xs font-medium text-gray-900">
                                                    {formatCurrency(totalPrice)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            // Here you could implement functionality to add these jobs to a booking, etc.
                                            toast.success(`Selected ${selectedJobIds.length} jobs with total: ${formatCurrency(totalPrice)}`);
                                        }}
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Use Selected Jobs
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Job statistics */}
                {!isLoading && !error && jobs.length > 0 && (
                    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Total Jobs</dt>
                                            <dd className="text-lg font-semibold text-gray-900">{jobs.length}</dd>
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
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Average Hourly Rate</dt>
                                            <dd className="text-lg font-semibold text-gray-900">
                                                {formatCurrency(
                                                    jobs.reduce((sum, job) => sum + (job.pricePerHour || 0), 0) / jobs.length
                                                )}
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
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Total Duration</dt>
                                            <dd className="text-lg font-semibold text-gray-900">
                                                {formatDuration(jobs.reduce((sum, job) => sum + (job.duration || 0), 0))}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Dialogs */}
                <JobFormDialog
                    isOpen={isFormDialogOpen}
                    onClose={() => {
                        setIsFormDialogOpen(false);
                        setSelectedJob(undefined);
                    }}
                    onSave={handleSaveJob}
                    job={selectedJob}
                />
                <ConfirmDialog
                    isOpen={isConfirmDeleteDialogOpen}
                    onClose={() => {
                        setIsConfirmDeleteDialogOpen(false);
                        setSelectedJob(undefined);
                    }}
                    onConfirm={handleConfirmDelete}
                    title="Delete Job"
                    message={`Are you sure you want to delete the job "${selectedJob?.name}"? This action cannot be undone.`}
                />
            </div>
        </div>
    );
}; 