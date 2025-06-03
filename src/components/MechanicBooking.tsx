import { useState } from "react";
import { formatDate } from "../helpers/helpers";
import { useJobStore } from "../stores";
import { Booking as BookingObj } from "../interfaces/booking.interface.ts";
import { useMemo, useCallback } from "react";
import { useAuthStore } from "../stores";
import { RiEditLine } from "react-icons/ri";

export const MechanicBooking = ({ 
    item, 
    onEdit 
}: { 
    item: BookingObj;
    onEdit?: (booking: BookingObj) => void;
}) => {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [action, setAction] = useState<'assign' | 'unassign' | null>(null);

    const toggleMechanicAssignment = useJobStore(state => state.toggleMechanicAssignment);
    const user = useAuthStore(state => state.user);

    const getKey = useCallback((prefix: string, id: string | number) => {
        return `${prefix}-${id}-${item.id}`;
    }, [item.id]);

    // Check if the current user is assigned to this booking
    const isAssignedToMe = useMemo(() => {
        return item.mechanic?.id === user?.id;
    }, [item.mechanic, user?.id]);

    const jobs = useMemo(() => {
        return item.jobs?.map(job => ({
            ...job, 
            pricePerHour: item.jobsPrices?.[job.id]?.price || 0, 
            duration: item.jobsPrices?.[job.id]?.duration || job.duration || 0
        }));
    }, [item.jobs, item.jobsPrices]);

    const partItems = useMemo(() => {
        return item.partItems?.map(partItem => ({
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

    const handleAssignment = useCallback(async (assign: boolean) => {
        setAction(assign ? 'assign' : 'unassign');
        setConfirmOpen(true);
    }, []);

    const handleEditBooking = useCallback(() => {
        if (onEdit) {
            onEdit(item);
        }
    }, [onEdit, item]);

    const confirmAssignment = useCallback(async () => {
        if (!action) return;

        setIsLoading(true);
        try {
            await toggleMechanicAssignment(item.id.toString(), action === 'assign');
            setConfirmOpen(false);
        } catch (error) {
            console.error("Error assigning/unassigning mechanic:", error);
        } finally {
            setIsLoading(false);
            setAction(null);
        }
    }, [action, item.id, toggleMechanicAssignment]);

    const cancelAssignment = useCallback(() => {
        setConfirmOpen(false);
        setAction(null);
    }, []);

    // Background color based on assignment status
    const bgColor = isAssignedToMe
        ? "bg-green-100"
        : item.mechanic
            ? "bg-red-50"
            : "bg-indigo-100";

    return (
        <div className={`${bgColor} shadow-lg p-5 rounded-xl w-72 relative`}>
            {/* Assignment status badge */}
            <div className="absolute right-2 top-2">
                {isAssignedToMe ? (
                    <span className="bg-green-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded">
                        Assigned to you
                    </span>
                ) : item.mechanic ? (
                    <span className="bg-red-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded">
                        Taken
                    </span>
                ) : (
                    <span className="bg-blue-500 text-white text-xs font-semibold px-2.5 py-0.5 rounded">
                        Available
                    </span>
                )}
            </div>

            {/* Edit button - only show for assigned bookings that are not paid */}
            {onEdit && isAssignedToMe && item.status !== 'paid' && (
                <div className="absolute left-2 top-2">
                    <button
                        onClick={handleEditBooking}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded-full transition-colors"
                        title="Edit Booking"
                    >
                        <RiEditLine size={14} />
                    </button>
                </div>
            )}

            <div className="flex flex-col items-center gap-2">
                <h5 className="uppercase font-medium">{item.status}</h5>

                <div className="flex flex-col items-center">
                    <p className="text-gray-700 font-bold px-3 py-1.5 rounded-xl text-center">
                        Car: <span
                            className="font-normal capitalize text-gray-900">{item.car.carNumber}</span>
                    </p>
                    <p className="text-gray-700 font-bold px-3 py-1.5 rounded-xl text-center">
                        Postal code: <span
                            className="font-normal capitalize text-gray-900">{item.location.postalCode}</span>
                    </p>
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

                    <p className="text-gray-700 font-bold px-3 py-1.5 rounded-xl text-center">
                        Jobs:
                    </p>
                    {jobs?.map((job, index) => (
                        <div key={getKey('job', job.id || index)} className="flex items-center gap-2">
                            <p>{job.name}</p>
                            <p>{job.duration} min</p>
                        </div>
                    ))}
                    <p className="text-gray-700 font-bold px-3 py-1.5 rounded-xl text-center">
                        Part items:
                    </p>
                    {partItems?.map((partItem, index) => (
                        <div key={getKey('part', partItem.id || index)} className="flex items-center gap-2">
                            <p>{partItem.title}</p>
                            <p>£{partItem.price}</p>
                        </div>
                    ))}

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
                            className="font-normal capitalize text-gray-900">£{item.totalPrice.toFixed(2)}</span>
                    </p>
                </div>
                <p className="text-gray-700 font-bold px-3 py-1.5 rounded-xl text-center">
                    Added on: {formatDate(item.createdAt ? item.createdAt : "")}
                </p>
            </div>

            {/* Assignment action buttons */}
            <div className="w-full flex items-center justify-between gap-2 mt-3">
                {isAssignedToMe ? (
                    <button
                        onClick={() => handleAssignment(false)}
                        className="w-full bg-red-600 text-white rounded-xl py-2 px-4"
                        disabled={isLoading || confirmOpen}
                    >
                        Unassign from this job
                    </button>
                ) : item.mechanic ? (
                    <div className="w-full flex flex-col gap-2">
                        <button
                            onClick={() => handleAssignment(false)}
                            className="w-full bg-red-600 text-white rounded-xl py-2 px-4"
                            disabled={isLoading || confirmOpen}
                        >
                            Unassign mechanic
                        </button>
                        <button
                            onClick={() => handleAssignment(true)}
                            className="w-full bg-green-600 text-white rounded-xl py-2 px-4"
                            disabled={isLoading || confirmOpen}
                        >
                            Take this job
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => handleAssignment(true)}
                        className="w-full bg-green-600 text-white rounded-xl py-2 px-4"
                        disabled={isLoading || confirmOpen}
                    >
                        Take this job
                    </button>
                )}
            </div>

            {/* Confirmation dialog */}
            {confirmOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                        <h3 className="text-lg font-bold mb-4">
                            {action === 'assign' ? 'Take this job?' : isAssignedToMe ? 'Unassign from this job?' : 'Unassign current mechanic?'}
                        </h3>
                        <p className="mb-6">
                            {action === 'assign'
                                ? 'Are you sure you want to take this job? You will be responsible for completing this service request.'
                                : isAssignedToMe
                                    ? 'Are you sure you want to unassign yourself from this job? You will no longer be responsible for this service request.'
                                    : 'Are you sure you want to unassign the current mechanic from this job? This will make the job available for other mechanics.'}
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={cancelAssignment}
                                className="px-4 py-2 border rounded-md hover:bg-gray-100"
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAssignment}
                                className={`px-4 py-2 text-white rounded-md ${action === 'assign' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                    }`}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Processing...' : action === 'assign' ? 'Confirm' : 'Unassign'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}; 