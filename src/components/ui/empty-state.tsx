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
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-dashed border-[#DDDCD3] bg-white/70 max-w-2xl mx-auto my-6",
        className
      )}
    >
      {badge && (
        <Badge variant="forest" className="mb-4">
          {badge}
        </Badge>
      )}

      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-[#FAF9F5] border border-[#DDDCD3] shadow-xs flex items-center justify-center text-[#2E4742] mb-5">
          {icon}
        </div>
      )}

      <h3 className="font-display text-2xl sm:text-3xl text-[#202723] font-bold tracking-tight mb-2">
        {title}
      </h3>

      <p className="text-sm sm:text-base text-[#202723]/70 max-w-md leading-relaxed mb-6 font-sans">
        {description}
      </p>

      {action && <div className="flex items-center gap-3">{action}</div>}

      {note && (
        <p className="text-xs font-mono text-[#202723]/50 mt-6 border-t border-[#DDDCD3] pt-4 max-w-sm">
          {note}
        </p>
      )}
    </div>
  );
}
