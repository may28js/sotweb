import React, { useState, useEffect, useRef } from 'react';
import { type User, type EmbedData } from '../types';
import { api, getAvatarUrl } from '../lib/api';
import { X, Upload, Check, Users, UserPlus, Search, Hash, Mail, Ghost } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import LinkPreviewCard from './LinkPreviewCard';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User;
    onUpdate: (updatedUser: User) => void;
    initialTab?: 'profile' | 'friends';
    initialDmUser?: User | null;
}

interface FriendRequest {
    id: number;
    requester: User;
    createdAt: string;
}

interface DmConversation {
    id: number;
    username: string;
    nickname?: string;
    avatarUrl?: string;
    preferredStatus?: number;
    unreadCount?: number;
}

interface DirectMessage {
    id: number;
    senderId: number;
    receiverId: number;
    content: string;
    createdAt: string;
    isRead: boolean;
    embeds?: EmbedData[];
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, currentUser, onUpdate, initialTab = 'profile', initialDmUser }) => {
    // Profile State
    const [nickname, setNickname] = useState(currentUser.nickname || '');
    const [aboutMe, setAboutMe] = useState(currentUser.aboutMe || '');
    const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'friends'>('profile');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Social State
    const [socialTab, setSocialTab] = useState<'online' | 'all' | 'pending' | 'add'>('online');
    const [subTab, setSubTab] = useState<'friends' | 'messages'>('friends'); // New state for middle column tab
    const [selectedDmUser, setSelectedDmUser] = useState<User | null>(null);
    const [friends, setFriends] = useState<User[]>([]);
    const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
    const [conversations, setConversations] = useState<DmConversation[]>([]);
    const [messages, setMessages] = useState<DirectMessage[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [addFriendInput, setAddFriendInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setNickname(currentUser.nickname || '');
            setAboutMe(currentUser.aboutMe || '');
            setAvatarUrl(currentUser.avatarUrl || '');
            setActiveTab(initialTab);
            if (initialDmUser) {
                setActiveTab('friends');
                setSelectedDmUser(initialDmUser);
                // We don't explicitly set subTab to 'messages' because logic relies on selectedDmUser presence?
                // Actually logic at line 658 checks selectedDmUser.
                // But we might want to ensure fetching happens.
            }
        }
    }, [isOpen, currentUser, initialTab, initialDmUser]);

    useEffect(() => {
        if (isOpen && activeTab === 'friends') {
            fetchSocialData();
            // Poll for social data updates (online status, new friends, etc.)
            const interval = setInterval(fetchSocialData, 10000); 
            return () => clearInterval(interval);
        }
    }, [isOpen, activeTab]);

    useEffect(() => {
        // Switch to 'messages' subtab if user is selected from somewhere else, or default behavior
        if (activeTab === 'friends' && !selectedDmUser && subTab === 'messages') {
             // If we switch to messages tab but no user selected, maybe we don't need to do anything
        }
    }, [activeTab]);

    useEffect(() => {
        if (selectedDmUser) {
            fetchMessages(selectedDmUser.id);
            // Poll for new messages every 3 seconds (simple implementation)
            const interval = setInterval(() => fetchMessages(selectedDmUser.id), 3000);
            return () => clearInterval(interval);
        }
    }, [selectedDmUser]);

    useEffect(() => {
        // Only scroll to bottom if we have messages and:
        // 1. It's the first load for this user (we could track this, but simplistically...)
        // 2. A NEW message arrived (length increased)
        // We rely on setMessages returning the SAME reference if data hasn't changed to prevent this effect from running.
        if (messages.length > 0 && messagesEndRef.current) {
             messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, selectedDmUser?.id]);

    const fetchSocialData = async () => {
        try {
            const [friendsRes, pendingRes, conversationsRes] = await Promise.all([
                api.get('/Friends'),
                api.get('/Friends/pending'),
                api.get('/DirectMessages/conversations')
            ]);
            setFriends(friendsRes.data);
            setPendingRequests(pendingRes.data);
            setConversations(conversationsRes.data);
        } catch (error) {
            console.error("Failed to fetch social data", error);
        }
    };

    const fetchMessages = async (userId: number) => {
        try {
            const res = await api.get(`/DirectMessages/${userId}`);
            setMessages(res.data);

            // Check if there are unread messages from this user and mark them as read
            const hasUnread = res.data.some((m: DirectMessage) => m.senderId === userId && !m.isRead);
            if (hasUnread) {
                await api.post(`/DirectMessages/mark-read/${userId}`);
                // Update local conversations state to remove unread count
                setConversations(prev => prev.map(c => 
                    c.id === userId ? { ...c, unreadCount: 0 } : c
                ));
            }
        } catch (error) {
            console.error("Failed to fetch messages", error);
        }
    };

    const handleSendMessage = async () => {
        if (!selectedDmUser || !messageInput.trim()) return;
        try {
            await api.post('/DirectMessages', {
                receiverId: selectedDmUser.id,
                content: messageInput
            });
            setMessageInput('');
            fetchMessages(selectedDmUser.id);
            // Refresh conversations to move this user to top (if we had sorting)
            fetchSocialData(); 
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    const handleAcceptFriend = async (requesterId: number) => {
        try {
            await api.post(`/Friends/accept/${requesterId}`);
            fetchSocialData();
        } catch (error) {
            console.error("Failed to accept friend", error);
        }
    };

    const handleSendFriendRequest = async () => {
        if (!addFriendInput.trim()) return;
        try {
            await api.post(`/Friends/request-by-name/${encodeURIComponent(addFriendInput.trim())}`);
            setAddFriendInput('');
            alert("好友请求已发送");
            // Switch to pending tab to see if it appears (though it won't appear in pending received, but pending sent is not yet implemented in UI)
            // But at least we can clear the input.
        } catch (error: any) {
            console.error("Failed to send friend request", error);
            if (error.response && error.response.data) {
                alert(typeof error.response.data === 'string' ? error.response.data : (error.response.data.message || "发送失败"));
            } else {
                alert("发送失败");
            }
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                setUploading(true);
                const res = await api.post('/Upload/image?type=avatar', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                if (res.data && res.data.url) {
                    setAvatarUrl(res.data.url); 
                }
            } catch (err) {
                console.error("Failed to upload avatar", err);
                alert("上传头像失败");
            } finally {
                setUploading(false);
            }
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const response = await api.put('/Users/profile', {
                nickname,
                aboutMe,
                avatarUrl,
                preferredStatus: currentUser.preferredStatus
            });
            
            if (response.data && response.data.profile) {
                onUpdate({
                    ...currentUser,
                    ...response.data.profile
                });
                onClose();
            }
        } catch (error) {
            console.error("Failed to update profile", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-5xl h-[85vh] bg-[#313338] rounded shadow-2xl flex overflow-hidden">
                
                {/* Main Sidebar */}
                <div className="w-[220px] bg-[#2B2D31] flex flex-col pt-10 pb-4 px-2 shrink-0">
                     <div className="px-2 mb-2 text-xs font-bold text-[#949BA4] uppercase">用户设置</div>
                     <button 
                        className={cn(
                            "text-left px-2 py-1.5 rounded text-[#DBDEE1] hover:bg-[#35373C] hover:text-[#F2F3F5] mb-0.5 text-base font-medium transition-colors",
                            activeTab === 'profile' && "bg-[#404249] text-white"
                        )}
                        onClick={() => setActiveTab('profile')}
                     >
                        个人资料
                     </button>
                     <button 
                        className={cn(
                            "text-left px-2 py-1.5 rounded text-[#DBDEE1] hover:bg-[#35373C] hover:text-[#F2F3F5] mb-0.5 text-base font-medium transition-colors",
                            activeTab === 'friends' && "bg-[#404249] text-white"
                        )}
                        onClick={() => setActiveTab('friends')}
                     >
                        好友 & 私信
                     </button>
                     <div className="my-2 border-b border-[#3F4147] mx-2"></div>
                     <button className="text-left px-2 py-1.5 rounded text-[#949BA4] hover:bg-[#35373C] hover:text-[#F2F3F5] mb-0.5 text-base font-medium transition-colors cursor-not-allowed">
                        隐私与安全
                     </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col bg-[#313338] overflow-hidden">
                    
                    {/* PROFILE TAB CONTENT */}
                    {activeTab === 'profile' && (
                        <div className="flex-1 flex flex-col">
                            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                                <div className="max-w-3xl">
                                    <h2 className="text-xl font-bold text-white mb-6">个人资料</h2>

                                    <div className="flex gap-8">
                                        {/* Form Section */}
                                        <div className="flex-1 space-y-6">
                                            <div>
                                                <label className="block text-xs font-bold text-[#B5BAC1] uppercase mb-2">
                                                    显示名称
                                                </label>
                                                <input 
                                                    type="text" 
                                                    value={nickname}
                                                    onChange={(e) => setNickname(e.target.value)}
                                                    placeholder={currentUser.username}
                                                    className="w-full bg-[#1E1F22] text-[#DBDEE1] p-2.5 rounded border-none outline-none focus:ring-2 focus:ring-[#5865F2]"
                                                />
                                            </div>

                                            <div className="pt-4 border-t border-[#3F4147]">
                                                 <label className="block text-xs font-bold text-[#B5BAC1] uppercase mb-2">
                                                    头像 URL
                                                </label>
                                                <div className="flex gap-2">
                                                    <input 
                                                        type="text" 
                                                        value={avatarUrl}
                                                        onChange={(e) => setAvatarUrl(e.target.value)}
                                                        placeholder="https://example.com/avatar.png"
                                                        className="flex-1 bg-[#1E1F22] text-[#DBDEE1] p-2.5 rounded border-none outline-none focus:ring-2 focus:ring-[#5865F2]"
                                                    />
                                                    <input 
                                                        type="file" 
                                                        ref={fileInputRef} 
                                                        className="hidden" 
                                                        accept="image/*"
                                                        onChange={handleFileSelect} 
                                                    />
                                                    <button 
                                                        onClick={() => fileInputRef.current?.click()}
                                                        disabled={uploading}
                                                        className="px-4 bg-[#4E5058] hover:bg-[#6D6F78] text-white rounded font-medium transition-colors flex items-center justify-center disabled:opacity-50"
                                                    >
                                                        {uploading ? "..." : <Upload size={18} />}
                                                    </button>
                                                </div>
                                                <p className="text-xs text-[#949BA4] mt-1">
                                                    支持 URL 或直接上传图片。
                                                </p>
                                            </div>

                                            <div className="pt-4 border-t border-[#3F4147]">
                                                <label className="block text-xs font-bold text-[#B5BAC1] uppercase mb-2">
                                                    个人简介
                                                </label>
                                                <textarea 
                                                    value={aboutMe}
                                                    onChange={(e) => setAboutMe(e.target.value)}
                                                    placeholder="介绍一下你自己..."
                                                    maxLength={190}
                                                    className="w-full h-32 bg-[#1E1F22] text-[#DBDEE1] p-2.5 rounded border-none outline-none focus:ring-2 focus:ring-[#5865F2] resize-none custom-scrollbar"
                                                />
                                                <div className="text-right text-xs text-[#949BA4] mt-1">
                                                    {aboutMe.length}/190
                                                </div>
                                            </div>
                                        </div>

                                        {/* Preview Card Section */}
                                        <div className="w-[300px] shrink-0">
                                            <div className="text-xs font-bold text-[#B5BAC1] uppercase mb-2">
                                                预览
                                            </div>
                                            <div className="w-[300px] bg-[#393A41] rounded-lg shadow-xl overflow-hidden pointer-events-none select-none">
                                                {/* Banner */}
                                                <div className="h-[60px] bg-[#5865F2]"></div>
                                                
                                                {/* Avatar */}
                                                <div className="relative px-4 pb-3">
                                                    <div className="-mt-8 mb-3 p-1 bg-[#393A41] rounded-full inline-block relative z-10">
                                                        <div className="relative w-[80px] h-[80px]">
                                                            <div className="w-full h-full rounded-full bg-gray-600 overflow-hidden flex items-center justify-center">
                                                                 {avatarUrl ? (
                                                                     <img src={getAvatarUrl(avatarUrl)} alt="Preview" className="w-full h-full object-cover" />
                                                                 ) : (
                                                                     <span className="text-white text-2xl font-bold">{currentUser.username.substring(0, 1).toUpperCase()}</span>
                                                                 )}
                                                            </div>
                                                            <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-[4px] border-[#393A41] ${
                                                                currentUser.preferredStatus === 1 ? 'bg-yellow-500' :
                                                                currentUser.preferredStatus === 2 ? 'bg-red-500' :
                                                                currentUser.preferredStatus === 3 ? 'bg-gray-500' :
                                                                'bg-green-500'
                                                            }`}></div>
                                                        </div>
                                                    </div>

                                                    {/* User Info */}
                                                    <div className="bg-[#393A41] rounded-lg p-3 mb-3">
                                                        <h2 className="text-xl font-bold text-white leading-tight">
                                                            {nickname || currentUser.username}
                                                        </h2>
                                                        <div className="text-sm text-[#949BA4] font-medium">
                                                            {currentUser.username}
                                                        </div>

                                                        <div className="mt-3 pt-3 border-t border-[#2E3035]">
                                                            <h3 className="text-xs font-bold text-[#949BA4] uppercase mb-1">个人简介</h3>
                                                            <p className="text-sm text-[#DBDEE1] whitespace-pre-wrap">
                                                                {aboutMe || "这位用户很懒，什么都没写。"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Bar */}
                            <div className="p-4 bg-[#393A41] flex justify-between items-center animate-in slide-in-from-bottom-2 shrink-0">
                                 <button 
                                     onClick={onClose}
                                     className="text-[#DBDEE1] hover:underline text-sm font-medium"
                                 >
                                     取消
                                 </button>
                                 <div className="flex gap-4">
                                     <button 
                                         onClick={handleSave}
                                         disabled={loading}
                                         className={cn(
                                             "px-6 py-2 rounded bg-[#5865F2] text-white font-medium hover:bg-[#4752C4] transition-colors flex items-center gap-2",
                                             loading && "opacity-50 cursor-not-allowed"
                                         )}
                                     >
                                         {loading ? '保存中...' : '保存更改'}
                                     </button>
                                 </div>
                            </div>
                        </div>
                    )}

                    {/* FRIENDS & SOCIAL TAB CONTENT */}
                    {activeTab === 'friends' && (
                        <div className="flex-1 flex overflow-hidden">
                            {/* Middle Column: Friends/Messages List */}
                            <div className="w-[240px] bg-[#2B2D31] flex flex-col border-l border-[#1f2023]">
                                {/* Top Tabs */}
                                <div className="flex items-center h-12 border-b border-[#1f2023] px-2 shrink-0">
                                    <button 
                                        className={cn(
                                            "flex-1 flex items-center justify-center h-full text-sm font-medium transition-colors border-b-2",
                                            subTab === 'friends' ? "text-white border-[#5865F2]" : "text-[#949BA4] border-transparent hover:text-[#DBDEE1]"
                                        )}
                                        onClick={() => setSubTab('friends')}
                                    >
                                        <Users size={16} className="mr-2" />
                                        好友
                                    </button>
                                    <div className="w-[1px] h-4 bg-[#3F4147] mx-2"></div>
                                    <button 
                                        className={cn(
                                            "flex-1 flex items-center justify-center h-full text-sm font-medium transition-colors border-b-2 relative",
                                            subTab === 'messages' ? "text-white border-[#5865F2]" : "text-[#949BA4] border-transparent hover:text-[#DBDEE1]"
                                        )}
                                        onClick={() => setSubTab('messages')}
                                    >
                                        <Mail size={16} className="mr-2" />
                                        消息
                                        {conversations.some(c => (c.unreadCount || 0) > 0) && (
                                            <span className="absolute top-3 right-6 w-2 h-2 bg-red-500 rounded-full border border-[#2B2D31]"></span>
                                        )}
                                    </button>
                                </div>

                                {/* List Content */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2 space-y-0.5">
                                    {subTab === 'friends' ? (
                                        // Friends List
                                        <>
                                            <div className="flex items-center justify-between px-2 mb-2">
                                                 <span className="text-xs font-bold text-[#949BA4] uppercase">所有好友 — {friends.length}</span>
                                                 <button 
                                                    className="text-xs text-[#5865F2] hover:underline"
                                                    onClick={() => {
                                                        setSelectedDmUser(null);
                                                        setSocialTab('add');
                                                    }}
                                                 >
                                                    添加好友
                                                 </button>
                                            </div>

                                            {/* Pending Requests Shortcut */}
                                            {pendingRequests.length > 0 && (
                                                <button 
                                                    className="w-full flex items-center px-2 py-2 rounded text-[#949BA4] hover:bg-[#35373C] hover:text-[#F2F3F5] transition-colors mb-2 bg-[#35373C]/50"
                                                    onClick={() => {
                                                        setSelectedDmUser(null);
                                                        setSocialTab('pending');
                                                    }}
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-[#F23F42] flex items-center justify-center text-white mr-3">
                                                        <UserPlus size={16} />
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <div className="font-medium text-white">好友请求</div>
                                                        <div className="text-xs">{pendingRequests.length} 个待处理</div>
                                                    </div>
                                                </button>
                                            )}

                                            {friends.map(friend => (
                                                <button 
                                                    key={friend.id}
                                                    className={cn(
                                                        "w-full flex items-center px-2 py-2 rounded text-[#949BA4] hover:bg-[#35373C] hover:text-[#F2F3F5] transition-colors group",
                                                        selectedDmUser?.id === friend.id && "bg-[#35373C] text-white"
                                                    )}
                                                    onClick={() => setSelectedDmUser(friend)}
                                                >
                                                    <div className="relative w-8 h-8 mr-3 shrink-0">
                                                        {friend.avatarUrl ? (
                                                            <img src={getAvatarUrl(friend.avatarUrl)} alt={friend.username} className="w-8 h-8 rounded-full object-cover" />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs">
                                                                {friend.username.substring(0, 1).toUpperCase()}
                                                            </div>
                                                        )}
                                                        {friend.preferredStatus === 3 ? (
                                                            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-[3px] border-[#80848E] bg-[#2B2D31]"></div>
                                                        ) : (
                                                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-[2px] border-[#2B2D31] ${
                                                                friend.preferredStatus === 1 ? 'bg-yellow-500' :
                                                                friend.preferredStatus === 2 ? 'bg-red-500' :
                                                                'bg-green-500'
                                                            }`}></div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 text-left truncate">
                                                        <div className={cn("font-medium truncate", 
                                                            selectedDmUser?.id === friend.id ? "text-white" : 
                                                            (friend.preferredStatus === 3 ? "text-[#80848E]" : "text-[#949BA4] group-hover:text-[#DBDEE1]")
                                                        )}>
                                                            {friend.nickname || friend.username}
                                                        </div>
                                                        <div className="text-xs truncate">
                                                            {friend.preferredStatus === 0 ? '在线' : '离线'}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </>
                                    ) : (
                                        // Messages List
                                        <>
                                            <div className="px-2 mb-2 text-xs font-bold text-[#949BA4] uppercase">私信列表</div>
                                            {conversations.map(user => (
                                                <button 
                                                    key={user.id}
                                                    className={cn(
                                                        "w-full flex items-center px-2 py-2 rounded text-[#949BA4] hover:bg-[#35373C] hover:text-[#F2F3F5] transition-colors group",
                                                        selectedDmUser?.id === user.id && "bg-[#35373C] text-white"
                                                    )}
                                                    onClick={() => setSelectedDmUser(user as User)}
                                                >
                                                    <div className="relative w-8 h-8 mr-3 shrink-0">
                                                        {user.avatarUrl ? (
                                                            <img src={user.avatarUrl} alt={user.username} className="w-8 h-8 rounded-full object-cover" />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs">
                                                                {user.username.substring(0, 1).toUpperCase()}
                                                            </div>
                                                        )}
                                                        {user.preferredStatus === 3 ? (
                                                            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-[3px] border-[#80848E] bg-[#2B2D31]"></div>
                                                        ) : (
                                                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-[2px] border-[#2B2D31] ${
                                                                user.preferredStatus === 1 ? 'bg-yellow-500' :
                                                                user.preferredStatus === 2 ? 'bg-red-500' :
                                                                'bg-green-500'
                                                            }`}></div>
                                                        )}
                                                        {(user.unreadCount || 0) > 0 && (
                                                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-[2px] border-[#2B2D31] flex items-center justify-center">
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 text-left truncate">
                                                        <div className={cn("font-medium truncate", 
                                                            selectedDmUser?.id === user.id ? "text-white" : 
                                                            (user.preferredStatus === 3 ? "text-[#80848E]" : "text-[#949BA4] group-hover:text-[#DBDEE1]")
                                                        )}>
                                                            {user.nickname || user.username}
                                                        </div>
                                                    </div>
                                                    <X size={14} className="opacity-0 group-hover:opacity-100 hover:text-white" />
                                                </button>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Main Content (Chat or Friend Management) */}
                            <div className="flex-1 flex flex-col bg-[#313338]">
                                {!selectedDmUser ? (
                                    // No user selected -> Show Friend Management UI (Add/Pending)
                                    // This allows "Add Friend" and "Pending Requests" to still be accessible
                                    <>
                                        {/* Top Bar */}
                                        <div className="h-12 px-4 flex items-center border-b border-[#1f2023] shrink-0">
                                            <div className="flex items-center text-white font-bold mr-4">
                                                <Users size={20} className="mr-2 text-[#949BA4]" />
                                                好友管理
                                            </div>
                                            <div className="h-6 w-[1px] bg-[#3F4147] mx-2"></div>
                                            <div className="flex items-center space-x-2">
                                                <TabButton active={socialTab === 'pending'} onClick={() => setSocialTab('pending')}>
                                                    待定
                                                    {pendingRequests.length > 0 && (
                                                        <span className="ml-1.5 bg-[#F23F42] text-white text-[10px] px-1.5 rounded-full h-4 flex items-center justify-center">
                                                            {pendingRequests.length}
                                                        </span>
                                                    )}
                                                </TabButton>
                                                <TabButton active={socialTab === 'add'} onClick={() => setSocialTab('add')} variant="success">添加好友</TabButton>
                                            </div>
                                        </div>

                                        {/* List Area */}
                                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                                            {socialTab === 'add' ? (
                                                <div className="max-w-2xl">
                                                    <h3 className="uppercase text-xs font-bold text-[#B5BAC1] mb-2">添加好友</h3>
                                                    <div className="text-sm text-[#949BA4] mb-4">你可以通过用户名来添加好友。</div>
                                                    <div className="flex gap-2">
                                                        <div className="flex-1 bg-[#1E1F22] rounded-lg border border-[#1E1F22] focus-within:border-[#5865F2] flex items-center px-4 py-2.5 transition-colors">
                                                            <input 
                                                                type="text" 
                                                                className="bg-transparent border-none outline-none text-[#DBDEE1] w-full placeholder-[#949BA4]"
                                                                placeholder="你可以输入用户名#0000"
                                                                value={addFriendInput}
                                                                onChange={(e) => setAddFriendInput(e.target.value)}
                                                            />
                                                        </div>
                                                        <button 
                                                            className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            disabled={!addFriendInput.trim()}
                                                            onClick={handleSendFriendRequest}
                                                        >
                                                            发送好友请求
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <h3 className="uppercase text-xs font-bold text-[#B5BAC1] mb-4">待定请求 — {pendingRequests.length}</h3>
                                                    {pendingRequests.length === 0 ? (
                                                        <EmptyState message="这里空空如也，没人想加你..." />
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {pendingRequests.map(req => (
                                                                <div key={req.id} className="flex items-center justify-between p-2.5 hover:bg-[#393C41] rounded-lg group border-t border-[#3F4147]/50">
                                                                    <div className="flex items-center">
                                                                        <div className="w-8 h-8 rounded-full bg-gray-600 mr-3 overflow-hidden">
                                                                            {req.requester.avatarUrl ? (
                                                                                <img src={getAvatarUrl(req.requester.avatarUrl)} className="w-full h-full object-cover" />
                                                                            ) : (
                                                                                <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">
                                                                                    {req.requester.username[0]}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-bold text-white text-sm">
                                                                                {req.requester.nickname || req.requester.username}
                                                                            </div>
                                                                            <div className="text-xs text-[#949BA4]">
                                                                                传入的好友请求
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <button 
                                                                            onClick={() => handleAcceptFriend(req.requester.id)}
                                                                            className="w-8 h-8 rounded-full bg-[#2B2D31] hover:bg-[#23A559] text-[#B5BAC1] hover:text-white flex items-center justify-center transition-colors"
                                                                            title="接受"
                                                                        >
                                                                            <Check size={16} />
                                                                        </button>
                                                                        <button className="w-8 h-8 rounded-full bg-[#2B2D31] hover:bg-[#DA373C] text-[#B5BAC1] hover:text-white flex items-center justify-center transition-colors" title="忽略">
                                                                            <X size={16} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    // DM CHAT VIEW
                                    <div className="flex-1 flex flex-col h-full">
                                        {/* DM Header */}
                                        <div className="h-12 px-4 flex items-center border-b border-[#1f2023] shrink-0 justify-between">
                                            <div className="flex items-center">
                                                <Hash className="text-[#949BA4] mr-2" size={20} />
                                                <span className="font-bold text-white">{selectedDmUser.nickname || selectedDmUser.username}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-[#B5BAC1]">
                                                <PhoneIcon className="cursor-pointer hover:text-white" />
                                                <VideoIcon className="cursor-pointer hover:text-white" />
                                                <PinIcon className="cursor-pointer hover:text-white" />
                                                <UsersIcon className="cursor-pointer hover:text-white" />
                                                <div className="w-[200px] relative">
                                                    <input type="text" placeholder="搜索" className="bg-[#1E1F22] text-sm px-2 py-1 rounded transition-all w-full focus:w-[240px] outline-none text-[#DBDEE1]" />
                                                    <Search className="absolute right-2 top-1.5 w-4 h-4 text-[#949BA4]" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* DM Messages */}
                                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col">
                                            {messages.length === 0 ? (
                                                <div className="flex-1 flex flex-col items-center justify-center text-[#949BA4]">
                                                    <div className="w-20 h-20 bg-[#5865F2] rounded-full flex items-center justify-center mb-4">
                                                        <Hash size={40} className="text-white" />
                                                    </div>
                                                    <h3 className="text-2xl font-bold text-white mb-2">
                                                        这是你和 {selectedDmUser.nickname || selectedDmUser.username} 的私信传奇的开始
                                                    </h3>
                                                    <p className="text-[#B5BAC1]">这里还没有消息，快打个招呼吧！</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4 mt-auto">
                                                    {messages.map((msg, idx) => {
                                                        const isMe = msg.senderId === currentUser.id;
                                                        const prevMsg = messages[idx - 1];
                                                        const isSequence = prevMsg && prevMsg.senderId === msg.senderId && 
                                                            (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 60000);
                                                        
                                                        return (
                                                            <div key={msg.id} className={cn("flex group", isSequence ? "mt-0.5" : "mt-4")}>
                                                                {!isSequence ? (
                                                                    <div className="w-10 h-10 rounded-full bg-gray-600 mr-4 overflow-hidden shrink-0 cursor-pointer hover:opacity-80">
                                                                        {isMe ? (
                                                                            currentUser.avatarUrl ? <img src={currentUser.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white">{currentUser.username[0]}</div>
                                                                        ) : (
                                                                            selectedDmUser.avatarUrl ? <img src={selectedDmUser.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white">{selectedDmUser.username[0]}</div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-10 mr-4 shrink-0 text-[10px] text-[#949BA4] opacity-0 group-hover:opacity-100 flex items-center justify-end select-none">
                                                                        {format(new Date(msg.createdAt), 'HH:mm')}
                                                                    </div>
                                                                )}
                                                                <div className="flex-1">
                                                                    {!isSequence && (
                                                                        <div className="flex items-center mb-1">
                                                                            <span className="font-medium text-white mr-2 cursor-pointer hover:underline">
                                                                                {isMe ? (currentUser.nickname || currentUser.username) : (selectedDmUser.nickname || selectedDmUser.username)}
                                                                            </span>
                                                                            <span className="text-xs text-[#949BA4]">
                                                                                {format(new Date(msg.createdAt), 'yyyy/MM/dd HH:mm')}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    <div className="text-[#DBDEE1] whitespace-pre-wrap break-words text-sm leading-relaxed">
                                                                        {msg.content}
                                                                    </div>

                                                                    {/* Link Previews */}
                                                                    {msg.embeds && msg.embeds.length > 0 && (
                                                                        <LinkPreviewCard embeds={msg.embeds} />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    <div ref={messagesEndRef} />
                                                </div>
                                            )}
                                        </div>

                                        {/* DM Input */}
                                        <div className="p-4 pt-0">
                                            <div className="bg-[#383A40] rounded-lg px-4 py-3">
                                                <input 
                                                    type="text"
                                                    className="w-full bg-transparent border-none outline-none text-[#DBDEE1] placeholder-[#949BA4]"
                                                    placeholder={`发送消息给 @${selectedDmUser.nickname || selectedDmUser.username}`}
                                                    value={messageInput}
                                                    onChange={(e) => setMessageInput(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleSendMessage();
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Close Button */}
                <div className="absolute top-4 right-4 flex flex-col items-center gap-1 cursor-pointer group" onClick={onClose}>
                    <div className="w-9 h-9 rounded-full border-2 border-[#949BA4] group-hover:border-white flex items-center justify-center text-[#949BA4] group-hover:text-white transition-colors">
                        <X size={20} />
                    </div>
                    <span className="text-xs font-bold text-[#949BA4] group-hover:text-white transition-colors">ESC</span>
                </div>
            </div>
        </div>
    );
};

// Helper Components
const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; variant?: 'default' | 'success' }> = ({ active, onClick, children, variant = 'default' }) => {
    if (variant === 'success') {
        return (
            <button 
                onClick={onClick}
                className={cn(
                    "px-2 py-0.5 rounded text-sm font-medium transition-colors",
                    active ? "bg-transparent text-[#23A559]" : "bg-[#23A559] text-white hover:bg-[#23A559]/80"
                )}
            >
                {children}
            </button>
        );
    }
    return (
        <button 
            onClick={onClick}
            className={cn(
                "px-2 py-0.5 rounded text-sm font-medium transition-colors hover:bg-[#35373C]",
                active ? "bg-[#393C41] text-white" : "text-[#949BA4] hover:text-[#DBDEE1]"
            )}
        >
            {children}
        </button>
    );
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center py-10 opacity-70">
        <Ghost size={64} className="text-[#4E5058] mb-4" />
        <p className="text-[#949BA4] text-sm">{message}</p>
    </div>
);

// Placeholder Icons for Header
const PhoneIcon = (props: any) => <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>;
const VideoIcon = (props: any) => <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>;
const PinIcon = (props: any) => <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>;
const UsersIcon = (props: any) => <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;

export default EditProfileModal;
