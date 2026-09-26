"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * AudioAmbientToggle — minimal corner sound toggle for ambient waves/wind.
 * Synthesizes the ocean with WebAudio (filtered noise + slow LFO swell).
 * Guaranteed complete muting with AudioContext suspension & node disconnection.
 */

export default function AudioAmbientToggle({ className }: { className?: string }) {
  const [enabled, setEnabled] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const srcRef = useRef<AudioBufferSourceNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const isPlayingRef = useRef(false);

  const cleanupNodes = useCallback(() => {
    try {
      if (gainRef.current) {
        gainRef.current.gain.cancelScheduledValues(0);
        gainRef.current.gain.value = 0;
        gainRef.current.disconnect();
        gainRef.current = null;
      }
      if (srcRef.current) {
        srcRef.current.stop();
        srcRef.current.disconnect();
        srcRef.current = null;
      }
      if (lfoRef.current) {
        lfoRef.current.stop();
        lfoRef.current.disconnect();
        lfoRef.current = null;
      }
    } catch {
      // Ignore if nodes were already stopped
    }
  }, []);

  const stop = useCallback(() => {
    isPlayingRef.current = false;
    cleanupNodes();
    if (ctxRef.current && ctxRef.current.state !== "closed") {
      void ctxRef.current.suspend();
    }
  }, [cleanupNodes]);

  const start = useCallback(() => {
    if (isPlayingRef.current) return;

    try {
      const AudioCtx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!ctxRef.current) {
        ctxRef.current = new AudioCtx();
      }

      const ctx = ctxRef.current;
      if (ctx.state === "suspended") {
        void ctx.resume();
      }

      cleanupNodes();

      // Brown-ish noise buffer (4s, looped)
      const duration = 4;
      const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < data.length; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.2;
      }

      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;

      // Lowpass so it reads as distant surf
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 480;
      lp.Q.value = 0.6;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 0.8);

      // Slow swell LFO on the lowpass cutoff (waves breathing)
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.11;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 180;
      lfo.connect(lfoGain).connect(lp.frequency);

      src.connect(lp).connect(gain).connect(ctx.destination);
      src.start();
      lfo.start();

      srcRef.current = src;
      lfoRef.current = lfo;
      gainRef.current = gain;
      isPlayingRef.current = true;
    } catch (err) {
      console.warn("Ambient audio start failed:", err);
    }
  }, [cleanupNodes]);

  useEffect(() => {
    // Restore preference on mount
    try {
      if (localStorage.getItem("findx_ambient_sound") === "on") {
        setEnabled(true);
      }
    } catch {
      // ignore
    }

    return () => {
      stop();
      if (ctxRef.current && ctxRef.current.state !== "closed") {
        void ctxRef.current.close();
        ctxRef.current = null;
      }
    };
  }, [stop]);

  // Autoplay handler: only if enabled but not yet playing, start on first user interaction
  useEffect(() => {
    if (!enabled || isPlayingRef.current) return;

    const handleFirstInteraction = () => {
      if (!isPlayingRef.current) {
        start();
      }
    };

    window.addEventListener("pointerdown", handleFirstInteraction, { once: true });
    window.addEventListener("keydown", handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener("pointerdown", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
  }, [enabled, start]);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !enabled;
    setEnabled(next);
    try {
      localStorage.setItem("findx_ambient_sound", next ? "on" : "off");
    } catch {
      // ignore
    }

    if (next) {
      start();
    } else {
      stop();
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={enabled ? "Mute ambient sound" : "Play ambient sound"}
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white/80 backdrop-blur-2xl transition-all hover:text-amber-300 hover:bg-white/10 active:scale-95 shadow-xl cursor-pointer",
        enabled && "border-amber-400/50 text-amber-300 bg-amber-400/10 shadow-[0_0_16px_rgba(251,191,36,0.45)]",
        className
      )}
    >
      {enabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
    </button>
  );
}
