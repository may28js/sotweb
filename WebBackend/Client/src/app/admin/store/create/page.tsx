'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Link as LinkIcon, Trash2, Image as ImageIcon, Grid } from 'lucide-react';
import Link from 'next/link';
import api from '@/services/api';
import CategoryManager from '@/components/CategoryManager';
import ImageSelector from '@/components/ImageSelector';

export default function CreateStoreItem() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    gameItemId: 0,
    category: '',
    isActive: true,
    isUnique: true,
    iconUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    gameItemId?: string;
    price?: string;
    iconUrl?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!formData.name.trim()) newErrors.name = '请输入商品名称';
    if (formData.gameItemId <= 0) newErrors.gameItemId = '无效的游戏物品 ID';
    if (formData.price <= 0) newErrors.price = '积分价格必须大于 0';
    if (!formData.iconUrl) newErrors.iconUrl = '请上传商品图标';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const uploadData = new FormData();
    uploadData.append('file', file);

    setUploading(true);
    try {
      const res = await api.post('/upload/image?type=store', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Assuming the backend returns the full relative path like /uploads/store/2024/01/xxx.png
      // We need to prepend the API base URL if it's not included, but usually frontend handles this.
      // For now, let's assume we store the relative path or full URL.
      // If the backend returns a relative path starting with /, we might need to prepend the backend host for display if it's on a different port,
      // but if it's proxied or same origin, it works.
      // Let's store the relative path returned by the server.
      const fullUrl = `${api.defaults.baseURL?.replace('/api', '')}${res.data.url}`;
      setFormData({ ...formData, iconUrl: fullUrl });
      if (errors.iconUrl) setErrors({ ...errors, iconUrl: undefined });
    } catch (error: any) {
      console.error('Upload failed:', error);
      console.error('Error details:', error.response?.data);
      alert(`图片上传失败: ${error.response?.data || error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      await api.post('/store/items', formData);
      router.push('/admin/store');
      router.refresh();
    } catch (error: any) {
      alert(`创建失败: ${error.response?.data || error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name.trim() && formData.gameItemId > 0 && formData.price > 0 && formData.iconUrl;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-8">
        <Link href="/admin/store" className="mr-4 p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-white">上架新商品</h1>
      </div>

      <div className="bg-[#1f1f1f] rounded-lg border border-white/10 shadow-xl overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">商品名称</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => {
                    setFormData({...formData, name: e.target.value});
                    if (errors.name) setErrors({...errors, name: undefined});
                  }}
                  className={`w-full bg-black/40 border ${errors.name ? 'border-red-500' : 'border-white/10'} rounded px-3 py-2 text-sm text-white focus:border-yellow-500 outline-none transition-colors`}
                  placeholder="如：奥之灰烬"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">游戏物品 ID (Entry)</label>
                  <input
                    type="number"
                    required
                    value={formData.gameItemId}
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      setFormData({...formData, gameItemId: isNaN(val) ? 0 : val});
                      if (errors.gameItemId) setErrors({...errors, gameItemId: undefined});
                    }}
                    className={`w-full bg-black/40 border ${errors.gameItemId ? 'border-red-500' : 'border-white/10'} rounded px-3 py-2 text-sm text-white focus:border-yellow-500 outline-none font-mono no-spinner`}
                    placeholder="如：32458"
                  />
                  {errors.gameItemId && <p className="text-red-500 text-xs mt-1">{errors.gameItemId}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">积分价格</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      setFormData({...formData, price: isNaN(val) ? 0 : val});
                      if (errors.price) setErrors({...errors, price: undefined});
                    }}
                    className={`w-full bg-black/40 border ${errors.price ? 'border-red-500' : 'border-white/10'} rounded px-3 py-2 text-sm text-white focus:border-yellow-500 outline-none no-spinner`}
                  />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">分类</label>
                <CategoryManager 
                  selectedCategories={formData.category ? formData.category.split(',').filter(Boolean) : []}
                  onChange={(cats) => setFormData({...formData, category: cats.join(',')})}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">状态</label>
                <div className="flex items-center space-x-6 p-3 bg-black/20 rounded border border-white/5">
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.isActive ? 'border-yellow-500' : 'border-gray-500 group-hover:border-gray-400'}`}>
                      {formData.isActive && <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />}
                    </div>
                    <input 
                      type="radio" 
                      checked={formData.isActive} 
                      onChange={() => setFormData({...formData, isActive: true})}
                      className="hidden"
                    />
                    <span className={`text-sm ${formData.isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>上架</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${!formData.isActive ? 'border-yellow-500' : 'border-gray-500 group-hover:border-gray-400'}`}>
                      {!formData.isActive && <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />}
                    </div>
                    <input 
                      type="radio" 
                      checked={!formData.isActive} 
                      onChange={() => setFormData({...formData, isActive: false})}
                      className="hidden"
                    />
                    <span className={`text-sm ${!formData.isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>下架</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">唯一性</label>
                <div className="flex items-center space-x-6 p-3 bg-black/20 rounded border border-white/5">
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.isUnique ? 'border-yellow-500' : 'border-gray-500 group-hover:border-gray-400'}`}>
                      {formData.isUnique && <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />}
                    </div>
                    <input 
                      type="radio" 
                      checked={formData.isUnique} 
                      onChange={() => setFormData({...formData, isUnique: true})}
                      className="hidden"
                    />
                    <span className={`text-sm ${formData.isUnique ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>唯一 (不可堆叠)</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${!formData.isUnique ? 'border-yellow-500' : 'border-gray-500 group-hover:border-gray-400'}`}>
                      {!formData.isUnique && <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />}
                    </div>
                    <input 
                      type="radio" 
                      checked={!formData.isUnique} 
                      onChange={() => setFormData({...formData, isUnique: false})}
                      className="hidden"
                    />
                    <span className={`text-sm ${!formData.isUnique ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>非唯一 (可堆叠)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">商品图标</label>
                
                {/* Preview */}
                <div className="relative w-full h-48 bg-black/30 border border-white/10 rounded overflow-hidden group">
                  {formData.iconUrl ? (
                    <>
                      <img 
                        src={formData.iconUrl} 
                        alt="Preview" 
                        className="w-full h-full object-contain relative z-10" 
                      />
                      {/* Background pattern for transparency */}
                      <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '10px 10px'}}></div>
                      
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, iconUrl: '' })}
                          className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-full"
                          title="移除图标"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                      <ImageIcon className="size-8 mb-2 opacity-50" />
                      <span className="text-xs">无图标</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <label className="flex-1 cursor-pointer py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded flex items-center justify-center gap-2 text-sm text-gray-300 transition-colors">
                    <Upload className="size-4" />
                    <span>{uploading ? '上传中...' : '上传图片'}</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </label>
                  
                  <button
                    type="button"
                    onClick={() => setShowImageSelector(true)}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded flex items-center justify-center gap-2 text-sm text-gray-300 transition-colors"
                  >
                    <Grid className="size-4" />
                    <span>选择图片</span>
                  </button>
                </div>
                
                <input
                  type="text"
                  className={`w-full bg-black/50 border ${errors.iconUrl ? 'border-red-500' : 'border-white/10'} rounded px-3 py-1.5 text-white text-xs focus:outline-none focus:border-yellow-500 font-mono text-gray-400`}
                  value={formData.iconUrl}
                  onChange={e => {
                    setFormData({ ...formData, iconUrl: e.target.value });
                    if (errors.iconUrl) setErrors({ ...errors, iconUrl: undefined });
                  }}
                  placeholder="或输入图片 URL..."
                />
                {errors.iconUrl && <p className="text-red-500 text-xs mt-1">{errors.iconUrl}</p>}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">商品描述</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-yellow-500 outline-none"
              placeholder="简要描述该物品..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Link
              href="/admin/store"
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 text-sm font-medium rounded transition-colors ${
                loading 
                  ? 'bg-yellow-600/50 text-white/50 cursor-wait' 
                  : !isFormValid
                    ? 'bg-yellow-600/30 text-white/30 cursor-not-allowed hover:bg-yellow-600/30' 
                    : 'bg-yellow-600 hover:bg-yellow-500 text-white'
              }`}
            >
              {loading ? '提交中...' : '确认上架'}
            </button>
          </div>
        </form>
      </div>
      
      <ImageSelector
        isOpen={showImageSelector}
        onClose={() => setShowImageSelector(false)}
        onSelect={(url) => {
          setFormData({ ...formData, iconUrl: url });
          if (errors.iconUrl) setErrors({ ...errors, iconUrl: undefined });
        }}
        type="store"
      />
    </div>
  );
}
