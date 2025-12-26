import React, { useState, useEffect } from 'react';
import { GameState, DownloadProgress } from '../types';
import { TOTAL_GAME_SIZE_MB } from '../constants';
import { Play, Pause, Download, Settings, FolderSearch, RefreshCw } from 'lucide-react';
import { simulateDownloadTick } from '../services/mockService';

const ActionPanel: React.FC = () => {
  // Initial state is checking files (simulating startup scan)
  const [gameState, setGameState] = useState<GameState>(GameState.CHECKING_FILES);
  
  const [progress, setProgress] = useState<DownloadProgress>({
    taskName: '初始化...',
    totalSize: 0,
    downloaded: 0,
    speed: 0,
    percentage: 0,
    peers: 0
  });

  // Listen for messages from C# (e.g., Progress Updates, Game State Changes)
  useEffect(() => {
    // Define a global function for C# to call
    (window as any).updateLauncherState = (newState: GameState, newProgress?: DownloadProgress) => {
        if (newState) setGameState(newState);
        if (newProgress) setProgress(newProgress);
    };

    // Initial check signal to C#
    if (window.chrome?.webview) {
        window.chrome.webview.postMessage({ type: 'APP_MOUNTED' });
    } else {
        // Fallback: If not in C#, use simulation
        setTimeout(() => {
             setGameState(GameState.NOT_INSTALLED); 
        }, 2000);
    }

    return () => {
        delete (window as any).updateLauncherState;
    };
  }, []);

  // Effect: Simulation Loop (ONLY runs if NOT in C# environment)
  useEffect(() => {
    if (window.chrome?.webview) return; // Disable simulation if real backend exists

    let interval: any;
    if (gameState === GameState.DOWNLOADING_CLIENT || gameState === GameState.DOWNLOADING_PATCHES) {
      interval = setInterval(() => {
        setProgress(prev => {
          const isP2P = gameState === GameState.DOWNLOADING_CLIENT;
          const next = simulateDownloadTick(prev, isP2P);
          if (next.percentage >= 100) {
            if (gameState === GameState.DOWNLOADING_CLIENT) {
                setGameState(GameState.DOWNLOADING_PATCHES);
                return { ...next, percentage: 0, taskName: '检查服务器更新...', totalSize: 500 };
            }
            if (gameState === GameState.DOWNLOADING_PATCHES) {
                setGameState(GameState.READY);
                return { ...next, percentage: 100 };
            }
          }
          return next;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  const sendCommand = (command: string, payload?: any) => {
      if (window.chrome?.webview) {
          window.chrome.webview.postMessage({ type: command, payload });
      } else {
          console.log(`[Dev] Command: ${command}`, payload);
          // Simulation logic
          if (command === 'START_DOWNLOAD') {
            setGameState(GameState.DOWNLOADING_CLIENT);
             setProgress({
                taskName: '下载游戏客户端 (3.3.5a)',
                totalSize: TOTAL_GAME_SIZE_MB,
                downloaded: 0,
                speed: 0,
                percentage: 0,
                peers: 0
            });
          }
          if (command === 'LAUNCH_GAME') alert("启动 Wow.exe");
          if (command === 'LOCATE_GAME') setGameState(GameState.DOWNLOADING_PATCHES);
      }
  };

  const handleMainAction = () => {
    switch (gameState) {
        case GameState.NOT_INSTALLED:
            sendCommand('START_DOWNLOAD');
            break;
        case GameState.DOWNLOADING_CLIENT:
        case GameState.DOWNLOADING_PATCHES:
            sendCommand('PAUSE_DOWNLOAD');
            setGameState(GameState.PAUSED);
            break;
        case GameState.PAUSED:
            sendCommand('RESUME_DOWNLOAD');
            // Simplified logic for demo recovery
            if (progress.totalSize > 1000) setGameState(GameState.DOWNLOADING_CLIENT);
            else setGameState(GameState.DOWNLOADING_PATCHES);
            break;
        case GameState.READY:
            sendCommand('LAUNCH_GAME');
            break;
        default:
            break;
    }
  };

  const handleLocateGame = () => {
      sendCommand('LOCATE_GAME');
  };

  const getButtonContent = () => {
    switch (gameState) {
      case GameState.CHECKING_FILES:
          return <><RefreshCw className="animate-spin" size={24} /> <span>检测文件中...</span></>;
      case GameState.NOT_INSTALLED: 
          return <><Download size={24} /> <span>下载客户端</span></>;
      case GameState.DOWNLOADING_CLIENT: 
          return <><Pause fill="currentColor" size={24} /> <span>暂停下载</span></>;
      case GameState.DOWNLOADING_PATCHES:
          return <><Pause fill="currentColor" size={24} /> <span>暂停更新</span></>;
      case GameState.PAUSED: 
          return <><Play fill="currentColor" size={24} /> <span>继续</span></>;
      case GameState.READY: 
          return <><Play fill="currentColor" size={24} className="text-cyan-100" /> <span className="text-cyan-50 drop-shadow-md">进入游戏</span></>;
      default: 
          return <span>请稍候</span>;
    }
  };

  const getButtonStyle = () => {
    const baseStyle = "h-16 px-12 rounded-full text-xl font-bold uppercase tracking-widest shadow-lg transition-all transform active:scale-95 flex items-center gap-3 border backdrop-blur-sm min-w-[200px] justify-center";
    if (gameState === GameState.READY) {
        return `${baseStyle} bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:via-blue-500 hover:to-purple-500 border-cyan-400/50 text-white shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)]`;
    } else if (gameState === GameState.CHECKING_FILES) {
        return `${baseStyle} bg-[#161026] text-slate-500 border-slate-700 cursor-wait`;
    } else {
        return `${baseStyle} bg-[#1e1b2e] hover:bg-[#2d2842] border-purple-800 text-purple-200 shadow-purple-900/20`;
    }
  };

  return (
    <div className="h-24 bg-transparent flex items-center px-8 justify-end relative z-30 pointer-events-none">
      <div className="flex items-center gap-6 w-full justify-end pointer-events-auto">
        
        {/* Progress Display */}
        {(gameState === GameState.DOWNLOADING_CLIENT || gameState === GameState.DOWNLOADING_PATCHES || gameState === GameState.PAUSED) && (
            <div className="flex flex-col w-full max-w-[320px] gap-2">
                <div className="flex justify-between text-xs font-bold text-slate-400">
                    <span className="text-cyan-300">{gameState === GameState.PAUSED ? '已暂停' : progress.taskName}</span>
                    <span className="flex items-center gap-2">
                        {gameState === GameState.DOWNLOADING_CLIENT && progress.peers !== undefined && (
                            <span className="text-purple-400 font-normal">P2P连接: {progress.peers}</span>
                        )}
                        <span>{progress.speed.toFixed(1)} MB/s</span>
                    </span>
                </div>
                <div className="w-full h-4 bg-[#0f0518]/80 rounded-full overflow-hidden border border-purple-900/50 shadow-inner backdrop-blur-md">
                    <div 
                        className={`h-full transition-all duration-300 relative ${gameState === GameState.PAUSED ? 'bg-amber-700' : 'bg-gradient-to-r from-purple-800 to-cyan-500'}`} 
                        style={{ width: `${progress.percentage}%` }}
                    >
                        {gameState !== GameState.PAUSED && (
                             <div className="absolute inset-0 bg-white/10 animate-[pulse_2s_infinite]"></div>
                        )}
                    </div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 bg-black/40 px-2 py-0.5 rounded-full">
                    <span>剩余: {progress.speed > 0 ? Math.ceil((progress.totalSize - progress.downloaded) / progress.speed / 60) : '--'} 分钟</span>
                    <span>{(progress.downloaded / 1024).toFixed(2)}GB / {(progress.totalSize / 1024).toFixed(2)}GB</span>
                </div>
            </div>
        )}

        <button className="p-3 rounded-full bg-[#161026]/80 text-purple-400 hover:text-white hover:bg-purple-800/40 transition-colors border border-purple-500/30 backdrop-blur-md">
             <Settings size={22} />
        </button>

        {gameState === GameState.NOT_INSTALLED && (
            <button 
                onClick={handleLocateGame}
                className="text-sm text-slate-400 hover:text-amber-400 underline underline-offset-4 decoration-slate-600 hover:decoration-amber-400 transition-all flex items-center gap-1"
            >
                <FolderSearch size={14} />
                <span>定位已安装游戏</span>
            </button>
        )}

        <button 
          onClick={handleMainAction}
          disabled={gameState === GameState.CHECKING_FILES}
          className={getButtonStyle()}
        >
          {getButtonContent()}
        </button>
      </div>
    </div>
  );
};

export default ActionPanel;