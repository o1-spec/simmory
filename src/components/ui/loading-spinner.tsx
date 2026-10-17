import React from "react";
import { cn } from "@/lib/utils";

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  text?: string;
  className?: string;
  showWordmark?: boolean;
}

export function LoadingSpinner({
  size = "md",
  label,
  text,
  className,
  showWordmark = false,
}: LoadingSpinnerProps) {
  const displayLabel = label ?? text;

  // Compact / Inline size
  if (size === "sm") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 text-xs font-mono text-[#525B56]",
          className
        )}
        role="status"
        aria-live="polite"
      >
        <svg
          viewBox="0 0 120 100"
          className="w-5 h-5 text-[#2E4742] shrink-0"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Ochre steam curl */}
          <path
            d="M 59 19 C 59.5 15, 61 13, 62 10"
            stroke="#F5B726"
            strokeWidth="3.6"
            strokeLinecap="round"
          />
          {/* Chef's hat crown */}
          <path
            d="M 36 65 C 23 60, 23 43, 38 37 C 43 35, 48 39, 51 42 C 54 29, 66 29, 69 42 C 72 39, 77 35, 82 37 C 97 43, 97 60, 84 65"
            stroke="#2E4742"
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Headband base */}
          <path
            d="M 37 65 L 37 80 C 37 84, 45 88, 60 88 C 75 88, 83 84, 83 80 L 83 65 Z"
            stroke="#2E4742"
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {displayLabel && <span>{displayLabel}</span>}
        <span className="flex items-center gap-1" aria-hidden="true">
          <span className="w-1 h-1 rounded-full bg-[#9EB3AF] animate-pulse" />
          <span className="w-1 h-1 rounded-full bg-[#F5B726] animate-pulse [animation-delay:200ms]" />
          <span className="w-1 h-1 rounded-full bg-[#9EB3AF] animate-pulse [animation-delay:400ms]" />
        </span>
        <span className="sr-only">{displayLabel || "Loading..."}</span>
      </div>
    );
  }

  // Medium and Large sizes: The Signature Simmory Chef's Hat Culinary Loader
  const hatSizes = {
    md: "w-14 h-12 sm:w-16 sm:h-14",
    lg: "w-20 h-16 sm:w-24 sm:h-20",
  };

  return (
    <div
      className={cn(
        "flex-1 min-h-[30vh] sm:min-h-[40vh] flex flex-col items-center justify-center p-6 text-center select-none",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
        {/* Chef's Hat SVG Illustration with Settling Movement & Stroke Animation */}
        <div className="simmory-hat-settle relative flex items-center justify-center">
          <svg
            viewBox="0 0 120 100"
            className={cn(hatSizes[size], "text-[#2E4742]")}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Ochre steam curl / culinary accent */}
            <path
              d="M 59 19 C 59.5 15, 61 13, 62 10"
              pathLength="100"
              className="simmory-ochre-accent"
              stroke="#F5B726"
              strokeWidth="3.2"
              strokeLinecap="round"
            />

            {/* Chef's hat crown */}
            <path
              d="M 36 65 C 23 60, 23 43, 38 37 C 43 35, 48 39, 51 42 C 54 29, 66 29, 69 42 C 72 39, 77 35, 82 37 C 97 43, 97 60, 84 65"
              pathLength="100"
              className="simmory-hat-stroke simmory-hat-stroke-crown"
              stroke="#2E4742"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Headband base */}
            <path
              d="M 37 65 L 37 80 C 37 84, 45 88, 60 88 C 75 88, 83 84, 83 80 L 83 65 Z"
              pathLength="100"
              className="simmory-hat-stroke simmory-hat-stroke-band"
              stroke="#2E4742"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Headband vertical tick / vent accents */}
            <line
              x1="51"
              y1="71"
              x2="51"
              y2="78"
              pathLength="100"
              className="simmory-hat-stroke simmory-hat-stroke-stitch"
              stroke="#2E4742"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <line
              x1="69"
              y1="71"
              x2="69"
              y2="78"
              pathLength="100"
              className="simmory-hat-stroke simmory-hat-stroke-stitch"
              stroke="#2E4742"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Optional Wordmark */}
        {showWordmark && (
          <div className="simmory-loader-text-brand mt-3">
            <span className="font-display text-2xl font-bold tracking-tight text-[#2E4742] lowercase select-none">
              simmory.
            </span>
          </div>
        )}

        {/* Contextual Label or Tagline */}
        <div className="simmory-loader-text-tagline mt-2.5 px-3">
          <p className="font-sans text-xs sm:text-sm font-medium text-[#525B56] leading-snug">
            {displayLabel || "The way they made it, remembered."}
          </p>
        </div>

        {/* Three Understated Animated Dots (with Ochre Center) */}
        <div
          className="simmory-loader-text-dots mt-3.5 flex items-center justify-center gap-2"
          aria-hidden="true"
        >
          <span className="simmory-loader-dot simmory-loader-dot-1 w-1.5 h-1.5 rounded-full bg-[#9EB3AF]" />
          <span className="simmory-loader-dot simmory-loader-dot-2 w-1.5 h-1.5 rounded-full bg-[#F5B726]" />
          <span className="simmory-loader-dot simmory-loader-dot-3 w-1.5 h-1.5 rounded-full bg-[#9EB3AF]" />
        </div>
      </div>

      <span className="sr-only">{displayLabel || "Loading Simmory..."}</span>
    </div>
  );
}

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-[#EAE8DE]/80", className)}
      {...props}
    />
  );
}
