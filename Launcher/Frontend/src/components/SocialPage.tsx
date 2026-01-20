import React, { useState, useEffect, useRef } from 'react';
import { HubConnectionBuilder, HubConnection, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { api, getAvatarUrl, COMMUNITY_BASE_URL } from '../lib/api';
import { type User, type EmbedData, type Post, type CommunityRole, type Reaction } from '../types';
import LinkPreviewCard from './LinkPreviewCard';
import { ReactionList, MessageReactionAction, QuickReactionGroup, trackReactionUsage, ActionTooltip } from './ReactionComponents';
import ConfirmationModal from './ConfirmationModal';
import CommunitySettingsModal from './CommunitySettingsModal';
import CreateChannelModal from './CreateChannelModal';
import EditProfileModal from './EditProfileModal';
import UserProfileCard from './UserProfileCard';
import { ForumListView, PostThreadView } from './ForumComponents';
import { 
    Hash, 
    Plus, 
    Send, 
    Trash2, 
    Edit2,
    MessageSquare,
    Users,
    Search,
    Smile,
    AlertCircle,
    RefreshCw,
    Wifi,
    WifiOff,
    LogOut,
    Reply,
    Share2,
    MoreHorizontal,
    Volume2,
    ChevronDown,
    Settings,
    Bell
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface SocialPageProps {
    user: User | null;
    onReturnToLauncher: () => void;
    onMinimize: () => void;
    onClose: () => void;
    onDrag: (e: React.MouseEvent) => void;
    onUpdateUser: (user: User) => void;
}

interface Channel {
    id: number;
    name: string;
    description?: string;
    type: 'Chat' | 'Voice' | 'Forum';
    categoryId?: number;
}

interface Category {
    id: number;
    name: string;
    sortOrder: number;
    channels: Channel[];
}

interface Message {
    id: number;
    channelId: number;
    userId: number;
    content: string;
    createdAt: string;
    updatedAt?: string;
    isDeleted?: boolean;
    // Flattened user data from backend
    username?: string;
    nickname?: string;
    avatarUrl?: string;
    roleColor?: string;
    // Nested user object for optimistic UI
    user?: {
        id: number;
        username: string;
        nickname?: string;
        avatarUrl?: string;
        accessLevel?: number;
    };
    embeds?: EmbedData[];
    reactions?: Reaction[];
    isSending?: boolean; // Optimistic UI
    isError?: boolean;
}

interface Member {
    id: number;
    username: string;
    nickname?: string;
    avatarUrl?: string;
    preferredStatus: number; // 0=Online, 1=Idle, 2=DND, 3=Offline
    accessLevel: number;
    roles: number[];
    roleColor?: string;
}

const SocialPage: React.FC<SocialPageProps> = ({ 
    user, 
    onReturnToLauncher, 
    onMinimize, 
    onClose, 
    onDrag,
    onUpdateUser
}) => {
    // State
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
    const [activePost, setActivePost] = useState<Post | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isConnecting, setIsConnecting] = useState(true);
    const [connectionState, setConnectionState] = useState<HubConnectionState>(HubConnectionState.Disconnected);
    const [error, setError] = useState<string | null>(null);
    
    // Members State
    const [members, setMembers] = useState<Member[]>([]);
    const [roles, setRoles] = useState<CommunityRole[]>([]);
    const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set());
    const [showMembers, setShowMembers] = useState(true);

    // Edit State
    const [editingMessageId, setEditingMessageId] = useState<number | null>(null);

    // Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState<number | null>(null);
    const [showServerMenu, setShowServerMenu] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedUserPosition, setSelectedUserPosition] = useState<{ x: number, y: number } | null>(null);
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

    // --- SignalR Setup ---
    const connectSignalR = async () => {
        if (!user) return;
        
        setIsConnecting(true);
        try {
            const newConnection = new HubConnectionBuilder()
                .withUrl(`/hubs/community`, {
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
            setIsConnecting(false);
            
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
            setIsConnecting(false);
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
            
            // 1. Fetch Channels (Critical, Public)
            let channels: Channel[] = [];
            try {
                const channelsRes = await api.get('/Community/channels');
                channels = channelsRes.data;
            } catch (err) {
                console.error("Failed to fetch channels", err);
                throw new Error("无法加载频道列表，请检查网络连接。");
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
            setCategories([defaultCategory]);
            setMembers(membersData);
            setRoles(rolesData);
            setServerSettings(settingsData);

            // 4. Fetch Notifications
            try {
                const unreadRes = await api.get('/DirectMessages/unread-count');
                setUnreadDmCount(unreadRes.data.count);
                const pendingRes = await api.get('/Friends/pending');
                setPendingRequestsCount(pendingRes.data.length);
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

    useEffect(() => {
        initData();
    }, []);

    useEffect(() => {
        setActivePost(null);
    }, [activeChannel?.id]);

    // --- Fetch Messages ---
    useEffect(() => {
        if (!activeChannel) return;

        const fetchMessages = async () => {
            setIsLoading(true);
            try {
                const res = await api.get(`/Community/channels/${activeChannel.id}/messages?limit=50`);
                const sorted = res.data.sort((a: Message, b: Message) => 
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );
                setMessages(sorted);
                
                if (connectionRef.current?.state === HubConnectionState.Connected) {
                    connectionRef.current.invoke("JoinChannel", activeChannel.id.toString());
                }
            } catch (err) {
                console.error("Failed to fetch messages", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMessages();

        return () => {
            if (connectionRef.current?.state === HubConnectionState.Connected && activeChannel) {
                connectionRef.current.invoke("LeaveChannel", activeChannel.id.toString());
            }
        };
    }, [activeChannel, connectionState]);

    // --- Scroll Handling ---
    const prevMessagesLength = useRef(0);
    useEffect(() => {
        if (isLoading || messages.length > prevMessagesLength.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
        prevMessagesLength.current = messages.length;
    }, [messages, isLoading]);

    // --- Handlers ---
    const canManageMessage = (message: Message) => {
        if (!user) return false;
        if (user.id === message.userId) return true; // Author

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

    const handleSendMessage = async () => {
        if (!inputValue.trim() || !activeChannel || !user) return;

        const content = inputValue.trim();
        
        if (editingMessageId) {
            await handleEditMessage(content);
            return;
        }

        setInputValue('');
        if (inputRef.current) inputRef.current.style.height = 'auto';

        const tempId = Date.now();
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
                avatarUrl: user.avatarUrl
            },
            isSending: true
        };
        
        setMessages(prev => [...prev, optimisticMessage]);

        try {
            if (connectionRef.current?.state === HubConnectionState.Connected) {
                await connectionRef.current.invoke("SendMessage", 
                    activeChannel.id.toString(), 
                    content, 
                    null, 
                    null, 
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
            if (inputRef.current) inputRef.current.style.height = 'auto';

            await api.put(`/Community/messages/${editingMessageId}`, {
                content: newContent
            });
        } catch (err) {
            console.error("Failed to edit", err);
            alert("编辑失败");
        }
    };

    const startEditing = (message: Message) => {
        setEditingMessageId(message.id);
        setInputValue(message.content);
        if (inputRef.current) {
            inputRef.current.focus();
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.style.height = 'auto';
                    inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 300)}px`;
                }
            }, 0);
        }
    };

    const cancelEditing = () => {
        setEditingMessageId(null);
        setInputValue('');
        if (inputRef.current) inputRef.current.style.height = 'auto';
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
        if (e.key === 'Escape' && editingMessageId) {
            cancelEditing();
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

    const handleUserClick = (e: React.MouseEvent, targetUser: any) => {
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

        setSelectedUser(userObj);
        setSelectedUserPosition({ x: e.clientX, y: e.clientY });
    };

    const handleReply = (message: Message) => {
        setInputValue(`@${message.user?.nickname || message.user?.username} `);
        if (inputRef.current) inputRef.current.focus();
    };

    const handleShare = (message: Message) => {
        navigator.clipboard.writeText(message.content);
        // Could use a toast here, but for now just log or do nothing
        console.log("Copied to clipboard");
    };

    const handleToggleMessageReaction = async (messageId: number, emoji: string) => {
        if (!connectionRef.current || !user) return;
        const message = messages.find(m => m.id === messageId);
        if (!message) return;
        
        const hasReacted = message.reactions?.some(r => r.emoji === emoji && r.userId === user.id);
        try {
            if (hasReacted) {
                await connectionRef.current.invoke("RemoveReaction", messageId, emoji);
            } else {
                await connectionRef.current.invoke("AddReaction", messageId, emoji);
                trackReactionUsage(emoji);
            }
        } catch (err) {
            console.error("Failed to toggle message reaction", err);
        }
    };

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
                    !processedMemberIds.has(m.id) && m.roles.includes(role.id)
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

    const userRoleColor = React.useMemo(() => {
        if (!user) return null;
        return getUserColor(user.id);
    }, [user, members]);

    return (
        <div className="flex h-full w-full bg-[#313338] text-gray-100 font-sans">
            {/* Left Sidebar: Channels */}
            <div className="w-60 bg-[#2b2d31] flex flex-col shrink-0">
                {/* Server Header with Banner */}
                <div 
                    className="h-32 relative shadow-sm flex flex-col justify-end p-4 bg-cover bg-center transition-all hover:bg-gray-800 cursor-pointer group"
                    style={{ backgroundImage: `url('${serverSettings.themeImageUrl || '/images/gm_img.jpg'}')` }}
                    onMouseDown={onDrag}
                    onClick={() => setShowServerMenu(!showServerMenu)}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div className="relative z-10 flex items-center justify-between">
                         <div>
                             <div className="font-bold text-white text-base shadow-black drop-shadow-md">{serverSettings.serverName || "Story of Time"}</div>
                             <div className="text-[10px] text-gray-300 flex items-center gap-1">
                                {connectionState === HubConnectionState.Connected ? (
                                    <span className="flex items-center gap-1 text-green-400"><div className="w-1.5 h-1.5 rounded-full bg-green-400"></div> Online</span>
                                ) : (
                                    <span className="flex items-center gap-1 text-red-400"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> Offline</span>
                                )}
                             </div>
                         </div>
                         <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                             <ChevronDown size={20} />
                         </div>
                    </div>

                    {/* Dropdown Menu */}
                    {showServerMenu && (
                        <div className="absolute top-12 right-4 w-56 bg-[#111214] rounded shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in duration-100 border border-[#1e1f22]">
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
                                <div className="flex items-center justify-between px-2 mb-1 group text-[#949BA4] hover:text-[#DBDEE1] cursor-pointer">
                                    <span className="text-xs font-bold uppercase hover:underline">{cat.name}</span>
                                    <Plus size={14} className="opacity-0 group-hover:opacity-100" />
                                </div>
                                <div className="space-y-0.5">
                                    {cat.channels.map(channel => (
                                        <button
                                            key={channel.id}
                                            onClick={() => setActiveChannel(channel)}
                                            className={cn(
                                                "w-full flex items-center px-2 py-1.5 rounded text-gray-400 hover:bg-[#35373c] hover:text-gray-200 transition-colors group",
                                                activeChannel?.id === channel.id && "bg-[#404249] text-white"
                                            )}
                                        >
                                            {channel.type === 'Voice' ? (
                                                <Volume2 size={18} className="mr-1.5" />
                                            ) : channel.type === 'Forum' ? (
                                                <MessageSquare size={18} className="mr-1.5" />
                                            ) : (
                                                <Hash size={18} className="mr-1.5 text-gray-500 group-hover:text-gray-400" />
                                            )}
                                            <span className="truncate font-medium">{channel.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* User Area */}
                <div className="bg-[#232428] p-3 m-2 rounded-xl flex items-center gap-2">
                    <div 
                        className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer hover:bg-white/5 p-1 rounded transition-colors"
                        onClick={(e) => user && handleUserClick(e, user)}
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
                        />
                    ) : (
                        <ForumListView 
                            channel={activeChannel}
                            user={user}
                            onPostClick={(post) => setActivePost(post)}
                            connection={connectionRef.current}
                        />
                    )
                ) : (
                    <>
                        {/* Header */}
                        <div className="h-12 border-b border-[#26272d] flex items-center px-4 justify-between shadow-sm shrink-0 bg-[#313338]" onMouseDown={onDrag}>
                            <div className="flex items-center gap-2 text-white font-bold">
                                <Hash size={24} className="text-[#949BA4]" />
                                <div className="flex flex-col">
                                    <span>{activeChannel?.name || "选择频道"}</span>
                                    {activeChannel?.description && <span className="text-[10px] text-gray-400 font-normal">{activeChannel.description}</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
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

                        {/* Messages List */}
                        <div 
                            ref={scrollContainerRef}
                            className="flex-1 overflow-y-auto custom-scrollbar p-4"
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
                                        const isMe = user?.id === message.userId;
                                        const showHeader = index === 0 || 
                                            messages[index - 1].userId !== message.userId || 
                                            (new Date(message.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() > 300000);

                                        return (
                                            <div key={message.id} className={cn("group flex hover:bg-[#2e3035]/40 transition-colors relative -mx-4 px-4 py-0.5", showHeader ? "mt-6" : "mt-0.5")}>
                                                {showHeader ? (
                                                    <div 
                                                        className="w-10 h-10 rounded-full bg-gray-600 mr-4 shrink-0 overflow-hidden cursor-pointer hover:opacity-80 mt-0.5"
                                                        onClick={(e) => message.user && handleUserClick(e, message.user)}
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
                                                                style={{ color: getUserColor(message.userId, message.roleColor) }}
                                                                onClick={(e) => message.user && handleUserClick(e, message.user)}
                                                            >
                                                                {message.user?.nickname || message.user?.username}
                                                            </span>
                                                            <span className="text-xs text-gray-400 ml-1">
                                                                {format(new Date(message.createdAt), 'MM/dd HH:mm')}
                                                            </span>
                                                        </div>
                                                    )}
                                                    
                                                    <div className={cn("text-[#dcddde] whitespace-pre-wrap break-words leading-relaxed text-[13px]", message.isSending && "opacity-70", message.isError && "text-red-500")}>
                                                        {message.content}
                                                        {message.updatedAt && message.createdAt !== message.updatedAt && (
                                                            <span className="text-[10px] text-gray-500 ml-1">(已编辑)</span>
                                                        )}
                                                    </div>

                                                    {/* Embeds */}
                                                    {message.embeds && message.embeds.length > 0 && (
                                                        <LinkPreviewCard embeds={message.embeds} />
                                                    )}

                                                    <ReactionList 
                                                        reactions={message.reactions || []}
                                                        currentUserId={user?.id || 0}
                                                        onToggleReaction={(emoji) => handleToggleMessageReaction(message.id, emoji)}
                                                        className="mt-1"
                                                    />
                                                </div>

                                                {/* Actions Group (Hover) */}
                                                <div className="absolute right-4 top-0 -translate-y-1 bg-[#313338] border border-[#3f4147] rounded-[8px] shadow-[0_2px_4px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_8px_rgba(0,0,0,0.24)] opacity-0 group-hover:opacity-100 transition-all flex items-center p-1 z-10">
                                                    <QuickReactionGroup onEmojiSelect={(emoji) => handleToggleMessageReaction(message.id, emoji)} />
                                                    <MessageReactionAction onEmojiSelect={(emoji) => handleToggleMessageReaction(message.id, emoji)} />
                                                    <ActionTooltip text="回复">
                                                        <button 
                                                            onClick={() => handleReply(message)}
                                                            className="w-8 h-8 flex items-center justify-center hover:bg-[#404249] rounded transition-colors text-gray-400 hover:text-gray-200" 
                                                        >
                                                            <Reply size={20} />
                                                        </button>
                                                    </ActionTooltip>
                                                    <ActionTooltip text="复制内容">
                                                        <button 
                                                            onClick={() => handleShare(message)}
                                                            className="w-8 h-8 flex items-center justify-center hover:bg-[#404249] rounded transition-colors text-gray-400 hover:text-gray-200" 
                                                        >
                                                            <Share2 size={20} />
                                                        </button>
                                                    </ActionTooltip>
                                                    {canManageMessage(message) && !message.isSending && (
                                                        <>
                                                            <ActionTooltip text="编辑">
                                                                <button 
                                                                    onClick={() => startEditing(message)}
                                                                    className="w-8 h-8 flex items-center justify-center hover:bg-[#404249] rounded transition-colors text-gray-400 hover:text-gray-200" 
                                                                >
                                                                    <Edit2 size={20} />
                                                                </button>
                                                            </ActionTooltip>
                                                            <ActionTooltip text="删除">
                                                                <button 
                                                                    onClick={() => {
                                                                        setMessageToDelete(message.id);
                                                                        setDeleteModalOpen(true);
                                                                    }}
                                                                    className="w-8 h-8 flex items-center justify-center hover:bg-[#404249] rounded transition-colors text-gray-400 hover:text-red-400"
                                                                >
                                                                    <Trash2 size={20} />
                                                                </button>
                                                            </ActionTooltip>
                                                        </>
                                                    )}
                                                    <ActionTooltip text="更多">
                                                        <button className="w-8 h-8 flex items-center justify-center hover:bg-[#404249] rounded transition-colors text-gray-400 hover:text-gray-200">
                                                            <MoreHorizontal size={20} />
                                                        </button>
                                                    </ActionTooltip>
                                                </div>
                                            </div>
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
                            <div className="bg-[#383a40] rounded-lg p-2.5 flex items-start gap-3 relative shadow-inner">
                                <button className="text-[#B5BAC1] hover:text-[#D1D5D9] p-1 h-8 flex items-center">
                                    <Plus size={24} className="bg-[#B5BAC1] text-[#383a40] rounded-full p-0.5" />
                                </button>
                                
                                <div className="flex-1 relative">
                                     {editingMessageId && (
                                        <div className="absolute -top-6 left-0 text-xs text-gray-400 flex items-center gap-1">
                                            <span>正在编辑消息...</span>
                                            <button onClick={cancelEditing} className="text-blue-400 hover:underline">(取消)</button>
                                        </div>
                                    )}
                                    <textarea
                                        ref={inputRef}
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={`发送消息给 #${activeChannel?.name || '频道'}`}
                                        className="w-full bg-transparent text-[#dcddde] placeholder-[#72767d] outline-none resize-none overflow-hidden py-1 h-auto min-h-[24px]"
                                        rows={1}
                                    />
                                </div>
                                
                                <div className="flex items-center gap-2 self-end h-8">
                                     <Smile size={24} className="text-[#B5BAC1] hover:text-[#D1D5D9] cursor-pointer" />
                                     {inputValue.trim() && (
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
                                    <div key={member.id} onClick={(e) => handleUserClick(e, member)} className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-[#35373c] cursor-pointer group opacity-100">
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
                                <div key={member.id} onClick={(e) => handleUserClick(e, member)} className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-[#35373c] cursor-pointer group opacity-50 hover:opacity-100">
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

            {selectedUser && selectedUserPosition && (
                <UserProfileCard 
                    user={selectedUser}
                    position={selectedUserPosition}
                    onClose={() => setSelectedUser(null)}
                    currentUser={user} // Pass current user for friend actions
                    onEditProfile={() => setIsEditProfileOpen(true)}
                />
            )}
        </div>
    );
};

export default SocialPage;