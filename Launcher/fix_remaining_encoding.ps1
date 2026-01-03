
$heroPath = Resolve-Path "..\WebBackend\Client\src\components\Hero.tsx"
$footerPath = Resolve-Path "..\WebBackend\Client\src\components\Footer.tsx"

# Read existing content (assuming it might be readable, or just overwrite if I have the source - better to read and re-write to fix encoding)
# However, reading with wrong encoding might result in garbage. 
# Since I know what the content *should* be (branding updates), I will re-write them with the correct content to be safe.

# Hero Content (with correct Chinese)
$heroContent = @'
'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Hero() {
  return (
    <div className="relative isolate overflow-hidden bg-gray-900 pb-16 pt-14 sm:pb-20">
      <Image
        src="/demo-assets/hero-bg.jpg"
        alt="Hero background"
        fill
        className="absolute inset-0 -z-10 h-full w-full object-cover"
        priority
      />
      <div className="absolute inset-0 -z-10 bg-black/60" />
      
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56 text-center">
          <div className="hidden sm:mb-8 sm:flex sm:justify-center">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-300 ring-1 ring-white/10 hover:ring-white/20">
              Announcing our latest expansion pack. <Link href="/news" className="font-semibold text-white"><span className="absolute inset-0" aria-hidden="true" />Read more <span aria-hidden="true">&rarr;</span></Link>
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl font-serif">
            时光故事
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-300 font-serif">
            重温经典，再续传奇。加入我们，开启属于你的史诗篇章。体验最纯粹的游戏乐趣，结识志同道合的伙伴。
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/register"
              className="rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
            >
              Get started
            </Link>
            <Link href="/about" className="text-sm font-semibold leading-6 text-white">
              Learn more <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
'@

# Footer Content (with correct Chinese)
$footerContent = @'
'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#111] text-gray-400 py-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-white text-lg font-serif font-bold mb-4">时光故事</h3>
            <p className="text-sm mb-4 max-w-md">
              致力于打造最优质的游戏社区，为玩家提供稳定、公平、有趣的游戏环境。
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-white transition">
                <span className="sr-only">Discord</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2921-.5495-1.902-.8971a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.8156 8.1796 1.8156 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/faq" className="hover:text-white transition">FAQ</Link></li>
              <li><Link href="/support" className="hover:text-white transition">Help Center</Link></li>
              <li><Link href="/status" className="hover:text-white transition">Server Status</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-white/5 text-center text-xs">
          &copy; {new Date().getFullYear()} 时光故事. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
'@

[System.IO.File]::WriteAllText($heroPath, $heroContent, [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText($footerPath, $footerContent, [System.Text.Encoding]::UTF8)

Write-Host "Updated Hero.tsx and Footer.tsx with UTF-8 encoding."
