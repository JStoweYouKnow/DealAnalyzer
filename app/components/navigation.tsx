"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home as HomeIcon, Mail, TrendingUp, Search } from "lucide-react";
import Image from "next/image";
import comfortFinderLogo from "@/assets/comfort-finder-logo.png";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

const navItems = [
  { path: "/", icon: HomeIcon, label: "Analyzer", testId: "nav-home" },
  { path: "/deals", icon: Mail, label: "Deals", testId: "nav-deals" },
  { path: "/market", icon: TrendingUp, label: "Market Intelligence", testId: "nav-market" },
  { path: "/search", icon: Search, label: "Advanced Search", testId: "nav-search" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-white/70 backdrop-blur-lg shadow-lg shadow-black/5 supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="group flex items-center space-x-3 transition-all duration-300 hover:scale-105" data-testid="nav-logo">
            <div className="relative">
              <Image src={comfortFinderLogo} alt="Comfort Finder" width={36} height={36} className="transition-transform duration-300 group-hover:rotate-6" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                The Comfort Finder
              </span>
              <span className="text-xs text-muted-foreground font-medium tracking-wider">
                REAL ESTATE ANALYZER
              </span>
            </div>
          </Link>
          
          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={`
                      group relative flex items-center space-x-2 px-4 py-2 
                      transition-all duration-300 hover:scale-105
                      ${isActive 
                        ? 'bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/25' 
                        : 'hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10'
                      }
                    `}
                    data-testid={item.testId}
                  >
                    <Icon className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${
                      isActive ? 'text-primary-foreground' : ''
                    }`} />
                    <span className={`font-medium ${isActive ? 'text-primary-foreground' : ''}`}>
                      {item.label}
                    </span>
                    {isActive && (
                      <div className="absolute inset-x-0 -bottom-px h-0.5 bg-gradient-to-r from-secondary to-accent rounded-full" />
                    )}
                  </Button>
                </Link>
              );
            })}
            
            {/* Authentication */}
            <div className="ml-4 flex items-center space-x-2">
              <SignedOut>
                <SignInButton>
                  <Button variant="outline" size="sm" className="font-medium">
                    Sign In
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8"
                    }
                  }}
                />
              </SignedIn>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

