import React from 'react';
import { User, Bell, Minus, Square, X } from 'lucide-react';
import { AppTab } from '../types';

interface TopBarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

const TopBar: React.FC<TopBarProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: AppTab.GAMES, label: '游戏' },
    { id: AppTab.SOCIAL, label: '社交' },
    { id: AppTab.SHOP, label: '商城' },
    { id: AppTab.NEWS, label: '资讯' },
    { id: AppTab.PLAN, label: '开发计划' },
  ];

  // Send commands to C# host
  const handleWindowControl = (action: 'minimize' | 'maximize' | 'close') => {
    if (window.chrome?.webview) {
      window.chrome.webview.postMessage({ type: 'WINDOW_CONTROL', action });
    } else {
      console.log(`[Dev] Window Action: ${action}`);
    }
  };

  return (
    <div className="h-10 bg-transparent flex items-center justify-between px-4 select-none relative z-50">
      {/* Draggable region - This CSS makes the div draggable in Electron/WebView2 */}
      <div className="absolute inset-0 z-0" style={{ WebkitAppRegion: 'drag' } as any}></div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-6 z-10 h-full pointer-events-auto" style={{ WebkitAppRegion: 'no-drag' } as any}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-sm font-bold tracking-wide transition-all h-full border-b-2 flex items-center px-1 ${
              activeTab === tab.id
                ? 'text-amber-400 border-amber-500 shadow-[0_4px_12px_rgba(245,158,11,0.2)]'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* User & Window Controls */}
      <div className="flex items-center gap-4 z-10 pointer-events-auto" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div className="flex items-center gap-3 px-3 py-1 bg-slate-900/60 rounded hover:bg-slate-800 transition-colors cursor-pointer border border-slate-700/50 backdrop-blur-sm">
          <div className="w-6 h-6 rounded bg-purple-900 flex items-center justify-center text-purple-200">
             <User size={14} />
          </div>
          <span className="text-sm font-medium text-amber-500/90">TimeWalker#1337</span>
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]"></div>
        </div>

        <button className="text-slate-400 hover:text-amber-400 relative transition-colors">
          <Bell size={18} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="h-4 w-[1px] bg-slate-700 mx-1"></div>

        <div className="flex items-center gap-2">
            <button onClick={() => handleWindowControl('minimize')} className="text-slate-400 hover:text-white p-1 hover:bg-white/10 rounded transition-colors"><Minus size={16} /></button>
            <button onClick={() => handleWindowControl('maximize')} className="text-slate-400 hover:text-white p-1 hover:bg-white/10 rounded transition-colors"><Square size={14} /></button>
            <button onClick={() => handleWindowControl('close')} className="text-slate-400 hover:text-white p-1 hover:bg-red-500 rounded transition-colors"><X size={18} /></button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;