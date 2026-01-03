$navbarPath = Resolve-Path "..\WebBackend\Client\src\components\Navbar.tsx"
$homePath = Resolve-Path "..\WebBackend\Client\src\app\page.tsx"

# Navbar Content
$navbarContent = @'
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigate = (path) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <div className={`fixed left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'top-0' : 'top-[10px]'}`}>
        <nav className={`relative max-w-7xl rounded-sm mx-auto w-full overflow-hidden transition-all duration-300 ${scrolled ? 'bg-[#1e1e1e]/95 shadow-lg' : 'bg-[#1e1e1e]/90'} backdrop-blur-sm after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px`}>
          <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 w-full">
            <div className="relative flex h-16 items-center justify-between">
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                {/* Mobile menu button */}
                <button 
                  type="button"
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-white/5 hover:text-white focus:outline-2 focus:-outline-offset-1 focus:outline-indigo-500 cursor-pointer"
                >
                  <span className="sr-only">Open main menu</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" className="block size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"></path>
                  </svg>
                </button>
              </div>
              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <div className="hidden sm:flex shrink-0 items-center cursor-pointer" onClick={() => navigate('/')}>
                  <span className="text-xl font-serif font-bold text-yellow-500 tracking-widest uppercase">时光故事</span>
                </div>
                <div className="hidden sm:ml-6 sm:block">
                  <div className="flex space-x-2 font-cinzel">
                    <Link href="/" className={`px-5 py-5.5 text-sm font-medium h-full flex items-center tracking-wide cursor-pointer ${pathname === '/' ? 'text-white bg-white/5 relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-yellow-500' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>HOME</Link>
                    <Link href="/news" className="text-gray-300 hover:bg-white/5 hover:text-white px-5 py-5.5 text-sm font-medium h-full flex items-center tracking-wide cursor-pointer">NEWS</Link>
                    <Link href="/about" className="text-gray-300 hover:bg-white/5 hover:text-white px-5 py-5.5 text-sm font-medium h-full flex items-center tracking-wide cursor-pointer">ABOUT</Link>
                    <Link href="/faq" className="text-gray-300 hover:bg-white/5 hover:text-white px-5 py-5.5 text-sm font-medium h-full flex items-center tracking-wide cursor-pointer">FAQ</Link>
                    <Link href="/store" className={`px-5 py-5.5 text-sm font-medium h-full flex items-center tracking-wide cursor-pointer ${pathname === '/store' ? 'text-white bg-white/5 relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-yellow-500' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
                      SHOP
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down ml-1.5 opacity-60"><path d="m6 9 6 6 6-6"></path></svg>
                    </Link>
                    <Link href="/register" className="text-gray-300 hover:bg-white/5 hover:text-white px-5 py-5.5 text-sm font-medium h-full flex items-center tracking-wide cursor-pointer bg-yellow-500/10 text-yellow-500">
                      PLAY
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-chevron-right inline-block size-4 ml-2"><circle cx="12" cy="12" r="10"></circle><path d="m10 8 4 4-4 4"></path></svg>
                    </Link>
                    <div className="dropdown dropdown-hover">
                      <div tabIndex={0} role="button" className="text-gray-300 hover:bg-white/5 hover:text-white px-5 py-5.5 text-sm font-medium h-full flex items-center tracking-wide cursor-pointer">
                        MORE
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down ml-1.5 opacity-60"><path d="m6 9 6 6 6-6"></path></svg>
                      </div>
                      <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-[#1e1e1e] rounded-sm w-52 text-gray-300 border border-white/10">
                        <li><a>Server Status</a></li>
                        <li><a>Discord</a></li>
                      </ul>
                    </div>
                    <div className="dropdown dropdown-hover">
                      <div tabIndex={0} role="button" className="text-gray-300 hover:bg-white/5 hover:text-white px-5 py-5.5 text-sm font-medium h-full flex items-center tracking-wide cursor-pointer">
                        VOTE
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down ml-1.5 opacity-60"><path d="m6 9 6 6 6-6"></path></svg>
                      </div>
                      <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-[#1e1e1e] rounded-sm w-52 text-gray-300 border border-white/10">
                        <li><a>Vote Site 1</a></li>
                        <li><a>Vote Site 2</a></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                <div className="space-x-2 mr-2">
                  {user ? (
                    <div className="dropdown dropdown-end">
                      <div tabIndex={0} role="button" className="flex items-center gap-2 cursor-pointer">
                         <div className="h-8 w-8 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 p-0.5">
                           <div className="h-full w-full rounded-full bg-black flex items-center justify-center">
                             <span className="text-yellow-500 font-serif font-bold text-sm">{user.username.charAt(0).toUpperCase()}</span>
                           </div>
                         </div>
                         <span className="text-sm font-serif text-gray-300 hidden md:block">{user.username}</span>
                      </div>
                      <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-[#1e1e1e] rounded-sm w-52 text-gray-300 border border-white/10 mt-4">
                         <li className="px-4 py-2 border-b border-white/10">
                            <p className="text-xs text-yellow-500">Balance: {user.points} Coins</p>
                         </li>
                         <li><a onClick={() => navigate('/dashboard')}>Dashboard</a></li>
                         <li><a onClick={logout}>Sign Out</a></li>
                      </ul>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => navigate('/login')} className="bg-green-600 px-6 py-1 rounded-sm text-white border-1 border-green-300/50 hover:border-green-400 hover:bg-green-500 transition cursor-pointer font-serif text-sm">Sign In</button>
                      <button onClick={() => navigate('/register')} className="bg-teal-600 px-6 py-1 rounded-sm text-white border-1 border-teal-400/50 hover:border-teal-500 hover:bg-teal-500 transition cursor-pointer font-serif text-sm">Sign Up</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          {/* Sidebar */}
          <div className="relative bg-[#1e1e1e] text-white w-80 max-w-[80%] h-full p-4 shadow-xl transform transition-transform duration-300 ease-in-out border-r border-white/10">
            <div className="flex items-center justify-between mb-8 px-2">
              <span className="text-lg font-semibold text-yellow-500 tracking-widest uppercase">时光故事</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-gray-400 hover:text-white cursor-pointer rounded-md hover:bg-white/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <ul className="space-y-2 font-cinzel px-2">
              <li>
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="bg-yellow-500/20 text-yellow-400 border-l-4 border-yellow-500 block rounded-md px-4 py-3 text-base font-medium transition-colors">
                  <span className="flex items-center justify-between">HOME</span>
                </Link>
              </li>
              <li>
                <Link href="/news" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-300 hover:bg-white/5 hover:text-white block rounded-md px-4 py-3 text-base font-medium transition-colors">
                  <span className="flex items-center justify-between">NEWS</span>
                </Link>
              </li>
              <li>
                <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-300 hover:bg-white/5 hover:text-white block rounded-md px-4 py-3 text-base font-medium transition-colors">
                  <span className="flex items-center justify-between">ABOUT</span>
                </Link>
              </li>
              <li>
                <Link href="/faq" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-300 hover:bg-white/5 hover:text-white block rounded-md px-4 py-3 text-base font-medium transition-colors">
                  <span className="flex items-center justify-between">FAQ</span>
                </Link>
              </li>
              <li>
                <Link href="/store" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-300 hover:bg-white/5 hover:text-white w-full block rounded-md px-4 py-3 text-base font-medium transition-colors text-left">
                  <span className="flex items-center justify-between">SHOP</span>
                </Link>
              </li>
              <li>
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-300 hover:bg-white/5 hover:text-white block rounded-md px-4 py-3 text-base font-medium transition-colors bg-yellow-500/10 text-yellow-500">
                  <span className="flex items-center justify-between">PLAY</span>
                </Link>
              </li>
            </ul>

            <div className="mt-8 space-y-3 px-2">
              {user ? (
                 <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full bg-red-600 px-6 py-3 rounded-sm text-white hover:bg-red-500 transition cursor-pointer">Sign Out</button>
              ) : (
                <>
                  <button onClick={() => navigate('/login')} className="w-full bg-green-600 px-6 py-3 rounded-sm text-white border-1 border-green-300/50 hover:border-green-400 hover:bg-green-500 transition cursor-pointer">Sign In</button>
                  <button onClick={() => navigate('/register')} className="w-full bg-teal-600 px-6 py-3 rounded-sm text-white border-1 border-teal-400/50 hover:border-teal-500 hover:bg-teal-500 transition cursor-pointer">Sign Up</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
'@

# Home Page Content
$homeContent = @'
'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#1a1a1a] text-white overflow-x-hidden font-sans selection:bg-primary selection:text-white">
      {/* Hero Section */}
      <div className="relative flex items-center justify-center min-h-screen overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
            <video 
                autoPlay 
                loop 
                muted 
                playsInline 
                className="absolute top-0 left-0 w-full h-full object-cover opacity-60 pointer-events-none"
            >
                <source src="/video/hero-bg.mp4" type="video/mp4" />
            </video>
            {/* Fallback Image overlay if video fails or acts as poster */}
            <div className="absolute inset-0 bg-[url('/sections/server-features/bg.avif')] bg-cover bg-center opacity-40 -z-10"></div>
        </div>
        
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
        
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto pt-20">
            <div className="animate-fade-in-up">
                <h1 className="mb-6 text-5xl md:text-7xl lg:text-8xl font-bold font-serif text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] tracking-wider">
                    欢迎来到<span className="text-primary">时光故事</span>
                </h1>
                <p className="mb-10 text-xl md:text-2xl font-serif text-gray-200 drop-shadow-md max-w-3xl mx-auto leading-relaxed">
                    重温经典，再续传奇。加入我们，开启属于你的史诗篇章。
                    <br/>
                    <span className="text-lg text-gray-400 mt-2 block">Experience the legend. Relive the glory.</span>
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                    <Link 
                        href="/register" 
                        className="inline-flex items-center justify-center px-10 py-4 text-base font-bold text-black bg-primary hover:bg-primary-hover border border-transparent rounded-sm uppercase tracking-widest transition-all duration-300 hover:scale-105 shadow-[0_0_20px_rgba(198,156,109,0.3)]"
                    >
                        立即加入 (Join Now)
                    </Link>
                    <Link 
                        href="#features" 
                        className="inline-flex items-center justify-center px-10 py-4 text-base font-bold text-white border-2 border-white/50 hover:bg-white/10 hover:border-white rounded-sm uppercase tracking-widest transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                    >
                        了解更多 (Learn More)
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden max-w-4xl mx-auto shadow-2xl">
                    <div className="p-6 flex flex-col items-center hover:bg-white/5 transition-colors">
                        <div className="mb-2 text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-8 h-8 stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        </div>
                        <div className="text-gray-400 text-xs sm:text-sm tracking-widest font-bold uppercase mb-1">Online Players</div>
                        <div className="text-3xl sm:text-4xl text-white font-serif font-bold">1,245</div>
                        <div className="text-primary text-xs mt-1">Peak today</div>
                    </div>
                    
                    <div className="p-6 flex flex-col items-center hover:bg-white/5 transition-colors">
                        <div className="mb-2 text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-8 h-8 stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                        </div>
                        <div className="text-gray-400 text-xs sm:text-sm tracking-widest font-bold uppercase mb-1">Server Uptime</div>
                        <div className="text-3xl sm:text-4xl text-white font-serif font-bold">99.9%</div>
                        <div className="text-green-400 text-xs mt-1">Stable & Smooth</div>
                    </div>
                    
                    <div className="p-6 flex flex-col items-center hover:bg-white/5 transition-colors">
                        <div className="mb-2 text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 stroke-current"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><path d="M16 3.128a4 4 0 0 1 0 7.744"></path><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><circle cx="9" cy="7" r="4"></circle></svg>
                        </div>
                        <div className="text-gray-400 text-xs sm:text-sm tracking-widest font-bold uppercase mb-1">Total Accounts</div>
                        <div className="text-3xl sm:text-4xl text-white font-serif font-bold">15k+</div>
                        <div className="text-red-300 text-xs mt-1">Growing Daily</div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Latest News */}
      <div className="w-full py-20 bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-12 text-center relative after:content-[''] after:block after:w-24 after:h-1 after:bg-primary after:mx-auto after:mt-4">
                最新资讯 (Latest News)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* News Item 1 */}
                <Link href="/article/7" className="group block h-full">
                    <div className="bg-[#272727] border border-white/5 rounded-sm overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-primary/30 h-full flex flex-col">
                        <div className="h-48 overflow-hidden relative">
                             <div className="absolute inset-0 bg-gray-700 animate-pulse"></div>
                             {/* Placeholder for news image */}
                             <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-serif">NEWS IMAGE</div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-sm uppercase tracking-wide font-bold">Announcements</span>
                                <span className="text-gray-500 text-xs">Dec 28, 2025</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-200 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                New Raid Content Released!
                            </h3>
                            <p className="text-gray-400 text-sm line-clamp-3 mb-4 flex-1">
                                The new raid tier is now available. Gather your allies and prepare for the ultimate challenge.
                            </p>
                            <span className="text-primary text-sm font-bold flex items-center mt-auto group-hover:translate-x-1 transition-transform">
                                Read More <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                            </span>
                        </div>
                    </div>
                </Link>

                 {/* News Item 2 */}
                 <Link href="/article/6" className="group block h-full">
                    <div className="bg-[#272727] border border-white/5 rounded-sm overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-primary/30 h-full flex flex-col">
                        <div className="h-48 overflow-hidden relative">
                             <div className="absolute inset-0 bg-gray-700 animate-pulse"></div>
                             <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-serif">NEWS IMAGE</div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="bg-green-500/20 text-green-500 text-xs px-2 py-1 rounded-sm uppercase tracking-wide font-bold">Events</span>
                                <span className="text-gray-500 text-xs">Dec 25, 2025</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-200 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                Winter Veil Festival is Here!
                            </h3>
                            <p className="text-gray-400 text-sm line-clamp-3 mb-4 flex-1">
                                Celebrate the holiday season with special quests, rewards, and snowy decorations in all major cities.
                            </p>
                            <span className="text-primary text-sm font-bold flex items-center mt-auto group-hover:translate-x-1 transition-transform">
                                Read More <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                            </span>
                        </div>
                    </div>
                </Link>

                 {/* News Item 3 */}
                 <Link href="/article/5" className="group block h-full">
                    <div className="bg-[#272727] border border-white/5 rounded-sm overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-primary/30 h-full flex flex-col">
                        <div className="h-48 overflow-hidden relative">
                             <div className="absolute inset-0 bg-gray-700 animate-pulse"></div>
                             <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-serif">NEWS IMAGE</div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="bg-blue-500/20 text-blue-500 text-xs px-2 py-1 rounded-sm uppercase tracking-wide font-bold">Updates</span>
                                <span className="text-gray-500 text-xs">Dec 20, 2025</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-200 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                Patch Notes: Class Balance Changes
                            </h3>
                            <p className="text-gray-400 text-sm line-clamp-3 mb-4 flex-1">
                                We have made several adjustments to class abilities to ensure a fair and balanced PvP environment.
                            </p>
                            <span className="text-primary text-sm font-bold flex items-center mt-auto group-hover:translate-x-1 transition-transform">
                                Read More <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                            </span>
                        </div>
                    </div>
                </Link>

                 {/* News Item 4 */}
                 <Link href="/article/4" className="group block h-full">
                    <div className="bg-[#272727] border border-white/5 rounded-sm overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-primary/30 h-full flex flex-col">
                        <div className="h-48 overflow-hidden relative">
                             <div className="absolute inset-0 bg-gray-700 animate-pulse"></div>
                             <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-serif">NEWS IMAGE</div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-sm uppercase tracking-wide font-bold">Announcements</span>
                                <span className="text-gray-500 text-xs">Dec 15, 2025</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-200 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                New Server Opening Soon
                            </h3>
                            <p className="text-gray-400 text-sm line-clamp-3 mb-4 flex-1">
                                Get ready for a fresh start! Our new progressive realm will be launching next month.
                            </p>
                            <span className="text-primary text-sm font-bold flex items-center mt-auto group-hover:translate-x-1 transition-transform">
                                Read More <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                            </span>
                        </div>
                    </div>
                </Link>
            </div>
            
            <div className="text-center mt-16">
                <Link href="/news" className="inline-flex items-center justify-center px-8 py-3 text-sm font-bold text-white border border-white/30 hover:bg-white/10 hover:border-white rounded-sm uppercase tracking-widest transition-all duration-300">
                    查看所有新闻 (View All News)
                </Link>
            </div>
        </div>
      </div>
    </main>
  );
}
'@

[System.IO.File]::WriteAllText($navbarPath, $navbarContent, [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText($homePath, $homeContent, [System.Text.Encoding]::UTF8)

Write-Host "Updated Navbar.tsx and page.tsx with UTF-8 encoding."
