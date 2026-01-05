import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { newsService } from '../services/api';
import type { NewsItem } from '../types';

const NewsListItem = ({ item }: { item: NewsItem }) => (
    <div className="flex gap-4 p-4 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 hover:border-amber-500/30 transition-all cursor-pointer group">
        <div className="w-48 h-28 rounded-lg overflow-hidden shrink-0">
            <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
        <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-xs rounded border border-amber-500/20">
                    {item.tag}
                </span>
                <span className="text-gray-500 text-xs">{item.date}</span>
            </div>
            <h3 className="text-lg font-bold text-gray-200 group-hover:text-amber-400 mb-2 transition-colors">{item.title}</h3>
            <p className="text-sm text-gray-400 line-clamp-2">{item.desc}</p>
        </div>
    </div>
);

const NewsPage = () => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const data = await newsService.getNews();
                setNews(data);
            } catch (error) {
                console.error("Failed to fetch news", error);
            } finally {
                setLoading(false);
            }
        };
        fetchNews();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500">
             <div className="flex items-center gap-3 mb-8">
                <Shield size={32} className="text-amber-500" />
                <h2 className="text-2xl font-bold text-white">新闻资讯</h2>
             </div>

             <div className="flex-1 flex flex-col gap-4">
                 {news.length > 0 ? (
                     news.map(item => (
                         <NewsListItem key={item.id} item={item} />
                     ))
                 ) : (
                     <div className="text-center text-gray-500 py-20">暂无新闻</div>
                 )}
             </div>
        </div>
    );
};

export default NewsPage;
