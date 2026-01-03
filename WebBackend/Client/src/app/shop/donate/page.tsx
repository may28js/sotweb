'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Check, CreditCard, Loader2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import TimeFragment from '@/components/TimeFragment';

// Mock donate options based on extracted data
const DONATE_OPTIONS = [
  { id: 1, amount: 100, price: 10.00, image: '/demo-assets/store/gold-crate.webp', bonus: 0 },
  { id: 2, amount: 200, price: 20.00, image: '/demo-assets/store/gold-crate.webp', bonus: 0 },
  { id: 3, amount: 300, price: 30.00, image: '/demo-assets/store/gold-crate.webp', bonus: 10 },
  { id: 4, amount: 400, price: 40.00, image: '/demo-assets/store/gold-crate.webp', bonus: 20 },
  { id: 5, amount: 500, price: 50.00, image: '/demo-assets/store/gold-crate.webp', bonus: 50 },
  { id: 6, amount: 999, price: 99.99, image: '/demo-assets/store/gold-crate.webp', bonus: 100 },
];

export default function DonatePage() {
  const router = useRouter();
  const { user, isLoading, updatePoints } = useAuth();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Protect the route
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const handleNavClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    router.push(path);
  };

  const [isProcessing, setIsProcessing] = useState(false);

  const handleDonate = async () => {
    if (!selectedOption) return;
    const option = DONATE_OPTIONS.find(o => o.id === selectedOption);
    if (!option) return;

    setIsProcessing(true);
    setErrorMsg(null);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/Store/donate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
            amount: option.amount,
            bonus: option.bonus,
            price: option.price
        })
      });

      const data = await res.json();

      if (res.ok) {
        if (data.newBalance !== undefined) {
            updatePoints(data.newBalance);
        }
        alert(`成功购买 ${option.amount} 时光碎片!`);
        router.push('/shop');
      } else {
        setErrorMsg(data.message || '购买失败');
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('网络发生错误');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedItem = DONATE_OPTIONS.find(opt => opt.id === selectedOption);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#121212] relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
          style={{ backgroundImage: "url('/demo-assets/general-page-bg.avif')" }}
        ></div>
      </div>

      <div className="relative z-10 flex-grow pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-white mb-8">购买时光碎片</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Options Grid */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DONATE_OPTIONS.map((option) => (
                <div 
                  key={option.id}
                  onClick={() => setSelectedOption(option.id)}
                  className={`
                    relative cursor-pointer group rounded-lg overflow-hidden border transition-all duration-300
                    ${selectedOption === option.id 
                      ? 'bg-[#2a2a2a] border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]' 
                      : 'bg-[#1a1a1a] border-white/10 hover:border-white/30'}
                  `}
                >
                  <div className="p-4 flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-md overflow-hidden bg-black/50 flex-shrink-0">
                      <Image
                        src={option.image}
                        alt={`${option.amount} 时光碎片`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-white font-bold text-lg">{option.amount} 时光碎片</h3>
                          {option.bonus > 0 && (
                            <span className="text-xs text-green-400 font-medium">+{option.bonus} 赠送</span>
                          )}
                        </div>
                        <span className="text-yellow-500 font-bold">€{option.price.toFixed(2)}</span>
                      </div>
                    </div>
                    {selectedOption === option.id && (
                      <div className="absolute top-2 right-2 text-yellow-500">
                        <Check className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary & Payment */}
            <div className="lg:col-span-1">
              <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6 sticky top-24">
                <h2 className="text-xl font-bold text-white mb-6">订单详情</h2>
                
                {selectedItem ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center pb-4 border-b border-white/10">
                      <span className="text-gray-400">商品</span>
                      <TimeFragment value={selectedItem.amount} showName iconSize={16} textClassName="text-white" />
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-white/10">
                      <span className="text-gray-400">价格</span>
                      <span className="text-white">€{selectedItem.price.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xl font-bold">
                      <span className="text-white">总计</span>
                      <span className="text-yellow-500">€{selectedItem.price.toFixed(2)}</span>
                    </div>

                    <div className="space-y-4 pt-4">
                      <label className="block text-sm font-medium text-gray-400">支付方式</label>
                      <div className="grid grid-cols-1 gap-3">
                        <button className="flex items-center justify-center gap-3 p-3 rounded bg-[#2a2a2a] border border-white/10 hover:border-yellow-500 hover:bg-[#333] transition-all text-white">
                          <CreditCard className="w-5 h-5" />
                          <span>信用卡 / Stripe</span>
                        </button>
                        {/* Add more payment methods here */}
                      </div>
                    </div>

                    <button 
                      onClick={handleDonate}
                      disabled={isProcessing}
                      className="w-full bg-[#FFD700] hover:bg-yellow-400 text-black font-bold py-3 px-6 rounded transition-colors mt-4 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isProcessing ? (
                        <span className="flex items-center justify-center gap-2">
                            <Loader2 className="animate-spin w-5 h-5" /> 处理中...
                        </span>
                      ) : (
                        "前往支付"
                      )}
                    </button>
                    {errorMsg && (
                        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-sm text-center">
                            {errorMsg}
                        </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    请选择充值礼包以继续
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
