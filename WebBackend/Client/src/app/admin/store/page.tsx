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

export default function AdminStore() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Sales records state
  interface SalesRecord {
    id: number;
    itemName: string;
    price: number;
    buyer: string;
    character: string;
    date: string;
  }
  const [sales, setSales] = useState<SalesRecord[]>([]);

  const fetchData = async () => {
    try {
      // Fetch items independently
      try {
        const itemsRes = await api.get('/store/items');
        setItems(itemsRes.data);
      } catch (err) {
        console.error('Failed to fetch items:', err);
      }

      // Fetch sales records independently
      try {
        const salesRes = await api.get('/admin/shop/orders');
        setSales(salesRes.data);
      } catch (err) {
        console.error('Failed to fetch sales records:', err);
        setSales([]); 
      }
    } catch (error) {
      console.error('Error in fetchData:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">商店管理</h1>
        <Link
          href="/admin/store/create"
          className="flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-md transition-colors"
        >
          <Plus className="size-5 mr-2" />
          上架新商品
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product List Section (Left 1/3) */}
        <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center">
                <span className="w-1 h-6 bg-yellow-500 mr-3 rounded-full"></span>
                已上架商品
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((item) => (
                <div key={item.id} className="bg-[#1a1a1a] rounded-lg border border-white/10 overflow-hidden group hover:border-yellow-500/50 transition-colors">
                  {/* Top Part: Image */}
                  <div className="relative h-32 w-full bg-black/20 flex items-center justify-center overflow-hidden">
                    {item.iconUrl ? (
                      <img src={item.iconUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <span className="text-gray-500 text-xs">无图</span>
                    )}
                    <div className="absolute top-2 right-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.isActive ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'}`}>
                            {item.isActive ? '上架' : '下架'}
                        </span>
                    </div>
                  </div>
                  
                  {/* Bottom Part: Info & Actions */}
                  <div className="p-3">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-sm font-bold text-white truncate pr-2" title={item.name}>{item.name}</h3>
                        <span className="text-yellow-500 font-bold text-sm">{item.price}</span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                        <span className="text-[10px] text-gray-500 px-1.5 py-0.5 bg-white/5 rounded border border-white/5">{item.category}</span>
                        <div className="flex space-x-1">
                            <Link 
                                href={`/admin/store/edit/${item.id}`}
                                className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                                title="编辑"
                            >
                                <Edit size={14} />
                            </Link>
                            <button
                                onClick={() => handleDelete(item.id)}
                                className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                                title="删除"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                  <div className="col-span-2 p-8 text-center text-gray-500 bg-[#1a1a1a] rounded-lg border border-white/10">
                      暂无商品
                  </div>
              )}
            </div>
        </div>

        {/* Sales Records Section (Right 2/3) */}
        <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center">
                <span className="w-1 h-6 bg-green-500 mr-3 rounded-full"></span>
                销售记录
            </h2>
            <div className="bg-[#1a1a1a] rounded-lg border border-white/10 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-gray-400 text-sm">
                        <tr>
                            <th className="px-4 py-3">商品名称</th>
                            <th className="px-4 py-3">价格 (积分)</th>
                            <th className="px-4 py-3">购买账号</th>
                            <th className="px-4 py-3">收货角色</th>
                            <th className="px-4 py-3 text-right">交易时间</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {sales.map((sale) => (
                            <tr key={sale.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3 font-medium text-white">{sale.itemName}</td>
                                <td className="px-4 py-3 text-yellow-500 font-bold">{sale.price}</td>
                                <td className="px-4 py-3 text-gray-300">{sale.buyer}</td>
                                <td className="px-4 py-3 text-blue-300">{sale.character}</td>
                                <td className="px-4 py-3 text-right text-gray-500 text-sm font-mono">
                                    <div className="flex flex-col items-end">
                                        <span>{new Date(sale.date).toLocaleDateString('zh-CN')}</span>
                                        <span className="text-xs opacity-70">{new Date(sale.date).toLocaleTimeString('zh-CN')}</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                         {sales.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    暂无销售记录
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}
