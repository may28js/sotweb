'use client';

import { useEffect, useState } from 'react';
import { News } from '../types/news';
import { getNews } from '../services/newsService';

export default function NewsList() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await getNews();
        setNews(data);
      } catch (err) {
        setError('无法加载新闻列表');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Maintenance':
        return 'bg-red-500/10 text-red-400 ring-red-500/20';
      case 'Event':
        return 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20';
      case 'Update':
        return 'bg-green-500/10 text-green-400 ring-green-500/20';
      default:
        return 'bg-blue-500/10 text-blue-400 ring-blue-500/20';
    }
  };

  const getTypeText = (type: string) => {
      switch (type) {
          case 'Maintenance': return '维护';
          case 'Event': return '活动';
          case 'Update': return '更新';
          default: return '新闻';
      }
  };

  if (loading) {
    return (
      <div className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-4 py-1">
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    <div className="space-y-2">
                        <div className="h-4 bg-gray-700 rounded"></div>
                        <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 py-10">{error}</div>;
  }

  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">最新资讯</h2>
          <p className="mt-2 text-lg leading-8 text-gray-400">
            了解服务器的最新动态、活动预告和更新日志。
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {news.map((item) => (
            <article key={item.id} className="flex flex-col items-start justify-between bg-white/5 p-6 rounded-2xl hover:bg-white/10 transition duration-300">
              <div className="flex items-center gap-x-4 text-xs">
                <time dateTime={item.createdAt} className="text-gray-400">
                  {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                </time>
                <span
                  className={`relative z-10 rounded-full px-3 py-1.5 font-medium ring-1 ring-inset ${getTypeColor(item.type)}`}
                >
                  {getTypeText(item.type)}
                </span>
              </div>
              <div className="group relative">
                <h3 className="mt-3 text-lg font-semibold leading-6 text-white group-hover:text-gray-300">
                  <a href="#">
                    <span className="absolute inset-0" />
                    {item.title}
                  </a>
                </h3>
                <p className="mt-5 line-clamp-3 text-sm leading-6 text-gray-400">
                  {item.content}
                </p>
              </div>
              <div className="relative mt-8 flex items-center gap-x-4">
                <div className="text-sm leading-6">
                  <p className="font-semibold text-white">
                    <span className="absolute inset-0" />
                    {item.author}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}