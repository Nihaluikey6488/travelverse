"use client";

import { Billboard, Float, Html, Line, OrbitControls, Stars, useProgress } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef, useState } from "react";
import {
  AdditiveBlending,
  BackSide,
  QuadraticBezierCurve3,
  Vector3,
  type Group,
  type Mesh,
} from "three";
import type { Destination } from "@travelverse/contracts";

export type TravelGlobeQuality = "balanced" | "full";

export type TravelGlobeProps = {
  destinations: Destination[];
  onSelectDestination: (slug: string) => void;
  quality?: TravelGlobeQuality;
  reducedMotion?: boolean;
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
  quality = "full",
  reducedMotion = false,
  selectedSlug,
}: TravelGlobeProps) {
  const globeRef = useRef<Mesh>(null);
  const wireRef = useRef<Mesh>(null);
  const ringsRef = useRef<Group>(null);
  const elapsedRef = useRef(0);
  const selectedDestination =
    destinations.find((destination) => destination.slug === selectedSlug) ?? destinations[0];
  const routeLimit = quality === "full" ? destinations.length : Math.min(destinations.length, 3);

  useFrame((_, delta) => {
    elapsedRef.current += delta;
    const elapsed = elapsedRef.current;

    if (globeRef.current) {
      globeRef.current.rotation.y += reducedMotion
        ? 0
        : delta * (quality === "full" ? 0.12 : 0.075);
    }

    if (wireRef.current) {
      wireRef.current.rotation.y -= reducedMotion ? 0 : delta * 0.045;
      wireRef.current.rotation.x = reducedMotion ? 0 : Math.sin(elapsed * 0.25) * 0.025;
    }

    if (ringsRef.current) {
      ringsRef.current.rotation.z += reducedMotion ? 0 : delta * 0.085;
      ringsRef.current.rotation.y -= reducedMotion ? 0 : delta * 0.035;
    }
  });

  return (
    <Float
      speed={reducedMotion ? 0 : 1.2}
      rotationIntensity={reducedMotion ? 0 : 0.16}
      floatIntensity={reducedMotion ? 0 : 0.42}
    >
      <group rotation={[0.04, -0.34, -0.08]}>
        <mesh ref={globeRef}>
          <sphereGeometry
            args={[GLOBE_RADIUS, quality === "full" ? 96 : 64, quality === "full" ? 96 : 64]}
          />
          <meshStandardMaterial
            color="#062821"
            emissive="#05332b"
            emissiveIntensity={0.75}
            metalness={0.42}
            roughness={0.32}
          />
        </mesh>

        <mesh ref={wireRef}>
          <sphereGeometry
            args={[
              GLOBE_RADIUS + 0.012,
              quality === "full" ? 48 : 32,
              quality === "full" ? 48 : 32,
            ]}
          />
          <meshBasicMaterial color="#6fffe0" opacity={0.16} transparent wireframe />
        </mesh>

        <mesh>
          <sphereGeometry
            args={[GLOBE_RADIUS + 0.08, quality === "full" ? 96 : 48, quality === "full" ? 96 : 48]}
          />
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
              .slice(0, routeLimit)
              .map((destination) => (
                <RouteArc
                  key={`${selectedDestination.slug}-${destination.slug}`}
                  destination={destination}
                  from={selectedDestination}
                  quality={quality}
                  reducedMotion={reducedMotion}
                />
              ))
          : null}

        {selectedDestination ? (
          <LandmarkMiniatures destination={selectedDestination} reducedMotion={reducedMotion} />
        ) : null}

        {destinations.map((destination) => (
          <DestinationHotspot
            destination={destination}
            isSelected={destination.slug === selectedSlug}
            key={destination.slug}
            onSelectDestination={onSelectDestination}
            reducedMotion={reducedMotion}
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
  reducedMotion,
}: {
  destination: Destination;
  isSelected: boolean;
  onSelectDestination: (slug: string) => void;
  reducedMotion: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const pulseRef = useRef<Mesh>(null);
  const dotRef = useRef<Mesh>(null);
  const elapsedRef = useRef(0);
  const position = useMemo(
    () => coordinateToVector(destination.coordinates.lat, destination.coordinates.lng),
    [destination.coordinates.lat, destination.coordinates.lng],
  );

  useFrame((_, delta) => {
    elapsedRef.current += delta;
    const pulse = reducedMotion ? 1 : 1 + Math.sin(elapsedRef.current * 3.4) * 0.12;

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

function RouteArc({
  destination,
  from,
  quality,
  reducedMotion,
}: {
  destination: Destination;
  from: Destination;
  quality: TravelGlobeQuality;
  reducedMotion: boolean;
}) {
  const packetRef = useRef<Mesh>(null);
  const elapsedRef = useRef(0);
  const points = useMemo(() => {
    const start = coordinateToVector(from.coordinates.lat, from.coordinates.lng, HOTSPOT_RADIUS);
    const end = coordinateToVector(
      destination.coordinates.lat,
      destination.coordinates.lng,
      HOTSPOT_RADIUS,
    );
    const mid = start.clone().add(end).normalize().multiplyScalar(2.24);
    const curve = new QuadraticBezierCurve3(start, mid, end);

    return curve.getPoints(quality === "full" ? 38 : 24);
  }, [
    destination.coordinates.lat,
    destination.coordinates.lng,
    from.coordinates.lat,
    from.coordinates.lng,
    quality,
  ]);
  const phase = useMemo(
    () => (destination.slug.length + from.slug.length) * 0.037,
    [destination.slug.length, from.slug.length],
  );

  useFrame((_, delta) => {
    if (reducedMotion || !packetRef.current) {
      return;
    }

    elapsedRef.current += delta;
    const progress = (elapsedRef.current * 0.36 + phase) % 1;
    const pointIndex = Math.min(points.length - 1, Math.floor(progress * points.length));
    packetRef.current.position.copy(points[pointIndex]);
  });

  return (
    <group>
      <Line
        color="#f8d56a"
        lineWidth={quality === "full" ? 0.75 : 0.5}
        opacity={reducedMotion ? 0.22 : 0.34}
        points={points}
        transparent
      />
      <mesh ref={packetRef} position={points[0]}>
        <sphereGeometry args={[quality === "full" ? 0.024 : 0.018, 16, 16]} />
        <meshBasicMaterial color="#fff2a6" toneMapped={false} />
      </mesh>
    </group>
  );
}

function LandmarkMiniatures({
  destination,
  reducedMotion,
}: {
  destination: Destination;
  reducedMotion: boolean;
}) {
  const position = useMemo(
    () =>
      coordinateToVector(
        destination.coordinates.lat,
        destination.coordinates.lng,
        HOTSPOT_RADIUS + 0.32,
      ),
    [destination.coordinates.lat, destination.coordinates.lng],
  );
  const variant = useMemo(() => getLandmarkVariant(destination), [destination]);

  return (
    <Billboard position={position}>
      <Float
        speed={reducedMotion ? 0 : 1.8}
        rotationIntensity={reducedMotion ? 0 : 0.08}
        floatIntensity={reducedMotion ? 0 : 0.24}
      >
        <group scale={0.22}>
          <mesh position={[0, -0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.82, 48]} />
            <meshBasicMaterial color="#051f1b" opacity={0.84} transparent />
          </mesh>
          {variant === "coastal" ? <CoastalLandmark /> : null}
          {variant === "temple" ? <TempleLandmark /> : null}
          {variant === "fort" ? <FortLandmark /> : null}
        </group>
      </Float>
    </Billboard>
  );
}

function FortLandmark() {
  return (
    <group>
      <mesh position={[-0.34, 0, 0]}>
        <boxGeometry args={[0.22, 0.62, 0.28]} />
        <meshStandardMaterial color="#e9a85a" emissive="#4b210c" emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.54, 0.78, 0.34]} />
        <meshStandardMaterial color="#f4c777" emissive="#4b210c" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0.34, 0, 0]}>
        <boxGeometry args={[0.22, 0.62, 0.28]} />
        <meshStandardMaterial color="#e9a85a" emissive="#4b210c" emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[0, 0.58, 0]}>
        <coneGeometry args={[0.38, 0.28, 4]} />
        <meshStandardMaterial color="#ffdc8a" emissive="#5b2c0d" emissiveIntensity={0.22} />
      </mesh>
    </group>
  );
}

function TempleLandmark() {
  return (
    <group>
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[0.7, 0.28, 0.42]} />
        <meshStandardMaterial color="#ffe0a1" emissive="#5c2b0d" emissiveIntensity={0.16} />
      </mesh>
      <mesh position={[0, 0.34, 0]}>
        <coneGeometry args={[0.36, 0.86, 5]} />
        <meshStandardMaterial color="#f8d56a" emissive="#65410d" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, 0.88, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#7effdf" toneMapped={false} />
      </mesh>
    </group>
  );
}

