"use client";

import React from "react";
import Image from "next/image";
import { Users, ChefHat } from "lucide-react";

export function FamilyKitchenShowcase() {
  return (
    <section id="kitchen" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 border-b border-[#DDDCD3] bg-[#F2F2EB] scroll-mt-20">
      <div className="max-w-7xl mx-auto space-y-14 lg:space-y-16">
        {/* Header */}
        <div className="max-w-3xl space-y-3">
          <span className="font-mono text-xs uppercase tracking-widest text-[#2E4742] font-semibold bg-[#FAF9F5] px-3.5 py-1.5 rounded-full border border-[#DDDCD3] inline-block">
            [ 05 — THE FAMILY HEIRLOOM ]
          </span>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#202723] tracking-tight leading-[1.02]">
            The recipes we inherit deserve a place to live.
          </h2>
          <p className="font-sans text-base sm:text-lg text-[#525B56] leading-relaxed">
            Not scattered across torn note scraps, lost group chats, or forgotten voice notes. A
            private family archive where every dish is honored with its original hands, voice, and
            kitchen memories.
          </p>
        </div>

        {/* Editorial Layout: Large Documentary Photograph & Heirloom Cookbook Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Large Documentary Photo */}
          <div className="lg:col-span-7 relative">
            <div className="relative rounded-3xl overflow-hidden border border-[#DDDCD3] shadow-[0_12px_40px_rgba(0,0,0,0.06)] bg-[#FAF9F5]">
              <div className="relative aspect-16/10 w-full overflow-hidden">
                <Image
                  src="/images/family-cooking.jpg"
                  alt="Grandmother and granddaughter baking together with flour dusted on wooden counter"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 58vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-40" />

                <div className="absolute top-4 left-4">
                  <span className="font-mono text-xs bg-[#2E4742] text-[#F2F2EB] px-3 py-1 rounded-full font-bold">
                    Private Family Kitchen
                  </span>
                </div>
              </div>

              {/* Caption */}
              <div className="p-5 bg-[#FAF9F5] border-t border-[#DDDCD3] flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <p className="font-display text-base font-bold text-[#202723]">
                    The Adebayo &amp; Rossi Family Kitchen
                  </p>
                  <p className="text-[#525B56] font-sans">
                    34 recipes preserved • 8 family contributors • 48 hours of archival video
                  </p>
                </div>
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-[#2E4742] text-white flex items-center justify-center font-bold text-xs border-2 border-white">
                    M
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#F5B726] text-black flex items-center justify-center font-bold text-xs border-2 border-white">
                    A
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#8BB2DE] text-black flex items-center justify-center font-bold text-xs border-2 border-white">
                    R
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Heirloom Cookbook Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-3xl bg-[#FAF9F5] border border-[#DDDCD3] shadow-xs space-y-4">
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

            <div className="p-6 rounded-3xl bg-[#FAF9F5] border border-[#DDDCD3] shadow-xs space-y-4">
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
            <div className="p-4 rounded-2xl bg-[#FEF8EC] border border-[#F5B726]/30 text-xs text-[#202723] space-y-1">
              <span className="font-mono text-[10px] uppercase font-bold text-[#2E4742]">
                ARCHIVAL PRINCIPLE
              </span>
              <p className="font-sans italic leading-relaxed">
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
