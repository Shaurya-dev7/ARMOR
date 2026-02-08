'use client';

import AsteroidOrbit3D from '@/components/ui/AsteroidOrbit3D';

export default function OrbitTestPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-8 text-white">
      <h1 className="text-3xl font-bold mb-8">Asteroid Orbit 3D Verification</h1>
      <div className="w-full max-w-4xl">
        <AsteroidOrbit3D />
      </div>
      <p className="mt-4 text-gray-400">
        Controls: Left Click to Rotate | Right Click to Pan | Scroll to Zoom
      </p>
    </div>
  );
}
