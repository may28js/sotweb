import React, { useState } from 'react';
import { cn } from '../lib/utils';

interface SpoilerProps {
    children: React.ReactNode;
    className?: string;
}

export const Spoiler: React.FC<SpoilerProps> = ({ children, className }) => {
    const [isRevealed, setIsRevealed] = useState(false);

    return (
        <span 
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsRevealed(true);
            }}
            className={cn(
                "rounded-[3px] px-1 py-[1px] transition-colors duration-200 select-none",
                isRevealed 
                    ? "bg-transparent text-inherit cursor-text select-text" 
                    : "bg-[#4f545c] hover:bg-[#686d73] text-transparent cursor-pointer",
                className
            )}
            title={isRevealed ? "" : "点击查看内容"}
        >
            {/* We wrap children in a span to ensure text-transparent works correctly even for complex children */}
            <span className={cn(isRevealed ? "" : "opacity-0")}>
                {children}
            </span>
        </span>
    );
};
