
import React from 'react';
import { 
  Layers, 
  Server, 
  Layout, 
  DownloadCloud, 
  Database, 
  Cpu, 
  Palette, 
  GitBranch, 
  ShieldCheck, 
  Zap 
} from 'lucide-react';

const ProjectPlan: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto p-10 pb-32 custom-scrollbar bg-[#161026]/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="border-b border-purple-500/30 pb-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 mb-2 filter drop-shadow-lg">
                时光故事 · 项目规划书
              </h1>
              <p className="text-purple-200/80 text-xl font-light tracking-wide">
                Story of Time Project Specification & Roadmap
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-purple-900/50 border border-purple-500/50 text-amber-400 text-xs font-mono px-3 py-1 rounded-full mb-2">
                当前版本: Alpha 0.5.0
              </span>
              <p className="text-slate-500 text-sm">最后更新: 2024-12-16</p>
            </div>
          </div>
        </div>

        {/* 1. Project Overview */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Zap size={18} className="text-white" />
            </span>
            项目概述
          </h2>
          <div className="bg-[#1e1b2e]/60 border border-[#4c3a6e]/50 rounded-2xl p-6 shadow-xl backdrop-blur-md">
            <p className="text-slate-300 leading-relaxed text-lg mb-4">
              本项目旨在构建一个现代化的、沉浸式的《魔兽世界》3.3.5a 版本专用启动器。
              区别于传统的登录器，我们致力于通过极具视觉冲击力的 UI/UX 设计和高效的资源分发技术，
              为玩家提供从“下载”到“进入艾泽拉斯”的无缝体验。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-[#161026] p-4 rounded-lg border border-white/5">
                <h3 className="text-amber-400 font-bold mb-2">零门槛接入</h3>
                <p className="text-sm text-slate-400">自动定位游戏路径，一键环境配置，无需玩家手动修改 Realmlist。</p>
              </div>
              <div className="bg-[#161026] p-4 rounded-lg border border-white/5">
                <h3 className="text-amber-400 font-bold mb-2">低成本分发</h3>
                <p className="text-sm text-slate-400">采用 P2P + HTTP 混合模式，大幅降低服务器带宽压力。</p>
              </div>
              <div className="bg-[#161026] p-4 rounded-lg border border-white/5">
                <h3 className="text-amber-400 font-bold mb-2">沉浸式社区</h3>
                <p className="text-sm text-slate-400">集成新闻资讯、服务器状态监控与商城入口，增强用户粘性。</p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Visual & UX Design */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg">
              <Palette size={18} className="text-white" />
            </span>
            视觉与交互设计规范
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="bg-[#1e1b2e]/60 border border-[#4c3a6e]/50 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                  <Layout size={20} className="text-rose-400" /> 界面风格：时光魔法
                </h3>
                <ul className="space-y-3 text-slate-300 text-sm">
                  <li className="flex gap-3">
                    <span className="w-3 h-3 rounded-full bg-[#0f0518] border border-white/20 mt-1 shrink-0"></span>
                    <span><strong>主色调:</strong> 深邃虚空紫 (#0f0518) 与 魔法琥珀金 (Amber-400/500)。</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 mt-1 shrink-0"></span>
                    <span><strong>强调色:</strong> 青色 (Cyan) 用于高亮操作与能量流动效果，象征时光流动。</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-3 h-3 rounded-full bg-white/20 mt-1 shrink-0"></span>
                    <span><strong>材质:</strong> 玻璃拟态 (Glassmorphism)，半透明背景与高斯模糊，营造空间感。</span>
                  </li>
                </ul>
             </div>
             <div className="bg-[#1e1b2e]/60 border border-[#4c3a6e]/50 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                  <Cpu size={20} className="text-rose-400" /> 交互动效
                </h3>
                <ul className="space-y-3 text-slate-300 text-sm">
                  <li className="flex gap-3">
                     <div className="mt-1"><Zap size={14} className="text-amber-400" /></div>
                     <span><strong>粒子背景:</strong> HTML5 Canvas 实现的“时间隧道”粒子穿梭效果，随窗口大小自适应。</span>
                  </li>
                  <li className="flex gap-3">
                     <div className="mt-1"><Zap size={14} className="text-amber-400" /></div>
                     <span><strong>无边框窗口:</strong> 模拟原生应用的拖拽区与窗口控制，提供沉浸式全屏体验。</span>
                  </li>
                  <li className="flex gap-3">
                     <div className="mt-1"><Zap size={14} className="text-amber-400" /></div>
                     <span><strong>微交互:</strong> 按钮悬停光效、进度条脉冲动画、卡片上浮效果。</span>
                  </li>
                </ul>
             </div>
          </div>
        </section>

        {/* 3. Technical Architecture */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <Server size={18} className="text-white" />
            </span>
            技术架构与实现
          </h2>
          
          <div className="bg-[#1e1b2e]/60 border border-[#4c3a6e]/50 rounded-2xl overflow-hidden">
             {/* Tech Stack Diagram Representation */}
             <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
                <div className="p-6 text-center group hover:bg-white/5 transition-colors">
                   <div className="inline-block p-3 rounded-full bg-blue-900/30 text-blue-400 mb-3 group-hover:scale-110 transition-transform">
                      <Layout size={32} />
                   </div>
                   <h3 className="text-lg font-bold text-white mb-2">Frontend Presentation</h3>
                   <p className="text-xs font-mono text-slate-400 bg-black/30 py-1 rounded mb-2">React 19 + TypeScript + Tailwind</p>
                   <p className="text-sm text-slate-400">
                      负责所有 UI 渲染、动画、状态管理及用户交互。通过 <code>window.chrome.webview</code> 与宿主通信。
                   </p>
                </div>
                <div className="p-6 text-center group hover:bg-white/5 transition-colors">
                   <div className="inline-block p-3 rounded-full bg-purple-900/30 text-purple-400 mb-3 group-hover:scale-110 transition-transform">
                      <Layers size={32} />
                   </div>
                   <h3 className="text-lg font-bold text-white mb-2">Host Application</h3>
                   <p className="text-xs font-mono text-slate-400 bg-black/30 py-1 rounded mb-2">C# .NET / WebView2 (WinUI 3)</p>
                   <p className="text-sm text-slate-400">
                      提供原生系统能力：文件读写、注册表访问、进程管理、以及 P2P 下载引擎的宿主环境。
                   </p>
                </div>
                <div className="p-6 text-center group hover:bg-white/5 transition-colors">
                   <div className="inline-block p-3 rounded-full bg-amber-900/30 text-amber-400 mb-3 group-hover:scale-110 transition-transform">
                      <Database size={32} />
                   </div>
                   <h3 className="text-lg font-bold text-white mb-2">Backend Services</h3>
                   <p className="text-xs font-mono text-slate-400 bg-black/30 py-1 rounded mb-2">Nginx (Static) + WordPress (API)</p>
                   <p className="text-sm text-slate-400">
                      VPS 托管静态补丁文件 (MPQ) 和 Version Manifest；WordPress 提供账号验证与新闻接口。
                   </p>
                </div>
             </div>
          </div>
        </section>

        {/* 4. Distribution Strategy */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
              <DownloadCloud size={18} className="text-white" />
            </span>
            混合分发策略 (Hybrid Distribution)
          </h2>
          <div className="bg-[#1e1b2e] p-6 rounded-2xl border-l-4 border-amber-500 shadow-lg">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <h3 className="text-amber-300 font-bold text-lg mb-2">Part A: 完整客户端 (15GB+)</h3>
                <div className="flex items-start gap-3 mb-2">
                   <span className="bg-purple-900 text-purple-200 text-xs px-2 py-0.5 rounded border border-purple-700">BitTorrent 协议</span>
                </div>
                <p className="text-slate-400 text-sm mb-4">
                  利用 <code>MonoTorrent</code> 库在客户端内集成下载核心。通过磁力链接分发基础客户端。
                </p>
                <ul className="list-disc list-inside text-slate-500 text-xs space-y-1">
                   <li>优势：带宽成本为 0，下载速度随用户数量增加而提升。</li>
                   <li>实现：官方作为初始种子 (Seed)，玩家下载时自动做种。</li>
                </ul>
              </div>
              <div className="w-[1px] bg-slate-700 hidden md:block"></div>
              <div className="flex-1">
                <h3 className="text-green-300 font-bold text-lg mb-2">Part B: 补丁与热更 (10MB - 500MB)</h3>
                <div className="flex items-start gap-3 mb-2">
                   <span className="bg-green-900 text-green-200 text-xs px-2 py-0.5 rounded border border-green-700">HTTP/HTTPS</span>
                </div>
                <p className="text-slate-400 text-sm mb-4">
                  基于 MD5 校验的文件差异更新。直接从 VPS Nginx 服务器下载 MPQ 补丁文件。
                </p>
                <ul className="list-disc list-inside text-slate-500 text-xs space-y-1">
                   <li>优势：速度稳定，可控性强，适合频繁的小型修改。</li>
                   <li>实现：启动时请求 <code>manifest.json</code> 对比本地文件 Hash。</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Roadmap */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
              <GitBranch size={18} className="text-white" />
            </span>
            开发实施路线图
          </h2>
          
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-600 before:to-transparent">
            
            {/* Phase 1: Completed */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#0f0518] bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)] text-black font-bold z-10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <ShieldCheck size={20} />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#1e1b2e]/80 p-5 rounded-xl border border-green-500/30 shadow-lg backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-green-400">阶段一：原型与UI架构 (已完成)</h3>
                        <span className="text-xs font-mono text-slate-500">v0.1 - v0.5</span>
                    </div>
                    <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                        <li>搭建 React + Vite + Tailwind 项目骨架。</li>
                        <li>完成高保真 UI 设计 (暗黑魔法风格)。</li>
                        <li>实现前端路由、新闻展示、以及模拟下载逻辑。</li>
                        <li>集成 WebView2 通信接口定义。</li>
                    </ul>
                </div>
            </div>

            {/* Phase 2: Current */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#0f0518] bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)] text-black font-bold z-10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <Layers size={20} />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#1e1b2e] p-5 rounded-xl border border-amber-500/50 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 px-2 py-1 bg-amber-500 text-black text-[10px] font-bold">进行中</div>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-amber-400">阶段二：宿主集成与核心功能</h3>
                        <span className="text-xs font-mono text-slate-500">v0.6 - v0.9</span>
                    </div>
                    <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                        <li>构建 C# WPF/WinUI 3 宿主程序。</li>
                        <li>接入 MonoTorrent 库实现真实 P2P 下载。</li>
                        <li>实现文件完整性校验 (MD5 Checksum)。</li>
                        <li>编写自动修改 Realmlist.wtf 的逻辑。</li>
                    </ul>
                </div>
            </div>

            {/* Phase 3: Future */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#0f0518] bg-slate-700 text-slate-400 z-10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <Database size={20} />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#1e1b2e]/40 p-5 rounded-xl border border-slate-700 border-dashed">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-slate-400">阶段三：数据互通与生态</h3>
                        <span className="text-xs font-mono text-slate-600">v1.0 Release</span>
                    </div>
                    <ul className="text-sm text-slate-500 space-y-1 list-disc list-inside">
                        <li>接入 AzerothCore 账号数据库，实现启动器内注册/改密。</li>
                        <li>集成商城 API，展示点数与购买记录。</li>
                        <li>增加插件 (AddOns) 管理器功能。</li>
                    </ul>
                </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
};

export default ProjectPlan;
