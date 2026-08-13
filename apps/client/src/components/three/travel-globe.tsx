"use client";

import { Billboard, Float, Html, Line, OrbitControls, Stars, useProgress } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef, useState } from "react";
import {
  AdditiveBlending,
  BackSide,
  CanvasTexture,
  QuadraticBezierCurve3,
  SRGBColorSpace,
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

type GeoPoint = [lng: number, lat: number];

const LANDMASSES: GeoPoint[][] = [
  [
    [-168, 70],
    [-138, 73],
    [-108, 62],
    [-84, 54],
    [-57, 50],
    [-50, 36],
    [-76, 26],
    [-96, 16],
    [-118, 24],
    [-128, 42],
    [-148, 58],
  ],
  [
    [-82, 12],
    [-62, 9],
    [-47, -5],
    [-38, -22],
    [-48, -54],
    [-67, -56],
    [-78, -35],
    [-75, -9],
  ],
  [
    [-24, 56],
    [-8, 70],
    [30, 71],
    [70, 63],
    [112, 66],
    [154, 53],
    [164, 34],
    [138, 16],
    [108, 8],
    [84, 23],
    [66, 8],
    [48, 24],
    [28, 38],
    [8, 36],
    [-8, 43],
  ],
  [
    [-18, 36],
    [14, 38],
    [35, 30],
    [51, 8],
    [43, -18],
    [30, -35],
    [14, -35],
    [0, -24],
    [-11, -8],
    [-16, 16],
  ],
  [
    [112, -11],
    [154, -11],
    [154, -33],
    [134, -43],
    [113, -34],
  ],
  [
    [-74, 70],
    [-52, 82],
    [-22, 76],
    [-32, 61],
    [-58, 60],
  ],
  [
    [-180, -67],
    [-132, -65],
    [-80, -69],
    [-30, -66],
    [22, -70],
    [76, -66],
    [132, -69],
    [180, -66],
    [180, -88],
    [-180, -88],
  ],
];

const INDIA_OUTLINE: GeoPoint[] = [
  [68, 23],
  [74, 34],
  [82, 31],
  [91, 25],
  [94, 21],
  [87, 18],
  [80, 8],
  [72, 8],
  [68, 17],
];

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
  const earthRef = useRef<Group>(null);
  const cloudRef = useRef<Mesh>(null);
  const gridRef = useRef<Group>(null);
  const ringsRef = useRef<Group>(null);
  const elapsedRef = useRef(0);
  const earthTexture = useMemo(() => createEarthTexture(quality), [quality]);
  const bumpTexture = useMemo(() => createEarthBumpTexture(quality), [quality]);
  const cloudTexture = useMemo(() => createCloudTexture(quality), [quality]);
  const selectedDestination =
    destinations.find((destination) => destination.slug === selectedSlug) ?? destinations[0];
  const routeLimit = quality === "full" ? destinations.length : Math.min(destinations.length, 3);

  useFrame((_, delta) => {
    elapsedRef.current += delta;
    const elapsed = elapsedRef.current;

    if (earthRef.current) {
      earthRef.current.rotation.y += reducedMotion
        ? 0
        : delta * (quality === "full" ? 0.055 : 0.035);
    }

    if (cloudRef.current) {
      cloudRef.current.rotation.y += reducedMotion ? 0 : delta * 0.028;
    }

    if (gridRef.current) {
      gridRef.current.rotation.x = reducedMotion ? 0 : Math.sin(elapsed * 0.18) * 0.012;
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
      <group ref={earthRef} rotation={[0.04, -0.34, -0.08]}>
        <mesh>
          <sphereGeometry
            args={[GLOBE_RADIUS, quality === "full" ? 96 : 64, quality === "full" ? 96 : 64]}
          />
          <meshStandardMaterial
            bumpMap={bumpTexture}
            bumpScale={quality === "full" ? 0.055 : 0.035}
            color="#ffffff"
            emissive="#07122b"
            emissiveIntensity={0.18}
            map={earthTexture}
            metalness={0.05}
            roughness={0.74}
          />
        </mesh>

        <mesh ref={cloudRef}>
          <sphereGeometry
            args={[
              GLOBE_RADIUS + 0.028,
              quality === "full" ? 96 : 48,
              quality === "full" ? 96 : 48,
            ]}
          />
          <meshStandardMaterial
            alphaMap={cloudTexture}
            blending={AdditiveBlending}
            color="#f5fbff"
            depthWrite={false}
            opacity={0.3}
            transparent
          />
        </mesh>

        <group ref={gridRef}>
          <EarthMapGrid quality={quality} />
        </group>

        <mesh>
          <sphereGeometry
            args={[
              GLOBE_RADIUS + 0.032,
              quality === "full" ? 96 : 48,
              quality === "full" ? 96 : 48,
            ]}
          />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color="#6fffe0"
            opacity={0.065}
            transparent
            wireframe
          />
        </mesh>

        <mesh>
          <sphereGeometry args={[GLOBE_RADIUS + 0.18, 96, 96]} />
          <meshBasicMaterial
            blending={AdditiveBlending}
            color="#57c8ff"
            opacity={0.16}
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

        {destinations.map((destination) => (
          <LandmarkMiniatures
            destination={destination}
            isSelected={destination.slug === selectedSlug}
            key={`landmark-${destination.slug}`}
            quality={quality}
            reducedMotion={reducedMotion}
          />
        ))}

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
        <Html center distanceFactor={8} position={[0, -0.18, 0]}>
          <button
            className={[
              "rounded-full border px-2 py-1 text-[0.55rem] font-black uppercase tracking-[0.16em] shadow-xl backdrop-blur-xl transition",
              isSelected
                ? "border-amber-200/70 bg-amber-200 text-slate-950"
                : "border-white/10 bg-slate-950/70 text-teal-100 hover:border-teal-200/60",
            ].join(" ")}
            onClick={() => onSelectDestination(destination.slug)}
            type="button"
          >
            {destination.name}
          </button>
        </Html>
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
  isSelected,
  quality,
  reducedMotion,
}: {
  destination: Destination;
  isSelected: boolean;
  quality: TravelGlobeQuality;
  reducedMotion: boolean;
}) {
  const position = useMemo(
    () =>
      coordinateToVector(
        destination.coordinates.lat,
        destination.coordinates.lng,
        HOTSPOT_RADIUS + (isSelected ? 0.28 : 0.18),
      ),
    [destination.coordinates.lat, destination.coordinates.lng, isSelected],
  );
  const variant = useMemo(() => getLandmarkVariant(destination), [destination]);
  const scale = quality === "full" ? (isSelected ? 0.23 : 0.15) : isSelected ? 0.2 : 0.12;

  return (
    <Billboard position={position}>
      <Float
        speed={reducedMotion ? 0 : 1.8}
        rotationIntensity={reducedMotion ? 0 : 0.08}
        floatIntensity={reducedMotion ? 0 : 0.24}
      >
        <group scale={scale}>
          <mesh position={[0, -0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.82, 48]} />
            <meshBasicMaterial
              color={isSelected ? "#17321d" : "#04191f"}
              opacity={isSelected ? 0.9 : 0.58}
              transparent
            />
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

function EarthMapGrid({ quality }: { quality: TravelGlobeQuality }) {
  const latitudeLines = useMemo(() => [-60, -30, 0, 30, 60], []);
  const longitudeLines = useMemo(
    () =>
      quality === "full"
        ? [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150]
        : [-120, -60, 0, 60, 120],
    [quality],
  );

  return (
    <group>
      {latitudeLines.map((lat) => (
        <Line
          color={lat === 0 ? "#9dfbed" : "#ffffff"}
          key={`lat-${lat}`}
          lineWidth={lat === 0 ? 0.55 : 0.34}
          opacity={lat === 0 ? 0.22 : 0.12}
          points={createLatitudePoints(lat)}
          transparent
        />
      ))}
      {longitudeLines.map((lng) => (
        <Line
          color="#ffffff"
          key={`lng-${lng}`}
          lineWidth={0.28}
          opacity={0.1}
          points={createLongitudePoints(lng)}
          transparent
        />
      ))}
    </group>
  );
}

function UniverseBackdrop({
  quality,
  reducedMotion,
}: {
  quality: TravelGlobeQuality;
  reducedMotion: boolean;
}) {
  const galaxyRef = useRef<Group>(null);
  const elapsedRef = useRef(0);

  useFrame((_, delta) => {
    elapsedRef.current += delta;

    if (!galaxyRef.current || reducedMotion) {
      return;
    }

    galaxyRef.current.rotation.y += delta * 0.012;
    galaxyRef.current.rotation.z = Math.sin(elapsedRef.current * 0.08) * 0.018;
  });

  return (
    <group ref={galaxyRef}>
      <mesh position={[-5.8, 2.7, -7.4]}>
        <sphereGeometry args={[quality === "full" ? 3.6 : 2.7, 32, 32]} />
        <meshBasicMaterial
          blending={AdditiveBlending}
          color="#234bff"
          depthWrite={false}
          opacity={0.16}
          side={BackSide}
          transparent
        />
      </mesh>
      <mesh position={[5.3, -2.9, -8.2]}>
        <sphereGeometry args={[quality === "full" ? 3.2 : 2.2, 32, 32]} />
        <meshBasicMaterial
          blending={AdditiveBlending}
          color="#ff7d66"
          depthWrite={false}
          opacity={0.13}
          side={BackSide}
          transparent
        />
      </mesh>
      <mesh position={[0.4, 4.1, -10.4]}>
        <sphereGeometry args={[quality === "full" ? 4.4 : 3.1, 32, 32]} />
        <meshBasicMaterial
          blending={AdditiveBlending}
          color="#35f6cf"
          depthWrite={false}
          opacity={0.1}
          side={BackSide}
          transparent
        />
      </mesh>
      <mesh rotation={[1.08, 0.18, -0.64]}>
        <torusGeometry args={[6.2, 0.018, 12, quality === "full" ? 220 : 120]} />
        <meshBasicMaterial color="#9dfbed" opacity={0.18} transparent />
      </mesh>
      <mesh rotation={[1.22, -0.25, -0.52]}>
        <torusGeometry args={[7.4, 0.012, 12, quality === "full" ? 220 : 120]} />
        <meshBasicMaterial color="#ffe38a" opacity={0.1} transparent />
      </mesh>
    </group>
  );
}

function createLatitudePoints(lat: number) {
  const points: Vector3[] = [];

  for (let lng = -180; lng <= 180; lng += 4) {
    points.push(coordinateToVector(lat, lng, GLOBE_RADIUS + 0.035));
  }

  return points;
}

function createLongitudePoints(lng: number) {
  const points: Vector3[] = [];

  for (let lat = -82; lat <= 82; lat += 4) {
    points.push(coordinateToVector(lat, lng, GLOBE_RADIUS + 0.036));
  }

  return points;
}

function createEarthTexture(quality: TravelGlobeQuality) {
  const { canvas, context } = createTextureCanvas(quality);
  const width = canvas.width;
  const height = canvas.height;
  const oceanGradient = context.createLinearGradient(0, 0, width, height);
  oceanGradient.addColorStop(0, "#07172f");
  oceanGradient.addColorStop(0.42, "#0b3d55");
  oceanGradient.addColorStop(0.7, "#06253f");
  oceanGradient.addColorStop(1, "#010914");

  context.fillStyle = oceanGradient;
  context.fillRect(0, 0, width, height);

  drawOceanTexture(context, width, height);
  drawLandmasses(context, width, height);
  drawIndiaFocus(context, width, height);
  drawMapGraticule(context, width, height);
  drawNightLights(context, width, height);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;

  return texture;
}

function createEarthBumpTexture(quality: TravelGlobeQuality) {
  const { canvas, context } = createTextureCanvas(quality);
  const width = canvas.width;
  const height = canvas.height;

  context.fillStyle = "#111111";
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#a8a8a8";
  LANDMASSES.forEach((landmass) => drawPolygon(context, landmass, width, height, true));

  context.fillStyle = "#d7d7d7";
  drawPolygon(context, INDIA_OUTLINE, width, height, true);

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;

  return texture;
}

function createCloudTexture(quality: TravelGlobeQuality) {
  const { canvas, context } = createTextureCanvas(quality);
  const width = canvas.width;
  const height = canvas.height;

  context.clearRect(0, 0, width, height);
  context.fillStyle = "rgba(255,255,255,0.28)";

  const cloudBands = [
    { lat: 42, offset: 0.04, size: 0.12 },
    { lat: 16, offset: 0.18, size: 0.09 },
    { lat: -8, offset: 0.32, size: 0.11 },
    { lat: -38, offset: 0.12, size: 0.1 },
  ];

  cloudBands.forEach((band, bandIndex) => {
    for (let index = 0; index < 13; index += 1) {
      const lng = -176 + index * 30 + bandIndex * 8;
      const lat = band.lat + Math.sin(index * 1.7 + bandIndex) * 8;
      const point = projectMapPoint(lng, lat, width, height);
      context.beginPath();
      context.ellipse(
        point.x,
        point.y,
        width * band.size * (0.75 + (index % 3) * 0.12),
        height * 0.034,
        Math.sin(index + bandIndex) * 0.42,
        0,
        Math.PI * 2,
      );
      context.fill();
    }
  });

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;

  return texture;
}

function createTextureCanvas(quality: TravelGlobeQuality) {
  const canvas = document.createElement("canvas");
  canvas.width = quality === "full" ? 2048 : 1024;
  canvas.height = canvas.width / 2;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to create Earth texture canvas context");
  }

  return { canvas, context };
}

function drawOceanTexture(context: CanvasRenderingContext2D, width: number, height: number) {
  context.save();
  context.globalAlpha = 0.22;
  context.strokeStyle = "#7bdff6";
  context.lineWidth = Math.max(1, width * 0.0008);

  for (let index = 0; index < 18; index += 1) {
    context.beginPath();
    const y = (height / 18) * index + Math.sin(index * 1.8) * height * 0.018;

    for (let x = 0; x <= width; x += 48) {
      const waveY = y + Math.sin(x * 0.012 + index) * height * 0.012;

      if (x === 0) {
        context.moveTo(x, waveY);
      } else {
        context.lineTo(x, waveY);
      }
    }

    context.stroke();
  }

  context.restore();
}

function drawLandmasses(context: CanvasRenderingContext2D, width: number, height: number) {
  LANDMASSES.forEach((landmass) => {
    const landGradient = context.createLinearGradient(0, height * 0.2, width, height * 0.82);
    landGradient.addColorStop(0, "#88a95f");
    landGradient.addColorStop(0.5, "#3f7f56");
    landGradient.addColorStop(1, "#c1a15a");

    context.fillStyle = landGradient;
    context.strokeStyle = "rgba(255,255,255,0.34)";
    context.lineWidth = Math.max(1.2, width * 0.001);
    drawPolygon(context, landmass, width, height, true);
    context.stroke();
  });
}

function drawIndiaFocus(context: CanvasRenderingContext2D, width: number, height: number) {
  context.save();
  context.fillStyle = "rgba(248, 213, 106, 0.72)";
  context.strokeStyle = "rgba(255, 255, 255, 0.78)";
  context.lineWidth = Math.max(1.6, width * 0.0012);
  drawPolygon(context, INDIA_OUTLINE, width, height, true);
  context.stroke();

  const labelPoint = projectMapPoint(78, 22, width, height);
  context.fillStyle = "rgba(255, 242, 166, 0.88)";
  context.font = `${Math.round(width * 0.014)}px sans-serif`;
  context.fillText("India", labelPoint.x + width * 0.008, labelPoint.y);
  context.restore();
}

function drawMapGraticule(context: CanvasRenderingContext2D, width: number, height: number) {
  context.save();
  context.strokeStyle = "rgba(255,255,255,0.12)";
  context.lineWidth = Math.max(0.8, width * 0.00055);

  for (let lng = -150; lng <= 150; lng += 30) {
    const start = projectMapPoint(lng, -82, width, height);
    const end = projectMapPoint(lng, 82, width, height);
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
  }

  for (let lat = -60; lat <= 60; lat += 30) {
    const start = projectMapPoint(-180, lat, width, height);
    const end = projectMapPoint(180, lat, width, height);
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
  }

  context.restore();
}

function drawNightLights(context: CanvasRenderingContext2D, width: number, height: number) {
  const lightPoints: GeoPoint[] = [
    [-74, 41],
    [-118, 34],
    [-0.1, 51.5],
    [2.3, 48.8],
    [31, 30],
    [77.2, 28.6],
    [72.8, 19.1],
    [75.8, 26.9],
    [88.4, 22.6],
    [139.7, 35.7],
    [103.8, 1.3],
  ];

  context.save();
  lightPoints.forEach(([lng, lat], index) => {
    const point = projectMapPoint(lng, lat, width, height);
    const radius = width * (0.0022 + (index % 3) * 0.0004);
    const glow = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius * 5);
    glow.addColorStop(0, "rgba(255,236,160,0.95)");
    glow.addColorStop(0.35, "rgba(255,172,93,0.34)");
    glow.addColorStop(1, "rgba(255,172,93,0)");
    context.fillStyle = glow;
    context.beginPath();
    context.arc(point.x, point.y, radius * 5, 0, Math.PI * 2);
    context.fill();
  });
  context.restore();
}

function drawPolygon(
  context: CanvasRenderingContext2D,
  points: GeoPoint[],
  width: number,
  height: number,
  closePath: boolean,
) {
  context.beginPath();

  points.forEach(([lng, lat], index) => {
    const point = projectMapPoint(lng, lat, width, height);

    if (index === 0) {
      context.moveTo(point.x, point.y);
      return;
    }

    context.lineTo(point.x, point.y);
  });

  if (closePath) {
    context.closePath();
  }

  context.fill();
}

function projectMapPoint(lng: number, lat: number, width: number, height: number) {
  return {
    x: ((lng + 180) / 360) * width,
    y: ((90 - lat) / 180) * height,
  };
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
      <fog args={["#030712", 8, 16]} attach="fog" />
      <ambientLight intensity={0.36} />
      <directionalLight color="#fff7dc" intensity={3.4} position={[4.8, 3.6, 5.2]} />
      <pointLight color="#35f6cf" intensity={2.2} position={[-4.2, 1.8, 3.8]} />
      <pointLight color="#6a8bff" intensity={1.9} position={[2.8, -3.2, 3.1]} />
      <UniverseBackdrop quality={quality} reducedMotion={reducedMotion} />
      <Stars
        count={quality === "full" ? 5200 : 1800}
        depth={72}
        factor={5.8}
        fade
        radius={80}
        saturation={0.55}
        speed={reducedMotion ? 0 : 0.22}
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
