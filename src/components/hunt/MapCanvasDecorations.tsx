"use client";

import React, { useEffect, useRef } from "react";

interface MapCanvasDecorationsProps {
  totalHeight: number;
}

interface ImageStamp {
  src: string;
  img?: HTMLImageElement;
}

const DECOR_ASSET_PATHS = [
  "/images/hunt/decor/ink_island_palms.png",
  "/images/hunt/decor/ink_mountains.png",
  "/images/hunt/decor/ink_galleon.png",
  "/images/hunt/decor/ink_chest_small.png",
  "/images/hunt/decor/ink_skull_crossbones.png",
  "/images/hunt/decor/ink_ruins.png",
  "/images/hunt/decor/ink_anchor.png",
  "/images/hunt/decor/ink_sea_serpent.png",
  "/images/hunt/decor/ink_chest_large.png",
  "/images/hunt/decor/ink_compass_rose.png",
  "/images/hunt/decor/mark_x_red.png",
  "/images/hunt/decor/mark_dagger.png",
  "/images/hunt/decor/mark_blood_splat_1.png",
  "/images/hunt/decor/mark_blood_splat_2.png",
  "/images/hunt/decor/mark_ink_splat_dark.png",
  "/images/hunt/decor/mark_skull_dagger.png",
];

export default function MapCanvasDecorations({
  totalHeight,
}: MapCanvasDecorationsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedImagesRef = useRef<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    let isCancelled = false;

    // Preload all thin black ink & blood stamp assets
    const loadPromises = DECOR_ASSET_PATHS.map((src) => {
      if (loadedImagesRef.current[src]) {
        return Promise.resolve({ src, img: loadedImagesRef.current[src] });
      }
      return new Promise<ImageStamp>((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve({ src, img });
        img.onerror = () => resolve({ src });
      });
    });

    Promise.all(loadPromises).then((results) => {
      if (isCancelled) return;
      results.forEach((r) => {
        if (r.img) loadedImagesRef.current[r.src] = r.img;
      });
      renderCanvas();
    });

    const renderCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = container.clientWidth;
      const height = totalHeight;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Deterministic PRNG for consistent placement on resize
      let seed = 42891;
      const random = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };

      const images = loadedImagesRef.current;

      // -------------------------------------------------------------
      // 1. PROCEDURAL RHUMB LINES & COMPASS NETWORKS (Thin Sepia Ink)
      // -------------------------------------------------------------
      ctx.save();
      ctx.strokeStyle = "rgba(80, 35, 10, 0.09)";
      ctx.lineWidth = 0.8;

      const numRhumbCenters = Math.max(3, Math.floor(height / 600));
      for (let i = 0; i < numRhumbCenters; i++) {
        const cx = (i % 2 === 0 ? 0.2 : 0.8) * width + (random() - 0.5) * 60;
        const cy = 250 + i * 550 + (random() - 0.5) * 100;
        const rayCount = 16;

        for (let r = 0; r < rayCount; r++) {
          const angle = (r / rayCount) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(angle) * (width * 0.9), cy + Math.sin(angle) * (width * 0.9));
          ctx.stroke();
        }

        // Concentric range rings
        for (let rad = 30; rad <= 120; rad += 45) {
          ctx.beginPath();
          ctx.arc(cx, cy, rad, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.restore();

      // -------------------------------------------------------------
      // 2. PROCEDURAL TOPOGRAPHIC CONTOURS & REEF HATCHINGS
      // -------------------------------------------------------------
      ctx.save();
      ctx.strokeStyle = "rgba(70, 30, 10, 0.14)";
      ctx.lineWidth = 1;

      const numContourClusters = Math.max(4, Math.floor(height / 450));
      for (let i = 0; i < numContourClusters; i++) {
        const cx = (i % 2 === 0 ? 0.15 : 0.82) * width + (random() - 0.5) * 40;
        const cy = 180 + i * 420 + (random() - 0.5) * 80;
        const rings = 4;

        for (let r = 1; r <= rings; r++) {
          ctx.beginPath();
          const baseRad = r * 18;
          const points = 14;
          for (let p = 0; p <= points; p++) {
            const angle = (p / points) * Math.PI * 2;
            const wobble = (random() * 0.35 + 0.85) * baseRad;
            const px = cx + Math.cos(angle) * wobble;
            const py = cy + Math.sin(angle) * wobble;
            if (p === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
      ctx.restore();

      // -------------------------------------------------------------
      // 3. DETAILED THIN BLACK INK OBJECT STAMPS (Islands, Ships, Ruins)
      // -------------------------------------------------------------
      ctx.save();
      ctx.globalCompositeOperation = "source-over";

      // Placement distribution along height
      const objectPlacements: Array<{
        src: string;
        side: "left" | "right" | "center";
        yOffset: number;
        width: number;
        opacity: number;
        tilt?: number;
      }> = [
        // Upper zone
        {
          src: "/images/hunt/decor/ink_mountains.png",
          side: "right",
          yOffset: 200,
          width: 140,
          opacity: 0.88,
        },
        {
          src: "/images/hunt/decor/ink_island_palms.png",
          side: "left",
          yOffset: 340,
          width: 120,
          opacity: 0.9,
        },
        // Mid-upper zone
        {
          src: "/images/hunt/decor/ink_galleon.png",
          side: "right",
          yOffset: 620,
          width: 135,
          opacity: 0.9,
          tilt: -0.05,
        },
        {
          src: "/images/hunt/decor/ink_ruins.png",
          side: "left",
          yOffset: 860,
          width: 140,
          opacity: 0.85,
        },
        {
          src: "/images/hunt/decor/ink_anchor.png",
          side: "right",
          yOffset: 1080,
          width: 90,
          opacity: 0.85,
          tilt: 0.1,
        },
        // Deep sea mid zone
        {
          src: "/images/hunt/decor/ink_sea_serpent.png",
          side: "left",
          yOffset: 1320,
          width: 165,
          opacity: 0.92,
        },
        {
          src: "/images/hunt/decor/ink_island_palms.png",
          side: "right",
          yOffset: 1550,
          width: 115,
          opacity: 0.85,
        },
        {
          src: "/images/hunt/decor/ink_galleon.png",
          side: "left",
          yOffset: 1820,
          width: 125,
          opacity: 0.85,
          tilt: 0.08,
        },
        {
          src: "/images/hunt/decor/ink_mountains.png",
          side: "left",
          yOffset: 2100,
          width: 135,
          opacity: 0.85,
        },
        {
          src: "/images/hunt/decor/ink_ruins.png",
          side: "right",
          yOffset: 2350,
          width: 130,
          opacity: 0.85,
        },
        // Climax near treasure
        {
          src: "/images/hunt/decor/ink_chest_large.png",
          side: "right",
          yOffset: Math.max(800, height - 420),
          width: 130,
          opacity: 0.92,
        },
        {
          src: "/images/hunt/decor/ink_skull_crossbones.png",
          side: "left",
          yOffset: Math.max(750, height - 350),
          width: 85,
          opacity: 0.88,
        },
      ];

      // Draw thin black ink illustrations
      objectPlacements.forEach((item) => {
        if (item.yOffset > height - 100) return;
        const img = images[item.src];
        if (!img || !img.complete) return;

        const aspect = img.height / img.width;
        const drawW = Math.min(item.width, width * 0.28);
        const drawH = drawW * aspect;

        let posX = 0;
        if (item.side === "left") {
          posX = 20 + random() * 25;
        } else if (item.side === "right") {
          posX = width - drawW - 20 - random() * 25;
        } else {
          posX = (width - drawW) / 2;
        }

        const posY = item.yOffset;

        ctx.save();
        ctx.globalAlpha = item.opacity;
        ctx.translate(posX + drawW / 2, posY + drawH / 2);
        if (item.tilt) ctx.rotate(item.tilt);
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      });

      // -------------------------------------------------------------
      // 4. CRIMSON BLOOD SPLATTERS, DAGGER STAINS & RED X MARKS
      // -------------------------------------------------------------
      const bloodAndMarks: Array<{
        src: string;
        xRatio: number;
        yPos: number;
        width: number;
        opacity: number;
        tilt?: number;
      }> = [
        {
          src: "/images/hunt/decor/mark_blood_splat_1.png",
          xRatio: 0.84,
          yPos: 280,
          width: 90,
          opacity: 0.85,
        },
        {
          src: "/images/hunt/decor/mark_x_red.png",
          xRatio: 0.16,
          yPos: 520,
          width: 65,
          opacity: 0.82,
          tilt: -0.15,
        },
        {
          src: "/images/hunt/decor/mark_dagger.png",
          xRatio: 0.85,
          yPos: 760,
          width: 85,
          opacity: 0.88,
          tilt: 0.2,
        },
        {
          src: "/images/hunt/decor/mark_blood_splat_2.png",
          xRatio: 0.14,
          yPos: 1180,
          width: 100,
          opacity: 0.82,
        },
        {
          src: "/images/hunt/decor/mark_ink_splat_dark.png",
          xRatio: 0.86,
          yPos: 1450,
          width: 95,
          opacity: 0.8,
        },
        {
          src: "/images/hunt/decor/mark_skull_dagger.png",
          xRatio: 0.15,
          yPos: 1720,
          width: 80,
          opacity: 0.85,
        },
        {
          src: "/images/hunt/decor/mark_blood_splat_1.png",
          xRatio: 0.84,
          yPos: 2020,
          width: 95,
          opacity: 0.8,
        },
        {
          src: "/images/hunt/decor/mark_x_red.png",
          xRatio: 0.5,
          yPos: Math.max(600, height - 280),
          width: 90,
          opacity: 0.9,
          tilt: 0.1,
        },
      ];

      bloodAndMarks.forEach((mark) => {
        if (mark.yPos > height - 80) return;
        const img = images[mark.src];
        if (!img || !img.complete) return;

        const aspect = img.height / img.width;
        const drawW = mark.width;
        const drawH = drawW * aspect;
        const posX = mark.xRatio * width - drawW / 2;
        const posY = mark.yPos;

        ctx.save();
        ctx.globalAlpha = mark.opacity;
        ctx.translate(posX + drawW / 2, posY + drawH / 2);
        if (mark.tilt) ctx.rotate(mark.tilt);
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      });

      // -------------------------------------------------------------
      // 5. VINTAGE HAND-LETTERED PIRATE & CARTOGRAPHIC INSCRIPTIONS
      // -------------------------------------------------------------
      ctx.save();
      ctx.fillStyle = "rgba(60, 25, 10, 0.45)";
      ctx.font = "italic bold 13px 'Georgia', serif";

      const mapNotes = [
        { text: "TERRA INCOGNITA", xRatio: 0.82, y: 440, rot: 0.08 },
        { text: "HIC SUNT DRACONES", xRatio: 0.14, y: 720, rot: -0.12 },
        { text: "DEAD MAN'S REEF", xRatio: 0.84, y: 980, rot: 0.05 },
        { text: "MARE TENEBROSUM", xRatio: 0.15, y: 1260, rot: -0.06 },
        { text: "SIREN'S COVE", xRatio: 0.83, y: 1650, rot: 0.09 },
        { text: "FORBIDDEN SHOALS", xRatio: 0.14, y: 1940, rot: -0.08 },
        { text: "VOYAGE TO RAFTEL", xRatio: 0.5, y: height - 190, rot: 0 },
      ];

      mapNotes.forEach((note) => {
        if (note.y > height - 70) return;
        ctx.save();
        ctx.translate(note.xRatio * width, note.y);
        ctx.rotate(note.rot);
        ctx.textAlign = "center";
        ctx.fillText(note.text, 0, 0);
        ctx.restore();
      });

      ctx.restore();
    };

    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(renderCanvas, 80);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      isCancelled = true;
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
    };
  }, [totalHeight]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[5]"
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full opacity-90 mix-blend-multiply pointer-events-none"
      />
    </div>
  );
}
