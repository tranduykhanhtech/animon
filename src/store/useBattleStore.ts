import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Animon } from './useGameStore';

interface BattleState {
  isSearching: boolean;
  roomId: string | null;
  opponent: { username: string; animon: Animon; hp: number; maxHp: number } | null;
  me: { username: string; animon: Animon; hp: number; maxHp: number } | null;
  isMyTurn: boolean;
  battleLog: string[];
  channel: RealtimeChannel | null;
  
  startSearch: (myAnimon: Animon, username: string) => void;
  cancelSearch: () => void;
  attack: () => void;
  leaveBattle: () => void;
  joinPrivateBattle: (roomId: string, myAnimon: Animon, username: string, isHost: boolean) => void;
}

export const useBattleStore = create<BattleState>((set, get) => ({
  isSearching: false,
  roomId: null,
  opponent: null,
  me: null,
  isMyTurn: false,
  battleLog: [],
  channel: null,

  startSearch: async (myAnimon, username) => {
    set({ isSearching: true, battleLog: ['Đang tìm đối thủ...'] });
    
    // Very simple Matchmaking using Presence
    const matchChannel = supabase.channel('matchmaking');
    
    matchChannel
      .on('presence', { event: 'sync' }, () => {
        const state = matchChannel.presenceState();
        const waitingPlayers = Object.values(state).flat() as any[];
        
        // Find someone else waiting
        const opponent = waitingPlayers.find(p => p.username !== username);
        
        if (opponent && get().isSearching) {
          // Found someone! We join their room
          const roomId = opponent.roomId;
          get().cancelSearch(); // Stop matchmaking
          
          // Join Battle Channel
          joinBattleRoom(roomId, myAnimon, username, opponent, false);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // If I'm the first, create a room ID and broadcast my presence
          const roomId = `battle_${Date.now()}_${username}`;
          await matchChannel.track({ username, myAnimon, roomId });
          
          // I will be host
          setTimeout(() => {
            if (get().isSearching && !get().roomId) {
              get().cancelSearch();
              joinBattleRoom(roomId, myAnimon, username, null, true);
            }
          }, 2000); // Wait 2s to see if someone is already there, if not, become host
        }
      });
      
    set({ channel: matchChannel });
  },

  cancelSearch: () => {
    const channel = get().channel;
    if (channel) {
      channel.unsubscribe();
    }
    set({ isSearching: false, channel: null });
  },

  attack: () => {
    const { channel, me, opponent, isMyTurn } = get();
    if (!channel || !me || !opponent || !isMyTurn) return;

    // Calculate damage based on power and random variance
    const damage = Math.max(1, Math.floor(me.animon.stats.power * (0.8 + Math.random() * 0.4)));
    
    // Optimistic update
    const newOpponentHp = Math.max(0, opponent.hp - damage);
    set({ 
      opponent: { ...opponent, hp: newOpponentHp },
      isMyTurn: false,
      battleLog: [`Bạn đã tấn công gây ${damage} sát thương!`, ...get().battleLog]
    });

    // Broadcast attack
    channel.send({
      type: 'broadcast',
      event: 'attack',
      payload: { damage, attacker: me.username }
    });

    if (newOpponentHp === 0) {
      set({ battleLog: ['Bạn đã chiến thắng! 🎉', ...get().battleLog] });
    }
  },

  leaveBattle: () => {
    const channel = get().channel;
    if (channel) channel.unsubscribe();
    set({ roomId: null, opponent: null, me: null, isMyTurn: false, battleLog: [], channel: null, isSearching: false });
  },

  joinPrivateBattle: (roomId, myAnimon, username, isHost) => {
    joinBattleRoom(roomId, myAnimon, username, null, isHost);
  }
}));

// Helper function to handle Battle Room logic
function joinBattleRoom(roomId: string, myAnimon: Animon, username: string, initialOpponent: any, isHost: boolean) {
  const store = useBattleStore.getState();
  const battleChannel = supabase.channel(roomId);

  const myMaxHp = myAnimon.stats.power * 5 + myAnimon.stats.energy * 10;
  
  useBattleStore.setState({
    roomId,
    me: { username, animon: myAnimon, hp: myMaxHp, maxHp: myMaxHp },
    isMyTurn: isHost, // Host goes first
    battleLog: ['Vào phòng đấu! Chờ đối thủ...', ...store.battleLog],
    channel: battleChannel
  });

  if (initialOpponent) {
    const oppMaxHp = initialOpponent.myAnimon.stats.power * 5 + initialOpponent.myAnimon.stats.energy * 10;
    useBattleStore.setState({
      opponent: { username: initialOpponent.username, animon: initialOpponent.myAnimon, hp: oppMaxHp, maxHp: oppMaxHp },
      battleLog: [`Đối thủ ${initialOpponent.username} đã xuất hiện!`, ...useBattleStore.getState().battleLog]
    });
  }

  battleChannel
    .on('presence', { event: 'sync' }, () => {
      const state = battleChannel.presenceState();
      const players = Object.values(state).flat() as any[];
      const opp = players.find(p => p.username !== username);
      
      if (opp && !useBattleStore.getState().opponent) {
        const oppMaxHp = opp.animon.stats.power * 5 + opp.animon.stats.energy * 10;
        useBattleStore.setState({
          opponent: { username: opp.username, animon: opp.animon, hp: oppMaxHp, maxHp: oppMaxHp },
          battleLog: [`Đối thủ ${opp.username} đã xuất hiện!`, ...useBattleStore.getState().battleLog]
        });
      }
    })
    .on('broadcast', { event: 'attack' }, (payload) => {
      const { damage } = payload.payload;
      const me = useBattleStore.getState().me;
      if (!me) return;
      
      const newHp = Math.max(0, me.hp - damage);
      useBattleStore.setState({
        me: { ...me, hp: newHp },
        isMyTurn: true,
        battleLog: [`Đối thủ đã tấn công gây ${damage} sát thương!`, ...useBattleStore.getState().battleLog]
      });

      if (newHp === 0) {
        useBattleStore.setState({ battleLog: ['Bạn đã thua cuộc... 😢', ...useBattleStore.getState().battleLog] });
      }
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await battleChannel.track({ username, animon: myAnimon });
      }
    });
}
