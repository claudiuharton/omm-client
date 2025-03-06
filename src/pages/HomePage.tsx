import {useEffect, useState} from "react";
import {useAuthStore, useCarStore, useJobStore} from "../stores";
import {Car} from "../components/Car";
import {Loader} from "../components/Loader";
import {useNavigate} from "react-router-dom";
import JobsModal from "../components/JobsModal.tsx";
import {Booking} from "../components/Booking.tsx";
import { Booking as BookingObj } from "../interfaces/booking.interface.ts";

export const HomePage = () => {
    const getAllCars = useCarStore((state) => state.getAllCars);
    const cars = useCarStore((state) => state.cars);
    const bookings = useJobStore((state) => state.bookings);
    const [load, setLoad] = useState(false);
    const user = useAuthStore((state) => state.user);
    const navigate = useNavigate();
    useEffect(() => {
        if (!user?.zipCode) {
            navigate("/add-address");
        }
        useJobStore.getState().getAllJobs();
        useJobStore.getState().getBookings();

    }, [navigate, user]);

    useEffect(() => {

        const fetchAllItems = () => {
            setLoad(true);

            try {
                getAllCars();
            } catch (error) {
                console.log(error);
            } finally {
                setLoad(false);
            }
        };
        fetchAllItems();
    }, [getAllCars]);

    return (
        <>
            {load ? (
                <Loader/>
            ) : (
                <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 ">
                        {cars?.map((item) => (
                            <Car key={item.id} item={item}/>
                        ))}
                    </div>
                    <hr className="my-10"/>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 ">
                        {bookings?.map((item: BookingObj) => (
                            <Booking key={item.id} item={item}/>
                        ))}
                    </div>
                </div>

            )}
            <JobsModal/>
        </>
    );
};
