import { useEffect, useState, useMemo } from 'react';
import { ShoppingCart, Search, Filter, ChevronRight, Plus, Minus, Trash2, X, Loader2, User as UserIcon, Check, AlertCircle } from 'lucide-react';
import type { ShopItem, User, Character } from '../types';
import { shopService, getImageUrl } from '../services/api';
import { RechargeModal } from './RechargeModal';

// --- Types ---
interface CartItem extends ShopItem {
  quantity: number;
}

// --- Components ---

const ShopCard = ({ item, onAddToCart }: { item: ShopItem, onAddToCart: (item: ShopItem) => void }) => (
  <div className="group bg-[#1a1a1a] border border-white/10 rounded-lg overflow-hidden hover:border-yellow-500/50 transition-all duration-300 shadow-xl flex flex-col h-full">
      {/* Image Area */}
      <div className="relative h-48 bg-[#151515] flex items-center justify-center overflow-hidden cursor-pointer group-hover:bg-[#1f1f1f] transition-colors">
         <img 
           src={getImageUrl(item.iconUrl) || '/images/placeholder.jpg'} 
           alt={item.name} 
           className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 z-0 opacity-80 group-hover:opacity-100"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-[#212121] via-transparent to-transparent z-10"></div>
         
         {/* Category Badge */}
         <span className="absolute top-2 right-2 z-20 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-gray-300 border border-white/10">
            {item.category}
         </span>
         
         {/* Unique Badge */}
         {item.isUnique && (
             <span className="absolute top-2 left-2 z-20 bg-yellow-900/80 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-yellow-200 border border-yellow-500/20">
                唯一
             </span>
         )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
         <h3 className="text-lg font-bold text-white group-hover:text-yellow-500 transition-colors truncate">{item.name}</h3>
         <p className="text-sm text-gray-400 mt-1 line-clamp-2 flex-grow min-h-[2.5em]">{item.description}</p>
         
         <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
               <img src="/images/currency-red.png" alt="Crystal" className="w-5 h-5 object-contain" />
               <span className="text-xl font-bold text-white">{item.price}</span>
            </div>
            
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart(item);
                }}
                className="px-3 py-2 bg-yellow-600 hover:bg-yellow-500 text-black border border-yellow-500/50 font-bold uppercase rounded transition-all flex items-center gap-2 text-xs shadow-lg shadow-yellow-900/20 active:scale-95"
            >
                <ShoppingCart size={14} />
                加入购物车
            </button>
         </div>
      </div>
  </div>
);

