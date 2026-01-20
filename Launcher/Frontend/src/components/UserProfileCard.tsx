import React, { useEffect, useRef, useState } from 'react';
import { type User } from '../types';
import { X, MessageSquare, UserPlus } from 'lucide-react';
import { api, getAvatarUrl } from '../lib/api';
import ConfirmationModal from './ConfirmationModal';

interface UserProfileCardProps {
    user: User; // Or a partial user object with ID to fetch full details
    position: { x: number; y: number };
    onClose: () => void;
    currentUser: User | null;
    onEditProfile?: () => void;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ user: initialUser, position, onClose, currentUser, onEditProfile }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [user, setUser] = useState<User>(initialUser);
    const [dmMessage, setDmMessage] = useState('');
    const [friendStatus, setFriendStatus] = useState<'None' | 'RequestSent' | 'RequestReceived' | 'Friend'>('None');
    const [sendingDm, setSendingDm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        // Fetch full profile if needed
        const fetchProfile = async () => {
            try {
                const response = await api.get(`/Users/profile/${initialUser.id}`);
                setUser(response.data);
            } catch (error) {
                console.error("Failed to fetch user profile", error);
            }
        };

        if (initialUser.id) {
            fetchProfile();
        }
    }, [initialUser.id]);

    // Fetch friend status
    useEffect(() => {
        if (currentUser && user.id && currentUser.id !== user.id) {
            api.get(`/Friends/status/${user.id}`)
                .then(res => setFriendStatus(res.data.status))
                .catch(console.error);
        }
    }, [user.id, currentUser]);

    const handleAddFriend = async () => {
        try {
            await api.post(`/Friends/request/${user.id}`);
            setFriendStatus('RequestSent');
        } catch (err) {
            alert("请求发送失败");
        }
    };

    const handleAcceptFriend = async () => {
        try {
            await api.post(`/Friends/accept/${user.id}`);
            setFriendStatus('Friend');
        } catch (err) {
            alert("接受请求失败");
        }
    };

    const handleRemoveFriend = () => {
        setShowDeleteConfirm(true);
    };

    const confirmRemoveFriend = async () => {
        try {
            await api.delete(`/Friends/${user.id}`);
            setFriendStatus('None');
        } catch (err) {
            alert("删除好友失败");
        }
    };
    
    const handleSendDm = async () => {
        if (!dmMessage.trim()) return;
        setSendingDm(true);
        try {
            await api.post('/DirectMessages', {
                receiverId: user.id,
                content: dmMessage
            });
            setDmMessage('');
            alert("私信已发送");
        } catch (err) {
            alert("发送失败");
        } finally {
            setSendingDm(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
                // Check if the click target is a trigger for THIS user
                const target = event.target as HTMLElement;
                const trigger = target.closest(`[data-user-trigger-id="${initialUser.id}"]`);
                if (trigger) {
                    return; // Ignore clicks on the trigger, let the trigger's onClick handle it
                }
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose, initialUser.id]);

    // Calculate position to keep it on screen
    const style: React.CSSProperties = {
        top: Math.min(position.y, window.innerHeight - 400),
        left: Math.min(position.x, window.innerWidth - 320),
    };

    // Status Indicator Color
    const getStatusColor = (status?: number) => {
        switch (status) {
            case 0: return 'bg-green-500'; // Online
            case 1: return 'bg-yellow-500'; // Idle
            case 2: return 'bg-red-500'; // DND
            case 3: return 'bg-gray-500'; // Invisible/Offline
            default: return 'bg-gray-500';
        }
    };

    return (
        <div 
            ref={cardRef}
            className="fixed z-50 w-[300px] bg-[#393A41] rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            style={style}
        >
            {/* Banner */}
            <div className="h-[60px] bg-[#5865F2]"></div>

            <ConfirmationModal 
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmRemoveFriend}
                title="删除好友"
                message={`确定要删除好友 ${user.nickname || user.username} 吗？`}
                confirmText="删除"
                isDangerous={true}
            />

            {/* Avatar & Badges */}
            <div className="relative px-4 pb-3">
                <div className="flex justify-between items-start">
                    <div className="-mt-8 p-1 bg-[#393A41] rounded-full relative z-10">
                        <div className="relative w-[80px] h-[80px]">
                            <div className="w-full h-full rounded-full bg-gray-600 overflow-hidden flex items-center justify-center">
                                 {user.avatarUrl ? (
                                     <img src={getAvatarUrl(user.avatarUrl)} alt={user.username} className="w-full h-full object-cover" />
                                 ) : (
                                     <span className="text-white text-2xl font-bold">{user.username.substring(0, 1).toUpperCase()}</span>
                                 )}
                            </div>
                            {/* Status Indicator */}
                            <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-[4px] border-[#393A41] ${getStatusColor(user.preferredStatus)}`}></div>
                        </div>
                    </div>


                </div>

                {/* User Info */}
                <div className="mt-3 bg-[#393A41] rounded-lg p-3 mb-3">
                    <h2 
                        className="text-xl font-bold leading-tight"
                        style={{ color: (user as any).roleColor || '#ffffff' }}
                    >
                        {user.nickname || user.username}
                    </h2>
                    <div className="text-sm text-[#949BA4] font-medium">
                        {user.username}
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#2E3035]">
                        <h3 className="text-xs font-bold text-[#949BA4] uppercase mb-1">个人简介</h3>
                        <p className="text-sm text-[#DBDEE1] whitespace-pre-wrap">
                            {user.aboutMe || "这位用户很懒，什么都没写。"}
                        </p>
                    </div>

                     <div className="mt-3 pt-3 border-t border-[#2E3035]">
                        <h3 className="text-xs font-bold text-[#949BA4] uppercase mb-1">Story Of Time 成员</h3>
                        <div className="text-sm text-[#DBDEE1]">
                            {/* Join date logic could go here */}
                             加入于 {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '未知'}
                        </div>
                    </div>
                </div>

                {/* Actions: Send Message & Add Friend */}
                <div className="mt-4 gap-2 flex flex-col mb-4">
                    {currentUser && currentUser.id === user.id ? (
                        <button 
                            onClick={() => {
                                if (onEditProfile) onEditProfile();
                            }}
                            className="w-full py-2 px-4 rounded bg-[#4752C4] hover:bg-[#3b44a1] text-white font-medium transition-colors"
                        >
                            编辑个人资料
                        </button>
                    ) : (
                        <>
                            {/* Message Input */}
                            <div className="relative">
                                <input 
                                    type="text" 
                                    className="w-full bg-[#1E1F22] text-[#DBDEE1] text-sm rounded px-3 py-2.5 outline-none focus:ring-1 focus:ring-blue-500 placeholder-[#949BA4]"
                                    placeholder={`私信 @${user.nickname || user.username}`}
                                    value={dmMessage}
                                    onChange={(e) => setDmMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendDm()}
                                    disabled={sendingDm}
                                />
                                <button 
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#949BA4] hover:text-white disabled:opacity-50"
                                    onClick={handleSendDm}
                                    disabled={sendingDm}
                                >
                                    <MessageSquare size={16} />
                                </button>
                            </div>

                            {/* Add Friend Button */}
                            {currentUser && (
                                <>
                                    {friendStatus === 'Friend' ? (
                                        <button 
                                            onClick={handleRemoveFriend}
                                            className="w-full py-2 px-4 rounded bg-[#DA373C] hover:bg-[#a1282c] text-white font-medium transition-colors"
                                        >
                                            删除好友
                                        </button>
                                    ) : friendStatus === 'RequestSent' ? (
                                        <button 
                                            disabled
                                            className="w-full py-2 px-4 rounded bg-[#3b44a1] text-white/50 font-medium cursor-not-allowed"
                                        >
                                            已发送请求
                                        </button>
                                    ) : friendStatus === 'RequestReceived' ? (
                                        <button 
                                            onClick={handleAcceptFriend}
                                            className="w-full py-2 px-4 rounded bg-[#248046] hover:bg-[#1a6334] text-white font-medium transition-colors"
                                        >
                                            接受好友请求
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handleAddFriend}
                                            className="w-full py-2 px-4 rounded bg-[#248046] hover:bg-[#1a6334] text-white font-medium transition-colors"
                                        >
                                            添加好友
                                        </button>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfileCard;
