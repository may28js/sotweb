import React from 'react';
import { type Message, type User, type Member, type CommunityRole } from '../types';
import { cn, formatMessageDate, parseColorToRgba } from "../lib/utils";
import { format } from 'date-fns';
import { 
    MoreHorizontal, 
    Reply
} from 'lucide-react';
// import { Bold, Italic, Strikethrough, Quote, Code, Eye, EyeOff } from 'lucide-react';
import { MemoizedMessageContent } from './MessageContent';
import MessageImages from './MessageImages';
import LinkPreviewCard from './LinkPreviewCard';
import { ReactionList, MessageReactionAction, QuickReactionGroup, ActionTooltip } from './ReactionComponents';
import ReplyContext from './ReplyContext';
import { getAvatarUrl } from '../lib/api';

interface MessageItemProps {
    message: Message;
    user: User | null; // Current user
    members: Member[];
    roles: CommunityRole[];
    activeChannelId: number;
    isNewMessageDivider: boolean;
    showHeader: boolean;
    isActionMenuOpen: boolean;

    // Handlers
    onUserClick: (e: React.MouseEvent, user: User | any, type: 'chat' | 'member' | 'profile') => void;
    onReply: (message: Message) => void;
    onReaction: (messageId: number, emoji: string, hasReacted: boolean) => void;
    onOpenMoreMenu: (messageId: number, rect: DOMRect) => void;
    onCloseMoreMenu: () => void;
    onScrollToMessage: (messageId: number) => void;
    
