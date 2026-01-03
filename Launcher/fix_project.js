
const fs = require('fs');
const path = require('path');

// Paths
const projectRoot = path.resolve(__dirname, '../WebBackend/Client/src');
const publicRoot = path.resolve(__dirname, '../WebBackend/Client/public');
const sourceVideoPath = 'F:\\工作区\\模块开发\\StoryOfTimeLauncher\\WebBackend\\关键页面截图\\header-video.mp4';
const destVideoDir = path.join(publicRoot, 'video');
const destVideoPath = path.join(destVideoDir, 'hero-bg.mp4');

// Ensure video directory exists
if (!fs.existsSync(destVideoDir)) {
    fs.mkdirSync(destVideoDir, { recursive: true });
    console.log(`Created directory: ${destVideoDir}`);
}

// Copy video
try {
    fs.copyFileSync(sourceVideoPath, destVideoPath);
    console.log(`Copied video to ${destVideoPath}`);
} catch (err) {
    console.error(`Error copying video: ${err.message}`);
}

// Navbar Content (Fixed Layout & Encoding)
const navbarContent = `'use client';

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
      <div className={\`fixed left-0 right-0 z-50 transition-all duration-300 \${scrolled ? 'top-0' : 'top-[10px]'}\`}>
        <nav className={\`relative max-w-7xl rounded-sm mx-auto w-full overflow-visible transition-all duration-300 \${scrolled ? 'bg-[#1e1e1e]/95 shadow-lg' : 'bg-[#1e1e1e]/90'} backdrop-blur-sm border-b border-white/5\`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
            <div className="relative flex h-16 items-center justify-between">
              
              {/* Mobile Menu Button (Left) */}
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                <button 
                  type="button"
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-white/5 hover:text-white focus:outline-none"
                >
                  <span className="sr-only">Open main menu</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="block size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"></path>
                  </svg>
                </button>
              </div>

              {/* Logo & Desktop Nav (Center/Left) */}
              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <div className="flex shrink-0 items-center cursor-pointer mr-8" onClick={() => navigate('/')}>
                  <span className="text-xl font-serif font-bold text-yellow-500 tracking-widest uppercase">时光故事</span>
                </div>
                <div className="hidden sm:block">
                  <div className="flex space-x-1 font-cinzel h-full">
                    <Link href="/" className={\`px-4 py-2 text-sm font-medium flex items-center tracking-wide transition-colors \${pathname === '/' ? 'text-white border-b-2 border-yellow-500' : 'text-gray-300 hover:text-white hover:bg-white/5'}\`}>HOME</Link>
                    <Link href="/news" className="px-4 py-2 text-sm font-medium flex items-center tracking-wide text-gray-300 hover:text-white hover:bg-white/5 transition-colors">NEWS</Link>
                    <Link href="/about" className="px-4 py-2 text-sm font-medium flex items-center tracking-wide text-gray-300 hover:text-white hover:bg-white/5 transition-colors">ABOUT</Link>
                    <Link href="/faq" className="px-4 py-2 text-sm font-medium flex items-center tracking-wide text-gray-300 hover:text-white hover:bg-white/5 transition-colors">FAQ</Link>
                    
                    {/* Shop Dropdown */}
                    <div className="group relative h-full flex items-center">
                        <Link href="/store" className={\`px-4 py-2 text-sm font-medium flex items-center tracking-wide transition-colors \${pathname === '/store' ? 'text-white border-b-2 border-yellow-500' : 'text-gray-300 group-hover:text-white group-hover:bg-white/5'}\`}>
                          SHOP <span className="ml-1 text-[10px]">▼</span>
                        </Link>
                         <ul className="absolute left-0 top-full hidden group-hover:block w-48 bg-[#1e1e1e] border border-white/10 shadow-xl py-2 z-50 rounded-b-sm">
                            <li><a className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer">Mounts</a></li>
                            <li><a className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer">Pets</a></li>
                            <li><a className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer">Services</a></li>
                         </ul>
                    </div>

                    <Link href="/register" className="px-4 py-2 text-sm font-medium flex items-center tracking-wide text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors ml-2 rounded-sm border border-yellow-500/20">
                      PLAY
                    </Link>

                     {/* More Dropdown */}
                     <div className="group relative h-full flex items-center">
                        <div className="px-4 py-2 text-sm font-medium flex items-center tracking-wide text-gray-300 hover:text-white hover:bg-white/5 cursor-pointer transition-colors">
                          MORE <span className="ml-1 text-[10px]">▼</span>
                        </div>
                         <ul className="absolute left-0 top-full hidden group-hover:block w-48 bg-[#1e1e1e] border border-white/10 shadow-xl py-2 z-50 rounded-b-sm">
                            <li><a className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer">Server Status</a></li>
                            <li><a className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer">Discord</a></li>
                         </ul>
                    </div>

                    {/* Vote Dropdown */}
                     <div className="group relative h-full flex items-center">
                        <div className="px-4 py-2 text-sm font-medium flex items-center tracking-wide text-gray-300 hover:text-white hover:bg-white/5 cursor-pointer transition-colors">
                          VOTE <span className="ml-1 text-[10px]">▼</span>
                        </div>
                         <ul className="absolute left-0 top-full hidden group-hover:block w-48 bg-[#1e1e1e] border border-white/10 shadow-xl py-2 z-50 rounded-b-sm">
                            <li><a className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer">TopG</a></li>
                            <li><a className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer">Xtremetop100</a></li>
                         </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Auth (Right) */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                <div className="flex items-center space-x-4">
                  {user ? (
                    <div className="group relative">
                      <div className="flex items-center gap-2 cursor-pointer py-2">
                         <div className="h-8 w-8 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 p-0.5">
                           <div className="h-full w-full rounded-full bg-black flex items-center justify-center">
                             <span className="text-yellow-500 font-serif font-bold text-sm">{user.username.charAt(0).toUpperCase()}</span>
                           </div>
                         </div>
                         <span className="text-sm font-serif text-gray-300 hidden md:block">{user.username}</span>
                      </div>
                      <ul className="absolute right-0 top-full hidden group-hover:block w-52 bg-[#1e1e1e] border border-white/10 shadow-xl py-1 z-50 rounded-b-sm mt-1">
                         <li className="px-4 py-3 border-b border-white/10 bg-white/5">
                            <p className="text-xs text-yellow-500 font-bold">Balance: {user.points} Coins</p>
                         </li>
                         <li><a onClick={() => navigate('/dashboard')} className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer">Dashboard</a></li>
                         <li><a onClick={logout} className="block px-4 py-2 text-sm text-red-400 hover:bg-white/10 hover:text-red-300 cursor-pointer">Sign Out</a></li>
                      </ul>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => navigate('/login')} className="text-gray-300 hover:text-white text-sm font-medium transition-colors px-3 py-2">Sign In</button>
                      <button onClick={() => navigate('/register')} className="bg-primary hover:bg-primary-hover text-black px-5 py-1.5 rounded-sm text-sm font-bold transition-all uppercase tracking-wide">Sign Up</button>
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
        <div className="fixed inset-0 z-[60] flex sm:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          {/* Sidebar */}
          <div className="relative bg-[#1e1e1e] text-white w-64 max-w-[80%] h-full p-6 shadow-2xl flex flex-col border-r border-white/10">
            <div className="flex items-center justify-between mb-8">
              <span className="text-lg font-serif font-bold text-yellow-500 tracking-widest uppercase">时光故事</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <ul className="space-y-4 font-cinzel flex-1">
              <li>
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="block text-lg font-medium text-white hover:text-yellow-500 transition-colors">HOME</Link>
              </li>
              <li>
                <Link href="/news" onClick={() => setIsMobileMenuOpen(false)} className="block text-lg font-medium text-gray-400 hover:text-white transition-colors">NEWS</Link>
              </li>
              <li>
                <Link href="/store" onClick={() => setIsMobileMenuOpen(false)} className="block text-lg font-medium text-gray-400 hover:text-white transition-colors">SHOP</Link>
              </li>
               <li>
                <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="block text-lg font-medium text-gray-400 hover:text-white transition-colors">ABOUT</Link>
              </li>
               <li>
                <Link href="/faq" onClick={() => setIsMobileMenuOpen(false)} className="block text-lg font-medium text-gray-400 hover:text-white transition-colors">FAQ</Link>
              </li>
            </ul>

            <div className="mt-auto space-y-3">
              {user ? (
                 <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="w-full bg-red-900/50 border border-red-500/30 text-red-200 py-2 rounded-sm hover:bg-red-900/80 transition">Sign Out</button>
              ) : (
                <>
                  <button onClick={() => navigate('/login')} className="w-full border border-white/20 text-white py-2 rounded-sm hover:bg-white/5 transition">Sign In</button>
                  <button onClick={() => navigate('/register')} className="w-full bg-yellow-600 text-white py-2 rounded-sm hover:bg-yellow-500 transition font-bold">PLAY NOW</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
`;

