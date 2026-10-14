"use client";

import React from "react";
import { Sparkles, Eye, Flame, Info } from "lucide-react";

interface SensoryCueCardProps {
  cue: string;
  notes?: string | null;
  className?: string;
}

export function SensoryCueCard({
  cue,
  notes,
  className = "",
}: SensoryCueCardProps) {
  if (!cue && !notes) return null;

  return (
    <div
      className={`rounded-2xl bg-amber-50/70 border border-amber-200/80 p-4 sm:p-5 relative transition-all ${className}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
          <Eye className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
          How you&apos;ll know it&apos;s ready
        </span>
        <Sparkles className="w-3.5 h-3.5 text-amber-500 ml-auto" />
      </div>

      {cue && (
        <p className="font-serif text-base sm:text-lg text-amber-950 italic leading-relaxed pl-1 border-l-2 border-amber-300">
          &ldquo;{cue}&rdquo;
        </p>
      )}

      {notes && (
        <div className="mt-3 pt-2.5 border-t border-amber-200/60 flex items-start gap-2 text-xs text-amber-800 leading-normal">
          <Info className="w-3.5 h-3.5 mt-0.5 text-amber-600 shrink-0" />
          <span>{notes}</span>
        </div>
      )}

      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-amber-700/80">
        <Flame className="w-3 h-3 text-amber-600" />
        <span>Authentic sensory cue preserved from the original family preparation.</span>
      </div>
    </div>
  );
}
