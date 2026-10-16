"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChefHat, Heart, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CinematicCta() {
  return (
    <section className="relative py-24 lg:py-32 px-4 sm:px-6 lg:px-8 bg-[#F2F2EB] overflow-hidden">
      <div className="max-w-6xl mx-auto relative">
        <div className="relative rounded-3xl overflow-hidden border border-[#DDDCD3] bg-[#FAF9F5] shadow-[0_16px_50px_rgba(46,71,66,0.08)] p-8 sm:p-14 lg:p-20 text-center space-y-8">
          {/* Subtle background food atmosphere */}
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
            <Image
              src="/images/braised-dish.jpg"
              alt="Culinary background texture"
              fill
              className="object-cover"
            />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            <span className="font-mono text-xs uppercase tracking-widest text-[#2E4742] font-semibold bg-[#E3E9E8] px-3.5 py-1.5 rounded-full border border-[#2E4742]/20 inline-block">
              [ THE INVITATION ]
            </span>

            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#202723] tracking-tight leading-[1.02]">
              Keep the recipe. <br className="hidden sm:inline" />
              <span className="text-[#2E4742]">Keep the memory.</span>
            </h2>

            <p className="font-sans text-base sm:text-xl text-[#525B56] leading-relaxed max-w-2xl mx-auto">
              Give the recipes, voices, and little cooking traditions worth keeping a private home.
              Start preserving with the family members who taught you everything.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/register">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto text-base px-9 py-4 shadow-sm"
                rightIcon={<ArrowUpRight className="w-4 h-4" />}
              >
                Create Your Family Kitchen
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto text-base px-7 py-4"
              >
                Sign In to Kitchen
              </Button>
            </Link>
          </div>

          {/* Archival Values */}
          <div className="relative z-10 pt-8 border-t border-[#DDDCD3]/60 flex flex-wrap items-center justify-center gap-y-3 gap-x-8 text-xs font-mono text-[#525B56]">
            <div className="flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 text-[#E97B77]" />
              <span>Private to Invited Family</span>
            </div>
            <div className="flex items-center gap-2">
              <ChefHat className="w-3.5 h-3.5 text-[#2E4742]" />
              <span>Grounded in Real Cooking Videos</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#F5B726]" />
              <span>No Public Recipe Scraping</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