function CoastalLandmark() {
  return (
    <group>
      <mesh position={[-0.2, 0.14, 0]} rotation={[0, 0, -0.28]}>
        <cylinderGeometry args={[0.045, 0.07, 0.92, 12]} />
        <meshStandardMaterial color="#b87742" emissive="#39190a" emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[-0.34, 0.66, 0]} rotation={[0, 0, 0.82]}>
        <coneGeometry args={[0.2, 0.42, 8]} />
        <meshStandardMaterial color="#64ffe1" emissive="#0c4c42" emissiveIntensity={0.34} />
      </mesh>
      <mesh position={[0.08, -0.04, 0]}>
        <torusGeometry args={[0.32, 0.038, 12, 64]} />
        <meshStandardMaterial color="#f8d56a" emissive="#6b4b10" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0.36, 0.02, 0]}>
        <sphereGeometry args={[0.12, 18, 18]} />
        <meshBasicMaterial color="#ff7d66" toneMapped={false} />
      </mesh>
    </group>
  );
}

function getLandmarkVariant(destination: Destination) {
  const labels = [
    destination.name,
    ...destination.tags,
    ...destination.culturalHighlights,
    ...destination.foodHighlights,
  ]
    .join(" ")
    .toLowerCase();

  if (labels.includes("beach") || labels.includes("nightlife") || labels.includes("coastal")) {
    return "coastal";
  }

  if (labels.includes("spiritual") || labels.includes("temple") || labels.includes("ritual")) {
    return "temple";
  }

  return "fort";
}

