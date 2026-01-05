'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, ChevronDown, User, Check, ShoppingCart, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { useCart } from '../../../../context/CartContext';
import api from '../../../../services/api';
import TimeFragment from '../../../../components/TimeFragment';

// Define interface for ShopItem
interface ShopItem {
  id: number;
  gameItemId: number;
  name: string;
  description: string;
  price: number;
  iconUrl: string;
  category: string;
  isUnique?: boolean;
}

// CartItem is managed by Context

export default function BuyPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading, updatePoints } = useAuth();
  const { cart, clearCart, cartTotal } = useCart();
  
  // State
  const [item, setItem] = useState<ShopItem | null>(null);
  // const [cart, setCart] = useState<CartItem[]>([]); // Use context cart
  const [characterName, setCharacterName] = useState('');
  const [characters, setCharacters] = useState<any[]>([]);
  
  // UI State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loadingChars, setLoadingChars] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Derive mode
  const rawId = params?.id;
  const idStr = Array.isArray(rawId) ? rawId[0] : rawId;
  const isCheckoutMode = idStr === 'checkout';

  // Helper maps for Race/Class IDs to names
  const RACE_MAP: {[key: number]: string} = {
    1: '人类', 2: '兽人', 3: '矮人', 4: '暗夜精灵', 5: '亡灵', 6: '牛头人', 7: '侏儒', 8: '巨魔', 10: '血精灵', 11: '德莱尼'
  };
  const CLASS_MAP: {[key: number]: string} = {
    1: '战士', 2: '圣骑士', 3: '猎人', 4: '潜行者', 5: '牧师', 6: '死亡骑士', 7: '萨满祭司', 8: '法师', 9: '术士', 11: '德鲁伊'
  };

  // Fetch characters
  useEffect(() => {
    if (user) {
        setLoadingChars(true);
        api.get('/store/my-characters')
            .then(res => {
                setCharacters(res.data);
            })
            .catch(err => console.error("Failed to load characters", err))
            .finally(() => setLoadingChars(false));
    }
  }, [user]);

  // Handle item/cart loading
  useEffect(() => {
    if (isCheckoutMode) {
        // Cart is handled by Context
    } else if (idStr) {
      const fetchItem = async () => {
        try {
          // Guard against 'checkout' being passed to API
          if (idStr === 'checkout') return;

          const res = await api.get(`/store/items/${idStr}`);
          setItem(res.data);
        } catch (err) {
          console.error('Failed to fetch item:', err);
          // Don't redirect immediately on error to avoid loops, just let user see error or empty state
          // router.push('/shop');
        }
      };
      fetchItem();
    }
  }, [idStr, router, isCheckoutMode]);

  // Protect the route
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Custom Nav Click Handler to avoid RSC errors
  const handleNavClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    router.push(path);
  };

  const selectedCharacter = characters.find(c => c.name === characterName);

  // Calculate total price
  const totalPrice = isCheckoutMode 
    ? cart.reduce((sum, cartItem) => sum + (cartItem.product.price * cartItem.quantity), 0)
    : (item?.price || 0);

  const handlePurchase = async () => {
    if ((!isCheckoutMode && !item) || !characterName) return;
    if (isCheckoutMode && cart.length === 0) return;
    
    setIsPurchasing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let res;
      if (isCheckoutMode) {
          res = await api.post('/store/purchase/bulk', {
              characterName: characterName,
              items: cart.map(c => ({ id: c.product.id, quantity: c.quantity }))
          });
          // Clear cart on success
          clearCart();
      } else {
          res = await api.post(`/store/purchase/${item!.id}?characterName=${encodeURIComponent(characterName)}`);
      }
      
      if (res.data.newBalance !== undefined) {
        updatePoints(res.data.newBalance);
      }
      
      setSuccessMsg(isCheckoutMode 
        ? `购买成功！${res.data.message || '物品已发送。'}` 
        : `购买成功！物品已发送给 ${characterName}。`
      );

      // Delay redirect to shop page
      setTimeout(() => {
        router.push('/shop');
      }, 2000);
    } catch (err: any) {
      console.error('Purchase failed:', err);
      let msg = '购买失败，请重试。';
      if (err.response?.data) {
          const data = err.response.data;
          if (typeof data === 'string') {
              msg = data;
          } else if (typeof data === 'object') {
              // Handle ASP.NET Core ProblemDetails or validation errors
              if (data.errors && typeof data.errors === 'object') {
                  // Extract first validation error
                  const firstErrorKey = Object.keys(data.errors)[0];
                  if (firstErrorKey && data.errors[firstErrorKey].length > 0) {
                      msg = data.errors[firstErrorKey][0];
                  } else {
                      msg = data.title || '发生验证错误';
                  }
              } else if (data.title) {
                  msg = data.title;
              } else if (data.message) {
                  msg = data.message;
              }
          }
      }
      setErrorMsg(msg);
    } finally {
      setIsPurchasing(false);
    }
  };

  if (isLoading || (!isCheckoutMode && !item)) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#121212] relative">
      {/* Background Image - Same as Shop Page */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
          style={{ backgroundImage: "url('/demo-assets/general-page-bg.avif')" }}
        ></div>
      </div>

      <div className="relative z-10 flex-grow pt-20">
        <div className="max-w-7xl mx-auto">
          <div className="container mx-auto px-4 py-8">
            <div className="gap-4 mb-8">
               <h1 className="text-3xl font-bold text-white">
                   {isCheckoutMode ? '购物车结算' : '购买物品'}
               </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Item Info or Cart List */}
              <div className="space-y-6">
                <div className="bg-[#1a1a1a] border border-white/10 rounded-md p-6">
                  {isCheckoutMode ? (
                      // Cart List View
                      <div className="space-y-4">
                          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                              <ShoppingCart /> 订单摘要
                          </h2>
                          {cart.length === 0 ? (
                              <div className="text-gray-400 py-4">您的购物车是空的。</div>
                          ) : (
                              <div className="flex flex-col gap-3">
                                  {cart.map((cartItem, idx) => (
                                      <div key={idx} className="relative flex gap-4 bg-white/5 p-4 rounded border border-white/5 items-center overflow-hidden">
                                          {/* Background Image with Mask */}
                                          <div className="absolute inset-0 z-0 opacity-40">
                                              <Image
                                                  src={cartItem.product.iconUrl || '/images/placeholder.jpg'}
                                                  alt=""
                                                  fill
                                                  className="object-none object-center"
                                              />
                                              {/* Gradient Mask: Transparent (top-left) to Background Color (bottom-right) */}
                                              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#1a1a1a]" />
                                          </div>

                                          <div className="relative z-10 w-16 h-16 rounded overflow-hidden bg-gray-700/50 flex-shrink-0 border border-white/10 shadow-sm">
                                              <Image
                                                  src={cartItem.product.iconUrl || '/images/placeholder.jpg'}
                                                  alt={cartItem.product.name}
                                                  fill
                                                  className="object-cover"
                                              />
                                          </div>
                                          <div className="relative z-10 flex-1">
                                              <div className="text-white font-medium text-base drop-shadow-md">{cartItem.product.name}</div>
                                              <div className="text-sm text-gray-400 mt-1 drop-shadow">{cartItem.product.category}</div>
                                          </div>
                                          <div className="relative z-10 flex flex-col items-end gap-1">
                                              <div className="text-yellow-500 font-bold text-base drop-shadow-md">
                                                  x{cartItem.quantity}
                                              </div>
                                              <div className="flex items-center text-sm text-gray-300 drop-shadow">
                                                  <TimeFragment value={cartItem.product.price * cartItem.quantity} iconSize={14} />
                                              </div>
                                          </div>
                                      </div>
                                  ))}
                                  
                                  <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                                      <span className="text-gray-300">物品总数:</span>
                                      <span className="text-white font-bold">{cart.reduce((a, b) => a + b.quantity, 0)}</span>
                                  </div>
                              </div>
                          )}
                      </div>
                  ) : (
                      // Single Item View
                      <>
                        <h2 className="text-2xl font-bold text-white mb-4">{item!.name}</h2>
                        
                        <div className="flex gap-4 mb-6">
                            <div className="relative w-24 h-24 rounded-md overflow-hidden bg-gray-700 flex-shrink-0">
                            <Image
                                src={item!.iconUrl || '/images/placeholder.jpg'}
                                alt={item!.name}
                                fill
                                className="object-cover"
                            />
                            </div>
                            <div className="flex-1">
                            <p className="text-gray-300 mb-4">{item!.description}</p>
                            <div className="flex items-center gap-2">
                                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">{item!.category}</span>
                                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">全服通用</span>
                            </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-md">
                            <TimeFragment iconSize={28} showName />
                            <span className="text-yellow-300 font-semibold">{item!.price}</span>
                            </div>
                        </div>
                      </>
                  )}
                  
                  {successMsg && (
                      <div className="mt-6 pt-6 border-t border-white/10 flex justify-center">
                          <Link 
                              href="/shop" 
                              className="flex items-center justify-center px-8 py-3 bg-[#FFD700] hover:bg-[#FFED4A] text-black font-bold uppercase tracking-wider rounded transition-all shadow-lg shadow-yellow-900/20 active:scale-[0.98]"
                          >
                              返回商店继续购物
                          </Link>
                      </div>
                  )}
                </div>
              </div>

              {/* Right Column: Purchase Options */}
              <div className="space-y-6">
                <div className="relative w-full rounded-md overflow-hidden border border-white/10 shadow-2xl bg-[#1a1a1a]" style={{ minHeight: '600px' }}>
                    {/* Background Image */}
                    <div className="absolute inset-0 z-0 pointer-events-none">
                        <Image 
                            src="/images/mailbox.webp" 
                            alt="Mailbox Background" 
                            fill 
                            className="object-cover opacity-80"
                        />
                        {/* Mask: Radial Gradient (Gold center, Dark edges) */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.15)_0%,rgba(26,26,26,0.95)_70%,rgba(26,26,26,1)_100%)]" />
                    </div>

                    {/* Content Container */}
                    <div className="relative z-10 p-6 h-full flex flex-col justify-between">
                        
                        {/* Top: Character Selection */}
                        <div className="shrink-0 space-y-2">
                            <label className="block text-white font-medium text-sm uppercase tracking-wider drop-shadow-md">选择角色</label>
                            {loadingChars ? (
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                    <Loader2 className="animate-spin w-4 h-4" /> 加载角色中...
                                </div>
                            ) : characters.length > 0 ? (
                                <div className="relative">
                                    {/* Custom Dropdown Trigger */}
                                    <div 
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="w-full bg-[#2a2a2a]/80 backdrop-blur-md border border-white/20 hover:border-yellow-500/50 text-white rounded-md cursor-pointer transition-all duration-200"
                                    >
                                        {characterName && selectedCharacter ? (
                                            <div className="p-3 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-600/20 to-yellow-900/20 border border-yellow-500/30 flex items-center justify-center text-yellow-500 shadow-inner">
                                                        <User size={20} />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <div className="font-medium text-yellow-100 truncate">{selectedCharacter.name}</div>
                                                        <div className="text-xs text-gray-400 flex items-center gap-1 truncate">
                                                            <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px]">Lv.{selectedCharacter.level}</span>
                                                            <span className="truncate">{RACE_MAP[selectedCharacter.race] || '未知'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <ChevronDown size={18} className={`text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                            </div>
                                        ) : (
                                            <div className="p-4 flex items-center justify-between text-gray-400">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                                        <User size={20} />
                                                    </div>
                                                    <span>请选择角色...</span>
                                                </div>
                                                <ChevronDown size={18} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Dropdown Menu */}
                                    {isDropdownOpen && (
                                        <div className="absolute top-full left-0 w-full mt-2 bg-[#2a2a2a] border border-white/10 rounded-md shadow-2xl z-50 max-h-60 overflow-y-auto overflow-x-hidden backdrop-blur-xl">
                                            {characters.map((char: any) => (
                                                <div 
                                                    key={char.name} 
                                                    onClick={() => {
                                                        setCharacterName(char.name);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className={`p-3 flex items-center justify-between cursor-pointer transition-colors border-b border-white/5 last:border-0 ${characterName === char.name ? 'bg-yellow-500/10' : 'hover:bg-white/5'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${characterName === char.name ? 'bg-yellow-500 text-black' : 'bg-white/10 text-gray-400'}`}>
                                                            {char.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className={`font-medium ${characterName === char.name ? 'text-yellow-500' : 'text-gray-200'}`}>
                                                                {char.name}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                Lv.{char.level} {RACE_MAP[char.race] || '未知'} {CLASS_MAP[char.class] || '未知'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {characterName === char.name && <Check size={16} className="text-yellow-500" />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {/* Backdrop */}
                                    {isDropdownOpen && (
                                        <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                                    )}
                                </div>
                            ) : (
                                <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded border border-red-500/20 backdrop-blur-sm">
                                    未找到角色，请先在游戏中创建角色。
                                </div>
                            )}
                            <p className="text-xs text-gray-400 pl-1 drop-shadow">物品将通过邮件发送给该角色。</p>
                        </div>

                        {/* Middle: Receipt / Item List */}
                        {!successMsg && (!isCheckoutMode || cart.length > 0) && (
                            <div className="flex-1 mx-2 my-4 bg-white/80 backdrop-blur-sm border-x-2 border-white/10 relative flex flex-col shadow-lg text-gray-800">
                                {/* Receipt Top Decoration */}
                                <div className="absolute -top-1 left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSI1Ij48cGF0aCBkPSJNTAgMCA1IDUgMTAgMHoiIGZpbGw9IiMxYTFhMWEiIGZpbGwtb3BhY2l0eT0iMSIvPjwvc3ZnPg==')] opacity-100"></div>
                                
                                {/* Receipt Content */}
                                <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-black/20 scrollbar-track-transparent">
                                    <div className="border-b border-dashed border-black/20 pb-2 mb-3 text-center">
                                        <div className="text-gray-900 font-bold text-sm tracking-widest uppercase">购物清单</div>
                                        <div className="text-gray-500 text-[10px] mt-1">{new Date().toLocaleString('zh-CN')}</div>
                                    </div>

                                    <div className="space-y-3 text-sm text-gray-700">
                                        {isCheckoutMode ? (
                                            cart.map((c, i) => (
                                                <div key={i} className="flex justify-between items-start group border-b border-dashed border-black/5 pb-2 last:border-0">
                                                    <span className="flex-1 truncate pr-2 text-gray-900 font-medium">{c.product.name}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-gray-500 text-xs">x{c.quantity}</span>
                                                        <span className="text-black font-bold w-12 text-right">{c.product.price * c.quantity}</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            item && (
                                                <div className="flex justify-between items-start border-b border-dashed border-black/5 pb-2 last:border-0">
                                                    <span className="flex-1 truncate pr-2 text-gray-900 font-medium">{item.name}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-gray-500 text-xs">x1</span>
                                                        <span className="text-black font-bold w-12 text-right">{item.price}</span>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>

                                {/* Receipt Footer / Total */}
                                <div className="p-4 bg-black/5 border-t border-dashed border-black/20">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500 text-xs uppercase tracking-widest font-bold">总计</span>
                                        <div className="flex items-center gap-1.5 text-black">
                                            <span className="text-2xl font-black tracking-tight">{totalPrice}</span>
                                            <TimeFragment iconSize={20} className="text-yellow-600" />
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Receipt Bottom Decoration */}
                                <div className="absolute -bottom-1 left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSI1Ij48cGF0aCBkPSJNTAgNSBMNSAwIEwxMCA1IiBmaWxsPSIjMWExYTFhIiBmaWxsLW9wYWNpdHk9IjEiLz48L3N2Zz4=')] opacity-100"></div>
                            </div>
                        )}

                        {/* Bottom: Action Area */}
                        <div className="shrink-0 space-y-4 pt-2">
                            {/* Success Message */}
                            {successMsg && (
                                <div className="p-4 bg-green-500/20 backdrop-blur-md border border-green-500/30 rounded-md flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 shadow-lg">
                                    <div className="flex items-center gap-3 text-green-400">
                                        <div className="p-1 bg-green-500/20 rounded-full">
                                            <Check size={18} />
                                        </div>
                                        <span className="text-sm font-medium">{successMsg}</span>
                                    </div>
                                </div>
                            )}

                            {/* Purchase Button */}
                            <button 
                                onClick={handlePurchase}
                                disabled={(user?.points || 0) < totalPrice || !characterName || isPurchasing || (isCheckoutMode && cart.length === 0)}
                                className="w-full bg-[#FFD700] hover:bg-[#FFED4A] disabled:bg-gray-600/50 text-black disabled:text-gray-400 font-bold text-lg py-4 rounded shadow-lg shadow-yellow-900/20 transition-all disabled:cursor-not-allowed uppercase tracking-wide flex items-center justify-center gap-2 active:scale-[0.98]"
                            >
                                {isPurchasing ? <Loader2 className="animate-spin w-5 h-5" /> : null}
                                {isPurchasing ? '处理中...' : '确认支付'}
                            </button>
                            
                            {errorMsg && (
                                <div className="text-red-300 text-sm text-center bg-red-900/40 backdrop-blur-sm p-2 rounded border border-red-500/20 shadow-lg">
                                    {errorMsg}
                                </div>
                            )}
                            
                            {(user?.points || 0) < totalPrice && (
                                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-md backdrop-blur-sm flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-2 text-red-400">
                                        <AlertCircle size={18} />
                                        <span className="font-medium text-sm">余额不足</span>
                                    </div>
                                    <div className="text-xs text-red-300/80 pl-6 -mt-1">
                                        当前余额不足以支付此订单，请先充值。
                                    </div>
                                    <Link 
                                        href="/shop/donate" 
                                        onClick={(e) => handleNavClick(e, '/shop/donate')}
                                        className="w-full flex items-center justify-center px-4 py-2 bg-green-600/90 hover:bg-green-500 text-white font-bold text-sm rounded transition-all shadow-lg shadow-green-900/20 active:scale-[0.98] uppercase tracking-wide gap-2"
                                    >
                                        立即充值
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
