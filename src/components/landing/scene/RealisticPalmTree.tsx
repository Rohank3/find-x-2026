"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * RealisticPalmTree — botanical-grade Caribbean Coconut Palm (Cocos nucifera):
 * - Naturally sweeping, flared-base trunk with realistic leaf-scar annular rings
 * - Multi-tiered crown (18 mature drooping, middle arching, and upper fountain fronds)
 * - Botanically folded V-groove fronds with central rachis ridge and drooping leaflet blades
 * - Ripe green-brown coconut bunches clustered around the crown heart
 * - Organic wind response swaying the crown in Caribbean trade winds
 */

interface PalmProps {
  position: [number, number, number];
  scale?: number;
  rotationY?: number;
  curveAmount?: number;
  curveDir?: number;
  tiltZ?: number;
}

// Generates folded 3D palm frond with natural arching rachis and hanging leaflet wings
function generateFrondMesh(length: number, width: number, droopPow: number): THREE.BufferGeometry {
  const segments = 16;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // Botanically realistic rachis curve: gentle upward lift then weeping cascade
    const archY = Math.sin(t * Math.PI * 0.68) * (0.65 * (length / 4.0)) - Math.pow(t, droopPow) * (1.8 * (length / 4.0));
    const archZ = t * length;
    const currentWidth = Math.sin(t * Math.PI) * width * (1.0 - t * 0.32);

    // Left leaflet wing (droops down and back)
    positions.push(-currentWidth * 0.5, archY - currentWidth * 0.22, archZ);
    uvs.push(0, t);

    // Center rachis spine (raised crest)
    positions.push(0, archY + 0.05, archZ);
    uvs.push(0.5, t);

    // Right leaflet wing (droops down and back)
    positions.push(currentWidth * 0.5, archY - currentWidth * 0.22, archZ);
    uvs.push(1, t);
  }

  for (let i = 0; i < segments; i++) {
    const rowA = i * 3;
    const rowB = (i + 1) * 3;

    // Left side quads
    indices.push(rowA, rowB, rowA + 1);
    indices.push(rowB, rowB + 1, rowA + 1);

    // Right side quads
    indices.push(rowA + 1, rowB + 1, rowA + 2);
    indices.push(rowB + 1, rowB + 2, rowA + 2);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

export default function RealisticPalmTree({
  position,
  scale = 1.0,
  rotationY = 0,
  curveAmount = 1.2,
  curveDir = 0,
  tiltZ = 0.06,
}: PalmProps) {
  const crownRef = useRef<THREE.Group>(null);

  const { trunkGeo, trunkMat, crownData, coconutGeo, coconutMat } = useMemo(() => {
    const height = 6.8;

    // 1. Swollen base and sweeping curved trunk with coconut leaf scar rings
    const curveX = Math.cos(curveDir) * curveAmount;
    const curveZ = Math.sin(curveDir) * curveAmount;

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(curveX * 0.16, height * 0.22, curveZ * 0.16),
      new THREE.Vector3(curveX * 0.48, height * 0.55, curveZ * 0.48),
      new THREE.Vector3(curveX * 0.82, height * 0.82, curveZ * 0.82),
      new THREE.Vector3(curveX, height, curveZ),
    ]);

    const rings = 36;
    const radialSegments = 14;
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let r = 0; r <= rings; r++) {
      const t = r / rings;
      const pt = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      if (normal.lengthSq() < 0.001) normal.set(1, 0, 0);
      const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

      // Flared buttress base (typical of leaning coconut palms), tapering upwards
      const baseFlare = 0.38 * Math.exp(-t * 6.0);
      const baseRadius = THREE.MathUtils.lerp(0.32, 0.18, t) + baseFlare;
      // Authentic palm leaf-scar ridges every few inches along the trunk
      const ringStep = 1.0 + Math.sin(t * Math.PI * 26) * 0.045;
      const radius = baseRadius * ringStep;

      for (let s = 0; s <= radialSegments; s++) {
        const u = s / radialSegments;
        const angle = u * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const x = pt.x + (normal.x * cos + binormal.x * sin) * radius;
        const y = pt.y + (normal.y * cos + binormal.y * sin) * radius;
        const z = pt.z + (normal.z * cos + binormal.z * sin) * radius;

        positions.push(x, y, z);
        uvs.push(u, t * 10);
      }
    }

    for (let r = 0; r < rings; r++) {
      for (let s = 0; s < radialSegments; s++) {
        const a = r * (radialSegments + 1) + s;
        const b = (r + 1) * (radialSegments + 1) + s;
        const c = (r + 1) * (radialSegments + 1) + (s + 1);
        const d = r * (radialSegments + 1) + (s + 1);

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    const tGeo = new THREE.BufferGeometry();
    tGeo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    tGeo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    tGeo.setIndex(indices);
    tGeo.computeVertexNormals();
    tGeo.computeBoundingSphere();

    // Natural weathered grey-brown fibrous palm bark material
    const tMat = new THREE.MeshStandardMaterial({
      color: "#543e2b",
      roughness: 0.92,
      metalness: 0.03,
    });

    // 2. Multi-tiered botanical crown (18 rich fronds forming a lush, natural canopy)
    const tiers = [
      // Lower weeping mature tier
      { count: 7, length: 4.6, width: 1.15, droopPow: 1.9, pitch: 0.62, y: -0.15 },
      // Mid-level graceful arching tier
      { count: 6, length: 4.1, width: 1.05, droopPow: 2.3, pitch: 0.36, y: 0.06 },
      // Upper upright tropical crown fountain
      { count: 5, length: 3.3, width: 0.85, droopPow: 2.8, pitch: 0.12, y: 0.24 },
    ];

    const fronds: Array<{
      geo: THREE.BufferGeometry;
      angle: number;
      pitch: number;
      y: number;
      mat: THREE.Material;
    }> = [];

    // Realistic chlorophyll shading with sunlit tropical green
    const leafMatMature = new THREE.MeshStandardMaterial({
      color: "#275928",
      roughness: 0.42,
      metalness: 0.04,
      side: THREE.DoubleSide,
    });
    const leafMatFresh = new THREE.MeshStandardMaterial({
      color: "#3a7d32",
      roughness: 0.38,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    let tierSeed = 0;
    tiers.forEach((tier, tIdx) => {
      const mat = tIdx === 2 ? leafMatFresh : leafMatMature;
      for (let i = 0; i < tier.count; i++) {
        const angle = (i / tier.count) * Math.PI * 2 + tierSeed * 0.35 + ((i % 3) - 1) * 0.1;
        const fLength = tier.length + ((i % 3) - 1) * 0.25;
        const fGeo = generateFrondMesh(fLength, tier.width, tier.droopPow);
        const pitch = tier.pitch + ((i % 2) - 0.5) * 0.06;
        fronds.push({ geo: fGeo, angle, pitch, y: tier.y, mat });
        tierSeed++;
      }
    });

    // 3. Cluster of green-brown coconuts nestled tightly in the crown
    const cGeo = new THREE.SphereGeometry(0.24, 10, 8);
    cGeo.scale(0.85, 1.15, 0.95);
    const cMat = new THREE.MeshStandardMaterial({
      color: "#3d2b17",
      roughness: 0.85,
      metalness: 0.04,
    });

    return {
      trunkGeo: tGeo,
      trunkMat: tMat,
      crownData: {
        tipPos: [curveX, height, curveZ] as [number, number, number],
        fronds,
      },
      coconutGeo: cGeo,
      coconutMat: cMat,
    };
  }, [curveAmount, curveDir]);

  useFrame((state) => {
    if (crownRef.current) {
      const t = state.clock.elapsedTime;
      // Gentle rhythmic swaying of the palm canopy in ocean breezes
      crownRef.current.rotation.z = Math.sin(t * 1.5 + position[0] * 0.5) * 0.045;
      crownRef.current.rotation.x = Math.cos(t * 1.2 + position[2] * 0.5) * 0.035;
    }
  });

  return (
    <group position={position} scale={scale} rotation={[0, rotationY, tiltZ]}>
      {/* 1. Flared Curved Trunk with Leaf Scar Rings */}
      <mesh geometry={trunkGeo} material={trunkMat} castShadow receiveShadow />

      {/* 2. Full Multi-Tiered Palm Canopy (18 lush weeping fronds) */}
      <group ref={crownRef} position={crownData.tipPos}>
        {crownData.fronds.map((f, i) => (
          <group key={i} position={[0, f.y, 0]} rotation={[0, f.angle, 0]}>
            <mesh
              geometry={f.geo}
              material={f.mat}
              rotation={[f.pitch, 0, 0]}
              castShadow
              receiveShadow
            />
          </group>
        ))}

        {/* 3. Coconut Cluster (Botanically nestled underneath crown heart) */}
        <group position={[0, -0.18, 0]}>
          <mesh position={[0.16, 0.02, 0.14]} rotation={[0.2, 0.4, -0.1]} geometry={coconutGeo} material={coconutMat} />
          <mesh position={[-0.15, -0.04, 0.12]} rotation={[-0.1, -0.3, 0.2]} geometry={coconutGeo} material={coconutMat} />
          <mesh position={[0.02, -0.06, -0.18]} rotation={[0.3, 0, 0.1]} geometry={coconutGeo} material={coconutMat} />
          <mesh position={[-0.12, 0.04, -0.1]} rotation={[-0.2, 0.5, -0.2]} geometry={coconutGeo} material={coconutMat} />
          <mesh position={[0.18, -0.05, -0.06]} rotation={[0.1, -0.4, 0.1]} geometry={coconutGeo} material={coconutMat} />
        </group>
      </group>
    </group>
  );
}
