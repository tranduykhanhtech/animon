import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Animon } from './useGameStore';

interface BattlePlayer {
  id?: string;
  username: string;
  animon: Animon;
  hp: number;
  maxHp: number;
}

interface BattleState {
  isSearching: boolean;
  roomId: string | null;
  opponent: BattlePlayer | null;
  me: BattlePlayer | null;
  isMyTurn: boolean;
  battleLog: string[];
  channel: RealtimeChannel | null;
  
  startSearch: (myAnimon: Animon, username: string, myRankPoints: number) => Promise<void>;
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

  startSearch: async (myAnimon, username, myRankPoints) => {
    set({ isSearching: true, battleLog: ['Đang dò tìm đối thủ cùng bậc Hạng...'] });
    
    // Skill-based Matchmaking using Presence
    const matchChannel = supabase.channel('matchmaking');
    
    matchChannel
      .on('presence', { event: 'sync' }, () => {
        const state = matchChannel.presenceState();
        const waitingPlayers = Object.values(state).flat() as any[];
        
        // Find someone waiting with +/- 200 Rank Points
        const opponent = waitingPlayers.find(p => 
          p.username !== username && Math.abs((p.rankPoints || 0) - myRankPoints) <= 200
        );
        
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
          // If I'm the first, create a room ID and broadcast my presence with my rank
          const roomId = `battle_${Date.now()}_${username}`;
          await matchChannel.track({ username, myAnimon, roomId, rankPoints: myRankPoints });
          
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

    let damage = Math.max(1, Math.floor(me.animon.stats.power * (0.8 + Math.random() * 0.4)));
    
    let isCrit = false;
    let isDodge = false;
    let vampireHeal = 0;
    let thornsDamage = 0;

    const myAbility = me.animon.stats.hidden_ability;
    const oppAbility = opponent.animon.stats.hidden_ability;

    if (myAbility === 'Critical Strike' && Math.random() < 0.20) {
      isCrit = true;
      damage *= 2;
    }

    if (oppAbility === 'Dodge' && Math.random() < 0.15) {
      isDodge = true;
      damage = 0;
    }

    if (!isDodge) {
      if (myAbility === 'Vampire') {
        vampireHeal = Math.floor(damage * 0.3);
      }
      if (oppAbility === 'Thorns') {
        thornsDamage = Math.floor(damage * 0.2);
      }
    }

    const newOpponentHp = Math.max(0, opponent.hp - damage);
    const newMyHp = Math.min(me.maxHp, Math.max(0, me.hp + vampireHeal - thornsDamage));
    
    let logMsg = `Bạn đã tấn công gây ${damage} sát thương!`;
    if (isDodge) logMsg = `Đối thủ đã NÉ TRÁNH đòn tấn công của bạn!`;
    else if (isCrit) logMsg = `CHÍ MẠNG! Bạn gây ${damage} sát thương!`;

    const logs = [logMsg, ...get().battleLog];
    if (vampireHeal > 0) logs.unshift(`Bạn được hồi ${vampireHeal} HP nhờ Hút Máu!`);
    if (thornsDamage > 0) logs.unshift(`Bạn bị phản ${thornsDamage} sát thương từ Gai Nhọn!`);

    set({ 
      opponent: { ...opponent, hp: newOpponentHp },
      me: { ...me, hp: newMyHp },
      isMyTurn: false,
      battleLog: logs
    });

    // Broadcast attack
    channel.send({
      type: 'broadcast',
      event: 'attack',
      payload: { damage, isCrit, isDodge, vampireHeal, thornsDamage, attacker: me.username }
    });

    if (newOpponentHp === 0) {
      set({ battleLog: ['Bạn đã chiến thắng! 🎉 (Đang cập nhật kết quả...)', ...get().battleLog] });
      
      // Call record_battle_result RPC
      if (opponent.id) {
        supabase.rpc('record_battle_result', { p_loser_id: opponent.id })
          .then(({ error }) => {
            if (error) {
              console.error('Lỗi khi cập nhật hạng:', error);
            } else {
              set({ battleLog: ['Bạn được cộng +25 RP!', ...get().battleLog] });
              // Refresh user profile to get new rank
              import('./useGameStore').then(({ useGameStore }) => {
                useGameStore.getState().fetchProfile();
              });
            }
          });
      }
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
  
  let myId: string | undefined;
  import('./useGameStore').then(({ useGameStore }) => {
    myId = useGameStore.getState().user?.id;
    useBattleStore.setState({
      me: { id: myId, username, animon: myAnimon, hp: myMaxHp, maxHp: myMaxHp }
    });
  });
  
  useBattleStore.setState({
    roomId,
    me: { id: myId, username, animon: myAnimon, hp: myMaxHp, maxHp: myMaxHp },
    isMyTurn: isHost, // Host goes first
    battleLog: ['Vào phòng đấu! Chờ đối thủ...', ...store.battleLog],
    channel: battleChannel
  });

  if (initialOpponent) {
    const oppMaxHp = initialOpponent.myAnimon.stats.power * 5 + initialOpponent.myAnimon.stats.energy * 10;
    useBattleStore.setState({
      opponent: { id: initialOpponent.id, username: initialOpponent.username, animon: initialOpponent.myAnimon, hp: oppMaxHp, maxHp: oppMaxHp },
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
          opponent: { id: opp.id, username: opp.username, animon: opp.animon, hp: oppMaxHp, maxHp: oppMaxHp },
          battleLog: [`Đối thủ ${opp.username} đã xuất hiện!`, ...useBattleStore.getState().battleLog]
        });
      }
    })
    .on('broadcast', { event: 'attack' }, (payload) => {
      const { damage, isCrit, isDodge, vampireHeal, thornsDamage, attacker } = payload.payload;
      const me = useBattleStore.getState().me;
      const opponent = useBattleStore.getState().opponent;
      if (!me || !opponent) return;
      
      const newHp = Math.max(0, me.hp - damage);
      const newOppHp = Math.min(opponent.maxHp, Math.max(0, opponent.hp + vampireHeal - thornsDamage));
      
      let logMsg = `Đối thủ đã tấn công gây ${damage} sát thương!`;
      if (isDodge) logMsg = `Bạn đã NÉ TRÁNH đòn tấn công của đối thủ!`;
      else if (isCrit) logMsg = `CHÍ MẠNG! Đối thủ gây ${damage} sát thương!`;

      const logs = [logMsg, ...useBattleStore.getState().battleLog];
      if (vampireHeal > 0) logs.unshift(`Đối thủ được hồi ${vampireHeal} HP nhờ Hút Máu!`);
      if (thornsDamage > 0) logs.unshift(`Đối thủ bị phản ${thornsDamage} sát thương từ Gai Nhọn!`);

      useBattleStore.setState({
        me: { ...me, hp: newHp },
        opponent: { ...opponent, hp: newOppHp },
        isMyTurn: true,
        battleLog: logs
      });

      if (newHp === 0) {
        useBattleStore.setState({ battleLog: ['Bạn đã thua cuộc... 😢', ...useBattleStore.getState().battleLog] });
      }
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const currentMe = useBattleStore.getState().me;
        await battleChannel.track({ id: currentMe?.id, username, animon: myAnimon });
      }
    });
}
