import { Switch, Route, Link, useLocation } from "wouter";
import { memo } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Home as HomeIcon, Mail, TrendingUp, Search } from "lucide-react";
import Home from "@/pages/home";
import Deals from "@/pages/deals";
import Market from "@/pages/market";
import SearchPage from "@/pages/search";
import NotFound from "@/pages/not-found";
import comfortFinderLogo from "@/assets/comfort-finder-logo.png";

// Navigation items constant moved outside component to prevent recreating on every render
const navItems = [
  { path: "/", icon: HomeIcon, label: "Analyzer", testId: "nav-home" },
  { path: "/deals", icon: Mail, label: "Deals", testId: "nav-deals" },
  { path: "/market", icon: TrendingUp, label: "Market Intelligence", testId: "nav-market" },
  { path: "/search", icon: Search, label: "Advanced Search", testId: "nav-search" },
];

const Navigation = memo(() => {
  const [location] = useLocation();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-white/70 backdrop-blur-lg shadow-lg shadow-black/5 supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="group flex items-center space-x-3 transition-all duration-300 hover:scale-105" data-testid="nav-logo">
            <div className="relative">
              <img src={comfortFinderLogo} alt="Comfort Finder" className="h-9 w-9 transition-transform duration-300 group-hover:rotate-6" />
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
              const isActive = location === item.path;
              
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
          </div>
        </div>
      </div>
    </nav>
  );
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
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
              <Switch>
              <Route path="/" component={Home} />
              <Route path="/deals" component={Deals} />
              <Route path="/market" component={Market} />
              <Route path="/search" component={SearchPage} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
