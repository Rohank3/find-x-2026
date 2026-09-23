"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

/**
 * AtmosphericFX — living environmental dynamics matching the epic reference:
 * 1. Skull Mountain glowing fiery amber eyes (pulsing radiance & light spill)
 * 2. Volumetric golden sunset God Rays behind the mountain
 * 3. Starboard cannon muzzle flash bursts & rolling smoke billows
 * 4. Golden treasure embers & sea spray particles in the wind
 */
export default function AtmosphericFX() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    // Particles: Floating gold embers and sea spray
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      color: string;
      life: number;
      maxLife: number;
    }

    const particles: Particle[] = [];
    const maxParticles = 55;

    // Cannon smoke particles
    interface SmokeParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      rotation: number;
      rotSpeed: number;
      life: number;
    }
    const smoke: SmokeParticle[] = [];

    // Cannon flash timer
    let cannonFlash = 0;
    let nextCannonTime = 1.5;

    let time = 0;

    const render = () => {
      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      // 1. Spawn floating embers & sea mist
      if (particles.length < maxParticles && Math.random() < 0.6) {
        const isEmber = Math.random() < 0.55;
        particles.push({
          x: width * 0.4 + Math.random() * width * 0.6,
          y: height * 0.4 + Math.random() * height * 0.6,
          vx: -0.6 - Math.random() * 0.8,
          vy: -0.4 - Math.random() * 0.7,
          size: isEmber ? Math.random() * 2.5 + 1.2 : Math.random() * 1.8 + 0.8,
          alpha: Math.random() * 0.7 + 0.3,
          color: isEmber ? "#fbbf24" : "#e0f2fe",
          life: 0,
          maxLife: 200 + Math.random() * 150,
        });
      }

      // Update & draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy + Math.sin(time + p.x * 0.01) * 0.2;

        const lifeRatio = p.life / p.maxLife;
        const currentAlpha = p.alpha * Math.sin(lifeRatio * Math.PI);

        if (p.life >= p.maxLife || p.x < 0 || p.y < 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, currentAlpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Soft glow around embers
        if (p.color === "#fbbf24") {
          ctx.fillStyle = "rgba(251, 191, 36, 0.25)";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. Cannon burst management (fires every ~3.5 to 5 seconds)
      if (time > nextCannonTime) {
        cannonFlash = 1.0;
        nextCannonTime = time + 3.2 + Math.random() * 2.0;

        // Spawn a puff of billowing smoke particles from the cannon
        const cannonX = width * 0.585;
        const cannonY = height * 0.67;
        for (let s = 0; s < 12; s++) {
          smoke.push({
            x: cannonX + (Math.random() - 0.5) * 15,
            y: cannonY + (Math.random() - 0.5) * 15,
            vx: 0.8 + Math.random() * 1.8,
            vy: -0.3 - Math.random() * 0.8,
            size: 14 + Math.random() * 16,
            alpha: 0.65,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.03,
            life: 0,
          });
        }
      }

      // Render & decay cannon flash
      if (cannonFlash > 0.01) {
        const cannonX = width * 0.585;
        const cannonY = height * 0.67;

        // Orange fiery muzzle blast
        const blastGrad = ctx.createRadialGradient(cannonX, cannonY, 0, cannonX, cannonY, 45 * cannonFlash);
        blastGrad.addColorStop(0, `rgba(255, 255, 220, ${cannonFlash})`);
        blastGrad.addColorStop(0.3, `rgba(251, 191, 36, ${cannonFlash * 0.9})`);
        blastGrad.addColorStop(0.7, `rgba(249, 115, 22, ${cannonFlash * 0.6})`);
        blastGrad.addColorStop(1, "rgba(249, 115, 22, 0)");

        ctx.globalAlpha = 1.0;
        ctx.fillStyle = blastGrad;
        ctx.beginPath();
        ctx.arc(cannonX, cannonY, 45 * cannonFlash, 0, Math.PI * 2);
        ctx.fill();

        cannonFlash *= 0.84; // Fast flash decay
      }

      // Update & render billowing smoke
      for (let s = smoke.length - 1; s >= 0; s--) {
        const sm = smoke[s];
        sm.life += 0.016;
        sm.x += sm.vx;
        sm.y += sm.vy;
        sm.size += 0.35; // Expand as it rolls
        sm.alpha *= 0.982; // Gradual fade
        sm.rotation += sm.rotSpeed;

        if (sm.alpha <= 0.02 || sm.life > 4.0) {
          smoke.splice(s, 1);
          continue;
        }

        ctx.save();
        ctx.translate(sm.x, sm.y);
        ctx.rotate(sm.rotation);

        const smokeGrad = ctx.createRadialGradient(0, 0, sm.size * 0.2, 0, 0, sm.size);
        smokeGrad.addColorStop(0, `rgba(245, 245, 250, ${sm.alpha})`);
        smokeGrad.addColorStop(0.5, `rgba(215, 220, 230, ${sm.alpha * 0.7})`);
        smokeGrad.addColorStop(1, "rgba(200, 205, 220, 0)");

        ctx.fillStyle = smokeGrad;
        ctx.beginPath();
        ctx.arc(0, 0, sm.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.globalAlpha = 1.0;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* 1. Volumetric God Rays radiating from behind the Skull Mountain */}
      <div
        className="absolute inset-0 opacity-40 mix-blend-screen"
        style={{
          background: `
            radial-gradient(ellipse 70% 60% at 65% 22%, rgba(254, 215, 170, 0.45) 0%, rgba(245, 158, 11, 0.2) 35%, transparent 75%),
            conic-gradient(from 195deg at 65% 22%, transparent 0deg, rgba(254, 240, 138, 0.18) 15deg, transparent 35deg, rgba(254, 215, 170, 0.22) 55deg, transparent 80deg, rgba(251, 191, 36, 0.15) 110deg, transparent 150deg)
          `,
        }}
      />

      {/* 2. Skull Mountain Fiery Eyes (Pulsing glowing amber cores) */}
      {/* Left Eye */}
      <motion.div
        animate={{
          scale: [1, 1.14, 0.98, 1.08, 1],
          opacity: [0.75, 0.95, 0.7, 0.9, 0.75],
        }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute rounded-full"
        style={{
          left: "72.2%",
          top: "24.6%",
          width: "2.4vw",
          height: "2.4vw",
          minWidth: "18px",
          minHeight: "18px",
          background: "radial-gradient(circle, #fffbeb 0%, #fbbf24 45%, #ea580c 85%, transparent 100%)",
          boxShadow: "0 0 24px 8px rgba(251, 191, 36, 0.75), 0 0 45px 15px rgba(249, 115, 22, 0.45)",
          mixBlendMode: "screen",
        }}
      />

      {/* Right Eye */}
      <motion.div
        animate={{
          scale: [1.05, 0.96, 1.15, 1.02, 1.05],
          opacity: [0.8, 0.68, 0.98, 0.72, 0.8],
        }}
        transition={{
          duration: 2.9,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.3,
        }}
        className="absolute rounded-full"
        style={{
          left: "78.4%",
          top: "24.4%",
          width: "2.4vw",
          height: "2.4vw",
          minWidth: "18px",
          minHeight: "18px",
          background: "radial-gradient(circle, #fffbeb 0%, #fbbf24 45%, #ea580c 85%, transparent 100%)",
          boxShadow: "0 0 24px 8px rgba(251, 191, 36, 0.75), 0 0 45px 15px rgba(249, 115, 22, 0.45)",
          mixBlendMode: "screen",
        }}
      />

      {/* 3. Interactive canvas for embers, sea spray, and cannon smoke */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
