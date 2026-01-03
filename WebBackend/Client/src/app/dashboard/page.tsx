'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import PurchaseHistory from '../../components/dashboard/PurchaseHistory';
import TimeFragment from '../../components/TimeFragment';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function DashboardPage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, change-password, etc.

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: '', type: 'success' });

    if (newPassword !== confirmPassword) {
      setMessage({ text: '新密码两次输入不一致', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ text: '新密码长度至少需要6位', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      setMessage({ text: '密码修改成功', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const errorMsg = error.response?.data || '修改密码失败，请检查当前密码是否正确';
      setMessage({ text: typeof errorMsg === 'string' ? errorMsg : '修改密码失败', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-200 font-sans flex justify-center pt-20 pb-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
          style={{ backgroundImage: "url('/demo-assets/general-page-bg.avif')" }}
        ></div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl w-full bg-[#212121]/70 backdrop-blur-sm rounded-sm shadow-md border border-white/5 p-8 my-12 relative z-10">
        <h1 className="text-2xl font-bold text-white mb-6 animate-fadeIn">Dashboard</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Profile Section */}
          <div className="lg:col-span-1">
            <div className="bg-[#272727]/50 rounded-sm p-6 border border-white/5">
              <h2 className="text-xl font-semibold text-white mb-4">Profile</h2>
              
              <div className="flex flex-col items-center mb-6">
                <div className="relative cursor-pointer group">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 group-hover:border-yellow-500/50 transition-colors">
                    <Image 
                      src="/images/dashboard/default-avatar.jpg" 
                      alt="User Avatar" 
                      width={96} 
                      height={96} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     {/* Camera Icon */}
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-camera w-6 h-6 text-white"><path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"></path><circle cx="12" cy="13" r="3"></circle></svg>
                  </div>
                </div>
                <button className="mt-2 text-sm text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-1 cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload w-4 h-4"><path d="M12 3v12"></path><path d="m17 8-5-5-5 5"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path></svg>
                  Change Avatar
                </button>
              </div>

              <div className="space-y-3 text-gray-300">
                <div className="space-y-1">
                   <p className="text-sm text-gray-400 font-medium flex items-center">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user w-4 h-4 mr-2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                     Display Name:
                   </p>
                   <p className="text-white font-light pl-6">{user.username}</p>
                </div>
                <div className="space-y-1">
                   <p className="text-sm text-gray-400 font-medium flex items-center">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail w-4 h-4 mr-2"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg>
                     Email:
                   </p>
                   <p className="text-white font-light pl-6">{user.email}</p>
                </div>
                <div className="space-y-1">
                   <p className="text-sm text-gray-400 font-medium flex items-center">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check w-4 h-4 mr-2"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path><path d="m9 12 2 2 4-4"></path></svg>
                     Role:
                   </p>
                   <p className="text-white font-light pl-6">{user.accessLevel > 0 ? 'Admin' : 'Player'}</p>
                </div>
                <div className="space-y-1">
                   <p className="text-sm text-gray-400 font-medium flex items-center">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar w-4 h-4 mr-2"><path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path></svg>
                     Member Since:
                   </p>
                   <p className="text-white font-light pl-6">October 17, 2025</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Account Settings</h3>
                <div className="flex flex-col gap-2">
                  <button className="h-9 px-4 py-2 w-full bg-teal-600/20 hover:bg-teal-600/30 text-teal-400 hover:text-teal-300 border border-teal-500/30 hover:border-teal-500/50 rounded-md text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail w-4 h-4"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg>
                    Change Email
                  </button>
                  <button 
                    onClick={() => setActiveTab('change-password')}
                    className="h-9 px-4 py-2 w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 rounded-md text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check w-4 h-4"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path><path d="m9 12 2 2 4-4"></path></svg>
                    Change Password
                  </button>
                  <button 
                    onClick={logout}
                    className="h-9 px-4 py-2 w-full bg-gray-600/20 hover:bg-gray-600/30 text-gray-400 hover:text-gray-300 border border-gray-500/30 hover:border-gray-500/50 rounded-md text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out w-4 h-4"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" x2="9" y1="12" y2="12"></line></svg>
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="lg:col-span-2">
            
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-fadeIn">
                
                {/* Currency Cards */}
                <div className="bg-[#272727]/50 rounded-sm p-6 border border-white/5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    {/* Free Crystals - Unused for now */}
                    <div className="bg-gradient-to-r from-black/80 to-emerald-500/20 rounded-sm p-3 md:p-4 border border-emerald-500/20">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Image src="/demo-assets/store/currency-green-large.png" width={48} height={48} alt="免费时光碎片" className="w-5 h-5 md:w-6 md:h-6" />
                            <h3 className="text-sm md:text-md font-semibold text-emerald-200">免费时光碎片</h3>
                          </div>
                          <p className="text-xl md:text-2xl font-bold text-white pl-7">0</p>
                        </div>
                        <div className="flex items-center sm:justify-end">
                          <button className="h-9 bg-emerald-500 hover:bg-emerald-400 text-black px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer w-full sm:w-auto flex items-center justify-center gap-1.5 shadow-md">
                            <span className="whitespace-nowrap uppercase">Vote Now</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Premium Crystals - Main Currency */}
                    <div className="bg-gradient-to-r from-black/80 to-yellow-500/20 rounded-sm p-3 md:p-4 border border-yellow-500/20">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <div className="mb-1">
                            <TimeFragment showName iconSize={24} textClassName="text-sm md:text-md font-semibold text-yellow-200" />
                          </div>
                          <p className="text-xl md:text-2xl font-bold text-white pl-8">{user.points}</p>
                        </div>
                        <div className="flex items-center sm:justify-end">
                          <button 
                            onClick={() => router.push('/shop/donate')}
                            className="h-9 bg-yellow-500 hover:bg-yellow-400 text-black px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer w-full sm:w-auto flex items-center justify-center gap-1.5 shadow-md"
                          >
                            <span className="whitespace-nowrap uppercase">Purchase More</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Purchase History Drawer */}
                  <PurchaseHistory />
                </div>

                {/* Dashboard Tools */}
                <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Dashboard Tools</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ToolCard 
                      title="Unstuck Character" 
                      desc="Free your character from stuck positions"
                      image="/images/dashboard/unstuck-tool-bg.avif"
                      color="red"
                      onClick={() => {}}
                    />
                    <ToolCard 
                      title="Teleport Character" 
                      desc="Instantly travel to any location"
                      image="/images/dashboard/teleport-tool-bg.avif"
                      color="green"
                      onClick={() => {}}
                    />
                    <ToolCard 
                      title="Shop" 
                      desc="Browse and purchase items"
                      image="/images/dashboard/shop-tool-bg.avif"
                      color="purple"
                      onClick={() => router.push('/store')}
                    />
                  </div>
                </div>

                {/* Recruitment Invitations */}
                <div className="mt-6 p-3 md:p-4 bg-white/5 rounded-lg border border-white/10">
                   <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <h3 className="text-lg font-semibold text-white">Recruitment Invitations</h3>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <button className="h-9 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2">
                           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail w-4 h-4"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg>
                           <span>View Invitations</span>
                        </button>
                      </div>
                   </div>
                </div>

                {/* Game Accounts */}
                <div className="mt-6 p-3 md:p-4 bg-white/5 rounded-lg border border-white/10">
                   <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                      <h3 className="text-lg font-semibold text-white">Game Accounts</h3>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                         <button className="h-9 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus w-4 h-4"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
                            <span>Create New</span>
                         </button>
                         <button className="h-9 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-plus w-4 h-4"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" x2="19" y1="8" y2="14"></line><line x1="22" x2="16" y1="11" y2="11"></line></svg>
                            <span>Add Existing</span>
                         </button>
                      </div>
                   </div>

                   <div className="space-y-4">
                     <div className="relative rounded-md p-3 md:p-4 bg-[#272727]">
                       <div className="flex space-x-1 mb-4 border-b border-white/10 overflow-x-auto">
                         <button className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap text-yellow-400 border-b-2 border-yellow-400">
                           Overview
                         </button>
                         <button className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap text-gray-400 hover:text-white">
                           Logging
                         </button>
                         <button className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap text-gray-400 hover:text-white">
                           Actions
                         </button>
                       </div>
                       
                       <div className="space-y-4">
                          <p className="text-xs text-gray-500 mb-3">Basic account information and current status</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                            <div className="space-y-2">
                              <span className="flex items-center gap-1 text-sm text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bookmark text-red-400 w-4 h-4"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>
                                <span className="text-red-400">Account Id</span>
                              </span>
                              <p className="pl-5 text-sm text-white/70 font-bold">{user.id || '79'}</p>
                            </div>
                            <div className="space-y-2">
                               <span className="flex items-center gap-1 text-sm text-teal-400">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-round text-teal-400 w-4 h-4"><circle cx="12" cy="8" r="5"></circle><path d="M20 21a8 8 0 0 0-16 0"></path></svg>
                                  <span>Username</span>
                               </span>
                               <p className="pl-5 text-sm text-white/70 font-bold">{user.username}</p>
                            </div>
                            <div className="space-y-2">
                               <span className="flex items-center gap-1 text-sm text-purple-400">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-activity text-purple-400 w-4 h-4"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"></path></svg>
                                  <span>Activity</span>
                               </span>
                               <p className="pl-5 text-xs font-medium text-red-400/50">Offline</p>
                            </div>
                            <div className="space-y-2">
                               <span className="flex items-center gap-1 text-sm text-pink-400">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chart-no-axes-column text-pink-400 w-4 h-4"><path d="M5 21v-6"></path><path d="M12 21V3"></path><path d="M19 21V9"></path></svg>
                                  <span>Status</span>
                               </span>
                               <p className="text-sm text-green-400">Good Standing</p>
                            </div>
                          </div>
                       </div>
                     </div>
                   </div>
                </div>

              </div>
            )}

            {activeTab === 'change-password' && (
              <div className="bg-[#272727]/50 rounded-sm p-6 border border-white/5 animate-fadeIn">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Change Password</h2>
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
                
                {message.text && (
                  <div className={`mb-6 p-4 rounded-lg border ${message.type === 'success' ? 'bg-green-900/20 border-green-900/50 text-green-200' : 'bg-red-900/20 border-red-900/50 text-red-200'}`}>
                    {message.text}
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Current Password</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all ${
                        isSubmitting
                          ? 'bg-blue-600/50 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20'
                      }`}
                    >
                      {isSubmitting ? 'Updating Password...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

function ToolCard({ title, desc, image, color, onClick }: { title: string, desc: string, image: string | null, color: 'red' | 'green' | 'purple', onClick: () => void }) {
  const colorClasses = {
    red: {
      border: 'border-red-500/20 hover:border-red-500/40 hover:shadow-red-500/20',
      gradient: 'from-red-500/10 to-red-600/5 group-hover:from-red-500/15 group-hover:to-red-600/10',
      text: 'group-hover:text-red-300'
    },
    green: {
      border: 'border-green-500/20 hover:border-green-500/40 hover:shadow-green-500/20',
      gradient: 'from-green-500/10 to-green-600/5 group-hover:from-green-500/15 group-hover:to-green-600/10',
      text: 'group-hover:text-green-300'
    },
    purple: {
      border: 'border-purple-500/20 hover:border-purple-500/40 hover:shadow-purple-500/20',
      gradient: 'from-purple-500/10 to-blue-500/5 group-hover:from-blue-500/15 group-hover:to-blue-500/10',
      text: 'group-hover:text-purple-300'
    }
  };

  const classes = colorClasses[color];

  return (
    <div 
      onClick={onClick}
      className={`group relative rounded-lg border p-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg overflow-hidden ${classes.border}`}
    >
      {image && (
        <div className="absolute inset-0">
          <Image 
            src={image} 
            alt={title} 
            fill 
            className="object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-300"
          />
          <div className={`absolute inset-0 bg-gradient-to-br transition-colors duration-300 ${classes.gradient}`}></div>
        </div>
      )}
      
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="relative w-16 h-16 mb-3">
           {/* Placeholder for icon if needed, currently empty in demo */}
        </div>
        <h4 className={`uppercase font-cinzel text-white font-semibold mb-1 transition-colors ${classes.text}`}>{title}</h4>
        <p className="text-gray-300 text-sm group-hover:text-gray-300 transition-colors">{desc}</p>
      </div>
    </div>
  );
}
