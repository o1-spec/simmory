import React from "react";
import { cn } from "@/lib/utils";

export interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "space-y-3",
        align === "center" ? "text-center mx-auto max-w-3xl" : "max-w-3xl",
        className
      )}
    >
      {eyebrow && (
        <span className="inline-flex items-center gap-2 font-mono text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#2E4742] bg-[#E3E9E8]/80 px-3 py-1 rounded-full border border-[#2E4742]/20">
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-[#202723] tracking-tight leading-[1.08]">
        {title}
      </h2>
      {description && (
        <p className="text-base sm:text-lg text-[#525B56] leading-relaxed font-sans">
          {description}
        </p>
      )}
    </div>
  );
}
