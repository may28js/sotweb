import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface DiscoveryPopoverProps {
  paths: string[];
  onImport: (path: string) => void;
  onDismiss: () => void;
}

const DiscoveryPopover: React.FC<DiscoveryPopoverProps> = ({ paths, onImport, onDismiss }) => {
  const [selectedPath, setSelectedPath] = useState<string>(paths[0]);

  return (
    <div className="absolute bottom-[90px] right-8 w-[420px] bg-[#1a1a1a] border border-amber-500/30 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-md z-[50] animate-in slide-in-from-bottom-4 duration-300">
      {/* Arrow */}
      <div className="absolute -bottom-2 right-12 w-4 h-4 bg-[#1a1a1a] border-b border-r border-amber-500/30 transform rotate-45"></div>

      {/* Content */}
      <div className="p-3">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-amber-500 font-bold text-base flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            发现客户端
          </h3>
          <button 
            onClick={onDismiss}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <p className="text-gray-300 text-xs mb-2 pl-3.5">
          检测到您的电脑已有游戏客户端，是否直接导入？
        </p>

        {paths.length > 0 && (
          <div className="mb-2 flex flex-col gap-1 max-h-[100px] overflow-y-auto custom-scrollbar bg-black/20 rounded-lg p-1.5 border border-white/5 mx-1">
            {paths.map((path, idx) => (
              <label 
                key={idx} 
                className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors ${selectedPath === path ? 'bg-amber-500/10 border border-amber-500/30' : 'hover:bg-white/5 border border-transparent'}`}
              >
                <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${selectedPath === path ? 'border-amber-500' : 'border-gray-500'}`}>
                  {selectedPath === path && <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>}
                </div>
                <input 
                  type="radio" 
                  name="client_path" 
                  value={path} 
                  checked={selectedPath === path}
                  onChange={() => setSelectedPath(path)}
                  className="hidden"
                />
                <span className="text-xs text-gray-300 font-mono truncate" title={path}>{path}</span>
              </label>
            ))}
          </div>
        )}

        <div className="flex gap-2 justify-end mt-1">
          <button 
            onClick={onDismiss}
            className="px-3 py-1 rounded text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent"
          >
            否
          </button>
          <button 
            onClick={() => onImport(selectedPath)}
            className="px-3 py-1 rounded text-xs bg-amber-500 text-black font-bold hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
          >
            <Check size={12} />
            是
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscoveryPopover;