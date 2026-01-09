import React, { useState, useEffect } from 'react';
import LoginPage from './LoginPage';
import { launcherService, authService } from './services/api';
import type { User } from './types';
import { 
  Play, 
  Pause, 
  Minus, 
  X, 
  Users, 
  ShoppingCart, 
  Newspaper, 
  Rocket, 
  Settings, 
  LogOut
} from 'lucide-react';

import GamePage from './components/GamePage';
import SocialPage from './components/SocialPage';
import StorePage from './components/StorePage';
import NewsPage from './components/NewsPage';
import DevPage from './components/DevPage';
import PluginsPage from './components/PluginsPage';

// Host-aligned State Enum
const LauncherState = {
  Checking: 0,
  Install: 1,
  Update: 2,
  Ready: 3,
  Working: 4,
  Playing: 5,
  Error: 6
} as const;

type LauncherStateType = typeof LauncherState[keyof typeof LauncherState];

interface LauncherStatus {
  State: LauncherStateType;
  Message: string;
  Progress: number;
  Speed: string;
}

type Tab = 'game' | 'social' | 'store' | 'news' | 'dev' | 'plugins';
type GameStatus = 'not_installed' | 'installing' | 'updating' | 'ready' | 'playing' | 'checking' | 'error';

const NavItem = ({ icon, active, onClick }: { icon: React.ReactNode, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full p-3 transition-all duration-300 group relative flex justify-center items-center ${active ? 'bg-gradient-to-r from-amber-500/20 to-transparent text-amber-500' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
  >
    {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />}
    {icon}
  </button>
);

const TopNavLink = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`relative px-1 py-4 transition-colors ${active ? 'text-amber-400' : 'text-gray-400 hover:text-gray-200'}`}
  >
    {label}
    {active && (
      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span>
    )}
  </button>
);

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('game');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string>('');
  // const [userError, setUserError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Game State
  const [gameStatus, setGameStatus] = useState<GameStatus>('checking');
  const [statusMessage, setStatusMessage] = useState<string>('正在初始化...');
  const [progress, setProgress] = useState(0); // 0-100
  const [downloadSpeed, setDownloadSpeed] = useState('0 KB/s');
  
  const [isPaused, setIsPaused] = useState(false);
  const [operationType, setOperationType] = useState<'install' | 'update'>('install');
  const [isLoading, setIsLoading] = useState(true);
  
  // Client Discovery State
  const [discoveredClients, setDiscoveredClients] = useState<string[]>([]);
  const [showClientSelector, setShowClientSelector] = useState(false);

  // const [launcherConfig, setLauncherConfig] = useState<LauncherConfig | null>(null); // Unused

  useEffect(() => {
    // Check for existing token
    const token = localStorage.getItem('auth_token');
    const storedUsername = localStorage.getItem('auth_username');
    if (token) {
        setIsLoggedIn(true);
        if (storedUsername) setUsername(storedUsername);
        
        // Fetch fresh user info
        authService.getMe(token).then(u => {
            setUser(u);
            setUsername(u.username);
            // setUserError(null);
        }).catch(err => {
            console.error("Failed to restore session", err);
            // If 401, token is invalid/expired. Logout.
            if (err.message && err.message.includes('401')) {
                console.log("Session expired, logging out.");
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_username');
                setIsLoggedIn(false);
                setUser(null);
            }
        });
    }

    const initConfig = async () => {
        const config = await launcherService.getConfig();
        // setLauncherConfig(config);
        // @ts-ignore
        if (window.chrome?.webview) {
            // @ts-ignore
            window.chrome.webview.postMessage({ 
                type: 'set_realmlist', 
                payload: { realmlist: config.realmlist } 
            });
        }
    };
    initConfig();
  }, []);

  // IPC Handling
  useEffect(() => {
    // @ts-ignore
    if (window.chrome?.webview) {
        // @ts-ignore
        const messageHandler = (event: any) => {
                  const message = event.data;
                  console.log("[Frontend] Received IPC:", message);
                  if (message && message.type === 'state_update') {
                      const status = message.payload as LauncherStatus;
                      console.log("[Frontend] State Update:", status);
                      
                      setStatusMessage(status.Message);
                setProgress(status.Progress);
                setDownloadSpeed(status.Speed);

                switch (status.State) {
                    case LauncherState.Checking:
                        setGameStatus('checking');
                        break;
                    case LauncherState.Install:
                        setGameStatus('not_installed');
                        setOperationType('install');
                        break;
                    case LauncherState.Update:
                        setGameStatus('updating');
                        setOperationType('update');
                        break;
                    case LauncherState.Ready:
                        setGameStatus('ready');
                        break;
                    case LauncherState.Working:
                        // Visually map Working to Installing or Updating based on context, 
                        // or just generic 'installing' style (blue/amber bar)
                        // If previous state was updating, keep it updating to show correct text?
                        // Actually 'statusMessage' from Host is accurate (e.g. "Downloading...", "Verifying...")
                        // We just need a GameStatus that triggers the Progress Bar.
                        // 'installing' enables the progress bar in current UI.
                        setGameStatus('installing');
                        break;
                    case LauncherState.Playing:
                        setGameStatus('playing');
                        break;
                    case LauncherState.Error:
                        setGameStatus('error');
                        break;
                }
            } else if (message && message.type === 'error') {
                console.error("IPC Error:", message.payload);
            } else if (message && message.type === 'discovered_clients') {
                console.log("[Frontend] Discovered Clients Message:", message.payload);
                
                let paths: string[] = [];
                if (Array.isArray(message.payload)) {
                    paths = message.payload;
                } else if (message.payload && Array.isArray(message.payload.paths)) {
                    paths = message.payload.paths;
                }
                
                if (paths.length > 0) {
                    console.log("[Frontend] Showing Client Selector with paths:", paths);
                    setDiscoveredClients(paths);
                    setShowClientSelector(true);
                }
            }
        };
        // @ts-ignore
        window.chrome.webview.addEventListener('message', messageHandler);
        
        // Notify Host we are ready
        // @ts-ignore
        window.chrome.webview.postMessage({ type: 'app_ready' });

        // Force disable loading after 2 seconds regardless of IPC status to show Login
        setTimeout(() => setIsLoading(false), 2000);

        return () => {
             // @ts-ignore
             window.chrome.webview.removeEventListener('message', messageHandler);
        };
    } else {
        // Browser fallback (dev mode)
        setTimeout(() => setIsLoading(false), 2000);
        setStatusMessage("开发模式 - 无后端连接");
    }
  }, []);

  // Handle window dragging via Host
  const handleDrag = (e: React.MouseEvent) => {
    if (e.button === 0) {
      // @ts-ignore
      if (window.chrome?.webview) {
        // @ts-ignore
        window.chrome.webview.postMessage({ type: 'drag' });
      }
    }
  };

  // Client Import Handler
  const handleImportClient = (path: string) => {
    console.log("Importing client from:", path);
    // @ts-ignore
    if (window.chrome?.webview) {
        // @ts-ignore
        window.chrome.webview.postMessage({ 
            type: 'import_game', 
            payload: { path: path } 
        });
    }
    setShowClientSelector(false);
  };

  // Main Action Trigger
   const handleGameAction = () => {
     // @ts-ignore
     if (window.chrome?.webview) {
         // Send generic action signal, Host decides what to do based on its state
         // @ts-ignore
         window.chrome.webview.postMessage({ type: 'main_action' });
     } else {
        // Browser Mock
        console.log("Main Action Clicked (Dev Mode)");
        if (gameStatus === 'not_installed') {
            setGameStatus('installing');
            let p = 0;
            const timer = setInterval(() => {
                p += 1;
                setProgress(p);
                setStatusMessage(`下载中... ${p}%`);
                if (p >= 100) {
                    clearInterval(timer);
                    setGameStatus('ready');
                    setStatusMessage("准备就绪");
                }
            }, 50);
        } else if (gameStatus === 'ready') {
            setGameStatus('playing');
            setTimeout(() => setGameStatus('ready'), 3000); 
        }
    }
  };

  const togglePause = () => {
    // Host doesn't support pause yet in this version of code analysis, 
    // but we can keep the UI button non-functional or send message that Host ignores.
    // For now, let's just log it.
    console.log("Pause toggle requested");
    // @ts-ignore
    if (window.chrome?.webview) window.chrome.webview.postMessage({ type: 'toggle_pause' });
    setIsPaused(!isPaused);
  };

  const handleMinimize = () => {
    // @ts-ignore
    if (window.chrome?.webview) window.chrome.webview.postMessage({ type: 'minimize' });
    else console.log('Minimize');
  };

  const handleClose = () => {
    // @ts-ignore
    if (window.chrome?.webview) window.chrome.webview.postMessage({ type: 'close' });
    else console.log('Close');
  };

  const getButtonConfig = () => {
    switch (gameStatus) {
        case 'checking':
            return {
                text: '正在检查...',
                className: 'bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 border-blue-400/50 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]',
                disabled: true
            };
        case 'not_installed':
            const hasDiscovered = discoveredClients.length > 0;
            return {
                text: hasDiscovered ? '安装游戏' : '下载游戏',
                className: hasDiscovered
                    ? 'bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 border-blue-400/50 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                    : 'bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 border-emerald-400/50 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]',
                disabled: false
            };
        case 'installing':
            if (operationType === 'update') {
                return {
                    text: '正在更新...',
                    className: 'bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 border-emerald-400/50 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]',
                    disabled: true
                };
            }
            if (statusMessage.includes('导入')) {
                return {
                    text: '正在导入...',
                    className: 'bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 border-blue-400/50 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]',
                    disabled: true
                };
            }
            return {
                text: '正在下载...',
                className: 'bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 border-emerald-400/50 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]',
                disabled: true
            };
        case 'updating':
            return {
                text: '更新游戏',
                className: 'bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 border-emerald-400/50 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]',
                disabled: false
            };
        case 'ready':
            return {
                text: '开始游戏',
                className: 'bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 border-amber-400/50 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]',
                disabled: false
            };
        case 'playing':
            return {
                text: '游戏中',
                className: 'bg-gradient-to-b from-amber-500 to-amber-600 border-amber-400/50 text-black opacity-80 cursor-not-allowed',
                disabled: true
            };
        case 'error':
            return {
                text: '重试',
                className: 'bg-gradient-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 border-red-500/50 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]',
                disabled: false
            };
        default:
            return {
                text: '请稍候...',
                className: 'bg-gray-600 text-gray-400',
                disabled: true
            };
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'game':
        return <GamePage />;
      case 'social':
      return <SocialPage />;
    case 'store':
      return <StorePage user={user} />;
    case 'news':
      return <NewsPage />;
    case 'dev':
        return <DevPage />;
      case 'plugins':
        return <PluginsPage />;
      default:
        return <GamePage />;
    }
  };

  if (isLoading) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center"
           style={{
               backgroundColor: '#222222',
               backgroundImage: "url('/images/general-page-bg.avif')",
               backgroundSize: 'cover',
               backgroundPosition: 'center',
               backgroundRepeat: 'no-repeat'
           }}
      >
        <div className="relative z-10 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-8"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden text-white font-sans select-none border border-white/5 rounded-lg relative">
      
      {/* Global Background Image */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          <img src="/images/general-page-bg.avif" className="w-full h-full object-cover" alt="Background" />
      </div>

      {showLoginModal && (
        <LoginPage 
          onLogin={() => {
            setIsLoggedIn(true);
            const storedUsername = localStorage.getItem('auth_username');
            const token = localStorage.getItem('auth_token');
            if (storedUsername) setUsername(storedUsername);
            if (token) {
                authService.getMe(token).then(u => {
                    setUser(u);
                    // setUserError(null);
                }).catch(err => {
                    console.error(err);
                    // If 401, token is invalid. Logout.
                    if (err.message && err.message.includes('401')) {
                        console.log("Login session failed immediately, logging out.");
                        localStorage.removeItem('auth_token');
                        localStorage.removeItem('auth_username');
                        setIsLoggedIn(false);
                        setUser(null);
                        // Optional: Show error toast or reopen login modal
                        alert("登录会话无效，请重试");
                    }
                });
            }
            setShowLoginModal(false);
          }} 
          onDrag={handleDrag}
          onClose={() => setShowLoginModal(false)}
        />
      )}

      {/* Client Selector Modal */}
      {showClientSelector && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
           <div className="w-[600px] bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden">
              {/* Header */}
              <div className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-white/5" onMouseDown={handleDrag}>
                  <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500">
                          <Settings size={18} />
                      </div>
                      <span className="font-bold text-lg text-gray-100">发现本地客户端</span>
                  </div>
                  <button onClick={() => setShowClientSelector(false)} className="text-gray-400 hover:text-white transition-colors">
                      <X size={20} />
                  </button>
              </div>

              {/* Body */}
              <div className="p-6 flex flex-col gap-4">
                  <p className="text-gray-400 text-sm leading-relaxed">
                      启动器在您的电脑中发现了以下魔兽世界 3.3.5a 客户端。<br/>
                      您可以直接导入其中一个，或者点击“取消”来重新下载纯净客户端。
                  </p>
                  
                  <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                      {discoveredClients.map((path, idx) => (
                          <button 
                              key={idx}
                              onClick={() => handleImportClient(path)}
                              className="group flex flex-col items-start p-4 rounded-lg bg-white/5 hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/30 transition-all text-left"
                          >
                              <div className="flex items-center gap-2 w-full">
                                  <span className="text-amber-500 font-mono text-xs px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                                      3.3.5a
                                  </span>
                                  <span className="text-gray-200 font-medium truncate flex-1 group-hover:text-amber-400 transition-colors">
                                      {path}
                                  </span>
                              </div>
                              <span className="text-xs text-gray-500 mt-1 pl-1">点击导入此客户端</span>
                          </button>
                      ))}
                  </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-black/20 border-t border-white/5 flex justify-end gap-3">
                  <button 
                      onClick={() => {
                          setShowClientSelector(false);
                          setDiscoveredClients([]);
                      }}
                      className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
                  >
                      忽略并下载新游戏
                  </button>
              </div>
           </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-[70px] flex flex-col items-center py-6 z-20">
        {/* Logo */}
        <div className="w-[53px] h-[53px] mb-10 cursor-pointer hover:scale-110 transition-transform relative mx-auto">
             <img src="/images/sot.png" alt="Logo" className="w-full h-full object-contain" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-8 w-full">
          <NavItem icon={<Users size={24} />} active={activeTab === 'social'} onClick={() => setActiveTab('social')} />
          <NavItem icon={<ShoppingCart size={24} />} active={activeTab === 'store'} onClick={() => setActiveTab('store')} />
          <NavItem icon={<Newspaper size={24} />} active={activeTab === 'news'} onClick={() => setActiveTab('news')} />
          <NavItem icon={<Rocket size={24} />} active={activeTab === 'dev'} onClick={() => setActiveTab('dev')} />
        </nav>

        {/* Bottom Actions */}
        <div className="mt-auto">
          <button className="p-3 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-xl">
            <Settings size={24} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">

        {/* Window Controls - Absolute Top Right */}
        <div className="absolute top-0 right-0 z-50 flex">
           <button 
             onClick={handleMinimize}
             className="w-12 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
           >
             <Minus size={18} />
           </button>
           <button 
             onClick={handleClose}
             className="w-12 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-600 transition-colors rounded-tr-lg"
           >
             <X size={18} />
           </button>
        </div>

        {/* Top Navigation Bar */}
        <header 
          className="h-16 flex items-center justify-between px-8 relative z-20"
          onMouseDown={handleDrag}
        >
          {/* Left Menu */}
          <div 
            className="flex items-center gap-8 text-sm font-medium"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <TopNavLink label="游戏" active={activeTab === 'game'} onClick={() => setActiveTab('game')} />
            <TopNavLink label="插件/资源" active={activeTab === 'plugins'} onClick={() => setActiveTab('plugins')} />
          </div>

          {/* Right Status */}
          <div 
            className="flex items-center gap-6 pr-24" // Added padding-right to avoid window control overlap
            onMouseDown={(e) => e.stopPropagation()}
          >
            {isLoggedIn ? (
              /* Integrated Profile */
              <div className="relative group/profile py-2">
                 {/* Avatar (Trigger) */}
                 <div className="w-10 h-10 rounded-full overflow-hidden cursor-pointer shadow-lg transition-all hover:scale-105">
                    <img 
                       src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} 
                       className="w-full h-full object-cover bg-[#1a0b2e]" 
                       alt="Avatar" 
                    />
                 </div>
                 <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#1a0b2e] rounded-full flex items-center justify-center pointer-events-none">
                    <div className="w-2 h-2 bg-green-500 rounded-full border border-[#1a0b2e]"></div>
                 </div>

                 {/* Popup Menu (Hidden by default, block on group-hover) */}
                 <div className="absolute right-[115%] top-0 invisible opacity-0 group-hover/profile:visible group-hover/profile:opacity-100 transition-all duration-200 z-50">
                    {/* Arrow (Right side of menu) */}
                    <div className="absolute top-[20px] -translate-y-1/2 -right-[5px] w-2.5 h-2.5 bg-[#1a1a1a] border-t border-r border-white/10 rotate-45 z-10"></div>
                    
                    {/* Menu Body */}
                    <div className="w-52 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl p-3 flex flex-col gap-3 relative z-0">
                        {/* User Info */}
                        <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                            <div className="w-8 h-8 rounded-full bg-white/5 p-0.5">
                               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} className="w-full h-full rounded-full" alt="Avatar" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-sm text-gray-100">{username}</span>
                                <span className="text-[10px] text-green-400 flex items-center gap-1">
                                    <div className="w-1 h-1 rounded-full bg-green-500"></div> 在线
                                </span>
                            </div>
                        </div>

                        {/* Currencies */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center p-2 bg-black/40 rounded border border-white/5 hover:border-amber-500/20 transition-colors cursor-default">
                                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-medium">
                                     <img src="/images/currency-red.png" className="w-3 h-3 object-contain" alt="Points" />
                                     <span>时光碎片</span>
                                </div>
                                <span className="font-mono font-bold text-xs text-gray-200">{user ? user.points : '---'}</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-black/40 rounded border border-white/5 hover:border-emerald-500/20 transition-colors cursor-default">
                                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                                     <img src="/images/currency-green-large.png" className="w-3 h-3 object-contain" alt="VP" />
                                     <span>时光之尘</span>
                                </div>
                                <span className="font-mono font-bold text-xs text-gray-200">{user ? 0 : '---'}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-1">
                            <button 
                              onClick={(e) => {
                                  e.stopPropagation();
                                  localStorage.removeItem('auth_token');
                                  localStorage.removeItem('auth_username');
                                  setIsLoggedIn(false);
                                  setUser(null);
                                  setUsername('');
                              }}
                              className="w-full py-1.5 flex items-center justify-center gap-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors text-xs font-medium border border-transparent hover:border-white/5"
                            >
                                <LogOut size={14} /> 退出登录
                            </button>
                        </div>
                    </div>
                 </div>
              </div>
            ) : (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-1.5 text-amber-500 font-medium text-sm rounded-lg border border-amber-500/50 hover:bg-amber-500/10 hover:border-amber-500 transition-all active:scale-95"
              >
                登录
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto px-10 py-6 relative z-10 custom-scrollbar scroll-smooth">
          
          {renderContent()}
        </main>

        {/* Footer */}
        <footer className="h-20 border-t border-white/5 flex items-center px-8 z-30 gap-8 shrink-0">
          
          {/* Left Side: Progress Bar Area */}
          <div className="flex-1 flex items-center h-full">
            {(gameStatus === 'installing') && (
                <div className="w-[85%] flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className="flex-1 flex flex-col gap-1.5">
                        {/* Progress Track */}
                        <div className="h-3 bg-black/40 rounded-full overflow-hidden shadow-inner border border-white/5 relative">
                            {/* Progress Fill */}
                            <div 
                                className={`h-full relative transition-all duration-300 ease-out ${isPaused ? 'bg-gray-600' : 'bg-amber-600'}`}
                                style={{ width: `${progress}%` }}
                            >
                                {/* Shimmer Effect (only when not paused) */}
                                {!isPaused && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full animate-[shimmer_2s_infinite]"></div>}
                                {/* Shiny Tip */}
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_6px_2px_rgba(255,255,255,0.8)]"></div>
                            </div>
                        </div>
                        {/* Status Info */}
                        <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] text-gray-400 font-medium tracking-wide flex items-center gap-2">
                                {isPaused ? (
                                    <span className="text-amber-500/80">已暂停</span>
                                ) : (
                                    <>
                                        {/* Use Dynamic Status Message from Host */}
                                        <span>{statusMessage}</span>
                                    </>
                                )}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-amber-500/80">
                                <span>{isPaused ? '0 KB/s' : downloadSpeed}</span>
                                <span className="text-white/30">|</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Pause/Resume Button - Visual Only for now */}
                    <button 
                        onClick={togglePause}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-amber-500 border border-white/5 hover:border-amber-500/30 transition-all active:scale-95 shadow-lg"
                    >
                        {isPaused ? <Play size={14} className="ml-0.5" /> : <Pause size={14} />}
                    </button>
                </div>
            )}
          </div>

          {/* Right Side: Action Button */}
          <div className="relative">
            <div className="flex items-center group relative">
              {/* Main Action Button */}
              <button 
                className={`h-12 w-48 font-bold text-lg rounded-lg shadow-xl transition-all active:scale-95 flex items-center justify-center border ${getButtonConfig().className}`}
                onClick={handleGameAction}
                disabled={getButtonConfig().disabled}
              >
                 <span className="tracking-wide">
                    {getButtonConfig().text}
                 </span>
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
