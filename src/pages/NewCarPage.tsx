import React from 'react';
import { NewCarForm } from '../components/NewCarForm'; // Assuming this will be created

export const NewCarPage: React.FC = () => {
    return (
        <div className="w-full md:w-2/3 lg:w-1/2 bg-white p-10 shadow-lg flex flex-col gap-2 mx-auto mt-8 sm:mt-12">
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Register New Car</h1>
            <NewCarForm />
        </div>
    );
}; 