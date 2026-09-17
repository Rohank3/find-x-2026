"use client";

import React, { useState } from "react";
import { Sliders, ZoomIn, ZoomOut, RefreshCw } from "lucide-react";

interface SilhouetteViewerProps {
  imageUrl: string;
  altText?: string;
}

export default function SilhouetteViewer({ imageUrl, altText = "Puzzle Image Clue" }: SilhouetteViewerProps) {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [invert, setInvert] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showControls, setShowControls] = useState(false);

  const resetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setInvert(false);
    setZoom(1);
  };

  return (
    <div className="relative border border-white/20 bg-black my-4 font-mono">
      <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white/60" />
      <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white/60" />
      <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-white/60" />
      <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white/60" />

      {/* Header Bar */}
      <div className="flex items-center justify-between p-3 border-b border-white/10 bg-black/90">
        <div className="flex items-center space-x-2">
          <span className="h-1.5 w-1.5 bg-white animate-pulse" />
          <span className="text-xs tracking-widest text-white/80 uppercase font-bold">
            Image Inspector
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(z + 0.25, 2.5))}
            className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition border border-transparent hover:border-white/20"
            title="Zoom In"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.75))}
            className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition border border-transparent hover:border-white/20"
            title="Zoom Out"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setShowControls((v) => !v)}
            className={`p-2 min-h-[40px] min-w-[40px] flex items-center justify-center transition border ${
              showControls ? "bg-white text-black font-bold border-white" : "text-white/60 hover:text-white hover:bg-white/10 border-white/10"
            }`}
            title="Adjust Image Filters"
            aria-label="Adjust image filters"
          >
            <Sliders className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition border border-transparent hover:border-white/20"
            title="Reset Filters"
            aria-label="Reset filters"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Filter adjustment drawer */}
      {showControls && (
        <div className="p-3 bg-black border-b border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-white/70">
          <div>
            <label className="text-white/50 block mb-1 uppercase tracking-wider">Contrast: {contrast}%</label>
            <input
              type="range"
              min="20"
              max="250"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-full accent-white"
            />
          </div>
          <div>
            <label className="text-white/50 block mb-1 uppercase tracking-wider">Brightness: {brightness}%</label>
            <input
              type="range"
              min="20"
              max="200"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full accent-white"
            />
          </div>
          <div className="flex items-center space-x-2 pt-4">
            <input
              type="checkbox"
              id="invert"
              checked={invert}
              onChange={(e) => setInvert(e.target.checked)}
              className="rounded-none border-white/40 accent-white"
            />
            <label htmlFor="invert" className="text-white/70 uppercase tracking-wider cursor-pointer">
              Invert Colors
            </label>
          </div>
        </div>
      )}

      {/* Canvas Viewport */}
      <div className="relative overflow-hidden bg-black p-4 flex items-center justify-center min-h-[300px] select-none">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        {/* eslint-disable-next-line @next/next/no-img-element -- organizer-supplied cipher imagery with per-image CSS filter/zoom manipulation; next/image would require a remote-host allowlist and optimizes away pixel data this puzzle type depends on. */}
        <img
          src={imageUrl}
          alt={altText}
          style={{
            filter: `contrast(${contrast}%) brightness(${brightness}%) ${invert ? "invert(1)" : ""}`,
            transform: `scale(${zoom})`,
            transition: "transform 0.15s ease",
          }}
          className="max-h-[500px] max-w-full w-auto object-contain select-none"
        />
      </div>
    </div>
  );
}
