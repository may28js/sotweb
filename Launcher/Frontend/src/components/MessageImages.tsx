import React, { useState, useMemo } from 'react';
import { cn } from '../lib/utils';
import ImageViewer from './ImageViewer';
import { getAvatarUrl } from '../lib/api';

interface MessageImagesProps {
    images: string[];
    onImageLoad?: () => void;
}

const MessageImages: React.FC<MessageImagesProps> = ({ images, onImageLoad }) => {
    const [viewerOpen, setViewerOpen] = useState(false);
    const [initialIndex, setInitialIndex] = useState(0);
    const [revealed, setRevealed] = useState<Set<number>>(new Set());

    // Process images to ensure they have absolute URLs
    const processedImages = useMemo(() => {
        if (!images) return [];
        return images.map(img => getAvatarUrl(img) || img);
    }, [images]);

    if (!processedImages || processedImages.length === 0) return null;

    const isSpoiler = (url: string) => url.includes("/SPOILER_") || url.includes("SPOILER_");

    const handleImageClick = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        if (isSpoiler(processedImages[index]) && !revealed.has(index)) {
            setRevealed(prev => new Set(prev).add(index));
            return;
        }
        setInitialIndex(index);
        setViewerOpen(true);
    };

    // Single Image
    if (processedImages.length === 1) {
        const url = processedImages[0];
        const _isSpoiler = isSpoiler(url);
        const _isRevealed = revealed.has(0);

        return (
            <>
                <div 
                    className={cn(
                        "relative mt-2 max-w-[70%] group cursor-pointer overflow-hidden rounded-lg border border-[#26272D]",
                        _isSpoiler && !_isRevealed ? "" : ""
                    )}
                    onClick={(e) => handleImageClick(e, 0)}
                >
                    <img 
                        src={url} 
                        alt="attachment" 
                        className={cn(
                            "max-h-[400px] w-full object-cover transition-all duration-300",
                            _isSpoiler && !_isRevealed ? "blur-md brightness-50" : "hover:opacity-90 cursor-zoom-in"
                        )}
                        onLoad={onImageLoad}
                    />
                    {_isSpoiler && !_isRevealed && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-black/50 text-white px-3 py-1.5 rounded-full font-bold uppercase text-xs backdrop-blur-md border border-white/10 shadow-lg transition-transform group-hover:scale-110">
                                Spoiler
                            </span>
                        </div>
                    )}
                </div>
                <ImageViewer 
                    images={images}
                    initialIndex={0}
                    isOpen={viewerOpen}
                    onClose={() => setViewerOpen(false)}
                />
            </>
        );
    }

    // Grid Layout Logic (Adapted from ForumComponents.tsx but standardized to 70% width)
    const getGridClass = (count: number) => {
        // All multi-image grids use max-w-[70%] as requested
        if (count === 2) return "grid-cols-2 max-w-[70%]";
        if (count === 3) return "grid-cols-2 max-w-[70%]"; 
        if (count === 4) return "grid-cols-2 grid-rows-2 max-w-[70%]";
        if (count >= 5) return "grid-cols-4 max-w-[70%]"; // Changed from 80% to 70% per request
        return "grid-cols-3 max-w-[70%]";
    };

    const getImageStyle = (index: number, count: number) => {
        if (count === 3) {
            // Layout: Left (big), Right Top, Right Bottom
            if (index === 0) return "row-span-2 aspect-square h-full";
            return "aspect-[2/1]"; 
        }
        if (count >= 5 && index === 0) return "col-span-4 aspect-video"; // Top large image
        return "aspect-square";
    };

    return (
        <>
            <div className={cn("grid gap-1 mt-2 rounded-lg overflow-hidden", getGridClass(images.length), images.length === 3 && "grid-rows-2")}>
                {processedImages.map((url, index) => {
                    const _isSpoiler = isSpoiler(url);
                    const _isRevealed = revealed.has(index);

                    return (
                        <div 
                            key={index} 
                            className={cn(
                                "relative bg-[#2b2d31] overflow-hidden group",
                                getImageStyle(index, images.length),
                                !_isSpoiler || _isRevealed ? "cursor-zoom-in" : "cursor-pointer"
                            )}
                            onClick={(e) => handleImageClick(e, index)}
                        >
                            <img 
                                src={url} 
                                className={cn(
                                    "w-full h-full object-cover transition-transform duration-300",
                                    _isSpoiler && !_isRevealed ? "blur-md brightness-50" : "hover:scale-105"
                                )}
                                alt={`attachment-${index}`} 
                                loading="lazy"
                                onLoad={index === images.length - 1 ? onImageLoad : undefined}
                            />
                            {_isSpoiler && !_isRevealed && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="bg-black/50 text-white px-2 py-1 rounded font-bold uppercase text-[10px] backdrop-blur-md border border-white/10 shadow-lg">
                                        Spoiler
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            
            <ImageViewer 
                images={processedImages}
                initialIndex={initialIndex}
                isOpen={viewerOpen}
                onClose={() => setViewerOpen(false)}
            />
        </>
    );
};

export default React.memo(MessageImages);
