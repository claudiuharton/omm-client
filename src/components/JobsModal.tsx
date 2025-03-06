import React, {useMemo} from 'react';
import Modal from "./Modal.tsx";
import {useAuthStore, useCarStore, useJobStore} from "../stores";
import {Job} from "../interfaces/job.interface.ts";
import {toast} from "sonner";
import {PartItem} from "../interfaces/partItem.interface.ts";
import {allowedPostCodeRegex, zipCodeRegex} from "../helpers/helpers.ts";


const JobsModal: React.FC = () => {
        const selectCar = useJobStore((state) => state.selectCar);
        const closeModal = () => selectCar(null);
        const user = useAuthStore((state) => state.user);

        const jobs = useJobStore((state) => state.jobs);
        const addBooking = useJobStore((state) => state.addBooking);
        const selectedCar = useJobStore((state) => state.selectedCar);
        const getPartItems = useJobStore((state) => state.getPartItems);
        const cleanPartItems = useJobStore((state) => state.cleanPartItems);
        const partItems = useJobStore((state) => state.partItems);
        const cars = useCarStore((state) => state.cars);

        const [loadingPartItems, setLoadingPartItems] = React.useState(false);

        const [timeSlots, setTimeSlots] = React.useState([] as { time: string, date: string }[]);
        const [startedScheduling, setStartedScheduling] = React.useState(false);

        const [currentTime, setCurrentTime] = React.useState("12:00");
        const [currentDate, setCurrentDate] = React.useState("2025-12-12");


        const [alowPostalCodeChange, setAllowPostalCodeChange] = React.useState(false);
        const [postalCode, setPostalCode] = React.useState(user?.zipCode);

        const search = async () => {
            const vin = cars.find((car) => car.id === selectedCar)?.vin;
            if (vin) {
                try {
                    cleanPartItems();
                    setSelectedPartItems([]);
                    setLoadingPartItems(true);
                    await Promise.all(selectedJobs.map(job => getPartItems(vin, job.searchQuery)));

                    setLoadingPartItems(false);
                } catch (error) {
                    setLoadingPartItems(false);
                    toast.error("Error searching for parts");
                }
            }
        };

        const schedule = async () => {
            setStartedScheduling(true);

        }


        const [selectedJobs, setSelectedJobs] = React.useState([] as Job[]);
        const [selectedPartItems, setSelectedPartItems] = React.useState([] as PartItem[]);

        const totalTime = useMemo(() => {
            return selectedJobs?.reduce((acc, job) => acc + job.duration, 0)
        }, [selectedJobs]); // Dependencies

        const totalMoneyForTime = useMemo(() => {
            return (totalTime / 60 * 55).toFixed(2)
        }, [totalTime]); // Dependencies


        const totalMoneyForPartItems = useMemo(() => {
            return selectedPartItems?.reduce((sum, item) => sum + item.price, 0).toFixed(2)
        }, [selectedPartItems]); // Dependencies

        const totalWithoutVAT = useMemo(() => {
            return (parseFloat(totalMoneyForTime) + parseFloat(totalMoneyForPartItems)).toFixed(2)
        }, [totalMoneyForTime, totalMoneyForPartItems]); // Dependencie

        const totalVAT = useMemo(() => {
            return ((parseFloat(totalMoneyForTime) + parseFloat(totalMoneyForPartItems)) * 0.2).toFixed(2)
        }, [totalMoneyForTime, totalMoneyForPartItems]); // Dependencies

        const totalWithVAT = useMemo(() => {
            return (parseFloat(totalWithoutVAT) + parseFloat(totalVAT)).toFixed(2)
        }, [totalWithoutVAT, totalVAT]); // Dependencies

        const finalize = () => {
            addBooking({
                timeSlots,
                jobs: selectedJobs.map(item => ({
                    id: item.id,
                    price: item.pricePerHour,
                    duration: item.duration
                })),
                partItems: selectedPartItems.map(item => ({id: item.id, price: item.price})),
                postalCode,
                selectedCar
            });

        }

        const handleUseAddress = async (zipCode: string) => {
            if ([zipCode].includes(""))
                return toast.error("Zip code cannot be empty");
            else if (!zipCodeRegex.test(zipCode)) {
                return toast.error("Invalid ZIP Code");
            } else if (!allowedPostCodeRegex.test(zipCode)) {
                return toast.error("The service supports only Birmingham, Coventry, Leicester, Dudley, Wolverhampton and Walsall.");
            }
            try {
                setPostalCode(zipCode)
            } catch (error) {
                console.log(error);
            }
        };


        return (
            <Modal isOpen={!!selectedCar} onClose={closeModal}>
                <h2>Select the jobs</h2>
                <hr className="m-2"/>
                {jobs?.map((job, index) => <div key={index} className="flex justify-between"><input type="checkbox"
                                                                                                   checked={selectedJobs.includes(job)}
                                                                                                   onChange={() => {

                                                                                                       if (selectedJobs.includes(job)) {
                                                                                                           // Remove the job if it is already selected
                                                                                                           setSelectedJobs(selectedJobs.filter((selectedJob) => selectedJob !== job));
                                                                                                       } else {
                                                                                                           // Add the job if it is not already selected
                                                                                                           setSelectedJobs([...selectedJobs, job])
                                                                                                       }
                                                                                                   }}/>
                    <p className="ml-2">{job.name}</p>
                    <p className="ml-auto text-left"> {job.duration} minutes</p></div>)}
                <hr className="m-2"/>
                <div className="flex justify-between font-bold	"><p>Total time:</p>
                    <p>{totalTime} minutes</p></div>
                <div className="flex justify-between font-bold	"><p>£55/h</p>
                    <p>£{totalMoneyForTime} </p></div>
                <hr className="m-2"/>
                <button
                    className={`bottom-5 ${selectedJobs.length === 0 ? 'bg-indigo-200' : 'bg-indigo-600'} text-white rounded-xl py-2 px-4`}
                    disabled={selectedJobs.length === 0}
                    onClick={search}>Search {partItems.length > 0 ? 'again' : ''} for
                    parts
                </button>
                {loadingPartItems && <p>Loading parts...</p>}
                {partItems.length > 0 && <div>
                    <h2>Part Items:</h2>
                    <hr className="m-2"/>
                    <div>
                        {partItems.map((part, index) => <div key={index} className="flex justify-between">
                            <input type="checkbox"
                                   checked={selectedPartItems.includes(part)}
                                   onChange={() => {
                                       const samePart = selectedPartItems.find((selectedPart) => selectedPart.top[0] === part.top[0] && selectedPart.category === part.category);
                                       if (selectedPartItems.includes(part)) {
                                           // Remove the job if it is already selected
                                           setSelectedPartItems(selectedPartItems.filter((selectedPart) => selectedPart !== part));
                                       } else if (samePart) {
                                           // Add the job if it is not already selected
                                           setSelectedPartItems([...selectedPartItems.filter((selectedPart) => selectedPart !== samePart), part])
                                       } else {
                                           // Add the job if it is not already selected
                                           setSelectedPartItems([...selectedPartItems, part])
                                       }
                                   }}/>                        <p className="ml-2">{part.top[0]}</p>

                            <p className="ml-2">{part.title}</p>
                            <p className="ml-auto">£{part.price}</p>
                        </div>)}
                        <div className="flex justify-between font-bold">
                            <p>Total part items:</p><p className="right">
                            £{totalMoneyForPartItems} </p></div>
                    </div>
                    <hr/>
                    <div className="flex justify-between font-bold">
                        <p>Total:</p>
                        <p> £{totalWithoutVAT}</p>
                        <p>+</p>
                        <p>(VAT) £{totalVAT}</p>
                        <p>=</p>
                        <p> £{totalWithVAT}</p>
                    </div>
                    {!startedScheduling && <button
                        className={`bottom-5 ${selectedPartItems.length === 0 || selectedJobs.length === 0 ? 'bg-indigo-200' : 'bg-indigo-600'} text-white rounded-xl py-2 px-4`}
                        disabled={selectedJobs.length === 0 || selectedPartItems.length === 0}
                        onClick={schedule}>Schedule
                        the
                        booking
                    </button>}
                    {startedScheduling && <div>
                        <hr/>
                        <div className="flex  items-center">
                            <div>
                                <label className="mt-3" htmlFor="zipCode">Postal code</label>
                                <input
                                    type="text"
                                    id="zipCode"
                                    readOnly={alowPostalCodeChange}
                                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-md text-gray-500 outline-none"
                                    placeholder="Postal code"
                                    name="zipCode"
                                    value={postalCode}
                                    onChange={(e) => handleUseAddress(e.target.value)}
                                /></div>

                            <button type="button"
                                    onClick={() => setAllowPostalCodeChange(!alowPostalCodeChange)}
                                    className="inline-flex items-center p-1.5 mt-5 text-sm font-medium text-center text-gray-500 hover:text-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg focus:outline-none dark:text-gray-400 dark:hover:text-gray-100">
                                {!alowPostalCodeChange ? 'Lock' : 'Change'}
                            </button>
                        </div>
                        <h2>Add timeslots:</h2>


                        <form className="  flex justify-between ">
                            <div>
                                <label htmlFor="time"
                                       className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Select
                                    time:</label>
                                <div className="relative ">
                                    <div
                                        className="absolute inset-y-0 end-0 top-0 flex items-center pe-3.5 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true"
                                             xmlns="http://www.w3.org/2000/svg" fill="currentColor"
                                             viewBox="0 0 24 24">
                                            <path fillRule="evenodd"
                                                  d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4a1 1 0 1 0-2 0v4a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V8Z"
                                                  clipRule="evenodd"/>
                                        </svg>
                                    </div>
                                    <input type="time" id="time"
                                           className="bg-gray-50 border leading-none border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                           min="09:00" max="18:00" value={currentTime}
                                           onChange={(e) => setCurrentTime(e.target.value)} required/>

                                </div>
                            </div>
                            <div className="relative max-w-sm"><label htmlFor="date"
                                                                      className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Select
                                date:</label>
                                <div className="relative ">

                                    <div
                                        className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true"
                                             xmlns="http://www.w3.org/2000/svg" fill="currentColor"
                                             viewBox="0 0 20 20">
                                            <path
                                                d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z"/>
                                        </svg>
                                    </div>
                                    <input datepicker datepicker-buttons datepicker-autoselect-today value={currentDate}
                                           type="date" id="date"
                                           className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                           placeholder="Select date"
                                           onChange={(e) => setCurrentDate(e.target.value)}/>
                                </div>
                            </div>
                            <div className="relative mt-7 ">

                                <button type="button"
                                        onClick={() => !timeSlots.find((item) => item.date === currentDate && item.time === currentTime) && setTimeSlots([...timeSlots, {
                                            time: currentTime,
                                            date: currentDate
                                        }])}
                                        className="inline-flex items-center p-1.5  text-sm font-medium text-center text-gray-500 hover:text-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg focus:outline-none dark:text-gray-400 dark:hover:text-gray-100">
                                    <svg className="w-3.5 h-3.5" aria-hidden="true"
                                         xmlns="http://www.w3.org/2000/svg"
                                         fill="none" viewBox="0 0 18 18">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"
                                              strokeWidth="2" d="M9 1v16M1 9h16"/>
                                    </svg>
                                    <span className="sr-only">Add</span>
                                </button>
                            </div>
                        </form>

                        {timeSlots.map((slot) => <div key={slot.time + slot.date}>
                            <div className="flex justify-between items-center">
                                <p>{slot.time}</p>
                                <p>{slot.date}</p>
                                <button type="button"
                                        onClick={() => setTimeSlots(timeSlots.filter((item) => item !== slot))}
                                        className="inline-flex items-center p-1.5 text-sm font-medium text-center text-gray-500 hover:text-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg focus:outline-none dark:text-gray-400 dark:hover:text-gray-100">
                                    <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
                                         width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                        <path fillRule="evenodd"
                                              d="M8.586 2.586A2 2 0 0 1 10 2h4a2 2 0 0 1 2 2v2h3a1 1 0 1 1 0 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a1 1 0 0 1 0-2h3V4a2 2 0 0 1 .586-1.414ZM10 6h4V4h-4v2Zm1 4a1 1 0 1 0-2 0v8a1 1 0 1 0 2 0v-8Zm4 0a1 1 0 1 0-2 0v8a1 1 0 1 0 2 0v-8Z"
                                              clipRule="evenodd"/>
                                    </svg>
                                    <span className="sr-only"
                                    >Delete</span>
                                </button>

                            </div>
                            <hr/>
                        </div>)}


                    </div>}


                    {timeSlots.length > 0 && <div className="mt-4">

                        <button
                            className={`bottom-5 ${timeSlots.length === 0 ? 'bg-indigo-200' : 'bg-indigo-600'} text-white rounded-xl py-2 px-4`}
                            disabled={timeSlots.length === 0} onClick={finalize}>Confirm
                            the
                            booking
                        </button>
                    </div>}

                </div>
                }

            </Modal>
        )
    }
;

export default JobsModal;