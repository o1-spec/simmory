import React from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-warm-200/80 mb-8",
        className
      )}
    >
      <div className="space-y-1.5 max-w-2xl">
        {eyebrow && (
          <p className="text-xs font-semibold tracking-wider uppercase text-terracotta-600 font-sans">
            {eyebrow}
          </p>
        )}
        <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight text-warm-900">
          {title}
        </h1>
        {description && (
          <p className="text-sm sm:text-base text-warm-600 leading-relaxed font-sans pt-1">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0">
          {actions}
        </div>
      )}
    </div>
  );
}
