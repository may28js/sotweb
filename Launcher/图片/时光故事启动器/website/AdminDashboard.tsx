
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  Cpu,
  CheckCircle2,
  Info,
  Zap,
  HardDrive,
  Network,
  Users,
  TrendingUp,
  Activity,
  Lock,
  XCircle
} from 'lucide-react';
import { LauncherAPI } from '../services/api';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [serverStats, setServerStats] = useState({ online: 0, lag: 0, status: 'Checking' });
  const [performance, setPerformance] = useState({ cpu: 0, mem: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const status = await LauncherAPI.getServerStatus();
      setServerStats({
        online: status.onlinePlayers,
        lag: status.latency,
        status: status.isOnline ? 'Online' : 'Offline'
      });
      // CPU/内存通常需要后端额外接口，这里先模拟一个相对稳定的数值
      setPerformance({
        cpu: 20 + Math.floor(Math.random() * 10),
        mem: 40 + Math.floor(Math.random() * 5)
      });
    };

    fetchData();
    const timer = setInterval(fetchData, 5000);
    return () => clearInterval(timer);
  }, []);

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/5 p-8 rounded-3xl border border-white/5">
             <div className="flex justify-between items-start mb-4">
                <Users className="text-blue-500" size={24} />
                <TrendingUp size={16} className="text-emerald-500" />
             </div>
             <div className="text-3xl font-black mb-1">{serverStats.online}</div>
             <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">实时在线 (API)</div>
          </div>

          <div className="bg-white/5 p-8 rounded-3xl border border-white/5">
             <div className="flex justify-between items-start mb-4">
                <Network className="text-emerald-500" size={24} />
                {serverStats.status === 'Online' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-red-500" />}
             </div>
             <div className={`text-3xl font-black mb-1 ${serverStats.status === 'Online' ? 'text-emerald-500' : 'text-red-500'}`}>
                {serverStats.status}
             </div>
             <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">SOAP 接口连通性</div>
          </div>

          <div className="bg-white/5 p-8 rounded-3xl border border-white/5">
             <div className="flex justify-between items-start mb-4">
                <Cpu className="text-purple-500" size={24} />
             </div>
             <div className="text-3xl font-black mb-1">{performance.cpu}%</div>
             <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">CPU 占用率</div>
          </div>

          <div className="bg-white/5 p-8 rounded-3xl border border-white/5">
             <div className="flex justify-between items-start mb-4">
                <HardDrive className="text-amber-500" size={24} />
             </div>
             <div className="text-3xl font-black mb-1">{performance.mem}%</div>
             <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">内存占用率</div>
          </div>
       </div>

       {/* 延迟图表 */}
       <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 min-h-[300px] flex flex-col">
          <div className="flex justify-between items-center mb-10">
             <h3 className="font-bold flex items-center gap-3"><Activity className="text-blue-500"/> 网络延迟实时监测 (ms)</h3>
             <span className="text-xs text-emerald-400 font-mono">Current: {serverStats.lag}ms</span>
          </div>
          <div className="flex-1 flex items-end gap-1 px-4">
             {[...Array(40)].map((_, i) => (
                <div 
                   key={i} 
                   className="flex-1 bg-blue-600/40 rounded-t-sm" 
                   style={{ height: `${15 + (i === 39 ? serverStats.lag/2 : Math.random() * 40)}%` }}
                ></div>
             ))}
          </div>
       </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0a0510] text-slate-200 font-sans select-text">
      <aside className="w-64 bg-[#0f0518] border-r border-white/5 flex flex-col p-6 flex-shrink-0">
        <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
           <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-black text-xl">M</div>
           <div>
              <span className="font-bold text-lg block">时光管理</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">Dedicated Mode</span>
           </div>
        </div>
        
        <nav className="flex-1 space-y-1">
           <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-white/5'}`}>
              <LayoutDashboard size={18} /> 数据看板
           </button>
           <button onClick={() => setActiveTab('setup')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'setup' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-white/5'}`}>
              <Settings size={18} /> 实装配置
           </button>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
         {activeTab === 'dashboard' ? renderDashboard() : (
            <div className="space-y-6">
               <h1 className="text-2xl font-bold">服务器实装指南</h1>
               <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                  <p className="text-sm text-amber-500 font-bold mb-2">后端 API Bridge 状态自检：</p>
                  <ul className="text-xs text-slate-400 space-y-1">
                     <li>1. 确保服务器上运行了 <code className="text-white">node api/server.js</code></li>
                     <li>2. 确保 Nginx 已配置 <code className="text-white">location /api/</code> 的反向代理</li>
                     <li>3. 如注册依然失败，请查看 node 控制台日志。</li>
                  </ul>
               </div>
            </div>
         )}
      </main>
    </div>
  );
};

export default AdminDashboard;
