'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, History, Package, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import api from '../../services/api';

interface PurchaseRecord {
  id: number;
  itemName: string;
  cost: number;
  characterName: string;
  createdAt: string;
  status: string;
}

export default function PurchaseHistory() {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<PurchaseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (isOpen && !hasLoaded && !isLoading) {
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/store/history');
      setHistory(response.data);
      setHasLoaded(true);
    } catch (error) {
      console.error('Failed to fetch purchase history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full mt-6 border-t border-white/10 pt-4">
      {/* Trigger Header */}
      <button 
        onClick={toggleOpen}
        className="w-full flex items-center justify-between p-3 bg-black/40 hover:bg-black/60 border border-white/5 hover:border-yellow-500/30 rounded-md transition-all duration-300 group"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-yellow-500/10 rounded-full text-yellow-500 group-hover:text-yellow-400 transition-colors">
            <History size={18} />
          </div>
          <span className="text-gray-300 font-medium group-hover:text-white transition-colors">购买记录</span>
        </div>
        <div className={`text-gray-500 group-hover:text-yellow-500 transition-all duration-300 transform ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown size={20} />
        </div>
      </button>

      {/* Collapsible Content */}
      <div 
        className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}
      >
        <div className="bg-[#1a1a1a]/80 backdrop-blur-sm rounded-md border border-white/5 shadow-inner flex flex-col">
          
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent">
            <div className="col-span-4 pl-2">商品</div>
            <div className="col-span-3">接收角色</div>
            <div className="col-span-2 text-right">价格</div>
            <div className="col-span-3 text-right pr-2">时间</div>
          </div>

          {/* List Content */}
          <div className="overflow-y-auto custom-scrollbar max-h-[300px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500 gap-2">
                <Loader2 size={24} className="animate-spin text-yellow-500" />
                <span className="text-xs">加载记录中...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-600 gap-2">
                <Package size={32} strokeWidth={1.5} />
                <span className="text-xs">暂无购买记录</span>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {history.map((record) => (
                  <div 
                    key={record.id} 
                    className="grid grid-cols-12 gap-2 p-3 text-sm hover:bg-white/5 transition-all duration-200 items-center group hover:border-l-2 hover:border-yellow-500/50 hover:pl-[calc(0.75rem-2px)]"
                  >
                    <div className="col-span-4 pl-2 font-medium text-gray-300 flex items-center gap-2 overflow-hidden">
                      {record.status === 'Delivered' ? (
                        <div className="text-green-500" title="已发货">
                          <CheckCircle2 size={14} />
                        </div>
                      ) : record.status === 'Failed' ? (
                         <div className="text-red-500" title="发货失败">
                           <XCircle size={14} />
                         </div>
                      ) : (
                        <div className="text-yellow-500" title="处理中">
                          <Clock size={14} />
                        </div>
                      )}
                      <span className="truncate" title={record.itemName}>{record.itemName}</span>
                    </div>
                    <div className="col-span-3 text-gray-400 truncate text-xs" title={record.characterName}>
                      {record.characterName}
                    </div>
                    <div className="col-span-2 text-right text-yellow-500 font-medium">
                      {Math.floor(record.cost)}
                    </div>
                    <div className="col-span-3 text-right pr-2 text-gray-500 text-xs font-mono group-hover:text-gray-400 transition-colors">
                      {formatDate(record.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
