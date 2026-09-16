"use client";

import React from "react";
import { Megaphone } from "lucide-react";

interface BroadcastBannerProps {
  message?: string | null;
}

export default function BroadcastBanner({ message }: BroadcastBannerProps) {
  if (!message) return null;

  return (
    <div className="w-full bg-enigma-amber/15 border-b border-enigma-amber/30 py-2 px-4 text-xs font-mono text-amber-200">
      <div className="max-w-7xl mx-auto flex items-center justify-center space-x-2 text-center">
        <Megaphone className="h-3.5 w-3.5 text-enigma-amber animate-bounce" />
        <span className="font-bold text-amber-400 uppercase tracking-wider">ANNOUNCEMENT:</span>
        <span className="text-slate-200">{message}</span>
      </div>
    </div>
  );
}
