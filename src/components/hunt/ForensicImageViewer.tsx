"use client";

import { useState, useRef } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Sun, Contrast } from "@/components/icons";
import { cn } from "@/lib/utils";

interface ForensicImageViewerProps {
  src: string;
  alt?: string;
}

export default function ForensicImageViewer({ src, alt = "Forensic Asset" }: ForensicImageViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [invert, setInvert] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleReset = () => {
    setZoom(1);
    setBrightness(100);
    setContrast(100);
    setInvert(false);
    setPan({ x: 0, y: 0 });
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));

  const handlePointerDown = (clientX: number, clientY: number) => {
    if (zoom > 1) {
      setIsDragging(true);
      dragStart.current = { x: clientX - pan.x, y: clientY - pan.y };
    }
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (isDragging && zoom > 1) {
      setPan({
        x: clientX - dragStart.current.x,
        y: clientY - dragStart.current.y,
      });
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex flex-col w-full overflow-hidden border-2 border-[#2a1810] rounded-xl bg-[#140a04] shadow-inner">
      {/* Spyglass Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 sm:p-3 border-b-2 border-[#2a1810] bg-[#201209]">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 text-amber-300/80 hover:text-amber-200 hover:bg-[#381e10] rounded-lg transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-code text-amber-300 font-bold w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 text-amber-300/80 hover:text-amber-200 hover:bg-[#381e10] rounded-lg transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="items-center space-x-1.5 hidden sm:flex">
            <Sun className="w-4 h-4 text-amber-400/70" />
            <input
              type="range"
              min="20"
              max="200"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-18 accent-amber-400 cursor-pointer"
              title="Brightness"
            />
          </div>
          <div className="items-center space-x-1.5 hidden sm:flex">
            <Contrast className="w-4 h-4 text-amber-400/70" />
            <input
              type="range"
              min="20"
              max="250"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-18 accent-amber-400 cursor-pointer"
              title="Contrast"
            />
          </div>

          <button
            type="button"
            onClick={() => setInvert(!invert)}
            className={cn(
              "px-2.5 py-1 text-xs font-bold uppercase rounded-lg border transition-all cursor-pointer font-sans",
              invert
                ? "bg-amber-400 text-black border-amber-400 shadow-sm"
                : "bg-[#2a1810] text-amber-300 border-[#b45309]/50 hover:bg-[#381e10]"
            )}
          >
            Invert
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 text-amber-400/70 hover:text-red-400 hover:bg-[#381e10] rounded-lg transition-colors cursor-pointer"
            title="Reset Filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Forensic Examination Stage */}
      <div
        className="relative w-full h-64 sm:h-96 overflow-hidden bg-[#180e07] flex items-center justify-center cursor-move select-none"
        onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
        onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={(e) => handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={handlePointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          draggable={false}
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            filter: `brightness(${brightness}%) contrast(${contrast}%) invert(${invert ? 100 : 0}%)`,
            transition: isDragging ? "none" : "transform 0.1s ease-out",
          }}
          className="max-w-full max-h-full object-contain"
        />
      </div>
    </div>
  );
}
