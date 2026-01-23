import React, { useState, useEffect, useRef } from 'react';
import { HubConnectionBuilder, HubConnection, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { api, getAvatarUrl, COMMUNITY_BASE_URL } from '../lib/api';
import { type User, type Post, type CommunityRole, type Message, type Channel, type Category, type Member } from '../types';
import { type StoryLink, generateLink } from '../lib/links';
import { SocialContext } from './SocialContext';
import MessageItem from './MessageItem';
// import LinkPreviewCard from './LinkPreviewCard';
// import MessageImages from './MessageImages';
// import ReplyContext from './ReplyContext';
import MessageActionMenu from './MessageActionMenu';
// import { ReactionList, MessageReactionAction, QuickReactionGroup, trackReactionUsage, ActionTooltip } from './ReactionComponents';
import ConfirmationModal from './ConfirmationModal';
import CommunitySettingsModal from './CommunitySettingsModal';
import CreateChannelModal from './CreateChannelModal';
import EditProfileModal from './EditProfileModal';
import UserProfileCard from './UserProfileCard';
import { ForumListView, PostThreadView } from './ForumComponents';
import { AutoResizeTextarea, type MentionCandidate } from './AutoResizeTextarea';
import { 
    Hash, 
    MessageSquare,
    LogOut,
    Volume2,
    Bell,
    Settings,
    ChevronDown,
    Plus,
    X,
    Search,
    AlertCircle,
    RefreshCw,
    Users,
    CheckCheck,
    EyeOff,
    Eye,
    Smile,
    Send
} from 'lucide-react';
// Force rebuild
import EmojiPicker, { Theme, EmojiStyle } from 'emoji-picker-react';
import { cn } from "../lib/utils";
import { format } from 'date-fns';

interface SocialPageProps {
    user: User | null;
    onReturnToLauncher: () => void;
    onMinimize: () => void;
    onClose: () => void;
    onDrag: (e: React.MouseEvent) => void;
    onUpdateUser: (user: User) => void;
}



const SocialPage: React.FC<SocialPageProps> = ({ 
    user, 
    onReturnToLauncher, 
    onDrag,
    onUpdateUser
}) => {
    // State
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
    const activeChannelRef = useRef<Channel | null>(null);
    useEffect(() => {
        activeChannelRef.current = activeChannel;
    }, [activeChannel]);
    const [activePost, setActivePost] = useState<Post | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const channelCache = useRef<Record<number, { messages: Message[], hasMore: boolean, scrollTop: number }>>({});
    const [inputValue, setInputValue] = useState('');
    const [pendingFiles, setPendingFiles] = useState<{ file: File; previewUrl: string; isSpoiler: boolean }[]>([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const emojiButtonRef = useRef<HTMLButtonElement>(null);

    // --- File Upload Logic ---
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
            if (files.length === 0) {
                alert("只能上传图片文件");
                return;
            }
            const newFiles = files.map(f => ({
                file: f,
                previewUrl: URL.createObjectURL(f),
                isSpoiler: false
            }));
            setPendingFiles(prev => [...prev, ...newFiles]);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        const newFiles: { file: File; previewUrl: string; isSpoiler: boolean }[] = [];
        
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    newFiles.push({
                        file: file,
                        previewUrl: URL.createObjectURL(file),
                        isSpoiler: false
                    });
                }
            }
        }
        
        if (newFiles.length > 0) {
            e.preventDefault();
            setPendingFiles(prev => [...prev, ...newFiles]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
            if (files.length > 0) {
                const newFiles = files.map(f => ({
                    file: f,
                    previewUrl: URL.createObjectURL(f),
                    isSpoiler: false
                }));
                setPendingFiles(prev => [...prev, ...newFiles]);
            }
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const removePendingFile = (index: number) => {
        setPendingFiles(prev => prev.filter((_, i) => i !== index));
    };

    const toggleSpoiler = (index: number) => {
        setPendingFiles(prev => prev.map((item, i) => 
            i === index ? { ...item, isSpoiler: !item.isSpoiler } : item
        ));
    };


    const [isLoading, setIsLoading] = useState(false);
    const [, setConnectionState] = useState<HubConnectionState>(HubConnectionState.Disconnected);
    const [error, setError] = useState<string | null>(null);
    
    // Members State
    const [members, setMembers] = useState<Member[]>([]);
    const [roles, setRoles] = useState<CommunityRole[]>([]);
    const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set());
    const [showMembers, setShowMembers] = useState(true);

    // Edit State
    const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
    const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);

    // Mention Candidates Logic
    const mentionCandidates = React.useMemo(() => {
        if (!user) return [];
        
        // Requirement: Only users with access level >= 3 can see mention candidates
        // And they can only see 'everyone' and Roles.
        if (user.accessLevel < 3) {
            return [];
        }

        const candidates: MentionCandidate[] = [];

        // 1. Everyone
        candidates.push({ 
            id: 'everyone', 
            label: 'everyone', 
            type: 'everyone', 
            detail: '通知所有人' 
        });
        
        // 2. Roles
        roles.forEach(r => {
            candidates.push({ 
                id: `role:${r.id}`, 
                label: r.name, 
                type: 'role', 
                detail: '角色组',
                color: r.color
            });
        });

        return candidates;
    }, [user, roles]);
    const [activeMoreMenuId, setActiveMoreMenuId] = useState<number | null>(null);
    const [moreMenuTriggerRect, setMoreMenuTriggerRect] = useState<DOMRect | null>(null);
    const [pendingScrollMessageId, setPendingScrollMessageId] = useState<number | null>(null);

    // Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState<number | null>(null);
    const [showServerMenu, setShowServerMenu] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedUserPosition, setSelectedUserPosition] = useState<{ x: number, y: number } | null>(null);
    const [selectedUserStyle, setSelectedUserStyle] = useState<React.CSSProperties | undefined>(undefined);
    const [activeCardType, setActiveCardType] = useState<'chat' | 'member' | 'profile' | null>(null);
    const activeCardTypeRef = useRef(activeCardType);
    const selectedUserRef = useRef(selectedUser);

    useEffect(() => {
        activeCardTypeRef.current = activeCardType;
        selectedUserRef.current = selectedUser;
    }, [activeCardType, selectedUser]);
    const [serverSettings, setServerSettings] = useState<{ serverName?: string, iconUrl?: string, themeImageUrl?: string }>({});

    // Notifications State
    const [unreadDmCount, setUnreadDmCount] = useState(0);
    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
    const [editProfileInitialTab, setEditProfileInitialTab] = useState<'profile' | 'friends'>('profile');

    // Refs
    const connectionRef = useRef<HubConnection | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    
    // Message Cache (Memory)
    const messageCache = useRef<Map<number, Message[]>>(new Map());

    // --- Emoji & Menu Logic ---
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            // Emoji Picker
            if (
                emojiPickerRef.current &&
                !emojiPickerRef.current.contains(target as Node) &&
                emojiButtonRef.current &&
                !emojiButtonRef.current.contains(target as Node)
            ) {
                setShowEmojiPicker(false);
            }
            
            // More Menu
            if (activeMoreMenuId !== null) {
                if (!target.closest('.more-menu-trigger') && !target.closest('.more-menu-content')) {
                    setActiveMoreMenuId(null);
                    setMoreMenuTriggerRect(null);
                }
            }

            // Server Menu (Community Title)
            if (showServerMenu) {
                if (!target.closest('.server-menu-container')) {
                    setShowServerMenu(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeMoreMenuId, showServerMenu]);

    // --- Navigation & Deep Link Handling ---
    useEffect(() => {
        const handleNavigate = async (e: Event) => {
            const customEvent = e as CustomEvent<StoryLink>;
            const { type, id, messageId } = customEvent.detail;

            if (type === 'channel') {
                let foundChannel: Channel | null = null;
                for (const cat of categories) {
                    const c = cat.channels.find(ch => ch.id === id);
                    if (c) {
                        foundChannel = c;
                        break;
                    }
                }
                
                if (foundChannel) {
                    setActiveChannel(foundChannel);
                    setActivePost(null);
                    if (messageId) {
                        setPendingScrollMessageId(messageId);
                    }
                }
            } else if (type === 'post') {
                try {
                     const response = await api.get<Post>(`/Community/posts/${id}`);
                     const post = response.data;
                     if (post) {
                        let foundChannel: Channel | null = null;
                        for (const cat of categories) {
                            const c = cat.channels.find(ch => ch.id === post.channelId);
                            if (c) {
                                foundChannel = c;
                                break;
                            }
                        }
                        if (foundChannel) {
                            if (activeChannel?.id !== foundChannel.id) {
                                isNavigatingRef.current = true;
                                setActiveChannel(foundChannel);
                            }
                        }
                        
                        setActivePost(post);
                        if (messageId) {
                            setPendingScrollMessageId(messageId);
                        }
                     }
                } catch (err: any) {
                    if (err?.code !== "ERR_CANCELED" && err?.name !== "CanceledError") {
                        console.error("Failed to navigate to post", err);
                    }
                }
            }
        };

        window.addEventListener('storyoftime-navigate', handleNavigate);
        return () => window.removeEventListener('storyoftime-navigate', handleNavigate);
    }, [categories]);

    // Handle scrolling to specific message after navigation
    useEffect(() => {
        if (pendingScrollMessageId && messages.length > 0) {
            setTimeout(() => {
                const msgElement = document.getElementById(`message-${pendingScrollMessageId}`);
                if (msgElement) {
                    msgElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    msgElement.classList.add('bg-yellow-500/20');
                    setTimeout(() => msgElement.classList.remove('bg-yellow-500/20'), 2000);
                    setPendingScrollMessageId(null);
                }
            }, 500);
        }
    }, [messages, pendingScrollMessageId]);

    // --- SignalR Setup ---
    const connectSignalR = async () => {
        if (!user) return;
        
        // setIsConnecting(true);
        try {
            const newConnection = new HubConnectionBuilder()
                .withUrl(`${COMMUNITY_BASE_URL}/hubs/community`, {
                    accessTokenFactory: () => localStorage.getItem('auth_token') || ''
                })
                .withAutomaticReconnect()
                .configureLogging(LogLevel.Information)
                .build();

            newConnection.onreconnecting(() => {
                console.log("SignalR Reconnecting...");
                setConnectionState(HubConnectionState.Reconnecting);
            });

            newConnection.onreconnected(() => {
                console.log("SignalR Reconnected");
                setConnectionState(HubConnectionState.Connected);
                if (activeChannel) {
                    newConnection.invoke("JoinChannel", activeChannel.id);
                }
                newConnection.invoke("GetOnlineUsers").then((ids: number[]) => {
                    setOnlineUserIds(new Set(ids));
                });
            });

            newConnection.onclose(() => {
                console.log("SignalR Disconnected");
                setConnectionState(HubConnectionState.Disconnected);
            });

            // Listeners
            newConnection.on("ReceiveMessage", (message: Message) => {
                setMessages(prev => {
                    if (prev.some(m => m.id === message.id)) return prev;
                    return [...prev, message];
                });
            });

            newConnection.on("NewMessageNotification", ({ channelId, messageId, createdAt }) => {
                setCategories(prev => prev.map(cat => ({
                    ...cat,
                    channels: cat.channels.map(c => {
                        if (c.id === channelId) {
                            return {
                                ...c,
                                hasUnread: true,
                                unreadCount: (c.unreadCount || 0) + 1,
                                lastMessageId: messageId,
                                lastActiveAt: createdAt
                            };
                        }
                        return c;
                    })
                })));
            });

            newConnection.on("NewPostNotification", ({ channelId, createdAt }) => {
                setCategories(prev => prev.map(cat => ({
                    ...cat,
                    channels: cat.channels.map(c => {
                        if (c.id === channelId) {
                            // If user is currently in this channel, don't mark as unread (optional, but consistent with Discord)
                            // actually, if we are in the channel, we'll see the post appear.
                            // But for simplicity, we mark it unread here, and if we are in it, the read logic will clear it.
                            return {
                                ...c,
                                hasUnread: true,
                                // unreadCount: (c.unreadCount || 0) + 1, // Only update on UpdateUnreadCount
                                lastActiveAt: createdAt
                            };
                        }
                        return c;
                    })
                })));
            });

            newConnection.on("UpdateUnreadCount", (channelId: number, count: number) => {
                // If we are currently in this channel, ignore the unread count update (visual only)
                // And ensure backend knows we read it (though backend likely just incremented it)
                if (activeChannelRef.current?.id === channelId) {
                    // Mark as read again to clear backend state
                    // connectionRef.current is available in closure scope
                    connectionRef.current?.invoke("MarkChannelRead", channelId.toString());
                    return;
                }

                setCategories(prev => prev.map(cat => ({
                    ...cat,
                    channels: cat.channels.map(c => {
                        if (c.id === channelId) {
                            return {
                                ...c,
                                unreadCount: count,
                                hasUnread: count > 0 || c.hasUnread
                            };
                        }
                        return c;
                    })
                })));
            });

            newConnection.on("ReceiveDirectMessage", () => {
                setUnreadDmCount(prev => prev + 1);
            });

            newConnection.on("ReceiveFriendRequest", () => {
                setPendingRequestsCount(prev => prev + 1);
            });

            newConnection.on("MessageUpdated", (updatedMessage: Message) => {
                setMessages(prev => prev.map(m => 
                    m.id === updatedMessage.id ? { ...m, ...updatedMessage } : m
                ));
            });

            newConnection.on("PostUpdated", (updatedPost: any) => {
                 setMessages(prev => prev.map(m => 
                    m.id === updatedPost.id ? { ...m, content: updatedPost.content, updatedAt: updatedPost.updatedAt } : m
                ));
            });

            newConnection.on("MessageDeleted", (messageId: number) => {
                setMessages(prev => prev.filter(m => m.id !== messageId));
            });
            
             newConnection.on("PostDeleted", (postId: number) => {
                setMessages(prev => prev.filter(m => m.id !== postId));
            });

            // Reaction Events
            newConnection.on("MessageReactionAdded", ({ messageId, userId, emoji }: any) => {
                setMessages(prev => prev.map(m => {
                    if (m.id === messageId) {
                        const exists = m.reactions?.some(r => r.userId === userId && r.emoji === emoji);
                        if (exists) return m;
                        return { ...m, reactions: [...(m.reactions || []), { messageId, userId, emoji }] };
                    }
                    return m;
                }));
            });

            newConnection.on("MessageReactionRemoved", ({ messageId, userId, emoji }: any) => {
                setMessages(prev => prev.map(m => {
                    if (m.id === messageId) {
                        return { ...m, reactions: (m.reactions || []).filter(r => !(r.userId === userId && r.emoji === emoji)) };
                    }
                    return m;
                }));
            });

            // User Status Events
            newConnection.on("UserConnected", (userId: number) => {
                setOnlineUserIds(prev => new Set(prev).add(userId));
            });

            newConnection.on("UserDisconnected", (userId: number) => {
                setOnlineUserIds(prev => {
                    const next = new Set(prev);
                    next.delete(userId);
                    return next;
                });
            });

            await newConnection.start();
            console.log("SignalR Connected");
            connectionRef.current = newConnection;
            setConnectionState(HubConnectionState.Connected);
            // setIsConnecting(false);
            
            // Initial Online Users Fetch
            try {
                const ids: number[] = await newConnection.invoke("GetOnlineUsers");
                setOnlineUserIds(new Set(ids));
            } catch (e) {
                console.warn("Failed to get online users", e);
            }

        } catch (err) {
            console.error("SignalR Connection Error: ", err);
            setConnectionState(HubConnectionState.Disconnected);
            // setIsConnecting(false);
        }
    };

    useEffect(() => {
        connectSignalR();
        return () => {
            if (connectionRef.current) {
                connectionRef.current.stop();
            }
        };
    }, [user]);

    // --- Fetch Data ---
    const initData = async () => {
        try {
            setError(null);

            // Try load from cache first
            if (user) {
                try {
                    const cachedData = localStorage.getItem(`community_cache_${user.id}`);
                    if (cachedData) {
                        const parsed = JSON.parse(cachedData);
                        if (parsed.timestamp && Date.now() - parsed.timestamp < 1000 * 60 * 60 * 24) { // 24h cache validity
                            console.log("Loaded community data from cache");
                            setCategories(parsed.categories || []);
                            setMembers(parsed.members || []);
                            setRoles(parsed.roles || []);
                            setServerSettings(parsed.serverSettings || {});
                            // Don't set active channel from cache to avoid jumping, let logic below decide
                        }
                    }
                } catch (e) {
                    console.warn("Failed to load cache", e);
                }
            }
            
            // 1. Fetch Channels (Critical, Public)
            let channels: Channel[] = [];
            try {
                const channelsRes = await api.get('/Community/channels');
                channels = channelsRes.data;
            } catch (err) {
                console.error("Failed to fetch channels", err);
                // If we have cached channels, use them instead of throwing error
                if (categories.length > 0 && categories[0].channels.length > 0) {
                     console.warn("Using cached channels due to network error");
                     channels = categories[0].channels;
                } else {
                     throw new Error("无法加载频道列表，请检查网络连接。");
                }
            }

            // 2. Fetch Settings (Optional, Public)
            let settingsData: any = {};
            let rolesData: CommunityRole[] = [];
            try {
                const settingsRes = await api.get('/Community/settings');
                settingsData = settingsRes.data?.settings || {};
                rolesData = settingsRes.data?.roles || [];
            } catch (err) {
                console.warn("Failed to fetch settings", err);
            }

            // 3. Fetch Members (Protected, might fail if not logged in)
            let membersData: Member[] = [];
            try {
                const membersRes = await api.get('/Community/members');
                membersData = membersRes.data;
            } catch (err) {
                console.warn("Failed to fetch members (likely unauthorized or network error)", err);
                // Continue without members
            }

            // Group into a default category for now since backend doesn't support categories yet
            const defaultCategory: Category = {
                id: 0,
                name: "频道列表",
                sortOrder: 0,
                channels: channels
            };
            
            // Update State
            setCategories([defaultCategory]);
            setMembers(membersData);
            setRoles(rolesData);
            setServerSettings(settingsData);

            // Save to Cache
            if (user) {
                const cacheData = {
                    timestamp: Date.now(),
                    categories: [defaultCategory],
                    members: membersData,
                    roles: rolesData,
                    serverSettings: settingsData
                };
                localStorage.setItem(`community_cache_${user.id}`, JSON.stringify(cacheData));
            }

            // 4. Fetch Notifications
            try {
                const unreadRes = await api.get('/DirectMessages/unread-count');
                setUnreadDmCount(unreadRes.data.count);
                const pendingRes = await api.get('/Friends/pending');
                setPendingRequestsCount(pendingRes.data.length);

                // Mark global notifications as read
                api.post('/community/mark-global-read').catch(e => console.warn("Failed to mark global read", e));

            } catch (e) {
                console.warn("Failed to fetch notifications", e);
            }

            if (!activeChannel && channels.length > 0) {
                let targetChannel: Channel | undefined;

                // 1. Try Default Channel
                if (settingsData.defaultChannelId) {
                    targetChannel = channels.find((c: Channel) => c.id === settingsData.defaultChannelId);
                }

                // 2. Try First Chat Channel
                if (!targetChannel) {
                    targetChannel = channels.find((c: Channel) => c.type === 'Chat');
                }

                // 3. Fallback
                if (!targetChannel) {
                    targetChannel = channels[0];
                }

                if (targetChannel) {
                    setActiveChannel(targetChannel);
                }
            } else if (activeChannel) {
                // Update active channel info if it exists
                const updatedChannel = channels.find(c => c.id === activeChannel.id);
                if (updatedChannel) {
                    setActiveChannel(updatedChannel);
                }
            }
        } catch (err) {
            console.error("Failed to init data", err);
            setError("无法加载社区数据，请检查网络连接。");
        }
    };

    const newMessageDividerRef = useRef<HTMLDivElement>(null);
    const [showUnreadBanner, setShowUnreadBanner] = useState(false);

    // Scroll to new message divider
    const scrollToNewMessageDivider = () => {
        if (newMessageDividerRef.current) {
            newMessageDividerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    // Check banner visibility on scroll
    const checkUnreadBannerVisibility = () => {
        if (scrollContainerRef.current && newMessageDividerRef.current && activeChannel?.hasUnread) {
            const { scrollTop } = scrollContainerRef.current;
            const dividerTop = newMessageDividerRef.current.offsetTop;
            // Show banner if divider is above current view (with some buffer)
            // dividerTop is relative to the scroll container's content
            // scrollTop is how much we scrolled down
            // If dividerTop < scrollTop, it means the divider is "above" the viewport (hidden to top)
            setShowUnreadBanner(dividerTop < scrollTop);
        } else {
            setShowUnreadBanner(false);
        }
    };

    useEffect(() => {
        // Initial check when messages load
        checkUnreadBannerVisibility();
    }, [messages, activeChannel]);

    useEffect(() => {
        initData();
    }, []);

    // Flag to prevent clearing activePost during navigation
    const isNavigatingRef = useRef(false);

    useEffect(() => {
        if (isNavigatingRef.current) {
            isNavigatingRef.current = false;
            return;
        }
        setActivePost(null);
    }, [activeChannel?.id]);

    // --- Fetch Messages Logic ---
    const prevChannelIdRef = useRef<number | null>(null);
    const messagesRef = useRef(messages);
    const hasMoreRef = useRef(hasMore);
    const prevScrollHeightRef = useRef<number>(0);

    useEffect(() => {
        messagesRef.current = messages;
        hasMoreRef.current = hasMore;
    }, [messages, hasMore]);

    const loadMessages = React.useCallback(async (channelId: number, before: string | null = null) => {
        if (before) {
            setIsFetchingMore(true);
            if (scrollContainerRef.current) {
                prevScrollHeightRef.current = scrollContainerRef.current.scrollHeight;
            }
        } else {
            // Cache-First Strategy for Messages
            if (messageCache.current.has(channelId)) {
                const cached = messageCache.current.get(channelId);
                if (cached && cached.length > 0) {
                    setMessages(cached);
                    // Do NOT set isLoading(true) to avoid spinner flashing
                } else {
                    setIsLoading(true);
                }
            } else {
                setIsLoading(true);
            }
        }

        try {
            const limit = before ? 30 : 50;
            const url = `/Community/channels/${channelId}/messages?limit=${limit}${before ? `&before=${before}` : ''}`;
            const res = await api.get(url);
            let newMessages: Message[] = res.data;
            
            newMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

            if (newMessages.length < limit) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

            if (before) {
                setMessages(prev => [...newMessages, ...prev]);
            } else {
                setMessages(newMessages);
                // Update Cache
                messageCache.current.set(channelId, newMessages);
            }
            
            if (!before && connectionRef.current?.state === HubConnectionState.Connected) {
                 connectionRef.current.invoke("JoinChannel", channelId.toString());
                 connectionRef.current.invoke("MarkChannelRead", channelId.toString());
            }

        } catch (err) {
            console.error("Failed to fetch messages", err);
        } finally {
            if (before) {
                // Keep isFetchingMore true slightly longer to allow layout effect to run? 
                // No, layout effect runs synchronously after DOM mutation but before paint.
                // It should run before this finally block executes? 
                // setMessages triggers render -> layoutEffect runs -> then finally block?
                // Yes, usually.
                setIsFetchingMore(false);
            } else {
                setIsLoading(false);
            }
        }
    }, []);

    // Scroll Restoration
    React.useLayoutEffect(() => {
        if (isFetchingMore && scrollContainerRef.current && prevScrollHeightRef.current > 0) {
            const newHeight = scrollContainerRef.current.scrollHeight;
            const diff = newHeight - prevScrollHeightRef.current;
            if (diff > 0) {
                scrollContainerRef.current.scrollTop = diff;
            }
            prevScrollHeightRef.current = 0;
        }
    }, [messages]);

    useEffect(() => {
        if (!activeChannel) return;

        // Save Previous
        if (prevChannelIdRef.current && prevChannelIdRef.current !== activeChannel.id) {
             channelCache.current[prevChannelIdRef.current] = {
                 messages: messagesRef.current,
                 hasMore: hasMoreRef.current,
                 scrollTop: scrollContainerRef.current?.scrollTop || 0
             };
        }
        prevChannelIdRef.current = activeChannel.id;

        // Clear unread state locally
        setCategories(prev => prev.map(cat => ({
            ...cat,
            channels: cat.channels.map(c => {
                if (c.id === activeChannel.id) {
                    return { ...c, unreadCount: 0, hasUnread: false };
                }
                return c;
            })
        })));

        // Restore or Load New
        const cached = channelCache.current[activeChannel.id];
        if (cached) {
            console.log(`Restoring channel ${activeChannel.id} from cache`);
            setMessages(cached.messages);
            setHasMore(cached.hasMore);
            setTimeout(() => {
                 if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTop = cached.scrollTop;
                }
            }, 0);
             if (connectionRef.current?.state === HubConnectionState.Connected) {
                connectionRef.current.invoke("JoinChannel", activeChannel.id.toString());
                connectionRef.current.invoke("MarkChannelRead", activeChannel.id.toString());
            }
        } else {
            setMessages([]);
            setHasMore(true);
            loadMessages(activeChannel.id);
        }

        return () => {
             if (connectionRef.current?.state === HubConnectionState.Connected && activeChannel) {
                connectionRef.current.invoke("LeaveChannel", activeChannel.id.toString());
            }
        };
    }, [activeChannel, loadMessages]);

    // --- Scroll Handling ---
    const prevMessagesLength = useRef(0);
    const scrollToBottom = React.useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, []);

    useEffect(() => {
        if (isLoading || messages.length > prevMessagesLength.current) {
            scrollToBottom();
        }
        prevMessagesLength.current = messages.length;
    }, [messages, isLoading, scrollToBottom]);

    // --- Handlers ---
    const canManageMessage = (message: Message) => {
        if (!user) return false;
        if (user.id === message.userId) return true; // Author

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

    const handleSendMessage = async () => {
        if (!activeChannel || !user) return;
        const content = inputValue.trim();
        if (!content && pendingFiles.length === 0) return;

        if (editingMessageId) {
            await handleEditMessage(content);
            return;
        }

        setInputValue('');
        setPendingFiles([]); // Clear immediately

        const currentReplyTo = replyingToMessage;
        setReplyingToMessage(null);

        const tempId = Date.now();
        const filesToUpload = [...pendingFiles]; // Capture current files

        const optimisticMessage: Message = {
            id: tempId,
            channelId: activeChannel.id,
            userId: user.id,
            content: content,
            createdAt: new Date().toISOString(),
            user: {
                id: user.id,
                username: user.username,
                nickname: user.nickname,
                avatarUrl: user.avatarUrl,
                accessLevel: user.accessLevel,
                points: user.points
            },
            replyTo: currentReplyTo || undefined,
            isSending: true,
            pendingFiles: filesToUpload.map(f => ({
                file: f.file,
                previewUrl: f.previewUrl,
                progress: 0,
                status: 'pending'
            }))
        };
        
        setMessages(prev => [...prev, optimisticMessage]);

        // Background Upload Process
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

                // Upload files one by one or in parallel
                // Here we do parallel for speed
                const uploadPromises = filesToUpload.map(async (item, index) => {
                    const formData = new FormData();
                    formData.append('file', item.file);
                    
                    try {
                        const res = await api.post(`/Upload/image?type=community&isSpoiler=${item.isSpoiler}`, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                            // Axios onUploadProgress if needed, but fetch/api wrapper might not support it easily
                            // For now, we just mark as done when promise resolves
                        });
                        
                        // Update progress (mark this specific file as done)
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

            // Once all uploaded, send SignalR message
            if (connectionRef.current?.state === HubConnectionState.Connected) {
                const attachmentUrlsJson = uploadedUrls.length > 0 ? JSON.stringify(uploadedUrls) : null;
                await connectionRef.current.invoke("SendMessage", 
                    activeChannel.id.toString(), 
                    content, 
                    currentReplyTo ? currentReplyTo.id : null, 
                    attachmentUrlsJson, 
                    null
                );
            } else {
                throw new Error("Not connected to server");
            }
        } catch (err) {
            console.error("Failed to send", err);
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, isSending: false, isError: true } : m));
        }
    };

    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && !lastMessage.isSending && lastMessage.userId === user?.id) {
            setMessages(prev => prev.filter(m => !m.isSending));
        }
    }, [messages.length]);

    const handleEditMessage = async (newContent: string) => {
        if (!editingMessageId) return;
        
        try {
            setMessages(prev => prev.map(m => 
                m.id === editingMessageId ? { ...m, content: newContent } : m
            ));

            setInputValue('');
            setEditingMessageId(null);

            await api.put(`/Community/messages/${editingMessageId}`, {
                content: newContent
            });
        } catch (err) {
            console.error("Failed to edit", err);
            alert("编辑失败");
        }
    };

    const startEditing = React.useCallback((message: Message) => {
        setEditingMessageId(message.id);
        setInputValue(message.content);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const cancelEditing = () => {
        setEditingMessageId(null);
        setInputValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
        if (e.key === 'Escape') {
            if (editingMessageId) cancelEditing();
            if (replyingToMessage) setReplyingToMessage(null);
        }
    };

    const handleDeleteMessage = async () => {
        if (!messageToDelete) return;
        try {
            await api.delete(`/Community/messages/${messageToDelete}`);
            setDeleteModalOpen(false);
            setMessageToDelete(null);
        } catch (err) {
            console.error("Failed to delete", err);
            alert("删除失败");
        }
    };

    const handleUserClick = React.useCallback((e: React.MouseEvent, targetUser: any, type: 'chat' | 'member' | 'profile' = 'chat') => {
        e.stopPropagation();
        e.preventDefault();
        
        // Normalize user object
        const userObj: User = {
            id: targetUser.id || targetUser.userId,
            username: targetUser.username || 'Unknown',
            nickname: targetUser.nickname,
            avatarUrl: targetUser.avatarUrl,
            accessLevel: targetUser.accessLevel || 0,
            email: '', // Placeholder
            points: 0,
            preferredStatus: targetUser.preferredStatus
        };

        // Toggle logic: If clicking the same user in the same context, close the card
        if (selectedUserRef.current?.id === userObj.id && activeCardTypeRef.current === type) {
            setSelectedUser(null);
            setActiveCardType(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        let style: React.CSSProperties = {};
        
        // 1. Profile (Bottom Left): Pop Up, Bottom aligned with trigger container top
        if (type === 'profile') {
            style = {
                left: rect.left,
                bottom: window.innerHeight - rect.top, // Bottom of card = Top of trigger
            };
        } 
        // 2. Member List (Right): Pop Left, Top aligned with trigger top. Auto-adjust vertical.
        else if (type === 'member') {
            const cardWidth = 300; 
            const gap = 10;
            style = {
                left: rect.left - cardWidth - gap,
                top: rect.top,
            };
            
            // Auto-adjust vertical if overflow
            const cardHeight = 400; // Estimated height
            if (rect.top + cardHeight > window.innerHeight) {
                 style.top = undefined;
                 style.bottom = 10; // 10px from bottom
            }
        }
        // 3. Chat (Center): Pop Right, Top aligned with trigger top. Auto-adjust vertical.
        else if (type === 'chat') {
            const gap = 10;
            const cardWidth = 300;
            style = {
                left: rect.right + gap,
                top: rect.top,
            };
            
            // Auto-adjust horizontal if overflow
            if (rect.right + gap + cardWidth > window.innerWidth) {
                style.left = rect.left - cardWidth - gap;
            }
            
            // Auto-adjust vertical
            const cardHeight = 400; // Estimated height
            if (rect.top + cardHeight > window.innerHeight) {
                 style.top = undefined;
                 style.bottom = 10; // 10px from bottom
            }
        }

        setSelectedUser(userObj);
        setSelectedUserPosition({ x: rect.left, y: rect.top }); // Fallback position
        setSelectedUserStyle(style);
        setActiveCardType(type);
    }, []);

    const handleScrollToMessage = React.useCallback((messageId: number) => {
        const element = document.getElementById(`message-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Add flash effect
            element.classList.add('bg-[#3f4147]', 'animate-pulse');
            setTimeout(() => {
                element.classList.remove('bg-[#3f4147]', 'animate-pulse');
            }, 2000);
        }
    }, []);

    const handleReply = React.useCallback((message: Message) => {
        setReplyingToMessage(message);
        if (inputRef.current) inputRef.current.focus();
    }, []);

    const handleShare = React.useCallback((message: Message) => {
        navigator.clipboard.writeText(message.content);
        // Could use a toast here, but for now just log or do nothing
        console.log("Copied to clipboard");
    }, []);

    const handleToggleMessageReaction = React.useCallback(async (messageId: number, emoji: string, hasReacted: boolean) => {
        if (!connectionRef.current || !user) return;
        
        try {
            if (hasReacted) {
                await connectionRef.current.invoke("RemoveReaction", messageId, emoji);
            } else {
                await connectionRef.current.invoke("AddReaction", messageId, emoji);
                // trackReactionUsage(emoji);
            }
        } catch (err) {
            console.error("Failed to toggle message reaction", err);
        }
    }, [user]);

    const handleRequestDelete = React.useCallback((message: Message) => {
        setMessageToDelete(message.id);
        setDeleteModalOpen(true);
    }, []);

    const handleOpenMoreMenu = React.useCallback((messageId: number, rect: DOMRect) => {
        setActiveMoreMenuId(messageId);
        setMoreMenuTriggerRect(rect);
    }, []);

    const handleCloseMoreMenu = React.useCallback(() => {
        setActiveMoreMenuId(null);
        setMoreMenuTriggerRect(null);
    }, []);

    const handleCopyLink = React.useCallback((message: Message) => {
         const link = generateLink('channel', message.channelId, message.id);
         navigator.clipboard.writeText(link);
         setActiveMoreMenuId(null);
         setMoreMenuTriggerRect(null);
    }, []);

    // --- Computed ---
    const onlineMembers = React.useMemo(() => 
        members.filter(m => onlineUserIds.has(m.id) || m.preferredStatus === 0),
        [members, onlineUserIds]
    );
    const offlineMembers = React.useMemo(() => 
        members.filter(m => !onlineUserIds.has(m.id) && m.preferredStatus !== 0),
        [members, onlineUserIds]
    );

    const groupedMembers = React.useMemo(() => {
        if (roles.length === 0) {
            return [{ role: null, members: onlineMembers }];
        }

        const groups: { role: CommunityRole | null, members: Member[] }[] = [];
        const processedMemberIds = new Set<number>();
        
        // 1. Groups for Hoisted Roles
        const sortedRoles = [...roles].sort((a, b) => b.sortOrder - a.sortOrder);

        sortedRoles.forEach(role => {
            if (role.isHoisted) {
                const roleMembers = onlineMembers.filter(m => 
                    !processedMemberIds.has(m.id) && m.roles?.includes(role.id)
                );
                
                if (roleMembers.length > 0) {
                    groups.push({ role, members: roleMembers });
                    roleMembers.forEach(m => processedMemberIds.add(m.id));
                }
            }
        });
        
        // 2. Default Group (Online)
        const remainingMembers = onlineMembers.filter(m => !processedMemberIds.has(m.id));
        if (remainingMembers.length > 0) {
            groups.push({ role: null, members: remainingMembers });
        }
        
        return groups;
    }, [members, roles, onlineMembers]);

    const getUserColor = (userId: number, fallback?: string) => {
        const member = members.find(m => m.id === userId);
        return member?.roleColor || fallback || '#ffffff';
    };

    const handleMarkAsRead = async () => {
        if (!activeChannel || !messages.length) return;
        
        // Find latest message ID
        const latestMessage = messages[messages.length - 1];
        if (!latestMessage) return;

        // Defense check: ensure message belongs to active channel
        // This prevents race conditions when switching channels (activeChannel updates before messages)
        if (latestMessage.channelId !== activeChannel.id) {
            return;
        }

        try {
            await api.post(`/Community/channels/${activeChannel.id}/ack`, {
                lastReadMessageId: latestMessage.id
            });
            
            // Optimistic update
            setActiveChannel(prev => prev ? { 
                ...prev, 
                hasUnread: false, 
                unreadCount: 0, 
                lastReadMessageId: latestMessage.id 
            } : null);

            // Also update channel in categories
            setCategories(prev => prev.map(cat => ({
                ...cat,
                channels: cat.channels.map(c => 
                    c.id === activeChannel.id 
                        ? { ...c, hasUnread: false, unreadCount: 0, lastReadMessageId: latestMessage.id }
                        : c
                )
            })));
        } catch (error) {
            // Ignore errors during navigation/unmount
            console.warn('Failed to mark as read (likely navigation or network issue)', error);
        }
    };



    const allChannels = React.useMemo(() => 
        categories.flatMap(c => c.channels), 
        [categories]
    );

    return (
        <SocialContext.Provider value={{ channels: allChannels, user }}>
        <div className="flex h-full w-full bg-[#313338] text-gray-100 font-sans">
            {/* Left Sidebar: Channels */}
            <div className="w-60 bg-[#2b2d31] flex flex-col shrink-0">
                {/* Server Header with Banner */}
                <div 
                    className="h-32 relative shadow-sm flex flex-col justify-end p-4 bg-cover bg-center transition-all hover:bg-gray-800 group server-menu-container"
                    style={{ backgroundImage: serverSettings.themeImageUrl ? `url('${getAvatarUrl(serverSettings.themeImageUrl)}')` : 'none', backgroundColor: serverSettings.themeImageUrl ? 'transparent' : '#2b2d31' }}
                    onMouseDown={onDrag}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div 
                        className="relative z-10 flex items-center justify-between cursor-pointer hover:bg-white/10 p-1 rounded transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowServerMenu(!showServerMenu);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                         <div>
                             <div className="font-bold text-white text-base shadow-black drop-shadow-md">{serverSettings.serverName || ""}</div>
                         </div>
                         <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                             <ChevronDown size={20} />
                         </div>
                    </div>

                    {/* Dropdown Menu */}
                    {showServerMenu && (
                        <div 
                            className="absolute top-full left-0 w-56 bg-[#111214] rounded shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in duration-100 border border-[#1e1f22] mt-1"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-1.5 space-y-0.5">
                                <button 
                                    className="w-full flex items-center justify-between px-2 py-1.5 text-sm text-[#B5BAC1] hover:bg-[#4752c4] hover:text-white rounded cursor-pointer transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowSettingsModal(true);
                                        setShowServerMenu(false);
                                    }}
                                >
                                    <span>社区设置</span>
                                    <Settings size={14} />
                                </button>
                                {user && user.accessLevel >= 1 && (
                                    <>
                                        <button 
                                            className="w-full flex items-center justify-between px-2 py-1.5 text-sm text-[#B5BAC1] hover:bg-[#4752c4] hover:text-white rounded cursor-pointer transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsCreateChannelModalOpen(true);
                                                setShowServerMenu(false);
                                            }}
                                        >
                                            <span>添加频道</span>
                                            <Plus size={14} />
                                        </button>
                                        <button 
                                            className="w-full flex items-center justify-between px-2 py-1.5 text-sm text-[#B5BAC1] hover:bg-[#4752c4] hover:text-white rounded cursor-pointer transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // TODO: Implement Create Category
                                                alert("添加分类功能将在后续版本开发");
                                                setShowServerMenu(false);
                                            }}
                                        >
                                            <span>添加分类</span>
                                            <Plus size={14} />
                                        </button>
                                    </>
                                )}
                                <div className="h-px bg-[#1e1f22] my-1"></div>
                                <button 
                                    className="w-full flex items-center justify-between px-2 py-1.5 text-sm text-red-400 hover:bg-red-500 hover:text-white rounded cursor-pointer transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onReturnToLauncher();
                                    }}
                                >
                                    <span>退出社区</span>
                                    <LogOut size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Channel List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4">
                    {error ? (
                        <div className="p-4 text-center text-red-400 text-xs flex flex-col items-center gap-2">
                            <AlertCircle size={20} />
                            <span>{error}</span>
                            <button onClick={initData} className="mt-2 p-1 bg-red-500/10 hover:bg-red-500/20 rounded text-red-400">
                                <RefreshCw size={14} />
                            </button>
                        </div>
                    ) : (
                        categories.map(cat => (
                            <div key={cat.id}>
                                {cat.name !== "频道列表" && (
                                    <div className="flex items-center justify-between px-2 mb-1 group text-[#949BA4] hover:text-[#DBDEE1] cursor-pointer">
                                        <span className="text-xs font-bold uppercase hover:underline">{cat.name}</span>
                                        <Plus size={14} className="opacity-0 group-hover:opacity-100" />
                                    </div>
                                )}
                                <div className="space-y-0.5">
                                    {cat.channels.map(channel => (
                                        <button
                                            key={channel.id}
                                            onClick={() => setActiveChannel(channel)}
                                            className={cn(
                                                "w-full flex items-center px-2 py-1.5 rounded transition-colors group relative",
                                                activeChannel?.id === channel.id 
                                                    ? "bg-[#404249] text-white" 
                                                    : channel.hasUnread 
                                                        ? "text-white font-medium hover:bg-[#35373c]" 
                                                        : "text-gray-400 hover:bg-[#35373c] hover:text-gray-200"
                                            )}
                                        >
                                            {/* Left Indicator for Unread */}
                                            {channel.hasUnread && activeChannel?.id !== channel.id && (
                                                <div className="absolute left-0 w-1 h-2 bg-white rounded-r-full my-auto top-0 bottom-0" />
                                            )}
                                            {channel.type === 'Voice' ? (
                                                <Volume2 size={18} className="mr-1.5" />
                                            ) : channel.type === 'Forum' ? (
                                                <MessageSquare size={18} className="mr-1.5" />
                                            ) : (
                                                <Hash size={18} className={cn("mr-1.5", channel.hasUnread ? "text-white" : "text-gray-500 group-hover:text-gray-400")} />
                                            )}
                                            <span className={cn("truncate font-medium", channel.hasUnread ? "text-white" : "")}>{channel.name}</span>
                                            
                                            {/* Right Indicator for Mentions (Red Dot) */}
                                            {channel.unreadCount && channel.unreadCount > 0 ? (
                                                <div className="ml-auto min-w-[8px] h-2 bg-red-500 rounded-full shadow-[0_0_4px_rgba(239,68,68,0.8)]" />
                                            ) : null}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* User Area */}
                <div className="bg-[#232428] p-3 m-2 rounded-xl flex items-center gap-2 relative">
                    <div 
                        className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer hover:bg-white/5 p-1 rounded transition-colors"
                        onClick={(e) => user && handleUserClick(e, user, 'profile')}
                        data-user-trigger-id={user?.id}
                    >
                        <div className="w-8 h-8 rounded-full bg-gray-600 overflow-hidden shrink-0">
                            {user?.avatarUrl ? (
                                <img src={getAvatarUrl(user.avatarUrl)} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">
                                    {(user?.nickname || user?.username || '?').substring(0, 1).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div 
                                className="text-sm font-medium truncate"
                                style={{ color: user?.roleColor || getUserColor(user?.id || 0) }}
                            >
                                {user?.nickname || user?.username}
                            </div>
                            <div className="text-xs text-gray-400 truncate">#{user?.username}</div>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <button 
                            className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white relative mr-1" 
                            onClick={(e) => {
                                e.stopPropagation();
                                setEditProfileInitialTab('friends');
                                setIsEditProfileOpen(true);
                            }}
                            title="通知"
                        >
                            <Bell size={16} />
                            {(unreadDmCount + pendingRequestsCount) > 0 && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-[#232428]"></span>
                            )}
                        </button>
                        <button className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white" onClick={onReturnToLauncher} title="Return to Launcher">
                             <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#313338] relative">
                {activeChannel?.type === 'Forum' ? (
                    activePost ? (
                        <PostThreadView 
                            channel={activeChannel}
                            post={activePost}
                            user={user}
                            onBack={() => setActivePost(null)}
                            connection={connectionRef.current}
                            members={members}
                            roles={roles}
                            onAck={(lastReadMessageId) => {
                                // Update post unread state locally
                                setActivePost(prev => prev ? { ...prev, hasUnread: false, unreadCount: 0, lastReadMessageId } : null);
                            }}
                        />
                    ) : (
                        <ForumListView 
                            channel={activeChannel}
                            user={user}
                            onPostClick={(post) => setActivePost(post)}
                            connection={connectionRef.current}
                            onChannelReadStatusChange={(hasUnread) => {
                                if (activeChannel && activeChannel.hasUnread !== hasUnread) {
                                    setCategories(prev => prev.map(cat => ({
                                        ...cat,
                                        channels: cat.channels.map(c => 
                                            c.id === activeChannel.id 
                                                ? { ...c, hasUnread } 
                                                : c
                                        )
                                    })));
                                    // Also update activeChannel state to reflect the change immediately
                                    setActiveChannel(prev => prev ? { ...prev, hasUnread } : null);
                                }
                            }}
                        />
                    )
                ) : (
                    <>
                        {/* Header */}
                        <div className="h-12 border-b border-[#26272d] flex items-center px-4 justify-between shadow-sm shrink-0 bg-[#313338]" onMouseDown={onDrag}>
                            <div className="flex items-center gap-3 text-white font-bold overflow-hidden">
                                <Hash size={24} className="text-[#949BA4] shrink-0" />
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <span className="shrink-0 whitespace-nowrap">{activeChannel?.name || "选择频道"}</span>
                                    {activeChannel?.description && (
                                        <>
                                            <span className="text-[#41434A] font-light">|</span>
                                            <span className="text-xs text-[#949BA4] font-normal truncate">{activeChannel.description}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <Users size={24} className={cn("cursor-pointer transition-colors", showMembers ? "text-white" : "text-[#B5BAC1]")} onClick={() => setShowMembers(!showMembers)} />
                                
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="搜索" 
                                        className="bg-[#1e1f22] text-sm text-gray-300 rounded px-2 py-1 w-36 transition-all focus:w-48 outline-none" 
                                    />
                                    <Search size={16} className="absolute right-2 top-1.5 text-gray-400" />
                                </div>
                            </div>
                        </div>

                        {/* New Messages Banner (Floating) */}
                        {activeChannel && activeChannel.hasUnread && activeChannel.lastReadAt && showUnreadBanner && (
                             <div 
                                className="absolute top-0 left-4 right-4 h-8 bg-[#5865F2] flex items-center justify-between px-4 cursor-pointer hover:bg-[#4752C4] transition-colors shadow-lg z-20 rounded-b-md"
                                onClick={scrollToNewMessageDivider}
                             >
                                <div className="flex items-center gap-2 text-xs text-white">
                                    <span className="font-bold">新消息</span>
                                    <span className="text-white/90">
                                        自 {format(new Date(activeChannel.lastReadAt), 'HH:mm')} 以来有 {activeChannel.unreadCount || 0} 条消息
                                    </span>
                                </div>
                                <div 
                                    className="flex items-center gap-1 text-xs text-white font-medium hover:text-gray-200"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkAsRead();
                                    }}
                                >
                                    <CheckCheck size={14} />
                                    <span>标记为已读</span>
                                </div>
                            </div>
                        )}

                        {/* Messages List */}
                        <div 
                            ref={scrollContainerRef}
                            className="flex-1 overflow-y-auto custom-scrollbar p-4 relative"
                            onScroll={() => {
                                checkUnreadBannerVisibility();
                                if (scrollContainerRef.current) {
                                    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
                                    
                                    // Mark as read when near bottom
                                    if (activeChannel?.hasUnread && messages.length > 0) {
                                        if (scrollHeight - scrollTop - clientHeight < 100) {
                                            handleMarkAsRead();
                                        }
                                    }

                                    // Infinite Scroll: Load more when near top
                                    if (scrollTop < 50 && hasMore && !isFetchingMore && messages.length > 0) {
                                        const oldestMessage = messages[0];
                                        loadMessages(activeChannel!.id, oldestMessage.createdAt);
                                    }
                                }
                            }}
                        >
                            {activeChannel ? (
                                <>
                                    {messages.length === 0 && !isLoading && (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
                                            <MessageSquare size={48} className="mb-2" />
                                            <p>暂无消息，开始聊天吧！</p>
                                        </div>
                                    )}
                                    
                                    {messages.map((message, index) => {
                                        const showHeader = index === 0 || 
                                            messages[index - 1].userId !== message.userId || 
                                            (new Date(message.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() > 300000) ||
                                            !!message.replyTo;

                                        // New Message Divider Logic
                                        const isNewMessageDivider = activeChannel?.lastReadMessageId !== undefined && 
                                            message.id > activeChannel.lastReadMessageId && 
                                            (index === 0 || messages[index - 1].id <= activeChannel.lastReadMessageId) &&
                                            message.userId !== user?.id;

                                        return (
                                            <React.Fragment key={message.id}>
                                                {isNewMessageDivider && (
                                                    <div ref={newMessageDividerRef} className="flex items-center my-4 mx-4 select-none">
                                                        <div className="h-[1px] bg-red-500 flex-1 opacity-50" />
                                                        <span className="mx-2 text-xs font-bold text-red-500 uppercase flex items-center gap-1">
                                                            新消息
                                                        </span>
                                                        <div className="h-[1px] bg-red-500 flex-1 opacity-50" />
                                                    </div>
                                                )}
                                                <MessageItem
                                                    message={message}
                                                    user={user}
                                                    members={members}
                                                    roles={roles}
                                                    activeChannelId={activeChannel.id}
                                                    isNewMessageDivider={false}
                                                    showHeader={showHeader}
                                                    isActionMenuOpen={activeMoreMenuId === message.id}
                                                    
                                                    onUserClick={handleUserClick}
                                                    onReply={handleReply}
                                                    onReaction={handleToggleMessageReaction}
                                                    onOpenMoreMenu={handleOpenMoreMenu}
                                                    onCloseMoreMenu={handleCloseMoreMenu}
                                                    onScrollToMessage={handleScrollToMessage}
                                                    
                                                    onImageLoad={index === messages.length - 1 ? scrollToBottom : undefined}
                                                />
                                            </React.Fragment>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-500">
                                    请选择一个频道开始聊天
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="px-4 pb-6 pt-2 shrink-0 bg-[#313338]">
                            {/* Attachments Preview */}
                            {pendingFiles.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto py-2 px-1 mb-2 bg-[#2b2d31] rounded-lg">
                                    {pendingFiles.map((file, index) => (
                                        <div key={index} className="relative group shrink-0 w-24 h-24 bg-[#1e1f22] rounded overflow-hidden border border-[#1e1f22]">
                                            <div className="relative w-full h-full">
                                                <img 
                                                    src={file.previewUrl} 
                                                    alt="attachment" 
                                                    className={cn("w-full h-full object-cover transition-all duration-200", file.isSpoiler && "blur-md brightness-50")} 
                                                />
                                                {file.isSpoiler && (
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                        <span className="text-[10px] font-bold text-white bg-black/50 px-1 rounded">SPOILER</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Actions */}
                                            <div className="absolute top-1 right-1 flex flex-col gap-1">
                                                <button 
                                                    onClick={() => removePendingFile(index)}
                                                    className="bg-black/50 hover:bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="移除附件"
                                                >
                                                    <X size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => toggleSpoiler(index)}
                                                    className={cn(
                                                        "bg-black/50 hover:bg-[#5865F2] text-white p-1.5 rounded-full transition-all",
                                                        file.isSpoiler ? "opacity-100 bg-[#5865F2]" : "opacity-0 group-hover:opacity-100"
                                                    )}
                                                    title={file.isSpoiler ? "取消剧透" : "标记为剧透"}
                                                >
                                                    {file.isSpoiler ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div 
                                className="bg-[#383a40] rounded-lg p-2.5 flex items-start gap-3 relative shadow-inner"
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
                                    className="text-[#B5BAC1] p-1 h-8 flex items-center group cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                    title="上传图片"
                                >
                                    <Plus size={24} className="bg-[#B5BAC1] text-[#383a40] rounded-full p-0.5 transition-all duration-200 group-hover:bg-[#D1D5D9] group-hover:text-black group-hover:scale-110" />
                                </button>
                                
                                <div className="flex-1 relative">
                                     {editingMessageId && (
                                        <div className="absolute -top-6 left-0 text-xs text-gray-400 flex items-center gap-1">
                                            <span>正在编辑消息...</span>
                                            <button onClick={cancelEditing} className="text-blue-400 hover:underline">(取消)</button>
                                        </div>
                                    )}
                                    {replyingToMessage && !editingMessageId && (
                                        <div className="absolute -top-8 left-0 right-0 bg-[#2b2d31] text-xs text-gray-300 flex items-center justify-between px-3 py-1 rounded-t-md border-b border-[#202225]">
                                            <div className="flex items-center gap-1 truncate">
                                                <span className="text-gray-400">回复给</span>
                                                <span className="font-medium" style={{ color: replyingToMessage.user?.roleColor || '#ffffff' }}>
                                                    @{replyingToMessage.user?.nickname || replyingToMessage.user?.username || 'Unknown'}
                                                </span>
                                            </div>
                                            <button onClick={() => setReplyingToMessage(null)} className="text-gray-400 hover:text-white">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}
                                    <AutoResizeTextarea
                                        ref={inputRef}
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={`发送消息给 #${activeChannel?.name || '频道'}`}
                                        className="py-1 min-h-[24px]"
                                        mentionCandidates={mentionCandidates}
                                    />
                                </div>
                                
                                <div className="flex items-center gap-2 self-end h-8 relative">
                                    {showEmojiPicker && (
                                        <div className="absolute bottom-full right-0 mb-2 z-50 shadow-xl rounded-lg overflow-hidden" ref={emojiPickerRef}>
                                            <EmojiPicker
                                                theme={Theme.DARK}
                                                emojiStyle={EmojiStyle.NATIVE}
                                                onEmojiClick={(emojiData) => {
                                                    setInputValue(prev => prev + emojiData.emoji);
                                                }}
                                            />
                                        </div>
                                    )}
                                     <button 
                                        ref={emojiButtonRef}
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className="text-[#B5BAC1] hover:text-[#D1D5D9] cursor-pointer"
                                     >
                                        <Smile size={24} />
                                     </button>
                                     {(inputValue.trim() || pendingFiles.length > 0) && (
                                        <button onClick={handleSendMessage} className="text-[#B5BAC1] hover:text-white">
                                            <Send size={24} />
                                        </button>
                                     )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Right Sidebar: Members */}
            {showMembers && (
                <div className="w-60 bg-[#2b2d31] flex flex-col shrink-0 overflow-hidden border-l border-[#26272d]">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                         {/* Grouped Online Members */}
                         {groupedMembers.map((group) => (
                             <div key={group.role ? group.role.id : 'online'} className="mb-6">
                                <h3 className="text-xs font-bold text-[#949BA4] uppercase mb-2 px-2">
                                    {group.role ? group.role.name : '在线'} — {group.members.length}
                                </h3>
                                {group.members.map(member => (
                                    <div key={member.id} onClick={(e) => handleUserClick(e, member, 'member')} data-user-trigger-id={member.id} className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-[#35373c] cursor-pointer group opacity-100">
                                        <div className="w-8 h-8 rounded-full bg-gray-600 relative overflow-hidden">
                                            {member.avatarUrl ? (
                                                <img src={getAvatarUrl(member.avatarUrl)} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center font-bold text-white text-xs">
                                                    {member.username[0].toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                        <div 
                                            className="text-sm font-medium truncate"
                                            style={{ color: getUserColor(member.id) }}
                                        >
                                            {member.nickname || member.username}
                                        </div>
                                        {/* Status Text could go here */}
                                    </div>
                                    </div>
                                ))}
                             </div>
                         ))}

                         {/* Offline Members */}
                         <div className="mb-6">
                            <h3 className="text-xs font-bold text-[#949BA4] uppercase mb-2 px-2">离线 — {offlineMembers.length}</h3>
                            {offlineMembers.map(member => (
                                <div key={member.id} onClick={(e) => handleUserClick(e, member, 'member')} data-user-trigger-id={member.id} className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-[#35373c] cursor-pointer group opacity-50 hover:opacity-100">
                                    <div className="w-8 h-8 rounded-full bg-gray-600 relative overflow-hidden">
                                        {member.avatarUrl ? (
                                            <img src={getAvatarUrl(member.avatarUrl)} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-bold text-white text-xs">
                                                {member.username[0].toUpperCase()}
                                            </div>
                                        )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                        <div 
                                            className="text-sm font-medium truncate"
                                            style={{ color: getUserColor(member.id) }}
                                        >
                                            {member.nickname || member.username}
                                        </div>
                                    </div>
                                </div>
                            ))}
                         </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            <CreateChannelModal 
                isOpen={isCreateChannelModalOpen} 
                onClose={() => setIsCreateChannelModalOpen(false)} 
                onCreated={initData} 
            />

            <ConfirmationModal 
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteMessage}
                title="删除消息"
                message="确定要删除这条消息吗？此操作无法撤销。"
                isDangerous={true}
            />

            <CommunitySettingsModal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
                onUpdate={() => {
                    initData();
                }}
            />

            {user && (
                <EditProfileModal
                    isOpen={isEditProfileOpen}
                    onClose={() => {
                        setIsEditProfileOpen(false);
                        // Refresh notifications when modal closes
                        api.get('/DirectMessages/unread-count').then(res => setUnreadDmCount(res.data.count)).catch(console.error);
                        api.get('/Friends/pending').then(res => setPendingRequestsCount(res.data.length)).catch(console.error);
                        // Also reset initial tab
                        setTimeout(() => setEditProfileInitialTab('profile'), 300);
                    }}
                    currentUser={user}
                    onUpdate={onUpdateUser}
                    initialTab={editProfileInitialTab}
                />
            )}

            {activeMoreMenuId && moreMenuTriggerRect && (
                 (() => {
                     const message = messages.find(m => m.id === activeMoreMenuId);
                     if (!message) return null;
                     return (
                         <MessageActionMenu 
                             triggerRect={moreMenuTriggerRect}
                             onClose={handleCloseMoreMenu}
                             onReply={() => handleReply(message)}
                             onCopy={() => handleShare(message)}
                             onCopyLink={() => handleCopyLink(message)}
                             onReaction={(emoji) => {
                                 const hasReacted = message.reactions?.some(r => r.emoji === emoji && r.userId === user?.id);
                                 handleToggleMessageReaction(message.id, emoji, !!hasReacted);
                             }}
                             onEdit={canManageMessage(message) && !message.isSending ? () => startEditing(message) : undefined}
                             onDelete={canManageMessage(message) && !message.isSending ? () => handleRequestDelete(message) : undefined}
                         />
                     );
                 })()
            )}

            {selectedUser && selectedUserPosition && (
                <UserProfileCard 
                    key={selectedUser.id}
                    user={selectedUser}
                    position={selectedUserPosition}
                    onClose={() => {
                        setSelectedUser(null);
                        setActiveCardType(null);
                    }}
                    currentUser={user} // Pass current user for friend actions
                    onEditProfile={() => setIsEditProfileOpen(true)}
                    customStyle={selectedUserStyle}
                />
            )}
        </div>
        </SocialContext.Provider>
    );
};

export default SocialPage;