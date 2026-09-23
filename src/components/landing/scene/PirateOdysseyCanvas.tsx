"use client";

import { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import OceanDunes from "./OceanDunes";
import SunsetDome from "./SunsetDome";
import GodRays from "./GodRays";
import Galleon from "./Galleon";
import FleetShips from "./FleetShips";
import SkullIsland from "./SkullIsland";
import SeaParticles from "./SeaParticles";
import MarineLife from "./MarineLife";

/** Camera rig: gentle idle swell sway + smooth spring cursor parallax. */
function CameraRig() {
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      target.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const cam = state.camera;
    const k = Math.min(1, delta * 2.5);

    // Smooth cursor parallax with breathing sea sway
    cam.position.x += (target.current.x * 1.3 + Math.sin(t * 0.22) * 0.45 - cam.position.x) * k;
    cam.position.y += (-target.current.y * 0.55 + 1.85 + Math.cos(t * 0.18) * 0.25 - cam.position.y) * k;
    cam.position.z += (12.2 - cam.position.z) * k;
    cam.lookAt(1.8, 1.4, -14);
  });

  return null;
}

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

/**
 * PirateOdysseyCanvas — authentic photorealistic PBR 3D layout:
 * - Poly Haven photorealistic sunset HDRI environment lighting
 * - Dual-layer PBR normal map water waves with physical Gerstner displacement & SSS
 * - Photorealistic Dutch galleon with authentic wood & rigging PBR materials
 * - Distant pirate armada on the sunset horizon
 * - Colossal carved Skull Mountain with glowing eyes, realistic palms & treasure
 * - Volumetric sunset God Rays & atmospheric gold embers
 */
export default function PirateOdysseyCanvas() {
  const [webgl, setWebgl] = useState<boolean | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setWebgl(detectWebGL()));
    return () => cancelAnimationFrame(id);
  }, []);

  if (webgl === null) return null;
  if (!webgl) return null;

  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 1.8, 12.2], fov: 52, near: 0.1, far: 400 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.15;
        }}
        style={{ position: "absolute", inset: 0 }}
      >
        <color attach="background" args={["#0c1524"]} />
        <fog attach="fog" args={["#16324f", 40, 220]} />

        {/* Triple physical lighting rig: warm sunset key + ambient sky fill + wave bounce fill */}
        <ambientLight intensity={0.95} color="#fef3c7" />
        <directionalLight position={[14, 8, -50]} intensity={4.2} color="#fed7aa" castShadow />
        <directionalLight position={[-10, 15, 6]} intensity={1.3} color="#38bdf8" />

        <Suspense fallback={null}>
          {/* Photorealistic Poly Haven Sunset Bay HDRI for realistic PBR environment reflections */}
          <Environment files="/hdr/golden_bay_1k.hdr" environmentRotation={[0, Math.PI * 0.42, 0]} />

          <CameraRig />

          {/* Sunset sky dome & volumetric sun rays behind Skull Mountain */}
          <SunsetDome sunPosition={[14, 8, -55]} />
          <GodRays sunPosition={[14, 8, -52]} />

          {/* Realistic normal-mapped ocean waves with Gerstner displacement & SSS */}
          <OceanDunes sunPosition={[14, 8, -35]} />

          {/* Photorealistic Dutch Flagship Galleon with firing cannon */}
          <Galleon position={[-4.2, -0.45, 1.8]} />

          {/* Distant Pirate Armada on horizon */}
          <FleetShips />

          {/* Colossal Skull Mountain with glowing eyes, realistic palms & treasure */}
          <SkullIsland position={[16, -1.0, -28]} />

          {/* Animated Leaping Dolphins & Tropical Fish Schools */}
          <MarineLife />

          {/* Golden floating embers & sea spray */}
          <SeaParticles />
        </Suspense>
      </Canvas>
    </div>
  );
}
