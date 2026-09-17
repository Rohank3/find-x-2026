"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import TwinklingStars from "./TwinklingStars";

// UnicornStudio UMD global injected by public/vendor/unicornStudio.umd.js (self-hosted).
declare global {
  interface Window {
    UnicornStudio?: {
      init: () => unknown;
    };
  }
}

const UNICORN_SCRIPT = "/vendor/unicornStudio.umd.js?v=20260916_rev2";

/**
 * Persistent homepage background singleton.
 *
 * Why not "useEffect init on mount"? The old component lived inside the
 * homepage only, so every navigation (home -> leaderboard -> home) unmounted
 * the canvas and re-ran the full boot chain (hydration -> script download ->
 * scene fetch -> WebGL boot). The user re-watched the background appear late
 * on every return visit.
 *
 * This component lives in the root layout, so it mounts exactly once per full
 * page load. Navigation only toggles visibility:
 *   - On the homepage the canvas fades in once ready.
 *   - Elsewhere it is hidden (opacity-0) but stays alive, so returning home is
 *     instant.
 *
 * The script loads via next/script afterInteractive, meaning the tag is
 * server-rendered into the head and downloads in parallel with hydration,
 * instead of starting after hydration like the old runtime injection.
 */
export default function UnicornBackground({
  projectId = "OMzqyUv6M3kSnv0JeAtC",
  // z-0 (NOT negative): negative z-index paints below the body's bg-black.
  className = "fixed inset-0 z-0",
}: {
  projectId?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const [scriptReady, setScriptReady] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isHorizontal, setIsHorizontal] = useState(false);

  const hostRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const handleRef = useRef<unknown>(null);
  const timersRef = useRef<number[]>([]);

  // Detect horizontal vs vertical/square layout
  useEffect(() => {
    const mq = window.matchMedia(
      "(min-aspect-ratio: 115/100), (orientation: landscape and min-width: 640px), (min-width: 1024px and orientation: landscape)"
    );
    const update = () => setIsHorizontal(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Unicorn embeds fetch scene JSON/assets from this origin — preconnect so
  // DNS+TLS happen before init() asks for them.
  const SCENE_HOST = "https://prod-cdn-prod-is1.unicornstudio.org";

  const active = isHome && scriptReady && !hasError;

  // Init when the homepage is mounted, the script has loaded, AND the canvas
  // host is laid out in horizontal layout (the 3D canvas with the man with the ball
  // is reserved for horizontal layouts; vertical and square layouts use the
  // lightweight animated twinkling dots).
  // Gating on startedRef prevents double-init under React StrictMode.
  useEffect(() => {
    const tryStart = () => {
      if (!active || startedRef.current) return;
      if (!isHorizontal) return;
      if (!hostRef.current || hostRef.current.offsetWidth === 0) return;
      startedRef.current = true;

      const boot = () => {
        try {
          handleRef.current = window.UnicornStudio?.init();
          setCanvasReady(true);
        } catch {
          setHasError(true);
        }
      };

      if (window.UnicornStudio) {
        boot();
      } else {
        // Script tag is in flight (afterInteractive) — wait briefly for onload.
        const poll = window.setInterval(() => {
          if (window.UnicornStudio) {
            window.clearInterval(poll);
            boot();
          }
        }, 50);
        const giveUp = window.setTimeout(() => {
          window.clearInterval(poll);
          setHasError(true);
        }, 10000);
        timersRef.current.push(poll, giveUp);
      }
    };

    tryStart();

    // Retry when the viewport crosses into horizontal orientation.
    const mq = window.matchMedia(
      "(min-aspect-ratio: 115/100), (orientation: landscape and min-width: 640px), (min-width: 1024px and orientation: landscape)"
    );
    mq.addEventListener("change", tryStart);
    return () => mq.removeEventListener("change", tryStart);
  }, [active, isHorizontal, projectId]);

  // Stop the branding badge from flashing during boot.
  useEffect(() => {
    const cleanBranding = () => {
      const selectors = [
        `[data-us-project="${projectId}"]`,
        ".unicorn-studio-container",
        'canvas[aria-label*="Unicorn"]',
      ];
      selectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((container) => {
          container.querySelectorAll("*").forEach((el) => {
            const text = (el.textContent || "").toLowerCase();
            const title = (el.getAttribute("title") || "").toLowerCase();
            const href = (el.getAttribute("href") || "").toLowerCase();
            const alt = (el.getAttribute("alt") || "").toLowerCase();
            if (
              text.includes("made with") ||
              text.includes("built with") ||
              text.includes("unicorn") ||
              title.includes("made with") ||
              title.includes("built with") ||
              title.includes("unicorn") ||
              alt.includes("made with") ||
              alt.includes("built with") ||
              alt.includes("unicorn") ||
              href.includes("unicorn.studio") ||
              href.includes("unicorn")
            ) {
              const htmlEl = el as HTMLElement;
              htmlEl.style.display = "none";
              try {
                el.remove();
              } catch {}
            }
          });
        });
      });
      // Also scrub any orphaned unicorn links or watermark badges across the document
      document.querySelectorAll('a[href*="unicorn"], img[alt*="unicorn"], [style*="99999999"]').forEach((el) => {
        try {
          (el as HTMLElement).style.display = "none";
          el.remove();
        } catch {}
      });
    };

    cleanBranding();
    // Only matters while the embed boots; stop scanning after the boot window.
    // 250ms (not 60ms): the full-subtree textContent sweep runs during
    // first paint/hydration, and the badge cannot appear faster than the
    // script+scene fetch anyway — 4x less main-thread churn, same coverage.
    const interval = window.setInterval(cleanBranding, 250);
    const stop = window.setTimeout(() => window.clearInterval(interval), 5000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(stop);
    };
  }, [projectId]);

  useEffect(() => {
    // Snapshot the array: the cleanup reads this stable reference instead of
    // dereferencing the ref after re-renders (react-hooks/exhaustive-deps).
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => window.clearInterval(t));
    };
  }, []);

  return (
    <>
      {/* Preconnects: emitted once per full page load, cheap on repeats. */}
      <link rel="preconnect" href={SCENE_HOST} crossOrigin="anonymous" />

      <div className={`overflow-hidden pointer-events-none ${className}`}>
        {/* Twinkling starfield: Active on home.
            On vertical & square layouts (phone portrait, square screens), this is the primary
            atmospheric background with glowing gold and pearl twinkling dots.
            On horizontal/desktop layouts, it renders instantly as the backdrop while WebGL boots. */}
        <div
          aria-hidden
          className={`absolute inset-0 transition-opacity ${
            isHome ? "opacity-100 duration-700" : "opacity-0 duration-150"
          }`}
        >
          <TwinklingStars />
        </div>

        {/* Live canvas (man with the ball): rendered in horizontal layout only.
            In vertical layout and square, it is completely hidden so the man with the ball
            does not awkwardly overlap the vertical or square layout.
            In horizontal layout, it fades in smoothly once ready. */}
        <div
          className={`canvas-man-ball absolute inset-0 w-full h-full transition-opacity ${
            isHome && isHorizontal && canvasReady
              ? "opacity-100 duration-700"
              : "opacity-0 pointer-events-none duration-150"
          }`}
        >
          <div
            ref={hostRef}
            data-us-project={projectId}
            data-us-project-src={`/scenes/${projectId}.json`}
            style={{ width: "100%", height: "100%", minHeight: "100vh" }}
          />
        </div>
      </div>

      {/* Self-hosted UMD. afterInteractive = server-rendered head tag, loads
          in parallel with hydration instead of after it. */}
      <Script
        src={UNICORN_SCRIPT}
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() => setHasError(true)}
      />
    </>
  );
}
