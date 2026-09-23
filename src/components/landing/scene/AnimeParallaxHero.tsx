"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";

/* ────────────────────────────────────────────────────────────
   Deterministic sparkle positions — avoids hydration mismatch
   from Math.random() producing different values server vs client.
   ──────────────────────────────────────────────────────────── */
interface SparkleData {
  width: number;
  height: number;
  left: number;
  top: number;
  delay: number;
  duration: number;
}

const SPARKLES: SparkleData[] = [
  { width: 3, height: 2.5, left: 15, top: 62, delay: 0, duration: 2.8 },
  { width: 2.5, height: 3, left: 28, top: 71, delay: 0.6, duration: 3.4 },
  { width: 4, height: 3.5, left: 42, top: 58, delay: 1.2, duration: 2.2 },
  { width: 2, height: 2, left: 55, top: 66, delay: 1.8, duration: 4.1 },
  { width: 3.5, height: 3, left: 68, top: 74, delay: 2.4, duration: 3.0 },
  { width: 2.8, height: 2.2, left: 80, top: 60, delay: 3.0, duration: 2.6 },
  { width: 3.2, height: 3.8, left: 22, top: 78, delay: 3.5, duration: 3.8 },
  { width: 2.6, height: 2.4, left: 48, top: 82, delay: 0.3, duration: 4.5 },
  { width: 3.8, height: 3, left: 72, top: 56, delay: 1.5, duration: 2.4 },
  { width: 2.4, height: 3.2, left: 35, top: 68, delay: 2.1, duration: 3.6 },
  { width: 3, height: 2.8, left: 85, top: 70, delay: 0.9, duration: 4.0 },
  { width: 2.2, height: 3.4, left: 60, top: 85, delay: 2.7, duration: 3.2 },
];

/* ────────────────────────────────────────────────────────────
   Layer definitions — each layer has its own wrapper position
   so the image fills THAT specific region, not the full viewport.
   ──────────────────────────────────────────────────────────── */
interface ParallaxLayer {
  id: string;
  src: string;
  alt: string;
  depth: number;
  zIndex: number;
  /** CSS for the wrapper div that constrains this layer's region */
  wrapperStyle: React.CSSProperties;
  /** Object-fit/position on the Image */
  objectFit: "cover" | "contain";
  objectPosition: string;
  animationClass: string;
}

const LAYERS: ParallaxLayer[] = [
  {
    id: "sky",
    src: "/images/hero/sky-clouds.jpg",
    alt: "Anime sky with fluffy clouds",
    depth: 0.02,
    zIndex: 1,
    wrapperStyle: { inset: "-2%", width: "104%", height: "104%" },
    objectFit: "cover",
    objectPosition: "center center",
    animationClass: "animate-clouds-drift",
  },
  {
    id: "midground-ocean",
    src: "/images/hero/ocean-midground.jpg",
    alt: "Calm midground ocean",
    depth: 0.04,
    zIndex: 2,
    wrapperStyle: { left: "-2%", right: "-2%", bottom: "-2%", height: "62%", width: "104%" },
    objectFit: "cover",
    objectPosition: "center top",
    animationClass: "animate-waves-gentle",
  },
  {
    id: "island",
    src: "/images/hero/island.jpg",
    alt: "Tropical island with palm trees",
    depth: 0.06,
    zIndex: 3,
    wrapperStyle: { right: "-4%", bottom: "-2%", width: "72%", height: "90%" },
    objectFit: "cover",
    objectPosition: "right bottom",
    animationClass: "",
  },
  {
    id: "ship",
    src: "/images/hero/pirate-ship.jpg",
    alt: "Going Merry pirate ship",
    depth: 0.08,
    zIndex: 4,
    wrapperStyle: { left: "-6%", bottom: "5%", width: "58%", height: "65%" },
    objectFit: "cover",
    objectPosition: "center bottom",
    animationClass: "animate-ship-sail",
  },
  {
    id: "foreground-ocean",
    src: "/images/hero/ocean-foreground.jpg",
    alt: "Deep blue ocean waves foreground",
    depth: 0.12,
    zIndex: 5,
    wrapperStyle: { left: "-2%", right: "-2%", bottom: "-3%", height: "42%", width: "104%" },
    objectFit: "cover",
    objectPosition: "center bottom",
    animationClass: "animate-waves-strong",
  },
];

