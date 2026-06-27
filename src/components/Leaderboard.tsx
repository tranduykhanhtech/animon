import React, { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Trophy, Medal, Star } from 'lucide-react';
import { motion } from 'framer-motion';

export const Leaderboard: React.FC = () => {
  const { leaderboard, fetchLeaderboard, user } = useGameStore();

  useEffect(() => {
    fetchLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center shadow-lg border-2 border-white"><Trophy className="w-5 h-5 text-white" /></div>;
      case 1:
        return <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-lg border-2 border-white"><Medal className="w-5 h-5 text-white" /></div>;
      case 2:
        return <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center shadow-lg border-2 border-white"><Medal className="w-5 h-5 text-white" /></div>;
      default:
        return <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center font-bold text-stone-500 border-2 border-white shadow-sm">{index + 1}</div>;
    }
  };

  return (
    <div className="pb-32 px-4 max-w-4xl mx-auto flex flex-col items-center">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center shadow-xl border-4 border-white mb-6 transform -rotate-3">
        <Trophy className="w-10 h-10 text-white" />
      </div>
      
      <h2 className="text-3xl font-black text-stone-800 mb-2">Bảng Vàng</h2>
      <p className="text-stone-500 font-medium mb-8 text-center">Top những Huấn Luyện Viên vĩ đại nhất máy chủ</p>

      <div className="w-full bg-white rounded-3xl shadow-sm border-4 border-amber-100 overflow-hidden">
        {leaderboard.length === 0 ? (
          <div className="p-10 text-center text-stone-400 font-medium">Chưa có dữ liệu xếp hạng</div>
        ) : (
          <div className="flex flex-col">
            {leaderboard.map((lbUser, idx) => (
              <motion.div
                key={lbUser.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex items-center justify-between p-4 border-b-2 border-stone-50 last:border-0 ${lbUser.id === user?.id ? 'bg-amber-50' : 'hover:bg-stone-50'}`}
              >
                <div className="flex items-center gap-4">
                  {getRankBadge(idx)}
                  <div>
                    <div className="font-bold text-lg text-stone-700 flex items-center gap-2">
                      {lbUser.username}
                      {lbUser.id === user?.id && <span className="text-xs bg-rose-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Bạn</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-100 px-4 py-2 rounded-2xl border-2 border-amber-200">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <span className="font-black text-amber-600 text-lg">{lbUser.rank_points}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
