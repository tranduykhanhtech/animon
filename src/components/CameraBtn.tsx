import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  const [targetSize, setTargetSize] = useState(150);
  const sizeRef = useRef(150);

  useEffect(() => {
    if (!isOpen) return;
    const startTime = Date.now();
    const interval = setInterval(() => {
      // Sine wave between 50 and 150
      const phase = (Date.now() - startTime) / 800; // Speed of pulsing
      const size = 60 + Math.abs(Math.sin(phase * Math.PI)) * 90;
      sizeRef.current = size;
      setTargetSize(size);
    }, 16);
    return () => clearInterval(interval);
  }, [isOpen]);

  const { inventory } = useGameStore();

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
    // Check Mini-game accuracy
    const currentSize = sizeRef.current;
    if (currentSize > 80) {
      setError('Mồi nhử trượt rồi! Bạn phải thả mồi lúc tâm ngắm thu nhỏ nhất (màu xanh lá).');
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
                  
                  {/* Cute Targeting Overlay */}
                  <div className="absolute inset-x-8 inset-y-16 border-4 border-dashed border-white/40 rounded-3xl pointer-events-none" />
                  
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                    <div 
                      className={`rounded-full border-[6px] transition-colors ${targetSize <= 80 ? 'border-emerald-400 bg-emerald-400/20' : 'border-rose-400/80 bg-rose-400/10'}`}
                      style={{ width: `${targetSize}px`, height: `${targetSize}px` }}
                    />
                    <div className="absolute w-2 h-2 bg-white rounded-full" />
                  </div>
                </div>

                <canvas ref={canvasRef} className="hidden" />

                {/* Capture Button */}
                <div className="absolute bottom-10 flex flex-col items-center justify-center w-full z-20">
                  <p className="text-white font-black drop-shadow-md mb-2 bg-stone-900/40 px-4 py-1 rounded-full text-sm">
                    Canh vòng tròn thu nhỏ rồi ném mồi!
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={capturePhoto}
                    disabled={isAnalyzing}
                    className={`px-8 py-4 bg-emerald-500 text-white font-black text-xl rounded-full flex items-center gap-2 shadow-[0_6px_0_rgb(16,185,129)] border-4 border-white ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-[0_8px_0_rgb(16,185,129)] active:translate-y-0 active:shadow-none transition-all'}`}
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
