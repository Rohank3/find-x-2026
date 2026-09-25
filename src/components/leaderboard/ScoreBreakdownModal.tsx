"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Trophy,
  AlertCircle,
  Sparkles,
  Settings,
  Users,
  ShieldCheck,
  Check,
  TrendingUp,
} from "@/components/icons";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export interface ScoreBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
  teamRank: number;
  batchTier: "FIRST_YEAR" | "SENIOR";
  initialTab?: "team" | "top5";
}

interface PointEvent {
  type: "SOLVE" | "HINT_PENALTY" | "BONUS" | "PENALTY";
  amount: number;
  description: string;
  timestamp: string;
  scoreAfter: number;
}

interface MemberInfo {
  id?: string;
  name: string | null;
  email: string | null;
  branch?: string | null;
  batchYear?: number | null;
}

interface ScoreHistoryData {
  teamId: string;
  teamName: string;
  batchTier: string;
  totalScore: number;
  totalGained: number;
  totalPenalties: number;
  totalAdjustments: number;
  members: MemberInfo[];
  isOrganizer?: boolean;
  pointHistory: PointEvent[];
}

interface TimelineTeamData {
  teamId: string;
  teamName: string;
  batchTier: string;
  dataPoints: { timestamp: string; score: number }[];
}

const TOP5_COLORS = [
  "#d97706", // amber-600
  "#059669", // emerald-600
  "#2563eb", // blue-600
  "#dc2626", // red-600
  "#7c3aed", // violet-600
];

