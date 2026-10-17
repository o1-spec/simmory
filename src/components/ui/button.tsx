import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "forest" | "sage";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E4742] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F2F2EB] disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:scale-[0.98]";

    const variantStyles = {
      primary:
        "bg-[#2E4742] text-[#F2F2EB] shadow-xs hover:bg-[#233733] active:bg-[#1C2D2A]",
      forest:
        "bg-[#2E4742] text-[#F2F2EB] shadow-xs hover:bg-[#233733] active:bg-[#1C2D2A]",
      secondary:
        "bg-[#FAF9F5] text-[#202723] border border-[#DDDCD3] hover:bg-white hover:border-[#202723]/30 shadow-2xs",
      outline:
        "border border-[#DDDCD3] text-[#202723] hover:border-[#2E4742] hover:text-[#2E4742] hover:bg-[#2E4742]/5 bg-transparent",
      ghost:
        "text-[#525B56] hover:text-[#202723] hover:bg-[#EAE9E1]/60 bg-transparent",
      sage:
        "bg-[#3D5C56] text-[#F2F2EB] shadow-xs hover:bg-[#2E4742] active:bg-[#233733]",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
      md: "h-10 px-4 text-sm gap-2 rounded-xl",
      lg: "h-12 px-6 text-base gap-2.5 rounded-xl font-medium",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-1.5 shrink-0" aria-hidden="true">
            <svg
              viewBox="0 0 120 100"
              className="w-4 h-4 shrink-0"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 59 19 C 59.5 15, 61 13, 62 10"
                stroke="#F5B726"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M 36 65 C 23 60, 23 43, 38 37 C 43 35, 48 39, 51 42 C 54 29, 66 29, 69 42 C 72 39, 77 35, 82 37 C 97 43, 97 60, 84 65"
                stroke="currentColor"
                strokeWidth="3.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 37 65 L 37 80 C 37 84, 45 88, 60 88 C 75 88, 83 84, 83 80 L 83 65 Z"
                stroke="currentColor"
                strokeWidth="3.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="flex items-center gap-0.5">
              <span className="w-1 h-1 rounded-full bg-current/60 animate-pulse" />
              <span className="w-1 h-1 rounded-full bg-[#F5B726] animate-pulse [animation-delay:200ms]" />
              <span className="w-1 h-1 rounded-full bg-current/60 animate-pulse [animation-delay:400ms]" />
            </span>
          </span>
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
