"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Volume2 } from "@/components/icons";

interface AudioVisualizerProps {
  src: string;
}

export default function AudioVisualizer({ src }: AudioVisualizerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number>(0);

  // Draw idle ambient waveform before playing
  const drawIdleWave = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const midY = canvas.height / 2;
    const barWidth = 3;
    const gap = 2;
    const totalBars = Math.floor(canvas.width / (barWidth + gap));

    for (let i = 0; i < totalBars; i++) {
      const normalized = i / totalBars;
      // Gentle harmonic wave pattern
      const h = Math.sin(normalized * Math.PI * 4) * 16 + Math.cos(normalized * Math.PI * 8) * 8 + 14;
      const x = i * (barWidth + gap);

      const grad = ctx.createLinearGradient(0, midY - h, 0, midY + h);
      grad.addColorStop(0, "rgba(245, 158, 11, 0.6)");
      grad.addColorStop(0.5, "rgba(217, 119, 6, 0.85)");
      grad.addColorStop(1, "rgba(245, 158, 11, 0.6)");

      ctx.fillStyle = grad;
      ctx.fillRect(x, midY - h / 2, barWidth, h);
    }
  }, []);

  useEffect(() => {
    drawIdleWave();
    return () => {
      cancelAnimationFrame(animationRef.current);
      if (audioCtxRef.current?.state !== "closed") {
        audioCtxRef.current?.close();
      }
    };
  }, [drawIdleWave]);

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.9;

        // Warm nautical gold/amber to crimson peaks gradient
        const grad = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        grad.addColorStop(0, "#d97706");
        grad.addColorStop(0.6, "#fbbf24");
        grad.addColorStop(1, "#fef3c7");

        ctx.fillStyle = grad;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
  };

  const initAudio = () => {
    if (!audioRef.current || audioCtxRef.current) return;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      sourceRef.current = source;

      drawVisualizer();
    } catch {
      // AudioContext fallback
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (audioCtxRef.current?.state === "suspended") {
      audioCtxRef.current.resume();
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      initAudio();
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100 || 0);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col w-full overflow-hidden border-2 border-[#2a1810] rounded-xl bg-[#140a04] shadow-inner">
      {/* Soundwave frequency canvas */}
      <div className="relative w-full h-28 bg-[#180e07] border-b border-[#2a1810]/40 flex items-center justify-center">
        <canvas ref={canvasRef} width={600} height={112} className="w-full h-full opacity-90" />
      </div>

      <div className="p-3.5 sm:p-4 space-y-3 bg-[#201209]">
        <audio
          ref={audioRef}
          src={src}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => {
            setIsPlaying(false);
            drawIdleWave();
          }}
          crossOrigin="anonymous"
          className="hidden"
        />

        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            type="button"
            onClick={togglePlay}
            className="flex items-center justify-center w-11 h-11 text-[#140a04] transition-transform rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:scale-105 active:scale-95 shadow-[0_0_12px_rgba(245,158,11,0.5)] cursor-pointer shrink-0 border border-[#b45309]"
            title={isPlaying ? "Halt Phonograph" : "Play Broadcast"}
          >
            {isPlaying ? (
              <div className="flex space-x-1">
                <div className="w-1.5 h-4 bg-[#140a04] rounded-sm" />
                <div className="w-1.5 h-4 bg-[#140a04] rounded-sm" />
              </div>
            ) : (
              <div className="w-0 h-0 ml-1 border-t-[7px] border-t-transparent border-l-[11px] border-l-[#140a04] border-b-[7px] border-b-transparent" />
            )}
          </button>

          <div className="flex flex-col flex-1 space-y-1.5">
            <div className="flex justify-between text-xs font-code text-amber-200/70 font-semibold">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration || 0)}</span>
            </div>

            <div
              className="relative w-full h-2 cursor-pointer bg-[#140a04] border border-[#b45309]/30 rounded-full overflow-hidden"
              onClick={(e) => {
                if (!audioRef.current || !duration) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                audioRef.current.currentTime = pos * duration;
              }}
            >
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-500 to-amber-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <Volume2 className="w-5 h-5 text-amber-400/80 shrink-0" />
        </div>
      </div>
    </div>
  );
}
