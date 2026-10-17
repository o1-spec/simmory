"use client";

import React, { useState, useRef, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, Flame, BookOpen, Video, ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface RecipeShowcaseItem {
  id: string;
  title: string;
  subtitle: string;
  category: "all" | "breads" | "pots" | "feasts";
  origin: string;
  cook: string;
  cookRole: string;
  time: string;
  steps: number;
  cues: number;
  image: string;
}

const RECIPES: RecipeShowcaseItem[] = [
  {
    id: "jollof-rice",
    title: "Mama Rosa's Smoky Firewood Jollof",
    subtitle: "Parboiled long grain rice in roasted pepper-tomato reduction",
    category: "pots",
    origin: "Lagos, Nigeria",
    cook: "Mama Rosa",
    cookRole: "Mother",
    time: "1 hr 15 min",
    steps: 6,
    cues: 4,
    image: "/images/jollof-pot.jpg",
  },
  {
    id: "sourdough-focaccia",
    title: "Nonna's High-Hydration Sourdough Focaccia",
    subtitle: "Dimpled with rosemary, green olives, and cold-pressed olive oil",
    category: "breads",
    origin: "Puglia, Italy",
    cook: "Nonna Rosa",
    cookRole: "Grandmother",
    time: "4 hr",
    steps: 7,
    cues: 3,
    image: "/images/hero-cooking-hands.jpg",
  },
  {
    id: "braised-birria",
    title: "Abuela Elena's Slow-Braised Short Rib Birria",
    subtitle: "Tender beef shank braised in guajillo and ancho chile broth",
    category: "feasts",
    origin: "Jalisco, Mexico",
    cook: "Abuela Elena",
    cookRole: "Grandmother",
    time: "3 hr 30 min",
    steps: 8,
    cues: 5,
    image: "/images/braised-dish.jpg",
  },
  {
    id: "stone-ground-masala",
    title: "Dadi's Hand-Roasted Garam Masala Blend",
    subtitle: "Stone-crushed cloves, black cardamom, and whole coriander",
    category: "pots",
    origin: "Punjab, India",
    cook: "Dadi Jasbir",
    cookRole: "Great Grandmother",
    time: "25 min",
    steps: 4,
    cues: 3,
    image: "/images/spices-mortar.jpg",
  },
];

export function RecipeLibraryShowcase() {
  const [activeTab, setActiveTab] = useState<"all" | "breads" | "pots" | "feasts">("all");
  const [, startTransition] = useTransition();

  const containerRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const filtered =
    activeTab === "all" ? RECIPES : RECIPES.filter((r) => r.category === activeTab);

  // Initial Section Reveal Animation
  useGSAP(
    () => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) return;

      // Header entrance
      const headerTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".rl-header",
          start: "top 85%",
          once: true,
        },
      });

      headerTl
        .fromTo(
          ".rl-badge",
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
        )
        .fromTo(
          ".rl-title",
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" },
          "-=0.2"
        )
        .fromTo(
          ".rl-desc",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
          "-=0.3"
        )
        .fromTo(
          ".rl-tab-btn",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out" },
          "-=0.4"
        );

      // Cards staggered entrance
      gsap.fromTo(
        ".rl-card",
        { opacity: 0, y: 40, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 80%",
            once: true,
          },
        }
      );

      // Subtle scroll parallax across cards on desktop
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      if (isDesktop) {
        gsap.utils.toArray<HTMLElement>(".rl-card-odd").forEach((card) => {
          gsap.to(card, {
            yPercent: -4,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.5,
            },
          });
        });

        gsap.utils.toArray<HTMLElement>(".rl-card-even").forEach((card) => {
          gsap.to(card, {
            yPercent: 4,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.5,
            },
          });
        });
      }
    },
    { scope: containerRef }
  );

  // Category Filter Smooth Transition Animation
  const handleTabChange = (newTab: "all" | "breads" | "pots" | "feasts") => {
    if (newTab === activeTab) return;

    const cards = gridRef.current?.querySelectorAll(".rl-card");
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (cards && cards.length > 0 && !prefersReduced) {
      gsap.to(cards, {
        opacity: 0,
        y: 12,
        scale: 0.98,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
          startTransition(() => {
            setActiveTab(newTab);
          });
          // Animate back in on next tick
          requestAnimationFrame(() => {
            const newCards = gridRef.current?.querySelectorAll(".rl-card");
            if (newCards) {
              gsap.fromTo(
                newCards,
                { opacity: 0, y: 15, scale: 0.98 },
                {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  duration: 0.4,
                  stagger: 0.08,
                  ease: "power3.out",
                }
              );
            }
          });
        },
      });
    } else {
      setActiveTab(newTab);
    }
  };

  return (
    <section
      ref={containerRef}
      id="recipes"
      className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 border-b border-[#DDDCD3] bg-[#FAF9F5] scroll-mt-20 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="rl-header flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="rl-badge font-mono text-xs uppercase tracking-widest text-[#2E4742] font-semibold bg-[#E3E9E8] px-3.5 py-1.5 rounded-full border border-[#2E4742]/20 inline-block">
              [ 06 — THE ARCHIVE SHOWCASE ]
            </span>
            <h2 className="rl-title font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#202723] tracking-tight leading-[1.02]">
              A cookbook that feels like family.
            </h2>
            <p className="rl-desc font-sans text-base sm:text-lg text-[#525B56] leading-relaxed">
              Every preserved recipe pairs mouth-watering instructions with verified video
              timestamps and the cook&apos;s real voice.
            </p>
          </div>

          {/* Filter Pills */}
          <div
            role="tablist"
            aria-label="Recipe categories"
            className="flex flex-wrap gap-2"
          >
            {[
              { id: "all", label: "All Heirlooms" },
              { id: "pots", label: "Simmered Pots" },
              { id: "breads", label: "Traditional Breads" },
              { id: "feasts", label: "Sunday Feasts" },
            ].map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => handleTabChange(tab.id as typeof activeTab)}
                className={`rl-tab-btn px-4 py-2 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[#2E4742] text-[#F2F2EB] shadow-xs"
                    : "bg-[#F2F2EB] text-[#525B56] hover:bg-[#DDDCD3] border border-[#DDDCD3]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recipe Grid */}
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filtered.map((recipe, idx) => (
            <article
              key={recipe.id}
              className={`rl-card ${
                idx % 2 === 0 ? "rl-card-even" : "rl-card-odd"
              } rounded-3xl border border-[#DDDCD3] bg-[#F2F2EB] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(46,71,66,0.1)] transition-all duration-300 group flex flex-col`}
            >
              {/* Image Frame with Badges */}
              <div className="relative aspect-16/10 w-full overflow-hidden bg-[#202723]">
                <Image
                  src={recipe.image}
                  alt={recipe.title}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover:opacity-50 transition-opacity duration-300" />

                {/* Top Origin Tag */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="font-mono text-xs uppercase bg-[#FAF9F5]/90 backdrop-blur-md text-[#202723] px-3 py-1 rounded-full font-bold shadow-xs border border-[#DDDCD3]">
                    {recipe.origin}
                  </span>
                </div>

                {/* Video Evidence Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <span className="font-mono text-xs bg-[#2E4742] text-[#F2F2EB] px-3 py-1 rounded-full font-semibold flex items-center gap-1.5 shadow-xs">
                    <Video className="w-3.5 h-3.5 text-[#F5B726]" />
                    Archival Demonstration
                  </span>
                </div>

                {/* Bottom Cook Attribution Overlay */}
                <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between text-white text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#F5B726] text-black font-bold flex items-center justify-center text-xs shadow-xs border border-white/20">
                      {recipe.cook.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-tight text-white drop-shadow-xs">
                        {recipe.cook}
                      </p>
                      <p className="text-[11px] text-white/80 font-sans">{recipe.cookRole}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                    <Clock className="w-3.5 h-3.5 text-[#F5B726]" />
                    <span>{recipe.time}</span>
                  </div>
                </div>
              </div>

              {/* Recipe Details */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <h3 className="font-display text-2xl font-bold text-[#202723] group-hover:text-[#2E4742] transition-colors leading-tight">
                    {recipe.title}
                  </h3>
                  <p className="font-sans text-sm text-[#525B56] leading-relaxed">
                    {recipe.subtitle}
                  </p>
                </div>

                {/* Metadata & Cook Along Action */}
                <div className="pt-4 border-t border-[#DDDCD3] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4 text-[#525B56] font-mono">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-[#2E4742]" />
                      {recipe.steps} Steps
                    </span>
                    <span className="flex items-center gap-1 text-[#2E4742] font-semibold">
                      <Flame className="w-3.5 h-3.5 text-[#F5B726]" />
                      {recipe.cues} Sensory Cues
                    </span>
                  </div>

                  <Link
                    href="/dashboard"
                    className="font-mono text-xs font-semibold text-[#2E4742] hover:text-[#202723] flex items-center gap-1 group/btn"
                  >
                    <span>View Demonstration</span>
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
