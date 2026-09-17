"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

// UnicornStudio UMD global injected by public/vendor/unicornStudio.umd.js (self-hosted).
declare global {
  interface Window {
    UnicornStudio?: {
      init: () => unknown;
      destroy?: () => void;
    };
  }
}

const UNICORN_SCRIPT = "/vendor/unicornStudio.umd.js?v=20260916_rev2";

/**
 * Persistent homepage background singleton.
 *
 * This component lives in the root layout, so it mounts exactly once per full
 * page load. Navigation only toggles visibility:
 *   - On the homepage the canvas fades in once ready.
 *   - Elsewhere it is hidden (opacity-0) but stays alive, so returning home is instant.
 *
 * Adaptive Scene:
 *   - Horizontal / Desktop layout: Uses the default landing page scene with the man with the ball (/scenes/OMzqyUv6M3kSnv0JeAtC.json).
 *   - Vertical / Square layout: Uses the default landing page scene WITHOUT the man with the ball (/scenes/OMzqyUv6M3kSnv0JeAtC-no-man.json),
 *     giving mobile users the animated shader/dither twinkling dots background without the man awkwardly overlapping narrow screens.
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

  const activeProjectId = isHorizontal ? projectId : `${projectId}-no-man`;
  const activeProjectSrc = isHorizontal
    ? `/scenes/${projectId}.json`
    : `/scenes/${projectId}-no-man.json`;

  // Unicorn embeds fetch scene JSON/assets from this origin — preconnect so
  // DNS+TLS happen before init() asks for them.
  const SCENE_HOST = "https://prod-cdn-prod-is1.unicornstudio.org";

  const active = isHome && scriptReady && !hasError;

  // Initialize or re-initialize when active state or layout orientation changes
  useEffect(() => {
    if (!active) return;

    if (startedRef.current) {
      window.UnicornStudio?.destroy?.();
      startedRef.current = false;
      setCanvasReady(false);
    }

    const tryStart = () => {
      if (startedRef.current) return;
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
  }, [active, isHorizontal, projectId]);

  // Stop the branding badge from flashing during boot.
  useEffect(() => {
    const cleanBranding = () => {
      const selectors = [
        `[data-us-project="${activeProjectId}"]`,
        `[data-us-project="${projectId}"]`,
        `[data-us-project="${projectId}-no-man"]`,
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
    const interval = window.setInterval(cleanBranding, 250);
    const stop = window.setTimeout(() => window.clearInterval(interval), 5000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(stop);
    };
  }, [activeProjectId, projectId]);

  useEffect(() => {
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
        {/* CSS starfield poster: Visible while the WebGL scene is booting,
            then crossfades smoothly so the landing page never has a blank flash. */}
        <div
          aria-hidden
          className={`absolute inset-0 transition-opacity ${
            isHome && !canvasReady
              ? "opacity-100 duration-700"
              : isHome
                ? "opacity-0 duration-700"
                : "opacity-0 duration-150"
          }`}
        >
          <div className="absolute inset-0 stars-bg" />
        </div>

        {/* Live UnicornStudio canvas:
            In horizontal layout: renders the default landing page WITH the man with the ball.
            In vertical/square layout: renders the default landing page WITHOUT the man with the ball. */}
        <div
          className={`absolute inset-0 w-full h-full transition-opacity ${
            isHome && canvasReady
              ? "opacity-100 duration-700"
              : "opacity-0 duration-150"
          }`}
        >
          <div
            key={activeProjectId}
            ref={hostRef}
            data-us-project={activeProjectId}
            data-us-project-src={activeProjectSrc}
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
