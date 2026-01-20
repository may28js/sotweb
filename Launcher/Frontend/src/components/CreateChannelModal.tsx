import React, { useState } from 'react';
import { api } from '../lib/api';
import { X, Hash, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';

interface CreateChannelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
    categoryId?: number | null;
}

type ChannelType = 'Chat' | 'Forum';

const CreateChannelModal: React.FC<CreateChannelModalProps> = ({ isOpen, onClose, onCreated, categoryId }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<ChannelType>('Chat');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            console.log("Creating channel:", { name, type, description, categoryId });
            await api.post('/Community/channels', {
                Name: name,
                Type: type,
                Description: description,
                CategoryId: categoryId
            });
            onCreated();
            onClose();
            setName('');
            setDescription('');
            setType('Chat');
        } catch (err) {
            console.error("Failed to create channel", err);
            alert("创建频道失败");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-[440px] bg-[#313338] rounded-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 flex justify-between items-center border-b border-[#1e1f22]">
                    <h2 className="text-base font-bold text-white uppercase tracking-wide">
                        创建频道
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-200 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#B5BAC1] uppercase">
                                频道类型
                            </label>
                            <div className="space-y-2">
                                <label 
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded cursor-pointer border border-transparent hover:bg-[#393c41]",
                                        type === 'Chat' ? "bg-[#404249] border-[#5865f2]" : "bg-[#2b2d31]"
                                    )}
                                    onClick={() => setType('Chat')}
                                >
                                    <Hash size={24} className="text-[#B5BAC1]" />
                                    <div>
                                        <div className="font-medium text-gray-200">文字频道</div>
                                        <div className="text-xs text-gray-400">发送消息、图片、意见和玩笑。</div>
                                    </div>
                                    <input 
                                        type="radio" 
                                        name="channelType" 
                                        checked={type === 'Chat'} 
                                        onChange={() => setType('Chat')}
                                        className="ml-auto w-4 h-4 accent-[#5865f2]"
                                    />
                                </label>

                                <label 
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded cursor-pointer border border-transparent hover:bg-[#393c41]",
                                        type === 'Forum' ? "bg-[#404249] border-[#5865f2]" : "bg-[#2b2d31]"
                                    )}
                                    onClick={() => setType('Forum')}
                                >
                                    <MessageSquare size={24} className="text-[#B5BAC1]" />
                                    <div>
                                        <div className="font-medium text-gray-200">帖子频道</div>
                                        <div className="text-xs text-gray-400">用于讨论特定主题的结构化讨论区。</div>
                                    </div>
                                    <input 
                                        type="radio" 
                                        name="channelType" 
                                        checked={type === 'Forum'} 
                                        onChange={() => setType('Forum')}
                                        className="ml-auto w-4 h-4 accent-[#5865f2]"
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#B5BAC1] uppercase">
                                频道名称
                            </label>
                            <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">
                                    {type === 'Chat' ? '#' : <MessageSquare size={14} />}
                                </span>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value.replace(/\s+/g, '-').toLowerCase())}
                                    placeholder="new-channel"
                                    className="w-full bg-[#1e1f22] text-gray-200 p-2 pl-7 rounded outline-none focus:ring-2 focus:ring-[#5865f2] transition-all font-medium"
                                    autoFocus
                                    maxLength={100}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#B5BAC1] uppercase">
                                频道描述 (可选)
                            </label>
                            <input 
                                type="text" 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-[#1e1f22] text-gray-200 p-2 rounded outline-none focus:ring-2 focus:ring-[#5865f2] transition-all text-sm"
                                maxLength={1024}
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-[#2b2d31] flex justify-end gap-3">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 hover:underline text-white text-sm"
                        >
                            取消
                        </button>
                        <button 
                            type="submit"
                            disabled={!name.trim() || isLoading}
                            className="px-6 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? '创建中...' : '创建频道'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateChannelModal;