    // For Image Load
    onImageLoad?: () => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
    message,
    user,
    members,
    roles,
    // activeChannelId,
    isNewMessageDivider,
    showHeader,
    isActionMenuOpen,
    onUserClick,
    onReply,
    onReaction,
    onOpenMoreMenu,
    onCloseMoreMenu,
    onScrollToMessage,
    onImageLoad
}) => {
    // Determine Mention Type and Color
    let mentionColor: string | null = null;
    let isMentioned = false;

    // 1. Check for Role Mentions (Priority: Role Color > Everyone Yellow)
    // Use sorted roles to ensure longer names match first (e.g. Super Admin vs Admin)
    const sortedRoles = React.useMemo(() => {
        return [...roles].sort((a, b) => b.name.length - a.name.length);
    }, [roles]);

    if (sortedRoles.length > 0) {
        for (const role of sortedRoles) {
            if (message.content.toLowerCase().includes(`@${role.name.toLowerCase()}`)) {
                if (role.color !== null && role.color !== undefined) {
                    const parsedColor = parseColorToRgba(role.color, 1);
                    if (parsedColor) {
                        mentionColor = parsedColor;
                        isMentioned = true;
                        break; 
                    }
                }
            }
        }
    }

    // 2. Check for @everyone
    if (!isMentioned && message.content.includes('@everyone')) {
        isMentioned = true;
        mentionColor = '#faa61a'; // Default Yellow
    }

    // 3. Check for Direct Mention
    if (!isMentioned && user) {
        const isDirect = (
            (message.replyTo?.userId === user.id) || 
            message.content.toLowerCase().includes(`@${user.username.toLowerCase()}`) || 
            (user.nickname && message.content.toLowerCase().includes(`@${user.nickname.toLowerCase()}`))
        );
        if (isDirect) {
            isMentioned = true;
            mentionColor = '#faa61a'; // Default Yellow
        }
    }

    const mentionBgColor = mentionColor 
        ? parseColorToRgba(mentionColor, 0.1) 
        : null;
    
    const mentionHoverBgColor = mentionColor
        ? parseColorToRgba(mentionColor, 0.15)
        : null;

    // Helper to get user color
    const getUserColor = (userId: number, fallback?: string) => {
        const member = members.find(m => m.id === userId);
        return member?.roleColor || fallback || '#ffffff';
    };

    return (
        <React.Fragment>
            {isNewMessageDivider && (
                <div className="flex items-center my-4 mx-4 select-none">
                    <div className="h-[1px] bg-red-500 flex-1 opacity-50" />
                    <span className="mx-2 text-xs font-bold text-red-500 uppercase flex items-center gap-1">
                        新消息
                    </span>
                    <div className="h-[1px] bg-red-500 flex-1 opacity-50" />
                </div>
            )}
            <div 
                id={`message-${message.id}`}
                className={cn(
                "group transition-colors relative -mx-4 px-4 py-0.5", 
                showHeader ? "mt-6" : "mt-0.5"
                )}
                style={isMentioned && mentionBgColor ? {
                    backgroundColor: mentionBgColor,
                } : undefined}
                onMouseEnter={(e) => {
                    if (isMentioned && mentionHoverBgColor) {
                        e.currentTarget.style.backgroundColor = mentionHoverBgColor;
                    } else {
                        e.currentTarget.style.backgroundColor = '#2e3035'; 
                    }
                }}
                onMouseLeave={(e) => {
                    if (isMentioned && mentionBgColor) {
                        e.currentTarget.style.backgroundColor = mentionBgColor;
                    } else {
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }
                }}
            >
                {/* Dynamic Left Border Indicator */}
                {isMentioned && mentionColor && (
                    <div 
                        className="absolute left-0 top-0 bottom-0 w-[2px]" 
                        style={{ backgroundColor: mentionColor }}
                    />
                )}
                {message.replyTo && (
                    <div className="flex items-center ml-[52px] mb-1 relative">
                        <div className="absolute -left-[36px] top-[14px] w-[34px] h-[12px] border-t-2 border-l-2 border-[#4f545c] rounded-tl-[6px] border-b-0 border-r-0 mb-[-2px] mt-[-6px]" />
                        <ReplyContext replyTo={message.replyTo} onClick={onScrollToMessage} />
                    </div>
                )}

                <div className="flex relative">
                    {showHeader ? (
                        <div 
                            className="w-10 h-10 rounded-full bg-gray-600 mr-4 shrink-0 overflow-hidden cursor-pointer hover:opacity-80 mt-0.5"
                            onClick={(e) => message.user && onUserClick(e, message.user, 'chat')}
                            data-user-trigger-id={message.userId}
                        >
                            {message.user?.avatarUrl ? (
                                <img src={getAvatarUrl(message.user.avatarUrl)} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white font-bold">
                                    {(message.user?.nickname || message.user?.username || '?').substring(0, 1).toUpperCase()}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-10 mr-4 shrink-0 text-[10px] text-gray-500 text-right opacity-0 group-hover:opacity-100 select-none pt-1">
                            {format(new Date(message.createdAt), 'HH:mm')}
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        {showHeader && (
                            <div className="flex items-center items-baseline mb-1">
                                <span 
                                    className="font-medium hover:underline cursor-pointer"
                                    style={{ color: getUserColor(message.userId, message.user?.roleColor) }}
                                    onClick={(e) => message.user && onUserClick(e, message.user, 'chat')}
                                    data-user-trigger-id={message.userId}
                                >
                                    {message.user?.nickname || message.user?.username}
                                </span>
                                <span className="text-xs text-gray-400 ml-1">
                                    {formatMessageDate(message.createdAt)}
                                </span>
                            </div>
                        )}
                        
                        <div className={cn("text-[#dcddde] whitespace-pre-wrap break-words leading-relaxed text-[14px]", message.isSending && "opacity-70", message.isError && "text-red-500")}>
                            <MemoizedMessageContent content={message.content} roles={roles} />
                            {message.updatedAt && message.createdAt !== message.updatedAt && (
                                <span className="text-[10px] text-gray-500 ml-1">(已编辑)</span>
                            )}
                        </div>

                        {/* Attachments */}
                        <MessageImages 
                            images={message.attachmentUrls || []}
                            onImageLoad={onImageLoad}
                        />
                        
                        {/* Pending Files (Optimistic UI) */}
                        {message.pendingFiles && message.pendingFiles.length > 0 && (
                            <div className="mt-2 space-y-2 max-w-[400px]">
                                {message.pendingFiles.map((file, i) => (
                                    <div key={i} className="bg-[#2b2d31] rounded p-2 flex items-center gap-3 border border-[#26272D]">
                                        <div className="w-10 h-10 bg-[#1e1f22] rounded overflow-hidden shrink-0">
                                            <img src={file.previewUrl} alt="preview" className="w-full h-full object-cover opacity-50" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between text-xs text-gray-300 mb-1">
                                                <span className="truncate">{file.file.name}</span>
                                                <span>{file.status === 'error' ? '失败' : (file.status === 'done' ? '完成' : '上传中...')}</span>
                                            </div>
                                            <div className="h-1 bg-[#1e1f22] rounded-full overflow-hidden">
                                                <div 
                                                    className={cn("h-full transition-all duration-300", file.status === 'error' ? "bg-red-500" : "bg-blue-500")}
                                                    style={{ width: file.status === 'done' ? '100%' : (file.status === 'uploading' ? '50%' : '0%') }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Embeds */}
                        {message.embeds && message.embeds.length > 0 && (
                            <LinkPreviewCard embeds={message.embeds} />
                        )}

                        <ReactionList 
                            reactions={message.reactions || []}
                            currentUserId={user?.id || 0}
                            onToggleReaction={(emoji) => {
                                const hasReacted = message.reactions?.some(r => r.emoji === emoji && r.userId === user?.id);
                                onReaction(message.id, emoji, !!hasReacted);
                            }}
                            className="mt-1"
                        />
                    </div>

                    {/* Actions Group (Hover) */}
                    <div className={cn(
                        "absolute right-0 top-0 -translate-y-2 bg-[#313338] border border-[#3f4147] rounded-[8px] shadow-[0_2px_4px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_8px_rgba(0,0,0,0.24)] transition-all flex items-center p-1 z-10",
                        isActionMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}>
                        <QuickReactionGroup onEmojiSelect={(emoji) => {
                            const hasReacted = message.reactions?.some(r => r.emoji === emoji && r.userId === user?.id);
                            onReaction(message.id, emoji, !!hasReacted);
                        }} />
                        <MessageReactionAction onEmojiSelect={(emoji) => {
                            const hasReacted = message.reactions?.some(r => r.emoji === emoji && r.userId === user?.id);
                            onReaction(message.id, emoji, !!hasReacted);
                        }} />
                        <ActionTooltip text="回复">
                            <button 
                                onClick={() => onReply(message)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-[#404249] rounded transition-colors text-gray-400 hover:text-gray-200" 
                            >
                                <Reply size={20} />
                            </button>
                        </ActionTooltip>
                        
                        <div className="relative">
                            <ActionTooltip text="更多">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (isActionMenuOpen) {
                                            onCloseMoreMenu();
                                        } else {
                                            onOpenMoreMenu(message.id, e.currentTarget.getBoundingClientRect());
                                        }
                                    }}
                                    className={cn(
                                        "w-8 h-8 flex items-center justify-center hover:bg-[#404249] rounded transition-colors",
                                        isActionMenuOpen ? "text-gray-200 bg-[#404249]" : "text-gray-400 hover:text-gray-200"
                                    )}
                                >
                                    <MoreHorizontal size={20} />
                                </button>
                            </ActionTooltip>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
};

export default React.memo(MessageItem);