/**
 * AnimeParallaxHero — Animated multi-layer parallax background
 * recreating the One Piece anime ocean scene with:
 * - Mouse-reactive parallax depth on all layers
 * - CSS-animated wave motion (foreground + midground)
 * - Drifting clouds in the sky
 * - Ship bobbing/sailing animation
 * - Gradient overlays for seamless layer blending
 * - Deterministic sparkle particles (no hydration mismatch)
 */
export default function AnimeParallaxHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const layerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);

  const setLayerRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      layerRefs.current.set(id, el);
    }
  }, []);

  const handleImageLoad = useCallback(() => {
    setLoadedCount((prev) => {
      const next = prev + 1;
      if (next >= LAYERS.length) {
        setIsLoaded(true);
      }
      return next;
    });
  }, []);

  // Mouse parallax
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = (e.clientX - rect.left) / rect.width - 0.5;
      mouseRef.current.y = (e.clientY - rect.top) / rect.height - 0.5;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // rAF parallax animation loop
  useEffect(() => {
    const currentPos = { x: 0, y: 0 };

    const animate = () => {
      const k = 0.06;
      currentPos.x += (mouseRef.current.x - currentPos.x) * k;
      currentPos.y += (mouseRef.current.y - currentPos.y) * k;

      LAYERS.forEach((layer) => {
        const el = layerRefs.current.get(layer.id);
        if (!el) return;
        const moveX = currentPos.x * layer.depth * -60;
        const moveY = currentPos.y * layer.depth * -30;
        el.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden bg-[#0a1628]"
      aria-hidden="true"
    >
      {/* Loading skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a1628] transition-opacity duration-700">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-amber-300/60">
              Charting the seas… ({loadedCount}/{LAYERS.length})
            </span>
          </div>
        </div>
      )}

      {/* Parallax layer stack — each layer is positioned within its own region */}
      {LAYERS.map((layer) => (
        <div
          key={layer.id}
          ref={(el) => setLayerRef(layer.id, el)}
          className={`will-change-transform transition-opacity duration-1000 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          style={{
            position: "absolute",
            zIndex: layer.zIndex,
            ...layer.wrapperStyle,
          }}
        >
          <div className={`relative w-full h-full ${layer.animationClass}`}>
            <Image
              src={layer.src}
              alt={layer.alt}
              fill
              sizes="100vw"
              priority={layer.id === "sky"}
              quality={90}
              style={{ objectFit: layer.objectFit, objectPosition: layer.objectPosition }}
              onLoad={handleImageLoad}
            />
          </div>
        </div>
      ))}

      {/* Gradient blend: sky ↔ ocean transition */}
      <div
        className="pointer-events-none absolute inset-x-0 top-[35%] h-[28%] z-[6]"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(10,22,40,0.35) 45%, rgba(10,22,40,0.5) 65%, transparent 100%)",
        }}
      />

      {/* Bottom ocean depth darkening */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[18%] z-[8]"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(5,12,25,0.55) 100%)",
        }}
      />

      {/* Sunlight glow from the left */}
      <div
        className="pointer-events-none absolute inset-0 z-[9]"
        style={{
          background:
            "radial-gradient(ellipse at 8% 28%, rgba(255,200,100,0.1) 0%, transparent 50%)",
        }}
      />

      {/* Deterministic sparkle particles — no Math.random(), no hydration mismatch */}
      <div className="pointer-events-none absolute inset-0 z-[7] animate-sparkle-float">
        {SPARKLES.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/40 animate-sparkle-twinkle"
            style={{
              width: `${s.width}px`,
              height: `${s.height}px`,
              left: `${s.left}%`,
              top: `${s.top}%`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
