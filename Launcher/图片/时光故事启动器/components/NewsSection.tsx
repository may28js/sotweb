
import React from 'react';
import { NEWS_ITEMS, UPDATE_LOGS } from '../constants';
import { Calendar, Tag, Activity, Sparkles, ChevronRight } from 'lucide-react';

const NewsSection: React.FC = () => {
  const featured = NEWS_ITEMS[0];
  const others = NEWS_ITEMS.slice(1);

  return (
    <div className="flex-1 overflow-y-auto p-8 pb-32 custom-scrollbar">
      
      {/* Top Section: Hero Banner */}
      <div className="mb-8 group cursor-pointer relative">
        <div className="relative h-80 w-full rounded-lg overflow-hidden border border-[#4c3a6e] shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <div className="absolute inset-0 bg-purple-900/20 z-0"></div>
          <img 
            src={featured.imageUrl} 
            alt={featured.title} 
            className="w-full h-full object-cover object-[center_35%] transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#161026] via-[#161026]/40 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-8 w-full max-w-3xl">
            <div className="flex items-center gap-3 mb-3">
               <span className="bg-amber-600 text-white text-xs font-bold px-2 py-0.5 rounded shadow-lg shadow-amber-900/50">
                 {featured.category}
               </span>
               <span className="text-amber-200/80 text-sm flex items-center gap-1 font-medium">
                 <Calendar size={12} /> {featured.date}
               </span>
            </div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-100 to-amber-400 mb-2 drop-shadow-md tracking-tight group-hover:from-white group-hover:to-amber-200 transition-all">
              {featured.title}
            </h1>
            <p className="text-slate-300 text-lg line-clamp-2 drop-shadow-md leading-relaxed">
              {featured.summary}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Section: Split Columns */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Update Logs (Prominent) */}
        <div className="lg:w-1/3 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-1 px-1">
                <h2 className="text-amber-400 font-bold text-lg flex items-center gap-2">
                    <Activity size={18} /> 服务器动态
                </h2>
                <button className="text-xs text-purple-300 hover:text-white transition-colors">查看全部 &gt;</button>
            </div>
            
            <div className="bg-[#1e1b2e]/80 backdrop-blur-sm border border-[#4c3a6e]/50 rounded-lg p-1 shadow-inner">
                {UPDATE_LOGS.map((log) => (
                    <div key={log.id} className="p-3 border-b border-[#352f44] last:border-0 hover:bg-[#2d2842] transition-colors rounded group cursor-default">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-mono text-purple-300 bg-purple-900/40 px-1.5 py-0.5 rounded border border-purple-700/30">{log.version}</span>
                            <span className="text-xs text-slate-500">{log.date}</span>
                        </div>
                        <div className="text-sm text-slate-200 group-hover:text-amber-100 transition-colors line-clamp-2">
                             {log.isHot && <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>}
                             {log.content}
                        </div>
                    </div>
                ))}
            </div>

             {/* Banner Ad / Extra Link */}
            <div className="mt-2 bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border border-purple-500/30 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:border-amber-500/50 transition-colors group">
                <div>
                    <h3 className="text-amber-400 font-bold text-sm">赞助服务器</h3>
                    <p className="text-xs text-purple-200">获取酷炫的光环特效与坐骑</p>
                </div>
                <Sparkles className="text-amber-400 group-hover:rotate-12 transition-transform" size={20} />
            </div>
        </div>

        {/* Right Column: Other News Grid */}
        <div className="lg:w-2/3">
             <div className="flex items-center justify-between mb-2 px-1">
                <h2 className="text-slate-300 font-bold text-lg">更多资讯</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {others.map((item) => (
                <div key={item.id} className="bg-[#1e1b2e]/60 border border-[#4c3a6e]/30 rounded-lg overflow-hidden hover:bg-[#252138] hover:border-amber-500/30 transition-all cursor-pointer group hover:-translate-y-1">
                    <div className="h-32 overflow-hidden relative">
                    <img 
                        src={item.imageUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100" 
                    />
                    <div className="absolute top-2 left-2">
                        <span className="bg-black/60 backdrop-blur text-amber-400 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 border border-white/10">
                            <Tag size={10} /> {item.category}
                        </span>
                    </div>
                    </div>
                    <div className="p-3">
                    <h3 className="text-base font-bold text-slate-200 mb-1 line-clamp-1 group-hover:text-amber-400 transition-colors">
                        {item.title}
                    </h3>
                    <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed mb-2">
                        {item.summary}
                    </p>
                    <div className="flex justify-between items-center">
                         <span className="text-[10px] text-slate-600">{item.date}</span>
                         <ChevronRight size={14} className="text-slate-600 group-hover:text-amber-500 transition-colors" />
                    </div>
                    </div>
                </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};

export default NewsSection;
