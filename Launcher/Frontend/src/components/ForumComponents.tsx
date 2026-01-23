import React, { useState, useEffect, useRef } from 'react';
import { api, getAvatarUrl } from '../lib/api';
import { type User, type Channel, type Post, type Message, type Member, type CommunityRole } from '../types';
import { 
    MessageSquare, 
    Plus, 
    Search, 
    Send,
    Smile,
    Trash2,
    Reply,
    X,
    Bell,
    Edit2,
    Eye,
    EyeOff,
    Link,
    MoreVertical
} from 'lucide-react';
import { cn, formatMessageDate, parseColorToRgba } from "../lib/utils";
import { format } from 'date-fns';
import EmojiPicker, { Theme, EmojiStyle } from 'emoji-picker-react';
import ReplyContext from './ReplyContext';
// import CreatePostModal from './CreatePostModal';
import ConfirmationModal from './ConfirmationModal';
import { HubConnection, HubConnectionState } from '@microsoft/signalr';
import { ReactionList, MessageReactionAction, QuickReactionGroup, trackReactionUsage, ActionTooltip } from './ReactionComponents';
import { type Reaction } from '../types';
import MessageImages from './MessageImages';
import { generateLink } from '../lib/links';
import { MessageContent } from './MessageContent';
import { AutoResizeTextarea } from './AutoResizeTextarea';

interface ForumListViewProps {
    channel: Channel;
    user: User | null;
    onPostClick: (post: Post) => void;
    connection: HubConnection | null;
    onChannelReadStatusChange?: (hasUnread: boolean) => void;
}

interface Attachment {
    id: string;
    file: File;
    previewUrl: string;
    isSpoiler: boolean;
    isUploading?: boolean;
}


