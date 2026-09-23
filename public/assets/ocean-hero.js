/**
 * Live Ocean Hero Engine
 * Hardware-accelerated WebGL ocean wave displacement shader
 * + 2D physics-based ship rocking, cutwater bow wake spray, and circling gulls.
 * Zero external dependencies.
 */

const VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform float uTime;
uniform float uWaveStrength;
uniform float uSpeed;
uniform int uLighting; // 0=Day, 1=Sunset, 2=Night
uniform vec2 uMouse;

void main() {
    vec2 uv = vUv;
    float horizon = 0.38888; // 1.0 - (352.0 / 576.0)
    vec3 color = vec3(0.0);
    
    if (uv.y > horizon) {
        // Sky & mountains
        vec2 skyUv = uv;
        if (skyUv.x < 0.28) {
            float sunGleam = sin(uTime * 1.2) * 0.008;
            skyUv.x += sunGleam * (skyUv.y - horizon);
        }
        color = texture2D(uTexture, skyUv).rgb;
        if (skyUv.x < 0.22) {
            color += vec3(0.035, 0.025, 0.01) * (1.0 + sin(uTime * 0.9));
        }
    } else {
        // Water surface
        float depth = clamp((horizon - uv.y) / horizon, 0.0, 1.0);
        float beachDist = clamp((uv.x - 0.65) / 0.35, 0.0, 1.0);
        float beachY = clamp((horizon - uv.y) / 0.12, 0.0, 1.0);
        float beachFactor = clamp(1.0 - (beachDist * (1.0 - beachY * 0.85)), 0.0, 1.0);
        
        float pDepth = pow(depth, 1.35) * beachFactor * uWaveStrength;
        float t = uTime * uSpeed;
        
        // Trochoidal / Gerstner harmonics
        float k1 = dot(uv, vec2(19.0, 34.0)) - t * 2.3;
        float k2 = dot(uv, vec2(-13.0, 25.0)) - t * 3.2;
        float k3 = dot(uv, vec2(38.0, 52.0)) - t * 4.6;
        
        // Interactive cursor ripples
        vec2 mDiff = uv - uMouse;
        float mDist = length(mDiff * vec2(1.0, 0.5625));
        float mRipple = sin(mDist * 45.0 - uTime * 8.0) * exp(-mDist * 9.0) * 0.014;
        
        vec2 disp;
        disp.x = (cos(k1) * 0.0055 - cos(k2) * 0.003 + cos(k3) * 0.001) * pDepth;
        disp.y = (sin(k1) * 0.0145 + sin(k2) * 0.007 + sin(k3) * 0.0022) * pDepth + mRipple * pDepth;
        
        vec2 waterUv = clamp(uv + disp, vec2(0.0, 0.001), vec2(1.0, horizon));
        color = texture2D(uTexture, waterUv).rgb;
        
        // Specular sun sparkle on wave crests
        float crest = sin(k1 * 1.4 + t) * sin(k2 + t * 0.6);
        if (crest > 0.68 && uv.x < 0.52 && depth > 0.12) {
            float glint = pow((crest - 0.68) / 0.32, 3.0) * (1.0 - uv.x / 0.52) * 0.75;
            color += vec3(glint * 1.0, glint * 0.95, glint * 0.8);
        }
    }
    
    // Lighting tinting
    if (uLighting == 1) {
        color.r = pow(color.r, 0.9) * 1.18;
        color.g = color.g * 0.96 + 0.04;
        color.b = color.b * 0.72;
    } else if (uLighting == 2) {
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

export class LiveOceanHero {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.getElementById(container) : container;
        this.options = Object.assign({
            bgSrc: 'assets/bg_seamless.png',
            shipSrc: 'assets/ship_cutout.png',
            waveStrength: 1.0,
            speed: 1.0,
            lightingMode: 0,
            enableAudio: false
        }, options);

        this.isPlaying = true;
        this.waveStrength = this.options.waveStrength;
        this.speed = this.options.speed;
        this.lightingMode = this.options.lightingMode;
        this.mouse = { x: -10, y: -10 };
        this.particles = [];
        this.gulls = [
            { x: 820, y: 250, phase: 0, speed: 0.9, radius: 45 },
            { x: 870, y: 230, phase: 2, speed: 1.1, radius: 35 },
            { x: 790, y: 280, phase: 4, speed: 0.8, radius: 55 }
        ];

        this.init();
    }

    async init() {
        this.container.classList.add('relative', 'overflow-hidden');

        // Create WebGL canvas
        this.waterCanvas = document.createElement('canvas');
        this.waterCanvas.width = 1024;
        this.waterCanvas.height = 576;
        this.waterCanvas.className = 'absolute inset-0 w-full h-full object-cover';

        // Create Ship & Overlay canvas
        this.shipCanvas = document.createElement('canvas');
        this.shipCanvas.width = 1024;
        this.shipCanvas.height = 576;
        this.shipCanvas.className = 'absolute inset-0 w-full h-full object-cover pointer-events-auto';

        this.container.appendChild(this.waterCanvas);
        this.container.appendChild(this.shipCanvas);

        this.ctx = this.shipCanvas.getContext('2d');
        this.gl = this.waterCanvas.getContext('webgl', { preserveDrawingBuffer: false, alpha: false });
        if (!this.gl) {
            console.error('WebGL not supported');
            return;
        }

        this.initGL();
        await this.loadImages();
        this.bindEvents();

        this.startTime = performance.now();
        requestAnimationFrame((t) => this.render(t));
    }

    initGL() {
        const gl = this.gl;
        const vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, VERTEX_SHADER);
        gl.compileShader(vs);

        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, FRAGMENT_SHADER);
        gl.compileShader(fs);

        this.program = gl.createProgram();
        gl.attachShader(this.program, vs);
        gl.attachShader(this.program, fs);
        gl.linkProgram(this.program);
        gl.useProgram(this.program);

        const posBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,  1, -1, -1,  1,
            -1,  1,  1, -1,  1,  1
        ]), gl.STATIC_DRAW);

        const aPos = gl.getAttribLocation(this.program, 'aPosition');
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

        this.uTimeLoc = gl.getUniformLocation(this.program, 'uTime');
        this.uWaveStrengthLoc = gl.getUniformLocation(this.program, 'uWaveStrength');
        this.uSpeedLoc = gl.getUniformLocation(this.program, 'uSpeed');
        this.uLightingLoc = gl.getUniformLocation(this.program, 'uLighting');
        this.uMouseLoc = gl.getUniformLocation(this.program, 'uMouse');
    }

    loadImages() {
        return new Promise((resolve) => {
            let loaded = 0;
            const check = () => {
                loaded++;
                if (loaded === 2) {
                    this.initTexture();
                    resolve();
                }
            };

            this.bgImg = new Image();
            this.bgImg.crossOrigin = 'anonymous';
            this.bgImg.onload = check;
            this.bgImg.src = this.options.bgSrc;

            this.shipImg = new Image();
            this.shipImg.crossOrigin = 'anonymous';
            this.shipImg.onload = check;
            this.shipImg.src = this.options.shipSrc;
        });
    }

    initTexture() {
        const gl = this.gl;
        this.bgTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.bgTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.bgImg);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }

    bindEvents() {
        const updateMouse = (e) => {
            const rect = this.shipCanvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = 1.0 - (e.clientY - rect.top) / rect.height;
            this.mouse = { x, y };
        };

        this.shipCanvas.addEventListener('mousemove', updateMouse);
        this.shipCanvas.addEventListener('mouseleave', () => {
            this.mouse = { x: -10, y: -10 };
        });
        this.shipCanvas.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) updateMouse(e.touches[0]);
        }, { passive: true });
    }

    toggleAudio(btnElement) {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();

            const bufferSize = this.audioCtx.sampleRate * 3;
            const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
                b6 = white * 0.115926;
            }

            const noise = this.audioCtx.createBufferSource();
            noise.buffer = buffer;
            noise.loop = true;

            this.surfFilter = this.audioCtx.createBiquadFilter();
            this.surfFilter.type = 'lowpass';
            this.surfFilter.frequency.value = 320;
            this.surfFilter.Q.value = 2.5;

            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.value = 0.0;

            noise.connect(this.surfFilter);
            this.surfFilter.connect(this.masterGain);
            this.masterGain.connect(this.audioCtx.destination);
            noise.start();
        }

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        this.audioEnabled = !this.audioEnabled;
        if (this.audioEnabled) {
            this.masterGain.gain.setTargetAtTime(0.5, this.audioCtx.currentTime, 0.2);
            if (btnElement) btnElement.innerHTML = '🔊 Sound: ON';
        } else {
            this.masterGain.gain.setTargetAtTime(0.0, this.audioCtx.currentTime, 0.2);
            if (btnElement) btnElement.innerHTML = '🔇 Sound: OFF';
        }
        return this.audioEnabled;
    }

    render(now) {
        if (this.isPlaying) {
            const time = (now - this.startTime) / 1000;

            const gl = this.gl;
            gl.viewport(0, 0, 1024, 576);
            gl.uniform1f(this.uTimeLoc, time);
            gl.uniform1f(this.uWaveStrengthLoc, this.waveStrength);
            gl.uniform1f(this.uSpeedLoc, this.speed);
            gl.uniform1i(this.uLightingLoc, this.lightingMode);
            gl.uniform2f(this.uMouseLoc, this.mouse.x, this.mouse.y);
            gl.drawArrays(gl.TRIANGLES, 0, 6);

            if (this.audioEnabled && this.audioCtx && this.surfFilter) {
                const swell = 0.5 + 0.5 * Math.sin(time * this.speed * 2.2);
                this.surfFilter.frequency.value = 220 + swell * 380 * this.waveStrength;
            }

            this.renderShip(time);
        }

        requestAnimationFrame((t) => this.render(t));
    }

    renderShip(time) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, 1024, 576);

        const shipW = 165;
        const shipH = 210;
        const basePivotX = 125 + shipW * 0.5;
        const basePivotY = 170 + shipH * 0.88;

        const tCycle = time * this.speed;
        const angle = (Math.sin(tCycle * 1.2) * 2.6 + Math.sin(tCycle * 2.4) * 0.8) * (Math.PI / 180) * this.waveStrength;
        const heave = (Math.sin(tCycle * 1.2 - 0.5) * 5.6 + Math.cos(tCycle * 2.2) * 1.8) * this.waveStrength;
        const surge = (Math.cos(tCycle * 1.2) * 2.2) * this.waveStrength;

        const curPivotX = basePivotX + surge;
        const curPivotY = basePivotY + heave;

        // Emit wake particles from bow cutwater
        if (Math.random() < 0.65 * this.waveStrength) {
            this.particles.push({
                x: curPivotX + (Math.random() - 0.5) * 8,
                y: curPivotY + (Math.random() - 0.5) * 3,
                vx: -1.2 - Math.random() * 1.8,
                vy: 0.15 + (Math.random() - 0.5) * 0.4,
                radius: 2 + Math.random() * 3.5,
                alpha: 0.75 + Math.random() * 0.25,
                decay: 0.015 + Math.random() * 0.02
            });
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.85})`;
            ctx.fill();
        }

        ctx.save();
        ctx.translate(curPivotX, curPivotY);
        ctx.rotate(angle);

        const billowX = 1.0 + 0.016 * Math.sin(tCycle * 1.8) * this.waveStrength;
        ctx.scale(billowX, 1.0);

        if (this.lightingMode === 1) {
            ctx.filter = 'sepia(0.3) saturate(1.3) brightness(0.95)';
        } else if (this.lightingMode === 2) {
            ctx.filter = 'brightness(0.5) hue-rotate(200deg) saturate(1.2)';
        }

        ctx.drawImage(this.shipImg, -shipW * 0.5, -shipH * 0.88, shipW, shipH);
        ctx.restore();
        ctx.filter = 'none';

        // Bow foam spray crest
        const bowFoamAlpha = Math.max(0.0, Math.sin(tCycle * 1.2));
        ctx.beginPath();
        ctx.ellipse(curPivotX - 18, curPivotY + 5, 14, 5, -0.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + 0.5 * bowFoamAlpha})`;
        ctx.fill();

        // Soaring seagulls
        this.renderGulls(time);
    }

    renderGulls(time) {
        const ctx = this.ctx;
        ctx.fillStyle = this.lightingMode === 2 ? 'rgba(160, 190, 220, 0.7)' : 'rgba(55, 65, 80, 0.85)';

        this.gulls.forEach((gull) => {
            const t = time * gull.speed + gull.phase;
            const gx = gull.x + Math.cos(t) * gull.radius;
            const gy = gull.y + Math.sin(t * 1.5) * (gull.radius * 0.35);
            const flap = Math.sin(t * 7.0) * 3.5;

            ctx.beginPath();
            ctx.moveTo(gx - 6, gy - flap);
            ctx.quadraticCurveTo(gx - 2, gy + 1, gx, gy);
            ctx.quadraticCurveTo(gx + 2, gy + 1, gx + 6, gy - flap);
            ctx.lineWidth = 1.4;
            ctx.strokeStyle = ctx.fillStyle;
            ctx.stroke();
        });
    }

    setWaveStrength(v) { this.waveStrength = v; }
    setSpeed(s) { this.speed = s; }
    setLightingMode(m) { this.lightingMode = m; }
    togglePlay() { this.isPlaying = !this.isPlaying; return this.isPlaying; }
}
