import { useState, useEffect } from 'react';
import { CameraBtn } from './components/CameraBtn';
import { Card } from './components/Card';
import { AuthScreen } from './components/AuthScreen';
import { BottomNav, type TabType } from './components/BottomNav';
import { Marketplace } from './components/Marketplace';
import { BattleArena } from './components/BattleArena';
import { FriendsTab } from './components/FriendsTab';
import { Leaderboard } from './components/Leaderboard';
import { MatchHistory } from './components/MatchHistory';
import { useGameStore } from './store/useGameStore';
import { useBattleStore } from './store/useBattleStore';
import { generateCardStats } from './utils/cardLogic';
import { supabase } from './lib/supabase';
import { Coins, Sparkles, PawPrint, LogOut, Loader2, Tag, Store, UserCircle2, X, Swords } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const { session, user, username, inventory, coins, isLoading, setSession, signOut, addAnimon, listAnimonForSale, fetchFriends } = useGameStore();
  const [newlyCaught, setNewlyCaught] = useState<{ file: File, imageUrl: string, name: string, stats: any } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTab, setCurrentTab] = useState<TabType>('collection');
  const [sellingAnimon, setSellingAnimon] = useState<string | null>(null);
  const [sellPrice, setSellPrice] = useState<string>('');
  const [showProfile, setShowProfile] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIosPrompt, setShowIosPrompt] = useState(false);

  // Battle Invite State
  const [incomingInvite, setIncomingInvite] = useState<{ inviterId: string, inviterUsername: string, roomId: string } | null>(null);
  const [inviteAcceptAnimonId, setInviteAcceptAnimonId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    const installHandler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', installHandler);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeinstallprompt', installHandler);
    }
  }, [setSession]);

  useEffect(() => {
    // Detect iOS for install prompt
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator as any).standalone;

    if (isIos() && !isInStandaloneMode()) {
      setShowIosPrompt(true);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    
    fetchFriends(); // Fetch friends when user logs in
    
    const channel = supabase.channel(`user_invites_${user.id}`);
    channel
      .on('broadcast', { event: 'battle_invite' }, (payload) => {
        setIncomingInvite(payload.payload);
        setInviteAcceptAnimonId(null); // Reset selection
      })
      .on('broadcast', { event: 'invite_rejected' }, (payload) => {
        alert(`${payload.payload.username} đã từ chối lời mời thách đấu của bạn!`);
        useBattleStore.getState().leaveBattle();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const handleCapture = (file: File, imageUrl: string, species: string) => {
    // Convert e.g. "golden retriever, retriever" to "Golden Retriever" for display
    const formattedName = species.split(',')[0].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const stats = generateCardStats(file, species);
    setNewlyCaught({
      file,
      imageUrl,
      name: formattedName,
      stats
    });
  };

  const handleClaim = async () => {
    if (newlyCaught && user) {
      setIsSaving(true);
      const success = await addAnimon(
        {
          name: newlyCaught.name,
          stats: newlyCaught.stats
        },
        newlyCaught.file
      );
      
      setIsSaving(false);
      if (success) {
        setNewlyCaught(null);
        setCurrentTab('collection');
      } else {
        alert("Lỗi khi lưu thẻ bài. Vui lòng kiểm tra lại kết nối hoặc phân quyền Supabase Storage.");
      }
    }
  };

  const handleSell = async () => {
    if (!sellingAnimon || !sellPrice) return;
    const priceNum = parseInt(sellPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert("Giá bán không hợp lệ!");
      return;
    }

    const success = await listAnimonForSale(sellingAnimon, priceNum);
    if (success) {
      alert("Đã đăng bán thành công trên Chợ!");
      setSellingAnimon(null);
      setSellPrice('');
    } else {
      alert("Có lỗi xảy ra khi đăng bán.");
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-rose-400" />
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] text-stone-700 font-sans selection:bg-rose-200">
      
      {/* Install PWA Prompt (Android) */}
      <AnimatePresence>
        {deferredPrompt && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-4 left-4 right-4 z-50 bg-white p-4 rounded-3xl shadow-xl border-4 border-indigo-100 flex items-center justify-between gap-2 max-w-lg mx-auto"
          >
            <div className="flex-1">
              <h4 className="font-black text-indigo-500 mb-1">Cài đặt Ứng dụng</h4>
              <p className="text-xs text-stone-500 font-medium leading-tight">Thêm Animon vào màn hình chính để chơi toàn màn hình!</p>
            </div>
            <div className="flex flex-col gap-2">
              <button 
                onClick={handleInstallClick}
                className="px-4 py-2 bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-md"
              >
                Cài đặt ngay
              </button>
              <button 
                onClick={() => setDeferredPrompt(null)}
                className="px-4 py-1 text-stone-400 font-medium text-xs"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Install PWA Prompt (iOS) */}
      <AnimatePresence>
        {showIosPrompt && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 left-4 right-4 z-50 bg-white p-4 rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-4 border-indigo-100 flex flex-col items-center gap-3 max-w-lg mx-auto text-center"
          >
            <h4 className="font-black text-indigo-500 text-lg">Cài đặt Ứng dụng (iOS)</h4>
            <p className="text-sm text-stone-600 font-medium leading-tight">
              Để chơi toàn màn hình siêu mượt, hãy:<br/>
              1. Bấm nút <b>Chia sẻ</b> (Share) ở dưới cùng màn hình.<br/>
              2. Chọn <b>Thêm vào MH chính</b> (Add to Home Screen).
            </p>
            <button 
              onClick={() => setShowIosPrompt(false)}
              className="mt-2 px-8 py-2 bg-stone-100 text-stone-500 rounded-xl font-bold text-sm hover:bg-stone-200"
            >
              Đã hiểu
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#FFF8F0]/90 backdrop-blur-md border-b-4 border-amber-100 mb-6">
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
          
          <button 
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity rounded-2xl p-1"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-200 to-orange-200 flex items-center justify-center shadow-sm border-2 border-white">
              <PawPrint className="w-7 h-7 text-rose-500" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-rose-500 tracking-tight leading-tight" style={{ fontFamily: 'var(--font-heading, system-ui)' }}>
                ANIMON
              </h1>
              <span className="text-xs font-bold text-stone-400">Trainer: {username || '...'}</span>
            </div>
          </button>

          
          <div className="flex items-center gap-2">
            {/* Total Asset Value (Tiền định giá) */}
            <div className="flex items-center gap-1.5 bg-white px-2 sm:px-3 py-1.5 rounded-full border-2 border-emerald-100 shadow-sm">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <div className="flex flex-col items-start leading-none">
                <span className="text-[8px] sm:text-[9px] font-black text-emerald-400 uppercase hidden sm:block">Tài sản</span>
                <span className="text-sm font-bold text-stone-600">
                  {inventory.reduce((sum, a) => sum + (a.stats.value || 0), 0)}
                </span>
              </div>
            </div>

            {/* Cash (Tiền mặt) */}
            <div className="flex items-center gap-1.5 bg-white px-2 sm:px-3 py-1.5 rounded-full border-2 border-amber-100 shadow-sm">
              <Coins className="w-4 h-4 text-amber-400 fill-amber-400" />
              <div className="flex flex-col items-start leading-none">
                <span className="text-[8px] sm:text-[9px] font-black text-amber-400 uppercase hidden sm:block">Tiền mặt</span>
                <span className="text-sm font-bold text-stone-600">{coins}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto">
        {currentTab === 'collection' && (
          <div className="px-4 pb-32">
            {inventory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                <div className="w-32 h-32 mb-6 rounded-full bg-orange-100 border-4 border-dashed border-orange-200 flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-orange-300" />
                </div>
                <h2 className="text-2xl font-bold text-stone-600 mb-3">Chưa có Animon nào!</h2>
                <p className="text-stone-500 max-w-sm text-lg font-medium">
                  Nhấn vào nút máy ảnh dễ thương bên dưới để bắt thú cưng đầu tiên của bạn nhé ~
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-bold text-stone-500 mb-6 px-2 flex items-center gap-2">
                  <PawPrint className="w-5 h-5" /> Bộ Sưu Tập ({inventory.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-items-center">
                  {inventory.map((animon) => (
                    <div key={animon.id} className="relative group">
                      <Card animon={animon as any} />
                      
                      {!animon.is_trading ? (
                        <button 
                          onClick={() => setSellingAnimon(animon.id)}
                          className="mt-4 w-full bg-white border-2 border-amber-200 text-amber-500 font-bold py-2 rounded-xl hover:bg-amber-50 hover:border-amber-300 transition-colors flex items-center justify-center gap-2"
                        >
                          <Tag className="w-4 h-4" /> Bán lấy Coins
                        </button>
                      ) : (
                        <div className="mt-4 w-full bg-stone-100 border-2 border-stone-200 text-stone-400 font-bold py-2 rounded-xl text-center">
                          Đang bán trên Chợ
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <CameraBtn onCapture={handleCapture} />
          </div>
        )}

        {currentTab === 'market' && <Marketplace />}
        {currentTab === 'battle' && <BattleArena />}
        {currentTab === 'friends' && <FriendsTab />}
        {currentTab === 'leaderboard' && <Leaderboard />}

        <BottomNav currentTab={currentTab} onChange={setCurrentTab} />
      </main>

      {/* Capture Result Overlay */}
      <AnimatePresence>
        {newlyCaught && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50, rotate: -5 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className="flex flex-col items-center max-w-sm w-full bg-[#FFF8F0] p-6 rounded-3xl border-4 border-white shadow-2xl relative"
            >
              {isSaving && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 rounded-3xl flex items-center justify-center">
                  <div className="flex flex-col items-center bg-white p-4 rounded-2xl shadow-lg border-2 border-rose-100">
                     <Loader2 className="w-10 h-10 text-rose-500 animate-spin mb-2" />
                     <span className="font-bold text-rose-500">Đang nhận nuôi...</span>
                  </div>
                </div>
              )}

              <h2 className="text-3xl font-black text-rose-500 mb-1">Wow! 🎉</h2>
              <p className="text-stone-500 font-medium mb-6">Bạn vừa bắt được một bé Animon mới</p>
              
              <div className="mb-8">
                <Card animon={newlyCaught as any} />
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClaim}
                disabled={isSaving}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-400 to-orange-400 text-white font-bold text-lg shadow-[0_8px_0_rgba(225,29,72,0.2)] border-2 border-white disabled:opacity-50"
              >
                Nhận Nuôi Ngay 💖
              </motion.button>
              
              <button 
                onClick={() => !isSaving && setNewlyCaught(null)}
                disabled={isSaving}
                className="mt-6 px-6 py-2 text-stone-400 hover:text-stone-600 font-medium transition-colors disabled:opacity-50"
              >
                Thả đi...
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selling Modal */}
      <AnimatePresence>
        {sellingAnimon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl border-4 border-amber-100"
            >
              <h3 className="font-black text-xl text-amber-500 mb-2">Quyết định bán Animon</h3>
              <p className="text-stone-500 font-medium mb-6">Bạn muốn thu hồi tiền mặt ngay lập tức hay tự định giá để treo lên chợ?</p>
              
              {/* Option 1: Quick Sell */}
              <div className="mb-4 bg-rose-50 border-2 border-rose-200 p-4 rounded-2xl">
                <h4 className="font-bold text-rose-600 mb-2 flex items-center gap-2">
                  <Coins className="w-5 h-5" /> Bán Nhanh (Hệ thống thu mua)
                </h4>
                <p className="text-sm text-stone-600 font-medium mb-3">
                  Nhận ngay số tiền bằng đúng Định giá của Animon. Thẻ sẽ bị xoá vĩnh viễn khỏi game.
                </p>
                <button
                  onClick={async () => {
                    const animonObj = inventory.find(a => a.id === sellingAnimon);
                    if (confirm(`Bạn chắc chắn muốn bán nhanh lấy ${animonObj?.stats.value} Coins không?`)) {
                      const success = await useGameStore.getState().quickSellAnimon(sellingAnimon);
                      if (success) {
                        alert(`Đã bán thành công! Bạn nhận được ${animonObj?.stats.value} Coins.`);
                        setSellingAnimon(null);
                      }
                    }
                  }}
                  className="w-full py-3 bg-gradient-to-r from-rose-400 to-orange-400 text-white font-bold rounded-xl shadow-sm"
                >
                  Bán Nhanh ({inventory.find(a => a.id === sellingAnimon)?.stats.value || 0} Coins)
                </button>
              </div>

              {/* Option 2: Marketplace */}
              <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl mb-6">
                <h4 className="font-bold text-amber-600 mb-2 flex items-center gap-2">
                  <Store className="w-5 h-5" /> Treo lên Chợ (Cho người chơi khác)
                </h4>
                <p className="text-sm text-stone-600 font-medium mb-3">
                  Tự định giá tuỳ thích. Tiền chỉ về túi khi có người khác mua.
                </p>
                <div className="relative mb-3">
                  <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                  <input
                    type="number"
                    placeholder="Nhập giá bán..."
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    className="w-full bg-white border-2 border-amber-200 text-stone-700 font-bold rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <button
                  onClick={handleSell}
                  className="w-full py-3 bg-amber-400 text-white font-bold rounded-xl shadow-sm"
                >
                  Đăng Bán Lên Chợ
                </button>
              </div>

              <button
                onClick={() => { setSellingAnimon(null); setSellPrice(''); }}
                className="w-full py-3 bg-stone-100 text-stone-500 font-bold rounded-xl hover:bg-stone-200 transition-colors"
              >
                Huỷ Bỏ
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl border-4 border-rose-100"
            >
              <div className="flex justify-between items-start mb-6">
                <h3 className="font-black text-2xl text-rose-500">Hồ sơ Trainer</h3>
                <button onClick={() => setShowProfile(false)} className="p-2 bg-stone-100 text-stone-400 rounded-full hover:bg-stone-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-200 to-orange-200 flex items-center justify-center shadow-inner border-4 border-white mb-4">
                  <UserCircle2 className="w-14 h-14 text-rose-500" />
                </div>
                <h2 className="text-2xl font-black text-stone-700">{username}</h2>
                <span className="text-stone-400 font-medium">{user.email}</span>
              </div>

              <div className="bg-stone-50 rounded-2xl p-4 border-2 border-stone-100 mb-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 font-medium text-sm">Ngày gia nhập</span>
                  <span className="text-stone-700 font-bold">{new Date(user.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 font-medium text-sm">Tổng số thú cưng</span>
                  <span className="text-stone-700 font-bold">{inventory.length} Animon</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 font-medium text-sm">Định giá tài sản</span>
                  <span className="text-emerald-500 font-bold flex items-center gap-1">
                    {inventory.reduce((sum, a) => sum + (a.stats.value || 0), 0)} <Sparkles className="w-3 h-3"/>
                  </span>
                </div>
              </div>
              
              <MatchHistory />

              <div className="mt-8">
                <button
                onClick={() => {
                  setShowProfile(false);
                  signOut();
                }}
                className="w-full py-3 bg-rose-50 text-rose-500 font-bold rounded-xl hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" /> Đăng xuất
              </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Incoming Battle Invite Modal */}
      <AnimatePresence>
        {incomingInvite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-stone-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white p-6 rounded-3xl w-full max-w-2xl shadow-2xl border-4 border-rose-500 max-h-[90vh] overflow-y-auto"
            >
              <div className="text-center mb-6">
                <div className="inline-flex w-16 h-16 rounded-full bg-rose-100 items-center justify-center mb-4 animate-bounce border-2 border-rose-300">
                  <Swords className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="font-black text-3xl text-stone-800 mb-2">Thách Đấu!</h3>
                <p className="text-stone-500 font-medium text-lg">
                  <strong className="text-rose-500">{incomingInvite.inviterUsername}</strong> vừa gửi cho bạn một lời thách đấu. Bạn có chấp nhận không?
                </p>
              </div>

              <div className="mb-6">
                <h4 className="font-bold text-stone-600 mb-4">Chọn Thẻ xuất chiến:</h4>
                {inventory.filter(a => !a.is_trading).length === 0 ? (
                  <p className="text-rose-500 font-bold text-center py-4 bg-rose-50 rounded-xl">Bạn không có Animon nào khả dụng!</p>
                ) : (
                  <div className="flex flex-wrap justify-center gap-4">
                    {inventory.filter(a => !a.is_trading).map(animon => (
                      <div 
                        key={animon.id} 
                        className="relative group cursor-pointer"
                        onClick={() => setInviteAcceptAnimonId(animon.id)}
                      >
                        <Card animon={animon as any} />
                        {inviteAcceptAnimonId === animon.id && (
                          <div className="absolute inset-0 bg-rose-500/20 border-4 border-rose-500 rounded-[2rem] pointer-events-none z-10" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    const channel = supabase.channel(`user_invites_${incomingInvite.inviterId}`);
                    channel.subscribe((status) => {
                      if (status === 'SUBSCRIBED') {
                        channel.send({ type: 'broadcast', event: 'invite_rejected', payload: { username: username } }).then(() => {
                          channel.unsubscribe();
                        });
                      }
                    });
                    setIncomingInvite(null);
                  }}
                  className="flex-1 py-4 bg-stone-100 text-stone-500 font-bold rounded-2xl hover:bg-stone-200 transition-colors"
                >
                  Từ chối
                </button>
                <button
                  onClick={() => {
                    if (!inviteAcceptAnimonId) {
                      alert("Vui lòng chọn 1 Animon để chiến đấu!");
                      return;
                    }
                    const selectedAnimon = inventory.find(a => a.id === inviteAcceptAnimonId);
                    if (selectedAnimon && username) {
                      setIncomingInvite(null);
                      setCurrentTab('battle');
                      useBattleStore.getState().joinPrivateBattle(incomingInvite.roomId, selectedAnimon as any, username, false);
                    }
                  }}
                  className="flex-[2] py-4 bg-gradient-to-r from-rose-500 to-orange-500 text-white font-black text-lg rounded-2xl shadow-[0_6px_0_rgba(244,63,94,0.2)] hover:opacity-90 active:translate-y-1 active:shadow-none transition-all"
                >
                  CHẤP NHẬN CHIẾN!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
