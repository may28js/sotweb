import React from 'react';

const PluginsPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-300 space-y-4">
      <div className="p-4 rounded-full bg-white/5 border border-white/10">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="48" 
          height="48" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="text-amber-500"
        >
          <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
          <path d="M8.5 8.5v.01" />
          <path d="M16 12v.01" />
          <path d="M12 16v.01" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-white">插件与资源</h2>
      <p className="text-gray-400 max-w-md text-center">
        在此处管理您的游戏插件、AddOns 以及其他资源。
        <br />
        <span className="text-sm text-gray-500">(功能开发中)</span>
      </p>
    </div>
  );
};

export default PluginsPage;
