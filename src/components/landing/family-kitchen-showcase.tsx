"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { Users, ChefHat } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function FamilyKitchenShowcase() {
  const containerRef = useRef<HTMLElement>(null);
  const photoFrameRef = useRef<HTMLDivElement>(null);
  const photoImageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) return;

      // =========================================================================
      // SEQUENCE A: HEADER REVEAL (Label, Headline, and Paragraph)
      // =========================================================================
      const headerTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".fk-header",
          start: "top 85%",
          once: true,
        },
      });

      headerTl
        .fromTo(
          ".fk-badge",
          { opacity: 0, y: 15, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" }
        )
        .fromTo(
          ".fk-headline-line",
          { yPercent: 105, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.12,
            ease: "power3.out",
          },
          "-=0.3"
        )
        .fromTo(
          ".fk-description",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" },
          "-=0.4"
        );

      // =========================================================================
      // SEQUENCE B: PHOTOGRAPH MASK REVEAL & INTERNAL SCROLL PARALLAX
      // =========================================================================
      if (photoFrameRef.current) {
        // Entrance clip-path & settling scale
        gsap.fromTo(
          photoFrameRef.current,
          { clipPath: "inset(12% 0% 12% 0% round 24px)", opacity: 0.6 },
          {
            clipPath: "inset(0% 0% 0% 0% round 24px)",
            opacity: 1,
            duration: 1.1,
            ease: "power3.inOut",
            scrollTrigger: {
              trigger: photoFrameRef.current,
              start: "top 80%",
              once: true,
            },
          }
        );

        if (photoImageRef.current) {
          gsap.fromTo(
            photoImageRef.current,
            { scale: 1.12 },
            {
              scale: 1.0,
              duration: 1.4,
              ease: "power2.out",
              scrollTrigger: {
                trigger: photoFrameRef.current,
                start: "top 80%",
                once: true,
              },
            }
          );

          // Subtle internal parallax on scroll (desktop only)
          const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
          if (isDesktop) {
            gsap.to(photoImageRef.current, {
              yPercent: 8,
              ease: "none",
              scrollTrigger: {
                trigger: photoFrameRef.current,
                start: "top bottom",
                end: "bottom top",
                scrub: 1.2,
              },
            });
          }
        }

        // Caption bar gentle glide in
        gsap.fromTo(
          ".fk-caption",
          { opacity: 0, y: 15 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            delay: 0.4,
            ease: "power2.out",
            scrollTrigger: {
              trigger: photoFrameRef.current,
              start: "top 75%",
              once: true,
            },
          }
        );
      }

      // =========================================================================
      // SEQUENCE C: SEQUENTIAL INFORMATION PANELS
      // =========================================================================
      gsap.fromTo(
        ".fk-info-panel",
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.22,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".fk-info-column",
            start: "top 80%",
            once: true,
          },
        }
      );

      // =========================================================================
      // SEQUENCE D: MEMORY QUOTATION (ARCHIVAL PRINCIPLE)
      // =========================================================================
      gsap.fromTo(
        ".fk-quote-box",
        { opacity: 0, scale: 0.96, y: 20 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.7,
          ease: "back.out(1.15)",
          scrollTrigger: {
            trigger: ".fk-quote-box",
            start: "top 88%",
            once: true,
          },
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      id="kitchen"
      className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 border-b border-[#DDDCD3] bg-[#F2F2EB] scroll-mt-20 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto space-y-14 lg:space-y-16">
        {/* Header */}
        <div className="fk-header max-w-3xl space-y-3">
          <span className="fk-badge font-mono text-xs uppercase tracking-widest text-[#2E4742] font-semibold bg-[#FAF9F5] px-3.5 py-1.5 rounded-full border border-[#DDDCD3] inline-block">
            [ 05 — THE FAMILY HEIRLOOM ]
          </span>

          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#202723] tracking-tight leading-[1.02]">
            <span className="block overflow-hidden">
              <span className="fk-headline-line block">
                The recipes we inherit
              </span>
            </span>
            <span className="block overflow-hidden">
              <span className="fk-headline-line block">
                deserve a place to live.
              </span>
            </span>
          </h2>

          <p className="fk-description font-sans text-base sm:text-lg text-[#525B56] leading-relaxed">
            Not scattered across torn note scraps, lost group chats, or forgotten voice notes. A
            private family archive where every dish is honored with its original hands, voice, and
            kitchen memories.
          </p>
        </div>

        {/* Editorial Layout: Large Documentary Photograph & Heirloom Cookbook Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Large Documentary Photo */}
          <div className="lg:col-span-7 relative">
            <div
              ref={photoFrameRef}
              className="relative rounded-3xl overflow-hidden border border-[#DDDCD3] shadow-[0_12px_40px_rgba(0,0,0,0.06)] bg-[#FAF9F5]"
            >
              <div className="relative aspect-16/10 w-full overflow-hidden">
                <div ref={photoImageRef} className="absolute inset-0 w-full h-full">
                  <Image
                    src="/images/family-cooking.jpg"
                    alt="Baking together with flour dusted on wooden counter"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    priority={false}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-40 pointer-events-none" />

                <div className="absolute top-4 left-4 z-10">
                  <span className="font-mono text-xs bg-[#2E4742] text-[#F2F2EB] px-3 py-1 rounded-full font-bold shadow-xs">
                    Demonstration Archive Space
                  </span>
                </div>
              </div>

              {/* Caption */}
              <div className="fk-caption p-5 bg-[#FAF9F5] border-t border-[#DDDCD3] flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <p className="font-display text-base font-bold text-[#202723]">
                    The Adebayo &amp; Rossi Family Kitchen
                  </p>
                  <p className="text-[#525B56] font-sans">
                    Sample Archive • 8 family contributors • 48 hours of archival video
                  </p>
                </div>
                <div className="flex -space-x-2" aria-hidden="true">
                  <div className="w-8 h-8 rounded-full bg-[#2E4742] text-white flex items-center justify-center font-bold text-xs border-2 border-white shadow-xs">
                    M
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#F5B726] text-black flex items-center justify-center font-bold text-xs border-2 border-white shadow-xs">
                    A
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#8BB2DE] text-black flex items-center justify-center font-bold text-xs border-2 border-white shadow-xs">
                    R
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Heirloom Cookbook Details */}
          <div className="fk-info-column lg:col-span-5 space-y-6">
            <div className="fk-info-panel p-6 rounded-3xl bg-[#FAF9F5] border border-[#DDDCD3] shadow-xs space-y-4 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-2.5 text-xs font-mono text-[#2E4742] font-bold">
                <ChefHat className="w-4 h-4 text-[#F5B726]" />
                <span>HEIRLOOM TRADITIONS</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-[#202723]">
                Preserve the technique, not just the measurements
              </h3>
              <p className="font-sans text-sm text-[#525B56] leading-relaxed">
                When you preserve a recipe in your Family Kitchen, it includes the exact way an
                elder shaped the dough, the temperature of the oil, and the stories told while
                waiting for the pot to boil.
              </p>
            </div>

            <div className="fk-info-panel p-6 rounded-3xl bg-[#FAF9F5] border border-[#DDDCD3] shadow-xs space-y-4 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-2.5 text-xs font-mono text-[#2E4742] font-bold">
                <Users className="w-4 h-4 text-[#8BB2DE]" />
                <span>SHARED GENERATIONS</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-[#202723]">
                A private sanctuary for family members
              </h3>
              <p className="font-sans text-sm text-[#525B56] leading-relaxed">
                Invite cousins, siblings, children, and parents to contribute their recordings and
                memories. Only invited members have access to your family&apos;s kitchen.
              </p>
            </div>

            {/* Handwritten Note Accent */}
            <div className="fk-quote-box p-4 rounded-2xl bg-[#FEF8EC] border border-[#F5B726]/40 text-xs text-[#202723] space-y-1 shadow-xs">
              <span className="font-mono text-[10px] uppercase font-bold text-[#2E4742] tracking-wider">
                ARCHIVAL PRINCIPLE
              </span>
              <p className="font-sans italic leading-relaxed text-[#202723]/90">
                &ldquo;Because one day, you will want to hear the way they laughed over the stove,
                and how they tested the pepper soup with a wooden spoon.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
