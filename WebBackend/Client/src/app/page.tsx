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
              <h1 className="text-yellow-400 text-5xl font-bold font-sans mb-4 tracking-widest">
                欢迎来到时光故事
              </h1>
              <p className="text-2xl sm:text-[27px] text-gray-200 mb-6 font-sans tracking-wider">
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
              <h2 className="text-3xl font-sans font-bold text-white mb-6 inline-block border-l-4 border-yellow-400 pl-4">
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
                    <h2 className="text-yellow-400 text-3xl sm:text-4xl lg:text-5xl font-bold font-serif leading-tight">
                        BEGIN YOUR EPIC JOURNEY
                    </h2>
                    <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-2xl">
                        Join thousands of players in the ultimate World of Warcraft experience. 
                        Create your account today and embark on legendary adventures.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Link 
                            href="/register" 
                            className="inline-flex items-center justify-center px-8 py-3 text-base font-bold text-black bg-yellow-400 hover:bg-yellow-300 rounded-sm transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                            Join Now
                        </Link>
                        <Link 
                            href="/about" 
                            className="inline-flex items-center justify-center px-8 py-3 text-base font-bold text-white border-2 border-yellow-400 hover:bg-yellow-400 hover:text-black rounded-sm transition-all duration-300"
                        >
                            Learn More
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
                <h2 className="text-yellow-400 text-4xl sm:text-4xl lg:text-4xl font-bold font-serif mb-4">
                    SERVER FEATURES
                </h2>
                <p className="text-lg sm:text-xl font-serif mb-6 text-gray-300 max-w-3xl mx-auto">
                    Discover the unique features that make our World of Warcraft server the ultimate gaming experience
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { 
                        id: 1, 
                        title: "Embark on Epic Adventures", 
                        desc: "Explore custom dungeons and raids designed to challenge and reward your skills.",
                        image: "/demo-assets/home/art-illustration-1.webp"
                    },
                    { 
                        id: 2, 
                        title: "Learn as you Play", 
                        desc: "Master new skills and abilities through our in-depth tutorials and guides.",
                        image: "/demo-assets/home/art-illustration-2.webp"
                    },
                    { 
                        id: 3, 
                        title: "World City PvP", 
                        desc: "Experience strategic PvP in our world cities with a focus on teamwork and strategy.",
                        image: "/demo-assets/home/art-illustration-3.webp"
                    },
                    { 
                        id: 4, 
                        title: "For Horde Players", 
                        desc: "Enjoy a balanced PvP experience with a focus on Horde vs Horde combat.",
                        image: "/demo-assets/home/art-illustration-4.webp"
                    },
                    { 
                        id: 5, 
                        title: "For Alliance Players", 
                        desc: "Enjoy a balanced PvP experience with a focus on Alliance vs Alliance combat.",
                        image: "/demo-assets/home/art-illustration-5.webp"
                    },
                    { 
                        id: 6, 
                        title: "Guild System", 
                        desc: "Join or create guilds with enhanced features, shared resources, and exclusive guild content.",
                        image: "/demo-assets/home/6.avif"
                    },
                    { 
                        id: 7, 
                        title: "Quality of Life", 
                        desc: "Enjoy improved gameplay with faster leveling, better loot rates, and convenient features.",
                        image: "/demo-assets/home/7.jpg"
                    },
                    { 
                        id: 8, 
                        title: "Community Support", 
                        desc: "Get help from our active community and dedicated staff team for the best gaming experience.",
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
                <h2 className="text-yellow-400 text-4xl sm:text-4xl lg:text-4xl font-bold font-serif mb-4">
                    HOW TO GET STARTED
                </h2>
                <p className="text-lg sm:text-xl font-serif mb-6 text-gray-300 max-w-3xl mx-auto uppercase">
                    Follow these simple steps to join our World of Warcraft server and begin your epic adventure
                </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
                <div className="space-y-6">
                    {/* Step 1 */}
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-yellow-400 text-black rounded-full flex items-center justify-center font-bold text-sm">1</div>
                        <div className="flex-1">
                            <h4 className="text-lg font-semibold text-white mb-2">Register an Account</h4>
                            <p className="text-gray-300 leading-relaxed">
                                To begin, please register an account on our website. Once registered, navigate to the dashboard to create your preferred in-game account and password for login. Users may create a limited number of in-game accounts linked to their website account, subject to specified restrictions.
                                <br />
                                <span className="text-yellow-400 font-medium">Kindly ensure to activate your website account by verifying it through the confirmation email sent to your registered email address.</span>
                            </p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-yellow-400 text-black rounded-full flex items-center justify-center font-bold text-sm">2</div>
                        <div className="flex-1">
                            <h4 className="text-lg font-semibold text-white mb-2">Download World of Warcraft 3.3.5a</h4>
                            <p className="text-gray-300 leading-relaxed">
                                To access the game, it is necessary to have the World of Warcraft client version 3.3.5a installed.
                            </p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-yellow-400 text-black rounded-full flex items-center justify-center font-bold text-sm">3</div>
                        <div className="flex-1">
                            <h4 className="text-lg font-semibold text-white mb-2">Configure Realmlist</h4>
                            <p className="text-gray-300 leading-relaxed">
                                Set realmlist to <code className="bg-black/50 px-2 py-1 rounded text-yellow-400 font-mono">logon.myserver.com</code> in <code className="bg-black/50 px-2 py-1 rounded text-yellow-400 font-mono">WTF/Config.wtf</code>
                            </p>
                        </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-yellow-400 text-black rounded-full flex items-center justify-center font-bold text-sm">4</div>
                        <div className="flex-1">
                            <h4 className="text-lg font-semibold text-white mb-2">Start Playing</h4>
                            <p className="text-gray-300 leading-relaxed">
                                Start the game by Wow.exe and enter your game account credentials created in the dashboard.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                    <p className="text-gray-300">
                        Have any questions, contact us at <a className="px-1 text-yellow-400 hover:text-yellow-200 font-medium" href="mailto:support@nextvision.cms">support@nextvision.cms</a> or navigate to the <a className="px-1 text-yellow-400 hover:text-yellow-200 font-medium" href="/faq">FAQ</a> for more information.
                    </p>
                </div>
            </div>
        </div>
      </section>

    </main>
  );
}
