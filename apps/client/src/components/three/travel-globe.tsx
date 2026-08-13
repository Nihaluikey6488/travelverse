"use client";

import { Billboard, Float, Html, Line, OrbitControls, Stars } from "@react-three/drei";
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

export type TravelGlobeQuality = "balanced" | "full";

export type TravelGlobeProps = {
  destinations: Destination[];
  onSelectDestination: (slug: string) => void;
  quality?: TravelGlobeQuality;
  reducedMotion?: boolean;
  selectedSlug: string;
};

const GLOBE_RADIUS = 1.66;
const SURFACE_RADIUS = 1.79;
const INDIA_CENTER = { lat: 22.5, lng: 79 };

function coordinateToVector(lat: number, lng: number, radius = SURFACE_RADIUS) {
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
  quality = "balanced",
  reducedMotion = false,
  selectedSlug,
}: TravelGlobeProps) {
  const earthRef = useRef<Group>(null);
  const ringRef = useRef<Group>(null);
  const elapsedRef = useRef(0);
  const selectedDestination =
    destinations.find((destination) => destination.slug === selectedSlug) ?? destinations[0];
  const visibleDestinations = quality === "full" ? destinations : destinations.slice(0, 5);
  const routes = useMemo(() => {
    if (!selectedDestination) {
      return [];
    }

    return visibleDestinations
      .filter((destination) => destination.slug !== selectedDestination.slug)
      .slice(0, quality === "full" ? 5 : 3);
  }, [quality, selectedDestination, visibleDestinations]);

  useFrame((_, delta) => {
    elapsedRef.current += delta;

    if (earthRef.current && !reducedMotion) {
      earthRef.current.rotation.y += delta * (quality === "full" ? 0.035 : 0.024);
    }

    if (ringRef.current && !reducedMotion) {
      ringRef.current.rotation.z += delta * 0.08;
      ringRef.current.rotation.y -= delta * 0.025;
    }
  });

  return (
    <Float
      speed={reducedMotion ? 0 : 0.75}
      rotationIntensity={reducedMotion ? 0 : 0.08}
      floatIntensity={reducedMotion ? 0 : 0.2}
    >
      <group ref={earthRef} rotation={[0.05, -0.42, -0.08]}>
        <EarthShell quality={quality} />
        <EarthGrid quality={quality} />

        <group ref={ringRef}>
          <OrbitRing rotation={[Math.PI / 2, 0, 0]} scale={1} />
          <OrbitRing rotation={[Math.PI / 2.2, 0.45, 0.2]} scale={1.08} />
          {quality === "full" ? <OrbitRing rotation={[1.2, -0.25, 0.9]} scale={1.15} /> : null}
        </group>

        {selectedDestination
          ? routes.map((destination, index) => (
              <RouteArc
                destination={destination}
                index={index}
                key={`${selectedDestination.slug}-${destination.slug}`}
                quality={quality}
                reducedMotion={reducedMotion}
                selectedDestination={selectedDestination}
              />
            ))
          : null}

        {visibleDestinations.map((destination) => (
          <DestinationHotspot
            destination={destination}
            isSelected={destination.slug === selectedSlug}
            key={destination.slug}
            onSelectDestination={onSelectDestination}
            quality={quality}
          />
        ))}

        {visibleDestinations.map((destination) => (
          <LandmarkMiniature
            destination={destination}
            isSelected={destination.slug === selectedSlug}
            key={`${destination.slug}-miniature`}
            quality={quality}
          />
        ))}
      </group>
    </Float>
  );
}

function EarthShell({ quality }: { quality: TravelGlobeQuality }) {
  const segments = quality === "full" ? 56 : 40;

  return (
    <>
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, segments, segments]} />
        <meshStandardMaterial
          color="#071c2d"
          emissive="#08263b"
          emissiveIntensity={0.48}
          metalness={0.08}
          roughness={0.86}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS + 0.012, segments, segments]} />
        <meshBasicMaterial
          blending={AdditiveBlending}
          color="#6ee7ff"
          opacity={0.09}
          transparent
          wireframe
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS + 0.12, 36, 36]} />
        <meshBasicMaterial
          blending={AdditiveBlending}
          color="#63f6d5"
          opacity={0.14}
          side={BackSide}
          transparent
        />
      </mesh>

      <mesh position={[-0.42, 0.55, 1.47]} rotation={[0.65, -0.1, 0.24]}>
        <circleGeometry args={[0.56, 48]} />
        <meshBasicMaterial blending={AdditiveBlending} color="#8affd8" opacity={0.13} transparent />
      </mesh>
    </>
  );
}

