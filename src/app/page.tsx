import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { AsteroidSlideshow } from '@/components/ui/asteroid-slideshow';
import { ShieldAlert, Satellite, Activity, Zap, ArrowUpRight, Radio } from 'lucide-react';
import { HeroSlider } from '@/components/ui/hero-slider';
import { Footerdemo } from '@/components/ui/footer-section';
import { SplitVideoSection } from '@/components/ui/split-video-section';



export default function Home() {
  // Generate random stats for the "Live" feel
  const activeSatellites = 8432;
  const trackedAsteroids = 34012;

  return (
    <div className="relative flex flex-col min-h-screen text-white selection:bg-cyan-500/30 overflow-hidden font-sans">
      
      {/* 1. Dynamic Background Layers */}
      <div className="fixed inset-0 z-0 bg-[#020205] pointer-events-none">
        {/* Falling Stars Field */}
        <div className="star-field">
          <div className="falling-star" style={{ top: '0%', left: '100%', animationDelay: '0s', animationDuration: '15s' }} />
          <div className="falling-star" style={{ top: '10%', left: '90%', animationDelay: '2s', animationDuration: '20s' }} />
          <div className="falling-star" style={{ top: '20%', left: '80%', animationDelay: '8s', animationDuration: '12s' }} />
          <div className="falling-star" style={{ top: '5%', left: '70%', animationDelay: '12s', animationDuration: '25s' }} />
          <div className="falling-star" style={{ top: '0%', left: '50%', animationDelay: '4s', animationDuration: '18s' }} />
          <div className="falling-star" style={{ top: '15%', left: '100%', animationDelay: '10s', animationDuration: '22s' }} />
        </div>

        {/* Deep Space Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/10 to-purple-900/10" />
        
        {/* Glow Blurs */}
        <div className="absolute top-[-20%] left-[20%] w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[150px] mix-blend-screen animate-float" />
        <div className="absolute bottom-[-10%] right-[10%] w-[900px] h-[900px] bg-cyan-600/5 rounded-full blur-[150px] mix-blend-screen animate-float" style={{ animationDelay: '2s' }} />
      </div>




      {/* 2. Hero Section */}
      {/* 2. Hero Section (Split Video) */}
      <SplitVideoSection />

      {/* 2.5 Slider Section */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 mb-20 animate-fade-in-up animation-delay-800">
         <HeroSlider />
      </div>





      {/* 3. Bento Grid - Features */}
      <section className="relative z-10 py-32 section-container">

        <div className="mb-24 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
          <div className="relative flex flex-col md:flex-row items-baseline justify-between gap-8 p-8 md:p-12 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-white/5">
            
            {/* Ambient Light Effect */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
               <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-500 drop-shadow-lg">
                 CAPABILITIES
               </h2>
               <div className="flex items-center gap-3">
                 <div className="h-[1px] w-12 bg-cyan-500/50" />
                 <p className="text-cyan-400 font-mono text-xs uppercase tracking-[0.5em] font-bold drop-shadow-md">
                   High-Res Multimodal Intelligence
                 </p>
               </div>
            </div>


            <div className="flex gap-12 font-mono text-xs relative z-10">
               <div className="group/stat cursor-help">
                 <div className="text-white text-3xl font-black group-hover/stat:text-cyan-400 transition-colors duration-300">{activeSatellites.toLocaleString()}</div>
                 <div className="text-white/40 tracking-widest mt-1 group-hover/stat:text-white/70 transition-colors">ASSETS TRACKED</div>
               </div>
               <div className="group/stat cursor-help">
                 <div className="text-white text-3xl font-black group-hover/stat:text-purple-400 transition-colors duration-300">{trackedAsteroids.toLocaleString()}</div>
                 <div className="text-white/40 tracking-widest mt-1 group-hover/stat:text-white/70 transition-colors">NEOs MONITORED</div>
               </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 auto-rows-[400px]">
           
           {/* Card: Asteroid Monitor (Large) */}
           <div className="md:col-span-2 row-span-1 group glass-card glow-border">
             <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
             <div className="relative h-full flex flex-col justify-between p-12 z-10">
               <div className="flex justify-between items-start">
                 <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                   <ShieldAlert className="w-12 h-12 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                 </div>
                 <ArrowUpRight className="w-8 h-8 text-white/20 group-hover:text-primary transition-all duration-500" />
               </div>
               <div>
                  <h3 className="text-5xl font-black mb-4 text-white tracking-tighter">IMPACT<br/>CORRIDORS</h3>
                  <p className="text-gray-400 text-xl font-light leading-relaxed">
                    Threats: <span className="text-white font-medium">ISOLATED.</span><br/>
                    Risk: <span className="text-white font-medium">VECTORS ANALYZED.</span>
                  </p>
               </div>
             </div>
           </div>

           {/* Card: Satellite Tracking */}
           <div className="md:col-span-1 row-span-1 group glass-card glow-border">
             <div className="absolute top-0 right-0 p-32 bg-cyan-500/10 blur-[100px]" />
             <div className="relative h-full flex flex-col justify-between p-10">
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 w-fit">
                  <Satellite className="w-10 h-10 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-3xl font-black mb-3 tracking-tighter">CONJUNCTION</h3>
                  <p className="text-lg text-gray-400 font-light leading-tight">
                    Collision Probability: <span className="text-white font-bold tracking-widest">&lt;10⁻⁶</span>
                  </p>
                </div>
             </div>
           </div>

           {/* Card: ISS Live */}
           <div className="md:col-span-1 row-span-1 group glass-card glow-border">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-500/5 via-transparent to-transparent" />
              <div className="relative h-full flex flex-col justify-between p-10">
                 <div className="flex justify-between items-center">
                   <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                     <Zap className="w-10 h-10 text-yellow-400" />
                   </div>
                   <div className="flex gap-1 items-center bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">
                     <div className="animate-pulse w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_#4ade80]" />
                     <span className="text-[10px] font-black text-green-400 tracking-tighter">LIVE</span>
                   </div>
                 </div>
                 <div>
                   <h3 className="text-3xl font-black mb-3 tracking-tighter">STATION</h3>
                   <p className="text-lg text-gray-400 font-light">
                     Safety Corridor: <span className="text-green-400 font-bold uppercase tracking-widest">Clear</span>
                   </p>
                 </div>
              </div>
           </div>

           {/* Card: Deep Analysis (Wide) */}
           <div className="md:col-span-4 row-span-1 group glass-card glow-border mt-8 overflow-hidden flex flex-col md:flex-row items-center">
             <div className="flex-1 p-12 md:p-20 order-2 md:order-1">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <Radio className="w-6 h-6 text-purple-400 animate-pulse" />
                  </div>
                  <span className="font-mono text-[10px] text-purple-400 tracking-[0.5em] uppercase font-black">Interpretation Active</span>
                </div>
                <h3 className="text-6xl md:text-7xl font-black mb-6 tracking-tighter leading-none">SIGNAL Over NOISE</h3>
                <p className="text-2xl text-gray-400 font-light max-w-2xl leading-relaxed">
                  Raw sensors are chaotic. Our engine delivers <span className="text-white border-b-2 border-primary/30 py-1">Mission-Ready Clarity.</span>
                </p>
             </div>
             <div className="flex-1 h-full w-full relative min-h-[300px] bg-white/[0.02] order-1 md:order-2 flex items-center justify-center overflow-hidden">
                {/* Abstract Data Visualization */}
                <div className="absolute inset-0 flex items-center justify-center scale-150">
                   <div className="w-[120%] h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent absolute top-1/2 -translate-y-1/2" />
                   <div className="w-1 h-[120%] bg-gradient-to-b from-transparent via-purple-500/40 to-transparent absolute left-1/2 -translate-x-1/2" />
                   <div className="w-64 h-64 rounded-full border border-white/5 animate-[spin_20s_linear_infinite]" />
                   <div className="w-96 h-96 rounded-full border border-dashed border-white/10 absolute animate-[spin_40s_linear_infinite_reverse]" />
                   <div className="w-[30rem] h-[30rem] rounded-full border border-white/5 absolute" />
                </div>
             </div>
           </div>

        </div>
      </section>

      {/* 4. Footer */}
      <Footerdemo />
    </div>
  );
}

