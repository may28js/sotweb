
$path = "..\WebBackend\Client\src\components\Navbar.tsx"
$resolvedPath = Resolve-Path $path

$content = @"
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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigate = (path: string) => {
    router.push(path);
  };

  return (
    <div className={`fixed left-0 right-0 z-50 transition-all duration-300 \${scrolled ? 'top-0' : 'top-[10px]'}`}>
      <div className="drawer">
        <input id="mobile-drawer" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content">
          <nav className={`relative max-w-7xl rounded-sm mx-auto w-full overflow-hidden transition-all duration-300 \${scrolled ? 'bg-[#1e1e1e]/95 shadow-lg' : 'bg-[#1e1e1e]/90'} backdrop-blur-sm after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px`}>
            <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 w-full">
              <div className="relative flex h-16 items-center justify-between">
                <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                  <label htmlFor="mobile-drawer" className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-white/5 hover:text-white focus:outline-2 focus:-outline-offset-1 focus:outline-indigo-500 cursor-pointer">
                    <span className="sr-only">Open main menu</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" className="block size-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"></path>
                    </svg>
                  </label>
                </div>
                <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                  <div className="hidden sm:flex shrink-0 items-center cursor-pointer" onClick={() => navigate('/')}>
                    <span className="text-xl font-serif font-bold text-yellow-500 tracking-widest uppercase">时光故事</span>
                  </div>
                  <div className="hidden sm:ml-6 sm:block">
                    <div className="flex space-x-2 font-cinzel">
                      <Link href="/" className={`px-5 py-5.5 text-sm font-medium h-full flex items-center tracking-wide cursor-pointer \${pathname === '/' ? 'text-white bg-white/5 relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-yellow-500' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>HOME</Link>
                      <Link href="/news" className="text-gray-300 hover:bg-white/5 hover:text-white px-5 py-5.5 text-sm font-medium h-full flex items-center tracking-wide cursor-pointer">NEWS</Link>
                      <Link href="/about" className="text-gray-300 hover:bg-white/5 hover:text-white px-5 py-5.5 text-sm font-medium h-full flex items-center tracking-wide cursor-pointer">ABOUT</Link>
                      <Link href="/faq" className="text-gray-300 hover:bg-white/5 hover:text-white px-5 py-5.5 text-sm font-medium h-full flex items-center tracking-wide cursor-pointer">FAQ</Link>
                      <Link href="/store" className={`px-5 py-5.5 text-sm font-medium h-full flex items-center tracking-wide cursor-pointer \${pathname === '/store' ? 'text-white bg-white/5 relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-yellow-500' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
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
        <div className="drawer-side z-[60]">
          <label htmlFor="mobile-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
          <div className="bg-[#1e1e1e] text-white min-h-full w-80 p-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <span className="text-lg font-semibold text-yellow-500">时光故事</span>
              </div>
              <label htmlFor="mobile-drawer" className="p-2 text-gray-400 hover:text-white cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"></path>
                </svg>
              </label>
            </div>
            <ul className="space-y-2 font-cinzel">
              <li>
                <Link href="/" className="bg-yellow-500/20 text-yellow-400 border-l-4 border-yellow-500 block rounded-md px-4 py-3 text-base font-medium transition-colors">
                  <span className="flex items-center justify-between">HOME</span>
                </Link>
              </li>
              <li>
                <Link href="/news" className="text-gray-300 hover:bg-white/5 hover:text-white block rounded-md px-4 py-3 text-base font-medium transition-colors">
                  <span className="flex items-center justify-between">NEWS</span>
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-300 hover:bg-white/5 hover:text-white block rounded-md px-4 py-3 text-base font-medium transition-colors">
                  <span className="flex items-center justify-between">ABOUT</span>
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-300 hover:bg-white/5 hover:text-white block rounded-md px-4 py-3 text-base font-medium transition-colors">
                  <span className="flex items-center justify-between">FAQ</span>
                </Link>
              </li>
              <li>
                <Link href="/store" className="text-gray-300 hover:bg-white/5 hover:text-white w-full block rounded-md px-4 py-3 text-base font-medium transition-colors text-left">
                  <span className="flex items-center justify-between">SHOP</span>
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-gray-300 hover:bg-white/5 hover:text-white block rounded-md px-4 py-3 text-base font-medium transition-colors bg-yellow-500/10 text-yellow-500">
                  <span className="flex items-center justify-between">PLAY</span>
                </Link>
              </li>
            </ul>
            <div className="mt-8 space-y-3">
              {user ? (
                 <button onClick={logout} className="w-full bg-red-600 px-6 py-3 rounded-sm text-white hover:bg-red-500 transition cursor-pointer">Sign Out</button>
              ) : (
                <>
                  <button onClick={() => navigate('/login')} className="w-full bg-green-600 px-6 py-3 rounded-sm text-white border-1 border-green-300/50 hover:border-green-400 hover:bg-green-500 transition cursor-pointer">Sign In</button>
                  <button onClick={() => navigate('/register')} className="w-full bg-teal-600 px-6 py-3 rounded-sm text-white border-1 border-teal-400/50 hover:border-teal-500 hover:bg-teal-500 transition cursor-pointer">Sign Up</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
"@

[System.IO.File]::WriteAllText($resolvedPath, $content)
Write-Host "Updated Navbar.tsx"
