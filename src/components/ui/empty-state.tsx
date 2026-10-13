import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  badge?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  note?: string;
  className?: string;
}

export function EmptyState({
  icon,
  badge,
  title,
  description,
  action,
  note,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-dashed border-warm-300 bg-warm-50/70 max-w-2xl mx-auto my-6",
        className
      )}
    >
      {badge && (
        <Badge variant="warm" className="mb-4">
          {badge}
        </Badge>
      )}

      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-white border border-warm-200/80 shadow-xs flex items-center justify-center text-warm-500 mb-5">
          {icon}
        </div>
      )}

      <h3 className="font-serif text-xl sm:text-2xl text-warm-900 font-medium tracking-tight mb-2">
        {title}
      </h3>

      <p className="text-sm sm:text-base text-warm-600 max-w-md leading-relaxed mb-6 font-sans">
        {description}
      </p>

      {action && <div className="flex items-center gap-3">{action}</div>}

      {note && (
        <p className="text-xs text-warm-400 mt-6 border-t border-warm-200/60 pt-4 max-w-sm">
          {note}
        </p>
      )}
    </div>
  );
}
