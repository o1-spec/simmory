import React, { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  Play,
  Sparkles,
  ShieldCheck,
  Clock,
  Utensils,
  Video,
  CheckCircle2,
  Users,
  Bookmark,
  HelpCircle,
  Flame,
} from "lucide-react";
import { AppHeader } from "@/components/navigation/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F2F2EB] flex flex-col text-[#202723] selection:bg-[#2E4742] selection:text-[#F2F2EB]">
      {/* Navigation */}
      <Suspense fallback={<div className="h-18 sm:h-20 border-b border-[#DDDCD3] bg-[#F2F2EB]/95" />}>
        <AppHeader />
      </Suspense>

      <main className="flex-1 flex flex-col">
        {/* ========================================================================= */}
        {/* HERO SECTION — WARM CREAM BACKGROUND, BOLD CONDENSED TYPOGRAPHY           */}
        {/* ========================================================================= */}
        <section className="relative pt-10 pb-20 sm:pt-16 sm:pb-28 px-4 sm:px-6 lg:px-8 border-b border-[#DDDCD3] bg-[#F2F2EB]">
          <div className="max-w-7xl mx-auto">
            {/* Top editorial eyebrow */}
            <div className="flex items-center gap-3 mb-6">
              <span className="font-mono text-xs uppercase tracking-widest text-[#2E4742] font-semibold bg-[#E3E9E8] px-3 py-1 rounded-full border border-[#2E4742]/20">
                Simmory — Culinary Heritage Archive
              </span>
              <span className="h-px flex-1 bg-[#DDDCD3] hidden sm:block" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-12 items-center">
              {/* Left Column: Bold Condensed Headline & Call to Action */}
              <div className="lg:col-span-7 space-y-6 sm:space-y-8">
                <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[5.25rem] font-extrabold text-[#202723] tracking-tight leading-[0.98]">
                  Some recipes deserve more than being written down.
                </h1>

                <p className="text-lg sm:text-xl text-[#525B56] leading-relaxed max-w-2xl font-sans">
                  Preserve the voices, techniques, stories, and little details that make
                  family cooking worth remembering. Simmory connects private cooking videos
                  with human-verified instructions so traditional knowledge never disappears.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <Link href="/upload">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full sm:w-auto justify-center text-base px-7"
                      rightIcon={<ArrowUpRight className="w-4 h-4" />}
                    >
                      Start Preserving
                    </Button>
                  </Link>
                  <Link href="#how-it-works">
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full sm:w-auto justify-center text-base"
                    >
                      See How It Works
                    </Button>
                  </Link>
                </div>

                {/* Editorial Metadata Pills */}
                <div className="pt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[#525B56] font-mono border-t border-[#DDDCD3]/60 pt-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2E4742]" />
                    <span>Private Family Archives</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#F5B726]" />
                    <span>Timestamped Video Evidence</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#8BB2DE]" />
                    <span>Cook-Verified Memory</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Editorial Food Photography with Floating Story Artifact */}
              <div className="lg:col-span-5 relative">
                <div className="relative rounded-2xl overflow-hidden border border-[#DDDCD3] shadow-[0_8px_30px_rgb(0,0,0,0.06)] bg-[#FAF9F5]">
                  <div className="relative aspect-4/3 w-full">
                    <Image
                      src="/images/hero-cooking-hands.jpg"
                      alt="Hands kneading rustic bread dough on a wooden kitchen table"
                      fill
                      priority
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 42vw"
                    />
                  </div>

                  {/* Editorial caption badge overlay */}
                  <div className="p-4 sm:p-5 bg-[#FAF9F5] border-t border-[#DDDCD3] flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] uppercase tracking-wider text-[#2E4742] font-semibold">
                          [ VIDEO DEMONSTRATION ]
                        </span>
                        <span className="text-[11px] text-[#7A857F]">• 18 min clip</span>
                      </div>
                      <p className="font-display text-base font-bold text-[#202723]">
                        Nonna Rosa&apos;s Sunday Sourdough Focaccia
                      </p>
                      <p className="text-xs text-[#525B56] font-sans">
                        &ldquo;Knead with the heel of the palm until it pushes back.&rdquo;
                      </p>
                    </div>

                    <Link
                      href="/dashboard"
                      className="shrink-0 w-11 h-11 rounded-full bg-[#2E4742] text-[#F2F2EB] flex items-center justify-center hover:bg-[#233733] transition-colors shadow-xs"
                      aria-label="View demo video"
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* THE PROBLEM SECTION — UNWRITTEN COOKING KNOWLEDGE                         */}
        {/* ========================================================================= */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-[#DDDCD3] bg-[#FAF9F5]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* Left Column: Simmering Pot Culinary Photography */}
              <div className="lg:col-span-5 order-2 lg:order-1">
                <div className="relative rounded-2xl overflow-hidden border border-[#DDDCD3] shadow-[0_4px_20px_rgb(0,0,0,0.04)]">
                  <div className="relative aspect-4/3 w-full">
                    <Image
                      src="/images/simmering-pot.jpg"
                      alt="Cast iron Dutch oven simmering with rich tomato sauce, steam, and wooden spoon"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 40vw"
                    />
                  </div>
                  <div className="p-4 bg-[#F2F2EB] border-t border-[#DDDCD3] flex items-center justify-between text-xs font-mono text-[#525B56]">
                    <span>SENSORY CUE EVIDENCE</span>
                    <span className="text-[#2E4742] font-semibold">Tasting Spoon Timestamp: 14:22</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Editorial Narrative & Unwritten Cues */}
              <div className="lg:col-span-7 order-1 lg:order-2 space-y-6">
                <span className="font-mono text-xs uppercase tracking-widest text-[#2E4742] font-semibold bg-[#E3E9E8] px-3 py-1 rounded-full border border-[#2E4742]/20">
                  The Problem With Standard Recipes
                </span>

                <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-[#202723] tracking-tight leading-[1.05]">
                  The best recipes aren&apos;t always written down.
                </h2>

                <p className="text-base sm:text-lg text-[#525B56] leading-relaxed font-sans">
                  Ask a family cook how much salt they use, and they will tell you &ldquo;enough.&rdquo;
                  Ask how long it bakes, and they will say &ldquo;until it turns chestnut golden.&rdquo;
                  Standard recipe cards force these intuitive, tactile techniques into generic grams
                  and minutes, losing the muscle memory and instincts that made the food sacred.
                </p>

                {/* Unwritten phrases showcase */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                  <div className="p-4 rounded-xl bg-[#F2F2EB] border border-[#DDDCD3] space-y-1.5">
                    <span className="font-mono text-[10px] text-[#2E4742] uppercase tracking-wider block">
                      [ SENSORY CUE 01 ]
                    </span>
                    <p className="font-display text-lg font-bold text-[#202723]">
                      &ldquo;Add a little water.&rdquo;
                    </p>
                    <p className="text-xs text-[#525B56]">
                      Until the dough feels like a soft earlobe, not sticky.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F2F2EB] border border-[#DDDCD3] space-y-1.5">
                    <span className="font-mono text-[10px] text-[#2E4742] uppercase tracking-wider block">
                      [ SENSORY CUE 02 ]
                    </span>
                    <p className="font-display text-lg font-bold text-[#202723]">
                      &ldquo;Stir until it feels right.&rdquo;
                    </p>
                    <p className="text-xs text-[#525B56]">
                      When the wooden spoon leaves a clean trail on the pan floor.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F2F2EB] border border-[#DDDCD3] space-y-1.5">
                    <span className="font-mono text-[10px] text-[#2E4742] uppercase tracking-wider block">
                      [ SENSORY CUE 03 ]
                    </span>
                    <p className="font-display text-lg font-bold text-[#202723]">
                      &ldquo;Cook until the oil rises.&rdquo;
                    </p>
                    <p className="text-xs text-[#525B56]">
                      Small red droplets pooling around the rim indicate flavor release.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* HOW SIMMORY WORKS — 5-STEP EDITORIAL WORKFLOW SEQUENCE                    */}
        {/* ========================================================================= */}
        <section id="how-it-works" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-[#DDDCD3] bg-[#F2F2EB]">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="max-w-3xl space-y-3">
              <span className="font-mono text-xs uppercase tracking-widest text-[#2E4742] font-semibold bg-[#E3E9E8] px-3 py-1 rounded-full border border-[#2E4742]/20">
                The Preservation Workflow
              </span>
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#202723] tracking-tight leading-[1.02]">
                Upload. Analyze. Review. Preserve. Cook Along.
              </h2>
              <p className="text-base sm:text-lg text-[#525B56] leading-relaxed font-sans">
                A deliberate human-in-the-loop pipeline. AI proposes based on grounded video evidence,
                while family members maintain complete editorial control over the final heirloom recipe.
              </p>
            </div>

            {/* 5-Step Editorial Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="p-6 rounded-2xl bg-[#FAF9F5] border border-[#DDDCD3] space-y-4 hover:border-[#202723]/30 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#2E4742] bg-[#E3E9E8] px-2.5 py-1 rounded-md">
                    01 / UPLOAD
                  </span>
                  <Video className="w-5 h-5 text-[#2E4742]" />
                </div>
                <h3 className="font-display text-2xl font-bold text-[#202723]">
                  Direct Media Capture
                </h3>
                <p className="text-sm text-[#525B56] leading-relaxed">
                  Record on any smartphone in your kitchen. Upload directly to private storage
                  without compression loss. Automated FFprobe verifies codec, duration, and container integrity.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-6 rounded-2xl bg-[#FAF9F5] border border-[#DDDCD3] space-y-4 hover:border-[#202723]/30 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#2E4742] bg-[#E3E9E8] px-2.5 py-1 rounded-md">
                    02 / ANALYZE
                  </span>
                  <Sparkles className="w-5 h-5 text-[#F5B726]" />
                </div>
                <h3 className="font-display text-2xl font-bold text-[#202723]">
                  Local AI Extraction
                </h3>
                <p className="text-sm text-[#525B56] leading-relaxed">
                  Faster-Whisper transcribes speech with audio silence detection. Gemma 4 examines
                  sampled video frames to reconstruct timeline steps without fabricating dialogue.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-6 rounded-2xl bg-[#FAF9F5] border border-[#DDDCD3] space-y-4 hover:border-[#202723]/30 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#2E4742] bg-[#E3E9E8] px-2.5 py-1 rounded-md">
                    03 / REVIEW
                  </span>
                  <HelpCircle className="w-5 h-5 text-[#8BB2DE]" />
                </div>
                <h3 className="font-display text-2xl font-bold text-[#202723]">
                  Human Clarification
                </h3>
                <p className="text-sm text-[#525B56] leading-relaxed">
                  Review proposed events side-by-side with original video timestamps. Answer
                  clarification questions for unmeasured pinches and approve each step.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-6 rounded-2xl bg-[#FAF9F5] border border-[#DDDCD3] space-y-4 hover:border-[#202723]/30 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#2E4742] bg-[#E3E9E8] px-2.5 py-1 rounded-md">
                    04 / PRESERVE
                  </span>
                  <Bookmark className="w-5 h-5 text-[#2E4742]" />
                </div>
                <h3 className="font-display text-2xl font-bold text-[#202723]">
                  Family Heirloom Archive
                </h3>
                <p className="text-sm text-[#525B56] leading-relaxed">
                  Save to your private Family Kitchen. Recipes retain original cook attribution,
                  origin lore, family memories, and verified timestamp markers.
                </p>
              </div>

              {/* Step 5 */}
              <div className="p-6 rounded-2xl bg-[#FAF9F5] border border-[#DDDCD3] space-y-4 hover:border-[#202723]/30 transition-colors md:col-span-2 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#2E4742] bg-[#E3E9E8] px-2.5 py-1 rounded-md">
                    05 / COOK ALONG
                  </span>
                  <Utensils className="w-5 h-5 text-[#2E4742]" />
                </div>
                <h3 className="font-display text-2xl font-bold text-[#202723]">
                  Synchronized Kitchen Guidance
                </h3>
                <p className="text-sm text-[#525B56] leading-relaxed">
                  Cook in real time on mobile or tablet. Tap any step to jump the video directly
                  to that exact demonstration. Track ingredients, run contextual timers, and
                  recreate the dish with certainty.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* FAMILY KITCHEN SECTION — CULINARY HERITAGE & STORIES                      */}
        {/* ========================================================================= */}
        <section id="family-kitchen" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-[#DDDCD3] bg-[#FAF9F5]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* Left Column: Story & Family Kitchen Features */}
              <div className="lg:col-span-6 space-y-6">
                <span className="font-mono text-xs uppercase tracking-widest text-[#2E4742] font-semibold bg-[#E3E9E8] px-3 py-1 rounded-full border border-[#2E4742]/20">
                  Private Heritage Sanctuary
                </span>

                <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-[#202723] tracking-tight leading-[1.05]">
                  Every family has a kitchen full of stories.
                </h2>

                <p className="text-base sm:text-lg text-[#525B56] leading-relaxed font-sans">
                  Simmory creates private spaces for extended families to gather their
                  cooking footage, handwritten recipe traditions, and culinary memories.
                  Only authorized family members can access recipes and watch demonstrations.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F2F2EB] border border-[#DDDCD3]">
                    <ShieldCheck className="w-5 h-5 text-[#2E4742] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-display text-base font-bold text-[#202723]">
                        Original Cook Verification
                      </p>
                      <p className="text-xs text-[#525B56]">
                        Preserves the clear distinction between an AI proposal, a family review, and a recipe confirmed by the original maker.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F2F2EB] border border-[#DDDCD3]">
                    <Users className="w-5 h-5 text-[#2E4742] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-display text-base font-bold text-[#202723]">
                        Role-Based Family Collaboration
                      </p>
                      <p className="text-xs text-[#525B56]">
                        Owners invite family members as Editors or Viewers with strict server-side authorization.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href="/kitchens/new">
                    <Button variant="primary" size="md" rightIcon={<ArrowUpRight className="w-4 h-4" />}>
                      Create Your Family Kitchen
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right Column: Family Heritage Photography */}
              <div className="lg:col-span-6">
                <div className="relative rounded-2xl overflow-hidden border border-[#DDDCD3] shadow-[0_4px_20px_rgb(0,0,0,0.04)]">
                  <div className="relative aspect-3/2 w-full">
                    <Image
                      src="/images/family-heritage.jpg"
                      alt="Grandmother teaching grandchild to fold fresh pasta on wooden kitchen table"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                  <div className="p-4 bg-[#F2F2EB] border-t border-[#DDDCD3] flex items-center justify-between text-xs font-mono text-[#525B56]">
                    <span>HEIRLOOM TRADITION</span>
                    <span className="text-[#2E4742] font-semibold">Generational Knowledge</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* AI ANALYSIS SECTION — EVIDENCE-GROUNDED RECONSTRUCTION                    */}
        {/* ========================================================================= */}
        <section id="ai-analysis" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-[#DDDCD3] bg-[#F2F2EB]">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="max-w-3xl space-y-3">
              <span className="font-mono text-xs uppercase tracking-widest text-[#2E4742] font-semibold bg-[#E3E9E8] px-3 py-1 rounded-full border border-[#2E4742]/20">
                Ethical Grounded Intelligence
              </span>
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#202723] tracking-tight leading-[1.02]">
                Technology finds the moments. People preserve the meaning.
              </h2>
              <p className="text-base sm:text-lg text-[#525B56] leading-relaxed font-sans">
                Simmory does not invent ingredients or replace grandma&apos;s wisdom with generic AI text.
                Every proposed action links to verifiable video frames and acoustic evidence.
              </p>
            </div>

            {/* Product UI Demonstration Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF9F5] border border-[#DDDCD3] shadow-xs">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left: Interactive Review Event Sample */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#DDDCD3] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#2E4742]">
                        EVENT #03
                      </span>
                      <span className="text-xs text-[#7A857F] font-mono">
                        [ 04:15 – 05:40 ]
                      </span>
                    </div>
                    <Badge variant="ochre" size="sm">
                      Question for Cook
                    </Badge>
                  </div>

                  <h3 className="font-display text-2xl font-bold text-[#202723]">
                    Fold dough into thirds and let rest under warm damp towel
                  </h3>

                  <p className="text-sm text-[#525B56]">
                    Whisper transcribed spoken cue: &ldquo;Don&apos;t rush the rest—let the gluten relax.&rdquo;
                    Gemma vision detected 4 distinct folding gestures at 04:32, 04:48, 05:02, and 05:25.
                  </p>

                  {/* Clarification prompt card */}
                  <div className="p-4 rounded-xl bg-[#F2F2EB] border border-[#DDDCD3] space-y-2 text-xs">
                    <span className="font-mono font-semibold text-[#8C6207] uppercase tracking-wider block">
                      AI Observation Question
                    </span>
                    <p className="text-[#202723] font-medium">
                      &ldquo;The bowl of liquid added at 04:20 looked milky. Was it buttermilk or warm water?&rdquo;
                    </p>
                    <div className="p-2.5 rounded-lg bg-white border border-[#DDDCD3] font-sans text-[#202723] flex items-center justify-between">
                      <span>Family clarification: <strong>Warm whey from yesterday&apos;s ricotta</strong></span>
                      <CheckCircle2 className="w-4 h-4 text-[#2E4742]" />
                    </div>
                  </div>
                </div>

                {/* Right: Architectural Principles */}
                <div className="lg:col-span-5 space-y-4 border-t lg:border-t-0 lg:border-l border-[#DDDCD3] pt-6 lg:pt-0 lg:pl-8">
                  <h4 className="font-display text-lg font-bold text-[#202723]">
                    Our 4 Non-Negotiable Rules
                  </h4>
                  <ul className="space-y-3 text-xs text-[#525B56]">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2E4742] mt-1.5 shrink-0" />
                      <span><strong>No hallucinated dialogue:</strong> When demonstration footage is silent, Whisper logs acoustic silence rather than inventing speech.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2E4742] mt-1.5 shrink-0" />
                      <span><strong>All evidence timestamped:</strong> Every step links directly to start and end seconds in the raw video.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2E4742] mt-1.5 shrink-0" />
                      <span><strong>Human editorial authority:</strong> AI only proposes. Nothing becomes an heirloom recipe until a family member approves it.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2E4742] mt-1.5 shrink-0" />
                      <span><strong>Local privacy first:</strong> Inference runs locally through Faster-Whisper and Gemma 4 via Ollama.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* INTERACTIVE COOK ALONG SECTION — REAL KITCHEN USABILITY                   */}
        {/* ========================================================================= */}
        <section id="cook-along" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-[#DDDCD3] bg-[#FAF9F5]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* Left Column: Cook Along Countertop Photography */}
              <div className="lg:col-span-6">
                <div className="relative rounded-2xl overflow-hidden border border-[#DDDCD3] shadow-[0_4px_20px_rgb(0,0,0,0.04)]">
                  <div className="relative aspect-16/9 w-full">
                    <Image
                      src="/images/cook-along-kitchen.jpg"
                      alt="Modern kitchen counter with iPad displaying cooking step next to garlic and skillet"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                  <div className="p-4 bg-[#F2F2EB] border-t border-[#DDDCD3] flex items-center justify-between text-xs font-mono text-[#525B56]">
                    <span>ACTIVE COOKING EXPERIENCE</span>
                    <span className="text-[#2E4742] font-semibold">Synced Step Video</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Cook Along Feature Highlights */}
              <div className="lg:col-span-6 space-y-6">
                <span className="font-mono text-xs uppercase tracking-widest text-[#2E4742] font-semibold bg-[#E3E9E8] px-3 py-1 rounded-full border border-[#2E4742]/20">
                  Kitchen-Tested Experience
                </span>

                <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-[#202723] tracking-tight leading-[1.05]">
                  Cook it the way they did.
                </h2>

                <p className="text-base sm:text-lg text-[#525B56] leading-relaxed font-sans">
                  The Interactive Cook Along experience is designed for someone actually
                  standing at a kitchen counter with flour on their hands.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  <div className="p-3.5 rounded-xl bg-[#F2F2EB] border border-[#DDDCD3] space-y-1">
                    <Clock className="w-4 h-4 text-[#2E4742]" />
                    <p className="font-display text-sm font-bold text-[#202723]">Contextual Timers</p>
                    <p className="text-xs text-[#525B56]">
                      Numeric minutes auto-extracted from instructions with one-click countdowns.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F2F2EB] border border-[#DDDCD3] space-y-1">
                    <Play className="w-4 h-4 text-[#2E4742]" />
                    <p className="font-display text-sm font-bold text-[#202723]">One-Tap Video Seeking</p>
                    <p className="text-xs text-[#525B56]">
                      Jump the original video directly to the exact demonstration of that step.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F2F2EB] border border-[#DDDCD3] space-y-1">
                    <Utensils className="w-4 h-4 text-[#2E4742]" />
                    <p className="font-display text-sm font-bold text-[#202723]">Mise en Place</p>
                    <p className="text-xs text-[#525B56]">
                      Pre-cooking ingredient checklists saved across devices as you prep.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#F2F2EB] border border-[#DDDCD3] space-y-1">
                    <Flame className="w-4 h-4 text-[#2E4742]" />
                    <p className="font-display text-sm font-bold text-[#202723]">Sensory Cues</p>
                    <p className="text-xs text-[#525B56]">
                      Tactile guidance on sound, aroma, and color rather than strict seconds.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href="/dashboard">
                    <Button variant="primary" size="md" rightIcon={<ArrowUpRight className="w-4 h-4" />}>
                      Try the Cook Along Demo
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CLOSING CALL TO ACTION SECTION — WARM CREAM PAPER COMPOSITION             */}
        {/* ========================================================================= */}
        <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-b border-[#DDDCD3] bg-[#F2F2EB] text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <span className="font-mono text-xs uppercase tracking-widest text-[#2E4742] font-semibold bg-[#E3E9E8] px-3 py-1 rounded-full border border-[#2E4742]/20">
              Start Your Archive
            </span>

            <h2 className="font-display text-5xl sm:text-6xl md:text-7xl font-extrabold text-[#202723] tracking-tight leading-[0.98]">
              Keep the recipe. Keep the memory.
            </h2>

            <p className="text-base sm:text-xl text-[#525B56] leading-relaxed max-w-xl mx-auto font-sans">
              Don&apos;t let another family cooking demonstration get lost on a hard drive.
              Start your private archive today.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto justify-center text-base px-8"
                  rightIcon={<ArrowUpRight className="w-4 h-4" />}
                >
                  Create Free Account
                </Button>
              </Link>
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto justify-center text-base px-8"
                >
                  Explore Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* REFINED EDITORIAL FOOTER                                                  */}
      {/* ========================================================================= */}
      <footer className="bg-[#FAF9F5] border-t border-[#DDDCD3] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-[#525B56]">
          <div className="flex items-center gap-3">
            <span className="font-display text-xl font-bold tracking-tight text-[#202723]">
              SIMMORY
            </span>
            <span className="text-[#DDDCD3]">•</span>
            <span className="font-mono text-[11px]">The way they made it, remembered.</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-medium">
            <Link href="/#how-it-works" className="hover:text-[#2E4742] transition-colors">
              How It Works
            </Link>
            <Link href="/#family-kitchen" className="hover:text-[#2E4742] transition-colors">
              Family Kitchen
            </Link>
            <Link href="/#cook-along" className="hover:text-[#2E4742] transition-colors">
              Cook Along
            </Link>
            <Link href="/login" className="hover:text-[#2E4742] transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-[#2E4742] transition-colors">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
