import React from 'react';
import { motion } from 'framer-motion';
import type { Animon } from '../store/useGameStore';
import { Flame, Droplet, Leaf, Zap, Mountain } from 'lucide-react';

interface CardProps {
  animon: Animon;
  onClick?: () => void;
}

const elementColors: Record<string, string> = {
  Fire: 'from-rose-300 to-orange-300 border-rose-200 text-rose-600',
  Water: 'from-blue-200 to-cyan-300 border-blue-200 text-blue-600',
  Grass: 'from-green-200 to-emerald-300 border-green-200 text-green-700',
  Electric: 'from-yellow-200 to-amber-300 border-yellow-200 text-yellow-700',
  Earth: 'from-amber-200 to-orange-200 border-amber-200 text-amber-800',
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

export const Card: React.FC<CardProps> = ({ animon, onClick }) => {
  const { name, imageUrl, stats } = animon;
  const theme = elementColors[stats.element] || elementColors.Grass;

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.05, rotate: -2 }}
      whileTap={{ scale: 0.95 }}
      className={`relative w-64 h-80 rounded-[2rem] p-2 cursor-pointer transition-shadow duration-300
        bg-white shadow-[0_10px_20px_rgba(0,0,0,0.08)] border-4 ${theme.split(' ')[2]}`}
    >
      <div className={`relative h-full w-full bg-gradient-to-br ${theme.split(' ')[0]} ${theme.split(' ')[1]} rounded-[1.5rem] p-4 flex flex-col items-center justify-between border-4 border-white shadow-inner`}>
        
        {/* Header */}
        <div className="w-full flex justify-between items-start z-10">
          <div className="flex flex-col">
            <span className="text-lg font-black text-white drop-shadow-md truncate max-w-[140px]" style={{ WebkitTextStroke: '1px rgba(0,0,0,0.1)' }}>
              {name}
            </span>
            <span className="text-xs font-bold text-white/90 drop-shadow-sm mt-0.5">
              {rarityStars[stats.rarity]} {stats.rarity}
            </span>
          </div>
          <div className="p-2 rounded-full bg-white/40 shadow-sm backdrop-blur-sm">
            <ElementIcon element={stats.element} className={`w-6 h-6 ${theme.split(' ')[3]}`} />
          </div>
        </div>

        {/* Image */}
        <div className="relative w-full h-32 mt-2 rounded-[1.2rem] overflow-hidden border-4 border-white bg-white/50 shadow-sm group">
          {imageUrl ? (
             <img src={imageUrl} alt={name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          ) : (
             <div className="w-full h-full flex items-center justify-center text-stone-400 font-medium">No Image</div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-bold text-stone-600">
          <div className="bg-white/50 rounded-xl p-2 flex flex-col items-center shadow-sm">
            <span className="text-stone-400">Power</span>
            <span className="text-base text-stone-700">{animon.stats.power}</span>
          </div>
          <div className="bg-white/50 rounded-xl p-2 flex flex-col items-center shadow-sm">
            <span className="text-stone-400">Energy</span>
            <span className="text-base text-stone-700">{animon.stats.energy}</span>
          </div>
        </div>

        <div className="mt-3 bg-white/60 rounded-xl p-2 flex justify-center items-center gap-1 shadow-sm border border-white">
          <span className="text-xs font-bold text-stone-500">Định giá:</span>
          <span className="text-sm font-black text-amber-500 flex items-center">
            {animon.stats.value || 0}
          </span>
        </div>
        
      </div>
      
      {/* Glossy overlay top */}
      <div className="absolute top-2 left-2 w-16 h-6 bg-white/40 rounded-full blur-sm pointer-events-none transform -rotate-12" />
    </motion.div>
  );
};
