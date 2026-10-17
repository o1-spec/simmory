"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";

export interface InitialLoaderProps {
  fullscreen?: boolean;
  className?: string;
  isReady?: boolean;
  onDismiss?: () => void;
}

export function InitialLoader({
  fullscreen = true,
  className = "",
  isReady = false,
  onDismiss,
}: InitialLoaderProps) {
  useEffect(() => {
    if (isReady && onDismiss) {
      const timer = window.setTimeout(onDismiss, 350);
      return () => window.clearTimeout(timer);
    }
  }, [isReady, onDismiss]);

  const containerClasses = fullscreen
    ? `fixed inset-0 z-[9999] bg-[#F2F2EB] flex flex-col items-center justify-center w-screen h-screen min-h-dvh transition-opacity duration-350 ease-out select-none ${
        isReady ? "opacity-0 pointer-events-none" : "opacity-100"
      }`
    : `flex flex-col items-center justify-center py-16 w-full select-none transition-opacity duration-350 ease-out ${
        isReady ? "opacity-0 pointer-events-none" : "opacity-100"
      }`;

  return (
    <div
      className={`${containerClasses} ${className}`}
      role="status"
      aria-live="polite"
      aria-label="Loading Simmory"
    >
      <div className="flex flex-col items-center justify-center max-w-sm px-6 text-center m-auto">
        {/* Chef's Hat SVG Illustration with Settling Movement */}
        <div className="simmory-hat-settle relative flex items-center justify-center">
          <svg
            viewBox="0 0 120 100"
            className="w-24 h-20 sm:w-28 sm:h-24 text-[#2E4742]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Ochre steam curl / culinary accent floating above center peak */}
            <path
              d="M 59 19 C 59.5 15, 61 13, 62 10"
              pathLength="100"
              className="simmory-ochre-accent"
              stroke="#F5B726"
              strokeWidth="3.2"
              strokeLinecap="round"
            />

            {/* Chef's hat crown — 3 distinct rounded lobes */}
            <path
              d="M 36 65 C 23 60, 23 43, 38 37 C 43 35, 48 39, 51 42 C 54 29, 66 29, 69 42 C 72 39, 77 35, 82 37 C 97 43, 97 60, 84 65"
              pathLength="100"
              className="simmory-hat-stroke simmory-hat-stroke-crown"
              stroke="#2E4742"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Headband base — rounded lower edge */}
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

        {/* Lowercase simmory. brand wordmark */}
        <div className="simmory-loader-text-brand mt-4">
          <span className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#2E4742] lowercase select-none">
            simmory.
          </span>
        </div>

        {/* Tagline */}
        <div className="simmory-loader-text-tagline mt-1.5 px-2">
          <p className="font-sans text-sm sm:text-[15px] text-[#525B56] leading-snug select-none">
            The way they made it, remembered.
          </p>
        </div>

        {/* Three understated animated dots */}
        <div
          className="simmory-loader-text-dots mt-5 flex items-center justify-center gap-2"
          aria-hidden="true"
        >
          <span className="simmory-loader-dot simmory-loader-dot-1 w-1.5 h-1.5 rounded-full bg-[#9EB3AF]" />
          <span className="simmory-loader-dot simmory-loader-dot-2 w-1.5 h-1.5 rounded-full bg-[#F5B726]" />
          <span className="simmory-loader-dot simmory-loader-dot-3 w-1.5 h-1.5 rounded-full bg-[#9EB3AF]" />
        </div>
      </div>
    </div>
  );
}

const emptySubscribe = () => () => {};

function getClientSessionLoaded(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem("simmory_app_loaded") === "true";
  } catch {
    return false;
  }
}

function getServerSessionLoaded(): boolean {
  return false;
}

export function InitialAppLoader() {
  const hasLoadedInSession = useSyncExternalStore(
    emptySubscribe,
    getClientSessionLoaded,
    getServerSessionLoaded
  );
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (hasLoadedInSession) return;

    const handleReady = () => {
      setIsFadingOut(true);
      try {
        sessionStorage.setItem("simmory_app_loaded", "true");
      } catch {
        // Continue gracefully
      }
      const timer = window.setTimeout(() => {
        setIsDismissed(true);
      }, 350);
      return () => window.clearTimeout(timer);
    };

    if (document.readyState === "complete") {
      const frame = window.requestAnimationFrame(handleReady);
      return () => window.cancelAnimationFrame(frame);
    } else {
      window.addEventListener("load", handleReady, { once: true });
      return () => window.removeEventListener("load", handleReady);
    }
  }, [hasLoadedInSession]);

  if (hasLoadedInSession || isDismissed) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] pointer-events-auto transition-opacity duration-350 ease-out flex items-center justify-center w-screen h-screen min-h-dvh bg-[#F2F2EB] ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <InitialLoader fullscreen />
    </div>
  );
}
