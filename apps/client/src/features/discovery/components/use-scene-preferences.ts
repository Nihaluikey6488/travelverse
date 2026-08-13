"use client";

import { useEffect, useState } from "react";
import type { TravelGlobeQuality } from "@/components/three/travel-globe";

type NetworkInformation = {
  effectiveType?: string;
  saveData?: boolean;
};

type NavigatorWithPerformanceHints = Navigator & {
  connection?: NetworkInformation;
  deviceMemory?: number;
};

type ScenePreferences = {
  fallbackReason: string;
  hasHydrated: boolean;
  isCompactViewport: boolean;
  isLowPower: boolean;
  prefersReducedMotion: boolean;
  quality: TravelGlobeQuality;
  shouldUseFallback: boolean;
};

const initialPreferences: ScenePreferences = {
  fallbackReason: "Preparing visual mode",
  hasHydrated: false,
  isCompactViewport: false,
  isLowPower: false,
  prefersReducedMotion: false,
  quality: "full",
  shouldUseFallback: false,
};

export function useScenePreferences() {
  const [preferences, setPreferences] = useState<ScenePreferences>(initialPreferences);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compactViewportQuery = window.matchMedia("(max-width: 860px)");
    const coarsePointerQuery = window.matchMedia("(pointer: coarse)");

    function readPreferences() {
      const navigatorHints = window.navigator as NavigatorWithPerformanceHints;
      const effectiveType = navigatorHints.connection?.effectiveType ?? "";
      const isSlowConnection = ["slow-2g", "2g", "3g"].includes(effectiveType);
      const isLowMemory =
        typeof navigatorHints.deviceMemory === "number" && navigatorHints.deviceMemory <= 4;
      const isSavingData = Boolean(navigatorHints.connection?.saveData);
      const prefersReducedMotion = reducedMotionQuery.matches;
      const isCompactViewport = compactViewportQuery.matches || coarsePointerQuery.matches;
      const isLowPower = isLowMemory || isSavingData || isSlowConnection;
      const shouldUseFallback = prefersReducedMotion || isCompactViewport || isLowPower;
      const fallbackReason = prefersReducedMotion
        ? "Reduced-motion friendly mode"
        : isLowPower
          ? "Low-power device mode"
          : isCompactViewport
            ? "Mobile-friendly mode"
            : "Full WebGL scene";

      setPreferences({
        fallbackReason,
        hasHydrated: true,
        isCompactViewport,
        isLowPower,
        prefersReducedMotion,
        quality: isCompactViewport || isLowPower ? "balanced" : "full",
        shouldUseFallback,
      });
    }

    readPreferences();

    const watchedQueries = [reducedMotionQuery, compactViewportQuery, coarsePointerQuery];
    watchedQueries.forEach((query) => query.addEventListener("change", readPreferences));

    return () => {
      watchedQueries.forEach((query) => query.removeEventListener("change", readPreferences));
    };
  }, []);

  return preferences;
}
