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
        align === "center" ? "text-center mx-auto max-w-2xl" : "max-w-2xl",
        className
      )}
    >
      {eyebrow && (
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-terracotta-600 bg-terracotta-50 px-3 py-1 rounded-full border border-terracotta-200/60">
          {eyebrow}
        </span>
      )}
      <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-warm-900 tracking-tight leading-tight">
        {title}
      </h2>
      {description && (
        <p className="text-base sm:text-lg text-warm-600 leading-relaxed font-sans">
          {description}
        </p>
      )}
    </div>
  );
}
