import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { PawPrint, Mail, Lock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        if (!username.trim()) throw new Error('Vui lòng nhập tên Animon Trainer của bạn!');
        
        const { error: signUpError, data } = await supabase.auth.signUp({ 
          email, 
          password 
        });
        
        if (signUpError) throw signUpError;
        
        if (data.user) {
          // Add user profile
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              username: username,
              email: email,
              coins: 100 // Starting bonus
            });
            
          if (profileError) throw profileError;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex flex-col items-center justify-center p-4 selection:bg-rose-200">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 rounded-[2.5rem] shadow-[0_15px_40px_rgba(225,29,72,0.08)] border-4 border-white"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-200 to-orange-200 flex items-center justify-center shadow-sm border-2 border-white mb-4">
            <PawPrint className="w-10 h-10 text-rose-500" />
          </div>
          <h1 className="text-3xl font-black text-rose-500 tracking-tight text-center" style={{ fontFamily: 'var(--font-heading, system-ui)' }}>
            ANIMON
          </h1>
          <p className="text-stone-400 font-medium mt-1">
            {isLogin ? 'Chào mừng bạn trở lại! 👋' : 'Bắt đầu cuộc hành trình mới! ✨'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence>
            {!isLogin && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="relative">
                  <PawPrint className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" />
                  <input
                    type="text"
                    placeholder="Tên Trainer"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-stone-50 border-2 border-stone-100 text-stone-700 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:border-rose-300 focus:bg-white transition-colors font-medium placeholder:text-stone-300"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" />
            <input
              type="email"
              placeholder="Email của bạn"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-stone-50 border-2 border-stone-100 text-stone-700 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:border-rose-300 focus:bg-white transition-colors font-medium placeholder:text-stone-300"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" />
            <input
              type="password"
              placeholder="Mật khẩu (ít nhất 6 ký tự)"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-stone-50 border-2 border-stone-100 text-stone-700 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:border-rose-300 focus:bg-white transition-colors font-medium placeholder:text-stone-300"
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-rose-500 text-sm font-medium text-center bg-rose-50 p-3 rounded-xl border border-rose-100"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            type="submit"
            className="w-full py-4 mt-2 rounded-2xl bg-gradient-to-r from-rose-400 to-orange-400 text-white font-bold text-lg shadow-[0_8px_0_rgba(225,29,72,0.2)] border-2 border-white disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (isLogin ? 'Đăng Nhập' : 'Tạo Tài Khoản')}
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-stone-400 font-medium">
            {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(null); }}
              className="ml-2 text-rose-500 font-bold hover:text-orange-400 transition-colors"
            >
              {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </p>
        </div>
      </motion.div>
      
      {/* Decorative blobs */}
      <div className="fixed top-20 -left-10 w-40 h-40 bg-orange-200/40 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-20 -right-10 w-40 h-40 bg-rose-200/40 rounded-full blur-3xl -z-10" />
    </div>
  );
};