function OrbitRing({ rotation, scale }: { rotation: [number, number, number]; scale: number }) {
  return (
    <mesh rotation={rotation} scale={scale}>
      <torusGeometry args={[GLOBE_RADIUS + 0.06, 0.0025, 8, 96]} />
      <meshBasicMaterial blending={AdditiveBlending} color="#76ffe3" opacity={0.25} transparent />
    </mesh>
  );
}

function EarthGrid({ quality }: { quality: TravelGlobeQuality }) {
  const latitudeLines = quality === "full" ? [-60, -30, 0, 30, 60] : [-45, 0, 45];
  const longitudeLines = quality === "full" ? [-120, -60, 0, 60, 120, 180] : [-90, 0, 90, 180];

  return (
    <group>
      {latitudeLines.map((lat) => (
        <Line
          color="#86fff1"
          key={`lat-${lat}`}
          lineWidth={1}
          opacity={0.16}
          points={createLatitudePoints(lat)}
          transparent
        />
      ))}
      {longitudeLines.map((lng) => (
        <Line
          color="#8ac7ff"
          key={`lng-${lng}`}
          lineWidth={1}
          opacity={0.11}
          points={createLongitudePoints(lng)}
          transparent
        />
      ))}
      <Line
        color="#ffe29b"
        lineWidth={1.2}
        opacity={0.38}
        points={createIndiaPulsePath()}
        transparent
      />
    </group>
  );
}

function createLatitudePoints(lat: number) {
  return Array.from({ length: 73 }, (_, index) => {
    const lng = -180 + index * 5;

    return coordinateToVector(lat, lng, GLOBE_RADIUS + 0.018);
  });
}

function createLongitudePoints(lng: number) {
  return Array.from({ length: 37 }, (_, index) => {
    const lat = -90 + index * 5;

    return coordinateToVector(lat, lng, GLOBE_RADIUS + 0.018);
  });
}

function createIndiaPulsePath() {
  return [
    [68, 23],
    [74, 34],
    [82, 31],
    [91, 25],
    [94, 21],
    [87, 18],
    [80, 8],
    [72, 8],
    [68, 17],
    [68, 23],
  ].map(([lng, lat]) => coordinateToVector(lat, lng, GLOBE_RADIUS + 0.035));
}

function DestinationHotspot({
  destination,
  isSelected,
  onSelectDestination,
  quality,
}: {
  destination: Destination;
  isSelected: boolean;
  onSelectDestination: (slug: string) => void;
  quality: TravelGlobeQuality;
}) {
  const markerRef = useRef<Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);
  const position = useMemo(
    () => coordinateToVector(destination.coordinates.lat, destination.coordinates.lng),
    [destination.coordinates.lat, destination.coordinates.lng],
  );

  useFrame((state) => {
    if (!markerRef.current) {
      return;
    }

    const pulse = Math.sin(state.clock.elapsedTime * 2.4 + position.x) * 0.08;
    const scale = isSelected ? 1.35 + pulse : isHovered ? 1.2 : 1;
    markerRef.current.scale.setScalar(scale);
  });

  return (
    <group position={position}>
      <Billboard>
        <mesh
          ref={markerRef}
          onClick={(event) => {
            event.stopPropagation();
            onSelectDestination(destination.slug);
          }}
          onPointerOut={() => setIsHovered(false)}
          onPointerOver={(event) => {
            event.stopPropagation();
            setIsHovered(true);
          }}
        >
          <sphereGeometry args={[isSelected ? 0.055 : 0.042, 18, 18]} />
          <meshStandardMaterial
            color={isSelected ? "#fff2a8" : "#5eead4"}
            emissive={isSelected ? "#ffb347" : "#0f766e"}
            emissiveIntensity={isSelected ? 1.4 : 0.95}
            roughness={0.38}
          />
        </mesh>

        <mesh scale={isSelected || isHovered ? 1.45 : 1}>
          <ringGeometry args={[0.065, 0.082, 32]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color={isSelected ? "#facc15" : "#67e8f9"}
            opacity={isSelected || isHovered ? 0.65 : 0.28}
            transparent
          />
        </mesh>

        {isSelected || isHovered || quality === "full" ? (
          <Html center distanceFactor={9} transform>
            <button
              className="pointer-events-auto min-w-28 rounded-2xl border border-white/15 bg-slate-950/85 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-2xl shadow-cyan-950/50 backdrop-blur-xl"
              onClick={(event) => {
                event.stopPropagation();
                onSelectDestination(destination.slug);
              }}
              type="button"
            >
              <span className="block text-teal-200">{destination.name}</span>
              <span className="block text-[8px] tracking-[0.14em] text-slate-400">
                {Math.round(
                  distanceFromIndia(destination.coordinates.lat, destination.coordinates.lng),
                )}{" "}
                km
              </span>
            </button>
          </Html>
        ) : null}
      </Billboard>
    </group>
  );
}

