export type RankTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

export interface RankInfo {
  tier: RankTier;
  name: string;
  minRP: number;
  maxRP: number;
  colorClass: string;
  badgeClass: string;
  icon: string;
}

export const RANKS: RankInfo[] = [
  { tier: 'Diamond', name: 'Kim Cương', minRP: 1000, maxRP: Infinity, colorClass: 'text-cyan-400', badgeClass: 'from-cyan-400 to-blue-600 text-white shadow-[0_0_15px_rgba(34,211,238,0.8)] border-cyan-200', icon: '💎' },
  { tier: 'Platinum', name: 'Bạch Kim', minRP: 600, maxRP: 999, colorClass: 'text-teal-400', badgeClass: 'from-teal-400 to-emerald-600 text-white shadow-[0_0_15px_rgba(45,212,191,0.6)] border-teal-200', icon: '💠' },
  { tier: 'Gold', name: 'Vàng', minRP: 300, maxRP: 599, colorClass: 'text-yellow-500', badgeClass: 'from-yellow-400 to-amber-600 text-white shadow-[0_0_15px_rgba(250,204,21,0.6)] border-yellow-200', icon: '🏆' },
  { tier: 'Silver', name: 'Bạc', minRP: 100, maxRP: 299, colorClass: 'text-slate-400', badgeClass: 'from-slate-300 to-slate-500 text-white shadow-[0_0_10px_rgba(148,163,184,0.5)] border-slate-200', icon: '🥈' },
  { tier: 'Bronze', name: 'Đồng', minRP: 0, maxRP: 99, colorClass: 'text-orange-700', badgeClass: 'from-orange-500 to-amber-700 text-white shadow-[0_0_10px_rgba(249,115,22,0.5)] border-orange-200', icon: '🥉' },
];

export const getRankInfo = (rp: number): RankInfo => {
  return RANKS.find(r => rp >= r.minRP) || RANKS[RANKS.length - 1];
};

export const getNextRank = (currentRP: number): RankInfo | null => {
  const currentRank = getRankInfo(currentRP);
  const nextRankIndex = RANKS.findIndex(r => r.tier === currentRank.tier) - 1;
  if (nextRankIndex >= 0) {
    return RANKS[nextRankIndex];
  }
  return null; // Already max rank
};
