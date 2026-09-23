"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Option {
  value: string;
  label: string;
}

export interface SearchableSelectProps {
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
  className,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} className={cn("relative w-full text-xs font-mono", className)}>
      <div
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }}
        className={cn(
          "w-full h-8 px-2.5 rounded bg-black/40 border border-white/10 text-white flex items-center justify-between cursor-pointer hover:border-white/20 transition-colors",
          isOpen && "border-amber-500/50"
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-white/40")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
                setSearch("");
              }}
              className="text-white/40 hover:text-white p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown className={cn("w-3 h-3 text-white/40 transition-transform", isOpen && "rotate-180")} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#1a0e07] border border-amber-500/30 rounded shadow-xl overflow-hidden max-h-56 flex flex-col">
          <div className="p-1.5 border-b border-white/10 bg-black/20">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto flex-1 p-1">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
                setSearch("");
              }}
              className={cn(
                "w-full text-left px-2 py-1.5 rounded text-xs transition-colors hover:bg-white/10",
                !value ? "text-amber-400 bg-amber-500/10 font-bold" : "text-white/70"
              )}
            >
              {placeholder}
            </button>
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-3 text-center text-white/30 text-xs">No options found</div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "w-full text-left px-2 py-1.5 rounded text-xs transition-colors hover:bg-white/10 truncate block",
                    opt.value === value
                      ? "text-amber-400 bg-amber-500/10 font-bold"
                      : "text-white/80"
                  )}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
