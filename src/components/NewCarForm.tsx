import React, { useState } from 'react';

export const NewCarForm: React.FC = () => {
    const [carNumber, setCarNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);
        console.log("Submitting car registration for:", carNumber);
        // TODO: Implement actual API call using useCarStore

        // Placeholder for API call simulation
        setTimeout(() => {
            // Simulate success or failure
            if (carNumber.trim().length > 3) { // Basic validation
                console.log("API call successful (placeholder)");
                setCarNumber(''); // Reset form
                // Potentially show success message (e.g., using toast)
                // Potentially navigate away (e.g., back to homepage)
            } else {
                console.error("API call failed (placeholder)");
                setError("Invalid car number (placeholder).");
            }
            setIsLoading(false);
        }, 1500);
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-white shadow-md rounded-lg p-8 space-y-6"
        >
            <div>
                <label htmlFor="carNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Car Registration Number (Plate)
                </label>
                <input
                    type="text"
                    id="carNumber"
                    name="carNumber"
                    value={carNumber}
                    onChange={(e) => setCarNumber(e.target.value.toUpperCase())}
                    required
                    placeholder="e.g., AB12 CDE"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={isLoading}
                />
            </div>

            {error && (
                <p className="text-sm text-red-600">Error: {error}</p>
            )}

            <button
                type="submit"
                disabled={isLoading || !carNumber.trim()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {isLoading ? 'Registering...' : 'Register Car'}
            </button>
        </form>
    );
}; 