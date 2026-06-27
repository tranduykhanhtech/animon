import React from 'react';
import { motion } from 'framer-motion';
import type { Animon } from '../store/useGameStore';
import { Flame, Droplet, Leaf, Zap, Mountain } from 'lucide-react';

interface CardProps {
  animon: Animon;
  onClick?: () => void;
  disableHover?: boolean;
}

const elementThemes: Record<string, string> = {
  Fire: 'bg-gradient-to-br from-rose-400 to-orange-300',
  Water: 'bg-gradient-to-br from-blue-400 to-cyan-200',
  Grass: 'bg-gradient-to-br from-emerald-400 to-green-300',
  Electric: 'bg-gradient-to-br from-yellow-300 to-amber-200',
  Earth: 'bg-gradient-to-br from-amber-600 to-orange-300',
};

const rarityStars: Record<string, string> = {
  Common: '⭐',
  Rare: '⭐⭐',
  Epic: '⭐⭐⭐',
  Legendary: '🌟🌟🌟🌟',
};

const ElementIcon = ({ element, className }: { element: string, className?: string }) => {
  switch (element) {
    case 'Fire': return <Flame className={className} />;
    case 'Water': return <Droplet className={className} />;
    case 'Grass': return <Leaf className={className} />;
    case 'Electric': return <Zap className={className} />;
    case 'Earth': return <Mountain className={className} />;
    default: return <div className={className} />;
  }
};

export const Card: React.FC<CardProps> = ({ animon, onClick, disableHover }) => {
  const { name, imageUrl, stats } = animon;
  const innerBg = elementThemes[stats.element] || elementThemes.Grass;

  return (
    <motion.div
      onClick={onClick}
      whileHover={disableHover ? {} : { scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative w-[240px] min-h-[336px] h-max rounded-xl p-2.5 cursor-pointer transition-shadow duration-300 shadow-xl bg-[#fcd34d] flex-shrink-0`}
    >
      {/* Inner coloured background */}
      <div className={`relative h-full w-full rounded-lg flex flex-col p-2 ${innerBg} shadow-inner overflow-hidden border-2 border-amber-300/30`}>
        
        {/* Header */}
        <div className="w-full flex justify-between items-center mb-1.5 px-0.5">
          <div className="flex flex-col">
            <span className="text-[15px] font-black text-stone-900 truncate max-w-[150px] leading-tight">
              {name}
            </span>
            <span className="text-[9px] font-bold text-stone-800 leading-none mt-0.5 opacity-80">
              Cấp độ {rarityStars[stats.rarity]}
            </span>
          </div>
          <div className="w-6 h-6 rounded-full bg-white/70 shadow-sm flex items-center justify-center border border-white/50">
            <ElementIcon element={stats.element} className="w-3.5 h-3.5 text-stone-800" />
          </div>
        </div>

        {/* Holographic Image Frame */}
        <div className="relative w-full rounded-sm overflow-hidden border-[4px] border-[#fbbf24] bg-stone-100 shadow-[0_4px_10px_rgba(0,0,0,0.2)]">
          {imageUrl ? (
             <img src={imageUrl} alt={name} className="w-full h-auto object-cover" />
          ) : (
             <div className="w-full aspect-video flex items-center justify-center text-stone-400 font-medium text-xs">No Image</div>
          )}
          {/* Inner shadow for 3D effect */}
          <div className="absolute inset-0 shadow-[inset_0_0_10px_rgba(0,0,0,0.4)] pointer-events-none" />
        </div>

        {/* Flavor text bar */}
        <div className="w-full mt-1 mb-1 px-1 flex justify-center items-center">
           <span className="text-[7.5px] font-bold text-stone-800 italic uppercase tracking-wider bg-white/40 px-3 py-0.5 rounded shadow-sm">
             {stats.element} ANIMON. NĂNG LƯỢNG HỆ: {stats.energy * 10}
           </span>
        </div>

        {/* Abilities Body */}
        <div className="w-full flex-1 rounded bg-[#fefce8]/90 p-2 flex flex-col gap-2 shadow-sm border border-stone-300">
          
          <div className="flex justify-between items-center w-full group">
             <div className="flex items-center gap-1.5">
               <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm border border-stone-200">
                 <ElementIcon element={stats.element} className="w-3 h-3 text-stone-700" />
               </div>
               <span className="text-sm font-bold text-stone-800 tracking-wide">Sức Mạnh</span>
             </div>
             <span className="text-lg font-black text-stone-900">{stats.power}</span>
          </div>
          
          <div className="flex justify-between items-center w-full group">
             <div className="flex items-center gap-1.5">
               <div className="w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center shadow-sm border border-stone-300">
                 <div className="w-2.5 h-2.5 rounded-full bg-stone-400" />
               </div>
               <span className="text-sm font-bold text-stone-800 tracking-wide">Năng Lượng</span>
             </div>
             <span className="text-lg font-black text-stone-900">{stats.energy}</span>
          </div>

          {/* Hidden Ability as Pokemon Power */}
          {stats.hidden_ability && stats.hidden_ability !== 'None' && (
            <div className="mt-auto border-t border-stone-300/60 pt-1.5 flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-black text-red-600 tracking-wider">NỘI TẠI</span>
                <span className="text-[10px] font-bold text-stone-800">
                  {{ 'Critical Strike': 'Chí Mạng', 'Vampire': 'Hút Máu', 'Dodge': 'Né Tránh', 'Thorns': 'Phản Đòn' }[stats.hidden_ability] || stats.hidden_ability}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Footer Stats */}
        <div className="w-full mt-1.5 flex justify-between items-end px-1 pb-0.5">
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="text-[6px] font-bold text-stone-800/70">Weakness</span>
              <span className="text-[9px] font-black text-stone-900">x2</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[6px] font-bold text-stone-800/70">Resistance</span>
              <span className="text-[9px] font-black text-stone-900">-20</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-amber-900 italic">Giá: {stats.value}</span>
            <span className="text-[6px] font-bold text-stone-800/70">{stats.seed.toString().slice(0, 8)} / 999</span>
          </div>
        </div>
        
      </div>
    </motion.div>
  );
};
