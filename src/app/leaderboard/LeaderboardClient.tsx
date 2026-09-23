"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Anchor } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LeaderboardResult } from '@/lib/scoring';
import WantedPosterGrid from '@/components/leaderboard/WantedPosterGrid';
import FleetLedger from '@/components/leaderboard/FleetLedger';

interface LeaderboardClientProps {
  initialData: LeaderboardResult;
}

type TierFilter = 'ALL' | 'FIRST_YEAR' | 'SENIOR';

export default function LeaderboardClient({ initialData }: LeaderboardClientProps) {
  const [data, setData] = useState<LeaderboardResult>(initialData);
  const [activeTier, setActiveTier] = useState<TierFilter>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (tier: TierFilter) => {
    if (document.hidden) return; // Respect page visibility
    
    try {
      setIsRefreshing(true);
      const url = tier === 'ALL' ? '/api/leaderboard' : `/api/leaderboard?tier=${tier}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Polling error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData(activeTier);
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const interval = setInterval(() => fetchData(activeTier), 10000);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [fetchData, activeTier]);

  const top5 = (data.entries || []).slice(0, 5);
  const rest = (data.entries || []).slice(5);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-12">
      {data.isFrozen && (
        <div className="w-full bg-amber-500/20 border-2 border-amber-500 text-amber-400 p-4 rounded flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
          <Anchor className="w-6 h-6" />
          <span className="font-cinzel font-bold text-lg tracking-wider">
            ⚓ Leaderboard frozen at freeze-time
          </span>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-4">
        {[
          { id: 'ALL', label: 'All Crews' },
          { id: 'FIRST_YEAR', label: 'Freshers (2026)' },
          { id: 'SENIOR', label: 'Senior Fleet' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              const newTier = tab.id as TierFilter;
              setActiveTier(newTier);
              fetchData(newTier);
            }}
            className={cn(
              "px-6 py-3 font-cinzel text-sm md:text-base font-bold uppercase tracking-wider transition-all relative border-b-2",
              activeTier === tab.id 
                ? "text-amber-400 border-amber-400 bg-amber-500/10" 
                : "text-amber-400/60 border-transparent hover:text-amber-400/80 hover:bg-amber-500/5"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTier}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-16"
        >
          {top5.length > 0 ? (
            <section>
              <h2 className="sr-only">Most Wanted</h2>
              <WantedPosterGrid teams={top5} />
            </section>
          ) : (
             <div className="text-center py-20 font-cinzel text-amber-400/50 text-xl">
               No bounties issued yet.
             </div>
          )}

          {rest.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-cinzel text-2xl text-amber-400 font-bold flex items-center gap-2">
                  <Anchor className="w-6 h-6 text-amber-500" /> Grand Fleet Ledger
                </h2>
                {isRefreshing && (
                  <span className="text-xs text-amber-500/50 font-code animate-pulse">Charting...</span>
                )}
              </div>
              <FleetLedger teams={rest} showQuestionsSolved={true} />
            </section>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
