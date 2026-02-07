'use client';

import { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import EarthScene from './EarthScene';

// --- Configuration ---

const SLIDES = [
  {
    id: 0,
    title: "",
    content: [],
    cameraPos: [0, 0, 8],
    lookAt: [0, 0, 0]
  },
  {
    id: 1,
    title: "PLANETARY DEFENSE",
    content: [
      "A global initiative to detect, track, and mitigate hazardous near-Earth objects.",
      "Ensuring the long-term survival of our species through vigilant observation."
    ],
    cameraPos: [3, 1, 5],
    lookAt: [0, 0, 0]
  },
  {
    id: 2,
    title: "ORBITAL SENTINELS",
    content: [
      "A network of advanced satellites monitoring 34,000+ objects in real-time.",
      "Providing early warning data with sub-second latency.",
      "100% Global Coverage."
    ],
    cameraPos: [-2, 2, 4.5],
    lookAt: [0, 1, 0]
  },
  {
    id: 3,
    title: "INTERCEPTION READY",
    content: [
      "Kinetic impactor technology proved by the DART mission.",
      "Rapid response capabilities for imminent threats.",
      "We don't just watch. We act."
    ],
    cameraPos: [0, -1, 6],
    lookAt: [0, -0.5, 0]
  },
  {
    id: 4,
    title: "THE HIGH FRONTIER",
    content: [
      "Space is no longer a void. It is critical infrastructure.",
      "Protecting our orbital economy is protecting our future.",
      "Join the mission."
    ],
    cameraPos: [4, 0, 8],
    lookAt: [0, 0, 0]
  }
];

// --- Sub-components ---

// --- Sub-components ---

function CameraRig({ slideIndex }: { slideIndex: number }) {
  const { camera } = useThree();
  const positionVec = new THREE.Vector3();
  const lookAtVec = new THREE.Vector3();
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state, delta) => {
    const target = SLIDES[slideIndex];
    
    // Smooth damp camera position
    state.camera.position.lerp(positionVec.set(target.cameraPos[0], target.cameraPos[1], target.cameraPos[2]), delta * 1.5);
    
    // Smooth lookAt interpolation
    const targetLookAt = lookAtVec.set(target.lookAt[0], target.lookAt[1], target.lookAt[2]);

    currentLookAt.current.lerp(targetLookAt, delta * 1.5);
    state.camera.lookAt(currentLookAt.current);
  });
  
  return null;
}

export default function CinematicSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  
  // Handle Scroll (Coarse "Scrolljacking" for slide behavior)
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleWheel = (e: WheelEvent) => {
      // Prevent standard scroll
      // e.preventDefault(); 
      
      if (isScrolling) return;

      if (e.deltaY > 50) {
        setIsScrolling(true);
        setCurrentSlide(prev => Math.min(prev + 1, SLIDES.length - 1));
        timeout = setTimeout(() => setIsScrolling(false), 1500); // 1.5s lock
      } else if (e.deltaY < -50) {
        setIsScrolling(true);
        setCurrentSlide(prev => Math.max(prev - 1, 0));
        timeout = setTimeout(() => setIsScrolling(false), 1500);
      }
    };

    window.addEventListener('wheel', handleWheel);
    return () => {
      window.removeEventListener('wheel', handleWheel);
      clearTimeout(timeout);
    };
  }, [isScrolling]);

  return (
    <div className="relative w-screen h-screen bg-[#020205] overflow-hidden text-white group/ui">
      
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 8], fov: 45 }}>
          <EarthScene />
          <CameraRig slideIndex={currentSlide} />
        </Canvas>
      </div>

      {/* Content Overlay Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-start px-20 md:px-32">
        <AnimatePresence mode="wait">
          {currentSlide > 0 && (
            <motion.div 
              key={currentSlide}
              initial={{ opacity: 0, x: -50, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: 50, filter: 'blur(10px)' }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} // Custom cinematic ease
              className="max-w-xl"
            >
              <h2 className="text-sm font-mono text-cyan-400 tracking-[0.5em] mb-4 uppercase">
                Slide 0{currentSlide} / 0{SLIDES.length - 1}
              </h2>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-none">
                {SLIDES[currentSlide].title}
              </h1>
              <div className="space-y-4 text-lg md:text-xl text-white/80 font-light leading-relaxed border-l-2 border-white/20 pl-6">
                 {SLIDES[currentSlide].content.map((line, i) => (
                   <p key={i}>{line}</p>
                 ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Indicators (Hidden by default, visible on hover) */}
      <div className="absolute bottom-10 right-10 z-20 flex gap-2 opacity-0 group-hover/ui:opacity-100 transition-opacity duration-500">
        {SLIDES.map((s, i) => (
          <div 
            key={i} 
            className={`h-1 transition-all duration-500 rounded-full ${i === currentSlide ? 'w-8 bg-cyan-400' : 'w-2 bg-white/20'}`}
          />
        ))}
      </div>

      
      {/* Scroll Hint */}
      {currentSlide === 0 && (
         <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 2, duration: 1 }}
           className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 text-[10px] uppercase tracking-[0.4em] text-white/40 animate-pulse"
         >
           Scroll to Begin
         </motion.div>
      )}

    </div>
  );
}
