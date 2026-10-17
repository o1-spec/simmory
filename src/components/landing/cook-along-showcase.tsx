"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  Flame,
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface StepData {
  num: number;
  title: string;
  time: string;
  timestamp: string;
  timerSeconds: number;
  instruction: string;
  cue: string;
  image: string;
  videoTitle: string;
  videoDesc: string;
}

const COOK_STEPS: StepData[] = [
  {
    num: 1,
    title: "Autolyse Flour & Water",
    time: "30 min",
    timestamp: "02:15",
    timerSeconds: 1800,
    instruction:
      "Mix organic flour and lukewarm water into a rough shaggy dough. Let rest covered with a damp linen tea towel.",
    cue: "Flour will fully hydrate; no dry pockets or unmixed clumps remain.",
    image: "/images/hero-cooking-hands.jpg",
    videoTitle: "Step 01 — Dough Hydration & Rest",
    videoDesc: "Watch the hydration mixing technique before the initial autolyse rest period.",
  },
  {
    num: 2,
    title: "Incorporate Starter & Salt",
    time: "10 min",
    timestamp: "05:40",
    timerSeconds: 600,
    instruction:
      "Dimple the active starter into the dough. Pinch with wet fingers and gently fold until silky and cohesive.",
    cue: "Dough transforms from rough and lumpy to a smooth satin surface.",
    image: "/images/cook-along-kitchen.jpg",
    videoTitle: "Step 02 — Starter Dimpling & Pinch",
    videoDesc: "Observe how the fermented sourdough culture is integrated by hand.",
  },
  {
    num: 3,
    title: "Coil Folds & Surface Tension",
    time: "20 min",
    timestamp: "08:45",
    timerSeconds: 1200,
    instruction:
      "With wet hands, lift the center of the dough and gently tuck ends under. Rotate 90 degrees and repeat three times.",
    cue: "Look for translucent bubbles doming beneath the skin and holding structural tension.",
    image: "/images/family-cooking.jpg",
    videoTitle: "Step 03 — Coil Fold Mastery",
    videoDesc: "Key tactile demonstration: building delicate gluten tension without degassing.",
  },
  {
    num: 4,
    title: "Final Proof & Cast Iron Bake",
    time: "45 min",
    timestamp: "14:10",
    timerSeconds: 2700,
    instruction:
      "Turn into a preheated Dutch oven. Score across the center with a clean razor blade and cover for steam.",
    cue: "Ear expands dramatically in the first 10 minutes; crust blisters to deep golden amber.",
    image: "/images/braised-dish.jpg",
    videoTitle: "Step 04 — Steamed Oven Spring",
    videoDesc: "The final bake sequence showing blistering, oven rise, and the golden crust.",
  },
];

