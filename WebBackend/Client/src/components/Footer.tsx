import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-[#0c0c0c] to-[#1a1a1a] border-t border-white/10 relative z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center space-y-6">
          <div className="flex justify-center">
            <Image 
              alt="StoryOfTime Logo" 
              width={32} 
              height={32} 
              className="h-8 w-auto" 
              src="/sot.png" 
            />
          </div>
          <nav className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 md:gap-8">
            <Link href="/terms-of-service" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm font-medium text-center">
              服务条款
            </Link>
            <div className="hidden sm:block relative">
              <div className="w-px h-2.5 bg-[#606060]"></div>
            </div>
            <Link href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm font-medium text-center">
              隐私政策
            </Link>
            <div className="hidden sm:block relative">
              <div className="w-px h-2.5 bg-[#606060]"></div>
            </div>
            <Link href="/cookie-settings" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm font-medium text-center">
              Cookie 设置
            </Link>
            <div className="hidden sm:block relative">
              <div className="w-px h-2.5 bg-[#606060]"></div>
            </div>
            <Link href="/faq" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm font-medium text-center">
              常见问题
            </Link>
            <div className="hidden sm:block relative">
              <div className="w-px h-2.5 bg-[#606060]"></div>
            </div>
            <Link href="/about" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm font-medium text-center">
              关于我们
            </Link>
          </nav>
          <div className="text-white/50 text-xs sm:text-sm text-center px-4">
            版权所有 © 时光故事. 保留所有权利.
          </div>
        </div>
      </div>
    </footer>
  );
}
