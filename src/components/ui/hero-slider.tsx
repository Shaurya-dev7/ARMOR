'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Globe, Satellite, Telescope, Activity, ShieldCheck, MapPin } from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    title: "PLANETARY DEFENSE",
    subtitle: "A global initiative to detect, track, and mitigate hazardous near-Earth objects.",
    tag: "EARTH VIEW",
    cta: "MISSION CONTROL",
    href: "/dashboard",
    // Unsplash: Earth from Space
    bgImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop", 
    icon: Globe
  },
  {
    id: 2,
    title: "ORBITAL GUARD",
    subtitle: "Advanced satellite network monitoring 34,000+ objects with sub-second latency.",
    tag: "SATELLITE ARRAY",
    cta: "VIEW ASSETS",
    href: "/satellites",
    // Unsplash: Satellite/ISS
    bgImage: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=2072&auto=format&fit=crop",
    icon: Satellite
  },
  {
    id: 3,
    title: "DEEP SPACE MONITOR",
    subtitle: "Looking beyond the horizon. Identifying threats before they become dangers.",
    tag: "NEBULA SECTOR 7",
    cta: "ANALYSIS",
    href: "/asteroids",
    // Unsplash: Nebula
    bgImage: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2022&auto=format&fit=crop",
    icon: Telescope
  },
  {
    id: 4,
    title: "ASTEROID TRACKING",
    subtitle: "Real-time trajectory prediction for all known Near-Earth Objects.",
    tag: "THREAT LEVEL: LOW",
    cta: "RISK MAP",
    href: "/risk",
    // Unsplash: Asteroid/Moon surface
    bgImage: "https://images.unsplash.com/photo-1614726365723-49cfa968e860?q=80&w=2069&auto=format&fit=crop",
    icon: Activity
  },
  {
    id: 5,
    title: "GLOBAL SECURITY",
    subtitle: "Coordinating international response protocols for planetary safety.",
    tag: "COMMAND CENTER",
    cta: "PROTOCOLS",
    href: "/dashboard",
    // Unsplash: Sci-fi interface / Command center vibe
    bgImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop",
    icon: ShieldCheck
  },
  {
    id: 6,
    title: "THE HIGH FRONTIER",
    subtitle: "Securing the future of humanity among the stars.",
    tag: "LUNAR BASE",
    cta: "EXPLORE",
    href: "/about",
    // Unsplash: Moon Surface / Space Base
    bgImage: "https://images.unsplash.com/photo-1541873676-a18131494184?q=80&w=2036&auto=format&fit=crop",
    icon: MapPin
  }
];


export function HeroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
    }, 6000); // 6 seconds per slide
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[currentIndex];

  return (
    <div className="relative h-[600px] w-full overflow-hidden bg-black rounded-[3rem] border border-white/10 shadow-2xl group">
      
      {/* Background Layer */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {/* Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000"
            style={{ backgroundImage: `url(${slide.bgImage})` }}
          />

          {/* Noise Overlay for texture */}
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
          
          {/* Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-primary/5" />
        </motion.div>
      </AnimatePresence>


      {/* Content Container */}
      <div className="relative z-10 h-full flex flex-col items-center justify-end pb-20 px-6 text-center">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col items-center max-w-4xl mx-auto"
          >
            {/* Pill Tag */}
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-md shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              <slide.icon className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-primary-foreground font-bold">
                {slide.tag}
              </span>
            </div>

            {/* Main Title */}
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-4 leading-[0.9] drop-shadow-2xl">
              {slide.title}
            </h1>

            {/* Subtitle */}
            <p className="max-w-xl text-lg text-white/70 font-light leading-relaxed mb-8">
              {slide.subtitle}
            </p>

            {/* CTA Button */}
            <Button asChild size="lg" className="rounded-full px-8 py-6 text-sm font-bold tracking-widest bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:scale-105 shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:shadow-[0_0_30px_rgba(250,204,21,0.6)] transition-all duration-300">
              <Link href={slide.href}>
                {slide.cta} <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </AnimatePresence>

      </div>

      {/* Navigation Dots */}
      <div className="absolute bottom-12 left-0 right-0 z-20 flex justify-center gap-3">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === currentIndex 
                ? 'w-12 bg-secondary shadow-[0_0_10px_rgba(250,204,21,0.5)]' 
                : 'w-2 bg-white/20 hover:bg-white/40'
            }`}
             aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

    </div>
  );
}
