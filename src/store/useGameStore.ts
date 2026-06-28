import { create } from 'zustand';
import type { CardStats } from '../utils/cardLogic';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { ACHIEVEMENTS } from '../constants/achievements';

export interface Animon {
  id: string; // unique local or DB id
  owner_id?: string;
  name: string;
  imageUrl: string;
  stats: CardStats; // We will flat map this to the DB later but keep it nested here for convenience
  createdAt: number;
  is_trading?: boolean;
  is_showcased?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface Trade {
  id: string;
  seller_id: string;
  animon_id: string;
  price: number;
  status: 'open' | 'completed' | 'cancelled';
  animon: Animon; // joined data
  seller: { username: string };
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted';
  sender: { username: string; email?: string };
  receiver: { username: string; email?: string };
}

export interface LeaderboardUser {
  id: string;
  username: string;
  rank_points: number;
}

export interface MatchHistoryEntry {
  id: string;
  winner_id: string;
  loser_id: string;
  points_change: number;
  created_at: string;
  winner: { username: string };
  loser: { username: string };
}

interface GameState {
  session: Session | null;
  user: User | null;
  username: string | null;
  inventory: Animon[];
  marketplace: Trade[];
  friends: FriendRequest[];
  friendRequests: FriendRequest[];
  coins: number;
  rank_points: number;
  leaderboard: LeaderboardUser[];
  matchHistory: MatchHistoryEntry[];
  isLoading: boolean;
  
  unlockedAchievements: string[];
  claimedAchievements: string[];
  
  unlockedItems: string[];
  equippedFrame: string | null;
  equippedBackground: string | null;
  equippedTitle: string | null;
  equippedMarker: string | null;