const CheckoutModal = ({ 
    isOpen, 
    onClose, 
    characters, 
    selectedCharacter, 
    onSelectCharacter, 
    onConfirm, 
    step, 
    message,
    totalPrice
}: {
    isOpen: boolean;
    onClose: () => void;
    characters: Character[];
    selectedCharacter: string;
    onSelectCharacter: (name: string) => void;
    onConfirm: () => void;
    step: 'select' | 'processing' | 'success' | 'error';
    message: string;
    totalPrice: number;
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-[400px] bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-white/5">
                    <span className="font-bold text-lg text-white">
                        {step === 'success' ? '购买成功' : '确认购买'}
                    </span>
                    {step !== 'processing' && (
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="p-6">
                    {step === 'select' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between bg-black/20 p-3 rounded border border-white/5">
                                <span className="text-gray-400 text-sm">总计金额:</span>
                                <span className="text-yellow-500 font-bold flex items-center gap-1">
                                    {totalPrice}
                                    <img src="/images/currency-red.png" alt="C" className="w-4 h-4 object-contain" />
                                </span>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block">
                                    选择接收角色
                                </label>
                                {characters.length > 0 ? (
                                    <div className="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                                        {characters.map(char => (
                                            <button
                                                key={char.name}
                                                onClick={() => onSelectCharacter(char.name)}
                                                className={`w-full flex items-center justify-between p-3 rounded border transition-all ${
                                                    selectedCharacter === char.name
                                                        ? 'bg-yellow-600/20 border-yellow-500/50 text-white'
                                                        : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-black/40 flex items-center justify-center">
                                                        <UserIcon size={16} />
                                                    </div>
                                                    <div className="flex flex-col items-start">
                                                        <span className="font-bold text-sm">{char.name}</span>
                                                        <span className="text-[10px] opacity-60">Level {char.level}</span>
                                                    </div>
                                                </div>
                                                {selectedCharacter === char.name && <Check size={16} className="text-yellow-500" />}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-red-400 text-sm bg-red-500/10 rounded border border-red-500/20">
                                        未找到角色，请先在游戏中创建角色。
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="flex flex-col items-center justify-center py-8 gap-4">
                            <Loader2 className="animate-spin text-yellow-500" size={48} />
                            <span className="text-gray-300 text-sm animate-pulse">正在处理交易...</span>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="flex flex-col items-center justify-center py-6 gap-4 text-center">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mb-2">
                                <Check size={32} />
                            </div>
                            <h3 className="text-white font-bold text-lg">购买成功!</h3>
                            <p className="text-gray-400 text-sm">{message}</p>
                        </div>
                    )}

                    {step === 'error' && (
                        <div className="flex flex-col items-center justify-center py-6 gap-4 text-center">
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mb-2">
                                <AlertCircle size={32} />
                            </div>
                            <h3 className="text-white font-bold text-lg">购买失败</h3>
                            <p className="text-gray-400 text-sm">{message}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {step !== 'processing' && (
                    <div className="p-4 bg-black/20 border-t border-white/5 flex justify-end gap-3">
                        {step === 'select' ? (
                            <>
                                <button 
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
                                >
                                    取消
                                </button>
                                <button 
                                    onClick={onConfirm}
                                    disabled={!selectedCharacter}
                                    className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-lg shadow-lg shadow-yellow-900/20 transition-all active:scale-95 text-sm"
                                >
                                    确认支付
                                </button>
                            </>
                        ) : (
                            <button 
                                onClick={onClose}
                                className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-colors text-sm"
                            >
                                关闭
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const CartSidebar = ({ 
    cart, 
    onUpdateQuantity, 
    onRemove, 
    onClose,
    onCheckout,
    total 
}: { 
    cart: CartItem[], 
    onUpdateQuantity: (id: number, delta: number) => void,
    onRemove: (id: number) => void,
    onClose: () => void,
    onCheckout: () => void,
    total: number
}) => {
    return (
        <div className="sticky top-0 z-30 animate-in slide-in-from-left duration-300">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                    <h3 className="text-white font-bold uppercase tracking-wider flex items-center gap-2 text-sm">
                        <ShoppingCart size={16} className="text-yellow-500" />
                        购物车 ({cart.reduce((a, b) => a + b.quantity, 0)})
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-white/5"
                        title="关闭购物车"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Cart Items List */}
                <div className={`space-y-3 mb-4 overflow-y-auto pr-1 custom-scrollbar ${cart.length > 5 ? 'max-h-[400px]' : ''}`}>
                    {cart.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 text-xs">
                            购物车是空的
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.id} className="bg-black/20 p-2.5 rounded border border-white/5 group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs text-gray-200 font-medium line-clamp-1">{item.name}</span>
                                    <button 
                                        onClick={() => onRemove(item.id)}
                                        className="text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <div className="text-xs text-yellow-500 font-mono font-bold flex items-center gap-1">
                                        {item.price * item.quantity}
                                        <img src="/images/currency-red.png" alt="C" className="w-3 h-3 object-contain" />
                                    </div>
                                    
                                    {!item.isUnique ? (
                                        <div className="flex items-center space-x-1 bg-white/5 rounded px-1 border border-white/5">
                                            <button 
                                                onClick={() => onUpdateQuantity(item.id, -1)}
                                                className="text-gray-400 hover:text-white p-0.5"
                                            >
                                                <Minus size={10} />
                                            </button>
                                            <span className="text-[10px] text-white w-4 text-center font-mono">{item.quantity}</span>
                                            <button 
                                                onClick={() => onUpdateQuantity(item.id, 1)}
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
                        ))
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="pt-3 border-t border-white/10 space-y-3">
                        <div className="flex justify-between items-center text-sm font-bold">
                            <span className="text-gray-400 text-xs">总计:</span>
                            <span className="text-yellow-500 text-base flex items-center gap-1">
                                {total}
                                <img src="/images/currency-red.png" alt="C" className="w-4 h-4 object-contain" />
                            </span>
                        </div>

                        <button 
                            className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 text-black text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-yellow-900/20 rounded-md"
                            onClick={onCheckout}
                        >
                            去结算
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const StorePage = ({ user }: { user: User | null }) => {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Checkout State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [checkoutStep, setCheckoutStep] = useState<'select' | 'processing' | 'success' | 'error'>('select');
  const [checkoutMessage, setCheckoutMessage] = useState('');
  
  // Recharge Modal
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await shopService.getShopItems();
        setItems(data);
      } catch (error) {
        console.error("Failed to fetch shop items", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchItems();
  }, []);

  // Filter Logic
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesCategory = activeCategory === '全部' || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [items, activeCategory, searchQuery]);

  const categories = useMemo(() => {
    return ['全部', ...Array.from(new Set(items.map(item => item.category)))];
  }, [items]);

  // Cart Logic
  const addToCart = (item: ShopItem) => {
    setCart(prev => {
        const existing = prev.find(i => i.id === item.id);
        if (existing) {
            if (item.isUnique) return prev; // Cannot add more of unique item
            return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
        }
        return [...prev, { ...item, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(i => i.id !== id));
    if (cart.length <= 1) setIsCartOpen(false); 
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(i => {
        if (i.id === id) {
            const newQ = i.quantity + delta;
            return newQ > 0 ? { ...i, quantity: newQ } : i;
        }
        return i;
    }));
  };

  const cartTotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);

  // Checkout Logic
  const handleCheckout = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        alert("请先登录");
        return;
    }
    
    setCheckoutStep('select');
    setCheckoutMessage('');
    setIsCheckoutOpen(true);
    
    try {
        const chars = await shopService.getMyCharacters(token);
        setCharacters(chars);
        if (chars.length > 0) setSelectedCharacter(chars[0].name);
    } catch (e) {
        console.error(e);
        setCheckoutStep('error');
        setCheckoutMessage("获取角色列表失败，请稍后重试。");
    }
  };

  const confirmPurchase = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token || !selectedCharacter) return;
    
    setCheckoutStep('processing');
    
    try {
        const itemsToBuy = cart.map(i => ({ itemId: i.id, quantity: i.quantity }));
        const result = await shopService.purchaseBulk(token, itemsToBuy, selectedCharacter);
        
        setCheckoutStep('success');
        setCheckoutMessage(result.message || "购买成功！物品将发送到您的邮箱。");
        setCart([]); // Clear cart
    } catch (e: any) {
        setCheckoutStep('error');
        setCheckoutMessage(e.message || "购买失败，请检查余额或联系客服。");
    }
  };

  const closeCheckout = () => {
      setIsCheckoutOpen(false);
      // Reset if closed after success
      if (checkoutStep === 'success') {
          setIsCartOpen(false);
      }
  };

  if (isLoading) {
      return (
          <div className="flex flex-col items-center justify-center h-full">
              <div className="relative z-10 flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-8"></div>
                </div>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full relative">
        <RechargeModal 
            isOpen={isRechargeModalOpen}
            onClose={() => setIsRechargeModalOpen(false)}
        />
        <CheckoutModal 
            isOpen={isCheckoutOpen}
            onClose={closeCheckout}
            characters={characters}
            selectedCharacter={selectedCharacter}
            onSelectCharacter={setSelectedCharacter}
            onConfirm={confirmPurchase}
            step={checkoutStep}
            message={checkoutMessage}
            totalPrice={cartTotal}
        />

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center pb-6 mb-6 border-b border-white/5 shrink-0">
            <div>
                <h1 className="text-2xl font-extrabold text-white uppercase tracking-[0.1em] flex items-center gap-3">
                    <ShoppingCart className="h-6 w-6 text-yellow-500" />
                    <span className="bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                        时光商店
                    </span>
                </h1>
            </div>
            
            {/* Balance Card & Cart Toggle */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-4 bg-[#1a1a1a] border border-white/10 rounded-full py-1.5 px-4 shadow-md">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">当前余额:</span>
                        <span className="text-lg font-bold text-white">{user?.points || 0}</span>
                        <img src="/images/currency-red.png" alt="Crystal" className="w-5 h-5 object-contain" />
                    </div>
                    <div className="h-4 w-px bg-white/10"></div>
                    <button 
                        onClick={() => setIsRechargeModalOpen(true)}
                        className="text-xs font-bold text-yellow-500 hover:text-white uppercase tracking-wider transition-colors"
                    >
                        充值
                    </button>
                </div>

                {/* Cart Toggle Button (Visible when sidebar is not showing cart) */}
                {!isCartOpen && cart.length > 0 && (
                     <button 
                        onClick={() => setIsCartOpen(true)}
                        className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
                     >
                         <ShoppingCart size={20} className="text-gray-300" />
                         <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-[#1a1a1a]">
                             {cart.reduce((a, b) => a + b.quantity, 0)}
                         </span>
                     </button>
                )}
            </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 gap-8 overflow-hidden min-h-0">
            {/* Left Sidebar (Filters or Cart) */}
            <div className="w-64 flex-shrink-0 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
                {/* Search is always visible */}
                <div className="relative w-full group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-3.5 w-3.5 text-gray-500 group-focus-within:text-yellow-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="搜索商品..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-9 pr-3 py-1.5 border border-white/10 rounded-lg bg-[#1a1a1a] text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50 focus:bg-[#212121] text-xs transition-all shadow-md"
                    />
                </div>

                {/* Conditional Sidebar Content */}
                {isCartOpen ? (
                    <CartSidebar 
                        cart={cart}
                        onUpdateQuantity={updateQuantity}
                        onRemove={removeFromCart}
                        onClose={() => setIsCartOpen(false)}
                        onCheckout={handleCheckout}
                        total={cartTotal}
                    />
                ) : (
                    <div className="space-y-6 animate-in slide-in-from-left duration-300">
                        {/* Categories */}
                        <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-5 shadow-lg">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Filter className="h-4 w-4 text-yellow-500" />
                                商品分类
                            </h3>
                            <div className="space-y-1">
                                {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-all flex items-center justify-between group ${
                                    activeCategory === cat 
                                    ? 'bg-yellow-600/20 text-yellow-500 border border-yellow-600/30' 
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    {cat}
                                    {activeCategory === cat && <ChevronRight className="h-3 w-3" />}
                                </button>
                                ))}
                            </div>
                        </div>

                        {/* Promo Box */}
                        <div className="bg-gradient-to-br from-yellow-900/20 to-[#212121] border border-yellow-500/20 rounded-lg p-5 shadow-lg">
                            <h3 className="text-yellow-500 font-bold mb-2 text-sm">需要帮助?</h3>
                            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                                购买过程中遇到问题？请联系我们的支持团队获取帮助。
                            </p>
                            <button className="text-xs font-bold text-white underline hover:text-yellow-500">
                                联系客服
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
                <div className="grid grid-cols-3 gap-6">
                    {filteredItems.map(item => (
                        <div key={item.id} className="h-full">
                            <ShopCard item={item} onAddToCart={addToCart} />
                        </div>
                    ))}
                </div>
                
                {filteredItems.length === 0 && (
                    <div className="text-center py-20 text-gray-500 flex flex-col items-center">
                        <Search size={48} className="mb-4 opacity-20" />
                        <p>没有找到符合条件的商品</p>
                    </div>
                )}
            </div>
        </div>

        {/* Mobile Cart Trigger (Visible if cart has items but sidebar is closed) */}
        {!isCartOpen && cart.length > 0 && (
            <div className="absolute bottom-6 right-6 z-50 lg:hidden">
                <button 
                    onClick={() => setIsCartOpen(true)}
                    className="bg-yellow-600 text-black p-4 rounded-full shadow-2xl border-2 border-white/10 relative hover:scale-110 transition-transform"
                >
                    <ShoppingCart size={24} />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border border-[#1a1a1a]">
                        {cart.reduce((a, b) => a + b.quantity, 0)}
                    </span>
                </button>
            </div>
        )}
    </div>
  );
};

export default StorePage;