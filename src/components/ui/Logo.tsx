import type { SVGProps } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * FIND X brand mark — "The Voyage Crest".
 *
 * A heraldic heater shield in gold-on-oak, carrying a four-point compass star
 * whose diagonal points read as the letter "X" (a compass rose, a cross, and
 * the hunt's initial, all at once).
 *
 * Geometry is authored in a 48x48 user space. Keep `src/app/icon.svg` in sync
 * when editing — it is the same crest, flattened for the browser tab.
 */
const SHIELD_PATH =
  "M7 6.2C12 4.2 18 2.6 24 2.6C30 2.6 36 4.2 41 6.2V22.6C41 32.2 34.2 39.4 24 43.6C13.8 39.4 7 32.2 7 22.6V6.2Z";
const BEZEL_PATH =
  "M10.7 9.9C14 8.5 18.6 7.1 24 7.1C29.4 7.1 34 8.5 37.3 9.9V22.9C37.3 30 32.4 35.2 24 38.1C15.6 35.2 10.7 30 10.7 22.9V9.9Z";
const STAR_PATH =
  "M15.2 14.7Q24 20.9 32.8 14.7Q26.6 23.5 32.8 32.3Q24 26.1 15.2 32.3Q21.4 23.5 15.2 14.7Z";

export function VoyageCrest({
  className,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="crestField" x1="24" y1="2" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2c1e13" />
          <stop offset="0.55" stopColor="#18110a" />
          <stop offset="1" stopColor="#0a0705" />
        </linearGradient>
        <linearGradient id="crestGold" x1="7" y1="3" x2="41" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fde047" />
          <stop offset="0.42" stopColor="#d4af37" />
          <stop offset="0.78" stopColor="#a17a1c" />
          <stop offset="1" stopColor="#f0c94b" />
        </linearGradient>
        <linearGradient id="crestStar" x1="15" y1="14" x2="33" y2="33" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff7c2" />
          <stop offset="0.45" stopColor="#f0c94b" />
          <stop offset="1" stopColor="#a17a1c" />
        </linearGradient>
        <linearGradient id="crestJewel" x1="24" y1="21" x2="24" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f87171" />
          <stop offset="1" stopColor="#b91c1c" />
        </linearGradient>
        <radialGradient id="crestSheen" cx="0.32" cy="0.16" r="0.6">
          <stop stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <clipPath id="crestClip">
          <path d={SHIELD_PATH} />
        </clipPath>
      </defs>

      {/* Oak field + top-left sheen, clipped to the shield silhouette */}
      <path d={SHIELD_PATH} fill="url(#crestField)" />
      <g clipPath="url(#crestClip)">
        <rect x="7" y="2" width="34" height="42" fill="url(#crestSheen)" />
      </g>

      {/* Gilded rim + inner bezel */}
      <path
        d={SHIELD_PATH}
        stroke="url(#crestGold)"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d={BEZEL_PATH}
        stroke="url(#crestGold)"
        strokeWidth="0.9"
        strokeLinejoin="round"
        opacity="0.4"
      />

      {/* Compass star — rotates a quarter turn on hover */}
      <g
        className="transition-transform duration-700 ease-out group-hover:rotate-90"
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      >
        <path d={STAR_PATH} fill="url(#crestStar)" />
      </g>

      {/* Crimson jewel at the bearing */}
      <circle cx="24" cy="23.5" r="2.1" fill="url(#crestJewel)" />
      <circle cx="23.2" cy="22.6" r="0.7" fill="#fecaca" opacity="0.8" />
    </svg>
  );
}

/**
 * Full brand lockup: crest + Luckiest Guy wordmark. Single instance per page —
 * the crest's gradient ids are fixed, so it is not safe to repeat the SVG.
 */
export default function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "group flex items-center gap-2.5 sm:gap-3 select-none shrink-0 py-1",
        className
      )}
    >
      <VoyageCrest className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 drop-shadow-[0_0_14px_rgba(212,175,55,0.5)] transition-[filter] duration-300 group-hover:drop-shadow-[0_0_22px_rgba(245,224,71,0.85)]" />

      <div className="flex flex-col leading-none">
        <div className="flex items-baseline">
          <span className="font-onepiece text-xl sm:text-2xl tracking-[0.03em] text-voyage-parchment drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            FIND
          </span>
          <span className="font-onepiece text-2xl sm:text-3xl ml-1 bg-clip-text text-transparent bg-gradient-to-br from-voyage-gold-light via-voyage-gold to-voyage-crimson drop-shadow-[0_0_12px_rgba(212,175,55,0.7)] transition-all duration-300 group-hover:drop-shadow-[0_0_20px_rgba(245,224,71,1)]">
            X
          </span>
        </div>
        <span className="hidden xl:block font-code text-[9px] uppercase tracking-[0.28em] text-voyage-gold/60 mt-1 pl-0.5">
          Grand Voyage
        </span>
      </div>
    </Link>
  );
}
