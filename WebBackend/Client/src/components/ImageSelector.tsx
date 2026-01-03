import { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';
import api from '@/services/api';

interface ImageSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  type?: 'store' | 'news';
}

interface ImageItem {
  url: string;
  name: string;
  date: string;
}

export default function ImageSelector({ isOpen, onClose, onSelect, type = 'store' }: ImageSelectorProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchImages();
    }
  }, [isOpen, type]);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/upload/images?type=${type}`);
      setImages(res.data);
    } catch (error) {
      console.error('Failed to fetch images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (url: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the image when clicking delete
    
    if (!window.confirm('确定要删除这张图片吗？此操作无法撤销。')) {
      return;
    }

    try {
      // The url here is relative, e.g., /uploads/store/2024/01/xxx.png
      // The backend expects the exact path stored in the db/file system relative to wwwroot usually, 
      // or we just pass the relative url we got from the API.
      // The API returns urls starting with /uploads/...
      
      await api.delete(`/upload/image?url=${encodeURIComponent(url)}`);
      
      // Remove from local state
      setImages(prev => prev.filter(img => img.url !== url));
    } catch (error: any) {
      console.error('Failed to delete image:', error);
      alert('删除失败: ' + (error.response?.data || error.message));
    }
  };

  if (!isOpen) return null;

  const getFullUrl = (relativePath: string) => {
     if (relativePath.startsWith('http')) return relativePath;
     const baseUrl = api.defaults.baseURL?.replace('/api', '') || '';
     return `${baseUrl}${relativePath}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div 
        className="bg-[#1f1f1f] border border-white/10 rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-lg font-medium text-white">选择已上传图片</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <Loader2 className="animate-spin mr-2" />
              加载中...
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <ImageIcon className="size-12 mb-2 opacity-50" />
              <p>暂无已上传图片</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {images.map((img) => (
                <button
                  key={img.url}
                  onClick={() => {
                    onSelect(getFullUrl(img.url));
                    onClose();
                  }}
                  className="group relative aspect-square bg-black/40 rounded border border-white/5 hover:border-yellow-500 overflow-hidden transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  title={img.name}
                >
                  <img 
                    src={getFullUrl(img.url)}
                    alt={img.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  
                  {/* Delete Button */}
                  <div 
                    onClick={(e) => handleDelete(img.url, e)}
                    className="absolute top-1 right-1 p-1.5 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                    title="删除图片"
                  >
                    <Trash2 size={14} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
