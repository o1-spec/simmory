"use client";

import React, { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Play, ChefHat, Flame, Clock, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export function CinematicHero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) return;

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".hero-badge", {
        opacity: 0,
        y: -12,
        duration: 0.6,
        delay: 0.1,
      })
        .from(
          ".hero-heading-line",
          {
            opacity: 0,
            y: 30,
            stagger: 0.12,
            duration: 0.8,
          },
          "-=0.4"
        )
        .from(
          ".hero-description",
          {
            opacity: 0,
            y: 16,
            duration: 0.7,
          },
          "-=0.5"
        )
        .from(
          ".hero-cta-group",
          {
            opacity: 0,
            y: 16,
            duration: 0.6,
          },
          "-=0.4"
        )
        .from(
          ".hero-main-card",
          {
            opacity: 0,
            scale: 0.94,
            y: 24,
            duration: 0.9,
          },
          "-=0.6"
        )
        .from(
          ".hero-floating-note",
          {
            opacity: 0,
            x: 20,
            rotate: 4,
            duration: 0.7,
          },
          "-=0.5"
        )
        .from(
          ".hero-pill-item",
          {
            opacity: 0,
            y: 16,
            stagger: 0.08,
            duration: 0.6,
          },
          "-=0.4"
        );
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="relative pt-8 pb-16 sm:pt-14 sm:pb-24 px-4 sm:px-6 lg:px-8 border-b border-[#DDDCD3] bg-[#F2F2EB] overflow-hidden"
    >
      {/* Subtle background tactile grid lines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.035] bg-[radial-gradient(#202723_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Top Eyebrow */}
        <div className="hero-badge flex items-center gap-3 mb-6">
          <span className="font-mono text-xs uppercase tracking-widest text-[#2E4742] font-semibold bg-[#FAF9F5] px-3.5 py-1.5 rounded-full border border-[#DDDCD3] shadow-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F5B726] animate-pulse" />
            Simmory — The Family Culinary Archive
          </span>
          <span className="h-px flex-1 bg-[#DDDCD3] hidden sm:block" />
        </div>

        {/* Hero Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Bold Condensed Headline & Editorial Copy */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[5.4rem] font-extrabold text-[#202723] tracking-tight leading-[0.96]">
              <span className="hero-heading-line block">Every recipe has</span>
              <span className="hero-heading-line block text-[#2E4742]">
                a story worth keeping.
              </span>
            </h1>

            <p className="hero-description text-lg sm:text-xl text-[#525B56] leading-relaxed max-w-2xl font-sans">
              Preserve the cooking moments, familiar voices, and little details that make family
              recipes impossible to replace. Simmory connects private cooking videos with verified
              instructions so traditional knowledge never disappears.
            </p>

            {/* CTAs */}
            <div className="hero-cta-group flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <Link href="/register">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto justify-center text-base px-8 py-3.5 shadow-sm"
                  rightIcon={<ArrowUpRight className="w-4 h-4" />}
                >
                  Start Your Family Kitchen
                </Button>
              </Link>
              <Link href="#story">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto justify-center text-base px-6 py-3.5"
                >
                  Discover Simmory
                </Button>
              </Link>
            </div>

            {/* Micro Trust & Culinary Values */}
            <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[#525B56] font-mono border-t border-[#DDDCD3]/70 pt-5">
              <div className="flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-[#E97B77]" />
                <span>100% Private Family Archives</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#2E4742]" />
                <span>Original Video Timestamps</span>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-[#F5B726]" />
                <span>Sensory Cues & Instincts</span>
              </div>
            </div>
          </div>

          {/* Right Column: Layered Food Photography with Tactile Note (Gusto / NutriNook style) */}
          <div className="lg:col-span-5 relative">
            {/* Main Featured Food Photograph */}
            <div className="hero-main-card relative rounded-3xl overflow-hidden border border-[#DDDCD3] shadow-[0_12px_40px_rgba(46,71,66,0.08)] bg-[#FAF9F5] group">
              <div className="relative aspect-4/3 w-full overflow-hidden">
                <Image
                  src="/images/jollof-pot.jpg"
                  alt="Authentic party jollof rice simmering in a seasoned cast iron pot with aromatic steam"
                  fill
                  priority
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 42vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

                {/* Video Play Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <div className="w-12 h-12 rounded-full bg-[#FAF9F5]/90 backdrop-blur-md text-[#2E4742] flex items-center justify-center shadow-md transition-transform duration-350 hover:scale-110">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>

                {/* Cultural Heritage Tag */}
                <div className="absolute bottom-4 left-4 z-10">
                  <span className="font-mono text-[11px] uppercase tracking-wider bg-[#2E4742] text-[#F2F2EB] px-3 py-1 rounded-full font-semibold">
                    Mama&apos;s Sunday Kitchen
                  </span>
                </div>
              </div>

              {/* Bottom Editorial Caption */}
              <div className="p-4 sm:p-5 bg-[#FAF9F5] border-t border-[#DDDCD3] space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] text-[#2E4742] font-semibold">
                    HERITAGE RECORDING • 24 MIN
                  </span>
                  <span className="font-mono text-[11px] text-[#7A857F]">Timestamp: 16:40</span>
                </div>
                <p className="font-display text-lg font-bold text-[#202723]">
                  Smoky Firewood Jollof Rice
                </p>
                <p className="text-xs text-[#525B56] italic">
                  &ldquo;Listen for the crackle beneath the lid. That is where the smoke lives.&rdquo;
                </p>
              </div>
            </div>

            {/* Overlapping Floating Recipe Note (Tactile Paper Style) */}
            <div className="hero-floating-note hidden sm:block absolute -bottom-6 -left-6 z-20 max-w-[260px] p-4 bg-[#FAF9F5] rounded-2xl border border-[#DDDCD3] shadow-[0_8px_25px_rgba(0,0,0,0.08)] transform -rotate-2">
              <div className="flex items-center gap-2 mb-1.5">
                <ChefHat className="w-3.5 h-3.5 text-[#2E4742]" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#2E4742] font-bold">
                  Sensory Note
                </span>
              </div>
              <p className="text-xs text-[#202723] font-medium leading-snug">
                &ldquo;Never stir with a metal spoon once the steam is sealed. Let the rice breathe.&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* NutriNook-Inspired Wide Culinary Pill Gallery */}
        <div className="mt-14 pt-8 border-t border-[#DDDCD3]">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-xs text-[#525B56] uppercase tracking-wider">
              Recent Heirloom Preservations
            </span>
            <span className="text-xs text-[#2E4742] font-medium hidden sm:block">
              Recorded by families worldwide
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* Pill 1 */}
            <div className="hero-pill-item p-3 sm:p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#DDDCD3] flex items-center gap-3 hover:border-[#2E4742]/40 transition-all hover:-translate-y-0.5">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
                <Image
                  src="/images/jollof-pot.jpg"
                  alt="Jollof rice"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="font-display text-sm font-bold text-[#202723] truncate">
                  Smoky Jollof
                </p>
                <p className="text-[11px] text-[#525B56] truncate">Mama&apos;s Recipe • Lagos</p>
              </div>
            </div>

            {/* Pill 2 */}
            <div className="hero-pill-item p-3 sm:p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#DDDCD3] flex items-center gap-3 hover:border-[#2E4742]/40 transition-all hover:-translate-y-0.5">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
                <Image
                  src="/images/hero-cooking-hands.jpg"
                  alt="Sourdough focaccia"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="font-display text-sm font-bold text-[#202723] truncate">
                  Sunday Focaccia
                </p>
                <p className="text-[11px] text-[#525B56] truncate">Nonna Rosa • Puglia</p>
              </div>
            </div>

            {/* Pill 3 */}
            <div className="hero-pill-item p-3 sm:p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#DDDCD3] flex items-center gap-3 hover:border-[#2E4742]/40 transition-all hover:-translate-y-0.5">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
                <Image
                  src="/images/spices-mortar.jpg"
                  alt="Crushed spices"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="font-display text-sm font-bold text-[#202723] truncate">
                  Stone-Ground Masala
                </p>
                <p className="text-[11px] text-[#525B56] truncate">Dadi&apos;s Blend • Delhi</p>
              </div>
            </div>

            {/* Pill 4 */}
            <div className="hero-pill-item p-3 sm:p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#DDDCD3] flex items-center gap-3 hover:border-[#2E4742]/40 transition-all hover:-translate-y-0.5">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
                <Image
                  src="/images/braised-dish.jpg"
                  alt="Braised short ribs"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="font-display text-sm font-bold text-[#202723] truncate">
                  Braised Birria
                </p>
                <p className="text-[11px] text-[#525B56] truncate">Abuela Elena • Jalisco</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
