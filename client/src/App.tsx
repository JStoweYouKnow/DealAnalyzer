import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Home as HomeIcon, Mail, TrendingUp, Search, BarChart3 } from "lucide-react";
import Home from "@/pages/home";
import Deals from "@/pages/deals";
import Market from "@/pages/market";
import SearchPage from "@/pages/search";
import NotFound from "@/pages/not-found";
import comfortFinderLogo from "@/assets/comfort-finder-logo.png";

function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", icon: HomeIcon, label: "Analyzer", testId: "nav-home" },
    { path: "/deals", icon: Mail, label: "Deals", testId: "nav-deals" },
    { path: "/market", icon: TrendingUp, label: "Market Intelligence", testId: "nav-market" },
    { path: "/search", icon: Search, label: "Advanced Search", testId: "nav-search" },
  ];

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2" data-testid="nav-logo">
            <img src={comfortFinderLogo} alt="Comfort Finder" className="h-8 w-8" />
            <span className="text-xl font-bold">The Comfort Finder</span>
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
                    className="flex items-center space-x-2"
                    data-testid={item.testId}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/deals" component={Deals} />
        <Route path="/market" component={Market} />
        <Route path="/search" component={SearchPage} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
