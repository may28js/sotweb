'use client';

import { Save } from 'lucide-react';

export default function AdminSettings() {
  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">游戏设置</h1>
        <button className="flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-md transition-colors">
          <Save className="size-4 mr-2" />
          保存更改
        </button>
      </div>

      <div className="space-y-6">
        {/* SOAP Settings */}
        <div className="bg-[#1a1a1a] rounded-lg border border-white/5 p-6">
          <h2 className="text-lg font-medium text-white mb-4">SOAP 配置</h2>
          <p className="text-sm text-gray-500 mb-6">配置连接到魔兽世界服务器远程控制台的参数。</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">SOAP 主机 (Host)</label>
              <input 
                type="text" 
                defaultValue="127.0.0.1"
                className="w-full bg-[#111] border border-white/10 rounded-md py-2 px-3 text-sm text-white focus:outline-none focus:border-yellow-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">SOAP 端口 (Port)</label>
              <input 
                type="number" 
                defaultValue="7878"
                className="w-full bg-[#111] border border-white/10 rounded-md py-2 px-3 text-sm text-white focus:outline-none focus:border-yellow-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">GM 用户名</label>
              <input 
                type="text" 
                placeholder="Admin"
                className="w-full bg-[#111] border border-white/10 rounded-md py-2 px-3 text-sm text-white focus:outline-none focus:border-yellow-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">GM 密码</label>
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full bg-[#111] border border-white/10 rounded-md py-2 px-3 text-sm text-white focus:outline-none focus:border-yellow-500/50"
              />
            </div>
          </div>
        </div>

        {/* Game Database Settings */}
        <div className="bg-[#1a1a1a] rounded-lg border border-white/5 p-6">
          <h2 className="text-lg font-medium text-white mb-4">数据库配置</h2>
          <p className="text-sm text-gray-500 mb-6">数据库连接字符串目前由服务端的 <code className="text-yellow-500">appsettings.json</code> 管理。</p>
          
          <div className="space-y-4">
             <div className="flex items-center justify-between p-3 bg-white/5 rounded-md">
                <span className="text-sm text-gray-300">账号数据库 (Auth)</span>
                <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400">已连接</span>
             </div>
             <div className="flex items-center justify-between p-3 bg-white/5 rounded-md">
                <span className="text-sm text-gray-300">角色数据库 (Characters)</span>
                <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400">已连接</span>
             </div>
             <div className="flex items-center justify-between p-3 bg-white/5 rounded-md">
                <span className="text-sm text-gray-300">世界数据库 (World)</span>
                <span className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400">未连接</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