export function CookAlongShowcase() {
  const containerRef = useRef<HTMLElement>(null);
  const pinWrapperRef = useRef<HTMLDivElement>(null);

  const [activeStep, setActiveStep] = useState(1);
  const [timerRunning, setTimerRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(1800);

  React.useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // GSAP Scrubbed ScrollTrigger (Desktop only)
  useGSAP(
    () => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;

      if (prefersReduced || !isDesktop || !pinWrapperRef.current) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinWrapperRef.current,
          pin: true,
          scrub: 0.9,
          start: "top top",
          end: "+=2600",
          anticipatePin: 1,
        },
      });

      // =======================================================================
      // SCENE 1 -> SCENE 2 (Transition to Step 02)
      // =======================================================================
      tl.to(".ca-progress-fill", { width: "50%", duration: 0.5, ease: "none" })
        .to(".step-indicator-1", { backgroundColor: "#F2F2EB", color: "#525B56", duration: 0.3 }, "<")
        .to(".step-indicator-2", { backgroundColor: "#2E4742", color: "#F2F2EB", duration: 0.3 }, "<")
        // Slide 1 out, Slide 2 in
        .to(".step-slide-1", { opacity: 0, y: -20, duration: 0.4, ease: "power2.in" }, "<")
        .fromTo(
          ".step-slide-2",
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
          "<0.2"
        )
        // Image 1 out, Image 2 in
        .to(".demo-img-1", { opacity: 0, scale: 0.96, duration: 0.5, ease: "power2.inOut" }, "<")
        .fromTo(
          ".demo-img-2",
          { opacity: 0, scale: 1.05 },
          { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" },
          "<0.1"
        )
        // Details updates
        .to(".companion-details-1", { opacity: 0, y: -10, duration: 0.3 }, "<")
        .fromTo(".companion-details-2", { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4 }, "<0.1");

      // Hold Scene 2 for a beat
      tl.to({}, { duration: 0.5 });

      // =======================================================================
      // SCENE 2 -> SCENE 3 (Transition to Step 03 — Sensory Recognition Cue Highlight)
      // =======================================================================
      tl.to(".ca-progress-fill", { width: "75%", duration: 0.5, ease: "none" })
        .to(".step-indicator-2", { backgroundColor: "#F2F2EB", color: "#525B56", duration: 0.3 }, "<")
        .to(".step-indicator-3", { backgroundColor: "#2E4742", color: "#F2F2EB", duration: 0.3 }, "<")
        // Slide 2 out, Slide 3 in
        .to(".step-slide-2", { opacity: 0, y: -20, duration: 0.4, ease: "power2.in" }, "<")
        .fromTo(
          ".step-slide-3",
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
          "<0.2"
        )
        // Sensory Cue Glow Animation on Step 3
        .fromTo(
          ".sensory-highlight-box",
          { scale: 0.97, borderColor: "rgba(245, 183, 38, 0.3)" },
          {
            scale: 1.01,
            borderColor: "rgba(245, 183, 38, 0.9)",
            duration: 0.4,
            yoyo: true,
            repeat: 1,
            ease: "power2.out",
          },
          "<0.2"
        )
        // Image 2 out, Image 3 in
        .to(".demo-img-2", { opacity: 0, scale: 0.96, duration: 0.5, ease: "power2.inOut" }, "<")
        .fromTo(
          ".demo-img-3",
          { opacity: 0, scale: 1.05 },
          { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" },
          "<0.1"
        )
        .to(".companion-details-2", { opacity: 0, y: -10, duration: 0.3 }, "<")
        .fromTo(".companion-details-3", { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4 }, "<0.1");

      // Hold Scene 3 for a beat
      tl.to({}, { duration: 0.5 });

      // =======================================================================
      // SCENE 3 -> SCENE 4 (Transition to Step 04 — Finishing & Golden Crumb)
      // =======================================================================
      tl.to(".ca-progress-fill", { width: "100%", duration: 0.5, ease: "none" })
        .to(".step-indicator-3", { backgroundColor: "#F2F2EB", color: "#525B56", duration: 0.3 }, "<")
        .to(".step-indicator-4", { backgroundColor: "#2E4742", color: "#F2F2EB", duration: 0.3 }, "<")
        // Slide 3 out, Slide 4 in
        .to(".step-slide-3", { opacity: 0, y: -20, duration: 0.4, ease: "power2.in" }, "<")
        .fromTo(
          ".step-slide-4",
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
          "<0.2"
        )
        // Image 3 out, Image 4 in
        .to(".demo-img-3", { opacity: 0, scale: 0.96, duration: 0.5, ease: "power2.inOut" }, "<")
        .fromTo(
          ".demo-img-4",
          { opacity: 0, scale: 1.05 },
          { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" },
          "<0.1"
        )
        .to(".companion-details-3", { opacity: 0, y: -10, duration: 0.3 }, "<")
        .fromTo(".companion-details-4", { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4 }, "<0.1");

      // Final settling pause before release
      tl.to({}, { duration: 0.5 });
    },
    { scope: containerRef }
  );

  const currentManual = COOK_STEPS[activeStep - 1];

  return (
    <section
      ref={containerRef}
      id="cook-along"
      className="border-b border-[#DDDCD3] bg-[#F2F2EB] scroll-mt-20 overflow-hidden"
    >
      {/* Pinned Showcase Container for Desktop / Standard section for Mobile */}
      <div ref={pinWrapperRef} className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Section Header */}
          <div className="max-w-3xl space-y-3">
            <span className="font-mono text-xs uppercase tracking-widest text-[#2E4742] font-semibold bg-[#FAF9F5] px-3.5 py-1.5 rounded-full border border-[#DDDCD3] inline-block">
              [ 07 — HANDS-ON KITCHEN COMPANION ]
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#202723] tracking-tight leading-[1.02]">
              Don&apos;t just remember the recipe. Cook it.
            </h2>
            <p className="font-sans text-base sm:text-lg text-[#525B56] leading-relaxed">
              Designed for flour-dusted hands and bustling stoves. Scroll along with the
              reconstructed instructions, sensory recognition alerts, and real demonstration clips.
            </p>
          </div>

          {/* ================================================================= */}
          {/* DESKTOP PINNED SCROLL SHOWCASE (Synchronized scroll progression) */}
          {/* ================================================================= */}
          <div className="hidden lg:grid grid-cols-12 gap-8 items-stretch min-h-[580px]">
            {/* Left Console: Layered Step Walkthrough */}
            <div className="col-span-7 rounded-3xl bg-[#FAF9F5] border border-[#DDDCD3] p-8 flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden">
              <div className="space-y-6">
                {/* Step Selector Badges with Scroll Progress Bar */}
                <div className="space-y-3 border-b border-[#DDDCD3] pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {COOK_STEPS.map((st) => (
                        <div
                          key={st.num}
                          className={`step-indicator-${st.num} w-9 h-9 rounded-xl font-mono text-xs font-bold flex items-center justify-center transition-colors shadow-xs ${
                            st.num === 1
                              ? "bg-[#2E4742] text-[#F2F2EB]"
                              : "bg-[#F2F2EB] text-[#525B56]"
                          }`}
                        >
                          0{st.num}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-[#525B56]">
                      <Sparkles className="w-3.5 h-3.5 text-[#F5B726]" />
                      <span>Scroll to advance recipe</span>
                    </div>
                  </div>

                  {/* Scrubbed Progress Bar */}
                  <div className="h-1 w-full bg-[#DDDCD3]/40 rounded-full overflow-hidden">
                    <div className="ca-progress-fill h-full bg-[#2E4742] w-[25%]" />
                  </div>
                </div>

                {/* Layered Step Information Slides */}
                <div className="relative min-h-[280px]">
                  {COOK_STEPS.map((st) => (
                    <div
                      key={st.num}
                      className={`step-slide-${st.num} ${
                        st.num === 1 ? "relative opacity-100" : "absolute inset-0 opacity-0 pointer-events-none"
                      } space-y-4`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-[#2E4742] bg-[#E3E9E8] px-2.5 py-1 rounded-md">
                          Timestamp: {st.timestamp}
                        </span>
                        <span className="font-mono text-xs text-[#7A857F]">Rest: {st.time}</span>
                      </div>

                      <h3 className="font-display text-3xl font-bold text-[#202723]">
                        {st.title}
                      </h3>

                      <p className="font-sans text-base text-[#525B56] leading-relaxed">
                        {st.instruction}
                      </p>

                      {/* Sensory Recognition Cue with Glow on Step 3 */}
                      <div
                        className={`p-4 rounded-2xl bg-[#FEF8EC] border text-xs text-[#202723] space-y-1 transition-all ${
                          st.num === 3
                            ? "sensory-highlight-box border-[#F5B726] shadow-sm bg-[#FFF9ED]"
                            : "border-[#F5B726]/30"
                        }`}
                      >
                        <div className="flex items-center gap-2 text-xs font-mono text-[#2E4742] font-bold">
                          <Flame className="w-3.5 h-3.5 text-[#F5B726]" />
                          <span>SENSORY RECOGNITION CUE</span>
                        </div>
                        <p className="font-sans text-xs text-[#202723] italic leading-relaxed">
                          &ldquo;{st.cue}&rdquo;
                        </p>
                      </div>

                      {/* Tactile Timer Panel */}
                      <div className="p-3.5 rounded-2xl bg-[#F2F2EB] border border-[#DDDCD3] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#2E4742]/10 text-[#2E4742] flex items-center justify-center">
                            <Clock className="w-4 h-4 text-[#2E4742]" />
                          </div>
                          <div>
                            <p className="font-mono text-lg font-bold text-[#202723]">
                              {formatTimer(st.timerSeconds)}
                            </p>
                            <p className="font-mono text-[10px] text-[#525B56]">
                              Resting Duration
                            </p>
                          </div>
                        </div>

                        <span className="text-[11px] font-mono text-[#2E4742] bg-[#FAF9F5] px-2.5 py-1 rounded-md border border-[#DDDCD3]">
                          Auto-calibrated
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Console Footnote */}
              <div className="pt-4 border-t border-[#DDDCD3] flex items-center justify-between text-xs text-[#7A857F] font-mono">
                <span>Step timeline synced to scroll</span>
                <span className="text-[#2E4742] font-semibold">Bari Heritage Demo</span>
              </div>
            </div>

            {/* Right Column: Layered Synchronized Video Demonstration Frame */}
            <div className="col-span-5 rounded-3xl overflow-hidden border border-[#DDDCD3] bg-[#FAF9F5] flex flex-col shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              {/* Demonstration Media Stage */}
              <div className="relative aspect-4/3 w-full bg-[#202723] overflow-hidden">
                {COOK_STEPS.map((st) => (
                  <div
                    key={st.num}
                    className={`demo-img-${st.num} absolute inset-0 ${
                      st.num === 1 ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <Image
                      src={st.image}
                      alt={st.title}
                      fill
                      className="object-cover"
                      sizes="40vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  </div>
                ))}

                {/* Live Demonstration Badge */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E97B77] animate-pulse" />
                  <span className="font-mono text-xs text-white bg-black/50 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/10">
                    DEMONSTRATION ARCHIVE CLIP
                  </span>
                </div>

                {/* Timecode Overlay */}
                <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between text-white text-xs font-mono">
                  <span>Synced Recipe Stage</span>
                  <span className="text-[#F5B726]">Demonstration: Nonna Rosa</span>
                </div>
              </div>

              {/* Video Companion Details */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4 bg-[#FAF9F5] relative">
                <div className="relative min-h-[90px]">
                  {COOK_STEPS.map((st) => (
                    <div
                      key={st.num}
                      className={`companion-details-${st.num} ${
                        st.num === 1
                          ? "relative opacity-100"
                          : "absolute inset-0 opacity-0 pointer-events-none"
                      } space-y-1.5`}
                    >
                      <p className="font-mono text-xs uppercase tracking-wider text-[#2E4742] font-semibold">
                        {st.videoTitle}
                      </p>
                      <h4 className="font-display text-xl font-bold text-[#202723]">
                        Sunday Morning Focaccia Mastery
                      </h4>
                      <p className="font-sans text-xs text-[#525B56] leading-relaxed">
                        {st.videoDesc}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-[#DDDCD3] flex items-center justify-between">
                  <Link href="/dashboard">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
                    >
                      Try Interactive Cook Along
                    </Button>
                  </Link>
                  <span className="font-mono text-xs text-[#7A857F]">4 Key Stages</span>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================= */}
          {/* MOBILE RESPONSIVE EXPERIENCE (Tap-friendly, no forced scroll pin) */}
          {/* ================================================================= */}
          <div className="lg:hidden space-y-6">
            <div className="rounded-3xl bg-[#FAF9F5] border border-[#DDDCD3] p-5 sm:p-6 shadow-sm space-y-5">
              {/* Step Navigation Pill Buttons */}
              <div className="flex items-center justify-between border-b border-[#DDDCD3] pb-4">
                <div className="flex items-center gap-2">
                  {COOK_STEPS.map((st) => (
                    <button
                      key={st.num}
                      onClick={() => {
                        setActiveStep(st.num);
                        setSecondsLeft(st.timerSeconds);
                        setTimerRunning(false);
                      }}
                      className={`w-9 h-9 rounded-xl font-mono text-xs font-bold transition-all ${
                        activeStep === st.num
                          ? "bg-[#2E4742] text-[#F2F2EB] shadow-xs"
                          : "bg-[#F2F2EB] text-[#525B56]"
                      }`}
                    >
                      0{st.num}
                    </button>
                  ))}
                </div>
                <span className="text-xs font-mono text-[#525B56]">Step {activeStep} of 4</span>
              </div>

              {/* Active Step Content */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-[#2E4742] bg-[#E3E9E8] px-2.5 py-1 rounded-md">
                    Timestamp: {currentManual.timestamp}
                  </span>
                  <span className="font-mono text-xs text-[#7A857F]">Rest: {currentManual.time}</span>
                </div>

                <h3 className="font-display text-2xl font-bold text-[#202723]">
                  {currentManual.title}
                </h3>

                <p className="font-sans text-sm text-[#525B56] leading-relaxed">
                  {currentManual.instruction}
                </p>
              </div>

              {/* Sensory Recognition Cue Callout Box */}
              <div className="p-4 rounded-2xl bg-[#FEF8EC] border border-[#F5B726]/40 space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono text-[#2E4742] font-bold">
                  <Flame className="w-3.5 h-3.5 text-[#F5B726]" />
                  <span>SENSORY RECOGNITION CUE</span>
                </div>
                <p className="font-sans text-xs text-[#202723] italic leading-relaxed">
                  &ldquo;{currentManual.cue}&rdquo;
                </p>
              </div>

              {/* Tactile Timer Panel on Mobile */}
              <div className="p-3.5 rounded-2xl bg-[#F2F2EB] border border-[#DDDCD3] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#2E4742]/10 text-[#2E4742] flex items-center justify-center">
                    <Clock className="w-4 h-4 text-[#2E4742]" />
                  </div>
                  <div>
                    <p className="font-mono text-base font-bold text-[#202723]">
                      {formatTimer(secondsLeft)}
                    </p>
                    <p className="font-mono text-[10px] text-[#525B56]">Step Resting Timer</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTimerRunning(!timerRunning)}
                    className="px-3 py-1.5 rounded-xl bg-[#2E4742] text-[#F2F2EB] text-xs font-mono font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    {timerRunning ? (
                      <>
                        <Pause className="w-3.5 h-3.5" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" /> Start
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTimerRunning(false);
                      setSecondsLeft(currentManual.timerSeconds);
                    }}
                    className="p-1.5 rounded-xl bg-[#FAF9F5] border border-[#DDDCD3] text-[#525B56]"
                    aria-label="Reset timer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Demonstration Media Preview */}
              <div className="relative aspect-16/10 w-full rounded-2xl overflow-hidden bg-black">
                <Image
                  src={currentManual.image}
                  alt={currentManual.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="font-mono text-[10px] text-white bg-black/60 px-2.5 py-0.5 rounded-full">
                    DEMO STAGE 0{currentManual.num}
                  </span>
                </div>
              </div>

              {/* Manual Step Switch Buttons */}
              <div className="flex items-center justify-between border-t border-[#DDDCD3] pt-4">
                <button
                  disabled={activeStep === 1}
                  onClick={() => {
                    const next = Math.max(1, activeStep - 1);
                    setActiveStep(next);
                    setSecondsLeft(COOK_STEPS[next - 1].timerSeconds);
                  }}
                  className="flex items-center gap-1.5 text-xs font-mono text-[#525B56] hover:text-[#202723] disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <button
                  disabled={activeStep === COOK_STEPS.length}
                  onClick={() => {
                    const next = Math.min(COOK_STEPS.length, activeStep + 1);
                    setActiveStep(next);
                    setSecondsLeft(COOK_STEPS[next - 1].timerSeconds);
                  }}
                  className="flex items-center gap-1.5 text-xs font-mono text-[#2E4742] font-bold hover:text-[#202723] disabled:opacity-40"
                >
                  Next Step <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
