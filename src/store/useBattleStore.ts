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



  leaveBattle: () => {
    const channel = get().channel;
    if (channel) channel.unsubscribe();
    if ((window as any).battleInterval) clearInterval((window as any).battleInterval);
    set({ roomId: null, opponent: null, me: null, isMyTurn: false, battleLog: [], channel: null, isSearching: false });
  },

  joinPrivateBattle: (roomId, myAnimon, username, isHost) => {
    joinBattleRoom(roomId, myAnimon, username, null, isHost);
  }
}));

function getElementMultiplier(attackerElement: string, defenderElement: string) {
  if (attackerElement === 'Water' && defenderElement === 'Fire') return 1.5;
  if (attackerElement === 'Fire' && defenderElement === 'Grass') return 1.5;
  if (attackerElement === 'Grass' && defenderElement === 'Earth') return 1.5;
  if (attackerElement === 'Earth' && defenderElement === 'Electric') return 1.5;
  if (attackerElement === 'Electric' && defenderElement === 'Water') return 1.5;
  
  if (attackerElement === 'Fire' && defenderElement === 'Water') return 0.7;
  if (attackerElement === 'Grass' && defenderElement === 'Fire') return 0.7;
  if (attackerElement === 'Earth' && defenderElement === 'Grass') return 0.7;
  if (attackerElement === 'Electric' && defenderElement === 'Earth') return 0.7;
  if (attackerElement === 'Water' && defenderElement === 'Electric') return 0.7;
  
  return 1.0;
}

// Host executes the turn and broadcasts it
function executeTurn(channel: RealtimeChannel, isHostAttacking: boolean) {
  const store = useBattleStore.getState();
  const host = isHostAttacking ? store.me : store.opponent;
  const target = isHostAttacking ? store.opponent : store.me;
  
  if (!host || !target || host.hp <= 0 || target.hp <= 0) return;

  const multiplier = getElementMultiplier(host.animon.stats.element, target.animon.stats.element);
  let damage = Math.max(1, Math.floor(host.animon.stats.power * (0.8 + Math.random() * 0.4) * multiplier));
  
  let isCrit = false;
  let isDodge = false;
  let vampireHeal = 0;
  let thornsDamage = 0;

  const attackerAbility = host.animon.stats.hidden_ability;
  const defenderAbility = target.animon.stats.hidden_ability;

  if (attackerAbility === 'Critical Strike' && Math.random() < 0.20) {
    isCrit = true;
    damage *= 2;
  }

  if (defenderAbility === 'Dodge' && Math.random() < 0.20) {
    isDodge = true;
    damage = 0;
  }

  if (!isDodge) {
    if (attackerAbility === 'Vampire') {
      vampireHeal = Math.floor(damage * 0.5);
    }
    if (defenderAbility === 'Thorns') {
      thornsDamage = Math.floor(damage * 0.3);
    }
  }

  const payload = {
    isHostAttacking,
    damage,
    isCrit,
    isDodge,
    vampireHeal,
    thornsDamage,
    multiplier,
    attackerName: host.username,
    targetName: target.username
  };

  // Apply to local state
  applyTurnResult(payload);

  // Broadcast to peer
  channel.send({
    type: 'broadcast',
    event: 'turn_result',
    payload
  });
}

