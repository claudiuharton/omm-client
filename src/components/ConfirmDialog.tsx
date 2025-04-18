import React from 'react';
import ReactDOM from 'react-dom';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
}) => {
    if (!isOpen) {
        return null;
    }

    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) {
        console.error("Modal root element #modal-root not found in the DOM.");
        // Fallback or render directly? For simplicity, render directly if root not found.
        // In a real app, you might want a more robust error handling or setup guarantee.
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-600 bg-opacity-75">
                Error: #modal-root not found.
            </div>
        );
    }

    // Use React Portal to render the modal into #modal-root
    return ReactDOM.createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-600 bg-opacity-75 transition-opacity duration-300 ease-in-out"
            aria-labelledby="confirm-dialog-title"
            role="dialog"
            aria-modal="true"
        >
            <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
                {/* Title */}
                <h3 id="confirm-dialog-title" className="text-lg font-semibold text-gray-900 mb-4">
                    {title}
                </h3>

                {/* Message */}
                <p className="text-sm text-gray-600 mb-6">
                    {message}
                </p>

                {/* Buttons */}
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        modalRoot
    );
}; 