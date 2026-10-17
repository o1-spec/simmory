"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChefHat, Heart, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function CinematicCta() {
  const containerRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const bgImageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top 80%",
          once: true,
        },
      });

      // Background visual entrance
      if (bgImageRef.current) {
        tl.fromTo(
          bgImageRef.current,
          { opacity: 0, scale: 1.12 },
          { opacity: 0.08, scale: 1.0, duration: 1.4, ease: "power2.out" }
        );
      }

      // Card container reveal
      tl.fromTo(
        cardRef.current,
        { opacity: 0.8, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
        "<"
      )
        // Label badge
        .fromTo(
          ".cta-badge",
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
          "-=0.5"
        )
        // Headline lines
        .fromTo(
          ".cta-heading-1",
          { opacity: 0, yPercent: 60 },
          { opacity: 1, yPercent: 0, duration: 0.7, ease: "power3.out" },
          "-=0.3"
        )
        .fromTo(
          ".cta-heading-2",
          { opacity: 0, yPercent: 60 },
          { opacity: 1, yPercent: 0, duration: 0.7, ease: "power3.out" },
          "-=0.5"
        )
        // Supporting paragraph
        .fromTo(
          ".cta-desc",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
          "-=0.4"
        )
        // Action buttons
        .fromTo(
          ".cta-btn",
          { opacity: 0, y: 15, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.12, ease: "back.out(1.2)" },
          "-=0.3"
        )
        // Archival value items
        .fromTo(
          ".cta-value-item",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" },
          "-=0.2"
        );
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="relative py-24 lg:py-32 px-4 sm:px-6 lg:px-8 bg-[#F2F2EB] overflow-hidden"
    >
      <div className="max-w-6xl mx-auto relative">
        <div
          ref={cardRef}
          className="relative rounded-3xl overflow-hidden border border-[#DDDCD3] bg-[#FAF9F5] shadow-[0_16px_50px_rgba(46,71,66,0.08)] p-8 sm:p-14 lg:p-20 text-center space-y-8"
        >
          {/* Subtle background food atmosphere */}
          <div
            ref={bgImageRef}
            className="absolute inset-0 pointer-events-none opacity-0"
          >
            <Image
              src="/images/braised-dish.jpg"
              alt="Culinary background texture"
              fill
              className="object-cover"
            />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            <span className="cta-badge font-mono text-xs uppercase tracking-widest text-[#2E4742] font-semibold bg-[#E3E9E8] px-3.5 py-1.5 rounded-full border border-[#2E4742]/20 inline-block">
              [ THE INVITATION ]
            </span>

            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#202723] tracking-tight leading-[1.02] overflow-hidden">
              <span className="cta-heading-1 block">
                Keep the recipe.
              </span>
              <span className="cta-heading-2 block text-[#2E4742]">
                Keep the memory.
              </span>
            </h2>

            <p className="cta-desc font-sans text-base sm:text-xl text-[#525B56] leading-relaxed max-w-2xl mx-auto">
              Give the recipes, voices, and little cooking traditions worth keeping a private home.
              Start preserving with the family members who taught you everything.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <div className="cta-btn w-full sm:w-auto">
              <Link href="/register" className="block w-full">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto text-base px-9 py-4 shadow-sm"
                  rightIcon={<ArrowUpRight className="w-4 h-4" />}
                >
                  Create Your Family Kitchen
                </Button>
              </Link>
            </div>
            <div className="cta-btn w-full sm:w-auto">
              <Link href="/login" className="block w-full">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto text-base px-7 py-4"
                >
                  Sign In to Kitchen
                </Button>
              </Link>
            </div>
          </div>

          {/* Archival Values */}
          <div className="relative z-10 pt-8 border-t border-[#DDDCD3]/60 flex flex-wrap items-center justify-center gap-y-3 gap-x-8 text-xs font-mono text-[#525B56]">
            <div className="cta-value-item flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 text-[#E97B77]" />
              <span>Private to Invited Family</span>
            </div>
            <div className="cta-value-item flex items-center gap-2">
              <ChefHat className="w-3.5 h-3.5 text-[#2E4742]" />
              <span>Grounded in Real Cooking Videos</span>
            </div>
            <div className="cta-value-item flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#F5B726]" />
              <span>No Public Recipe Scraping</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
