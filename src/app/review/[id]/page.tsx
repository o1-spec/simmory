import React, { Suspense } from "react";
import Link from "next/link";
import {
  CheckSquare,
  ShieldCheck,
  Video,
  Flame,
  ArrowLeft,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

import { requireUser } from "@/lib/auth/get-user";

async function ReviewContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser(`/review/${id}`);

  return (
    <>
      <PageHeader
        eyebrow="Human-in-the-Loop Review"
        title="AI Recipe Review Editor"
        description="The editorial space where original cooks and family curators review candidate steps proposed by Faster-Whisper and Gemma 4, confirm sensory cues, and fill in unwritten secrets."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="secondary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Dashboard
              </Button>
            </Link>
            <Badge variant="saffron" size="md">
              Target ID: {id}
            </Badge>
          </div>
        }
      />

      {/* Core Principle Banner */}
      <div className="mb-8 p-5 bg-terracotta-50/90 border border-terracotta-200/80 rounded-2xl flex items-start gap-3.5">
        <ShieldCheck className="w-5 h-5 text-terracotta-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-warm-900">
            Core Simmory Principle: Human Verification is Mandatory
          </h2>
          <p className="text-xs text-warm-700 leading-relaxed font-sans">
            AI is never treated as the authoritative source of family knowledge. Faster-Whisper and Gemma 4 extract candidate actions from footage, but recipes only receive the &ldquo;Verified by Cook&rdquo; seal when a human reviews and confirms the instructions.
          </p>
        </div>
      </div>

      {/* Honest Empty State for Recipe Review */}
      <EmptyState
        icon={<CheckSquare className="w-6 h-6 text-terracotta-500" />}
        badge="Editor Phase 2 Preview"
        title={`No active AI processing job for recipe "${id}"`}
        description="In Phase 2, when you upload a video, BullMQ and the Python AI service will synthesize candidate timestamps and redirect here so the cook can adjust start/end markers, confirm ingredient amounts, and add personal notes."
        action={
          <Link href="/upload">
            <Button variant="primary" size="md">
              Go to Upload Entry Point
            </Button>
          </Link>
        }
        note="The review editor component interfaces will be integrated once the Python AI service and Prisma database models are deployed in subsequent phases."
      />

      {/* Review Editor Blueprint Preview */}
      <div className="mt-12 pt-8 border-t border-warm-200/80">
        <div className="max-w-2xl mb-6">
          <h2 className="font-serif text-xl text-warm-900 font-medium">
            Review Editor Interface Architecture
          </h2>
          <p className="text-xs text-warm-500 mt-1">
            Planned layout for Phase 2 implementation:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-5 bg-white">
            <div className="flex items-center gap-2 text-xs font-semibold text-terracotta-600 uppercase tracking-wider mb-2">
              <Video className="w-4 h-4" />
              <span>Left Column</span>
            </div>
            <h3 className="font-serif text-base text-warm-900 font-medium mb-1">
              Dual-Pane Video Player
            </h3>
            <p className="text-xs text-warm-600 leading-relaxed">
              Synchronized video playback with draggable timestamp markers to fine-tune exact step boundaries.
            </p>
          </Card>

          <Card className="p-5 bg-white">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">
              <Flame className="w-4 h-4" />
              <span>Center Column</span>
            </div>
            <h3 className="font-serif text-base text-warm-900 font-medium mb-1">
              Cue Clarifier
            </h3>
            <p className="text-xs text-warm-600 leading-relaxed">
              Converts vague transcript moments like &ldquo;until it bubbles right&rdquo; into clarified sensory advice.
            </p>
          </Card>

          <Card className="p-5 bg-sage-50/50 border-sage-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-sage-700 uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Right Column</span>
            </div>
            <h3 className="font-serif text-base text-warm-900 font-medium mb-1">
              Cook Verification Seal
            </h3>
            <p className="text-xs text-warm-600 leading-relaxed">
              Attribution signature certifying that the original creator or family steward confirmed the recipe.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}

export default function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingSpinner label="Loading review workspace..." />}>
        <ReviewContent params={params} />
      </Suspense>
    </DashboardLayout>
  );
}
