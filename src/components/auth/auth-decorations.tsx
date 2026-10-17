"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface AuthDecorationsProps {
  page?: "login" | "register";
}

/**
 * Tasteful, lightweight culinary decorative elements arranged naturally
 * in the empty space around the centered authentication forms.
 *
 * Constraints:
 * - Purely decorative (aria-hidden, pointer-events-none)
 * - Hidden on small mobile screens to prevent clutter
 * - Respects prefers-reduced-motion
 * - Gentle one-shot GSAP entrance animation
 */
export function AuthDecorations({ page = "login" }: AuthDecorationsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const herbRef = useRef<SVGSVGElement>(null);
  const spoonRef = useRef<SVGSVGElement>(null);
  const spiceRef = useRef<SVGSVGElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Respect reduced-motion preferences
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (prefersReducedMotion) {
        if (herbRef.current) gsap.set(herbRef.current, { opacity: 0.9 });
        if (spoonRef.current) gsap.set(spoonRef.current, { opacity: 0.88 });
        if (spiceRef.current) gsap.set(spiceRef.current, { opacity: 0.9 });
        if (noteRef.current) gsap.set(noteRef.current, { opacity: 0.75 });
        return;
      }

      // One-shot graceful entrance timeline
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      // 1. Rosemary / herb sprig drifts into position
      if (herbRef.current) {
        tl.fromTo(
          herbRef.current,
          { y: -30, x: -10, opacity: 0, rotate: -28 },
          { y: 0, x: 0, opacity: 0.9, rotate: -16, duration: 1.1 }
        );
      }

      // 2. Wooden cooking spoon rotates slightly into place
      if (spoonRef.current) {
        tl.fromTo(
          spoonRef.current,
          { y: -15, x: 35, opacity: 0, rotate: 34 },
          { y: 0, x: 0, opacity: 0.88, rotate: 22, duration: 1.15 },
          "-=0.75"
        );
      }

      // 3. Garlic & star anise arrangement fades in
      if (spiceRef.current) {
        tl.fromTo(
          spiceRef.current,
          { y: 25, opacity: 0, scale: 0.94 },
          { y: 0, opacity: 0.9, scale: 1, duration: 1.05 },
          "-=0.75"
        );
      }

      // 4. Subtle archival handwritten note fades in
      if (noteRef.current) {
        tl.fromTo(
          noteRef.current,
          { opacity: 0, y: 15 },
          { opacity: 0.75, y: 0, duration: 0.9 },
          "-=0.6"
        );
      }
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none select-none overflow-hidden z-0"
    >
      {/* =================================================================== */}
      {/* 1. UPPER-LEFT: FRESH ROSEMARY / HERB SPRIG                          */}
      {/* =================================================================== */}
      <svg
        ref={herbRef}
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute top-6 left-6 md:top-10 md:left-10 lg:top-14 lg:left-16 xl:left-24 w-28 h-28 md:w-36 md:h-36 lg:w-44 lg:h-44 opacity-0 hidden md:block drop-shadow-[0_8px_16px_rgba(46,71,66,0.08)]"
      >
        {/* Main curved woody stem */}
        <path
          d="M24 136 C42 110 68 76 132 30"
          stroke="#5C4D38"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M24 136 C42 110 68 76 132 30"
          stroke="#3D5C56"
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* Rosemary needle clusters along stem */}
        {/* Pair 1 - lower stem */}
        <path
          d="M40 114 C32 108 26 94 30 84 C33 92 41 104 43 111"
          fill="#354F48"
          stroke="#263934"
          strokeWidth="1.2"
        />
        <path
          d="M44 110 C54 104 68 102 74 108 C66 112 52 114 44 110"
          fill="#476B63"
          stroke="#263934"
          strokeWidth="1.2"
        />

        {/* Pair 2 */}
        <path
          d="M58 92 C46 86 42 70 48 60 C52 70 58 82 61 89"
          fill="#3D5C56"
          stroke="#263934"
          strokeWidth="1.2"
        />
        <path
          d="M62 88 C74 80 88 82 96 88 C86 92 72 92 62 88"
          fill="#4A756C"
          stroke="#263934"
          strokeWidth="1.2"
        />

        {/* Pair 3 */}
        <path
          d="M78 70 C66 62 64 46 72 36 C76 46 80 58 81 67"
          fill="#354F48"
          stroke="#263934"
          strokeWidth="1.2"
        />
        <path
          d="M82 66 C96 58 110 62 116 70 C106 72 92 72 82 66"
          fill="#476B63"
          stroke="#263934"
          strokeWidth="1.2"
        />

        {/* Pair 4 - near tip */}
        <path
          d="M98 50 C88 40 88 26 98 18 C100 28 102 38 101 47"
          fill="#3D5C56"
          stroke="#263934"
          strokeWidth="1.2"
        />
        <path
          d="M102 46 C116 38 130 42 134 50 C124 52 112 50 102 46"
          fill="#4A756C"
          stroke="#263934"
          strokeWidth="1.2"
        />

        {/* Tip needles */}
        <path
          d="M118 36 C124 22 134 16 142 22 C138 28 128 34 118 36"
          fill="#538278"
          stroke="#263934"
          strokeWidth="1.2"
        />
        <path
          d="M124 33 C138 22 148 24 150 32 C142 34 132 35 124 33"
          fill="#3D5C56"
          stroke="#263934"
          strokeWidth="1.2"
        />

        {/* Tiny Ochre Blossom Dot (Simmory signature accent) */}
        <circle cx="94" cy="46" r="2.4" fill="#F5B726" />
        <circle cx="74" cy="66" r="2" fill="#F5B726" />
      </svg>

      {/* =================================================================== */}
      {/* 2. RIGHT SIDE: ARTISAN WOODEN COOKING SPOON                         */}
      {/* =================================================================== */}
      <svg
        ref={spoonRef}
        viewBox="0 0 100 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute top-1/4 right-4 md:right-8 lg:right-14 xl:right-24 w-16 h-48 md:w-20 md:h-60 lg:w-24 lg:h-72 opacity-0 hidden md:block drop-shadow-[0_10px_22px_rgba(70,45,20,0.09)]"
      >
        {/* Spoon Handle */}
        <path
          d="M48 95 C47 130 46 195 44 260 C44 265 52 265 52 260 C50 195 49 130 48 95 Z"
          fill="#BA834B"
          stroke="#8A5524"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Wood grain line on handle */}
        <path
          d="M48 115 C47 155 46 210 47 250"
          stroke="#9F6531"
          strokeWidth="1"
          strokeLinecap="round"
        />

        {/* Spoon Bowl */}
        <ellipse
          cx="48"
          cy="55"
          rx="26"
          ry="38"
          fill="#C68E54"
          stroke="#8A5524"
          strokeWidth="1.8"
        />
        {/* Carved inner hollow */}
        <ellipse
          cx="48"
          cy="56"
          rx="20"
          ry="30"
          fill="#B57B43"
          stroke="#965D29"
          strokeWidth="1.2"
        />
        {/* Subtle wood highlight grain */}
        <path
          d="M36 45 C40 34 54 34 58 45"
          stroke="#DFC096"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M38 65 C44 74 52 74 58 65"
          stroke="#A36B36"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>

      {/* =================================================================== */}
      {/* 3. LOWER CORNER: RUSTIC GARLIC & STAR ANISE SPICE ARRANGEMENT       */}
      {/* =================================================================== */}
      <svg
        ref={spiceRef}
        viewBox="0 0 180 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute bottom-6 left-6 md:bottom-10 md:left-10 lg:bottom-12 lg:left-16 xl:left-28 w-32 h-24 md:w-40 md:h-32 lg:w-48 lg:h-36 opacity-0 hidden md:block drop-shadow-[0_8px_18px_rgba(46,40,30,0.08)]"
      >
        {/* --- WHOLE GARLIC BULB --- */}
        {/* Stem top */}
        <path
          d="M78 30 C76 22 79 16 82 10 C84 16 83 22 81 30 Z"
          fill="#94846F"
          stroke="#6E6050"
          strokeWidth="1"
        />
        {/* Garlic bulb body cloves */}
        <path
          d="M52 76 C50 56 65 38 80 32 C95 38 110 56 108 76 C106 94 92 102 80 102 C68 102 54 94 52 76 Z"
          fill="#FAF8F2"
          stroke="#9E907D"
          strokeWidth="1.6"
        />
        {/* Left clove division */}
        <path
          d="M80 33 C68 46 60 64 64 88 C68 96 74 100 80 102"
          stroke="#B5A795"
          strokeWidth="1.3"
          fill="#F3EFE6"
        />
        {/* Right clove division */}
        <path
          d="M80 33 C92 46 100 64 96 88 C92 96 86 100 80 102"
          stroke="#B5A795"
          strokeWidth="1.3"
          fill="#F5F1E8"
        />
        {/* Root bottom */}
        <path
          d="M74 102 C76 107 84 107 86 102"
          stroke="#857563"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* --- WHOLE STAR ANISE POD --- */}
        <g transform="translate(118, 76) scale(0.68)">
          {/* Central seed core */}
          <circle cx="35" cy="35" r="7" fill="#5A2E17" stroke="#3D1E0E" strokeWidth="1.2" />
          {/* Anise Points */}
          <path d="M35 28 L35 6 L38 28 Z" fill="#8C4A26" stroke="#4F2410" strokeWidth="1" />
          <path d="M35 42 L35 64 L32 42 Z" fill="#7A3F20" stroke="#4F2410" strokeWidth="1" />
          <path d="M42 35 L64 35 L42 38 Z" fill="#8C4A26" stroke="#4F2410" strokeWidth="1" />
          <path d="M28 35 L6 35 L28 32 Z" fill="#7A3F20" stroke="#4F2410" strokeWidth="1" />
          <path d="M40 30 L58 14 L43 27 Z" fill="#804423" stroke="#4F2410" strokeWidth="1" />
          <path d="M30 40 L12 56 L27 43 Z" fill="#6F391B" stroke="#4F2410" strokeWidth="1" />
          <path d="M40 40 L58 56 L43 43 Z" fill="#8C4A26" stroke="#4F2410" strokeWidth="1" />
          <path d="M30 30 L12 14 L27 27 Z" fill="#7A3F20" stroke="#4F2410" strokeWidth="1" />
          {/* Exposed glossy amber seeds */}
          <ellipse cx="35" cy="16" rx="2" ry="3.5" fill="#C87A38" />
          <ellipse cx="54" cy="35" rx="3.5" ry="2" fill="#C87A38" />
          <ellipse cx="50" cy="48" rx="2.5" ry="3.5" fill="#C87A38" />
        </g>

        {/* --- SCATTERED WHOLE PEPPERCORNS --- */}
        <circle cx="42" cy="112" r="3.2" fill="#2E2822" />
        <circle cx="43" cy="111" r="1.2" fill="#6A6258" />
        <circle cx="112" cy="120" r="2.8" fill="#38302A" />
        <circle cx="122" cy="115" r="2.2" fill="#2E2822" />
      </svg>

      {/* =================================================================== */}
      {/* 4. LOWER-RIGHT: FAINT ARCHIVAL RECIPE MARGINAL ANNOTATION           */}
      {/* =================================================================== */}
      <div
        ref={noteRef}
        className="absolute bottom-8 right-6 md:bottom-10 md:right-10 lg:bottom-12 lg:right-16 xl:right-24 max-w-52.5 text-right opacity-0 hidden lg:block"
      >
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#2E4742]/60 block mb-1">
          {page === "login" ? "[ KITCHEN FOLIO № 14 ]" : "[ SACRED HERITAGE ]"}
        </span>
        <p className="font-serif italic text-xs text-[#525B56]/80 leading-snug">
          {page === "login"
            ? "“Keep the flame low. The memory lives in the slow simmer.”"
            : "“A family recipe is never written in stone, only in love.”"}
        </p>
        <div className="w-12 h-px bg-[#DDDCD3] ml-auto mt-2" />
      </div>
    </div>
  );
}
