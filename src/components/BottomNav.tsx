import React from 'react';
import { Home, Store, Swords, Users, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

export type TabType = 'collection' | 'market' | 'battle' | 'friends' | 'leaderboard';

interface BottomNavProps {
  currentTab: TabType;
  onChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onChange }) => {
  const tabs = [
    { id: 'collection', icon: Home, label: 'Túi Đồ' },
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
                <Icon className={`w-6 h-6 ${isActive ? 'fill-rose-100 drop-shadow-sm' : ''}`} />
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
