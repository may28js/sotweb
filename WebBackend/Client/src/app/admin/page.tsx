'use client';

import { Users, ShoppingCart, MessageSquare, Newspaper, UserPlus, Server, Activity, RefreshCw, StopCircle, PlayCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { 
  getDashboardStats, 
  getServerStatus, 
  getOnlineHistory, 
  controlServer,
  DashboardStats,
  ServerStatus,
  OnlineHistory
} from '@/services/dashboardService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  // Data States
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [onlineHistory, setOnlineHistory] = useState<OnlineHistory[]>([]);
  
  // Loading States
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingServer, setLoadingServer] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('24h');

  // Fetch Stats & Server Status (Initial Load)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setLoadingStats(false);
      }
    };

    const fetchServer = async () => {
      try {
        const data = await getServerStatus();
        setServerStatus(data);
      } catch (error) {
        console.error('Failed to fetch server status', error);
      } finally {
        setLoadingServer(false);
      }
    };

    fetchStats();
    fetchServer();
  }, []);

  // Fetch History (Dependent on timeRange)
  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const data = await getOnlineHistory(timeRange);
        setOnlineHistory(data);
      } catch (error) {
        console.error('Failed to fetch online history', error);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [timeRange]);

  const handleServerControl = async (action: string) => {
    if (!confirm(`确定要执行 ${action} 操作吗？此操作可能影响玩家体验。`)) return;
    
    setActionLoading(action);
    try {
      await controlServer(action);
      // Refresh status after action
      const newStatus = await getServerStatus();
      setServerStatus(newStatus);
      alert(`服务器 ${action} 指令发送成功`);
    } catch (error) {
      console.error('Server control failed', error);
      alert('操作失败，请检查权限或网络连接');
    } finally {
      setActionLoading(null);
    }
  };

  const statCards = [
    { name: '总用户数', value: stats?.totalUsers ?? 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: '新闻文章', value: stats?.totalNews ?? 0, icon: Newspaper, color: 'text-green-500', bg: 'bg-green-500/10' },
    { name: '评论总数', value: stats?.totalComments ?? 0, icon: MessageSquare, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { name: '商店订单', value: stats?.totalOrders ?? 0, icon: ShoppingCart, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loadingStats ? (
          // Skeleton for Stat Cards
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#1a1a1a] p-6 rounded-lg border border-white/5 shadow-sm h-[106px] animate-pulse">
              <div className="flex items-center justify-between h-full">
                <div className="space-y-3 w-1/2">
                   <div className="h-4 bg-white/10 rounded w-20"></div>
                   <div className="h-8 bg-white/10 rounded w-16"></div>
                </div>
                <div className="size-12 rounded-full bg-white/5"></div>
              </div>
            </div>
          ))
        ) : (
          statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="bg-[#1a1a1a] p-6 rounded-lg border border-white/5 shadow-sm hover:border-white/10 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">{stat.name}</p>
                    <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bg}`}>
                    <Icon className={`size-6 ${stat.color}`} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：服务器状态与控制 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 实时状态 */}
          <div className="bg-[#1a1a1a] rounded-lg border border-white/5 p-6 min-h-[300px]">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Server className="size-5 text-blue-400" />
              游戏服务器状态
            </h3>
            
            {loadingServer ? (
               // Skeleton for Server Status
               <div className="animate-pulse space-y-6">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="size-3 rounded-full bg-white/10"></div>
                    <div className="h-6 bg-white/10 rounded w-24"></div>
                 </div>
                 <div className="space-y-4">
                    <div className="h-2 bg-white/5 rounded-full"></div>
                    <div className="h-2 bg-white/5 rounded-full"></div>
                 </div>
                 <div className="pt-4 border-t border-white/5 flex justify-between">
                    <div className="h-4 bg-white/10 rounded w-16"></div>
                    <div className="h-6 bg-white/10 rounded w-20"></div>
                 </div>
               </div>
            ) : serverStatus ? (
              <>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`size-3 rounded-full ${serverStatus.status === 'Online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-xl font-bold text-white">{serverStatus.status === 'Online' ? '运行中' : '离线'}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    运行时长: <span className="text-gray-200 ml-1">{serverStatus.uptime}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">CPU 使用率</span>
                      <span className="text-white">{serverStatus.cpuUsage}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${serverStatus.cpuUsage > 80 ? 'bg-red-500' : 'bg-blue-500'}`} 
                        style={{ width: `${serverStatus.cpuUsage}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">内存 使用率</span>
                      <span className="text-white">{serverStatus.memoryUsage}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${serverStatus.memoryUsage > 80 ? 'bg-red-500' : 'bg-purple-500'}`} 
                        style={{ width: `${serverStatus.memoryUsage}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                     <div className="flex justify-between items-center">
                        <span className="text-gray-400">在线玩家</span>
                        <div className="text-right">
                            <span className="text-2xl font-bold text-white">{serverStatus.onlinePlayers}</span>
                            <span className="text-sm text-gray-500"> / {serverStatus.maxPlayers}</span>
                        </div>
                     </div>
                  </div>
                </div>
              </>
            ) : (
                <div className="text-red-400 text-sm">获取服务器状态失败</div>
            )}
          </div>

          {/* 管理操作 */}
          <div className="bg-[#1a1a1a] rounded-lg border border-white/5 p-6">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Activity className="size-5 text-orange-400" />
              管理操作
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => handleServerControl('start')}
                disabled={!!actionLoading}
                className="flex flex-col items-center justify-center p-3 rounded bg-green-500/10 text-green-500 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
              >
                <PlayCircle className="size-6 mb-1" />
                <span className="text-xs">启动</span>
              </button>
              <button 
                onClick={() => handleServerControl('restart')}
                disabled={!!actionLoading}
                className="flex flex-col items-center justify-center p-3 rounded bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`size-6 mb-1 ${actionLoading === 'restart' ? 'animate-spin' : ''}`} />
                <span className="text-xs">重启</span>
              </button>
              <button 
                onClick={() => handleServerControl('stop')}
                disabled={!!actionLoading}
                className="flex flex-col items-center justify-center p-3 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
              >
                <StopCircle className="size-6 mb-1" />
                <span className="text-xs">停止</span>
              </button>
            </div>
          </div>
        </div>

        {/* 右侧：图表与最近用户 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 在线人数趋势图 */}
          <div className="bg-[#1a1a1a] rounded-lg border border-white/5 p-6 h-[400px]">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-white">在线人数趋势</h3>
                <div className="flex gap-2 bg-black/20 p-1 rounded-lg">
                    {['1h', '24h', '7d', '30d'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1 text-xs rounded transition-colors ${
                                timeRange === range 
                                    ? 'bg-blue-600 text-white' 
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {range === '1h' ? '1小时' : range === '24h' ? '24小时' : range === '7d' ? '7天' : '30天'}
                        </button>
                    ))}
                </div>
            </div>
            
            {loadingHistory ? (
                // Skeleton for Chart
                <div className="h-[300px] w-full flex items-end justify-between animate-pulse px-4 pb-4">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="bg-white/5 rounded-t w-full mx-1" style={{ height: `${Math.random() * 60 + 20}%` }}></div>
                    ))}
                </div>
            ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={onlineHistory}>
                      <defs>
                        <linearGradient id="colorPlayers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="time" stroke="#666" fontSize={12} tickMargin={10} minTickGap={30} />
                      <YAxis 
                        stroke="#666" 
                        fontSize={12} 
                        allowDecimals={false} 
                        domain={[0, (dataMax: number) => {
                            if (dataMax <= 0) return 5;
                            const target = Math.ceil(dataMax * 1.2);
                            return Math.ceil(target / 5) * 5;
                        }]}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="players" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorPlayers)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
            )}
          </div>

          {/* 最新用户列表 */}
          <div className="bg-[#1a1a1a] rounded-lg border border-white/5 p-6">
            <h3 className="text-lg font-medium text-white mb-4">最新注册用户</h3>
            <div className="space-y-4">
              {loadingStats ? (
                 // Skeleton for Recent Users
                 [...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                        <div className="size-10 rounded-full bg-white/5"></div>
                        <div className="space-y-2 flex-1">
                            <div className="h-4 bg-white/10 rounded w-1/3"></div>
                            <div className="h-3 bg-white/5 rounded w-1/4"></div>
                        </div>
                    </div>
                 ))
              ) : stats?.recentUsers && stats.recentUsers.length > 0 ? (
                  stats.recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-4 pb-4 border-b border-white/5 last:border-0 last:pb-0">
                      <div className="size-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                        <UserPlus className="size-5" />
                      </div>
                      <div>
                        <p className="text-sm text-white">新用户 <span className="text-yellow-500">{user.username}</span> ({user.email})</p>
                        <p className="text-xs text-gray-500">
                          {new Date(user.createdAt).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    </div>
                  ))
              ) : (
                  <div className="text-gray-500">暂无新用户</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
