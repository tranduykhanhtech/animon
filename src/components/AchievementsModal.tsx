import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, CheckCircle2, Lock, Gift } from 'lucide-react';
import { ACHIEVEMENTS } from '../constants/achievements';
import { useGameStore } from '../store/useGameStore';
import confetti from 'canvas-confetti';

interface Props {
  onClose: () => void;
}

export const AchievementsModal: React.FC<Props> = ({ onClose }) => {
  const { unlockedAchievements, claimedAchievements, claimAchievement } = useGameStore();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaim = async (id: string, e: React.MouseEvent) => {
    setClaimingId(id);
    const success = await claimAchievement(id);
    if (success) {
      // Fire confetti from the button's position
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x, y },
        colors: ['#fbbf24', '#f59e0b', '#d97706', '#fcd34d']
      });
    } else {
      alert("Có lỗi xảy ra khi nhận thưởng.");
    }
    setClaimingId(null);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-stone-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-[#FFF8F0] p-6 rounded-[2rem] w-full max-w-md shadow-2xl border-4 border-amber-200 my-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-300 to-orange-400 flex items-center justify-center shadow-inner border-2 border-white">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-amber-500 uppercase tracking-tight">Thành Tựu</h2>
                <p className="text-sm font-bold text-stone-500">{claimedAchievements.length} / {ACHIEVEMENTS.length} đã hoàn thành</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 bg-white rounded-full hover:bg-stone-100 transition-colors shadow-sm border-2 border-stone-200"
            >
              <X className="w-6 h-6 text-stone-500" />
            </button>
          </div>

          {/* List */}
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {ACHIEVEMENTS.map(ach => {
              const isUnlocked = unlockedAchievements.includes(ach.id);
              const isClaimed = claimedAchievements.includes(ach.id);
              const isClaiming = claimingId === ach.id;

              return (
                <div 
                  key={ach.id}
                  className={`relative p-4 rounded-2xl border-2 transition-all ${
                    isClaimed ? 'bg-stone-100 border-stone-200 opacity-70' :
                    isUnlocked ? 'bg-white border-amber-300 shadow-md transform hover:-translate-y-1' :
                    'bg-white/50 border-stone-200'
                  }`}
                >
                  <div className="flex gap-4 items-start">
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm shrink-0 border-2 ${
                      isUnlocked ? 'bg-amber-100 border-amber-200' : 'bg-stone-100 border-stone-200 grayscale opacity-50'
                    }`}>
                      {ach.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`font-black text-lg leading-tight ${isUnlocked ? 'text-stone-800' : 'text-stone-500'}`}>
                          {ach.title}
                        </h4>
                        <div className="flex items-center gap-1 bg-amber-100 px-2 py-1 rounded-lg">
                          <span className="font-bold text-amber-600 text-sm">+{ach.rewardCoins}</span>
                          <span className="text-xs">💰</span>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-stone-500 leading-snug mb-3">
                        {ach.description}
                      </p>

                      {/* Action Button */}
                      {isClaimed ? (
                        <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm bg-emerald-50 w-fit px-3 py-1.5 rounded-xl border border-emerald-100">
                          <CheckCircle2 className="w-4 h-4" /> Đã nhận thưởng
                        </div>
                      ) : isUnlocked ? (
                        <button
                          disabled={isClaiming}
                          onClick={(e) => handleClaim(ach.id, e)}
                          className="w-full py-2 bg-gradient-to-r from-amber-400 to-orange-400 text-white font-black rounded-xl shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2 animate-pulse"
                        >
                          {isClaiming ? 'Đang nhận...' : <><Gift className="w-5 h-5" /> Nhận Thưởng</>}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 text-stone-400 font-bold text-sm bg-stone-100 w-fit px-3 py-1.5 rounded-xl border border-stone-200">
                          <Lock className="w-4 h-4" /> Chưa hoàn thành
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
