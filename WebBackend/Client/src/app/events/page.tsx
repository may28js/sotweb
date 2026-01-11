'use client';

import { Calendar, Info } from 'lucide-react';

export default function EventsPage() {
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
              <Calendar className="h-10 w-10 text-yellow-500" />
              <span>活动</span>
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto text-lg">
              探索最新的服务器活动和精彩内容。
            </p>
          </div>

          <div className="bg-[#272727]/80 backdrop-blur-sm p-8 rounded-sm border border-white/10 min-h-[880px] flex flex-col items-center justify-center text-center">
            <Info className="h-16 w-16 text-gray-500 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">精彩活动即将开启</h2>
            <p className="text-gray-400 max-w-lg">
              我们正在筹备一系列激动人心的服务器活动。请密切关注本页面或我们的社区公告，以免错过任何奖励！
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
