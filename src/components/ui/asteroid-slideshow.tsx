'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ArrowRight, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

// Asteroid Data
const ASTEROIDS = [
  {
    id: 'bennu',
    name: '101955 Bennu',
    image: '/asteroids/bennu.jpg', // Placeholder, needs generation
    type: 'B-type Carbonaceous',
    diameter: '490 m',
    impact_prob: '1 in 2,700',
    status: 'Sample Returned',
    statusColor: 'text-green-400',
    riskLevel: 'MODERATE',
    riskColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  },
  {
    id: 'apophis',
    name: '99942 Apophis',
    image: '/asteroids/apophis.jpg', // Placeholder
    type: 'S-type Silicate',
    diameter: '370 m',
    impact_prob: 'Risk Ruled Out (2068)',
    status: 'Flyby 2029',
    statusColor: 'text-cyan-400',
    riskLevel: 'WATCH',
    riskColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
  },
  {
    id: 'didymos',
    name: '65803 Didymos',
    image: '/asteroids/didymos.jpg', // Placeholder
    type: 'Binary System',
    diameter: '780 m',
    impact_prob: '0%',
    status: 'DART Impact Confirmed',
    statusColor: 'text-purple-400',
    riskLevel: 'SAFE',
    riskColor: 'bg-green-500/20 text-green-400 border-green-500/30'
  },
  {
    id: 'psyche',
    name: '16 Psyche',
    image: '/asteroids/psyche.jpg', // Placeholder
    type: 'M-type Metallic',
    diameter: '226 km',
    impact_prob: '0%',
    status: 'Orbiter En Route',
    statusColor: 'text-orange-400',
    riskLevel: 'RESOURCE',
    riskColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  },
  {
    id: 'ryugu',
    name: '162173 Ryugu',
    image: '/asteroids/ryugu.jpg', // Placeholder
    type: 'C-type',
    diameter: '900 m',
    impact_prob: '0%',
    status: 'Sample Analysis',
    statusColor: 'text-blue-400',
    riskLevel: 'SAFE',
    riskColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  }
];

export function AsteroidSlideshow() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollAmount = 0;
    const speed = 1; // Pixels per frame

    const step = () => {
      if (!isPaused && scrollContainer) {
        scrollAmount += speed;
        // Reset scroll when it reaches the halfway point (since we duplicate content)
        if (scrollAmount >= scrollContainer.scrollWidth / 2) {
          scrollAmount = 0;
        }
        scrollContainer.scrollLeft = scrollAmount;
      }
      requestAnimationFrame(step);
    };

    const animation = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animation);
  }, [isPaused]);

  return (
    <div className="w-full relative overflow-hidden py-10 group">
      
      {/* Label */}
      <div className="absolute top-0 left-6 z-20 flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
        <Info className="w-3 h-3 text-primary" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-primary/80">Priority Targets</span>
      </div>

      {/* Gradient Masks */}
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#020205] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#020205] to-transparent z-10 pointer-events-none" />

      {/* Auto-scrolling-container */}
      <div 
        ref={scrollRef}
        className="flex gap-6 overflow-hidden select-none"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Double the list for infinite scroll illusion */}
        {[...ASTEROIDS, ...ASTEROIDS].map((asteroid, index) => (
          <div 
            key={`${asteroid.id}-${index}`}
            className="flex-shrink-0 w-[300px] h-[360px] glass-card relative overflow-hidden group/card cursor-pointer hover:border-primary/50 transition-colors"
          >
            {/* Image Background */}
            <div className="absolute inset-0 bg-black/50 z-0">
               {/* Fallback pattern if image missing */}
               <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-700 via-gray-900 to-black opacity-50" />
            </div>
            
            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-end p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
              
              {/* Risk Badge */}
              <div className={cn("absolute top-4 right-4 px-2 py-1 rounded text-[10px] font-bold tracking-widest border", asteroid.riskColor)}>
                {asteroid.riskLevel}
              </div>

              <h3 className="text-2xl font-black text-white mb-1 uppercase tracking-tighter">{asteroid.name}</h3>
              <p className="text-white/60 text-xs font-mono mb-4">{asteroid.type}</p>
              
              <div className="space-y-2 border-t border-white/10 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Diameter</span>
                  <span className="text-white font-mono">{asteroid.diameter}</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-white/40">Status</span>
                   <span className={cn("font-bold", asteroid.statusColor)}>{asteroid.status}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 flex justify-between items-center opacity-0 group-hover/card:opacity-100 transition-opacity transform translate-y-2 group-hover/card:translate-y-0 duration-300">
                <span className="text-[10px] text-primary uppercase tracking-widest font-bold">View Data</span>
                <ArrowRight className="w-4 h-4 text-primary" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
