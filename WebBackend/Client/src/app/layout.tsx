import type { Metadata } from 'next'
import { Inter, Cinzel } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'
import ClientLayout from '../components/ClientLayout'
import { AuthProvider } from '../context/AuthContext'
import { CartProvider } from '../context/CartContext'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const cinzel = Cinzel({ subsets: ['latin'], variable: '--font-cinzel' })

const fzytk = localFont({
  src: './fonts/FZYTK.ttf',
  variable: '--font-fzytk',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '时光故事 - Story Of Time',
  description: '时光故事 - Story Of Time World of Warcraft Server',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${cinzel.variable} ${fzytk.variable} h-full bg-[#1a1a1a]`}>
      <body className="h-full flex flex-col font-sans text-gray-100 antialiased selection:bg-yellow-500/30">
        <AuthProvider>
          <CartProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}