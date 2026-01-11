'use client'

import Image from "next/image";
import Link from "next/link";
import { Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getNews } from '../services/newsService';
import { News } from '../types/news';
import { MOCK_NEWS, getMockThumbnail } from '../data/mockNews';

export default function Home() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await getNews();
        if (data && data.length > 0) {
            // Sort by date descending
            const sortedNews = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            // Take top 4
            const topNews = sortedNews.slice(0, 4);
            // Map thumbnails if they are missing or use defaults
            const newsWithImages = topNews.map((item, index) => ({
                ...item,
                thumbnail: item.thumbnail || getMockThumbnail(item.id)
            }));
            setNews(newsWithImages);
        } else {
            // Fallback to MOCK_NEWS (slice 4)
            setNews(MOCK_NEWS.slice(0, 4));
        }
      } catch (error) {
        console.error('Failed to fetch news:', error);
        setNews(MOCK_NEWS.slice(0, 4));
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  // Helper to format date and excerpt for display compatibility
  const getDisplayNews = (item: News) => {
     return {
         ...item,
         // Format date: "2025年9月20日"
        date: new Date(item.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
         // Create excerpt from content (strip HTML tags if any)
         excerpt: item.content.replace(/<[^>]*>?/gm, '').substring(0, 100) + '...',
         image: item.thumbnail || getMockThumbnail(item.id)
     };
  };

  const displayNews = news.map(getDisplayNews);


  return (
    <main className="min-h-screen bg-[#1a1a1a] text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 z-0 h-full">
           <video 
             className="absolute inset-0 w-full h-full object-cover"
             autoPlay 
             muted 
             loop 
             playsInline
           >
             <source src="/demo-assets/header-video.mp4" type="video/mp4" />
             Your browser does not support the video tag.
           </video>
           <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-[#1a1a1a]"></div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-32">
          
          {/* Top Row: Intro */}
          <div className="grid grid-cols-1 gap-8 items-center py-8 sm:py-12">
            
            {/* Intro Text */}
            <div className="text-center">
              <h1 className="text-yellow-400 text-5xl font-bold mb-4 tracking-widest">
                欢迎来到时光故事
              </h1>
              <p className="text-2xl sm:text-[27px] text-gray-200 mb-6 tracking-wider">
                从这里开启你奇妙而经典的时光之旅
              </p>
              <div className="flex flex-row items-center justify-center space-x-4">
                <Link 
                  href="/login" 
                  className="px-8 py-3 border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black font-bold text-[24px] rounded-sm transition-all transform hover:scale-95 shadow-lg"
                >
                  进入游戏
                </Link>
              </div>
            </div>

          </div>

          {/* Bottom Row: Latest News */}
          <div className="w-full mt-4 mb-4">
            <div className="w-full py-6 text-left">
              <h2 className="text-3xl font-bold text-white mb-6 inline-block border-l-4 border-yellow-400 pl-4">
                新闻与动态
              </h2>
              
              {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="border border-white/10 rounded-md overflow-hidden h-full flex flex-col animate-pulse bg-[#202022]">
                        <div className="h-48 w-full bg-white/5"></div>
                        <div className="p-4 flex-grow flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="h-4 bg-white/10 rounded w-3/4"></div>
                            <div className="h-3 bg-white/10 rounded w-full"></div>
                            <div className="h-3 bg-white/10 rounded w-2/3"></div>
                          </div>
                          <div className="mt-4 flex items-center">
                             <div className="w-3 h-3 bg-white/10 rounded mr-2"></div>
                             <div className="h-3 bg-white/10 rounded w-1/3"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {displayNews.map((item) => (
                      <Link key={item.id} href={`/news/${item.id}`} className="group block h-full">
                        <div className="border border-white/10 rounded-md overflow-hidden h-full hover:border-yellow-400/50 transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.8)] hover:shadow-[0_0_25px_rgba(250,204,21,0.4)] flex flex-col text-left">
                          <div className="relative h-48 w-full overflow-hidden">
                            <Image 
                              src={item.image} 
                              alt={item.title} 
                              width={400} 
                              height={250} 
                              className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                          <div className="p-4 flex-grow flex flex-col justify-between bg-[#202022]">
                            <div>
                              <h3 className="text-sm font-bold text-gray-100 group-hover:text-yellow-400 transition-colors mb-2 line-clamp-2">
                                {item.title}
                              </h3>
                              <p className="text-xs text-gray-400 line-clamp-2">
                                {item.excerpt}
                              </p>
                            </div>
                            <div className="mt-4 flex items-center text-xs text-gray-500">
                               <Calendar className="w-3 h-3 mr-2" />
                               <span>{item.date}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-b border-white/10"></div>

      {/* Epic Journey Section */}
      <section className="relative w-full py-20 bg-[#111] overflow-hidden">
        <div className="absolute inset-0 z-0">
            <Image 
                src="/demo-assets/home/bg.webp" 
                alt="Epic Journey Background" 
                fill
                className="object-cover object-top opacity-70"
            />
             <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-[#1a1a1a]"></div>
             <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] via-transparent to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="hidden lg:block"></div>
                <div className="space-y-6 text-left">
                    <h2 className="text-yellow-400 text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                        开启您的史诗旅程
                    </h2>
                    <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-2xl">
                        与无数情怀玩家一同体验新奇而又熟悉的世界。立即创建账号，踏上传奇冒险。
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Link 
                            href="/register" 
                            className="inline-flex items-center justify-center px-8 py-3 text-base font-bold text-black bg-yellow-400 hover:bg-yellow-300 rounded-sm transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                            立即加入
                        </Link>
                        <Link 
                            href="/about" 
                            className="inline-flex items-center justify-center px-8 py-3 text-base font-bold text-white border-2 border-yellow-400 hover:bg-yellow-400 hover:text-black rounded-sm transition-all duration-300"
                        >
                            了解更多
                        </Link>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-b border-white/10"></div>

      {/* Server Features Section */}
      <section className="relative w-full py-20 bg-[#1a1a1a]">
        <div className="absolute inset-0 z-0">
             <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50" style={{ backgroundImage: "url('/demo-assets/home/bg.avif')" }}></div>
             <div className="absolute inset-0 bg-[#1a1a1a]/80"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-yellow-400 text-4xl sm:text-4xl lg:text-4xl font-bold mb-4">
                    服务器特色
                </h2>
                <p className="text-lg sm:text-xl mb-6 text-gray-300 max-w-3xl mx-auto">
                    探索我们的时光故事服务器，享受独特的游戏机制变化为你带来的终极体验。
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { 
                        id: 1, 
                        title: "踏上史诗冒险", 
                        desc: "探索旨在挑战并奖励您技巧的自定义地下城和团队副本。",
                        image: "/demo-assets/home/art-illustration-1.webp"
                    },
                    { 
                        id: 2, 
                        title: "边玩边学", 
                        desc: "通过我们深入的教程和指南掌握新技能和能力。",
                        image: "/demo-assets/home/art-illustration-2.webp"
                    },
                    { 
                        id: 3, 
                        title: "世界主城 PvP", 
                        desc: "体验注重团队合作和策略的世界主城战略 PvP。",
                        image: "/demo-assets/home/art-illustration-3.webp"
                    },
                    { 
                        id: 4, 
                        title: "为了部落", 
                        desc: "享受注重部落对战的平衡 PvP 体验。",
                        image: "/demo-assets/home/art-illustration-4.webp"
                    },
                    { 
                        id: 5, 
                        title: "为了联盟", 
                        desc: "享受注重联盟对战的平衡 PvP 体验。",
                        image: "/demo-assets/home/art-illustration-5.webp"
                    },
                    { 
                        id: 6, 
                        title: "公会系统", 
                        desc: "加入或创建公会，享受增强功能、共享资源和专属公会内容。",
                        image: "/demo-assets/home/6.avif"
                    },
                    { 
                        id: 7, 
                        title: "游戏体验优化", 
                        desc: "享受更快的升级速度、更好的掉落率和便捷功能带来的改进游戏体验。",
                        image: "/demo-assets/home/7.jpg"
                    },
                    { 
                        id: 8, 
                        title: "社区支持", 
                        desc: "从我们活跃的社区和专注的员工团队获得帮助，享受最佳游戏体验。",
                        image: "/demo-assets/home/8.webp"
                    }
                ].map((feature) => (
                    <div key={feature.id} className="bg-[#272727]/80 border border-white/10 rounded-md overflow-hidden backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300 hover:border-white/20 group">
                        <div className="relative w-full h-48 overflow-hidden rounded-t-md">
                            <Image 
                                src={feature.image}
                                alt={feature.title}
                                fill
                                className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        </div>
                        <div className="p-4">
                            <h3 className="text-white font-semibold text-lg leading-tight mb-2 group-hover:text-yellow-400 transition-colors duration-300">
                                {feature.title}
                            </h3>
                            <p className="text-gray-300 text-sm leading-relaxed">
                                {feature.desc}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-b border-white/10"></div>

      {/* How To Get Started Section */}
      <section className="relative w-full py-20 bg-[#1a1a1a] overflow-hidden">
        <div className="absolute inset-0 z-0">
             <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50" style={{ backgroundImage: "url('/demo-assets/home/bg1.avif')" }}></div>
             <div className="absolute inset-0 bg-[#1a1a1a]/80"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-yellow-400 text-4xl sm:text-4xl lg:text-4xl font-bold mb-4">
                    如何开始
                </h2>
                <p className="text-lg sm:text-xl mb-6 text-gray-300 max-w-3xl mx-auto uppercase">
                    跟随这些简单步骤加入我们的时光故事服务器，开始您的史诗冒险
                </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
                <div className="space-y-6">
                    {/* Step 1 */}
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-yellow-400 text-black rounded-full flex items-center justify-center font-bold text-sm">1</div>
                        <div className="flex-1">
                            <h4 className="text-lg font-semibold text-white mb-2">注册账号</h4>
                            <p className="text-gray-300 leading-relaxed">
                                首先，请在我们的网站上注册一个账号。此账号也将成为你在时光故事游戏服务器的账号。
                                <br />
                                <span className="text-yellow-400 font-medium">请务必使用有效的电子邮箱地址来注册账号，无效的邮箱将危害您的账号安全</span>
                            </p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-yellow-400 text-black rounded-full flex items-center justify-center font-bold text-sm">2</div>
                        <div className="flex-1">
                            <h4 className="text-lg font-semibold text-white mb-2">下载时光故事启动器</h4>
                            <p className="text-gray-300 leading-relaxed">
                                我们将通过时光故事启动器管理、下载更新和进入游戏
                            </p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-yellow-400 text-black rounded-full flex items-center justify-center font-bold text-sm">3</div>
                        <div className="flex-1">
                            <h4 className="text-lg font-semibold text-white mb-2">安装与配置</h4>
                            <p className="text-gray-300 leading-relaxed">
                                安装时光故事启动器，运行启动器并按照提示配置或下载/更新游戏
                            </p>
                        </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-yellow-400 text-black rounded-full flex items-center justify-center font-bold text-sm">4</div>
                        <div className="flex-1">
                            <h4 className="text-lg font-semibold text-white mb-2">开始游戏</h4>
                            <p className="text-gray-300 leading-relaxed">
                                通过时光故事启动器启动游戏，并输入您注册的账号和密码开始游戏。
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                    <p className="text-gray-300">
                        如有任何问题，请在我们<Link className="px-1 text-yellow-400 hover:text-yellow-200 font-medium" href="/discord">社区</Link>留言 或访问我们的 <a className="px-1 text-yellow-400 hover:text-yellow-200 font-medium" href="https://kook.vip/PRzXsA" target="_blank">KOOK频道</a> 获取更多信息。
                    </p>
                </div>
            </div>
        </div>
      </section>

    </main>
  );
}
