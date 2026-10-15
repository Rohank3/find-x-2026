export default function Loading() {
  return (
    <div
      aria-label="Loading Grand Line"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0c0805] select-none"
    >
      {/* Background radial antique glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.06)_0%,transparent_70%)] pointer-events-none" />

      {/* Decorative spinning compass */}
      <div className="relative mb-6">
        {/* Ambient soft glow */}
        <div className="absolute inset-0 rounded-full bg-amber-400/10 blur-xl animate-pulse" />

        {/* Outer compass ring with subtle cardinal notches */}
        <div className="relative h-16 w-16 rounded-full border-2 border-amber-400/30 flex items-center justify-center shadow-[0_0_24px_rgba(212,175,55,0.15)]">
          {/* Compass cardinal ticks */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-amber-400/50 rounded-full" />
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-amber-400/50 rounded-full" />
          <div className="absolute left-1 top-1/2 -translate-y-1/2 h-0.5 w-1.5 bg-amber-400/50 rounded-full" />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 h-0.5 w-1.5 bg-amber-400/50 rounded-full" />

          {/* Inner spinning gold ring */}
          <div className="h-11 w-11 rounded-full border-2 border-amber-400/20 border-t-amber-400 border-r-amber-400 animate-spin [animation-duration:1.2s]" />

          {/* Center compass pivot dot */}
          <div className="absolute w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#d4af37]" />
        </div>
      </div>

      {/* Title with One Piece gold gradient */}
      <h1 className="font-[family-name:var(--font-luckiest-guy)] text-4xl sm:text-5xl tracking-[0.12em] bg-gradient-to-b from-white via-[#fddf28] via-30% via-[#d4af37] via-65% to-[#85580c] bg-clip-text text-transparent mb-3 drop-shadow-[0_2px_12px_rgba(212,175,55,0.3)]">
        FIND X
      </h1>

      {/* Gold decorative divider */}
      <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent mb-3" />

      {/* Pirate subtitle */}
      <p className="font-[family-name:var(--font-bangers)] text-xs sm:text-sm uppercase tracking-[0.3em] text-amber-400/80 animate-pulse">
        Charting the Grand Line...
      </p>
    </div>
  );
}
