import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "warm" | "forest" | "sky" | "ochre" | "saffron" | "coral" | "terracotta" | "sage" | "outline";
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
    warm: "bg-[#EAE9E1] text-[#202723] border border-[#DDDCD3]",
    forest: "bg-[#2E4742] text-[#F2F2EB] border border-[#2E4742]",
    sky: "bg-[#EDF3FA] text-[#2F5278] border border-[#8BB2DE]/40",
    ochre: "bg-[#FEF8EC] text-[#8C6207] border border-[#F5B726]/40",
    saffron: "bg-[#FEF8EC] text-[#8C6207] border border-[#F5B726]/40",
    coral: "bg-[#FDF2F1] text-[#9E3935] border border-[#E97B77]/40",
    terracotta: "bg-[#E3E9E8] text-[#2E4742] border border-[#2E4742]/30",
    sage: "bg-[#EDF3FA] text-[#2F5278] border border-[#8BB2DE]/40",
    outline: "bg-transparent text-[#525B56] border border-[#DDDCD3]",
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
