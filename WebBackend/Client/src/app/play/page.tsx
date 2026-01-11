'use client';

import { CirclePlay, Rocket } from 'lucide-react';
import Link from 'next/link';

export default function PlayPage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a]" style={{
        backgroundImage: 'url("/demo-assets/home/general-page-bg.avif")',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat'
    }}>
      <div className="min-h-screen pt-24 pb-12">
        <div className="mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: '1220px' }}>
          
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight flex items-center justify-center gap-3">
              <CirclePlay className="h-10 w-10 text-yellow-500" />
              <span>如何开始</span>
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto text-lg uppercase">
              跟随这些简单步骤加入我们的时光故事服务器，开始您的史诗冒险
            </p>
          </div>

          <div className="bg-[#272727]/80 backdrop-blur-sm p-8 rounded-sm border border-white/10 min-h-[880px]">
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

        </div>
      </div>
    </div>
  );
}
