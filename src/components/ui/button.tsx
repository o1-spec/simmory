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
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
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