  setSession: (session: Session | null) => void;
  fetchProfile: () => Promise<void>;
  fetchInventory: () => Promise<void>;
  fetchMarketplace: () => Promise<void>;
  fetchFriends: () => Promise<void>;
  fetchLeaderboard: () => Promise<void>;
  fetchMatchHistory: () => Promise<void>;
  sendFriendRequest: (email: string) => Promise<{ success: boolean; message: string }>;
  acceptFriendRequest: (id: string) => Promise<boolean>;
  rejectFriendRequest: (id: string) => Promise<boolean>;
  unfriend: (id: string) => Promise<boolean>;
  toggleShowcase: (animonId: string, currentStatus: boolean) => Promise<{ success: boolean; message: string }>;
  addAnimon: (animon: Omit<Animon, 'id' | 'imageUrl' | 'createdAt'>, file: File, lat?: number, lng?: number) => Promise<boolean>;
  listAnimonForSale: (animonId: string, price: number) => Promise<boolean>;
  quickSellAnimon: (animonId: string) => Promise<boolean>;
  buyAnimon: (tradeId: string) => Promise<boolean>;
  cancelTrade: (tradeId: string, animonId: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  
  fetchAchievements: () => Promise<void>;
  claimAchievement: (achievementId: string) => Promise<boolean>;
  checkAchievements: () => Promise<void>;
  
  fetchDecorations: () => Promise<void>;
  buyDecoration: (itemId: string, price: number) => Promise<{ success: boolean; message: string }>;
  equipDecoration: (itemId: string, type: 'frame' | 'background') => Promise<{ success: boolean; message: string }>;
}

export const useGameStore = create<GameState>((set, get) => ({
  session: null,
  user: null,
  username: null,
  inventory: [],
  marketplace: [],
  friends: [],
  friendRequests: [],
  coins: 0,
  rank_points: 0,
  leaderboard: [],
  matchHistory: [],
  isLoading: true,
  unlockedAchievements: [],
  claimedAchievements: [],
  unlockedItems: [],
  equippedFrame: null,
  equippedBackground: null,
  equippedTitle: null,
  equippedMarker: null,

  setSession: (session) => {
    set({ session, user: session?.user || null });
    if (session?.user) {
      get().fetchProfile();
      get().fetchInventory();
      get().fetchFriends();
      get().fetchAchievements();
      get().fetchDecorations();
    } else {
      set({ 
        inventory: [], coins: 0, username: null, isLoading: false, 
        friends: [], friendRequests: [], unlockedAchievements: [], claimedAchievements: [],
        unlockedItems: [], equippedFrame: null, equippedBackground: null, equippedTitle: null, equippedMarker: null
      });
    }
  },

  fetchProfile: async () => {
    const user = get().user;
    if (!user) return;
        const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (data) {
        set({ 
          username: data.username,
          coins: data.coins,
          rank_points: data.rank_points,
          equippedFrame: data.equipped_frame,
          equippedBackground: data.equipped_background,
          equippedTitle: data.equipped_title,
          equippedMarker: data.equipped_marker,
          isLoading: false 
        });
      } else {
        set({ isLoading: false });
      }
  },

  fetchInventory: async () => {
    const user = get().user;
    if (!user) return;

    const { data, error } = await supabase
      .from('animons')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (data && !error) {
      // Map DB schema back to local state schema
      const mappedInventory: Animon[] = data.map(row => ({
        id: row.id,
        owner_id: row.owner_id,
        name: row.name,
        imageUrl: row.image_url,
        createdAt: new Date(row.created_at).getTime(),
        is_trading: row.is_trading,
        is_showcased: row.is_showcased,
        latitude: row.latitude,
        longitude: row.longitude,
        stats: {
          element: row.element as any,
          rarity: row.rarity as any,
          power: row.power,
          energy: row.energy,
          seed: row.seed,
          value: row.value || 0,
          hidden_ability: row.hidden_ability || 'None',
        }
      }));
      
      set({ inventory: mappedInventory });
    }
  },

  addAnimon: async (animonData, file, lat, lng) => {
    const user = get().user;
    if (!user) return false;

    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `captures/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('animons_images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('animons_images')
        .getPublicUrl(filePath);

      // 3. Insert to DB
      const dbRecord = {
        owner_id: user.id,
        name: animonData.name,
        image_url: publicUrl,
        element: animonData.stats.element,
        rarity: animonData.stats.rarity,
        power: animonData.stats.power,
        energy: animonData.stats.energy,
        seed: animonData.stats.seed,
        value: animonData.stats.value,
        hidden_ability: animonData.stats.hidden_ability,
        latitude: lat,
        longitude: lng,
      };

      const { data, error: insertError } = await supabase
        .from('animons')
        .insert(dbRecord)
        .select()
        .single();

      if (insertError) throw insertError;

      // 4. Update Local State
      const newAnimon: Animon = {
        id: data.id,
        owner_id: data.owner_id,
        name: data.name,
        imageUrl: data.image_url,
        createdAt: new Date(data.created_at).getTime(),
        stats: animonData.stats
      };

      set((state) => ({ inventory: [newAnimon, ...state.inventory] }));
      get().checkAchievements();
      return true;

    } catch (err) {
      console.error('Error adding animon:', err);
      return false;
    }
  },

  fetchMarketplace: async () => {
    const { data, error } = await supabase
      .from('trades')
      .select(`
        *,
        animons(*),
        users!trades_seller_id_fkey(username)
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (data && !error) {
      const mappedMarket: Trade[] = data.map((row: any) => ({
        id: row.id,
        seller_id: row.seller_id,
        animon_id: row.animon_id,
        price: row.price,
        status: row.status,
        seller: { username: row.users.username },
        animon: {
          id: row.animons.id,
          owner_id: row.animons.owner_id,
          name: row.animons.name,
          imageUrl: row.animons.image_url,
          createdAt: new Date(row.animons.created_at).getTime(),
          is_trading: row.animons.is_trading,
          stats: {
            element: row.animons.element,
            rarity: row.animons.rarity,
            power: row.animons.power,
            energy: row.animons.energy,
            seed: row.animons.seed,
            value: row.animons.value || 0,
            hidden_ability: row.animons.hidden_ability || 'None',
          }
        }
      }));
      set({ marketplace: mappedMarket });
    }
  },

  fetchFriends: async () => {
    const user = get().user;
    if (!user) return;

    // Fetch friendships where I am sender or receiver
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id,
        status,
        sender_id,
        receiver_id,
        sender:users!friendships_sender_id_fkey(username, email),
        receiver:users!friendships_receiver_id_fkey(username, email)
      `);

    if (data && !error) {
      // Map to generic object
      const allFriendships = data as any[];
      
      const accepted = allFriendships.filter(f => f.status === 'accepted');
      const pendingRequests = allFriendships.filter(f => f.status === 'pending' && f.receiver_id === user.id);
      
      set({ 
        friends: accepted, 
        friendRequests: pendingRequests
      });
    }
  },

  fetchLeaderboard: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, rank_points')
      .order('rank_points', { ascending: false })
      .limit(50);

    if (data && !error) {
      set({ leaderboard: data });
    }
  },

  fetchMatchHistory: async () => {
    const user = get().user;
    if (!user) return;

    const { data, error } = await supabase
      .from('match_history')
      .select(`
        *,
        winner:users!match_history_winner_id_fkey(username),
        loser:users!match_history_loser_id_fkey(username)
      `)
      .or(`winner_id.eq.${user.id},loser_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data && !error) {
      set({ matchHistory: data });
    }
  },

  sendFriendRequest: async (email: string) => {
    const user = get().user;
    if (!user) return { success: false, message: 'Chưa đăng nhập' };

    try {
      // Find user by email using RPC
      const { data: searchData, error: searchError } = await supabase
        .rpc('get_user_by_email', { search_email: email });

      if (searchError || !searchData || searchData.length === 0) {
        return { success: false, message: 'Không tìm thấy người chơi với Email này!' };
      }

      const targetUserId = searchData[0].id;
      
      if (targetUserId === user.id) {
        return { success: false, message: 'Bạn không thể tự kết bạn với chính mình!' };
      }

      // Check if already friends or requested
      const { data: existing } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user.id})`)
        .maybeSingle();

      if (existing) {
        return { success: false, message: 'Hai người đã là bạn bè hoặc đã gửi lời mời rồi!' };
      }

      // Insert request
      const { error: insertError } = await supabase
        .from('friendships')
        .insert({
          sender_id: user.id,
          receiver_id: targetUserId,
          status: 'pending'
        });

      if (insertError) throw insertError;
      
      return { success: true, message: 'Đã gửi lời mời thành công!' };

    } catch (err: any) {
      console.error(err);
      return { success: false, message: 'Có lỗi xảy ra khi gửi lời mời.' };
    }
  },

  acceptFriendRequest: async (id: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', id);
      
    if (!error) {
      get().fetchFriends();
      return true;
    }
    return false;
  },

  rejectFriendRequest: async (id: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', id);
      
    if (!error) {
      get().fetchFriends();
      return true;
    }
    return false;
  },

  unfriend: async (id: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', id);
      
    if (!error) {
      get().fetchFriends();
      return true;
    }
    return false;
  },

  toggleShowcase: async (animonId: string, currentStatus: boolean) => {
    const user = get().user;
    if (!user) return { success: false, message: 'Chưa đăng nhập' };

    const inventory = get().inventory;
    
    // Check limit if trying to showcase
    if (!currentStatus) {
      const showcasedCount = inventory.filter(a => a.is_showcased).length;
      if (showcasedCount >= 5) {
        return { success: false, message: 'Bạn chỉ có thể trưng bày tối đa 5 Animon!' };
      }
    }

    const { error } = await supabase
      .from('animons')
      .update({ is_showcased: !currentStatus })
      .eq('id', animonId);

    if (!error) {
      await get().fetchInventory(); // Reload inventory
      get().checkAchievements();
      return { success: true, message: currentStatus ? 'Đã gỡ khỏi tủ kính.' : 'Đã đưa vào tủ kính trưng bày!' };
    }
    return { success: false, message: 'Có lỗi xảy ra khi cập nhật tủ kính.' };
  },

  listAnimonForSale: async (animonId, price) => {
    const user = get().user;
    if (!user) return false;

    try {
      // 1. Set is_trading = true on animon
      const { error: animonError } = await supabase
        .from('animons')
        .update({ is_trading: true })
        .eq('id', animonId);
      
      if (animonError) throw animonError;

      // 2. Insert trade record
      const { error: tradeError } = await supabase
        .from('trades')
        .insert({
          seller_id: user.id,
          animon_id: animonId,
          price
        });

      if (tradeError) throw tradeError;

      // Update local state
      set((state) => ({
        inventory: state.inventory.map(a => 
          a.id === animonId ? { ...a, is_trading: true } : a
        )
      }));

      return true;
    } catch (err) {
      console.error('Error listing animon:', err);
      return false;
    }
  },

  quickSellAnimon: async (animonId: string) => {
    try {
      const { error } = await supabase.rpc('quick_sell_animon', { p_animon_id: animonId });
      if (error) {
        alert(error.message);
        return false;
      }
      
      // Update local state
      await get().fetchProfile();
      await get().fetchInventory();
      return true;
    } catch (err) {
      console.error('Error quick selling animon:', err);
      return false;
    }
  },

  buyAnimon: async (tradeId) => {
    try {
      // Call RPC function
      const { error } = await supabase.rpc('buy_animon', { p_trade_id: tradeId });
      
      if (error) {
        alert(error.message);
        return false;
      }

      // Success, refresh data
      await get().fetchProfile();
      await get().fetchInventory();
      await get().fetchMarketplace();
      
      return true;
    } catch (err) {
      console.error('Error buying animon:', err);
      return false;
    }
  },

  cancelTrade: async (tradeId: string, animonId: string) => {
    try {
      const { error } = await supabase.rpc('cancel_trade', {
        p_trade_id: tradeId,
        p_animon_id: animonId
      });

      if (error) {
        alert(error.message);
        return false;
      }

      // Refresh lại data
      await get().fetchInventory();
      await get().fetchMarketplace();
      
      return true;
    } catch (err) {
      console.error('Error cancelling trade:', err);
      return false;
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, inventory: [], coins: 0, rank_points: 0, username: null, leaderboard: [], matchHistory: [] });
  },
  
  fetchAchievements: async () => {
    const user = get().user;
    if (!user) return;
    const { data } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', user.id);
    
    if (data) {
      set({
        unlockedAchievements: data.map(a => a.achievement_id),
        claimedAchievements: data.filter(a => a.is_claimed).map(a => a.achievement_id)
      });
    }
    // Also check immediately in case they qualify for new ones
    get().checkAchievements();
  },

  claimAchievement: async (achievementId: string) => {
    const user = get().user;
    if (!user) return false;

    const achievementConfig = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievementConfig) return false;
    
    const { unlockedAchievements, claimedAchievements } = get();
    if (!unlockedAchievements.includes(achievementId) || claimedAchievements.includes(achievementId)) {
      return false; // Not unlocked or already claimed
    }

    const { error } = await supabase
      .from('user_achievements')
      .update({ is_claimed: true })
      .eq('user_id', user.id)
      .eq('achievement_id', achievementId);

    if (error) return false;

    // Update local state and coins
    const newCoins = get().coins + achievementConfig.rewardCoins;
    set({
      claimedAchievements: [...claimedAchievements, achievementId],
      coins: newCoins
    });
    
    await supabase.rpc('add_user_coins', {
       amount: achievementConfig.rewardCoins
    });

    return true;
  },

  checkAchievements: async () => {
    const user = get().user;
    if (!user) return;
    
    const { inventory, coins, friends, unlockedAchievements, matchHistory } = get();
    const newUnlocks: string[] = [];

    // Pre-calculate stats for checking
    const totalCaught = inventory.length;
    const epicCount = inventory.filter(a => a.stats.rarity === 'Epic').length;
    const legendaryCount = inventory.filter(a => a.stats.rarity === 'Legendary').length;
    const fireCount = inventory.filter(a => a.stats.element === 'Fire').length;
    const waterCount = inventory.filter(a => a.stats.element === 'Water').length;
    const grassCount = inventory.filter(a => a.stats.element === 'Grass').length;
    const electricCount = inventory.filter(a => a.stats.element === 'Electric').length;
    const earthCount = inventory.filter(a => a.stats.element === 'Earth').length;
    const showcasedCount = inventory.filter(a => a.is_showcased).length;
    const wins = matchHistory ? matchHistory.filter(m => m.winner_id === user.id).length : 0;
    const totalFriends = friends.length;

    // Helper to check time
    const hasCatchInHourRange = (start: number, end: number) => {
      return inventory.some(a => {
        const h = new Date(a.createdAt).getHours();
        if (start > end) { // e.g. 22 to 4
          return h >= start || h < end;
        }
        return h >= start && h < end;
      });
    };

    // Dictionary of conditions
    const conditions: Record<string, boolean> = {
      // Bắt Animon
      'first_catch': totalCaught >= 1,
      'catch_10': totalCaught >= 10,
      'catch_50': totalCaught >= 50,
      'catch_100': totalCaught >= 100,
      'catch_200': totalCaught >= 200,
      'catch_500': totalCaught >= 500,
      // Độ hiếm
      'epic_1': epicCount >= 1,
      'epic_10': epicCount >= 10,
      'epic_50': epicCount >= 50,
      'catch_legendary': legendaryCount >= 1,
      'legendary_5': legendaryCount >= 5,
      'legendary_10': legendaryCount >= 10,
      // Hệ
      'element_fire_5': fireCount >= 5,
      'element_fire_20': fireCount >= 20,
      'element_fire_50': fireCount >= 50,
      'element_water_5': waterCount >= 5,
      'element_water_20': waterCount >= 20,
      'element_water_50': waterCount >= 50,
      'element_grass_5': grassCount >= 5,
      'element_grass_20': grassCount >= 20,
      'element_grass_50': grassCount >= 50,
      'element_electric_5': electricCount >= 5,
      'element_electric_20': electricCount >= 20,
      'element_electric_50': electricCount >= 50,
      'element_earth_5': earthCount >= 5,
      'element_earth_20': earthCount >= 20,
      'element_earth_50': earthCount >= 50,
      // Trưng bày
      'showcase_1': showcasedCount >= 1,
      'showcase_5': showcasedCount >= 5,
      // Tài chính
      'rich_1000': coins >= 1000,
      'rich_5000': coins >= 5000,
      'rich_20000': coins >= 20000,
      'rich_50000': coins >= 50000,
      'rich_100000': coins >= 100000,
      // Bạn bè
      'first_friend': totalFriends >= 1,
      'friend_5': totalFriends >= 5,
      'friend_20': totalFriends >= 20,
      'friend_50': totalFriends >= 50,
      // Chiến đấu
      'first_win': wins >= 1,
      'win_10': wins >= 10,
      'win_50': wins >= 50,
      'win_100': wins >= 100,
      // Thời gian
      'night_owl': hasCatchInHourRange(22, 4),
      'early_bird': hasCatchInHourRange(4, 7),
      'sun_baker': hasCatchInHourRange(11, 13),
      'sunset_lover': hasCatchInHourRange(17, 19),
    };

    // Evaluate all achievements configured in constants
    ACHIEVEMENTS.forEach(ach => {
      if (!unlockedAchievements.includes(ach.id) && conditions[ach.id]) {
        newUnlocks.push(ach.id);
      }
    });

    if (newUnlocks.length > 0) {
      // Insert new achievements
      const inserts = newUnlocks.map(ach_id => ({
        user_id: user.id,
        achievement_id: ach_id
      }));
      
      const { error } = await supabase.from('user_achievements').insert(inserts);
      if (!error) {
        set({ unlockedAchievements: [...unlockedAchievements, ...newUnlocks] });
      }
    }
  },

  fetchDecorations: async () => {
    const user = get().user;
    if (!user) return;
    const { data } = await supabase.from('user_items').select('item_id').eq('user_id', user.id);
    if (data) {
      set({ unlockedItems: data.map(d => d.item_id) });
    }
  },

  buyDecoration: async (itemId: string, price: number) => {
    const { user, coins, unlockedItems } = get();
    if (!user) return { success: false, message: 'Chưa đăng nhập' };
    if (coins < price) return { success: false, message: 'Không đủ Coins' };
    if (unlockedItems.includes(itemId)) return { success: false, message: 'Đã sở hữu' };

    const { error } = await supabase.rpc('buy_decoration', { p_item_id: itemId, p_price: price });
    
    if (error) {
      console.error(error);
      return { success: false, message: 'Lỗi khi mua' };
    }

    set({ 
      coins: coins - price,
      unlockedItems: [...unlockedItems, itemId]
    });
    
    return { success: true, message: 'Mua thành công!' };
  },

  equipDecoration: async (itemId: string, type: string) => {
    const { user } = get();
    if (!user) return { success: false, message: 'Chưa đăng nhập' };

    const { error } = await supabase.rpc('equip_decoration', { p_item_id: itemId, p_type: type });
    
    if (error) {
      console.error(error);
      return { success: false, message: 'Lỗi khi trang bị' };
    }

    if (type === 'frame') {
      set({ equippedFrame: itemId === 'default' ? null : itemId });
    } else if (type === 'background') {
      set({ equippedBackground: itemId === 'default' ? null : itemId });
    } else if (type === 'title') {
      set({ equippedTitle: itemId === 'default' ? null : itemId });
    } else if (type === 'marker') {
      set({ equippedMarker: itemId === 'default' ? null : itemId });
    }

    return { success: true, message: 'Trang bị thành công!' };
  }
}));
