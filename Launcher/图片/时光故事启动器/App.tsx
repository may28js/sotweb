
import React, { useState, useEffect } from 'react';
import LauncherApp from './launcher/LauncherApp';
import WebsiteApp from './website/WebsiteApp';
import AdminDashboard from './website/AdminDashboard';

const App: React.FC = () => {
  // 生产环境路由逻辑
  const getInitialMode = () => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    const path = window.location.pathname;
    
    // 1. 明确的管理后台访问路径
    if (modeParam === 'admin' || path.startsWith('/admin')) return 'admin';
    
    // 2. 检查宿主环境（C# WebView2 标志）
    const isLauncherHost = !!(window.chrome && window.chrome.webview);
    if (isLauncherHost || modeParam === 'launcher') return 'launcher';

    // 3. 默认情况下（普通玩家浏览器打开）显示官网
    return 'website';
  };

  const [viewMode] = useState<'launcher' | 'website' | 'admin'>(getInitialMode());

  return (
    <div className="w-full h-full">
      {viewMode === 'admin' ? (
        <AdminDashboard />
      ) : viewMode === 'website' ? (
        <WebsiteApp />
      ) : (
        <LauncherApp />
      )}
      
      {/* 仅针对官网模式允许页面滚动 */}
      <style>{`
        body { 
          margin: 0;
          overflow: ${viewMode === 'website' ? 'auto' : 'hidden'} !important;
          background-color: #050308;
        }
      `}</style>
    </div>
  );
};

export default App;
