import React, { useState } from 'react';
import { User, Lock, ArrowRight, Sparkles, Mail, ShieldCheck, X, Minus, Square } from 'lucide-react';

import { authService } from './services/api';

interface LoginPageProps {
  onLogin: () => void;
  onDrag: (e: React.MouseEvent) => void;
  onClose?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onDrag, onClose }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
        if (isRegistering) {
            if (formData.password !== formData.confirmPassword) {
                throw new Error("两次输入的密码不一致");
            }
            await authService.register(formData.username, formData.email, formData.password);
            // Auto login after register or switch to login mode?
            // Let's switch to login mode for clarity
            setIsRegistering(false);
            setError("注册成功！请登录。"); // Using error state for success message temporarily or add success state
        } else {
            const token = await authService.login(formData.username, formData.password);
            localStorage.setItem('auth_token', token);
            onLogin();
        }
    } catch (err: any) {
        console.error(err);
        setError(err.message || "操作失败，请重试");
    } finally {
        setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col overflow-hidden text-white font-sans select-none ${onClose ? 'bg-black/80 backdrop-blur-sm' : 'bg-[#0f0518]'}`}>
      
      {/* Background Effects - Only if not modal (optional, or simplified for modal) */}
      {!onClose && (
        <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-[-50%] left-[-20%] w-[1000px] h-[1000px] rounded-full bg-indigo-900/20 blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-[800px] h-[800px] rounded-full bg-amber-900/10 blur-[100px]"></div>
            <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
        </div>
      )}

      {/* Draggable Top Bar */}
      <div 
        className="h-10 flex justify-end items-center px-4 z-50 relative"
        onMouseDown={onDrag}
      >
        <div className="flex items-center gap-4 text-gray-500" onMouseDown={e => e.stopPropagation()}>
             {onClose ? (
                <button onClick={onClose} className="hover:text-white transition-colors bg-white/10 rounded-full p-1"><X size={20} /></button>
             ) : (
                <>
                    <button className="hover:text-white transition-colors"><Minus size={16} /></button>
                    <button className="hover:text-white transition-colors"><Square size={14} /></button>
                    <button className="hover:text-red-500 transition-colors"><X size={16} /></button>
                </>
             )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center relative z-10 p-8">
        
        {/* Login Card */}
        <div className="w-full max-w-md bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden animate-in zoom-in duration-500">
           
           {/* Decorative Top Border */}
           <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50"></div>

           {/* Header */}
           <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full mx-auto flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                 <Sparkles size={32} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-amber-500 mb-2">
                时光故事
              </h1>
              <p className="text-gray-400 text-sm tracking-widest uppercase">Story of Time</p>
           </div>
           
           {/* Error Message */}
           {error && (
            <div className={`mb-4 p-3 rounded bg-opacity-20 border ${error.includes('成功') ? 'bg-green-500 border-green-500 text-green-200' : 'bg-red-500 border-red-500 text-red-200'} text-sm text-center`}>
                {error}
            </div>
           )}

           {/* Form */}
           <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-4">
                <div className="relative group">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors" />
                  <input 
                    type="text" 
                    name="username"
                    placeholder="用户名" 
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-sm text-gray-200 focus:border-amber-500/50 focus:bg-black/60 outline-none transition-all"
                  />
                </div>

                {isRegistering && (
                  <div className="relative group animate-in slide-in-from-top-2 duration-300">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors" />
                    <input 
                      type="email" 
                      name="email"
                      placeholder="电子邮箱" 
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-sm text-gray-200 focus:border-amber-500/50 focus:bg-black/60 outline-none transition-all"
                    />
                  </div>
                )}

                <div className="relative group">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors" />
                  <input 
                    type="password" 
                    name="password"
                    placeholder="密码" 
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-sm text-gray-200 focus:border-amber-500/50 focus:bg-black/60 outline-none transition-all"
                  />
                </div>

                {isRegistering && (
                  <div className="relative group animate-in slide-in-from-top-2 duration-300">
                    <ShieldCheck size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors" />
                    <input 
                      type="password" 
                      name="confirmPassword"
                      placeholder="确认密码" 
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-sm text-gray-200 focus:border-amber-500/50 focus:bg-black/60 outline-none transition-all"
                    />
                  </div>
                )}
              </div>

              {!isRegistering && (
                <div className="flex justify-between items-center text-xs text-gray-400 px-1">
                  <label className="flex items-center gap-2 cursor-pointer hover:text-gray-300">
                    <input type="checkbox" className="rounded border-gray-600 bg-transparent text-amber-500 focus:ring-0 focus:ring-offset-0" />
                    记住我
                  </label>
                  <button type="button" className="hover:text-amber-400 transition-colors">忘记密码?</button>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-bold py-3 rounded-lg shadow-lg shadow-amber-900/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="animate-pulse">处理中...</span>
                ) : (
                  <>
                    {isRegistering ? '立即注册' : '进入游戏'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

           </form>

           {/* Footer */}
           <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                {isRegistering ? '已有账号? ' : '还没有账号? '}
                <button 
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-amber-400 font-bold hover:text-amber-300 transition-colors"
                >
                  {isRegistering ? '直接登录' : '注册新账号'}
                </button>
              </p>
           </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
