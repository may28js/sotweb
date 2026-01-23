import React, { useRef } from 'react';
import { Bold, Italic, Strikethrough, Quote, Code, Eye } from 'lucide-react';

interface MarkdownToolbarProps {
    visible: boolean;
    position: { top: number; left: number };
    onApply: (format: 'bold' | 'italic' | 'strike' | 'quote' | 'code' | 'spoiler') => void;
}

export const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({ visible, position, onApply }) => {
    const toolbarRef = useRef<HTMLDivElement>(null);

    // Prevent toolbar from closing when clicking on it
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    if (!visible) return null;

    return (
        <div
            ref={toolbarRef}
            className="fixed z-50 flex items-center bg-[#1e1f22] rounded shadow-lg border border-[#2f3136] px-1 py-1 gap-1 transform -translate-x-1/2 -translate-y-full"
            style={{ 
                top: position.top - 10, 
                left: position.left 
            }}
            onMouseDown={handleMouseDown}
        >
            <ToolbarButton 
                icon={<Bold size={16} />} 
                onClick={() => onApply('bold')} 
                tooltip="加粗"
            />
            <ToolbarButton 
                icon={<Italic size={16} />} 
                onClick={() => onApply('italic')} 
                tooltip="斜体"
            />
            <ToolbarButton 
                icon={<Strikethrough size={16} />} 
                onClick={() => onApply('strike')} 
                tooltip="删除线"
            />
            <ToolbarButton 
                icon={<Quote size={16} />} 
                onClick={() => onApply('quote')} 
                tooltip="引用"
            />
            <ToolbarButton 
                icon={<Code size={16} />} 
                onClick={() => onApply('code')} 
                tooltip="代码"
            />
             <ToolbarButton 
                icon={<Eye size={16} />} 
                onClick={() => onApply('spoiler')} 
                tooltip="防剧透"
            />
            
            {/* Arrow pointing down */}
            <div className="absolute left-1/2 bottom-0 w-2 h-2 bg-[#1e1f22] transform -translate-x-1/2 translate-y-1/2 rotate-45 border-r border-b border-[#2f3136]"></div>
        </div>
    );
};

interface ToolbarButtonProps {
    icon: React.ReactNode;
    onClick: () => void;
    tooltip: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ icon, onClick, tooltip }) => (
    <button
        onClick={onClick}
        className="p-1.5 text-[#b9bbbe] hover:text-white hover:bg-[#40444b] rounded transition-colors relative group"
        title={tooltip}
    >
        {icon}
    </button>
);
