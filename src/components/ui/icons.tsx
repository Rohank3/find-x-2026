import * as React from "react";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
  className?: string;
}

export type LucideIcon = React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>;
export type LucideProps = IconProps;

/**
 * 30. AlertCircle
 * Status alert indicator with balanced circular perimeter and high-contrast exclamation mark.
 */
export const AlertCircle = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12.5" />
      <line x1="12" y1="16.5" x2="12.01" y2="16.5" />
    </svg>
  )
);
AlertCircle.displayName = "AlertCircle";

/**
 * 1. Anchor
 * Modern nautical admiralty anchor with reinforced stock, crown arc, and sharp fluke bills.
 */
export const Anchor = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Shackle ring */}
      <circle cx="12" cy="5" r="2.5" />
      {/* Central shank */}
      <path d="M12 7.5v13" />
      {/* Stock crossbar with timber/iron stops */}
      <path d="M7 10h10" />
      <path d="M7 8.5v3" />
      <path d="M17 8.5v3" />
      {/* Curved arms / flukes */}
      <path d="M4 13.5c.5 4.8 4 8 8 8s7.5-3.2 8-8" />
      {/* Sharp fluke bills */}
      <path d="M2.5 14L4 13.5l1.5-2" />
      <path d="M21.5 14L20 13.5l-1.5-2" />
    </svg>
  )
);
Anchor.displayName = "Anchor";

/**
 * 15. ArrowDown
 * Clean directional arrow with a centered vertical stem and a 45° swept terminal arrowhead.
 */
export const ArrowDown = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </svg>
  )
);
ArrowDown.displayName = "ArrowDown";

/**
 * 16. ArrowLeft
 * Directional navigation arrow pointing west with optical symmetry.
 */
export const ArrowLeft = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  )
);
ArrowLeft.displayName = "ArrowLeft";

/**
 * 17. ArrowRight
 * Directional navigation arrow pointing east, ideal for CTA cards and next-stage progression.
 */
export const ArrowRight = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
);
ArrowRight.displayName = "ArrowRight";

/**
 * 18. ArrowUp
 * Directional elevation arrow pointing north for scroll-to-top and ascending ranks.
 */
export const ArrowUp = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  )
);
ArrowUp.displayName = "ArrowUp";

/**
 * 31. Award
 * Grand Line tournament medal with double-ringed medallion, pirate compass rose center, and notched ribbons.
 */
export const Award = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="8.5" r="6" />
      <circle cx="12" cy="8.5" r="2.8" />
      <path d="m8.2 13.2-2.2 8.8 6-3 6 3-2.2-8.8" />
    </svg>
  )
);
Award.displayName = "Award";

/**
 * 32. Bell
 * Modern maritime ship's bell with suspension shackle, flared acoustic rim, and clapper.
 */
export const Bell = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      <path d="M12 2v2" />
    </svg>
  )
);
Bell.displayName = "Bell";

/**
 * 33. Calendar
 * Voyage dispatch log calendar with binding loops and schedule date matrix.
 */
export const Calendar = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="2" x2="8" y2="5" />
      <line x1="16" y1="2" x2="16" y2="5" />
      <line x1="8" y1="14" x2="8.01" y2="14" />
      <line x1="12" y1="14" x2="12.01" y2="14" />
      <line x1="16" y1="14" x2="16.01" y2="14" />
      <line x1="8" y1="18" x2="8.01" y2="18" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
      <line x1="16" y1="18" x2="16.01" y2="18" />
    </svg>
  )
);
Calendar.displayName = "Calendar";

/**
 * 34. Check
 * Precision verification checkmark with dynamic golden-ratio stroke proportions.
 */
export const Check = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M4.5 12.5l5 5L20 6.5" />
    </svg>
  )
);
Check.displayName = "Check";

/**
 * 35. CheckCircle2
 * Encircled verification mark for conquered waypoint islands and validated puzzle stages.
 */
export const CheckCircle2 = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m8.5 12.5 2.5 2.5 5-5" />
    </svg>
  )
);
CheckCircle2.displayName = "CheckCircle2";

