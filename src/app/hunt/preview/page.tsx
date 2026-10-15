"use client";

import React, { useState } from "react";
import WorkflowOnePreview from "@/components/hunt/preview/WorkflowOnePreview";
import WorkflowThreePreview from "@/components/hunt/preview/WorkflowThreePreview";
import WhatsAppHintBanner, { WhatsAppIcon } from "@/components/hunt/preview/WhatsAppHintBanner";
import { PuzzleData } from "@/components/hunt/PuzzleDispatch";
import { Compass, Map, Shield, Sparkles } from "lucide-react";

const SAMPLE_PUZZLES: PuzzleData[] = [
  {
    id: "puz-1",
    orderIndex: 1,
    title: "Loguetown: The Town of the Beginning",
    description:
      "Gold Roger's final words echo across the Gallows Square. Decipher the coordinates left in the executioner's parchment.",
    assetUrl: null,
    assetType: null,
    basePoints: 100,
    isSolved: true,
    isActive: false,
    isLocked: false,
    hints: [
      {
        id: "h-1-1",
        orderIndex: 1,
        penaltyPoints: 15,
        unlockDelayMinutes: 0,
        isUnlocked: true,
        content: "Look at the capital letters etched into the wooden base.",
      },
    ],
    attemptsCount: 0,
  },
  {
    id: "puz-2",
    orderIndex: 2,
    title: "Reverse Mountain: Canal of Updrafts",
    description:
      "The twin currents converge up the vertical mountain cliff. Calculate the bearing to enter the Grand Line canal.",
    assetUrl: null,
    assetType: null,
    basePoints: 120,
    isSolved: true,
    isActive: false,
    isLocked: false,
    hints: [],
    attemptsCount: 1,
  },
  {
    id: "puz-3",
    orderIndex: 3,
    title: "Whiskey Peak: Cactus Rock",
    description:
      "A seemingly hospitable greeting hides a bounty hunter syndicate under the full moon. Find the cipher in the feast.",
    assetUrl: null,
    assetType: null,
    basePoints: 150,
    isSolved: true,
    isActive: false,
    isLocked: false,
    hints: [],
    attemptsCount: 0,
  },
  {
    id: "puz-4",
    orderIndex: 4,
    title: "Little Garden: Primeval Jungle",
    description:
      "Two warrior giants duel at the volcano signal. Chart the survival route before the Log Pose resets its magnetic needle.",
    assetUrl: null,
    assetType: null,
    basePoints: 200,
    isSolved: false,
    isActive: true,
    isLocked: false,
    hints: [
      {
        id: "h-4-1",
        orderIndex: 1,
        penaltyPoints: 25,
        unlockDelayMinutes: 5,
        isUnlocked: false,
      },
    ],
    attemptsCount: 2,
  },
  {
    id: "puz-5",
    orderIndex: 5,
    title: "Drum Kingdom: Castle of Cherry Blossoms",
    description:
      "A perennial winter shroud guards the peak of Drum Rock. Solve the medical alchemy formula.",
    assetUrl: null,
    assetType: null,
    basePoints: 220,
    isSolved: false,
    isActive: false,
    isLocked: true,
    hints: [],
    attemptsCount: 0,
  },
  {
    id: "puz-6",
    orderIndex: 6,
    title: "Alabasta: Rainbase Casino Oasis",
    description:
      "Beneath the arid sand dunes lies the secret subterranean chamber of the ancient Poneglyph.",
    assetUrl: null,
    assetType: null,
    basePoints: 250,
    isSolved: false,
    isActive: false,
    isLocked: true,
    hints: [],
    attemptsCount: 0,
  },
  {
    id: "puz-7",
    orderIndex: 7,
    title: "Raftel: Laugh Tale (The Final Treasure)",
    description:
      "The culmination of all Road Poneglyphs. Where Joy Boy left the ultimate treasure.",
    assetUrl: null,
    assetType: null,
    basePoints: 1000,
    isSolved: false,
    isActive: false,
    isLocked: true,
    hints: [],
    attemptsCount: 0,
  },
];

