import React, { useState, useEffect, useRef } from 'react';
import { api, getAvatarUrl } from '../lib/api';
import { type User, type Channel, type Post, type Message, type Member, type CommunityRole } from '../types';
import { 
    MessageSquare, 
    Plus, 
    Search, 
    Clock, 
    ChevronLeft,
    Send,
    Smile,
    Image as ImageIcon,
    MoreHorizontal,
    Trash2,
    Reply,
    Share2,
    X,
    UploadCloud,
    MoreVertical,
    Link,
    Bell,
    Edit,
    Edit2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import EmojiPicker, { type EmojiClickData, Theme } from 'emoji-picker-react';
import CreatePostModal from './CreatePostModal';
import ConfirmationModal from './ConfirmationModal';
import { HubConnection } from '@microsoft/signalr';
import { ReactionList, MessageReactionAction, QuickReactionGroup, trackReactionUsage, ActionTooltip } from './ReactionComponents';
import { type Reaction } from '../types';

interface ForumListViewProps {
    channel: Channel;
    user: User | null;
    onPostClick: (post: Post) => void;
    connection: HubConnection | null;
}

interface Attachment {
    id: string;
    url: string;
    isUploading: boolean;
}

const ImageGrid: React.FC<{ images: string[] }> = ({ images }) => {
    if (!images || images.length === 0) return null;

    const getGridClass = (count: number) => {
        if (count === 1) return "grid-cols-1 max-w-[60%]";
        if (count === 2) return "grid-cols-2 max-w-[70%]";
        // 3 images: Left large square, Right 2 stacked rectangles
        if (count === 3) return "grid-cols-2 max-w-[70%]"; 
        if (count === 4) return "grid-cols-2 grid-rows-2 max-w-[70%]";
        if (count >= 5) return "grid-cols-4 max-w-[80%]"; // 5+ layout
        return "grid-cols-3 max-w-[70%]";
    };

    const getImageStyle = (index: number, count: number) => {
        if (count === 3) {
            // First image: Left column, full height (span 2 rows implicitly by grid-auto-rows or flex), 
            // but we are using grid. Let's force grid-rows-2 on the container for 3 items if we want exact control.
            // Actually, for 3 items in grid-cols-2:
            // Item 1: row-span-2 -> Left column
            // Item 2: Right top
            // Item 3: Right bottom
            if (index === 0) return "row-span-2 aspect-square h-full";
            return "aspect-[2/1]"; // Right images are wider (rectangles)
        }
        if (count >= 5 && index === 0) return "col-span-4 aspect-video"; // Top large image
        return "aspect-square";
    };

    // For 5+ images, we follow "Top 1, Bottom 4" pattern roughly
    // Or exactly as user requested: 5 images -> 1 top, 4 bottom
    
    return (
        <div className={cn("grid gap-1 mt-3 rounded-lg overflow-hidden", getGridClass(images.length), images.length === 3 && "grid-rows-2")}>
            {images.map((url, index) => (
                <div 
                    key={index} 
                    className={cn(
                        "relative bg-[#2b2d31] overflow-hidden cursor-zoom-in",
                        getImageStyle(index, images.length)
                    )}
                    onClick={(e) => {
                        e.stopPropagation();
                        window.open(url, '_blank');
                    }}
                >
                    <img 
                        src={url} 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                        alt={`attachment-${index}`} 
                        loading="lazy"
                    />
                </div>
            ))}
        </div>
    );
};

export const ForumListView: React.FC<ForumListViewProps> = ({ channel, user, onPostClick, connection }) => {
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
                    messageCount: post.messageCount + 1,
                    lastActivityAt: msg.createdAt,
                    isUnread: user?.id !== msg.userId
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

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        
        setIsGlobalUploading(true);
        const newAttachments: Attachment[] = [];
        const filesToUpload: File[] = [];

        // 1. Create local previews
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type.startsWith('image/')) continue;
            
            // Check size (e.g. 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert(`图片 ${file.name} 超过 10MB 限制`);
                continue;
            }

            const id = Math.random().toString(36).substring(7);
            const localUrl = URL.createObjectURL(file);
            
            newAttachments.push({
                id,
                url: localUrl,
                isUploading: true
            });
            filesToUpload.push(file);
        }

        if (newAttachments.length === 0) {
            setIsGlobalUploading(false);
            return;
        }

        setAttachments(prev => [...prev, ...newAttachments]);

        // 2. Upload individually
        try {
            await Promise.all(filesToUpload.map(async (file, index) => {
                const attachment = newAttachments[index];
                const formData = new FormData();
                formData.append('file', file);

                try {
                    const res = await api.post('/Upload/image?type=community', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    
                    setAttachments(prev => prev.map(a => 
                        a.id === attachment.id 
                            ? { ...a, url: res.data.url, isUploading: false }
                            : a
                    ));
                } catch (err) {
                    console.error(`Failed to upload ${file.name}`, err);
                    // Mark as error or remove? For now, remove
                    setAttachments(prev => prev.filter(a => a.id !== attachment.id));
                    alert(`图片 ${file.name} 上传失败`);
                }
            }));
        } finally {
            setIsGlobalUploading(false);
        }
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
        
        // Ensure no images are still uploading
        if (attachments.some(a => a.isUploading)) {
            alert("请等待图片上传完成");
            return;
        }

        try {
            await api.post(`/Community/channels/${channel.id}/posts`, {
                title: newPostTitle,
                content: newPostContent,
                attachmentUrls: attachments.map(a => a.url)
            });
            
            // Reset form
            setNewPostTitle('');
            setNewPostContent('');
            setAttachments([]);
            setIsCreating(false);
            // Post will be added via SignalR
        } catch (err) {
            console.error("Failed to create post", err);
            alert("发帖失败");
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
                                    <textarea
                                        value={newPostContent}
                                        onChange={(e) => setNewPostContent(e.target.value)}
                                        onPaste={handlePaste}
                                        placeholder="输入消息......"
                                        className="w-full bg-transparent text-[#DBDEE1] placeholder-[#949BA4] outline-none min-h-[150px] resize-none px-1 custom-scrollbar"
                                    />
                                </div>

                                {/* Image Previews */}
                                {(attachments.length > 0 || isGlobalUploading) && (
                                    <div className="flex flex-wrap gap-3 mb-4 px-1">
                                        {attachments.map((attachment) => (
                                            <div key={attachment.id} className="relative group w-[80px] h-[80px] bg-[#2f3136] rounded-md overflow-hidden shrink-0">
                                                <img 
                                                    src={attachment.url} 
                                                    className={cn("w-full h-full object-cover transition-opacity", attachment.isUploading ? "opacity-50" : "")} 
                                                    alt="attachment" 
                                                />
                                                
                                                {/* Uploading Overlay */}
                                                {attachment.isUploading && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    </div>
                                                )}

                                                {/* Delete Button (Hover on Image) */}
                                                {!attachment.isUploading && (
                                                    <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                        <div 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setAttachments(prev => prev.filter(a => a.id !== attachment.id));
                                                            }}
                                                            className="bg-[#ED4245] text-white rounded-full p-0.5 shadow-sm"
                                                            title="删除图片"
                                                        >
                                                            <X size={12} />
                                                        </div>
                                                    </div>
                                                )}
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
                                            className="text-[#949BA4] hover:text-[#DBDEE1] transition-colors"
                                            title="上传文件"
                                        >
                                            <div className="border border-[#949BA4] hover:border-[#DBDEE1] rounded p-0.5">
                                                <Plus size={14} />
                                            </div>
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
                                const hasImage = post.attachmentUrls && post.attachmentUrls.length > 0;
                                return (
                                <div 
                                    key={post.id}
                                    onClick={() => onPostClick(post)}
                                    className="bg-[#313338] hover:bg-[#36383e] rounded-lg cursor-pointer transition-all group border border-[#404249] shadow-[0_4px_8px_rgba(0,0,0,0.2)] flex overflow-hidden min-h-[140px]"
                                >
                                    {hasImage && (
                                        <div className="w-[220px] shrink-0 bg-[#2b2d31] relative border-r border-[#26272D]">
                                            <img 
                                                src={post.attachmentUrls[0]} 
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
                                                    <h3 className="text-[#DBDEE1] font-bold text-lg group-hover:text-blue-400 transition-colors line-clamp-1">{post.title}</h3>
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
                                                        src={getAvatarUrl(post.author.avatarUrl)} 
                                                        className="w-4 h-4 rounded-full" 
                                                    />
                                                    <span style={{ color: post.author.roleColor || '#949BA4' }} className="font-medium">
                                                        {post.author.nickname || post.author.username}
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
}

export const PostThreadView: React.FC<PostThreadViewProps> = ({ channel, post, user, onBack, connection, members = [], roles = [] }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    // const [showEmojiPicker, setShowEmojiPicker] = useState(false); // Removed as ReactionList handles it internally or we use new logic
    const [postReactions, setPostReactions] = useState<Reaction[]>(post.reactions || []);
    const [inputText, setInputText] = useState('');
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    const [deletingMessage, setDeletingMessage] = useState<Message | null>(null);
    const [isDeletingPost, setIsDeletingPost] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Permission Helper
    const canManageMessage = (targetUserId: number) => {
        if (!user) return false;
        if (user.id === targetUserId) return true; // Author

        // Check Admin/Owner AccessLevel
        if ((user.accessLevel ?? 0) >= 3) return true;

        // Check Permissions (ManageMessages = 4, Administrator = 256)
        const currentMember = members.find(m => m.id === user.id);
        if (!currentMember) return false;

        for (const roleId of currentMember.roles) {
            const role = roles.find(r => r.id === roleId);
            if (role) {
                if ((role.permissions & 4) === 4) return true;
                if ((role.permissions & 256) === 256) return true;
            }
        }

        return false;
    };

    useEffect(() => {
        fetchMessages();
        // Mark as read
        api.post(`/Community/posts/${post.id}/ack`).catch(console.error);
    }, [post.id]);

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
                    return [...prev, { postId, userId, emoji }];
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

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim() || !connection) return;

        if (editingMessageId) {
            await handleEditMessage(inputText.trim());
            return;
        }

        try {
            await connection.invoke("SendMessage", channel.id.toString(), inputText, replyTo?.id || null, null, post.id);
            setInputText('');
            setReplyTo(null);
        } catch (err) {
            console.error("Failed to send message", err);
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

    const handleShare = (content: string) => {
        navigator.clipboard.writeText(content);
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
                await connection.invoke("RemoveMessageReaction", messageId, emoji);
            } else {
                await connection.invoke("AddMessageReaction", messageId, emoji);
                trackReactionUsage(emoji);
            }
        } catch (err) {
            console.error("Failed to toggle message reaction", err);
        }
    };

    const canDeletePost = canManageMessage(post.author.id);

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
            <div className="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
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
                        <div className="h-[1px] flex-1 bg-[#3F4147]"></div>
                        <span className="text-xs text-[#949BA4] font-medium">
                            {format(new Date(post.createdAt), 'yyyy年MM月dd日')}
                        </span>
                        <div className="h-[1px] flex-1 bg-[#3F4147]"></div>
                    </div>

                    {/* OP Post Content */}
                    <div className="mt-4 group">
                        {/* Author Row */}
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <img 
                                        src={getAvatarUrl(post.author.avatarUrl)} 
                                        className="w-10 h-10 rounded-full border-2 border-[#FFD700]" 
                                        alt="avatar"
                                    />
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-[#F23F42] hover:underline cursor-pointer">
                                        {post.author.nickname || post.author.username}
                                    </span>
                                    <span className="text-[#949BA4] text-sm">
                                        @{post.author.username}
                                    </span>
                                    <span className="bg-[#5865F2] text-white text-[10px] px-1 rounded font-bold">LZ</span>
                                    <span className="text-[#949BA4] text-xs ml-1">
                                        {format(new Date(post.createdAt), 'yyyy/MM/dd HH:mm')}
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
                                                <Edit size={14} />
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
                        <div className="pl-[52px] text-[#DBDEE1] whitespace-pre-wrap break-words leading-relaxed text-[13px]">
                            {post.content}
                        </div>

                        {/* Images */}
                        <div className="pl-[52px] mt-3">
                            <ImageGrid images={post.attachmentUrls} />
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
                                        onClick={() => handleShare(post.content)}
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
                                (new Date(msg.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() < 5 * 60 * 1000);
                             const canManage = canManageMessage(msg.userId);

                             return (
                                <div key={msg.id} className={cn("group flex gap-4 hover:bg-[#2e3035]/40 -mx-6 px-6 py-2 relative", isSequent ? "mt-0.5" : "mt-6")}>
                                    <div className="shrink-0 w-10">
                                        {!isSequent ? (
                                            <img 
                                                src={getAvatarUrl(msg.user?.avatarUrl || msg.avatarUrl)} 
                                                className="w-10 h-10 rounded-full cursor-pointer hover:opacity-80 transition-opacity" 
                                            />
                                        ) : (
                                            <div className="text-[10px] text-[#949BA4] opacity-0 group-hover:opacity-100 text-right pr-1 select-none mt-1.5 hidden group-hover:block">
                                                {format(new Date(msg.createdAt), 'HH:mm')}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        {!isSequent && (
                                            <div className="flex items-center gap-2 mb-1">
                                                <span 
                                                    className="font-medium text-white hover:underline cursor-pointer"
                                                    style={{ color: msg.roleColor || msg.user?.roleColor }}
                                                >
                                                    {msg.user?.nickname || msg.nickname || msg.username || msg.user?.username}
                                                </span>
                                                {msg.userId === post.author.id && (
                                                    <span className="bg-[#5865F2] text-white text-[10px] px-1 rounded font-bold">LZ</span>
                                                )}
                                                <span className="text-xs text-[#949BA4]">
                                                    {format(new Date(msg.createdAt), 'yyyy/MM/dd HH:mm')}
                                                </span>
                                            </div>
                                        )}
                                        
                                        {msg.replyTo && (
                                            <div className="flex items-center gap-2 mt-0.5 mb-1 text-xs text-gray-400 bg-[#2f3136]/50 p-1 rounded border-l-2 border-[#4e5058] opacity-80 inline-flex">
                                                <Reply size={12} />
                                                <span className="font-bold">{msg.replyTo.nickname || msg.replyTo.username}</span>
                                                <span className="truncate max-w-[200px] opacity-75">{msg.replyTo.content}</span>
                                            </div>
                                        )}

                                        <p className={cn("text-[#DBDEE1] whitespace-pre-wrap break-words leading-relaxed text-[13px]", !isSequent && "")}>
                                            {msg.content}
                                        </p>
                                        
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
                             );
                        })}
                    </div>
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Bottom Reply Bar */}
            <div className="bg-[#313338] shrink-0 border-t border-[#26272D]">
                <div className="max-w-[1000px] mx-auto w-full p-4">
                    <div className="bg-[#383A40] rounded-lg p-2 flex items-center gap-2 shadow-inner">
                        <button className="text-[#B5BAC1] hover:text-[#D1D4D7] p-1.5 bg-[#404249] rounded-full">
                            <Plus size={16} />
                        </button>
                        
                        {replyTo && (
                            <div className="flex items-center gap-1 bg-[#2f3136] px-2 py-0.5 rounded text-xs text-[#DBDEE1] whitespace-nowrap">
                                <span>@{replyTo.nickname || replyTo.username}</span>
                                <button onClick={() => setReplyTo(null)} className="hover:text-white"><X size={12} /></button>
                            </div>
                        )}
                        
                        {editingMessageId && (
                             <div className="flex items-center gap-1 bg-[#2f3136] px-2 py-0.5 rounded text-xs text-[#DBDEE1] whitespace-nowrap">
                                <span className="text-yellow-400">正在编辑</span>
                                <button onClick={cancelEditing} className="hover:text-white"><X size={12} /></button>
                            </div>
                        )}

                        <input 
                            ref={inputRef}
                            type="text" 
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    handleSendMessage(e);
                                }
                                if (e.key === 'Escape' && editingMessageId) {
                                    cancelEditing();
                                }
                            }}
                            placeholder={editingMessageId ? "编辑消息..." : `回复帖子 #${post.title}`}
                            className="bg-transparent flex-1 text-[#DBDEE1] placeholder-[#949BA4] outline-none text-sm font-medium"
                        />
                        
                        <button className="text-[#B5BAC1] hover:text-[#D1D4D7] p-1.5">
                            <Smile size={20} />
                        </button>
                        <button 
                            onClick={(e) => handleSendMessage(e)}
                            disabled={!inputText.trim()} 
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