/**
 * 19. ChevronDown
 * Balanced 90° dropdown / disclosure indicator with exact center of mass at (12, 12).
 */
export const ChevronDown = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
);
ChevronDown.displayName = "ChevronDown";

/**
 * 36. Clock
 * Maritime chronometer with dial bezel, minute track rim, and crisp time hands.
 */
export const Clock = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6.5 12 12 16 14" />
    </svg>
  )
);
Clock.displayName = "Clock";

/**
 * 10. CloudFog
 * Atmospheric maritime fog bank rolling over calm ocean drift lines.
 */
export const CloudFog = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Cumulus cloud bank */}
      <path d="M5 14a4 4 0 0 1 3-3.8A5 5 0 0 1 17 9.5 3.5 3.5 0 0 1 19 14" />
      {/* Triple layered fog drift lines */}
      <path d="M3 17h18" />
      <path d="M6 20h12" />
      <path d="M9 23h6" />
    </svg>
  )
);
CloudFog.displayName = "CloudFog";

/**
 * 5. Coins
 * Stacked pirate doubloons with milled rims, Spanish treasure cross hallmark, and gleam sparkle.
 */
export const Coins = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Primary foreground doubloon */}
      <circle cx="9" cy="13.5" r="6" />
      <circle cx="9" cy="13.5" r="3.8" strokeDasharray="1.5 1.5" />
      <path d="M9 11.5v4M7 13.5h4" />

      {/* Secondary background doubloon */}
      <path d="M9.2 7.5A6 6 0 1 1 14.8 15" />
      <path d="M11.5 7.3a4 4 0 1 1 6.3 5" strokeDasharray="1.5 1.5" />
      <path d="M15 7.5v3M13.5 9h3" />

      {/* Treasure glint sparkle */}
      <path d="M20.5 1v5M18 3.5h5" />
    </svg>
  )
);
Coins.displayName = "Coins";

/**
 * 2. Compass
 * Navigational compass rose with cardinal ticks, housing bezel, and faceted diamond star needle.
 */
export const Compass = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Outer housing bezel */}
      <circle cx="12" cy="12" r="9.5" />
      {/* Cardinal tick marks */}
      <path d="M12 1.5v1.5M12 21v1.5M1.5 12h1.5M21 12h1.5" />
      {/* 4-point faceted compass rose star */}
      <polygon points="12 4.5 14 10 19.5 12 14 14 12 19.5 10 14 4.5 12 10 10" />
      {/* Center axis crosshairs */}
      <path d="M12 4.5v15M4.5 12h15" />
      {/* Central pivot hub */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
);
Compass.displayName = "Compass";

/**
 * 6. Crown
 * Regalia coronet with jewel-capped peaks, regal headband, and inlaid heraldic gem.
 */
export const Crown = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Coronet structure */}
      <path d="M3 8.5L5.5 18h13L21 8.5l-4.5 4L12 4.5l-4.5 8L3 8.5z" />
      {/* Peak jewels */}
      <circle cx="3" cy="8.5" r="1" />
      <circle cx="12" cy="4.5" r="1.2" />
      <circle cx="21" cy="8.5" r="1" />
      {/* Regal base band */}
      <path d="M5 20.5h14" />
      {/* Headband embedded jewels */}
      <circle cx="8" cy="18" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="16" cy="18" r="0.75" fill="currentColor" stroke="none" />
      {/* Inlaid heraldic diamond */}
      <polygon points="12 9 13.5 11.5 12 14 10.5 11.5" />
    </svg>
  )
);
Crown.displayName = "Crown";

/**
 * 14. Dice5
 * Pirate gaming die with rounded squircle bezel and solid precision-spaced pips.
 */
export const Dice5 = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Squircle die outline */}
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      {/* 5 Precision pips */}
      <circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="16" cy="8" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="8" cy="16" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  )
);
Dice5.displayName = "Dice5";

/**
 * 37. Edit3
 * Refined angled quill stylus drafting on baseline document guide.
 */
export const Edit3 = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      <path d="m14.5 5.5 3 3" />
    </svg>
  )
);
Edit3.displayName = "Edit3";

