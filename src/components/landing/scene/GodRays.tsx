"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * GodRays — volumetric sunset crepuscular light rays radiating from the sun
 * across the sea and around the Skull Mountain silhouette.
 */

const rayVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const rayFragment = /* glsl */ `
  precision mediump float;
  uniform float uIntensity;
  uniform float uTime;
  uniform float uSeed;
  varying vec2 vUv;

  void main() {
    // Soft exponential falloff from sun core and feathered lateral edges
    float lengthFade = smoothstep(0.0, 0.18, vUv.y) * pow(1.0 - vUv.y, 1.25);
    float sideFade = smoothstep(0.0, 0.45, vUv.x) * (1.0 - smoothstep(0.55, 1.0, vUv.x));
    float shimmer = 0.82 + 0.18 * sin(uTime * 0.9 + uSeed * 14.3);
    float a = lengthFade * sideFade * uIntensity * shimmer;
    vec3 col = vec3(1.0, 0.82, 0.52);
    gl_FragColor = vec4(col, a);
  }
`;

interface Props {
  sunPosition: [number, number, number];
}

export default function GodRays({ sunPosition }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const matsRef = useRef<THREE.ShaderMaterial[]>([]);

  const rays = useMemo(
    () =>
      Array.from({ length: 11 }, (_, i) => ({
        angle: -0.48 + i * 0.095 + (i % 2) * 0.015,
        length: 52 + (i % 4) * 14,
        width: 3.2 + (i % 3) * 1.5,
        intensity: 0.07 + (i % 3) * 0.025,
        seed: i * 0.618,
      })),
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(t * 0.04) * 0.015;
    }
    matsRef.current.forEach((m) => {
      if (m) m.uniforms.uTime.value = t;
    });
  });

  return (
    <group ref={groupRef} position={sunPosition}>
      {rays.map((r, i) => (
        <mesh
          key={i}
          position={[0, 0, -6 - i * 0.3]}
          rotation={[0, 0, r.angle - Math.PI / 2]}
        >
          <planeGeometry args={[r.width, r.length]} />
          <shaderMaterial
            ref={(el) => {
              if (el) matsRef.current[i] = el;
            }}
            vertexShader={rayVertex}
            fragmentShader={rayFragment}
            uniforms={{
              uIntensity: { value: r.intensity },
              uTime: { value: 0 },
              uSeed: { value: r.seed },
            }}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}
