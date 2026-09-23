"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import RealisticPalmTree from "./RealisticPalmTree";

/**
 * SkullIsland — fully grounded, expansive photorealistic Treasure Island:
 * - Solid continuous island landmass (68 x 56 units) anchored deep into the ocean bed
 * - Authentic 1K Poly Haven PBR coast sand textures (diffuse, normal, ARM) with warm Caribbean tone
 * - Grounded granite cliff mountain massifs starting below sea level (zero flying rocks)
 * - Colossal 84K-triangle sculpted granite Skull Mountain carved into the stone face
 * - Sinister amber/fire glow radiating from inside hollow carved stone eye sockets
 * - Natural tropical coconut palms with curved wooden trunks and feathery fronds
 * - Secret pirate treasure cove on the golden beach with chests, doubloons, and gems
 */

interface SkullIslandProps {
  position?: [number, number, number];
}

export default function SkullIsland({ position = [16, -1.0, -28] }: SkullIslandProps) {
  const eyeL = useRef<THREE.PointLight>(null);
  const eyeR = useRef<THREE.PointLight>(null);

  // 1. Load Photorealistic 3D Models
  const { scene: cliffScene } = useGLTF("/models/realistic_cliff.glb");
  const { scene: skullScene } = useGLTF("/models/realistic_skull.glb");
  const { scene: chestScene } = useGLTF("/models/chest.glb");

  // 2. Load Cliff Rock PBR Textures
  const rawDiff = useTexture("/textures/cliff_diff_1k.jpg");
  const rawNor = useTexture("/textures/cliff_nor_1k.jpg");
  const rawArm = useTexture("/textures/cliff_arm_1k.jpg");

  // 3. Load Beach Sand PBR Textures
  const rawSandDiff = useTexture("/textures/sand_diff_1k.jpg");
  const rawSandNor = useTexture("/textures/sand_nor_1k.jpg");
  const rawSandArm = useTexture("/textures/sand_arm_1k.jpg");

  // Cloned textures configured safely for React 19 immutability
  const { diffTex, norTex, armTex } = useMemo(() => {
    const diff = rawDiff.clone();
    diff.wrapS = THREE.RepeatWrapping;
    diff.wrapT = THREE.RepeatWrapping;
    diff.repeat.set(4.0, 4.0);
    diff.needsUpdate = true;

    const nor = rawNor.clone();
    nor.wrapS = THREE.RepeatWrapping;
    nor.wrapT = THREE.RepeatWrapping;
    nor.repeat.set(4.0, 4.0);
    nor.needsUpdate = true;

    const arm = rawArm.clone();
    arm.wrapS = THREE.RepeatWrapping;
    arm.wrapT = THREE.RepeatWrapping;
    arm.repeat.set(4.0, 4.0);
    arm.needsUpdate = true;

    return { diffTex: diff, norTex: nor, armTex: arm };
  }, [rawDiff, rawNor, rawArm]);

  const { sandDiff, sandNor, sandArm } = useMemo(() => {
    const diff = rawSandDiff.clone();
    diff.wrapS = THREE.RepeatWrapping;
    diff.wrapT = THREE.RepeatWrapping;
    diff.repeat.set(7.0, 7.0);
    diff.needsUpdate = true;

    const nor = rawSandNor.clone();
    nor.wrapS = THREE.RepeatWrapping;
    nor.wrapT = THREE.RepeatWrapping;
    nor.repeat.set(7.0, 7.0);
    nor.needsUpdate = true;

    const arm = rawSandArm.clone();
    arm.wrapS = THREE.RepeatWrapping;
    arm.wrapT = THREE.RepeatWrapping;
    arm.repeat.set(7.0, 7.0);
    arm.needsUpdate = true;

    return { sandDiff: diff, sandNor: nor, sandArm: arm };
  }, [rawSandDiff, rawSandNor, rawSandArm]);

  // Master Weathered Granite Rock Material
  const stoneMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: diffTex,
      normalMap: norTex,
      normalScale: new THREE.Vector2(1.8, 1.8),
      roughnessMap: armTex,
      roughness: 0.88,
      metalness: 0.05,
      color: "#7e766a",
      envMapIntensity: 0.8,
    });
  }, [diffTex, norTex, armTex]);

  // 4. EXPANSIVE PROCEDURAL ISLAND TERRAIN WITH PBR CARIBBEAN SAND
  const islandTerrain = useMemo(() => {
    const width = 68;
    const height = 56;
    const segX = 64;
    const segY = 52;
    const geo = new THREE.PlaneGeometry(width, height, segX, segY);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const angle = Math.atan2(y, x);
      const distNorm = Math.hypot(x / 32, y / 26);

      // Organic shoreline footprint with natural bays and points
      const coastShape =
        0.92 +
        0.18 * Math.sin(angle * 3.0) +
        0.11 * Math.cos(angle * 5.0 + 1.2) +
        0.06 * Math.sin(angle * 7.0);

      let elev = -3.2; // Submerged deep sea bed

      if (distNorm < coastShape) {
        const t = Math.max(0, Math.min(1, 1.0 - distNorm / coastShape)); // 0 at coast, 1 at center
        // Beach rise (0 to 1.6)
        const beach = Math.sin(t * Math.PI * 0.5) * 1.6;
        // Jungle plateau rise (1.6 to 6.0)
        const jungle = Math.pow(t, 1.7) * 6.5;
        // Central mountain ridge foundation (6.0 to 13.5)
        const ridgeBase = Math.max(
          0,
          1.0 - Math.abs(x - 2.0) / 16 - Math.abs(y - 1.0) / 14
        );
        const mountainRidge = Math.pow(ridgeBase, 1.6) * 6.2;

        elev = -0.95 + beach + jungle + mountainRidge;
      }

      pos.setZ(i, elev);
    }

    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    return geo;
  }, []);

  // Authentic Poly Haven 1K PBR Beach Sand Material (Rich warm golden sand with natural micro-ripples)
  const terrainMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: sandDiff,
      normalMap: sandNor,
      normalScale: new THREE.Vector2(1.5, 1.5),
      roughnessMap: sandArm,
      roughness: 0.94,
      metalness: 0.02,
      color: "#e2a968",
      envMapIntensity: 0.4,
    });
  }, [sandDiff, sandNor, sandArm]);

  // Mountain Cliff Formations from Poly Haven 3D scan (anchored into ground)
  const cliffMain = useMemo(() => {
    const clone = cliffScene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.material = stoneMat;
      }
    });
    return clone;
  }, [cliffScene, stoneMat]);

  const cliffLeft = useMemo(() => cliffMain.clone(true), [cliffMain]);
  const cliffRight = useMemo(() => cliffMain.clone(true), [cliffMain]);
  const cliffSummit = useMemo(() => cliffMain.clone(true), [cliffMain]);
  const cliffBreaker = useMemo(() => cliffMain.clone(true), [cliffMain]);

  // Sculpted 84K-polygon Realistic Skull seamlessly textured as carved granite
  const skull = useMemo(() => {
    const clone = skullScene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.material = stoneMat;
      }
    });
    return clone;
  }, [skullScene, stoneMat]);

  // Authentic Pirate Chests
  const chestA = useMemo(() => {
    const clone = chestScene.clone(true);
    clone.scale.set(0.06, 0.06, 0.06);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.material = new THREE.MeshStandardMaterial({
          color: "#78350f",
          roughness: 0.48,
          metalness: 0.35,
        });
      }
    });
    return clone;
  }, [chestScene]);

  const chestB = useMemo(() => chestA.clone(true), [chestA]);

  // Glistening Pirate Gold Material
  const goldMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#fbbf24",
        metalness: 0.95,
        roughness: 0.15,
        envMapIntensity: 2.4,
      }),
    []
  );

  // Ruby Gem Material
  const rubyMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#dc2626",
        roughness: 0.08,
        metalness: 0.45,
        envMapIntensity: 2.5,
      }),
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Sinister eye pulsing radiance from INSIDE the hollow carved stone sockets
    const pulse = 0.8 + 0.2 * Math.sin(t * 2.8);
    const flicker = 0.92 + 0.08 * Math.sin(t * 11.5);
    const intensity = 28 * pulse * flicker;

    if (eyeL.current) eyeL.current.intensity = intensity;
    if (eyeR.current) eyeR.current.intensity = intensity * 1.05;
  });

  return (
    <group position={position}>
      {/* 1. EXPANSIVE CONTINENTAL ISLAND TERRAIN BASE (Poly Haven 1K PBR Sand) */}
      <mesh geometry={islandTerrain} material={terrainMat} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />

      {/* 2. GROUNDED GRANITE MOUNTAIN CLIFFS (Starting below sea level - zero flying rocks) */}
      <group position={[0.5, 0.8, -3.5]} scale={14.0} rotation={[-0.08, 0.35, 0.05]}>
        <primitive object={cliffMain} />
      </group>

      <group position={[-12.5, -0.5, 1.0]} scale={11.5} rotation={[0.12, -0.6, -0.08]}>
        <primitive object={cliffLeft} />
      </group>

      <group position={[12.5, -0.4, -4.0]} scale={12.0} rotation={[-0.18, 1.1, 0.04]}>
        <primitive object={cliffRight} />
      </group>

      <group position={[2.0, 5.5, -7.5]} scale={12.5} rotation={[0.25, -0.35, 0.15]}>
        <primitive object={cliffSummit} />
      </group>

      <group position={[-4.5, -0.8, 5.5]} scale={7.5} rotation={[0.05, 0.8, 0]}>
        <primitive object={cliffBreaker} />
      </group>

      {/* 3. COLOSSAL 84K-POLYGON CARVED GRANITE SKULL IN MOUNTAIN FACE */}
      <group position={[0.2, 5.5, 1.6]} scale={19.5} rotation={[0.05, -0.28, 0.02]}>
        <primitive object={skull} />

        <pointLight
          ref={eyeL}
          position={[-0.082, 0.038, 0.36]}
          color="#f59e0b"
          distance={28}
          decay={2}
        />

        <pointLight
          ref={eyeR}
          position={[0.082, 0.038, 0.36]}
          color="#f59e0b"
          distance={28}
          decay={2}
        />

        <pointLight position={[0, -0.05, 0.18]} color="#ea580c" intensity={18} distance={18} decay={2} />
      </group>

      {/* 4. NATURAL HIGH-QUALITY COCONUT PALM GROVES */}
      <RealisticPalmTree position={[-14.5, 0.1, 8.5]} scale={1.05} rotationY={0.6} curveAmount={1.4} curveDir={0.4} tiltZ={0.12} />
      <RealisticPalmTree position={[-11.5, 0.4, 11.5]} scale={0.95} rotationY={1.8} curveAmount={1.1} curveDir={1.2} tiltZ={-0.08} />
      <RealisticPalmTree position={[-17.0, -0.1, 5.5]} scale={1.15} rotationY={3.1} curveAmount={1.6} curveDir={-0.3} tiltZ={0.15} />
      <RealisticPalmTree position={[-8.5, 0.7, 9.5]} scale={0.9} rotationY={4.2} curveAmount={1.0} curveDir={0.8} tiltZ={-0.1} />

      <RealisticPalmTree position={[-4.5, 1.6, 6.2]} scale={0.95} rotationY={0.9} curveAmount={1.2} curveDir={0.5} tiltZ={0.06} />
      <RealisticPalmTree position={[4.8, 1.8, 6.8]} scale={1.0} rotationY={2.2} curveAmount={1.3} curveDir={-0.6} tiltZ={-0.12} />
      <RealisticPalmTree position={[-1.5, 2.5, 4.2]} scale={0.85} rotationY={1.4} curveAmount={0.9} curveDir={0.2} tiltZ={-0.05} />

      <RealisticPalmTree position={[14.5, 0.2, 6.5]} scale={1.1} rotationY={1.5} curveAmount={1.5} curveDir={-0.8} tiltZ={-0.14} />
      <RealisticPalmTree position={[17.2, 0.0, 4.2]} scale={1.0} rotationY={2.9} curveAmount={1.3} curveDir={1.1} tiltZ={0.08} />
      <RealisticPalmTree position={[11.8, 0.5, 9.8]} scale={0.92} rotationY={4.1} curveAmount={1.1} curveDir={-0.4} tiltZ={-0.1} />

      <RealisticPalmTree position={[0.2, 0.4, 12.5]} scale={0.98} rotationY={0.3} curveAmount={1.3} curveDir={0.1} tiltZ={0.08} />
      <RealisticPalmTree position={[3.2, 0.3, 11.2]} scale={0.88} rotationY={2.5} curveAmount={1.0} curveDir={-0.5} tiltZ={-0.06} />

      {/* 5. SECRET PIRATE TREASURE COVE ON THE GOLDEN BEACH */}
      <group position={[-2.5, 0.4, 10.2]} rotation={[0, 0.25, 0]}>
        {[
          { x: 0, y: 0, z: 0, r: 1.6 },
          { x: 1.2, y: 0.25, z: -0.6, r: 1.25 },
          { x: -1.0, y: 0.15, z: 0.5, r: 1.1 },
          { x: 0.6, y: 0.5, z: 0.2, r: 0.95 },
        ].map((m, i) => (
          <mesh key={i} position={[m.x, m.y, m.z]} material={goldMat} castShadow>
            <sphereGeometry args={[m.r, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          </mesh>
        ))}

        {[-0.7, 0.35, 1.0].map((gx, gi) => (
          <mesh key={gi} position={[gx, 0.7, 0.35 * gi]} material={rubyMat}>
            <octahedronGeometry args={[0.22, 0]} />
          </mesh>
        ))}

        <group position={[-0.5, 0.75, 0.2]} rotation={[0.1, 0.5, 0]}>
          <primitive object={chestA} />
        </group>
        <group position={[1.0, 0.65, -0.2]} rotation={[-0.1, -0.3, 0]}>
          <primitive object={chestB} />
        </group>

        <pointLight position={[0.2, 1.6, 0.6]} color="#fbbf24" intensity={12} distance={18} decay={2} />
      </group>
    </group>
  );
}

useGLTF.preload("/models/realistic_cliff.glb");
useGLTF.preload("/models/realistic_skull.glb");
useGLTF.preload("/models/chest.glb");
