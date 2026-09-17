"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { TimelineDataPoint } from "@/lib/scoring";

interface TimelineChartProps {
  data: TimelineDataPoint[];
  topTeamNames: string[];
  activeTier?: "ALL" | "FIRST_YEAR" | "SENIOR";
  onTierChange?: (tier: "ALL" | "FIRST_YEAR" | "SENIOR") => void;
}

// Curated high-contrast, vibrant 20-color palette for dark backgrounds
const LINE_COLORS = [
  "#F59E0B", // 1. Amber Gold
  "#10B981", // 2. Emerald Green
  "#06B6D4", // 3. Electric Cyan
  "#F43F5E", // 4. Crimson Rose
  "#8B5CF6", // 5. Vivid Violet
  "#EC4899", // 6. Neon Pink / Magenta
  "#3B82F6", // 7. Royal Blue
  "#84CC16", // 8. Lime Green
  "#FB923C", // 9. Vivid Tangerine
  "#14B8A6", // 10. Turquoise Teal
  "#E11D48", // 11. Ruby Red
  "#6366F1", // 12. Indigo Purple
  "#EAB308", // 13. Bright Yellow
  "#22C55E", // 14. Mint Green
  "#A855F7", // 15. Purple Orchid
  "#38BDF8", // 16. Sky Blue
  "#F97316", // 17. Deep Orange
  "#4ADE80", // 18. Spring Green
  "#F472B6", // 19. Soft Rose
  "#2DD4BF", // 20. Aquamarine
];

// Recharts injects these props into custom tooltip/legend renderers.
interface TooltipPayloadEntry {
  dataKey?: string | number;
  value?: number | string | Array<number | string>;
  color?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string | number;
}

// Custom high-contrast tooltip sorted by points descending at the hovered timestamp
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const sorted = [...payload].sort(
      (a, b) => (Number(b.value) || 0) - (Number(a.value) || 0)
    );
    return (
      <div className="border border-white/20 bg-zinc-950/95 p-3.5 shadow-2xl backdrop-blur-md font-mono text-xs max-w-xs space-y-2 z-50">
        <div className="text-[10px] text-white/50 border-b border-white/10 pb-1 uppercase tracking-wider flex items-center justify-between">
          <span>TIME: {label}</span>
          <span className="text-amber-400 font-bold">SOLVE POINTS</span>
        </div>
        <div className="space-y-1 pt-0.5 max-h-56 overflow-y-auto pr-1">
          {sorted.map((entry) => (
            <div key={entry.dataKey} className="flex items-center justify-between space-x-3">
              <div className="flex items-center space-x-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-white truncate font-medium text-[11px]">
                  {entry.dataKey}
                </span>
              </div>
              <span className="font-bold font-mono text-[11px]" style={{ color: entry.color }}>
                {entry.value} pts
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

interface CustomLegendProps {
  payload?: TooltipPayloadEntry[];
}

// Custom colored legend chips with scrolling support for up to 20 teams
const CustomLegend = ({ payload }: CustomLegendProps) => {
  if (!payload || !payload.length) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 pt-3 border-t border-white/10 mt-2 max-h-24 overflow-y-auto px-1">
      {payload.map((entry, index) => (
        <div
          key={`legend-${index}`}
          className="flex items-center space-x-1.5 text-[10px] font-mono shrink-0 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded border border-white/10 transition"
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-white/90 font-medium truncate max-w-[120px]">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function TimelineChart({
  data,
  topTeamNames,
  activeTier,
  onTierChange,
}: TimelineChartProps) {
  const hasData = data && data.length > 0 && topTeamNames && topTeamNames.length > 0;

  return (
    <div className="relative border border-white/10 bg-black/80 p-5 my-4 font-mono text-white">
      <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white/60" />
      <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white/60" />
      <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-white/60" />
      <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white/60" />

      {/* Header with Title and Track Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-white/10 pb-3 gap-3">
        <div className="flex items-center space-x-2">
          <span className="h-2 w-2 bg-amber-400 rounded-full animate-pulse" />
          <h3 className="text-xs uppercase tracking-widest text-white font-bold">
            Score Progression Timeline
          </h3>
          {hasData && (
            <span className="text-white/40 text-[10px]">({topTeamNames.length} Teams)</span>
          )}
        </div>

        {onTierChange && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onTierChange("ALL")}
              className={`px-3 py-1.5 min-h-[36px] text-[10px] uppercase tracking-wider border transition ${
                activeTier === "ALL"
                  ? "border-amber-400 bg-amber-400 text-black font-bold"
                  : "border-white/15 text-white/60 hover:border-white/40 hover:text-white"
              }`}
            >
              Overall Track
            </button>
            <button
              type="button"
              onClick={() => onTierChange("FIRST_YEAR")}
              className={`px-3 py-1.5 min-h-[36px] text-[10px] uppercase tracking-wider border transition ${
                activeTier === "FIRST_YEAR"
                  ? "border-amber-400 bg-amber-400 text-black font-bold"
                  : "border-white/15 text-white/60 hover:border-white/40 hover:text-white"
              }`}
            >
              1st-Year Track (&apos;26)
            </button>
            <button
              type="button"
              onClick={() => onTierChange("SENIOR")}
              className={`px-3 py-1.5 min-h-[36px] text-[10px] uppercase tracking-wider border transition ${
                activeTier === "SENIOR"
                  ? "border-amber-400 bg-amber-400 text-black font-bold"
                  : "border-white/15 text-white/60 hover:border-white/40 hover:text-white"
              }`}
            >
              Senior Track
            </button>
          </div>
        )}
      </div>

      {/* Chart Canvas or Empty State */}
      {!hasData ? (
        <div className="h-64 flex flex-col items-center justify-center text-center text-xs text-white/40 uppercase tracking-wider border border-white/5 bg-black/40 p-6 sm:p-8 space-y-1.5">
          <div className="text-white/20 text-xl font-mono">∅</div>
          <div>No solves recorded yet in this division</div>
          <div className="text-[10px] text-white/30 lowercase">
            Solve puzzles to populate the live progression graph
          </div>
        </div>
      ) : (
        <div className="w-full h-64 sm:h-80 md:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 15, right: 15, left: -15, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255, 255, 255, 0.08)"
              />
              <XAxis
                dataKey="timestamp"
                stroke="#71717a"
                tick={{ fill: "#a1a1aa", fontSize: 10, fontFamily: "monospace" }}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
              />
              <YAxis
                stroke="#71717a"
                tick={{ fill: "#a1a1aa", fontSize: 10, fontFamily: "monospace" }}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                tickFormatter={(val) => `${val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />

              {topTeamNames.map((name, index) => {
                const color = LINE_COLORS[index % LINE_COLORS.length];
                return (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={color}
                    strokeWidth={2.5}
                    dot={{
                      r: 3,
                      strokeWidth: 1.5,
                      stroke: "#000000",
                      fill: color,
                    }}
                    activeDot={{
                      r: 6,
                      stroke: "#ffffff",
                      strokeWidth: 2,
                      fill: color,
                    }}
                    connectNulls
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
