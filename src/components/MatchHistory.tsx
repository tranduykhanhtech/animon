import React, { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { History, Swords, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

export const MatchHistory: React.FC = () => {
  const { matchHistory, fetchMatchHistory, user } = useGameStore();

  useEffect(() => {
    fetchMatchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return null;

  return (
    <div className="w-full mt-8">
      <h3 className="font-bold text-stone-600 mb-4 flex items-center gap-2">
        <History className="w-5 h-5" /> Lịch sử thi đấu
      </h3>
      
      {matchHistory.length === 0 ? (
        <div className="bg-stone-50 p-6 rounded-2xl border-2 border-stone-100 text-center text-stone-400 font-medium">
          Bạn chưa tham gia trận đấu nào.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {matchHistory.map((match, idx) => {
            const isWinner = match.winner_id === user.id;
            const opponentName = isWinner ? (match.loser?.username || 'Ẩn danh') : (match.winner?.username || 'Ẩn danh');
            const pointsStr = isWinner ? `+${match.points_change}` : `-15`; // Backend deducts 15 for loss

            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 ${
                  isWinner ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isWinner ? 'bg-emerald-200 text-emerald-600' : 'bg-rose-200 text-rose-600'
                  }`}>
                    <Swords className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-stone-700">
                      {isWinner ? 'Thắng' : 'Thua'} vs <span className="text-stone-900">{opponentName}</span>
                    </div>
                    <div className="text-xs text-stone-400 font-medium">
                      {new Date(match.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className={`font-black text-lg flex items-center gap-1 ${
                  isWinner ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {isWinner ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  {pointsStr} RP
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
