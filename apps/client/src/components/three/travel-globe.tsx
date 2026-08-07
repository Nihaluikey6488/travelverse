"use client";

import { Float, OrbitControls, Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";

function RotatingWorld() {
  const globeRef = useRef<Mesh>(null);
  const ringRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += delta * 0.18;
    }

    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.12;
    }
  });

  return (
    <Float speed={1.6} rotationIntensity={0.28} floatIntensity={0.55}>
      <mesh ref={globeRef}>
        <sphereGeometry args={[1.58, 64, 64]} />
        <meshStandardMaterial color="#19c5a5" roughness={0.45} metalness={0.15} />
      </mesh>
      <mesh ref={ringRef} rotation={[1.2, 0.1, 0.35]}>
        <torusGeometry args={[2.05, 0.012, 12, 160]} />
        <meshBasicMaterial color="#f2c45a" />
      </mesh>
      <mesh rotation={[1.55, 0.15, -0.55]}>
        <torusGeometry args={[2.35, 0.01, 12, 160]} />
        <meshBasicMaterial color="#ff7d66" />
      </mesh>
    </Float>
  );
}

export function TravelGlobe() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 42 }} dpr={[1, 1.6]}>
      <color attach="background" args={["#10100f"]} />
      <ambientLight intensity={0.8} />
      <directionalLight color="#fff3d6" intensity={2.1} position={[3, 4, 5]} />
      <pointLight color="#ff7d66" intensity={2.2} position={[-3, -2, 3]} />
      <Stars count={1200} depth={45} factor={3.8} fade speed={0.5} />
      <RotatingWorld />
      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.45} />
    </Canvas>
  );
}
