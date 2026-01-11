'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Upload, Check, Loader2, Image as ImageIcon, Crop as CropIcon } from 'lucide-react';
import Cropper from 'react-easy-crop';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import getCroppedImg from '@/lib/cropImage';

interface AvatarSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string;
}

export default function AvatarSelector({ isOpen, onClose, currentAvatar }: AvatarSelectorProps) {
  const { updateAvatar } = useAuth();
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload'>('gallery');
  const [avatars, setAvatars] = useState<{ url: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | undefined>(currentAvatar);

  // Crop state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  useEffect(() => {
    setSelectedAvatar(currentAvatar);
  }, [currentAvatar]);

  // Fetch gallery avatars
  useEffect(() => {
    if (isOpen && activeTab === 'gallery') {
      fetchAvatars();
    }
  }, [isOpen, activeTab]);

  // Reset crop state when tab changes or close
  useEffect(() => {
    if (!isOpen || activeTab === 'gallery') {
      setImageSrc(null);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    }
  }, [isOpen, activeTab]);

  const fetchAvatars = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/Upload/images?type=avatar');
      setAvatars(data);
    } catch (error) {
      console.error('Failed to fetch avatars', error);
      setAvatars([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result?.toString() || null);
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropAndUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setUploading(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      if (!croppedBlob) {
         throw new Error('Canvas is empty');
      }

      // Convert Blob to File
      const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
      const formData = new FormData();
      formData.append('file', file);

      // Upload with type=avatar
      const { data } = await api.post('/Upload/image?type=avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Select the uploaded avatar
      setSelectedAvatar(data.url);
      setImageSrc(null); // Clear cropper
      
    } catch (error) {
      console.error('Upload failed', error);
      alert('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedAvatar) return;

    try {
      await api.put('/Users/avatar', { avatarUrl: selectedAvatar });
      updateAvatar(selectedAvatar);
      onClose();
    } catch (error) {
      console.error('Failed to update profile', error);
      alert('更新失败');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-yellow-500" />
            修改头像
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'gallery' 
                ? 'text-yellow-500 border-b-2 border-yellow-500 bg-white/5' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            头像库
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'upload' 
                ? 'text-yellow-500 border-b-2 border-yellow-500 bg-white/5' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            上传自定义
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
          {activeTab === 'gallery' ? (
            loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
                <span>加载头像库...</span>
              </div>
            ) : avatars.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
                <p>暂无头像，请上传</p>
               </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {avatars.map((avatar, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setSelectedAvatar(avatar.url)}
                    className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer group border-2 transition-all ${
                      selectedAvatar === avatar.url 
                        ? 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]' 
                        : 'border-transparent hover:border-white/30'
                    }`}
                  >
                    <Image 
                      src={avatar.url} 
                      alt={`Avatar ${idx}`}
                      fill 
                      className="object-cover"
                    />
                    {selectedAvatar === avatar.url && (
                      <div className="absolute inset-0 bg-yellow-500/20 flex items-center justify-center">
                        <div className="bg-yellow-500 rounded-full p-1">
                          <Check className="w-3 h-3 text-black" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            // Upload Tab Content
            <div className="flex flex-col h-full">
              {imageSrc ? (
                 // Cropper UI
                 <div className="flex flex-col h-full">
                    <div className="relative h-64 w-full bg-[#333] rounded-lg overflow-hidden mb-4">
                      <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1} // Square aspect ratio for avatar
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                      />
                    </div>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-xs text-gray-400">缩放</span>
                      <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                      />
                    </div>

                    <div className="flex justify-end gap-3">
                       <button
                         onClick={() => setImageSrc(null)}
                         className="px-4 py-2 text-sm text-gray-400 hover:text-white"
                       >
                         重新选择
                       </button>
                       <button
                         onClick={handleCropAndUpload}
                         disabled={uploading}
                         className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium rounded-md flex items-center gap-2"
                       >
                         {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CropIcon className="w-4 h-4" />}
                         确认裁剪并上传
                       </button>
                    </div>
                 </div>
              ) : (
                // Upload Initial UI
                <div className="flex flex-col items-center justify-center h-full gap-6">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-white/20 relative">
                        {selectedAvatar ? (
                            <Image src={selectedAvatar} alt="Selected" fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                <span className="text-gray-500 text-xs">预览</span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-center justify-center w-full max-w-sm border-2 border-dashed border-white/10 rounded-lg bg-white/5 hover:bg-white/10 transition-colors h-40 relative">
                        <label className="flex flex-col items-center gap-4 cursor-pointer w-full h-full justify-center absolute inset-0">
                        <div className="p-4 bg-white/10 rounded-full">
                            <Upload className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className="text-center">
                            <p className="text-white font-medium mb-1">点击选择图片</p>
                            <p className="text-sm text-gray-500">支持裁剪与缩放</p>
                        </div>
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleFileChange}
                        />
                        </label>
                    </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer (Only show when not in cropping mode or in gallery) */}
        {(!imageSrc || activeTab === 'gallery') && (
            <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-[#212121]">
            <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
                取消
            </button>
            <button 
                onClick={handleSave}
                disabled={!selectedAvatar}
                className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
                保存更改
            </button>
            </div>
        )}
      </div>
    </div>
  );
}
