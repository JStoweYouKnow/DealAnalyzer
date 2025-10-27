import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
// Authentication disabled - ClerkProvider removed
// import { ClerkProvider } from '@clerk/nextjs'
import ConvexClientProvider from '@/components/convex-client-provider'
import { Providers } from "./providers";
import { Navigation } from "./components/navigation";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'The Comfort Finder - Real Estate Analyzer',
  description: 'Advanced real estate deal analysis and property intelligence platform',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ConvexClientProvider>
          <Providers>
            <div className="min-h-screen relative">
              {/* Subtle background pattern */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, rgba(var(--primary), 0.15) 1px, transparent 0)`,
                  backgroundSize: '20px 20px'
                }} />
              </div>
              <Navigation />
              <main className="relative z-10">
                {children}
              </main>
            </div>
          </Providers>
        </ConvexClientProvider>
      </body>
    </html>
  )
}

