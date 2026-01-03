'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, X, Edit2, Trash2, Check, Save } from 'lucide-react';
import api from '@/services/api';

interface ShopCategory {
  id: number;
  name: string;
  sortOrder: number;
}

interface CategoryManagerProps {
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
}

export default function CategoryManager({ selectedCategories, onChange }: CategoryManagerProps) {
  const [availableCategories, setAvailableCategories] = useState<ShopCategory[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<ShopCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setEditingCategory(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/store/categories');
      setAvailableCategories(res.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/store/categories', { name: newCategoryName, sortOrder: 0 });
      setAvailableCategories([...availableCategories, res.data]);
      setNewCategoryName('');
    } catch (err) {
      console.error('Failed to create category:', err);
      alert('创建分类失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return;
    try {
      await api.put(`/store/categories/${editingCategory.id}`, editingCategory);
      setAvailableCategories(availableCategories.map(c => 
        c.id === editingCategory.id ? editingCategory : c
      ));
      
      // Update selected categories if the name changed
      const originalName = availableCategories.find(c => c.id === editingCategory.id)?.name;
      if (originalName && originalName !== editingCategory.name && selectedCategories.includes(originalName)) {
        onChange(selectedCategories.map(c => c === originalName ? editingCategory.name : c));
      }

      setEditingCategory(null);
    } catch (err) {
      console.error('Failed to update category:', err);
      alert('更新分类失败');
    }
  };

  const handleDeleteCategory = async (id: number, name: string) => {
    if (!confirm(`确定要删除分类 "${name}" 吗？`)) return;
    try {
      await api.delete(`/store/categories/${id}`);
      setAvailableCategories(availableCategories.filter(c => c.id !== id));
      // Remove from selected if it was selected
      if (selectedCategories.includes(name)) {
        onChange(selectedCategories.filter(c => c !== name));
      }
    } catch (err) {
      console.error('Failed to delete category:', err);
      alert('删除分类失败');
    }
  };

  const toggleSelection = (name: string) => {
    if (selectedCategories.includes(name)) {
      onChange(selectedCategories.filter(c => c !== name));
    } else {
      onChange([...selectedCategories, name]);
    }
  };

  return (
    <div className="relative space-y-2" ref={dropdownRef}>
      {/* Selected Tags Area */}
      <div className="flex flex-wrap gap-2 p-2 bg-black/40 border border-white/10 rounded min-h-[42px] items-center">
        {selectedCategories.map(cat => (
          <span key={cat} className="flex items-center px-2 py-1 bg-yellow-600/20 text-yellow-500 border border-yellow-500/30 rounded text-xs group">
            {cat}
            <button
              type="button"
              onClick={() => onChange(selectedCategories.filter(c => c !== cat))}
              className="ml-1.5 hover:text-white transition-colors"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="ml-auto px-2 py-1 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded border border-white/5 transition-colors flex items-center"
        >
          <Plus size={12} className="mr-1" />
          选择分类
        </button>
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 w-full mt-2 bg-[#1f1f1f] border border-white/10 rounded-lg shadow-xl overflow-hidden animate-fadeIn">
          <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {availableCategories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-2 rounded hover:bg-white/5 group">
                {editingCategory?.id === cat.id ? (
                  // Edit Mode
                  <div className="flex items-center flex-1 gap-2">
                    <input
                      type="text"
                      value={editingCategory.name}
                      onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
                      className="flex-1 bg-black/40 border border-white/20 rounded px-2 py-1 text-xs text-white outline-none focus:border-yellow-500"
                      autoFocus
                    />
                    <button onClick={handleUpdateCategory} className="text-green-500 hover:text-green-400">
                      <Save size={14} />
                    </button>
                    <button onClick={() => setEditingCategory(null)} className="text-gray-500 hover:text-gray-400">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div 
                      className="flex-1 flex items-center cursor-pointer"
                      onClick={() => toggleSelection(cat.name)}
                    >
                      <div className={`w-3.5 h-3.5 rounded border mr-2 flex items-center justify-center ${selectedCategories.includes(cat.name) ? 'bg-yellow-600 border-yellow-600' : 'border-gray-600'}`}>
                         {selectedCategories.includes(cat.name) && <Check size={10} className="text-white" />}
                      </div>
                      <span className="text-sm text-gray-300 group-hover:text-white">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); }}
                        className="p-1 text-blue-400 hover:bg-blue-500/20 rounded"
                        title="重命名"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id, cat.name); }}
                        className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                        title="删除"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {availableCategories.length === 0 && (
                <div className="p-2 text-center text-xs text-gray-500">暂无分类，请添加</div>
            )}
          </div>

          {/* Footer: Add New */}
          <div className="p-2 border-t border-white/10 bg-black/20">
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                placeholder="新分类名称..."
                className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-yellow-500"
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              />
              <button
                onClick={handleAddCategory}
                disabled={loading || !newCategoryName.trim()}
                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs rounded transition-colors"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