function RouteArc({
  destination,
  index,
  quality,
  reducedMotion,
  selectedDestination,
}: {
  destination: Destination;
  index: number;
  quality: TravelGlobeQuality;
  reducedMotion: boolean;
  selectedDestination: Destination;
}) {
  const packetRef = useRef<Mesh>(null);
  const points = useMemo(() => {
    const start = coordinateToVector(
      selectedDestination.coordinates.lat,
      selectedDestination.coordinates.lng,
      SURFACE_RADIUS,
    );
    const end = coordinateToVector(
      destination.coordinates.lat,
      destination.coordinates.lng,
      SURFACE_RADIUS,
    );
    const control = start
      .clone()
      .add(end)
      .multiplyScalar(0.5)
      .normalize()
      .multiplyScalar(SURFACE_RADIUS + 0.34 + index * 0.06);
    const curve = new QuadraticBezierCurve3(start, control, end);

    return curve.getPoints(quality === "full" ? 26 : 16);
  }, [
    destination.coordinates.lat,
    destination.coordinates.lng,
    index,
    quality,
    selectedDestination.coordinates.lat,
    selectedDestination.coordinates.lng,
  ]);

  useFrame((state) => {
    if (!packetRef.current || reducedMotion) {
      return;
    }

    const progress = (state.clock.elapsedTime * 0.16 + index * 0.23) % 1;
    const pointIndex = Math.min(points.length - 1, Math.floor(progress * points.length));
    packetRef.current.position.copy(points[pointIndex]);
  });

  return (
    <group>
      <Line
        color={index === 0 ? "#fef3c7" : "#5eead4"}
        lineWidth={index === 0 ? 1.7 : 1.2}
        opacity={index === 0 ? 0.8 : 0.45}
        points={points}
        transparent
      />
      <mesh ref={packetRef} position={points[index % points.length]}>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshBasicMaterial
          blending={AdditiveBlending}
          color={index === 0 ? "#facc15" : "#67e8f9"}
          transparent
        />
      </mesh>
    </group>
  );
}

function LandmarkMiniature({
  destination,
  isSelected,
  quality,
}: {
  destination: Destination;
  isSelected: boolean;
  quality: TravelGlobeQuality;
}) {
  const position = useMemo(() => {
    const normal = coordinateToVector(
      destination.coordinates.lat,
      destination.coordinates.lng,
    ).normalize();

    return normal.multiplyScalar(SURFACE_RADIUS + (isSelected ? 0.19 : 0.12));
  }, [destination.coordinates.lat, destination.coordinates.lng, isSelected]);
  const scale = isSelected ? 0.9 : quality === "full" ? 0.62 : 0.52;
  const modelType = getModelType(destination);

  return (
    <group position={position} scale={scale}>
      <Billboard>
        <group rotation={[0, 0, -0.05]}>
          {modelType === "coast" ? (
            <CoastModel />
          ) : modelType === "temple" ? (
            <TempleModel />
          ) : (
            <FortModel />
          )}
        </group>
      </Billboard>
    </group>
  );
}

function FortModel() {
  return (
    <group>
      <mesh position={[0, 0.035, 0]}>
        <boxGeometry args={[0.16, 0.07, 0.05]} />
        <meshStandardMaterial color="#fbbf77" emissive="#7c2d12" emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[-0.06, 0.095, 0]}>
        <boxGeometry args={[0.04, 0.08, 0.045]} />
        <meshStandardMaterial color="#fed7aa" emissive="#7c2d12" emissiveIntensity={0.16} />
      </mesh>
      <mesh position={[0.06, 0.095, 0]}>
        <boxGeometry args={[0.04, 0.08, 0.045]} />
        <meshStandardMaterial color="#fed7aa" emissive="#7c2d12" emissiveIntensity={0.16} />
      </mesh>
    </group>
  );
}

