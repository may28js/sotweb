import React, { useState } from 'react';
import { User, Lock, Mail, ShieldCheck, Eye, EyeOff, X } from 'lucide-react';
import { authService } from './services/api';

interface LoginPageProps {
  onLogin: () => void;
  onDrag: (e: React.MouseEvent) => void;
  onClose?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onDrag, onClose }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
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
       // Relaxed password validation for launcher, or match website?
       // Website: if (value.length < 6 || !/[a-zA-Z]/.test(value) || !/\d/.test(value))
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

        await authService.register(formData.username, formData.email, formData.password);
        setSuccessMessage('注册成功！请登录。');
        setTimeout(() => setIsRegistering(false), 1500);
      } else {
        const token = await authService.login(formData.username, formData.password);
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_username', formData.username);
        onLogin();
      }
    } catch (err: any) {
      console.error(err);
      // Handle axios error or standard error
      const msg = err.response?.data || err.message || '操作失败，请重试。';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden text-white font-sans select-none bg-[#1f2123]"
         style={{ 
           backgroundImage: "url('/images/general-page-bg.avif')",
           backgroundSize: "cover",
           backgroundPosition: "center top",
           backgroundRepeat: "no-repeat"
         }}>
      
      {/* Draggable Top Bar Area (Z-40) */}
      <div 
        className="absolute top-0 left-0 right-0 h-10 z-40"
        onMouseDown={onDrag}
      ></div>

      {/* Close Button Overlay (Z-50) - Independent from drag area */}
      <div className="absolute top-0 right-0 h-10 z-50 flex items-center px-4 pointer-events-none">
         {onClose && (
            <button 
                onClick={onClose} 
                className="pointer-events-auto text-gray-400 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-1.5 transition-colors cursor-pointer"
            >
                <X size={20} />
            </button>
         )}
      </div>

      <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-[400px] relative z-10">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-white flex items-center justify-center gap-3">
              {isRegistering ? '注册' : '登录'}
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              {isRegistering ? '创建账户，开启您的时光之旅' : '欢迎回来！登录您的账户'}
            </p>
          </div>

          <div className="bg-[#1a1a1a] backdrop-blur-md rounded-md shadow-xl border border-white/10 overflow-hidden relative">
            
            {/* Background effect - Cold tone gradient */}
            <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-br from-blue-900/10 to-transparent opacity-30"></div>

            <div className="p-8 relative z-20">
                
                {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}
                {successMessage && (
                    <div className="mb-6 bg-green-500/10 border border-green-500/30 text-green-500 px-4 py-3 rounded-lg text-sm text-center">
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
                           <div className="absolute left-0 -bottom-10 z-30 animate-in fade-in zoom-in duration-200">
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
                        {fieldErrors.password && (
                           <div className="absolute left-0 -bottom-10 z-30 animate-in fade-in zoom-in duration-200">
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
                                    className="w-4 h-4 text-yellow-500 bg-[#323232] border-white/10 rounded focus:ring-yellow-500 focus:ring-2 cursor-pointer"
                                />
                            </div>
                            <div className="text-sm">
                                <label htmlFor="acceptTerms" className="text-gray-300 cursor-pointer">
                                    我同意条款和条件
                                </label>
                            </div>
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
                                    className="w-4 h-4 text-yellow-500 bg-[#323232] border-white/10 rounded focus:ring-yellow-500 focus:ring-2 cursor-pointer"
                                />
                            </div>
                            <div className="text-sm">
                                <label htmlFor="stayLoggedIn" className="text-gray-300 cursor-pointer">
                                    30天内保持登录
                                </label>
                            </div>
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
                            onClick={() => {
                                setIsRegistering(!isRegistering);
                                setError('');
                                setSuccessMessage('');
                                setFieldErrors({});
                            }}
                            className="text-yellow-500 hover:text-yellow-400 transition-colors duration-200 font-medium"
                        >
                            {isRegistering ? '在此登录' : '在此注册'}
                        </button>
                    </p>
                </div>

              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
