import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Droplet, Leaf, Zap, Mountain, ShieldAlert, Swords, Heart, Activity } from 'lucide-react';
import type { Animon } from '../store/useGameStore';
import { Card } from './Card';

interface Props {
  animon: Animon | null;
  onClose: () => void;
}

const getElementDescription = (element: string) => {
  switch (element) {
    case 'Water': return { name: 'Hệ Nước', icon: <Droplet className="w-5 h-5 text-blue-500" />, counters: 'Lửa', weakTo: 'Sét', color: 'text-blue-500', bg: 'bg-blue-50' };
    case 'Fire': return { name: 'Hệ Lửa', icon: <Flame className="w-5 h-5 text-rose-500" />, counters: 'Cỏ', weakTo: 'Nước', color: 'text-rose-500', bg: 'bg-rose-50' };
    case 'Grass': return { name: 'Hệ Cỏ', icon: <Leaf className="w-5 h-5 text-emerald-500" />, counters: 'Đất', weakTo: 'Lửa', color: 'text-emerald-500', bg: 'bg-emerald-50' };
    case 'Earth': return { name: 'Hệ Đất', icon: <Mountain className="w-5 h-5 text-amber-700" />, counters: 'Sét', weakTo: 'Cỏ', color: 'text-amber-700', bg: 'bg-amber-50' };
    case 'Electric': return { name: 'Hệ Sét', icon: <Zap className="w-5 h-5 text-yellow-500" />, counters: 'Nước', weakTo: 'Đất', color: 'text-yellow-500', bg: 'bg-yellow-50' };
    default: return { name: 'Hệ Nước', icon: <Droplet className="w-5 h-5" />, counters: 'Lửa', weakTo: 'Sét', color: 'text-stone-500', bg: 'bg-stone-50' };
  }
};

const getAbilityDescription = (ability: string) => {
  switch (ability) {
    case 'Critical Strike': return { name: 'Chí Mạng', desc: 'Có 20% cơ hội x2 sát thương trong mỗi lượt tấn công.', icon: <Swords className="w-5 h-5 text-rose-500" /> };
    case 'Dodge': return { name: 'Né Tránh', desc: 'Có 20% cơ hội né hoàn toàn đòn đánh của kẻ thù.', icon: <Activity className="w-5 h-5 text-blue-500" /> };
    case 'Vampire': return { name: 'Hút Máu', desc: 'Hồi phục HP bằng 50% lượng sát thương gây ra.', icon: <Heart className="w-5 h-5 text-rose-500 fill-rose-500" /> };
    case 'Thorns': return { name: 'Phản Đòn', desc: 'Phản lại 30% sát thương phải gánh chịu cho đối thủ.', icon: <ShieldAlert className="w-5 h-5 text-stone-500" /> };
    default: return null;
  }
};

export const CardDetailsModal: React.FC<Props> = ({ animon, onClose }) => {
  if (!animon) return null;

  const elementInfo = getElementDescription(animon.stats.element);
  const abilityInfo = animon.stats.hidden_ability ? getAbilityDescription(animon.stats.hidden_ability) : null;
  const hp = animon.stats.energy * 10;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white p-6 rounded-[2rem] w-full max-w-4xl shadow-2xl border-4 border-indigo-100 flex flex-col md:flex-row gap-8 max-h-[95vh] overflow-y-auto my-auto"
        >
          {/* Card Preview */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <Card animon={animon} disableHover />
            <div className="mt-4 flex items-center justify-center gap-2">
               <span className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full font-black text-sm">
                 TÀI SẢN: {animon.stats.value} ✨
               </span>
            </div>
          </div>

          {/* Details Panel */}
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-black text-stone-800 leading-tight">{animon.name}</h2>
                <p className="text-stone-500 font-bold">Cấp độ {animon.stats.rarity}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 bg-stone-100 text-stone-400 rounded-full hover:bg-stone-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Combat Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
               <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-4">
                 <div className="text-blue-400 font-black text-xs uppercase tracking-wider mb-1">Máu Tối Đa (HP)</div>
                 <div className="text-2xl font-black text-blue-600">{hp}</div>
               </div>
               <div className="bg-rose-50 border-2 border-rose-100 rounded-2xl p-4">
                 <div className="text-rose-400 font-black text-xs uppercase tracking-wider mb-1">Sát Thương (DMG)</div>
                 <div className="text-2xl font-black text-rose-600">{animon.stats.power}</div>
               </div>
            </div>

            {/* Element Info */}
            <div className="mb-6">
              <h3 className="font-bold text-stone-600 mb-3 uppercase text-sm tracking-wider">Hệ Nguyên Tố</h3>
              <div className={`rounded-2xl p-4 border-2 border-stone-100 flex flex-col gap-3 ${elementInfo.bg}`}>
                <div className={`flex items-center gap-2 font-black text-lg ${elementInfo.color}`}>
                  {elementInfo.icon} {elementInfo.name}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm font-medium text-stone-700">
                  <div className="bg-white/60 p-2 rounded-xl">
                    <span className="text-emerald-500 font-bold block mb-1">⚔️ Khắc Chế (Gây +50% ST)</span>
                    Hệ {elementInfo.counters}
                  </div>
                  <div className="bg-white/60 p-2 rounded-xl">
                    <span className="text-rose-500 font-bold block mb-1">🛡️ Bị Khắc (Gây -30% ST)</span>
                    Hệ {elementInfo.weakTo}
                  </div>
                </div>
              </div>
            </div>

            {/* Hidden Ability */}
            <div>
              <h3 className="font-bold text-stone-600 mb-3 uppercase text-sm tracking-wider">Nội Tại Ẩn</h3>
              {abilityInfo ? (
                <div className="bg-indigo-50 rounded-2xl p-4 border-2 border-indigo-100 flex items-start gap-3">
                  <div className="bg-white p-2 rounded-full shadow-sm shrink-0">
                    {abilityInfo.icon}
                  </div>
                  <div>
                    <h4 className="font-black text-indigo-600 text-lg">{abilityInfo.name}</h4>
                    <p className="text-stone-600 font-medium text-sm mt-1 leading-relaxed">
                      {abilityInfo.desc}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-stone-50 rounded-2xl p-4 border-2 border-stone-100 text-stone-400 font-medium italic text-center">
                  Animon này không có nội tại ẩn.
                </div>
              )}
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
