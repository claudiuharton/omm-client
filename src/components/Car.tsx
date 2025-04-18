import { useCallback, memo, useState } from "react";
import { useCarStore } from "../stores";
import { Car as CarObj } from "../interfaces/car.interface";
import { formatDate } from "../helpers/helpers";
import { toast } from "sonner";
import { ConfirmDialog } from "./ConfirmDialog";

/**
 * Format a date string to MM/YYYY format
 */
const formatDateOfManufacture = (dateStr?: string): string => {
  if (!dateStr) return "Unknown";

  try {
    // If it's just a year
    if (dateStr.length === 4) {
      return dateStr;
    }

    // Try to parse as date
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      // If not a valid date, return as is
      return dateStr;
    }

    // Format as MM/YYYY
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  } catch (e) {
    return "Invalid date";
  }
};

interface CarProps {
  item: CarObj;
  onSelectForJob: (car: CarObj) => void;
}

/**
 * Car component displays car information and related actions
 */
export const Car = memo(({ item, onSelectForJob }: CarProps) => {
  // Use stable selectors to avoid extra renders
  const deleteCar = useCarStore(state => state.deleteCar);
  const isLoading = useCarStore(state => state.isLoading);

  // State for confirmation dialog
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  /**
   * Handle car deletion with confirmation
   */
  const handleDeleteCar = useCallback(() => {
    // Open the confirmation dialog instead of using window.confirm
    setIsConfirmDialogOpen(true);
  }, []);

  /**
   * Function to execute when deletion is confirmed
   */
  const confirmDelete = useCallback(async () => {
    setIsConfirmDialogOpen(false); // Close dialog first
    try {
      // Add loading state feedback if desired, maybe disable buttons
      await deleteCar(item.id);
      toast.success(`Successfully removed ${item.make} ${item.model}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to delete car";
      toast.error(errorMsg);
    }
  }, [deleteCar, item.id, item.make, item.model]);

  /**
   * Function to execute when deletion is cancelled
   */
  const cancelDelete = useCallback(() => {
    setIsConfirmDialogOpen(false);
  }, []);

  return (
    <>
      <article
        className="bg-white shadow-lg p-5 rounded-xl w-full max-w-xs transition-all duration-200 hover:shadow-xl"
        aria-labelledby={`car-${item.id}`}
      >
        <div className="flex flex-col items-center gap-3">
          {/* Car plate/number */}
          <h2
            id={`car-${item.id}`}
            className="uppercase font-medium text-lg text-center"
          >
            {item.carNumber}
          </h2>

          <div className="flex flex-col items-center w-full space-y-2">
            {/* Car make */}
            <p className="text-gray-700 font-bold px-3 py-1.5 rounded-lg text-center w-full bg-gray-50">
              Make: <span className="font-normal capitalize text-gray-900">{item.make || "Unknown"}</span>
            </p>

            {/* Car model */}
            <p className="text-gray-700 font-bold px-3 py-1.5 rounded-lg text-center w-full bg-gray-50">
              Model: <span className="font-normal capitalize text-gray-900">{item.model || "Unknown"}</span>
            </p>

            {/* Date of manufacture */}
            <p className="text-gray-700 font-bold px-3 py-1.5 rounded-lg text-center w-full bg-gray-50">
              Date of manufacture: <span className="font-normal capitalize text-gray-900">
                {formatDateOfManufacture(item.dateOfManufacture)}
              </span>
            </p>

            {/* Creation date */}
            <p className="text-gray-700 font-bold px-3 py-1.5 rounded-lg text-center w-full bg-gray-50">
              Added on: <span className="font-normal text-gray-900">{formatDate(item.createdAt || "")}</span>
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="w-full flex items-center justify-between gap-2 mt-4">
          <button
            onClick={handleDeleteCar}
            disabled={isLoading}
            className="bg-red-600 text-white rounded-lg py-2 px-4 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Remove ${item.make} ${item.model}`}
          >
            Remove
          </button>
          <button
            onClick={() => onSelectForJob(item)}
            disabled={isLoading}
            className="bg-blue-600 text-white rounded-lg py-2 px-4 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Add job for ${item.make} ${item.model}`}
          >
            Add job
          </button>
        </div>
      </article>

      {/* Confirmation Dialog (Rendered via Portal) */}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        title="Confirm Deletion"
        message={`Are you sure you want to remove ${item.make} ${item.model} (${item.carNumber})? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmText="Delete"
      />
    </>
  );
});
