'use client';

import { useState, useEffect } from 'react';
import { Save, Server, Database, Terminal, Loader2, CheckCircle2, AlertCircle, Command } from 'lucide-react';
import { getGameServerSettings, updateGameServerSettings, GameServerSettings } from '@/services/settingsService';

export default function GameSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [settings, setSettings] = useState<GameServerSettings>({
    host: '127.0.0.1',
    port: 3306,
    username: 'acore',
    password: '',
    authDatabase: 'acore_auth',
    charactersDatabase: 'acore_characters',
    soapHost: '127.0.0.1',
    soapPort: 7878,
    soapUsername: '',
    soapPassword: '',
    sshHost: '',
    sshPort: 22,
    sshUsername: 'root',
    sshPassword: '',
    worldServiceName: 'acore-worldserver',
    authServiceName: 'acore-authserver'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await getGameServerSettings();
      // Ensure we have default values if some fields are missing from backend
      setSettings(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Failed to load settings', error);
      setMessage({ type: 'error', text: '无法加载当前设置' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await updateGameServerSettings(settings);
      setMessage({ type: 'success', text: '设置已保存并更新' });
    } catch (error) {
      console.error('Failed to save settings', error);
      setMessage({ type: 'error', text: '保存失败，请检查网络或权限' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: (name.includes('Port') || name === 'port') ? parseInt(value) || 0 : value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        <Loader2 className="animate-spin mr-2" /> 加载设置中...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">游戏服务器配置</h1>
          <p className="text-gray-400">配置连接远程 VPS、数据库及 SOAP 的参数，用于监控、控制及游戏交互功能。</p>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="size-5" /> : <AlertCircle className="size-5" />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Database Settings */}
        <div className="bg-[#1a1a1a] rounded-lg border border-white/5 p-6">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Database className="size-5 text-purple-400" />
            数据库连接设置 (MySQL)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-400 mb-2">数据库主机 (Host)</label>
              <input type="text" name="host" value={settings.host} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500/50" placeholder="127.0.0.1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">端口 (Port)</label>
              <input type="number" name="port" value={settings.port} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500/50" placeholder="3306" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">用户名</label>
              <input type="text" name="username" value={settings.username} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500/50" placeholder="acore" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">密码</label>
              <input type="password" name="password" value={settings.password} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500/50" placeholder="••••••" />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Auth 数据库名</label>
              <input type="text" name="authDatabase" value={settings.authDatabase} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500/50" placeholder="acore_auth" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Characters 数据库名</label>
              <input type="text" name="charactersDatabase" value={settings.charactersDatabase} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500/50" placeholder="acore_characters" />
            </div>
          </div>
        </div>

        {/* SOAP Settings */}
        <div className="bg-[#1a1a1a] rounded-lg border border-white/5 p-6">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Command className="size-5 text-green-400" />
            SOAP 连接设置 (远程命令执行)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-400 mb-2">SOAP 主机</label>
              <input type="text" name="soapHost" value={settings.soapHost} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500/50" placeholder="127.0.0.1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">SOAP 端口</label>
              <input type="number" name="soapPort" value={settings.soapPort} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500/50" placeholder="7878" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">SOAP 用户名</label>
              <input type="text" name="soapUsername" value={settings.soapUsername} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500/50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">SOAP 密码</label>
              <input type="password" name="soapPassword" value={settings.soapPassword} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500/50" placeholder="••••••" />
            </div>
          </div>
        </div>

        {/* SSH Connection Settings */}
        <div className="bg-[#1a1a1a] rounded-lg border border-white/5 p-6">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Terminal className="size-5 text-blue-400" />
            SSH 监控设置 (系统状态)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-400 mb-2">服务器 IP (SSH Host)</label>
              <input type="text" name="sshHost" value={settings.sshHost} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50" placeholder="127.0.0.1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">SSH 端口</label>
              <input type="number" name="sshPort" value={settings.sshPort} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50" placeholder="22" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">SSH 用户名</label>
              <input type="text" name="sshUsername" value={settings.sshUsername} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50" placeholder="root" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">SSH 密码</label>
              <input type="password" name="sshPassword" value={settings.sshPassword} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50" placeholder="••••••" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-2">Worldserver 服务名称</label>
              <input type="text" name="worldServiceName" value={settings.worldServiceName} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50" placeholder="acore-worldserver" />
              <p className="mt-1 text-xs text-gray-500">用于 systemctl 检查状态的游戏世界服务名称</p>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-2">Authserver 服务名称</label>
              <input type="text" name="authServiceName" value={settings.authServiceName} onChange={handleChange} className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50" placeholder="acore-authserver" />
              <p className="mt-1 text-xs text-gray-500">用于 systemctl 检查状态的认证服务名称</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="animate-spin size-5" /> : <Save className="size-5" />}
            {saving ? '保存中...' : '保存所有配置'}
          </button>
        </div>
      </form>
    </div>
  );
}
