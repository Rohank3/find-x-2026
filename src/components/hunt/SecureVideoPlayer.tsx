"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Film,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { AlertCircle } from "@/components/icons";
import { isValidSafeUrl } from "@/lib/utils";

interface SecureVideoPlayerProps {
  src: string;
  title?: string | null;
}

export default function SecureVideoPlayer({ src, title = "Motion Evidence" }: SecureVideoPlayerProps) {
  const isSafe = typeof src === "string" && isValidSafeUrl(src);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [prevSrc, setPrevSrc] = useState(src);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

  if (src !== prevSrc) {
    setPrevSrc(src);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsBuffering(false);
  }

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused || videoRef.current.ended) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (newVolume: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    if (newVolume === 0) {
      videoRef.current.muted = true;
      setIsMuted(true);
    } else if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = percent * duration;
    setCurrentTime(percent * duration);
  };

  const handleRestart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(() => {});
    setIsPlaying(true);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const triggerControlsActivity = () => {
    setShowControls(true);
    if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
    if (isPlaying) {
      hideControlsTimeout.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [src]);

  useEffect(() => {
    return () => {
      if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
    };
  }, []);

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return "0:00";
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isSafe) {
    return (
      <div className="flex flex-col items-center justify-center w-full p-8 border-2 border-red-300 rounded-xl bg-red-100 text-red-800">
        <AlertCircle className="w-12 h-12 mb-3 text-red-700" />
        <p className="font-bold text-sm font-sans">Invalid or unsafe video source.</p>
      </div>
    );
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      className="flex flex-col w-full overflow-hidden border-2 border-[#2a1810] rounded-xl bg-[#140a04] shadow-2xl select-none"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between p-2.5 sm:p-3 border-b-2 border-[#2a1810] bg-[#201209]">
        <div className="flex items-center space-x-2">
          <Film className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider font-sans text-amber-300">
            {title || "Motion Dispatch"}
          </span>
        </div>
        <span className="text-[10px] font-mono text-amber-400/70">
          Vessel Surveillance Feed
        </span>
      </div>

      {/* Main Video Viewport */}
      <div
        className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={togglePlay}
        onMouseMove={triggerControlsActivity}
        onTouchStart={triggerControlsActivity}
      >
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-contain pointer-events-none"
          playsInline
          disablePictureInPicture
          controlsList="nodownload noplaybackrate"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => {
            setIsBuffering(false);
            setIsPlaying(true);
          }}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Buffering Indicator */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs pointer-events-none z-10">
            <div className="flex flex-col items-center space-y-2 text-amber-400">
              <Loader2 className="w-10 h-10 animate-spin" />
              <span className="text-xs font-mono font-bold tracking-wider uppercase">
                Acquiring Frequency...
              </span>
            </div>
          </div>
        )}

        {/* Center Big Play Button (when paused and not buffering) */}
        {!isPlaying && !isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none z-10 transition-opacity">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 flex items-center justify-center text-black shadow-[0_0_20px_rgba(245,158,11,0.5)] transform scale-100 hover:scale-105 transition-transform">
              <Play className="w-8 h-8 ml-1 fill-black" />
            </div>
          </div>
        )}

        {/* Floating Custom Controls Overlay (Protected: no download or popout buttons) */}
        <div
          className={`absolute bottom-0 left-0 right-0 p-2 sm:p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 z-20 flex flex-col space-y-2 ${
            showControls || !isPlaying ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress / Seek bar */}
          <div
            className="group relative w-full h-2 hover:h-3 bg-white/20 rounded-full cursor-pointer transition-all flex items-center"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-amber-200 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between text-amber-200 text-xs">
            {/* Left Controls: Play/Pause, Replay, Time */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                type="button"
                onClick={togglePlay}
                className="p-1.5 hover:text-white bg-[#201209]/80 border border-amber-600/30 rounded-lg transition-colors cursor-pointer active:scale-95"
                title={isPlaying ? "Halt Video" : "Commence Video"}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <button
                type="button"
                onClick={handleRestart}
                className="p-1.5 hover:text-white bg-[#201209]/80 border border-amber-600/30 rounded-lg transition-colors cursor-pointer active:scale-95"
                title="Restart from beginning"
                aria-label="Restart Video"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="font-mono text-[11px] sm:text-xs font-semibold text-amber-300">
                <span>{formatTime(currentTime)}</span>
                <span className="text-amber-400/50 mx-1">/</span>
                <span className="text-amber-400/70">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right Controls: Volume & Fullscreen (strictly contained) */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Volume Slider & Toggle */}
              <div className="flex items-center space-x-1.5 bg-[#201209]/80 border border-amber-600/30 rounded-lg px-2 py-1">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="hover:text-white transition-colors cursor-pointer"
                  title={isMuted ? "Unmute Sound" : "Mute Sound"}
                  aria-label="Toggle Mute"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-amber-300" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-14 sm:w-20 accent-amber-400 cursor-pointer h-1"
                  title="Volume Level"
                />
              </div>

              {/* Contained Fullscreen Toggle */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-1.5 hover:text-white bg-[#201209]/80 border border-amber-600/30 rounded-lg transition-colors cursor-pointer active:scale-95"
                title={isFullscreen ? "Exit Fullscreen" : "Maximize View"}
                aria-label="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
