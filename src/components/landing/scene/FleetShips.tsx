"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

/**
 * FleetShips — enlarged photorealistic distant armada ships cruising
 * along the horizon under the golden sunset, all sailing toward Skull Island.
 */
export default function FleetShips() {
  const { scene } = useGLTF("/models/realistic_ship.glb");

  const shipBase = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) {
        const m = c as THREE.Mesh;
        if (m.material) {
          const mat = (m.material as THREE.MeshStandardMaterial).clone();
          mat.envMapIntensity = 1.3;
          if (m.name.includes("hull")) {
            mat.color = new THREE.Color("#9a5b28");
            mat.roughness = 0.55;
          } else if (m.name.includes("sails")) {
            mat.color = new THREE.Color("#fed7aa");
            mat.roughness = 0.7;
          }
          m.material = mat;
        }
      }
    });
    return clone;
  }, [scene]);

  const ship1 = useMemo(() => shipBase.clone(true), [shipBase]);
  const ship2 = useMemo(() => shipBase.clone(true), [shipBase]);
  const ship3 = useMemo(() => shipBase.clone(true), [shipBase]);

  return (
    <group>
      {/* 1. Mid-distance fleet galleon on port horizon — sailing toward Skull Island */}
      <group position={[-16, -0.35, -24]} scale={0.22} rotation={[0.02, 0.45, 0]}>
        <primitive object={ship1} />
        <pointLight position={[-8.5, 8.2, 0]} color="#f59e0b" intensity={8} distance={16} />
      </group>

      {/* 2. Deep horizon flagship — sailing toward Skull Island */}
      <group position={[-28, -0.45, -44]} scale={0.16} rotation={[0.01, 0.28, 0]}>
        <primitive object={ship2} />
        <pointLight position={[-8.5, 8.2, 0]} color="#f59e0b" intensity={5} distance={14} />
      </group>

      {/* 3. Distant escort frigate — sailing toward Skull Island */}
      <group position={[-7, -0.38, -34]} scale={0.13} rotation={[0.02, 0.55, 0]}>
        <primitive object={ship3} />
        <pointLight position={[-8.5, 8.2, 0]} color="#fbbf24" intensity={4} distance={12} />
      </group>
    </group>
  );
}

useGLTF.preload("/models/realistic_ship.glb");
