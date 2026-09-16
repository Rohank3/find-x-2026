"use client";

import React from "react";
import { usePathname } from "next/navigation";

export default function InternalAtmosphere() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  // Hide on homepage where UnicornBackground WebGL canvas is active
  if (isHome) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* THURAY Gold Void: Starlight Pearl dot matrix with radial alpha mask */}
      <div
        className="absolute inset-0 opacity-45"
        style={{
          backgroundImage:
            "radial-gradient(hsl(45 40% 97% / 0.08) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage:
            "radial-gradient(ellipse 85% 60% at 50% 0%, #000 50%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 85% 60% at 50% 0%, #000 50%, transparent 100%)",
        }}
      />
      {/* THURAY Celestial Gold spotlight from the top edge */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[950px] h-[380px] bg-[hsl(45_68%_47%)] opacity-[0.045] blur-[150px] rounded-full" />
      {/* Subtle Thread Bronze secondary ambient glow */}
      <div className="absolute top-1/3 -right-24 w-[500px] h-[500px] bg-[hsl(44_63%_33%)] opacity-[0.025] blur-[180px] rounded-full" />
    </div>
  );
}