function SceneLoadingHud() {
  const { progress } = useProgress();
  const roundedProgress = Math.round(progress);

  return (
    <Html center>
      <div className="rounded-3xl border border-teal-100/15 bg-slate-950/80 px-5 py-4 text-center text-white shadow-2xl shadow-teal-950/40 backdrop-blur-xl">
        <div className="mx-auto mb-3 h-14 w-14 animate-pulse rounded-full border border-teal-200/50" />
        <p className="text-[0.65rem] font-black uppercase tracking-[0.24em] text-teal-100">
          Building scene
        </p>
        <p className="mt-1 text-sm font-black text-white">{roundedProgress}%</p>
      </div>
    </Html>
  );
}

export function TravelGlobe({
  destinations,
  onSelectDestination,
  quality = "full",
  reducedMotion = false,
  selectedSlug,
}: TravelGlobeProps) {
  return (
    <Canvas
      camera={{ fov: 38, position: [0.15, 0.28, 5.3] }}
      dpr={quality === "full" ? [1, 1.7] : [1, 1.25]}
      frameloop={reducedMotion ? "demand" : "always"}
      gl={{
        antialias: quality === "full",
        powerPreference: quality === "full" ? "high-performance" : "low-power",
      }}
      performance={{ min: 0.55 }}
    >
      <color args={["#030712"]} attach="background" />
      <fog args={["#030712", 6, 12]} attach="fog" />
      <ambientLight intensity={0.62} />
      <directionalLight color="#fff1c0" intensity={2.7} position={[3.5, 4.2, 4.6]} />
      <pointLight color="#35f6cf" intensity={3.3} position={[-3.8, 1.4, 3.4]} />
      <pointLight color="#ff7d66" intensity={2.2} position={[2.7, -2.6, 2.8]} />
      <Stars
        count={quality === "full" ? 1500 : 650}
        depth={48}
        factor={4.5}
        fade
        speed={reducedMotion ? 0 : 0.36}
      />
      <Suspense fallback={<SceneLoadingHud />}>
        <GlobeCore
          destinations={destinations}
          onSelectDestination={onSelectDestination}
          quality={quality}
          reducedMotion={reducedMotion}
          selectedSlug={selectedSlug}
        />
      </Suspense>
      <OrbitControls
        autoRotate={!reducedMotion}
        autoRotateSpeed={quality === "full" ? 0.34 : 0.18}
        enableDamping
        enablePan={false}
        enableZoom={false}
        maxPolarAngle={Math.PI * 0.72}
        minPolarAngle={Math.PI * 0.28}
      />
    </Canvas>
  );
}
