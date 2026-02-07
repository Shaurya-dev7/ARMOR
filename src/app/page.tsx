import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldAlert, Satellite, Activity, ChevronRight, Globe, Zap, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white selection:bg-cyan-500/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div 
           className="absolute inset-0 bg-cover bg-center opacity-40 animate-pulse-slow"
           style={{ backgroundImage: 'url("https://images-assets.nasa.gov/image/PIA12348/PIA12348~orig.jpg")' }}
         />
         <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black/90" />
         <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-3xl opacity-20 animate-blob" />
         <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors animate-fade-in-up">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs font-medium tracking-widest text-gray-300 uppercase">System Operational</span>
        </div>

        <h1 className="max-w-4xl mx-auto text-7xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 animate-fade-in-up animation-delay-200 drop-shadow-2xl">
          PLANETARY <br /> DEFENSE
        </h1>

        <p className="max-w-2xl mx-auto text-xl md:text-2xl text-gray-400 mb-12 animate-fade-in-up animation-delay-400 leading-relaxed font-light">
          Real-time risk intelligence for the orbital economy. Monitor <span className="text-white font-medium">asteroids</span>, track <span className="text-white font-medium">satellites</span>, and protect <span className="text-white font-medium">humanity</span>'s future.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 animate-fade-in-up animation-delay-600">
           <Button asChild size="lg" className="h-14 px-8 rounded-full bg-white text-black hover:bg-gray-200 transition-transform hover:scale-105 font-bold text-lg">
             <Link href="/dashboard">
               Enter Mission Control
             </Link>
           </Button>
           <Button asChild size="lg" variant="outline" className="h-14 px-8 rounded-full border-white/20 hover:bg-white/10 hover:border-white/40 backdrop-blur-md transition-all text-lg">
             <Link href="/risk">
               Learn More
             </Link>
           </Button>
        </div>
      </section>

      {/* Modern Bento Grid Section */}
      <section className="relative z-10 py-24 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="mb-16">
          <h2 className="text-4xl font-bold tracking-tight mb-4">Core Capabilities</h2>
          <p className="text-gray-400 text-lg">Advanced telemetry aggregation and risk visualization.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[300px]">
           {/* Large Card - Asteroids */}
           <div className="md:col-span-2 row-span-2 group relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all hover:bg-white/[0.07] hover:border-white/20">
             <div className="absolute inset-0 bg-[url('https://images-assets.nasa.gov/image/PIA22946/PIA22946~small.jpg')] bg-cover bg-center opacity-40 group-hover:opacity-50 transition-opacity duration-700 transform group-hover:scale-105" />
             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
             <div className="relative h-full flex flex-col justify-end p-8">
               <ShieldAlert className="w-12 h-12 text-white mb-6" />
               <h3 className="text-3xl font-bold mb-2">Asteroid impact monitor</h3>
               <p className="text-gray-300 text-lg max-w-md">Real-time filtering of Near-Earth Objects using NASA NeoWs/JPL Sentry data. We isolate threats with &gt;0% impact probability.</p>
               <Button variant="link" className="text-white p-0 h-auto justify-start mt-4 group-hover:underline" asChild>
                  <Link href="/asteroids">View Database <ArrowUpRight className="ml-2 w-4 h-4" /></Link>
               </Button>
             </div>
           </div>

           {/* Satellites */}
           <div className="md:col-span-1 row-span-1 group relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all hover:bg-white/[0.07] hover:border-white/20">
             <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="relative h-full flex flex-col justify-between p-8">
                <Satellite className="w-10 h-10 text-cyan-400" />
                <div>
                  <h3 className="text-2xl font-bold mb-2">Orbital Asset Protection</h3>
                  <p className="text-sm text-gray-400">Conjunction analysis for LEO/GEO satellite swarms.</p>
                </div>
             </div>
           </div>

           {/* ISS */}
           <div className="md:col-span-1 row-span-1 group relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all hover:bg-white/[0.07] hover:border-white/20">
              <div className="absolute inset-0 bg-[url('https://www.nasa.gov/sites/default/files/thumbnails/image/iss065e324398.jpg')] bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity" />
              <div className="absolute inset-0 bg-black/60" />
              <div className="relative h-full flex flex-col justify-between p-8">
                 <Zap className="w-10 h-10 text-yellow-400" />
                 <div>
                   <h3 className="text-2xl font-bold mb-2">ISS Telemetry</h3>
                   <p className="text-sm text-gray-400">Live monitoring of Station safety corridors.</p>
                 </div>
              </div>
           </div>

           {/* Metrics / Uncertainty */}
           <div className="md:col-span-3 row-span-1 group relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all hover:bg-white/[0.07] hover:border-white/20 flex flex-col md:flex-row items-center">
             <div className="flex-1 p-8">
                <Activity className="w-10 h-10 text-purple-400 mb-4" />
                <h3 className="text-2xl font-bold mb-2">Uncertainty Visualization</h3>
                <p className="text-gray-400 max-w-lg">
                  Space is vast, and data is imperfect. We visualize error ellipsoids to show you exactly how confident our predictions are, reducing false alarms.
                </p>
             </div>
             <div className="flex-1 h-full w-full relative bg-white/5 border-l border-white/5 flex items-center justify-center overflow-hidden">
                {/* Abstract Data Viz Decoration */}
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                   <div className="w-64 h-64 rounded-full border border-white/10 animate-[spin_10s_linear_infinite]" />
                   <div className="w-48 h-48 rounded-full border border-dashed border-white/20 absolute animate-[spin_15s_linear_infinite_reverse]" />
                   <div className="w-32 h-32 rounded-full border border-white/30 absolute animate-pulse" />
                </div>
                <span className="font-mono text-xs text-white/50 relative z-10">LIVE DATA STREAM</span>
             </div>
           </div>
        </div>
      </section>

      {/* Footer / Trust */}
      <footer className="relative z-10 py-12 border-t border-white/5 bg-black/40 backdrop-blur-md text-center">
        <p className="text-gray-500 mb-6 font-mono text-sm">TRUSTED DATA SOURCES</p>
        <div className="flex justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          <span className="text-xl font-bold tracking-widest text-white">NASA</span>
          <span className="text-xl font-bold tracking-widest text-white">ESA</span>
          <span className="text-xl font-bold tracking-widest text-white">JPL</span>
        </div>
      </footer>
    </div>
  );
}
