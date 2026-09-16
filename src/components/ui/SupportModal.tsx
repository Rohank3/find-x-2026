"use client";

import React, { useState } from "react";
import { HelpCircle, Send, CheckCircle2, MessageSquare } from "lucide-react";
import { createSupportTicketAction } from "@/app/hunt/actions";

interface SupportModalProps {
  puzzleId: string;
  puzzleTitle: string;
}

export default function SupportModal({ puzzleId, puzzleTitle }: SupportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<"AMBIGUITY" | "ASSET_GLITCH" | "REQUEST_DIRECT_CLUE">("AMBIGUITY");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await createSupportTicketAction(puzzleId, category, message);
    setLoading(false);

    if (res.success) {
      setSubmitted(true);
      setMessage("");
      setTimeout(() => {
        setSubmitted(false);
        setIsOpen(false);
      }, 2000);
    } else {
      setError(res.error || "Failed to submit support request.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-1.5 text-xs font-mono text-white/50 hover:text-white transition uppercase tracking-widest"
      >
        <HelpCircle className="h-3.5 w-3.5 text-white/40" />
        <span>Need Help?</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm font-mono">
          <div className="relative max-w-lg w-full border border-white/30 bg-black p-6 space-y-4">
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-white/80" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-white/80" />
            <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-white/80" />
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-white/80" />

            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2 text-white">
                <MessageSquare className="h-4 w-4 text-white/70" />
                <h3 className="text-xs font-bold uppercase tracking-widest">
                  Support Request • {puzzleTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-white/40 hover:text-white text-xs uppercase"
              >
                [ESC]
              </button>
            </div>

            {submitted ? (
              <div className="text-center py-8 space-y-2">
                <CheckCircle2 className="h-10 w-10 text-white mx-auto mb-2 animate-bounce" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-white">
                  Ticket Submitted
                </h4>
                <p className="text-xs text-white/60">
                  Organizers notified. We will review your request shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/50 block mb-2">
                    Category
                  </label>
                  <div className="grid grid-cols-3 gap-2">                      {([
                        { id: "AMBIGUITY", label: "Ambiguity" },
                        { id: "ASSET_GLITCH", label: "Broken Asset" },
                        { id: "REQUEST_DIRECT_CLUE", label: "Clue Request" },
                      ] as const).map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`py-2 px-3 text-xs uppercase tracking-wider border transition ${
                          category === cat.id
                            ? "bg-white text-black font-bold border-white"
                            : "bg-black border-white/20 text-white/60 hover:border-white/40"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/50 block mb-2">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (!loading && message.trim()) handleSubmit(e);
                      }
                    }}
                    placeholder="Describe the issue… (Enter to send, Shift+Enter for new line)"
                    className="w-full bg-black border border-white/20 p-3 text-xs text-white focus:outline-none focus:border-white transition placeholder:text-white/20 tracking-wide"
                    required
                  />
                  <div className="text-[10px] text-white/30 tracking-wider mt-1">Enter to send · Shift+Enter for new line</div>
                </div>

                {error && (
                  <div className="text-xs text-rose-400 border border-rose-500/30 bg-rose-950/20 p-2.5">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-xs tracking-widest text-white/50 hover:text-white transition"
                  >
                    [ESC]
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !message.trim()}
                    className="px-4 py-2 border border-white/40 hover:border-white hover:bg-white hover:text-black text-white text-xs uppercase tracking-widest font-bold transition flex items-center space-x-1.5 disabled:opacity-30"
                  >
                    <Send className="h-3 w-3" />
                    <span>{loading ? "Sending..." : "Submit Ticket"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
