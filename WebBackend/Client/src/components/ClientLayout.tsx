'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <>
      {!isAdmin && <Navbar />}
      <main className={`flex-grow ${isAdmin ? 'h-screen overflow-hidden flex' : ''}`}>
        {children}
      </main>
      {!isAdmin && <Footer />}
    </>
  );
}
