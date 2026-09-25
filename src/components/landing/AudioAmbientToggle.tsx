"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * AudioAmbientToggle — minimal corner sound toggle for ambient waves/wind.
 * Synthesizes the ocean with WebAudio (filtered noise + slow LFO swell) so
 * no audio files are shipped. Starts muted; persists preference in localStorage.
 */

export default function AudioAmbientToggle({ className }: { className?: string }) {
  const [enabled, setEnabled] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const srcRef = useRef<AudioBufferSourceNode | null>(null);
  const lfoRef = useRef< OscillatorNode | null>(null);

  const stop = useCallback(() => {
    gainRef.current?.gain.setTargetAtTime(0, ctxRef.current?.currentTime ?? 0, 0.4);
    setTimeout(() => {
      try {
        srcRef.current?.stop();
        lfoRef.current?.stop();
      } catch {
        /* already stopped */
      }
      srcRef.current = null;
      lfoRef.current = null;
    }, 700);
  }, []);

  const start = useCallback(() => {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    if (!ctxRef.current) ctxRef.current = new AudioCtx();
    if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
    const ctx = ctxRef.current;

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
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(0.16, ctx.currentTime, 1.2);

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
  }, []);

  useEffect(() => {
    // Defer preference read out of the effect body (set-state-in-effect)
    const id = requestAnimationFrame(() => {
      if (localStorage.getItem("findx_ambient_sound") === "on") {
        setEnabled(true);
      }
    });
    return () => {
      cancelAnimationFrame(id);
      stop();
      void ctxRef.current?.close();
      ctxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem("findx_ambient_sound", next ? "on" : "off");
    if (next) start();
    else stop();
  };

  // If user had it on from a previous visit, start on first interaction (autoplay policy)
  useEffect(() => {
    if (!enabled) return;
    const kick = () => start();
    window.addEventListener("pointerdown", kick, { once: true });
    window.addEventListener("keydown", kick, { once: true });
    return () => {
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
    };
  }, [enabled, start]);

  return (
    <button
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
