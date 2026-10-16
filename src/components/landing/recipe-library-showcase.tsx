"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, Flame, BookOpen, Video, ArrowUpRight } from "lucide-react";

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

  const filtered = activeTab === "all" ? RECIPES : RECIPES.filter((r) => r.category === activeTab);

  return (
    <section id="recipes" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 border-b border-[#DDDCD3] bg-[#FAF9F5]">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="font-mono text-xs uppercase tracking-widest text-[#2E4742] font-semibold bg-[#E3E9E8] px-3.5 py-1.5 rounded-full border border-[#2E4742]/20 inline-block">
              [ 06 — THE ARCHIVE SHOWCASE ]
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#202723] tracking-tight leading-[1.02]">
              A cookbook that feels like family.
            </h2>
            <p className="font-sans text-base sm:text-lg text-[#525B56] leading-relaxed">
              Every preserved recipe pairs mouth-watering instructions with verified video
              timestamps and the cook&apos;s real voice.
            </p>
          </div>

          {/* Filter Pills (NutriNook / Flavoriz style) */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "All Heirlooms" },
              { id: "pots", label: "Simmered Pots" },
              { id: "breads", label: "Traditional Breads" },
              { id: "feasts", label: "Sunday Feasts" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2 rounded-full text-xs font-mono font-medium transition-all ${
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

        {/* Recipe Grid (Flavoriz inspired rich food photography) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filtered.map((recipe) => (
            <div
              key={recipe.id}
              className="rounded-3xl border border-[#DDDCD3] bg-[#F2F2EB] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(46,71,66,0.08)] transition-all duration-300 group flex flex-col"
            >
              {/* Image Frame with Badges */}
              <div className="relative aspect-16/10 w-full overflow-hidden">
                <Image
                  src={recipe.image}
                  alt={recipe.title}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                {/* Top Origin Tag */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="font-mono text-xs uppercase bg-[#FAF9F5]/90 backdrop-blur-md text-[#202723] px-3 py-1 rounded-full font-bold shadow-xs border border-[#DDDCD3]">
                    {recipe.origin}
                  </span>
                </div>

                {/* Video Evidence Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <span className="font-mono text-xs bg-[#2E4742] text-[#F2F2EB] px-3 py-1 rounded-full font-semibold flex items-center gap-1.5 shadow-xs">
                    <Video className="w-3.5 h-3.5" />
                    Video Verified
                  </span>
                </div>

                {/* Bottom Cook Attribution Overlay */}
                <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between text-white text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#F5B726] text-black font-bold flex items-center justify-center text-xs">
                      {recipe.cook.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-tight text-white">{recipe.cook}</p>
                      <p className="text-[11px] text-white/80">{recipe.cookRole}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[11px] bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg">
                    <Clock className="w-3.5 h-3.5 text-[#F5B726]" />
                    <span>{recipe.time}</span>
                  </div>
                </div>
              </div>

              {/* Recipe Details */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <h3 className="font-display text-2xl font-bold text-[#202723] group-hover:text-[#2E4742] transition-colors">
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
                    <span>View Heirloom</span>
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
