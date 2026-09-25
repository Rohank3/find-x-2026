"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";

export interface LiveOceanHeroProps {
  className?: string;
  bgSrc?: string;
  shipSrc?: string;
  posterSrc?: string;
  initialWaveStrength?: number;
  initialSpeed?: number;
  initialLightingMode?: 0 | 1 | 2; // 0=Day, 1=Sunset/Evening, 2=Night
  showControls?: boolean;
  onLightingChange?: (mode: 0 | 1 | 2) => void;
  isBackground?: boolean;
}

const VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

varying vec2 vUv;
uniform sampler2D uTexture;
uniform float uTime;
uniform float uWaveStrength;
uniform float uSpeed;
uniform int uLighting;
uniform vec2 uMouse;

void main() {
    vec2 uv = vUv;
    float horizon = 0.38888;
    vec3 color = vec3(0.0);
    
    if (uv.y > horizon) {
        vec2 skyUv = uv;
        float sunMask = smoothstep(0.35, 0.0, skyUv.x) * (skyUv.y - horizon);
        float sunGleam = sin(uTime * 1.2) * 0.006 * sunMask;
        skyUv.x += sunGleam;
        color = texture2D(uTexture, skyUv).rgb;
        float warmth = smoothstep(0.3, 0.0, skyUv.x) * (0.5 + 0.5 * sin(uTime * 0.9));
        color += vec3(0.025, 0.018, 0.008) * warmth;
    } else {
        float depth = clamp((horizon - uv.y) / horizon, 0.0, 1.0);
        float beachDist = clamp((uv.x - 0.65) / 0.35, 0.0, 1.0);
        float beachY = clamp((horizon - uv.y) / 0.12, 0.0, 1.0);
        float beachFactor = clamp(1.0 - (beachDist * (1.0 - beachY * 0.85)), 0.0, 1.0);
        
        float pDepth = pow(depth, 1.35) * beachFactor * uWaveStrength;
        float t = uTime * uSpeed;
        
        float k1 = dot(uv, vec2(19.0, 34.0)) - t * 2.3;
        float k2 = dot(uv, vec2(-13.0, 25.0)) - t * 3.2;
        float k3 = dot(uv, vec2(38.0, 52.0)) - t * 4.6;
        
        vec2 mDiff = uv - uMouse;
        float mDist = length(mDiff * vec2(1.0, 0.5625));
        float mRipple = sin(mDist * 45.0 - uTime * 8.0) * exp(-mDist * 9.0) * 0.014;
        
        vec2 disp;
        disp.x = (cos(k1) * 0.0055 - cos(k2) * 0.003 + cos(k3) * 0.001) * pDepth;
        disp.y = (sin(k1) * 0.0145 + sin(k2) * 0.007 + sin(k3) * 0.0022) * pDepth + mRipple * pDepth;
        
        vec2 waterUv = clamp(uv + disp, vec2(0.0, 0.001), vec2(1.0, horizon));
        color = texture2D(uTexture, waterUv).rgb;
        
        float crest = sin(k1 * 1.4 + t) * sin(k2 + t * 0.6);
        if (crest > 0.68 && uv.x < 0.52 && depth > 0.12) {
            float glint = pow((crest - 0.68) / 0.32, 3.0) * (1.0 - uv.x / 0.52) * 0.75;
            color += vec3(glint * 1.0, glint * 0.95, glint * 0.8);
        }
    }
    
    if (uLighting == 1) {
        // Sunset / Evening tone
        color.r = pow(color.r, 0.9) * 1.18;
        color.g = color.g * 0.96 + 0.04;
        color.b = color.b * 0.72;
    } else if (uLighting == 2) {
        // Bioluminescent Night tone
        color.r = color.r * 0.22;
        color.g = color.g * 0.42;
        color.b = color.b * 0.88 + 0.06;
        if (uv.y < horizon) {
            float bio = sin(dot(uv, vec2(22.0, 32.0)) - uTime * 3.2);
            if (bio > 0.78) {
                float glow = (bio - 0.78) / 0.22 * 0.45;
                color += vec3(0.04, glow * 0.85, glow);
            }
        }
    }
    
    gl_FragColor = vec4(color, 1.0);
}
`;

interface FoamParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  decay: number;
}

export const LiveOceanHero: React.FC<LiveOceanHeroProps> = ({
  className = "w-full h-full",
  bgSrc = "/assets/bg_seamless.png",
  shipSrc = "/assets/ship_cutout.png",
  posterSrc = "/assets/bg_seamless.png",
  initialWaveStrength = 1.0,
  initialSpeed = 1.0,
  initialLightingMode = 0,
  showControls = false,
  onLightingChange,
  isBackground = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const waterCanvasRef = useRef<HTMLCanvasElement>(null);
  const shipCanvasRef = useRef<HTMLCanvasElement>(null);

  const getInitialLighting = (): 0 | 1 | 2 => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("findx_lighting_mode");
        if (saved === "0" || saved === "1" || saved === "2") {
          return parseInt(saved, 10) as 0 | 1 | 2;
        }
      } catch {
        // ignore
      }
    }
    return initialLightingMode;
  };

  const getInitialWaveSpeed = (): number => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("findx_wave_speed");
        if (saved) {
          const parsed = parseFloat(saved);
          if (!isNaN(parsed) && parsed >= 0.3 && parsed <= 3.0) {
            return parsed;
          }
        }
      } catch {
        // ignore
      }
    }
    return initialSpeed;
  };

  const [isPlaying, setIsPlaying] = useState(true);
  const [waveStrength, setWaveStrength] = useState(initialWaveStrength);
  const [speed] = useState(initialSpeed);
  const [lightingMode, setLightingMode] = useState<0 | 1 | 2>(getInitialLighting);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const [displaySpeed, setDisplaySpeed] = useState<number>(getInitialWaveSpeed);
  const [showSpeedHud, setShowSpeedHud] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const surfFilterRef = useRef<BiquadFilterNode | null>(null);
  const hudTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persistent wave speed controlled by Y-scroll & wheel (persists until user changes it)
  const initialSpeedVal = getInitialWaveSpeed();
  const waveSpeedRef = useRef(initialSpeedVal);
  const targetWaveSpeedRef = useRef(initialSpeedVal);
  const scrollBoostRef = useRef(0);
  const wavePhaseTimeRef = useRef(0);
  const scrollStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stateRef = useRef({
    isPlaying: true,
    waveStrength: initialWaveStrength,
    speed: initialSpeed,
    lightingMode: getInitialLighting(),
    mouse: { x: -10, y: -10 },
    particles: [] as FoamParticle[],
    gulls: [
      { x: 820, y: 250, phase: 0, speed: 0.9, radius: 45 },
      { x: 870, y: 230, phase: 2, speed: 1.1, radius: 35 },
      { x: 790, y: 280, phase: 4, speed: 0.8, radius: 55 },
    ],
  });

  // Listen for atmosphere changes and wave speed updates from localStorage and CustomEvents
  useEffect(() => {
    const handleLightingEvent = (e: Event) => {
      const customEvent = e as CustomEvent<0 | 1 | 2>;
      if (typeof customEvent.detail === "number") {
        setLightingMode(customEvent.detail);
        stateRef.current.lightingMode = customEvent.detail;
      }
    };

    const handleWaveSpeedEvent = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      if (typeof customEvent.detail === "number" && !isNaN(customEvent.detail)) {
        const val = Math.max(0.3, Math.min(3.0, customEvent.detail));
        targetWaveSpeedRef.current = val;
        waveSpeedRef.current = val;
        setDisplaySpeed(val);
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "findx_lighting_mode" && e.newValue) {
        const mode = parseInt(e.newValue, 10);
        if (mode === 0 || mode === 1 || mode === 2) {
          setLightingMode(mode as 0 | 1 | 2);
          stateRef.current.lightingMode = mode as 0 | 1 | 2;
        }
      } else if (e.key === "findx_wave_speed" && e.newValue) {
        const spd = parseFloat(e.newValue);
        if (!isNaN(spd) && spd >= 0.3 && spd <= 3.0) {
          targetWaveSpeedRef.current = spd;
          waveSpeedRef.current = spd;
          setDisplaySpeed(spd);
        }
      }
    };

    window.addEventListener("findx:lighting", handleLightingEvent);
    window.addEventListener("findx:wave_speed", handleWaveSpeedEvent);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("findx:lighting", handleLightingEvent);
      window.removeEventListener("findx:wave_speed", handleWaveSpeedEvent);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Update when parent passes new initialLightingMode
  useEffect(() => {
    if (typeof initialLightingMode === "number") {
      stateRef.current.lightingMode = initialLightingMode;
    }
  }, [initialLightingMode]);

  // Synchronize stateRef
  useEffect(() => {
    stateRef.current.isPlaying = isPlaying;
    stateRef.current.waveStrength = waveStrength;
    stateRef.current.speed = speed;
    stateRef.current.lightingMode = lightingMode;
    onLightingChange?.(lightingMode);
  }, [isPlaying, waveStrength, speed, lightingMode, onLightingChange]);

  // Dynamic scroll velocity surge and persistent wave speed adjustment
  useEffect(() => {
    let lastScrollY = typeof window !== "undefined" ? window.scrollY || 0 : 0;
    let touchStartY = 0;

    const onScrollEvent = (deltaY: number) => {
      // Dynamic real-time velocity boost proportional to scroll speed
      const impulse = Math.min(0.8, Math.abs(deltaY) * 0.008);
      scrollBoostRef.current = Math.min(3.5, scrollBoostRef.current + impulse);

      // Scrolling/wheeling down speeds up the waves, scrolling up calms the sea
      // 1 standard wheel notch (~100px) shifts speed by ~0.12x for instant noticeable response
      const deltaSpeed = (deltaY / 100) * 0.12;
      const nextSpeed = Math.max(0.3, Math.min(3.0, targetWaveSpeedRef.current + deltaSpeed));
      const rounded = Number(nextSpeed.toFixed(2));
      targetWaveSpeedRef.current = rounded;

      if (!isBackground) {
        setDisplaySpeed(rounded);
        setShowSpeedHud(true);
        if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
        hudTimerRef.current = setTimeout(() => setShowSpeedHud(false), 1600);
      }

      // Persist to localStorage and dispatch event so all other pages stay in sync
      if (scrollStopTimerRef.current) {
        clearTimeout(scrollStopTimerRef.current);
      }
      scrollStopTimerRef.current = setTimeout(() => {
        try {
          localStorage.setItem("findx_wave_speed", targetWaveSpeedRef.current.toFixed(2));
          window.dispatchEvent(
            new CustomEvent("findx:wave_speed", { detail: targetWaveSpeedRef.current })
          );
        } catch {
          // ignore
        }
      }, 50);
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const deltaY = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;
      if (Math.abs(deltaY) > 0) {
        onScrollEvent(deltaY);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 0) {
        onScrollEvent(e.deltaY);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const currentY = e.touches[0].clientY;
        const deltaY = touchStartY - currentY;
        touchStartY = currentY;
        if (Math.abs(deltaY) > 2) {
          onScrollEvent(deltaY * 1.5);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      if (scrollStopTimerRef.current) {
        clearTimeout(scrollStopTimerRef.current);
      }
      if (hudTimerRef.current) {
        clearTimeout(hudTimerRef.current);
      }
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isBackground]);

  const toggleSound = useCallback(() => {
    if (isBackground) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const bufferSize = ctx.sampleRate * 3;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0,
          b1 = 0,
          b2 = 0,
          b3 = 0,
          b4 = 0,
          b5 = 0,
          b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.969 * b2 + white * 0.153852;
          b3 = 0.8665 * b3 + white * 0.3104856;
          b4 = 0.55 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.016898;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
          b6 = white * 0.115926;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 320;
        surfFilterRef.current = filter;

        const gain = ctx.createGain();
        gain.gain.value = 0.0;
        masterGainRef.current = gain;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
      }

      if (audioCtxRef.current.state === "suspended") {
        void audioCtxRef.current.resume();
      }

      const nextState = !isAudioOn;
      setIsAudioOn(nextState);
      if (masterGainRef.current && audioCtxRef.current) {
        masterGainRef.current.gain.setTargetAtTime(
          nextState ? 0.45 : 0.0,
          audioCtxRef.current.currentTime,
          0.2
        );
      }
    } catch (e) {
      console.warn("Web Audio initialization failed", e);
    }
  }, [isAudioOn, isBackground]);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        void audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const waterCanvas = waterCanvasRef.current;
    const shipCanvas = shipCanvasRef.current;
    if (!container || !waterCanvas || !shipCanvas) return;

    // Smooth, balanced resolution scaling to guarantee 60fps without GPU throttling
    const resizeCanvases = () => {
      const rect = container.getBoundingClientRect();
      const dpr = isBackground ? 0.75 : Math.min(window.devicePixelRatio || 1, 1.25);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));

      if (waterCanvas.width !== width || waterCanvas.height !== height) {
        waterCanvas.width = width;
        waterCanvas.height = height;
      }
      if (!isBackground && (shipCanvas.width !== width || shipCanvas.height !== height)) {
        shipCanvas.width = width;
        shipCanvas.height = height;
      }
    };

    resizeCanvases();

    let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
    try {
      gl = (waterCanvas.getContext("webgl2", {
        preserveDrawingBuffer: false,
        alpha: false,
        powerPreference: "high-performance",
        antialias: true,
      }) ||
        waterCanvas.getContext("webgl", {
          preserveDrawingBuffer: false,
          alpha: false,
          powerPreference: "high-performance",
          antialias: true,
        })) as WebGLRenderingContext | WebGL2RenderingContext | null;
    } catch {
      gl = null;
    }

    if (!gl) {
      setWebGLSupported(false);
      setIsLoaded(true);
      return;
    }

    const ctx = shipCanvas.getContext("2d");
    if (!ctx) return;

    // WebGL shaders compilation
    const vs = gl.createShader(gl.VERTEX_SHADER);
    if (!vs) return;
    gl.shaderSource(vs, VERTEX_SHADER);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fs) return;
    gl.shaderSource(fs, FRAGMENT_SHADER);
    gl.compileShader(fs);

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn("Shader program link failed:", gl.getProgramInfoLog(program));
      setWebGLSupported(false);
      setIsLoaded(true);
      return;
    }

    gl.useProgram(program);

    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPos = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "uTime");
    const uWave = gl.getUniformLocation(program, "uWaveStrength");
    const uSpd = gl.getUniformLocation(program, "uSpeed");
    const uLit = gl.getUniformLocation(program, "uLighting");
    const uMo = gl.getUniformLocation(program, "uMouse");

    // Textures loading
    const bgImg = new window.Image();
    const shipImg = new window.Image();
    let bgTex: WebGLTexture | null = null;
    let animId: number = 0;
    const startTime = performance.now();
    let lastTime = performance.now();
    let isCleanedUp = false;

    const onLoaded = () => {
      if (isCleanedUp || !gl) return;
      bgTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, bgTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bgImg);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      setIsLoaded(true);
      lastTime = performance.now();
      loop(performance.now());
    };

    let loadedCount = 0;
    const check = () => {
      loadedCount++;
      if (loadedCount === 2) onLoaded();
    };

    bgImg.crossOrigin = "anonymous";
    bgImg.onload = check;
    bgImg.onerror = () => {
      console.warn("Background texture failed to load:", bgSrc);
      setIsLoaded(true);
    };
    bgImg.src = bgSrc;

    shipImg.crossOrigin = "anonymous";
    shipImg.onload = check;
    shipImg.onerror = () => {
      console.warn("Ship sprite failed to load:", shipSrc);
      setIsLoaded(true);
    };
    shipImg.src = shipSrc;

    const loop = (now: number) => {
      if (isCleanedUp || !gl || !ctx) return;
      const state = stateRef.current;

      if (state.isPlaying) {
        const dt = Math.min(0.08, (now - lastTime) / 1000);
        lastTime = now;
        const shipTime = (now - startTime) / 1000;

        // Smoothly decay dynamic scroll boost (hydrodynamic drag dampening)
        scrollBoostRef.current *= 0.94;
        if (scrollBoostRef.current < 0.002) {
          scrollBoostRef.current = 0;
        }

        // Rapidly and smoothly ease toward user's target wave speed without sudden jumps
        waveSpeedRef.current +=
          (targetWaveSpeedRef.current - waveSpeedRef.current) * 0.08;

        const effectiveWaveSpeed = waveSpeedRef.current + scrollBoostRef.current;

        // Phase integration: continuous integration eliminates mathematical phase tearing/jitter completely
        wavePhaseTimeRef.current += dt * effectiveWaveSpeed;

        // Render WebGL Ocean with continuous wave phase
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.uniform1f(uTime, wavePhaseTimeRef.current);
        gl.uniform1f(uWave, state.waveStrength);
        gl.uniform1f(uSpd, 1.0); // Continuous time integration already accounts for speed smoothly
        gl.uniform1i(uLit, state.lightingMode);
        gl.uniform2f(uMo, state.mouse.x, state.mouse.y);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // Modulate procedural ocean soundscape (natural base speed, unaffected by scroll)
        if (surfFilterRef.current) {
          const swell = 0.5 + 0.5 * Math.sin(shipTime * state.speed * 2.2);
          surfFilterRef.current.frequency.value =
            220 + swell * 380 * state.waveStrength;
        }

        // Render Canvas 2D Ship & Atmospheric Life only when foreground hero is active
        if (!isBackground) {
          ctx.clearRect(0, 0, shipCanvas.width, shipCanvas.height);
          ctx.save();
          ctx.scale(shipCanvas.width / 1024, shipCanvas.height / 576);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

        const shipW = 165;
        const shipH = 210;
        const basePivotX = 125 + shipW * 0.5;
        const basePivotY = 170 + shipH * 0.88;

        const tCycle = shipTime * state.speed;
        const angle =
          (Math.sin(tCycle * 1.2) * 2.6 + Math.sin(tCycle * 2.4) * 0.8) *
          (Math.PI / 180) *
          state.waveStrength;
        const heave =
          (Math.sin(tCycle * 1.2 - 0.5) * 5.6 + Math.cos(tCycle * 2.2) * 1.8) *
          state.waveStrength;
        const surge = Math.cos(tCycle * 1.2) * 2.2 * state.waveStrength;

        const curPivotX = basePivotX + surge;
        const curPivotY = basePivotY + heave;

        // Dive plunge factor (0.0 when cresting, 1.0 when plunging into wave trough)
        const diveFactor = Math.max(0.0, Math.sin(tCycle * 1.2 - 0.5));

        // Cutwater wake spray particles (dynamic emission & radius linked to dive plunge)
        if (
          Math.random() <
          (0.4 + diveFactor * 0.6) * state.waveStrength
        ) {
          state.particles.push({
            x: curPivotX + 15 + (Math.random() - 0.5) * 10,
            y: curPivotY + 2 + (Math.random() - 0.5) * 4,
            vx: -1.2 - Math.random() * 1.8,
            vy: 0.15 + (Math.random() - 0.5) * 0.4,
            radius: 1.5 + Math.random() * (2.0 + diveFactor * 2.0),
            alpha: 0.8 + Math.random() * 0.2,
            decay: 0.015 + Math.random() * 0.02,
          });
        }

        for (let i = state.particles.length - 1; i >= 0; i--) {
          const p = state.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= p.decay;
          if (p.alpha <= 0) {
            state.particles.splice(i, 1);
            continue;
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.85})`;
          ctx.fill();
        }

        // Draw Ship with Buoyancy physics and Billowing
        ctx.save();
        ctx.translate(curPivotX, curPivotY);
        ctx.rotate(angle);
        const billowX =
          1.0 + 0.016 * Math.sin(tCycle * 1.8) * state.waveStrength;
        ctx.scale(billowX, 1.0);

        if (state.lightingMode === 1) {
          ctx.filter = "sepia(0.3) saturate(1.3) brightness(0.95)";
        } else if (state.lightingMode === 2) {
          ctx.filter = "brightness(0.5) hue-rotate(200deg) saturate(1.2)";
        }

        ctx.drawImage(shipImg, -shipW * 0.5, -shipH * 0.88, shipW, shipH);
        ctx.restore();
        ctx.filter = "none";

        // =========================================================================
        // SYNCHRONIZED LIVE WATERLINE FOAM TEXTURE (Hides Cutout Seams & Lines)
        // =========================================================================
        const fThick = (1.5 + diveFactor * 3.5) * state.waveStrength;
        const fAlpha = 0.5 + diveFactor * 0.45;

        ctx.save();
        // 1. Soft turquoise aeration underglow
        ctx.lineWidth = fThick * 2.2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = `rgba(180, 235, 245, ${0.42 * fAlpha})`;
        ctx.beginPath();
        for (let dx = -38; dx <= 36; dx += 2) {
          const dyCurve = Math.pow(dx / 40.0, 2) * 3.0 - 1.2;
          const ripple =
            Math.sin(dx * 0.4 + tCycle * 5.0) * (0.5 + diveFactor * 1.0);
          const px = curPivotX + dx;
          const py = curPivotY + dyCurve + ripple + 1;
          if (dx === -38) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // 2. Crisp white froth contour
        ctx.lineWidth = fThick;
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.9 * fAlpha})`;
        ctx.beginPath();
        for (let dx = -38; dx <= 36; dx += 2) {
          const dyCurve = Math.pow(dx / 40.0, 2) * 3.0 - 1.2;
          const ripple =
            Math.sin(dx * 0.4 + tCycle * 5.0) * (0.5 + diveFactor * 1.0);
          const px = curPivotX + dx;
          const py = curPivotY + dyCurve + ripple;
          if (dx === -38) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // 3. Bow cutwater wake curl (peeling forward-right)
        const bowLen = Math.floor(10 + diveFactor * 15);
        ctx.lineWidth = Math.max(1, 2.2 * fAlpha);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.85 * fAlpha})`;
        ctx.beginPath();
        for (let b = 0; b <= bowLen; b++) {
          const bx = curPivotX + 22 + b * 1.1;
          const by =
            curPivotY +
            1 -
            Math.pow(b / bowLen, 1.5) * 2.2 +
            Math.sin(b * 0.4 + tCycle * 3.0) * 1.0;
          if (b === 0) ctx.moveTo(bx, by);
          else ctx.lineTo(bx, by);
        }
        ctx.stroke();

        // 4. Stern wake whiskers (peeling backward-left)
        const sternLen = Math.floor(14 + diveFactor * 20);
        ctx.lineWidth = Math.max(1, 2.5 * fAlpha);
        ctx.beginPath();
        for (let s = 0; s <= sternLen; s++) {
          const sx = curPivotX - 35 - s * 1.2;
          const sy =
            curPivotY +
            2 +
            Math.pow(s / sternLen, 1.3) * 2.5 +
            Math.sin(s * 0.3 - tCycle * 3.0) * 1.0;
          if (s === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();

        // 5. Dynamic bubbling foam clusters
        ctx.fillStyle = `rgba(255, 255, 255, ${0.85 * fAlpha})`;
        for (let i = 0; i < 7; i++) {
          const seed = (i * 97 + Math.floor(tCycle * 8)) % 66 - 33;
          const bx = curPivotX + seed;
          const by =
            curPivotY +
            Math.pow(seed / 38.0, 2) * 2.5 +
            Math.sin(seed + tCycle * 4.0) * 1.0;
          const r =
            (1.0 + diveFactor * 1.8) *
            (0.6 + 0.4 * Math.sin(i * 3 + tCycle * 2));
          ctx.beginPath();
          ctx.arc(bx, by, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Atmospheric Seagulls soaring near cliffs
        ctx.fillStyle =
          state.lightingMode === 2
            ? "rgba(160, 190, 220, 0.7)"
            : "rgba(55, 65, 80, 0.85)";
        state.gulls.forEach((gull) => {
          const gt = shipTime * gull.speed + gull.phase;
          const gx = gull.x + Math.cos(gt) * gull.radius;
          const gy = gull.y + Math.sin(gt * 1.5) * (gull.radius * 0.35);
          const flap = Math.sin(gt * 7.0) * 3.5;
          ctx.beginPath();
          ctx.moveTo(gx - 6, gy - flap);
          ctx.quadraticCurveTo(gx - 2, gy + 1, gx, gy);
          ctx.quadraticCurveTo(gx + 2, gy + 1, gx + 6, gy - flap);
          ctx.lineWidth = 1.4;
          ctx.strokeStyle = ctx.fillStyle as string;
          ctx.stroke();
        });

          ctx.restore();
        }
      }

      animId = requestAnimationFrame(loop);
    };

    const updateMousePos = (clientX: number, clientY: number) => {
      const rect = shipCanvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      stateRef.current.mouse = {
        x: (clientX - rect.left) / rect.width,
        y: 1.0 - (clientY - rect.top) / rect.height,
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      updateMousePos(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updateMousePos(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleMouseLeave = () => {
      stateRef.current.mouse = { x: -10, y: -10 };
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvases();
    });
    resizeObserver.observe(container);

    shipCanvas.addEventListener("mousemove", handleMouseMove, { passive: true });
    shipCanvas.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    shipCanvas.addEventListener("touchstart", handleTouchMove, { passive: true });
    shipCanvas.addEventListener("touchmove", handleTouchMove, { passive: true });
    shipCanvas.addEventListener("touchend", handleMouseLeave, { passive: true });

    return () => {
      isCleanedUp = true;
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      shipCanvas.removeEventListener("mousemove", handleMouseMove);
      shipCanvas.removeEventListener("mouseleave", handleMouseLeave);
      shipCanvas.removeEventListener("touchstart", handleTouchMove);
      shipCanvas.removeEventListener("touchmove", handleTouchMove);
      shipCanvas.removeEventListener("touchend", handleMouseLeave);
      if (bgTex && gl) gl.deleteTexture(bgTex);
      if (program && gl) gl.deleteProgram(program);
      if (posBuf && gl) gl.deleteBuffer(posBuf);
    };
  }, [bgSrc, shipSrc, isBackground]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden select-none ${className}`}
      style={isBackground ? undefined : { minHeight: "550px" }}
    >
      {/* Low-power / Fallback poster image */}
      {(!webGLSupported || !isLoaded) && (
        <Image
          src={posterSrc}
          alt="Ocean Hero Scene"
          fill
          priority
          sizes="100vw"
          className="object-cover absolute inset-0 transition-opacity duration-700"
        />
      )}

      {/* WebGL Water displacement canvas */}
      <canvas
        ref={waterCanvasRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          isLoaded && webGLSupported ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      />

      {/* 2D Canvas for buoyant pirate ship, bow particles, gulls & cursor interaction */}
      <canvas
        ref={shipCanvasRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          isBackground
            ? "pointer-events-none"
            : "pointer-events-auto cursor-crosshair"
        } ${
          isLoaded && webGLSupported ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Interactive Live Ocean with sailing pirate ship"
      />

      {/* Real-time Nautical Wave Speed HUD on Landing Page */}
      {!isBackground && showSpeedHud && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute top-6 sm:top-8 left-6 sm:left-8 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/75 border border-amber-400/40 text-amber-300 font-mono text-xs backdrop-blur-md shadow-2xl transition-all duration-300"
        >
          <span className="text-amber-400 font-semibold">🌊 Sea Current:</span>
          <span className="font-bold text-amber-200">{displaySpeed.toFixed(1)}x</span>
        </div>
      )}

      {/* Optional In-Hero Atmospheric Controls */}
      {showControls && (
        <div className="absolute bottom-4 left-4 right-4 z-30 flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-black/60 backdrop-blur-md border border-amber-500/20 text-white text-xs shadow-2xl">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/90 hover:bg-amber-400 active:scale-95 text-slate-950 font-semibold transition-all shadow-md"
            >
              {isPlaying ? "⏸️ Pause" : "▶️ Play"}
            </button>
            <button
              onClick={toggleSound}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-amber-200 transition-all border border-amber-400/20"
            >
              {isAudioOn ? "🔊 Surf: ON" : "🔇 Surf: OFF"}
            </button>
          </div>

          <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1">
            {(["Day", "Sunset", "Night"] as const).map((label, idx) => (
              <button
                key={label}
                onClick={() => setLightingMode(idx as 0 | 1 | 2)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  lightingMode === idx
                    ? "bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/30"
                    : "text-amber-100/70 hover:text-white hover:bg-white/5"
                }`}
              >
                {label === "Day" ? "☀️ Day" : label === "Sunset" ? "🌅 Sunset" : "🌙 Night"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-amber-200/90 text-xs font-mono">
            <span>Swells:</span>
            <input
              type="range"
              min="0.2"
              max="2.0"
              step="0.1"
              value={waveStrength}
              onChange={(e) => setWaveStrength(parseFloat(e.target.value))}
              aria-label="Ocean wave swell strength"
              className="w-20 accent-amber-400 cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveOceanHero;
