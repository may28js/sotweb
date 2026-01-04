'use client';

import React, { useState } from 'react';
import { User, Lock, Mail, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

interface AuthPageProps {
  mode: 'login' | 'register';
}

export default function AuthPage({ mode }: AuthPageProps) {
  const isRegistering = mode === 'register';
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    invitationToken: '',
    acceptTerms: false,
    stayLoggedIn: false
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: string) => {
    let error = '';
    if (name === 'username') {
      if (!/^[a-zA-Z0-9]{3,}$/.test(value)) {
        error = '用户名需为3位以上字母或数字';
      }
    } else if (name === 'password') {
       if (value.length < 6 || !/[a-zA-Z]/.test(value) || !/\d/.test(value)) {
         error = '密码需至少6位，且包含字母和数字';
       }
    }
    setFieldErrors(prev => ({
      ...prev,
      [name]: error
    }));
    return error;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (isRegistering) {
      validateField(e.target.name, e.target.value);
    }
  };

  const { login } = useAuth();
  const router = useRouter();

  const calculateStrength = (password: string) => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  };

  const getStrengthLabel = (score: number) => {
    switch (score) {
      case 0:
      case 1:
        return { label: "非常弱", color: "text-red-500" };
      case 2:
        return { label: "弱", color: "text-orange-500" };
      case 3:
        return { label: "一般", color: "text-yellow-500" };
      case 4:
        return { label: "强", color: "text-green-500" };
      case 5:
        return { label: "非常强", color: "text-green-600" };
      default:
        return { label: "非常弱", color: "text-red-500" };
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    const name = e.target.name;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error when user starts typing
    if (fieldErrors[name]) {
        setFieldErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
        });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (isRegistering) {
        // Validation
        const usernameError = validateField('username', formData.username);
        const passwordError = validateField('password', formData.password);
        
        if (usernameError || passwordError) {
             throw new Error('请修正表单中的错误');
        }

        if (formData.password !== formData.confirmPassword) {
          throw new Error('两次输入的密码不一致');
        }
        if (!formData.acceptTerms) {
          throw new Error('请阅读并同意服务条款');
        }
        await api.post('/Auth/register', { 
          username: formData.username, 
          email: formData.email, 
          password: formData.password,
          invitationToken: formData.invitationToken
        });
        setSuccessMessage('注册成功！正在跳转登录...');
        setTimeout(() => router.push('/login'), 1500);
      } else {
        const response = await api.post('/Auth/login', { 
          username: formData.username, 
          password: formData.password 
        });
        login(response.data.token);
        router.push('/'); // Redirect to home page
      }
    } catch (err: any) {
      setError(err.response?.data || err.message || '操作失败，请重试。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#1f2123] relative overflow-hidden"
         style={{ 
           backgroundImage: "url('/demo-assets/general-page-bg.avif')",
           backgroundSize: "cover",
           backgroundPosition: "center top",
           backgroundRepeat: "no-repeat"
         }}>
      
      {/* Container - matched to demo structure (top aligned with padding) */}
      <div className="flex justify-center px-4 pt-[152px] pb-12 relative w-full">
        <div className="max-w-6xl w-full relative z-10">
          
          {/* Header - Outside the card */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-cinzel font-extrabold text-white">
              {isRegistering ? '账户注册' : '账户登录'}
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              {isRegistering ? '创建账户，开启您的时光之旅' : '欢迎回来！登录您的账户'}
            </p>
          </div>

          <div className="bg-[#212121] backdrop-blur-sm rounded-md shadow-xl border border-white/5 overflow-hidden relative">
            
            {/* Background effect */}
            <div className="absolute inset-0 pointer-events-none z-10">
               <img 
                 alt="" 
                 className="object-cover opacity-50 absolute h-full w-full inset-0 text-transparent"
                 src="/demo-assets/login/flame-sparks.png" 
               />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 relative z-20">
              
              {/* Left Column: Form */}
              <div className="p-8">
                <div className="space-y-6">
                  <h2 className="text-2xl font-cinzel font-extrabold text-white text-left">
                    {isRegistering ? '注册' : '登录'}
                  </h2>
                  
                  {error && (
                      <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-lg text-sm text-center">
                          {error}
                      </div>
                  )}
                  {successMessage && (
                      <div className="bg-green-500/10 border border-green-500/30 text-green-500 px-4 py-3 rounded-lg text-sm text-center">
                          {successMessage}
                      </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Username Input */}
                <div>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-4 w-4 text-gray-400/50" />
                        </div>
                        <input 
                            type="text"
                            name="username"
                            required
                            value={formData.username}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={`block w-full pl-10 pr-3 py-2 border ${fieldErrors.username ? 'border-red-500' : 'border-white/10'} rounded-lg bg-[#323232] text-white/50 placeholder-gray-400/50 focus:outline-none focus:ring-2 ${fieldErrors.username ? 'focus:ring-red-500' : 'focus:ring-yellow-500'} focus:border-transparent transition-all duration-200`}
                            placeholder="请输入用户名"
                        />
                        {/* Validation Bubble */}
                        {fieldErrors.username && (
                           <div className="absolute left-0 -bottom-10 z-20 animate-in fade-in zoom-in duration-200">
                               <div className="relative bg-red-600 text-white text-xs px-3 py-1.5 rounded shadow-lg">
                                   <div className="absolute -top-1 left-4 w-2 h-2 bg-red-600 transform rotate-45"></div>
                                   {fieldErrors.username}
                               </div>
                           </div>
                        )}
                    </div>
                </div>

                {/* Email Input (Register Only) */}
                {isRegistering && (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-4 w-4 text-gray-400/50" />
                            </div>
                            <input 
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleInputChange}
                                className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-lg bg-[#323232] text-white/50 placeholder-gray-400/50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                                placeholder="请输入电子邮箱"
                            />
                        </div>
                    </div>
                )}

                {/* Password Input */}
                <div>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-4 w-4 text-gray-400/50" />
                        </div>
                        <input 
                            type={showPassword ? "text" : "password"}
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            className={`block w-full pl-10 pr-12 py-2 border ${fieldErrors.password ? 'border-red-500' : 'border-white/10'} rounded-lg bg-[#323232] text-white/50 placeholder-gray-400/50 focus:outline-none focus:ring-2 ${fieldErrors.password ? 'focus:ring-red-500' : 'focus:ring-yellow-500'} focus:border-transparent transition-all duration-200`}
                            placeholder="请输入密码"
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer hover:scale-110 transition-transform duration-200"
                            title={showPassword ? "隐藏密码" : "显示密码"}
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400 hover:text-yellow-500 transition-colors duration-200" /> 
                            ) : (
                                <Eye className="h-4 w-4 text-gray-400 hover:text-yellow-500 transition-colors duration-200" />
                            )}
                        </button>
                        {/* Validation Bubble */}
                        {fieldErrors.password && (
                           <div className="absolute left-0 -bottom-10 z-20 animate-in fade-in zoom-in duration-200">
                               <div className="relative bg-red-600 text-white text-xs px-3 py-1.5 rounded shadow-lg">
                                   <div className="absolute -top-1 left-4 w-2 h-2 bg-red-600 transform rotate-45"></div>
                                   {fieldErrors.password}
                               </div>
                           </div>
                        )}
                    </div>
                    {!isRegistering && (
                        <div className="mt-2 text-right">
                            <button type="button" className="text-sm text-yellow-500 font-medium hover:text-yellow-400 transition-colors duration-200">
                                忘记密码？
                            </button>
                        </div>
                    )}
                </div>

                {/* Confirm Password (Register Only) */}
                {isRegistering && (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <ShieldCheck className="h-4 w-4 text-gray-400/50" />
                            </div>
                            <input 
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                required
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                className="block w-full pl-10 pr-12 py-2 border border-white/10 rounded-lg bg-[#323232] text-white/50 placeholder-gray-400/50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                                placeholder="请确认密码"
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer hover:scale-110 transition-transform duration-200"
                                title={showConfirmPassword ? "隐藏密码" : "显示密码"}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4 text-gray-400 hover:text-yellow-500 transition-colors duration-200" /> 
                                ) : (
                                    <Eye className="h-4 w-4 text-gray-400 hover:text-yellow-500 transition-colors duration-200" />
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Terms and Conditions (Register Only) */}
                {isRegistering && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-start space-x-3">
                            <div className="flex items-center h-5">
                                <input
                                    id="acceptTerms"
                                    name="acceptTerms"
                                    type="checkbox"
                                    checked={formData.acceptTerms}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 text-yellow-500 bg-[#323232] border-white/10 rounded focus:ring-yellow-500 focus:ring-2"
                                />
                            </div>
                            <div className="text-sm">
                                <label htmlFor="acceptTerms" className="text-gray-300 cursor-pointer">
                                    我同意条款和条件
                                </label>
                            </div>
                        </div>
                        <div className="text-sm text-gray-400 pl-7">
                            勾选此框即表示您同意我们的 <a href="#" className="text-yellow-500 font-medium hover:text-yellow-400 transition-colors duration-200">服务条款</a> 和 <a href="#" className="text-yellow-500 font-medium hover:text-yellow-400 transition-colors duration-200">隐私政策</a>
                        </div>
                    </div>
                )}

                {/* Stay Logged In (Login Only) */}
                {!isRegistering && (
                    <div className="space-y-2">
                        <div className="flex items-start space-x-3">
                            <div className="flex items-center h-5">
                                <input
                                    id="stayLoggedIn"
                                    name="stayLoggedIn"
                                    type="checkbox"
                                    checked={formData.stayLoggedIn}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 text-yellow-500 bg-[#323232] border-white/10 rounded focus:ring-yellow-500 focus:ring-2"
                                />
                            </div>
                            <div className="text-sm">
                                <label htmlFor="stayLoggedIn" className="text-gray-300 cursor-pointer">
                                    30天内保持登录
                                </label>
                            </div>
                        </div>
                        <div className="text-sm text-gray-400 pl-7">
                            否则将保持登录1天
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <div className="mt-8">
                    <button 
                        type="submit" 
                        disabled={isLoading} 
                        className="group relative w-full flex justify-center py-3 px-4 border border-yellow-300/50 text-sm font-medium rounded-sm text-white bg-gradient-to-b from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                处理中...
                            </span>
                        ) : (
                            isRegistering ? '注册' : '登录'
                        )}
                    </button>
                </div>

                {/* Toggle Mode */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-400">
                        {isRegistering ? '已有账户？' : "还没有账户？"}
                        {' '}
                        <button 
                            type="button" 
                            onClick={() => router.push(isRegistering ? '/login' : '/register')}
                            className="text-yellow-500 hover:text-yellow-400 transition-colors duration-200 font-medium"
                        >
                            {isRegistering ? '在此登录' : '在此注册'}
                        </button>
                    </p>
                </div>

            </form>
          </div>
        </div>

        {/* Right Column: Image */}
        <div className="hidden lg:block relative h-full">
            <img 
                src={isRegistering ? "/demo-assets/login/illustration-9.jpeg" : "/demo-assets/login/illustration-6.jpeg"}
                alt="Auth artwork" 
                className="absolute inset-0 w-full h-full object-cover opacity-70 transition-opacity duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#212121] to-transparent"></div>
        </div>

      </div>
    </div>
  </div>
</div>
  </div>
  );
}
