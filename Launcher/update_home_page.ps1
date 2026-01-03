$path = "F:\工作区\模块开发\StoryOfTimeLauncher\WebBackend\Client\src\app\page.tsx"
$content = @'
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
                        <div className="relative w-full h-48 overflow-hidden">
                            <Image src="/articles/24.jpeg" alt="News" width={400} height={300} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#272727] to-transparent opacity-80"></div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <div className="flex items-center text-gray-400 text-xs mb-3 font-mono">
                                <span className="text-primary mr-2">📅</span> September 20, 2025
                            </div>
                            <h3 className="text-white font-bold text-lg leading-snug group-hover:text-primary transition-colors duration-300">
                                社区聚焦：本月最佳公会
                            </h3>
                        </div>
                    </div>
                </Link>
                {/* News Item 2 */}
                <Link href="/article/1" className="group block h-full">
                    <div className="bg-[#272727] border border-white/5 rounded-sm overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-primary/30 h-full flex flex-col">
                        <div className="relative w-full h-48 overflow-hidden">
                             <Image src="/articles/28.jpeg" alt="News" width={400} height={300} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#272727] to-transparent opacity-80"></div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <div className="flex items-center text-gray-400 text-xs mb-3 font-mono">
                                <span className="text-primary mr-2">📅</span> September 15, 2025
                            </div>
                            <h3 className="text-white font-bold text-lg leading-snug group-hover:text-primary transition-colors duration-300">
                                探索2025年最佳私人服务器
                            </h3>
                        </div>
                    </div>
                </Link>
                 {/* News Item 3 */}
                <Link href="/article/5" className="group block h-full">
                    <div className="bg-[#272727] border border-white/5 rounded-sm overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-primary/30 h-full flex flex-col">
                        <div className="relative w-full h-48 overflow-hidden">
                             <Image src="/articles/5.jpg" alt="News" width={400} height={300} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#272727] to-transparent opacity-80"></div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <div className="flex items-center text-gray-400 text-xs mb-3 font-mono">
                                <span className="text-primary mr-2">📅</span> September 1, 2025
                            </div>
                            <h3 className="text-white font-bold text-lg leading-snug group-hover:text-primary transition-colors duration-300">
                                更新日志：自定义内容 3.2
                            </h3>
                        </div>
                    </div>
                </Link>
                 {/* News Item 4 */}
                <Link href="/article/2" className="group block h-full">
                    <div className="bg-[#272727] border border-white/5 rounded-sm overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-primary/30 h-full flex flex-col">
                        <div className="relative w-full h-48 overflow-hidden">
                             <Image src="/articles/2.png" alt="News" width={400} height={300} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#272727] to-transparent opacity-80"></div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                            <div className="flex items-center text-gray-400 text-xs mb-3 font-mono">
                                <span className="text-primary mr-2">📅</span> August 20, 2025
                            </div>
                            <h3 className="text-white font-bold text-lg leading-snug group-hover:text-primary transition-colors duration-300">
                                魔兽世界私服新手指南
                            </h3>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
      </div>

      {/* Promo Section */}
      <div className="w-full py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#1a1a1a]">
            <div 
                className="absolute inset-0 bg-center bg-cover bg-no-repeat opacity-40"
                style={{ backgroundImage: "url('/sections/promo-1/bg.webp')" }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a] via-transparent to-[#1a1a1a]"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
            <div className="max-w-2xl">
                <h2 className="text-primary text-3xl md:text-5xl font-bold font-serif leading-tight mb-6 drop-shadow-lg">
                    开启你的史诗之旅
                    <br/>
                    <span className="text-white text-2xl md:text-4xl mt-2 block">BEGIN YOUR EPIC JOURNEY</span>
                </h2>
                <p className="text-gray-300 text-lg mb-8 leading-relaxed font-serif">
                    加入成千上万的玩家，体验终极魔兽世界。立即创建账号，踏上充满挑战与荣耀的冒险之路。
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                     <Link 
                        href="/register" 
                        className="inline-flex items-center justify-center px-8 py-3 text-base font-bold text-black bg-primary hover:bg-primary-hover border border-transparent rounded-sm uppercase tracking-wider transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                    >
                        立即加入
                    </Link>
                    <Link 
                        href="/about" 
                        className="inline-flex items-center justify-center px-8 py-3 text-base font-bold text-white border-2 border-primary hover:bg-primary hover:text-black rounded-sm uppercase tracking-wider transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                    >
                        了解更多
                    </Link>
                </div>
            </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="w-full py-20 bg-[#151515] relative overflow-hidden">
         <div className="absolute inset-0 opacity-10 bg-[url('/sections/server-features/bg.avif')] bg-cover bg-center"></div>
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-4">服务器特色 (SERVER FEATURES)</h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto font-serif">
                    探索让我们的服务器与众不同的独特功能，体验极致的游戏乐趣。
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Feature 1 */}
                <div className="bg-[#202020] border border-white/5 hover:border-primary/30 rounded-sm overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="h-48 overflow-hidden relative">
                        <Image src="/sections/server-features/art-illustration-1.webp" alt="Feature" width={400} height={200} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#202020] to-transparent"></div>
                    </div>
                    <div className="p-6">
                        <h3 className="text-white font-bold text-lg mb-2 group-hover:text-primary transition-colors font-serif">史诗冒险</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">探索定制的地下城和团队副本，挑战你的极限。</p>
                    </div>
                </div>
                 {/* Feature 2 */}
                <div className="bg-[#202020] border border-white/5 hover:border-primary/30 rounded-sm overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="h-48 overflow-hidden relative">
                        <Image src="/sections/server-features/art-illustration-2.webp" alt="Feature" width={400} height={200} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                         <div className="absolute inset-0 bg-gradient-to-t from-[#202020] to-transparent"></div>
                    </div>
                    <div className="p-6">
                        <h3 className="text-white font-bold text-lg mb-2 group-hover:text-primary transition-colors font-serif">边玩边学</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">通过我们深度的教程和指南，掌握新的技能和能力。</p>
                    </div>
                </div>
                 {/* Feature 3 */}
                <div className="bg-[#202020] border border-white/5 hover:border-primary/30 rounded-sm overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="h-48 overflow-hidden relative">
                        <Image src="/sections/server-features/art-illustration-3.webp" alt="Feature" width={400} height={200} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                         <div className="absolute inset-0 bg-gradient-to-t from-[#202020] to-transparent"></div>
                    </div>
                    <div className="p-6">
                        <h3 className="text-white font-bold text-lg mb-2 group-hover:text-primary transition-colors font-serif">世界PVP</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">体验充满策略的世界城市PVP，注重团队配合。</p>
                    </div>
                </div>
                 {/* Feature 4 */}
                <div className="bg-[#202020] border border-white/5 hover:border-primary/30 rounded-sm overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="h-48 overflow-hidden relative">
                        <Image src="/sections/server-features/art-illustration-4.webp" alt="Feature" width={400} height={200} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                         <div className="absolute inset-0 bg-gradient-to-t from-[#202020] to-transparent"></div>
                    </div>
                    <div className="p-6">
                        <h3 className="text-white font-bold text-lg mb-2 group-hover:text-primary transition-colors font-serif">部落/联盟</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">享受平衡的阵营对抗体验。</p>
                    </div>
                </div>
            </div>
         </div>
      </div>
    </main>
  );
}
'@

[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
Write-Host "Updated page.tsx"
