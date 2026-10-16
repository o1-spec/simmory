"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function CookAlongShowcase() {
  const [activeStep, setActiveStep] = useState(3);
  const [timerRunning, setTimerRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(1200); // 20:00

  const steps = [
    {
      num: 1,
      title: "Autolyse Flour & Water",
      time: "30 min",
      timestamp: "02:15",
      instruction: "Mix flour and water into a rough shaggy dough. Let rest covered with a damp tea towel.",
      cue: "Flour will fully hydrate; no dry clumps remain.",
    },
    {
      num: 2,
      title: "Incorporate Starter & Salt",
      time: "10 min",
      timestamp: "05:40",
      instruction: "Dimple the bubbly active starter into the dough. Pinch and fold until silky.",
      cue: "Dough changes from lumpy to smooth satin surface.",
    },
    {
      num: 3,
      title: "Coil Folds & Surface Tension",
      time: "20 min",
      timestamp: "08:45",
      instruction: "With wet hands, lift the center of the dough and tuck ends under. Rotate 90 degrees and repeat.",
      cue: "Look for translucent bubbles doming beneath the skin.",
    },
    {
      num: 4,
      title: "Final Proof & Oven Bake",
      time: "45 min",
      timestamp: "14:10",
      instruction: "Turn into hot cast iron Dutch oven. Score across the center with a sharp razor blade.",
      cue: "Ear expands dramatically in first 10 minutes of steam.",
    },
  ];

  const current = steps[activeStep - 1] || steps[2];

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <section id="cook-along" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 border-b border-[#DDDCD3] bg-[#F2F2EB] scroll-mt-20">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="max-w-3xl space-y-3">
          <span className="font-mono text-xs uppercase tracking-widest text-[#2E4742] font-semibold bg-[#FAF9F5] px-3.5 py-1.5 rounded-full border border-[#DDDCD3] inline-block">
            [ 07 — HANDS-ON KITCHEN COMPANION ]
          </span>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#202723] tracking-tight leading-[1.02]">
            Don&apos;t just remember the recipe. Cook it.
          </h2>
          <p className="font-sans text-base sm:text-lg text-[#525B56] leading-relaxed">
            Designed for flour-dusted hands and bustling stoves. Follow along with the original
            video clip, hands-free timer, ingredient checkoffs, and real-time sensory alerts.
          </p>
        </div>

        {/* Interactive Cook-Along Console */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Interactive Step Walkthrough */}
          <div className="lg:col-span-7 rounded-3xl bg-[#FAF9F5] border border-[#DDDCD3] p-6 sm:p-8 flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-6">
            <div className="space-y-6">
              {/* Step Selector Badges */}
              <div className="flex items-center justify-between border-b border-[#DDDCD3] pb-4">
                <div className="flex items-center gap-2">
                  {steps.map((st) => (
                    <button
                      key={st.num}
                      onClick={() => setActiveStep(st.num)}
                      className={`w-9 h-9 rounded-xl font-mono text-xs font-bold transition-all ${
                        activeStep === st.num
                          ? "bg-[#2E4742] text-[#F2F2EB] shadow-xs"
                          : "bg-[#F2F2EB] text-[#525B56] hover:bg-[#DDDCD3]"
                      }`}
                    >
                      0{st.num}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-[#525B56]">
                  <span>Step {current.num} of 4</span>
                </div>
              </div>

              {/* Current Step Content */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-[#2E4742] bg-[#E3E9E8] px-2.5 py-1 rounded-md">
                    Timestamp: {current.timestamp}
                  </span>
                  <span className="font-mono text-xs text-[#7A857F]">Rest: {current.time}</span>
                </div>

                <h3 className="font-display text-3xl font-bold text-[#202723]">
                  {current.title}
                </h3>

                <p className="font-sans text-base text-[#525B56] leading-relaxed">
                  {current.instruction}
                </p>
              </div>

              {/* Sensory Cue Callout Box */}
              <div className="p-4 rounded-2xl bg-[#FEF8EC] border border-[#F5B726]/30 space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono text-[#2E4742] font-bold">
                  <Flame className="w-3.5 h-3.5 text-[#F5B726]" />
                  <span>SENSORY RECOGNITION CUE</span>
                </div>
                <p className="font-sans text-xs text-[#202723] italic leading-relaxed">
                  &ldquo;{current.cue}&rdquo;
                </p>
              </div>

              {/* Tactile Timer Panel */}
              <div className="p-4 rounded-2xl bg-[#F2F2EB] border border-[#DDDCD3] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2E4742]/10 text-[#2E4742] flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[#2E4742]" />
                  </div>
                  <div>
                    <p className="font-mono text-xl font-bold text-[#202723]">
                      {formatTimer(secondsLeft)}
                    </p>
                    <p className="font-mono text-[11px] text-[#525B56]">Step Resting Timer</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTimerRunning(!timerRunning)}
                    className="px-4 py-2 rounded-xl bg-[#2E4742] text-[#F2F2EB] text-xs font-mono font-bold flex items-center gap-1.5 shadow-xs hover:bg-[#233733] transition-colors"
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
                    onClick={() => {
                      setTimerRunning(false);
                      setSecondsLeft(1200);
                    }}
                    className="p-2 rounded-xl bg-[#FAF9F5] border border-[#DDDCD3] text-[#525B56] hover:text-[#202723] transition-colors"
                    aria-label="Reset timer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Step Navigation Controls */}
            <div className="flex items-center justify-between border-t border-[#DDDCD3] pt-4">
              <button
                disabled={activeStep === 1}
                onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
                className="flex items-center gap-1.5 text-xs font-mono text-[#525B56] hover:text-[#202723] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" /> Previous Step
              </button>

              <button
                disabled={activeStep === steps.length}
                onClick={() => setActiveStep(Math.min(steps.length, activeStep + 1))}
                className="flex items-center gap-1.5 text-xs font-mono text-[#2E4742] font-bold hover:text-[#202723] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Synchronized Video Demonstration Frame */}
          <div className="lg:col-span-5 rounded-3xl overflow-hidden border border-[#DDDCD3] bg-[#FAF9F5] flex flex-col shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="relative aspect-4/3 w-full bg-black">
              <Image
                src="/images/cook-along-kitchen.jpg"
                alt="Cook Along kitchen view"
                fill
                className="object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

              {/* Floating Live Badge */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E97B77] animate-pulse" />
                <span className="font-mono text-xs text-white bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full">
                  SYNCED ARCHIVE CLIP
                </span>
              </div>

              {/* Timecode */}
              <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between text-white text-xs font-mono">
                <span>{current.timestamp} / 18:30</span>
                <span className="text-[#F5B726]">Demonstration: Nonna Rosa</span>
              </div>
            </div>

            {/* Video Companion Details */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4 bg-[#FAF9F5]">
              <div className="space-y-1.5">
                <p className="font-mono text-xs uppercase tracking-wider text-[#2E4742] font-semibold">
                  Original Cooking Demonstration
                </p>
                <h4 className="font-display text-xl font-bold text-[#202723]">
                  Sunday Morning Focaccia Mastery
                </h4>
                <p className="font-sans text-xs text-[#525B56] leading-relaxed">
                  Recorded in Bari, Italy. Every fold and touch recorded so anyone in the family can
                  reproduce the golden crumb.
                </p>
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
                <span className="font-mono text-xs text-[#7A857F]">7 Steps • 3 Cues</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
