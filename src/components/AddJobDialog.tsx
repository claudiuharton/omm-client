import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Car as CarObj } from "../interfaces/car.interface";
import { useJobStore } from '../stores';
import { Job } from '../interfaces/job.interface';
import { PartItem } from '../interfaces/partItem.interface';
import { Loader } from './Loader';
import { toast } from 'sonner';

interface AddJobDialogProps {
    car: CarObj;
    isOpen: boolean;
    onClose: () => void;
}

interface JobPrice {
    id: string;
    price: number;
    duration: number;
}

interface PartPrice {
    id: string;
    price: number;
}

export const AddJobDialog: React.FC<AddJobDialogProps> = ({ car, isOpen, onClose }) => {
    // State for dialog UI
    const [isLoadingJobs, setIsLoadingJobs] = useState(false);
    const [isLoadingParts, setIsLoadingParts] = useState(false);
    const [jobsError, setJobsError] = useState<string | null>(null);
    const [partsError, setPartsError] = useState<string | null>(null);
    const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
    const [selectedParts, setSelectedParts] = useState<string[]>([]);
    const [showPartsSection, setShowPartsSection] = useState(false);
    const [activeTab, setActiveTab] = useState<'jobs' | 'parts' | 'summary'>('jobs');

    // Store for price calculations
    const [jobsPrices, setJobsPrices] = useState<JobPrice[]>([]);
    const [partsPrices, setPartsPrices] = useState<PartPrice[]>([]);

    // Get state and actions from Zustand store
    const jobs = useJobStore(state => state.jobs);
    const partItems = useJobStore(state => state.partItems);
    const getAllJobsAction = useJobStore(state => state.getAllJobs);
    const getAllPartItems = useJobStore(state => state.getAllPartItems);
    const createBooking = useJobStore(state => state.createBooking);

    // Fetch jobs when dialog opens
    useEffect(() => {
        if (isOpen) {
            // Fetch only if jobs aren't loaded in the store yet
            if (jobs.length === 0) {
                console.log("Fetching available jobs...");
                setIsLoadingJobs(true);
                setJobsError(null);
                // Use the action directly from the store
                getAllJobsAction()
                    .catch((err) => {
                        console.error("Failed to fetch jobs:", err);
                        const errorMsg = err instanceof Error ? err.message : "Failed to load available jobs.";
                        setJobsError(errorMsg);
                        toast.error(errorMsg);
                    })
                    .finally(() => {
                        setIsLoadingJobs(false);
                    });
            } else {
                setIsLoadingJobs(false);
            }
        } else {
            setSelectedJobs([]);
            setSelectedParts([]);
            setJobsPrices([]);
            setPartsPrices([]);
            setJobsError(null);
            setPartsError(null);
            setIsLoadingJobs(false);
            setIsLoadingParts(false);
            setShowPartsSection(false);
            setActiveTab('jobs');
        }
    }, [isOpen, getAllJobsAction, jobs.length]);

    // Fetch part items when jobs are selected
    useEffect(() => {
        if (selectedJobs.length > 0 && partItems.length === 0) {
            setIsLoadingParts(true);
            setPartsError(null);
            setShowPartsSection(true);

            getAllPartItems()
                .catch((err) => {
                    console.error("Failed to fetch part items:", err);
                    const errorMsg = err instanceof Error ? err.message : "Failed to load part items.";
                    setPartsError(errorMsg);
                    toast.error(errorMsg);
                })
                .finally(() => {
                    setIsLoadingParts(false);
                });
        } else if (selectedJobs.length > 0) {
            setShowPartsSection(true);
        } else {
            setShowPartsSection(false);
            setSelectedParts([]);
        }
    }, [selectedJobs, getAllPartItems, partItems.length]);

    // Update jobsPrices when jobs are selected/deselected
    useEffect(() => {
        // Add default prices for newly selected jobs
        const updatedPrices = [...jobsPrices];

        // Add new selections
        selectedJobs.forEach(jobId => {
            if (!updatedPrices.some(jp => jp.id === jobId)) {
                const job = jobs.find(j => j.id === jobId);
                if (job) {
                    const hourlyRate = job.pricePerHour || 50; // Default hourly rate if not specified
                    const duration = job.duration || 60; // Default duration in minutes
                    updatedPrices.push({
                        id: jobId,
                        price: parseFloat(((hourlyRate / 60) * duration).toFixed(2)),
                        duration
                    });
                }
            }
        });

        // Remove deselected jobs
        const filteredPrices = updatedPrices.filter(jp => selectedJobs.includes(jp.id));

        setJobsPrices(filteredPrices);
    }, [selectedJobs, jobs]);

    // Update partsPrices when parts are selected/deselected
    useEffect(() => {
        // Add default prices for newly selected parts
        const updatedPrices = [...partsPrices];

        // Add new selections
        selectedParts.forEach(partId => {
            if (!updatedPrices.some(pp => pp.id === partId)) {
                const part = partItems.find(p => p.id === partId);
                if (part) {
                    updatedPrices.push({
                        id: partId,
                        price: parseFloat(part.priceForConsumer.toFixed(2))
                    });
                }
            }
        });

        // Remove deselected parts
        const filteredPrices = updatedPrices.filter(pp => selectedParts.includes(pp.id));

        setPartsPrices(filteredPrices);
    }, [selectedParts, partItems]);

    const handleJobSelectionChange = (jobId: string) => {
        setSelectedJobs(prevSelected =>
            prevSelected.includes(jobId)
                ? prevSelected.filter(id => id !== jobId)
                : [...prevSelected, jobId]
        );
    };

    const handlePartSelectionChange = (partId: string) => {
        setSelectedParts(prevSelected =>
            prevSelected.includes(partId)
                ? prevSelected.filter(id => id !== partId)
                : [...prevSelected, partId]
        );
    };

    const handleSubmitJobs = useCallback(() => {
        if (selectedJobs.length === 0) {
            toast.error("Please select at least one job.");
            return;
        }

        const selectedJobObjects = jobs.filter(job => selectedJobs.includes(job.id));
        const selectedPartObjects = partItems.filter(part => selectedParts.includes(part.id));

        // Format job prices in required format
        const formattedJobPrices = jobsPrices.map(jp => ({
            id: jp.id,
            price: jp.price,
            duration: jp.duration
        }));

        // Format part prices in required format
        const formattedPartPrices: Record<string, { price: number }> = {};
        partsPrices.forEach(pp => {
            formattedPartPrices[pp.id] = { price: pp.price };
        });

        // Calculate total price
        const totalPrice = [...jobsPrices, ...partsPrices].reduce((sum, item) => sum + item.price, 0);

        console.log("Submitting booking:", {
            car,
            jobs: selectedJobObjects,
            parts: selectedPartObjects,
            jobsPrices: formattedJobPrices,
            partItemsPrices: formattedPartPrices,
            totalPrice
        });

        // Create booking (placeholder for now)
        toast.success(`Booking created for ${car.make} ${car.model} with ${selectedJobs.length} jobs`);
        onClose();
    }, [selectedJobs, selectedParts, jobsPrices, partsPrices, jobs, partItems, car, onClose]);

    // Calculate total price based on selected jobs and parts
    const totalEstimatedPrice = useMemo(() => {
        const jobsTotal = jobsPrices.reduce((sum, jp) => sum + jp.price, 0);
        const partsTotal = partsPrices.reduce((sum, pp) => sum + pp.price, 0);
        return parseFloat((jobsTotal + partsTotal).toFixed(2));
    }, [jobsPrices, partsPrices]);

    // Helper function to determine quality icon
    const getQualityIcon = (quality?: string): string => {
        switch (quality?.toLowerCase()) {
            case 'gold': return '🥇';
            case 'silver': return '🥈';
            case 'bronze': return '🥉';
            default: return '⚫'; // Default/Unknown icon
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
            <div className="relative mx-auto p-5 border w-full max-w-xl shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 text-center">
                        Add Job for {car.make} {car.model} ({car.carNumber})
                    </h3>

                    {/* Tab Navigation */}
                    <div className="flex border-b mt-4">
                        <button
                            className={`px-4 py-2 ${activeTab === 'jobs' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}
                            onClick={() => setActiveTab('jobs')}
                        >
                            Select Jobs
                        </button>
                        <button
                            className={`px-4 py-2 ${activeTab === 'parts' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'} ${selectedJobs.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => {
                                if (selectedJobs.length > 0) setActiveTab('parts');
                                else toast.info('Please select at least one job first');
                            }}
                        >
                            Select Parts
                        </button>
                        <button
                            className={`px-4 py-2 ${activeTab === 'summary' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}
                            onClick={() => setActiveTab('summary')}
                        >
                            Cost Summary
                        </button>
                    </div>

                    <div className="px-3 py-4">
                        {/* Jobs Tab */}
                        {activeTab === 'jobs' && (
                            <div>
                                <p className="text-sm text-gray-500 mb-3">
                                    Select the jobs you want to add for this car.
                                </p>

                                <div className="mt-2 h-64 overflow-y-auto border rounded-md p-3 text-left space-y-2">
                                    {isLoadingJobs ? (
                                        <div className="flex justify-center items-center h-full">
                                            <Loader />
                                        </div>
                                    ) : jobsError ? (
                                        <p className="text-red-600 text-center">Error: {jobsError}</p>
                                    ) : jobs.length > 0 ? (
                                        jobs.map((job) => (
                                            <div key={job.id} className="flex items-center border-b pb-2">
                                                <input
                                                    type="checkbox"
                                                    id={`job-${job.id}`}
                                                    checked={selectedJobs.includes(job.id)}
                                                    onChange={() => handleJobSelectionChange(job.id)}
                                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3 flex-shrink-0"
                                                />
                                                <label
                                                    htmlFor={`job-${job.id}`}
                                                    className="flex flex-grow items-center justify-between py-2 text-sm cursor-pointer"
                                                >
                                                    {/* Name & Icon */}
                                                    <div className="flex items-center flex-1">
                                                        <span className="mr-2 text-lg">{getQualityIcon(job.quality)}</span>
                                                        <span className="text-gray-800 font-medium">{job.name}</span>
                                                    </div>
                                                    {/* Duration & Price Container - Takes only needed space, aligned right */}
                                                    <div className="flex items-center justify-end space-x-3 text-gray-600">
                                                        <span>{job.duration} min</span>
                                                        <span>£{job.pricePerHour}/hr</span>
                                                    </div>
                                                </label>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-center">No available jobs found.</p>
                                    )}
                                </div>

                                <div className="mt-4 flex justify-between items-center">
                                    <span className="text-sm text-gray-500">
                                        {selectedJobs.length} job{selectedJobs.length !== 1 ? 's' : ''} selected
                                    </span>
                                    <button
                                        onClick={() => {
                                            if (selectedJobs.length > 0) setActiveTab('parts');
                                            else toast.info('Please select at least one job first');
                                        }}
                                        className={`px-4 py-2 bg-indigo-600 text-white rounded-md ${selectedJobs.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
                                    >
                                        Next: Select Parts
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Parts Tab */}
                        {activeTab === 'parts' && (
                            <div>
                                <p className="text-sm text-gray-500 mb-3">
                                    Select parts you need for the selected jobs (optional).
                                </p>

                                <div className="mt-2 h-64 overflow-y-auto border rounded-md p-3 text-left space-y-2">
                                    {isLoadingParts ? (
                                        <div className="flex justify-center items-center h-full">
                                            <Loader />
                                        </div>
                                    ) : partsError ? (
                                        <p className="text-red-600 text-center">Error: {partsError}</p>
                                    ) : partItems.length > 0 ? (
                                        partItems
                                            .filter(part => part.stockSummary === "In stock.")
                                            .map((part) => (
                                                <div key={part.id} className="flex items-center border-b pb-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`part-${part.id}`}
                                                        checked={selectedParts.includes(part.id)}
                                                        onChange={() => handlePartSelectionChange(part.id)}
                                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3 flex-shrink-0"
                                                    />
                                                    <label
                                                        htmlFor={`part-${part.id}`}
                                                        className="flex flex-grow items-center justify-between py-2 text-sm cursor-pointer"
                                                    >
                                                        {/* Name & Icon */}
                                                        <div className="flex items-center flex-1">
                                                            <span className="mr-2 text-lg">{getQualityIcon(part.tier)}</span>
                                                            <span className="text-gray-800 font-medium">{part.title}</span>
                                                        </div>
                                                        {/* Price */}
                                                        <div className="flex items-center justify-end text-gray-600">
                                                            <span>£{part.priceForConsumer.toFixed(2)}</span>
                                                        </div>
                                                    </label>
                                                </div>
                                            ))
                                    ) : (
                                        <p className="text-gray-500 text-center">No parts available.</p>
                                    )}
                                </div>

                                <div className="mt-4 flex justify-between items-center">
                                    <button
                                        onClick={() => setActiveTab('jobs')}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                                    >
                                        Back to Jobs
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('summary')}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                    >
                                        View Cost Summary
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Summary Tab */}
                        {activeTab === 'summary' && (
                            <div>
                                <p className="text-sm text-gray-500 mb-3">
                                    Review your selections and adjust pricing if needed.
                                </p>

                                {/* Jobs Summary */}
                                <div className="mb-5">
                                    <h4 className="font-medium text-gray-700 mb-2">Selected Jobs</h4>
                                    {selectedJobs.length > 0 ? (
                                        <div className="space-y-3">
                                            {selectedJobs.map(jobId => {
                                                const job = jobs.find(j => j.id === jobId);
                                                const price = jobsPrices.find(jp => jp.id === jobId)?.price || 0;

                                                if (!job) return null;

                                                return (
                                                    <div key={job.id} className="bg-gray-50 p-3 rounded flex flex-col">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <div className="font-medium text-gray-800">{job.name}</div>
                                                            <div className="text-sm text-gray-500">{job.duration} min</div>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <label className="text-sm text-gray-600 mr-2">Price:</label>
                                                            <div className="relative flex items-center">
                                                                <span className="absolute left-3 text-gray-500">£</span>
                                                                <input
                                                                    type="number"
                                                                    value={price}
                                                                    onChange={(e) => handleUpdateJobPrice(job.id, parseFloat(e.target.value) || 0)}
                                                                    className="w-24 pl-7 pr-2 py-1 border rounded text-right"
                                                                    min="0"
                                                                    step="0.01"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-center">No jobs selected.</p>
                                    )}
                                </div>

                                {/* Parts Summary */}
                                {selectedParts.length > 0 && (
                                    <div className="mb-5">
                                        <h4 className="font-medium text-gray-700 mb-2">Selected Parts</h4>
                                        <div className="space-y-3">
                                            {selectedParts.map(partId => {
                                                const part = partItems.find(p => p.id === partId);
                                                const price = partsPrices.find(pp => pp.id === partId)?.price || 0;

                                                if (!part) return null;

                                                return (
                                                    <div key={part.id} className="bg-gray-50 p-3 rounded flex flex-col">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <div className="font-medium text-gray-800">{part.title}</div>
                                                            <div className="text-sm text-gray-500">{part.tier || 'Standard'}</div>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <label className="text-sm text-gray-600 mr-2">Price:</label>
                                                            <div className="relative flex items-center">
                                                                <span className="absolute left-3 text-gray-500">£</span>
                                                                <input
                                                                    type="number"
                                                                    value={price}
                                                                    onChange={(e) => handleUpdatePartPrice(part.id, parseFloat(e.target.value) || 0)}
                                                                    className="w-24 pl-7 pr-2 py-1 border rounded text-right"
                                                                    min="0"
                                                                    step="0.01"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Total Cost */}
                                <div className="bg-indigo-50 p-4 rounded-lg mb-5">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold">Jobs Subtotal:</span>
                                        <span className="font-bold">£{jobsPrices.reduce((sum, jp) => sum + jp.price, 0).toFixed(2)}</span>
                                    </div>
                                    {selectedParts.length > 0 && (
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="font-semibold">Parts Subtotal:</span>
                                            <span className="font-bold">£{partsPrices.reduce((sum, pp) => sum + pp.price, 0).toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center mt-3 text-lg border-t border-indigo-200 pt-2">
                                        <span className="font-semibold">Total Price:</span>
                                        <span className="font-bold">£{totalEstimatedPrice.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <button
                                        onClick={() => {
                                            if (selectedParts.length > 0) setActiveTab('parts');
                                            else setActiveTab('jobs');
                                        }}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleSubmitJobs}
                                        className={`px-4 py-2 bg-indigo-600 text-white rounded-md ${selectedJobs.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
                                        disabled={selectedJobs.length === 0}
                                    >
                                        Confirm Booking
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer with close button */}
                <div className="mt-5 text-center">
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}; 