import { useCallback, memo, useState } from "react";
import { useCarStore } from "../stores";
import { Car as CarObj } from "../interfaces/car.interface";
import { formatDate } from "../helpers/helpers";
import { toast } from "sonner";
import { ConfirmDialog } from "./ConfirmDialog";
import { PartItemService } from "../services/part-item.service";

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

  // State for confirmation dialog and parts import
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isImportingParts, setIsImportingParts] = useState(false);

  /**
   * Handle parts import from GSF
   */
  const handleImportParts = useCallback(async () => {
    setIsImportingParts(true);
    try {
      const result = await PartItemService.importPartsFromGsf(item.carNumber);
      
      if (result.success) {
        toast.success(result.message || `Parts import started for ${item.carNumber}`);
      } else {
        throw new Error(result.message || "Failed to import parts");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to import parts";
      toast.error(errorMsg);
    } finally {
      setIsImportingParts(false);
    }
  }, [item.carNumber]);

  /**
   * Calculate progress percentage for parts import
   */
  const getProgressPercentage = useCallback(() => {
    // Use new partsProcessingStatus structure if available
    if (item.partsProcessingStatus?.total && item.partsProcessingStatus.total > 0) {
      return Math.round((item.partsProcessingStatus.processed / item.partsProcessingStatus.total) * 100);
    }
    
    // Fallback to old structure
    if (!item.partsProcessed || !item.totalPartsToProcess || item.totalPartsToProcess === 0) {
      return 0;
    }
    return Math.round((item.partsProcessed / item.totalPartsToProcess) * 100);
  }, [item.partsProcessed, item.totalPartsToProcess, item.partsProcessingStatus]);

  /**
   * Determine if parts are currently being imported
   */
  const isPartsBeingImported = (item.partsImportStatus === 'importing' && 
    ((item.partsProcessingStatus?.total && item.partsProcessingStatus.processed !== item.partsProcessingStatus.total) ||
     (item.partsProcessed !== undefined && 
      item.totalPartsToProcess !== undefined && 
      item.partsProcessed !== item.totalPartsToProcess &&
      item.totalPartsToProcess !== 0))) ||
    (item.partsProcessingStatus?.total && item.partsProcessingStatus.processed < item.partsProcessingStatus.total);

  /**
   * Determine if import parts button should be shown
   */
  const shouldShowImportButton = !isImportingParts && 
    (item.partsImportStatus === 'idle' || 
     item.partsImportStatus === 'failed' || 
     item.partsImportStatus === undefined ||
     !item.partsProcessingStatus); // Show button if no processing status exists

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
        className="bg-white shadow-lg p-5 rounded-xl w-full max-w-xs transition-all duration-200 hover:shadow-xl relative overflow-hidden"
        aria-labelledby={`car-${item.id}`}
      >
        {/* Progress bar for parts import */}
        {(isPartsBeingImported || item.partsProcessingStatus) && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
            <div 
              className="h-full bg-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        )}

        <div className="flex flex-col items-center gap-3">
          {/* Parts processing status badge */}
          {item.partsProcessingStatus && (
            <div className="w-full mb-2">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-center">
                <span className="text-blue-700 text-sm font-medium">
                  {item.partsProcessingStatus.status}
                </span>
                <div className="text-blue-600 text-xs mt-1">
                  {item.partsProcessingStatus.processed}/{item.partsProcessingStatus.total} ({getProgressPercentage()}%)
                </div>
              </div>
            </div>
          )}

          {/* Fallback: Parts import status badge for old structure */}
          {!item.partsProcessingStatus && isPartsBeingImported && (
            <div className="w-full mb-2">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-center">
                <span className="text-blue-700 text-sm font-medium">
                  Parts being imported: {item.partsProcessed}/{item.totalPartsToProcess} ({getProgressPercentage()}%)
                </span>
              </div>
            </div>
          )}

          {/* Small start import button */}
          {shouldShowImportButton && (
            <div className="w-full mb-2">
              <button
                onClick={handleImportParts}
                disabled={isLoading || isImportingParts}
                className="w-full bg-green-600 text-white rounded-lg py-1.5 px-3 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                aria-label={`Start import for ${item.make} ${item.model}`}
              >
                {isImportingParts ? 'Starting...' : 'Start Import'}
              </button>
            </div>
          )}

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
        <div className="w-full flex flex-col gap-2 mt-4">
          {/* Existing action buttons */}
          <div className="flex items-center justify-between gap-2">
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
