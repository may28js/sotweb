
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import NewsSection from '../components/NewsSection';
import ActionPanel from '../components/ActionPanel';
import ProjectPlan from '../components/ProjectPlan';
import ShopSection from '../components/ShopSection';
import TimeTunnelBackground from '../components/TimeTunnelBackground';
import { AppTab, ServerStatus } from '../types';
import { SERVER_INFO } from '../constants';
import { LauncherAPI } from '../services/api';
import { Clock } from 'lucide-react';

const LauncherApp: React.FC = () => {
  const [activeGame, setActiveGame] = useState('wow');
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.GAMES);
  const [serverStatus, setServerStatus] = useState<ServerStatus>(SERVER_INFO);

  useEffect(() => {
    const syncData = async () => {
      const status = await LauncherAPI.getServerStatus();
      setServerStatus(status);
    };
    syncData();
    const timer = setInterval(syncData, 30000);
    return () => clearInterval(timer);
  }, []);

  const getBackground = () => {
     if (activeGame === 'wow') return 'https://picsum.photos/id/1022/1920/1080';
     return 'https://picsum.photos/id/237/1920/1080';
  };

  return (
    <div className="flex h-screen w-screen bg-[#0f0518] overflow-hidden text-slate-200 font-[Microsoft YaHei]">
      <div className="absolute inset-0 z-0">
          <img src={getBackground()} className="w-full h-full object-cover opacity-10 blur-md" alt="BG" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f0518] via-[#1a0b2e]/95 to-[#2d1b4e]/80"></div>
          <TimeTunnelBackground />
      </div>

      <Sidebar activeGame={activeGame} setActiveGame={setActiveGame} />

      <div className="flex flex-col flex-1 relative z-10">
        <TopBar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1 flex flex-col overflow-hidden relative">
            {activeTab === AppTab.GAMES && activeGame === 'wow' && (
                <>
                   <div className="px-8 mt-6 mb-4 flex items-end justify-between select-none">
                        <div className="text-left">
                            <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-[#fcd34d] to-[#b45309] drop-shadow-[0_2px_15px_rgba(245,158,11,0.5)] leading-tight">时光故事</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="h-[1px] w-12 bg-amber-600/50"></span>
                                <p className="text-amber-500/80 text-sm font-bold tracking-[0.4em] uppercase">Story of Time</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-[#0f0518]/60 px-4 py-2 rounded-lg border border-purple-500/20 backdrop-blur-md shadow-xl">
                            <Clock size={16} className="text-cyan-400" />
                            <span className="text-sm font-medium text-amber-100">{serverStatus.realmName} ({serverStatus.onlinePlayers} 人在线)</span>
                        </div>
                   </div>
                   <NewsSection />
                   <ActionPanel />
                </>
            )}
            {activeTab === AppTab.SHOP && <ShopSection />}
            {activeTab === AppTab.PLAN && <ProjectPlan />}
        </div>
      </div>
    </div>
  );
};

export default LauncherApp;
