'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Edit, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import api from '@/lib/api';

interface News {
  id: number;
  title: string;
  content: string;
  author: string;
  type: string;
  thumbnail?: string;
  createdAt: string;
}

export default function AdminNews() {
  const router = useRouter();
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchNews = async () => {
    try {
      const response = await api.get('/news');
      setNewsList(response.data);
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleEdit = (news: News) => {
    router.push(`/admin/news/editor?id=${news.id}`);
  };

  const handleOpenCreate = () => {
    router.push('/admin/news/editor');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条新闻吗？')) return;
    try {
      await api.delete(`/news/${id}`);
      setNewsList(newsList.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete news:', error);
      alert('删除失败，可能权限不足或网络错误。');
    }
  };

  const filteredNews = newsList.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredNews.length / pageSize);
  const paginatedNews = filteredNews.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center shrink-0">
        <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">新闻管理</h1>
            <p className="text-sm text-gray-400">发布和管理游戏公告、更新日志及活动新闻。</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-md transition-colors"
        >
          <Plus className="size-4 mr-2" />
          发布新闻
        </button>
      </div>

      <div className="flex items-center space-x-2 bg-[#1a1a1a] p-1 rounded-lg border border-white/5 w-full max-w-sm shrink-0">
        <Search className="size-4 text-gray-500 ml-2" />
        <input 
            type="text" 
            placeholder="搜索新闻标题、作者或分类..." 
            className="flex-1 bg-transparent border-none text-sm text-gray-200 focus:outline-none placeholder:text-gray-600 py-1"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-initial min-h-0 bg-[#1a1a1a] rounded-lg border border-white/5 overflow-hidden flex flex-col">
        {loading ? (
           <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                  <p className="text-sm">加载数据中...</p>
              </div>
           </div>
        ) : filteredNews.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p>暂无新闻文章。</p>
            <p className="text-sm mt-2">点击“发布新闻”创建第一篇文章。</p>
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/20 text-gray-400 border-b border-white/5 sticky top-0 backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-3 font-medium w-16">ID</th>
                  <th className="px-4 py-3 font-medium">标题</th>
                  <th className="px-4 py-3 font-medium">分类</th>
                  <th className="px-4 py-3 font-medium">作者</th>
                  <th className="px-4 py-3 font-medium">发布时间</th>
                  <th className="px-4 py-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {paginatedNews.map((news) => (
                  <tr key={news.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-500">#{news.id}</td>
                    <td className="px-4 py-2.5 font-medium text-white">{news.title}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {news.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-400">{news.author}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 font-mono">
                      {new Date(news.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 flex gap-2 justify-end">
                      <button 
                        onClick={() => handleEdit(news)}
                        className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                        title="编辑"
                      >
                        <Edit className="size-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(news.id)}
                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        title="删除"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-2 shrink-0">
        <div className="flex items-center space-x-2 text-sm text-gray-400">
            <span>每页显示</span>
            <select 
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-[#1a1a1a] border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-yellow-500"
            >
                {[10, 20, 30, 50].map(size => (
                    <option key={size} value={size}>{size}</option>
                ))}
            </select>
            <span>条数据</span>
        </div>

        <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex w-[100px] items-center justify-center text-sm font-medium text-gray-400">
                第 {currentPage} / {Math.max(1, totalPages)} 页
            </div>
            <div className="flex items-center space-x-2">
                <button
                    className="h-8 w-8 p-0 flex items-center justify-center rounded-md border border-white/10 bg-[#1a1a1a] text-gray-400 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                >
                    <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                    className="h-8 w-8 p-0 flex items-center justify-center rounded-md border border-white/10 bg-[#1a1a1a] text-gray-400 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                    className="h-8 w-8 p-0 flex items-center justify-center rounded-md border border-white/10 bg-[#1a1a1a] text-gray-400 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
                <button
                    className="h-8 w-8 p-0 flex items-center justify-center rounded-md border border-white/10 bg-[#1a1a1a] text-gray-400 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                >
                    <ChevronsRight className="h-4 w-4" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
