import React from 'react';
import { Home, Store, Swords, Users, Trophy, Map } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';

export type TabType = 'collection' | 'market' | 'battle' | 'friends' | 'leaderboard' | 'map';

interface BottomNavProps {
  currentTab: TabType;
  onChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onChange }) => {
  const { friendRequests } = useGameStore();

  const tabs = [
    { id: 'collection', icon: Home, label: 'Túi Đồ' },
    { id: 'map', icon: Map, label: 'Bản Đồ' },
    { id: 'market', icon: Store, label: 'Chợ' },
    { id: 'battle', icon: Swords, label: 'Chiến Đấu' },
    { id: 'friends', icon: Users, label: 'Bạn Bè' },
    { id: 'leaderboard', icon: Trophy, label: 'Xếp Hạng' },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 w-full z-40 px-4 pb-6 pt-2 bg-gradient-to-t from-[#FFF8F0] via-[#FFF8F0]/90 to-transparent pointer-events-none">
      <div className="max-w-md mx-auto bg-white rounded-[2rem] shadow-[0_10px_30px_rgba(225,29,72,0.15)] border-4 border-rose-100 p-2 flex justify-between items-center pointer-events-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`relative flex-1 flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 ${
                isActive ? 'text-rose-500' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-rose-50 rounded-2xl border-2 border-rose-100"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex flex-col items-center gap-1">
                <div className="relative">
                  <Icon className={`w-6 h-6 ${isActive ? 'fill-rose-100 drop-shadow-sm' : ''}`} />
                  {tab.id === 'friends' && friendRequests.length > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                      {friendRequests.length}
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                  {tab.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
