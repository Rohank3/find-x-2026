"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder;

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between bg-black border border-white/20 p-2 text-xs text-white focus:outline-none focus:border-white hover:border-white/40 transition uppercase tracking-wider"
      >
        <span className={value ? "text-white" : "text-white/30"}>{selectedLabel}</span>
        <div className="flex items-center space-x-1">
          {value && (
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); onChange(""); setQuery(""); }}
              className="text-white/30 hover:text-white transition p-0.5"
            >
              <X className="h-2.5 w-2.5" />
            </span>
          )}
          <ChevronDown className={`h-3 w-3 text-white/40 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-30 mt-0.5 w-full border border-white/20 bg-black shadow-xl">
          {/* Search */}
          <div className="flex items-center border-b border-white/10 px-2">
            <Search className="h-3 w-3 text-white/30 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full bg-transparent py-2 pl-2 text-xs text-white focus:outline-none placeholder:text-white/20"
            />
          </div>
          {/* Options */}
          <div className="max-h-52 overflow-y-auto divide-y divide-white/5">
            {filtered.length === 0 ? (
              <div className="px-3 py-2.5 text-xs text-white/30 uppercase tracking-wider">No results</div>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false); setQuery(""); }}
                  className={`w-full text-left px-3 py-2 text-xs uppercase tracking-wider transition ${
                    o.value === value
                      ? "bg-white text-black font-bold"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
