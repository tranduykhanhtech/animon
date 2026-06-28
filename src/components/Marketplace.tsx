import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Card } from './Card';
import { Coins, Store, RefreshCw, PlusCircle, X, TrendingUp, TrendingDown, Minus, Sparkles, Gem, ShoppingBag, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DECORATIONS } from '../constants/decorations';

export const Marketplace: React.FC = () => {
  const { marketplace, fetchMarketplace, buyAnimon, listAnimonForSale, user, coins, inventory, unlockedItems, buyDecoration, equipDecoration, equippedFrame, equippedBackground, equippedTitle, equippedMarker } = useGameStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'market' | 'shop'>('market');
  
  // Sell Modal States
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedAnimonId, setSelectedAnimonId] = useState<string | null>(null);
  const [sellPrice, setSellPrice] = useState<string>('');

  useEffect(() => {
    fetchMarketplace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    await fetchMarketplace();
    setLoading(false);
  };

  const handleBuy = async (tradeId: string, price: number) => {
    if (coins < price) {
      alert("Bạn không đủ Coins để mua!");
      return;
    }
    
    if (confirm(`Bạn có chắc muốn mua Animon này với giá ${price} Coins?`)) {
      const success = await buyAnimon(tradeId);
      if (success) {
        alert("Mua thành công! Animon đã được thêm vào Túi Đồ.");
      }
    }
  };

  const handleConfirmSell = async () => {
    if (!selectedAnimonId || !sellPrice) return;
    const priceNum = parseInt(sellPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert("Giá bán không hợp lệ!");
      return;
    }

    const success = await listAnimonForSale(selectedAnimonId, priceNum);
    if (success) {
      alert("Đã đăng bán thành công trên Chợ!");
      setShowSellModal(false);
      setSelectedAnimonId(null);
      setSellPrice('');
      fetchMarketplace(); // Refresh marketplace to show the new item
    } else {
      alert("Có lỗi xảy ra khi đăng bán.");
    }
  };

  const availableAnimons = inventory.filter(a => !a.is_trading);
  const selectedAnimon = availableAnimons.find(a => a.id === selectedAnimonId);

  // Calculate Profit/Loss percentage
  const baseValue = selectedAnimon?.stats.value || 0;
  const targetPrice = parseInt(sellPrice) || 0;
  let percentDiff = 0;
  if (baseValue > 0) {
    percentDiff = ((targetPrice - baseValue) / baseValue) * 100;
  }
  
  const getDiffUI = () => {
    if (!sellPrice || targetPrice === 0) return null;
    if (percentDiff > 0) {
      return (
        <div className="flex items-center gap-1 text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-xl font-bold">
          <TrendingUp className="w-5 h-5" />
          <span>Lãi +{percentDiff.toFixed(0)}%</span>
        </div>
      );
    } else if (percentDiff < 0) {
      return (
        <div className="flex items-center gap-1 text-rose-500 bg-rose-50 px-3 py-1.5 rounded-xl font-bold">
          <TrendingDown className="w-5 h-5" />
          <span>Lỗ {percentDiff.toFixed(0)}%</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-stone-500 bg-stone-100 px-3 py-1.5 rounded-xl font-bold">
          <Minus className="w-5 h-5" />
          <span>Hòa vốn (0%)</span>
        </div>
      );
    }
  };

  return (
    <div className="pb-32">
      {/* Tabs */}
      <div className="flex bg-white rounded-2xl p-2 shadow-sm mb-6 max-w-sm mx-auto border-2 border-stone-100">
        <button
          onClick={() => setActiveTab('market')}
          className={`flex-1 py-2 font-bold rounded-xl flex justify-center items-center gap-2 transition-all ${activeTab === 'market' ? 'bg-rose-100 text-rose-600 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
        >
          <Store className="w-5 h-5" /> Chợ Thẻ
        </button>
        <button
          onClick={() => setActiveTab('shop')}
          className={`flex-1 py-2 font-bold rounded-xl flex justify-center items-center gap-2 transition-all ${activeTab === 'shop' ? 'bg-amber-100 text-amber-600 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
        >
          <ShoppingBag className="w-5 h-5" /> Cửa Hàng
        </button>
      </div>

      {activeTab === 'market' && (
        <>
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-xl font-bold text-stone-600 flex items-center gap-2">
              <Store className="w-6 h-6 text-rose-400" /> Chợ Giao Dịch
            </h2>
            
            <div className="flex gap-2">
              <button 
                onClick={() => { setShowSellModal(true); setSelectedAnimonId(null); setSellPrice(''); }}
                className="flex items-center gap-1 text-sm font-bold bg-amber-100 text-amber-600 px-3 py-1.5 rounded-full hover:bg-amber-200 transition-colors"
              >
                <PlusCircle className="w-4 h-4" /> Đăng Bán
              </button>
              <button 
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-1 text-sm font-bold text-stone-400 hover:text-stone-600 transition-colors disabled:opacity-50 ml-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

      {marketplace.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center">
          <div className="w-24 h-24 mb-4 rounded-full bg-stone-100 border-4 border-dashed border-stone-200 flex items-center justify-center">
            <Store className="w-10 h-10 text-stone-300" />
          </div>
          <h2 className="text-xl font-bold text-stone-500 mb-2">Chợ đang trống!</h2>
          <p className="text-stone-400 max-w-sm font-medium">
            Hiện tại không có ai bán Animon nào. Hãy quay lại sau nhé.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-items-center">
          {marketplace.map((trade) => {
            const isMine = trade.seller_id === user?.id;

            return (
              <motion.div 
                key={trade.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group flex flex-col items-center"
              >
                <Card animon={trade.animon} />
                
                <div className="mt-4 w-full bg-white border-4 border-rose-100 p-3 rounded-2xl shadow-sm flex flex-col items-center gap-2">
                  <div className="text-sm font-bold text-stone-500">
                    Người bán: <span className="text-rose-500">{trade.seller.username}</span>
                  </div>
                  
                  {isMine ? (
                    <button
                      onClick={async () => {
                        if (confirm("Bạn có chắc muốn gỡ thẻ bài này khỏi chợ không?")) {
                          const success = await useGameStore.getState().cancelTrade(trade.id, trade.animon.id);
                          if (success) alert("Đã gỡ thẻ bài khỏi chợ thành công!");
                        }
                      }}
                      className="w-full py-2 rounded-xl flex items-center justify-center gap-2 font-black text-lg transition-transform bg-stone-100 text-stone-500 hover:bg-stone-200 border-2 border-stone-200 hover:-translate-y-1 active:translate-y-0"
                    >
                      <X className="w-5 h-5" /> Gỡ Xuống
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuy(trade.id, trade.price)}
                      className="w-full py-2 rounded-xl flex items-center justify-center gap-2 font-black text-lg transition-transform bg-gradient-to-r from-amber-300 to-orange-400 text-white shadow-[0_4px_0_rgba(245,158,11,0.2)] border-2 border-white hover:-translate-y-1 hover:shadow-[0_6px_0_rgba(245,158,11,0.2)] active:translate-y-0 active:shadow-none"
                    >
                      Mua Ngay
                      <span className="flex items-center bg-white/20 px-2 py-0.5 rounded-full">
                         <Coins className="w-4 h-4 mr-1 fill-white" /> {trade.price}
                      </span>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Sell Modal - Marketplace Flow */}
      <AnimatePresence>
        {showSellModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white p-6 rounded-3xl w-full max-w-4xl shadow-2xl border-4 border-amber-100 max-h-[90vh] overflow-y-auto my-auto"
            >
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 py-2">
                <h3 className="font-black text-2xl text-amber-500 flex items-center gap-2">
                  <Store className="w-8 h-8" /> Đăng Bán Animon
                </h3>
                <button 
                  onClick={() => setShowSellModal(false)}
                  className="p-2 bg-stone-100 text-stone-400 rounded-full hover:bg-stone-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {!selectedAnimonId ? (
                // Step 1: Select Animon
                <div>
                  <p className="text-stone-500 font-medium mb-4">Vui lòng chọn 1 thẻ bài bạn muốn bán:</p>
                  {availableAnimons.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-stone-400 font-bold">Bạn không có thẻ Animon nào trống để bán!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-items-center">
                      {availableAnimons.map(animon => (
                        <div 
                          key={animon.id} 
                          className="cursor-pointer transition-transform hover:scale-105"
                          onClick={() => setSelectedAnimonId(animon.id)}
                        >
                          <Card animon={animon as any} />
                          <div className="mt-3 bg-amber-50 text-amber-600 font-bold text-center py-2 rounded-xl border-2 border-amber-200">
                            Chọn để Bán
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Step 2: Pricing & Analytics
                <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
                  <div className="flex-shrink-0">
                    <Card animon={selectedAnimon as any} />
                  </div>
                  
                  <div className="w-full max-w-md bg-stone-50 p-6 rounded-3xl border-2 border-stone-200">
                    <h4 className="font-bold text-xl text-stone-700 mb-6">Định giá & So sánh</h4>
                    
                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl border-2 border-emerald-100 mb-6">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-emerald-400" />
                        <span className="font-bold text-stone-500">Giá trị thực tế:</span>
                      </div>
                      <span className="text-2xl font-black text-emerald-500">{baseValue}</span>
                    </div>

                    <div className="mb-6">
                      <label className="block font-bold text-stone-500 mb-2">Giá bạn muốn bán trên Chợ:</label>
                      <div className="relative">
                        <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-amber-400" />
                        <input
                          type="number"
                          placeholder="Nhập giá bán (Coins)..."
                          value={sellPrice}
                          onChange={(e) => setSellPrice(e.target.value)}
                          className="w-full text-xl bg-white border-4 border-amber-200 text-stone-700 font-black rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-amber-400 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="h-16 flex items-center justify-center mb-6">
                      {getDiffUI()}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setSelectedAnimonId(null)}
                        className="flex-1 py-4 bg-white border-4 border-stone-200 text-stone-500 font-bold rounded-2xl hover:bg-stone-50 transition-colors"
                      >
                        Chọn thẻ khác
                      </button>
                      <button
                        onClick={handleConfirmSell}
                        disabled={!sellPrice || targetPrice <= 0}
                        className="flex-[2] py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black text-lg rounded-2xl shadow-[0_6px_0_rgba(217,119,6,0.2)] hover:opacity-90 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
                      >
                        Xác nhận Đăng Bán
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </>
      )}

      {activeTab === 'shop' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-8 px-2">
            <h2 className="text-xl font-bold text-stone-600 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-amber-500" /> Cửa Hàng Trang Trí
            </h2>
            <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 border-2 border-amber-200">
              <Coins className="w-5 h-5" />
              <span>{coins}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DECORATIONS.map(item => {
              const isOwned = unlockedItems.includes(item.id);
              let isEquipped = false;
              if (item.type === 'frame') isEquipped = equippedFrame === item.id;
              else if (item.type === 'background') isEquipped = equippedBackground === item.id;
              else if (item.type === 'title') isEquipped = equippedTitle === item.id;
              else if (item.type === 'marker') isEquipped = equippedMarker === item.id;

              return (
                <div key={item.id} className={`bg-white rounded-3xl p-6 border-4 shadow-sm flex flex-col transition-colors ${isEquipped ? 'border-amber-400' : 'border-stone-100 hover:border-amber-100'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-black text-xl text-stone-800">{item.name}</h3>
                      <span className="text-xs font-bold px-2 py-1 bg-stone-100 text-stone-500 rounded-lg uppercase tracking-wider">
                        {item.type === 'frame' ? 'Khung Avatar' : 
                         item.type === 'background' ? 'Nền Showcase' : 
                         item.type === 'title' ? 'Danh Hiệu' : 'Biểu Tượng Map'}
                      </span>
                    </div>
                    {item.type === 'frame' ? (
                      <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center shrink-0 ml-4 relative">
                        <div className={`absolute inset-0 rounded-full ${item.styleClass}`}></div>
                        <Gem className="w-6 h-6 text-stone-400 relative z-10" />
                      </div>
                    ) : item.type === 'background' ? (
                      <div 
                        className="w-16 h-16 rounded-xl bg-stone-100 shrink-0 ml-4 border-2 border-stone-200"
                        style={{ backgroundImage: `url(${item.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                      />
                    ) : item.type === 'title' ? (
                      <div className={`w-16 h-16 rounded-xl shrink-0 ml-4 border-2 flex items-center justify-center text-[10px] font-black text-center p-1 leading-tight ${item.styleClass}`}>
                        {item.name.replace('Danh hiệu: ', '')}
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-stone-100 shrink-0 ml-4 flex items-center justify-center border-2 border-stone-200">
                        <div className={`w-8 h-8 rounded-full ${item.styleClass}`}></div>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-stone-500 text-sm font-medium flex-1 mb-6">
                    {item.description}
                  </p>

                  {isEquipped ? (
                    <button 
                      disabled
                      className="w-full py-3 bg-amber-50 text-amber-500 font-bold rounded-2xl border-2 border-amber-200 flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" /> Đang dùng
                    </button>
                  ) : isOwned ? (
                    <button 
                      onClick={async () => {
                        const res = await equipDecoration(item.id, item.type);
                        if (res.success) alert(res.message);
                        else alert("Lỗi: " + res.message);
                      }}
                      className="w-full py-3 bg-stone-800 text-white font-bold rounded-2xl border-2 border-stone-800 hover:bg-stone-700 hover:-translate-y-1 transition-all"
                    >
                      Trang bị
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        if (confirm(`Mua ${item.name} với giá ${item.price} Coins?`)) {
                          const res = await buyDecoration(item.id, item.price);
                          if (res.success) alert(res.message);
                          else alert("Lỗi: " + res.message);
                        }
                      }}
                      className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black text-lg rounded-2xl shadow-[0_4px_0_rgba(217,119,6,0.2)] hover:-translate-y-1 hover:shadow-[0_6px_0_rgba(217,119,6,0.2)] active:translate-y-0 active:shadow-none transition-all flex items-center justify-center gap-2 border-2 border-white"
                    >
                      Mua <Coins className="w-5 h-5 fill-white" /> {item.price}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
