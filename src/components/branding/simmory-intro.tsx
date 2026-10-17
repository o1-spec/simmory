"use client";

import React, { useRef, useState, useEffect, useCallback, useSyncExternalStore } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface SimmoryIntroProps {
  onComplete?: () => void;
  forcePlay?: boolean;
}

const emptySubscribe = () => () => {};

function getClientSessionSeen(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem("simmory_intro_seen") === "true";
  } catch {
    return false;
  }
}

function getServerSessionSeen(): boolean {
  return false;
}

export function SimmoryIntro({ onComplete, forcePlay = false }: SimmoryIntroProps) {
  const hasSeenInSession = useSyncExternalStore(
    emptySubscribe,
    getClientSessionSeen,
    getServerSessionSeen
  );

  const [isDismissed, setIsDismissed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const hatContainerRef = useRef<HTMLDivElement>(null);
  const centerAccentRef = useRef<HTMLDivElement>(null);
  const brandWordmarkRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);
  const accentDetailRef = useRef<HTMLSpanElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const shouldRender = forcePlay || (!hasSeenInSession && !isDismissed);

  const handleComplete = useCallback(() => {
    try {
      sessionStorage.setItem("simmory_intro_seen", "true");
    } catch {
      // Continue gracefully
    }
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
    setIsDismissed(true);

    if (typeof window !== "undefined") {
      ScrollTrigger.refresh();
    }

    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    if (isDismissed) return;
    if (tlRef.current) {
      tlRef.current.kill();
    }
    if (overlayRef.current) {
      gsap.to(overlayRef.current, {
        yPercent: -100,
        duration: 0.35,
        ease: "power3.inOut",
        onComplete: handleComplete,
      });
    } else {
      handleComplete();
    }
  }, [isDismissed, handleComplete]);

  // Keyboard accessibility: ESC key to skip
  useEffect(() => {
    if (!shouldRender) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSkip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shouldRender, handleSkip]);

  // Lock body scroll during intro
  useEffect(() => {
    if (!shouldRender) return;

    document.body.style.overflow = "hidden";

    // Safety fallback timer: intro must never block site if GSAP hangs
    const safetyTimer = window.setTimeout(() => {
      handleComplete();
    }, 4500);

    return () => {
      document.body.style.overflow = "";
      window.clearTimeout(safetyTimer);
    };
  }, [shouldRender, handleComplete]);

  // Choreographed GSAP Timeline
  useGSAP(
    () => {
      if (!shouldRender) return;

      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReduced) {
        // Reduced motion: gentle static fade without complex motion
        const reducedTl = gsap.timeline({
          onComplete: handleComplete,
        });

        reducedTl
          .to(overlayRef.current, { opacity: 1, duration: 0.4 })
          .to(overlayRef.current, { opacity: 0, duration: 0.4, delay: 0.6 });

        tlRef.current = reducedTl;
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        onComplete: handleComplete,
      });
      tlRef.current = tl;

      // =======================================================================
      // Scene 1: The Beginning (0.0 - 0.5s)
      // =======================================================================
      if (centerAccentRef.current) {
        tl.fromTo(
          centerAccentRef.current,
          { scaleX: 0, opacity: 0 },
          { scaleX: 1, opacity: 0.85, duration: 0.4, ease: "power2.out" },
          0.05
        ).to(centerAccentRef.current, { opacity: 0, duration: 0.25, ease: "power1.in" }, 0.42);
      }

      if (hatContainerRef.current) {
        tl.fromTo(
          hatContainerRef.current,
          { opacity: 0, scale: 0.9, y: 14 },
          { opacity: 1, scale: 1, y: 0, duration: 0.65, ease: "power3.out" },
          0.2
        );
      }

      // =======================================================================
      // Scene 2: The Hat Takes Shape (Stroke Drawing) (0.5 - 1.4s)
      // =======================================================================
      tl.fromTo(
        ".intro-hat-crown-stroke",
        { strokeDashoffset: 100 },
        { strokeDashoffset: 0, duration: 0.85, ease: "power2.inOut" },
        0.42
      );

      tl.fromTo(
        ".intro-hat-band-stroke",
        { strokeDashoffset: 100 },
        { strokeDashoffset: 0, duration: 0.65, ease: "power2.inOut" },
        0.68
      );

      tl.fromTo(
        ".intro-hat-creases-stroke",
        { strokeDashoffset: 100 },
        { strokeDashoffset: 0, duration: 0.55, ease: "power2.out" },
        0.88
      );

      tl.fromTo(
        ".intro-hat-fills",
        { opacity: 0 },
        { opacity: 1, duration: 0.55, ease: "power1.inOut" },
        0.98
      );

      // =======================================================================
      // Scene 3: A Touch of Life - Subtle 3D Perspective Movement (1.2 - 1.9s)
      // =======================================================================
      if (hatContainerRef.current) {
        tl.to(
          hatContainerRef.current,
          {
            y: -8,
            rotateY: 5,
            rotateX: -2,
            duration: 0.55,
            ease: "power1.inOut",
          },
          1.2
        ).to(
          hatContainerRef.current,
          {
            y: 0,
            rotateY: 0,
            rotateX: 0,
            duration: 0.65,
            ease: "power2.out",
          },
          1.72
        );
      }

      // Rising steam strokes
      tl.fromTo(
        ".intro-steam-line",
        { strokeDashoffset: 100, opacity: 0, y: 8 },
        {
          strokeDashoffset: 0,
          opacity: 0.85,
          y: 0,
          duration: 0.55,
          stagger: 0.1,
          ease: "power2.out",
        },
        1.25
      );

      tl.to(
        ".intro-steam-line",
        {
          opacity: 0.35,
          y: -8,
          duration: 0.55,
          stagger: 0.08,
          ease: "power1.out",
        },
        1.68
      );

      // =======================================================================
      // Scene 4: The Brand Reveal (1.6 - 2.3s)
      // =======================================================================
      if (brandWordmarkRef.current) {
        tl.fromTo(
          brandWordmarkRef.current,
          { yPercent: 110, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.65, ease: "power3.out" },
          1.55
        );
      }

      // =======================================================================
      // Scene 5: The Message & Tagline (2.0 - 2.6s)
      // =======================================================================
      if (taglineRef.current) {
        tl.fromTo(
          taglineRef.current,
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55, ease: "power2.out" },
          1.95
        );
      }

      if (accentDetailRef.current) {
        tl.fromTo(
          accentDetailRef.current,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)" },
          2.2
        );
      }

      // =======================================================================
      // Scene 6: Seamless Website Reveal (2.6 - 3.2s)
      // =======================================================================
      if (hatContainerRef.current) {
        tl.to(
          hatContainerRef.current,
          { y: -12, scale: 0.97, duration: 0.45, ease: "power2.inOut" },
          2.65
        );
      }

      if (brandWordmarkRef.current && taglineRef.current) {
        tl.to(
          [brandWordmarkRef.current, taglineRef.current],
          { opacity: 0, y: -6, duration: 0.35, ease: "power2.in" },
          2.65
        );
      }

      if (overlayRef.current) {
        tl.to(
          overlayRef.current,
          {
            yPercent: -100,
            duration: 0.65,
            ease: "power3.inOut",
          },
          2.85
        );
      }
    },
    { scope: containerRef, dependencies: [shouldRender] }
  );

  if (!shouldRender) return null;

  return (
    <div ref={containerRef}>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#F2F2EB] select-none pointer-events-auto overflow-hidden will-change-transform"
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to Simmory"
      >
        {/* Subtle tactile grid lines matching landing page */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.035] bg-[radial-gradient(#202723_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* Skip Intro button */}
        <div className="absolute top-5 right-5 sm:top-8 sm:right-8 z-20">
          <button
            type="button"
            onClick={handleSkip}
            className="group flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#DDDCD3] bg-[#FAF9F5]/90 hover:bg-[#FAF9F5] text-[11px] font-mono uppercase tracking-wider text-[#525B56] hover:text-[#2E4742] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E4742] shadow-xs cursor-pointer"
            aria-label="Skip introductory brand animation"
          >
            <span>Skip Intro</span>
            <kbd className="hidden sm:inline-block text-[9px] font-mono px-1 py-0.5 rounded bg-[#DDDCD3]/60 text-[#202723]">
              ESC
            </kbd>
          </button>
        </div>

        {/* Center Stage with 3D Perspective */}
        <div
          className="relative flex flex-col items-center justify-center max-w-md w-full px-6 text-center m-auto"
          style={{ perspective: "1000px" }}
        >
          {/* Center subtle spark/accent for Scene 1 */}
          <div
            ref={centerAccentRef}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-[2px] bg-[#F5B726] rounded-full pointer-events-none"
            aria-hidden="true"
          />

          {/* 3D Animated Chef's Hat Container */}
          <div
            ref={hatContainerRef}
            className="relative flex items-center justify-center will-change-transform"
            style={{ transformStyle: "preserve-3d" }}
          >
            <svg
              viewBox="0 0 360 320"
              className="w-56 h-48 sm:w-72 sm:h-64 select-none overflow-visible"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <defs>
                {/* Soft Volumetric Gradient for the Crown */}
                <linearGradient
                  id="simmoryCrownGrad"
                  x1="180"
                  y1="60"
                  x2="180"
                  y2="240"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#FAF9F5" />
                  <stop offset="70%" stopColor="#F2F2EB" />
                  <stop offset="100%" stopColor="#E2E1D8" />
                </linearGradient>

                {/* Headband Cylindrical Shading Gradient */}
                <linearGradient
                  id="simmoryBandGrad"
                  x1="108"
                  y1="230"
                  x2="252"
                  y2="230"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#E2E1D8" />
                  <stop offset="25%" stopColor="#FAF9F5" />
                  <stop offset="75%" stopColor="#FAF9F5" />
                  <stop offset="100%" stopColor="#DDDCD3" />
                </linearGradient>

                {/* Deep Ambient Drop Shadow */}
                <filter id="simmoryHatShadow" x="-20%" y="-10%" width="140%" height="130%">
                  <feDropShadow
                    dx="0"
                    dy="12"
                    stdDeviation="16"
                    floodColor="#202723"
                    floodOpacity="0.08"
                  />
                </filter>

                {/* Lobe Valley Shading */}
                <linearGradient
                  id="simmoryLeftValley"
                  x1="130"
                  y1="120"
                  x2="165"
                  y2="210"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#2E4742" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#2E4742" stopOpacity="0" />
                </linearGradient>

                <linearGradient
                  id="simmoryRightValley"
                  x1="230"
                  y1="120"
                  x2="195"
                  y2="210"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#2E4742" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#2E4742" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Group with Soft Archival Ambient Shadow */}
              <g filter="url(#simmoryHatShadow)">
                {/* Base Volumetric Fills (Fades in Scene 2) */}
                <g className="intro-hat-fills" opacity="0">
                  {/* 3-Lobed Billowing Crown Solid Fill */}
                  <path
                    d="M 106 226
                       C 60 215, 52 145, 96 112
                       C 112 100, 134 104, 148 116
                       C 158 70, 202 70, 212 116
                       C 226 104, 248 100, 264 112
                       C 308 145, 300 215, 254 226
                       Z"
                    fill="url(#simmoryCrownGrad)"
                  />

                  {/* Headband Solid Fill */}
                  <path
                    d="M 108 226
                       L 108 256
                       C 108 266, 126 274, 180 274
                       C 234 274, 252 266, 252 256
                       L 252 226
                       Z"
                    fill="url(#simmoryBandGrad)"
                  />

                  {/* Valley Crease Shadows between lobes for 3D depth */}
                  <path
                    d="M 148 116 C 154 150, 160 190, 166 226 C 158 226, 146 170, 140 125 Z"
                    fill="url(#simmoryLeftValley)"
                  />
                  <path
                    d="M 212 116 C 206 150, 200 190, 194 226 C 202 226, 214 170, 220 125 Z"
                    fill="url(#simmoryRightValley)"
                  />

                  {/* Subtle Upper Highlight Along Left Rim */}
                  <path
                    d="M 85 135 C 92 115, 115 105, 138 110"
                    stroke="#FFFFFF"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    opacity="0.65"
                  />
                </g>

                {/* Animated Outlines (Drawn in Scene 2) */}
                {/* Crown Main Contour */}
                <path
                  d="M 106 226
                     C 60 215, 52 145, 96 112
                     C 112 100, 134 104, 148 116
                     C 158 70, 202 70, 212 116
                     C 226 104, 248 100, 264 112
                     C 308 145, 300 215, 254 226"
                  pathLength="100"
                  className="intro-hat-crown-stroke"
                  stroke="#2E4742"
                  strokeWidth="3.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="100"
                  strokeDashoffset="100"
                />

                {/* Headband Base Contour */}
                <path
                  d="M 108 226
                     L 108 256
                     C 108 266, 126 274, 180 274
                     C 234 274, 252 266, 252 256
                     L 252 226"
                  pathLength="100"
                  className="intro-hat-band-stroke"
                  stroke="#2E4742"
                  strokeWidth="3.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="100"
                  strokeDashoffset="100"
                />

                {/* Inner Crease Lines & Headband Stitches */}
                <g className="intro-hat-creases-stroke" strokeDasharray="100" strokeDashoffset="100">
                  {/* Left lobe inner crease */}
                  <path
                    d="M 148 116 C 154 150, 160 190, 166 226"
                    pathLength="100"
                    stroke="#2E4742"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    opacity="0.85"
                  />
                  {/* Right lobe inner crease */}
                  <path
                    d="M 212 116 C 206 150, 200 190, 194 226"
                    pathLength="100"
                    stroke="#2E4742"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    opacity="0.85"
                  />
                  {/* Vertical headband stitch lines */}
                  <line
                    x1="144"
                    y1="236"
                    x2="144"
                    y2="256"
                    pathLength="100"
                    stroke="#2E4742"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="168"
                    y1="238"
                    x2="168"
                    y2="260"
                    pathLength="100"
                    stroke="#2E4742"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="192"
                    y1="238"
                    x2="192"
                    y2="260"
                    pathLength="100"
                    stroke="#2E4742"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="216"
                    y1="236"
                    x2="216"
                    y2="256"
                    pathLength="100"
                    stroke="#2E4742"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />

                  {/* Delicate Ochre Bottom Thread Stitch */}
                  <path
                    d="M 140 270 C 155 272, 205 272, 220 270"
                    pathLength="100"
                    stroke="#F5B726"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  />
                </g>
              </g>

              {/* Culinary Steam strokes rising gently (Scene 3) */}
              <g className="intro-steam-group">
                {/* Center Ochre Steam Curl */}
                <path
                  d="M 180 56 C 178 40, 186 32, 184 16"
                  pathLength="100"
                  className="intro-steam-line intro-steam-1"
                  stroke="#F5B726"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeDasharray="100"
                  strokeDashoffset="100"
                />
                {/* Left Faint Steam Line */}
                <path
                  d="M 164 62 C 160 50, 166 42, 162 28"
                  pathLength="100"
                  className="intro-steam-line intro-steam-2"
                  stroke="#2E4742"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  opacity="0.4"
                  strokeDasharray="100"
                  strokeDashoffset="100"
                />
                {/* Right Faint Steam Line */}
                <path
                  d="M 196 62 C 200 50, 194 42, 198 28"
                  pathLength="100"
                  className="intro-steam-line intro-steam-3"
                  stroke="#2E4742"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  opacity="0.4"
                  strokeDasharray="100"
                  strokeDashoffset="100"
                />
                {/* Golden Ochre Culinary Droplet */}
                <circle cx="185" cy="12" r="3.5" fill="#F5B726" className="intro-steam-line" opacity="0" />
              </g>
            </svg>
          </div>

          {/* Wordmark (Scene 4: Masked Reveal) */}
          <div className="overflow-hidden py-1 mt-3">
            <h1
              ref={brandWordmarkRef}
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#2E4742] lowercase select-none will-change-transform"
            >
              simmory<span className="text-[#F5B726]">.</span>
            </h1>
          </div>

          {/* Tagline (Scene 5: Understated message) */}
          <div
            ref={taglineRef}
            className="mt-2 flex items-center justify-center gap-2.5 px-4 select-none will-change-transform"
          >
            <span
              ref={accentDetailRef}
              className="w-1.5 h-1.5 rounded-full bg-[#F5B726] shrink-0"
              aria-hidden="true"
            />
            <p className="font-sans text-sm sm:text-base font-normal text-[#525B56] tracking-normal">
              The way they made it, remembered.
            </p>
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#F5B726] shrink-0 opacity-0 sm:opacity-100"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
