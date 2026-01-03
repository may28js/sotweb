'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Trash2, X, Edit, Settings, Check, ChevronRight, Save, ArrowLeft, Upload, Image as ImageIcon } from 'lucide-react';
import api from '@/lib/api';
import RichTextEditor from '@/components/RichTextEditor';
import ImageSelector from '@/components/ImageSelector';
import Image from 'next/image';

interface News {
  id: number;
  title: string;
  content: string;
  type: string;
  thumbnail?: string;
}

function NewsEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsMode, setSettingsMode] = useState<'none' | 'edit_list' | 'delete_list'>('none');
  const [inputMode, setInputMode] = useState<'none' | 'add' | 'edit' | 'delete'>('none');
  const [inputValue, setInputValue] = useState('');
  const [targetCategory, setTargetCategory] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    thumbnailUrl: ''
  });

  // Load custom categories from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('customCategories');
    if (saved) {
      try {
        setCustomCategories(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse custom categories', e);
      }
    }
  }, []);

  // Fetch news data if editing
  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      api.get<News>(`/news/${id}`)
        .then(response => {
          const news = response.data;
          setFormData({
            title: news.title,
            content: news.content,
            category: news.type,
            thumbnailUrl: news.thumbnail || ''
          });
        })
        .catch(error => {
          console.error('Failed to fetch news details:', error);
          alert('无法加载新闻详情');
          router.push('/admin/news');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEditing, router]);

  const saveCustomCategories = (cats: string[]) => {
    setCustomCategories(cats);
    localStorage.setItem('customCategories', JSON.stringify(cats));
  };

  const getAllCategories = () => {
    const defaults = ['更新', '活动', '维护', '综合'];
    return Array.from(new Set([...defaults, ...customCategories]));
  };

  const handleCategoryAction = () => {
    if (inputMode === 'add') {
      if (inputValue && !getAllCategories().includes(inputValue)) {
        const newCats = [...customCategories, inputValue];
        saveCustomCategories(newCats);
        setFormData({ ...formData, category: inputValue });
      } else if (inputValue) {
         setFormData({ ...formData, category: inputValue });
      }
    } else if (inputMode === 'edit') {
       if (inputValue && targetCategory) {
         const newCats = customCategories.map(c => c === targetCategory ? inputValue : c);
         if (!customCategories.includes(targetCategory)) {
            newCats.push(inputValue);
         }
         saveCustomCategories(newCats);
         setFormData({ ...formData, category: inputValue });
       }
    } else if (inputMode === 'delete') {
       if (confirm(`警告：确定要删除分类“${targetCategory}”吗？这可能导致未知后果。`)) {
          const newCats = customCategories.filter(c => c !== targetCategory);
          saveCustomCategories(newCats);
          setFormData({ ...formData, category: '' });
       }
    }
    setInputMode('none');
    setInputValue('');
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const data = new FormData();
      data.append('file', file);
      
      try {
        setLoading(true);
        const res = await api.post('/upload/image', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.url) {
            setFormData({ ...formData, thumbnailUrl: res.data.url });
        }
      } catch (err) {
        console.error('Failed to upload thumbnail:', err);
        alert('缩略图上传失败，请重试。');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) {
      alert('请选择新闻分类！');
      return;
    }
    setLoading(true);
    try {
      const payload = {
          Id: isEditing ? Number(id) : 0,
          Title: formData.title,
          Content: formData.content,
          Type: formData.category,
          Thumbnail: formData.thumbnailUrl
      };
      
      if (isEditing) {
        await api.put(`/news/${id}`, payload);
      } else {
        await api.post('/news', payload);
      }
      
      router.push('/admin/news');
    } catch (error) {
      console.error('Failed to save news:', error);
      alert('保存失败，可能权限不足或网络错误。');
    } finally {
      setLoading(false);
    }
  };

    if (loading && isEditing && !formData.title) {
        return <div className="p-8 text-center text-gray-500">正在加载新闻内容...</div>;
    }

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] bg-[#1a1a1a] rounded-lg border border-white/5 overflow-hidden">
            <form onSubmit={handleSubmit} className="flex h-full overflow-hidden">
                {/* Left Sidebar: Settings */}
                <div className="w-80 border-r border-white/10 bg-[#1a1a1a] flex flex-col overflow-y-auto">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#1a1a1a] z-10">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                            >
                                <ArrowLeft className="size-4" />
                            </button>
                            <h1 className="text-base font-bold text-white">{isEditing ? '编辑新闻' : '发布新闻'}</h1>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-black text-sm font-medium rounded transition-colors disabled:opacity-50"
                        >
                            <Save className="size-3.5" />
                            {loading ? '保存中...' : '保存发布'}
                        </button>
                    </div>

                    <div className="p-4 space-y-6">
                        {/* Title Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">标题</label>
                            <textarea
                                required
                                placeholder="请输入新闻标题..."
                                className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-yellow-500 font-bold text-base min-h-[80px] resize-y"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        {/* Category Select */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">分类</label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsSettingsOpen(!isSettingsOpen);
                                            setSettingsMode('none');
                                        }}
                                        className="text-xs text-yellow-500 hover:text-yellow-400 flex items-center gap-1"
                                    >
                                        <Settings className="size-3" /> 管理分类
                                    </button>

                                    {/* Settings Menu - Positioned relatively to button */}
                                    {isSettingsOpen && (
                                        <div className="absolute top-full right-0 mt-2 w-48 bg-[#2a2a2a] border border-white/10 rounded-md shadow-xl z-50 py-1">
                                            {/* Add */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setInputMode('add');
                                                    setInputValue('');
                                                    setIsSettingsOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-2"
                                            >
                                                <Plus className="size-4" /> 添加分类
                                            </button>

                                            {/* Edit */}
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setSettingsMode(settingsMode === 'edit_list' ? 'none' : 'edit_list')}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white flex items-center justify-between"
                                                >
                                                    <span className="flex items-center gap-2"><Edit className="size-4" /> 修改分类</span>
                                                    <ChevronRight className={`size-3 transition-transform ${settingsMode === 'edit_list' ? 'rotate-90' : ''}`} />
                                                </button>
                                                {settingsMode === 'edit_list' && (
                                                    <div className="bg-[#1a1a1a] border-y border-white/5 py-1 max-h-40 overflow-y-auto">
                                                        {getAllCategories().map(cat => (
                                                            <button
                                                                key={cat}
                                                                type="button"
                                                                onClick={() => {
                                                                    setInputMode('edit');
                                                                    setTargetCategory(cat);
                                                                    setInputValue(cat);
                                                                    setIsSettingsOpen(false);
                                                                }}
                                                                className="w-full text-left px-8 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/5"
                                                            >
                                                                {cat}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Delete */}
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => setSettingsMode(settingsMode === 'delete_list' ? 'none' : 'delete_list')}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10 hover:text-red-300 flex items-center justify-between"
                                                >
                                                    <span className="flex items-center gap-2"><Trash2 className="size-4" /> 删除分类</span>
                                                    <ChevronRight className={`size-3 transition-transform ${settingsMode === 'delete_list' ? 'rotate-90' : ''}`} />
                                                </button>
                                                {settingsMode === 'delete_list' && (
                                                    <div className="bg-[#1a1a1a] border-y border-white/5 py-1 max-h-40 overflow-y-auto">
                                                        {getAllCategories().map(cat => (
                                                            <button
                                                                key={cat}
                                                                type="button"
                                                                onClick={() => {
                                                                    setInputMode('delete');
                                                                    setTargetCategory(cat);
                                                                    setIsSettingsOpen(false);
                                                                }}
                                                                className="w-full text-left px-8 py-1.5 text-xs text-gray-400 hover:text-red-400 hover:bg-white/5"
                                                            >
                                                                {cat}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Category Input Logic */}
                            {inputMode !== 'none' && inputMode !== 'delete' ? (
                                <div className="flex gap-2 items-center animate-in fade-in slide-in-from-top-1 duration-200">
                                    <input
                                        type="text"
                                        autoFocus
                                        className="flex-1 bg-black/50 border border-white/10 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:border-yellow-500"
                                        value={inputValue}
                                        onChange={e => setInputValue(e.target.value)}
                                        placeholder={inputMode === 'add' ? "新分类名称" : "修改分类名称"}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleCategoryAction();
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCategoryAction}
                                        className="px-2 py-1.5 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 rounded border border-yellow-500/50"
                                        title="确认"
                                    >
                                        <Check className="size-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setInputMode('none');
                                            setInputValue('');
                                        }}
                                        className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded border border-white/10"
                                        title="取消"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <select
                                    className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500 appearance-none"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    required
                                >
                                    <option value="" disabled>选择分类</option>
                                    {getAllCategories().map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Thumbnail Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">缩略图</label>
                            
                            {/* Preview */}
                            <div className="relative w-full aspect-video bg-black/30 border border-white/10 rounded overflow-hidden group">
                                {formData.thumbnailUrl ? (
                                    <>
                                        <Image
                                            src={formData.thumbnailUrl}
                                            alt="Thumbnail"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, thumbnailUrl: '' })}
                                                className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-full"
                                                title="移除缩略图"
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                                        <ImageIcon className="size-8 mb-2 opacity-50" />
                                        <span className="text-xs">无缩略图</span>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <label className="flex-1 cursor-pointer py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded flex items-center justify-center gap-2 text-sm text-gray-300 transition-colors">
                                    <Upload className="size-4" />
                                    <span>上传图片</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleThumbnailUpload}
                                    />
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIsImageSelectorOpen(true)}
                                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded flex items-center justify-center gap-2 text-sm text-gray-300 transition-colors"
                                >
                                    <ImageIcon className="size-4" />
                                    <span>选择已上传</span>
                                </button>
                            </div>
                            
                             <input
                                type="text"
                                className="w-full bg-black/50 border border-white/10 rounded px-3 py-1.5 text-white text-xs focus:outline-none focus:border-yellow-500 font-mono text-gray-400"
                                value={formData.thumbnailUrl}
                                onChange={e => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                                placeholder="或输入图片 URL..."
                            />
                        </div>
                    </div>
                </div>

                {/* Right Body: Full Screen Editor */}
                <div className="flex-1 min-h-0 bg-[#272727] flex flex-col">
                     <div className="flex-1 min-h-0 relative">
                        <RichTextEditor
                            content={formData.content}
                            onChange={html => setFormData({ ...formData, content: html })}
                        />
                     </div>
                </div>
            </form>

            <ImageSelector
                isOpen={isImageSelectorOpen}
                onClose={() => setIsImageSelectorOpen(false)}
                onSelect={(url) => setFormData({ ...formData, thumbnailUrl: url })}
                type="news"
            />
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<div className="text-white p-8">Loading editor...</div>}>
            <NewsEditor />
        </Suspense>
    )
}
