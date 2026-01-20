import React, { useState } from 'react';
import { api } from '../lib/api';
import { X, Loader2 } from 'lucide-react';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
    channelId: number;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onCreated, channelId }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        setIsLoading(true);
        try {
            await api.post(`/Community/channels/${channelId}/posts`, {
                title,
                content
            });
            onCreated();
            onClose();
            setTitle('');
            setContent('');
        } catch (err) {
            console.error("Failed to create post", err);
            alert("创建帖子失败");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-[600px] bg-[#313338] rounded-lg shadow-2xl overflow-hidden border border-[#1e1f22]">
                <div className="flex items-center justify-between p-4 border-b border-[#1e1f22]">
                    <h2 className="text-lg font-bold text-white">创建新帖子</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[#B5BAC1] uppercase">标题</label>
                        <input 
                            type="text" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="输入帖子标题"
                            className="w-full bg-[#1e1f22] text-gray-200 p-2.5 rounded outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[#B5BAC1] uppercase">内容</label>
                        <textarea 
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="输入帖子内容..."
                            className="w-full h-40 bg-[#1e1f22] text-gray-200 p-2.5 rounded outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none custom-scrollbar"
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded text-gray-300 hover:underline text-sm font-medium"
                        >
                            取消
                        </button>
                        <button 
                            type="submit"
                            disabled={isLoading || !title.trim() || !content.trim()}
                            className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-6 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading && <Loader2 size={16} className="animate-spin" />}
                            发布帖子
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePostModal;
