"use client";

import React, { useRef } from "react";
import Image from "next/image";
import {
  Play,
  CheckCircle2,
  Clock,
  HelpCircle,
  Flame,
  ChefHat,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function VideoToRecipeScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinWrapperRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;

      if (prefersReduced || !isDesktop || !pinWrapperRef.current) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinWrapperRef.current,
          pin: true,
          scrub: 0.8,
          start: "top top",
          end: "+=2200",
          anticipatePin: 1,
        },
      });

      // Scene A -> Scene B: Video shifts left, timeline pins reveal
      tl.to(".scene-a-header", { opacity: 0, y: -20, duration: 0.4 })
        .to(".scene-b-header", { opacity: 1, y: 0, duration: 0.4 }, "<0.2")
        .to(
          ".video-stage-container",
          {
            scale: 0.95,
            duration: 0.6,
            ease: "power2.inOut",
          },
          "<"
        )
        .fromTo(
          ".scene-b-annotations",
          { opacity: 0, x: 40 },
          { opacity: 1, x: 0, duration: 0.6, stagger: 0.15 },
          "<0.2"
        );

      // Scene B -> Scene C: Clarification emerges
      tl.to(".scene-b-header", { opacity: 0, y: -20, duration: 0.4 })
        .to(".scene-c-header", { opacity: 1, y: 0, duration: 0.4 }, "<0.2")
        .to(".scene-b-annotations", { opacity: 0, x: -30, duration: 0.4 }, "<")
        .fromTo(
          ".scene-c-dialog",
          { opacity: 0, scale: 0.9, y: 30 },
          { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: "back.out(1.2)" },
          "<0.1"
        );

      // Scene C -> Scene D: Transform into complete verified recipe
      tl.to(".scene-c-header", { opacity: 0, y: -20, duration: 0.4 })
        .to(".scene-d-header", { opacity: 1, y: 0, duration: 0.4 }, "<0.2")
        .to(".scene-c-dialog", { opacity: 0, scale: 0.95, duration: 0.4 }, "<")
        .to(
          ".video-stage-container",
          {
            width: "38%",
            duration: 0.8,
            ease: "power3.inOut",
          },
          "<0.1"
        )
        .fromTo(
          ".scene-d-recipe-card",
          { opacity: 0, x: 50, scale: 0.96 },
          { opacity: 1, x: 0, scale: 1, duration: 0.8, ease: "power3.out" },
          "<0.2"
        );

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    },
    { scope: containerRef }
  );

  return (
    <section id="how-it-works" ref={containerRef} className="relative bg-[#FAF9F5] border-b border-[#DDDCD3] scroll-mt-20">
      {/* Desktop Pinned Scroll Container */}
      <div ref={pinWrapperRef} className="hidden lg:flex flex-col justify-center min-h-screen py-16 px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Dynamic Header State */}
        <div className="relative h-20 mb-8">
          {/* Scene A Header */}
          <div className="scene-a-header absolute inset-0 space-y-1">
            <span className="font-mono text-xs uppercase tracking-widest text-[#2E4742] font-semibold bg-[#E3E9E8] px-3.5 py-1 rounded-full border border-[#2E4742]/20">
              [ SCENE A — ORIGINAL CAPTURE ]
            </span>
            <h2 className="font-display text-4xl font-extrabold text-[#202723]">
              It starts with a moment worth keeping.
            </h2>
          </div>

          {/* Scene B Header */}
          <div className="scene-b-header absolute inset-0 space-y-1 opacity-0">
            <span className="font-mono text-xs uppercase tracking-widest text-[#2E4742] font-semibold bg-[#E3E9E8] px-3.5 py-1 rounded-full border border-[#2E4742]/20">
              [ SCENE B — EXTRACTING DETAILS ]
            </span>
            <h2 className="font-display text-4xl font-extrabold text-[#202723]">
              Every little detail matters.
            </h2>
          </div>

          {/* Scene C Header */}
          <div className="scene-c-header absolute inset-0 space-y-1 opacity-0">
            <span className="font-mono text-xs uppercase tracking-widest text-[#2E4742] font-semibold bg-[#E3E9E8] px-3.5 py-1 rounded-full border border-[#2E4742]/20">
              [ SCENE C — COOK CLARIFICATION ]
            </span>
            <h2 className="font-display text-4xl font-extrabold text-[#202723]">
              Some things only the cook can explain.
            </h2>
          </div>

          {/* Scene D Header */}
          <div className="scene-d-header absolute inset-0 space-y-1 opacity-0">
            <span className="font-mono text-xs uppercase tracking-widest text-[#2E4742] font-semibold bg-[#E3E9E8] px-3.5 py-1 rounded-full border border-[#2E4742]/20">
              [ SCENE D — THE PRESERVED HEIRLOOM ]
            </span>
            <h2 className="font-display text-4xl font-extrabold text-[#202723]">
              And now, the way they made it can live on.
            </h2>
          </div>
        </div>

        {/* Interactive Transformation Stage */}
        <div className="relative flex items-center justify-between gap-8 h-[540px]">
          {/* Main Video Viewport Element */}
          <div className="video-stage-container relative w-full lg:w-[62%] h-full rounded-3xl overflow-hidden border border-[#DDDCD3] shadow-[0_16px_50px_rgba(0,0,0,0.08)] bg-[#202723] shrink-0 transition-all duration-300">
            <Image
              src="/images/jollof-pot.jpg"
              alt="Authentic party jollof video frame"
              fill
              className="object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

            {/* Video Player UI Header */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-10">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E97B77] animate-pulse" />
                <span className="font-mono text-xs tracking-wider">RECORDED IN LAGOS KITCHEN</span>
              </div>
              <span className="font-mono text-xs bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                1080p • 24 FPS
              </span>
            </div>

            {/* Center Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-[#F2F2EB]/90 backdrop-blur-md text-[#2E4742] flex items-center justify-center shadow-lg">
                <Play className="w-6 h-6 fill-current ml-1" />
              </div>
            </div>

            {/* Scrubber & Timeline Cues */}
            <div className="absolute bottom-4 left-4 right-4 z-10 space-y-2">
              <div className="flex items-center justify-between text-white text-xs font-mono">
                <span>04:18 / 24:30</span>
                <span className="text-[#F5B726]">Timestamp: 16:40 &ldquo;The Steam Seal&rdquo;</span>
              </div>
              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden relative">
                <div className="w-[68%] h-full bg-[#F5B726] rounded-full" />
              </div>
            </div>
          </div>

          {/* Scene B Annotations (Side Panel) */}
          <div className="scene-b-annotations absolute right-0 top-0 bottom-0 w-[34%] flex flex-col justify-center space-y-4 pointer-events-none opacity-0">
            <div className="p-4 rounded-2xl bg-[#F2F2EB] border border-[#DDDCD3] shadow-sm space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono text-[#2E4742]">
                <Clock className="w-3.5 h-3.5 text-[#2E4742]" />
                <span className="font-bold">04:12 — BASE REDUCTION</span>
              </div>
              <p className="text-sm font-display font-bold text-[#202723]">
                Tomatoes, bell peppers, and scotch bonnets roasted and blended coarse.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F2F2EB] border border-[#DDDCD3] shadow-sm space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono text-[#2E4742]">
                <Flame className="w-3.5 h-3.5 text-[#F5B726]" />
                <span className="font-bold">11:45 — SENSORY DETECTION</span>
              </div>
              <p className="text-sm font-display font-bold text-[#202723]">
                Sauce thickens until spoon leaves a track on bottom of pot.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F2F2EB] border border-[#DDDCD3] shadow-sm space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono text-[#2E4742]">
                <ChefHat className="w-3.5 h-3.5 text-[#8BB2DE]" />
                <span className="font-bold">16:40 — SEAL TECHNIQUE</span>
              </div>
              <p className="text-sm font-display font-bold text-[#202723]">
                Lid sealed with foil to trap steam; flame dropped to lowest ember.
              </p>
            </div>
          </div>

          {/* Scene C Human Clarification Dialog */}
          <div className="scene-c-dialog absolute right-0 top-6 bottom-6 w-[35%] p-6 rounded-3xl bg-[#F2F2EB] border border-[#DDDCD3] shadow-lg flex flex-col justify-between pointer-events-none opacity-0">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono text-[#2E4742]">
                <HelpCircle className="w-4 h-4 text-[#F5B726]" />
                <span className="font-bold uppercase tracking-wider">Simmory Verification</span>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#DDDCD3]">
                <p className="text-xs text-[#7A857F] font-mono mb-1">PROMPT FOR THE COOK</p>
                <p className="font-display text-base font-bold text-[#202723]">
                  &ldquo;At 08:30, what dried seafood was added to the stock reduction?&rdquo;
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#2E4742] text-[#F2F2EB] space-y-1">
                <div className="flex items-center gap-2 text-[11px] font-mono text-[#F5B726]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ANSWERED BY MAMA ROSA</span>
                </div>
                <p className="text-sm font-sans leading-relaxed">
                  &ldquo;Ground crayfish first for natural sweetness, then debone dried catfish once the stock begins boiling.&rdquo;
                </p>
              </div>
            </div>

            <p className="text-[11px] text-[#525B56] font-mono italic">
              Human-verified accuracy. No AI guesswork in family cooking.
            </p>
          </div>

          {/* Scene D Complete Heirloom Recipe Card */}
          <div className="scene-d-recipe-card absolute right-0 top-0 bottom-0 w-[58%] p-6 rounded-3xl bg-[#F2F2EB] border border-[#DDDCD3] shadow-xl flex flex-col justify-between overflow-y-auto no-scrollbar pointer-events-none opacity-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#DDDCD3] pb-3">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#2E4742] font-bold">
                    PRESERVED HEIRLOOM RECIPE
                  </span>
                  <h3 className="font-display text-2xl font-bold text-[#202723]">
                    Mama Rosa&apos;s Smoky Party Jollof
                  </h3>
                </div>
                <span className="font-mono text-xs bg-[#E3E9E8] text-[#2E4742] px-3 py-1 rounded-full font-bold">
                  Verified by Cook
                </span>
              </div>

              {/* Ingredients Pill Row */}
              <div className="space-y-1.5">
                <span className="font-mono text-[11px] uppercase text-[#7A857F]">Key Ingredients</span>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2.5 py-1 bg-[#FAF9F5] rounded-lg border border-[#DDDCD3] text-[#202723]">
                    4 cups Golden Sella Rice
                  </span>
                  <span className="text-xs px-2.5 py-1 bg-[#FAF9F5] rounded-lg border border-[#DDDCD3] text-[#202723]">
                    6 Red Bell Peppers &amp; 3 Scotch Bonnets
                  </span>
                  <span className="text-xs px-2.5 py-1 bg-[#FAF9F5] rounded-lg border border-[#DDDCD3] text-[#202723]">
                    Ground Crayfish &amp; Dried Catfish
                  </span>
                  <span className="text-xs px-2.5 py-1 bg-[#FAF9F5] rounded-lg border border-[#DDDCD3] text-[#202723]">
                    Fresh Thyme &amp; Bay Leaves
                  </span>
                </div>
              </div>

              {/* Step 3 Callout with Sensory Cue */}
              <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#DDDCD3] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#2E4742] font-bold">STEP 03 • THE STEAM TRAP</span>
                  <span className="text-[#F5B726] font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Timestamp 16:40
                  </span>
                </div>
                <p className="text-xs text-[#202723] leading-relaxed">
                  Cover the pot tightly with foil before putting on the lid. Reduce flame to lowest ember.
                  Do not lift the lid for 25 minutes. Listen for the subtle crackle.
                </p>
                <div className="p-2.5 rounded-xl bg-[#FEF8EC] border border-[#F5B726]/30 text-xs text-[#202723] flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#F5B726] shrink-0" />
                  <span className="font-medium italic">
                    Sensory Cue: Aroma shifts from raw tomato to sweet roasted pepper and campfire smoke.
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#DDDCD3] flex items-center justify-between text-xs text-[#525B56]">
              <span>Cook: Mama Rosa (Mother) • Lagos Kitchen</span>
              <span className="font-mono text-[#2E4742] font-semibold">Ready to Cook Along &rarr;</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Responsive Fallback (Clean Vertical Flow) */}
      <div className="lg:hidden py-16 px-4 sm:px-6 space-y-10 max-w-2xl mx-auto">
        <div className="space-y-3 text-center">
          <span className="font-mono text-xs uppercase tracking-widest text-[#2E4742] font-semibold bg-[#E3E9E8] px-3.5 py-1 rounded-full border border-[#2E4742]/20 inline-block">
            [ THE TRANSFORMATION ]
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#202723]">
            From raw cooking video to preserved family heirloom.
          </h2>
          <p className="font-sans text-sm text-[#525B56] leading-relaxed">
            Simmory turns family kitchen recordings into structured recipes with timestamps and human-verified sensory cues.
          </p>
        </div>

        {/* Mobile Step 1 */}
        <div className="rounded-2xl border border-[#DDDCD3] bg-[#FAF9F5] overflow-hidden p-5 space-y-4">
          <div className="relative aspect-16/9 rounded-xl overflow-hidden">
            <Image
              src="/images/jollof-pot.jpg"
              alt="Cooking footage"
              fill
              className="object-cover"
            />
          </div>
          <div className="space-y-1">
            <span className="font-mono text-xs text-[#2E4742] font-bold">01 / ORIGINAL VIDEO</span>
            <h3 className="font-display text-xl font-bold text-[#202723]">
              Record the real cooking moments
            </h3>
            <p className="text-xs text-[#525B56]">
              Film on any phone. Simmory extracts the key events without losing the authentic voice.
            </p>
          </div>
        </div>

        {/* Mobile Step 2 */}
        <div className="rounded-2xl border border-[#DDDCD3] bg-[#FAF9F5] p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-[#2E4742] font-bold">
            <HelpCircle className="w-4 h-4 text-[#F5B726]" />
            <span>02 / HUMAN CLARIFICATION</span>
          </div>
          <p className="font-display text-lg font-bold text-[#202723]">
            &ldquo;What dried seafood was added to the stock?&rdquo;
          </p>
          <p className="text-xs text-[#525B56]">
            Mama Rosa clarifies: Ground crayfish first, then dried catfish once the stock boils.
          </p>
        </div>

        {/* Mobile Step 3 */}
        <div className="rounded-2xl border border-[#DDDCD3] bg-[#FAF9F5] p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-[#2E4742] font-bold">
            <CheckCircle2 className="w-4 h-4 text-[#2E4742]" />
            <span>03 / THE HEIRLOOM RECIPE</span>
          </div>
          <h3 className="font-display text-xl font-bold text-[#202723]">
            Mama Rosa&apos;s Smoky Party Jollof
          </h3>
          <p className="text-xs text-[#525B56]">
            Preserved with ingredients, sensory cues, and exact video evidence timestamps.
          </p>
        </div>
      </div>
    </section>
  );
}
