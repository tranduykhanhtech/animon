import React, { useState, useRef, useCallback } from 'react';
import { Camera, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { isAnimal, loadAIModel } from '../utils/aiDetector';
import { useGameStore } from '../store/useGameStore';
import { getDistanceFromLatLonInM } from '../utils/geo';

interface CameraBtnProps {
  onCapture: (file: File, imageUrl: string, species: string, lat?: number, lng?: number) => void;
}

export const CameraBtn: React.FC<CameraBtnProps> = ({ onCapture }) => {
  const [isOpen, setIsOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedBait, setSelectedBait] = useState<'basic' | 'good' | 'premium'>('basic');

  const { inventory, baitBasic, baitGood, baitPremium, useBait } = useGameStore();

  const startCamera = async () => {
    setIsOpen(true);
    setError(null);
    setIsAnalyzing(false);
    
    // Tải mô hình AI ngầm
    loadAIModel();
    
    try {
      let mediaStream: MediaStream;
      try {
        // Try to get rear camera first
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
      } catch (err: any) {
        // Fallback to any camera (useful for testing on desktop)
        if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } else {
          throw err;
        }
      }

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      setError(err.message || 'Không thể truy cập camera. Vui lòng cấp quyền hoặc thử trên thiết bị khác.');
      console.error('Error accessing camera:', err);
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsOpen(false);
  }, [stream]);

  const capturePhoto = async () => {
    // 1. Kiểm tra xem còn mồi không
    const remainingBait = selectedBait === 'basic' ? baitBasic : selectedBait === 'good' ? baitGood : baitPremium;
    if (remainingBait <= 0) {
      setError('Bạn đã hết loại mồi này! Hãy vào Cửa hàng để mua thêm.');
      return;
    }

    // 2. Trừ mồi
    const successBait = await useBait(selectedBait);
    if (!successBait) {
      setError('Lỗi khi sử dụng mồi, vui lòng thử lại.');
      return;
    }

    // 3. Tính tỉ lệ thành công dựa trên mồi
    let catchChance = 0.3; // Basic
    if (selectedBait === 'good') catchChance = 0.6;
    if (selectedBait === 'premium') catchChance = 0.8;

    if (Math.random() > catchChance) {
      setError('Trượt rồi! Động vật đã chạy mất, bạn hãy thử lại nhé.');
      return;
    }

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        setIsAnalyzing(true);
        setError(null);
        
        try {
          const result = await isAnimal(canvas);
          
          if (!result.isAnimal) {
            setError(`Phát hiện "${result.topGuess}"! Vui lòng chỉ chụp động vật.`);
            setIsAnalyzing(false);
            return;
          }
          
          // Geolocation check
          if (!navigator.geolocation) {
            setError('Trình duyệt không hỗ trợ GPS. Vui lòng thử trình duyệt khác.');
            setIsAnalyzing(false);
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              
              // Distance check
              if (inventory.length > 0) {
                // Find most recent animon with GPS data
                const lastAnimon = inventory.find(a => a.latitude && a.longitude);
                if (lastAnimon && lastAnimon.latitude && lastAnimon.longitude) {
                  const dist = getDistanceFromLatLonInM(latitude, longitude, lastAnimon.latitude, lastAnimon.longitude);
                  if (dist < 5) {
                    setError(`Bạn cần di chuyển thêm ${Math.ceil(5 - dist)}m nữa để bắt Animon mới! Vui lòng không đứng một chỗ.`);
                    setIsAnalyzing(false);
                    return;
                  }
                }
              }

              canvas.toBlob((blob) => {
                if (blob) {
                  const fileName = `animon_${Date.now()}.jpg`;
                  const file = new File([blob], fileName, { type: 'image/jpeg' });
                  const imageUrl = URL.createObjectURL(blob);
                  onCapture(file, imageUrl, result.topGuess, latitude, longitude);
                  stopCamera();
                }
              }, 'image/jpeg', 0.9);
            },
            (err) => {
              console.error(err);
              setError('Lấy vị trí thất bại. Vui lòng cấp quyền Định vị (Location) cho trình duyệt.');
              setIsAnalyzing(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
          
        } catch (err) {
          setError("Lỗi khi phân tích hình ảnh.");
          setIsAnalyzing(false);
        }
      }
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05, rotate: -5 }}
        whileTap={{ scale: 0.95, rotate: 5 }}
        onClick={startCamera}
        className="fixed bottom-36 right-8 z-40 bg-gradient-to-br from-rose-300 to-orange-300 text-white p-5 rounded-full shadow-[0_8px_0_rgba(225,29,72,0.2)] border-4 border-white flex items-center justify-center group"
      >
        <Camera className="w-8 h-8 drop-shadow-md group-hover:scale-110 transition-transform" />
        
        {/* Cute decorative elements */}
        <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-yellow-300 shadow-sm border border-white animate-bounce" style={{ animationDelay: '0.1s' }} />
        <div className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full bg-blue-300 shadow-sm border border-white animate-bounce" style={{ animationDelay: '0.5s' }} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 bg-[#FFF8F0]/95 flex flex-col items-center justify-center p-4 backdrop-blur-md"
          >
            {/* Header */}
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
              <span className="text-rose-500 font-bold text-lg tracking-wide flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full shadow-sm border-2 border-rose-100">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                ĐANG TÌM ANIMON...
              </span>
              <button
                onClick={stopCamera}
                className="p-2 bg-white rounded-full hover:bg-rose-50 transition-colors shadow-sm border-2 border-rose-100 text-stone-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {error ? (
              <div className="text-rose-600 p-8 bg-white border-4 border-rose-200 rounded-3xl text-center max-w-sm shadow-xl flex flex-col items-center">
                <AlertCircle className="w-16 h-16 text-rose-300 mb-4" />
                <h3 className="font-bold text-xl mb-2">Ối! Có lỗi xảy ra</h3>
                <p className="font-medium text-stone-500 mb-6">{error}</p>
                <button
                  onClick={stopCamera}
                  className="px-6 py-3 bg-gradient-to-r from-rose-300 to-orange-300 rounded-xl text-white font-bold w-full shadow-sm"
                >
                  Đóng lại
                </button>
              </div>
            ) : (
              <div className="relative w-full max-w-md h-[70vh] max-h-[800px] flex flex-col items-center justify-center">
                {/* Viewfinder frame */}
                <div className="relative w-full h-full overflow-hidden rounded-[2.5rem] border-8 border-white shadow-2xl bg-stone-100">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Static Targeting Overlay */}
                  <div className="absolute inset-x-8 inset-y-16 border-4 border-dashed border-white/40 rounded-3xl pointer-events-none" />
                </div>

                <canvas ref={canvasRef} className="hidden" />

                {/* Bait Selection & Capture Button */}
                <div className="absolute bottom-6 flex flex-col items-center w-full z-20 px-6">
                  <div className="flex gap-3 mb-4 w-full max-w-sm justify-between bg-stone-900/40 p-2 rounded-2xl backdrop-blur-sm border-2 border-white/20">
                    {/* Basic */}
                    <button 
                      onClick={() => setSelectedBait('basic')}
                      className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${selectedBait === 'basic' ? 'bg-amber-400 text-amber-950 shadow-sm' : 'text-stone-300 hover:bg-white/10'}`}
                    >
                      <span className="text-xs font-bold">Thường</span>
                      <span className="font-black">x{baitBasic}</span>
                    </button>
                    {/* Good */}
                    <button 
                      onClick={() => setSelectedBait('good')}
                      className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${selectedBait === 'good' ? 'bg-emerald-400 text-emerald-950 shadow-sm' : 'text-stone-300 hover:bg-white/10'}`}
                    >
                      <span className="text-xs font-bold">Ngon</span>
                      <span className="font-black">x{baitGood}</span>
                    </button>
                    {/* Premium */}
                    <button 
                      onClick={() => setSelectedBait('premium')}
                      className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${selectedBait === 'premium' ? 'bg-violet-400 text-violet-950 shadow-sm' : 'text-stone-300 hover:bg-white/10'}`}
                    >
                      <span className="text-xs font-bold">Thượng</span>
                      <span className="font-black">x{baitPremium}</span>
                    </button>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={capturePhoto}
                    disabled={isAnalyzing}
                    className={`w-full max-w-sm py-4 bg-emerald-500 text-white font-black text-xl rounded-2xl flex items-center justify-center gap-2 shadow-[0_6px_0_rgb(16,185,129)] border-4 border-white ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-[0_8px_0_rgb(16,185,129)] active:translate-y-0 active:shadow-none transition-all'}`}
                  >
                    🥩 Ném Mồi
                  </motion.button>
                </div>
                
                {/* AI Analyzing Overlay */}
                <AnimatePresence>
                  {isAnalyzing && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-30 rounded-[2.5rem]"
                    >
                      <div className="w-16 h-16 border-4 border-white border-t-rose-500 rounded-full animate-spin mb-4" />
                      <span className="text-white font-black text-xl tracking-wider drop-shadow-md">ĐANG PHÂN TÍCH ADN...</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