function applyTurnResult(payload: any) {
  const store = useBattleStore.getState();
  const { damage, isCrit, isDodge, vampireHeal, thornsDamage, multiplier, attackerName, targetName } = payload;
  
  const me = store.me;
  const opponent = store.opponent;
  if (!me || !opponent) return;

  // I am the host if isMyTurn was true initially. Wait, store.isMyTurn might flip.
  // Better to use my username to check if I am the attacker.
  const amIAttacker = me.username === attackerName;
  
  const attacker = amIAttacker ? me : opponent;
  const defender = amIAttacker ? opponent : me;

  const newDefenderHp = Math.max(0, defender.hp - damage);
  const newAttackerHp = Math.min(attacker.maxHp, Math.max(0, attacker.hp + vampireHeal - thornsDamage));

  let logMsg = `⚔️ ${attackerName} tấn công! Gây ${damage} ST.`;
  if (multiplier > 1) logMsg = `🔥 KHẮC HỆ! ${attackerName} gây ${damage} ST.`;
  else if (multiplier < 1) logMsg = `🛡️ BỊ KHẮC HỆ! ${attackerName} chỉ gây ${damage} ST.`;

  if (isDodge) logMsg = `💨 ${targetName} NÉ TRÁNH thành công!`;
  else if (isCrit) logMsg = `💥 CHÍ MẠNG! ${attackerName} gây ${damage} ST.`;

  const logs = [logMsg, ...store.battleLog];
  if (vampireHeal > 0) logs.unshift(`🩸 ${attackerName} hút được ${vampireHeal} HP!`);
  if (thornsDamage > 0) logs.unshift(`🌵 ${attackerName} bị gai đâm ${thornsDamage} ST!`);

  const nextMe = amIAttacker ? { ...me, hp: newAttackerHp } : { ...me, hp: newDefenderHp };
  const nextOpponent = amIAttacker ? { ...opponent, hp: newDefenderHp } : { ...opponent, hp: newAttackerHp };

  useBattleStore.setState({
    me: nextMe,
    opponent: nextOpponent,
    battleLog: logs
  });

  // Check game over
  if (nextMe.hp === 0 || nextOpponent.hp === 0) {
    if ((window as any).battleInterval) clearInterval((window as any).battleInterval);
    
    if (nextMe.hp === 0 && nextOpponent.hp > 0) {
      useBattleStore.setState({ battleLog: ['💀 Bạn đã thua cuộc...', ...useBattleStore.getState().battleLog] });
    } else if (nextOpponent.hp === 0 && nextMe.hp > 0) {
      useBattleStore.setState({ battleLog: ['🏆 Bạn đã chiến thắng! (Đang cập nhật kết quả...)', ...useBattleStore.getState().battleLog] });
      
      // Host calls RPC to record win if they won, or just whoever wins calls it.
      // Wait, if I won, I call RPC on the loser.
      if (nextOpponent.id) {
        supabase.rpc('record_battle_result', { p_loser_id: nextOpponent.id })
          .then(({ error }) => {
            if (!error) {
              useBattleStore.setState({ battleLog: ['✨ Bạn được cộng +25 RP!', ...useBattleStore.getState().battleLog] });
              import('./useGameStore').then(({ useGameStore }) => {
                useGameStore.getState().fetchProfile();
              });
            }
          });
      }
    } else {
      useBattleStore.setState({ battleLog: ['🤝 Hòa nhau!', ...useBattleStore.getState().battleLog] });
    }
  }
}

// Helper function to handle Battle Room logic
function joinBattleRoom(roomId: string, myAnimon: Animon, username: string, initialOpponent: any, isHost: boolean) {
  const store = useBattleStore.getState();
  const battleChannel = supabase.channel(roomId);

  const myMaxHp = myAnimon.stats.energy * 10;
  
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
    isMyTurn: isHost, 
    battleLog: ['Vào phòng đấu! Chờ đối thủ...', ...store.battleLog],
    channel: battleChannel
  });

  if (initialOpponent) {
    const oppMaxHp = initialOpponent.myAnimon.stats.energy * 10;
    useBattleStore.setState({
      opponent: { id: initialOpponent.id, username: initialOpponent.username, animon: initialOpponent.myAnimon, hp: oppMaxHp, maxHp: oppMaxHp },
      battleLog: [`Đối thủ ${initialOpponent.username} đã xuất hiện!`, ...useBattleStore.getState().battleLog]
    });
  }

  const startAutoBattleLoop = () => {
    let hostTurn = true;
    (window as any).battleInterval = setInterval(() => {
      const state = useBattleStore.getState();
      if (!state.me || !state.opponent || state.me.hp <= 0 || state.opponent.hp <= 0) {
        clearInterval((window as any).battleInterval);
        return;
      }
      executeTurn(battleChannel, hostTurn);
      hostTurn = !hostTurn;
    }, 2000);
  };

  battleChannel
    .on('presence', { event: 'sync' }, () => {
      const state = battleChannel.presenceState();
      const players = Object.values(state).flat() as any[];
      const opp = players.find(p => p.username !== username);
      
      if (opp && !useBattleStore.getState().opponent) {
        const oppMaxHp = opp.animon.stats.energy * 10;
        useBattleStore.setState({
          opponent: { id: opp.id, username: opp.username, animon: opp.animon, hp: oppMaxHp, maxHp: oppMaxHp },
          battleLog: [`Đối thủ ${opp.username} đã xuất hiện! Trận đấu bắt đầu sau 2s...`, ...useBattleStore.getState().battleLog]
        });

        if (isHost) {
          setTimeout(startAutoBattleLoop, 2000);
        }
      }
    })
    .on('broadcast', { event: 'turn_result' }, (payload) => {
      applyTurnResult(payload.payload);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const currentMe = useBattleStore.getState().me;
        await battleChannel.track({ id: currentMe?.id, username, animon: myAnimon });
      }
    });
}
