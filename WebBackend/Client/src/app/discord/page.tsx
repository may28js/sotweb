'use client';

import { MessageSquare, Users, Loader2, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';

interface KookMember {
    nickname: string;
    avatar: string;
    activity: string;
}

interface KookData {
    name: string;
    icon: string;
    online_count: string;
    members: KookMember[];
    channels: { id: string; name: string }[];
}

export default function DiscordPage() {
  const [kookData, setKookData] = useState<KookData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 尝试获取 KOOK 数据
    fetch('https://kookapp.cn/api/guilds/5257821610104028/widget.json')
        .then(res => res.json())
        .then(data => {
            setKookData(data);
            setLoading(false);
        })
        .catch(err => {
            console.error('Error fetching KOOK data:', err);
            setLoading(false);
        });
  }, []);

  return (
    <div className="min-h-screen bg-[#1a1a1a]" style={{
        backgroundImage: 'url("/demo-assets/home/general-page-bg.avif")',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat'
    }}>
      <div className="min-h-screen pt-24 pb-12">
        <div className="mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: '1220px' }}>
          
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight flex items-center justify-center gap-3">
              <Users className="h-10 w-10 text-yellow-500" />
              <span>社区</span>
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto text-lg">
              加入我们的社区，与其他冒险者交流心得。
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="bg-[#272727]/80 backdrop-blur-sm p-6 rounded-sm border border-white/10">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-yellow-400" />
                    加入我们的 KOOK 社区
                </h2>
                
                {loading ? (
                    <div className="h-[500px] flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
                    </div>
                ) : kookData ? (
                    <div className="flex flex-col bg-[#1e1e1e] rounded-lg border border-white/5 overflow-hidden h-[880px]">
                        {/* Server Header */}
                        <div className="p-4 bg-[#2b2b2b] border-b border-white/5 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center space-x-4">
                                {kookData.icon && (
                                    <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10 shadow-lg">
                                        <Image src={kookData.icon} alt={kookData.name} fill className="object-cover" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-lg font-bold text-white tracking-wide">{kookData.name}</h3>
                                    <p className="text-sm text-green-400 flex items-center mt-1">
                                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                                        {kookData.online_count} 人在线
                                    </p>
                                </div>
                            </div>
                            <a 
                                href="https://kook.vip/PRzXsA" 
                                target="_blank"
                                className="px-6 py-2 bg-yellow-400 text-black font-bold rounded hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-lg flex items-center"
                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                加入服务器
                            </a>
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            {/* Left Sidebar: Channels */}
                            <div className="w-64 bg-[#252525] border-r border-white/5 flex flex-col">
                                <div className="p-4 border-b border-white/5">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">热门频道</h4>
                                </div>
                                <div className="p-2 overflow-y-auto custom-scrollbar flex-1">
                                    <div className="space-y-1">
                                        {kookData.channels?.map((channel) => (
                                            <div key={channel.id} className="flex items-center text-gray-400 hover:text-white hover:bg-white/5 px-3 py-2 rounded transition-colors cursor-default">
                                                <span className="text-gray-600 mr-2 text-lg">#</span>
                                                <span className="truncate">{channel.name}</span>
                                            </div>
                                        ))}
                                        {/* Fallback if no channels */}
                                        {(!kookData.channels || kookData.channels.length === 0) && (
                                            <div className="text-gray-500 text-sm px-3 py-2">暂无公开频道</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Content: Members */}
                            <div className="flex-1 flex flex-col bg-[#1e1e1e]">
                                <div className="p-4 border-b border-white/5 bg-[#252525]/50">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">在线成员 ({kookData.members?.length || 0})</h4>
                                </div>
                                <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
                                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {kookData.members?.map((member, idx) => (
                                            <div key={idx} className="flex items-center space-x-3 p-2 rounded hover:bg-white/5 transition-colors group">
                                                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/5 group-hover:border-yellow-400/50 transition-colors flex-shrink-0">
                                                    <Image src={member.avatar} alt={member.nickname} fill className="object-cover" />
                                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#1e1e1e] rounded-full"></div>
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors truncate">{member.nickname}</p>
                                                    {member.activity && (
                                                        <p className="text-xs text-gray-500 truncate">{member.activity}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                     </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-[500px] flex flex-col items-center justify-center text-center p-6 bg-[#1e1e1e] rounded-lg border border-white/5">
                        <p className="text-red-400 mb-2">无法加载数据</p>
                        <p className="text-gray-500 text-sm">可能是由于跨域限制(CORS)或网络问题。</p>
                        <a 
                            href="https://kookapp.cn/api/guilds/5257821610104028/widget.json" 
                            target="_blank" 
                            className="mt-4 flex items-center text-yellow-400 text-sm hover:underline"
                        >
                            直接查看 API 数据 <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                    </div>
                )}
            </div>
          </div>
          
          <div className="mt-8 text-center">
             <p className="text-gray-400 text-sm">
                提示：点击右上角的“加入服务器”按钮即可进入我们的 KOOK 语音社区，获取最新资讯与帮助。
             </p>
          </div>

        </div>
      </div>
    </div>
  );
}