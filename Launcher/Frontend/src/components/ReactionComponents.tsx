import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/utils';
import { Smile } from 'lucide-react';
import EmojiPicker, { Theme, Categories, EmojiStyle } from 'emoji-picker-react';
import { type Reaction } from '../types';

interface ReactionListProps {
    reactions: Reaction[];
    currentUserId: number;
    onToggleReaction: (emoji: string) => void;
    className?: string;
}

export const ReactionList: React.FC<ReactionListProps> = React.memo(({
    reactions,
    currentUserId,
    onToggleReaction,
    className
}) => {
    // Group reactions by emoji
    const groupedReactions = React.useMemo(() => {
        const groups: Record<string, { count: number; hasReacted: boolean; users: number[] }> = {};
        
        reactions.forEach(r => {
            if (!groups[r.emoji]) {
                groups[r.emoji] = { count: 0, hasReacted: false, users: [] };
            }
            groups[r.emoji].count++;
            groups[r.emoji].users.push(r.userId);
            if (r.userId === currentUserId) {
                groups[r.emoji].hasReacted = true;
            }
        });

        return Object.entries(groups).map(([emoji, data]) => ({
            emoji,
            ...data
        }));
    }, [reactions, currentUserId]);

    if (groupedReactions.length === 0) return null;

    return (
        <div className={cn("flex flex-wrap items-center gap-1", className)}>
            {groupedReactions.map(({ emoji, count, hasReacted }) => (
                <ActionTooltip key={emoji} text={hasReacted ? "移除反应" : "添加反应"}>
                    <button
                        onClick={() => onToggleReaction(emoji)}
                        className={cn(
                            "flex items-center gap-1.5 px-1.5 py-0.5 rounded-[8px] border text-xs font-medium transition-colors",
                            hasReacted 
                                ? "bg-[#3ba55c]/20 border-[#3ba55c] text-white" 
                                : "bg-[#2f3136] border-transparent text-[#B9BBBE] hover:border-[#4f545c] hover:bg-[#36393f]"
                        )}
                    >
                        <span className="text-base">{emoji}</span>
                        <span className={cn(hasReacted ? "text-white" : "text-[#B9BBBE]")}>{count}</span>
                    </button>
                </ActionTooltip>
            ))}
        </div>
    );
});

interface MessageReactionActionProps {
    onEmojiSelect: (emoji: string) => void;
}

export const ActionTooltip = ({ children, text, className }: { children: React.ReactNode, text: string, className?: string }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (isVisible && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const left = rect.left + (rect.width / 2);
            let top = rect.top - 8;
            setCoords({ top, left });
        }
    }, [isVisible]);

    return (
        <div 
            ref={triggerRef}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            className={cn("relative flex items-center justify-center", className)}
        >
            {children}
            {isVisible && createPortal(
                <div 
                    style={{ 
                        position: 'fixed', 
                        top: coords.top, 
                        left: coords.left,
                        transform: 'translate(-50%, -100%)',
                        zIndex: 99999 
                    }}
                    className="px-2 py-1.5 bg-[#313338] text-[#DCDDDE] text-xs font-semibold rounded-[8px] shadow-[0_2px_4px_rgba(0,0,0,0.15)] pointer-events-none whitespace-nowrap border border-[#3f4147]"
                >
                    {text}
                    <div 
                        className="absolute left-1/2 bottom-0 w-2 h-2 bg-[#313338] border-b border-r border-[#3f4147] transform -translate-x-1/2 translate-y-1/2 rotate-45"
                    ></div>
                </div>,
                document.body
            )}
        </div>
    );
};

export const trackReactionUsage = (emoji: string) => {
    try {
        const stored = localStorage.getItem('storyoftime_recent_reactions');
        let recents: string[] = stored ? JSON.parse(stored) : [];
        
        // Remove if exists to move to front
        recents = recents.filter(e => e !== emoji);
        recents.unshift(emoji);
        
        // Keep max 20 stored, but we only show top 3
        if (recents.length > 20) recents = recents.slice(0, 20);
        
        localStorage.setItem('storyoftime_recent_reactions', JSON.stringify(recents));
        window.dispatchEvent(new Event('reaction-usage-updated'));
    } catch (e) {
        console.error("Failed to update recent reactions", e);
    }
};