/**
 * 38. FileText
 * Cipher dossier sheet with dog-eared folded corner and manuscript riddle text lines.
 */
export const FileText = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="14" y2="17" />
      <line x1="8" y1="9" x2="11" y2="9" />
    </svg>
  )
);
FileText.displayName = "FileText";

/**
 * 25. ListFilter
 * Cascading filtered-records glyph with 3 descending centered horizontal bars.
 */
export const ListFilter = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M3 6h18" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </svg>
  )
);
ListFilter.displayName = "ListFilter";

/**
 * 39. Lock
 * Heavy pirate chest brass padlock with reinforced body, hardened shackle, and keyhole.
 */
export const Lock = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect x="3.5" y="11" width="17" height="10.5" rx="2.5" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <circle cx="12" cy="15.5" r="1.2" />
      <path d="M12 16.7v2" />
    </svg>
  )
);
Lock.displayName = "Lock";

/**
 * 27. LogIn
 * Enter / sign-in glyph: directional vector entering through an open right portal.
 */
export const LogIn = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  )
);
LogIn.displayName = "LogIn";

/**
 * 28. LogOut
 * Exit / sign-out glyph: directional vector departing from a left boundary portal.
 */
export const LogOut = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
);
LogOut.displayName = "LogOut";

/**
 * 8. Map
 * 3-panel folded nautical treasure chart with fold creases, voyage trail, and the red X.
 */
export const Map = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* 3-panel folded map perimeter */}
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      {/* Crease lines */}
      <path d="M9 3v15" />
      <path d="M15 6v15" />
      {/* Origin waypoint */}
      <circle cx="5.5" cy="15" r="0.75" fill="currentColor" stroke="none" />
      {/* Dotted navigation trail leading to the treasure */}
      <path d="M5.5 15c2-1 3-3.5 5.5-2.5s3 2 4.5.5" strokeDasharray="1.5 2" />
      {/* The iconic "X" marking the spot */}
      <path d="M16.5 10.5l3 3M19.5 10.5l-3 3" />
    </svg>
  )
);
Map.displayName = "Map";

/**
 * 41. Megaphone
 * Captain's acoustic loudhailer / broadcast horn projecting naval commands.
 */
export const Megaphone = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="m3 11 15-5v12L3 13v-2z" />
      <path d="M11 15.5v4a2 2 0 0 1-2 2h-.5a2 2 0 0 1-2-2V13" />
      <path d="M21 9a4.5 4.5 0 0 1 0 6" />
    </svg>
  )
);
Megaphone.displayName = "Megaphone";

/**
 * 20. Menu
 * Sleek 3-bar hamburger navigation toggle with 6px vertical pacing matching standard touch-targets.
 */
export const Menu = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  )
);
Menu.displayName = "Menu";

/**
 * 42. MessageSquare
 * Modern dispatch speech balloon with pointer tail and conversational script lines.
 */
export const MessageSquare = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M21 15a2.5 2.5 0 0 1-2.5 2.5H7l-4 3.5V5.5A2.5 2.5 0 0 1 5.5 3h13A2.5 2.5 0 0 1 21 5.5v9.5z" />
      <line x1="8" y1="9" x2="16" y2="9" />
      <line x1="8" y1="13" x2="13" y2="13" />
    </svg>
  )
);
MessageSquare.displayName = "MessageSquare";

/**
 * 9. Navigation
 * Directional maritime heading pointer with sharp central keel and radar waypoint sweep.
 */
export const Navigation = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Port wing */}
      <path d="M12 2.5L4.5 21l7.5-4" />
      {/* Starboard wing */}
      <path d="M12 2.5L19.5 21l-7.5-4" />
      {/* Central keel spine */}
      <path d="M12 2.5V17" />
      {/* Waypoint beacon sweep arc */}
      <path d="M8 19a5 5 0 0 0 8 0" strokeDasharray="1.5 2" />
    </svg>
  )
);
Navigation.displayName = "Navigation";

/**
 * 22. Plus
 * Precision create/add glyph with 14px span and balanced 5px peripheral margins.
 */
export const Plus = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
);
Plus.displayName = "Plus";

