import React, { Suspense } from "react";
import Link from "next/link";
import {
  PlayCircle,
  Play,
  Flame,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

import { requireUser } from "@/lib/auth/get-user";

async function CookAlongContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser(`/cook/${id}`);

  return (
    <>
      <PageHeader
        eyebrow="Interactive Experience"
        title="Interactive Cook Along"
        description="Cook in your kitchen alongside the original video. Tap any step to jump straight to that moment in the footage, complete with verified visual and sensory cues."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/recipes">
              <Button variant="secondary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Saved Recipes
              </Button>
            </Link>
            <Badge variant="warm" size="md">
              Recipe ID: {id}
            </Badge>
          </div>
        }
      />

      {/* Honest Empty State for Recipe Cook Along */}
      <EmptyState
        icon={<PlayCircle className="w-6 h-6 text-terracotta-500" />}
        badge="Cook Along Preview"
        title={`No verified recipe loaded for "${id}"`}
        description="The Interactive Cook Along player pairs verified recipes with synchronized video playback from Cloudflare R2. Once you preserve and verify a recipe, you will be able to follow each step with one-tap video jumps."
        action={
          <div className="flex items-center gap-3">
            <Link href="/upload">
              <Button variant="primary" size="md">
                Preserve a Recipe First
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary" size="md">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        }
        note="Phase 1: Component architecture and routing. Synchronized video player controls and time-indexed playback will be activated in Phase 2."
      />

      {/* Cook Along Feature Pillars Blueprint */}
      <div className="mt-12 pt-8 border-t border-warm-200/80">
        <div className="max-w-2xl mb-6">
          <h2 className="font-serif text-xl text-warm-900 font-medium">
            Interactive Cook Along Features (Phase 2)
          </h2>
          <p className="text-xs text-warm-500 mt-1">
            How the synchronized cooking experience will work once recipes are saved:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-5 bg-white">
            <div className="w-8 h-8 rounded-lg bg-terracotta-100 text-terracotta-700 flex items-center justify-center mb-3">
              <Play className="w-4 h-4 fill-terracotta-600" />
            </div>
            <h3 className="font-serif text-base text-warm-900 font-medium mb-1">
              One-Tap Video Jumps
            </h3>
            <p className="text-xs text-warm-600 leading-relaxed font-sans">
              Clicking any step automatically seeks the video to the exact start timestamp, so you can re-watch tricky hand movements instantly.
            </p>
          </Card>

          <Card className="p-5 bg-white">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
              <Flame className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-base text-warm-900 font-medium mb-1">
              Sensory Cue Highlights
            </h3>
            <p className="text-xs text-warm-600 leading-relaxed font-sans">
              Identifies key physical transitions—like &ldquo;when the oil rises&rdquo; or &ldquo;when the garlic turns golden blonde&rdquo;—rather than arbitrary timers.
            </p>
          </Card>

          <Card className="p-5 bg-white">
            <div className="w-8 h-8 rounded-lg bg-sage-100 text-sage-800 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-base text-warm-900 font-medium mb-1">
              Confirmed Ingredients
            </h3>
            <p className="text-xs text-warm-600 leading-relaxed font-sans">
              Ingredient quantities verified by the original cook, with annotations for traditional substitutions and regional variations.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}

export default function CookAlongPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingSpinner label="Loading recipe details..." />}>
        <CookAlongContent params={params} />
      </Suspense>
    </DashboardLayout>
  );
}
