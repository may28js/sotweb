'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import api from '@/services/api';
import Link from 'next/link';

// Match backend model
interface ShopItem {
  id: number;
  gameItemId: number;
  name: string;
  description: string;
  price: number;
  iconUrl: string;
  category: string;
  isActive: boolean;
}

export default function AdminStoreItems() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      const itemsRes = await api.get('/store/items');
      setItems(itemsRes.data);
    } catch (err) {
      console.error('Failed to fetch items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此商品吗？')) return;
    try {
      await api.delete(`/store/items/${id}`);
      setItems(items.filter(i => i.id !== id));
    } catch (error) {
      alert('删除失败');
    }
  };

  if (loading) return <div className="p-8 text-yellow-500">加载中...</div>;

  return (
    <div className="">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold text-white mb-2">在售商品</h1>
            <p className="text-sm text-gray-400">管理商店中所有可见的商品项目。</p>
        </div>
        <Link
          href="/admin/store/create"
          className="flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-md transition-colors"
        >
          <Plus className="size-5 mr-2" />
          上架新商品
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-6">
          {items.map((item) => (
            <div key={item.id} className="bg-[#1a1a1a] rounded-lg border border-white/10 overflow-hidden group hover:border-yellow-500/50 transition-colors">
              {/* Top Part: Image */}
              <div className="relative h-48 w-full bg-black/20 flex items-center justify-center overflow-hidden">
                {item.iconUrl ? (
                  <img src={item.iconUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <span className="text-gray-500 text-sm">无图</span>
                )}
                <div className="absolute top-3 right-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.isActive ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'}`}>
                        {item.isActive ? '上架' : '下架'}
                    </span>
                </div>
              </div>
              
              {/* Bottom Part: Info & Actions */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-base font-bold text-white truncate pr-2" title={item.name}>{item.name}</h3>
                    <span className="text-yellow-500 font-bold text-base">{item.price}</span>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                    <span className="text-xs text-gray-500 px-2 py-1 bg-white/5 rounded border border-white/5">{item.category}</span>
                    <div className="flex space-x-2">
                        <Link 
                            href={`/admin/store/edit/${item.id}`}
                            className="p-2 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                            title="编辑"
                        >
                            <Edit size={16} />
                        </Link>
                        <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                            title="删除"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && (
              <div className="col-span-full p-12 text-center text-gray-500 bg-[#1a1a1a] rounded-lg border border-white/10">
                  暂无商品，请点击右上角添加
              </div>
          )}
      </div>
    </div>
  );
}
