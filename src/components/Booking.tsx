import { formatDate } from "../helpers/helpers";
import { useJobStore } from "../stores";
import { Booking as BookingObj } from "../interfaces/booking.interface.ts";
import { useMemo, useCallback } from "react";

export const Booking = ({ item }: { item: BookingObj }) => {
    const deleteBooking = useJobStore(state => state.deleteBooking);
    const initiatePayment = useJobStore(state => state.initiatePayment);

    const getKey = useCallback((prefix: string, id: string | number) => {
        return `${prefix}-${id}-${item.id}`;
    }, [item.id]);

    const jobs = useMemo(() => {
        return item.jobs?.map(job => ({
            ...job, pricePerHour: item.jobsPrices[job.id].price, duration: item.jobsPrices[job.id].duration
        }));
    }, [item.jobs, item.jobsPrices]);
    const partItems = useMemo(() => {
        return item.partItems?.map(partItem => ({
            ...partItem, price: item.partItemsPrices[partItem.id].price
        }));
    }, [item.partItems, item.partItemsPrices]);

    const totalService = useMemo(() => {
        return parseFloat((jobs?.reduce((acc, job) => acc + (job.duration * job.pricePerHour / 60), 0) || 0).toFixed(2));
    }, [jobs]);
    const totalParts = useMemo(() => {
        return parseFloat((partItems?.reduce((acc, partItem) => acc + partItem.price, 0) || 0).toFixed(2));
    }, [partItems]);

    const handleDeleteBooking = useCallback(() => {
        deleteBooking(`${item.id}`);
    }, [deleteBooking, item.id]);

    const handleInitiatePayment = useCallback(() => {
        initiatePayment(`${item.id}`);
    }, [initiatePayment, item.id]);

    return (
        <div className="bg-indigo-100 shadow-lg p-5 rounded-xl w-72 relative">
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
                            className="font-normal capitalize text-gray-900">{item.car.carNumber}</span>
                    </p>
                    <p className="text-gray-700 font-bold px-3 py-1.5 rounded-xl text-center">
                        Postal code: <span
                            className="font-normal capitalize text-gray-900">{item.location.postalCode}</span>
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
                            className="font-normal capitalize text-gray-900">£{(totalParts * 1.2).toFixed(2)}</span>
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
                        onClick={handleDeleteBooking}
                        className="bg-red-600 text-white rounded-xl py-2 px-4">
                        Remove
                    </button>
                    <button
                        onClick={handleInitiatePayment}
                        className="bg-blue-600 text-white rounded-xl py-2 px-4">
                        Pay
                    </button>
                </div>
            )}
        </div>
    );
};
