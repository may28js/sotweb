'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Edit } from 'lucide-react';
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">新闻管理</h1>
        <button 
          onClick={handleOpenCreate}
          className="flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-md transition-colors"
        >
          <Plus className="size-4 mr-2" />
          发布新闻
        </button>
      </div>

      <div className="bg-[#1a1a1a] rounded-lg border border-white/5 overflow-hidden">
        {loading ? (
           <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : newsList.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>暂无新闻文章。</p>
            <p className="text-sm mt-2">点击“发布新闻”创建第一篇文章。</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-white/5 text-gray-400 text-sm">
              <tr>
                <th className="px-6 py-2 text-xs">ID</th>
                <th className="px-6 py-2 text-xs">标题</th>
                <th className="px-6 py-2 text-xs">分类</th>
                <th className="px-6 py-2 text-xs">作者</th>
                <th className="px-6 py-2 text-xs">发布时间</th>
                <th className="px-6 py-2 text-xs">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {newsList.map((news) => (
                <tr key={news.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-2 text-sm">#{news.id}</td>
                  <td className="px-6 py-2 text-sm font-medium text-white">{news.title}</td>
                  <td className="px-6 py-2">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-400">
                      {news.type}
                    </span>
                  </td>
                  <td className="px-6 py-2 text-sm">{news.author}</td>
                  <td className="px-6 py-2 text-xs text-gray-500">
                    {new Date(news.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-2 flex gap-2">
                    <button 
                      onClick={() => handleEdit(news)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      title="编辑"
                    >
                      <Edit className="size-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(news.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal removed */}
    </div>
  );
}
