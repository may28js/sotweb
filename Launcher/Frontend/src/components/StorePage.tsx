import { useEffect, useState } from 'react';
import { ShoppingBag, Gem, History, ChevronUp, Check, Search, Star } from 'lucide-react';
import type { ShopItem } from '../types';
import { shopService } from '../services/api';

const ShopFilter = ({ label, options }: { label: string, options: string[] }) => (
  <div className="flex items-center gap-2">
    <span className="text-gray-400 text-sm">{label}:</span>
    <div className="relative group">
       <select className="appearance-none bg-black/40 text-gray-200 text-sm pl-3 pr-8 py-1.5 rounded border border-white/10 hover:border-amber-500/50 focus:border-amber-500 outline-none cursor-pointer transition-colors">
          {options.map(opt => <option key={opt}>{opt}</option>)}
       </select>
       <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
         <ChevronUp size={12} className="rotate-180" />
       </div>
    </div>
  </div>
);

const ShopCard = ({ item }: { item: ShopItem }) => (
  <div className="bg-[#150a20] rounded-xl overflow-hidden border border-white/5 hover:border-amber-500/30 transition-all group flex flex-col h-full hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] hover:-translate-y-1 relative">
      {/* Featured Badge */}
      {item.featured && (
        <div className="absolute top-0 right-0 z-10">
           <div className="bg-amber-500 text-black text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1 shadow-lg">
              <Star size={10} className="fill-black" /> FEATURED
           </div>
        </div>
      )}
      
      {/* Discount Badge */}
      {item.discount && (
        <div className="absolute top-3 left-3 z-10">
           <div className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded shadow-lg">
              -{item.discount}%
           </div>
        </div>
      )}

      {/* Image Area */}
      <div className="h-40 overflow-hidden relative bg-black/20 p-4 flex items-center justify-center group-hover:bg-black/30 transition-colors">
         <img src={item.image} alt={item.title} className="max-w-full max-h-full object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-500" />
         
         {/* Overlay Gradient */}
         <div className="absolute inset-0 bg-gradient-to-t from-[#150a20] to-transparent opacity-80"></div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col relative -mt-6">
         <h3 className="font-bold text-lg text-gray-100 mb-1 group-hover:text-amber-400 transition-colors">{item.title}</h3>
         <p className="text-xs text-gray-500 mb-3 line-clamp-2">{item.desc}</p>
         
         {/* Tags */}
         <div className="flex flex-wrap gap-1.5 mb-4">
            {item.tags.map(tag => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">
                {tag}
              </span>
            ))}
         </div>

         {/* Price & Action */}
         <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
             <div className="flex items-end gap-2">
                {item.originalPrice && (
                  <span className="text-xs text-gray-500 line-through mb-0.5">{item.originalPrice}</span>
                )}
                <div className={`flex items-center gap-1 font-bold text-lg ${item.currency === 'gem' ? 'text-amber-400' : 'text-emerald-400'}`}>
                   {item.price.toLocaleString()}
                   {item.currency === 'gem' ? <Gem size={16} className="fill-amber-400/20" /> : <Gem size={16} className="fill-emerald-400/20" />}
                </div>
             </div>

             <button className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center shadow-lg shadow-amber-900/40 active:scale-90 transition-all group/btn" title="加入购物车">
                <ShoppingBag size={18} className="group-hover/btn:animate-bounce" />
             </button>
         </div>
      </div>
  </div>
);

const StorePage = () => {
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const items = await shopService.getShopItems();
        setShopItems(items);
      } catch (error) {
        console.error("Failed to fetch shop items", error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  if (loading) {
      return (
          <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
      );
  }

  return (
    <div className="flex flex-col min-h-full animate-in fade-in duration-500">
      {/* Store Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
           <h2 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
             <ShoppingBag size={32} className="text-amber-500" />
             游戏商城
           </h2>
           <p className="text-gray-400 text-sm">选购坐骑、宠物、服务以及更多精彩内容</p>
        </div>
        
        <div className="flex items-center gap-3">
           <button className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-bold rounded shadow-lg shadow-amber-900/40 active:scale-95 transition-all flex items-center gap-2">
              <Gem size={18} />
              充值水晶
           </button>
           <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-gray-300 hover:text-white transition-colors flex items-center gap-2">
              <History size={18} />
              购买记录
           </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#150a20] p-4 rounded-xl border border-white/5 mb-6 flex flex-wrap gap-6 items-center">
         <ShopFilter label="服务器" options={['所有服务器', '冰冠冰川', '洛丹伦', '黑石山']} />
         <ShopFilter label="分类" options={['所有商品', '坐骑 & 宠物', '角色服务', '道具 & 货币', '幻化外观']} />
         
         <div className="w-px h-6 bg-white/10 mx-2"></div>
         
         <label className="flex items-center gap-2 cursor-pointer group">
            <div className="w-4 h-4 rounded border border-white/20 bg-black/40 flex items-center justify-center group-hover:border-amber-500 transition-colors">
               <Check size={10} className="text-amber-500" />
            </div>
            <span className="text-sm text-gray-400 group-hover:text-gray-200">仅显示优惠</span>
         </label>

         <div className="ml-auto relative">
            <input 
              type="text" 
              placeholder="搜索商品..." 
              className="bg-black/40 border border-white/10 rounded-full pl-10 pr-4 py-1.5 text-sm text-gray-200 outline-none focus:border-amber-500/50 transition-colors w-64"
            />
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
         </div>
      </div>

      {/* Shop Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
         {shopItems.map(item => (
           <ShopCard key={item.id} item={item} />
         ))}
      </div>
    </div>
  );
};

export default StorePage;