export const QuickReactionGroup: React.FC<{ onEmojiSelect: (emoji: string) => void }> = ({ onEmojiSelect }) => {
    const [recentEmojis, setRecentEmojis] = useState<string[]>([]);

    useEffect(() => {
        // Initial load
        const loadRecents = () => {
            const stored = localStorage.getItem('storyoftime_recent_reactions');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setRecentEmojis(parsed.slice(0, 3));
                        return;
                    }
                } catch (e) {
                    console.error("Failed to parse recent reactions", e);
                }
            }
            // Default if empty -> set to empty, do not show defaults
            setRecentEmojis([]);
        };

        loadRecents();

        const handleUpdate = () => loadRecents();
        window.addEventListener('reaction-usage-updated', handleUpdate);
        return () => window.removeEventListener('reaction-usage-updated', handleUpdate);
    }, []);

    if (recentEmojis.length === 0) return null;

    return (
        <div className="flex items-center">
            {recentEmojis.map(emoji => (
                <ActionTooltip key={emoji} text={emoji}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEmojiSelect(emoji);
                        }}
                        className="w-8 h-8 flex items-center justify-center hover:bg-[#404249] rounded transition-colors text-lg hover:scale-110 active:scale-95 transform duration-100"
                    >
                        {emoji}
                    </button>
                </ActionTooltip>
            ))}
            <div className="w-[1px] h-5 bg-[#4f545c] mx-1.5"></div>
        </div>
    );
};

export const MessageReactionAction: React.FC<MessageReactionActionProps> = ({ onEmojiSelect }) => {
    const [showPicker, setShowPicker] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [pickerStyle, setPickerStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                pickerRef.current &&
                !pickerRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setShowPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useLayoutEffect(() => {
        if (showPicker && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const width = 300;
            const height = 400;
            
            // 1. Pop up to the left of the click position (button)
            let left = rect.left - width - 8;

            // 2. Default top aligned with mouse position (button top)
            let top = rect.top;

            // 3. Float up/down to ensure no overflow
            // Check bottom overflow
            if (top + height > window.innerHeight) {
                top = window.innerHeight - height - 12;
            }

            // Check top overflow
            if (top < 12) {
                top = 12;
            }

            // Check left overflow (though unlikely given button is usually on right)
            if (left < 12) {
                left = 12;
            }

            setPickerStyle({
                position: 'fixed',
                top: `${top}px`,
                left: `${left}px`,
                zIndex: 9999
            });
        }
    }, [showPicker]);

    return (
        <div className="relative">
            <ActionTooltip text="添加反应">
                <button
                    ref={buttonRef}
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowPicker(!showPicker);
                    }}
                    className="w-8 h-8 flex items-center justify-center text-[#B9BBBE] hover:text-[#DCDDDE] hover:bg-[#4f545c] rounded transition-colors"
                >
                    <Smile size={20} />
                </button>
            </ActionTooltip>

            {showPicker && createPortal(
                <div 
                    ref={pickerRef}
                    style={pickerStyle}
                    onClick={(e) => e.stopPropagation()}
                >
                    <style>{`
                        aside.epr-emoji-category-label {
                            font-size: 0 !important;
                            height: 1px !important;
                            background-color: #404249 !important;
                            margin: 8px 16px !important;
                            padding: 0 !important;
                            position: static !important;
                            border: none !important;
                            min-height: 1px !important;
                        }
                    `}</style>
                     <EmojiPicker
                        theme={Theme.DARK}
                        emojiStyle={EmojiStyle.NATIVE}
                        onEmojiClick={(emojiData) => {
                            onEmojiSelect(emojiData.emoji);
                            setShowPicker(false);
                        }}
                        lazyLoadEmojis={true}
                        skinTonesDisabled
                        searchDisabled
                        width={300}
                        height={400}
                        categories={[
                            { category: Categories.SMILEYS_PEOPLE, name: 'Smileys & People' },
                            { category: Categories.ANIMALS_NATURE, name: 'Animals & Nature' },
                            { category: Categories.FOOD_DRINK, name: 'Food & Drink' },
                            { category: Categories.ACTIVITIES, name: 'Activities' },
                            { category: Categories.SYMBOLS, name: 'Symbols' }
                        ]}
                    />
                </div>,
                document.body
            )}
        </div>
    );
};
