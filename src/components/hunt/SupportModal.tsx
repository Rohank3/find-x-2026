"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, AlertCircle, Compass, CheckCircle2, Megaphone } from "@/components/icons";
import { cn } from "@/lib/utils";

interface SupportModalProps {
  puzzleId: string;
  puzzleTitle: string;
  onClose: () => void;
  onSubmit: (
    puzzleId: string,
    category: "AMBIGUITY" | "ASSET_GLITCH" | "REQUEST_DIRECT_CLUE",
    message: string
  ) => Promise<{ success: boolean; error?: string }>;
}

const emptySubscribe = () => () => {};

export default function SupportModal({ puzzleId, puzzleTitle, onClose, onSubmit }: SupportModalProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [category, setCategory] = useState<"AMBIGUITY" | "ASSET_GLITCH" | "REQUEST_DIRECT_CLUE">("AMBIGUITY");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError("Please describe your question or issue.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await onSubmit(puzzleId, category, message);
      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => onClose(), 2000);
      } else {
        setError(res.error || "Failed to send signal flare.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/25 overflow-y-auto"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md p-6 sm:p-7 bg-[#fef3c7] border-4 border-[#2a1810] rounded-2xl parchment-bg text-[#2a1810] shadow-[0_25px_60px_rgba(0,0,0,0.85)] my-auto"
        >
          {/* Wax-seal close button */}
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 w-9 h-9 bg-[#dc2626] rounded-full flex items-center justify-center border-2 border-[#2a1810] shadow-md text-white hover:bg-red-700 transition-colors z-10 cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>

          <h3 className="mb-1 font-[family-name:var(--font-pirata-one)] text-3xl sm:text-4xl text-[#2a1810] tracking-wide">
            Fire Signal Flare
          </h3>
          <p className="mb-4 text-xs font-sans text-[#78350f]">
            Dispatching log to Admiralty for: <strong className="text-[#2a1810]">{puzzleTitle}</strong>
          </p>

          {isSuccess ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="w-16 h-16 mb-4 text-emerald-700" />
              <p className="font-sans font-black text-lg text-emerald-800 uppercase tracking-wider">Flare Sent to Admiralty!</p>
              <p className="text-xs text-[#78350f] mt-1 font-sans">Organizers have received your dispatch.</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold font-sans uppercase tracking-wider text-[#78350f]">Signal Reason</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setCategory("AMBIGUITY")}
                    className={cn(
                      "p-2 text-xs font-bold rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer",
                      category === "AMBIGUITY"
                        ? "bg-[#2a1810] text-[#f59e0b] border-2 border-[#b45309] shadow-md"
                        : "bg-[#fde68a]/60 text-[#2a1810] border-2 border-[#b45309]/30 hover:bg-[#fde68a]"
                    )}
                  >
                    <MessageSquare className="w-4 h-4" /> Foggy Riddle
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory("ASSET_GLITCH")}
                    className={cn(
                      "p-2 text-xs font-bold rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer",
                      category === "ASSET_GLITCH"
                        ? "bg-[#2a1810] text-[#f59e0b] border-2 border-[#b45309] shadow-md"
                        : "bg-[#fde68a]/60 text-[#2a1810] border-2 border-[#b45309]/30 hover:bg-[#fde68a]"
                    )}
                  >
                    <Compass className="w-4 h-4" /> Broken Compass
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory("REQUEST_DIRECT_CLUE")}
                    className={cn(
                      "p-2 text-xs font-bold rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer",
                      category === "REQUEST_DIRECT_CLUE"
                        ? "bg-[#2a1810] text-[#f59e0b] border-2 border-[#b45309] shadow-md"
                        : "bg-[#fde68a]/60 text-[#2a1810] border-2 border-[#b45309]/30 hover:bg-[#fde68a]"
                    )}
                  >
                    <Megaphone className="w-4 h-4" /> Signal Flare
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold font-sans uppercase tracking-wider text-[#78350f]">Dispatch Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  className="w-full h-28 p-3 text-xs sm:text-sm text-[#2a1810] bg-[#fde68a]/50 border-2 border-[#b45309]/30 focus:border-[#b45309] resize-none rounded-xl focus:outline-none font-code placeholder:text-amber-900/40 shadow-inner"
                  placeholder="Describe your issue or query to organizers..."
                />
              </div>

              {error && (
                <div className="flex items-center p-2.5 space-x-2 text-red-800 border-2 border-red-300 rounded-xl bg-red-100 text-xs font-sans">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-700" />
                  <p>{error}</p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-2.5 text-xs font-black tracking-wider text-[#f59e0b] uppercase rounded-xl bg-[#2a1810] hover:bg-[#3a2216] border-2 border-[#b45309]/60 shadow-md transition-all disabled:opacity-50 cursor-pointer active:scale-98"
              >
                {isSubmitting ? "Firing Flare..." : "Fire Signal Flare"}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}
