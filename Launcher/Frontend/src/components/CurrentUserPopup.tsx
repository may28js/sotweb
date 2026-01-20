import React, { useRef, useEffect, useState } from 'react';
import { type User } from '../types';
import { Moon, Circle, MinusCircle, CheckCircle2, Edit, Copy, ChevronRight, Mail, Handshake } from 'lucide-react';
import { cn } from '../lib/utils';

interface CurrentUserPopupProps {
    user: User;
    onClose: () => void;
    onEditProfile: (tab?: 'profile' | 'friends') => void;
    onUpdateStatus: (status: number) => void;
    onLogout?: () => void;
    triggerRef?: React.RefObject<HTMLElement>;
    pendingFriendCount?: number;
    unreadDmCount?: number;
}

const CurrentUserPopup: React.FC<CurrentUserPopupProps> = ({ 
    user, 
    onClose, 
    onEditProfile, 
    onUpdateStatus, 
    triggerRef,
    pendingFriendCount = 0,
    unreadDmCount = 0
}) => {
    const popupRef = useRef<HTMLDivElement>(null);
    const [showStatusMenu, setShowStatusMenu] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                // If a triggerRef is provided, ignore clicks on the trigger element
                if (triggerRef && triggerRef.current && triggerRef.current.contains(event.target as Node)) {
                    return;
                }
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const statusOptions = [
        { value: 0, label: '在线', color: 'bg-green-500', icon: CheckCircle2, desc: '收到通知' },
        { value: 1, label: '闲置', color: 'bg-yellow-500', icon: Moon, desc: '挂机中' },
        { value: 2, label: '请勿打扰', color: 'bg-red-500', icon: MinusCircle, desc: '不接收通知' },
        { value: 3, label: '隐身', color: 'bg-gray-500', icon: Circle, desc: '离线显示，但可以正常使用' },
    ];

    const currentStatus = statusOptions.find(s => s.value === (user.preferredStatus || 0)) || statusOptions[0];

    return (
        <div 
            ref={popupRef}
            className="absolute bottom-16 left-2 w-[300px] bg-[#393A41] rounded-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200 border border-[#1e1f22] z-50"
        >
            {/* Banner */}
            <div className="h-[60px] bg-[#5865F2] relative flex items-center justify-end px-3 gap-3">
                {unreadDmCount > 0 && (
                    <div 
                        className="cursor-pointer hover:scale-110 transition-transform flex items-center justify-center bg-black/20 p-1.5 rounded-full"
                        onClick={() => onEditProfile('friends')}
                        title="未读私信"
                    >
                        <Mail className="text-red-500 w-5 h-5 fill-red-500" />
                    </div>
                )}
                {pendingFriendCount > 0 && (
                    <div 
                        className="cursor-pointer hover:scale-110 transition-transform flex items-center justify-center bg-black/20 p-1.5 rounded-full"
                        onClick={() => onEditProfile('friends')}
                        title="好友请求"
                    >
                        <Handshake className="text-red-500 w-5 h-5" />
                    </div>
                )}
            </div>

            {/* Avatar & Info */}
            <div className="relative px-4 pb-2">
                <div className="flex justify-between items-start">
                    <div className="-mt-8 p-1 bg-[#393A41] rounded-full cursor-pointer group relative z-10" onClick={() => onEditProfile()}>
                        <div className="relative w-[80px] h-[80px]">
                            <div className="w-full h-full rounded-full bg-gray-600 overflow-hidden flex items-center justify-center">
                                 {user.avatarUrl ? (
                                     <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                                 ) : (
                                     <span className="text-white text-2xl font-bold">{user.username.substring(0, 1).toUpperCase()}</span>
                                 )}
                                 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full">
                                     <Edit className="text-white w-6 h-6" />
                                 </div>
                            </div>
                            <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-[4px] border-[#393A41] ${currentStatus.color}`}></div>
                        </div>
                    </div>


                </div>


                <div className="mt-2 bg-[#393A41] rounded-lg p-2">
                    <h2 className="text-xl font-bold text-white leading-tight flex items-center gap-2">
                        {user.nickname || user.username}
                    </h2>
                    <div className="text-sm text-[#949BA4] font-medium">
                        {user.username}
                    </div>
                </div>
            </div>

            {/* Menu Items */}
            <div className="p-2 space-y-1 border-t border-[#2E3035] bg-[#393A41]">
                {/* Status Selector */}
                <div className="relative">
                    <button 
                        className="w-full flex items-center justify-between px-2 py-2 rounded hover:bg-[#5865F2] hover:text-white group transition-colors text-[#DBDEE1]"
                        onClick={() => setShowStatusMenu(!showStatusMenu)}
                    >
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${currentStatus.color}`}></div>
                            <span className="text-sm font-medium">在线状态</span>
                        </div>
                        <ChevronRight size={16} className={`transition-transform ${showStatusMenu ? 'rotate-90' : ''}`} />
                    </button>

                    {/* Status Submenu */}
                    {showStatusMenu && (
                        <div className="mt-1 ml-4 space-y-1 border-l-2 border-[#2E3035] pl-2 mb-2">
                            {statusOptions.map((status) => (
                                <button
                                    key={status.value}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#35373C] text-[#DBDEE1] text-sm group"
                                    onClick={() => {
                                        onUpdateStatus(status.value);
                                        // setShowStatusMenu(false); // Optional: keep open or close
                                    }}
                                >
                                    <div className={`w-2.5 h-2.5 rounded-full ${status.color}`}></div>
                                    <div className="flex flex-col items-start">
                                        <span className={cn("font-medium", user.preferredStatus === status.value && "text-white")}>{status.label}</span>
                                        <span className="text-[10px] text-[#949BA4] group-hover:text-[#B5BAC1]">{status.desc}</span>
                                    </div>
                                    {user.preferredStatus === status.value && <CheckCircle2 size={14} className="ml-auto text-white" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button 
                    onClick={() => onEditProfile()}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-[#5865F2] hover:text-white transition-colors text-[#DBDEE1]"
                >
                    <Edit size={16} />
                    <span className="text-sm font-medium">编辑个人资料</span>
                </button>
                
                <div className="h-px bg-[#2E3035] my-1 mx-2" />
                
                <button 
                    onClick={() => {
                        navigator.clipboard.writeText(user.id.toString());
                        // Could add toast here
                    }}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-[#35373C] text-[#DBDEE1] transition-colors"
                >
                    <Copy size={16} />
                    <span className="text-sm font-medium">复制用户 ID</span>
                </button>
            </div>
        </div>
    );
};

export default CurrentUserPopup;
