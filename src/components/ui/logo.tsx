import Link from 'next/link';
import { Radar } from 'lucide-react';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 group ${className}`}>
      <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 group-hover:border-primary/50 transition-colors">
        <Radar className="w-6 h-6 text-primary animate-pulse-slow" />
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold tracking-tight text-foreground leading-none group-hover:text-primary transition-colors">
          COSMIC
        </span>
        <span className="text-xs font-medium tracking-widest text-muted-foreground group-hover:text-primary/80 transition-colors uppercase">
          WATCH
        </span>
      </div>
    </Link>
  );
}
