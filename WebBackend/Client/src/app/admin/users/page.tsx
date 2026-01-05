'use client';

import { useState, useEffect } from 'react';
import { Search, Ban, Shield, Coins, X, MoreHorizontal, User as UserIcon, Mail, Calendar, CreditCard, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import api from '@/lib/api';

interface User {
  id: number;
  username: string;
  email: string;
  accessLevel: number;
  points: number;
  createdAt?: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [pointsAdjustment, setPointsAdjustment] = useState('');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId !== null) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  const handleAccessChange = async (userId: number, currentLevel: number) => {
    const newLevel = currentLevel >= 1 ? 0 : 1; // Toggle Admin/User
    if(!confirm(`确定要将此用户设置为 ${newLevel >= 1 ? '管理员' : '普通用户'} 吗？`)) return;

    try {
        await api.post(`/users/${userId}/access-level`, newLevel, { headers: { 'Content-Type': 'application/json' }});
        setUsers(users.map(u => u.id === userId ? { ...u, accessLevel: newLevel } : u));
    } catch (error) {
        alert('操作失败');
    }
  };

  const handleBan = async (userId: number, currentLevel: number) => {
    const newLevel = currentLevel === -1 ? 0 : -1; // Toggle Ban/Unban
    if(!confirm(`确定要 ${newLevel === -1 ? '封禁' : '解封'} 此用户吗？`)) return;

    try {
      await api.post(`/users/${userId}/access-level`, newLevel, { headers: { 'Content-Type': 'application/json' }});
      setUsers(users.map(u => u.id === userId ? { ...u, accessLevel: newLevel } : u));
    } catch (error) {
      alert('操作失败');
    }
  }

  const handlePointsSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedUser) return;
      
      const amount = Number(pointsAdjustment);
      if (isNaN(amount) || amount === 0) {
          alert('请输入有效的积分数量');
          return;
      }

      try {
          await api.post(`/users/${selectedUser.id}/points`, amount, { headers: { 'Content-Type': 'application/json' }});
          setUsers(users.map(u => u.id === selectedUser.id ? { ...u, points: u.points + amount } : u));
          setIsPointsModalOpen(false);
          setPointsAdjustment('');
      } catch (error) {
          alert('操作失败');
      }
  }

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center shrink-0">
        <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">用户管理</h1>
            <p className="text-sm text-gray-400">管理系统所有注册用户及其权限。</p>
        </div>
      </div>

      <div className="flex items-center space-x-2 bg-[#1a1a1a] p-1 rounded-lg border border-white/5 w-full max-w-sm shrink-0">
        <Search className="size-4 text-gray-500 ml-2" />
        <input 
            type="text" 
            placeholder="搜索用户..." 
            className="flex-1 bg-transparent border-none text-sm text-gray-200 focus:outline-none placeholder:text-gray-600 py-1"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="flex-initial min-h-0 bg-[#1a1a1a] rounded-lg border border-white/5 overflow-hidden flex flex-col">
        {loading ? (
             <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                    <p className="text-sm">加载数据中...</p>
                </div>
             </div>
        ) : (
            <div className="overflow-auto">
                <table className="w-full text-left text-sm">
                <thead className="bg-black/20 text-gray-400 border-b border-white/5 sticky top-0 backdrop-blur-sm">
                    <tr>
                    <th className="px-4 py-3 font-medium w-16">ID</th>
                    <th className="px-4 py-3 font-medium">用户</th>
                    <th className="px-4 py-3 font-medium">邮箱</th>
                    <th className="px-4 py-3 font-medium">积分</th>
                    <th className="px-4 py-3 font-medium">角色</th>
                    <th className="px-4 py-3 font-medium text-right w-16">操作</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {paginatedUsers.map(user => (
                        <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                            <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">#{user.id}</td>
                            <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                    <div className="size-6 rounded-full bg-white/5 flex items-center justify-center text-xs font-medium text-gray-300">
                                        {user.username[0].toUpperCase()}
                                    </div>
                                    <span className="text-gray-200 font-medium">{user.username}</span>
                                </div>
                            </td>
                            <td className="px-4 py-2.5 text-gray-400">{user.email}</td>
                            <td className="px-4 py-2.5 text-yellow-500 font-medium tabular-nums">{user.points.toLocaleString()}</td>
                            <td className="px-4 py-2.5">
                                {user.accessLevel >= 1 ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                        管理员
                                    </span>
                                ) : user.accessLevel === -1 ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
                                        已封禁
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                        用户
                                    </span>
                                )}
                            </td>
                            <td className="px-4 py-2.5 text-right relative">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuId(openMenuId === user.id ? null : user.id);
                                    }}
                                    className="p-1 text-gray-500 hover:text-white rounded hover:bg-white/10 transition-colors"
                                >
                                    <MoreHorizontal className="size-4" />
                                </button>
                                
                                {/* Dropdown Menu */}
                                {openMenuId === user.id && (
                                    <div className="absolute right-8 top-0 z-50 w-48 rounded-md bg-[#222] border border-white/10 shadow-xl py-1 text-sm animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                        <div className="px-2 py-1.5 text-xs text-gray-500 font-medium border-b border-white/5 mb-1">
                                            操作菜单
                                        </div>
                                        <button 
                                            onClick={() => { setSelectedUser(user); setIsDetailSheetOpen(true); }}
                                            className="w-full text-left px-3 py-2 text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                                        >
                                            <UserIcon className="size-3.5" /> 查看详情
                                        </button>
                                        <button 
                                            onClick={() => { setSelectedUser(user); setIsPointsModalOpen(true); }}
                                            className="w-full text-left px-3 py-2 text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                                        >
                                            <Coins className="size-3.5" /> 调整积分
                                        </button>
                                        <div className="h-px bg-white/5 my-1" />
                                        <button 
                                            onClick={() => handleAccessChange(user.id, user.accessLevel)}
                                            className="w-full text-left px-3 py-2 text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                                        >
                                            <Shield className="size-3.5" /> 
                                            {user.accessLevel >= 1 ? '降级为用户' : '设为管理员'}
                                        </button>
                                        <button 
                                            onClick={() => handleBan(user.id, user.accessLevel)}
                                            className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2"
                                        >
                                            <Ban className="size-3.5" />
                                            {user.accessLevel === -1 ? '解除封禁' : '封禁用户'}
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
                </table>
            </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-2 shrink-0">
        <div className="flex items-center space-x-2 text-sm text-gray-400">
            <span>每页显示</span>
            <select 
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-[#1a1a1a] border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-yellow-500"
            >
                {[10, 20, 30, 50].map(size => (
                    <option key={size} value={size}>{size}</option>
                ))}
            </select>
            <span>条数据</span>
        </div>

        <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex w-[100px] items-center justify-center text-sm font-medium text-gray-400">
                第 {currentPage} / {Math.max(1, totalPages)} 页
            </div>
            <div className="flex items-center space-x-2">
                <button
                    className="h-8 w-8 p-0 flex items-center justify-center rounded-md border border-white/10 bg-[#1a1a1a] text-gray-400 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                >
                    <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                    className="h-8 w-8 p-0 flex items-center justify-center rounded-md border border-white/10 bg-[#1a1a1a] text-gray-400 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                    className="h-8 w-8 p-0 flex items-center justify-center rounded-md border border-white/10 bg-[#1a1a1a] text-gray-400 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
                <button
                    className="h-8 w-8 p-0 flex items-center justify-center rounded-md border border-white/10 bg-[#1a1a1a] text-gray-400 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                >
                    <ChevronsRight className="h-4 w-4" />
                </button>
            </div>
        </div>
      </div>

      {/* Points Modal (Existing, slightly styled) */}
      {isPointsModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-lg w-full max-w-sm p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-white">调整积分</h2>
                    <button onClick={() => setIsPointsModalOpen(false)} className="text-gray-400 hover:text-white">
                        <X className="size-5" />
                    </button>
                </div>
                <div className="bg-white/5 rounded p-3 mb-4 flex items-center justify-between">
                    <span className="text-sm text-gray-400">当前用户</span>
                    <span className="text-sm font-medium text-white">{selectedUser.username}</span>
                </div>
                <div className="bg-white/5 rounded p-3 mb-4 flex items-center justify-between">
                    <span className="text-sm text-gray-400">当前余额</span>
                    <span className="text-yellow-500 font-mono font-bold">{selectedUser.points}</span>
                </div>
                <form onSubmit={handlePointsSubmit}>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">变更数量 (+/-)</label>
                    <input required type="number" className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white mb-4 focus:border-yellow-500 outline-none text-sm"
                        value={pointsAdjustment} onChange={e => setPointsAdjustment(e.target.value)} placeholder="0" autoFocus />
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setIsPointsModalOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">取消</button>
                        <button type="submit" className="px-4 py-2 bg-yellow-500 text-black text-sm font-medium rounded hover:bg-yellow-400 transition-colors">确认调整</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Detail Sheet (New Side Panel) */}
      {isDetailSheetOpen && selectedUser && (
        <div className="fixed inset-0 z-[60] flex justify-end">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={() => setIsDetailSheetOpen(false)}
            />
            
            {/* Sheet Content */}
            <div className="relative w-full max-w-md bg-[#181818] border-l border-white/10 h-full shadow-2xl p-6 flex flex-col animate-in slide-in-from-right duration-300">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">用户详情</h2>
                        <p className="text-sm text-gray-400">查看用户的详细信息和状态。</p>
                    </div>
                    <button onClick={() => setIsDetailSheetOpen(false)} className="p-1 text-gray-400 hover:text-white bg-white/5 rounded hover:bg-white/10 transition-colors">
                        <X className="size-5" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* User Header Card */}
                    <div className="bg-gradient-to-br from-white/5 to-transparent rounded-xl p-6 border border-white/5 flex items-center gap-4">
                         <div className="size-16 rounded-full bg-yellow-500/20 flex items-center justify-center text-2xl font-bold text-yellow-500 shrink-0">
                            {selectedUser.username[0].toUpperCase()}
                         </div>
                         <div>
                            <h3 className="text-lg font-bold text-white">{selectedUser.username}</h3>
                            <p className="text-sm text-gray-400">ID: #{selectedUser.id}</p>
                         </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid gap-4">
                        <div className="p-4 rounded-lg bg-black/20 border border-white/5">
                            <div className="flex items-center gap-3 mb-1">
                                <Mail className="size-4 text-gray-500" />
                                <span className="text-xs text-gray-500 uppercase tracking-wider">电子邮箱</span>
                            </div>
                            <p className="text-gray-200 pl-7">{selectedUser.email}</p>
                        </div>

                        <div className="p-4 rounded-lg bg-black/20 border border-white/5">
                             <div className="flex items-center gap-3 mb-1">
                                <CreditCard className="size-4 text-gray-500" />
                                <span className="text-xs text-gray-500 uppercase tracking-wider">当前积分</span>
                            </div>
                            <p className="text-yellow-500 font-mono font-bold pl-7 text-lg">{selectedUser.points.toLocaleString()}</p>
                        </div>

                        <div className="p-4 rounded-lg bg-black/20 border border-white/5">
                             <div className="flex items-center gap-3 mb-1">
                                <Shield className="size-4 text-gray-500" />
                                <span className="text-xs text-gray-500 uppercase tracking-wider">账号权限</span>
                            </div>
                            <div className="pl-7 mt-1">
                                {selectedUser.accessLevel >= 1 ? (
                                    <span className="inline-flex items-center gap-1.5 text-red-400">
                                        <div className="size-1.5 rounded-full bg-red-400 animate-pulse" /> 管理员权限
                                    </span>
                                ) : selectedUser.accessLevel === -1 ? (
                                    <span className="inline-flex items-center gap-1.5 text-gray-400">
                                        <div className="size-1.5 rounded-full bg-gray-400" /> 账号已封禁
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 text-blue-400">
                                        <div className="size-1.5 rounded-full bg-blue-400" /> 普通用户
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-4 rounded-lg bg-black/20 border border-white/5">
                             <div className="flex items-center gap-3 mb-1">
                                <Calendar className="size-4 text-gray-500" />
                                <span className="text-xs text-gray-500 uppercase tracking-wider">注册时间</span>
                            </div>
                            <p className="text-gray-200 pl-7 font-mono text-sm">
                                {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : '未知时间'}
                            </p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <button 
                            onClick={() => {
                                setIsDetailSheetOpen(false);
                                setIsPointsModalOpen(true);
                            }}
                            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors text-sm font-medium border border-white/5"
                        >
                            快速操作：调整积分
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}
