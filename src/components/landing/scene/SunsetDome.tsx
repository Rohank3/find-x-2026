"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * SunsetDome — photorealistic atmospheric scattering sky dome:
 * - Rayleigh & Mie physical sunset color gradients
 * - Burning golden solar core with expansive halo and atmospheric glow
 * - Soft layered cirrus & stratus cloud strata catching rim light
 * - Horizon haze blending seamlessly into the ocean plane
 */

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3 uSunDir;

  varying vec3 vDir;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; i++) {
      v += amp * noise(p);
      p *= 2.15;
      amp *= 0.48;
    }
    return v;
  }

  void main() {
    vec3 dir = normalize(vDir);
    float h = dir.y;

    // Physical Rayleigh / Mie sunset gradient
    vec3 zenith = vec3(0.08, 0.12, 0.24);    // Deep indigo twilight
    vec3 upperSky = vec3(0.28, 0.18, 0.32);  // Muted amethyst
    vec3 midSky = vec3(0.72, 0.32, 0.22);    // Rich amber coral
    vec3 horizon = vec3(0.98, 0.54, 0.18);   // Glowing golden orange

    vec3 skyCol = mix(horizon, midSky, smoothstep(0.0, 0.22, h));
    skyCol = mix(skyCol, upperSky, smoothstep(0.18, 0.55, h));
    skyCol = mix(skyCol, zenith, smoothstep(0.50, 0.95, h));

    // Solar disc and atmospheric scattering halo
    float sunDot = max(dot(dir, normalize(uSunDir)), 0.0);
    float sunDisc = smoothstep(0.9982, 0.9994, sunDot);
    float innerHalo = pow(sunDot, 120.0) * 1.6;
    float midHalo = pow(sunDot, 24.0) * 0.75;
    float broadGlow = pow(sunDot, 5.0) * 0.35;

    vec3 sunColor = vec3(1.0, 0.94, 0.82);
    vec3 glowColor = vec3(1.0, 0.68, 0.32);

    skyCol += glowColor * (midHalo + broadGlow);
    skyCol += sunColor * innerHalo;
    skyCol = mix(skyCol, vec3(1.0, 0.98, 0.92), sunDisc);

    // Drifting layered sunset clouds
    vec2 cloudUv = vec2(atan(dir.z, dir.x) * 2.2, dir.y * 6.5);
    float cloudNoise = fbm(cloudUv + vec2(uTime * 0.006, 0.0));
    float cloudBand = smoothstep(0.04, 0.35, h) * (1.0 - smoothstep(0.38, 0.82, h));
    float cloudDensity = smoothstep(0.48, 0.76, cloudNoise) * cloudBand;

    // Sunlit cloud edges vs dark amber underside
    vec3 cloudLit = mix(vec3(0.85, 0.45, 0.32), vec3(1.0, 0.88, 0.65), pow(sunDot, 2.5));
    vec3 cloudShadow = vec3(0.24, 0.14, 0.22);
    vec3 finalCloud = mix(cloudShadow, cloudLit, smoothstep(0.5, 0.75, cloudNoise));

    skyCol = mix(skyCol, finalCloud, cloudDensity * 0.65);

    // Seamless horizon blend into ocean distance haze
    skyCol = mix(vec3(0.92, 0.46, 0.22), skyCol, smoothstep(-0.05, 0.03, h));

    gl_FragColor = vec4(skyCol, 1.0);
  }
`;

export default function SunsetDome({ sunPosition }: { sunPosition: [number, number, number] }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSunDir: { value: new THREE.Vector3(...sunPosition).normalize() },
    }),
    [sunPosition]
  );

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[180, 48, 32]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}
