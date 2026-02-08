import Link from 'next/link';
import Image from 'next/image';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-3 group ${className}`}>
      <div className="relative flex items-center justify-center w-11 h-11 rounded-[0.9rem] bg-background/50 border border-white/10 group-hover:border-primary/50 transition-all duration-500 shadow-2xl overflow-hidden shadow-primary/5">
        <Image 
          src="/logonew.png" 
          alt="ARMOR Logo" 
          fill
          className="object-cover p-1 group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-black tracking-tighter text-white leading-none group-hover:text-primary transition-colors duration-300">
          ARMOR
        </span>
        <span className="text-[0.65rem] font-bold tracking-[0.3em] text-primary/60 group-hover:text-primary transition-colors duration-500 uppercase">
          Planetary Defense
        </span>
      </div>
    </Link>
  );
}

