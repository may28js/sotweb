import React from 'react';
import { Sword, Shield, Scroll, Ghost } from 'lucide-react';

interface SidebarProps {
  activeGame: string;
  setActiveGame: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeGame, setActiveGame }) => {
  const games = [
    { id: 'wow', name: 'World of Warcraft', icon: <Sword size={28} /> },
    { id: 'sc2', name: 'StarCraft II', icon: <Ghost size={24} /> },
    { id: 'hs', name: 'Hearthstone', icon: <Scroll size={24} /> },
    { id: 'ow', name: 'Overwatch', icon: <Shield size={24} /> },
  ];

  return (
    <div className="w-20 bg-[#161026] flex flex-col items-center py-4 border-r border-[#2d2440] z-20 flex-shrink-0 shadow-xl">
      <div className="mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full flex items-center justify-center text-white font-serif font-bold shadow-[0_0_15px_rgba(245,158,11,0.4)] border border-amber-400/30">
          S
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => setActiveGame(game.id)}
            className={`group relative w-full h-14 flex items-center justify-center transition-all duration-200 ${
              activeGame === game.id ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {activeGame === game.id && (
              <div className="absolute left-0 top-2 bottom-2 w-1 bg-amber-500 rounded-r-full shadow-[0_0_10px_rgba(245,158,11,0.8)]"></div>
            )}
            <div className={`transition-transform duration-200 ${activeGame === game.id ? 'scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'group-hover:scale-105'}`}>
              {game.icon}
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-auto mb-4 text-slate-600">
        <button className="p-2 hover:text-slate-300 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;