export type DecorationType = 'frame' | 'background' | 'title' | 'marker';

export interface DecorationItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: DecorationType;
  styleClass?: string; // CSS class for frame, bg, title color, marker style
  imageUrl?: string; // Image URL for background or custom marker icon
  requiredRankRP?: number; // Minimum RP required to buy
}

export const DECORATIONS: DecorationItem[] = [
  // AVATAR FRAMES
  {
    id: 'frame_gold',
    name: 'Khung Hoàng Kim',
    description: 'Viền vàng lấp lánh sang trọng dành cho các đại gia.',
    price: 3000,
    type: 'frame',
    styleClass: 'ring-4 ring-amber-400 ring-offset-2 shadow-[0_0_15px_rgba(251,191,36,0.8)]',
    requiredRankRP: 300 // Vàng
  },
  {
    id: 'frame_neon',
    name: 'Khung Neon Xanh',
    description: 'Phong cách Cyberpunk với viền neon cực ngầu.',
    price: 5000,
    type: 'frame',
    styleClass: 'ring-4 ring-cyan-400 ring-offset-2 shadow-[0_0_20px_rgba(34,211,238,0.8)]'
  },
  {
    id: 'frame_fire',
    name: 'Khung Hỏa Thiên',
    description: 'Viền rực lửa, thể hiện đẳng cấp chiến binh.',
    price: 8000,
    type: 'frame',
    styleClass: 'ring-4 ring-rose-500 ring-offset-2 shadow-[0_0_25px_rgba(244,63,94,0.9)] animate-pulse',
    requiredRankRP: 600 // Bạch Kim
  },
  {
    id: 'frame_rainbow',
    name: 'Khung Lăng Kính',
    description: 'Đổi màu liên tục như cầu vồng, thu hút mọi ánh nhìn.',
    price: 15000,
    type: 'frame',
    styleClass: 'border-4 border-rose-500 animate-rainbow shadow-[0_0_20px_rgba(255,0,0,0.5)]'
  },
  {
    id: 'frame_galaxy',
    name: 'Khung Vũ Trụ',
    description: 'Tỏa ánh sáng từ các vì sao, lơ lửng giữa không gian.',
    price: 25000,
    type: 'frame',
    styleClass: 'ring-4 ring-purple-500 ring-offset-4 ring-offset-stone-900 animate-glow border-2 border-fuchsia-400',
    requiredRankRP: 1000 // Kim Cương
  },
  {
    id: 'frame_radar',
    name: 'Khung Radar',
    description: 'Quét liên tục tìm kiếm Animon xung quanh.',
    price: 4000,
    type: 'frame',
    styleClass: 'border-[4px] border-dashed border-emerald-400 animate-spin-slow shadow-inner'
  },
  {
    id: 'frame_heart',
    name: 'Khung Tình Yêu',
    description: 'Nhịp tim đập mạnh mẽ dành cho các Trainer tình cảm.',
    price: 6000,
    type: 'frame',
    styleClass: 'ring-4 ring-pink-400 ring-offset-2 shadow-[0_0_30px_rgba(244,114,182,0.9)] animate-pulse-fast'
  },
  {
    id: 'frame_water',
    name: 'Khung Đại Dương',
    description: 'Bồng bềnh gợn sóng như bọt biển.',
    price: 7500,
    type: 'frame',
    styleClass: 'ring-[6px] ring-blue-300/60 ring-offset-[3px] shadow-[0_0_15px_rgba(96,165,250,0.8)] animate-float'
  },
  
  // SHOWCASE BACKGROUNDS
  {
    id: 'bg_ghibli_forest',
    name: 'Rừng Tinh Linh',
    description: 'Phông nền rừng xanh mướt, ngập tràn sức sống.',
    price: 5000,
    type: 'background',
    imageUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'bg_ghibli_sky',
    name: 'Bầu Trời Hoàng Hôn',
    description: 'Khung cảnh hoàng hôn rực rỡ với mây bồng bềnh.',
    price: 8000,
    type: 'background',
    imageUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'bg_ghibli_night',
    name: 'Bầu Trời Đầy Sao',
    description: 'Bầu trời đêm tĩnh lặng với dải ngân hà huyền bí.',
    price: 15000,
    type: 'background',
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'bg_pixel_city',
    name: 'Thành Phố Pixel',
    description: 'Cảnh đêm thành phố Pixel Art nhộn nhịp.',
    price: 12000,
    type: 'background',
    imageUrl: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'bg_cyberpunk',
    name: 'Ngõ Hẻm Cyberpunk',
    description: 'Thế giới ngầm với ánh đèn neon chói lóa.',
    price: 18000,
    type: 'background',
    imageUrl: 'https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'bg_sakura',
    name: 'Mùa Hoa Anh Đào',
    description: 'Cánh hoa rơi rụng dưới tiết trời mùa xuân.',
    price: 20000,
    type: 'background',
    imageUrl: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'bg_ocean',
    name: 'Đại Dương Xanh',
    description: 'Sâu thẳm dưới lòng biển với san hô rực rỡ.',
    price: 9000,
    type: 'background',
    imageUrl: 'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'bg_volcano',
    name: 'Miệng Núi Lửa',
    description: 'Nóng rực với dòng dung nham cuồn cuộn.',
    price: 25000,
    type: 'background',
    imageUrl: 'https://images.unsplash.com/photo-1542401886-65d6c61db217?auto=format&fit=crop&q=80&w=800'
  },
  
  // TITLES
  {
    id: 'title_rookie',
    name: 'Danh hiệu: Tân Binh',
    description: 'Danh hiệu dành cho người mới bắt đầu hành trình.',
    price: 1000,
    type: 'title',
    styleClass: 'text-stone-500 bg-stone-100 border-stone-300'
  },
  {
    id: 'title_hunter',
    name: 'Danh hiệu: Thợ Săn',
    description: 'Sự công nhận cho những người đam mê tìm kiếm Animon.',
    price: 5000,
    type: 'title',
    styleClass: 'text-rose-600 bg-rose-100 border-rose-300 shadow-[0_0_10px_rgba(225,29,72,0.3)]',
    requiredRankRP: 100 // Bạc
  },
  {
    id: 'title_master',
    name: 'Danh hiệu: Bậc Thầy',
    description: 'Danh hiệu cao quý, tỏa hào quang vàng lấp lánh.',
    price: 20000,
    type: 'title',
    styleClass: 'text-amber-600 bg-amber-100 border-amber-400 font-extrabold animate-pulse',
    requiredRankRP: 300 // Vàng
  },
  {
    id: 'title_legend',
    name: 'Danh hiệu: Huyền Thoại',
    description: 'Chỉ những Trainer vĩ đại nhất mới sở hữu.',
    price: 50000,
    type: 'title',
    styleClass: 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-rainbow font-black tracking-widest',
    requiredRankRP: 1000 // Kim Cương
  },

  // MAP MARKERS
  {
    id: 'marker_radar',
    name: 'Marker: Radar Xanh',
    description: 'Biểu tượng người chơi tỏa sóng radar xanh lá.',
    price: 2000,
    type: 'marker',
    styleClass: 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]'
  },
  {
    id: 'marker_fire',
    name: 'Marker: Lửa Thiêng',
    description: 'Cháy rực rỡ trên bản đồ, không thể nhầm lẫn.',
    price: 8000,
    type: 'marker',
    styleClass: 'bg-rose-500 animate-pulse shadow-[0_0_20px_rgba(244,63,94,1)] ring-4 ring-rose-500/50'
  },
  {
    id: 'marker_star',
    name: 'Marker: Sao Chổi',
    description: 'Phát sáng lấp lánh với viền aura đẹp mắt.',
    price: 15000,
    type: 'marker',
    styleClass: 'bg-amber-400 animate-glow border-2 border-white'
  }
];
