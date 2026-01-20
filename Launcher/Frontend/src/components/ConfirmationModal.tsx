import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "确定",
    cancelText = "取消",
    isDangerous = false
}) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-[#313338] rounded-md shadow-lg w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-[#1f2023]">
                <div className="flex items-center justify-between p-4 border-b border-[#1f2023] bg-[#2b2d31]">
                    <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-200 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-4 bg-[#313338]">
                    <p className="text-gray-300">{message}</p>
                </div>

                <div className="flex items-center justify-end gap-3 p-4 bg-[#2b2d31]">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:underline transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-4 py-2 text-sm font-medium text-white rounded transition-colors ${
                            isDangerous 
                                ? "bg-red-500 hover:bg-red-600" 
                                : "bg-[#5865F2] hover:bg-[#4752c4]"
                        }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmationModal;
