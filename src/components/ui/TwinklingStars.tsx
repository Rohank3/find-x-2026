"use client";

import React, { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  twinkleRange: number;
  twinkleSpeed: number;
  phase: number;
  colorRgb: string;
  isGlow: boolean;
  isCross: boolean;
  vx: number;
  vy: number;
}

export default function TwinklingStars({
  className = "absolute inset-0 pointer-events-none",
  starCount = 110,
}: {
  className?: string;
  starCount?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Palette: Starlight Pearl, Celestial Gold, and Thread Bronze
    const colors = [
      "245, 242, 235", // 60% Pearl White
      "245, 242, 235",
      "245, 242, 235",
      "229, 184, 66",  // 25% Bright Celestial Gold
      "201, 151, 38",  // 10% Deep Gold
      "180, 135, 45",  // 5% Bronze Thread
    ];

    // Seed stars with normalized coordinates
    const stars: Star[] = Array.from({ length: starCount }, () => {
      const isHero = Math.random() < 0.12;
      const isGold = Math.random() < 0.35;
      const colorRgb = isGold
        ? colors[3 + Math.floor(Math.random() * 3)]
        : colors[Math.floor(Math.random() * 3)];

      return {
        x: Math.random(),
        y: Math.random(),
        size: isHero ? 1.6 + Math.random() * 0.9 : 0.7 + Math.random() * 0.9,
        baseAlpha: 0.15 + Math.random() * 0.35,
        twinkleRange: 0.35 + Math.random() * 0.5,
        twinkleSpeed: 1.2 + Math.random() * 2.8,
        phase: Math.random() * Math.PI * 2,
        colorRgb,
        isGlow: isHero,
        isCross: isHero && Math.random() < 0.45,
        vx: (Math.random() - 0.5) * 0.000025,
        vy: (Math.random() - 0.5) * 0.000025,
      };
    });

    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      width = rect.width || window.innerWidth;
      height = rect.height || window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    let lastTime = performance.now();

    const render = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      // Skip render if canvas is zero-sized or tab is hidden
      if (width === 0 || height === 0 || document.hidden) {
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      const timeSec = now / 1000;

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];

        // Drift slowly
        s.x += s.vx * delta * 60;
        s.y += s.vy * delta * 60;
        if (s.x < 0) s.x += 1;
        if (s.x > 1) s.x -= 1;
        if (s.y < 0) s.y += 1;
        if (s.y > 1) s.y -= 1;

        const px = s.x * width;
        const py = s.y * height;

        // Smooth sinusoidal twinkle
        const wave = Math.sin(timeSec * s.twinkleSpeed + s.phase);
        const alpha = Math.max(0.06, Math.min(1, s.baseAlpha + wave * s.twinkleRange));

        // Soft celestial bloom for hero stars
        if (s.isGlow && alpha > 0.4) {
          const glowRadius = s.size * 3.8;
          const grad = ctx.createRadialGradient(px, py, 0, px, py, glowRadius);
          grad.addColorStop(0, `rgba(${s.colorRgb}, ${alpha * 0.45})`);
          grad.addColorStop(0.5, `rgba(${s.colorRgb}, ${alpha * 0.15})`);
          grad.addColorStop(1, `rgba(${s.colorRgb}, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(px, py, glowRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Delicate 4-point diffraction spike for brightest hero stars
        if (s.isCross && alpha > 0.6) {
          const spikeLen = s.size * 4;
          ctx.strokeStyle = `rgba(${s.colorRgb}, ${alpha * 0.35})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(px - spikeLen, py);
          ctx.lineTo(px + spikeLen, py);
          ctx.moveTo(px, py - spikeLen);
          ctx.lineTo(px, py + spikeLen);
          ctx.stroke();
        }

        // Core star body
        ctx.fillStyle = `rgba(${s.colorRgb}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    const handleVisibility = () => {
      if (!document.hidden) {
        lastTime = performance.now();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [starCount]);

  return (
    <div className={`overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      {/* Subtle atmospheric radial spotlight in the upper-center void */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 30%, hsl(45 68% 47% / 0.08) 0%, transparent 70%)",
        }}
      />
      {/* Secondary lower nebula glow */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 85%, hsl(44 63% 33% / 0.06) 0%, transparent 60%)",
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
