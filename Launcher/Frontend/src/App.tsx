import React, { useState, useEffect } from 'react';
import LoginPage from './LoginPage';
import { 
  Sword,
  Ghost, 
  Shield, 
  Settings,
  Minus, 
  X,
  FolderSearch,
  ChevronUp,
  ShoppingBag,
  History,
  Gem,
  Search,
  Check,
  Star,
  Play,
  Pause,
  TriangleAlert
} from 'lucide-react';

// Type for Game Status
type GameStatus = 'not_installed' | 'installing' | 'updating' | 'ready' | 'playing';

function App() {
  const [activeTab, setActiveTab] = useState('game');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [gameStatus, setGameStatus] = useState<GameStatus>('not_installed');
  const [progress, setProgress] = useState(0); // 0-100
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [installPath, setInstallPath] = useState<string | null>(null);
  const [downloadSpeed, setDownloadSpeed] = useState('0 KB/s');

  // IPC Handling
  useEffect(() => {
    // @ts-ignore
    if (window.chrome?.webview) {
        // @ts-ignore
        const messageHandler = (event: any) => {
            const message = event.data;
            if (message) {
                switch (message.type) {
                    case 'game_status':
                         // Reset progress on status change
                         if (message.payload.status !== 'installing' && message.payload.status !== 'updating') {
                             setProgress(0);
                         }
                         if (message.payload.path) setInstallPath(message.payload.path);

                         if (message.payload.status === 'ready') {
                             setGameStatus('ready');
                         } else if (message.payload.status === 'not_installed') {
                             setGameStatus('not_installed');
                         }
                         break;
                    case 'game_launched':
                        setGameStatus('playing');
                        setTimeout(() => setGameStatus('ready'), 5000);
                        break;
                    case 'download_progress':
                        setGameStatus('installing');
                        setProgress(message.payload.progress);
                        if (message.payload.speed) setDownloadSpeed(message.payload.speed);
                        break;
                    case 'download_complete':
                        setGameStatus('ready');
                        setProgress(100);
                        setIsPaused(false);
                        break;
                    case 'download_error':
                        console.error("Download Error:", message.payload);
                        setIsPaused(true);
                        break;
                    case 'error':
                        console.error("IPC Error:", message.payload);
                        break;
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
    }
  }, []);

  // Handle window dragging via Host
  const handleDrag = (e: React.MouseEvent) => {
    // Only drag on left click and if not clicking a button/interactive element
    if (e.button === 0) {
      // @ts-ignore
      if (window.chrome?.webview) {
        // @ts-ignore
        window.chrome.webview.postMessage({ type: 'drag' });
      }
    }
  };

  // Real function to trigger actions
   const handleGameAction = () => {
     // @ts-ignore
     if (window.chrome?.webview) {
         if (gameStatus === 'not_installed') {
           if (installPath) {
               // If path is set but not installed, start installation/download
               // Immediate feedback
               setGameStatus('installing');
               setProgress(0);
               
               // @ts-ignore
               window.chrome.webview.postMessage({ type: 'start_download' });
           } else {
               setShowInstallPrompt(true);
           }
        } else if (gameStatus === 'ready') {
             // @ts-ignore
             window.chrome.webview.postMessage({ type: 'launch_game' });
         }
     } else {
        // Browser Mock
        if (gameStatus === 'not_installed') {
            setShowInstallPrompt(true);
        } else if (gameStatus === 'ready') {
            setGameStatus('playing');
            setTimeout(() => setGameStatus('ready'), 3000); 
        }
    }
  };

  const togglePause = () => {
    if (isPaused) {
        // Resume
        // @ts-ignore
        if (window.chrome?.webview) window.chrome.webview.postMessage({ type: 'resume_download' });
        setIsPaused(false);
    } else {
        // Pause
        // @ts-ignore
        if (window.chrome?.webview) window.chrome.webview.postMessage({ type: 'pause_download' });
        setIsPaused(true);
    }
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

  const renderContent = () => {
    switch (activeTab) {
      case 'game':
        return <GamePage />;
      case 'social':
        return <SocialPage />;
      case 'store':
        return <StorePage />;
      case 'news':
        return <NewsPage />;
      case 'dev':
        return <DevPage />;
      default:
        return <GamePage />;
    }
  };

  if (!isLoggedIn) {
    return (
      <>
        {isLoading && (
            <div className="absolute inset-0 z-50 bg-[#0f0518] flex flex-col items-center justify-center">
                <div className="relative w-24 h-24 mb-8">
                    <div className="absolute inset-0 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-4 border-4 border-purple-500/30 border-b-purple-500 rounded-full animate-[spin_3s_linear_infinite_reverse]"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-amber-500 font-bold animate-pulse">
                        S
                    </div>
                </div>
                <div className="text-amber-500/50 font-mono tracking-[0.5em] text-sm animate-pulse">INITIALIZING</div>
            </div>
        )}
        <LoginPage onLogin={() => setIsLoggedIn(true)} onDrag={handleDrag} />
      </>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0f0518] text-white font-sans select-none border border-white/5 rounded-lg relative">
      
      {/* Loading Overlay - Only if still loading AND logged in (which shouldn't happen with current logic, but safe to keep or remove) */}
      {/* Actually we want to remove it to prevent the blocking issue */}

      {/* Sidebar */}
      <aside className="w-[70px] flex flex-col items-center py-6 bg-black/20 border-r border-white/5 z-20 backdrop-blur-sm">
        {/* Logo */}
        <div className="w-14 h-14 mb-10 cursor-pointer hover:scale-110 transition-transform group relative">
             <img src="/images/icons2-.png" alt="Logo" className="w-full h-full object-contain absolute inset-0 transition-opacity duration-300 group-hover:opacity-0" />
             <img src="/images/icons1.png" alt="Logo Hover" className="w-full h-full object-contain absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-8 w-full">
          <NavItem icon={<Sword size={24} />} active={activeTab === 'game'} onClick={() => setActiveTab('game')} />
          <NavItem icon={<Ghost size={24} />} active={activeTab === 'social'} onClick={() => setActiveTab('social')} />
          <NavItem icon={<ShoppingBag size={24} />} active={activeTab === 'store'} onClick={() => setActiveTab('store')} />
          <NavItem icon={<Shield size={24} />} active={activeTab === 'news'} onClick={() => setActiveTab('news')} />
        </nav>

        {/* Bottom Actions */}
        <div className="mt-auto">
          <button className="p-3 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-xl">
            <Settings size={24} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative bg-[#0f0518]">
        {/* Background Image */}
        <div className="absolute inset-0 z-0 pointer-events-none">
           <img src="/images/bg.jpg" className="w-full h-full object-cover" alt="Background" />
           {/* Overlay to ensure text readability */}
           <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
           <div className="absolute inset-0 bg-gradient-to-t from-[#0f0518] via-transparent to-transparent"></div>
        </div>

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
            <TopNavLink label="社交" active={activeTab === 'social'} onClick={() => setActiveTab('social')} />
            <TopNavLink label="商城" active={activeTab === 'store'} onClick={() => setActiveTab('store')} />
            <TopNavLink label="资讯" active={activeTab === 'news'} onClick={() => setActiveTab('news')} />
            <TopNavLink label="开发计划" active={activeTab === 'dev'} onClick={() => setActiveTab('dev')} />
          </div>

          {/* Right Status */}
          <div 
            className="flex items-center gap-6 pr-24" // Added padding-right to avoid window control overlap
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Integrated Profile */}
            <div className="flex items-center gap-4 group cursor-pointer">
              
              {/* Info Column (Name + Currency) */}
              <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                     <span className="text-base font-bold text-gray-200 group-hover:text-amber-400 transition-colors">TimeWalker</span>
                     <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_5px_#22c55e]"></div>
                  </div>
                  
                  {/* Compact Currency */}
                  <div className="flex items-center gap-3 text-xs bg-black/40 px-2 py-0.5 rounded border border-white/5">
                     <div className="flex items-center gap-1 text-emerald-400">
                        <Gem size={10} className="fill-emerald-400/20" /> 6
                     </div>
                     <div className="w-px h-2 bg-white/10"></div>
                     <div className="flex items-center gap-1 text-amber-400">
                        <Gem size={10} className="fill-amber-400/20" /> 1,199
                     </div>
                  </div>
              </div>

              {/* Large Avatar */}
              <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-b from-amber-500 to-amber-700 shadow-[0_0_15px_rgba(245,158,11,0.3)] group-hover:scale-105 transition-transform relative z-10">
                 <img 
                   src="https://api.dicebear.com/7.x/avataaars/svg?seed=TimeWalker" 
                   alt="User" 
                   className="w-full h-full rounded-full bg-[#1a0b2e]" 
                 />
              </div>

            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto px-10 py-6 relative z-10 custom-scrollbar scroll-smooth">
          
          {renderContent()}
          
          {/* Spacer for bottom bar */}
          <div className="h-40"></div>
        </main>

        {/* Bottom Action Bar */}
        <footer className="h-20 bg-[#0a0310]/90 backdrop-blur-md border-t border-white/5 absolute bottom-0 left-0 right-0 flex items-center px-8 z-30 gap-8">
          
          {/* Left Side: Progress Bar Area */}
          <div className="flex-1 flex items-center h-full">
            {(gameStatus === 'installing' || gameStatus === 'updating') && (
                <div className="w-[85%] flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className="flex-1 flex flex-col gap-1.5">
                        {/* Progress Track */}
                        <div className="h-2 bg-black/40 rounded-full overflow-hidden shadow-inner border border-white/5 relative">
                            {/* Progress Fill */}
                            <div 
                                className={`h-full relative transition-all duration-300 ease-out ${isPaused ? 'bg-gray-600' : 'bg-amber-600'}`}
                                style={{ width: `${progress}%` }}
                            >
                                {/* Shimmer Effect (only when not paused) */}
                                {!isPaused && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full animate-[shimmer_2s_infinite]"></div>}
                                {/* Glowing Tip */}
                                <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/30 blur-[2px] shadow-[0_0_8px_rgba(255,255,255,0.5)]"></div>
                            </div>
                        </div>
                        {/* Status Info */}
                        <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] text-gray-400 font-medium tracking-wide flex items-center gap-2">
                                {isPaused ? (
                                    <span className="text-amber-500/80">已暂停</span>
                                ) : (
                                    <>
                                        <span>{gameStatus === 'installing' ? '正在下载游戏客户端...' : '正在校验游戏补丁...'}</span>
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
                    
                    {/* Pause/Resume Button */}
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
             {/* Install Prompt Bubble */}
             {showInstallPrompt && (
                <div className="absolute bottom-full right-0 mb-4 w-96 bg-[#1a1120] border border-amber-500/30 rounded-xl p-4 shadow-2xl shadow-black/50 animate-in slide-in-from-bottom-2 fade-in duration-300 z-50">
                    <div className="absolute -bottom-2 right-12 w-4 h-4 bg-[#1a1120] border-b border-r border-amber-500/30 transform rotate-45"></div>
                    <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                            <FolderSearch size={20} />
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">
                            如果您的电脑上已经有客户端，那么选择“是”，在您定位客户端路径后将使用已有的游戏。 选择“否”则通过网络下载游戏客户端，这将会花一些时间。
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => {
                                setShowInstallPrompt(false);
                                // @ts-ignore
                                if (window.chrome?.webview) window.chrome.webview.postMessage({ type: 'select_install_path' });
                            }}
                            className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium py-1.5 rounded transition-colors"
                        >
                            是
                        </button>
                        <button 
                            onClick={() => {
                                setShowInstallPrompt(false);
                                // @ts-ignore
                                if (window.chrome?.webview) window.chrome.webview.postMessage({ type: 'install_game' });
                                
                                // Update UI immediately to avoid "Start Install" appearing
                                setGameStatus('installing');
                                setProgress(0);
                            }}
                            className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm font-medium py-1.5 rounded transition-colors"
                        >
                            否
                        </button>
                    </div>
                </div>
             )}

            <div className="flex items-center group relative">
              {/* Main Action Button */}
              <button 
                className={`h-12 w-48 font-bold text-lg rounded-lg shadow-xl transition-all active:scale-95 flex items-center justify-center border ${
                  gameStatus === 'ready' || gameStatus === 'playing' 
                    ? 'bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 border-amber-400/50 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                    : 'bg-gradient-to-b from-[#2d1b4e] to-[#1a0b2e] hover:from-[#3d2b5e] hover:to-[#2a1b3e] border-white/10 text-gray-200 shadow-lg shadow-purple-900/30'
                }`}
                onClick={handleGameAction}
                disabled={gameStatus === 'installing' || gameStatus === 'updating'}
              >
                 <span className="tracking-wide">
                    {gameStatus === 'not_installed' && !installPath && '安装游戏'}
                    {gameStatus === 'not_installed' && installPath && '开始安装'}
                    {gameStatus === 'installing' && '安装中...'}
                    {gameStatus === 'updating' && '更新中...'}
                    {gameStatus === 'ready' && '开始游戏'}
                    {gameStatus === 'playing' && '游戏中'}
                 </span>
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

// --- Sub Components ---

const NavItem = ({ icon, active, onClick }: { icon: React.ReactNode, active?: boolean, onClick?: () => void }) => (
  <div 
    className={`relative w-full flex justify-center cursor-pointer group`}
    onClick={onClick}
  >
    {active && (
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-r shadow-[0_0_10px_#f59e0b]"></div>
    )}
    <div className={`p-3 rounded-xl transition-all duration-300 ${active ? 'text-amber-500 bg-amber-500/10' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
      {icon}
    </div>
  </div>
);

const TopNavLink = ({ label, active, onClick }: { label: string, active?: boolean, onClick?: () => void }) => (
  <div 
    className="relative cursor-pointer h-16 flex items-center group"
    onClick={onClick}
  >
    <span className={`transition-colors ${active ? 'text-amber-400 font-bold' : 'text-gray-400 group-hover:text-gray-200'}`}>
      {label}
    </span>
    {active && (
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 shadow-[0_-2px_8px_rgba(245,158,11,0.5)]"></div>
    )}
  </div>
);

const PatchNote = ({ version, date, content, highlight }: { version: string, date: string, content: string, highlight?: boolean }) => (
  <div className={`p-3 rounded-lg border cursor-default transition-colors ${highlight ? 'bg-indigo-900/20 border-indigo-500/30 hover:bg-indigo-900/30' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
    <div className="flex justify-between items-center mb-1">
       <span className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-indigo-300 font-mono">{version}</span>
       <span className="text-xs text-gray-500">{date}</span>
    </div>
    <p className={`text-xs leading-relaxed ${highlight ? 'text-gray-200' : 'text-gray-400'}`}>
       {highlight && <span className="w-1.5 h-1.5 inline-block rounded-full bg-red-500 mr-1.5"></span>}
       {content}
    </p>
  </div>
);

const NewsCard = ({ tag, title, desc, image }: { tag: string, title: string, desc: string, image: string }) => (
  <div className="bg-black/40 rounded-xl overflow-hidden border border-white/5 hover:border-white/20 transition-all group flex flex-col h-full cursor-pointer hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1">
     <div className="h-32 overflow-hidden relative">
        <img src={image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
        <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/60 backdrop-blur rounded text-xs text-amber-400 font-bold border border-amber-500/20">
          🏷️ {tag}
        </div>
     </div>
     <div className="p-4 flex-1 flex flex-col">
        <h4 className="font-bold text-gray-100 mb-2 group-hover:text-amber-400 transition-colors line-clamp-1">{title}</h4>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{desc}</p>
        <div className="mt-auto pt-3 text-[10px] text-gray-600">2024-12-10</div>
     </div>
  </div>
);

// --- Store Components ---

const ShopFilter = ({ label, options }: { label: string, options: string[] }) => (
  <div className="flex items-center gap-2">
    <span className="text-gray-400 text-sm">{label}:</span>
    <div className="relative group">
       <select className="appearance-none bg-black/40 text-gray-200 text-sm pl-3 pr-8 py-1.5 rounded border border-white/10 hover:border-amber-500/50 focus:border-amber-500 outline-none cursor-pointer transition-colors">
          {options.map(opt => <option key={opt}>{opt}</option>)}
       </select>
       <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
         <ChevronUp size={12} className="rotate-180" />
       </div>
    </div>
  </div>
);

interface ShopItem {
  id: string;
  title: string;
  desc: string;
  price: number;
  originalPrice?: number;
  currency: 'gem' | 'vote';
  image: string;
  tags: string[];
  discount?: number;
  featured?: boolean;
}

const ShopCard = ({ item }: { item: ShopItem }) => (
  <div className="bg-[#150a20] rounded-xl overflow-hidden border border-white/5 hover:border-amber-500/30 transition-all group flex flex-col h-full hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] hover:-translate-y-1 relative">
      {/* Featured Badge */}
      {item.featured && (
        <div className="absolute top-0 right-0 z-10">
           <div className="bg-amber-500 text-black text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1 shadow-lg">
              <Star size={10} className="fill-black" /> FEATURED
           </div>
        </div>
      )}
      
      {/* Discount Badge */}
      {item.discount && (
        <div className="absolute top-3 left-3 z-10">
           <div className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded shadow-lg">
              -{item.discount}%
           </div>
        </div>
      )}

      {/* Image Area */}
      <div className="h-40 overflow-hidden relative bg-black/20 p-4 flex items-center justify-center group-hover:bg-black/30 transition-colors">
         <img src={item.image} alt={item.title} className="max-w-full max-h-full object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-500" />
         
         {/* Overlay Gradient */}
         <div className="absolute inset-0 bg-gradient-to-t from-[#150a20] to-transparent opacity-80"></div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col relative -mt-6">
         <h3 className="font-bold text-lg text-gray-100 mb-1 group-hover:text-amber-400 transition-colors">{item.title}</h3>
         <p className="text-xs text-gray-500 mb-3 line-clamp-2">{item.desc}</p>
         
         {/* Tags */}
         <div className="flex flex-wrap gap-1.5 mb-4">
            {item.tags.map(tag => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">
                {tag}
              </span>
            ))}
         </div>

         {/* Price & Action */}
         <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
             <div className="flex items-end gap-2">
                {item.originalPrice && (
                  <span className="text-xs text-gray-500 line-through mb-0.5">{item.originalPrice}</span>
                )}
                <div className={`flex items-center gap-1 font-bold text-lg ${item.currency === 'gem' ? 'text-amber-400' : 'text-emerald-400'}`}>
                   {item.price.toLocaleString()}
                   {item.currency === 'gem' ? <Gem size={16} className="fill-amber-400/20" /> : <Gem size={16} className="fill-emerald-400/20" />}
                </div>
             </div>

             <button className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center shadow-lg shadow-amber-900/40 active:scale-90 transition-all group/btn" title="加入购物车">
                <ShoppingBag size={18} className="group-hover/btn:animate-bounce" />
             </button>
         </div>
      </div>
  </div>
);

// --- Page Components ---

const GamePage = () => (
  <>
    {/* Hero Section - Notification Bar */}
    <div className="mb-8 flex h-10 w-full rounded overflow-hidden shadow-lg cursor-pointer group hover:scale-[1.01] transition-transform">
       {/* Left Icon Area - Yellow */}
       <div className="bg-amber-500 w-10 flex items-center justify-center text-black shrink-0">
          <TriangleAlert size={18} className="animate-pulse" />
       </div>
       
       {/* Right Content Area - White/Light Gray */}
       <div className="flex-1 bg-gray-200 flex items-center px-4 relative overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-300"></div>
          
          <div className="relative z-10 flex items-center w-full gap-3">
             <span className="text-amber-700 font-bold text-sm">[重要]</span>
             <p className="text-gray-800 text-sm font-medium truncate flex-1">
                2025年6月25日起战网通行证登录入口将分阶段逐步关闭，主要登录方式切换为网易账号。
             </p>
             <span className="text-gray-500 text-xs group-hover:text-amber-600 transition-colors">点击查看详情 &gt;</span>
          </div>
       </div>
    </div>

    {/* Featured Banner */}
    <div className="w-full h-[320px] rounded-xl overflow-hidden relative group border border-white/10 shadow-2xl cursor-pointer">
      <img 
        src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop" 
        alt="Winter Veil" 
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f0518] via-[#0f0518]/50 to-transparent"></div>
      
      <div className="absolute bottom-0 left-0 p-8 w-2/3">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-2 py-0.5 bg-amber-600 text-white text-xs font-bold rounded shadow-lg shadow-amber-900/50">活动</span>
            <span className="text-gray-300 text-sm flex items-center gap-1">
              <span className="opacity-60">📅</span> 2024-12-15
            </span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors drop-shadow-md">
            时光回溯：冬幕节的起源
          </h2>
          <p className="text-gray-300 leading-relaxed line-clamp-2 text-sm drop-shadow-sm">
            克罗米发现了一个时间裂隙，冬幕节的庆祝活动似乎发生了一些奇妙的变化。在铁炉堡和奥格瑞玛寻找时间守护者领取特殊任务，赢取绝版坐骑。
          </p>
      </div>
    </div>

    {/* Info Grid */}
    <div className="grid grid-cols-12 gap-6 mt-8">
      {/* Server Status / Patch Notes */}
      <div className="col-span-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/5 p-5 hover:border-white/10 transition-colors hover:bg-white/10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="flex items-center gap-2 font-bold text-amber-400">
              <span className="text-amber-500">⚡</span> 服务器动态
            </h3>
            <a href="#" className="text-xs text-gray-500 hover:text-white transition-colors">查看全部 &gt;</a>
          </div>
          
          <div className="space-y-4">
            <PatchNote 
              version="Ver 3.3.5a.12" 
              date="12-14"
              content="修复了[时光之穴]斯坦索姆副本中阿尔萨斯有时会卡住的BUG。"
              highlight
            />
            <PatchNote 
              version="Ver 3.3.5a.11" 
              date="12-12"
              content="调整了奥杜尔[米米尔隆]困难模式的伤害数值，使其更符合当前版本装等。"
            />
            <PatchNote 
              version="Ver 3.3.5a.10" 
              date="12-09"
              content="为了保持阵营平衡，暂时开启免费转阵营服务。"
            />
          </div>
      </div>

      {/* News Cards */}
      <div className="col-span-8 flex flex-col">
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="font-bold text-gray-200">更多资讯</h3>
          </div>
          <div className="grid grid-cols-2 gap-6 flex-1">
            <NewsCard 
              tag="新闻"
              title="PVP 第8赛季：愤怒的角斗士"
              desc="竞技场第8赛季即将结算。请各位角斗士做好准备，龙类坐骑和称号将在1月5日发放。"
              image="https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2671&auto=format&fit=crop"
            />
            <NewsCard 
              tag="社区"
              title="社区精选：最美幻化大赛"
              desc="本月的主题是“时光漫游者”。展示你最复古的装备搭配，赢取海量积分奖励。"
              image="https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?q=80&w=2670&auto=format&fit=crop"
            />
          </div>
      </div>
    </div>
  </>
);

const SocialPage = () => (
  <div className="flex flex-col items-center justify-center h-[500px] text-gray-400">
    <Ghost size={64} className="mb-4 opacity-50" />
    <h2 className="text-2xl font-bold mb-2">社交中心</h2>
    <p>正在开发中... 这里将显示好友列表和公会聊天。</p>
  </div>
);

const StorePage = () => {
  // Mock Data
  const shopItems: ShopItem[] = [
    {
      id: '1',
      title: "奥之灰烬",
      desc: "解锁这只传奇的飞行坐骑，在天空中留下火焰的轨迹。",
      price: 50,
      originalPrice: 100,
      currency: 'gem',
      image: "https://wow.zamimg.com/uploads/screenshots/normal/68427-ashes-of-alar.jpg",
      tags: ['坐骑', '全服通用'],
      discount: 50,
      featured: true
    },
    {
      id: '2',
      title: "阵营转换服务",
      desc: "改变你的角色阵营（联盟/部落）。包含一次免费的种族变更。",
      price: 1000,
      originalPrice: 1176,
      currency: 'vote',
      image: "https://bnetcmsus-a.akamaihd.net/cms/blog_header/2g/2G40356549211624992563.jpg",
      tags: ['角色服务', '全服通用'],
      discount: 15,
      featured: true
    },
    {
      id: '3',
      title: "10,000 金币",
      desc: "立即获得 10,000 金币。仅限选定的服务器和角色。",
      price: 250,
      currency: 'gem',
      image: "https://wow.zamimg.com/uploads/screenshots/normal/872410-pile-of-gold.jpg",
      tags: ['货币', '单角色'],
    },
    {
      id: '4',
      title: "直升 80 级",
      desc: "将你的角色等级立即提升至 80 级。赠送全套 200 装等装备。",
      price: 5000,
      currency: 'vote',
      image: "https://bnetcmsus-a.akamaihd.net/cms/blog_header/x8/X8J3M07954931666133285.jpg",
      tags: ['角色服务', 'WLK 专区'],
    },
    {
      id: '5',
      title: "无敌的缰绳",
      desc: "阿尔萨斯·米奈希尔的传奇坐骑。",
      price: 300,
      currency: 'gem',
      image: "https://wow.zamimg.com/uploads/screenshots/normal/169992-invincibles-reins.jpg",
      tags: ['坐骑', '稀有'],
    },
    {
      id: '6',
      title: "幻化：大元帅",
      desc: "解锁大元帅/高阶督军的经典PVP外观幻化权限。",
      price: 1500,
      currency: 'vote',
      image: "https://wow.zamimg.com/uploads/screenshots/normal/75945-grand-marshals-claymore.jpg",
      tags: ['幻化', '账号共享'],
    }
  ];

  return (
    <div className="flex flex-col min-h-full animate-in fade-in duration-500">
      {/* Store Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
           <h2 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
             <ShoppingBag size={32} className="text-amber-500" />
             游戏商城
           </h2>
           <p className="text-gray-400 text-sm">选购坐骑、宠物、服务以及更多精彩内容</p>
        </div>
        
        <div className="flex items-center gap-3">
           <button className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-bold rounded shadow-lg shadow-amber-900/40 active:scale-95 transition-all flex items-center gap-2">
              <Gem size={18} />
              充值水晶
           </button>
           <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-gray-300 hover:text-white transition-colors flex items-center gap-2">
              <History size={18} />
              购买记录
           </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#150a20] p-4 rounded-xl border border-white/5 mb-6 flex flex-wrap gap-6 items-center">
         <ShopFilter label="服务器" options={['所有服务器', '冰冠冰川', '洛丹伦', '黑石山']} />
         <ShopFilter label="分类" options={['所有商品', '坐骑 & 宠物', '角色服务', '道具 & 货币', '幻化外观']} />
         
         <div className="w-px h-6 bg-white/10 mx-2"></div>
         
         <label className="flex items-center gap-2 cursor-pointer group">
            <div className="w-4 h-4 rounded border border-white/20 bg-black/40 flex items-center justify-center group-hover:border-amber-500 transition-colors">
               <Check size={10} className="text-amber-500" />
            </div>
            <span className="text-sm text-gray-400 group-hover:text-gray-200">仅显示优惠</span>
         </label>

         <div className="ml-auto relative">
            <input 
              type="text" 
              placeholder="搜索商品..." 
              className="bg-black/40 border border-white/10 rounded-full pl-10 pr-4 py-1.5 text-sm text-gray-200 outline-none focus:border-amber-500/50 transition-colors w-64"
            />
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
         </div>
      </div>

      {/* Shop Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
         {shopItems.map(item => (
           <ShopCard key={item.id} item={item} />
         ))}
      </div>
    </div>
  );
};

const NewsPage = () => (
  <div className="flex flex-col items-center justify-center h-[500px] text-gray-400">
    <Shield size={64} className="mb-4 opacity-50" />
    <h2 className="text-2xl font-bold mb-2">新闻资讯</h2>
    <p>正在开发中... 这里将显示所有历史公告和更新日志。</p>
  </div>
);

const DevPage = () => (
  <div className="flex flex-col items-center justify-center h-[500px] text-gray-400">
    <Settings size={64} className="mb-4 opacity-50" />
    <h2 className="text-2xl font-bold mb-2">开发计划</h2>
    <p>正在开发中... 查看服务器未来的更新路线图。</p>
  </div>
);

export default App;
