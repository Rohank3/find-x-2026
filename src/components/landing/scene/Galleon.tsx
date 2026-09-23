"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

/**
 * Galleon — photorealistic Dutch 17th-century galleon:
 * - Mathematically locked to the true world-coordinate Gerstner waves in OceanDunes.tsx
 * - Never flies, never sinks; rides wave swells with authentic nautical inertia
 * - Turned proudly toward Skull Island cutting through the waves on a starboard tack
 * - Rich mahogany / teak hull, sunlit golden canvas sails, brass lanterns,
 *   and firing starboard cannon with smoke.
 */

// Exact Gerstner wave formulation evaluated in true world coordinates
function getWaveHeight(x: number, z: number, t: number): number {
  const waves = [
    { dir: [1.0, 0.25], steep: 0.16, wlen: 24.0, speedMult: 1.0 },
    { dir: [0.78, -0.48], steep: 0.17, wlen: 15.0, speedMult: 1.18 },
    { dir: [0.52, 0.74], steep: 0.12, wlen: 8.0, speedMult: 1.42 },
    { dir: [-0.28, 0.94], steep: 0.08, wlen: 4.2, speedMult: 1.85 },
  ];

  let h = 0;
  for (const w of waves) {
    const k = 6.2831853 / w.wlen;
    const c = Math.sqrt(9.80665 / k);
    const len = Math.hypot(w.dir[0], w.dir[1]);
    const dx = w.dir[0] / len;
    const dz = w.dir[1] / len;
    const f = k * (dx * x + dz * z - c * t * w.speedMult);
    const a = w.steep / k;
    h += a * Math.sin(f);
  }
  return h;
}

interface GalleonProps {
  position?: [number, number, number];
}

