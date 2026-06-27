import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, PawPrint } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Card } from './Card';
import { CardDetailsModal } from './CardDetailsModal';
import type { Animon } from '../store/useGameStore';

interface Props {
  friendId: string;
  friendName: string;
  onClose: () => void;
}

export const FriendCollectionModal: React.FC<Props> = ({ friendId, friendName, onClose }) => {
  const [collection, setCollection] = useState<Animon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingAnimon, setViewingAnimon] = useState<Animon | null>(null);

  useEffect(() => {
    const fetchCollection = async () => {
      const { data, error } = await supabase
        .from('animons')
        .select('*')
        .eq('owner_id', friendId)
        .order('created_at', { ascending: false });

      if (data && !error) {
        // Map DB record to Animon format
        const mapped: Animon[] = data.map((row: any) => ({
          id: row.id,
          owner_id: row.owner_id,
          name: row.name,
          imageUrl: row.image_url,
          createdAt: new Date(row.created_at).getTime(),
          is_trading: row.is_trading,
          stats: {
            element: row.element,
            rarity: row.rarity,
            power: row.power,
            energy: row.energy,
            seed: row.seed,
            value: row.value || 0,
            hidden_ability: row.hidden_ability || 'None',
          }
        }));
        setCollection(mapped);
      }
      setIsLoading(false);
    };

    fetchCollection();
  }, [friendId]);

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-sm flex flex-col items-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-5xl my-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-3xl shadow-lg border-4 border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <PawPrint className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-stone-800">Bộ Sưu Tập của {friendName}</h2>
                  <p className="text-stone-500 font-bold text-sm">{collection.length} Animon</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-stone-100 text-stone-500 rounded-2xl hover:bg-rose-100 hover:text-rose-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-400 mb-4" />
                <p className="text-white font-bold">Đang tải bộ sưu tập...</p>
              </div>
            ) : collection.length === 0 ? (
              <div className="bg-white/90 p-10 rounded-3xl text-center shadow-xl">
                <h3 className="text-2xl font-bold text-stone-700 mb-2">Trống trơn!</h3>
                <p className="text-stone-500">{friendName} chưa bắt được Animon nào cả.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center pb-10">
                {collection.map((animon) => (
                  <Card key={animon.id} animon={animon} onClick={() => setViewingAnimon(animon)} />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Reusing CardDetailsModal */}
      <CardDetailsModal animon={viewingAnimon} onClose={() => setViewingAnimon(null)} />
    </>
  );
};
