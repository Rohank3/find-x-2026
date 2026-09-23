"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";

/**
 * OceanDunes — photorealistic translucent physical ocean surface:
 * - 4-tier Gerstner wave displacement in true world coordinates
 * - Optical translucency revealing underwater marine life and seabed
 * - Dual-layer normal map sampling (waternormals.jpg) with counter-drifting wave trains
 * - Physical optical depth & subsurface scattering (translucent turquoise to deep navy)
 * - Microfacet specular sun glitter path stretching toward the camera
 * - Procedural sea foam on breaking crests with organic turbulence
 * - Physical Fresnel sky reflection & warm atmospheric horizon blending
 */

const vertexShader = /* glsl */ `
  uniform float uTime;

  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vCrest;
  varying float vFoam;

  // Gerstner wave formulation matching Galleon.tsx exactly
  float gerstnerWave(vec2 p, float t, vec2 dir, float steep, float wlen, inout vec2 grad) {
    float k = 6.2831853 / wlen;
    float c = sqrt(9.80665 / k);
    vec2 d = normalize(dir);
    float f = k * (dot(d, p) - c * t);
    float a = steep / k;
    grad += d * (a * k * cos(f));
    return a * sin(f);
  }

  void main() {
    // True world position calculation
    vec4 worldBase = modelMatrix * vec4(position, 1.0);
    vec2 wp = worldBase.xz;
    float t = uTime;

    vec2 grad = vec2(0.0);
    float h = 0.0;
    // Primary ocean swell
    h += gerstnerWave(wp, t * 1.0,  vec2(1.0, 0.25),   0.16, 24.0, grad);
    // Secondary cross-swell
    h += gerstnerWave(wp, t * 1.18, vec2(0.78, -0.48), 0.17, 15.0, grad);
    // Chop wave train 1
    h += gerstnerWave(wp, t * 1.42, vec2(0.52, 0.74),  0.12, 8.0,  grad);
    // Chop wave train 2
    h += gerstnerWave(wp, t * 1.85, vec2(-0.28, 0.94), 0.08, 4.2,  grad);

    vec3 displacedWorld = vec3(worldBase.x, worldBase.y + h, worldBase.z);

    vNormal = normalize(vec3(-grad.x, 1.0, -grad.y));
    vCrest = clamp(h / 1.25 + 0.5, 0.0, 1.0);
    vFoam = smoothstep(0.42, 1.10, length(grad));

    vWorldPos = displacedWorld;
    gl_Position = projectionMatrix * viewMatrix * vec4(displacedWorld, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform sampler2D uNormalMap;
  uniform float uTime;
  uniform vec3 uSunPos;
  uniform vec3 uDeepColor;
  uniform vec3 uShallowColor;
  uniform vec3 uFoamColor;
  uniform vec3 uSunGlintColor;
  uniform vec3 uSkyHorizonColor;
  uniform vec3 uSkyZenithColor;

  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vCrest;
  varying float vFoam;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    // Dual-scrolling high-resolution normal maps with realistic wave phase velocity
    vec2 uv1 = vWorldPos.xz * 0.085 + vec2(uTime * 0.024, uTime * 0.016);
    vec2 uv2 = vWorldPos.xz * 0.065 - vec2(uTime * 0.019, uTime * 0.028);
    vec3 n1 = texture2D(uNormalMap, uv1).rgb * 2.0 - 1.0;
    vec3 n2 = texture2D(uNormalMap, uv2).rgb * 2.0 - 1.0;
    vec3 detailNormal = normalize(n1 + n2);

    // Composite normal combining macro Gerstner geometry + micro-capillary ripples
    vec3 N = normalize(vNormal + vec3(detailNormal.x, detailNormal.z, detailNormal.y) * 0.38);
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 L = normalize(uSunPos - vWorldPos);

    // Physical Schlick Fresnel approximation for water (F0 ~ 0.02)
    float NdotV = max(dot(N, V), 0.0);
    float fresnel = 0.02 + 0.98 * pow(1.0 - NdotV, 4.2);

    // Optical depth absorption & Subsurface Scattering (SSS)
    float sss = pow(clamp(dot(V, -L), 0.0, 1.0), 3.0) * pow(vCrest, 2.0);
    vec3 sssColor = vec3(0.06, 0.78, 0.88); // Translucent tropical turquoise
    vec3 waterBody = mix(uDeepColor, uShallowColor, smoothstep(0.12, 0.85, vCrest));
    waterBody += sssColor * sss * 0.85;

    // Physical Sky Reflection based on reflected view vector
    vec3 R = reflect(-V, N);
    float skyAngle = clamp(R.y, 0.0, 1.0);
    vec3 skyReflection = mix(uSkyHorizonColor, uSkyZenithColor, pow(skyAngle, 0.75));

    // Sun reflection glow on horizon sky
    float sunSkyGlow = pow(max(dot(R, L), 0.0), 8.0);
    skyReflection += uSunGlintColor * sunSkyGlow * 0.65;

    // Combine translucent water body with Fresnel sky reflection
    vec3 col = mix(waterBody, skyReflection, fresnel);

    // Warm grazing rim light from low sunset
    float NdotL = max(dot(N, L), 0.0);
    float rim = pow(1.0 - NdotL, 2.4) * max(dot(N, vec3(0.0, 1.0, 0.0)), 0.0);
    col += uSunGlintColor * rim * 0.22;

    // Realistic microfacet specular sun glitter path
    float specSharp = pow(max(dot(R, L), 0.0), 160.0);
    float specBroad = pow(max(dot(R, L), 0.0), 24.0) * 0.35;
    float specHaze = pow(max(dot(R, L), 0.0), 6.0) * 0.12;

    float columnMask = exp(-abs(vWorldPos.x - uSunPos.x) * 0.038)
      * smoothstep(25.0, -80.0, vWorldPos.z - uSunPos.z + 20.0);

    col += uSunGlintColor * (specSharp * 4.2 + specBroad + specHaze) * columnMask;

    // Procedural organic sea-foam on wave peaks
    float foamNoise = hash(floor(vWorldPos.xz * 1.8));
    float foamThreshold = smoothstep(0.40, 0.95, vFoam + foamNoise * 0.2);
    float peakFoam = pow(vCrest, 4.0) * 0.6;
    float totalFoam = clamp(foamThreshold + peakFoam, 0.0, 1.0);
    col = mix(col, uFoamColor, totalFoam * 0.88);

    // Atmospheric horizon haze blending into sky dome
    float dist = length(cameraPosition.xz - vWorldPos.xz);
    float haze = 1.0 - exp(-dist * 0.0072);
    col = mix(col, uSkyHorizonColor * 0.5 + vec3(0.1, 0.18, 0.28) * 0.5, haze * 0.82);

    // Optical translucency: more transparent when looking directly down, opaque at grazing angles
    float alpha = mix(0.82, 0.98, fresnel);
    // Foam is opaque white
    alpha = mix(alpha, 1.0, totalFoam * 0.8);

    gl_FragColor = vec4(col, alpha);
  }
`;

interface Props {
  sunPosition: [number, number, number];
}

export default function OceanDunes({ sunPosition }: Props) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const rawNormalMap = useTexture("/textures/waternormals.jpg");

  const normalMap = useMemo(() => {
    const tex = rawNormalMap.clone();
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;
    return tex;
  }, [rawNormalMap]);

  const uniforms = useMemo(
    () => ({
      uNormalMap: { value: normalMap },
      uTime: { value: 0 },
      uSunPos: { value: new THREE.Vector3(...sunPosition) },
      uDeepColor: { value: new THREE.Color("#031b2e") },
      uShallowColor: { value: new THREE.Color("#0284c7") },
      uFoamColor: { value: new THREE.Color("#f0f9ff") },
      uSunGlintColor: { value: new THREE.Color("#fef08a") },
      uSkyHorizonColor: { value: new THREE.Color("#f97316") },
      uSkyZenithColor: { value: new THREE.Color("#1e1b4b") },
    }),
    [normalMap, sunPosition]
  );

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh position={[0, -1.0, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
      <planeGeometry args={[220, 220, 110, 110]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite
        wireframe={false}
      />
    </mesh>
  );
}
