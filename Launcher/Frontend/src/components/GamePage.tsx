import { useEffect, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { newsService } from '../services/api';
import type { NewsItem } from '../types';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const newsData = await newsService.getNews();
            setNews(newsData);
        } catch (error) {
            console.error("Failed to fetch game page data", error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  const maintenanceNews = news.find(item => item.tag === '维护（启动器）');
  const activityNews = news.find(item => item.tag === '活动');
  const generalNews = news.filter(item => item.tag === '新闻');
  const launcherUpdates = news.filter(item => item.tag === '更新（启动器）');

  if (loading) {
      return (
          <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
      );
  }

  return (
    <>
      {/* Maintenance Alert */}
      {maintenanceNews && (
        <div className="mb-6 py-2 px-4 bg-yellow-500/10 border-l-2 border-yellow-500 flex items-center gap-3">
           <TriangleAlert size={16} className="text-yellow-500 shrink-0" />
           <div className="flex items-center gap-3 overflow-hidden">
              <span className="text-yellow-500 font-bold text-sm whitespace-nowrap">{maintenanceNews.title}</span>
              <span className="text-yellow-200/60 text-xs truncate border-l border-yellow-500/20 pl-3">{maintenanceNews.desc}</span>
           </div>
        </div>
      )}

      {/* Top Section Grid */}
      <div className="grid grid-cols-12 gap-4">
          {/* Featured Banner (Left 3/4) */}
          <div className="col-span-9 h-[320px] rounded-xl overflow-hidden relative group border border-white/10 shadow-2xl cursor-pointer">
            <img 
              src={activityNews ? activityNews.image : "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop"} 
              alt={activityNews ? activityNews.title : "Winter Veil"} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
            
            <div className="absolute bottom-0 left-0 p-6 w-2/3">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2 py-0.5 bg-amber-600 text-white text-xs font-bold rounded shadow-lg shadow-amber-900/50">活动</span>
                  <span className="text-gray-300 text-sm flex items-center gap-1">
                    <span className="opacity-60">📅</span> {activityNews ? activityNews.date : '2024-12-15'}
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors drop-shadow-md">
                  {activityNews ? activityNews.title : '时光回溯：冬幕节的起源'}
                </h2>
                <p className="text-gray-300 leading-relaxed line-clamp-2 text-sm drop-shadow-sm">
                  {activityNews ? activityNews.desc : '克罗米发现了一个时间裂隙，冬幕节的庆祝活动似乎发生了一些奇妙的变化。在铁炉堡和奥格瑞玛寻找时间守护者领取特殊任务，赢取绝版坐骑。'}
                </p>
            </div>
          </div>

          {/* Server Status / Patch Notes (Right 1/4) */}
          <div className="col-span-3 h-[320px] overflow-y-auto bg-green-900/20 backdrop-blur-sm rounded-xl border border-white/5 p-4 hover:border-white/10 transition-colors hover:bg-white/10">
              <div className="flex justify-between items-center mb-2">
                <h3 className="flex items-center gap-2 font-bold text-amber-400">
                  <span className="text-amber-500">⚡</span> 服务器动态
                </h3>
                <a href="#" className="text-xs text-gray-500 hover:text-white transition-colors">查看全部 &gt;</a>
              </div>
              
              <div className="space-y-3">
                {launcherUpdates.length > 0 ? launcherUpdates.map((item, index) => (
                    <PatchNote 
                      key={item.id}
                      version={item.title}
                      date={item.date}
                      content={item.desc}
                      highlight={index === 0}
                    />
                )) : (
                    <div className="text-gray-500 text-sm text-center py-4">暂无更新记录</div>
                )}
              </div>
          </div>
      </div>

      {/* News Cards */}
      <div className="mt-4 flex flex-col">
          <div className="flex justify-between items-center mb-2 px-1">
            <h3 className="font-bold text-gray-200">更多资讯</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 flex-1">
            {generalNews.length > 0 ? generalNews.slice(0, 3).map(item => (
                <NewsCard 
                  key={item.id}
                  tag={item.tag}
                  title={item.title}
                  desc={item.desc}
                  image={item.image}
                  date={item.date}
                />
            )) : (
                 <div className="col-span-3 text-gray-500 text-sm text-center py-4">暂无新闻资讯</div>
            )}
          </div>
      </div>
    </>
  );
};

export default GamePage;
