import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { api, getAvatarUrl, COMMUNITY_BASE_URL } from '../lib/api';
import { type CommunitySettings, type CommunityRole, CommunityPermissions, type Channel, type ChannelPermissionOverride } from '../types';
import { X, Save, Trash2, Search,
    Check,
    ImageIcon,
    Plus,
    Shield
} from 'lucide-react';
import { cn } from '../lib/utils';


const PermissionTriState = ({ state, onChange }: { state: 'allow' | 'deny' | 'inherit', onChange: (s: 'allow' | 'deny' | 'inherit') => void }) => {
    return (
        <div className="flex justify-center gap-1">
            <button 
                onClick={() => onChange('inherit')}
                className={cn("w-6 h-6 rounded flex items-center justify-center border border-gray-600 text-gray-400 hover:border-gray-400", state === 'inherit' && "bg-gray-600 text-white border-transparent")}
                title="继承"
            >
                /
            </button>
            <button 
                onClick={() => onChange('allow')}
                className={cn("w-6 h-6 rounded flex items-center justify-center border border-gray-600 text-gray-400 hover:border-green-500 hover:text-green-500", state === 'allow' && "bg-green-600 text-white border-transparent hover:text-white")}
                title="允许"
            >
                <Check size={14} />
            </button>
            <button 
                onClick={() => onChange('deny')}
                className={cn("w-6 h-6 rounded flex items-center justify-center border border-gray-600 text-gray-400 hover:border-red-500 hover:text-red-500", state === 'deny' && "bg-red-600 text-white border-transparent hover:text-white")}
                title="拒绝"
            >
                <X size={14} />
            </button>
        </div>
    );
};

const PERMISSION_DETAILS = [
    { value: CommunityPermissions.ViewChannels, label: '查看频道', description: '允许成员查看频道列表。' },
    { value: CommunityPermissions.SendMessages, label: '发送消息', description: '允许成员在文本频道发送消息。' },
    { value: CommunityPermissions.ManageMessages, label: '管理消息', description: '允许成员删除他人的消息。' },
    { value: CommunityPermissions.ManageChannels, label: '管理频道', description: '允许成员创建、编辑和删除频道。' },
    { value: CommunityPermissions.ManageRoles, label: '管理角色', description: '允许成员创建、编辑和删除角色。' },
    { value: CommunityPermissions.MentionEveryone, label: '提及 @everyone', description: '允许成员使用 @everyone 提及所有成员。' },
    { value: CommunityPermissions.KickMembers, label: '踢出成员', description: '允许成员将其他成员踢出服务器。' },
    { value: CommunityPermissions.BanMembers, label: '封禁成员', description: '允许成员封禁其他成员。' },
    { value: CommunityPermissions.Administrator, label: '管理员', description: '赋予所有权限，并绕过所有限制。' },
];

interface CommunitySettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

type Tab = 'overview' | 'roles' | 'members' | 'channels';

interface Member {
    id: number;
    username: string;
    nickname?: string;
    avatarUrl?: string;
    roles: number[];
}

