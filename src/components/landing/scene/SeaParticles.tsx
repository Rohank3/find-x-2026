"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * SeaParticles — 3D micro-particle emitters:
 *  · ~24 gold embers drifting upward with warm glow (additive)
 *  · ~16 sea-spray droplets hovering over the swell, drifting sideways
 * Deterministic PRNG keeps layout pure across renders.
 */

const COUNT_EMBERS = 24;
const COUNT_SPRAY = 16;

export default function SeaParticles() {
  const emberRef = useRef<THREE.Points>(null);
  const sprayRef = useRef<THREE.Points>(null);

  const { emberGeo, emberMat, sprayGeo, sprayMat } = useMemo(() => {
    let seed = 90210;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };

    // Embers: rise from the sea surface toward the sky
    const emberPos = new Float32Array(COUNT_EMBERS * 3);
    const emberSpeed = new Float32Array(COUNT_EMBERS);
    for (let i = 0; i < COUNT_EMBERS; i++) {
      emberPos[i * 3] = (rand() - 0.5) * 24;
      emberPos[i * 3 + 1] = rand() * 7 - 0.5;
      emberPos[i * 3 + 2] = -rand() * 20 + 3;
      emberSpeed[i] = 0.15 + rand() * 0.3;
    }
    const eGeo = new THREE.BufferGeometry();
    eGeo.setAttribute("position", new THREE.BufferAttribute(emberPos, 3));
    eGeo.setAttribute("aSpeed", new THREE.BufferAttribute(emberSpeed, 1));
    const eMat = new THREE.PointsMaterial({
      color: new THREE.Color("#ffca6e"),
      size: 0.14,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    // Spray: hover just above the water, drift with the swell
    const sprayPos = new Float32Array(COUNT_SPRAY * 3);
    for (let i = 0; i < COUNT_SPRAY; i++) {
      sprayPos[i * 3] = (rand() - 0.5) * 20;
      sprayPos[i * 3 + 1] = 0.2 + rand() * 1.6;
      sprayPos[i * 3 + 2] = -rand() * 16 + 2;
    }
    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute("position", new THREE.BufferAttribute(sprayPos, 3));
    const sMat = new THREE.PointsMaterial({
      color: new THREE.Color("#cfeefc"),
      size: 0.09,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      sizeAttenuation: true,
    });

    return { emberGeo: eGeo, emberMat: eMat, sprayGeo: sGeo, sprayMat: sMat };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    const embers = emberRef.current;
    if (embers) {
      const pos = embers.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < COUNT_EMBERS; i++) {
        let y = pos.getY(i) + 0.012 * (1 + (i % 3) * 0.4);
        if (y > 7.5) y = -0.6;
        pos.setY(i, y);
        // slight sideways sway
        pos.setX(i, pos.getX(i) + Math.sin(t * 0.6 + i) * 0.0016);
      }
      pos.needsUpdate = true;
    }

    const spray = sprayRef.current;
    if (spray) {
      const pos = spray.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < COUNT_SPRAY; i++) {
        // bob with the swell rhythm
        const base = (i % 8) / 8 * Math.PI * 2;
        pos.setY(i, 0.7 + Math.sin(t * 1.3 + base) * 0.5);
        pos.setX(i, pos.getX(i) + Math.sin(t * 0.4 + i * 1.7) * 0.002);
      }
      pos.needsUpdate = true;
    }
  });

  return (
    <>
      <points ref={emberRef} geometry={emberGeo} material={emberMat} />
      <points ref={sprayRef} geometry={sprayGeo} material={sprayMat} />
    </>
  );
}
