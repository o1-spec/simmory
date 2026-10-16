"use client";

import React, { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const GALLERY_ITEMS = [
  {
    image: "/images/spices-mortar.jpg",
    title: "The Weight of the Stone",
    caption: "Whole cloves, dried chillies, and garlic crushed until the kitchen fills with warmth.",
    tag: "TACTILE INSTINCT",
    tagColor: "bg-[#F5B726] text-[#202723]",
  },
  {
    image: "/images/jollof-pot.jpg",
    title: "The Sound of the Reduction",
    caption: "Small red droplets pooling around the rim. The cook knows by sound before lifting the lid.",
    tag: "SENSORY CUE",
    tagColor: "bg-[#2E4742] text-[#F2F2EB]",
  },
  {
    image: "/images/hero-cooking-hands.jpg",
    title: "The Touch of the Dough",
    caption: "Kneaded until it gently pushes back against the palm. No kitchen scale can measure this.",
    tag: "MUSCLE MEMORY",
    tagColor: "bg-[#8BB2DE] text-[#202723]",
  },
  {
    image: "/images/family-cooking.jpg",
    title: "Three Generations at the Table",
    caption: "Passing down the motion of the hands before the technique is lost to time.",
    tag: "FAMILY HEIRLOOM",
    tagColor: "bg-[#E97B77] text-[#F2F2EB]",
  },
  {
    image: "/images/braised-dish.jpg",
    title: "The Sunday Gathering",
    caption: "The slow-braised recipe that brought everyone home, prepared the way they made it.",
    tag: "PRESERVED FEAST",
    tagColor: "bg-[#2E4742] text-[#F2F2EB]",
  },
];

export function CulinaryGallery() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced || !trackRef.current || !sectionRef.current) return;

      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      if (!isDesktop) return;

      const track = trackRef.current;
      const totalScroll = track.scrollWidth - window.innerWidth + 80;

      const tween = gsap.to(track, {
        x: -totalScroll,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          pin: true,
          scrub: 0.8,
          start: "top top",
          end: () => `+=${totalScroll}`,
          invalidateOnRefresh: true,
        },
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative py-20 lg:py-28 bg-[#FAF9F5] border-b border-[#DDDCD3] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 sm:mb-14">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="font-mono text-xs uppercase tracking-widest text-[#2E4742] font-semibold bg-[#E3E9E8] px-3.5 py-1.5 rounded-full border border-[#2E4742]/20 inline-block">
              [ 02 — THE CULINARY MOMENTS ]
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#202723] tracking-tight leading-[1.02]">
              The little details make the difference.
            </h2>
            <p className="font-sans text-base sm:text-lg text-[#525B56] leading-relaxed">
              A pinch. A glance. The way the spoon moves. Some recipes are learned only by being
              there in the kitchen.
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-2 font-mono text-xs text-[#7A857F]">
            <span>Scroll horizontally</span>
            <span className="w-8 h-px bg-[#DDDCD3]" />
            <span>&rarr;</span>
          </div>
        </div>
      </div>

      {/* Gallery Track */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div
          ref={trackRef}
          className="flex gap-6 lg:gap-8 overflow-x-auto lg:overflow-visible no-scrollbar pb-6 lg:pb-0 snap-x lg:snap-none"
        >
          {GALLERY_ITEMS.map((item, idx) => (
            <div
              key={idx}
              className="gallery-card shrink-0 w-[82vw] sm:w-[420px] lg:w-[480px] rounded-3xl overflow-hidden border border-[#DDDCD3] bg-[#F2F2EB] shadow-[0_8px_30px_rgba(0,0,0,0.04)] snap-start group"
            >
              <div className="relative aspect-4/3 w-full overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 640px) 82vw, (max-width: 1024px) 420px, 480px"
                />
                <div className="absolute top-4 left-4">
                  <span
                    className={`font-mono text-[10px] uppercase tracking-wider px-3 py-1 rounded-full font-bold shadow-xs ${item.tagColor}`}
                  >
                    {item.tag}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-2">
                <h3 className="font-display text-2xl font-bold text-[#202723]">
                  {item.title}
                </h3>
                <p className="font-sans text-sm text-[#525B56] leading-relaxed">
                  {item.caption}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
