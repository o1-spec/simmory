"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { Sparkles, Utensils, Flame, Compass } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function CookingMemory() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced || !containerRef.current) return;

      const items = gsap.utils.toArray<HTMLElement>(".memory-phrase-item");

      items.forEach((item) => {
        gsap.from(item, {
          opacity: 0,
          y: 28,
          scale: 0.95,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: item,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        });
      });

      // Subtle parallax on the central photo
      gsap.to(".memory-center-img", {
        yPercent: -6,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    },
    { scope: containerRef }
  );

  return (
    <section
      id="story"
      ref={containerRef}
      className="relative py-20 lg:py-32 px-4 sm:px-6 lg:px-8 border-b border-[#DDDCD3] bg-[#F2F2EB] overflow-hidden scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto space-y-16 lg:space-y-20">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="font-mono text-xs uppercase tracking-widest text-[#2E4742] font-semibold bg-[#FAF9F5] px-3.5 py-1.5 rounded-full border border-[#DDDCD3] inline-block">
            [ 03 — UNWRITTEN KNOWLEDGE ]
          </span>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#202723] tracking-tight leading-[1.02]">
            Not every recipe was written down.
          </h2>
          <p className="font-sans text-base sm:text-lg text-[#525B56] leading-relaxed">
            Ask how much spice to use, and they will tell you &ldquo;enough.&rdquo; Ask when to pull
            it off the heat, and they say &ldquo;when the kitchen smells like Sunday.&rdquo; Standard
            cards lose the muscle memory that makes the dish unforgettable.
          </p>
        </div>

        {/* Central Composition with Emergent Editorial Callouts */}
        <div className="relative max-w-5xl mx-auto">
          {/* Main Central Documentary Photograph */}
          <div className="relative rounded-3xl overflow-hidden border border-[#DDDCD3] shadow-[0_16px_50px_rgba(0,0,0,0.06)] bg-[#FAF9F5] z-10 max-w-3xl mx-auto">
            <div className="relative aspect-16/10 w-full overflow-hidden">
              <Image
                src="/images/spices-mortar.jpg"
                alt="Seasoned hands grinding traditional spices in a heavy granite mortar"
                fill
                className="memory-center-img object-cover"
                sizes="(max-width: 1024px) 100vw, 65vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-50" />
            </div>

            <div className="p-4 sm:p-5 bg-[#FAF9F5] border-t border-[#DDDCD3] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F5B726]" />
                <span className="font-mono uppercase tracking-wider text-[#2E4742] font-bold">
                  Documentary Memory
                </span>
                <span className="text-[#525B56]">• Live Kitchen Audio</span>
              </div>
              <span className="font-mono text-[#525B56]">Technique passed down since 1964</span>
            </div>
          </div>

          {/* Emergent Editorial Phrases Around the Visual */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mt-10 lg:mt-12">
            {/* Phrase 1 */}
            <div className="memory-phrase-item p-6 rounded-2xl bg-[#FAF9F5] border border-[#DDDCD3] space-y-2 hover:border-[#2E4742]/40 transition-colors shadow-xs">
              <div className="flex items-center gap-2 text-xs font-mono text-[#2E4742]">
                <Utensils className="w-3.5 h-3.5 text-[#F5B726]" />
                <span className="font-bold uppercase tracking-wider">Tactile Cue</span>
              </div>
              <p className="font-display text-2xl font-bold text-[#202723]">
                &ldquo;Add a little water until it loosens.&rdquo;
              </p>
              <p className="font-sans text-sm text-[#525B56] leading-relaxed">
                Never a measured cup. You felt the density in the wooden spoon when the batter turned
                glossy and poured like heavy cream.
              </p>
            </div>

            {/* Phrase 2 */}
            <div className="memory-phrase-item p-6 rounded-2xl bg-[#FAF9F5] border border-[#DDDCD3] space-y-2 hover:border-[#2E4742]/40 transition-colors shadow-xs">
              <div className="flex items-center gap-2 text-xs font-mono text-[#2E4742]">
                <Flame className="w-3.5 h-3.5 text-[#E97B77]" />
                <span className="font-bold uppercase tracking-wider">Visual Cue</span>
              </div>
              <p className="font-display text-2xl font-bold text-[#202723]">
                &ldquo;Stir until it feels right.&rdquo;
              </p>
              <p className="font-sans text-sm text-[#525B56] leading-relaxed">
                When the sauce leaves a clean track across the bottom of the pan and the oil begins
                to separate into glistening crimson beads.
              </p>
            </div>

            {/* Phrase 3 */}
            <div className="memory-phrase-item p-6 rounded-2xl bg-[#FAF9F5] border border-[#DDDCD3] space-y-2 hover:border-[#2E4742]/40 transition-colors shadow-xs">
              <div className="flex items-center gap-2 text-xs font-mono text-[#2E4742]">
                <Sparkles className="w-3.5 h-3.5 text-[#F5B726]" />
                <span className="font-bold uppercase tracking-wider">Aromatic Cue</span>
              </div>
              <p className="font-display text-2xl font-bold text-[#202723]">
                &ldquo;You&apos;ll know when it&apos;s ready.&rdquo;
              </p>
              <p className="font-sans text-sm text-[#525B56] leading-relaxed">
                The sharp acidity of the fresh ginger mellows into a deep, earthy warmth that draws
                everyone out of the living room.
              </p>
            </div>

            {/* Phrase 4 */}
            <div className="memory-phrase-item p-6 rounded-2xl bg-[#FAF9F5] border border-[#DDDCD3] space-y-2 hover:border-[#2E4742]/40 transition-colors shadow-xs">
              <div className="flex items-center gap-2 text-xs font-mono text-[#2E4742]">
                <Compass className="w-3.5 h-3.5 text-[#8BB2DE]" />
                <span className="font-bold uppercase tracking-wider">Instinctive Cue</span>
              </div>
              <p className="font-display text-2xl font-bold text-[#202723]">
                &ldquo;A generous pinch between three fingers.&rdquo;
              </p>
              <p className="font-sans text-sm text-[#525B56] leading-relaxed">
                No teaspoon in sight. An elder&apos;s hand calibrated by fifty years of cooking for
                the people they loved most.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
