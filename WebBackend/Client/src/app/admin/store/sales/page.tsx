'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import api from '@/services/api';

export default function AdminStoreSales() {
  interface SalesRecord {
    id: number;
    itemName: string;
    price: number;
    buyer: string;
    character: string;
    date: string;
  }
  const [sales, setSales] = useState<SalesRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Search states for Sales
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchSales = async () => {
    try {
      const salesRes = await api.get('/admin/shop/orders');
      setSales(salesRes.data);
    } catch (err) {
      console.error('Failed to fetch sales records:', err);
      setSales([]); 
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // Filter and Pagination Logic
  const filteredSales = sales.filter(s => 
    s.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.character.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredSales.length / pageSize);
  const paginatedSales = filteredSales.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  if (loading) return <div className="p-8 text-yellow-500">加载中...</div>;

  return (
    <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-6 shrink-0">
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">销售记录</h1>
                <p className="text-sm text-gray-400">查看商店的所有交易历史记录。</p>
            </div>
            
            {/* Search Bar */}
            <div className="flex items-center space-x-2 bg-[#1a1a1a] p-1.5 rounded-lg border border-white/5 w-72">
                <Search className="size-4 text-gray-500 ml-2" />
                <input 
                    type="text" 
                    placeholder="搜索商品、账号或角色..." 
                    className="flex-1 bg-transparent border-none text-sm text-gray-200 focus:outline-none placeholder:text-gray-600 py-1"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="flex-initial min-h-0 bg-[#1a1a1a] rounded-lg border border-white/5 overflow-hidden flex flex-col">
            <div className="overflow-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-black/20 text-gray-400 border-b border-white/5 sticky top-0 backdrop-blur-sm">
                        <tr>
                            <th className="px-6 py-4 font-medium">商品名称</th>
                            <th className="px-6 py-4 font-medium">价格 (积分)</th>
                            <th className="px-6 py-4 font-medium">购买账号</th>
                            <th className="px-6 py-4 font-medium">收货角色</th>
                            <th className="px-6 py-4 font-medium text-right">交易时间</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {paginatedSales.map((sale) => (
                            <tr key={sale.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-3 font-medium text-gray-200">{sale.itemName}</td>
                                <td className="px-6 py-3 text-yellow-500 font-medium tabular-nums">{sale.price}</td>
                                <td className="px-6 py-3 text-gray-400">{sale.buyer}</td>
                                <td className="px-6 py-3 text-blue-400">{sale.character}</td>
                                <td className="px-6 py-3 text-right text-gray-500 text-xs font-mono">
                                    {new Date(sale.date).toLocaleString('zh-CN')}
                                </td>
                            </tr>
                        ))}
                            {paginatedSales.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    暂无销售记录
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-2 shrink-0 pt-4">
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
                <span>条</span>
            </div>

            <div className="flex items-center space-x-4">
                <div className="text-sm font-medium text-gray-400">
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
