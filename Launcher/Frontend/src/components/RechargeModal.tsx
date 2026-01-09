import { useState } from 'react';
import { Check, Loader2, Wallet, X } from 'lucide-react';
import { shopService } from '../services/api';

// Mock donate options based on extracted data
const DONATE_OPTIONS = [
  { id: 1, amount: 100, price: 10.00, image: '/images/gold-crate.webp', bonus: 0 },
  { id: 2, amount: 200, price: 20.00, image: '/images/gold-crate.webp', bonus: 0 },
  { id: 3, amount: 300, price: 30.00, image: '/images/gold-crate.webp', bonus: 10 },
  { id: 4, amount: 400, price: 40.00, image: '/images/gold-crate.webp', bonus: 20 },
  { id: 5, amount: 500, price: 50.00, image: '/images/gold-crate.webp', bonus: 50 },
  { id: 6, amount: 999, price: 99.99, image: '/images/gold-crate.webp', bonus: 100 },
];

export const RechargeModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDonate = async () => {
    if (!selectedOption) return;
    const option = DONATE_OPTIONS.find(o => o.id === selectedOption);
    if (!option) return;

    setIsProcessing(true);
    setErrorMsg(null);
    
    try {
      const token = localStorage.getItem('auth_token'); // Use 'auth_token' as per StorePage
      if (!token) {
          setErrorMsg("请先登录");
          setIsProcessing(false);
          return;
      }

      const data = await shopService.recharge(token, option.price);

      if (data.payLink) {
          // Open payment link in default browser
          // For electron/launcher, window.open might open a new window or use shell.openExternal
          // Since this is a web preview, window.open is fine.
          // Ideally use a bridge for launcher, but window.open usually works.
          window.open(data.payLink, '_blank');
          onClose();
      } else {
          setErrorMsg('未获取到支付链接');
      }
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || '网络发生错误');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedItem = DONATE_OPTIONS.find(opt => opt.id === selectedOption);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-[900px] h-[600px] bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col relative">
         {/* Close Button */}
         <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-50"
         >
            <X size={24} />
         </button>

         <div className="flex h-full">
            {/* Left Side: Options */}
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-[#121212]">
                <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <img src="/images/currency-red.png" className="w-8 h-8" alt="" />
                    购买时光碎片
                </h1>
                
                <div className="grid grid-cols-2 gap-4">
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
                        <div className="relative w-12 h-12 rounded-md overflow-hidden bg-black/50 flex-shrink-0 flex items-center justify-center">
                          {/* Placeholder image if file not found */}
                          <img
                            src={option.image}
                            alt={`${option.amount}`}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = "/images/currency-red.png";
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col">
                              <h3 className="text-white font-bold text-base">{option.amount} 碎片</h3>
                              <span className="text-yellow-500 font-bold text-sm">€{option.price.toFixed(2)}</span>
                          </div>
                        </div>
                        {selectedOption === option.id && (
                          <div className="text-yellow-500">
                            <Check className="w-5 h-5" />
                          </div>
                        )}
                        
                         {option.bonus > 0 && (
                            <div className="absolute top-0 right-0 bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded-bl font-bold">
                                +{option.bonus}
                            </div>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
            </div>

            {/* Right Side: Summary */}
            <div className="w-[300px] bg-[#1a1a1a] border-l border-white/10 p-6 flex flex-col">
                <h2 className="text-xl font-bold text-white mb-6">订单详情</h2>
                
                {selectedItem ? (
                  <div className="space-y-6 flex-1 flex flex-col">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b border-white/10">
                        <span className="text-gray-400 text-sm">商品</span>
                        <div className="flex items-center gap-1 text-white font-bold">
                            {selectedItem.amount}
                            <img src="/images/currency-red.png" className="w-4 h-4" alt="" />
                        </div>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b border-white/10">
                        <span className="text-gray-400 text-sm">价格</span>
                        <span className="text-white font-bold">€{selectedItem.price.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-xl font-bold">
                        <span className="text-white">总计</span>
                        <span className="text-yellow-500">€{selectedItem.price.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 mt-auto">
                      <label className="block text-sm font-medium text-gray-400">支付方式</label>
                      <div className="grid grid-cols-1 gap-3">
                        <button className="flex items-center justify-center gap-3 p-3 rounded bg-[#2a2a2a] border border-yellow-500 bg-yellow-500/10 text-white cursor-default">
                          <Wallet className="w-5 h-5 text-yellow-500" />
                          <span className="text-sm">加密货币 (Oxapay)</span>
                        </button>
                      </div>
                    </div>

                    <button 
                      onClick={handleDonate}
                      disabled={isProcessing}
                      className="w-full bg-[#FFD700] hover:bg-yellow-400 text-black font-bold py-3 px-6 rounded transition-colors mt-4 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                    >
                      {isProcessing ? (
                        <>
                            <Loader2 className="animate-spin w-5 h-5 mr-2" /> 处理中...
                        </>
                      ) : (
                        "前往支付"
                      )}
                    </button>
                    {errorMsg && (
                        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-xs text-center break-words">
                            {errorMsg}
                        </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-20 text-gray-500 text-sm flex-1 flex items-center justify-center">
                    请选择充值礼包以继续
                  </div>
                )}
            </div>
         </div>
      </div>
    </div>
  );
};
