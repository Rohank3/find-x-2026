"use client";

import { useEffect } from "react";

export default function SplashDismiss() {
  useEffect(() => {
    // Give WebGL a moment to render its first frame, then fade out splash
    const timer = setTimeout(() => {
      const splash = document.getElementById("__splash");
      if (splash) {
        splash.style.opacity = "0";
        splash.style.pointerEvents = "none";
        setTimeout(() => splash.remove(), 600);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
