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
              Learn more <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}