import React, { Suspense } from "react";
import Link from "next/link";
import {
  Sparkles,
  Play,
  Flame,
  Heart,
  Video,
  CheckCircle2,
  Users,
  Compass,
  ArrowRight,
  BookOpen,
  Eye,
  Volume2,
  ChefHat,
  UtensilsCrossed,
} from "lucide-react";
import { AppHeader } from "@/components/navigation/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-warm-50 flex flex-col text-warm-900 selection:bg-terracotta-100 selection:text-terracotta-800">
      {/* Navigation */}
      <Suspense fallback={<div className="h-16 sm:h-20 border-b border-warm-200/80 bg-warm-50/95" />}>
        <AppHeader />
      </Suspense>

      <main className="flex-1 flex flex-col">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-32 px-4 sm:px-6 lg:px-8 border-b border-warm-200/60 bg-gradient-to-b from-warm-100/50 via-warm-50 to-warm-50">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column: Headlines & Call to Action */}
              <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-terracotta-50 border border-terracotta-200/80 text-terracotta-700 text-xs sm:text-sm font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-terracotta-500 shrink-0" />
                  <span>Preserving family cooking heritage & unwritten wisdom</span>
                </div>

                <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-warm-900 tracking-tight leading-[1.12]">
                  The way they made it,{" "}
                  <span className="italic font-normal text-terracotta-600 block sm:inline">
                    remembered.
                  </span>
                </h1>

                <p className="text-base sm:text-xl text-warm-700 leading-relaxed max-w-2xl font-sans mx-auto lg:mx-0">
                  Many family recipes are never written down. They live in muscle
                  memory, seasoned hands, and instinctual cues like &ldquo;until it smells
                  right.&rdquo; Simmory preserves original cooking videos and turns them
                  into interactive, step-by-step journeys you can recreate forever.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                  <Link href="/dashboard" className="w-full sm:w-auto">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full sm:w-auto justify-center shadow-md hover:shadow-lg transition-shadow"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Enter Family Kitchen
                    </Button>
                  </Link>
                  <Link href="/upload" className="w-full sm:w-auto">
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full sm:w-auto justify-center"
                      leftIcon={<ChefHat className="w-4 h-4 text-terracotta-600" />}
                    >
                      Preserve a Recipe
                    </Button>
                  </Link>
                </div>

                {/* Trust / Emotional anchor pills */}
                <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs text-warm-600 font-medium">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-sage-600" />
                    <span>Always verified by the original cook</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-terracotta-500" />
                    <span>Timestamp-linked video playback</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-amber-700" />
                    <span>Private family archives</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Product Demonstration Card */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  {/* Decorative warm glow backdrop */}
                  <div className="absolute -inset-2 bg-gradient-to-tr from-terracotta-200/30 to-amber-200/30 rounded-3xl blur-xl -z-10" />

                  {/* Recipe Showcase Card */}
                  <div className="bg-white rounded-3xl border border-warm-200/90 shadow-xl overflow-hidden">
                    {/* Video Demonstration Header */}
                    <div className="relative aspect-video bg-warm-900 overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/30" />
                      
                      {/* Video simulated capture frame */}
                      <div className="z-10 text-center px-4">
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center mx-auto mb-2 text-white shadow-lg transition-transform hover:scale-110">
                          <Play className="w-6 h-6 fill-white ml-0.5" />
                        </div>
                        <p className="text-xs text-white/90 font-medium font-sans">
                          Original Cooking Footage
                        </p>
                        <p className="text-[11px] text-white/70">
                          Timestamp 04:18 &bull; &ldquo;When the oil begins to glisten&rdquo;
                        </p>
                      </div>

                      {/* Video Badges */}
                      <div className="absolute top-3 left-3 z-10 flex gap-2">
                        <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Video className="w-3 h-3 text-terracotta-400" /> 18:42
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 z-10">
                        <Badge variant="sage" size="sm" className="bg-sage-600 text-white border-0">
                          Cook Verified
                        </Badge>
                      </div>
                    </div>

                    {/* Card Content & Cooking Cue Demonstration */}
                    <div className="p-6 space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-xs text-warm-500 mb-1">
                          <span>Heirloom Dish</span>
                          <span>The Garcia Kitchen</span>
                        </div>
                        <h2 className="font-serif text-2xl text-warm-900 font-medium">
                          Grandmother Rosa&apos;s Braised Sofrito
                        </h2>
                      </div>

                      {/* Sensory Cue Highlight Box */}
                      <div className="bg-terracotta-50/80 border border-terracotta-200/80 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-terracotta-700">
                            <Flame className="w-3.5 h-3.5 text-terracotta-500" />
                            Sensory Cooking Cue
                          </span>
                          <span className="text-[11px] font-mono text-terracotta-600 bg-white px-2 py-0.5 rounded-md border border-terracotta-200">
                            @ 04:18
                          </span>
                        </div>
                        <p className="font-serif text-sm text-warm-900 italic">
                          &ldquo;Listen for the sizzle to soften. When the oil rises to the top and turns golden, add the crushed garlic.&rdquo;
                        </p>
                        <p className="text-xs text-warm-600 font-sans">
                          &bull; Confirmed quantity: &ldquo;A palm-sized mound, about 4 cloves&rdquo;
                        </p>
                      </div>

                      {/* Step Navigation Pill */}
                      <div className="flex items-center justify-between pt-2 border-t border-warm-100 text-xs">
                        <span className="text-warm-500">Step 3 of 7 in sequence</span>
                        <Link
                          href="/cook/demo"
                          className="text-terracotta-600 hover:text-terracotta-700 font-medium hover:underline flex items-center gap-1"
                        >
                          Try Interactive Cook Along &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: THE PROBLEM WITH UNWRITTEN RECIPES */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-warm-200/70 bg-warm-100/30">
          <div className="max-w-7xl mx-auto">
            <SectionHeading
              align="center"
              eyebrow="The Missing Ingredient"
              title="A pinch of this, a handful of that. Why standard recipe apps fail family cooking."
              description="Traditional cooking wisdom lives in the hands and senses of the person at the stove. When instructions are reduced to rigid bullet points, the soul and accuracy are lost."
            />

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Problem 1 */}
              <Card className="p-7 space-y-4 bg-white">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
                  <Eye className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl text-warm-900 font-medium">
                  Visual Cues Over Timers
                </h3>
                <p className="text-sm text-warm-600 leading-relaxed font-sans">
                  Grandparents rarely cook with a timer. They look for the exact shade of golden amber, the way the bubbles cluster, or the ring of fat around the pan.
                </p>
                <div className="p-3 bg-warm-50 rounded-xl text-xs text-warm-700 font-serif italic border border-warm-200/50">
                  &ldquo;Cook it until it looks like a sunrise.&rdquo;
                </div>
              </Card>

              {/* Problem 2 */}
              <Card className="p-7 space-y-4 bg-white">
                <div className="w-12 h-12 rounded-2xl bg-terracotta-50 text-terracotta-700 flex items-center justify-center border border-terracotta-200/60">
                  <Volume2 className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl text-warm-900 font-medium">
                  Sensory Knowledge & Touch
                </h3>
                <p className="text-sm text-warm-600 leading-relaxed font-sans">
                  The weight in the spoon, the resistance of the dough, the gentle hiss that signals the oil is ready—conventional recipe cards cannot capture tactile memory.
                </p>
                <div className="p-3 bg-warm-50 rounded-xl text-xs text-warm-700 font-serif italic border border-warm-200/50">
                  &ldquo;Stir until your wrist feels the drag.&rdquo;
                </div>
              </Card>

              {/* Problem 3 */}
              <Card className="p-7 space-y-4 bg-white">
                <div className="w-12 h-12 rounded-2xl bg-sage-50 text-sage-700 flex items-center justify-center border border-sage-200/60">
                  <Heart className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl text-warm-900 font-medium">
                  Voice & Storytelling
                </h3>
                <p className="text-sm text-warm-600 leading-relaxed font-sans">
                  Recipes carry family folklore, jokes made between stirs, and cultural roots from generations past. Simmory preserves the actual footage and authentic voices.
                </p>
                <div className="p-3 bg-warm-50 rounded-xl text-xs text-warm-700 font-serif italic border border-warm-200/50">
                  &ldquo;My mother learned this during harvest season in 1962.&rdquo;
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* SECTION 3: HOW SIMMORY WORKS */}
        <section id="how-it-works" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-warm-200/70 bg-warm-50">
          <div className="max-w-7xl mx-auto">
            <SectionHeading
              align="center"
              eyebrow="The Workflow"
              title="How Simmory preserves unwritten family recipes"
              description="A thoughtful, human-first system that uses modern AI as an attentive assistant—never replacing the cook's confirmation."
            />

            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Step 1 */}
              <div className="p-6 rounded-2xl bg-white border border-warm-200/80 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="w-8 h-8 rounded-full bg-warm-100 text-warm-800 text-xs font-serif font-bold flex items-center justify-center border border-warm-200">
                    1
                  </span>
                  <h3 className="font-serif text-lg text-warm-900 font-medium">
                    Upload Cooking Video
                  </h3>
                  <p className="text-xs sm:text-sm text-warm-600 leading-relaxed font-sans">
                    Record your elder or loved one cooking their signature meal. Even unedited, handheld phone videos work perfectly.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-warm-100 text-[11px] text-warm-500 font-medium">
                  Raw video preserved in private cloud storage
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-6 rounded-2xl bg-white border border-warm-200/80 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="w-8 h-8 rounded-full bg-terracotta-100 text-terracotta-700 text-xs font-serif font-bold flex items-center justify-center border border-terracotta-200">
                    2
                  </span>
                  <h3 className="font-serif text-lg text-warm-900 font-medium">
                    AI Proposes Timeline
                  </h3>
                  <p className="text-xs sm:text-sm text-warm-600 leading-relaxed font-sans">
                    Faster-Whisper transcribes spoken instructions while Gemma 4 inspects video frames to detect candidate cooking actions and sensory cues.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-warm-100 text-[11px] text-terracotta-600 font-medium">
                  Generates an evidence-backed candidate draft
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-6 rounded-2xl bg-white border border-warm-200/80 shadow-xs flex flex-col justify-between ring-2 ring-sage-500/20">
                <div className="space-y-3">
                  <span className="w-8 h-8 rounded-full bg-sage-100 text-sage-800 text-xs font-serif font-bold flex items-center justify-center border border-sage-200">
                    3
                  </span>
                  <h3 className="font-serif text-lg text-warm-900 font-medium">
                    Cook Reviews & Clarifies
                  </h3>
                  <p className="text-xs sm:text-sm text-warm-600 leading-relaxed font-sans">
                    Crucial human step: the cook or family reviews the candidate draft, fills in missing measurements, and confirms the real secrets.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-warm-100 text-[11px] text-sage-700 font-medium">
                  Verified by Cook verification seal
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-6 rounded-2xl bg-white border border-warm-200/80 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="w-8 h-8 rounded-full bg-warm-100 text-warm-800 text-xs font-serif font-bold flex items-center justify-center border border-warm-200">
                    4
                  </span>
                  <h3 className="font-serif text-lg text-warm-900 font-medium">
                    Interactive Cook Along
                  </h3>
                  <p className="text-xs sm:text-sm text-warm-600 leading-relaxed font-sans">
                    Anyone in the family can recreate the dish with step-by-step guidance that jumps directly to the exact moment in the video.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-warm-100 text-[11px] text-warm-500 font-medium">
                  Synchronized visual guidance at every step
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: THE FAMILY KITCHEN */}
        <section id="family-kitchen" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-warm-200/70 bg-warm-100/40">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <SectionHeading
                  eyebrow="The Family Kitchen"
                  title="A private sanctuary for your family's culinary memories"
                  description="Keep recipes organized by family branches, celebrate the individuals who created them, and ensure your ancestral flavors are never lost to time."
                />

                <div className="space-y-4 pt-2">
                  <div className="flex gap-4 items-start">
                    <div className="w-9 h-9 rounded-xl bg-terracotta-100 text-terracotta-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-serif text-base text-warm-900 font-medium">
                        Personal Cook Attribution
                      </h4>
                      <p className="text-sm text-warm-600 font-sans mt-0.5">
                        Attribute every dish to its true author—&ldquo;Aunt Teresa&apos;s Tamales&rdquo; or &ldquo;Nonno&apos;s Sunday Ragu&rdquo;—preserving their portrait and legacy.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-serif text-base text-warm-900 font-medium">
                        Stories & Cultural Heritage
                      </h4>
                      <p className="text-sm text-warm-600 font-sans mt-0.5">
                        Capture the origins, festival traditions, handwritten notes, and background memories that make each dish meaningful.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-9 h-9 rounded-xl bg-sage-100 text-sage-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-serif text-base text-warm-900 font-medium">
                        Private by Default
                      </h4>
                      <p className="text-sm text-warm-600 font-sans mt-0.5">
                        Your family recipes belong to your family. Controlled access keeps personal footage and secret ingredients completely private.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href="/kitchens">
                    <Button variant="secondary" size="md">
                      Explore Family Kitchens &rarr;
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Family Kitchen Visual Mock */}
              <div className="lg:col-span-6">
                <Card className="p-6 sm:p-8 bg-white border border-warm-200/90 shadow-md space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-warm-100">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-warm-500 font-medium">
                        Collection Preview
                      </span>
                      <h3 className="font-serif text-xl text-warm-900 font-medium mt-0.5">
                        The Morales Family Kitchen
                      </h3>
                    </div>
                    <Badge variant="terracotta">14 Preserved Dishes</Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-warm-50 border border-warm-200/60 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-terracotta-100 text-terracotta-700 flex items-center justify-center font-serif font-bold text-sm">
                          M
                        </div>
                        <div>
                          <p className="font-medium text-sm text-warm-900">
                            Mole Poblano de la Abuela
                          </p>
                          <p className="text-xs text-warm-500">
                            Cooked by Abuela Maria &bull; 9 video cues
                          </p>
                        </div>
                      </div>
                      <Badge variant="sage" size="sm">
                        Verified
                      </Badge>
                    </div>

                    <div className="p-3.5 rounded-xl bg-warm-50 border border-warm-200/60 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-serif font-bold text-sm">
                          P
                        </div>
                        <div>
                          <p className="font-medium text-sm text-warm-900">
                            Pastel de Tres Leches Tradicional
                          </p>
                          <p className="text-xs text-warm-500">
                            Cooked by Tía Carmen &bull; 5 video cues
                          </p>
                        </div>
                      </div>
                      <Badge variant="sage" size="sm">
                        Verified
                      </Badge>
                    </div>

                    <div className="p-3.5 rounded-xl bg-warm-50 border border-warm-200/60 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-warm-200 text-warm-800 flex items-center justify-center font-serif font-bold text-sm">
                          C
                        </div>
                        <div>
                          <p className="font-medium text-sm text-warm-900">
                            Caldo de Pollo Curativo
                          </p>
                          <p className="text-xs text-warm-500">
                            Recorded Dec 2025 &bull; Awaiting cook review
                          </p>
                        </div>
                      </div>
                      <Badge variant="saffron" size="sm">
                        In Review
                      </Badge>
                    </div>
                  </div>

                  <p className="text-xs text-warm-500 italic text-center font-serif pt-1">
                    &ldquo;Food is our family&apos;s oldest language.&rdquo;
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: INTERACTIVE COOK ALONG */}
        <section id="cook-along" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-warm-200/70 bg-warm-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <span className="text-xs font-semibold uppercase tracking-widest text-terracotta-600 bg-terracotta-50 px-3 py-1 rounded-full border border-terracotta-200/60">
                The Re-creation Experience
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-warm-900 font-medium">
                Cook right beside the original demonstration
              </h2>
              <p className="text-base sm:text-lg text-warm-600 font-sans leading-relaxed">
                Step-by-step guidance that feels like standing in the kitchen beside them. Tap any instruction to jump directly to the exact moment in the video.
              </p>
            </div>

            {/* Cook along interactive feature pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-white border border-warm-200/80 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-terracotta-100 text-terracotta-700 flex items-center justify-center">
                  <Play className="w-5 h-5 fill-terracotta-600" />
                </div>
                <h3 className="font-serif text-lg text-warm-900 font-medium">
                  Synchronized Video Jumps
                </h3>
                <p className="text-xs sm:text-sm text-warm-600 leading-relaxed font-sans">
                  No more scrubbing through a 30-minute video with messy hands. Each step has an instant jump button that plays the specific technique.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-warm-200/80 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-sage-100 text-sage-800 flex items-center justify-center">
                  <Flame className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-lg text-warm-900 font-medium">
                  Sensory Cue Detection
                </h3>
                <p className="text-xs sm:text-sm text-warm-600 leading-relaxed font-sans">
                  Learn to identify sensory milestones: &ldquo;when the bubbles become lazy,&rdquo; &ldquo;when the aroma fills the hallway,&rdquo; or &ldquo;when the sauce coats the back of a spoon.&rdquo;
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-warm-200/80 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-lg text-warm-900 font-medium">
                  Confirmed Measurements
                </h3>
                <p className="text-xs sm:text-sm text-warm-600 leading-relaxed font-sans">
                  The cook translates their intuitive gestures (&ldquo;a glass of milk,&rdquo; &ldquo;a pinch&rdquo;) into reliable guidance confirmed during review.
                </p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link href="/cook/demo">
                <Button variant="outline" size="lg">
                  Preview Interactive Cook Along View &rarr;
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* SECTION 6: FINAL CALL TO ACTION */}
        <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-warm-900 text-warm-50 relative overflow-hidden">
          {/* Subtle textured glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-terracotta-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
            <h2 className="font-serif text-3xl sm:text-5xl text-cream-50 font-normal tracking-tight leading-tight">
              Don&apos;t let the secret ingredient be forgotten.
            </h2>
            <p className="text-base sm:text-xl text-warm-300 max-w-2xl mx-auto font-sans leading-relaxed">
              Start preserving the unwritten dishes, distinctive techniques, and cherished voices of the people who cook with love for your family.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto bg-terracotta-500 hover:bg-terracotta-600 text-white px-8"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Get Started With Simmory
                </Button>
              </Link>
              <Link href="/upload" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-warm-200 border-warm-700 hover:border-warm-500 hover:text-white hover:bg-warm-800"
                >
                  Preserve a Cooking Video
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-warm-200/80 bg-warm-100/50 py-12 px-4 sm:px-6 lg:px-8 text-warm-600 font-sans">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-terracotta-500 text-white flex items-center justify-center">
                <UtensilsCrossed className="w-3.5 h-3.5" />
              </div>
              <span className="font-serif text-xl text-warm-900 font-medium">
                Simmory
              </span>
            </div>
            <p className="text-xs text-warm-600 leading-relaxed">
              The way they made it, remembered. Preserving culinary heritage through video and human confirmation.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-warm-800 mb-3">
              Experience
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/#how-it-works" className="hover:text-terracotta-600 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/#family-kitchen" className="hover:text-terracotta-600 transition-colors">
                  Family Kitchen
                </Link>
              </li>
              <li>
                <Link href="/#cook-along" className="hover:text-terracotta-600 transition-colors">
                  Interactive Cook Along
                </Link>
              </li>
              <li>
                <Link href="/cook/demo" className="hover:text-terracotta-600 transition-colors">
                  Step Sync Player Demo
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-warm-800 mb-3">
              Application
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/dashboard" className="hover:text-terracotta-600 transition-colors">
                  Kitchen Overview
                </Link>
              </li>
              <li>
                <Link href="/kitchens" className="hover:text-terracotta-600 transition-colors">
                  Collections
                </Link>
              </li>
              <li>
                <Link href="/recipes" className="hover:text-terracotta-600 transition-colors">
                  Saved Recipes
                </Link>
              </li>
              <li>
                <Link href="/upload" className="hover:text-terracotta-600 transition-colors">
                  Preserve Recipe (Upload)
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-warm-800 mb-3">
              Architecture & Trust
            </h4>
            <p className="text-xs text-warm-500 leading-relaxed mb-2">
              Phase 1 Application Foundation. AI models (Faster-Whisper & Gemma 4) assist transcription and cue proposals without replacing human review.
            </p>
            <span className="inline-block text-[11px] text-warm-600 bg-warm-200/60 px-2 py-0.5 rounded-md">
              v0.1.0 &bull; App Router &bull; React 19
            </span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-warm-200/60 flex flex-col sm:flex-row items-center justify-between text-xs text-warm-500 gap-4">
          <p>&copy; 2026 Simmory. All rights reserved.</p>
          <p className="italic font-serif text-warm-600">
            Dedicated to the cooks in every family whose hands taught ours.
          </p>
        </div>
      </footer>
    </div>
  );
}
