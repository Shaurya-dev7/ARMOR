'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader, InstancedMesh, Object3D, Color, Vector3, AdditiveBlending, ShaderMaterial, BackSide, Group } from 'three';
import { Stars } from '@react-three/drei';

// --- Shaders ---

const AtmosphereShader = {
  vertexShader: `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    void main() {
      float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
      gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
    }
  `
};

// --- Components ---

function Atmosphere() {
  return (
    <mesh scale={[1.2, 1.2, 1.2]}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        vertexShader={AtmosphereShader.vertexShader}
        fragmentShader={AtmosphereShader.fragmentShader}
        blending={AdditiveBlending}
        side={BackSide}
        transparent
      />
    </mesh>
  );
}

function Meteoroids({ count = 200 }) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  
  // Generate random orbits
  const orbits = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
      radius: 1.8 + Math.random() * 2.5,
      speed: 0.05 + Math.random() * 0.1,
      angle: Math.random() * Math.PI * 2,
      inclination: (Math.random() - 0.5) * 0.5, // +/- ~15 degrees
      yOffset: (Math.random() - 0.5) * 0.5
    }));
  }, [count]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    orbits.forEach((orbit, i) => {
      orbit.angle += orbit.speed * delta * 0.5; // Time-based movement
      
      const x = Math.cos(orbit.angle) * orbit.radius;
      const z = Math.sin(orbit.angle) * orbit.radius;
      const y = Math.sin(orbit.angle + orbit.inclination) * 0.5 + orbit.yOffset;

      dummy.position.set(x, y, z);
      dummy.rotation.x = Math.random() * Math.PI;
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.scale.setScalar(0.02 + Math.random() * 0.03); // LOD: Keep small
      
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#888888" roughness={0.8} />
    </instancedMesh>
  );
}

export default function EarthScene() {
  const earthRef = useRef<Group>(null);
  
  // Note: Textures should be placed in public/textures/
  // Using placeholders or colors if textures fail would be ideal, 
  // currently assuming standard material properties if no map.
  
  useFrame((state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.02; // Independent of framerate
    }
  });

  return (
    <>
      <ambientLight intensity={0.1} />
      <directionalLight position={[5, 3, 5]} intensity={3.5} castShadow />
      
      {/* Starfield Background */}
      <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <group ref={earthRef}>
        {/* Main Earth Sphere */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[1.5, 64, 64]} />
          <meshStandardMaterial 
            color="#1c3e6e" // Fallback deep ocean blue
            roughness={0.5}
            metalness={0.1}
            // map={colorMap} 
            // normalMap={normalMap} 
            // roughnessMap={specularMap}
          />
        </mesh>
        
        {/* Atmosphere Glow */}
        <Atmosphere />
        
        {/* Cloud Layer (Mental Model: slightly larger sphere, transparent) */}
        <mesh scale={[1.01, 1.01, 1.01]}>
           <sphereGeometry args={[1.5, 64, 64]} />
           <meshStandardMaterial color="#ffffff" transparent opacity={0.2} blending={AdditiveBlending} />
        </mesh>
      </group>

      <Meteoroids count={150} />
    </>
  );
}