const CommunitySettingsModal: React.FC<CommunitySettingsModalProps> = ({ isOpen, onClose, onUpdate }) => {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [settings, setSettings] = useState<CommunitySettings | null>(null);
    const [roles, setRoles] = useState<CommunityRole[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    // const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Overview State
    const [serverName, setServerName] = useState('');
    // const [iconUrl, setIconUrl] = useState(''); // Removed
    const [themeImageUrl, setThemeImageUrl] = useState('');
    const [defaultChannelId, setDefaultChannelId] = useState<number | null>(null);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Roles State
    const [editingRole, setEditingRole] = useState<CommunityRole | null>(null);

    // Members State
    const [memberSearch, setMemberSearch] = useState('');
    const [roleSelectorMemberId, setRoleSelectorMemberId] = useState<number | null>(null);

    // Channels State
    const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);

    // AbortController Ref
    const updateRoleAbortControllerRef = useRef<AbortController | null>(null);
    // Debounce Ref
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (updateRoleAbortControllerRef.current) {
                updateRoleAbortControllerRef.current.abort();
            }
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchSettings();
            fetchMembers();
        }
    }, [isOpen]);

    const fetchSettings = async () => {
        // setIsLoading(true);
        try {
            const [settingsRes, channelsRes] = await Promise.all([
                api.get('/Community/settings'),
                api.get('/Community/channels')
            ]);

            const data = settingsRes.data;
            setSettings(data.settings);
            setRoles(data.roles || []);
            setChannels(channelsRes.data);
            
            setServerName(data.settings.serverName || 'Story of Time');
            // setIconUrl(data.settings.iconUrl || '');
            setThemeImageUrl(data.settings.themeImageUrl || '');
            setDefaultChannelId(data.settings.defaultChannelId || null);
        } catch (err) {
            console.error("Failed to fetch settings", err);
        } finally {
            // setIsLoading(false);
        }
    };

    const fetchMembers = async () => {
        try {
            const res = await api.get('/Community/members');
            setMembers(res.data);
        } catch (err) {
            console.error("Failed to fetch members", err);
        }
    };

    const handleAssignRole = async (userId: number, roleId: number) => {
        try {
            await api.post(`/Community/members/${userId}/roles`, roleId, {
                headers: { 'Content-Type': 'application/json' }
            });
            // Update local state
            setMembers(members.map(m => {
                if (m.id === userId && !m.roles.includes(roleId)) {
                    return { ...m, roles: [...m.roles, roleId] };
                }
                return m;
            }));
        } catch (err) {
            console.error("Failed to assign role", err);
        }
    };

    const handleRemoveRole = async (userId: number, roleId: number) => {
        try {
            await api.delete(`/Community/members/${userId}/roles/${roleId}`);
            // Update local state
            setMembers(members.map(m => {
                if (m.id === userId) {
                    return { ...m, roles: m.roles.filter(r => r !== roleId) };
                }
                return m;
            }));
        } catch (err) {
            console.error("Failed to remove role", err);
        }
    };

    const handleSaveOverview = async () => {
        setIsSaving(true);
        try {
            await api.put('/Community/settings', {
                ...settings,
                serverName,
                // iconUrl, // Removed from UI, keep existing or empty
                themeImageUrl,
                defaultChannelId
            });
            onUpdate();
            alert('设置已保存');
        } catch (err) {
            console.error("Failed to save settings", err);
            alert('保存失败');
        } finally {
            setIsSaving(false);
        }
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                setUploading(true);
                // Use COMMUNITY_BASE_URL to ensure upload goes to the community backend volume

                // If COMMUNITY_BASE_URL is relative (DEV), api.post handles it if we pass full url? 
                // No, api.post uses baseURL. We should use axios directly or force full URL.
                // In PROD, COMMUNITY_BASE_URL is absolute. In DEV it is relative.
                // If relative, api instance (axios) handles it if it matches baseURL, but here it might differ.
                // Safer to use api.post with the full path if absolute, or rely on proxy if relative.
                
                // Construct URL: remove trailing slash if any to avoid double slash
                const baseUrl = COMMUNITY_BASE_URL.endsWith('/') ? COMMUNITY_BASE_URL.slice(0, -1) : COMMUNITY_BASE_URL;
                const endpoint = `${baseUrl}/Upload/image?type=community`;
                
                const res = await api.post(endpoint, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                if (res.data && res.data.url) {
                    setThemeImageUrl(res.data.url); 
                }
            } catch (err) {
                console.error("Failed to upload banner", err);
                alert("上传横幅失败");
            } finally {
                setUploading(false);
            }
        }
    };

    const handleCreateRole = async () => {
        try {
            const res = await api.post('/Community/roles', {
                name: 'New Role',
                color: '#99AAB5',
                permissions: 0,
                isHoisted: false
            });
            setRoles([...roles, res.data]);
            setEditingRole(res.data);
        } catch (err) {
            console.error("Failed to create role", err);
        }
    };

    const debouncedUpdateRole = (role: CommunityRole) => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
            handleUpdateRole(role);
        }, 500);
    };

    const handleUpdateRole = async (role: CommunityRole) => {
        // Cancel previous request if any
        if (updateRoleAbortControllerRef.current) {
            updateRoleAbortControllerRef.current.abort();
        }

        const controller = new AbortController();
        updateRoleAbortControllerRef.current = controller;

        try {
            await api.put(`/Community/roles/${role.id}`, role, {
                signal: controller.signal
            });
            setRoles(roles.map(r => r.id === role.id ? role : r));
            // setEditingRole(role); // Keep editing
        } catch (err) {
            if (axios.isCancel(err)) {
                // Request cancelled, ignore
                return;
            }
            console.error("Failed to update role", err);
        } finally {
            if (updateRoleAbortControllerRef.current === controller) {
                updateRoleAbortControllerRef.current = null;
            }
        }
    };

    const handleDeleteRole = async (roleId: number) => {
        if (!window.confirm('确定要删除这个角色吗？')) return;
        try {
            await api.delete(`/Community/roles/${roleId}`);
            setRoles(roles.filter(r => r.id !== roleId));
            if (editingRole?.id === roleId) setEditingRole(null);
        } catch (err) {
            console.error("Failed to delete role", err);
        }
    };

    const handleSaveChannelPermissions = async (channelId: number, overrides: ChannelPermissionOverride[]) => {
        try {
            await api.put(`/Community/channels/${channelId}/permissions`, overrides);
            // Update local state
            setChannels(channels.map(c => {
                if (c.id === channelId) {
                    return { ...c, permissionOverrides: overrides };
                }
                return c;
            }));
            alert('频道权限已保存');
        } catch (err) {
            console.error("Failed to save channel permissions", err);
            alert('保存权限失败');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-[800px] h-[600px] bg-[#313338] rounded-lg shadow-2xl flex overflow-hidden border border-[#1e1f22]">
                {/* Sidebar */}
                <div className="w-60 bg-[#2b2d31] flex flex-col p-4 border-r border-[#1e1f22]">
                    <div className="text-xs font-bold text-[#949BA4] uppercase mb-2 px-2">社区设置</div>
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={cn("text-left px-2 py-1.5 rounded text-gray-400 hover:bg-[#35373c] hover:text-gray-200 mb-1", activeTab === 'overview' && "bg-[#404249] text-white")}
                    >
                        概览
                    </button>
                    <button 
                        onClick={() => setActiveTab('roles')}
                        className={cn("text-left px-2 py-1.5 rounded text-gray-400 hover:bg-[#35373c] hover:text-gray-200 mb-1", activeTab === 'roles' && "bg-[#404249] text-white")}
                    >
                        角色管理
                    </button>
                    <button 
                        onClick={() => setActiveTab('members')}
                        className={cn("text-left px-2 py-1.5 rounded text-gray-400 hover:bg-[#35373c] hover:text-gray-200 mb-1", activeTab === 'members' && "bg-[#404249] text-white")}
                    >
                        用户管理
                    </button>
                    <button 
                        onClick={() => setActiveTab('channels')}
                        className={cn("text-left px-2 py-1.5 rounded text-gray-400 hover:bg-[#35373c] hover:text-gray-200 mb-1", activeTab === 'channels' && "bg-[#404249] text-white")}
                    >
                        频道管理
                    </button>
                    
                    <div className="flex-1"></div>
                    
                    <button onClick={onClose} className="text-left px-2 py-1.5 rounded text-gray-400 hover:bg-[#35373c] hover:text-gray-200 flex items-center gap-2">
                        <X size={16} />
                        关闭 (ESC)
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 bg-[#313338] flex flex-col min-w-0">
                    <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-white mb-4">服务器概览</h2>
                                
                                <div className="flex gap-8">
                                    <div className="flex-1 space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-[#B5BAC1] uppercase">服务器名称</label>
                                            <input 
                                                type="text" 
                                                value={serverName}
                                                onChange={(e) => setServerName(e.target.value)}
                                                className="w-full bg-[#1e1f22] text-gray-200 p-2 rounded outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            />
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-[#B5BAC1] uppercase">横幅图片 URL</label>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    value={themeImageUrl}
                                                    onChange={(e) => setThemeImageUrl(e.target.value)}
                                                    className="w-full bg-[#1e1f22] text-gray-200 p-2 rounded outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-[#B5BAC1] uppercase">用户进入社区时的默认频道</label>
                                            <select 
                                                value={defaultChannelId || ''}
                                                onChange={(e) => setDefaultChannelId(e.target.value ? parseInt(e.target.value) : null)}
                                                className="w-full bg-[#1e1f22] text-gray-200 p-2 rounded outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            >
                                                <option value="">无默认频道</option>
                                                {channels.map(channel => (
                                                    <option key={channel.id} value={channel.id}>
                                                        {channel.type === 'Voice' ? '🔊 ' : '# '}
                                                        {channel.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div className="w-64 shrink-0 flex flex-col items-center gap-4">
                                        <div 
                                            className="w-full h-36 rounded-lg bg-[#1e1f22] overflow-hidden relative group cursor-pointer border-2 border-dashed border-[#3F4147] hover:border-[#5865F2] transition-colors"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <input 
                                                type="file" 
                                                ref={fileInputRef}
                                                onChange={handleBannerUpload}
                                                className="hidden" 
                                                accept="image/*"
                                            />
                                            {themeImageUrl ? (
                                                <>
                                                    <img src={getAvatarUrl(themeImageUrl)} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="text-white text-sm font-medium flex items-center gap-2">
                                                            <ImageIcon size={16} />
                                                            更换横幅
                                                        </span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 group-hover:text-gray-300">
                                                    <ImageIcon size={32} className="mb-2" />
                                                    <span className="text-xs">点击上传横幅</span>
                                                </div>
                                            )}
                                            {uploading && (
                                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                                    <span className="text-white text-xs">上传中...</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-xs text-center text-gray-400">
                                            建议尺寸 1920x1080
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-[#3F4147] flex justify-end">
                                    <button 
                                        onClick={handleSaveOverview}
                                        disabled={isSaving}
                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Save size={18} />
                                        {isSaving ? '保存中...' : '保存更改'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'roles' && (
                            <div className="h-full flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-white">角色管理</h2>
                                    <button 
                                        onClick={handleCreateRole}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm flex items-center gap-2"
                                    >
                                        <Plus size={16} />
                                        创建角色
                                    </button>
                                </div>

                                <div className="flex-1 flex gap-6 min-h-0">
                                    {/* Role List */}
                                    <div className="w-48 overflow-y-auto custom-scrollbar space-y-1">
                                        {roles.map(role => (
                                            <div 
                                                key={role.id}
                                                onClick={() => setEditingRole(role)}
                                                className={cn(
                                                    "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-[#35373c] text-gray-400 hover:text-gray-200",
                                                    editingRole?.id === role.id && "bg-[#404249] text-white"
                                                )}
                                            >
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }}></div>
                                                <span className="truncate flex-1">{role.name}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Role Editor */}
                                    <div className="flex-1 bg-[#2b2d31] rounded p-4 overflow-y-auto custom-scrollbar">
                                        {editingRole ? (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-[#B5BAC1] uppercase">角色名称</label>
                                                    <input 
                                                        type="text" 
                                                        value={editingRole.name}
                                                        onChange={(e) => {
                                                            const updated = { ...editingRole, name: e.target.value };
                                                            setEditingRole(updated);
                                                            debouncedUpdateRole(updated);
                                                        }}
                                                        className="w-full bg-[#1e1f22] text-gray-200 p-2 rounded outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-[#B5BAC1] uppercase">角色颜色</label>
                                                    <div className="flex items-center gap-2">
                                                        <input 
                                                            type="color" 
                                                            value={editingRole.color}
                                                            onChange={(e) => {
                                                                const updated = { ...editingRole, color: e.target.value };
                                                                setEditingRole(updated);
                                                                debouncedUpdateRole(updated);
                                                            }}
                                                            className="h-10 w-20 bg-[#1e1f22] rounded cursor-pointer border-none outline-none"
                                                        />
                                                        <input 
                                                            type="text"
                                                            value={editingRole.color}
                                                            onChange={(e) => {
                                                                const updated = { ...editingRole, color: e.target.value };
                                                                setEditingRole(updated);
                                                                debouncedUpdateRole(updated);
                                                            }}
                                                            className="flex-1 bg-[#1e1f22] text-gray-200 p-2 rounded outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-[#3F4147]">
                                                     <label className="flex items-center gap-3 cursor-pointer group mb-4">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={!!editingRole.isHoisted}
                                                            onChange={(e) => {
                                                                const updated = { ...editingRole, isHoisted: e.target.checked };
                                                                setEditingRole(updated);
                                                                handleUpdateRole(updated);
                                                            }}
                                                            className="w-5 h-5 rounded border-gray-600 bg-[#1e1f22] text-blue-600 focus:ring-0"
                                                        />
                                                        <div>
                                                            <div className="text-gray-200 font-medium">与在线成员分开显示</div>
                                                            <div className="text-xs text-gray-400">启用后，此角色的成员将在成员列表中单独分组显示。</div>
                                                        </div>
                                                     </label>

                                                    <div className="space-y-4">
                                                        <h3 className="text-xs font-bold text-[#B5BAC1] uppercase">角色权限</h3>
                                                        {PERMISSION_DETAILS.map(perm => {
                                                            const hasPermission = (editingRole.permissions & perm.value) === perm.value;
                                                            return (
                                                                <label key={perm.value} className="flex items-center gap-3 cursor-pointer group">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        checked={hasPermission}
                                                                        onChange={(e) => {
                                                                            let newPermissions = editingRole.permissions;
                                                                            if (e.target.checked) {
                                                                                newPermissions |= perm.value;
                                                                            } else {
                                                                                newPermissions &= ~perm.value;
                                                                            }
                                                                            const updated = { ...editingRole, permissions: newPermissions };
                                                                            setEditingRole(updated);
                                                                            handleUpdateRole(updated);
                                                                        }}
                                                                        className="w-5 h-5 rounded border-gray-600 bg-[#1e1f22] text-blue-600 focus:ring-0"
                                                                    />
                                                                    <div>
                                                                        <div className="text-gray-200 font-medium">{perm.label}</div>
                                                                        <div className="text-xs text-gray-400">{perm.description}</div>
                                                                    </div>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <div className="pt-8 mt-auto flex justify-between items-center">
                                                    <button 
                                                        onClick={() => handleDeleteRole(editingRole.id)}
                                                        className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 px-2 py-1 hover:bg-red-500/10 rounded"
                                                    >
                                                        <Trash2 size={14} />
                                                        删除角色
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-gray-500">
                                                <Shield size={48} className="mb-2 opacity-50" />
                                                <p>选择一个角色进行编辑</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'members' && (
                            <div className="h-full flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-white">用户管理</h2>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            placeholder="搜索成员" 
                                            value={memberSearch}
                                            onChange={(e) => setMemberSearch(e.target.value)}
                                            className="bg-[#1e1f22] text-sm text-gray-300 rounded px-2 py-1.5 w-64 pl-8 outline-none focus:ring-2 focus:ring-blue-500" 
                                        />
                                        <Search size={16} className="absolute left-2 top-2 text-gray-400" />
                                    </div>
                                </div>

                                <div className="flex-1 bg-[#2b2d31] rounded overflow-hidden flex flex-col">
                                    <div className="p-2 border-b border-[#1e1f22] grid grid-cols-12 text-xs font-bold text-[#949BA4] uppercase">
                                        <div className="col-span-5 px-2">成员</div>
                                        <div className="col-span-7 px-2">角色</div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                                        {members.filter(m => 
                                            m.username.toLowerCase().includes(memberSearch.toLowerCase()) || 
                                            (m.nickname && m.nickname.toLowerCase().includes(memberSearch.toLowerCase()))
                                        ).map(member => (
                                            <div key={member.id} className="grid grid-cols-12 items-center p-2 hover:bg-[#35373c] border-b border-[#1e1f22]/50 group">
                                                <div className="col-span-5 px-2 flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-600 overflow-hidden">
                                                        {member.avatarUrl ? (
                                                            <img src={getAvatarUrl(member.avatarUrl)} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                                                                {member.username[0].toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-medium text-sm">{member.nickname || member.username}</div>
                                                        <div className="text-xs text-gray-400">{member.username}</div>
                                                    </div>
                                                </div>
                                                <div className="col-span-7 px-2 flex items-center gap-2 flex-wrap relative">
                                                    {member.roles.map(roleId => {
                                                        const role = roles.find(r => r.id === roleId);
                                                        if (!role) return null;
                                                        return (
                                                            <div key={role.id} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1e1f22] text-xs text-gray-200 border border-[#3f4147]">
                                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: role.color }}></div>
                                                                <span>{role.name}</span>
                                                                <button 
                                                                    onClick={() => handleRemoveRole(member.id, role.id)}
                                                                    className="hover:text-red-400 ml-1"
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                    <div className="relative">
                                                        <button 
                                                            onClick={() => setRoleSelectorMemberId(roleSelectorMemberId === member.id ? null : member.id)}
                                                            className="w-6 h-6 rounded-full bg-[#1e1f22] hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                        
                                                        {/* Role Selector Popover */}
                                                        {roleSelectorMemberId === member.id && (
                                                            <div className="absolute top-8 left-0 w-48 bg-[#111214] rounded shadow-xl border border-[#1e1f22] z-50 p-1">
                                                                <div className="text-xs font-bold text-[#949BA4] px-2 py-1 mb-1">添加角色</div>
                                                                {roles.filter(r => !member.roles.includes(r.id)).length === 0 ? (
                                                                    <div className="px-2 py-1 text-xs text-gray-500">无可用角色</div>
                                                                ) : (
                                                                    roles.filter(r => !member.roles.includes(r.id)).map(role => (
                                                                        <button
                                                                            key={role.id}
                                                                            onClick={() => {
                                                                                handleAssignRole(member.id, role.id);
                                                                                setRoleSelectorMemberId(null);
                                                                            }}
                                                                            className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#4752c4] hover:text-white text-gray-300 text-sm"
                                                                        >
                                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: role.color }}></div>
                                                                            {role.name}
                                                                        </button>
                                                                    ))
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'channels' && (
                            <div className="h-full flex gap-6">
                                {/* Channel List */}
                                <div className="w-48 bg-[#2b2d31] rounded flex flex-col overflow-hidden">
                                    <div className="p-2 text-xs font-bold text-[#949BA4] uppercase">频道列表</div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                        {channels.map(channel => (
                                            <div 
                                                key={channel.id}
                                                onClick={() => setSelectedChannelId(channel.id)}
                                                className={cn(
                                                    "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-[#35373c] text-gray-400 hover:text-gray-200",
                                                    selectedChannelId === channel.id && "bg-[#404249] text-white"
                                                )}
                                            >
                                                <span className="text-gray-500">{channel.type === 'Voice' ? '🔊' : '#'}</span>
                                                <span className="truncate flex-1">{channel.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Channel Permissions Editor */}
                                <div className="flex-1 bg-[#2b2d31] rounded flex flex-col overflow-hidden">
                                    {selectedChannelId ? (
                                        (() => {
                                            const channel = channels.find(c => c.id === selectedChannelId);
                                            if (!channel) return null;
                                            return (
                                                <div className="flex flex-col h-full">
                                                    <div className="p-4 border-b border-[#1e1f22] flex justify-between items-center">
                                                        <div>
                                                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                                <span className="text-gray-400">{channel.type === 'Voice' ? '🔊' : '#'}</span>
                                                                {channel.name}
                                                            </h3>
                                                            <p className="text-xs text-gray-400 mt-1">设置具体角色的权限</p>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleSaveChannelPermissions(channel.id, channel.permissionOverrides || [])}
                                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-sm flex items-center gap-2"
                                                        >
                                                            <Save size={16} />
                                                            保存权限
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                                                        <div className="grid grid-cols-12 text-xs font-bold text-[#949BA4] uppercase mb-2 px-2">
                                                            <div className="col-span-4">角色</div>
                                                            <div className="col-span-8 grid grid-cols-3 gap-2 text-center">
                                                                <div>查看频道</div>
                                                                <div>{channel.type === 'Voice' ? '连接' : '发送消息'}</div>
                                                                <div>管理频道</div>
                                                            </div>
                                                        </div>

                                                        {roles.map(role => {
                                                            const override = channel.permissionOverrides?.find(po => po.roleId === role.id) || {
                                                                roleId: role.id,
                                                                allow: 0,
                                                                deny: 0,
                                                                channelId: channel.id,
                                                                id: 0
                                                            };

                                                            const getPermissionState = (perm: number) => {
                                                                if ((override.allow & perm) === perm) return 'allow';
                                                                if ((override.deny & perm) === perm) return 'deny';
                                                                return 'inherit';
                                                            };

                                                            const togglePermission = (perm: number, state: 'allow' | 'deny' | 'inherit') => {
                                                                let newAllow = override.allow;
                                                                let newDeny = override.deny;

                                                                newAllow &= ~perm;
                                                                newDeny &= ~perm;

                                                                if (state === 'allow') newAllow |= perm;
                                                                if (state === 'deny') newDeny |= perm;

                                                                const newOverride = { ...override, allow: newAllow, deny: newDeny };
                                                                
                                                                const newOverrides = channel.permissionOverrides ? [...channel.permissionOverrides] : [];
                                                                const idx = newOverrides.findIndex(po => po.roleId === role.id);
                                                                if (idx >= 0) {
                                                                    newOverrides[idx] = newOverride;
                                                                } else {
                                                                    newOverrides.push(newOverride);
                                                                }

                                                                setChannels(channels.map(c => c.id === channel.id ? { ...c, permissionOverrides: newOverrides } : c));
                                                            };

                                                            return (
                                                                <div key={role.id} className="grid grid-cols-12 items-center p-2 hover:bg-[#35373c] rounded group">
                                                                    <div className="col-span-4 flex items-center gap-2">
                                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }}></div>
                                                                        <span className="text-gray-300 text-sm font-medium">{role.name}</span>
                                                                    </div>
                                                                    <div className="col-span-8 grid grid-cols-3 gap-2">
                                                                        <PermissionTriState 
                                                                            state={getPermissionState(CommunityPermissions.ViewChannels)}
                                                                            onChange={(s) => togglePermission(CommunityPermissions.ViewChannels, s)}
                                                                        />
                                                                        <PermissionTriState 
                                                                            state={getPermissionState(channel.type === 'Voice' ? CommunityPermissions.Connect : CommunityPermissions.SendMessages)}
                                                                            onChange={(s) => togglePermission(channel.type === 'Voice' ? CommunityPermissions.Connect : CommunityPermissions.SendMessages, s)}
                                                                        />
                                                                        <PermissionTriState 
                                                                            state={getPermissionState(CommunityPermissions.ManageChannels)}
                                                                            onChange={(s) => togglePermission(CommunityPermissions.ManageChannels, s)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-500">
                                            <p>选择一个频道以管理权限</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommunitySettingsModal;
