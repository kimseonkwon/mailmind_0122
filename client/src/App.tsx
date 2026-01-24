import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import Home from "@/pages/home";
import SearchPage from "@/pages/search";
import ImportPage from "@/pages/import";
import ChatPage from "@/pages/chat";
import EmailsPage from "@/pages/emails";
import CalendarPage from "@/pages/calendar";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";
import { Home as HomeIcon, Search, FolderUp, MessageCircle, Mail, Calendar, Settings } from "lucide-react";

function Navigation() {
  const [location] = useLocation();
  
  const navItems = [
    { href: "/", icon: HomeIcon, label: "홈", testId: "nav-home" },
    { href: "/search", icon: Search, label: "검색", testId: "nav-search" },
    { href: "/emails", icon: Mail, label: "이메일", testId: "nav-emails" },
    { href: "/chat", icon: MessageCircle, label: "채팅", testId: "nav-chat" },
    { href: "/calendar", icon: Calendar, label: "일정", testId: "nav-calendar" },
    { href: "/import", icon: FolderUp, label: "가져오기", testId: "nav-import" },
    { href: "/settings", icon: Settings, label: "설정", testId: "nav-settings" },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 md:relative md:border-t-0 md:border-r md:h-screen md:w-20">
      <div className="flex md:flex-col items-center justify-around md:justify-start md:pt-6 gap-1 p-2 md:gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <Button 
                variant={isActive ? "default" : "ghost"} 
                size="icon"
                className={`h-12 w-12 md:h-14 md:w-14 relative group transition-all duration-200 ${
                  isActive ? 'shadow-lg' : 'hover:scale-105'
                }`}
                data-testid={item.testId}
              >
                <Icon className="h-5 w-5" />
                <span className="absolute left-full ml-3 px-2 py-1 bg-foreground text-background text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block pointer-events-none">
                  {item.label}
                </span>
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/search" component={SearchPage} />
      <Route path="/import" component={ImportPage} />
      <Route path="/chat" component={ChatPage} />
      <Route path="/emails" component={EmailsPage} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex flex-col-reverse md:flex-row">
          <Navigation />
          <main className="flex-1 pb-16 md:pb-0">
            <Router />
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
