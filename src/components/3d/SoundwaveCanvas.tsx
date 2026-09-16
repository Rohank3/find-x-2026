"use client";

import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, RotateCcw } from "lucide-react";

interface SoundwaveCanvasProps {
  audioUrl: string;
  title?: string;
}

export default function SoundwaveCanvas({ audioUrl, title = "Audio Clue" }: SoundwaveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Old readout rendered seconds:hundredths as MM:SS and hardcoded the total
  // as "NN:00" — a 90s clip displayed "45:73 / 01:00".
  const fmt = (t: number) => {
    if (!isFinite(t) || t < 0) return "00:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const restartAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
  };

  // Canvas visualizer animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Draw subtle background grid lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      for (let y = 0; y < height; y += 16) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const bars = 52;
      const barWidth = width / bars;

      for (let i = 0; i < bars; i++) {
        const x = i * barWidth;

        // Dynamic frequency simulation based on playing state
        const amplitude = isPlaying
          ? Math.sin(phase + i * 0.28) * Math.cos(phase * 0.45 + i * 0.12) * (height * 0.42) + (height * 0.1)
          : Math.sin(i * 0.35) * 3 + 5;

        const barHeight = Math.max(3, Math.abs(amplitude));
        const y = (height - barHeight) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, "#ffffff");
        gradient.addColorStop(0.5, "#d4d4d8");
        gradient.addColorStop(1, "#52525b");

        ctx.fillStyle = gradient;
        ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
      }

      if (isPlaying) {
        phase += 0.08;
        // rAF loop only runs while playing — the old version repainted the
        // static waveform at 60fps for the entire page lifetime (CPU drain).
        animationId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPlaying]);

  return (
    <div className="relative border border-white/20 bg-black p-5 my-4 font-mono">
      <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white/60" />
      <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white/60" />
      <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-white/60" />
      <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white/60" />

      <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
        <div className="flex items-center space-x-2">
          <span className="h-2 w-2 bg-emerald-400 animate-pulse" />
          <span className="text-xs uppercase tracking-widest text-white/80 font-bold">
            Audio Clue: {title}
          </span>
        </div>
        <div className="text-xs text-white/50 tracking-wider">
          {fmt(currentTime)} / {duration > 0 ? fmt(duration) : "--:--"}
        </div>
      </div>

      {/* Visualizer Canvas */}
      <div className="bg-black border border-white/10 overflow-hidden mb-4 p-2">
        <canvas ref={canvasRef} width={640} height={100} className="w-full h-24 block" />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={togglePlay}
            className="flex items-center justify-center px-4 py-2 border border-white/40 hover:border-white hover:bg-white hover:text-black text-white text-xs uppercase tracking-widest font-bold transition space-x-1.5"
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                <span>Play</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={restartAudio}
            className="flex items-center justify-center p-2 border border-white/15 hover:border-white/40 text-white/60 hover:text-white transition"
            title="Restart Audio"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!audioRef.current) return;
            audioRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
          }}
          className="p-2 border border-white/15 hover:border-white/40 text-white/60 hover:text-white transition"
        >
          {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
}
