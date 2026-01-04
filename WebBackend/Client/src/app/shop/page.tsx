'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Gem, History, Search, Filter, ChevronRight, Plus, Minus, Trash2, X, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';

// Use backend model
interface ShopItem {
  id: number;
  gameItemId: number;
  name: string;
  description: string;
  price: number;
  iconUrl: string;
  category: string;
  isUnique: boolean;
}

// CartItem is now imported or managed by Context, but we can keep local interface if needed or remove it. 
// Ideally rely on Context types, but to minimize changes, we can ignore redefining if we don't use it explicitly in state.

export default function ShopPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { 
    cart, 
    isCartOpen, 
    addToCart, 
    removeFromCart, 
    updateQuantity: updateCartQuantity, 
    clearCart,
    cartTotal,
    closeCart,
    openCart
  } = useCart();

  const [items, setItems] = useState<ShopItem[]>([]);
  const [filter, setFilter] = useState('全部');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch items from backend
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await api.get('/store/items');
        setItems(res.data);
      } catch (err) {
        console.error('Failed to fetch shop items', err);
      }
    };
    fetchItems();
  }, []);

  const handleCheckout = () => {
    router.push('/shop/buy/checkout');
  };

  // Custom Nav Click Handler
  const handleNavClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    router.push(path);
  };

  const handleItemClick = (id: number) => {
    // router.push(`/shop/buy/${id}`);
    // Now clicking item card might just show details or add to cart?
    // Let's keep it navigating to details for "Buy Now" equivalent or specific details page if needed.
    // But since we are doing cart, clicking the CARD could just be "view details" or do nothing special if we have explicit buttons.
    // For now, let's redirect to single buy page as a "View Details" option, 
    // or we can remove the click handler on the container and rely on buttons.
    // User expectation: "Buy Now" button -> Add to Cart.
    // Let's just keep the container click as "View Details" (single buy page) for now, 
    // but the button inside will be "Add to Cart".
    // Actually, to avoid conflict, let's remove the container click or make it navigate to details only on image.
    router.push(`/shop/buy/${id}`);
  };

  // Protect the route
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Handle loading state
  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesCategory = filter === '全部' || item.category === filter;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Dynamically generate categories from fetched items
  const categories = ['全部', ...Array.from(new Set(items.map(item => item.category)))];

  return (
    <div className="flex flex-col min-h-screen bg-[#1a1a1a] relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
          style={{ backgroundImage: "url('/demo-assets/general-page-bg.avif')" }}
        ></div>
      </div>

      <div className="relative z-10 flex-grow pt-36 pb-12">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col bg-[#212121]/50 backdrop-blur-sm border border-white/5 rounded-xl p-6 lg:p-8 shadow-2xl space-y-8 min-w-0">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-center border-b border-white/5 pb-6">
                  <div>
                    <h1 className="text-3xl font-extrabold text-white uppercase tracking-[0.2em] flex items-center gap-3">
                      <ShoppingCart className="h-6 w-6 text-yellow-500" />
                      <span className="bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                        时光商店
                      </span>
                    </h1>
                  </div>
                  
                  {/* User Balance Card */}
                  <div className="mt-4 md:mt-0 flex items-center gap-4 bg-[#1a1a1a] border border-white/10 rounded-full py-1.5 px-4 shadow-md">
                     <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">当前余额:</span>
                        <span className="text-lg font-bold text-white">{user.points || 0}</span>
                        <Image src="/demo-assets/store/currency-red.jpg" alt="Crystal" width={20} height={20} />
                     </div>
                     <div className="h-4 w-px bg-white/10"></div>
                     <Link href="/shop/donate" onClick={(e) => handleNavClick(e, '/shop/donate')} className="text-xs font-bold text-yellow-500 hover:text-white uppercase tracking-wider transition-colors">
                        充值
                     </Link>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                 {/* Sidebar Filters */}
                 <div className="w-full lg:w-64 flex-shrink-0 space-y-6">
                    {/* Search Bar */}
                    <div className="relative w-full group">
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <Search className="h-3.5 w-3.5 text-gray-500 group-focus-within:text-yellow-500 transition-colors" />
                       </div>
                       <input
                         type="text"
                         placeholder="搜索商品..."
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         className="block w-full pl-9 pr-3 py-1.5 border border-white/10 rounded-lg bg-[#1a1a1a] text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 focus:bg-[#212121] text-xs transition-all shadow-md"
                       />
                    </div>

                    {/* Categories & Promo - Hidden when Cart is active */}
                    {!isCartOpen && (
                        <div className="space-y-6">
                            <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-5 shadow-lg">
                               <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                  <Filter className="h-4 w-4 text-yellow-500" />
                                  商品分类
                               </h3>
                               <div className="space-y-1">
                                  {categories.map(cat => (
                                    <button
                                      key={cat}
                                      onClick={() => setFilter(cat)}
                                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-between group ${
                                        filter === cat 
                                        ? 'bg-yellow-600/20 text-yellow-500 border border-yellow-600/30' 
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                      }`}
                                    >
                                      {cat}
                                      {filter === cat && <ChevronRight className="h-3 w-3" />}
                                    </button>
                                  ))}
                               </div>
                            </div>

                            {/* Promo / Info Box */}
                            <div className="bg-gradient-to-br from-yellow-900/40 to-[#212121] border border-yellow-500/20 rounded-lg p-5 shadow-lg">
                               <h3 className="text-yellow-500 font-bold mb-2">需要帮助?</h3>
                               <p className="text-xs text-gray-400 mb-4">
                                  购买过程中遇到问题？请联系我们的支持团队获取帮助。
                               </p>
                               <Link href="/support" onClick={(e) => handleNavClick(e, '/support')} className="text-xs font-bold text-white underline hover:text-yellow-500">
                                  联系客服
                               </Link>
                            </div>
                        </div>
                    )}

                    {/* Shopping Cart - Sticky Position */}
                    {isCartOpen && (
                        <div className="sticky top-24 z-30">
                            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-md">
                                <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                                    <h3 className="text-white font-bold uppercase tracking-wider flex items-center gap-2 text-sm">
                                        <ShoppingCart size={16} className="text-yellow-500" />
                                        购物车 ({cart.reduce((a, b) => a + b.quantity, 0)})
                                    </h3>
                                    <button 
                                        onClick={() => closeCart()} 
                                        className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-white/5"
                                        aria-label="关闭购物车"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* Cart Items List - Max height for >5 items (approx 5 * 60px = 300px) */}
                                <div className={`space-y-3 mb-4 overflow-y-auto pr-1 custom-scrollbar ${cart.length > 5 ? 'max-h-[300px]' : ''}`}>
                                    {cart.map((item) => (
                                        <div key={item.product.id} className="bg-black/20 p-2.5 rounded border border-white/5 group">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs text-gray-200 font-medium line-clamp-1">{item.product.name}</span>
                                                <button 
                                                    onClick={() => removeFromCart(item.product.id)}
                                                    className="text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                            
                                            <div className="flex justify-between items-center">
                                                <div className="text-xs text-yellow-500 font-mono font-bold flex items-center gap-1">
                                                    {item.product.price * item.quantity}
                                                    <Image src="/demo-assets/store/currency-red.png" alt="C" width={12} height={12} />
                                                </div>
                                                
                                                {!item.product.isUnique ? (
                                                    <div className="flex items-center space-x-1 bg-white/5 rounded px-1 border border-white/5">
                                                        <button 
                                                            onClick={() => updateCartQuantity(item.product.id, -1)}
                                                            className="text-gray-400 hover:text-white p-0.5"
                                                        >
                                                            <Minus size={10} />
                                                        </button>
                                                        <span className="text-[10px] text-white w-3 text-center font-mono">{item.quantity}</span>
                                                        <button 
                                                            onClick={() => updateCartQuantity(item.product.id, 1)}
                                                            className="text-gray-400 hover:text-white p-0.5"
                                                        >
                                                            <Plus size={10} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-gray-500 uppercase border border-gray-700 px-1.5 py-0.5 rounded">唯一</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-3 border-t border-white/10 space-y-3">
                                    <div className="flex justify-between items-center text-sm font-bold">
                                        <span className="text-gray-400 text-xs">总计:</span>
                                        <span className="text-yellow-500 text-base flex items-center gap-1">
                                            {cartTotal}
                                            <Image src="/demo-assets/store/currency-red.png" alt="C" width={16} height={16} />
                                        </span>
                                    </div>

                                    <button 
                                        onClick={handleCheckout}
                                        className="w-full py-2.5 bg-yellow-600 hover:bg-yellow-500 text-black text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-yellow-900/20 rounded-md"
                                    >
                                        去结算
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                 </div>

                 {/* Main Content */}
                 <div className="flex-1 space-y-6 min-w-0">
                    {/* Items Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredItems.map((item) => (
                        <div key={item.id} className="group bg-[#1a1a1a] border border-white/10 rounded-lg overflow-hidden hover:border-yellow-500/50 transition-all duration-300 shadow-xl flex flex-col">
                          {/* Image Area - Click to view details */}
                          <div 
                            className="relative h-48 bg-[#151515] flex items-center justify-center overflow-hidden cursor-pointer"
                            onClick={() => handleItemClick(item.id)}
                          >
                             <Image 
                               src={item.iconUrl || '/images/placeholder.jpg'} 
                               alt={item.name} 
                               fill 
                               className="object-cover group-hover:scale-110 transition-transform duration-500 z-0"
                             />
                             <div className="absolute inset-0 bg-gradient-to-t from-[#212121] via-transparent to-transparent z-10"></div>
                             <span className="absolute top-2 right-2 z-20 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs font-bold text-gray-300 border border-white/10">
                                {item.category}
                             </span>
                          </div>

                          {/* Content */}
                          <div className="p-4 flex flex-col flex-grow">
                             <h3 className="text-lg font-bold text-white group-hover:text-yellow-500 transition-colors truncate">{item.name}</h3>
                             <p className="text-sm text-gray-400 mt-1 line-clamp-2 flex-grow">{item.description}</p>
                             
                             <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                   <Image src="/demo-assets/store/currency-red.png" alt="Crystal" width={20} height={20} />
                                   <span className="text-xl font-bold text-white">{item.price}</span>
                                </div>
                                
                                {/* Add to Cart Button */}
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        addToCart(item);
                                    }}
                                    className="px-3 py-2 bg-yellow-600 hover:bg-yellow-500 text-black border border-yellow-500/50 font-bold uppercase rounded transition-all flex items-center gap-2 text-xs shadow-lg shadow-yellow-900/20"
                                >
                                    <ShoppingCart size={14} />
                                    加入购物车
                                </button>
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {filteredItems.length === 0 && (
                       <div className="text-center py-12 text-gray-500">
                          没有找到符合条件的商品。
                       </div>
                    )}
                 </div>
                </div>
            </div>
            
            {/* Mobile Cart Toggle Button (Fixed Bottom Right) */}
            {cart.length > 0 && (
                <div className="fixed bottom-6 right-6 lg:hidden z-50">
                    <button 
                        onClick={() => {
                            if (!isCartOpen) openCart();
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="bg-yellow-600 text-black p-4 rounded-full shadow-2xl border-2 border-white/10 relative"
                    >
                        <ShoppingCart size={24} />
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                            {cart.reduce((a, b) => a + b.quantity, 0)}
                        </span>
                    </button>
                </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
