"use client";
import { Compass } from "@/components/icons";

export default function HuntLoading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-3xl bg-black/60 backdrop-blur-2xl border border-white/10 p-10 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center space-y-4 text-center">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
        
        <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
          <Compass className="w-8 h-8 animate-spin" />
        </div>
        <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-amber-400 w-1/2 animate-[pulse_1.5s_ease-in-out_infinite]" />
        </div>
        <p className="font-sans font-bold text-white/70 text-sm tracking-widest uppercase">Charting Course...</p>
      </div>
    </div>
  );
}
