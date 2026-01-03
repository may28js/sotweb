'use client';

import { useEffect, useState } from 'react';
import { Newspaper, Search, Calendar, User, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getNews } from '../../services/newsService';
import { News } from '../../types/news';
import { MOCK_NEWS } from '../../data/mockNews';

export default function NewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('全部');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await getNews();
        if (data && data.length > 0) {
            // Map thumbnails if they are missing or use defaults
            const newsWithImages = data.map((item, index) => ({
                ...item,
                thumbnail: item.thumbnail || MOCK_NEWS[index % MOCK_NEWS.length].thumbnail
            }));
            setNews(newsWithImages);
        } else {
            setNews(MOCK_NEWS);
        }
      } catch (error) {
        console.error('Failed to fetch news:', error);
        setNews(MOCK_NEWS);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case '更新': return 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10';
      case '活动': return 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10';
      case '维护': return 'border-red-500/30 text-red-400 bg-red-500/10';
      default: return 'border-blue-500/30 text-blue-400 bg-blue-500/10';
    }
  };

  const stripHtml = (html: string) => {
    if (!html) return '';
    // Replace block tags with newlines to separate paragraphs
    const withNewLines = html
      .replace(/<\/p>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/div>/gi, '\n');
    // Strip all tags and trim
    let text = withNewLines.replace(/<[^>]*>?/gm, '').trim();
    // Add indentation to the first line if it's not empty
    if (text) {
        // Replace multiple newlines with a single one to avoid huge gaps
        text = text.replace(/\n\s*\n/g, '\n');
        // Add full-width spaces for indentation at the start of each paragraph (simple approach)
        // Note: For pure CSS indentation on first line, we use text-indent. 
        // But for "visual indentation after newline", we need to manually inject spaces or use complex CSS.
        // Here we rely on CSS for the first line and simple text for others if needed, 
        // but given line-clamp usually shows mostly the first paragraph, CSS indent-8 is cleanest.
        return text;
    }
    return '';
  };

  const filteredNews = news.filter(item => {
    const matchesFilter = filter === '全部' || item.type === filter;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          stripHtml(item.content).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm]);

  const totalPages = Math.ceil(filteredNews.length / ITEMS_PER_PAGE);
  const paginatedNews = filteredNews.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  const getPageNumbers = () => {
    const pages = [];
    
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        if (currentPage <= 4) {
            // Near start: 1 2 3 4 5 ... totalPages
            for (let i = 1; i <= 5; i++) pages.push(i);
            pages.push('...');
            pages.push(totalPages);
        } else if (currentPage >= totalPages - 3) {
            // Near end: 1 ... totalPages-4 ... totalPages
            pages.push(1);
            pages.push('...');
            for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
        } else {
            // Middle: 1 ... current-1 current current+1 ... totalPages
            pages.push(1);
            pages.push('...');
            pages.push(currentPage - 1);
            pages.push(currentPage);
            pages.push(currentPage + 1);
            pages.push('...');
            pages.push(totalPages);
        }
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

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
              <Newspaper className="h-10 w-10 text-yellow-500" />
              <span>新闻 & 动态</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              了解最新的更新补丁、活动资讯和社区公告。
            </p>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-[#272727] p-4 rounded-sm border border-white/5">
            <div className="flex flex-wrap gap-2">
              {['全部', '更新', '活动', '维护', '综合'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-4 py-2 rounded-sm text-sm font-bold transition-all duration-300 ${
                    filter === type
                      ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="搜索新闻..."
                className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-sm leading-5 bg-black/20 text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-black/40 focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 sm:text-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {filteredNews.length === 0 ? (
            <div className="text-center py-20 bg-[#272727] rounded-sm border border-white/5">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
                <Newspaper className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">未找到相关新闻</h3>
              <p className="text-gray-400">请尝试调整搜索关键词或筛选条件。</p>
            </div>
          ) : (
            <>
            <div className="space-y-6">
              {paginatedNews.map((item) => (
                <Link key={item.id} href={`/news/${item.id}`} className="block group">
                  <article className="flex flex-col md:flex-row bg-[#272727] border border-white/10 rounded-sm overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-white/20 h-full md:min-h-[16rem]">
                    {/* Image Placeholder or Actual Image if available */}
                    <div className="relative w-full md:w-96 h-48 md:h-auto bg-[#111] overflow-hidden shrink-0">
                       <Image 
                         src={item.thumbnail || `/demo-assets/news/${(item.id % 5) === 0 ? '24.jpeg' : (item.id % 5) === 1 ? '28.jpeg' : (item.id % 5) === 2 ? '5.jpeg' : (item.id % 5) === 3 ? '7.jpg' : '8.webp'}`} 
                         alt={item.title}
                         fill
                         className="object-cover transition-transform duration-700 group-hover:scale-110"
                         onError={(e) => {
                             // Fallback if image missing
                             (e.target as HTMLImageElement).src = '/demo-assets/news/24.jpeg';
                         }}
                       />
                       <div className="absolute top-4 left-4 z-20">
                          <span className={`inline-flex items-center rounded-sm px-2 py-1 text-xs font-bold uppercase tracking-wider border backdrop-blur-md bg-black/40 ${getTypeColor(item.type)}`}>
                            {item.type}
                          </span>
                       </div>
                    </div>
                    <div className="flex flex-col p-4 md:p-5 flex-grow relative">
                      <div className="flex items-center gap-x-4 text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                        <time dateTime={item.createdAt} className="flex items-center gap-1">
                           <Calendar className="h-3 w-3 text-yellow-500" />
                           {new Date(item.createdAt).toLocaleDateString()}
                        </time>
                        <span className="flex items-center gap-1">
                           <User className="h-3 w-3 text-yellow-500" />
                           {item.author}
                        </span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-yellow-400 transition-colors mb-3 line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="line-clamp-4 text-sm leading-relaxed text-gray-400 mb-4 indent-8 whitespace-pre-wrap">
                        {stripHtml(item.content)}
                      </p>
                      <div className="flex items-center text-xs font-bold text-yellow-500 uppercase tracking-wider group-hover:translate-x-1 transition-transform mt-auto">
                        阅读更多 <ChevronRight className="h-3 w-3 ml-1" />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 py-8 mt-4">
                  {currentPage > 1 && (
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        className="px-4 py-2 border border-white/20 rounded-sm transition-all duration-300 text-gray-300 hover:bg-yellow-500/30"
                    >
                        上一页
                    </button>
                  )}

                  {getPageNumbers().map((page, index) => (
                      <button
                          key={index}
                          onClick={() => typeof page === 'number' ? setCurrentPage(page) : null}
                          disabled={page === '...'}
                          className={`px-4 py-2 border border-white/20 rounded-sm transition-all duration-300 ${
                              page === '...' 
                                ? 'text-gray-500 border-transparent cursor-default' 
                                : currentPage === page
                                  ? 'bg-yellow-500/70 text-white border-yellow-500/50'
                                  : 'text-gray-300 hover:bg-yellow-500/30 bg-transparent'
                          }`}
                      >
                          {page}
                      </button>
                  ))}

                  {currentPage < totalPages && (
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        className="px-4 py-2 border border-white/20 rounded-sm transition-all duration-300 text-gray-300 hover:bg-yellow-500/30"
                    >
                        下一页
                    </button>
                  )}
              </div>
            )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
