import React from "react";
import ReactDOM from "react-dom";
import "./Modal.css";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
                <button className="modal-close " onClick={onClose}>
                    &times;
                </button>
                {children}
            </div>
        </div>,
        document.getElementById("modal-root") as HTMLElement // TypeScript requires explicit casting
    );
};

export default Modal;
