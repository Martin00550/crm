"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";

export function DateRangeFilter() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState("all");

  const ranges = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "quarter", label: "This Quarter" },
    { value: "year", label: "This Year" },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-surface border border-black/5 rounded-xl hover:bg-slate-50 transition-all group"
      >
        <Calendar className="w-4 h-4 text-on-surface/40 group-hover:text-primary transition-colors" />
        <span className="text-xs font-black text-on-surface/60 uppercase tracking-widest group-hover:text-primary transition-colors">
          {ranges.find(r => r.value === selectedRange)?.label || "All Time"}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-surface border border-black/5 rounded-xl shadow-xl z-50 min-w-[180px] overflow-hidden">
          {ranges.map((range) => (
            <button
              key={range.value}
              onClick={() => {
                setSelectedRange(range.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 text-xs font-medium transition-colors ${
                selectedRange === range.value
                  ? "bg-primary text-white"
                  : "text-on-surface/60 hover:bg-slate-50 hover:text-on-surface"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
