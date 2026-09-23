"use client";
import { Compass } from 'lucide-react';

export default function HuntLoading() {
  return (
    <div className="min-h-screen bg-voyage-abyss p-4 sm:p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full aspect-[4/3] bg-voyage-parchment/10 rounded-lg border-2 border-voyage-gold/20 relative overflow-hidden flex flex-col items-center justify-center space-y-4">
        <div className="absolute inset-0 bg-gradient-to-tr from-voyage-ocean/10 via-transparent to-voyage-ocean/10 animate-[pulse_4s_ease-in-out_infinite]" />
        
        <Compass className="w-16 h-16 text-voyage-gold/40 animate-[spin_5s_linear_infinite]" />
        <div className="w-48 h-2 bg-voyage-gold/20 rounded overflow-hidden">
          <div className="h-full bg-voyage-gold/60 w-1/2 animate-[pulse_1.5s_ease-in-out_infinite]" />
        </div>
        <p className="font-pirata text-voyage-gold/60 text-xl tracking-widest uppercase">Charting Course...</p>
      </div>
    </div>
  );
}
