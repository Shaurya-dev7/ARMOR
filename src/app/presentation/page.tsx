'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import the 3D Slideshow to avoid SSR issues with Canvas
const CinematicSlideshow = dynamic(
  () => import('@/components/cinematic/CinematicSlideshow'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-screen items-center justify-center bg-[#020205] text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
          <p className="text-xs font-mono tracking-[0.3em] text-cyan-500/50 uppercase">Initializing Simulation</p>
        </div>
      </div>
    )
  }
);

export default function PresentationPage() {
  return (
    <main className="w-screen h-screen overflow-hidden bg-[#020205]">
      <CinematicSlideshow />
    </main>
  );
}