/**
 * 43. Radio
 * Long-range radio beacon transceiver with spherical transmitter core and expanding broadcast wavebands.
 */
export const Radio = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="2" />
      <path d="M16.24 7.76a6 6 0 0 1 0 8.49" />
      <path d="M7.76 16.24a6 6 0 0 1 0-8.49" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M4.93 19.07a10 10 0 0 1 0-14.14" />
    </svg>
  )
);
Radio.displayName = "Radio";

/**
 * 7. Scroll
 * Rolled ancient parchment scroll with script riddle lines and wax seal ribbon.
 */
export const Scroll = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Parchment sheet perimeter */}
      <path d="M19 17V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2" />
      {/* Top curl flap */}
      <path d="M4 7c0-1.66 1.34-3 3-3h11" />
      {/* Bottom curl flap */}
      <path d="M20 17c0 1.66-1.34 3-3 3H6" />
      {/* Handwritten cipher lines */}
      <path d="M8 8.5h8" />
      <path d="M8 12h8" />
      <path d="M8 15.5h5" />
      {/* Wax seal & ribbon */}
      <circle cx="16" cy="15.5" r="1.5" />
      <path d="M16 17v2.5" />
    </svg>
  )
);
Scroll.displayName = "Scroll";

/**
 * 23. Search
 * Modern magnifying glass with a clean circular optic lens and a 45° tangent handle.
 */
export const Search = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
);
Search.displayName = "Search";

/**
 * 29. Send
 * Dynamic diagonal paper dart with clean interior fold line for dispatch and answer submission.
 */
export const Send = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  )
);
Send.displayName = "Send";

/**
 * 44. Shield
 * Heraldic armor shield with reinforced rim, sweeping flank bevels, and keel point.
 */
export const Shield = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 22s8-4.5 8-10.5V5.5L12 2.5 4 5.5v6C4 17.5 12 22 12 22z" />
    </svg>
  )
);
Shield.displayName = "Shield";

/**
 * 45. ShieldAlert
 * Guarded hazard shield containing high-priority warning exclamation marker.
 */
export const ShieldAlert = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 22s8-4.5 8-10.5V5.5L12 2.5 4 5.5v6C4 17.5 12 22 12 22z" />
      <line x1="12" y1="8" x2="12" y2="12.5" />
      <line x1="12" y1="16.5" x2="12.01" y2="16.5" />
    </svg>
  )
);
ShieldAlert.displayName = "ShieldAlert";

/**
 * 46. ShieldCheck
 * Authenticated immunity crest with verified completion checkmark.
 */
export const ShieldCheck = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 22s8-4.5 8-10.5V5.5L12 2.5 4 5.5v6C4 17.5 12 22 12 22z" />
      <path d="m9 12 2.5 2.5 5-5" />
    </svg>
  )
);
ShieldCheck.displayName = "ShieldCheck";

/**
 * 3. Skull
 * Jolly Roger pirate skull with contoured cheekbones, menacing eye sockets, and jaw teeth.
 */
export const Skull = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Cranium and jaw silhouette */}
      <path d="M6 10.5C6 6.36 8.69 3 12 3s6 3.36 6 7.5c0 2.2-.8 3.5-1.5 4.5v3.5c0 1.1-.9 2-2 2h-5c-1.1 0-2-.9-2-2V15C6.8 14 6 12.7 6 10.5Z" />
      {/* Eye sockets */}
      <circle cx="9.2" cy="10.8" r="1.5" />
      <circle cx="14.8" cy="10.8" r="1.5" />
      {/* Nasal aperture */}
      <path d="M11.2 15L12 13.2l.8 1.8" />
      {/* Teeth divide & notches */}
      <path d="M9 17.5h6" />
      <path d="M10.5 16.5v2" />
      <path d="M13.5 16.5v2" />
      {/* Temporal cheekbone facets */}
      <path d="M6 13h1.5M18 13h-1.5" />
    </svg>
  )
);
Skull.displayName = "Skull";

/**
 * 24. Sliders
 * Multi-channel equalizer / tuning sliders with alternating ergonomic knob positions.
 */
export const Sliders = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  )
);
Sliders.displayName = "Sliders";

