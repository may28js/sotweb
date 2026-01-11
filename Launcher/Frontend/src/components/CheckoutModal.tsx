import { X, Check, AlertCircle, Loader2, User as UserIcon } from 'lucide-react';
import type { Character } from '../types';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    characters: Character[];
    selectedCharacter: string;
    onSelectCharacter: (name: string) => void;
    onConfirm: () => void;
    step: 'select' | 'processing' | 'success' | 'error';
    message: string;
    totalPrice: number;
}

export const CheckoutModal = ({ 
    isOpen, 
    onClose, 
    characters, 
    selectedCharacter, 
    onSelectCharacter, 
    onConfirm, 
    step, 
    message,
    totalPrice
}: CheckoutModalProps) => {
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
