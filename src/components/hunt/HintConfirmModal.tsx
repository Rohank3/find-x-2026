"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, AlertCircle, X, Unlock } from "@/components/icons";

interface HintConfirmModalProps {
  hint: {
    id: string;
    orderIndex: number;
    penaltyPoints: number;
    unlockDelayMinutes: number;
  };
  onConfirm: () => void;
  onCancel: () => void;
  isUnlocking: boolean;
}

const emptySubscribe = () => () => {};

export default function HintConfirmModal({
  hint,
  onConfirm,
  onCancel,
  isUnlocking,
}: HintConfirmModalProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCancel();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/25"
        onClick={(e) => {
          e.stopPropagation();
          onCancel();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md p-6 sm:p-7 bg-[#fef3c7] border-4 border-[#2a1810] rounded-2xl parchment-bg text-[#2a1810] shadow-[0_25px_60px_rgba(0,0,0,0.85)]"
        >
          {/* Wax-seal close button */}
          <button
            onClick={onCancel}
            className="absolute -top-3 -right-3 w-9 h-9 bg-[#dc2626] rounded-full flex items-center justify-center border-2 border-[#2a1810] shadow-md text-white hover:bg-red-700 transition-colors z-10 cursor-pointer"
            title="Cancel"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center w-16 h-16 mb-4 border-2 border-[#b45309]/30 rounded-2xl bg-[#fde68a] shadow-inner text-[#b45309]">
              <Coins className="w-9 h-9" />
            </div>

            <h3 className="mb-2 font-[family-name:var(--font-pirata-one)] text-3xl sm:text-4xl text-[#2a1810] tracking-wide">
              Break Log Seal #{hint.orderIndex}
            </h3>

            <div className="flex items-center p-3 mb-4 space-x-2 text-red-800 border-2 border-red-300 rounded-xl bg-red-100/90 shadow-sm w-full justify-center">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-700" />
              <p className="text-xs sm:text-sm font-black font-sans uppercase tracking-wider">
                Toll: {hint.penaltyPoints} GP Deduction
              </p>
            </div>

            <p className="mb-6 text-xs sm:text-sm text-[#78350f] font-sans font-medium leading-relaxed">
              Breaking this seal will permanently deduct <strong className="text-red-700 font-bold">{hint.penaltyPoints} GP</strong> from your crew&apos;s bounty ledger. This decision is irreversible.
            </p>

            <div className="flex flex-col w-full space-y-2.5 sm:flex-row sm:space-y-0 sm:space-x-3">
              <button
                onClick={onCancel}
                disabled={isUnlocking}
                className="flex-1 px-4 py-2.5 text-xs font-bold tracking-wider text-[#2a1810] uppercase border-2 border-[#2a1810]/30 rounded-xl bg-[#2a1810]/10 hover:bg-[#2a1810]/20 transition-colors cursor-pointer disabled:opacity-50"
              >
                Hold Fast (Cancel)
              </button>
              <button
                onClick={onConfirm}
                disabled={isUnlocking}
                className="flex items-center justify-center flex-1 px-4 py-2.5 space-x-1.5 text-xs font-black tracking-wider text-white uppercase rounded-xl bg-[#dc2626] hover:bg-red-700 transition-colors border-2 border-[#2a1810] shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isUnlocking ? (
                  <span className="animate-pulse">Breaking Seal...</span>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 stroke-[2.5]" />
                    <span>Break Seal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
