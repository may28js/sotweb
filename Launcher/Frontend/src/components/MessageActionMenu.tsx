import React, { useEffect, useState, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
    Reply, 
    Copy, 
    Edit2, 
    Trash2,
    Link
} from 'lucide-react';
import { cn } from '../lib/utils';

interface MessageActionMenuProps {
    onClose: () => void;
    onReply: () => void;
    onCopy: () => void;
    onCopyLink?: () => void;
    onReaction: (emoji: string) => void;
    onEdit?: () => void;
    onDelete?: () => void;
    triggerRect: DOMRect;
}

const MenuButton = ({ icon: Icon, label, onClick, danger = false }: { icon: any, label: string, onClick: () => void, danger?: boolean }) => (
    <button 
        onClick={(e) => {
            e.stopPropagation();
            onClick();
        }}
        className={cn(
            "flex items-center justify-between px-2 py-1.5 text-sm transition-colors group mx-1 rounded-[2px] w-[calc(100%-8px)]",
            danger ? "text-red-400 hover:bg-red-500 hover:text-white" : "text-[#B5BAC1] hover:bg-[#4752c4] hover:text-white"
        )}
    >
        <span className="font-medium">{label}</span>
        <Icon size={16} />
    </button>
);

const MessageActionMenu: React.FC<MessageActionMenuProps> = ({
    onClose,
    onReply,
    onCopy,
    onCopyLink,
    onReaction,
    onEdit,
    onDelete,
    triggerRect
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [recentEmojis, setRecentEmojis] = useState<string[]>(['👍', '👎', '😄', '🎉']);
    const [style, setStyle] = useState<React.CSSProperties>({ 
        opacity: 0 
    });

    useEffect(() => {
        const stored = localStorage.getItem('storyoftime_recent_reactions');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const defaults = ['👍', '👎', '😄', '🎉'];
                    const combined = [...new Set([...parsed, ...defaults])].slice(0, 4);
                    setRecentEmojis(combined);
                }
            } catch (e) {
                console.error("Failed to load recent reactions", e);
            }
        }
    }, []);

    useLayoutEffect(() => {
        if (menuRef.current && triggerRect) {
            const menuRect = menuRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const menuWidth = 188;
            const menuHeight = menuRect.height || 200; // Estimated or actual

            // Default position: Left of trigger, Top aligned with trigger
            let left = triggerRect.left - menuWidth - 8;
            let top = triggerRect.top;

            // Check if top overflows (unlikely for top-aligned but possible if trigger is very high)
            if (top < 10) top = 10;

            // Check if bottom overflows
            if (top + menuHeight > viewportHeight - 10) {
                // Try to align bottom with trigger bottom
                // Or just shift up
                top = viewportHeight - menuHeight - 10;
            }
            
            // Check if left overflows (too far left)
            if (left < 10) {
                // Flip to right side
                left = triggerRect.right + 8;
            }

            setStyle({ 
                top: top, 
                left: left,
                opacity: 1
            });
        }
    }, [triggerRect]);

    return createPortal(
        <div 
            ref={menuRef}
            className="fixed z-[9999] w-[188px] bg-[#3c3d45] rounded-[8px] border border-[#474850] shadow-[0_8px_16px_rgba(0,0,0,0.24)] overflow-hidden flex flex-col py-1.5 animate-in fade-in zoom-in-95 duration-100 origin-top-right cursor-default more-menu-content"
            style={style}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="px-2 py-1 flex justify-between items-center mb-1">
                {recentEmojis.map(emoji => (
                    <button
                        key={emoji}
                        onClick={() => {
                            onReaction(emoji);
                            onClose();
                        }}
                        className="w-8 h-8 flex items-center justify-center hover:bg-[#4f545c] rounded transition-colors text-xl grayscale hover:grayscale-0"
                    >
                        {emoji}
                    </button>
                ))}
            </div>

            <div className="h-[1px] bg-[#474850] my-1 mx-2" />

            <MenuButton icon={Reply} label="回复" onClick={onReply} />
            <MenuButton icon={Copy} label="复制文字" onClick={onCopy} />
            {onCopyLink && <MenuButton icon={Link} label="复制链接" onClick={onCopyLink} />}
            
            {(onEdit || onDelete) && <div className="h-[1px] bg-[#474850] my-1 mx-2" />}
            
            {onEdit && <MenuButton icon={Edit2} label="编辑" onClick={onEdit} />}
            {onDelete && <MenuButton icon={Trash2} label="删除" danger onClick={onDelete} />}
        </div>,
        document.body
    );
};

export default MessageActionMenu;