export default function HuntPreviewPage() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<"workflow-1" | "workflow-3">("workflow-3");

  return (
    <div className="min-h-screen bg-[#0d0704] text-[#f7e8ce] py-8 px-3 sm:px-6 lg:px-8 space-y-6">
      {/* =========================================================================
          PROTOTYPE NAVIGATION & SELECTION CONTROL BAR
         ========================================================================= */}
      <div className="max-w-6xl mx-auto rounded-3xl bg-black/70 border-2 border-amber-600/40 p-4 sm:p-6 backdrop-blur-2xl shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-mono font-bold uppercase tracking-wider">
                Interactive Design Sandbox
              </span>
              <span className="text-white/30 text-xs">•</span>
              <span className="text-emerald-400 text-xs font-mono font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Live Preview
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-serif text-white tracking-wide">
              Treasure Hunt Redesign Prototypes
            </h1>
            <p className="text-xs text-white/70 font-sans mt-0.5">
              Compare <strong>Workflow 1</strong> and <strong>Workflow 3</strong> below. Both prototypes include your new <strong>WhatsApp Live Hints Dispatch</strong> integration.
            </p>
          </div>

          {/* Workflow Toggle Buttons */}
          <div className="flex items-center p-1.5 rounded-2xl bg-[#1c0d05] border border-amber-800/60 self-stretch md:self-auto">
            <button
              onClick={() => setSelectedWorkflow("workflow-1")}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-serif text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                selectedWorkflow === "workflow-1"
                  ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg scale-100"
                  : "text-amber-200/60 hover:text-white"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Workflow 1: Tactical Desk</span>
            </button>

            <button
              onClick={() => setSelectedWorkflow("workflow-3")}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-serif text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                selectedWorkflow === "workflow-3"
                  ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg scale-100"
                  : "text-amber-200/60 hover:text-white"
              }`}
            >
              <Map className="w-4 h-4" />
              <span>Workflow 3: Hybrid Encounter</span>
            </button>
          </div>
        </div>

        {/* Workflow Concept Guide Bar */}
        <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-600/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-200">
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {selectedWorkflow === "workflow-1" ? (
                <>
                  <strong>Workflow 1 (Captain&apos;s Tactical Desk):</strong> Full-immersion diegetic chart table with pinned parchment map, spinning brass astrolabe, left action ribbons, right crew vitals, and bottom medallion shelf.
                </>
              ) : (
                <>
                  <strong>Workflow 3 (Hybrid Overworld & Encounter):</strong> Linear dotted campaign map with locked scroll padlocks, active 3D gilded Boss Card, top filigree currency bar, and bottom mechanical tumbler vault.
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/40 flex items-center gap-1.5">
              <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-400" />
              WhatsApp Hint Dispatch Active
            </span>
          </div>
        </div>
      </div>

      {/* Global WhatsApp Hint Broadcast Bar Simulator */}
      <div className="max-w-6xl mx-auto">
        <WhatsAppHintBanner
          inviteLink="https://chat.whatsapp.com/example-treasure-hunt"
          latestHintText="Island #4: The giant's duel resets on the strike of midnight. Check the coordinates near the smoking volcano!"
        />
      </div>

      {/* =========================================================================
          ACTIVE WORKFLOW RENDER
         ========================================================================= */}
      <main className="max-w-6xl mx-auto">
        {selectedWorkflow === "workflow-1" ? (
          <WorkflowOnePreview
            puzzles={SAMPLE_PUZZLES}
            teamName="Straw Hat Pirates"
          />
        ) : (
          <WorkflowThreePreview
            puzzles={SAMPLE_PUZZLES}
            teamName="Straw Hat Pirates"
          />
        )}
      </main>
    </div>
  );
}
