import { useEffect, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { newsService, patchNoteService } from '../services/api';
import type { NewsItem, PatchNoteItem } from '../types';

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

const NewsCard = ({ tag, title, desc, image, date }: { tag: string, title: string, desc: string, image: string, date: string }) => (
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
        <div className="mt-auto pt-3 text-[10px] text-gray-600">{date}</div>
     </div>
  </div>
);

const GamePage = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [patchNotes, setPatchNotes] = useState<PatchNoteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [newsData, patchData] = await Promise.all([
                newsService.getNews(),
                patchNoteService.getPatchNotes()
            ]);
            setNews(newsData);
            setPatchNotes(patchData);
        } catch (error) {
            console.error("Failed to fetch game page data", error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  if (loading) {
      return (
          <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
      );
  }

  return (
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
              {patchNotes.map((note, index) => (
                  <PatchNote 
                    key={index}
                    version={note.version}
                    date={note.date}
                    content={note.content}
                    highlight={note.highlight}
                  />
              ))}
            </div>
        </div>

        {/* News Cards */}
        <div className="col-span-8 flex flex-col">
            <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="font-bold text-gray-200">更多资讯</h3>
            </div>
            <div className="grid grid-cols-2 gap-6 flex-1">
              {news.map(item => (
                  <NewsCard 
                    key={item.id}
                    tag={item.tag}
                    title={item.title}
                    desc={item.desc}
                    image={item.image}
                    date={item.date}
                  />
              ))}
            </div>
        </div>
      </div>
    </>
  );
};

export default GamePage;
