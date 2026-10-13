import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "warm" | "terracotta" | "sage" | "saffron" | "outline";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "warm",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center font-medium rounded-full tracking-wide";

  const variantStyles = {
    warm: "bg-warm-200/80 text-warm-800 border border-warm-300/60",
    terracotta: "bg-terracotta-100 text-terracotta-800 border border-terracotta-200",
    sage: "bg-sage-100 text-sage-700 border border-sage-200",
    saffron: "bg-saffron-100 text-amber-800 border border-saffron-200",
    outline: "bg-transparent text-warm-700 border border-warm-300",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      {...props}
    >
      {children}
    </span>
  );
}
