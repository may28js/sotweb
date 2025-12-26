
import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Coins, 
  Search, 
  Filter, 
  Plus, 
  Minus, 
  X, 
  CreditCard, 
  CheckCircle,
  QrCode,
  Wallet,
  Zap,
  User
} from 'lucide-react';
import { SHOP_ITEMS, USER_CHARACTERS } from '../constants';
import { ShopCategory, ShopItem, CartItem, GameCharacter, PaymentMethod } from '../types';

const ShopSection: React.FC = () => {
  // State
  const [balance, setBalance] = useState(2500); // Mock initial balance
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedChar, setSelectedChar] = useState<GameCharacter>(USER_CHARACTERS[0]);
  const [activeCategory, setActiveCategory] = useState<ShopCategory | 'all'>('all');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Top Up State
  const [topUpAmount, setTopUpAmount] = useState<number | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // --- Logic Helpers ---

  const addToCart = (item: ShopItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQ = i.quantity + delta;
        return newQ > 0 ? { ...i, quantity: newQ } : i;
      }
      return i;
    }));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = () => {
    if (balance >= cartTotal) {
      if(window.confirm(`确认购买这些物品并发送给角色 [${selectedChar.name}] 吗?`)) {
          setBalance(prev => prev - cartTotal);
          setCart([]);
          setIsCartOpen(false);
          alert('购买成功！物品已发送至游戏内邮箱。');
          // In real app: POST /api/shop/checkout { charId: selectedChar.guid, items: cart }
      }
    } else {
      alert('余额不足，请先充值！');
      setIsTopUpOpen(true);
    }
  };

  const handleTopUp = () => {
    if (!topUpAmount || !selectedPayment) return;
    
    setIsProcessingPayment(true);
    
    // Simulate API Call & Payment Gateway
    setTimeout(() => {
        setIsProcessingPayment(false);
        setPaymentSuccess(true);
        // After 2 seconds of success screen, close and add funds
        setTimeout(() => {
            setBalance(prev => prev + topUpAmount);
            setPaymentSuccess(false);
            setIsTopUpOpen(false);
            setTopUpAmount(null);
            setSelectedPayment(null);
        }, 2000);
    }, 2000);
  };

  // Filter Items
  const filteredItems = SHOP_ITEMS.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f0518]/95 backdrop-blur-sm relative overflow-hidden">
      
      {/* --- Shop Header --- */}
      <div className="h-20 border-b border-[#4c3a6e]/40 px-8 flex items-center justify-between bg-[#161026]/80 flex-shrink-0 z-20">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
             <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
                时光商店
             </h2>
             <span className="text-xs text-purple-300">The Time Store</span>
          </div>
          
          {/* Character Selector */}
          <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">
             <User size={14} className="text-slate-400" />
             <span className="text-xs text-slate-400">收货角色:</span>
             <select 
               value={selectedChar.guid}
               onChange={(e) => {
                   const char = USER_CHARACTERS.find(c => c.guid === Number(e.target.value));
                   if(char) setSelectedChar(char);
               }}
               className="bg-transparent text-amber-400 font-bold text-sm outline-none cursor-pointer"
             >
                {USER_CHARACTERS.map(c => (
                    <option key={c.guid} value={c.guid} className="bg-[#1e1b2e]">{c.name} (Lv.{c.level} {c.class})</option>
                ))}
             </select>
          </div>
        </div>

        <div className="flex items-center gap-6">
           {/* Balance */}
           <div className="flex items-center gap-3 bg-[#1e1b2e] px-4 py-2 rounded-full border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
              <Coins className="text-amber-400 fill-amber-400" size={18} />
              <span className="text-xl font-bold text-white tracking-wider">{balance.toLocaleString()}</span>
              <button 
                onClick={() => setIsTopUpOpen(true)}
                className="ml-2 w-6 h-6 rounded-full bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center transition-colors"
              >
                  <Plus size={14} />
              </button>
           </div>

           {/* Cart Trigger */}
           <button 
             onClick={() => setIsCartOpen(true)}
             className="relative p-3 rounded-full hover:bg-white/10 transition-colors group"
           >
              <ShoppingCart size={24} className={`text-slate-300 group-hover:text-white transition-colors ${cart.length > 0 ? 'fill-current' : ''}`} />
              {cart.length > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-[#0f0518]">
                      {cart.reduce((acc, i) => acc + i.quantity, 0)}
                  </span>
              )}
           </button>
        </div>
      </div>

      {/* --- Main Content --- */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar Filters */}
        <div className="w-64 bg-[#1e1b2e]/50 border-r border-white/5 p-6 flex flex-col gap-6">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                <input 
                  type="text" 
                  placeholder="搜索商品..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-full py-2 pl-9 pr-4 text-sm text-white focus:border-amber-500/50 outline-none transition-colors"
                />
            </div>

            <div className="space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">分类</div>
                {[
                    { id: 'all', label: '全部商品', icon: Filter },
                    { id: 'mounts', label: '稀有坐骑', icon: Zap },
                    { id: 'pets', label: '战斗宠物', icon: Zap },
                    { id: 'services', label: '角色服务', icon: Zap },
                    { id: 'cosmetics', label: '幻化与玩具', icon: Zap },
                ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id as any)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          activeCategory === cat.id 
                          ? 'bg-gradient-to-r from-purple-900/80 to-indigo-900/80 text-white border border-purple-500/30 shadow-lg' 
                          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                      }`}
                    >
                        {activeCategory === cat.id && <div className="w-1 h-4 bg-amber-400 rounded-full"></div>}
                        <span className="font-medium">{cat.label}</span>
                    </button>
                ))}
            </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map(item => (
                    <div key={item.id} className="group bg-[#1e1b2e] rounded-xl overflow-hidden border border-white/5 hover:border-amber-500/50 transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] flex flex-col">
                        <div className="relative h-40 overflow-hidden bg-black/40">
                            {/* Fallback image placeholder if url fails */}
                            <div className="absolute inset-0 flex items-center justify-center text-slate-700">
                                <Zap size={32} />
                            </div>
                            <img src={item.imageUrl} alt={item.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            {item.isHot && <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg">热销</span>}
                            {item.isNew && <span className="absolute top-2 left-2 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg">新品</span>}
                        </div>
                        <div className="p-4 flex flex-col flex-1">
                            <h3 className="font-bold text-slate-100 mb-1 group-hover:text-amber-200 transition-colors">{item.name}</h3>
                            <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1">{item.description}</p>
                            <div className="flex items-center justify-between mt-auto">
                                <div className="flex items-center gap-1.5 text-amber-400 font-bold font-mono text-lg">
                                    <Coins size={16} />
                                    {item.price}
                                </div>
                                <button 
                                  onClick={() => addToCart(item)}
                                  className="p-2 rounded-lg bg-[#2d2842] text-slate-300 hover:bg-amber-600 hover:text-white transition-all shadow-lg active:scale-95"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </div>

      {/* --- Shopping Cart Drawer --- */}
      <div className={`absolute top-0 right-0 h-full w-96 bg-[#161026] border-l border-[#4c3a6e] shadow-2xl z-30 transform transition-transform duration-300 flex flex-col ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><ShoppingCart className="text-amber-400" /> 购物车</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                      <ShoppingCart size={48} className="opacity-20" />
                      <p>购物车是空的</p>
                  </div>
              ) : (
                  cart.map(item => (
                      <div key={item.id} className="bg-[#1e1b2e] p-3 rounded-lg border border-white/5 flex gap-3">
                          <img src={item.imageUrl} className="w-12 h-12 rounded bg-black/50 object-cover" alt="" />
                          <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                  <h4 className="font-bold text-sm text-slate-200">{item.name}</h4>
                                  <button onClick={() => removeFromCart(item.id)} className="text-slate-600 hover:text-red-400"><X size={14}/></button>
                              </div>
                              <div className="flex items-center justify-between">
                                  <span className="text-amber-400 text-xs font-mono flex items-center gap-1"><Coins size={10} /> {item.price * item.quantity}</span>
                                  <div className="flex items-center gap-2 bg-black/30 rounded px-1">
                                      <button onClick={() => updateQuantity(item.id, -1)} className="p-0.5 text-slate-400 hover:text-white"><Minus size={12} /></button>
                                      <span className="text-xs w-4 text-center">{item.quantity}</span>
                                      <button onClick={() => updateQuantity(item.id, 1)} className="p-0.5 text-slate-400 hover:text-white"><Plus size={12} /></button>
                                  </div>
                              </div>
                          </div>
                      </div>
                  ))
              )}
          </div>

          <div className="p-6 bg-[#1e1b2e] border-t border-white/10">
              <div className="flex justify-between items-center mb-4 text-sm">
                  <span className="text-slate-400">总计:</span>
                  <span className="text-xl font-bold text-amber-400 flex items-center gap-1"><Coins size={18} fill="currentColor" /> {cartTotal}</span>
              </div>
              <button 
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold hover:shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  确认支付
              </button>
          </div>
      </div>
      
      {/* Overlay for Cart */}
      {isCartOpen && <div className="absolute inset-0 bg-black/50 z-20 backdrop-blur-[2px]" onClick={() => setIsCartOpen(false)}></div>}

      {/* --- Top Up Modal --- */}
      {isTopUpOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-[#161026] w-full max-w-2xl rounded-2xl border border-[#4c3a6e] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  
                  {/* Modal Header */}
                  <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-[#1e1b2e] to-[#2d1b4e]">
                      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                          <Wallet className="text-cyan-400" /> 充值中心
                      </h2>
                      <button onClick={() => setIsTopUpOpen(false)} className="text-slate-400 hover:text-white"><X /></button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-8 flex-1 overflow-y-auto">
                      
                      {!paymentSuccess ? (
                          <>
                            {/* Step 1: Select Amount */}
                            <h3 className="text-slate-300 mb-4 font-bold flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-cyan-900 text-cyan-300 flex items-center justify-center text-xs">1</div> 选择充值金额</h3>
                            <div className="grid grid-cols-3 gap-4 mb-8">
                                {[1000, 3000, 5000, 10000, 30000, 50000].map(amt => (
                                    <button
                                      key={amt}
                                      onClick={() => setTopUpAmount(amt)}
                                      className={`relative p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                                          topUpAmount === amt 
                                          ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                                          : 'bg-[#1e1b2e] border-white/5 hover:bg-white/5 hover:border-white/20'
                                      }`}
                                    >
                                        <Coins size={28} className={topUpAmount === amt ? 'text-amber-400 fill-amber-400' : 'text-slate-500'} />
                                        <span className={`text-lg font-bold font-mono ${topUpAmount === amt ? 'text-amber-100' : 'text-slate-300'}`}>{amt}</span>
                                        <span className="text-xs text-slate-500">¥ {amt / 100}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Step 2: Select Method */}
                            <h3 className="text-slate-300 mb-4 font-bold flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-cyan-900 text-cyan-300 flex items-center justify-center text-xs">2</div> 选择支付方式</h3>
                            <div className="grid grid-cols-3 gap-4 mb-8">
                                <button 
                                  onClick={() => setSelectedPayment(PaymentMethod.ALIPAY)}
                                  className={`p-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${selectedPayment === PaymentMethod.ALIPAY ? 'bg-[#1677ff]/20 border-[#1677ff] text-[#1677ff]' : 'bg-[#1e1b2e] border-white/5 text-slate-400'}`}
                                >
                                    <span className="font-bold">支付宝</span>
                                </button>
                                <button 
                                  onClick={() => setSelectedPayment(PaymentMethod.WECHAT)}
                                  className={`p-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${selectedPayment === PaymentMethod.WECHAT ? 'bg-[#07c160]/20 border-[#07c160] text-[#07c160]' : 'bg-[#1e1b2e] border-white/5 text-slate-400'}`}
                                >
                                    <span className="font-bold">微信支付</span>
                                </button>
                                <button 
                                  onClick={() => setSelectedPayment(PaymentMethod.PAYPAL)}
                                  className={`p-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${selectedPayment === PaymentMethod.PAYPAL ? 'bg-[#003087]/20 border-[#003087] text-[#003087]' : 'bg-[#1e1b2e] border-white/5 text-slate-400'}`}
                                >
                                    <span className="font-bold">PayPal</span>
                                </button>
                            </div>

                            {/* Action */}
                            <button 
                                onClick={handleTopUp}
                                disabled={!topUpAmount || !selectedPayment || isProcessingPayment}
                                className="w-full py-4 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isProcessingPayment ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>正在处理...</span>
                                    </>
                                ) : (
                                    <>
                                        <CreditCard size={20} />
                                        <span>立即支付 ¥ {(topUpAmount || 0) / 100}</span>
                                    </>
                                )}
                            </button>
                          </>
                      ) : (
                          // Success State
                          <div className="flex flex-col items-center justify-center py-10 animate-in fade-in zoom-in duration-300">
                              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                                  <CheckCircle size={48} className="text-green-500" />
                              </div>
                              <h3 className="text-2xl font-bold text-white mb-2">充值成功!</h3>
                              <p className="text-slate-400">您的 {topUpAmount} 时光币已到账。</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default ShopSection;
