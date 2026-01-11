'use client';

import { Download, Monitor, Apple, Terminal } from 'lucide-react';
import Link from 'next/link';

export default function DownloadPage() {
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
              <Download className="h-10 w-10 text-yellow-500" />
              <span>游戏下载</span>
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto text-lg uppercase tracking-wide">
              选择适合您的操作系统版本下载
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Windows Download */}
            <div className="bg-[#272727]/90 backdrop-blur-sm p-8 rounded border border-white/10 flex flex-col items-center justify-center text-center hover:border-yellow-500/50 transition-colors group min-h-[880px]">
                <div className="w-20 h-20 bg-[#1e1e1e] rounded-full flex items-center justify-center mb-6 border border-white/5 group-hover:border-yellow-500/30 transition-colors">
                    <Monitor className="h-10 w-10 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Windows</h3>
                <p className="text-gray-400 text-sm mb-8">
                    适用于 Windows 10/11 (64位)
                </p>
                <button disabled className="px-8 py-3 bg-gray-600 text-gray-300 font-bold rounded cursor-not-allowed w-full max-w-[200px]">
                    即将推出
                </button>
            </div>

            {/* macOS Download */}
            <div className="bg-[#272727]/90 backdrop-blur-sm p-8 rounded border border-white/10 flex flex-col items-center justify-center text-center hover:border-yellow-500/50 transition-colors group min-h-[880px]">
                <div className="w-20 h-20 bg-[#1e1e1e] rounded-full flex items-center justify-center mb-6 border border-white/5 group-hover:border-yellow-500/30 transition-colors">
                    <Apple className="h-10 w-10 text-gray-200" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">macOS</h3>
                <p className="text-gray-400 text-sm mb-8">
                    适用于 macOS 10.15+ (Intel/Apple Silicon)
                </p>
                <button disabled className="px-8 py-3 bg-gray-600 text-gray-300 font-bold rounded cursor-not-allowed w-full max-w-[200px]">
                    即将推出
                </button>
            </div>
          </div>

          <div className="mt-12 text-center">
             <div className="inline-flex items-center justify-center space-x-2 text-gray-400 bg-[#272727]/50 px-6 py-3 rounded-full border border-white/5">
                <Terminal className="w-5 h-5 text-yellow-500" />
                <span>需要帮助？查看 <Link href="/play" className="text-yellow-400 hover:text-yellow-300 hover:underline">如何开始</Link> 指南</span>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
