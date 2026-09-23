"use client";

import { useEffect, useRef } from "react";

/**
 * OceanWaterFX — dynamic living water surface with churning foam wakes,
 * turquoise crest displacement, and sparkling sunlight specular glints.
 */
export default function OceanWaterFX({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight * 0.45);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight * 0.45;
    };
    window.addEventListener("resize", onResize);

    // Wave parameters
    const waves = [
      { speed: 1.4, freq: 0.008, amp: 14, phase: 0 },
      { speed: 2.1, freq: 0.014, amp: 9, phase: 1.2 },
      { speed: 0.8, freq: 0.004, amp: 20, phase: 2.5 },
    ];

    // Sea sparkles
    const sparkles = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.5 + 1,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 2 + 1,
    }));

    let time = 0;

    const render = () => {
      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      // Gradient representing deep aquatic depth
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, "rgba(8, 32, 50, 0.0)");
      grad.addColorStop(0.35, "rgba(6, 95, 120, 0.22)");
      grad.addColorStop(0.7, "rgba(14, 116, 144, 0.35)");
      grad.addColorStop(1, "rgba(4, 47, 66, 0.55)");

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Render layered wave crests with foam highlights
      [0.2, 0.45, 0.7, 0.9].forEach((depth, idx) => {
        ctx.beginPath();
        const baseOffset = height * depth;
        ctx.moveTo(0, height);

        for (let x = 0; x <= width; x += 15) {
          let waveY = 0;
          waves.forEach((w) => {
            waveY += Math.sin(x * w.freq + time * w.speed + w.phase + idx) * w.amp * (0.5 + depth * 0.5);
          });
          const y = baseOffset + waveY;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        // Water layer color
        const alpha = 0.08 + idx * 0.06;
        ctx.fillStyle = `rgba(14, 165, 233, ${alpha})`;
        ctx.fill();

        // Foam crest line
        ctx.lineWidth = 1.8 + idx * 0.5;
        ctx.strokeStyle = `rgba(224, 242, 254, ${0.25 + idx * 0.15})`;
        ctx.stroke();
      });

      // Render shimmering sun glints on the waves
      sparkles.forEach((sp) => {
        const pulse = Math.sin(time * sp.speed + sp.phase);
        if (pulse > 0.3) {
          const sparkAlpha = (pulse - 0.3) * 1.4;
          ctx.fillStyle = `rgba(254, 215, 170, ${sparkAlpha * 0.85})`;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.size * (0.8 + pulse * 0.4), 0, Math.PI * 2);
          ctx.fill();

          // Cross star glint
          ctx.strokeStyle = `rgba(255, 255, 255, ${sparkAlpha * 0.6})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(sp.x - sp.size * 2, sp.y);
          ctx.lineTo(sp.x + sp.size * 2, sp.y);
          ctx.moveTo(sp.x, sp.y - sp.size * 2);
          ctx.lineTo(sp.x, sp.y + sp.size * 2);
          ctx.stroke();
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute bottom-0 left-0 w-full ${className ?? ""}`}
      style={{ height: "45%", mixBlendMode: "screen" }}
    />
  );
}
