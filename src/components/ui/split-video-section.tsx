"use client"

import * as React from "react"
import Link from 'next/link' // Added
import { Button } from '@/components/ui/button' // Added
import { cn } from "@/lib/utils"

export function SplitVideoSection() {
  return (
    <section className="relative w-full min-h-screen flex flex-col md:flex-row overflow-hidden bg-background">
      {/* Text Content (Left) */}
      <div className="relative w-full md:w-[50%] min-h-[50vh] md:min-h-screen flex items-center justify-end p-8 md:p-24 bg-[#020205] order-2 md:order-1">
        <div className="max-w-[680px] w-full flex flex-col items-start gap-10 animate-fade-in-up">
          {/* Floating Badge (Eyebrow) */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card hover:bg-white/10 transition-colors">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 box-shadow-[0_0_10px_#22c55e]"></span>
            </span>
            <span className="text-[0.6rem] font-black tracking-[0.3em] text-cyan-100/80 uppercase">Sentinel Network Active</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] text-white">
            <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">The Space</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-primary to-primary">Around Us</span>
          </h1>

          {/* Subline */}
          <p className="text-xl md:text-2xl text-blue-100/90 font-light tracking-wide leading-relaxed">
            Everything moves. <span className="text-cyan-400 font-bold italic">We pay attention.</span>
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-8 mt-6 w-full sm:w-auto">
            <Button asChild size="lg" className="cosmic-button text-xl px-10 py-8">
              <Link href="/dashboard">
                MISSION CONTROL
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="cosmic-button-outline text-xl px-10 py-8">
              <Link href="/risk">
                SITUATION ROOM
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Visual Content (Right) */}
      <div className="relative w-full md:w-[50%] h-[50vh] md:h-screen md:sticky md:top-0 order-1 md:order-2">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/home-page-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Soft edge merging gradient - now on the left for text side connection */}
        <div className="absolute inset-y-0 left-0 w-64 bg-gradient-to-r from-background via-background/40 to-transparent hidden md:block" />
        <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-background via-background/40 to-transparent md:hidden" />
      </div>
    </section>
  )
}