export default function Galleon({ position = [-4.2, -0.45, 1.8] }: GalleonProps) {
  const group = useRef<THREE.Group>(null);
  const flashLight = useRef<THREE.PointLight>(null);
  const flashMesh = useRef<THREE.Mesh>(null);
  const smokePuffs = useRef<THREE.Group>(null);
  const flagMesh = useRef<THREE.Mesh>(null);

  // Load realistic PBR galleon model
  const { scene } = useGLTF("/models/realistic_ship.glb");

  const ship = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.material) {
          const origMat = mesh.material as THREE.MeshStandardMaterial;
          const mat = origMat.clone();
          mesh.material = mat;
          mat.envMapIntensity = 1.4;

          if (mesh.name.includes("hull")) {
            mat.color = new THREE.Color("#d4976a");
            mat.roughness = 0.52;
            mat.metalness = 0.15;
          } else if (mesh.name.includes("sails")) {
            mat.color = new THREE.Color("#fff2df");
            mat.roughness = 0.72;
            mat.metalness = 0.04;
          } else if (mesh.name.includes("rigging")) {
            mat.color = new THREE.Color("#3e3229");
            mat.roughness = 0.92;
            mat.metalness = 0.05;
          }
          mat.needsUpdate = true;
        }
      }
    });
    return clone;
  }, [scene]);

  // Cannon firing cycle
  const cannonState = useRef({ timer: 0, nextBurst: 2.2, flash: 0 });

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;

    const posX = position[0];
    const posZ = position[2];
    const h = getWaveHeight(posX, posZ, t);

    // Heading vector toward Skull Island (bow is +X rotated by baseHeading)
    const baseHeading = 0.92;
    const bowDist = 3.5;
    const bowX = posX + Math.cos(baseHeading) * bowDist;
    const bowZ = posZ - Math.sin(baseHeading) * bowDist;
    const sternX = posX - Math.cos(baseHeading) * bowDist;
    const sternZ = posZ + Math.sin(baseHeading) * bowDist;

    const beamDist = 1.8;
    const portX = posX - Math.sin(baseHeading) * beamDist;
    const portZ = posZ - Math.cos(baseHeading) * beamDist;
    const starX = posX + Math.sin(baseHeading) * beamDist;
    const starZ = posZ + Math.cos(baseHeading) * beamDist;

    const hBow = getWaveHeight(bowX, bowZ, t);
    const hStern = getWaveHeight(sternX, sternZ, t);
    const hPort = getWaveHeight(portX, portZ, t);
    const hStar = getWaveHeight(starX, starZ, t);

    // Exact lockstep with water surface at y = -1.0 + h
    const targetY = -1.0 + h + 0.36;
    g.position.y = THREE.MathUtils.lerp(g.position.y, targetY, 0.22);

    // Smooth nautical pitch & roll
    const targetPitch = Math.atan2(hBow - hStern, bowDist * 2.0) * 0.65;
    const targetRoll = Math.atan2(hPort - hStar, beamDist * 2.0) * 0.55;

    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, targetPitch, 0.12);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, targetRoll, 0.12);
    g.rotation.y = baseHeading + Math.sin(t * 0.22) * 0.025;

    // Masthead flag fluttering in sea wind
    if (flagMesh.current) {
      flagMesh.current.rotation.y = Math.sin(t * 5.2) * 0.28;
      flagMesh.current.rotation.z = Math.cos(t * 3.8) * 0.15;
    }

    // Cannon burst management
    cannonState.current.timer += delta;
    if (cannonState.current.timer > cannonState.current.nextBurst) {
      cannonState.current.flash = 1.0;
      cannonState.current.nextBurst = cannonState.current.timer + 3.8 + Math.random() * 2.2;
    }

    if (cannonState.current.flash > 0.01) {
      cannonState.current.flash *= 0.86;
    }
    const f = cannonState.current.flash;
    if (flashLight.current) flashLight.current.intensity = f * 38;
    if (flashMesh.current) {
      flashMesh.current.scale.setScalar(f * 2.2);
      (flashMesh.current.material as THREE.MeshBasicMaterial).opacity = f;
    }

    // Expanding smoke puffs drifting back
    if (smokePuffs.current) {
      smokePuffs.current.children.forEach((puff, idx) => {
        puff.position.z += delta * (1.8 + idx * 0.3);
        puff.position.y += delta * 0.45;
        puff.scale.addScalar(delta * 0.55);
        const mat = (puff as THREE.Mesh).material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, mat.opacity - delta * 0.45);
        if (mat.opacity <= 0.01 && f > 0.8) {
          puff.position.set(0, 0, 0);
          puff.scale.setScalar(0.35);
          mat.opacity = 0.65;
        }
      });
    }
  });

  return (
    <group ref={group} position={position} scale={0.52}>
      {/* Photorealistic Textured Galleon */}
      <primitive object={ship} position={[0, 0, 0]} />

      {/* Main Masthead Crimson/Black Pirate Pennant */}
      <mesh ref={flagMesh} position={[0.2, 16.8, 0]} rotation={[0, 0, 0.05]}>
        <planeGeometry args={[1.8, 0.8]} />
        <meshStandardMaterial
          color="#991b1b"
          roughness={0.7}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Firing Starboard Cannon & Smoke Flash */}
      <group position={[1.8, 2.2, 1.8]} rotation={[0, Math.PI / 2, 0]}>
        <pointLight ref={flashLight} color="#f97316" distance={24} decay={2} intensity={0} />
        <mesh ref={flashMesh}>
          <sphereGeometry args={[0.55, 14, 14]} />
          <meshBasicMaterial color="#fef08a" transparent opacity={0} />
        </mesh>
        <group ref={smokePuffs}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, 0, i * 0.3]}>
              <sphereGeometry args={[0.45, 10, 10]} />
              <meshBasicMaterial color="#e2e8f0" transparent opacity={0} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Warm Incandescent Ship Lanterns */}
      <group position={[-8.6, 8.2, 0]}>
        <mesh>
          <cylinderGeometry args={[0.18, 0.24, 0.5, 8]} />
          <meshStandardMaterial color="#78350f" metalness={0.8} roughness={0.3} />
        </mesh>
        <pointLight color="#f59e0b" intensity={9} distance={18} decay={2} />
      </group>

      <group position={[-2.4, 4.8, 2.6]}>
        <pointLight color="#fbbf24" intensity={4.5} distance={12} decay={2} />
      </group>

      <group position={[-2.4, 4.8, -2.6]}>
        <pointLight color="#fbbf24" intensity={4.5} distance={12} decay={2} />
      </group>

      <group position={[7.5, 4.2, 0]}>
        <pointLight color="#f59e0b" intensity={6} distance={14} decay={2} />
      </group>
    </group>
  );
}

useGLTF.preload("/models/realistic_ship.glb");
