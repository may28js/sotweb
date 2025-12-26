
import React, { useState, useEffect } from 'react';
import { NEWS_ITEMS, SERVER_INFO } from '../constants';
import { 
  Shield, 
  Download, 
  X, 
  CheckCircle, 
  Info, 
  Zap, 
  Users, 
  Clock, 
  Gamepad2,
  Trophy,
  History,
  AlertCircle
} from 'lucide-react';
import { LauncherAPI } from '../services/api';

const WebsiteApp: React.FC = () => {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regStatus, setRegStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({ account: '', email: '', password: '', confirm: '' });
  const [serverData, setServerData] = useState(SERVER_INFO);

  useEffect(() => {
    const fetchStatus = async () => {
      const status = await LauncherAPI.getServerStatus();
      setServerData(status);
    };
    fetchStatus();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirm) {
      setRegStatus('error');
      setErrorMessage('两次密码输入不一致');
      return;
    }
    
    setRegStatus('loading');
    setErrorMessage('');
    
    const res = await LauncherAPI.register(formData);
    
    if (res.success) {
      setRegStatus('success');
      setTimeout(() => { 
        setIsRegisterOpen(false); 
        setRegStatus('idle'); 
      }, 3000);
    } else {
      setRegStatus('error');
      setErrorMessage(res.message || '注册失败，请检查网络连接');
    }
  };

  return (
    <div className="min-h-screen bg-[#050308] text-slate-100 overflow-x-hidden select-text">
      {/* 顶部导航 */}
      <nav className="fixed top-0 w-full z-50 h-20 bg-black/60 backdrop-blur-md border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer">
            <div className="w-10 h-10 bg-amber-600 rounded flex items-center justify-center font-epic text-xl text-white font-black">S</div>
            <span className="text-xl font-epic font-black tracking-widest text-white">STORY OF TIME</span>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={() => setIsRegisterOpen(true)} className="px-6 py-2 bg-amber-600 text-white font-epic font-bold text-xs tracking-widest hover:bg-amber-500 transition-all">
               立即注册
             </button>
          </div>
        </div>
      </nav>

      {/* Hero 区域 */}
      <header className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://wow.zamimg.com/uploads/screenshots/normal/154562-icecrown-citadel.jpg" className="w-full h-full object-cover opacity-40" alt="BG" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050308] via-transparent to-transparent"></div>
        </div>
        <div className="relative z-10 text-center px-6">
          <h1 className="text-8xl font-epic font-black text-white mb-4">时光<span className="text-amber-500">故事</span></h1>
          <p className="text-amber-200 text-xl tracking-[0.5em] uppercase mb-12">史诗怀旧 3.3.5a 服务器</p>
          <div className="flex gap-4 justify-center">
            <button className="px-10 py-4 bg-amber-600 font-epic font-bold text-lg hover:bg-amber-500 transition-all">下载启动器</button>
            <button className="px-10 py-4 border border-white/20 font-epic font-bold text-lg hover:bg-white/5 transition-all">游戏介绍</button>
          </div>
        </div>
      </header>

      {/* 状态条 */}
      <section className="relative z-20 -mt-16 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 bg-[#120a1a] border border-amber-500/30 rounded-xl overflow-hidden shadow-2xl">
          {[
            { icon: Users, label: '在线玩家', value: serverData.onlinePlayers },
            { icon: History, label: '经验倍率', value: '1.0X' },
            { icon: Trophy, label: '首杀进度', value: '奥杜尔' },
            { icon: Gamepad2, label: '服务器状态', value: '运行中' }
          ].map((item, i) => (
            <div key={i} className="p-6 border-r border-white/5 last:border-0 flex flex-col items-center">
              <item.icon className="text-amber-500 mb-2" size={24} />
              <div className="text-xl font-bold">{item.value}</div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 注册弹窗 */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
           <div className="bg-[#120a1a] w-full max-w-md rounded-lg border border-amber-500/50 shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                 <h2 className="text-xl font-epic font-bold text-white">创建账号</h2>
                 <button onClick={() => setIsRegisterOpen(false)} className="text-slate-400 hover:text-white"><X /></button>
              </div>
              
              <div className="p-8">
                 {regStatus === 'success' ? (
                    <div className="text-center py-6">
                       <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                       <h3 className="text-xl font-bold mb-2">注册成功！</h3>
                       <p className="text-slate-400">正在为您关闭窗口...</p>
                    </div>
                 ) : (
                    <form onSubmit={handleRegister} className="space-y-4">
                       {regStatus === 'error' && (
                         <div className="p-3 bg-red-500/10 border border-red-500/30 rounded flex items-center gap-2 text-red-400 text-xs">
                            <AlertCircle size={14} /> {errorMessage}
                         </div>
                       )}
                       <input required type="text" className="w-full bg-black/40 border border-white/10 p-3 outline-none focus:border-amber-500" placeholder="账号" value={formData.account} onChange={e => setFormData({...formData, account: e.target.value})} />
                       <input required type="email" className="w-full bg-black/40 border border-white/10 p-3 outline-none focus:border-amber-500" placeholder="邮箱" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                       <input required type="password" className="w-full bg-black/40 border border-white/10 p-3 outline-none focus:border-amber-500" placeholder="密码" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                       <input required type="password" className="w-full bg-black/40 border border-white/10 p-3 outline-none focus:border-amber-500" placeholder="重复密码" value={formData.confirm} onChange={e => setFormData({...formData, confirm: e.target.value})} />
                       <button disabled={regStatus === 'loading'} className="w-full py-4 bg-amber-600 font-bold hover:bg-amber-500 disabled:opacity-50">
                          {regStatus === 'loading' ? '正在处理...' : '提交注册'}
                       </button>
                    </form>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default WebsiteApp;
