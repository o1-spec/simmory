import React, { Suspense } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/navigation/app-header";
import { CinematicHero } from "@/components/landing/cinematic-hero";
import { CulinaryGallery } from "@/components/landing/culinary-gallery";
import { CookingMemory } from "@/components/landing/cooking-memory";
import { VideoToRecipeScroll } from "@/components/landing/video-to-recipe-scroll";
import { FamilyKitchenShowcase } from "@/components/landing/family-kitchen-showcase";
import { RecipeLibraryShowcase } from "@/components/landing/recipe-library-showcase";
import { CookAlongShowcase } from "@/components/landing/cook-along-showcase";
import { CinematicCta } from "@/components/landing/cinematic-cta";
import { EditorialFooter } from "@/components/landing/editorial-footer";
import { SimmoryIntro } from "@/components/branding/simmory-intro";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F2F2EB] flex flex-col text-[#202723] selection:bg-[#2E4742] selection:text-[#F2F2EB]">
      {/* Cinematic Brand Introduction (Plays on first session visit) */}
      <SimmoryIntro />

      {/* Navigation */}
      <Suspense fallback={<div className="h-18 sm:h-20 border-b border-[#DDDCD3] bg-[#F2F2EB]/95" />}>
        <AppHeader />
      </Suspense>

      <main className="flex-1 flex flex-col">
        {/* SECTION 1: CINEMATIC FOOD-FOCUSED HERO */}
        <CinematicHero />

        {/* SECTION 2: IMMERSIVE CULINARY IMAGE GALLERY (HORIZONTAL GSAP SCROLL) */}
        <CulinaryGallery />

        {/* SECTION 3: THE COOKING MEMORY & UNWRITTEN PHRASES */}
        <CookingMemory />

        {/* SECTION 4: VIDEO BECOMES RECIPE (PINNED GSAP SCROLL SEQUENCE) */}
        <VideoToRecipeScroll />

        {/* SECTION 5: FAMILY KITCHEN — FOOD AND MEMORIES */}
        <FamilyKitchenShowcase />

        {/* SECTION 6: RECIPE LIBRARY SHOWCASE (FLAVORIZ & NUTRINOOK INSPIRED) */}
        <RecipeLibraryShowcase />

        {/* SECTION 7: INTERACTIVE COOK ALONG SHOWCASE */}
        <CookAlongShowcase />

        {/* SECTION 8: MEMORABLE FINAL CALL TO ACTION */}
        <CinematicCta />
      </main>

      {/* Editorial Footer with scroll-triggered entrance */}
      <EditorialFooter />
    </div>
  );
}
