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
            y: 28,
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
          ".hero-trust-row",
          {
            opacity: 0,
            y: 12,
            duration: 0.5,
          },
          "-=0.3"
        )
        .from(
          ".hero-framed-visual",
          {
            opacity: 0,
            scale: 0.96,
            y: 28,
            duration: 0.9,
          },
          "-=0.4"
        )
        .from(
          ".hero-floating-note",
          {
            opacity: 0,
            y: 16,
            rotate: 2,
            duration: 0.6,
          },
          "-=0.4"
        )
        .from(
          ".hero-pill-item",
          {
            opacity: 0,
            y: 14,
            stagger: 0.08,
            duration: 0.6,
          },
          "-=0.3"
        );
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="relative pt-10 pb-20 sm:pt-16 sm:pb-28 px-4 sm:px-6 lg:px-8 border-b border-[#DDDCD3] bg-[#F2F2EB] overflow-hidden"
    >
      {/* Subtle tactile grid lines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.035] bg-[radial-gradient(#202723_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* ========================================================================= */}
        {/* CENTERED EDITORIAL HERO CONTENT                                           */}
        {/* ========================================================================= */}
        <div className="text-center max-w-4xl mx-auto space-y-6 sm:space-y-8">
          {/* Top Eyebrow */}
          <div className="hero-badge flex items-center justify-center">
            <span className="font-mono text-xs uppercase tracking-widest text-[#2E4742] font-semibold bg-[#FAF9F5] px-4 py-1.5 rounded-full border border-[#DDDCD3] shadow-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F5B726] animate-pulse" />
              Simmory — The Family Culinary Archive
            </span>
          </div>

          {/* Centered Editorial Headline */}
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[5.4rem] font-extrabold text-[#202723] tracking-tight leading-[0.98]">
            <span className="hero-heading-line block">Every recipe has</span>
            <span className="hero-heading-line block text-[#2E4742]">
              a story worth keeping.
            </span>
          </h1>

          {/* Centered Description */}
          <p className="hero-description text-lg sm:text-xl text-[#525B56] leading-relaxed max-w-2xl mx-auto font-sans">
            Preserve the cooking moments, familiar voices, and little details that make family
            recipes impossible to replace. Simmory connects private cooking videos with verified
            instructions so traditional knowledge never disappears.
          </p>

          {/* Centered CTA Row */}
          <div className="hero-cta-group flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
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

          {/* Centered Trust / Value Row */}
          <div className="hero-trust-row pt-2 flex flex-wrap items-center justify-center gap-y-2 gap-x-8 text-xs text-[#525B56] font-mono border-t border-[#DDDCD3]/70 pt-5">
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
              <span>Sensory Cues &amp; Instincts</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SUPPORTING FRAMED CULINARY VISUAL (OPTION C — COOKBOOK PRODUCT SHOWCASE)   */}
        {/* ========================================================================= */}
        <div className="mt-14 sm:mt-18 max-w-4xl mx-auto relative">
          <div className="hero-framed-visual relative rounded-3xl overflow-hidden border border-[#DDDCD3] shadow-[0_16px_50px_rgba(46,71,66,0.08)] bg-[#FAF9F5] group">
            {/* 16:9 Cinematic Crop */}
            <div className="relative aspect-16/9 sm:aspect-21/10 w-full overflow-hidden">
              <Image
                src="/images/jollof-pot.jpg"
                alt="Authentic party jollof rice simmering in a seasoned cast iron pot with aromatic steam"
                fill
                priority
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 85vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

              {/* Top Origin Tag & Video Badge */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-xs z-10">
                <span className="font-mono uppercase tracking-wider bg-[#2E4742] text-[#F2F2EB] px-3.5 py-1 rounded-full font-bold shadow-xs">
                  Mama&apos;s Sunday Kitchen • Lagos
                </span>
                <span className="font-mono text-white bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                  Archival Recording • 24 Min
                </span>
              </div>

              {/* Centered Play Button */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <Link
                  href="/dashboard"
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#FAF9F5]/90 backdrop-blur-md text-[#2E4742] flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-110"
                  aria-label="View demonstration"
                >
                  <Play className="w-6 h-6 fill-current ml-1" />
                </Link>
              </div>

              {/* Bottom Caption Overlay */}
              <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-2 text-white">
                <div>
                  <p className="font-display text-xl sm:text-2xl font-bold leading-tight">
                    Smoky Firewood Party Jollof Rice
                  </p>
                  <p className="text-xs text-white/80 font-sans">
                    Timestamp 16:40 — &ldquo;Listen for the crackle beneath the lid. That is where the smoke lives.&rdquo;
                  </p>
                </div>
                <span className="font-mono text-[11px] bg-[#F5B726] text-[#202723] px-3 py-1 rounded-full font-bold shrink-0 self-start sm:self-auto">
                  Cook Verified
                </span>
              </div>
            </div>

            {/* Editorial Footer Strip */}
            <div className="p-4 sm:p-5 bg-[#FAF9F5] border-t border-[#DDDCD3] flex flex-wrap items-center justify-between gap-3 text-xs text-[#525B56]">
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-[#2E4742]" />
                <span className="font-semibold text-[#202723]">Technique: The Foil Steam Seal</span>
              </div>
              <span className="font-mono text-[11px] text-[#7A857F]">
                Preserved in Adebayo Family Archive • 8 Contributors
              </span>
            </div>
          </div>

          {/* Overlapping Floating Recipe Note Badge */}
          <div className="hero-floating-note hidden md:block absolute -bottom-5 -left-6 z-20 max-w-[280px] p-4 bg-[#FAF9F5] rounded-2xl border border-[#DDDCD3] shadow-[0_10px_30px_rgba(0,0,0,0.08)] transform -rotate-1">
            <div className="flex items-center gap-2 mb-1.5 text-xs font-mono text-[#2E4742] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#F5B726]" />
              <span>Sensory Instinct</span>
            </div>
            <p className="text-xs text-[#202723] font-medium leading-relaxed">
              &ldquo;Never stir with a metal spoon once the steam is sealed. Let the rice breathe.&rdquo;
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* NUTRINOOK-INSPIRED SUPPORTING CULINARY PILL ROW                           */}
        {/* ========================================================================= */}
        <div className="mt-14 sm:mt-18 pt-8 border-t border-[#DDDCD3]">
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
