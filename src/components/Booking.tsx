import { formatDate } from "../helpers/helpers";
import { useJobStore } from "../stores";
import { Booking as BookingObj } from "../interfaces/booking.interface.ts";
import { useMemo, useCallback, useState } from "react";
import { RiDeleteBin6Line } from "react-icons/ri";
import { ConfirmDialog } from "./ConfirmDialog";

export const Booking = ({ 
    item, 
    onEdit 
}: { 
    item: BookingObj;
    onEdit?: (booking: BookingObj) => void;
}) => {
    const deleteBooking = useJobStore(state => state.deleteBooking);
    const initiatePayment = useJobStore(state => state.initiatePayment);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const getKey = useCallback((prefix: string, id: string | number) => {
        return `${prefix}-${id}-${item.id}`;
    }, [item.id]);

    const jobs = useMemo(() => {
        // Check for potential job property variations to handle API inconsistencies
        const jobsArray = item.jobs || (item as any).jobItems || (item as any).selectedJobs || [];
        
        // Debug logging to help identify data structure issues
        if (process.env.NODE_ENV === 'development') {
            console.log('Booking Component - Jobs Debug:', {
                bookingId: item.id,
                hasJobs: !!item.jobs,
                hasJobItems: !!(item as any).jobItems,
                hasSelectedJobs: !!(item as any).selectedJobs,
                jobsLength: item.jobs?.length || 0,
                jobItemsLength: (item as any).jobItems?.length || 0,
                selectedJobsLength: (item as any).selectedJobs?.length || 0,
                jobsArrayUsed: jobsArray.length,
                hasJobsPrices: !!item.jobsPrices,
                jobsPricesKeys: Object.keys(item.jobsPrices || {}),
                itemKeys: Object.keys(item).filter(key => key.toLowerCase().includes('job'))
            });
        }
        
        return jobsArray.map((job: any) => ({
            ...job, 
            pricePerHour: item.jobsPrices?.[job.id]?.price || 0, 
            duration: item.jobsPrices?.[job.id]?.duration || job.duration || 0
        }));
    }, [item.jobs, item.jobsPrices]);
    
    const partItems = useMemo(() => {
        // Check for both 'partItems' and 'parts' properties to handle potential API variations
        const items = item.partItems || (item as any).parts || [];
        
        // Debug logging to help identify data structure issues
        if (process.env.NODE_ENV === 'development') {
            console.log('Booking Component - Part Items Debug:', {
                bookingId: item.id,
                hasPartItems: !!item.partItems,
                hasParts: !!(item as any).parts,
                partItemsLength: item.partItems?.length || 0,
                partsLength: (item as any).parts?.length || 0,
                itemsUsed: items.length,
                itemKeys: Object.keys(item).filter(key => key.toLowerCase().includes('part'))
            });
        }
        
        return items.map((partItem: any) => ({
            ...partItem, 
            price: item.partItemsPrices?.[partItem.id]?.price || 0
        }));
    }, [item.partItems, item.partItemsPrices]);

    const totalService = useMemo(() => {
        return parseFloat((jobs?.reduce((acc, job) => acc + (job.duration * job.pricePerHour / 60), 0) || 0).toFixed(2));
    }, [jobs]);
    
    const totalParts = useMemo(() => {
        // Calculate directly from partItemsPrices object
        const partsTotal = Object.values(item.partItemsPrices || {})
            .reduce((acc, priceObj) => acc + (priceObj?.price || 0), 0);
        return parseFloat(partsTotal.toFixed(2));
    }, [item.partItemsPrices]);

    // Calculate parts cost with 20% VAT
    const partsWithVAT = useMemo(() => {
        return parseFloat((totalParts * 1.2).toFixed(2));
    }, [totalParts]);

    const handleDeleteBooking = useCallback(() => {
        setShowDeleteConfirm(true);
    }, []);

    const handleConfirmDelete = useCallback(() => {
        deleteBooking(`${item.id}`);
        setShowDeleteConfirm(false);
    }, [deleteBooking, item.id]);

    const handleCancelDelete = useCallback(() => {
        setShowDeleteConfirm(false);
    }, []);

    const handleInitiatePayment = useCallback(() => {
        initiatePayment(`${item.id}`);
    }, [initiatePayment, item.id]);

    const handleEditBooking = useCallback(() => {
        if (onEdit) {
            onEdit(item);
        }
    }, [onEdit, item]);

    return (
        <div className="bg-indigo-100 shadow-lg p-5 rounded-xl w-96 relative">
            {/* Delete button */}
            {item.status !== 'paid' && (
                <div className="absolute left-2 top-2">
                    <button
                        onClick={handleDeleteBooking}
                        className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full transition-colors"
                        title="Delete Booking"
                    >
                        <RiDeleteBin6Line size={14} />
                    </button>
                </div>
            )}

            {/* Mechanic assignment badge */}
            {item.mechanic && (
                <div className="absolute right-2 top-2">
                    <span className="bg-red-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded">
                        Assigned
                    </span>
                </div>
            )}

            <div className="flex flex-col items-center gap-2">
                <h5 className="uppercase font-medium">{item.status}</h5>

                <div className="flex flex-col items-center">
                    <p className="text-gray-700 font-bold px-3 py-1.5 rounded-xl text-center">
                        Car: <span
                            className="font-normal capitalize text-gray-900">{item.car?.carNumber || 'Unknown'}</span>
                    </p>
                    <p className="text-gray-700 font-bold px-3 py-1.5 rounded-xl text-center">
                        Postal code: <span
                            className="font-normal capitalize text-gray-900">{item.location?.postalCode || 'Not set'}</span>
                    </p>

                    {/* Mechanic details section */}
                    {item.mechanic && (
                        <div className="w-full bg-blue-50 rounded-lg p-2 mb-2">
                            <p className="text-gray-700 font-bold text-center mb-1">Mechanic:</p>
                            <p className="text-sm">
                                <span className="font-medium">Name:</span> {item.mechanic.firstName || ''} {item.mechanic.lastName || ''}
                            </p>
                            <p className="text-sm">
                                <span className="font-medium">Email:</span> {item.mechanic.email}
                            </p>
                            {item.mechanic.phone && (
                                <p className="text-sm">
                                    <span className="font-medium">Phone:</span> {item.mechanic.phone}
                                </p>
                            )}
                        </div>
                    )}

                    <p className="text-gray-700 font-bold px-3 py-1.5 rounded-xl text-center">
                        Timeslots:</p>
                    {item.schedules?.map((timeslot, tIndex) => (
                        <div key={getKey('schedule', tIndex)} className="flex items-center gap-2">
                            <p>{timeslot.timeInterval}</p>
                            <div>
                                {timeslot.dates?.map((date, dIndex) => (
                                    <p key={getKey('date', `${tIndex}-${dIndex}`)}>{date}</p>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Jobs Section */}
                    <div className="w-full bg-blue-50 rounded-lg p-3 mt-2">
                        <p className="text-gray-700 font-bold text-center mb-2">Jobs:</p>
                        {jobs && jobs.length > 0 ? (
                            <div className="space-y-1">
                                {jobs.map((job, index) => (
                                    <div key={getKey('job', job.id || index)} 
                                         className="flex justify-between items-center bg-white rounded p-2 shadow-sm">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-800">{job.name}</p>
                                            {job.description && (
                                                <p className="text-xs text-gray-500">{job.description}</p>
                                            )}
                                            <p className="text-xs text-blue-600">{job.duration} minutes</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-green-600">£{(job.duration * job.pricePerHour / 60).toFixed(2)}</p>
                                            <p className="text-xs text-gray-500">£{job.pricePerHour}/hr</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="border-t border-blue-200 pt-2 mt-2">
                                    <div className="flex justify-between items-center font-medium text-sm">
                                        <span>Total Service:</span>
                                        <span className="text-green-600">£{totalService.toFixed(2)}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 text-right">
                                        {jobs.reduce((acc, job) => acc + job.duration, 0)} min total
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 text-sm">No jobs selected</p>
                        )}
                    </div>

                    {/* Part Items Section */}
                    <div className="w-full bg-orange-50 rounded-lg p-3 mt-2">
                        <p className="text-gray-700 font-bold text-center mb-2">Part Items:</p>
                        {partItems && partItems.length > 0 ? (
                            <div className="space-y-1">
                                {partItems.map((partItem, index) => (
                                    <div key={getKey('part', partItem.id || index)} 
                                         className="flex justify-between items-center bg-white rounded p-2 shadow-sm">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-800">{partItem.title}</p>
                                            {partItem.description && (
                                                <p className="text-xs text-gray-500">{partItem.description}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-green-600">£{partItem.price.toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="border-t border-orange-200 pt-2 mt-2">
                                    <div className="flex justify-between items-center font-medium text-sm">
                                        <span>Total Parts:</span>
                                        <span className="text-green-600">£{totalParts.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 text-sm">No parts selected</p>
                        )}
                    </div>

                    <p className="text-gray-700 font-bold px-3 py-1.5 rounded-xl text-center">
                        Total duration: <span
                            className="font-normal capitalize text-gray-900">{jobs?.reduce((acc, item) => acc + item.duration, 0)} min</span>
                    </p>

                    <p className="text-gray-700 font-bold px-3 py-1.5 rounded-xl text-center">
                        Service cost (incl. VAT): <span
                            className="font-normal capitalize text-gray-900">£{(totalService * 1.2).toFixed(2)}</span>
                    </p>
                    <p className="text-gray-700 font-bold px-3 py-1.5 rounded-xl text-center">
                        Item parts cost (incl. VAT): <span
                            className="font-normal capitalize text-gray-900">£{partsWithVAT.toFixed(2)}</span>
                    </p>

                    <p className="text-gray-700 font-bold px-3 py-1.5 rounded-xl text-center">
                        Total (incl. VAT): <span
                            className="font-normal capitalize text-gray-900">£{item.totalPrice}</span>
                    </p>
                </div>
                <p className="text-gray-700 font-bold px-3 py-1.5 rounded-xl text-center">
                    Added on: {formatDate(item.createdAt ? item.createdAt : "")}
                </p>
            </div>
            {item.status !== 'paid' && (
                <div className="w-full flex items-center justify-between gap-2 mt-3">
                    <button
                        onClick={handleEditBooking}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-xl py-2 px-4 transition-colors"
                        disabled={!onEdit}
                        title="Edit Booking">
                        Edit
                    </button>
                    <button
                        onClick={handleInitiatePayment}
                        className="bg-blue-600 text-white rounded-xl py-2 px-4">
                        Pay
                    </button>
                </div>
            )}

            {/* Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Delete Booking"
                message={`Are you sure you want to delete the booking for ${item.car?.carNumber || 'this vehicle'}? This action cannot be undone.`}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div>
    );
};
