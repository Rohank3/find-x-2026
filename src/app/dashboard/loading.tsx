"use client";
import { Compass } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-pulse">
      <div className="flex justify-center mb-8">
        <Compass className="w-16 h-16 text-voyage-gold/50 animate-[spin_3s_linear_infinite]" />
      </div>
      
      <div className="h-32 bg-voyage-ocean/20 border-2 border-voyage-gold/30 rounded-xl w-full"></div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-voyage-oak/40 border border-voyage-gold/30 rounded-lg"></div>
        ))}
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <div className="h-8 bg-voyage-gold/20 rounded w-1/3 mb-4"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-voyage-oak/40 border border-voyage-gold/20 rounded-lg"></div>
          ))}
        </div>
        <div className="space-y-3">
          <div className="h-8 bg-voyage-gold/20 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-voyage-abyss/50 border border-voyage-gold/10 rounded"></div>
        </div>
      </div>
    </div>
  );
}
