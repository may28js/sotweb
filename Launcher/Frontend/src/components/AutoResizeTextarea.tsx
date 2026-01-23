import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState, useMemo } from 'react';
import { cn } from '../lib/utils';
import { MarkdownToolbar } from './MarkdownToolbar';

export interface MentionCandidate {
    id: string | number;
    label: string;
    type: 'user' | 'role' | 'everyone';
    detail?: string;
    color?: string;
}

interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    maxHeight?: number | string;
    value: string;
    mentionCandidates?: MentionCandidate[];
}

export const AutoResizeTextarea = forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(
    ({ className, maxHeight = '50vh', value, onChange, mentionCandidates = [], ...props }, ref) => {
        const textareaRef = useRef<HTMLTextAreaElement | null>(null);
        const [toolbarVisible, setToolbarVisible] = useState(false);
        const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });

        // Mention State
        const [mentionQuery, setMentionQuery] = useState<string | null>(null);
        const [mentionIndex, setMentionIndex] = useState(0);

        // Forward the ref
        useImperativeHandle(ref, () => textareaRef.current!);

        const adjustHeight = () => {
            const textarea = textareaRef.current;
            if (textarea) {
                textarea.style.height = 'auto';
                textarea.style.height = `${textarea.scrollHeight}px`;
            }
        };

        useEffect(() => {
            adjustHeight();
        }, [value]);

        const handleMouseUp = (e: React.MouseEvent<HTMLTextAreaElement>) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;

            if (start !== end) {
                // Show toolbar above the mouse cursor
                setToolbarPosition({ top: e.clientY, left: e.clientX });
                setToolbarVisible(true);
            } else {
                setToolbarVisible(false);
            }
        };

        const handleBlur = () => {
            // Hide toolbar when focus is lost (e.g. clicking outside)
            // Use timeout to allow toolbar button clicks to process if they didn't prevent default
            setTimeout(() => {
                setToolbarVisible(false);
                // Also close mention list on blur
                setMentionQuery(null);
            }, 100);
        };

        const handleApplyFormat = (format: 'bold' | 'italic' | 'strike' | 'quote' | 'code' | 'spoiler') => {
            const textarea = textareaRef.current;
            if (!textarea) return;
    
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            const selectedText = text.substring(start, end);
            
            let newText = text;
            
            if (format === 'quote') {
                 newText = text.substring(0, start) + '> ' + selectedText + text.substring(end);
            } else {
                let wrapper = '';
                switch (format) {
                    case 'bold': wrapper = '**'; break;
                    case 'italic': wrapper = '*'; break;
                    case 'strike': wrapper = '~~'; break;
                    case 'code': wrapper = '`'; break;
                    case 'spoiler': wrapper = '||'; break;
                }
                newText = text.substring(0, start) + wrapper + selectedText + wrapper + text.substring(end);
            }
    
            // Call onChange
            if (onChange) {
                const event = {
                    target: { value: newText },
                    currentTarget: { value: newText }
                } as React.ChangeEvent<HTMLTextAreaElement>;
                onChange(event);
            }
            
            setToolbarVisible(false);
            textarea.focus();
        };

        // Filter Candidates
        const filteredCandidates = useMemo(() => {
            if (mentionQuery === null) return [];
            const lowerQuery = mentionQuery.toLowerCase();
            return mentionCandidates.filter(c => 
                c.label.toLowerCase().includes(lowerQuery) || 
                (c.detail && c.detail.toLowerCase().includes(lowerQuery))
            ).slice(0, 10);
        }, [mentionCandidates, mentionQuery]);

        const selectCandidate = (candidate: MentionCandidate) => {
            const textarea = textareaRef.current;
            if (!textarea) return;
            
            const cursor = textarea.selectionStart;
            const text = textarea.value;
            
            // Find start of mention
            const textBeforeCursor = text.substring(0, cursor);
            const lastAt = textBeforeCursor.lastIndexOf('@');
            
            if (lastAt !== -1) {
                const prefix = text.substring(0, lastAt);
                const suffix = text.substring(cursor);
                const insertion = `@${candidate.label} `;
                
                const newText = prefix + insertion + suffix;
                
                // Fire change
                const event = {
                   target: { value: newText },
                   currentTarget: { value: newText }
                } as React.ChangeEvent<HTMLTextAreaElement>;
                onChange?.(event);
                
                setMentionQuery(null);
                
                // Restore focus and cursor
                setTimeout(() => {
                    textarea.focus();
                    const newCursorPos = prefix.length + insertion.length;
                    textarea.setSelectionRange(newCursorPos, newCursorPos);
                }, 0);
            }
       };

       const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (mentionQuery !== null && filteredCandidates.length > 0) {
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setMentionIndex(prev => (prev - 1 + filteredCandidates.length) % filteredCandidates.length);
                    return;
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setMentionIndex(prev => (prev + 1) % filteredCandidates.length);
                    return;
                } else if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    selectCandidate(filteredCandidates[mentionIndex]);
                    return;
                } else if (e.key === 'Escape') {
                    setMentionQuery(null);
                    return;
                }
            }
            props.onKeyDown?.(e);
       };

       const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
           onChange?.(e);
           adjustHeight();
           if (toolbarVisible) setToolbarVisible(false);

           // Mention Logic
           const val = e.target.value;
           const cursor = e.target.selectionStart;
           const textBeforeCursor = val.substring(0, cursor);
           const lastAt = textBeforeCursor.lastIndexOf('@');

           if (lastAt !== -1) {
               // Ensure the @ is at the start or preceded by whitespace
               if (lastAt === 0 || /\s/.test(textBeforeCursor[lastAt - 1])) {
                   const query = textBeforeCursor.substring(lastAt + 1);
                   // Check if query contains whitespace
                   if (!/\s/.test(query)) {
                       setMentionQuery(query);
                       setMentionIndex(0);
                       return;
                   }
               }
           }
           setMentionQuery(null);
       };

        return (
            <>
                {mentionQuery !== null && filteredCandidates.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#2B2D31] border border-[#1E1F22] rounded-md shadow-xl z-50 overflow-hidden flex flex-col">
                        <div className="text-[10px] uppercase font-bold text-[#949BA4] px-3 py-2 bg-[#1E1F22]">
                            Members matching "{mentionQuery}"
                        </div>
                        <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                            {filteredCandidates.map((candidate, index) => (
                                <div
                                    key={`${candidate.type}-${candidate.id}`}
                                    className={cn(
                                        "px-3 py-2 flex items-center justify-between cursor-pointer text-sm",
                                        index === mentionIndex ? "bg-[#404249] text-white" : "text-[#B5BAC1] hover:bg-[#35373C] hover:text-[#DBDEE1]"
                                    )}
                                    onMouseDown={(e) => {
                                        e.preventDefault(); // Prevent blur
                                        selectCandidate(candidate);
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        {candidate.type === 'everyone' && <span className="text-[#faa61a] font-bold">@</span>}
                                        {candidate.type === 'role' && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: candidate.color || '#99AAB5' }}></div>}
                                        <span style={{ color: candidate.type === 'role' ? candidate.color : undefined }}>{candidate.label}</span>
                                    </div>
                                    {candidate.detail && <span className="text-xs text-[#949BA4]">{candidate.detail}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={handleChange}
                    onMouseUp={(e) => {
                        props.onMouseUp?.(e);
                        handleMouseUp(e);
                    }}
                    onBlur={(e) => {
                        props.onBlur?.(e);
                        handleBlur();
                    }}
                    onKeyDown={handleKeyDown}
                    className={cn(
                        "w-full bg-transparent text-[#dcddde] placeholder-[#72767d] outline-none resize-none overflow-y-auto custom-scrollbar",
                        className
                    )}
                    style={{
                        maxHeight: maxHeight,
                    }}
                    rows={1}
                    {...props}
                />
                <MarkdownToolbar 
                    visible={toolbarVisible} 
                    position={toolbarPosition} 
                    onApply={handleApplyFormat} 
                />
            </>
        );
    }
);

AutoResizeTextarea.displayName = 'AutoResizeTextarea';
