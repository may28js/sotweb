import React, { useEffect, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';
// import { cn } from '../lib/utils';

interface ImageViewerProps {
    images: string[];
    initialIndex: number;
    isOpen: boolean;
    onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ images, initialIndex, isOpen, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen, initialIndex]);

    const handlePrev = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    const handleNext = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex(prev => (prev + 1) % images.length);
    }, [images.length]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return;
        
        if (e.key === 'Escape') onClose();
        if (e.key === 'ArrowLeft') handlePrev();
        if (e.key === 'ArrowRight') handleNext();
    }, [isOpen, onClose, handlePrev, handleNext]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    if (!isOpen) return null;

    return createPortal(
        <div 
            className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center animate-in fade-in duration-200"
            onClick={onClose}
        >
            {/* Close Button */}
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-colors z-50"
            >
                <X size={24} />
            </button>

            {/* Navigation Buttons */}
            {images.length > 1 && (
                <>
                    <button 
                        onClick={handlePrev}
                        className="absolute left-4 p-3 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-colors z-50"
                    >
                        <ChevronLeft size={32} />
                    </button>
                    <button 
                        onClick={handleNext}
                        className="absolute right-4 p-3 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-colors z-50"
                    >
                        <ChevronRight size={32} />
                    </button>
                </>
            )}

            {/* Image Counter */}
            {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 bg-black/50 px-3 py-1 rounded-full text-sm">
                    {currentIndex + 1} / {images.length}
                </div>
            )}

            {/* Main Image */}
            <div 
                className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                <img 
                    src={images[currentIndex]} 
                    alt={`View ${currentIndex + 1}`}
                    className="max-w-full max-h-[90vh] object-contain select-none"
                />
            </div>
        </div>,
        document.body
    );
};

export default ImageViewer;