function TempleModel() {
  return (
    <group>
      <mesh position={[0, 0.035, 0]}>
        <cylinderGeometry args={[0.075, 0.09, 0.07, 6]} />
        <meshStandardMaterial color="#fde68a" emissive="#92400e" emissiveIntensity={0.16} />
      </mesh>
      <mesh position={[0, 0.105, 0]}>
        <coneGeometry args={[0.085, 0.12, 6]} />
        <meshStandardMaterial color="#f97316" emissive="#9a3412" emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

function CoastModel() {
  return (
    <group>
      <mesh position={[0, 0.025, 0]}>
        <sphereGeometry args={[0.07, 14, 8, 0, Math.PI]} />
        <meshStandardMaterial color="#67e8f9" emissive="#155e75" emissiveIntensity={0.28} />
      </mesh>
      <mesh position={[0.055, 0.085, 0]} rotation={[0, 0, -0.4]}>
        <coneGeometry args={[0.025, 0.11, 5]} />
        <meshStandardMaterial color="#34d399" emissive="#047857" emissiveIntensity={0.18} />
      </mesh>
    </group>
  );
}

function getModelType(destination: Destination) {
  const text = [
    destination.name,
    destination.region,
    destination.tagline,
    ...destination.tags,
    ...destination.culturalHighlights,
    ...destination.foodHighlights,
  ]
    .join(" ")
    .toLowerCase();

  if (text.includes("beach") || text.includes("coast") || text.includes("sea")) {
    return "coast";
  }

  if (text.includes("temple") || text.includes("spiritual") || text.includes("ghat")) {
    return "temple";
  }

  return "fort";
}

function distanceFromIndia(lat: number, lng: number) {
  const earthRadiusKm = 6371;
  const latDistance = toRadians(lat - INDIA_CENTER.lat);
  const lngDistance = toRadians(lng - INDIA_CENTER.lng);
  const startLat = toRadians(INDIA_CENTER.lat);
  const endLat = toRadians(lat);
  const a =
    Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDistance / 2) * Math.sin(lngDistance / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function toRadians(value: number) {
  return value * (Math.PI / 180);
}

function WebGlFallback({
  destinations,
  onSelectDestination,
  selectedSlug,
}: Pick<TravelGlobeProps, "destinations" | "onSelectDestination" | "selectedSlug">) {
  return (
    <div className="pointer-events-auto flex h-full min-h-[520px] items-center justify-center p-6">
      <div className="max-w-sm rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 text-white shadow-2xl shadow-black/40 backdrop-blur-2xl">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-teal-200">Smooth mode</p>
        <h2 className="mt-3 text-3xl font-black leading-tight">3D globe paused</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Browser ne WebGL context stop kiya. Aap destinations select kar sakte ho; 3D ke bina page
          smooth rahega.
        </p>
        <div className="mt-5 grid gap-2">
          {destinations.slice(0, 4).map((destination) => (
            <button
              className={[
                "rounded-2xl border px-4 py-3 text-left text-sm font-bold transition",
                destination.slug === selectedSlug
                  ? "border-teal-200/60 bg-teal-200/15 text-teal-100"
                  : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]",
              ].join(" ")}
              key={destination.slug}
              onClick={() => onSelectDestination(destination.slug)}
              type="button"
            >
              {destination.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TravelGlobe({
  destinations,
  onSelectDestination,
  quality = "balanced",
  reducedMotion = false,
  selectedSlug,
}: TravelGlobeProps) {
  const [hasWebGlFailed, setHasWebGlFailed] = useState(false);
  const starCount = quality === "full" ? 900 : 360;

  if (hasWebGlFailed) {
    return (
      <WebGlFallback
        destinations={destinations}
        onSelectDestination={onSelectDestination}
        selectedSlug={selectedSlug}
      />
    );
  }

  return (
    <div className="pointer-events-auto h-full min-h-[560px] cursor-grab active:cursor-grabbing">
      <Canvas
        camera={{ fov: 46, position: [0, 0.15, 5.35] }}
        dpr={quality === "full" ? [1, 1.15] : [1, 1]}
        frameloop={reducedMotion ? "demand" : "always"}
        gl={{
          alpha: true,
          antialias: false,
          powerPreference: "default",
          stencil: false,
        }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener(
            "webglcontextlost",
            (event) => {
              event.preventDefault();
              setHasWebGlFailed(true);
            },
            { once: true },
          );
        }}
      >
        <color args={["#030712"]} attach="background" />
        <ambientLight intensity={0.75} />
        <directionalLight color="#dffcff" intensity={1.7} position={[3, 3.5, 4]} />
        <pointLight color="#5eead4" intensity={1.4} position={[-3, -1.2, 3]} />
        <Stars
          count={starCount}
          depth={42}
          factor={quality === "full" ? 3.8 : 2.7}
          fade
          radius={34}
          saturation={0}
          speed={reducedMotion ? 0 : 0.35}
        />
        <GlobeCore
          destinations={destinations}
          onSelectDestination={onSelectDestination}
          quality={quality}
          reducedMotion={reducedMotion}
          selectedSlug={selectedSlug}
        />
        <OrbitControls
          autoRotate={false}
          enableDamping={!reducedMotion}
          enablePan={false}
          enableRotate
          enableZoom
          maxDistance={6.6}
          minDistance={3.35}
          rotateSpeed={0.7}
          zoomSpeed={0.55}
        />
      </Canvas>
    </div>
  );
}
