export interface Achievement {
  id: string;
  title: string;
  description: string;
  rewardCoins: number;
  icon: string; // Emoji
}

export const ACHIEVEMENTS: Achievement[] = [
  // --- BẮT ANIMON TỔNG QUÁT ---
  { id: 'first_catch', title: 'Thợ săn tập sự', description: 'Bắt thành công 1 Animon đầu tiên.', rewardCoins: 50, icon: '🎯' },
  { id: 'catch_10', title: 'Thợ săn lão luyện', description: 'Bắt thành công 10 Animon.', rewardCoins: 300, icon: '🦋' },
  { id: 'catch_50', title: 'Thợ săn kỳ cựu', description: 'Bắt thành công 50 Animon.', rewardCoins: 1000, icon: '🏆' },
  { id: 'catch_100', title: 'Kẻ thu thập điên cuồng', description: 'Bắt thành công 100 Animon.', rewardCoins: 2500, icon: '🎒' },
  { id: 'catch_200', title: 'Máy hút bụi Animon', description: 'Bắt thành công 200 Animon.', rewardCoins: 5000, icon: '🌪️' },
  { id: 'catch_500', title: 'Chúa tể muôn loài', description: 'Bắt thành công 500 Animon.', rewardCoins: 15000, icon: '👑' },

  // --- THEO ĐỘ HIẾM (RARITY) ---
  { id: 'epic_1', title: 'May mắn chớm nở', description: 'Bắt được 1 Animon cấp Epic.', rewardCoins: 300, icon: '✨' },
  { id: 'epic_10', title: 'Chuyên gia săn đồ Hiếm', description: 'Bắt được 10 Animon cấp Epic.', rewardCoins: 1500, icon: '🌟' },
  { id: 'epic_50', title: 'Kẻ thù của Epic', description: 'Bắt được 50 Animon cấp Epic.', rewardCoins: 5000, icon: '💫' },
  
  { id: 'catch_legendary', title: 'Kẻ săn mồi huyền thoại', description: 'Bắt được 1 Animon cấp Legendary.', rewardCoins: 1000, icon: '🐉' },
  { id: 'legendary_5', title: 'Người được chọn', description: 'Bắt được 5 Animon cấp Legendary.', rewardCoins: 5000, icon: '👑' },
  { id: 'legendary_10', title: 'Kẻ ngạo nghễ', description: 'Bắt được 10 Animon cấp Legendary.', rewardCoins: 15000, icon: '🦄' },

  // --- THEO HỆ (ELEMENT) ---
  // LỬA
  { id: 'element_fire_5', title: 'Bậc thầy hệ Lửa', description: 'Sở hữu 5 Animon hệ Lửa (Fire).', rewardCoins: 300, icon: '🔥' },
  { id: 'element_fire_20', title: 'Ngọn lửa rực cháy', description: 'Sở hữu 20 Animon hệ Lửa.', rewardCoins: 1000, icon: '🌋' },
  { id: 'element_fire_50', title: 'Hỏa thần Hàng lâm', description: 'Sở hữu 50 Animon hệ Lửa.', rewardCoins: 3000, icon: '☄️' },
  // NƯỚC
  { id: 'element_water_5', title: 'Bậc thầy hệ Nước', description: 'Sở hữu 5 Animon hệ Nước (Water).', rewardCoins: 300, icon: '💧' },
  { id: 'element_water_20', title: 'Sức mạnh biển cả', description: 'Sở hữu 20 Animon hệ Nước.', rewardCoins: 1000, icon: '🌊' },
  { id: 'element_water_50', title: 'Thủy thần Hàng lâm', description: 'Sở hữu 50 Animon hệ Nước.', rewardCoins: 3000, icon: '🔱' },
  // CỎ
  { id: 'element_grass_5', title: 'Bậc thầy hệ Cỏ', description: 'Sở hữu 5 Animon hệ Cỏ (Grass).', rewardCoins: 300, icon: '🌿' },
  { id: 'element_grass_20', title: 'Rừng rậm nguyên sinh', description: 'Sở hữu 20 Animon hệ Cỏ.', rewardCoins: 1000, icon: '🌳' },
  { id: 'element_grass_50', title: 'Mộc thần Hàng lâm', description: 'Sở hữu 50 Animon hệ Cỏ.', rewardCoins: 3000, icon: '🍀' },
  // ĐIỆN
  { id: 'element_electric_5', title: 'Bậc thầy hệ Điện', description: 'Sở hữu 5 Animon hệ Điện (Electric).', rewardCoins: 300, icon: '⚡' },
  { id: 'element_electric_20', title: 'Tia chớp rạch trời', description: 'Sở hữu 20 Animon hệ Điện.', rewardCoins: 1000, icon: '🌩️' },
  { id: 'element_electric_50', title: 'Lôi thần Hàng lâm', description: 'Sở hữu 50 Animon hệ Điện.', rewardCoins: 3000, icon: '⛈️' },
  // ĐẤT
  { id: 'element_earth_5', title: 'Bậc thầy hệ Đất', description: 'Sở hữu 5 Animon hệ Đất (Earth).', rewardCoins: 300, icon: '🪨' },
  { id: 'element_earth_20', title: 'Kiến tạo địa hình', description: 'Sở hữu 20 Animon hệ Đất.', rewardCoins: 1000, icon: '🧱' },
  { id: 'element_earth_50', title: 'Thổ thần Hàng lâm', description: 'Sở hữu 50 Animon hệ Đất.', rewardCoins: 3000, icon: '⛰️' },

  // --- TRƯNG BÀY & TƯƠNG TÁC ---
  { id: 'showcase_1', title: 'Khoe khoang', description: 'Trưng bày 1 Animon trong tủ kính.', rewardCoins: 50, icon: '🖼️' },
  { id: 'showcase_5', title: 'Nhà sưu tầm', description: 'Trưng bày đủ 5 Animon trong tủ kính.', rewardCoins: 200, icon: '✨' },

  // --- TÀI CHÍNH (COINS) ---
  { id: 'rich_1000', title: 'Rủng rỉnh', description: 'Sở hữu 1,000 Coins.', rewardCoins: 500, icon: '💰' },
  { id: 'rich_5000', title: 'Thương nhân', description: 'Sở hữu 5,000 Coins.', rewardCoins: 1000, icon: '💎' },
  { id: 'rich_20000', title: 'Trọc phú', description: 'Sở hữu 20,000 Coins.', rewardCoins: 3000, icon: '💳' },
  { id: 'rich_50000', title: 'Đại gia ngầm', description: 'Sở hữu 50,000 Coins.', rewardCoins: 8000, icon: '🏦' },
  { id: 'rich_100000', title: 'Top 1 Server', description: 'Sở hữu 100,000 Coins.', rewardCoins: 20000, icon: '🤑' },

  // --- CỘNG ĐỒNG (BẠN BÈ) ---
  { id: 'first_friend', title: 'Người quảng giao', description: 'Kết bạn với 1 người chơi khác.', rewardCoins: 100, icon: '👥' },
  { id: 'friend_5', title: 'Người nổi tiếng', description: 'Kết bạn với 5 người chơi khác.', rewardCoins: 500, icon: '🌟' },
  { id: 'friend_20', title: 'KOL chính hiệu', description: 'Kết bạn với 20 người chơi khác.', rewardCoins: 2000, icon: '📸' },
  { id: 'friend_50', title: 'Chúa tể mạng xã hội', description: 'Kết bạn với 50 người chơi khác.', rewardCoins: 5000, icon: '🌐' },

  // --- CHIẾN ĐẤU (ARENA WINS) ---
  { id: 'first_win', title: 'Đấu sĩ', description: 'Thắng 1 trận chiến Arena.', rewardCoins: 200, icon: '⚔️' },
  { id: 'win_10', title: 'Chuyên gia đấu trường', description: 'Thắng 10 trận chiến Arena.', rewardCoins: 500, icon: '🥇' },
  { id: 'win_50', title: 'Độc cô cầu bại', description: 'Thắng 50 trận chiến Arena.', rewardCoins: 3000, icon: '🔥' },
  { id: 'win_100', title: 'Huyền thoại võ thuật', description: 'Thắng 100 trận chiến Arena.', rewardCoins: 8000, icon: '🥋' },

  // --- THỜI GIAN BẮT ANIMON ---
  { id: 'night_owl', title: 'Cú đêm', description: 'Bắt 1 Animon trong khoảng 22h - 4h sáng.', rewardCoins: 200, icon: '🦉' },
  { id: 'early_bird', title: 'Chim sớm bắt sâu', description: 'Bắt 1 Animon trong khoảng 4h - 7h sáng.', rewardCoins: 200, icon: '🌅' },
  { id: 'sun_baker', title: 'Phơi nắng', description: 'Bắt 1 Animon giữa trưa (11h - 13h).', rewardCoins: 200, icon: '☀️' },
  { id: 'sunset_lover', title: 'Kẻ si tình', description: 'Bắt 1 Animon lúc hoàng hôn (17h - 19h).', rewardCoins: 200, icon: '🌇' },
];
