'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  LayoutDashboard, 
  Orbit, 
  ShieldAlert, 
  Satellite, 
  Settings, 
  Monitor,
  Moon, 
  Sun,
  X,
  ChevronRight,
  LogOut,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/lib/hooks/useAuth';

const MENU_LINKS = [
  { href: '/', label: 'Home', icon: Home, description: 'Return to mission control' },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Global situation overview' },
  { href: '/asteroids', label: 'Asteroid Catalog', icon: Orbit, description: 'Tracking planetary threats' },
  { href: '/risk', label: 'Risk Intelligence', icon: ShieldAlert, description: 'Strategic impact analysis' },
  { href: '/satellites', label: 'Space Assets', icon: Satellite, description: 'Orbital infrastructure catalog' },
  { href: '/assets', label: 'Asset Monitor', icon: Monitor, description: 'Real-time telemetry & alerts' },
  { href: '/settings', label: 'System Settings', icon: Settings, description: 'Configure interface & alerts' },
];

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HamburgerMenu({ isOpen, onClose }: HamburgerMenuProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Theme logic
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm"
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-[120] h-screen w-full sm:w-[400px] bg-background/95 backdrop-blur-2xl border-l border-white/10 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">System Menu</h2>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
              
              {/* Theme Settings */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      {isDarkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-secondary" />}
                    </div>
                    <div>
                      <div className="text-sm font-bold">Theme Mode</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                        {isDarkMode ? 'Dark Protocol' : 'Solar Protocol'}
                      </div>
                    </div>
                  </div>
                  <Switch checked={isDarkMode} onCheckedChange={toggleTheme} />
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-2">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4 pl-2">Navigation</div>
                {MENU_LINKS.map((link) => {
                  const isActive = pathname === link.href;
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={onClose}
                      className={cn(
                        "group flex items-center gap-4 p-4 rounded-xl transition-all duration-300",
                        isActive 
                          ? "bg-secondary/10 text-secondary border border-secondary/20" 
                          : "text-white/60 hover:bg-white/5 hover:text-white border border-transparent"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg transition-colors",
                        isActive ? "bg-secondary/20 shadow-[0_0_10px_rgba(250,204,21,0.2)]" : "bg-white/5 group-hover:bg-white/10"
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm tracking-wide">{link.label}</div>
                        <div className="text-[10px] text-muted-foreground line-clamp-1">{link.description}</div>
                      </div>
                      <ChevronRight className={cn(
                        "w-4 h-4 transition-transform",
                        isActive ? "rotate-0 opacity-100" : "opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-40"
                      )} />
                    </Link>
                  );
                })}
              </nav>

              {/* User Section (Mobile Specific) */}
              {user && (
                <div className="pt-4 border-t border-white/5 space-y-4">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2 pl-2">Account</div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-black font-bold">
                       {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">{user.email?.split('@')[0]}</div>
                      <div className="text-[10px] text-white/40 font-mono">OPERATOR ID: {user.id.slice(0, 8)}</div>
                    </div>
                    <button 
                      onClick={() => { signOut(); onClose(); }}
                      className="p-2 text-white/40 hover:text-destructive transition-colors"
                      title="Sign Out"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-white/5 text-center">
              <div className="text-[10px] text-white/20 font-mono tracking-widest">
                ARMOR v0.1.0-REFINED
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
