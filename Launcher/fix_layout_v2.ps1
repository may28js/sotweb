
$ErrorActionPreference = "Stop"

# \u65f6\u5149\u6545\u4e8b = 时光故事
$chineseTitle = [System.Text.RegularExpressions.Regex]::Unescape("\u65f6\u5149\u6545\u4e8b")

$content = @"
import type { Metadata } from 'next'
import { Inter, Cinzel } from 'next/font/google'
import './globals.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { AuthProvider } from '../context/AuthContext'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const cinzel = Cinzel({ subsets: ['latin'], variable: '--font-cinzel' })

export const metadata: Metadata = {
  title: '${chineseTitle} - World of Warcraft',
  description: '${chineseTitle} - Story of Time World of Warcraft Server',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`h-full bg-[#1a1a1a] ${inter.variable} ${cinzel.variable}`}>
      <body className="h-full flex flex-col font-sans text-gray-100 antialiased selection:bg-yellow-500/30">
        <AuthProvider>
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
"@

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$targetPath = Join-Path $scriptDir "..\WebBackend\Client\src\app\layout.tsx"
$targetPath = [System.IO.Path]::GetFullPath($targetPath)

Write-Host "Writing to $targetPath"
[System.IO.File]::WriteAllText($targetPath, $content, [System.Text.Encoding]::UTF8)
Write-Host "Done."
