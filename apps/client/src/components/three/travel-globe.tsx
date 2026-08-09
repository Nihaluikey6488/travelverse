"use client";

import { Billboard, Float, Line, OrbitControls, Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import {
  AdditiveBlending,
  BackSide,
  QuadraticBezierCurve3,
  Vector3,
  type Group,
  type Mesh,
} from "three";
import type { Destination } from "@travelverse/contracts";

export type TravelGlobeProps = {
  destinations: Destination[];
  onSelectDestination: (slug: string) => void;
  selectedSlug: string;
};

const GLOBE_RADIUS = 1.66;
const HOTSPOT_RADIUS = 1.78;

function coordinateToVector(lat: number, lng: number, radius = HOTSPOT_RADIUS) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  return new Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function GlobeCore({
  destinations,
  onSelectDestination,
  selectedSlug,
}: TravelGlobeProps) {
  const globeRef = useRef<Mesh>(null);
  const wireRef = useRef<Mesh>(null);
  const ringsRef = useRef<Group>(null);
  const selectedDestination =
    destinations.find((destination) => destination.slug === selectedSlug) ?? destinations[0];

  useFrame(({ clock }, delta) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += delta * 0.12;
    }

    if (wireRef.current) {
      wireRef.current.rotation.y -= delta * 0.045;
      wireRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.25) * 0.025;
    }

    if (ringsRef.current) {
      ringsRef.current.rotation.z += delta * 0.085;
      ringsRef.current.rotation.y -= delta * 0.035;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.16} floatIntensity={0.42}>
      <group rotation={[0.04, -0.34, -0.08]}>
        <mesh ref={globeRef}>
          <sphereGeometry args={[GLOBE_RADIUS, 96, 96]} />
          <meshStandardMaterial
            color="#062821"
            emissive="#05332b"
            emissiveIntensity={0.75}
            metalness={0.42}
            roughness={0.32}
          />
        </mesh>

        <mesh ref={wireRef}>
          <sphereGeometry args={[GLOBE_RADIUS + 0.012, 48, 48]} />
          <meshBasicMaterial color="#6fffe0" opacity={0.16} transparent wireframe />
        </mesh>

        <mesh>
          <sphereGeometry args={[GLOBE_RADIUS + 0.08, 96, 96]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color="#2fffd2"
            opacity={0.12}
            side={BackSide}
            transparent
          />
        </mesh>

        <group ref={ringsRef}>
          <mesh rotation={[1.22, 0.2, 0.45]}>
            <torusGeometry args={[2.12, 0.009, 12, 180]} />
            <meshBasicMaterial color="#f8d56a" opacity={0.8} transparent />
          </mesh>
          <mesh rotation={[1.58, -0.18, -0.75]}>
            <torusGeometry args={[2.42, 0.006, 12, 180]} />
            <meshBasicMaterial color="#ff7d66" opacity={0.58} transparent />
          </mesh>
          <mesh rotation={[0.88, 0.68, 1.05]}>
            <torusGeometry args={[1.88, 0.006, 12, 180]} />
            <meshBasicMaterial color="#8df8ff" opacity={0.46} transparent />
          </mesh>
        </group>

        {selectedDestination
          ? destinations
              .filter((destination) => destination.slug !== selectedDestination.slug)
              .map((destination) => (
                <RouteArc
                  key={`${selectedDestination.slug}-${destination.slug}`}
                  destination={destination}
                  from={selectedDestination}
                />
              ))
          : null}

        {destinations.map((destination) => (
          <DestinationHotspot
            destination={destination}
            isSelected={destination.slug === selectedSlug}
            key={destination.slug}
            onSelectDestination={onSelectDestination}
          />
        ))}
      </group>
    </Float>
  );
}

function DestinationHotspot({
  destination,
  isSelected,
  onSelectDestination,
}: {
  destination: Destination;
  isSelected: boolean;
  onSelectDestination: (slug: string) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const pulseRef = useRef<Mesh>(null);
  const dotRef = useRef<Mesh>(null);
  const position = useMemo(
    () => coordinateToVector(destination.coordinates.lat, destination.coordinates.lng),
    [destination.coordinates.lat, destination.coordinates.lng],
  );

  useFrame(({ clock }) => {
    const pulse = 1 + Math.sin(clock.elapsedTime * 3.4) * 0.12;

    if (pulseRef.current) {
      pulseRef.current.scale.setScalar(isSelected ? 1.7 * pulse : 1.08 * pulse);
    }

    if (dotRef.current) {
      dotRef.current.scale.setScalar(isSelected || isHovered ? 1.48 : 1);
    }
  });

  return (
    <Billboard position={position}>
      <group>
        <mesh ref={pulseRef}>
          <ringGeometry args={[0.072, 0.102, 44]} />
          <meshBasicMaterial
            color={isSelected ? "#f8d56a" : "#35f6cf"}
            opacity={isSelected ? 0.82 : 0.34}
            transparent
          />
        </mesh>
        <mesh
          onClick={(event) => {
            event.stopPropagation();
            onSelectDestination(destination.slug);
          }}
          onPointerOut={() => setIsHovered(false)}
          onPointerOver={(event) => {
            event.stopPropagation();
            setIsHovered(true);
          }}
          ref={dotRef}
        >
          <sphereGeometry args={[0.043, 24, 24]} />
          <meshBasicMaterial color={isSelected ? "#ffe38a" : "#64ffe1"} toneMapped={false} />
        </mesh>
      </group>
    </Billboard>
  );
}

function RouteArc({ destination, from }: { destination: Destination; from: Destination }) {
  const points = useMemo(() => {
    const start = coordinateToVector(from.coordinates.lat, from.coordinates.lng, HOTSPOT_RADIUS);
    const end = coordinateToVector(
      destination.coordinates.lat,
      destination.coordinates.lng,
      HOTSPOT_RADIUS,
    );
    const mid = start.clone().add(end).normalize().multiplyScalar(2.24);
    const curve = new QuadraticBezierCurve3(start, mid, end);

    return curve.getPoints(38);
  }, [
    destination.coordinates.lat,
    destination.coordinates.lng,
    from.coordinates.lat,
    from.coordinates.lng,
  ]);

  return <Line color="#f8d56a" lineWidth={0.75} opacity={0.34} points={points} transparent />;
}

export function TravelGlobe({
  destinations,
  onSelectDestination,
  selectedSlug,
}: TravelGlobeProps) {
  return (
    <Canvas camera={{ fov: 38, position: [0.15, 0.28, 5.3] }} dpr={[1, 1.7]}>
      <color args={["#030712"]} attach="background" />
      <fog args={["#030712", 6, 12]} attach="fog" />
      <ambientLight intensity={0.62} />
      <directionalLight color="#fff1c0" intensity={2.7} position={[3.5, 4.2, 4.6]} />
      <pointLight color="#35f6cf" intensity={3.3} position={[-3.8, 1.4, 3.4]} />
      <pointLight color="#ff7d66" intensity={2.2} position={[2.7, -2.6, 2.8]} />
      <Stars count={1500} depth={48} factor={4.5} fade speed={0.36} />
      <GlobeCore
        destinations={destinations}
        onSelectDestination={onSelectDestination}
        selectedSlug={selectedSlug}
      />
      <OrbitControls
        autoRotate
        autoRotateSpeed={0.34}
        enableDamping
        enablePan={false}
        enableZoom={false}
        maxPolarAngle={Math.PI * 0.72}
        minPolarAngle={Math.PI * 0.28}
      />
    </Canvas>
  );
}
