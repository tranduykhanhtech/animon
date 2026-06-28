import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import type { LeaderboardUser } from '../store/useGameStore';
import { Trophy, Medal, Coins, PawPrint, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'wealth' | 'collector' | 'power';

export const Leaderboard: React.FC = () => {
  const { leaderboardWealth, leaderboardCollector, leaderboardPower, fetchLeaderboard, user } = useGameStore();
  const [activeTab, setActiveTab] = useState<TabType>('wealth');

  useEffect(() => {
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center shadow-lg border-2 border-white"><Trophy className="w-5 h-5 text-white" /></div>;
      case 1:
        return <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-lg border-2 border-white"><Medal className="w-5 h-5 text-white" /></div>;
      case 2:
        return <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center shadow-lg border-2 border-white"><Medal className="w-5 h-5 text-white" /></div>;
      default:
        return <div className="w-10 h-10 shrink-0 rounded-full bg-stone-100 flex items-center justify-center font-bold text-stone-500 border-2 border-white shadow-sm">{index + 1}</div>;
    }
  };

  const tabs = [
    { id: 'wealth', label: 'Đại Gia', icon: Coins, color: 'text-amber-500', bg: 'bg-amber-100' },
    { id: 'collector', label: 'Sưu Tầm', icon: PawPrint, color: 'text-emerald-500', bg: 'bg-emerald-100' },
    { id: 'power', label: 'Lực Chiến', icon: Zap, color: 'text-rose-500', bg: 'bg-rose-100' }
  ] as const;

  const currentData: LeaderboardUser[] = 
    activeTab === 'wealth' ? leaderboardWealth : 
    activeTab === 'collector' ? leaderboardCollector : 
    leaderboardPower;

  return (
    <div className="pb-32 px-4 max-w-4xl mx-auto flex flex-col items-center">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center shadow-xl border-4 border-white mb-6 transform -rotate-3">
        <Trophy className="w-10 h-10 text-white" />
      </div>
      
      <h2 className="text-3xl font-black text-stone-800 mb-2">Bảng Vàng</h2>
      <p className="text-stone-500 font-medium mb-8 text-center">Top những Huấn Luyện Viên xuất sắc nhất máy chủ</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white p-2 rounded-2xl shadow-sm border-2 border-stone-100 w-full overflow-x-auto hide-scrollbar">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 min-w-[100px] py-3 px-4 rounded-xl flex flex-col items-center gap-1 transition-all ${
                isActive ? `${tab.bg} ${tab.color} font-black shadow-inner` : 'text-stone-400 font-bold hover:bg-stone-50'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'animate-bounce' : ''}`} />
              <span className="text-sm whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="w-full bg-white rounded-3xl shadow-sm border-4 border-stone-100 overflow-hidden relative min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {currentData.length === 0 ? (
              <div className="p-10 text-center text-stone-400 font-medium">Chưa có dữ liệu xếp hạng</div>
            ) : (
              <div className="flex flex-col">
                {currentData.map((lbUser, idx) => (
                  <motion.div
                    key={lbUser.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className={`flex items-center justify-between p-4 border-b-2 border-stone-50 last:border-0 ${lbUser.id === user?.id ? 'bg-indigo-50' : 'hover:bg-stone-50'}`}
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {getRankBadge(idx)}
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-lg text-stone-700 flex items-center gap-2 truncate w-full">
                          <span className="truncate">{lbUser.username}</span>
                          {lbUser.id === user?.id && <span className="shrink-0 text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Bạn</span>}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5 bg-stone-100 px-4 py-2 rounded-2xl border-2 border-stone-200">
                      <span className="font-black text-stone-600 text-lg">
                        {lbUser.score.toLocaleString()}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
