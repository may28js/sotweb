'use client';

import { useState, useEffect } from 'react';
import { Search, Ban, Shield, Coins, X } from 'lucide-react';
import api from '@/lib/api';

interface User {
  id: number;
  username: string;
  email: string;
  accessLevel: number;
  points: number;
  createdAt?: string; // Controller didn't select this, might be null
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
  const [pointsAdjustment, setPointsAdjustment] = useState('');

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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">用户管理</h1>
      </div>

      <div className="bg-[#1a1a1a] rounded-lg border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                <input 
                    type="text" 
                    placeholder="搜索用户 (用户名或邮箱)..." 
                    className="w-full bg-[#111] border border-white/10 rounded-md py-2 pl-10 pr-4 text-sm text-gray-200 focus:outline-none focus:border-yellow-500/50"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        
        {loading ? (
             <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : (
            <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-gray-400">
                <tr>
                <th className="px-6 py-3 font-medium">ID</th>
                <th className="px-6 py-3 font-medium">用户</th>
                <th className="px-6 py-3 font-medium">邮箱</th>
                <th className="px-6 py-3 font-medium">积分</th>
                <th className="px-6 py-3 font-medium">角色</th>
                <th className="px-6 py-3 font-medium text-right">操作</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
                {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-gray-500">#{user.id}</td>
                        <td className="px-6 py-4 text-white font-medium">{user.username}</td>
                        <td className="px-6 py-4 text-gray-400">{user.email}</td>
                        <td className="px-6 py-4 text-yellow-500">{user.points}</td>
                        <td className="px-6 py-4">
                            {user.accessLevel >= 1 ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400">管理员</span>
                            ) : user.accessLevel === -1 ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-500/10 text-gray-400">已封禁</span>
                            ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400">用户</span>
                            )}
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-3">
                            <button 
                                onClick={() => { setSelectedUser(user); setIsPointsModalOpen(true); }}
                                className="text-yellow-400 hover:text-yellow-300" title="调整积分"
                            >
                                <Coins className="size-4" />
                            </button>
                            <button 
                                onClick={() => handleAccessChange(user.id, user.accessLevel)}
                                className="text-blue-400 hover:text-blue-300" title="权限管理"
                            >
                                <Shield className="size-4" />
                            </button>
                            <button 
                                onClick={() => handleBan(user.id, user.accessLevel)}
                                className="text-red-400 hover:text-red-300" title={user.accessLevel === -1 ? "解封用户" : "封禁用户"}
                            >
                                <Ban className="size-4" />
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
            </table>
        )}
      </div>

      {/* Points Modal */}
      {isPointsModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-lg w-full max-w-sm p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">调整积分 - {selectedUser.username}</h2>
                    <button onClick={() => setIsPointsModalOpen(false)} className="text-gray-400 hover:text-white">
                        <X className="size-5" />
                    </button>
                </div>
                <p className="text-gray-400 text-sm mb-4">当前积分: <span className="text-yellow-500">{selectedUser.points}</span></p>
                <form onSubmit={handlePointsSubmit}>
                    <label className="block text-sm font-medium text-gray-400 mb-1">增减数量 (负数为扣除)</label>
                    <input required type="number" className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white mb-4 focus:border-yellow-500 outline-none"
                        value={pointsAdjustment} onChange={e => setPointsAdjustment(e.target.value)} placeholder="0" />
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setIsPointsModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">取消</button>
                        <button type="submit" className="px-4 py-2 bg-yellow-500 text-black rounded">确认调整</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