export const ForumListView: React.FC<ForumListViewProps> = ({ channel, user, onPostClick, connection, onChannelReadStatusChange }) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    
    // New Post State
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isGlobalUploading, setIsGlobalUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchPosts();
    }, [channel.id]);

    useEffect(() => {
        // Discord-style Logic: Entering the channel marks it as read immediately
        if (channel.hasUnread) {
            console.log(`[ForumListView] Entering channel ${channel.id}, marking as read...`);
            
            // Mark channel as read locally immediately for UI responsiveness
            if (onChannelReadStatusChange) {
                onChannelReadStatusChange(false);
            }

            // Sync with backend
            // Use 2147483647 (Max Int) to ensure we cover all messages/posts in terms of ID sequence if needed, 
            // though for channels it's mostly about LastReadAt time.
            api.post(`/Community/channels/${channel.id}/ack`, { lastReadMessageId: 0 })
                .then(() => console.log('[ForumListView] Channel read status acked'))
                .catch(err => console.error("Failed to ack channel read status", err));
        }
    }, [channel.id]); // Only run when entering a new channel (or if channel ID changes)

    useEffect(() => {
        if (!connection) return;

        const handlePostCreated = (post: any) => {
            setPosts(prev => [post, ...prev]);
        };

        const handleReceiveMessage = (msg: Message) => {
            if (!msg.postId) return;

            setPosts(prev => {
                const index = prev.findIndex(p => p.id === msg.postId);
                if (index === -1) return prev;

                const post = prev[index];
                const updatedPost = {
                    ...post,
                    messageCount: (post.messageCount || 0) + 1,
                    lastActivityAt: msg.createdAt,
                    hasUnread: user?.id !== msg.userId
                };

                const newPosts = [...prev];
                newPosts.splice(index, 1);
                newPosts.unshift(updatedPost);
                return newPosts;
            });
        };

        connection.on('PostCreated', handlePostCreated);
        connection.on('ReceiveMessage', handleReceiveMessage);
        
        return () => {
            connection.off('PostCreated', handlePostCreated);
            connection.off('ReceiveMessage', handleReceiveMessage);
        };
    }, [connection, channel.id, user?.id]);

    const fetchPosts = async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`/Community/channels/${channel.id}/posts`);
            setPosts(res.data);
        } catch (err) {
            console.error("Failed to fetch posts", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        
        const newAttachments: Attachment[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type.startsWith('image/')) continue;
            
            if (file.size > 10 * 1024 * 1024) {
                alert(`图片 ${file.name} 超过 10MB 限制`);
                continue;
            }

            const id = Math.random().toString(36).substring(7);
            const previewUrl = URL.createObjectURL(file);
            
            newAttachments.push({
                id,
                file,
                previewUrl,
                isSpoiler: false
            });
        }

        setAttachments(prev => [...prev, ...newAttachments]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const toggleSpoiler = (id: string) => {
        setAttachments(prev => prev.map(a => 
            a.id === id ? { ...a, isSpoiler: !a.isSpoiler } : a
        ));
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        if (e.clipboardData.files.length > 0) {
            e.preventDefault();
            handleFileUpload(e.clipboardData.files);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files);
        }
    };

    const handleCreatePost = async () => {
        if (!newPostTitle.trim() || !newPostContent.trim()) return;
        
        setIsGlobalUploading(true);
        try {
            // Upload files first
            const uploadedUrls = await Promise.all(attachments.map(async (att) => {
                const formData = new FormData();
                formData.append('file', att.file);
                
                const res = await api.post(`/Upload/image?type=community&isSpoiler=${att.isSpoiler}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                return res.data.url;
            }));

            await api.post(`/Community/channels/${channel.id}/posts`, {
                title: newPostTitle,
                content: newPostContent,
                attachmentUrls: uploadedUrls
            });
            
            // Reset form
            setNewPostTitle('');
            setNewPostContent('');
            setAttachments([]);
            setIsCreating(false);
        } catch (err) {
            console.error("Failed to create post", err);
            alert("发帖失败");
        } finally {
            setIsGlobalUploading(false);
        }
    };

    const filteredPosts = posts.filter(post => 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        post.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex-1 flex flex-col h-full bg-[#313338]">
            {/* Header - Only Channel Info */}
            <div className="h-12 border-b border-[#26272D] flex items-center px-4 justify-between shrink-0">
                <div className="flex items-center gap-2 text-white font-bold">
                    <MessageSquare size={20} className="text-[#B5BAC1]" />
                    <span>{channel.name}</span>
                </div>
            </div>

            {/* Content (Messages) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-[1000px] mx-auto w-full px-[38px] py-6">
                    {/* Top Action Bar / Inline Editor */}
                    <div className="mb-6">
                        {/* Always Visible Top Bar */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="relative flex-1 bg-[#1e1f22] rounded flex items-center px-4 py-2.5 cursor-text border border-[#1e1f22] focus-within:border-[#5865F2] transition-colors hover:bg-[#2b2d31]">
                                <Search size={20} className="text-[#949BA4] mr-2" />
                                <input 
                                    type="text" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="搜索或创建帖子..."
                                    className="bg-transparent text-[#DBDEE1] placeholder-[#949BA4] outline-none w-full font-medium"
                                />
                            </div>
                            <button 
                                onClick={() => !isCreating && setIsCreating(true)}
                                disabled={isCreating}
                                className={cn(
                                    "px-4 py-2.5 rounded font-medium transition-colors flex items-center gap-2 shrink-0 shadow-sm",
                                    isCreating 
                                        ? "bg-[#35373C] text-[#949BA4] cursor-default" 
                                        : "bg-[#5865F2] hover:bg-[#4752C4] text-white"
                                )}
                            >
                                <MessageSquare size={20} fill="currentColor" className="hidden sm:block" />
                                <span className="hidden sm:inline font-bold">新帖</span>
                                <span className="sm:hidden"><Plus size={24} /></span>
                            </button>
                        </div>

                        {/* Editor Area */}
                        {isCreating && (
                            <div 
                                className="w-full bg-[#383A40] rounded-md p-4 shadow-[inset_0_12px_12px_-4px_rgba(0,0,0,0.5)] relative border border-[#404249]"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                            >
                                {/* Close Button */}
                                <button 
                                    onClick={() => setIsCreating(false)} 
                                    className="absolute top-3 right-3 text-[#949BA4] hover:text-[#DBDEE1] transition-colors z-10"
                                >
                                    <X size={20} />
                                </button>

                                {/* Title Input (No Label) */}
                                <div className="mb-2 mr-8">
                                    <input
                                        type="text"
                                        value={newPostTitle}
                                        onChange={(e) => setNewPostTitle(e.target.value)}
                                        placeholder="标题"
                                        className="w-full bg-transparent text-[#DBDEE1] text-lg font-bold placeholder-[#949BA4] outline-none px-1"
                                        autoFocus
                                    />
                                </div>
                                
                                {/* Content Input */}
                                <div className="mb-4">
                                    <AutoResizeTextarea
                                        value={newPostContent}
                                        onChange={(e) => setNewPostContent(e.target.value)}
                                        onPaste={handlePaste}
                                        placeholder="输入消息......"
                                        className="min-h-[150px] px-1"
                                    />
                                </div>

                                {/* Image Previews */}
                                {(attachments.length > 0 || isGlobalUploading) && (
                                    <div className="flex flex-wrap gap-3 mb-4 px-1">
                                        {attachments.map((attachment) => (
                                            <div key={attachment.id} className="relative group w-[80px] h-[80px] bg-[#2f3136] rounded-md overflow-hidden shrink-0">
                                                <img 
                                                    src={attachment.previewUrl} 
                                                    className={cn(
                                                        "w-full h-full object-cover transition-all", 
                                                        attachment.isSpoiler ? "blur-sm brightness-50" : ""
                                                    )} 
                                                    alt="attachment" 
                                                />
                                                
                                                {/* Spoiler Label */}
                                                {attachment.isSpoiler && (
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                        <span className="text-[10px] font-bold text-white bg-black/50 px-1.5 py-0.5 rounded">SPOILER</span>
                                                    </div>
                                                )}

                                                {/* Action Buttons (Hover) */}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-1 gap-1">
                                                     <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleSpoiler(attachment.id);
                                                        }}
                                                        className={cn(
                                                            "p-1 rounded shadow-sm transition-colors",
                                                            attachment.isSpoiler 
                                                                ? "bg-[#5865F2] text-white" 
                                                                : "bg-[#2B2D31] text-[#B5BAC1] hover:text-white"
                                                        )}
                                                        title={attachment.isSpoiler ? "取消剧透" : "标记为剧透"}
                                                    >
                                                        {attachment.isSpoiler ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setAttachments(prev => prev.filter(a => a.id !== attachment.id));
                                                        }}
                                                        className="bg-[#ED4245] text-white rounded p-1 shadow-sm hover:bg-[#c03537] transition-colors"
                                                        title="删除图片"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {/* Add Button (Square with +) */}
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isGlobalUploading}
                                            className="w-[80px] h-[80px] bg-[#2f3136] hover:bg-[#32353b] rounded-md flex items-center justify-center text-[#949BA4] hover:text-[#DBDEE1] transition-all shrink-0 border border-dashed border-[#4F545C] hover:border-[#6D6F78]"
                                            title="添加更多图片"
                                        >
                                            <Plus size={24} />
                                        </button>
                                    </div>
                                )}

                                {/* Separator (Darkened) */}
                                <div className="h-[1px] bg-[#202225] mb-3"></div>

                                {/* Bottom Toolbar */}
                                <div className="flex justify-between items-center px-1">
                                    <div className="flex items-center gap-3">
                                        {/* Hidden File Input */}
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            className="hidden" 
                                            accept="image/*" 
                                            multiple 
                                            onChange={(e) => handleFileUpload(e.target.files)} 
                                        />
                                        
                                        {/* Tag Selector */}
                                        <button className="bg-[#2f3136] hover:bg-[#32353b] text-[#949BA4] hover:text-[#DBDEE1] px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors">
                                            <span className="text-lg leading-none">#</span>
                                            <span>选择标签</span>
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {/* Upload Icon Button */}
                                         <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-[#B5BAC1] p-1 h-8 flex items-center group cursor-pointer"
                                            title="上传文件"
                                        >
                                            <Plus size={24} className="bg-[#B5BAC1] text-[#383a40] rounded-full p-0.5 transition-all duration-200 group-hover:bg-[#D1D5D9] group-hover:text-black group-hover:scale-110" />
                                        </button>
                                        
                                        {/* Post Button */}
                                        <button 
                                            onClick={handleCreatePost}
                                            disabled={!newPostTitle.trim() || !newPostContent.trim() || isGlobalUploading || attachments.some(a => a.isUploading)}
                                            className="bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-1.5 rounded text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
                                        >
                                            <Send size={14} />
                                            发布
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center pt-10">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : filteredPosts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-[#949BA4] gap-2">
                            <MessageSquare size={48} />
                            <div className="font-bold">这里还没有帖子</div>
                            <div className="text-sm">成为第一个发帖的人吧！</div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {filteredPosts.map(post => {
                                const images = [
                                    ...(post.embeds?.filter(e => e.type === 'photo').map(e => e.url) || []),
                                    ...(post.attachmentUrls || [])
                                ];
                                const hasImage = images.length > 0;
                                return (
                                <div 
                                    key={post.id}
                                    onClick={() => onPostClick(post)}
                                    className="bg-[#313338] hover:bg-[#36383e] rounded-lg cursor-pointer transition-all group border border-[#404249] shadow-[0_4px_8px_rgba(0,0,0,0.2)] flex overflow-hidden min-h-[140px]"
                                >
                                    {hasImage && (
                                        <div className="w-[220px] shrink-0 bg-[#2b2d31] relative border-r border-[#26272D]">
                                            <img 
                                                src={getAvatarUrl(images[0])} 
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                alt="thumbnail"
                                            />
                                        </div>
                                    )}

                                    <div className={cn("flex-1 min-w-0 flex flex-col p-4", !hasImage && "flex-row gap-4")}>
                                        {!hasImage && (
                                            <div className="hidden sm:flex flex-col items-center gap-1 mt-1 shrink-0">
                                                <div className="w-10 h-10 rounded-full bg-[#2b2d31] flex items-center justify-center text-[#949BA4]">
                                                    <MessageSquare size={20} />
                                                </div>
                                                <span className="text-[10px] text-[#949BA4] font-bold">Post</span>
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0 flex flex-col">
                                            {/* Top Row: Title + Time */}
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <h3 className={cn(
                                                        "font-bold text-lg transition-colors line-clamp-1",
                                                        post.hasUnread ? "text-white" : "text-[#949BA4] group-hover:text-[#DBDEE1]"
                                                    )}>
                                                        {post.title}
                                                    </h3>
                                                </div>
                                                <span className="text-xs text-[#949BA4] shrink-0 pt-1">
                                                    {format(new Date(post.lastActivityAt), 'HH:mm')}
                                                </span>
                                            </div>
                                            
                                            {/* Content */}
                                            <div className="text-[#949BA4] text-sm line-clamp-3 mb-auto font-medium">
                                                {post.content}
                                            </div>

                                            {/* Bottom Info Row */}
                                            <div className="flex items-center justify-between text-xs text-[#949BA4] mt-3">
                                                <div className="flex items-center gap-2">
                                                    <img 
                                                        src={getAvatarUrl(post.author?.avatarUrl)} 
                                                        className="w-4 h-4 rounded-full" 
                                                    />
                                                    <span style={{ color: post.author?.roleColor || '#949BA4' }} className="font-medium">
                                                        {post.author?.nickname || post.author?.username}
                                                    </span>
                                                    <span>•</span>
                                                    <span>发布于 {format(new Date(post.createdAt), 'MM/dd')}</span>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <MessageSquare size={14} />
                                                    <span>{post.messageCount}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface PostThreadViewProps {
    channel: Channel;
    post: Post;
    user: User | null;
    onBack: () => void;
    connection: HubConnection | null;
    members?: Member[];
    roles?: CommunityRole[];
    onAck?: (lastReadMessageId: number) => void;
}

export const PostThreadView: React.FC<PostThreadViewProps> = ({ channel, post, user, onBack, connection, members = [], roles = [], onAck }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [postReactions, setPostReactions] = useState<Reaction[]>([]); // post.reactions || []
    const [inputText, setInputText] = useState('');
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    const [deletingMessage, setDeletingMessage] = useState<Message | null>(null);
    const [isDeletingPost, setIsDeletingPost] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
    
    // Upload & Emoji State
    const [pendingFiles, setPendingFiles] = useState<{ file: File, previewUrl: string, isSpoiler: boolean }[]>([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const emojiButtonRef = useRef<HTMLButtonElement>(null);

    // Permission Helper
    const canManageMessage = (targetUserId: number) => {
        if (!user) return false;
        if (user.id === targetUserId) return true; // Author

        // Check Admin/Owner AccessLevel
        if ((user.accessLevel ?? 0) >= 3) return true;

        // Check Permissions (ManageMessages = 4, Administrator = 256)
        const currentMember = members.find(m => m.id === user.id);
        if (!currentMember) return false;

        for (const roleId of (currentMember.roles || [])) {
            const role = roles.find(r => r.id === roleId);
            if (role) {
                if ((role.permissions & 4) === 4) return true;
                if ((role.permissions & 256) === 256) return true;
            }
        }

        return false;
    };

    // Track the initial read state to render the "New Messages" divider correctly
    // We only want to set this once when entering the thread
    const [initialReadMessageId] = useState(post.lastReadMessageId || 0);
    const lastAckedIdRef = useRef(post.lastReadMessageId || 0);

    useEffect(() => {
        fetchMessages();
    }, [post.id]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        // Check if we are near bottom (within 100px)
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        
        if (isNearBottom && messages.length > 0) {
            const latestMessage = messages[messages.length - 1];
            if (latestMessage.id > lastAckedIdRef.current) {
                lastAckedIdRef.current = latestMessage.id;
                api.post(`/Community/posts/${post.id}/ack`, { lastReadMessageId: latestMessage.id })
                    .then(() => onAck?.(latestMessage.id))
                    .catch(console.error);
            }
        }
    };

    // Auto-ack if content fits on screen (no scroll)
    useEffect(() => {
        if (!isLoading && messages.length > 0) {
             const container = document.getElementById('post-thread-container');
             if (container && container.scrollHeight <= container.clientHeight) {
                 const latestMessage = messages[messages.length - 1];
                 if (latestMessage.id > lastAckedIdRef.current) {
                    lastAckedIdRef.current = latestMessage.id;
                    api.post(`/Community/posts/${post.id}/ack`, { lastReadMessageId: latestMessage.id })
                        .then(() => onAck?.(latestMessage.id))
                        .catch(console.error);
                 }
             }
        }
    }, [messages, isLoading, post.id]);

    useEffect(() => {
        if (!connection) return;

        const handleReceiveMessage = (msg: any) => {
            // Only add if it belongs to this post
            if (msg.postId === post.id) {
                setMessages(prev => {
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            }
        };

        const handlePostReactionAdded = ({ postId, userId, emoji }: any) => {
            if (postId === post.id) {
                setPostReactions(prev => {
                    if (prev.some(r => r.userId === userId && r.emoji === emoji)) return prev;
                    return [...prev, { postId, userId, emoji, messageId: 0 }];
                });
            }
        };

        const handlePostReactionRemoved = ({ postId, userId, emoji }: any) => {
            if (postId === post.id) {
                setPostReactions(prev => prev.filter(r => !(r.userId === userId && r.emoji === emoji)));
            }
        };

        const handleMessageReactionAdded = ({ messageId, userId, emoji }: any) => {
            setMessages(prev => prev.map(m => {
                if (m.id === messageId) {
                    const exists = m.reactions?.some(r => r.userId === userId && r.emoji === emoji);
                    if (exists) return m;
                    return { ...m, reactions: [...(m.reactions || []), { messageId, userId, emoji }] };
                }
                return m;
            }));
        };

        const handleMessageReactionRemoved = ({ messageId, userId, emoji }: any) => {
            setMessages(prev => prev.map(m => {
                if (m.id === messageId) {
                    return { ...m, reactions: (m.reactions || []).filter(r => !(r.userId === userId && r.emoji === emoji)) };
                }
                return m;
            }));
        };

        connection.on('ReceiveMessage', handleReceiveMessage);
        connection.on('PostReactionAdded', handlePostReactionAdded);
        connection.on('PostReactionRemoved', handlePostReactionRemoved);
        connection.on('MessageReactionAdded', handleMessageReactionAdded);
        connection.on('MessageReactionRemoved', handleMessageReactionRemoved);

        return () => {
            connection.off('ReceiveMessage', handleReceiveMessage);
            connection.off('PostReactionAdded', handlePostReactionAdded);
            connection.off('PostReactionRemoved', handlePostReactionRemoved);
            connection.off('MessageReactionAdded', handleMessageReactionAdded);
            connection.off('MessageReactionRemoved', handleMessageReactionRemoved);
        };
    }, [connection, post.id]);

    const prevMessagesLength = useRef(0);

    const handleScrollToMessage = (messageId: number) => {
        // In forum view, messages might not have unique IDs in DOM if not carefully managed
        // But we can try to find by ID
        // The messages in PostThreadView should have unique IDs
        const element = document.getElementById(`forum-message-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
             element.classList.add('bg-[#3f4147]', 'animate-pulse');
            setTimeout(() => {
                element.classList.remove('bg-[#3f4147]', 'animate-pulse');
            }, 2000);
        }
    };

    useEffect(() => {
        if (isLoading || messages.length > prevMessagesLength.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
        prevMessagesLength.current = messages.length;
    }, [messages, isLoading]);

    const fetchMessages = async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`/Community/posts/${post.id}/messages`);
            setMessages(res.data);
        } catch (err) {
            console.error("Failed to fetch messages", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpload = (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert("只能上传图片文件");
            return;
        }
        
        const previewUrl = URL.createObjectURL(file);
        setPendingFiles(prev => [...prev, { file, previewUrl, isSpoiler: false }]);
    };

    const toggleSpoiler = (index: number) => {
        setPendingFiles(prev => prev.map((item, i) => 
            i === index ? { ...item, isSpoiler: !item.isSpoiler } : item
        ));
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleUpload(e.target.files[0]);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                const file = items[i].getAsFile();
                if (file) handleUpload(file);
            }
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const removeAttachment = (index: number) => {
        setPendingFiles(prev => {
            const newFiles = [...prev];
            URL.revokeObjectURL(newFiles[index].previewUrl);
            newFiles.splice(index, 1);
            return newFiles;
        });
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                emojiPickerRef.current &&
                !emojiPickerRef.current.contains(event.target as Node) &&
                emojiButtonRef.current &&
                !emojiButtonRef.current.contains(event.target as Node)
            ) {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((!inputText.trim() && pendingFiles.length === 0) || !connection || !user) return;

        if (editingMessageId) {
            await handleEditMessage(inputText.trim());
            return;
        }

        const content = inputText.trim();
        const filesToUpload = [...pendingFiles];
        const tempId = Date.now();

        // Clear input immediately (Optimistic UI)
        setInputText('');
        setPendingFiles([]);
        setReplyTo(null);

        const optimisticMessage: Message = {
            id: tempId,
            channelId: channel.id,
            userId: user.id,
            content: content,
            createdAt: new Date().toISOString(),
            user: {
                id: user.id,
                username: user.username,
                nickname: user.nickname,
                avatarUrl: user.avatarUrl,
                accessLevel: user.accessLevel || 0,
                points: user.points || 0
            },
            isSending: true,
            postId: post.id,
            replyTo: replyTo || undefined,
            pendingFiles: filesToUpload.map(f => ({
                file: f.file,
                previewUrl: f.previewUrl,
                progress: 0,
                status: 'pending'
            }))
        };

        setMessages(prev => [...prev, optimisticMessage]);

        // Background Upload & Send
        try {
            let uploadedUrls: string[] = [];
            
            if (filesToUpload.length > 0) {
                 // Update status to uploading
                setMessages(prev => prev.map(m => {
                     if (m.id === tempId && m.pendingFiles) {
                         return {
                             ...m,
                             pendingFiles: m.pendingFiles.map(pf => ({ ...pf, status: 'uploading' }))
                         };
                     }
                     return m;
                }));

                // Parallel Upload
                const uploadPromises = filesToUpload.map(async (item, index) => {
                    const formData = new FormData();
                    formData.append('file', item.file);
                    
                    try {
                        const res = await api.post(`/Upload/image?type=community&isSpoiler=${item.isSpoiler}`, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        
                        // Update progress (done)
                        setMessages(prev => prev.map(m => {
                            if (m.id === tempId && m.pendingFiles) {
                                const newPending = [...m.pendingFiles];
                                newPending[index] = { ...newPending[index], status: 'done', progress: 100 };
                                return { ...m, pendingFiles: newPending };
                            }
                            return m;
                        }));

                        return res.data.url;
                    } catch (err) {
                        console.error("Single file upload failed", err);
                         setMessages(prev => prev.map(m => {
                            if (m.id === tempId && m.pendingFiles) {
                                const newPending = [...m.pendingFiles];
                                newPending[index] = { ...newPending[index], status: 'error' };
                                return { ...m, pendingFiles: newPending };
                            }
                            return m;
                        }));
                        throw err;
                    }
                });

                uploadedUrls = await Promise.all(uploadPromises);
            }

            // Send via SignalR
            if (connection.state === HubConnectionState.Connected) {
                const attachmentUrlsJson = uploadedUrls.length > 0 ? JSON.stringify(uploadedUrls) : null;
                await connection.invoke("SendMessage", 
                    channel.id.toString(), 
                    content, 
                    replyTo?.id || null, 
                    attachmentUrlsJson, 
                    post.id
                );
                
                // Remove optimistic message to avoid duplication when real message arrives
                setMessages(prev => prev.filter(m => m.id !== tempId));
            } else {
                throw new Error("Not connected to server");
            }
        } catch (err) {
            console.error("Failed to send message", err);
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, isSending: false, isError: true } : m));
        }
    };

    const handleEditMessage = async (newContent: string) => {
        if (!editingMessageId) return;
        
        try {
            // Optimistic update
            setMessages(prev => prev.map(m => 
                m.id === editingMessageId ? { ...m, content: newContent } : m
            ));

            await api.put(`/Community/messages/${editingMessageId}`, {
                content: newContent
            });

            setEditingMessageId(null);
            setInputText('');
        } catch (err) {
            console.error("Failed to edit message", err);
            alert("编辑失败");
        }
    };

    const startEditing = (msg: Message) => {
        setEditingMessageId(msg.id);
        setInputText(msg.content);
        setReplyTo(null); // Clear reply when editing
        inputRef.current?.focus();
    };

    const cancelEditing = () => {
        setEditingMessageId(null);
        setInputText('');
    };

    const handleDeleteMessage = async () => {
        if (!deletingMessage) return;
        try {
            await api.delete(`/Community/messages/${deletingMessage.id}`);
            setMessages(prev => prev.filter(m => m.id !== deletingMessage.id));
            setDeletingMessage(null);
        } catch (err) {
            console.error("Failed to delete message", err);
            alert("删除失败");
        }
    };

    const handleDeletePost = async () => {
        try {
            await api.delete(`/Community/posts/${post.id}`);
            onBack(); // Go back to list
        } catch (err) {
            console.error("Failed to delete post", err);
            alert("删除帖子失败");
        }
    };

    const handleReply = (msg: Message) => {
        setReplyTo(msg);
        inputRef.current?.focus();
    };

    const handleShare = () => {
        const link = generateLink('post', post.id);
        navigator.clipboard.writeText(link);
    };

    const handleTogglePostReaction = async (emoji: string) => {
        if (!user || !connection) return;
        
        const hasReacted = postReactions.some(r => r.userId === user.id && r.emoji === emoji);
        
        try {
            if (hasReacted) {
                await connection.invoke("RemovePostReaction", post.id, emoji);
            } else {
                await connection.invoke("AddPostReaction", post.id, emoji);
            }
        } catch (err) {
            console.error("Failed to toggle post reaction", err);
        }
    };

    const handleToggleMessageReaction = async (messageId: number, emoji: string) => {
        if (!user || !connection) return;
        
        const msg = messages.find(m => m.id === messageId);
        if (!msg) return;
        
        const hasReacted = msg.reactions?.some(r => r.userId === user.id && r.emoji === emoji);
        
        try {
            if (hasReacted) {
                await connection.invoke("RemoveReaction", messageId, emoji);
            } else {
                await connection.invoke("AddReaction", messageId, emoji);
                trackReactionUsage(emoji);
            }
        } catch (err) {
            console.error("Failed to toggle message reaction", err);
        }
    };

    const canDeletePost = canManageMessage(post.author?.id || 0);

    return (
        <div className="flex-1 flex flex-col h-full bg-[#313338] relative">
            {/* Top Channel Info Bar */}
            <div className="h-8 flex items-center px-4 gap-2 text-xs text-[#949BA4] select-none border-b border-[#26272D]/50 shrink-0">
                <span className="font-bold text-lg mr-1">#</span>
                <span className="font-bold hover:underline cursor-pointer">{channel.name}</span>
                {channel.description && (
                    <>
                        <div className="w-[1px] h-3 bg-[#3F4147] mx-2"></div>
                        <span className="truncate">{channel.description}</span>
                    </>
                )}
            </div>

            {/* Scrollable Content Area */}
            <div 
                id="post-thread-container"
                className="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden"
                onScroll={handleScroll}
            >
                <div className="max-w-[1000px] mx-auto w-full px-6 pb-4">
                    {/* Main Header with Title */}
                    <div className="py-4 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                            <div className="mt-1">
                                <MessageSquare size={24} className="text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-white leading-tight break-all">{post.title}</h1>
                        </div>
                        <button 
                            onClick={onBack}
                            className="text-[#949BA4] hover:text-white transition-colors p-1"
                        >
                            <X size={28} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Date Separator */}
                    <div className="flex items-center gap-4 my-2 select-none">
                        <div className={cn("h-[1px] flex-1 transition-colors", post.hasUnread ? "bg-red-500" : "bg-[#3F4147]")}></div>
                        <span className={cn("text-xs font-medium transition-colors", post.hasUnread ? "text-red-500" : "text-[#949BA4]")}>
                            {format(new Date(post.createdAt), 'yyyy年MM月dd日')}
                        </span>
                        <div className={cn("h-[1px] flex-1 transition-colors", post.hasUnread ? "bg-red-500" : "bg-[#3F4147]")}></div>
                    </div>

                    {/* OP Post Content */}
                    <div className="mt-4 group">
                        {/* Author Row */}
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <img 
                                        src={getAvatarUrl(post.author?.avatarUrl)} 
                                        className="w-10 h-10 rounded-full border-2 border-[#FFD700]" 
                                        alt="avatar"
                                    />
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-[#F23F42] hover:underline cursor-pointer">
                                        {post.author?.nickname || post.author?.username}
                                    </span>
                                    <span className="text-[#949BA4] text-sm">
                                        @{post.author?.username}
                                    </span>
                                    <span className="bg-[#5865F2] text-white text-[10px] px-1 rounded font-bold">LZ</span>
                                    <span className="text-[#949BA4] text-xs ml-1">
                                        {formatMessageDate(post.createdAt)}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity relative">
                            <QuickReactionGroup onEmojiSelect={handleTogglePostReaction} />
                            <MessageReactionAction onEmojiSelect={handleTogglePostReaction} />
                            <button
                                onClick={() => canDeletePost && setShowMenu(!showMenu)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-[#404249] rounded transition-colors text-[#949BA4] hover:text-white"
                            >
                                <MoreVertical size={20} />
                            </button>
                                {showMenu && canDeletePost && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                                        <div className="absolute right-0 top-full mt-1 bg-[#2B2D31] border border-[#1e1f22] rounded shadow-lg z-50 py-1 min-w-[100px] flex flex-col overflow-hidden">
                                            <button 
                                                onClick={() => { setShowMenu(false); /* TODO: Implement Edit */ }} 
                                                className="flex items-center gap-2 px-3 py-2 text-sm text-[#949BA4] hover:bg-[#404249] hover:text-[#DBDEE1] w-full text-left transition-colors"
                                            >
                                                <Edit2 size={14} />
                                                <span>编辑</span>
                                            </button>
                                            <button 
                                                onClick={() => { setShowMenu(false); setIsDeletingPost(true); }}
                                                className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-[#404249] hover:text-red-300 w-full text-left transition-colors"
                                            >
                                                <Trash2 size={14} />
                                                <span>删除</span>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Post Text */}
                        <div className="pl-[52px] text-[#DBDEE1] whitespace-pre-wrap break-words leading-relaxed text-[14px]">
                            {post.content}
                        </div>

                        {/* Images */}
                        <div className="pl-[52px] mt-1">
                            <MessageImages images={[
                                ...(post.embeds?.filter(e => e.type === 'photo').map(e => e.url) || []),
                                ...(post.attachmentUrls || [])
                            ]} />
                        </div>

                        {/* Bottom Actions Row */}
                        <div className="pl-[52px] mt-4 flex items-center justify-between">
                            <ReactionList 
                                reactions={postReactions}
                                currentUserId={user?.id || 0}
                                onToggleReaction={handleTogglePostReaction}
                                className="flex-1"
                            />
                            
                            <div className="flex items-center gap-2 ml-4">
                                <ActionTooltip text="关注帖子">
                                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2B2D31] hover:bg-[#3F4147] rounded text-[#949BA4] hover:text-white transition-colors text-xs font-medium">
                                        <Bell size={14} />
                                        关注
                                    </button>
                                </ActionTooltip>
                                <ActionTooltip text="复制链接">
                                    <button 
                                        onClick={handleShare}
                                        className="p-1.5 bg-[#2B2D31] hover:bg-[#3F4147] rounded text-[#949BA4] hover:text-white transition-colors"
                                    >
                                        <Link size={16} />
                                    </button>
                                </ActionTooltip>
                            </div>
                        </div>
                    </div>

                    {/* Replies Divider */}
                    <div className="h-[1px] bg-[#26272D] my-6 ml-[52px]"></div>

                    {/* Replies List */}
                    <div className="pb-4">
                        {messages.map((msg, index) => {
                             const isSequent = index > 0 && messages[index - 1].userId === msg.userId && 
                                (new Date(msg.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() < 5 * 60 * 1000) && !msg.replyTo;
                             const canManage = canManageMessage(msg.userId);

                             // Check if mentioned or replied to
                             // const currentMember = members.find(m => m.id === user?.id);
                             
                             // Determine Mention Type and Color
                             let mentionColor: string | null = null;
                             let isMentioned = false;

                             // 1. Check for Role Mentions (Priority: Role Color > Everyone Yellow)
                             if (roles) {
                                 for (const role of roles) {
                                     if (msg.content.toLowerCase().includes(`@${role.name.toLowerCase()}`)) {
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
                             if (!isMentioned && msg.content.includes('@everyone')) {
                                 isMentioned = true;
                                 mentionColor = '#faa61a';
                             }

                             // 3. Check for Direct Mention
                             if (!isMentioned && user) {
                                 const isDirect = (
                                     (msg.replyTo?.userId === user.id) || 
                                     msg.content.toLowerCase().includes(`@${user.username.toLowerCase()}`) || 
                                     (user.nickname && msg.content.toLowerCase().includes(`@${user.nickname.toLowerCase()}`))
                                 );
                                 if (isDirect) {
                                     isMentioned = true;
                                     mentionColor = '#faa61a';
                                 }
                             }

                             const mentionBgColor = mentionColor 
                                 ? parseColorToRgba(mentionColor, 0.1) 
                                 : null;
                             
                             const mentionHoverBgColor = mentionColor
                                 ? parseColorToRgba(mentionColor, 0.15) 
                                 : null;

                             const isNewMessageDivider = initialReadMessageId > 0 && 
                                msg.id > initialReadMessageId && 
                                (index === 0 || messages[index - 1].id <= initialReadMessageId) &&
                                msg.userId !== user?.id;

                             return (
                                <React.Fragment key={msg.id}>
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
                                        id={`forum-message-${msg.id}`}
                                        className={cn(
                                            "group -mx-6 px-6 py-0.5 relative hover:bg-[#2e3035]/40", 
                                        isSequent ? "mt-0.5" : "mt-6"
                                    )}
                                    style={isMentioned && mentionBgColor ? {
                                        backgroundColor: mentionBgColor
                                    } : undefined}
                                    onMouseEnter={(e) => {
                                        if (isMentioned && mentionHoverBgColor) {
                                            e.currentTarget.style.backgroundColor = mentionHoverBgColor;
                                        } else {
                                            e.currentTarget.style.backgroundColor = 'rgba(46, 48, 53, 0.4)'; // #2e3035 with 0.4 opacity
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
                                    {msg.replyTo && (
                                        <div className="flex items-center ml-[52px] mb-1 relative">
                                            <div className="absolute -left-[36px] top-1/2 w-[34px] h-[12px] border-t-2 border-l-2 border-[#4f545c] rounded-tl-[6px] border-b-0 border-r-0 mb-[-2px] mr-2" />
                                            <ReplyContext replyTo={msg.replyTo} onClick={handleScrollToMessage} />
                                        </div>
                                    )}

                                    <div className="flex gap-4 relative">
                                        <div className="shrink-0 w-10 z-10">
                                        {!isSequent ? (
                                            <img 
                                                src={getAvatarUrl(msg.user?.avatarUrl)} 
                                                className="w-10 h-10 rounded-full cursor-pointer hover:opacity-80 transition-opacity" 
                                            />
                                        ) : (
                                            <div className="text-[10px] text-[#949BA4] opacity-0 group-hover:opacity-100 text-right pr-1 select-none mt-1.5 hidden group-hover:block">
                                                {format(new Date(msg.createdAt), 'HH:mm')}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0 z-10">
                                        {!isSequent && (
                                            <div className="flex items-center gap-2 mb-1">
                                                <span 
                                                    className="font-medium text-white hover:underline cursor-pointer"
                                                    style={{ color: msg.user?.roleColor }}
                                                >
                                                    {msg.user?.nickname || msg.user?.username}
                                                </span>
                                                {msg.userId === post.author?.id && (
                                                    <span className="bg-[#5865F2] text-white text-[10px] px-1 rounded font-bold">LZ</span>
                                                )}
                                                <span className="text-xs text-[#949BA4]">
                                                    {formatMessageDate(msg.createdAt)}
                                                </span>
                                            </div>
                                        )}
                                        
                                        <div className={cn("text-[#DBDEE1] whitespace-pre-wrap break-words leading-relaxed text-[14px]", !isSequent && "")}>
                                            <MessageContent content={msg.content} roles={roles} />
                                        </div>
                                        
                                        {/* Images */}
                                        <MessageImages 
                                            images={msg.attachmentUrls || []} 
                                            onImageLoad={() => {
                                                if (index === messages.length - 1) {
                                                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                                                }
                                            }}
                                        />
                                        
                                        {/* Pending Files (Optimistic UI) */}
                                        {msg.pendingFiles && msg.pendingFiles.length > 0 && (
                                            <div className="mt-2 space-y-2 max-w-[400px]">
                                                {msg.pendingFiles.map((file, i) => (
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
                                        
                                        <ReactionList 
                                            reactions={msg.reactions || []}
                                            currentUserId={user?.id || 0}
                                            onToggleReaction={(emoji) => handleToggleMessageReaction(msg.id, emoji)}
                                            className="mt-1"
                                        />
                                    </div>

                                    {/* Message Actions */}
                                    <div className="absolute right-4 top-2 bg-[#313338] border border-[#3f4147] rounded-[8px] shadow-[0_2px_4px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_8px_rgba(0,0,0,0.24)] flex items-center p-1 opacity-0 group-hover:opacity-100 transition-all z-10">
                                        <QuickReactionGroup onEmojiSelect={(emoji) => handleToggleMessageReaction(msg.id, emoji)} />
                                        <MessageReactionAction onEmojiSelect={(emoji) => handleToggleMessageReaction(msg.id, emoji)} />
                                        <ActionTooltip text="回复">
                                            <button onClick={() => handleReply(msg)} className="w-8 h-8 flex items-center justify-center hover:bg-[#404249] rounded transition-colors text-gray-400 hover:text-white">
                                                <Reply size={20} />
                                            </button>
                                        </ActionTooltip>
                                        <ActionTooltip text="复制链接">
                                            <button 
                                                onClick={() => {
                                                    const link = generateLink('post', post.id, msg.id);
                                                    navigator.clipboard.writeText(link);
                                                }}
                                                className="w-8 h-8 flex items-center justify-center hover:bg-[#404249] rounded transition-colors text-gray-400 hover:text-white"
                                            >
                                                <Link size={20} />
                                            </button>
                                        </ActionTooltip>
                                        {canManage && (
                                            <>
                                                <ActionTooltip text="编辑">
                                                    <button onClick={() => startEditing(msg)} className="w-8 h-8 flex items-center justify-center hover:bg-[#404249] rounded transition-colors text-gray-400 hover:text-white">
                                                        <Edit2 size={20} />
                                                    </button>
                                                </ActionTooltip>
                                                <ActionTooltip text="删除">
                                                    <button onClick={() => setDeletingMessage(msg)} className="w-8 h-8 flex items-center justify-center hover:bg-[#404249] rounded transition-colors text-gray-400 hover:text-red-400">
                                                        <Trash2 size={20} />
                                                    </button>
                                                </ActionTooltip>
                                            </>
                                        )}
                                    </div>
                                    </div>
                                </div>
                            </React.Fragment>
                             );
                        })}
                    </div>
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Bottom Reply Bar */}
            <div className="bg-[#313338] shrink-0 border-t border-[#26272D]">
                <div className="max-w-[1000px] mx-auto w-full p-4">
                    {/* Attachments Preview */}
                    {pendingFiles.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto py-2 px-1 mb-2 bg-[#2b2d31] rounded-lg">
                            {pendingFiles.map((item, index) => (
                                <div key={index} className="relative group shrink-0 w-24 h-24 bg-[#1e1f22] rounded overflow-hidden border border-[#1e1f22]">
                                    <img 
                                        src={item.previewUrl} 
                                        alt="attachment" 
                                        className={cn(
                                            "w-full h-full object-cover transition-all", 
                                            item.isSpoiler ? "blur-sm brightness-50" : ""
                                        )} 
                                    />
                                    
                                    {/* Spoiler Label */}
                                    {item.isSpoiler && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <span className="text-[10px] font-bold text-white bg-black/50 px-1.5 py-0.5 rounded">SPOILER</span>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-end p-1 gap-1">
                                        <button 
                                            onClick={() => removeAttachment(index)}
                                            className="bg-[#ED4245] text-white p-1 rounded hover:bg-[#c03537] transition-colors shadow-sm"
                                            title="删除图片"
                                        >
                                            <X size={14} />
                                        </button>
                                        <button 
                                            onClick={() => toggleSpoiler(index)}
                                            className={cn(
                                                "p-1 rounded shadow-sm transition-colors mt-auto",
                                                item.isSpoiler 
                                                    ? "bg-[#5865F2] text-white" 
                                                    : "bg-[#2B2D31] text-[#B5BAC1] hover:text-white"
                                            )}
                                            title={item.isSpoiler ? "取消剧透" : "标记为剧透"}
                                        >
                                            {item.isSpoiler ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div 
                        className="bg-[#383A40] rounded-lg p-2 flex items-center gap-2 shadow-inner"
                        onPaste={handlePaste}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileSelect} 
                            className="hidden" 
                            accept="image/*"
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[#B5BAC1] bg-[#404249] p-1.5 rounded-full transition-all duration-200 hover:bg-[#D1D5D9] hover:text-[#383a40] hover:scale-110 cursor-pointer"
                            title="上传图片"
                        >
                            <Plus size={16} />
                        </button>
                        
                        {replyTo && (
                            <div className="flex items-center gap-1 bg-[#2f3136] px-2 py-0.5 rounded text-xs text-[#DBDEE1] whitespace-nowrap">
                                <span>@{replyTo.user?.nickname || replyTo.user?.username || 'Unknown'}</span>
                                <button onClick={() => setReplyTo(null)} className="hover:text-white"><X size={12} /></button>
                            </div>
                        )}
                        
                        {editingMessageId && (
                             <div className="flex items-center gap-1 bg-[#2f3136] px-2 py-0.5 rounded text-xs text-[#DBDEE1] whitespace-nowrap">
                                <span className="text-yellow-400">正在编辑</span>
                                <button onClick={cancelEditing} className="hover:text-white"><X size={12} /></button>
                            </div>
                        )}

                        <AutoResizeTextarea
                            ref={inputRef}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e);
                                }
                                if (e.key === 'Escape' && editingMessageId) {
                                    cancelEditing();
                                }
                            }}
                            placeholder={editingMessageId ? "编辑消息..." : `回复帖子 #${post.title}`}
                            className="flex-1 text-sm font-medium min-h-[24px]"
                            maxHeight="300px"
                        />
                        
                        <div className="relative">
                            {showEmojiPicker && (
                                <div className="absolute bottom-full right-0 mb-2 z-50 shadow-xl rounded-lg overflow-hidden" ref={emojiPickerRef}>
                                    <EmojiPicker
                                        theme={Theme.DARK}
                                        emojiStyle={EmojiStyle.NATIVE}
                                        onEmojiClick={(emojiData) => {
                                            setInputText(prev => prev + emojiData.emoji);
                                        }}
                                    />
                                </div>
                            )}
                            <button 
                                ref={emojiButtonRef}
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className="text-[#B5BAC1] hover:text-[#D1D4D7] p-1.5"
                            >
                                <Smile size={20} />
                            </button>
                        </div>

                        <button 
                            onClick={(e) => handleSendMessage(e)}
                            disabled={!inputText.trim() && pendingFiles.length === 0} 
                            className="text-[#B5BAC1] hover:text-[#5865F2] p-1.5 disabled:opacity-50 transition-colors"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <ConfirmationModal
                isOpen={!!deletingMessage}
                onClose={() => setDeletingMessage(null)}
                onConfirm={handleDeleteMessage}
                title="删除消息"
                message="确定要删除这条消息吗？此操作无法撤销。"
                confirmText="删除"
                isDangerous={true}
            />
             <ConfirmationModal
                isOpen={isDeletingPost}
                onClose={() => setIsDeletingPost(false)}
                onConfirm={handleDeletePost}
                title="删除帖子"
                message="确定要删除这个帖子吗？所有回复也将被删除。此操作无法撤销。"
                confirmText="删除帖子"
                isDangerous={true}
            />
        </div>
    );
};
