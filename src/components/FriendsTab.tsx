import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Users, UserPlus, Check, X, Search, UserCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const FriendsTab: React.FC = () => {
  const { user, friends, friendRequests, fetchFriends, sendFriendRequest, acceptFriendRequest, rejectFriendRequest } = useGameStore();
  const [searchEmail, setSearchEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchFriends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;

    setIsSending(true);
    const { success, message } = await sendFriendRequest(searchEmail.trim());
    setIsSending(false);

    alert(message);
    if (success) {
      setSearchEmail('');
    }
  };

  return (
    <div className="pb-32 px-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-200 to-purple-200 flex items-center justify-center shadow-sm border-2 border-white">
          <Users className="w-8 h-8 text-indigo-500" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-stone-700">Bạn Bè</h2>
          <p className="text-stone-500 font-medium">Kết nối với các Trainer khác</p>
        </div>
      </div>

      {/* Thêm bạn */}
      <div className="bg-white p-6 rounded-[2rem] border-4 border-indigo-50 shadow-sm mb-8">
        <h3 className="font-bold text-stone-600 mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-indigo-400" /> Gửi lời mời kết bạn
        </h3>
        <form onSubmit={handleSendRequest} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" />
            <input
              type="email"
              placeholder="Nhập email của bạn bè..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="w-full bg-stone-50 border-2 border-stone-100 text-stone-700 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:border-indigo-300 transition-colors font-medium"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSending}
            className="py-3 px-6 bg-gradient-to-r from-indigo-400 to-purple-400 text-white font-bold rounded-2xl shadow-[0_4px_0_rgba(99,102,241,0.2)] hover:translate-y-[2px] hover:shadow-[0_2px_0_rgba(99,102,241,0.2)] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center whitespace-nowrap"
          >
            {isSending ? 'Đang gửi...' : 'Gửi lời mời'}
          </button>
        </form>
      </div>

      {/* Lời mời kết bạn */}
      {friendRequests.length > 0 && (
        <div className="mb-8">
          <h3 className="font-bold text-stone-500 mb-4 px-2 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            Lời mời kết bạn ({friendRequests.length})
          </h3>
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {friendRequests.map(req => (
                <motion.div 
                  key={req.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white p-4 rounded-2xl border-2 border-rose-100 flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                      <UserCircle2 className="w-6 h-6 text-rose-300" />
                    </div>
                    <div>
                      <div className="font-bold text-stone-700">{req.sender.username}</div>
                      <div className="text-xs font-medium text-stone-400">{req.sender.email}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => acceptFriendRequest(req.id)}
                      className="p-2 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-200 transition-colors"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => rejectFriendRequest(req.id)}
                      className="p-2 bg-stone-100 text-stone-400 rounded-xl hover:bg-stone-200 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Danh sách bạn bè */}
      <div>
        <h3 className="font-bold text-stone-500 mb-4 px-2">Danh sách bạn bè ({friends.length})</h3>
        {friends.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-3xl border-2 border-stone-100 text-stone-400 font-medium">
            Bạn chưa có người bạn nào. Hãy gửi lời mời kết bạn nhé!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {friends.map(friend => {
              // Identify the other person in the friendship
              const isSender = friend.sender_id === user?.id;
              const otherPerson = isSender ? friend.receiver : friend.sender;
              
              return (
                <div key={friend.id} className="bg-white p-4 rounded-2xl border-2 border-stone-100 flex items-center gap-3 hover:border-indigo-100 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center border-2 border-indigo-100">
                    <UserCircle2 className="w-7 h-7 text-indigo-300" />
                  </div>
                  <div>
                    <div className="font-bold text-stone-700">{otherPerson.username}</div>
                    <div className="text-xs font-medium text-stone-400">{otherPerson.email}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
