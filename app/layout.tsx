import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import ConvexClientProvider from '@/components/convex-client-provider'
import { Providers } from "./providers";
import { Navigation } from "./components/navigation";
import { Footer } from "./components/footer";

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
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <ConvexClientProvider>
            <Providers>
              <div className="min-h-screen relative bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
                {/* Layered texture background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {/* Base gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-secondary/8" />

                  {/* Dot pattern texture */}
                  <div
                    className="absolute inset-0 opacity-40"
                    style={{
                      backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary) / 0.15) 1px, transparent 0)`,
                      backgroundSize: '24px 24px',
                    }}
                  />

                  {/* Mesh gradient overlay for depth */}
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: `
                        radial-gradient(at 0% 0%, hsl(var(--primary) / 0.1) 0px, transparent 50%),
                        radial-gradient(at 100% 0%, hsl(var(--secondary) / 0.08) 0px, transparent 50%),
                        radial-gradient(at 100% 100%, hsl(var(--primary) / 0.06) 0px, transparent 50%),
                        radial-gradient(at 0% 100%, hsl(var(--secondary) / 0.08) 0px, transparent 50%)
                      `,
                    }}
                  />

                  {/* Subtle noise texture */}
                  <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                      backgroundSize: '200px 200px',
                    }}
                  />

                  {/* Grid pattern for structure */}
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `
                        linear-gradient(hsl(var(--border) / 0.3) 1px, transparent 1px),
                        linear-gradient(90deg, hsl(var(--border) / 0.3) 1px, transparent 1px)
                      `,
                      backgroundSize: '48px 48px',
                    }}
                  />
                </div>
                
                <Navigation />
                <main className="relative z-10">
                  {children}
                </main>
                <Footer />
              </div>
            </Providers>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}

