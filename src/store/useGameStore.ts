import { create } from 'zustand';
import type { CardStats } from '../utils/cardLogic';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

export interface Animon {
  id: string; // unique local or DB id
  owner_id?: string;
  name: string;
  imageUrl: string;
  stats: CardStats; // We will flat map this to the DB later but keep it nested here for convenience
  createdAt: number;
  is_trading?: boolean;
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
  addAnimon: (animon: Omit<Animon, 'id' | 'imageUrl' | 'createdAt'>, file: File) => Promise<boolean>;
  listAnimonForSale: (animonId: string, price: number) => Promise<boolean>;
  quickSellAnimon: (animonId: string) => Promise<boolean>;
  buyAnimon: (tradeId: string) => Promise<boolean>;
  cancelTrade: (tradeId: string, animonId: string) => Promise<boolean>;
  signOut: () => Promise<void>;
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

  setSession: (session) => {
    set({ session, user: session?.user || null });
    if (session?.user) {
      get().fetchProfile();
      get().fetchInventory();
      get().fetchFriends();
    } else {
      set({ inventory: [], coins: 0, username: null, isLoading: false, friends: [], friendRequests: [] });
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
          rank_points: data.rank_points || 0,
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

  addAnimon: async (animonData, file) => {
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
  }
}));
