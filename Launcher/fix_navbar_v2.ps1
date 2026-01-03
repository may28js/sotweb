$currentDir = Get-Location
$relativePath = "..\WebBackend\Client\src\components\Navbar.tsx"
$path = $currentDir.Path + "\" + $relativePath
$resolvedPath = $path
try {
    $resolvedPath = Resolve-Path $path -ErrorAction Stop
} catch {
    Write-Host "Path resolution failed for $path. Trying absolute path construction."
}

# If Resolve-Path worked, use it. If not, maybe the file doesn't exist? (It should).
# But Resolve-Path returns a PathInfo object, we need the Path property.
if ($resolvedPath.Path) {
    $resolvedPath = $resolvedPath.Path
}

Write-Host "Target Path: $resolvedPath"

$content = @'
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => pathname === path;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
  };

  const navigate = (path: string) => {
    router.push(path);
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-md border-b border-white/10' : 'bg-transparent border-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <div className="flex-shrink-0 cursor-pointer group" onClick={() => navigate('/')}>
              <span className="text-2xl font-serif font-bold text-primary group-hover:text-primary-hover transition-colors tracking-widest uppercase">
                时光故事
              </span>
            </div>
            <div className="hidden md:block">
              <div className="ml-12 flex items-baseline space-x-8">
                <button
                  onClick={() => navigate('/')}
                  className={`px-3 py-2 text-sm font-serif font-medium tracking-wider uppercase transition-colors relative group ${isActive('/') ? 'text-primary' : 'text-gray-300 hover:text-white'}`}
                >
                  Home
                  <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-primary transform transition-transform duration-300 ${isActive('/') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
                </button>
                <button
                  onClick={() => user ? navigate('/store') : navigate('/login')}
                  className={`px-3 py-2 text-sm font-serif font-medium tracking-wider uppercase transition-colors relative group ${isActive('/store') ? 'text-primary' : 'text-gray-300 hover:text-white'}`}
                >
                  Store
                  <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-primary transform transition-transform duration-300 ${isActive('/store') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
                </button>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {user ? (
                <div className="relative ml-3" ref={dropdownRef}>
                  <div>
                    <button
                      type="button"
                      className="flex items-center max-w-xs text-sm focus:outline-none"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      <span className="sr-only">Open user menu</span>
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-yellow-600 p-0.5">
                        <div className="h-full w-full rounded-full bg-black flex items-center justify-center">
                            <span className="text-primary font-serif font-bold text-lg">{user.username.charAt(0).toUpperCase()}</span>
                        </div>
                      </div>
                    </button>
                  </div>

                  {isDropdownOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-none shadow-2xl bg-[#1a1a1a] border border-white/10 ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-sm text-white font-serif tracking-wide">{user.username}</p>
                        <p className="text-xs text-gray-500 truncate mt-1">{user.email}</p>
                      </div>
                      
                      <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Balance</p>
                        <div className="flex items-center mt-1">
                          <span className="text-lg font-serif font-bold text-primary">{user.points}</span>
                          <span className="text-xs text-gray-500 ml-1">Coins</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          navigate('/dashboard');
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        Dashboard
                      </button>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-6">
                  <button
                    onClick={() => navigate('/login')}
                    className="text-sm font-serif font-medium text-gray-400 hover:text-white uppercase tracking-wider transition-colors"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="px-6 py-2 bg-primary hover:bg-primary-hover text-black font-serif font-bold text-sm uppercase tracking-wider rounded-none transition-colors clip-path-polygon"
                    style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)' }}
                  >
                    Play Now
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'} bg-[#1a1a1a] border-b border-white/10`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <button
            onClick={() => {
              navigate('/');
              setIsMobileMenuOpen(false);
            }}
            className="block px-3 py-2 text-base font-serif font-medium text-white hover:text-primary transition-colors uppercase tracking-wider w-full text-left"
          >
            Home
          </button>
          <button
            onClick={() => {
              user ? navigate('/store') : navigate('/login');
              setIsMobileMenuOpen(false);
            }}
            className="block px-3 py-2 text-base font-serif font-medium text-white hover:text-primary transition-colors uppercase tracking-wider w-full text-left"
          >
            Store
          </button>
        </div>
        <div className="pt-4 pb-4 border-t border-white/10">
          {user ? (
            <div className="flex items-center px-5">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-yellow-600 p-0.5">
                    <div className="h-full w-full rounded-full bg-black flex items-center justify-center">
                        <span className="text-primary font-serif font-bold text-lg">{user.username.charAt(0).toUpperCase()}</span>
                    </div>
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-serif font-medium leading-none text-white">{user.username}</div>
                <div className="text-sm font-medium leading-none text-gray-400 mt-1">{user.email}</div>
                <div className="text-sm font-serif text-primary mt-1">{user.points} Coins</div>
              </div>
              <button
                onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                }}
                 className="ml-auto bg-white/10 flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-white focus:outline-none"
              >
                  <span className="text-xs px-2">Logout</span>
              </button>
            </div>
          ) : (
            <div className="mt-3 px-2 space-y-1">
              <button
                onClick={() => {
                    navigate('/login');
                    setIsMobileMenuOpen(false);
                }}
                className="block px-3 py-2 text-base font-medium text-gray-400 hover:text-white hover:bg-white/10 rounded-md w-full text-left"
              >
                Log In
              </button>
              <button
                onClick={() => {
                    navigate('/register');
                    setIsMobileMenuOpen(false);
                }}
                className="block px-3 py-2 text-base font-medium text-primary hover:text-primary-hover hover:bg-white/10 rounded-md w-full text-left"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
'@

[System.IO.File]::WriteAllText($resolvedPath, $content, [System.Text.Encoding]::UTF8)
Write-Host "Navbar.tsx has been fixed."
