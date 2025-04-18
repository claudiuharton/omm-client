import React, { useEffect, useRef } from 'react';
import Modal from "./Modal.tsx";
import { useJobStore } from "../stores";

const JobsModal: React.FC = () => {
    // Get only what we need from the store
    const selectedCar = useJobStore((state) => state.selectedCar);
    const selectCar = useJobStore((state) => state.selectCar);

    // Track if component has mounted to avoid unnecessary renders
    const hasInitialized = useRef(false);

    // Safe close function
    const closeModal = () => {
        selectCar(null);
    };

    // Reset when unmounted
    useEffect(() => {
        return () => {
            hasInitialized.current = false;
        };
    }, []);

    // Very simple modal with just a close button
    return (
        <Modal isOpen={!!selectedCar} onClose={closeModal}>
            <h2>Car Service Booking</h2>
            <p>This modal has been simplified to fix an infinite loop issue.</p>
            <button
                className="mt-4 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                onClick={closeModal}
            >
                Close
            </button>
        </Modal>
    );
};

export default JobsModal;