export default function ScoreBreakdownModal({
  isOpen,
  onClose,
  teamId,
  teamName,
  teamRank,
  batchTier,
  initialTab = "team",
}: ScoreBreakdownModalProps) {
  const [data, setData] = useState<ScoreHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [activeGraphTab, setActiveGraphTab] = useState<"team" | "top5">(initialTab);
  const [prevInitialTab, setPrevInitialTab] = useState(initialTab);
  if (prevInitialTab !== initialTab) {
    setPrevInitialTab(initialTab);
    setActiveGraphTab(initialTab);
  }

  const [top5Data, setTop5Data] = useState<TimelineTeamData[] | null>(null);
  const [top5Loading, setTop5Loading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/team/${teamId}/score-history`);
        if (!res.ok) throw new Error("Failed to fetch score history");
        const json = await res.json();
        setData(json);
      } catch {
        setError("Failed to load ship manifest & trajectory.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, teamId, onClose]);

  // Lazy-load top 5 comparison data when top5 tab is requested
  useEffect(() => {
    if (!isOpen || activeGraphTab !== "top5" || top5Data) return;

    const fetchTop5Timeline = async () => {
      setTop5Loading(true);
      try {
        const tierParam = batchTier ? `?tier=${batchTier}` : "";
        const res = await fetch(`/api/leaderboard/timeline${tierParam}`);
        if (res.ok) {
          const json = await res.json();
          setTop5Data(json.teams?.slice(0, 5) || []);
        }
      } catch (err) {
        console.error("Failed to load top 5 timeline:", err);
      } finally {
        setTop5Loading(false);
      }
    };

    fetchTop5Timeline();
  }, [isOpen, activeGraphTab, batchTier, top5Data]);

  const copyToClipboard = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  // Prepare team chart points
  const teamChartPoints = (() => {
    if (!data?.pointHistory || data.pointHistory.length === 0) {
      return [{ time: "Start", score: 0, delta: 0, event: "Voyage Start" }];
    }

    const initialPoint = {
      time: "Start",
      score: 0,
      delta: 0,
      event: "Competition Initial Point",
    };

    const points = data.pointHistory.map((item) => ({
      time: new Date(item.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      score: item.scoreAfter,
      delta: item.amount,
      event: item.description,
      type: item.type,
    }));

    return [initialPoint, ...points];
  })();

  // Prepare top 5 timeline chart points
  const top5ChartPoints = (() => {
    if (!top5Data || top5Data.length === 0) return [];

    const timeMap = new Map<string, Record<string, string | number>>();
    top5Data.forEach((team) => {
      team.dataPoints.forEach((dp) => {
        const timeKey = new Date(dp.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        const existing = timeMap.get(timeKey) || { time: timeKey };
        existing[team.teamName] = dp.score;
        timeMap.set(timeKey, existing);
      });
    });

    return Array.from(timeMap.values());
  })();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-3 sm:p-6 pt-24 sm:pt-28 pb-12 overflow-y-auto bg-[#120804]/90 backdrop-blur-md">
          {/* Backdrop Click Dismiss */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-transparent -z-10"
          />

          {/* Modal Container — Warm Antique Parchment Theme (No Black Background) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl bg-[#fef3c7] border-4 border-[#2a1810] rounded-2xl parchment-bg text-[#2a1810] shadow-[0_25px_70px_rgba(0,0,0,0.85)] p-5 sm:p-7 my-2 space-y-6"
          >
            {/* Wax-Seal Red Close Button */}
            <button
              onClick={onClose}
              className="absolute -top-3.5 -right-3.5 sm:-top-4 sm:-right-4 w-11 h-11 sm:w-12 sm:h-12 bg-[#dc2626] rounded-full flex items-center justify-center border-2 border-[#2a1810] shadow-lg text-[#fef3c7] hover:bg-red-700 transition-all z-20 cursor-pointer active:scale-95"
              title="Close Log"
            >
              <X className="w-6 h-6 stroke-[2.5]" />
            </button>

            {/* Header: Crest, Team Name & Clearance Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#2a1810]/20">
              <div className="flex items-center gap-3.5">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#2a1810] text-[#fde68a] font-sans font-black text-xl shadow-md border-2 border-[#b45309]">
                  #{teamRank}
                </div>
                <div>
                  <h2 className="font-[family-name:var(--font-pirata-one)] text-3xl sm:text-4xl text-[#2a1810] tracking-wide leading-none">
                    {data?.teamName || teamName}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                        batchTier === "FIRST_YEAR"
                          ? "bg-amber-100 border-amber-600/40 text-amber-900"
                          : "bg-stone-200 border-stone-600/40 text-stone-800"
                      )}
                    >
                      {batchTier === "FIRST_YEAR" ? "Fresher '26" : "Senior Fleet"}
                    </span>

                    {data?.isOrganizer && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 border border-red-500/40 text-red-900">
                        <ShieldCheck className="w-3 h-3 text-red-700" />
                        Admin Clearance Active
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bounty Display */}
              <div className="sm:text-right bg-[#fde68a]/70 border border-[#b45309]/30 rounded-xl px-4 py-2 self-start sm:self-auto shadow-inner">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#2a1810]/70 block font-sans">
                  Total Bounty
                </span>
                <span className="font-[family-name:var(--font-pirata-one)] text-3xl sm:text-4xl text-[#2a1810] leading-none">
                  ฿ {(data?.totalScore ?? 0).toLocaleString()}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#2a1810]/60 space-y-3">
                <div className="w-8 h-8 rounded-full border-3 border-[#b45309] border-t-transparent animate-spin" />
                <p className="font-sans uppercase tracking-wider text-xs font-bold">
                  Unrolling ship manifest and audit trajectory...
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-red-700 space-y-2">
                <AlertCircle className="w-10 h-10 mb-1" />
                <p className="font-sans font-bold uppercase tracking-wider text-sm">{error}</p>
              </div>
            ) : data ? (
              <>
                {/* KPI Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#fde68a]/50 border border-[#b45309]/40 flex flex-col shadow-sm">
                    <span className="text-[#2a1810]/70 text-[11px] font-bold uppercase tracking-wider">
                      Net Bounty
                    </span>
                    <span className="font-black text-xl font-mono text-[#2a1810] mt-0.5">
                      ฿ {data.totalScore.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-100/80 border border-emerald-600/30 flex flex-col shadow-sm">
                    <span className="text-emerald-900/80 text-[11px] font-bold uppercase tracking-wider">
                      Solves Gained
                    </span>
                    <span className="font-black text-xl font-mono text-emerald-800 mt-0.5">
                      +{data.totalGained.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-red-100/80 border border-red-600/30 flex flex-col shadow-sm">
                    <span className="text-red-900/80 text-[11px] font-bold uppercase tracking-wider">
                      Hint Tolls
                    </span>
                    <span className="font-black text-xl font-mono text-red-800 mt-0.5">
                      {data.totalPenalties === 0 ? "0" : `-${data.totalPenalties.toLocaleString()}`}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-100/80 border border-amber-600/30 flex flex-col shadow-sm">
                    <span className="text-amber-900/80 text-[11px] font-bold uppercase tracking-wider">
                      Adjustments
                    </span>
                    <span
                      className={cn(
                        "font-black text-xl font-mono mt-0.5",
                        data.totalAdjustments >= 0 ? "text-emerald-800" : "text-red-800"
                      )}
                    >
                      {data.totalAdjustments > 0 ? "+" : ""}
                      {data.totalAdjustments.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* CREW MANIFEST (ROSTER): Always shows Name and Email ID for Admins */}
                <div className="p-4 sm:p-5 rounded-xl bg-[#fffbeb] border-2 border-[#2a1810]/30 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-[#2a1810]/15 pb-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#b45309]" />
                      <h3 className="font-sans font-black text-sm uppercase tracking-wider text-[#2a1810]">
                        Crew Manifest & Sailors ({data.members.length}/3)
                      </h3>
                    </div>
                    {data.isOrganizer && (
                      <span className="text-[10px] font-mono font-bold text-red-800 uppercase tracking-widest bg-red-100/90 px-2 py-0.5 rounded border border-red-300">
                        Admin Email Inspection Enabled
                      </span>
                    )}
                  </div>

                  {data.members.length === 0 ? (
                    <p className="text-xs text-[#2a1810]/50 italic py-2">
                      No sailor profiles bound to this crew manifest yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {data.members.map((member, i) => (
                        <div
                          key={member.id || i}
                          className="p-3 rounded-lg bg-[#fef3c7] border border-[#b45309]/30 flex flex-col justify-between shadow-xs hover:border-[#b45309] transition-colors"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <p className="font-bold text-sm text-[#2a1810] truncate">
                                {member.name || "Anonymous Sailor"}
                              </p>
                              {member.branch && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#fde68a] text-[#2a1810] font-mono font-semibold uppercase border border-[#b45309]/30 shrink-0">
                                  {member.branch} {member.batchYear ? `'${String(member.batchYear).slice(-2)}` : ""}
                                </span>
                              )}
                            </div>

                            {/* Email ID Display */}
                            {member.email ? (
                              <div className="mt-2 flex items-center justify-between gap-1.5 bg-[#f5e6b8] px-2 py-1 rounded border border-[#b45309]/20">
                                <span className="font-mono text-xs text-[#2a1810] truncate select-all">
                                  {member.email}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(member.email!)}
                                  className="text-[10px] font-bold text-amber-900 hover:text-red-700 uppercase tracking-wider shrink-0 transition p-0.5"
                                  title="Copy Email ID"
                                >
                                  {copiedEmail === member.email ? (
                                    <span className="flex items-center text-emerald-800 font-bold">
                                      <Check className="w-3 h-3 mr-0.5" /> Copied
                                    </span>
                                  ) : (
                                    "Copy"
                                  )}
                                </button>
                              </div>
                            ) : (
                              <div className="mt-2 text-[11px] font-mono text-[#2a1810]/40 italic">
                                Email protected (Non-admin)
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* GRAPH SECTION: Toggle between Team Score Trajectory & Top 5 Comparison */}
                <div className="p-4 sm:p-5 rounded-xl bg-[#fffbeb] border-2 border-[#2a1810]/30 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2a1810]/15 pb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#b45309]" />
                      <h3 className="font-sans font-black text-sm uppercase tracking-wider text-[#2a1810]">
                        Score Trajectory & Graphs
                      </h3>
                    </div>

                    {/* Graph Mode Switcher */}
                    <div className="flex items-center p-1 rounded-lg bg-[#fde68a] border border-[#b45309]/30 gap-1 w-fit">
                      <button
                        type="button"
                        onClick={() => setActiveGraphTab("team")}
                        className={cn(
                          "px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer",
                          activeGraphTab === "team"
                            ? "bg-[#2a1810] text-[#fde68a] shadow-sm"
                            : "text-[#2a1810]/70 hover:text-[#2a1810]"
                        )}
                      >
                        Team Trajectory
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveGraphTab("top5")}
                        className={cn(
                          "px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer",
                          activeGraphTab === "top5"
                            ? "bg-[#2a1810] text-[#fde68a] shadow-sm"
                            : "text-[#2a1810]/70 hover:text-[#2a1810]"
                        )}
                      >
                        Top 5 Comparison
                      </button>
                    </div>
                  </div>

                  {/* Mode 1: Individual Team Score Trajectory */}
                  {activeGraphTab === "team" && (
                    <div className="w-full h-64 pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={teamChartPoints}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="parchmentAmberGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#d97706" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#d97706" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#b45309" strokeOpacity={0.2} />
                          <XAxis
                            dataKey="time"
                            stroke="#2a1810"
                            fontSize={11}
                            tickLine={false}
                          />
                          <YAxis
                            stroke="#2a1810"
                            fontSize={11}
                            tickLine={false}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const pt = payload[0].payload;
                                return (
                                  <div className="bg-[#2a1810] text-[#fef3c7] p-2.5 rounded-lg border border-[#b45309] shadow-xl text-xs font-mono space-y-1">
                                    <p className="font-bold text-[#fde68a]">{pt.event}</p>
                                    <div className="flex items-center justify-between gap-4">
                                      <span>Time:</span>
                                      <span>{pt.time}</span>
                                    </div>
                                    {pt.delta !== 0 && (
                                      <div className="flex items-center justify-between gap-4">
                                        <span>Change:</span>
                                        <span className={pt.delta > 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                                          {pt.delta > 0 ? `+${pt.delta}` : pt.delta}
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex items-center justify-between gap-4 border-t border-[#fde68a]/20 pt-1 font-bold">
                                      <span>Running Bounty:</span>
                                      <span className="text-[#fde68a]">฿ {pt.score}</span>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area
                            type="stepAfter"
                            dataKey="score"
                            stroke="#b45309"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#parchmentAmberGrad)"
                            dot={{ fill: "#b45309", r: 3 }}
                            activeDot={{ fill: "#dc2626", r: 5 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Mode 2: Top 5 Comparison Graph */}
                  {activeGraphTab === "top5" && (
                    <div className="w-full h-64 pt-2">
                      {top5Loading ? (
                        <div className="h-full flex flex-col items-center justify-center text-[#2a1810]/60 space-y-2">
                          <div className="w-6 h-6 rounded-full border-2 border-[#b45309] border-t-transparent animate-spin" />
                          <span className="text-xs uppercase font-bold tracking-wider">Charting top 5 fleet trajectories...</span>
                        </div>
                      ) : top5ChartPoints.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-[#2a1810]/50 text-xs italic">
                          No timeline points recorded for the top 5 fleet yet.
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={top5ChartPoints}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#b45309" strokeOpacity={0.2} />
                            <XAxis
                              dataKey="time"
                              stroke="#2a1810"
                              fontSize={11}
                              tickLine={false}
                            />
                            <YAxis
                              stroke="#2a1810"
                              fontSize={11}
                              tickLine={false}
                            />
                            <Tooltip
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  const sorted = [...payload].sort(
                                    (a, b) => Number(b.value || 0) - Number(a.value || 0)
                                  );
                                  return (
                                    <div className="bg-[#2a1810] text-[#fef3c7] p-2.5 rounded-lg border border-[#b45309] shadow-xl text-xs font-mono space-y-1">
                                      <p className="text-[10px] text-[#fde68a]/70 uppercase tracking-widest">{label}</p>
                                      {sorted.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between gap-4">
                                          <div className="flex items-center gap-1.5 truncate max-w-[130px]">
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                            <span className="truncate">{item.name}</span>
                                          </div>
                                          <span className="font-bold text-[#fde68a]">฿ {item.value}</span>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            {top5Data?.map((team, idx) => (
                              <Line
                                key={team.teamId}
                                type="monotone"
                                dataKey={team.teamName}
                                stroke={TOP5_COLORS[idx % TOP5_COLORS.length]}
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{ r: 4 }}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  )}
                </div>

                {/* SHIP'S LEDGER: Transaction Log */}
                <div className="rounded-xl border-2 border-[#2a1810]/30 bg-[#fffbeb] overflow-hidden shadow-sm">
                  <div className="p-3 bg-[#fde68a] border-b border-[#2a1810]/20 flex items-center justify-between">
                    <span className="font-sans font-black text-xs uppercase tracking-wider text-[#2a1810]">
                      Ship&apos;s Bounty Audit Log ({data.pointHistory.length} Transactions)
                    </span>
                  </div>

                  <div className="overflow-x-auto max-h-56 overflow-y-auto">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr className="border-b border-[#2a1810]/15 bg-[#fef3c7]/60 text-[#2a1810]/70 text-[11px] uppercase tracking-wider">
                          <th className="p-2.5 font-bold w-28">Time</th>
                          <th className="p-2.5 font-bold">Event Details</th>
                          <th className="p-2.5 font-bold text-right">Points</th>
                          <th className="p-2.5 font-bold text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2a1810]/10 text-xs font-mono">
                        {data.pointHistory.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-[#2a1810]/50 italic">
                              No bounty transactions logged on this voyage yet.
                            </td>
                          </tr>
                        ) : (
                          data.pointHistory.map((event, i) => (
                            <tr key={i} className="hover:bg-[#fde68a]/40 transition-colors">
                              <td className="p-2.5 text-[#2a1810]/70">
                                {new Date(event.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </td>
                              <td className="p-2.5">
                                <div className="flex items-center gap-2">
                                  {event.type === "SOLVE" && <Trophy className="w-3.5 h-3.5 text-emerald-700 shrink-0" />}
                                  {event.type === "HINT_PENALTY" && <AlertCircle className="w-3.5 h-3.5 text-red-700 shrink-0" />}
                                  {event.type === "BONUS" && <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />}
                                  {event.type === "PENALTY" && <Settings className="w-3.5 h-3.5 text-red-700 shrink-0" />}
                                  <span className="font-sans font-bold text-[#2a1810]">
                                    {event.description}
                                  </span>
                                </div>
                              </td>
                              <td
                                className={cn(
                                  "p-2.5 font-bold text-right",
                                  event.amount > 0 ? "text-emerald-800" : "text-red-800"
                                )}
                              >
                                {event.amount > 0 ? `+${event.amount}` : event.amount}
                              </td>
                              <td className="p-2.5 font-black text-[#2a1810] text-right">
                                ฿ {event.scoreAfter}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
