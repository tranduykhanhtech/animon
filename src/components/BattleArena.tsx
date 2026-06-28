import React, { useState } from 'react';
import { useBattleStore } from '../store/useBattleStore';
import { useGameStore, type Animon } from '../store/useGameStore';
import { Card } from './Card';
import { Swords, Search, X, Zap, Users, UserCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

export const BattleArena: React.FC = () => {
  const { inventory, username, friends, user, rank_points } = useGameStore();
  const { isSearching, roomId, opponent, me, battleLog, startSearch, cancelSearch, leaveBattle, joinPrivateBattle } = useBattleStore();
  const [selectedAnimon, setSelectedAnimon] = useState<Animon | null>(null);
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  const handleStartMatchmaking = () => {
    if (!selectedAnimon || !username) return;
    startSearch(selectedAnimon, username, rank_points);
  };

  const handleInviteFriend = (friendId: string, friendUsername: string) => {
    if (!selectedAnimon || !username || !user) return;
    setIsInviting(true);

    const newRoomId = `battle_${Date.now()}_${username}_vs_${friendUsername}`;
    const channel = supabase.channel(`user_invites_${friendId}`);
    
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'battle_invite',
          payload: { inviterId: user.id, inviterUsername: username, roomId: newRoomId }
        }).then(() => {
          channel.unsubscribe();
          setIsInviting(false);
          setShowInviteModal(false);
          joinPrivateBattle(newRoomId, selectedAnimon, username, true);
        });
      }
    });
  };

  if (roomId && me) {
    // In Battle Room
    const isGameOver = me.hp <= 0 || (opponent && opponent.hp <= 0);

    return (
      <div className="pb-32 px-2 flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-4">
          <h2 className="text-xl font-black text-rose-500">Đấu Trường</h2>
          <button onClick={leaveBattle} className="text-stone-400 hover:text-rose-500 font-bold">Thoát</button>
        </div>

        {/* Opponent Area */}
        <div className="w-full max-w-md bg-white rounded-3xl p-4 shadow-sm border-4 border-rose-100 flex flex-col items-center mb-8 relative">
          <div className="absolute -top-4 bg-rose-500 text-white px-4 py-1 rounded-full font-bold text-sm shadow-md">
            Đối thủ: {opponent ? opponent.username : 'Đang đợi...'}
          </div>
          
          {opponent ? (
            <>
              <div className="w-full bg-stone-100 rounded-full h-4 mb-4 overflow-hidden border-2 border-stone-200">
                <motion.div 
                  initial={{ width: '100%' }}
                  animate={{ width: `${(opponent.hp / opponent.maxHp) * 100}%` }}
                  className="h-full bg-gradient-to-r from-red-500 to-rose-400"
                />
              </div>
              <div className="scale-75 origin-top">
                <Card animon={opponent.animon} />
              </div>
              <span className="font-black text-rose-500 text-xl mt-2">{opponent.hp} / {opponent.maxHp} HP</span>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-stone-400 font-medium animate-pulse">
              Đang đợi người chơi khác...
            </div>
          )}
        </div>

        {/* VS Badge */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-300 to-orange-400 flex items-center justify-center shadow-lg border-4 border-white z-10 -my-12">
          <Swords className="w-8 h-8 text-white" />
        </div>

        {/* My Area */}
        <div className="w-full max-w-md bg-white rounded-3xl p-4 shadow-sm border-4 border-blue-100 flex flex-col items-center mt-8 relative">
           <div className="absolute -bottom-4 bg-blue-500 text-white px-4 py-1 rounded-full font-bold text-sm shadow-md z-10">
            Bạn: {me.username}
          </div>
          
          <span className="font-black text-blue-500 text-xl mb-2">{me.hp} / {me.maxHp} HP</span>
          <div className="scale-75 origin-bottom">
            <Card animon={me.animon} />
          </div>
          <div className="w-full bg-stone-100 rounded-full h-4 mt-4 overflow-hidden border-2 border-stone-200">
            <motion.div 
              initial={{ width: '100%' }}
              animate={{ width: `${(me.hp / me.maxHp) * 100}%` }}
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
            />
          </div>
        </div>

        {/* Action / Log Area */}
        <div className="w-full max-w-md mt-6">
           {isGameOver ? (
             <div className="bg-white p-6 rounded-3xl text-center shadow-sm border-4 border-amber-100">
                <h3 className="text-2xl font-black text-amber-500 mb-2">
                  {me.hp > 0 ? '🏆 BẠN ĐÃ THẮNG!' : '💀 BẠN ĐÃ THUA!'}
                </h3>
                <button onClick={leaveBattle} className="px-6 py-2 bg-amber-400 text-white rounded-xl font-bold">Về Phòng Chờ</button>
             </div>
           ) : (
             <div className="flex flex-col gap-4">
                <div className="py-4 rounded-2xl font-black text-lg flex justify-center items-center gap-2 bg-stone-100 text-stone-500 border-4 border-stone-200 shadow-sm animate-pulse">
                  <Zap className="w-6 h-6 text-amber-400" /> TRẬN ĐẤU ĐANG TỰ ĐỘNG DIỄN RA...
                </div>
                
                <div className="bg-white p-4 rounded-2xl border-2 border-stone-100 h-48 overflow-y-auto flex flex-col gap-2">
                  {battleLog.map((log, i) => (
                    <div key={i} className={`text-sm font-medium ${i === 0 ? 'text-stone-800' : 'text-stone-400'}`}>
                      {log}
                    </div>
                  ))}
                </div>
             </div>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-48 px-4 flex flex-col items-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-200 to-orange-200 flex items-center justify-center shadow-sm border-2 border-white mb-4">
        <Swords className="w-8 h-8 text-amber-500" />
      </div>
      <h2 className="text-2xl font-black text-stone-700 mb-2">Đấu Trường</h2>
      <p className="text-stone-500 text-center mb-8 font-medium">
        Chọn một Animon mạnh nhất của bạn và tìm kiếm đối thủ để so tài!
      </p>

      {isSearching ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-[2rem] border-4 border-rose-100 shadow-sm flex flex-col items-center text-center w-full max-w-sm"
        >
          <div className="relative mb-6">
            <Search className="w-12 h-12 text-rose-400 animate-pulse" />
            <div className="absolute inset-0 border-4 border-rose-200 rounded-full animate-ping" />
          </div>
          <h3 className="font-bold text-xl text-stone-600 mb-2">Đang dò tìm tín hiệu...</h3>
          <p className="text-stone-400 font-medium mb-6">Chờ một chút để tìm đối thủ xứng tầm</p>
          <button 
            onClick={cancelSearch}
            className="px-6 py-2 bg-stone-100 text-stone-500 font-bold rounded-xl hover:bg-stone-200 flex items-center gap-2"
          >
            <X className="w-4 h-4" /> Hủy tìm kiếm
          </button>
        </motion.div>
      ) : (
        <div className="w-full max-w-4xl">
          <h3 className="font-bold text-stone-500 mb-4 px-2">Chọn chiến binh của bạn:</h3>
          {inventory.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-3xl border-2 border-stone-100 text-stone-400 font-medium">
              Bạn chưa có Animon nào để chiến đấu.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
              {inventory.filter(a => !a.is_trading).map((animon) => (
                <div key={animon.id} className="relative group cursor-pointer" onClick={() => setSelectedAnimon(animon)}>
                  <Card animon={animon} />
                  {selectedAnimon?.id === animon.id && (
                    <div className="absolute inset-0 bg-rose-500/20 border-4 border-rose-500 rounded-[2rem] pointer-events-none z-10" />
                  )}
                </div>
              ))}
            </div>
          )}

          <AnimatePresence>
            {selectedAnimon && (
              <motion.div 
                initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-32 left-0 w-full px-4 z-30 flex flex-col sm:flex-row justify-center gap-4 pointer-events-none"
              >
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="pointer-events-auto bg-white text-indigo-500 font-black text-xl py-4 px-8 rounded-full shadow-lg border-4 border-indigo-100 hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  <Users className="w-6 h-6" /> MỜI BẠN BÈ
                </button>
                <button
                  onClick={handleStartMatchmaking}
                  className="pointer-events-auto bg-gradient-to-r from-rose-500 to-orange-500 text-white font-black text-xl py-4 px-12 rounded-full shadow-[0_10px_30px_rgba(244,63,94,0.4)] border-4 border-white hover:scale-105 active:scale-95 transition-transform"
                >
                  TÌM ĐỐI THỦ NGAY!
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Invite Friends Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white p-6 rounded-3xl w-full max-w-md shadow-2xl border-4 border-indigo-100 max-h-[90vh] overflow-y-auto my-auto"
            >
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 py-2">
                <h3 className="font-black text-2xl text-indigo-500 flex items-center gap-2">
                  <Users className="w-8 h-8" /> Chọn đối thủ
                </h3>
                <button 
                  onClick={() => setShowInviteModal(false)}
                  className="p-2 bg-stone-100 text-stone-400 rounded-full hover:bg-stone-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {friends.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-stone-400 font-bold mb-4">Bạn chưa có người bạn nào!</p>
                  <button 
                    onClick={() => setShowInviteModal(false)} // Or redirect to Friends Tab if needed
                    className="px-6 py-2 bg-indigo-50 text-indigo-500 rounded-xl font-bold"
                  >
                    Kết bạn thêm nhé
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {friends.map(friend => {
                    const isSender = friend.sender_id === user?.id;
                    const otherPerson = { 
                      id: isSender ? friend.receiver_id : friend.sender_id, 
                      ...(isSender ? friend.receiver : friend.sender) 
                    };

                    return (
                      <div key={friend.id} className="bg-stone-50 p-4 rounded-2xl border-2 border-stone-200 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                          <div className="w-12 h-12 shrink-0 rounded-full bg-indigo-100 flex items-center justify-center">
                            <UserCircle2 className="w-7 h-7 text-indigo-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-stone-700 truncate">{otherPerson.username}</div>
                            <div className="text-xs font-medium text-stone-400 truncate">{otherPerson.email}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleInviteFriend(otherPerson.id, otherPerson.username)}
                          disabled={isInviting}
                          className="shrink-0 px-4 py-2 bg-gradient-to-r from-rose-400 to-orange-400 text-white font-bold rounded-xl shadow-sm hover:scale-105 active:scale-95 disabled:opacity-50"
                        >
                          THÁCH ĐẤU
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
