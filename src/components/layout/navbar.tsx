'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Menu, 
  X, 
  LogOut, 
  Loader2, 
  Home, 
  LayoutDashboard, 
  Orbit, 
  ShieldAlert, 
  Satellite
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { HamburgerMenu } from '@/components/ui/hamburger-menu';

const NAV_LINKS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/asteroids', label: 'Asteroids', icon: Orbit },
  { href: '/risk', label: 'Risk Intelligence', icon: ShieldAlert },
  { href: '/satellites', label: 'Space Assets', icon: Satellite },
];

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] transition-all duration-500",
        scrolled || isMobileMenuOpen 
          ? "bg-black/40 backdrop-blur-2xl border-b border-white/10 h-16 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]" 
          : "bg-transparent border-transparent h-24"
      )}
    >
      {/* Glass Inner Glow */}
      {(scrolled || isMobileMenuOpen) && (
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent shadow-[0_1px_10px_rgba(255,255,255,0.1)]" />
      )}
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-full flex items-center justify-between relative">
        {/* Left: Logo */}
        <div className="flex items-center gap-4 relative z-50">
          <Logo />
        </div>


        {/* Center: Navigation (Pill Style) */}
        <nav className="hidden md:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-300",
                  isActive 
                    ? "bg-secondary/10 text-secondary border border-secondary/20 shadow-[0_0_15px_rgba(250,204,21,0.1)]" 
                    : "text-white/50 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-secondary" : "text-current")} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: User Profile & Actions */}
        <div className="flex items-center gap-4 relative z-50">
          
          {loading ? (
             <Loader2 className="w-5 h-5 animate-spin text-primary" />
          ) : user ? (
            <>
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="text-white/50 hover:text-white rounded-full">
                <div className="relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-destructive rounded-full border-2 border-black" />
                </div>
              </Button>

              {/* Divider */}
              <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

              {/* User Profile Pill */}
              <div className="hidden md:flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                 <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-black font-bold">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                 </div>
                 <div className="flex flex-col">
                    <span className="text-xs font-bold text-white leading-none mb-0.5">{user.email?.split('@')[0]}</span>
                    <span className="text-[10px] text-white/40 font-mono leading-none">OPERATOR</span>
                 </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="hidden md:block text-xs font-bold tracking-widest uppercase text-white/50 hover:text-white transition-colors px-4">
                Log In
              </Link>
              <Button asChild className="rounded-full bg-secondary text-black font-bold text-xs tracking-widest px-6 hover:scale-105 transition-transform shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}

          {/* Hamburger Menu Toggle */}
          <div className="ml-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "text-white hover:bg-white/10 rounded-full transition-all duration-300",
                isMobileMenuOpen ? "bg-white/10" : "bg-transparent"
              )}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isMobileMenuOpen ? 'close' : 'menu'}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </motion.div>
              </AnimatePresence>
            </Button>
          </div>
        </div>

      </div>

      <HamburgerMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
    </header>
  );
}
