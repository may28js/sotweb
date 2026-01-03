'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, ChevronDown, ShoppingCart, Gem, History, LayoutDashboard, Wrench, Map, LogOut, User as UserIcon, CirclePlay } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import TimeFragment from './TimeFragment'

export default function Navbar() {
  const { user, logout, isLoading } = useAuth()
  const { cartItemCount, toggleCart, openCart } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  // 新增：滚动状态
  const [isScrolled, setIsScrolled] = useState(false)
  const [isRegisterHovered, setIsRegisterHovered] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  
  const userMenuRef = useRef<HTMLDivElement>(null)

  // 处理导航点击，避免 RSC 请求被中断导致的错误
  const handleNavClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    if (pathname !== path) {
      router.push(path);
    }
  };

  // 新增：监听滚动事件
  useEffect(() => {
    const handleScroll = () => {
      // 当滚动超过 20px 时切换状态
      setIsScrolled(window.scrollY > 20)
    }
    
    // 初始化检查
    handleScroll()
    
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Handle click outside to close user menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Helper to get link classes based on active state
  const getLinkClass = (path: string) => {
    // Handle home specifically, for others check if pathname starts with path
    const isActive = path === '/' ? pathname === '/' : pathname.startsWith(path);
    const base = "px-6 h-full flex items-center transition-colors relative group";
    
    if (isActive) {
      return `${base} text-white border-b-4 border-[#FFD700] bg-white/5 cursor-default`;
    }
    return `${base} text-gray-300 hover:text-white hover:bg-white/5 cursor-pointer`;
  }

  // Common Dropdown Item Style
  const dropdownItemClass = "block px-3 py-2 mx-1.5 my-1 rounded-md text-xs text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer flex items-center transition-colors";
  const dropdownItemClassHighlight = "block px-3 py-2 mx-1.5 my-1 rounded-md text-xs text-yellow-500 hover:bg-white/10 hover:text-yellow-400 cursor-pointer flex items-center transition-colors";
  const dropdownItemClassRed = "text-left px-3 py-2 mx-1.5 my-1 rounded-md text-xs text-red-400 hover:bg-white/10 hover:text-red-300 cursor-pointer flex items-center transition-colors";

  return (
    // 修改：根据 isScrolled 动态调整 padding，添加 transition
    <nav className={`fixed w-full z-50 top-0 flex justify-center pointer-events-none transition-all duration-300 ease-in-out ${isScrolled ? 'pt-0 px-0' : 'pt-3 px-4'}`}>
      {/* 修改：根据 isScrolled 动态调整宽度和圆角，添加 transition */}
      <div className={`bg-[#222222]/85 pointer-events-auto backdrop-blur-md shadow-2xl h-16 flex items-center justify-between pl-4 pr-8 transition-all duration-300 ease-in-out ${isScrolled ? 'w-full max-w-[1280px] rounded-b-md rounded-t-none' : 'w-full max-w-[1280px] rounded-md'}`}>
          
          {/* Left Side: Logo + Navigation */}
          <div className="flex items-center h-full">
            
            {/* Logo Area - Image Only - 64x64 Square */}
            <Link href="/" onClick={(e) => handleNavClick(e, '/')} className="flex items-center justify-center w-16 h-full bg-transparent hover:bg-white/5 transition-colors border-r border-white/5 relative group cursor-pointer">
               <div className="relative w-8 h-8 transform group-hover:scale-110 transition-transform duration-300">
                <Image 
                  src="/sot.png" 
                  alt="StoryOfTime Logo" 
                  fill
                  className="object-contain drop-shadow-[0_0_5px_rgba(198,156,109,0.3)]"
                />
             </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center h-full">
              
              <Link href="/" onClick={(e) => handleNavClick(e, '/')} className={getLinkClass('/')}>
                <span className="text-[18px] font-fzytk tracking-widest">主页</span>
              </Link>

              <Link href="/news" onClick={(e) => handleNavClick(e, '/news')} className={getLinkClass('/news')}>
                <span className="text-[18px] font-fzytk tracking-widest">新闻</span>
              </Link>

              <Link href="/about" onClick={(e) => handleNavClick(e, '/about')} className={getLinkClass('/about')}>
                <span className="text-[18px] font-fzytk tracking-widest">活动</span>
              </Link>



              {/* Shop Dropdown */}
              <div className="group relative h-full flex items-center">
                {user ? (
                  <>
                    <Link href="/shop" onClick={(e) => handleNavClick(e, '/shop')} className={`px-6 h-full flex items-center transition-colors group-hover:text-white cursor-pointer ${pathname.startsWith('/shop') ? 'text-white border-b-4 border-[#FFD700] bg-white/5' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
                      <span className="text-[18px] font-fzytk tracking-widest">商店</span>
                      <ChevronDown className="ml-1 w-4 h-4 opacity-60 flex-shrink-0" />
                    </Link>
                    {/* Dropdown Container with Padding for Bridge */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 w-56 z-50 invisible opacity-0 -translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-in-out">
                      <div className="relative bg-[#1e1e1e] border border-white/10 shadow-xl py-1 rounded-md">
                         {/* Bubble Arrow */}
                         <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1e1e1e] border-t border-l border-white/10 rotate-45"></div>
                         
                         <Link href="/shop" onClick={(e) => handleNavClick(e, '/shop')} className={dropdownItemClass}>
                           <ShoppingCart className="w-4 h-4 mr-2" /> 浏览商品
                         </Link>
                         <Link href="/shop/donate" onClick={(e) => handleNavClick(e, '/shop/donate')} className={dropdownItemClass}>
                           <TimeFragment iconSize={16} className="mr-2" /> 获取时光碎片
                         </Link>
                         <Link href="/dashboard" onClick={(e) => handleNavClick(e, '/dashboard')} className={dropdownItemClass}>
                           <History className="w-4 h-4 mr-2 opacity-70" /> 购买记录
                         </Link>
                      </div>
                    </div>
                  </>
                ) : (
                  <Link href="/login" onClick={(e) => handleNavClick(e, '/login')} className="px-6 h-full flex items-center text-gray-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer">
                    <span className="text-[18px] font-fzytk tracking-widest">商店</span>
                  </Link>
                )}
              </div>

              <Link href="/play" onClick={(e) => handleNavClick(e, '/play')} className="h-full flex items-center px-6 bg-[#c69c6d]/10 hover:bg-[#c69c6d]/20 transition-colors relative group">
                <span className="text-[18px] font-fzytk tracking-widest text-[#c69c6d]">如何开始</span>
                <CirclePlay className="w-4 h-4 ml-2 text-[#c69c6d]" />
              </Link>
              
              <Link href="/discord" onClick={(e) => handleNavClick(e, '/discord')} className={getLinkClass('/discord')}>
                <span className="text-[18px] font-fzytk tracking-widest">社区</span>
              </Link>

              <Link href="/download" onClick={(e) => handleNavClick(e, '/download')} className={getLinkClass('/download')}>
                <span className="text-[18px] font-fzytk tracking-widest">游戏下载</span>
              </Link>

            </div>
          </div>

          {/* Right Side: Auth / User */}
          <div className="flex items-center h-full">
               
               {isLoading ? (
                 <div className="flex items-center h-full px-6">
                   <div className="w-24 h-6 bg-white/5 rounded animate-pulse"></div>
                 </div>
               ) : user ? (
                 <>
                   {/* Currency Display */}
                   <div className="hidden md:flex items-center -mr-6 relative z-0">
                      <div className="flex items-center bg-black/40 rounded-full pl-4 pr-10 border border-white/10 h-8 backdrop-blur-sm">
                          {/* Vote Points (Green) */}
                          <div className="flex items-center relative group cursor-default">
                              <Image 
                                src="/demo-assets/store/currency-green-large.png" 
                                alt="VP" 
                                width={20} 
                                height={20} 
                                className="mr-2"
                              />
                              <span className="text-[#45ff83] font-bold text-xs">0</span>
                              
                              {/* Custom Tooltip */}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-[#1e1e1e] border border-white/10 text-white text-xs rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1e1e1e] border-t border-l border-white/10 rotate-45"></div>
                                时光之尘
                              </div>
                          </div>

                          {/* Separator */}
                          <div className="w-[1px] h-3 bg-white/20 mx-3"></div>

                          {/* Premium Points (Red) */}
                          <div className="flex items-center relative group cursor-default">
                              <TimeFragment value={user.points} textClassName="text-[#FFD700] font-bold text-xs" />
                              
                              {/* Custom Tooltip */}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-[#1e1e1e] border border-white/10 text-white text-xs rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1e1e1e] border-t border-l border-white/10 rotate-45"></div>
                                时光碎片
                              </div>
                          </div>
                      </div>
                   </div>

                   {/* Shopping Cart Icon */}
                   <button 
                     onClick={(e) => {
                       e.preventDefault();
                       if (pathname.startsWith('/shop')) {
                         toggleCart();
                       } else {
                         router.push('/shop');
                         openCart();
                       }
                     }}
                     className="mr-6 relative text-gray-300 hover:text-white transition-colors group"
                   >
                     <ShoppingCart className="w-5 h-5" />
                     {cartItemCount > 0 && (
                       <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-[#1a1a1a]">
                         {cartItemCount}
                       </span>
                     )}
                   </button>

                   {/* User Profile Dropdown */}
                   <div className="relative h-full flex items-center z-10" ref={userMenuRef}>
                        <button 
                          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                          className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors cursor-pointer"
                        >
                          <div className="relative w-11 h-11 rounded-full overflow-hidden border-[2px] border-white shadow-lg">
                            <img 
                              src="/demo-assets/home/default-avatar.jpg?v=1" 
                              alt="User" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        <div className={`absolute pt-1 w-64 z-50 transition-all duration-200 ${isUserMenuOpen ? 'visible opacity-100 translate-y-0' : 'invisible opacity-0 -translate-y-2'} lg:right-0 lg:top-full fixed left-1/2 -translate-x-1/2 top-20 lg:absolute lg:left-auto lg:translate-x-0 lg:pt-3`}>
                            <div className="relative bg-[#1e1e1e] border border-white/10 shadow-xl rounded-md overflow-hidden">
                               {/* Bubble Arrow - Hidden on Mobile */}
                               <div className="absolute -top-1.5 right-6 w-3 h-3 bg-[#1e1e1e] border-t border-l border-white/10 rotate-45 hidden lg:block"></div>
                               
                               {/* Header */}
                               <div className="px-4 py-3 border-b border-white/5">
                                  <p className="text-sm font-bold text-white">{user.username}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                               </div>

                               {/* Section 0: Admin Tools */}
                               {user.accessLevel >= 1 && (
                                 <div className="py-1 border-b border-white/5">
                                   <Link href="/admin" className="block px-3 py-2 mx-1.5 my-1 rounded-md text-xs text-white bg-[#c69c6d] hover:bg-[#b58b5c] cursor-pointer flex items-center transition-colors shadow-md">
                                      <LayoutDashboard className="w-3.5 h-3.5 mr-2.5" /> 后台管理
                                   </Link>
                                 </div>
                               )}

                               {/* Section 1: Dashboard Tools */}
                               <div className="py-1 border-b border-white/5">
                                 <Link href="/dashboard" className={dropdownItemClass}>
                                    <UserIcon className="w-3.5 h-3.5 mr-2.5 opacity-70" /> 用户中心
                                 </Link>
                                 <Link href="/dashboard/unstuck" className={dropdownItemClass}>
                                    <Wrench className="w-3.5 h-3.5 mr-2.5 opacity-70" /> 角色脱离卡死
                                 </Link>
                                 <Link href="/dashboard/teleport" className={dropdownItemClass}>
                                    <Map className="w-3.5 h-3.5 mr-2.5 opacity-70" /> 角色传送
                                 </Link>
                               </div>

                               {/* Section 2: Shop & History */}
                               <div className="py-1 border-b border-white/5">
                                 <Link href="/shop/donate" className={dropdownItemClassHighlight}>
                                    <TimeFragment iconSize={14} className="mr-2.5" /> 获取时光碎片
                                 </Link>
                                 <Link href="/shop" className={dropdownItemClass}>
                                    <ShoppingCart className="w-3.5 h-3.5 mr-2.5 opacity-70" /> 浏览商品
                                 </Link>
                                 <Link href="/dashboard" className={dropdownItemClass}>
                                    <History className="w-3.5 h-3.5 mr-2.5 opacity-70" /> 购买历史
                                 </Link>
                               </div>

                               {/* Section 3: Logout */}
                               <div className="py-1">
                                 <button 
                                   onClick={() => {
                                     logout();
                                     setIsUserMenuOpen(false);
                                   }}
                                   className={`${dropdownItemClassRed} w-full`}
                                 >
                                    <LogOut className="w-3.5 h-3.5 mr-2.5 opacity-70" /> 退出登录
                                 </button>
                               </div>
                            </div>
                        </div>
                   </div>
                 </>
               ) : (
                 <div className="ml-4 flex items-center rounded overflow-hidden border border-yellow-400">
                   <Link 
                     href="/login" 
                     prefetch={false} 
                     className={`px-5 py-2 text-xs font-bold tracking-widest transition-all duration-300 ${isRegisterHovered ? 'bg-transparent text-yellow-400' : 'bg-yellow-400 text-black hover:bg-yellow-500'}`}
                   >
                     登录
                   </Link>
                   <Link 
                     href="/register" 
                     prefetch={false} 
                     onMouseEnter={() => setIsRegisterHovered(true)}
                     onMouseLeave={() => setIsRegisterHovered(false)}
                     className={`px-5 py-2 text-xs font-bold tracking-widest transition-all duration-300 ${isRegisterHovered ? 'bg-yellow-400 text-black hover:bg-yellow-500' : 'bg-transparent text-yellow-400 hover:bg-yellow-400/10'}`}
                   >
                     注册
                   </Link>
                 </div>
               )}
          </div>

               {/* Mobile Menu Button */}
               <div className="lg:hidden ml-4">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="text-gray-300 hover:text-white p-1 cursor-pointer"
                >
                  {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="absolute top-20 left-4 right-4 bg-[#1e1e1e] border border-white/10 shadow-2xl rounded-md z-40 lg:hidden pointer-events-auto">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link href="/" className="block px-3 py-2 text-sm font-medium text-white hover:bg-white/10 rounded-md cursor-pointer">主页</Link>
            <Link href="/news" className="block px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-md cursor-pointer">新闻</Link>
            <Link href="/about" className="block px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-md cursor-pointer">活动</Link>

            <Link href="/shop" className="block px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-md cursor-pointer">商店</Link>
            <Link href="/play" className="block px-3 py-2 text-sm font-medium text-[#c69c6d] hover:bg-[#c69c6d]/10 rounded-md cursor-pointer">如何开始</Link>
            <Link href="/discord" className="block px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-md cursor-pointer">社区</Link>
            <Link href="/download" className="block px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-md cursor-pointer">游戏下载</Link>
          </div>
        </div>
      )}
    </nav>
  )
}