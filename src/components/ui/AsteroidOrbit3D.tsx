'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Stars, Text } from '@react-three/drei';
import * as THREE from 'three';

/**
 * AsteroidOrbit3D Component
 * Interactive 3D solar system visualization.
 * 
 * Modified to accept dynamic data.
 */

// --- Configuration ---
// Scaling note: 1 Astronomical Unit (AU) approximately equals 10 scene units for visualization.
const AU_SCALE = 10; 

interface PlanetData {
  name: string;
  distance: number;
  size: number;
  color: string;
  speed: number;
  hasRings?: boolean;
}

const PLANET_DATA: PlanetData[] = [
  { name: 'Mercury', distance: 6, size: 0.38, color: '#E0E0E0', speed: 1.5 },
  { name: 'Venus', distance: 9, size: 0.95, color: '#FFD700', speed: 1.1 },
  { name: 'Earth', distance: 13, size: 1.0, color: '#4F97FF', speed: 1.0 },
  { name: 'Mars', distance: 17, size: 0.53, color: '#FF6B4A', speed: 0.8 },
  { name: 'Jupiter', distance: 30, size: 3.5, color: '#E3A857', speed: 0.4 },
  { name: 'Saturn', distance: 45, size: 3.0, color: '#F4D03F', speed: 0.3, hasRings: true },
  { name: 'Uranus', distance: 65, size: 2.5, color: '#73FBFD', speed: 0.2 },
  { name: 'Neptune', distance: 85, size: 2.4, color: '#5C82FF', speed: 0.15 }
];

interface OrbitPathProps {
  xRadius: number;
  zRadius: number;
  color?: string;
  opacity?: number;
}

const OrbitPath: React.FC<OrbitPathProps> = ({ xRadius, zRadius, color = "#ffffff", opacity = 0.15 }) => {
  const points = useMemo(() => {
    const p = [];
    for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * 2 * Math.PI;
        // Orbit rendered in XZ plane for simplicity
        const x = xRadius * Math.cos(theta);
        const z = zRadius * Math.sin(theta);
        p.push(new THREE.Vector3(x, 0, z));
    }
    return p;
  }, [xRadius, zRadius]);

  return (
    <Line
      points={points}
      color={color}
      opacity={opacity}
      transparent
      lineWidth={0.5}
    />
  );
};

const Planet: React.FC<PlanetData> = ({ distance, size, color, speed, hasRings }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(({ clock }) => {
        if (meshRef.current) {
            const t = clock.getElapsedTime() * 0.5 * speed;
            const x = distance * Math.cos(t);
            const z = distance * Math.sin(t);
            meshRef.current.position.set(x, 0, z);
            meshRef.current.rotation.y += 0.01;
        }
    });

    return (
        <group>
            <OrbitPath xRadius={distance} zRadius={distance} opacity={0.3} />
            <mesh ref={meshRef}>
                <sphereGeometry args={[size, 32, 32]} />
                <meshStandardMaterial 
                    color={color} 
                    roughness={0.5} 
                    metalness={0.2}
                    emissive={color}
                    emissiveIntensity={0.2}
                />
                {hasRings && (
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[size * 1.4, size * 2.2, 32]} />
                        <meshStandardMaterial color="#F4D03F" opacity={0.8} transparent side={THREE.DoubleSide} />
                    </mesh>
                )}
            </mesh>
        </group>
    );
};

const Sun = () => {
    return (
        <group>
            <mesh>
                <sphereGeometry args={[2.5, 32, 32]} />
                <meshBasicMaterial color="#FFD700" />
            </mesh>
            <mesh scale={[1.2, 1.2, 1.2]}>
                <sphereGeometry args={[2.5, 32, 32]} />
                <meshBasicMaterial color="#FF4500" transparent opacity={0.2} side={THREE.BackSide}/>
            </mesh>
            <pointLight intensity={3} distance={200} decay={1} color="#ffffff" />
            <pointLight intensity={10} distance={50} decay={2} color="#ffcc00" />
        </group>
    );
};

interface TrackedObjectData {
  name?: string;
  distance_au?: number;
  velocity_km_s?: number;
  eccentricity?: number;
}

interface TrackedObjectProps {
  data: TrackedObjectData;
}

