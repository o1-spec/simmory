import React from "react";
import { cn } from "@/lib/utils";

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  label,
  className,
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-3",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-6 text-warm-600",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          "rounded-full border-warm-200 border-t-terracotta-500 animate-spin",
          sizeMap[size]
        )}
      />
      {label && <p className="text-xs font-medium text-warm-600">{label}</p>}
      <span className="sr-only">{label || "Loading..."}</span>
    </div>
  );
}

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-warm-200/60", className)}
      {...props}
    />
  );
}
