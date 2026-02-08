import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Stars } from '@react-three/drei';
import * as THREE from 'three';

/**
 * AsteroidOrbit3D Component
 * Interactive 3D solar system visualization.
 */

// --- Configuration ---
// Scaling note: 1 Astronomical Unit (AU) approximately equals 10 scene units for visualization.
const AU_SCALE = 10; 

const PLANET_DATA = [
  { name: 'Mercury', distance: 6, size: 0.38, color: '#E0E0E0', speed: 1.5 },
  { name: 'Venus', distance: 9, size: 0.95, color: '#FFD700', speed: 1.1 },
  { name: 'Earth', distance: 13, size: 1.0, color: '#4F97FF', speed: 1.0 },
  { name: 'Mars', distance: 17, size: 0.53, color: '#FF6B4A', speed: 0.8 },
  { name: 'Jupiter', distance: 30, size: 3.5, color: '#E3A857', speed: 0.4 },
  { name: 'Saturn', distance: 45, size: 3.0, color: '#F4D03F', speed: 0.3, hasRings: true },
  { name: 'Uranus', distance: 65, size: 2.5, color: '#73FBFD', speed: 0.2 },
  { name: 'Neptune', distance: 85, size: 2.4, color: '#5C82FF', speed: 0.15 }
];

const ASTEROID_ORBIT_A = 22; 
const ASTEROID_ORBIT_B = 18; 

const OrbitPath = ({ xRadius, zRadius, color = "#ffffff", opacity = 0.15 }) => {
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

const Planet = ({ distance, size, color, speed, hasRings }) => {
    const meshRef = useRef();

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

const Asteroid = () => {
    const meshRef = useRef();

    useFrame(({ clock }) => {
        if (meshRef.current) {
            const t = clock.getElapsedTime() * 0.6;
            const x = ASTEROID_ORBIT_A * Math.cos(t);
            const z = ASTEROID_ORBIT_B * Math.sin(t);
            meshRef.current.position.set(x, 0, z);
            meshRef.current.rotation.x += 0.02;
            meshRef.current.rotation.y += 0.03;
        }
    });

    return (
        <group>
             <OrbitPath xRadius={ASTEROID_ORBIT_A} zRadius={ASTEROID_ORBIT_B} color="#ff0000" opacity={0.4} />
             <mesh ref={meshRef}>
                 <dodecahedronGeometry args={[0.4, 0]} />
                 <meshStandardMaterial color="#888888" roughness={0.9} />
             </mesh>
        </group>
    );
};

const AsteroidOrbit3D = () => {
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
                    <Asteroid />
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
                <p>• Tracked Asteroid</p>
                <p className="mt-1 opacity-70">Not to scale</p>
            </div>
        </div>
    );
};

export default AsteroidOrbit3D;
