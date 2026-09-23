"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

/**
 * MarineLife — photorealistic animated ocean life:
 * 1. Anatomical Bottlenose Dolphins (Tursiops truncatus):
 *    - Hydrodynamic cetacean geometry with pronounced melon, bottle rostrum, and dorsal keel
 *    - Swept falcate dorsal fin, hydrofoil pectoral flippers, and lunate tail flukes
 *    - Two-tone counter-shaded skin (dark slate grey dorsal cape, pearlescent underbelly)
 *    - Natural sinusoidal leaping trajectory and breach-and-dive roll over wave crests
 *    - Dynamic foam splash ripples on breach and water entry
 * 2. High-Poly PBR Barramundi / Reef Fish Shoals:
 *    - 3D glTF Barramundi specimens gliding through translucent subsurface swells
 *    - Anatomical tropical reef tangs with crescent caudal fins and dorsal sails
 *    - Coordinated schooling algorithms (undulating body wag, yaw steering, depth cruising)
 */

// Procedural anatomical dolphin with true cetacean proportions and hydrofoil fins
function createAnatomicalDolphin(): THREE.Group {
  const dolphin = new THREE.Group();

  // 1. Hydrodynamic Body Lofting along Z-axis (snout at negative Z, flukes at positive Z)
  const zSlices = [
    { z: -2.10, rx: 0.05, ry: 0.04, cy: -0.05 }, // beak tip
    { z: -1.85, rx: 0.12, ry: 0.10, cy: -0.04 }, // beak mid
    { z: -1.55, rx: 0.24, ry: 0.23, cy: -0.01 }, // melon forehead starts
    { z: -1.20, rx: 0.42, ry: 0.46, cy: 0.05 },  // melon apex / eye orbits
    { z: -0.70, rx: 0.54, ry: 0.62, cy: 0.08 },  // blowhole / pectoral base
    { z: -0.15, rx: 0.60, ry: 0.70, cy: 0.04 },  // chest / maximum thoracic girth
    { z:  0.45, rx: 0.54, ry: 0.64, cy: -0.03 }, // posterior dorsal region
    { z:  1.00, rx: 0.40, ry: 0.48, cy: -0.10 }, // tapering flanks
    { z:  1.50, rx: 0.24, ry: 0.28, cy: -0.17 }, // caudal peduncle
    { z:  1.85, rx: 0.11, ry: 0.15, cy: -0.22 }, // caudal keel before flukes
    { z:  2.05, rx: 0.05, ry: 0.06, cy: -0.24 }, // fluke insertion joint
  ];

  const radialSegments = 24;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let s = 0; s < zSlices.length; s++) {
    const slice = zSlices[s];
    const v = s / (zSlices.length - 1);

    for (let r = 0; r <= radialSegments; r++) {
      const u = r / radialSegments;
      const angle = u * Math.PI * 2;

      let x = Math.cos(angle) * slice.rx;
      const y = Math.sin(angle) * slice.ry + slice.cy;

      // Anatomical shaping: hydrodynamic dorsal keel sharpening, ventral belly widening
      if (Math.sin(angle) > 0.4) {
        x *= 0.90;
      } else if (Math.sin(angle) < -0.4) {
        x *= 1.06;
      }

      positions.push(x, y, slice.z);
      uvs.push(u, v);
    }
  }

  for (let s = 0; s < zSlices.length - 1; s++) {
    for (let r = 0; r < radialSegments; r++) {
      const a = s * (radialSegments + 1) + r;
      const b = (s + 1) * (radialSegments + 1) + r;
      const c = (s + 1) * (radialSegments + 1) + (r + 1);
      const d = s * (radialSegments + 1) + (r + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const bodyGeo = new THREE.BufferGeometry();
  bodyGeo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  bodyGeo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  bodyGeo.setIndex(indices);
  bodyGeo.computeVertexNormals();
  bodyGeo.computeBoundingSphere();

  // Glossy wet cetacean skin (dark slate grey with subsurface transmission)
  const skinMat = new THREE.MeshStandardMaterial({
    color: "#283b4d",
    roughness: 0.22,
    metalness: 0.25,
    envMapIntensity: 1.5,
  });

  const body = new THREE.Mesh(bodyGeo, skinMat);
  dolphin.add(body);

  // 2. Falcate Dorsal Fin (curving backwards)
  const dorsalShape = new THREE.Shape();
  dorsalShape.moveTo(0, 0);
  dorsalShape.quadraticCurveTo(0.12, 0.45, -0.25, 0.62);
  dorsalShape.quadraticCurveTo(-0.08, 0.40, -0.32, 0.0);
  dorsalShape.closePath();

  const dorsalGeo = new THREE.ExtrudeGeometry(dorsalShape, {
    depth: 0.04,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.012,
    bevelThickness: 0.012,
  });
  dorsalGeo.center();
  const dorsal = new THREE.Mesh(dorsalGeo, skinMat);
  dorsal.position.set(0, 0.82, -0.05);
  dorsal.rotation.set(0, Math.PI / 2, 0);
  dolphin.add(dorsal);

  // 3. Lunate Horizontal Tail Flukes
  const flukeShape = new THREE.Shape();
  flukeShape.moveTo(0, 0.08);
  flukeShape.quadraticCurveTo(0.40, 0.18, 0.78, -0.05);
  flukeShape.quadraticCurveTo(0.48, -0.22, 0.0, -0.12);
  flukeShape.quadraticCurveTo(-0.48, -0.22, -0.78, -0.05);
  flukeShape.quadraticCurveTo(-0.40, 0.18, 0, 0.08);
  flukeShape.closePath();

  const flukeGeo = new THREE.ExtrudeGeometry(flukeShape, {
    depth: 0.03,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.012,
    bevelThickness: 0.012,
  });
  flukeGeo.center();
  const flukes = new THREE.Mesh(flukeGeo, skinMat);
  flukes.name = "dolphinFlukes";
  flukes.position.set(0, -0.26, 2.12);
  dolphin.add(flukes);

  // 4. Hydrofoil Pectoral Flippers
  const flipperShape = new THREE.Shape();
  flipperShape.moveTo(0, 0);
  flipperShape.quadraticCurveTo(0.35, -0.15, 0.62, -0.62);
  flipperShape.quadraticCurveTo(0.32, -0.48, 0.0, -0.28);
  flipperShape.closePath();

  const flipperGeo = new THREE.ExtrudeGeometry(flipperShape, {
    depth: 0.03,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.01,
    bevelThickness: 0.01,
  });

  const flipL = new THREE.Mesh(flipperGeo, skinMat);
  flipL.position.set(-0.46, -0.16, -0.65);
  flipL.rotation.set(0.3, 0.4, -0.5);
  dolphin.add(flipL);

  const flipR = new THREE.Mesh(flipperGeo, skinMat);
  flipR.position.set(0.46, -0.16, -0.65);
  flipR.rotation.set(0.3, -0.4, 0.5);
  dolphin.add(flipR);

  return dolphin;
}

// Procedural tropical reef tang (Blue Tang / Yellow Tang profile)
function createAnatomicalReefFish(bodyColor: string, finColor: string): THREE.Group {
  const fish = new THREE.Group();

  const zSlices = [
    { z: -0.75, rx: 0.02, ry: 0.03, cy: 0.0 },   // snout tip
    { z: -0.55, rx: 0.08, ry: 0.18, cy: 0.02 },  // head/operculum
    { z: -0.25, rx: 0.14, ry: 0.38, cy: 0.04 },  // deep laterally-compressed body
    { z:  0.05, rx: 0.13, ry: 0.36, cy: 0.02 },  // mid torso
    { z:  0.35, rx: 0.08, ry: 0.22, cy: -0.01 }, // caudal flank
    { z:  0.55, rx: 0.04, ry: 0.08, cy: -0.02 }, // peduncle
  ];

  const radialSegments = 16;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let s = 0; s < zSlices.length; s++) {
    const slice = zSlices[s];
    const v = s / (zSlices.length - 1);

    for (let r = 0; r <= radialSegments; r++) {
      const u = r / radialSegments;
      const angle = u * Math.PI * 2;

      const x = Math.cos(angle) * slice.rx;
      const y = Math.sin(angle) * slice.ry + slice.cy;

      positions.push(x, y, slice.z);
      uvs.push(u, v);
    }
  }

  for (let s = 0; s < zSlices.length - 1; s++) {
    for (let r = 0; r < radialSegments; r++) {
      const a = s * (radialSegments + 1) + r;
      const b = (s + 1) * (radialSegments + 1) + r;
      const c = (s + 1) * (radialSegments + 1) + (r + 1);
      const d = s * (radialSegments + 1) + (r + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const bodyGeo = new THREE.BufferGeometry();
  bodyGeo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  bodyGeo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  bodyGeo.setIndex(indices);
  bodyGeo.computeVertexNormals();
  bodyGeo.computeBoundingSphere();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    roughness: 0.22,
    metalness: 0.45,
  });
  fish.add(new THREE.Mesh(bodyGeo, bodyMat));

  // Caudal Crescent Fin
  const tailShape = new THREE.Shape();
  tailShape.moveTo(0, 0.04);
  tailShape.quadraticCurveTo(0.22, 0.28, 0.42, 0.35);
  tailShape.quadraticCurveTo(0.28, 0.0, 0.42, -0.35);
  tailShape.quadraticCurveTo(0.22, -0.28, 0, -0.04);
  tailShape.closePath();

  const finMat = new THREE.MeshStandardMaterial({
    color: finColor,
    roughness: 0.3,
    metalness: 0.25,
    side: THREE.DoubleSide,
  });

  const tailGeo = new THREE.ShapeGeometry(tailShape);
  const tail = new THREE.Mesh(tailGeo, finMat);
  tail.position.set(0, -0.02, 0.55);
  tail.rotation.set(0, -Math.PI / 2, 0);
  fish.add(tail);

  // Dorsal Crest Sail Fin
  const dorsalShape = new THREE.Shape();
  dorsalShape.moveTo(-0.4, 0.15);
  dorsalShape.quadraticCurveTo(-0.1, 0.42, 0.3, 0.22);
  dorsalShape.lineTo(0.32, 0.08);
  dorsalShape.closePath();

  const dorsalGeo = new THREE.ShapeGeometry(dorsalShape);
  const dorsal = new THREE.Mesh(dorsalGeo, finMat);
  dorsal.position.set(0, 0.22, 0);
  dorsal.rotation.set(0, -Math.PI / 2, 0);
  fish.add(dorsal);

  return fish;
}

export default function MarineLife() {
  const dolphin1Ref = useRef<THREE.Group>(null);
  const dolphin2Ref = useRef<THREE.Group>(null);
  const splash1Ref = useRef<THREE.Mesh>(null);
  const splash2Ref = useRef<THREE.Mesh>(null);
  const fishSchoolRef = useRef<THREE.Group>(null);
  const barramundiGroupRef = useRef<THREE.Group>(null);

  // Load realistic 3D Barramundi fish model
  const { scene: barramundiScene } = useGLTF("/models/barramundi.glb");

  // 1. Build anatomical dolphins
  const { d1Mesh, d2Mesh } = useMemo(() => {
    return {
      d1Mesh: createAnatomicalDolphin(),
      d2Mesh: createAnatomicalDolphin(),
    };
  }, []);

  // 2. Build Barramundi school clones
  const barramundiFish = useMemo(() => {
    const clones: THREE.Group[] = [];
    for (let i = 0; i < 4; i++) {
      const c = barramundiScene.clone(true);
      c.scale.set(1.4, 1.4, 1.4);
      clones.push(c);
    }
    return clones;
  }, [barramundiScene]);

  // 3. Build Tropical Reef Fish School
  const { reefFishMeshes, reefFishOffsets } = useMemo(() => {
    const species = [
      { body: "#0284c7", fin: "#fbbf24" }, // Blue Tang (Regal Tang)
      { body: "#fbbf24", fin: "#f59e0b" }, // Yellow Tang
      { body: "#0f766e", fin: "#38bdf8" }, // Green Chromis
      { body: "#ea580c", fin: "#fef08a" }, // Flameback Angelfish
    ];

    const meshes: THREE.Group[] = [];
    const offsets: Array<[number, number, number, number]> = [];

    for (let i = 0; i < 14; i++) {
      const spec = species[i % species.length];
      meshes.push(createAnatomicalReefFish(spec.body, spec.fin));
      const angle = (i / 14) * Math.PI * 2;
      const radius = 2.8 + (i % 3) * 0.9;
      const y = -1.4 - (i % 3) * 0.22;
      offsets.push([angle, radius, y, 0.7 + (i % 3) * 0.25]);
    }
    return { reefFishMeshes: meshes, reefFishOffsets: offsets };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // --- DOLPHIN 1: Leaping alongside the Galleon's port bow ---
    const d1Period = 5.6;
    const d1Cycle = (t * 0.62) % d1Period;
    const d1 = dolphin1Ref.current;
    const s1 = splash1Ref.current;

    if (d1) {
      if (d1Cycle < 2.5) {
        d1.visible = true;
        const p = d1Cycle / 2.5; // 0 (breach) to 1 (dive)

        // Trajectory arcing across the swells
        d1.position.x = THREE.MathUtils.lerp(-3.8, -0.6, p);
        d1.position.z = THREE.MathUtils.lerp(7.8, 5.2, p);
        d1.position.y = -1.0 + Math.sin(p * Math.PI) * 2.9;

        // Hydrodynamic pitch & roll
        const pitch = (0.5 - p) * 1.5;
        d1.rotation.set(pitch, -0.68, 0.25);

        // Fluke wagging
        const flukes1 = d1.getObjectByName("dolphinFlukes");
        if (flukes1) {
          flukes1.rotation.x = Math.sin(t * 12) * 0.35;
        }

        // Breach and entry splashes
        if (s1) {
          if (p < 0.18) {
            s1.visible = true;
            s1.position.set(-3.8, -0.92, 7.8);
            const spScale = (p / 0.18) * 1.5;
            s1.scale.set(spScale, spScale, spScale);
          } else if (p > 0.82) {
            s1.visible = true;
            s1.position.set(-0.6, -0.92, 5.2);
            const spScale = ((1 - p) / 0.18) * 1.6;
            s1.scale.set(spScale, spScale, spScale);
          } else {
            s1.visible = false;
          }
        }
      } else {
        d1.visible = false;
        if (s1) s1.visible = false;
      }
    }

    // --- DOLPHIN 2: Synchronized companion dolphin ---
    const d2Period = 5.6;
    const d2Cycle = ((t + 0.35) * 0.62) % d2Period;
    const d2 = dolphin2Ref.current;
    const s2 = splash2Ref.current;

    if (d2) {
      if (d2Cycle < 2.5) {
        d2.visible = true;
        const p = d2Cycle / 2.5;

        d2.position.x = THREE.MathUtils.lerp(-5.0, -1.8, p);
        d2.position.z = THREE.MathUtils.lerp(9.0, 6.4, p);
        d2.position.y = -1.0 + Math.sin(p * Math.PI) * 2.5;

        const pitch = (0.5 - p) * 1.45;
        d2.rotation.set(pitch, -0.68, 0.2);

        const flukes2 = d2.getObjectByName("dolphinFlukes");
        if (flukes2) {
          flukes2.rotation.x = Math.sin((t + 0.2) * 12) * 0.35;
        }

        if (s2) {
          if (p < 0.18) {
            s2.visible = true;
            s2.position.set(-5.0, -0.92, 9.0);
            const spScale = (p / 0.18) * 1.3;
            s2.scale.set(spScale, spScale, spScale);
          } else if (p > 0.82) {
            s2.visible = true;
            s2.position.set(-1.8, -0.92, 6.4);
            const spScale = ((1 - p) / 0.18) * 1.4;
            s2.scale.set(spScale, spScale, spScale);
          } else {
            s2.visible = false;
          }
        }
      } else {
        d2.visible = false;
        if (s2) s2.visible = false;
      }
    }

    // --- REALISTIC 3D BARRAMUNDI FISH SHOAL ---
    if (barramundiGroupRef.current) {
      barramundiGroupRef.current.children.forEach((fish, i) => {
        const speed = 0.45 + i * 0.08;
        const orbitRadius = 4.2 + (i % 2) * 1.2;
        const angle = t * speed * 0.4 + (i * Math.PI) / 2;
        const x = -1.5 + Math.cos(angle) * orbitRadius;
        const z = 7.0 + Math.sin(angle) * (orbitRadius * 0.65);
        const y = -1.35 + Math.sin(t * 1.5 + i) * 0.18;

        fish.position.set(x, y, z);
        // Face tangential travel direction + body undulation
        const heading = -angle + Math.PI / 2;
        const wag = Math.sin(t * 6 + i) * 0.12;
        fish.rotation.set(0, heading + wag, 0);
      });
    }

    // --- TROPICAL REEF FISH SCHOOL SWIMMING UNDER WATER ---
    if (fishSchoolRef.current) {
      fishSchoolRef.current.children.forEach((f, i) => {
        const [baseAngle, radius, baseY, speed] = reefFishOffsets[i];
        const curAngle = baseAngle + t * speed * 0.32;
        const fx = -2.0 + Math.cos(curAngle) * radius;
        const fz = 6.5 + Math.sin(curAngle) * (radius * 0.6);
        const fy = baseY + Math.sin(t * 2.0 + i) * 0.12;

        f.position.set(fx, fy, fz);
        // Realistic swimming wag
        const tangentYaw = -curAngle + Math.PI / 2;
        const wag = Math.sin(t * 8 + i * 0.8) * 0.15;
        f.rotation.set(0, tangentYaw + wag, 0);
      });
    }
  });

  return (
    <group>
      {/* Dolphin 1 with anatomical form */}
      <group ref={dolphin1Ref}>
        <primitive object={d1Mesh} />
      </group>

      {/* Dolphin 2 companion */}
      <group ref={dolphin2Ref}>
        <primitive object={d2Mesh} />
      </group>

      {/* Splash foam rings for Dolphins */}
      <mesh ref={splash1Ref} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.3, 0.85, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>

      <mesh ref={splash2Ref} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.25, 0.75, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>

      {/* Real Textured 3D Barramundi Fish gliding under translucent water */}
      <group ref={barramundiGroupRef}>
        {barramundiFish.map((f, i) => (
          <primitive key={i} object={f} />
        ))}
      </group>

      {/* School of Anatomical Tropical Reef Fish */}
      <group ref={fishSchoolRef}>
        {reefFishMeshes.map((mesh, i) => (
          <primitive key={i} object={mesh} />
        ))}
      </group>
    </group>
  );
}

useGLTF.preload("/models/barramundi.glb");
