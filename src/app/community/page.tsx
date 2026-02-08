'use client';

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ChatInterface } from '@/components/community/chat-interface';
import AnimatedShaderBackground from '@/components/ui/animated-shader-background';

export default function CommunityPage() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white selection:bg-primary/30 selection:text-white overflow-hidden relative font-sans">
      <Navbar />
      <main className="flex-1 relative pt-36 pb-20 px-4 flex flex-col items-center justify-center">
      

        {/* Background Ambience */}
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
          <AnimatedShaderBackground />
        </div>
        
        {/* Animated Grid */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20" 
             style={{ 
               backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)', 
               backgroundSize: '50px 50px' 
             }} 
        />

        <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center">
          {/* Header */}
          <div className="text-center mb-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-primary animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              SECURE FREQUENCY ESTABLISHED
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
              Global Operations Center
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Coordinate with fellow researchers and analysts in real-time. Share observations, discuss anomalies, and monitor global alerts.
            </p>
          </div>

          {/* Chat Interface */}
          <ChatInterface />
        </div>
        
      </main>

      <Footer />
    </div>
  );
}