/**
 * 48. Sparkles
 * Radiant celestial sparkle cluster indicating active quest objectives and magical rewards.
 */
export const Sparkles = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
      <path d="M5 3v4" />
      <path d="M3 5h4" />
      <path d="M19 17v4" />
      <path d="M17 19h4" />
    </svg>
  )
);
Sparkles.displayName = "Sparkles";

/**
 * 49. Stamp
 * Official captain's wax seal / rubber endorsement stamp for verified dispatch log entries.
 */
export const Stamp = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M5 22h14" />
      <path d="M19.27 13.73A2.5 2.5 0 0 0 17.5 13h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1.5c0-.66-.26-1.3-.73-1.77Z" />
      <path d="M14 13V8.5C14 7.12 12.88 6 11.5 6S9 7.12 9 8.5V13" />
    </svg>
  )
);
Stamp.displayName = "Stamp";

/**
 * 11. Sun
 * Radiant Caribbean sun with concentric solar core and balanced 8-point ray geometry.
 */
export const Sun = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Outer solar ring */}
      <circle cx="12" cy="12" r="4.5" />
      {/* Concentric inner core */}
      <circle cx="12" cy="12" r="1.5" />
      {/* Cardinal sun rays */}
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      {/* Intercardinal diagonal rays */}
      <path d="M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
    </svg>
  )
);
Sun.displayName = "Sun";

/**
 * 12. Sunset
 * Golden hour ocean sunset with descending motion indicator and horizon reflection ripples.
 */
export const Sunset = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Downward solar descent vector */}
      <path d="M12 3v5M9.5 5.5L12 8l2.5-2.5" />
      {/* Twilight rays */}
      <path d="M4.5 10.5l2.5 1.5M19.5 10.5l-2.5 1.5" />
      {/* Sun sinking into the horizon */}
      <path d="M6 15a6 6 0 0 1 12 0" />
      {/* Ocean horizon line */}
      <path d="M2 15h20" />
      {/* Ocean water ripples */}
      <path d="M5 18.5h14" />
      <path d="M8 21.5h8" />
    </svg>
  )
);
Sunset.displayName = "Sunset";

/**
 * 4. Swords
 * Crossed pirate cutlasses with curved blades, sweeping bellies, basket guards, and pommels.
 */
export const Swords = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* First Cutlass (top-left to bottom-right) */}
      <path d="M4 3.5c3 3 7 7 10 10" />
      <path d="M4 3.5c1.5 3.5 5 7.5 9 10" />
      <path d="M11.5 15.5l3.5-3.5" />
      <path d="M12.5 14c.5 1.8 2 2.8 3.5 2" />
      <path d="M14.5 14.5l3.5 3.5" />
      <circle cx="19" cy="19" r="1.2" />

      {/* Second Cutlass (top-right to bottom-left) */}
      <path d="M20 3.5c-3 3-7 7-10 10" />
      <path d="M20 3.5c-1.5 3.5-5 7.5-9 10" />
      <path d="M12.5 15.5l-3.5-3.5" />
      <path d="M11.5 14c-.5 1.8-2 2.8-3.5 2" />
      <path d="M9.5 14.5l-3.5 3.5" />
      <circle cx="5" cy="19" r="1.2" />
    </svg>
  )
);
Swords.displayName = "Swords";

/**
 * 50. Terminal
 * Hacker / developer prompt chevron with command cursor underline.
 */
export const Terminal = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  )
);
Terminal.displayName = "Terminal";

/**
 * 51. Trash2
 * Tapered disposal receptacle with recessed handle lid and twin vertical flutes.
 */
export const Trash2 = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  )
);
Trash2.displayName = "Trash2";

/**
 * 13. Trophy
 * Tournament champions chalice with inlaid diamond hallmark, looped handles, and stepped plinth.
 */