const TrackedObject: React.FC<TrackedObjectProps> = ({ data }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    
    // Determine orbit parameters. If data is invalid/missing, generate a "safe" random orbit.
    const orbitParams = useMemo(() => {
        // Check if we have valid distance data (must be > 0.2 AU to be clearly outside Sun radius of ~0.5 units)
        // Note: Sun radius is 2.5 scene units. 0.3 AU * 10 = 3.0 units. So > 0.3 AU is safe.
        const hasValidData = data?.distance_au && data.distance_au > 0.3;
        
        if (hasValidData) {
            return {
                a: (data.distance_au!) * 10, // Scale to scene units
                e: data.eccentricity || 0.2,
                speed: data.velocity_km_s ? data.velocity_km_s / 50 : 0.5,
                isFallback: false
            };
        } else {
            // Fallback: Generate random orbit in Main Belt (1.2 - 3.5 AU)
            // We use the object name to seed the randomness so it remains consistent for the same object
            const seed = data?.name ? data.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : Math.random() * 1000;
            const pseudoRandom = (seed % 100) / 100; // 0 to 1
            
            const randomA = 1.2 + (pseudoRandom * 2.3); // 1.2 to 3.5 AU
            return {
                a: randomA * 10,
                e: 0.1 + (pseudoRandom * 0.2), // 0.1 to 0.3
                speed: 0.2 + ((1 - pseudoRandom) * 0.4), // Slower for further objects
                isFallback: true
            };
        }
    }, [data]);

    const a = orbitParams.a;
    const b = a * Math.sqrt(1 - orbitParams.e * orbitParams.e);

    useFrame(({ clock }) => {
        if (meshRef.current) {
            const t = clock.getElapsedTime() * orbitParams.speed;
            const x = a * Math.cos(t);
            const z = b * Math.sin(t);
            meshRef.current.position.set(x, 0, z);
            meshRef.current.rotation.x += 0.02;
            meshRef.current.rotation.y += 0.03;
        }
    });

    return (
        <group>
             <OrbitPath xRadius={a} zRadius={b} color={orbitParams.isFallback ? "#ffaa00" : "#ff0000"} opacity={orbitParams.isFallback ? 0.3 : 0.6} />
             <mesh ref={meshRef}>
                 <dodecahedronGeometry args={[0.6, 0]} />
                 <meshStandardMaterial 
                    color={orbitParams.isFallback ? "#ffaa00" : "#ff4444"} 
                    roughness={0.7} 
                    emissive={orbitParams.isFallback ? "#ffaa00" : "#ff0000"} 
                    emissiveIntensity={0.5} 
                 />
                 <Text 
                    position={[0, 1.5, 0]} 
                    fontSize={1} 
                    color="white" 
                    anchorX="center" 
                    anchorY="middle"
                 >
                    {data?.name || "Target"}
                    {orbitParams.isFallback && "\n(Simulated Orbit)"}
                 </Text>
             </mesh>
        </group>
    );
};

interface AsteroidOrbit3DProps {
  data: TrackedObjectData;
}

const AsteroidOrbit3D: React.FC<AsteroidOrbit3DProps> = ({ data }) => {
    return (
        <div className="w-full h-[600px] bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800 relative">
            <Canvas camera={{ position: [0, 60, 80], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <Stars radius={200} depth={50} count={7000} factor={4} saturation={0} fade speed={0.5} />
                
                <group position={[0, -5, 0]}>
                    <Sun />
                    {PLANET_DATA.map((planet, index) => (
                        <Planet key={index} {...planet} />
                    ))}
                    <TrackedObject data={data} />
                </group>

                <OrbitControls 
                    enablePan={true}
                    enableZoom={true} 
                    enableRotate={true}
                    minDistance={20}
                    maxDistance={200}
                />
            </Canvas>
            
            <div className="absolute bottom-4 left-4 text-white/50 text-xs font-mono pointer-events-none bg-black/50 p-2 rounded backdrop-blur-sm">
                <p className="font-bold text-white mb-1">SOLAR SYSTEM VIEW</p>
                <p>• Sun & 8 Planets</p>
                <p>• Currently Tracking: <span className="text-red-400 font-bold">{data?.name || "Unknown Object"}</span></p>
                <p className="mt-1 opacity-70">Not to scale</p>
            </div>
        </div>
    );
};

export default AsteroidOrbit3D;