// Page Content (Fixed Video Path & Encoding)
const homeContent = `'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#1a1a1a] text-white overflow-x-hidden font-sans selection:bg-yellow-500 selection:text-black">
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
            {/* Fallback Overlay */}
            <div className="absolute inset-0 bg-black/40 z-0"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto pt-20">
            <div className="animate-fade-in-up space-y-8">
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold font-serif text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] tracking-wider">
                    时光故事
                </h1>
                <p className="text-xl md:text-2xl font-serif text-gray-200 drop-shadow-md max-w-3xl mx-auto leading-relaxed">
                    重温经典，再续传奇。加入我们，开启属于你的史诗篇章。
                    <br/>
                    <span className="text-lg text-gray-400 mt-2 block">Experience the legend. Relive the glory.</span>
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
                    <Link 
                        href="/register" 
                        className="group relative inline-flex items-center justify-center px-10 py-4 text-base font-bold text-black bg-yellow-500 hover:bg-yellow-400 rounded-sm uppercase tracking-widest transition-all duration-300 hover:scale-105 shadow-[0_0_20px_rgba(234,179,8,0.3)]"
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
            </div>
        </div>
        
        {/* Bottom Gradient Fade */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#1a1a1a] to-transparent z-10"></div>
      </div>

      {/* Latest News */}
      <div className="w-full py-20 bg-[#1a1a1a] relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-yellow-500 mb-12 text-center relative after:content-[''] after:block after:w-24 after:h-1 after:bg-yellow-500 after:mx-auto after:mt-4">
                最新资讯 (Latest News)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* News Item 1 */}
                <div className="bg-[#222] border border-white/5 rounded-sm overflow-hidden group hover:border-yellow-500/50 transition-colors duration-300">
                    <div className="h-48 relative overflow-hidden">
                         <div className="absolute inset-0 bg-gray-800"></div>
                         {/* Replace with actual image when available */}
                         <div className="absolute inset-0 flex items-center justify-center text-gray-600 font-cinzel font-bold">NEWS IMAGE</div>
                    </div>
                    <div className="p-5">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-yellow-500 text-xs font-bold uppercase tracking-wide">Announcement</span>
                            <span className="text-gray-500 text-xs">Dec 28</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-200 mb-2 group-hover:text-yellow-500 transition-colors line-clamp-2">
                            New Expansion Details Revealed
                        </h3>
                        <p className="text-gray-400 text-sm line-clamp-3 mb-4">
                            Discover what awaits in the upcoming expansion. New zones, raids, and classes to explore.
                        </p>
                        <Link href="/news/1" className="text-yellow-500 text-sm font-bold flex items-center hover:underline">
                            Read More &rarr;
                        </Link>
                    </div>
                </div>
                 {/* News Item 2 */}
                <div className="bg-[#222] border border-white/5 rounded-sm overflow-hidden group hover:border-yellow-500/50 transition-colors duration-300">
                    <div className="h-48 relative overflow-hidden">
                         <div className="absolute inset-0 bg-gray-800"></div>
                         <div className="absolute inset-0 flex items-center justify-center text-gray-600 font-cinzel font-bold">NEWS IMAGE</div>
                    </div>
                    <div className="p-5">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-green-500 text-xs font-bold uppercase tracking-wide">Event</span>
                            <span className="text-gray-500 text-xs">Dec 25</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-200 mb-2 group-hover:text-yellow-500 transition-colors line-clamp-2">
                            Winter Festival Celebration
                        </h3>
                        <p className="text-gray-400 text-sm line-clamp-3 mb-4">
                            Join us for the annual Winter Festival! Special rewards, quests, and holiday cheer for everyone.
                        </p>
                        <Link href="/news/2" className="text-yellow-500 text-sm font-bold flex items-center hover:underline">
                            Read More &rarr;
                        </Link>
                    </div>
                </div>
                 {/* News Item 3 */}
                <div className="bg-[#222] border border-white/5 rounded-sm overflow-hidden group hover:border-yellow-500/50 transition-colors duration-300">
                    <div className="h-48 relative overflow-hidden">
                         <div className="absolute inset-0 bg-gray-800"></div>
                         <div className="absolute inset-0 flex items-center justify-center text-gray-600 font-cinzel font-bold">NEWS IMAGE</div>
                    </div>
                    <div className="p-5">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-blue-500 text-xs font-bold uppercase tracking-wide">Maintenance</span>
                            <span className="text-gray-500 text-xs">Dec 20</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-200 mb-2 group-hover:text-yellow-500 transition-colors line-clamp-2">
                            Scheduled Server Maintenance
                        </h3>
                        <p className="text-gray-400 text-sm line-clamp-3 mb-4">
                            Servers will be down for scheduled maintenance on Tuesday. Expected downtime is 4 hours.
                        </p>
                        <Link href="/news/3" className="text-yellow-500 text-sm font-bold flex items-center hover:underline">
                            Read More &rarr;
                        </Link>
                    </div>
                </div>
                 {/* News Item 4 */}
                <div className="bg-[#222] border border-white/5 rounded-sm overflow-hidden group hover:border-yellow-500/50 transition-colors duration-300">
                    <div className="h-48 relative overflow-hidden">
                         <div className="absolute inset-0 bg-gray-800"></div>
                         <div className="absolute inset-0 flex items-center justify-center text-gray-600 font-cinzel font-bold">NEWS IMAGE</div>
                    </div>
                    <div className="p-5">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-yellow-500 text-xs font-bold uppercase tracking-wide">Community</span>
                            <span className="text-gray-500 text-xs">Dec 15</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-200 mb-2 group-hover:text-yellow-500 transition-colors line-clamp-2">
                            Community Spotlight: Top Guilds
                        </h3>
                        <p className="text-gray-400 text-sm line-clamp-3 mb-4">
                            We interview the leaders of the top guilds on the server to hear their strategies and stories.
                        </p>
                        <Link href="/news/4" className="text-yellow-500 text-sm font-bold flex items-center hover:underline">
                            Read More &rarr;
                        </Link>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </main>
  );
}
`;

// Write Files
fs.writeFileSync(path.join(projectRoot, 'components/Navbar.tsx'), navbarContent, 'utf8');
fs.writeFileSync(path.join(projectRoot, 'app/page.tsx'), homeContent, 'utf8');

console.log('Successfully updated Navbar.tsx and page.tsx with UTF-8 encoding and fixes.');