export const Trophy = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Goblet chalice bowl */}
      <path d="M6 3.5h12v5.5c0 3.3-2.7 6-6 6s-6-2.7-6-6V3.5z" />
      {/* Port handle */}
      <path d="M6 5.5H4a2.5 2.5 0 0 0 0 5h2" />
      {/* Starboard handle */}
      <path d="M18 5.5h2a2.5 2.5 0 0 1 0 5h-2" />
      {/* Inlaid champion diamond */}
      <polygon points="12 6.5 13.5 8.5 12 10.5 10.5 8.5" fill="currentColor" stroke="none" />
      {/* Chalice stem */}
      <path d="M12 15v3.5" />
      {/* Upper plinth */}
      <path d="M8.5 18.5h7" />
      {/* Base tier */}
      <path d="M6 21.5h12" />
    </svg>
  )
);
Trophy.displayName = "Trophy";

/**
 * 40. Unlock
 * Unlocked pirate treasure padlock with opened shackle swung open.
 */
export const Unlock = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect x="3.5" y="11" width="17" height="10.5" rx="2.5" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
      <circle cx="12" cy="15.5" r="1.2" />
      <path d="M12 16.7v2" />
    </svg>
  )
);
Unlock.displayName = "Unlock";

/**
 * 26. Upload
 * Floating ascender arrow perched above a smooth rounded receptacle tray.
 */
export const Upload = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
);
Upload.displayName = "Upload";

/**
 * 52. UserPlus
 * Crew member profile avatar with recruitment addition cross badge.
 */
export const UserPlus = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  )
);
UserPlus.displayName = "UserPlus";

/**
 * 53. Users
 * Multi-pirate crew roster silhouette representing team alliances and leaderboards.
 */
export const Users = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
);
Users.displayName = "Users";

/**
 * 54. Volume2
 * Maritime audio broadcast speaker with dual expanding sound waves.
 */
export const Volume2 = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  )
);
Volume2.displayName = "Volume2";

/**
 * 55. VolumeX
 * Muted audio speaker with cancellation cross indicator.
 */
export const VolumeX = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="22" y1="9" x2="16" y2="15" />
      <line x1="16" y1="9" x2="22" y2="15" />
    </svg>
  )
);
VolumeX.displayName = "VolumeX";

/**
 * 21. X
 * Refined dismissal/close cross with 1:1 diagonal proportions centered at (12, 12).
 */
export const X = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
);
X.displayName = "X";

export const Settings = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
);
Settings.displayName = "Settings";

export const TrendingUp = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
);
TrendingUp.displayName = "TrendingUp";

export const ZoomIn = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  )
);
ZoomIn.displayName = "ZoomIn";

export const ZoomOut = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  )
);
ZoomOut.displayName = "ZoomOut";

export const RotateCcw = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  )
);
RotateCcw.displayName = "RotateCcw";

export const Contrast = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 18a6 6 0 0 0 0-12v12z" />
    </svg>
  )
);
Contrast.displayName = "Contrast";

export const SlidersHorizontal = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <line x1="21" y1="4" x2="14" y2="4" />
      <line x1="10" y1="4" x2="3" y2="4" />
      <line x1="21" y1="12" x2="12" y2="12" />
      <line x1="8" y1="12" x2="3" y2="12" />
      <line x1="21" y1="20" x2="16" y2="20" />
      <line x1="12" y1="20" x2="3" y2="20" />
      <line x1="14" y1="2" x2="14" y2="6" />
      <line x1="8" y1="10" x2="8" y2="14" />
      <line x1="16" y1="18" x2="16" y2="22" />
    </svg>
  )
);
SlidersHorizontal.displayName = "SlidersHorizontal";

export const Download = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
);
Download.displayName = "Download";

export const ExternalLink = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
);
ExternalLink.displayName = "ExternalLink";

export const Eye = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
);
Eye.displayName = "Eye";

export const EyeOff = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  )
);
EyeOff.displayName = "EyeOff";

export const Play = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
);
Play.displayName = "Play";

export const Pause = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  )
);
Pause.displayName = "Pause";

export const SkipForward = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <polygon points="5 4 15 12 5 20 5 4" />
      <line x1="19" y1="5" x2="19" y2="19" />
    </svg>
  )
);
SkipForward.displayName = "SkipForward";

export const Moon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, strokeWidth = 2, className, ...props }, ref) => (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  )
);
Moon.displayName = "Moon";

